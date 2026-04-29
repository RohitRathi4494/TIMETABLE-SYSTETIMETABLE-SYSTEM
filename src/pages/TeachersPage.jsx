import { useState } from 'react';
import { Plus, Search, Edit3, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useSchoolStore, useTimetableStore, useUIStore } from '../store';
import { Modal, ConfirmDialog, Avatar, Badge, ProgressBar } from '../components/shared';
import { getWorkloadStats } from '../services/conflictService';
import { clsx } from 'clsx';

const DESIGNATIONS = ['PGT', 'TGT', 'PRT', 'Lecturer', 'HOD'];
const ALL_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'History', 'Geography', 'Computer Science', 'Physical Education', 'Economics', 'Social Science'];

function TeacherForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', employeeId: '', designation: 'TGT', subjects: [],
    maxPeriodsPerWeek: 24, maxConsecutive: 3, isPartTime: false,
    email: '', phone: '', avatar: '', ...initial,
  });

  const f = (key) => ({ value: form[key], onChange: e => setForm(s => ({ ...s, [key]: e.target.value })) });

  const toggleSubject = (s) => setForm(prev => ({
    ...prev,
    subjects: prev.subjects.includes(s) ? prev.subjects.filter(x => x !== s) : [...prev.subjects, s],
  }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, avatar: form.name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0,2) });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Full Name *</label><input className="input" placeholder="Mr. Rajesh Sharma" {...f('name')} /></div>
        <div><label className="label">Employee ID</label><input className="input" placeholder="EMP001" {...f('employeeId')} /></div>
        <div>
          <label className="label">Designation</label>
          <select className="select" {...f('designation')}>
            {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div><label className="label">Email</label><input className="input" type="email" placeholder="teacher@school.in" {...f('email')} /></div>
        <div><label className="label">Max Periods/Week</label><input className="input" type="number" min={1} max={40} {...f('maxPeriodsPerWeek')} /></div>
        <div><label className="label">Max Consecutive</label><input className="input" type="number" min={1} max={6} {...f('maxConsecutive')} /></div>
      </div>
      <div>
        <label className="label">Subjects</label>
        <div className="flex flex-wrap gap-2">
          {ALL_SUBJECTS.map(s => (
            <button key={s} type="button" onClick={() => toggleSubject(s)}
              className={clsx('px-2.5 py-1 rounded-lg text-xs font-medium transition-all border', form.subjects.includes(s) ? 'bg-brand-600 text-white border-brand-500' : 'bg-surface-800 text-slate-400 border-white/[0.06] hover:border-brand-500/40')}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="partTime" checked={form.isPartTime} onChange={e => setForm(s => ({ ...s, isPartTime: e.target.checked }))} className="w-4 h-4 rounded accent-brand-500" />
        <label htmlFor="partTime" className="text-sm text-slate-300">Part-time teacher</label>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave}>Save Teacher</button>
      </div>
    </div>
  );
}

export default function TeachersPage() {
  const { teachers, addTeacher, updateTeacher, deleteTeacher } = useSchoolStore();
  const { periods } = useTimetableStore();
  const { addToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.subjects.some(s => s.toLowerCase().includes(search.toLowerCase())));

  const handleSave = (data) => {
    if (modal === 'add') { addTeacher(data); addToast({ type: 'success', message: `${data.name} added` }); }
    else { updateTeacher(editTarget.id, data); addToast({ type: 'success', message: 'Teacher updated' }); }
    setModal(null); setEditTarget(null);
  };

  const handleDelete = () => {
    deleteTeacher(deleteTarget.id);
    addToast({ type: 'warning', message: `${deleteTarget.name} removed` });
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">Teachers</h2>
          <p className="section-subtitle">{teachers.length} teachers · {teachers.filter(t=>t.isPartTime).length} part-time</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}><Plus size={14} /> Add Teacher</button>
      </div>

      <div className="glass overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input pl-8" placeholder="Search teachers or subjects..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Subjects</th>
              <th>Designation</th>
              <th>Workload</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const assigned = periods.filter(p => p.teacherId === t.id).length;
              const pct = Math.round((assigned / t.maxPeriodsPerWeek) * 100);
              const isOver = assigned > t.maxPeriodsPerWeek;
              const isExpanded = expandedId === t.id;
              const stats = getWorkloadStats(t.id, periods);

              return (
                <>
                  <tr key={t.id} className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar initials={t.avatar} />
                        <div>
                          <p className="font-semibold text-white text-sm">{t.name}</p>
                          <p className="text-slate-500 text-xs">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {t.subjects.slice(0,2).map(s => <span key={s} className="badge-purple badge">{s}</span>)}
                        {t.subjects.length > 2 && <span className="badge-info badge">+{t.subjects.length-2}</span>}
                      </div>
                    </td>
                    <td><span className="badge-info badge">{t.designation}</span></td>
                    <td className="w-32">
                      <p className={clsx('text-xs font-semibold mb-1', isOver ? 'text-red-400' : 'text-slate-300')}>{assigned}/{t.maxPeriodsPerWeek}</p>
                      <div className="progress-bar"><div className={clsx('progress-fill', isOver && 'bg-gradient-to-r from-red-500 to-orange-500')} style={{width:`${Math.min(pct,100)}%`}}/></div>
                    </td>
                    <td>
                      <Badge type={t.isPartTime ? 'warning' : 'success'}>{t.isPartTime ? 'Part-time' : 'Full-time'}</Badge>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button className="btn-icon" onClick={() => { setEditTarget(t); setModal('edit'); }}>
                          <Edit3 size={13} className="text-slate-400" />
                        </button>
                        <button className="btn-icon" onClick={() => setDeleteTarget(t)}>
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                        {isExpanded ? <ChevronUp size={13} className="text-slate-500 mt-2" /> : <ChevronDown size={13} className="text-slate-500 mt-2" />}
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`exp-${t.id}`}>
                      <td colSpan={6} className="bg-surface-900/50 px-6 py-4">
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-slate-400 mb-1 font-semibold">Daily Distribution</p>
                            <div className="flex gap-2">
                              {stats.dailyCounts.map(d => (
                                <div key={d.day} className="text-center">
                                  <div className="w-8 bg-surface-700 rounded-full overflow-hidden" style={{height:40}}>
                                    <div className="bg-brand-500 rounded-full transition-all" style={{height:`${(d.count/8)*40}px`, marginTop:`${40-(d.count/8)*40}px`}} />
                                  </div>
                                  <p className="text-slate-500 mt-1">{['M','T','W','T','F','S'][d.day]}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-slate-400 font-semibold">Stats</p>
                            <p className="text-slate-300">Gap periods: <strong className="text-white">{stats.gapPeriods}</strong></p>
                            <p className="text-slate-300">Max consecutive: <strong className="text-white">{stats.maxConsec}</strong></p>
                            <p className="text-slate-300">Balance score: <strong className="text-amber-400">{stats.balanceScore}/10</strong></p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-semibold mb-1">Subjects</p>
                            <div className="flex flex-wrap gap-1">{t.subjects.map(s => <span key={s} className="badge-purple badge">{s}</span>)}</div>
                            <p className="text-slate-400 mt-2 font-semibold">Part-time</p>
                            <p className="text-slate-300">{t.isPartTime ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-slate-400 text-sm">No teachers found</div>}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Teacher' : 'Edit Teacher'} onClose={() => { setModal(null); setEditTarget(null); }} size="lg">
          <TeacherForm initial={editTarget || {}} onSave={handleSave} onClose={() => { setModal(null); setEditTarget(null); }} />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Teacher"
          message={`Are you sure you want to remove ${deleteTarget.name}? All their assigned periods will be affected.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          confirmText="Delete"
          danger
        />
      )}
    </div>
  );
}
