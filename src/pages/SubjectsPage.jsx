import { useState } from 'react';
import { Plus, Search, Edit3, Trash2, FlaskConical, BookOpen, Dumbbell } from 'lucide-react';
import { useSchoolStore, useUIStore } from '../store';
import { Modal, ConfirmDialog, Badge } from '../components/shared';
import { getSubjectColor } from '../data/demoData';

const TYPES = ['theory', 'practical', 'lab'];
const TYPE_ICONS = { theory: BookOpen, practical: FlaskConical, lab: FlaskConical };
const TYPE_COLORS = { theory: 'badge-info', practical: 'badge-purple', lab: 'badge-warning' };

function SubjectForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({ name: '', code: '', type: 'theory', periodsPerWeek: 5, requiresConsecutive: false, maxConsecutive: 2, isDifficult: false, ...initial });
  const f = k => ({ value: form[k], onChange: e => setForm(s => ({ ...s, [k]: e.target.value })) });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Subject Name *</label><input className="input" placeholder="Mathematics" {...f('name')} /></div>
        <div><label className="label">Code</label><input className="input" placeholder="MATH" {...f('code')} /></div>
        <div>
          <label className="label">Type</label>
          <select className="select" {...f('type')}>{TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select>
        </div>
        <div>
          <label className="label">Default Periods / Week</label>
          <input className="input" type="number" min={1} max={12} {...f('periodsPerWeek')} />
          <p className="text-slate-500 text-[10px] mt-1">Used as a starting value. You can override per-class in the Setup Wizard.</p>
        </div>
        <div>
          <label className="label">Max Consecutive Periods</label>
          <input className="input" type="number" min={1} max={4} {...f('maxConsecutive')} />
        </div>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" checked={form.requiresConsecutive} onChange={e => setForm(s => ({...s, requiresConsecutive: e.target.checked}))} className="accent-brand-500 w-4 h-4 rounded" />
          Requires consecutive periods
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" checked={form.isDifficult} onChange={e => setForm(s => ({...s, isDifficult: e.target.checked}))} className="accent-brand-500 w-4 h-4 rounded" />
          Prefer morning slots (difficult)
        </label>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => onSave(form)}>Save Subject</button>
      </div>
    </div>
  );
}

export default function SubjectsPage() {
  const { subjects, addSubject, updateSubject, deleteSubject } = useSchoolStore();
  const { addToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.code?.toLowerCase().includes(search.toLowerCase()));

  const handleSave = (data) => {
    if (modal === 'add') { addSubject(data); addToast({ type: 'success', message: `${data.name} added` }); }
    else { updateSubject(editTarget.id, data); addToast({ type: 'success', message: 'Subject updated' }); }
    setModal(null); setEditTarget(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">Subjects</h2>
          <p className="section-subtitle">{subjects.length} subjects · {subjects.filter(s=>s.isDifficult).length} marked difficult</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}><Plus size={14} /> Add Subject</button>
      </div>

      {/* Info banner */}
      <div className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20">
        <span className="text-brand-400 text-lg leading-none mt-0.5">ℹ️</span>
        <div>
          <p className="text-brand-300 text-sm font-semibold">
            Periods/Week shown here are defaults only
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            Each subject can have a <strong className="text-slate-300">different number of periods per class</strong> (e.g. Math may have 6 periods in Class XI but 4 in Class VI).
            Set the actual count per class in the <span className="text-brand-400 font-semibold">Setup Wizard → Assignments</span> step.
          </p>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input pl-8" placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filtered.map(s => {
            const color = getSubjectColor(s.name);
            const Icon = TYPE_ICONS[s.type] || BookOpen;
            return (
              <div key={s.id} className={`rounded-xl border p-4 ${color.bg} ${color.border} group relative`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl ${color.bg} border ${color.border} flex items-center justify-center`}>
                      <Icon size={16} className={color.text} />
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${color.text}`}>{s.name}</p>
                      <p className="text-slate-500 text-xs">{s.code}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="btn-icon" onClick={() => { setEditTarget(s); setModal('edit'); }}><Edit3 size={12} className="text-slate-400" /></button>
                    <button className="btn-icon" onClick={() => setDeleteTarget(s)}><Trash2 size={12} className="text-red-400" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={TYPE_COLORS[s.type] + ' badge'}>{s.type}</span>
                  <div className="flex gap-2">
                    <span className="badge-info badge" title="Default — override per class in Setup Wizard">~{s.periodsPerWeek} /wk default</span>
                    {s.isDifficult && <span className="badge-warning badge">⭐ Morning</span>}
                    {s.requiresConsecutive && <span className="badge-purple badge">Consecutive</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && <div className="py-12 text-center text-slate-400 text-sm">No subjects found</div>}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Subject' : 'Edit Subject'} onClose={() => { setModal(null); setEditTarget(null); }}>
          <SubjectForm initial={editTarget || {}} onSave={handleSave} onClose={() => { setModal(null); setEditTarget(null); }} />
        </Modal>
      )}
      {deleteTarget && (
        <ConfirmDialog title="Delete Subject" message={`Delete "${deleteTarget.name}"?`} onConfirm={() => { deleteSubject(deleteTarget.id); addToast({ type: 'warning', message: 'Subject removed' }); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} confirmText="Delete" danger />
      )}
    </div>
  );
}
