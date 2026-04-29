import { useState, useCallback, useRef, useMemo } from 'react';
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors,
  useDroppable, useDraggable, closestCenter
} from '@dnd-kit/core';
import {
  Lock, Unlock, Trash2, Edit3, Copy, MoreHorizontal, Zap, RefreshCw,
  ChevronDown, LayoutGrid, User, DoorOpen
} from 'lucide-react';
import { useSchoolStore, useTimetableStore, useUIStore, useAssignmentStore, useSectionConfigStore } from '../../store';
import { getSubjectColor, DAYS, PERIOD_TIMES, BREAKS } from '../../data/demoData';
import { detectConflicts } from '../../services/conflictService';
import { generateFromAssignments } from '../../services/generatorService';
import { Modal, ProgressBar } from '../shared';
import { clsx } from 'clsx';

// ─── Period Card ──────────────────────────────────────────────────
function PeriodCard({ period, teacher, subject, cls, isConflict, compact = false }) {
  const color = getSubjectColor(subject?.name);
  return (
    <div className={clsx(
      'period-cell', color.bg, color.border,
      'border flex flex-col gap-0.5 h-full',
      isConflict && 'conflict',
    )}>
      {period.isLocked && <Lock size={8} className="absolute top-1.5 right-1.5 text-slate-400" />}
      <p className={clsx('font-bold text-xs leading-tight truncate', color.text)}>{subject?.name || '—'}</p>
      <p className="text-slate-400 text-[10px] truncate">{teacher?.name?.split(' ').slice(-1)[0] || '—'}</p>
      {!compact && cls && <p className="text-slate-500 text-[10px] truncate">{cls.grade}{cls.section}</p>}
    </div>
  );
}

// ─── Draggable Period ────────────────────────────────────────────
function DraggablePeriod({ period, teacher, subject, cls, isConflict }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: period.id, data: { period } });
  const { toggleLock, deletePeriod } = useTimetableStore();
  const { addToast } = useUIStore();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      className={clsx('relative h-full', isDragging && 'opacity-30')}
      onContextMenu={e => { e.preventDefault(); setMenu(true); }}
    >
      <PeriodCard period={period} teacher={teacher} subject={subject} cls={cls} isConflict={isConflict} />

      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
          <div className="absolute z-50 top-0 left-full ml-1 bg-surface-800 border border-white/[0.1] rounded-xl shadow-glass py-1 w-40 animate-fade-in">
            {[
              { icon: Edit3, label: 'Edit', action: () => addToast({ type: 'info', message: 'Click a period to edit it' }) },
              { icon: period.isLocked ? Unlock : Lock, label: period.isLocked ? 'Unlock' : 'Lock', action: () => { toggleLock(period.id); addToast({ type: 'success', message: `Period ${period.isLocked ? 'unlocked' : 'locked'}` }); } },
              { icon: Copy, label: 'Copy', action: () => addToast({ type: 'info', message: 'Copied to clipboard' }) },
              { icon: Trash2, label: 'Delete', action: () => { deletePeriod(period.id); addToast({ type: 'warning', message: 'Period deleted' }); }, danger: true },
            ].map(({ icon: Icon, label, action, danger }) => (
              <button key={label} onClick={() => { action(); setMenu(false); }}
                className={clsx('flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors', danger ? 'text-red-400' : 'text-slate-300')}>
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Drop Cell ────────────────────────────────────────────────────
function DropCell({ day, period, children }) {
  const { isOver, setNodeRef } = useDroppable({ id: `${day}-${period}` });
  return (
    <div ref={setNodeRef}
      className={clsx('drop-zone p-1.5 min-h-[68px]', isOver && 'over')}>
      {children}
    </div>
  );
}

// ─── View Switcher ────────────────────────────────────────────────
function ViewSwitcher() {
  const { viewMode, setViewMode, selectedClassId, setSelectedClass, selectedTeacherId, setSelectedTeacher, selectedRoomId, setSelectedRoom } = useTimetableStore();
  const { teachers, classes, rooms } = useSchoolStore();
  const modes = [
    { id: 'class', label: 'Class', icon: LayoutGrid },
    { id: 'teacher', label: 'Teacher', icon: User },
    { id: 'room', label: 'Room', icon: DoorOpen },
  ];

  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      <div className="flex gap-1 bg-surface-800 rounded-xl p-1">
        {modes.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setViewMode(id)}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              viewMode === id ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200')}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {viewMode === 'class' && (
        <select className="select py-1.5 text-xs w-40" value={selectedClassId} onChange={e => setSelectedClass(e.target.value)}>
          {classes.map(c => <option key={c.id} value={c.id}>Class {c.grade}{c.section}</option>)}
        </select>
      )}
      {viewMode === 'teacher' && (
        <select className="select py-1.5 text-xs w-44" value={selectedTeacherId} onChange={e => setSelectedTeacher(e.target.value)}>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}
      {viewMode === 'room' && (
        <select className="select py-1.5 text-xs w-40" value={selectedRoomId} onChange={e => setSelectedRoom(e.target.value)}>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      )}
    </div>
  );
}

// ─── Main Grid ────────────────────────────────────────────────────
export function TimetableGrid() {
  const { periods, movePeriod, viewMode, selectedClassId, selectedTeacherId, selectedRoomId, isGenerating, generationProgress, setGenerating, bulkSetPeriods } = useTimetableStore();
  const { classes, subjects, teachers, rooms, school } = useSchoolStore();
  const { assignments } = useAssignmentStore();
  const { configs: sectionConfigs } = useSectionConfigStore();
  const { addToast } = useUIStore();
  const [activeId, setActiveId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editPeriod, setEditPeriod] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const conflicts = detectConflicts(periods, teachers, classes, subjects, rooms);
  const conflictPeriodIds = new Set(conflicts.flatMap(c => c.affectedPeriods));

  // Filter periods based on view
  const filteredPeriods = periods.filter(p => {
    if (viewMode === 'class') return p.classId === selectedClassId;
    if (viewMode === 'teacher') return p.teacherId === selectedTeacherId;
    if (viewMode === 'room') return p.roomId === selectedRoomId;
    return true;
  });

  const activeDays = DAYS.filter((_, i) => i < 6);

  const handleDragStart = ({ active }) => setActiveId(active.id);
  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const [newDay, newPeriod] = over.id.toString().split('-').map(Number);
    const period = periods.find(p => p.id === active.id);
    if (!period || (period.day === newDay && period.period === newPeriod)) return;
    if (period.isLocked) { addToast({ type: 'warning', message: 'Period is locked. Unlock it first.' }); return; }
    movePeriod(active.id, newDay, newPeriod);
    addToast({ type: 'success', message: `Moved to ${DAYS[newDay]}, Period ${newPeriod}` });
  };

  const activePeriod = activeId ? periods.find(p => p.id === activeId) : null;

  const handleGenerate = async () => {
    if (assignments.length === 0) {
      addToast({ type: 'warning', title: 'No Assignments Found', message: 'Use Setup Wizard to assign teachers first.' });
      return;
    }
    setGenerating(true, 0);
    try {
      const newPeriods = await generateFromAssignments(
        assignments, classes, subjects, teachers, rooms,
        school?.periodsPerDay || 8, school?.workingDays || { monday:true,tuesday:true,wednesday:true,thursday:true,friday:true,saturday:true },
        (pct) => setGenerating(true, pct),
        sectionConfigs
      );
      bulkSetPeriods(newPeriods);
      addToast({ type: 'success', title: 'Timetable Generated!', message: `${newPeriods.length} periods scheduled conflict-free` });
    } catch {
      addToast({ type: 'error', message: 'Generation failed. Please try again.' });
    } finally {
      setGenerating(false, 0);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <ViewSwitcher />
        <div className="flex gap-2">
          <button onClick={handleGenerate} disabled={isGenerating}
            className={clsx('btn-primary text-xs', isGenerating && 'opacity-75 cursor-not-allowed')}>
            {isGenerating ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
            {isGenerating ? `Generating ${generationProgress}%` : 'AI Generate'}
          </button>
        </div>
      </div>

      {isGenerating && (
        <div className="mb-4 glass p-3">
          <ProgressBar value={generationProgress} max={100} label="Generating conflict-free timetable..." />
        </div>
      )}

      {/* Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-24 py-2 px-3 text-left text-slate-500 font-semibold sticky left-0 bg-surface-950 z-10">Period</th>
                {activeDays.map(day => (
                  <th key={day} className="py-2 px-1 text-center text-slate-300 font-semibold min-w-[120px]">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }, (_, i) => i + 1).map(periodNum => {
                const breakEntry = BREAKS[periodNum];
                return (
                  <>
                    {breakEntry && (
                      <tr key={`break-${periodNum}`}>
                        <td colSpan={7} className="py-1.5 px-3 text-center text-slate-500 text-[10px] bg-surface-900/40 border-y border-white/[0.04]">
                          ☕ {breakEntry}
                        </td>
                      </tr>
                    )}
                    <tr key={periodNum} className="border-b border-white/[0.04]">
                      <td className="py-1 px-3 sticky left-0 bg-surface-950 z-10">
                        <p className="font-semibold text-slate-300">P{periodNum}</p>
                        <p className="text-slate-500 text-[10px]">{PERIOD_TIMES[periodNum - 1]}</p>
                      </td>
                      {activeDays.map((_, dayIdx) => {
                        const cellPeriods = filteredPeriods.filter(p => p.day === dayIdx && p.period === periodNum);
                        return (
                          <td key={dayIdx} className="py-1 px-1">
                            <DropCell day={dayIdx} period={periodNum}>
                              {cellPeriods.map(p => {
                                const t = teachers.find(x => x.id === p.teacherId);
                                const s = subjects.find(x => x.id === p.subjectId);
                                const c = classes.find(x => x.id === p.classId);
                                return (
                                  <DraggablePeriod key={p.id} period={p} teacher={t} subject={s} cls={c}
                                    isConflict={conflictPeriodIds.has(p.id)} />
                                );
                              })}
                            </DropCell>
                          </td>
                        );
                      })}
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        <DragOverlay>
          {activePeriod && (
            <div className="w-28 h-16 drag-preview rounded-xl overflow-hidden">
              <PeriodCard
                period={activePeriod}
                teacher={teachers.find(t => t.id === activePeriod.teacherId)}
                subject={subjects.find(s => s.id === activePeriod.subjectId)}
                cls={classes.find(c => c.id === activePeriod.classId)}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
