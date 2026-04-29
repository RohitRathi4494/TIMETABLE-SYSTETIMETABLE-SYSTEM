// Demo seed data for EduSchedule AI
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const PERIODS_PER_DAY = 8;

export const SUBJECT_COLORS = {
  Mathematics: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30', dot: '#3b82f6' },
  Physics: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30', dot: '#a855f7' },
  Chemistry: { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/30', dot: '#22c55e' },
  Biology: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', dot: '#10b981' },
  English: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', dot: '#f59e0b' },
  Hindi: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30', dot: '#f97316' },
  History: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30', dot: '#f43f5e' },
  Geography: { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/30', dot: '#14b8a6' },
  'Computer Science': { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30', dot: '#06b6d4' },
  'Physical Education': { bg: 'bg-lime-500/20', text: 'text-lime-300', border: 'border-lime-500/30', dot: '#84cc16' },
  Economics: { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30', dot: '#6366f1' },
  'Social Science': { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/30', dot: '#ec4899' },
};

export const getSubjectColor = (name) =>
  SUBJECT_COLORS[name] || { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30', dot: '#94a3b8' };

export const demoTeachers = [
  { id: 't1', name: 'Mr. Rajesh Sharma', employeeId: 'EMP001', designation: 'PGT', subjects: ['Mathematics'], maxPeriodsPerWeek: 24, maxConsecutive: 3, isPartTime: false, phone: '9876543210', email: 'rsharma@school.in', preferences: { blocked: [], preferred: [1,2,3] }, avatar: 'RS' },
  { id: 't2', name: 'Ms. Priya Singh', employeeId: 'EMP002', designation: 'PGT', subjects: ['English', 'Mathematics'], maxPeriodsPerWeek: 24, maxConsecutive: 3, isPartTime: false, phone: '9876543211', email: 'psingh@school.in', preferences: { blocked: [], preferred: [2,3,4] }, avatar: 'PS' },
  { id: 't3', name: 'Mr. Anil Kumar', employeeId: 'EMP003', designation: 'PGT', subjects: ['Physics', 'Mathematics'], maxPeriodsPerWeek: 22, maxConsecutive: 3, isPartTime: false, phone: '9876543212', email: 'akumar@school.in', preferences: { blocked: [8], preferred: [1,2,3,4] }, avatar: 'AK' },
  { id: 't4', name: 'Ms. Sunita Verma', employeeId: 'EMP004', designation: 'TGT', subjects: ['Chemistry', 'Biology'], maxPeriodsPerWeek: 24, maxConsecutive: 4, isPartTime: false, phone: '9876543213', email: 'sverma@school.in', preferences: { blocked: [], preferred: [] }, avatar: 'SV' },
  { id: 't5', name: 'Mr. Deepak Gupta', employeeId: 'EMP005', designation: 'TGT', subjects: ['Hindi', 'Social Science'], maxPeriodsPerWeek: 26, maxConsecutive: 3, isPartTime: false, phone: '9876543214', email: 'dgupta@school.in', preferences: { blocked: [1], preferred: [3,4,5,6] }, avatar: 'DG' },
  { id: 't6', name: 'Ms. Kavita Nair', employeeId: 'EMP006', designation: 'TGT', subjects: ['History', 'Geography', 'Economics'], maxPeriodsPerWeek: 20, maxConsecutive: 3, isPartTime: false, phone: '9876543215', email: 'knair@school.in', preferences: { blocked: [], preferred: [2,3,4,5] }, avatar: 'KN' },
  { id: 't7', name: 'Mr. Vikram Joshi', employeeId: 'EMP007', designation: 'PGT', subjects: ['Computer Science'], maxPeriodsPerWeek: 18, maxConsecutive: 2, isPartTime: true, phone: '9876543216', email: 'vjoshi@school.in', preferences: { blocked: [1,8], preferred: [3,4,5] }, avatar: 'VJ' },
  { id: 't8', name: 'Ms. Anita Patel', employeeId: 'EMP008', designation: 'PRT', subjects: ['Physical Education'], maxPeriodsPerWeek: 22, maxConsecutive: 2, isPartTime: false, phone: '9876543217', email: 'apatel@school.in', preferences: { blocked: [], preferred: [7,8] }, avatar: 'AP' },
];

export const demoSubjects = [
  // Core languages (all streams)
  { id: 's1',  name: 'Mathematics',           code: 'MATH',  type: 'theory',    periodsPerWeek: 6, isDifficult: true  },
  { id: 's2',  name: 'Physics',               code: 'PHY',   type: 'theory',    periodsPerWeek: 5, isDifficult: true  },
  { id: 's3',  name: 'Chemistry',             code: 'CHEM',  type: 'theory',    periodsPerWeek: 5, isDifficult: true  },
  { id: 's4',  name: 'Biology',               code: 'BIO',   type: 'theory',    periodsPerWeek: 5, isDifficult: false },
  { id: 's5',  name: 'English',               code: 'ENG',   type: 'theory',    periodsPerWeek: 5, isDifficult: false },
  { id: 's6',  name: 'Hindi',                 code: 'HIN',   type: 'theory',    periodsPerWeek: 5, isDifficult: false },
  { id: 's7',  name: 'History',               code: 'HIST',  type: 'theory',    periodsPerWeek: 4, isDifficult: false },
  { id: 's8',  name: 'Geography',             code: 'GEO',   type: 'theory',    periodsPerWeek: 4, isDifficult: false },
  { id: 's9',  name: 'Computer Science',      code: 'CS',    type: 'practical', periodsPerWeek: 4, isDifficult: false },
  { id: 's10', name: 'Physical Education',    code: 'PE',    type: 'practical', periodsPerWeek: 2, isDifficult: false },
  { id: 's11', name: 'Economics',             code: 'ECO',   type: 'theory',    periodsPerWeek: 4, isDifficult: false },
  { id: 's12', name: 'Social Science',        code: 'SST',   type: 'theory',    periodsPerWeek: 5, isDifficult: false },
  // Additional XI-XII subjects
  { id: 's13', name: 'Accountancy',           code: 'ACC',   type: 'theory',    periodsPerWeek: 5, isDifficult: true  },
  { id: 's14', name: 'Business Studies',      code: 'BST',   type: 'theory',    periodsPerWeek: 5, isDifficult: false },
  { id: 's15', name: 'Political Science',     code: 'POL',   type: 'theory',    periodsPerWeek: 4, isDifficult: false },
  { id: 's16', name: 'Sociology',             code: 'SOC',   type: 'theory',    periodsPerWeek: 4, isDifficult: false },
  { id: 's17', name: 'Psychology',            code: 'PSY',   type: 'theory',    periodsPerWeek: 4, isDifficult: false },
  { id: 's18', name: 'Informatics Practices', code: 'IP',    type: 'practical', periodsPerWeek: 4, isDifficult: false },
  { id: 's19', name: 'Fine Arts',             code: 'FA',    type: 'practical', periodsPerWeek: 3, isDifficult: false },
];

export const demoRooms = [
  { id: 'r1', name: 'Room 101', type: 'classroom', capacity: 40, facilities: ['whiteboard', 'projector'], isAvailable: true },
  { id: 'r2', name: 'Room 102', type: 'classroom', capacity: 40, facilities: ['whiteboard'], isAvailable: true },
  { id: 'r3', name: 'Room 103', type: 'classroom', capacity: 42, facilities: ['whiteboard', 'projector', 'ac'], isAvailable: true },
  { id: 'r4', name: 'Room 201', type: 'classroom', capacity: 38, facilities: ['whiteboard'], isAvailable: true },
  { id: 'r5', name: 'Room 202', type: 'classroom', capacity: 40, facilities: ['whiteboard', 'projector'], isAvailable: true },
  { id: 'r6', name: 'Science Lab', type: 'lab', capacity: 30, facilities: ['lab_equipment', 'whiteboard'], isAvailable: true },
  { id: 'r7', name: 'Computer Lab', type: 'lab', capacity: 25, facilities: ['computers', 'projector', 'whiteboard'], isAvailable: true },
  { id: 'r8', name: 'Library', type: 'special', capacity: 50, facilities: ['books', 'projector', 'ac'], isAvailable: true },
];

export const demoClasses = [
  { id: 'c1', grade: 10, section: 'A', strength: 38, roomId: 'r1', classTeacherId: 't1', subjects: ['s1','s2','s3','s5','s6'] },
  { id: 'c2', grade: 10, section: 'B', strength: 36, roomId: 'r2', classTeacherId: 't2', subjects: ['s1','s2','s3','s5','s6'] },
  { id: 'c3', grade: 9, section: 'A', strength: 40, roomId: 'r3', classTeacherId: 't3', subjects: ['s1','s4','s5','s6','s12'] },
  { id: 'c4', grade: 9, section: 'B', strength: 39, roomId: 'r4', classTeacherId: 't5', subjects: ['s1','s4','s5','s6','s12'] },
  { id: 'c5', grade: 11, section: 'A', strength: 35, roomId: 'r5', classTeacherId: 't4', subjects: ['s1','s2','s3','s5','s9','s11'] },
  { id: 'c6', grade: 12, section: 'A', strength: 33, roomId: 'r1', classTeacherId: 't3', subjects: ['s1','s2','s3','s5','s9','s11'] },
];

// Pre-built timetable for class 10A
export const generateDemoTimetable = () => {
  const slots = [];
  const assignments = [
    // [day, period, classId, subjectId, teacherId, roomId]
    [0,1,'c1','s1','t1','r1'],[0,2,'c1','s5','t2','r1'],[0,3,'c1','s2','t3','r1'],[0,4,'c1','s3','t4','r1'],[0,5,'c1','s6','t5','r1'],[0,6,'c1','s1','t1','r1'],
    [1,1,'c1','s5','t2','r1'],[1,2,'c1','s1','t1','r1'],[1,3,'c1','s3','t4','r1'],[1,4,'c1','s2','t3','r1'],[1,5,'c1','s6','t5','r1'],[1,6,'c1','s1','t1','r1'],
    [2,1,'c1','s1','t1','r1'],[2,2,'c1','s2','t3','r1'],[2,3,'c1','s5','t2','r1'],[2,4,'c1','s3','t4','r1'],[2,5,'c1','s6','t5','r1'],[2,6,'c1','s2','t3','r1'],
    [3,1,'c1','s6','t5','r1'],[3,2,'c1','s3','t4','r1'],[3,3,'c1','s1','t1','r1'],[3,4,'c1','s5','t2','r1'],[3,5,'c1','s2','t3','r1'],[3,6,'c1','s3','t4','r1'],
    [4,1,'c1','s3','t4','r1'],[4,2,'c1','s6','t5','r1'],[4,3,'c1','s1','t1','r1'],[4,4,'c1','s2','t3','r1'],[4,5,'c1','s5','t2','r1'],
    // Class 10B
    [0,1,'c2','s1','t2','r2'],[0,2,'c2','s2','t3','r2'],[0,3,'c2','s5','t2','r2'],[0,4,'c2','s3','t4','r2'],[0,5,'c2','s1','t2','r2'],[0,6,'c2','s6','t5','r2'],
    [1,1,'c2','s2','t3','r2'],[1,2,'c2','s5','t2','r2'],[1,3,'c2','s1','t2','r2'],[1,4,'c2','s6','t5','r2'],[1,5,'c2','s3','t4','r2'],[1,6,'c2','s2','t3','r2'],
    [2,1,'c2','s6','t5','r2'],[2,2,'c2','s1','t2','r2'],[2,3,'c2','s3','t4','r2'],[2,4,'c2','s5','t2','r2'],[2,5,'c2','s2','t3','r2'],[2,6,'c2','s1','t2','r2'],
    [3,1,'c2','s5','t2','r2'],[3,2,'c2','s6','t5','r2'],[3,3,'c2','s2','t3','r2'],[3,4,'c2','s1','t2','r2'],[3,5,'c2','s3','t4','r2'],[3,6,'c2','s5','t2','r2'],
    [4,1,'c2','s1','t2','r2'],[4,2,'c2','s3','t4','r2'],[4,3,'c2','s6','t5','r2'],[4,4,'c2','s2','t3','r2'],[4,5,'c2','s1','t2','r2'],
  ];
  assignments.forEach(([day,period,classId,subjectId,teacherId,roomId], i) => {
    slots.push({ id: `p${i+1}`, day, period, classId, subjectId, teacherId, roomId, isLocked: false, weekType: 'A' });
  });
  return slots;
};

export const PERIOD_TIMES = [
  '8:00 – 8:40', '8:45 – 9:25', '9:30 – 10:10', '10:30 – 11:10',
  '11:15 – 11:55', '12:00 – 12:40', '1:20 – 2:00', '2:05 – 2:45',
];
export const BREAKS = { 3: 'Break (10:10 – 10:30)', 6: 'Lunch (12:40 – 1:20)' };

export const demoSubstitutions = [
  { id: 'sub1', absentTeacherId: 't3', substituteTeacherId: 't1', date: '2026-04-28', periods: [2,4], reason: 'Medical Leave', status: 'confirmed', notificationSent: true },
  { id: 'sub2', absentTeacherId: 't5', substituteTeacherId: null, date: '2026-04-29', periods: [1,3,5], reason: 'Personal Leave', status: 'pending', notificationSent: false },
];

export const AI_PROMPTS = [
  'Schedule 6 Math periods for Class 10A with Mr. Sharma',
  'Find a substitute for Mr. Kumar tomorrow',
  'Show me all conflicts in the current timetable',
  'Move Friday lectures of Class 9A to morning slots',
  'Optimize Mr. Sharma\'s workload this week',
  'Which teacher has the most gap periods?',
  'Swap Science and English on Tuesday for Class 10B',
  'Generate a conflict-free timetable for Class 11A',
];
