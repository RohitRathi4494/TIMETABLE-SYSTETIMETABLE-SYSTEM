import { useState } from 'react';
import { Plus, Search, Edit3, Trash2, Users } from 'lucide-react';
import { useSchoolStore, useUIStore } from '../store';
import { Modal, ConfirmDialog, Badge } from '../components/shared';

const GRADES = [1,2,3,4,5,6,7,8,9,10,11,12];
const SECTIONS = ['A','B','C','D','E'];
const ALL_SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','Hindi','History','Geography','Computer Science','Physical Education','Economics','Social Science'];

function ClassForm({ initial = {}, teachers, subjects, rooms, onSave, onClose }) {
  const [form, setForm] = useState({ grade: 10, section: 'A', strength: 40, roomId: '', classTeacherId: '', subjects: [], ...initial });
  const f = k => ({ value: form[k], onChange: e => setForm(s => ({ ...s, [k]: e.target.value })) });
  const toggleSubject = (sid) => setForm(prev => ({
    ...prev, subjects: prev.subjects.includes(sid) ? prev.subjects.filter(x=>x!==sid) : [...prev.subjects, sid]
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Grade</label>
          <select className="select" value={form.grade} onChange={e => setForm(s => ({...s, grade: parseInt(e.target.value)}))}>
            {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Section</label>
          <select className="select" value={form.section} onChange={e => setForm(s => ({...s, section: e.target.value}))}>
            {SECTIONS.map(sec => <option key={sec}>{sec}</option>)}
          </select>
        </div>
        <div><label className="label">Strength</label><input className="input" type="number" min={1} max={60} {...f('strength')} /></div>
        <div>
          <label className="label">Class Teacher</label>
          <select className="select" {...f('classTeacherId')}>
            <option value="">— Select —</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Assigned Room</label>
          <select className="select" {...f('roomId')}>
            <option value="">— Select —</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Subjects</label>
        <div className="flex flex-wrap gap-2">
          {subjects.map(s => (
            <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${form.subjects.includes(s.id) ? 'bg-brand-600 text-white border-brand-500' : 'bg-surface-800 text-slate-400 border-white/[0.06] hover:border-brand-500/40'}`}>
              {s.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => onSave(form)}>Save Class</button>
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const { classes, addClass, updateClass, deleteClass, teachers, subjects, rooms } = useSchoolStore();
  const { addToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = classes.filter(c => `${c.grade}${c.section}`.toLowerCase().includes(search.toLowerCase()) || `grade ${c.grade}`.includes(search.toLowerCase()));
  const byGrade = filtered.reduce((acc, c) => { (acc[c.grade] = acc[c.grade] || []).push(c); return acc; }, {});

  const handleSave = (data) => {
    if (modal === 'add') { addClass(data); addToast({ type: 'success', message: `Class ${data.grade}${data.section} added` }); }
    else { updateClass(editTarget.id, data); addToast({ type: 'success', message: 'Class updated' }); }
    setModal(null); setEditTarget(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">Classes</h2>
          <p className="section-subtitle">{classes.length} sections · {classes.reduce((a,c) => a+c.strength,0)} total students</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}><Plus size={14} /> Add Class</button>
      </div>

      <div className="glass overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input pl-8" placeholder="Search classes..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {Object.entries(byGrade).sort(([a],[b]) => Number(a)-Number(b)).map(([grade, cls]) => (
          <div key={grade}>
            <div className="px-4 py-2 bg-surface-900/40 border-b border-white/[0.04]">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grade {grade}</p>
            </div>
            <table className="data-table">
              <tbody>
                {cls.map(c => {
                  const ct = teachers.find(t => t.id === c.classTeacherId);
                  const room = rooms.find(r => r.id === c.roomId);
                  return (
                    <tr key={c.id}>
                      <td className="w-24">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                          {c.grade}{c.section}
                        </div>
                      </td>
                      <td>
                        <p className="font-semibold text-white">Class {c.grade}{c.section}</p>
                        <p className="text-slate-500 text-xs flex items-center gap-1"><Users size={10} /> {c.strength} students</p>
                      </td>
                      <td><p className="text-slate-300 text-sm">{ct?.name || '—'}</p><p className="text-slate-500 text-xs">Class Teacher</p></td>
                      <td><p className="text-slate-300 text-sm">{room?.name || '—'}</p><p className="text-slate-500 text-xs">Home Room</p></td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {c.subjects.slice(0,3).map(sid => { const s = subjects.find(x=>x.id===sid); return s ? <span key={sid} className="badge-purple badge">{s.name}</span> : null; })}
                          {c.subjects.length > 3 && <span className="badge-info badge">+{c.subjects.length-3}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn-icon" onClick={() => { setEditTarget(c); setModal('edit'); }}><Edit3 size={13} className="text-slate-400" /></button>
                          <button className="btn-icon" onClick={() => setDeleteTarget(c)}><Trash2 size={13} className="text-red-400" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
        {filtered.length === 0 && <div className="py-12 text-center text-slate-400 text-sm">No classes found</div>}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Class' : 'Edit Class'} onClose={() => { setModal(null); setEditTarget(null); }} size="lg">
          <ClassForm initial={editTarget || {}} teachers={teachers} subjects={subjects} rooms={rooms} onSave={handleSave} onClose={() => { setModal(null); setEditTarget(null); }} />
        </Modal>
      )}
      {deleteTarget && (
        <ConfirmDialog title="Delete Class" message={`Delete Class ${deleteTarget.grade}${deleteTarget.section}?`} onConfirm={() => { deleteClass(deleteTarget.id); addToast({ type: 'warning', message: 'Class removed' }); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} confirmText="Delete" danger />
      )}
    </div>
  );
}
