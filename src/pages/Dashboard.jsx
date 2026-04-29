import { useMemo } from 'react';
import {
  Users, GraduationCap, BookOpen, DoorOpen, AlertTriangle, TrendingUp,
  Calendar, CheckCircle, Clock, Zap, ArrowUpRight,
} from 'lucide-react';
import { useSchoolStore, useTimetableStore, useUIStore } from '../store';
import { detectConflicts, getWorkloadStats } from '../services/conflictService';
import { DAYS } from '../data/demoData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#22c55e','#f59e0b','#ef4444'];

export default function Dashboard() {
  const { teachers, subjects, classes, rooms } = useSchoolStore();
  const { periods } = useTimetableStore();
  const { addToast, toggleAIChat } = useUIStore();
  const navigate = useNavigate();

  const conflicts = useMemo(() => detectConflicts(periods, teachers, classes, subjects, rooms), [periods, teachers, classes, subjects, rooms]);

  const dailyData = DAYS.map((day, i) => ({
    day: day.slice(0, 3),
    periods: periods.filter(p => p.day === i).length,
  }));

  const coverage = periods.length > 0
    ? Math.round((periods.length / (classes.length * 6 * 5)) * 100)
    : 0;

  const overloadedTeachers = teachers.filter(t => {
    const count = periods.filter(p => p.teacherId === t.id).length;
    return count > t.maxPeriodsPerWeek;
  });

  const stats = [
    { label: 'Teachers', value: teachers.length, icon: Users, color: 'from-brand-500 to-indigo-600', sub: `${overloadedTeachers.length} overloaded`, link: '/teachers' },
    { label: 'Classes', value: classes.length, icon: GraduationCap, color: 'from-purple-500 to-pink-600', sub: `${classes.reduce((a,c)=>a+c.strength,0)} students`, link: '/classes' },
    { label: 'Subjects', value: subjects.length, icon: BookOpen, color: 'from-cyan-500 to-teal-600', sub: `${subjects.filter(s=>s.type==='practical').length} practicals`, link: '/subjects' },
    { label: 'Rooms', value: rooms.length, icon: DoorOpen, color: 'from-amber-500 to-orange-600', sub: `${rooms.filter(r=>r.type==='lab').length} labs`, link: '/rooms' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Good morning! 👋</h2>
          <p className="text-slate-400 mt-0.5">Sunrise International School · Academic Year 2026-27</p>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleAIChat} className="btn-primary text-sm">
            <Zap size={14} /> Ask AI
          </button>
          <button onClick={() => navigate('/timetable')} className="btn-secondary text-sm">
            <Calendar size={14} /> View Timetable
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, sub, link }) => (
          <button key={label} onClick={() => navigate(link)}
            className="stat-card group text-left w-full">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-slate-300 text-sm font-medium">{label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
            </div>
            <ArrowUpRight size={14} className="text-slate-600 group-hover:text-brand-400 ml-auto self-start transition-colors" />
          </button>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily periods chart */}
        <div className="glass p-5 lg:col-span-2">
          <div className="section-header mb-4">
            <div>
              <p className="section-title text-base">Periods Per Day</p>
              <p className="section-subtitle text-xs">Weekly distribution across all classes</p>
            </div>
            <span className="badge-success badge">{periods.length} total</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyData} barSize={32}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e2e8f0', fontSize: 12 }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="periods" radius={[6,6,0,0]}>
                {dailyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.9} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status cards */}
        <div className="space-y-3">
          {/* Timetable coverage */}
          <div className="glass p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">Timetable Coverage</p>
              <span className={`badge ${coverage >= 80 ? 'badge-success' : coverage >= 50 ? 'badge-warning' : 'badge-critical'}`}>{coverage}%</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${coverage}%` }} /></div>
            <p className="text-xs text-slate-500 mt-2">{periods.length} of ~{classes.length * 30} periods scheduled</p>
          </div>

          {/* Conflict summary */}
          <div className="glass p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className={conflicts.length > 0 ? 'text-red-400' : 'text-green-400'} />
              <p className="text-sm font-semibold text-white">Conflict Status</p>
            </div>
            {conflicts.length === 0 ? (
              <p className="text-green-400 text-xs flex items-center gap-1.5"><CheckCircle size={12} /> All clear! No conflicts detected</p>
            ) : (
              <div className="space-y-1">
                {[['critical','red'], ['warning','amber'], ['info','blue']].map(([sev, col]) => {
                  const count = conflicts.filter(c => c.severity === sev).length;
                  return count > 0 && (
                    <div key={sev} className={`flex items-center justify-between text-xs text-${col}-400`}>
                      <span className="capitalize">{sev}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  );
                })}
                <button onClick={() => useUIStore.getState().toggleConflictPanel()} className="text-xs text-brand-400 hover:text-brand-300 mt-1">View &amp; Resolve →</button>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="glass p-4">
            <p className="text-sm font-semibold text-white mb-2">Quick Actions</p>
            <div className="space-y-1.5">
              {[
                { label: 'Add Teacher Absence', action: () => navigate('/substitutions') },
                { label: 'Generate Timetable', action: () => navigate('/timetable') },
                { label: 'View Analytics', action: () => navigate('/analytics') },
              ].map(({ label, action }) => (
                <button key={label} onClick={action}
                  className="w-full text-left text-xs text-slate-400 hover:text-slate-200 flex items-center gap-2 py-1.5 hover:bg-white/[0.04] rounded-lg px-2 transition-all">
                  <ArrowUpRight size={11} className="text-brand-400" /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Teacher workload overview */}
      <div className="glass p-5">
        <div className="section-header mb-4">
          <div>
            <p className="section-title text-base">Teacher Workload</p>
            <p className="section-subtitle text-xs">Periods allocated vs. maximum per week</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {teachers.slice(0, 8).map(t => {
            const assigned = periods.filter(p => p.teacherId === t.id).length;
            const pct = Math.min(100, Math.round((assigned / t.maxPeriodsPerWeek) * 100));
            const isOver = assigned > t.maxPeriodsPerWeek;
            return (
              <div key={t.id} className="bg-surface-800/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {t.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{t.name.split(' ').slice(-1)[0]}</p>
                    <p className="text-[10px] text-slate-500">{t.designation}</p>
                  </div>
                </div>
                <div className="progress-bar mb-1">
                  <div className={`progress-fill ${isOver ? 'bg-gradient-to-r from-red-500 to-orange-500' : ''}`} style={{ width: `${pct}%` }} />
                </div>
                <p className={`text-[10px] font-semibold ${isOver ? 'text-red-400' : 'text-slate-400'}`}>{assigned}/{t.maxPeriodsPerWeek} periods</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
