import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { demoTeachers, demoSubjects, demoRooms, demoClasses, generateDemoTimetable } from '../data/demoData';

// ─── School Store ───────────────────────────────────────────────
export const useSchoolStore = create(persist((set, get) => ({
  school: {
    name: 'Sunrise International School',
    board: 'CBSE',
    address: '12, Sector 4, New Delhi - 110001',
    email: 'info@sunriseschool.in',
    phone: '011-23456789',
    workingDays: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true },
    periodsPerDay: 8,
    academicYear: '2026-27',
  },
  teachers: demoTeachers,
  subjects: demoSubjects,
  rooms: demoRooms,
  classes: demoClasses,

  updateSchool: (data) => set(s => ({ school: { ...s.school, ...data } })),

  addTeacher: (t) => set(s => ({ teachers: [...s.teachers, { ...t, id: `t${Date.now()}` }] })),
  updateTeacher: (id, data) => set(s => ({ teachers: s.teachers.map(t => t.id === id ? { ...t, ...data } : t) })),
  deleteTeacher: (id) => set(s => ({ teachers: s.teachers.filter(t => t.id !== id) })),

  addSubject: (sub) => set(s => ({ subjects: [...s.subjects, { ...sub, id: `s${Date.now()}` }] })),
  updateSubject: (id, data) => set(s => ({ subjects: s.subjects.map(sub => sub.id === id ? { ...sub, ...data } : sub) })),
  deleteSubject: (id) => set(s => ({ subjects: s.subjects.filter(sub => sub.id !== id) })),

  addRoom: (r) => set(s => ({ rooms: [...s.rooms, { ...r, id: `r${Date.now()}` }] })),
  updateRoom: (id, data) => set(s => ({ rooms: s.rooms.map(r => r.id === id ? { ...r, ...data } : r) })),
  deleteRoom: (id) => set(s => ({ rooms: s.rooms.filter(r => r.id !== id) })),

  addClass: (c) => set(s => ({ classes: [...s.classes, { ...c, id: `c${Date.now()}` }] })),
  updateClass: (id, data) => set(s => ({ classes: s.classes.map(c => c.id === id ? { ...c, ...data } : c) })),
  deleteClass: (id) => set(s => ({ classes: s.classes.filter(c => c.id !== id) })),
}), { name: 'eduschedule-school' }));

// ─── Timetable Store ─────────────────────────────────────────────
const MAX_UNDO = 100;

export const useTimetableStore = create(persist((set, get) => ({
  timetables: [{
    id: 'tt1',
    name: 'Main Timetable 2026-27',
    academicYear: '2026-27',
    term: 'Full Year',
    status: 'active',
    createdAt: new Date().toISOString(),
    generationMethod: 'manual',
  }],
  activeTimetableId: 'tt1',
  periods: generateDemoTimetable(),
  history: [],
  future: [],
  viewMode: 'class', // 'class' | 'teacher' | 'room'
  selectedClassId: 'c1',
  selectedTeacherId: 't1',
  selectedRoomId: 'r1',
  selectedWeekType: 'A',
  isGenerating: false,
  generationProgress: 0,

  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedClass: (id) => set({ selectedClassId: id }),
  setSelectedTeacher: (id) => set({ selectedTeacherId: id }),
  setSelectedRoom: (id) => set({ selectedRoomId: id }),

  addPeriod: (period) => {
    const prev = get().periods;
    set(s => ({
      periods: [...s.periods, { ...period, id: `p${Date.now()}` }],
      history: [...s.history.slice(-MAX_UNDO), prev],
      future: [],
    }));
  },

  updatePeriod: (id, data) => {
    const prev = get().periods;
    set(s => ({
      periods: s.periods.map(p => p.id === id ? { ...p, ...data } : p),
      history: [...s.history.slice(-MAX_UNDO), prev],
      future: [],
    }));
  },

  deletePeriod: (id) => {
    const prev = get().periods;
    set(s => ({
      periods: s.periods.filter(p => p.id !== id),
      history: [...s.history.slice(-MAX_UNDO), prev],
      future: [],
    }));
  },

  movePeriod: (id, newDay, newPeriod) => {
    const prev = get().periods;
    set(s => ({
      periods: s.periods.map(p => p.id === id ? { ...p, day: newDay, period: newPeriod } : p),
      history: [...s.history.slice(-MAX_UNDO), prev],
      future: [],
    }));
  },

  swapPeriods: (id1, id2) => {
    const prev = get().periods;
    set(s => {
      const p1 = s.periods.find(p => p.id === id1);
      const p2 = s.periods.find(p => p.id === id2);
      if (!p1 || !p2) return {};
      return {
        periods: s.periods.map(p => {
          if (p.id === id1) return { ...p, day: p2.day, period: p2.period };
          if (p.id === id2) return { ...p, day: p1.day, period: p1.period };
          return p;
        }),
        history: [...s.history.slice(-MAX_UNDO), prev],
        future: [],
      };
    });
  },

  toggleLock: (id) => set(s => ({
    periods: s.periods.map(p => p.id === id ? { ...p, isLocked: !p.isLocked } : p),
  })),

  undo: () => {
    const { history, periods } = get();
    if (!history.length) return;
    set({ periods: history[history.length - 1], history: history.slice(0, -1), future: [periods, ...get().future] });
  },

  redo: () => {
    const { future, periods } = get();
    if (!future.length) return;
    set({ periods: future[0], future: future.slice(1), history: [...get().history, periods] });
  },

  setGenerating: (v, progress = 0) => set({ isGenerating: v, generationProgress: progress }),

  bulkSetPeriods: (newPeriods) => {
    const prev = get().periods;
    set({ periods: newPeriods, history: [...get().history.slice(-MAX_UNDO), prev], future: [] });
  },

  getPeriodsForClass: (classId) => get().periods.filter(p => p.classId === classId),
  getPeriodsForTeacher: (teacherId) => get().periods.filter(p => p.teacherId === teacherId),
  getPeriodsForRoom: (roomId) => get().periods.filter(p => p.roomId === roomId),
}), { name: 'eduschedule-timetable' }));

// ─── UI Store ────────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  aiChatOpen: false,
  conflictPanelOpen: false,
  toasts: [],
  modalStack: [],

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openAIChat: () => set({ aiChatOpen: true }),
  closeAIChat: () => set({ aiChatOpen: false }),
  toggleAIChat: () => set(s => ({ aiChatOpen: !s.aiChatOpen })),
  toggleConflictPanel: () => set(s => ({ conflictPanelOpen: !s.conflictPanelOpen })),

  addToast: (toast) => {
    const id = Date.now();
    set(s => ({ toasts: [...s.toasts, { id, ...toast }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), toast.duration || 4000);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  pushModal: (modal) => set(s => ({ modalStack: [...s.modalStack, modal] })),
  popModal: () => set(s => ({ modalStack: s.modalStack.slice(0, -1) })),
  clearModals: () => set({ modalStack: [] }),
}));

// ─── Substitution Store ──────────────────────────────────────────
import { demoSubstitutions } from '../data/demoData';
export const useSubstitutionStore = create(persist((set) => ({
  substitutions: demoSubstitutions,
  addSubstitution: (sub) => set(s => ({ substitutions: [...s.substitutions, { ...sub, id: `sub${Date.now()}` }] })),
  updateSubstitution: (id, data) => set(s => ({ substitutions: s.substitutions.map(x => x.id === id ? { ...x, ...data } : x) })),
  deleteSubstitution: (id) => set(s => ({ substitutions: s.substitutions.filter(x => x.id !== id) })),
}), { name: 'eduschedule-substitutions' }));

// ─── Assignment Store ─────────────────────────────────────────────
// Each assignment = { id, classId, subjectId, teacherId, periodsPerWeek }
// This is the CORE of timetable generation — who teaches what to whom
export const useAssignmentStore = create(persist((set, get) => ({
  assignments: [],

  // Set all assignments for a class at once (used by wizard)
  setClassAssignments: (classId, newAssignments) => set(s => ({
    assignments: [
      ...s.assignments.filter(a => a.classId !== classId),
      ...newAssignments.map(a => ({ ...a, id: `asgn-${classId}-${a.subjectId}` })),
    ],
  })),

  // Update a single assignment
  upsertAssignment: (assignment) => set(s => {
    const exists = s.assignments.find(a => a.classId === assignment.classId && a.subjectId === assignment.subjectId);
    if (exists) {
      return { assignments: s.assignments.map(a => a.id === exists.id ? { ...a, ...assignment } : a) };
    }
    return { assignments: [...s.assignments, { ...assignment, id: `asgn-${Date.now()}` }] };
  }),

  removeAssignment: (id) => set(s => ({ assignments: s.assignments.filter(a => a.id !== id) })),

  clearAssignments: () => set({ assignments: [] }),

  getClassAssignments: (classId) => get().assignments.filter(a => a.classId === classId),
  getTeacherAssignments: (teacherId) => get().assignments.filter(a => a.teacherId === teacherId),
}), { name: 'eduschedule-assignments' }));

// ─── Section Config Store (replaces Stream Store) ─────────────────
// Each config belongs to ONE class section (classId).
// Structure:
//   coreSubjects      : [{ subjectId, teacherId, periodsPerWeek }]
//                       → all students in this section attend these together
//   fifthSubjectGroup : [{ id, subjectId, teacherId, roomId, periodsPerWeek, estimatedStudents }]
//                       → students choose ONE; all options run SIMULTANEOUSLY (5th subject)
//   sixthSubjectGroup : [{ id, subjectId, teacherId, roomId, periodsPerWeek, estimatedStudents }]
//                       → students choose ONE; all options run SIMULTANEOUSLY (additional/6th subject)
export const useSectionConfigStore = create(persist((set, get) => ({
  configs: [],

  // Get or create config for a class
  getConfig: (classId) =>
    get().configs.find(c => c.classId === classId) ||
    { classId, coreSubjects: [], fifthSubjectGroup: [], sixthSubjectGroup: [] },

  // Save the full config for a class (upsert)
  saveConfig: (classId, data) => set(s => {
    const exists = s.configs.find(c => c.classId === classId);
    if (exists) {
      return { configs: s.configs.map(c => c.classId === classId ? { ...c, ...data } : c) };
    }
    return { configs: [...s.configs, { id: `sc-${Date.now()}`, classId, coreSubjects: [], fifthSubjectGroup: [], sixthSubjectGroup: [], ...data }] };
  }),

  // Update one field array for a class (e.g. coreSubjects)
  updateField: (classId, field, value) => set(s => {
    const exists = s.configs.find(c => c.classId === classId);
    if (exists) {
      return { configs: s.configs.map(c => c.classId === classId ? { ...c, [field]: value } : c) };
    }
    return { configs: [...s.configs, { id: `sc-${Date.now()}`, classId, coreSubjects: [], fifthSubjectGroup: [], sixthSubjectGroup: [], [field]: value }] };
  }),

  deleteConfig: (classId) => set(s => ({ configs: s.configs.filter(c => c.classId !== classId) })),

  getAllConfiguredClassIds: () => get().configs.filter(c =>
    c.coreSubjects?.length || c.fifthSubjectGroup?.length || c.sixthSubjectGroup?.length
  ).map(c => c.classId),
}), { name: 'eduschedule-section-configs' }));

// Keep the old useStreamStore as a no-op alias so existing imports don't break
export const useStreamStore = useSectionConfigStore;
