import { useState } from 'react';
import { School, Clock, Calendar, Save, Plus, Trash2 } from 'lucide-react';
import { useSchoolStore, useUIStore } from '../store';
import { PERIOD_TIMES, BREAKS, DAYS } from '../data/demoData';
import { clsx } from 'clsx';

export default function SettingsPage() {
  const { school, updateSchool } = useSchoolStore();
  const { addToast } = useUIStore();
  const [form, setForm] = useState({ ...school });
  const [tab, setTab] = useState('school');

  const f = k => ({ value: form[k] || '', onChange: e => setForm(s => ({...s, [k]: e.target.value})) });

  const save = () => {
    updateSchool(form);
    addToast({ type: 'success', title: 'Settings Saved', message: 'School configuration updated' });
  };

  const tabs = [
    { id: 'school', label: 'School Profile', icon: School },
    { id: 'periods', label: 'Period Structure', icon: Clock },
    { id: 'workdays', label: 'Working Days', icon: Calendar },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">Settings</h2>
          <p className="section-subtitle">Configure your school timetable settings</p>
        </div>
        <button className="btn-primary" onClick={save}><Save size={14} /> Save Changes</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-800 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all', tab === id ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200')}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'school' && (
        <div className="glass p-6 space-y-4">
          <h3 className="text-white font-bold">School Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">School Name</label><input className="input" placeholder="Sunrise International School" {...f('name')} /></div>
            <div>
              <label className="label">Board Affiliation</label>
              <select className="select" {...f('board')}>
                {['CBSE','ICSE','IGCSE','State Board','IB'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div><label className="label">Academic Year</label><input className="input" placeholder="2026-27" {...f('academicYear')} /></div>
            <div className="col-span-2"><label className="label">Address</label><textarea className="input" rows={2} {...f('address')} /></div>
            <div><label className="label">Contact Email</label><input className="input" type="email" {...f('email')} /></div>
            <div><label className="label">Phone</label><input className="input" {...f('phone')} /></div>
          </div>
        </div>
      )}

      {tab === 'periods' && (
        <div className="glass p-6">
          <h3 className="text-white font-bold mb-4">Period Structure</h3>
          <div className="space-y-2">
            {PERIOD_TIMES.map((time, i) => {
              const breakAfter = BREAKS[i + 1];
              return (
                <div key={i}>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50">
                    <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-400">
                      P{i+1}
                    </div>
                    <p className="text-slate-300 text-sm font-medium">{time}</p>
                    <p className="text-slate-500 text-xs ml-auto">Period {i+1}</p>
                  </div>
                  {breakAfter && (
                    <div className="flex items-center gap-2 px-3 py-1.5 my-1">
                      <div className="h-px flex-1 bg-white/[0.06]" />
                      <p className="text-xs text-slate-500">☕ {breakAfter}</p>
                      <div className="h-px flex-1 bg-white/[0.06]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="label mb-0">Periods per day:</label>
            <select className="select w-24" value={form.periodsPerDay || 8} onChange={e => setForm(s => ({...s, periodsPerDay: parseInt(e.target.value)}))}>
              {[6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      )}

      {tab === 'workdays' && (
        <div className="glass p-6">
          <h3 className="text-white font-bold mb-4">Working Days</h3>
          <div className="grid grid-cols-2 gap-3">
            {DAYS.map(day => {
              const key = day.toLowerCase();
              const isActive = form.workingDays?.[key] !== false;
              return (
                <button key={day} onClick={() => setForm(s => ({ ...s, workingDays: { ...s.workingDays, [key]: !isActive } }))}
                  className={clsx('flex items-center gap-3 p-4 rounded-xl border transition-all', isActive ? 'bg-brand-600/10 border-brand-500/30 text-white' : 'bg-surface-800/30 border-white/[0.05] text-slate-500')}>
                  <div className={clsx('w-5 h-5 rounded flex items-center justify-center text-xs', isActive ? 'bg-brand-600' : 'bg-surface-700')}>
                    {isActive && '✓'}
                  </div>
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
