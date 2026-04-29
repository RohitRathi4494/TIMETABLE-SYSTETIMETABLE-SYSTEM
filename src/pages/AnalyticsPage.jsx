import { useMemo } from 'react';
import { useSchoolStore, useTimetableStore } from '../store';
import { getWorkloadStats, detectConflicts } from '../services/conflictService';
import { DAYS } from '../data/demoData';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, CartesianGrid,
} from 'recharts';

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#22c55e','#f59e0b','#ef4444','#ec4899','#14b8a6'];
const TT = { contentStyle: { background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e2e8f0', fontSize: 12 }, cursor: { fill: 'rgba(255,255,255,0.04)' } };

export default function AnalyticsPage() {
  const { teachers, subjects, classes, rooms } = useSchoolStore();
  const { periods } = useTimetableStore();

  const conflicts = useMemo(() => detectConflicts(periods, teachers, classes, subjects, rooms), [periods, teachers, classes, subjects, rooms]);

  // Daily distribution
  const dailyData = DAYS.map((day, i) => ({
    day: day.slice(0,3),
    periods: periods.filter(p => p.day === i).length,
    classes: [...new Set(periods.filter(p => p.day === i).map(p => p.classId))].length,
  }));

  // Teacher workload
  const workloadData = teachers.map(t => ({
    name: t.name.split(' ').pop(),
    assigned: periods.filter(p => p.teacherId === t.id).length,
    max: t.maxPeriodsPerWeek,
  }));

  // Subject distribution
  const subjectData = subjects.map(s => ({
    name: s.name.length > 10 ? s.name.slice(0,10)+'…' : s.name,
    count: periods.filter(p => p.subjectId === s.id).length,
    target: s.periodsPerWeek * classes.length,
  })).filter(s => s.count > 0);

  // Room utilization
  const roomData = rooms.map(r => ({
    name: r.name,
    utilization: Math.round((periods.filter(p => p.roomId === r.id).length / (6 * 8)) * 100),
    capacity: r.capacity,
  }));

  // Radar scores
  const radarData = [
    { subject: 'Coverage', score: Math.min(100, Math.round((periods.length / (classes.length * 30)) * 100)) },
    { subject: 'Workload', score: Math.max(0, 100 - workloadData.reduce((a, w) => a + Math.abs(w.assigned - w.max/2), 0) / teachers.length) },
    { subject: 'Conflict-free', score: Math.max(0, 100 - conflicts.length * 10) },
    { subject: 'Room Util.', score: Math.round(roomData.reduce((a,r) => a + r.utilization, 0) / Math.max(1, roomData.length)) },
    { subject: 'Balance', score: 85 },
  ];

  // Weekly load trend (mock)
  const trendData = ['Week 1','Week 2','Week 3','Week 4'].map((w, i) => ({
    week: w,
    score: 72 + i * 6 + Math.random() * 4,
  }));

  const overallScore = Math.round(radarData.reduce((a, r) => a + r.score, 0) / radarData.length);

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-6">
      <div className="section-header">
        <div>
          <h2 className="section-title">Analytics</h2>
          <p className="section-subtitle">Timetable performance & optimization insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass px-4 py-2 text-center">
            <p className="text-2xl font-black text-white">{overallScore}</p>
            <p className="text-xs text-slate-400">Overall Score</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radar chart */}
        <div className="glass p-5">
          <p className="text-sm font-bold text-white mb-3">Optimization Score</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fill: '#64748b', fontSize: 9 }} />
              <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily chart */}
        <div className="glass p-5 lg:col-span-2">
          <p className="text-sm font-bold text-white mb-3">Daily Period Distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyData} barSize={28}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:11 }} />
              <Tooltip {...TT} />
              <Bar dataKey="periods" name="Periods" radius={[6,6,0,0]}>
                {dailyData.map((_,i) => <Cell key={i} fill={COLORS[i]} opacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Teacher workload */}
        <div className="glass p-5">
          <p className="text-sm font-bold text-white mb-3">Teacher Workload vs. Maximum</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={workloadData} layout="vertical" barSize={10}>
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:10 }} />
              <YAxis type="category" dataKey="name" width={80} axisLine={false} tickLine={false} tick={{ fill:'#94a3b8', fontSize:10 }} />
              <Tooltip {...TT} />
              <Bar dataKey="max" name="Maximum" fill="rgba(99,102,241,0.15)" radius={[0,4,4,0]} />
              <Bar dataKey="assigned" name="Assigned" fill="#6366f1" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject distribution */}
        <div className="glass p-5">
          <p className="text-sm font-bold text-white mb-3">Subject Distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={subjectData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                {subjectData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...TT} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Room utilization */}
        <div className="glass p-5">
          <p className="text-sm font-bold text-white mb-3">Room Utilization</p>
          <div className="space-y-3">
            {roomData.map((r, i) => (
              <div key={r.name}>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{r.name}</span>
                  <span>{r.utilization}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${r.utilization}%`, background: `${COLORS[i % COLORS.length]}` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trend */}
        <div className="glass p-5">
          <p className="text-sm font-bold text-white mb-3">Optimization Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:10 }} />
              <YAxis domain={[60,100]} axisLine={false} tickLine={false} tick={{ fill:'#64748b', fontSize:10 }} />
              <Tooltip {...TT} />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ fill:'#6366f1', strokeWidth:2, r:4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Periods', value: periods.length, color: 'text-brand-400' },
          { label: 'Conflicts', value: conflicts.length, color: conflicts.length > 0 ? 'text-red-400' : 'text-green-400' },
          { label: 'Teachers Overloaded', value: workloadData.filter(w=>w.assigned>w.max).length, color: 'text-amber-400' },
          { label: 'Coverage %', value: `${Math.min(100, Math.round((periods.length/(classes.length*30))*100))}%`, color: 'text-cyan-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass p-4 text-center">
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-slate-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
