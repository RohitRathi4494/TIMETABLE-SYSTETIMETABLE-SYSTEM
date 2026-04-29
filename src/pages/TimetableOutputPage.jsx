import { useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Printer, Download, Users, GraduationCap, ArrowLeft, ChevronRight } from 'lucide-react';
import { useSchoolStore, useTimetableStore } from '../store';
import { DAYS, PERIOD_TIMES, BREAKS, getSubjectColor } from '../data/demoData';
import { clsx } from 'clsx';

// ─── Helpers ───────────────────────────────────────────────────────
const ACTIVE_DAYS = [0, 1, 2, 3, 4, 5]; // Mon–Sat indices

function getDayLabel(idx) { return DAYS[idx]?.slice(0, 3) || ''; }

// ─── Single Class Timetable ────────────────────────────────────────
function ClassTimetable({ cls, periods, teachers, subjects, school }) {
  const classPeriods = periods.filter(p => p.classId === cls.id);
  const periodsPerDay = school.periodsPerDay || 8;

  // Returns array of period entries for a given slot (may be multiple if split groups)
  const getCells = (day, pNum) => {
    const ps = classPeriods.filter(x => x.day === day && x.period === pNum);
    return ps.map(p => ({
      subject: subjects.find(s => s.id === p.subjectId),
      teacher: teachers.find(t => t.id === p.teacherId),
      isOptional: !!p.isOptional,
      groupName: p.groupName,
      groupLabel: p.groupLabel,   // '5th Subject' | '6th Subject'
      isAdditional: !!p.isAdditional,
    }));
  };

  const optionalPeriodCount = classPeriods.filter(p => p.isOptional).length;

  return (
    <div className="mb-8 print-section">
      {/* Class header */}
      <div className="flex items-center gap-3 mb-2 pb-2 border-b-2 border-brand-500/40">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-black text-sm">
          {cls.grade}{cls.section}
        </div>
        <div>
          <p className="font-black text-white text-base">Class {cls.grade} – Section {cls.section}</p>
          <p className="text-slate-400 text-xs">
            {cls.strength} students · {classPeriods.filter(p => !p.isOptional).length} core +{' '}
            {optionalPeriodCount} optional periods
          </p>
        </div>
        {optionalPeriodCount > 0 && (
          <span className="badge-purple badge ml-2">Has optional groups</span>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="w-20 py-2 px-2 text-left text-slate-500 font-semibold border border-white/[0.06] bg-surface-800/60">Period</th>
              {ACTIVE_DAYS.map(d => (
                <th key={d} className="py-2 px-2 text-center font-semibold text-slate-300 border border-white/[0.06] bg-surface-800/60 min-w-[110px]">
                  {DAYS[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: periodsPerDay }, (_, i) => i + 1).map(pNum => {
              const breakAfter = BREAKS[pNum];
              return (
                <>
                  <tr key={pNum} className="hover:bg-white/[0.015]">
                    <td className="py-1.5 px-2 border border-white/[0.06] bg-surface-900/40">
                      <p className="font-bold text-slate-300">P{pNum}</p>
                      <p className="text-slate-600 text-[10px]">{PERIOD_TIMES[pNum - 1]}</p>
                    </td>
                    {ACTIVE_DAYS.map(d => {
                      const cells = getCells(d, pNum);
                      if (cells.length === 0) {
                        return (
                          <td key={d} className="py-1 px-1 border border-white/[0.06]">
                            <div className="h-10 flex items-center justify-center text-slate-700 text-[10px]">Free</div>
                          </td>
                        );
                      }
                      if (cells.length === 1 && !cells[0].isOptional) {
                        const color = getSubjectColor(cells[0].subject?.name);
                        return (
                          <td key={d} className="py-1 px-1 border border-white/[0.06]">
                            <div className={clsx('rounded-lg p-2 h-full', color.bg, 'border', color.border)}>
                              <p className={clsx('font-bold text-[11px] leading-tight', color.text)}>{cells[0].subject?.name || '—'}</p>
                              <p className="text-slate-400 text-[10px] mt-0.5 truncate">{cells[0].teacher?.name?.split(' ').slice(0, 2).join(' ') || '—'}</p>
                            </div>
                          </td>
                        );
                      }
                      // Split groups — render stacked with group label
                      const groupLabel = cells.find(c => c.groupLabel)?.groupLabel || 'Optional';
                      const isAdditional = cells.some(c => c.isAdditional);
                      return (
                        <td key={d} className="py-1 px-1 border border-white/[0.06]">
                          <div className={clsx('rounded-lg overflow-hidden border', isAdditional ? 'border-purple-500/30' : 'border-amber-500/30')}>
                            <div className={clsx('px-1.5 py-0.5 text-[9px] font-bold text-center tracking-wider', isAdditional ? 'bg-purple-500/10 text-purple-400' : 'bg-amber-500/10 text-amber-400')}>
                              {groupLabel} — SPLIT
                            </div>
                            <div className="divide-y divide-white/[0.06]">
                              {cells.map((cell, ci) => {
                                const color = getSubjectColor(cell.subject?.name);
                                return (
                                  <div key={ci} className={clsx('p-1.5 flex items-center gap-1.5', color.bg)}>
                                    <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', isAdditional ? 'bg-purple-400' : 'bg-amber-400')} />
                                    <div className="min-w-0">
                                      <p className={clsx('font-bold text-[10px] leading-tight truncate', color.text)}>
                                        {cell.subject?.name || '—'}
                                      </p>
                                      <p className="text-slate-400 text-[9px] truncate">
                                        {cell.teacher?.name?.split(' ').slice(-1)[0] || '—'}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  {breakAfter && (
                    <tr key={`br-${pNum}`}>
                      <td colSpan={7} className="py-1 text-center text-slate-600 text-[10px] bg-surface-900/60 border border-white/[0.04] italic">
                        ☕ {breakAfter}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Single Teacher Timetable ──────────────────────────────────────
function TeacherTimetable({ teacher, periods, classes, subjects, school, compact = false }) {
  const teacherPeriods = periods.filter(p => p.teacherId === teacher.id);
  const periodsPerDay = school.periodsPerDay || 8;
  const totalPeriods = teacherPeriods.length;

  const getCell = (day, pNum) => {
    const p = teacherPeriods.find(x => x.day === day && x.period === pNum);
    if (!p) return null;
    return {
      cls: classes.find(c => c.id === p.classId),
      subject: subjects.find(s => s.id === p.subjectId),
    };
  };

  const dailyCounts = ACTIVE_DAYS.map(d => teacherPeriods.filter(p => p.day === d).length);

  return (
    <div className={clsx('mb-8 print-section', compact && 'mb-4')}>
      {/* Teacher header */}
      <div className="flex items-center gap-3 mb-2 pb-2 border-b-2 border-purple-500/40">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-black text-sm">
          {teacher.avatar}
        </div>
        <div className="flex-1">
          <p className="font-black text-white text-base">{teacher.name}</p>
          <p className="text-slate-400 text-xs">
            {teacher.designation} · {teacher.subjects.join(', ')} · {totalPeriods}/{teacher.maxPeriodsPerWeek} periods
          </p>
        </div>
        {/* Daily mini bar */}
        <div className="flex gap-1 items-end">
          {dailyCounts.map((cnt, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-5 bg-surface-700 rounded-t" style={{ height: `${Math.max(4, cnt * 6)}px` }}>
                <div className="w-full bg-purple-500 rounded-t h-full" />
              </div>
              <p className="text-slate-600 text-[8px]">{DAYS[i]?.slice(0,1)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="w-20 py-2 px-2 text-left text-slate-500 font-semibold border border-white/[0.06] bg-surface-800/60">Period</th>
              {ACTIVE_DAYS.map(d => (
                <th key={d} className="py-2 px-2 text-center font-semibold text-slate-300 border border-white/[0.06] bg-surface-800/60 min-w-[110px]">
                  {DAYS[d]}<br /><span className="text-[10px] text-slate-500 font-normal">{dailyCounts[d]} periods</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: periodsPerDay }, (_, i) => i + 1).map(pNum => {
              const breakAfter = BREAKS[pNum];
              return (
                <>
                  <tr key={pNum} className="hover:bg-white/[0.015]">
                    <td className="py-1.5 px-2 border border-white/[0.06] bg-surface-900/40">
                      <p className="font-bold text-slate-300">P{pNum}</p>
                      <p className="text-slate-600 text-[10px]">{PERIOD_TIMES[pNum - 1]}</p>
                    </td>
                    {ACTIVE_DAYS.map(d => {
                      const cell = getCell(d, pNum);
                      const color = cell ? getSubjectColor(cell.subject?.name) : null;
                      return (
                        <td key={d} className="py-1 px-1 border border-white/[0.06]">
                          {cell ? (
                            <div className={clsx('rounded-lg p-2', color?.bg, 'border', color?.border)}>
                              <p className={clsx('font-bold text-[11px] leading-tight', color?.text)}>{cell.subject?.name || '—'}</p>
                              <p className="text-slate-400 text-[10px] mt-0.5">
                                Class {cell.cls?.grade}{cell.cls?.section}
                              </p>
                            </div>
                          ) : (
                            <div className="h-10 flex items-center justify-center text-slate-700 text-[10px]">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {breakAfter && (
                    <tr key={`br-${pNum}`}>
                      <td colSpan={7} className="py-1 text-center text-slate-600 text-[10px] bg-surface-900/60 border border-white/[0.04] italic">
                        ☕ {breakAfter}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Output Page ──────────────────────────────────────────────
export default function TimetableOutputPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const printRef = useRef(null);

  const view = searchParams.get('view') || 'class';
  const { classes, teachers, subjects, school } = useSchoolStore();
  const { periods } = useTimetableStore();

  // Only show entities that have periods
  const activeClassIds = [...new Set(periods.map(p => p.classId))];
  const activeTeacherIds = [...new Set(periods.map(p => p.teacherId))];

  const activeClasses = classes
    .filter(c => activeClassIds.includes(c.id))
    .sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section));

  const activeTeachers = teachers
    .filter(t => activeTeacherIds.includes(t.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        #print-area, #print-area * { visibility: visible !important; }
        #print-area { position: absolute; left: 0; top: 0; width: 100%; }
        .print-no-break { page-break-inside: avoid; }
        body { background: white !important; }
        table { border-collapse: collapse !important; }
        td, th { border: 1px solid #ccc !important; color: #111 !important; background: #fff !important; }
        .period-cell-color { background: #f3f4f6 !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  const isEmpty = periods.length === 0;

  return (
    <div className="p-6 max-w-full animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button onClick={() => navigate('/setup')} className="btn-secondary text-sm">
          <ArrowLeft size={14} /> Setup
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">Timetable Output</h2>
          <p className="text-slate-400 text-xs">{periods.length} periods · {activeClasses.length} classes · {activeTeachers.length} teachers</p>
        </div>

        {/* View toggle */}
        <div className="ml-4 flex gap-1 bg-surface-800 rounded-xl p-1">
          {[
            { id: 'class',   label: 'Class-wise',   icon: GraduationCap },
            { id: 'teacher', label: 'Teacher-wise',  icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id}
              onClick={() => setSearchParams({ view: id })}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                view === id ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              )}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <button onClick={handlePrint} className="btn-secondary text-sm">
            <Printer size={14} /> Print All
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="glass py-20 text-center">
          <GraduationCap size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-white font-bold text-lg">No timetable generated yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-6">Use the Setup Wizard to assign teachers and generate a timetable</p>
          <button onClick={() => navigate('/setup')} className="btn-primary">
            <ChevronRight size={14} /> Go to Setup Wizard
          </button>
        </div>
      ) : (
        <div id="print-area" ref={printRef}>
          {view === 'class' ? (
            <div>
              {/* Group: VI–X */}
              {activeClasses.some(c => c.grade <= 10) && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    <h3 className="text-base font-black text-white px-4 py-1.5 bg-brand-600/20 border border-brand-500/30 rounded-full">
                      Classes VI – X
                    </h3>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                  {activeClasses.filter(c => c.grade >= 6 && c.grade <= 10).map(cls => (
                    <ClassTimetable key={cls.id} cls={cls} periods={periods} teachers={teachers} subjects={subjects} school={school} />
                  ))}
                </div>
              )}
              {/* Group: XI–XII */}
              {activeClasses.some(c => c.grade >= 11) && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    <h3 className="text-base font-black text-white px-4 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-full">
                      Classes XI – XII
                    </h3>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                  {activeClasses.filter(c => c.grade >= 11).map(cls => (
                    <ClassTimetable key={cls.id} cls={cls} periods={periods} teachers={teachers} subjects={subjects} school={school} />
                  ))}
                </div>
              )}
              {/* Lower classes if any */}
              {activeClasses.some(c => c.grade < 6) && (
                <div className="mt-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    <h3 className="text-base font-black text-white px-4 py-1.5 bg-cyan-600/20 border border-cyan-500/30 rounded-full">
                      Classes I – V
                    </h3>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                  {activeClasses.filter(c => c.grade < 6).map(cls => (
                    <ClassTimetable key={cls.id} cls={cls} periods={periods} teachers={teachers} subjects={subjects} school={school} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <h3 className="text-base font-black text-white px-4 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-full">
                  Teacher-wise Timetables ({activeTeachers.length} teachers)
                </h3>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              {activeTeachers.map(teacher => (
                <TeacherTimetable key={teacher.id} teacher={teacher} periods={periods} classes={classes} subjects={subjects} school={school} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
