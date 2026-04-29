/**
 * EduSchedule AI — Assignment-driven timetable generator
 *
 * Sources of work:
 *  1. `assignments`     → core VI-X periods (teacher ↔ subject ↔ class)
 *  2. `sectionConfigs`  → XI-XII section configs with:
 *       • coreSubjects      → placed as normal periods (all students)
 *       • fifthSubjectGroup → concurrent split periods (all options same slot)
 *       • sixthSubjectGroup → concurrent split periods (different slot)
 */
export async function generateFromAssignments(
  assignments,
  classes,
  subjects,
  teachers,
  rooms,
  periodsPerDay,
  workingDays,
  onProgress,
  sectionConfigs = []   // array of { classId, coreSubjects, fifthSubjectGroup, sixthSubjectGroup }
) {
  const activeDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    .map((d, i) => ({ name: d, idx: i }))
    .filter(d => workingDays?.[d.name] !== false);

  const periods = [];
  const usedTeacherSlots = new Set(); // `t:{teacherId}-{dayIdx}-{period}`
  const usedClassSlots = new Set();   // `c:{classId}-{dayIdx}-{period}`

  const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));

  // IDs of subjects handled via section config's fifthSubjectGroup or sixthSubjectGroup
  const splitHandledKeys = new Set(); // `{classId}:{subjectId}`
  sectionConfigs.forEach(cfg => {
    [...(cfg.fifthSubjectGroup || []), ...(cfg.sixthSubjectGroup || [])].forEach(g => {
      if (g.subjectId) splitHandledKeys.add(`${cfg.classId}:${g.subjectId}`);
    });
  });

  const totalWork =
    assignments.length +
    sectionConfigs.reduce((s, c) =>
      s + (c.coreSubjects?.length || 0) + (c.fifthSubjectGroup?.length ? 1 : 0) + (c.sixthSubjectGroup?.length ? 1 : 0), 0);

  let done = 0;
  const tick = () => { done++; onProgress && onProgress(Math.min(95, Math.round((done / totalWork) * 90))); };

  // ── 1. Regular assignments (VI-X core) ───────────────────────────
  const sorted = [...assignments].sort((a, b) =>
    (subjectMap[b.subjectId]?.isDifficult ? 1 : 0) - (subjectMap[a.subjectId]?.isDifficult ? 1 : 0)
  );

  for (const asgn of sorted) {
    const { classId, subjectId, teacherId, periodsPerWeek } = asgn;
    if (!classId || !subjectId || !teacherId) { tick(); await sleep(2); continue; }

    // Skip if this subject is handled as a split group for this class
    if (splitHandledKeys.has(`${classId}:${subjectId}`)) { tick(); continue; }

    const subject = subjectMap[subjectId];
    const cls = classes.find(c => c.id === classId);
    const room = pickRoom(rooms, cls?.roomId, subject?.type);

    const need = Math.min(periodsPerWeek, activeDays.length * periodsPerDay);
    const slotOrder = buildSlotOrder(activeDays, periodsPerDay, !!subject?.isDifficult);
    let placed = 0;

    for (const { dayIdx, period } of slotOrder) {
      if (placed >= need) break;
      if (!isSlotFree(usedTeacherSlots, usedClassSlots, teacherId, classId, dayIdx, period)) continue;
      markSlot(usedTeacherSlots, usedClassSlots, teacherId, classId, dayIdx, period);
      periods.push(makePeriod({ day: dayIdx, period, classId, subjectId, teacherId, roomId: room?.id }));
      placed++;
    }

    tick(); await sleep(2);
  }

  // ── 2. Section config — core subjects (XI-XII all-class periods) ──
  for (const cfg of sectionConfigs) {
    for (const entry of (cfg.coreSubjects || [])) {
      const { subjectId, teacherId, periodsPerWeek } = entry;
      if (!subjectId || !teacherId) { tick(); continue; }

      const subject = subjectMap[subjectId];
      const cls = classes.find(c => c.id === cfg.classId);
      const room = pickRoom(rooms, cls?.roomId, subject?.type);
      const need = Math.min(periodsPerWeek, activeDays.length * periodsPerDay);
      const slotOrder = buildSlotOrder(activeDays, periodsPerDay, !!subject?.isDifficult);
      let placed = 0;

      for (const { dayIdx, period } of slotOrder) {
        if (placed >= need) break;
        if (!isSlotFree(usedTeacherSlots, usedClassSlots, teacherId, cfg.classId, dayIdx, period)) continue;
        markSlot(usedTeacherSlots, usedClassSlots, teacherId, cfg.classId, dayIdx, period);
        periods.push(makePeriod({ day: dayIdx, period, classId: cfg.classId, subjectId, teacherId, roomId: room?.id, isOptional: false }));
        placed++;
      }

      tick(); await sleep(2);
    }
  }

  // ── 3. Section config — split groups (5th and 6th subject pools) ──
  for (const cfg of sectionConfigs) {
    for (const [groupKey, groupLabel, isAdditional] of [
      ['fifthSubjectGroup', '5th Subject', false],
      ['sixthSubjectGroup', '6th Subject', true],
    ]) {
      const group = cfg[groupKey] || [];
      if (!group.length) { tick(); continue; }

      const filledOptions = group.filter(g => g.subjectId && g.teacherId);
      if (!filledOptions.length) { tick(); continue; }

      const maxPeriods = Math.max(...filledOptions.map(g => g.periodsPerWeek || 4));
      const slotOrder = buildSlotOrder(activeDays, periodsPerDay, false);
      let placed = 0;

      for (const { dayIdx, period } of slotOrder) {
        if (placed >= maxPeriods) break;

        // All teachers in this group must be free, and the class must be free
        const allFree =
          filledOptions.every(g => !usedTeacherSlots.has(`t:${g.teacherId}-${dayIdx}-${period}`)) &&
          !usedClassSlots.has(`c:${cfg.classId}-${dayIdx}-${period}`);

        if (!allFree) continue;

        // Mark class slot once (represents the period block)
        usedClassSlots.add(`c:${cfg.classId}-${dayIdx}-${period}`);

        // Place one period per option
        for (const opt of filledOptions) {
          if (placed >= (opt.periodsPerWeek || 4)) continue;
          const room = rooms.find(r => r.id === opt.roomId)
            || pickRoom(rooms, null, subjectMap[opt.subjectId]?.type);
          usedTeacherSlots.add(`t:${opt.teacherId}-${dayIdx}-${period}`);
          periods.push(makePeriod({
            day: dayIdx, period,
            classId: cfg.classId,
            subjectId: opt.subjectId,
            teacherId: opt.teacherId,
            roomId: room?.id || null,
            isOptional: true,
            groupLabel,
            isAdditional,
            splitGroupId: opt.id,
          }));
        }
        placed++;
      }

      tick(); await sleep(2);
    }
  }

  onProgress && onProgress(100);
  return periods;
}

// ─── Helpers ──────────────────────────────────────────────────────
function isSlotFree(usedTeacher, usedClass, teacherId, classId, day, period) {
  return !usedTeacher.has(`t:${teacherId}-${day}-${period}`) &&
    !usedClass.has(`c:${classId}-${day}-${period}`);
}

function markSlot(usedTeacher, usedClass, teacherId, classId, day, period) {
  usedTeacher.add(`t:${teacherId}-${day}-${period}`);
  usedClass.add(`c:${classId}-${day}-${period}`);
}

function pickRoom(rooms, preferredRoomId, subjectType) {
  return rooms.find(r => r.id === preferredRoomId && r.isAvailable)
    || (subjectType === 'practical' ? rooms.find(r => r.type === 'lab' && r.isAvailable) : null)
    || rooms.find(r => r.type === 'classroom' && r.isAvailable)
    || rooms[0];
}

function buildSlotOrder(activeDays, periodsPerDay, morningFirst) {
  const slots = [];
  if (morningFirst) {
    for (let p = 1; p <= periodsPerDay; p++)
      for (const d of activeDays)
        slots.push({ dayIdx: d.idx, period: p });
  } else {
    for (let p = 1; p <= periodsPerDay; p++)
      for (const d of [...activeDays].sort(() => Math.random() - 0.5))
        slots.push({ dayIdx: d.idx, period: p });
  }
  return slots;
}

function makePeriod(data) {
  return {
    id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    isLocked: false,
    weekType: 'A',
    ...data,
  };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
