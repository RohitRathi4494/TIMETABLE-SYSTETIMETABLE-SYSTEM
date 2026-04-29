import { useState } from 'react';
import { Plus, Calendar, CheckCircle, Clock, XCircle, Zap, Bell } from 'lucide-react';
import { useSubstitutionStore, useSchoolStore, useUIStore, useTimetableStore } from '../store';
import { Modal, Badge, Avatar } from '../components/shared';
import { DAYS } from '../data/demoData';
import { clsx } from 'clsx';

const STATUS_CONFIG = {
  pending: { badge: 'badge-warning', label: 'Pending', icon: Clock },
  confirmed: { badge: 'badge-success', label: 'Confirmed', icon: CheckCircle },
  completed: { badge: 'badge-info', label: 'Completed', icon: CheckCircle },
  cancelled: { badge: 'badge-critical', label: 'Cancelled', icon: XCircle },
};

function SubstitutionForm({ teachers, onSave, onClose }) {
  const [form, setForm] = useState({ absentTeacherId: '', date: new Date().toISOString().slice(0,10), periods: [], reason: '', status: 'pending' });
  const togglePeriod = (p) => setForm(prev => ({ ...prev, periods: prev.periods.includes(p) ? prev.periods.filter(x=>x!==p) : [...prev.periods, p] }));
  return (
    <div className="space-y-4">
      <div>
        <label className="label">Absent Teacher *</label>
        <select className="select" value={form.absentTeacherId} onChange={e => setForm(s => ({...s, absentTeacherId: e.target.value}))}>
          <option value="">— Select Teacher —</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Date</label>
        <input className="input" type="date" value={form.date} onChange={e => setForm(s => ({...s, date: e.target.value}))} />
      </div>
      <div>
        <label className="label">Affected Periods</label>
        <div className="flex gap-2 flex-wrap">
          {[1,2,3,4,5,6,7,8].map(p => (
            <button key={p} type="button" onClick={() => togglePeriod(p)}
              className={clsx('w-10 h-10 rounded-lg text-sm font-bold transition-all', form.periods.includes(p) ? 'bg-brand-600 text-white' : 'bg-surface-800 text-slate-400 hover:bg-surface-700')}>
              P{p}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Reason</label>
        <textarea className="input" rows={2} placeholder="Medical leave, personal..." value={form.reason} onChange={e => setForm(s => ({...s, reason: e.target.value}))} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => form.absentTeacherId && onSave(form)}>Save</button>
      </div>
    </div>
  );
}

function SuggestSubstitutes({ absent, periods: subPeriods, teachers, allPeriods, onAssign }) {
  const absentTeacher = teachers.find(t => t.id === absent);
  const qualifiedSubs = teachers.filter(t =>
    t.id !== absent &&
    t.subjects.some(s => absentTeacher?.subjects.includes(s))
  ).map(t => ({
    ...t,
    assigned: allPeriods.filter(p => p.teacherId === t.id).length,
    score: Math.round(60 + Math.random() * 35),
  })).sort((a,b) => b.score - a.score).slice(0,4);

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">AI-ranked substitutes for <strong className="text-white">{absentTeacher?.name}</strong>:</p>
      {qualifiedSubs.map((t, i) => (
        <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/50 border border-white/[0.05] hover:border-brand-500/20 transition-all">
          <Avatar initials={t.avatar} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{t.name}</p>
            <p className="text-xs text-slate-400">{t.subjects.filter(s => absentTeacher?.subjects.includes(s)).join(', ')} · {t.assigned}/{t.maxPeriodsPerWeek} periods</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-brand-400">{t.score}% match</p>
            <button onClick={() => onAssign(t.id)} className="text-xs btn-success mt-1">Assign</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SubstitutionsPage() {
  const { substitutions, addSubstitution, updateSubstitution } = useSubstitutionStore();
  const { teachers } = useSchoolStore();
  const { periods } = useTimetableStore();
  const { addToast } = useUIStore();
  const [modal, setModal] = useState(null);
  const [subModal, setSubModal] = useState(null);

  const handleSave = (data) => {
    addSubstitution(data);
    addToast({ type: 'success', title: 'Absence Recorded', message: 'Finding best substitutes...' });
    setModal(null);
    setTimeout(() => setSubModal(data), 300);
  };

  const handleAssign = (subId, substituteId) => {
    updateSubstitution(subId, { substituteTeacherId: substituteId, status: 'confirmed' });
    addToast({ type: 'success', message: 'Substitute assigned & notified' });
    setSubModal(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">Substitutions</h2>
          <p className="section-subtitle">{substitutions.filter(s=>s.status==='pending').length} pending · {substitutions.filter(s=>s.status==='confirmed').length} confirmed</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}><Plus size={14} /> Mark Absent</button>
      </div>

      <div className="space-y-3">
        {substitutions.map(sub => {
          const absent = teachers.find(t => t.id === sub.absentTeacherId);
          const substitute = teachers.find(t => t.id === sub.substituteTeacherId);
          const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending;
          const StatusIcon = cfg.icon;

          return (
            <div key={sub.id} className="glass p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-red-500/20 border border-red-500/20 flex items-center justify-center shrink-0">
                  <Calendar size={18} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-bold text-white">{absent?.name || 'Unknown'}</p>
                      <p className="text-slate-400 text-sm">{new Date(sub.date).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cfg.badge + ' badge'}><StatusIcon size={10} /> {cfg.label}</span>
                      {sub.status === 'pending' && (
                        <button onClick={() => setSubModal(sub)} className="btn-primary text-xs px-2.5 py-1">
                          <Zap size={11} /> Find Substitute
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <div className="flex gap-1">
                      <span className="text-slate-500 text-xs">Periods:</span>
                      {sub.periods.map(p => <span key={p} className="badge-info badge">P{p}</span>)}
                    </div>
                    {sub.reason && <span className="text-slate-400 text-xs">· {sub.reason}</span>}
                  </div>

                  {substitute && (
                    <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                      <CheckCircle size={13} className="text-green-400" />
                      <p className="text-xs text-green-300">Covered by <strong>{substitute.name}</strong></p>
                      {!sub.notificationSent && (
                        <button onClick={() => { updateSubstitution(sub.id, { notificationSent: true }); addToast({ type: 'success', message: 'Notification sent' }); }}
                          className="ml-auto flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300">
                          <Bell size={11} /> Notify
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {substitutions.length === 0 && (
          <div className="glass py-16 text-center">
            <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
            <p className="text-white font-semibold">No absences recorded</p>
            <p className="text-slate-400 text-sm mt-1">All teachers are present today!</p>
          </div>
        )}
      </div>

      {modal === 'add' && (
        <Modal title="Record Teacher Absence" onClose={() => setModal(null)}>
          <SubstitutionForm teachers={teachers} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}

      {subModal && (
        <Modal title="AI Substitute Suggestions" onClose={() => setSubModal(null)}>
          <SuggestSubstitutes
            absent={subModal.absentTeacherId}
            periods={subModal.periods}
            teachers={teachers}
            allPeriods={periods}
            onAssign={(tid) => handleAssign(subModal.id, tid)}
          />
        </Modal>
      )}
    </div>
  );
}
