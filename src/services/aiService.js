// AI Service — Smart mock NLI engine (no API key required)
import { DAYS } from '../data/demoData';

const DAY_MAP = { monday:0,tuesday:1,wednesday:2,thursday:3,friday:4,saturday:5,mon:0,tue:1,wed:2,thu:3,fri:4,sat:5 };
const PERIOD_MAP = { first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8 };

function normalise(text) { return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' '); }

function extractNumber(text) {
  const m = text.match(/(\d+)/); return m ? parseInt(m[1]) : null;
}

function matchTeacher(text, teachers) {
  const t = normalise(text);
  return teachers.find(teacher =>
    t.includes(normalise(teacher.name)) ||
    teacher.name.split(' ').some(part => t.includes(normalise(part)) && part.length > 3)
  );
}

function matchClass(text, classes) {
  const t = normalise(text);
  const numMatch = t.match(/class\s*(\d{1,2})\s*([a-z])?/i) || t.match(/(\d{1,2})\s*([a-z])/i);
  if (numMatch) {
    const grade = parseInt(numMatch[1]);
    const section = numMatch[2]?.toUpperCase();
    return classes.find(c => c.grade === grade && (!section || c.section === section)) || classes.find(c => c.grade === grade);
  }
  return null;
}

function matchSubject(text, subjects) {
  const t = normalise(text);
  return subjects.find(s =>
    t.includes(normalise(s.name)) || t.includes(normalise(s.code))
  );
}

function matchDay(text) {
  const t = normalise(text);
  for (const [key, val] of Object.entries(DAY_MAP)) {
    if (t.includes(key)) return val;
  }
  return null;
}

// ─── Intent Classifiers ──────────────────────────────────────────
const intents = [
  { name: 'schedule', patterns: ['schedule','add','create','allocate','assign','book','set up'], weight: 10 },
  { name: 'move',     patterns: ['move','shift','reschedule','transfer','change','relocate'], weight: 10 },
  { name: 'swap',     patterns: ['swap','exchange','switch','trade','interchange'], weight: 10 },
  { name: 'delete',   patterns: ['delete','remove','cancel','clear','drop'], weight: 10 },
  { name: 'substitute', patterns: ['substitute','absent','leave','cover','replacement','sub','missing'], weight: 10 },
  { name: 'conflict', patterns: ['conflict','clash','problem','issue','error','double','overlap'], weight: 10 },
  { name: 'optimize', patterns: ['optimiz','balance','improve','fix','rebalance','distribute','spread'], weight: 10 },
  { name: 'show',     patterns: ['show','display','list','view','get','find','check','tell me','what is','who','which','busiest','gaps'], weight: 8 },
  { name: 'generate', patterns: ['generate','auto','create timetable','make timetable','build'], weight: 10 },
  { name: 'undo',     patterns: ['undo','revert','reverse','go back'], weight: 10 },
];

function classifyIntent(text) {
  const t = normalise(text);
  let best = { name: 'show', score: 0 };
  intents.forEach(intent => {
    const score = intent.patterns.reduce((acc, p) => acc + (t.includes(p) ? intent.weight : 0), 0);
    if (score > best.score) best = { name: intent.name, score };
  });
  return best.name;
}

// ─── Response Generators ─────────────────────────────────────────
function thinkingDelay() {
  return new Promise(r => setTimeout(r, 800 + Math.random() * 600));
}

export async function processAICommand(message, { teachers, subjects, classes, rooms, periods }) {
  await thinkingDelay();
  const intent = classifyIntent(message);
  const teacher = matchTeacher(message, teachers);
  const cls = matchClass(message, classes);
  const subject = matchSubject(message, subjects);
  const day = matchDay(message);
  const count = extractNumber(message);

  switch (intent) {
    case 'schedule':
      return handleSchedule({ teacher, cls, subject, count, message, teachers, periods });
    case 'move':
      return handleMove({ teacher, cls, subject, day, message, periods, classes });
    case 'swap':
      return handleSwap({ cls, subject, day, message, periods, subjects, classes });
    case 'substitute':
      return handleSubstitute({ teacher, day, message, teachers, periods, classes, subjects });
    case 'conflict':
      return handleConflicts({ periods, teachers, classes });
    case 'optimize':
      return handleOptimize({ teacher, message, teachers, periods });
    case 'generate':
      return handleGenerate({ classes, subjects, teachers });
    case 'show':
      return handleShow({ teacher, cls, subject, day, message, teachers, periods, classes, subjects });
    case 'undo':
      return { text: '↩️ Undoing the last action...', action: { type: 'undo' }, requiresConfirmation: false };
    default:
      return handleFallback(message, { teachers, subjects, classes });
  }
}

function handleSchedule({ teacher, cls, subject, count, message, teachers, periods }) {
  if (!cls && !subject) {
    return { text: `I'd be happy to help schedule periods! Could you specify:\n- **Which class?** (e.g., "Class 10A")\n- **Which subject?** (e.g., "Mathematics")\n- **How many periods?** (e.g., "6 periods")`, requiresConfirmation: false };
  }

  const assignedTeacher = teacher || (subject ? teachers.find(t => t.subjects.includes(subject.name)) : null);
  const n = count || subject?.periodsPerWeek || 5;
  const className = cls ? `${cls.grade}${cls.section}` : 'the class';

  const slots = generateOptimalSlots(cls, subject, assignedTeacher, n, periods);
  const slotList = slots.map(s => `• **${DAYS[s.day]}**, Period ${s.period} (${getTime(s.period)})`).join('\n');

  return {
    text: `✅ I've scheduled **${n} ${subject?.name || 'periods'}** for **Class ${className}** with **${assignedTeacher?.name || 'an available teacher'}**:\n\n${slotList}\n\n_All slots are conflict-free and optimized for morning learning._`,
    action: { type: 'bulk_add_periods', periods: slots.map(s => ({ day: s.day, period: s.period, classId: cls?.id, subjectId: subject?.id, teacherId: assignedTeacher?.id, roomId: cls?.roomId })) },
    requiresConfirmation: true,
    confirmText: `Apply ${n} new periods to timetable?`,
  };
}

function handleMove({ teacher, cls, subject, day, message, periods, classes }) {
  const targetDay = day !== null ? day : null;
  const className = cls ? `${cls.grade}${cls.section}` : null;
  const dayName = targetDay !== null ? DAYS[targetDay] : 'morning slots';

  if (!cls) {
    return { text: `Which class would you like to move periods for? For example: _"Move Class 10A Friday lectures to morning"_`, requiresConfirmation: false };
  }

  return {
    text: `🔄 Analyzing ${className}'s schedule...\n\nI can move ${subject ? subject.name : ''} periods to ${dayName}. This will affect **${Math.floor(Math.random()*3)+2} periods**.\n\n⚠️ Note: Lab periods require consecutive slots — I'll keep those fixed and move the rest.`,
    action: { type: 'move_periods', classId: cls?.id, targetDay, subjectId: subject?.id },
    requiresConfirmation: true,
    confirmText: `Move periods for Class ${className} to ${dayName}?`,
  };
}

function handleSwap({ cls, subject, day, message, periods, subjects, classes }) {
  const dayName = day !== null ? DAYS[day] : 'Tuesday';
  const sub2 = subjects.find(s => s.id !== subject?.id && message.toLowerCase().includes(s.name.toLowerCase().slice(0,4)));
  const className = cls ? `${cls.grade}${cls.section}` : '10A';

  return {
    text: `🔃 **Swap completed successfully!**\n\n- **${subject?.name || 'Subject 1'}**: Period 3 → Period 5\n- **${sub2?.name || 'Subject 2'}**: Period 5 → Period 3\n\n✅ No conflicts detected after swap.`,
    action: { type: 'swap_periods', classId: cls?.id, day, subjectId1: subject?.id, subjectId2: sub2?.id },
    requiresConfirmation: false,
  };
}

function handleSubstitute({ teacher, day, message, teachers, periods, classes, subjects }) {
  if (!teacher) {
    return { text: `Which teacher is absent? For example: _"Mr. Kumar is absent tomorrow"_`, requiresConfirmation: false };
  }

  const teacherPeriods = periods.filter(p => p.teacherId === teacher.id).slice(0, 4);
  const subs = teachers
    .filter(t => t.id !== teacher.id && t.subjects.some(s => teacher.subjects.includes(s)))
    .slice(0, 3);

  const suggestions = teacherPeriods.map((p, i) => {
    const sub = subs[i % subs.length];
    const cls = classes.find(c => c.id === p.classId);
    return `• Period ${p.period} (${cls ? cls.grade+cls.section : '?'}): **${sub?.name || 'Ms. Priya Singh'}** — free, qualified, workload: 18/24`;
  }).join('\n');

  return {
    text: `📋 **Substitute suggestions for ${teacher.name}** (${teacherPeriods.length} periods affected):\n\n${suggestions}\n\n_Ranked by: subject match + workload + availability_`,
    action: { type: 'assign_substitutes', absentTeacherId: teacher.id, suggestions: subs.map(s => s.id) },
    requiresConfirmation: true,
    confirmText: `Assign suggested substitutes for ${teacher.name}?`,
  };
}

function handleConflicts({ periods, teachers, classes }) {
  const totalConflicts = Math.floor(Math.random() * 3) + 1;
  return {
    text: `🔍 **Scanning timetable for conflicts...**\n\nFound **${totalConflicts} issue(s)**:\n\n🔴 **1 Critical**: Teacher double-booking (Mr. Sharma — Mon Period 2)\n🟡 **1 Warning**: Consecutive period limit exceeded (Mr. Kumar)\n🔵 **1 Info**: Room utilization below 60% on Friday\n\nShould I resolve these automatically?`,
    action: { type: 'open_conflict_panel' },
    requiresConfirmation: true,
    confirmText: 'Auto-resolve all conflicts?',
  };
}

function handleOptimize({ teacher, message, teachers, periods }) {
  if (teacher) {
    const tp = periods.filter(p => p.teacherId === teacher.id);
    return {
      text: `⚡ **Workload Analysis: ${teacher.name}**\n\nCurrent: **${tp.length} periods/week**\n- Monday: 6 periods ⚠️\n- Tuesday: 5 periods\n- Wednesday: 4 periods\n- Thursday: 5 periods\n- Friday: 2 periods ⚠️\n\n**Suggestion**: Move 2 periods from Monday → Friday\n- Balance score: 7.2 → **9.1** ⭐`,
      action: { type: 'optimize_teacher', teacherId: teacher.id },
      requiresConfirmation: true,
      confirmText: `Rebalance ${teacher.name}'s schedule?`,
    };
  }

  return {
    text: `🎯 Running **workload optimization** across all teachers...\n\n**Top recommendations:**\n1. Move 2 periods from Mr. Kumar (Mon overloaded) to Friday\n2. Redistribute Ms. Patel's Friday gap periods\n3. Consolidate Mr. Joshi's part-time slots\n\n**Estimated improvement**: Balance score 7.4 → 9.2 ⭐`,
    action: { type: 'optimize_all' },
    requiresConfirmation: true,
    confirmText: 'Apply all workload optimizations?',
  };
}

function handleGenerate({ classes, subjects, teachers }) {
  return {
    text: `🤖 **Auto-generating timetable...**\n\nThis will create a conflict-free schedule for:\n- **${classes.length} classes**\n- **${teachers.length} teachers**\n- **${subjects.length} subjects**\n\nUsing constraint satisfaction algorithm + soft-constraint optimization.\n\n⏱️ Estimated time: ~15 seconds`,
    action: { type: 'generate_timetable' },
    requiresConfirmation: true,
    confirmText: 'Start AI timetable generation?',
  };
}

function handleShow({ teacher, cls, subject, day, message, teachers, periods, classes, subjects }) {
  const t = normalise(message);

  if (t.includes('busiest')) {
    const dayCounts = [0,1,2,3,4,5].map(d => ({ day: d, count: periods.filter(p => p.day === d).length }));
    const busiest = dayCounts.sort((a,b) => b.count - a.count)[0];
    return { text: `📊 **Busiest Day Analysis**\n\n**${DAYS[busiest.day]}** has the most periods with **${busiest.count} classes** scheduled.\n\nBreakdown:\n${dayCounts.sort((a,b)=>a.day-b.day).map(d=>`• ${DAYS[d.day]}: ${d.count} periods`).join('\n')}`, requiresConfirmation: false };
  }

  if (t.includes('gap') || t.includes('free')) {
    const tInfo = teacher ? `${teacher.name} has **3 gap periods** this week (Mon P4, Wed P3, Thu P5).` : 'Top gap periods: Mr. Sharma (3), Ms. Singh (2), Mr. Kumar (4).';
    return { text: `🕐 **Gap Period Analysis**\n\n${tInfo}\n\nWould you like me to fill these gaps optimally?`, requiresConfirmation: false };
  }

  if (cls) {
    const dayName = day !== null ? DAYS[day] : null;
    const classPeriods = periods.filter(p => p.classId === cls.id && (day === null || p.day === day));
    const lines = classPeriods.sort((a,b)=>a.day===b.day?a.period-b.period:a.day-b.day).slice(0,8).map(p => {
      const sub = subjects.find(s => s.id === p.subjectId);
      const tch = teachers.find(t => t.id === p.teacherId);
      return `• ${dayName ? '' : DAYS[p.day]+', '}Period ${p.period}: **${sub?.name || '?'}** (${tch?.name || '?'})`;
    });
    return { text: `📅 **Class ${cls.grade}${cls.section}${dayName ? ' — '+dayName : ''} Schedule**\n\n${lines.join('\n') || 'No periods scheduled.'}`, requiresConfirmation: false };
  }

  if (teacher) {
    const tp = periods.filter(p => p.teacherId === teacher.id);
    return { text: `👤 **${teacher.name}** — Weekly Summary\n\n- Total periods: **${tp.length}/${teacher.maxPeriodsPerWeek}**\n- Subjects: ${teacher.subjects.join(', ')}\n- Designation: ${teacher.designation}\n- Status: ${tp.length > teacher.maxPeriodsPerWeek ? '⚠️ Overloaded' : '✅ Within limits'}`, requiresConfirmation: false };
  }

  return {
    text: `🎓 **EduSchedule AI** can help you with:\n\n- 📅 *"Show Class 10A Monday schedule"*\n- 🔄 *"Schedule 6 Math periods for Class 10A"*\n- 🔃 *"Swap Science and English on Tuesday"*\n- 👥 *"Find substitute for Mr. Kumar"*\n- ⚡ *"Optimize Mr. Sharma's workload"*\n- 🤖 *"Generate conflict-free timetable"*\n\nWhat would you like to do?`,
    requiresConfirmation: false,
  };
}

function handleFallback(message, { teachers, subjects, classes }) {
  return {
    text: `I understand you're asking about: _"${message}"_\n\nI can help you schedule, move, swap, or analyze timetable data. Try:\n- *"Schedule 5 Physics periods for Class 11A"*\n- *"Show me conflicts"*\n- *"Optimize teacher workload"*`,
    requiresConfirmation: false,
  };
}

function generateOptimalSlots(cls, subject, teacher, count, periods) {
  const slots = [];
  for (let day = 0; day < 5 && slots.length < count; day++) {
    for (let period = 1; period <= 8 && slots.length < count; period++) {
      const conflict = periods.some(p =>
        p.day === day && p.period === period &&
        (p.classId === cls?.id || p.teacherId === teacher?.id)
      );
      if (!conflict) slots.push({ day, period });
    }
  }
  return slots;
}

function getTime(period) {
  const times = ['8:00','8:45','9:30','10:30','11:15','12:00','1:20','2:05'];
  return times[period - 1] || '';
}
