// Conflict detection service
export function detectConflicts(periods, teachers, classes, subjects, rooms) {
  const conflicts = [];

  // Group periods by (day, period)
  const bySlot = {};
  periods.forEach(p => {
    const key = `${p.day}-${p.period}`;
    if (!bySlot[key]) bySlot[key] = [];
    bySlot[key].push(p);
  });

  Object.entries(bySlot).forEach(([key, slotPeriods]) => {
    const [day, period] = key.split('-').map(Number);

    // Teacher double-booking
    const byTeacher = {};
    slotPeriods.forEach(p => {
      if (!byTeacher[p.teacherId]) byTeacher[p.teacherId] = [];
      byTeacher[p.teacherId].push(p);
    });
    Object.entries(byTeacher).forEach(([tid, ps]) => {
      if (ps.length > 1) {
        const teacher = teachers.find(t => t.id === tid);
        const classNames = ps.map(p => { const c = classes.find(x => x.id === p.classId); return c ? `${c.grade}${c.section}` : '?'; });
        conflicts.push({
          id: `cf-t-${tid}-${key}`,
          type: 'teacher_double_booking',
          severity: 'critical',
          description: `${teacher?.name || 'Teacher'} is double-booked in ${classNames.join(' & ')} on Day ${day+1}, Period ${period}`,
          affectedPeriods: ps.map(p => p.id),
          day, period, teacherId: tid,
          suggestions: generateTeacherConflictSuggestions(ps, periods, teachers, classes),
        });
      }
    });

    // Room conflict
    const byRoom = {};
    slotPeriods.forEach(p => {
      if (!byRoom[p.roomId]) byRoom[p.roomId] = [];
      byRoom[p.roomId].push(p);
    });
    Object.entries(byRoom).forEach(([rid, ps]) => {
      if (ps.length > 1) {
        const room = rooms.find(r => r.id === rid);
        conflicts.push({
          id: `cf-r-${rid}-${key}`,
          type: 'room_conflict',
          severity: 'critical',
          description: `${room?.name || 'Room'} has double booking on Day ${day+1}, Period ${period}`,
          affectedPeriods: ps.map(p => p.id),
          day, period, roomId: rid,
          suggestions: [{ text: 'Assign a different room to one of the classes', action: 'reassign_room' }],
        });
      }
    });
  });

  // Check consecutive periods per teacher (max 3)
  teachers.forEach(teacher => {
    const teacherPeriods = periods.filter(p => p.teacherId === teacher.id);
    for (let day = 0; day < 6; day++) {
      const dayPeriods = teacherPeriods.filter(p => p.day === day).map(p => p.period).sort((a,b)=>a-b);
      let consecutive = 1;
      for (let i = 1; i < dayPeriods.length; i++) {
        if (dayPeriods[i] === dayPeriods[i-1] + 1) {
          consecutive++;
          if (consecutive > (teacher.maxConsecutive || 3)) {
            conflicts.push({
              id: `cf-cons-${teacher.id}-${day}`,
              type: 'consecutive_overload',
              severity: 'warning',
              description: `${teacher.name} has ${consecutive} consecutive periods on Day ${day+1} (max: ${teacher.maxConsecutive || 3})`,
              affectedPeriods: [],
              day, teacherId: teacher.id,
              suggestions: [{ text: 'Move one period to a non-consecutive slot', action: 'move_period' }],
            });
          }
        } else {
          consecutive = 1;
        }
      }
    }
  });

  // Workload warnings
  teachers.forEach(teacher => {
    const count = periods.filter(p => p.teacherId === teacher.id).length;
    if (count > teacher.maxPeriodsPerWeek) {
      conflicts.push({
        id: `cf-load-${teacher.id}`,
        type: 'workload_exceeded',
        severity: 'warning',
        description: `${teacher.name} has ${count} periods (max: ${teacher.maxPeriodsPerWeek})`,
        affectedPeriods: [],
        teacherId: teacher.id,
        suggestions: [{ text: 'Redistribute some periods to other teachers', action: 'rebalance' }],
      });
    }
  });

  return conflicts;
}

function generateTeacherConflictSuggestions(conflictPeriods, allPeriods, teachers, classes) {
  return [
    { text: `Move one class to an available slot`, action: 'move_period', periodId: conflictPeriods[1]?.id },
    { text: `Find an alternative teacher for one class`, action: 'reassign_teacher', periodId: conflictPeriods[1]?.id },
  ];
}

export function getWorkloadStats(teacherId, periods) {
  const tp = periods.filter(p => p.teacherId === teacherId);
  const dailyCounts = [0,1,2,3,4,5].map(d => ({ day: d, count: tp.filter(p => p.day === d).length }));
  const total = tp.length;
  const gapPeriods = calculateGaps(tp);
  const maxConsec = calculateMaxConsecutive(tp);
  const avg = total / 6;
  const variance = dailyCounts.reduce((acc, d) => acc + Math.pow(d.count - avg, 2), 0) / 6;
  const balanceScore = Math.max(0, 10 - variance).toFixed(1);
  return { total, dailyCounts, gapPeriods, maxConsec, balanceScore };
}

function calculateGaps(periods) {
  let gaps = 0;
  for (let day = 0; day < 6; day++) {
    const dayP = periods.filter(p => p.day === day).map(p => p.period).sort((a,b)=>a-b);
    if (dayP.length < 2) continue;
    for (let i = 1; i < dayP.length; i++) {
      gaps += dayP[i] - dayP[i-1] - 1;
    }
  }
  return gaps;
}

function calculateMaxConsecutive(periods) {
  let max = 0;
  for (let day = 0; day < 6; day++) {
    const dayP = periods.filter(p => p.day === day).map(p => p.period).sort((a,b)=>a-b);
    let curr = 1;
    for (let i = 1; i < dayP.length; i++) {
      curr = dayP[i] === dayP[i-1]+1 ? curr+1 : 1;
      max = Math.max(max, curr);
    }
  }
  return max;
}
