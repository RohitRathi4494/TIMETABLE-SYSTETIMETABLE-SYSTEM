import { useState } from 'react';
import { useSchoolStore, useTimetableStore } from '../store';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';
import { DAYS, PERIOD_TIMES, BREAKS, getSubjectColor } from '../data/demoData';
import { clsx } from 'clsx';
import { Zap, LogOut, CalendarDays, Clock, BookOpen, GraduationCap, Printer, User } from 'lucide-react';

const ACTIVE_DAYS = [0, 1, 2, 3, 4, 5]; // Mon–Sat

export default function TeacherView() {
  const { currentUser, userProfile } = useAuth();
  const { teachers, subjects, classes, school } = useSchoolStore();
  const { periods } = useTimetableStore();

  // Find the teacher linked to this user account
  const teacher = teachers.find(
    (t) => t.id === userProfile?.teacherId || t.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  );

  const teacherPeriods = teacher
    ? periods.filter((p) => p.teacherId === teacher.id)
    : [];

  const periodsPerDay = school?.periodsPerDay || 8;

  const getCell = (day, pNum) => {
    const p = teacherPeriods.find((x) => x.day === day && x.period === pNum);
    if (!p) return null;
    return {
      cls: classes.find((c) => c.id === p.classId),
      subject: subjects.find((s) => s.id === p.subjectId),
    };
  };

  const totalPeriods = teacherPeriods.length;
  const periodsToday = teacherPeriods.filter((p) => p.day === new Date().getDay() - 1).length;

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Header */}
      <header className="h-14 flex items-center gap-4 px-6 border-b border-white/[0.06] bg-surface-900/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">EduSchedule AI</p>
            <p className="text-brand-400 text-[10px] font-semibold">Teacher Portal</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* User info */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-[11px]">
              {teacher?.avatar || userProfile?.name?.[0]?.toUpperCase() || <User size={12} />}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-slate-200 font-semibold leading-none">{teacher?.name || userProfile?.name || currentUser?.email}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Teacher · Read Only</p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="btn-secondary text-xs px-3 py-1.5 print:hidden"
            title="Print Timetable"
          >
            <Printer size={13} /> Print
          </button>

          <button
            id="teacher-logout-btn"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all print:hidden"
            title="Sign Out"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">

        {/* Welcome Banner */}
        <div className="mb-6 flex items-start gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-black text-white">
              {teacher ? `Welcome, ${teacher.name.split(' ')[0]}!` : 'Your Timetable'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {teacher?.designation} · {teacher?.subjects?.join(', ')}
            </p>
          </div>

          {/* Stats */}
          <div className="ml-auto flex gap-3 flex-wrap">
            {[
              { label: 'Total Periods/Week', value: totalPeriods, icon: CalendarDays, color: 'text-brand-400' },
              { label: "Today's Periods", value: periodsToday, icon: Clock, color: 'text-green-400' },
              { label: 'Max Periods/Week', value: teacher?.maxPeriodsPerWeek || '—', icon: BookOpen, color: 'text-purple-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass px-4 py-3 rounded-2xl min-w-[130px] text-center">
                <Icon size={18} className={clsx('mx-auto mb-1', color)} />
                <p className="text-xl font-black text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* No teacher linked warning */}
        {!teacher && (
          <div className="glass p-8 text-center rounded-2xl mb-6">
            <GraduationCap size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-white font-bold text-lg">Timetable Not Linked</p>
            <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
              Your account ({currentUser?.email}) is not yet linked to a teacher profile.
              Please contact your administrator to link your account.
            </p>
          </div>
        )}

        {/* Timetable Grid */}
        {teacher && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <CalendarDays size={18} className="text-brand-400" />
              <h3 className="font-bold text-white">Weekly Timetable</h3>
              <span className="text-xs text-slate-500">Academic Year {school?.academicYear || '2026-27'}</span>
            </div>

            <div className="overflow-x-auto p-4">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="w-24 py-2 px-3 text-left text-slate-500 font-semibold border border-white/[0.06] bg-surface-800/60">
                      Period
                    </th>
                    {ACTIVE_DAYS.map((d) => (
                      <th key={d} className="py-2 px-2 text-center font-semibold text-slate-300 border border-white/[0.06] bg-surface-800/60 min-w-[120px]">
                        {DAYS[d]}
                        <br />
                        <span className="text-[10px] text-slate-500 font-normal">
                          {teacherPeriods.filter((p) => p.day === d).length} periods
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: periodsPerDay }, (_, i) => i + 1).map((pNum) => {
                    const breakAfter = BREAKS[pNum];
                    return (
                      <>
                        <tr key={pNum} className="hover:bg-white/[0.015] transition-colors">
                          <td className="py-2 px-3 border border-white/[0.06] bg-surface-900/40">
                            <p className="font-bold text-slate-300">P{pNum}</p>
                            <p className="text-slate-600 text-[10px] mt-0.5">{PERIOD_TIMES[pNum - 1]}</p>
                          </td>
                          {ACTIVE_DAYS.map((d) => {
                            const cell = getCell(d, pNum);
                            const color = cell ? getSubjectColor(cell.subject?.name) : null;
                            return (
                              <td key={d} className="py-1 px-1 border border-white/[0.06]">
                                {cell ? (
                                  <div className={clsx('rounded-xl p-2.5 h-full border transition-all', color?.bg, color?.border)}>
                                    <p className={clsx('font-bold text-[12px] leading-tight', color?.text)}>
                                      {cell.subject?.name || '—'}
                                    </p>
                                    <p className="text-slate-400 text-[10px] mt-1 flex items-center gap-1">
                                      <GraduationCap size={9} />
                                      Class {cell.cls?.grade}{cell.cls?.section}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="h-12 flex items-center justify-center text-slate-700 text-[10px] rounded-xl">
                                    —
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        {breakAfter && (
                          <tr key={`br-${pNum}`}>
                            <td colSpan={7} className="py-1.5 text-center text-slate-500 text-[11px] bg-surface-900/60 border border-white/[0.04] italic font-medium">
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
        )}

        {/* Subject legend */}
        {teacher && teacher.subjects?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-500">Subjects:</span>
            {teacher.subjects.map((subName) => {
              const color = getSubjectColor(subName);
              return (
                <span key={subName} className={clsx('px-3 py-1 rounded-full text-xs font-semibold border', color.bg, color.text, color.border)}>
                  {subName}
                </span>
              );
            })}
          </div>
        )}

        <p className="text-center text-slate-700 text-xs mt-8">
          EduSchedule AI · Teacher Portal · View Only · Contact admin to make changes
        </p>
      </main>
    </div>
  );
}
