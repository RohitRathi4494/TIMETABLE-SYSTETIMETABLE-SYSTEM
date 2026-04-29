import { useState } from 'react';
import { Plus, Search, Edit3, Trash2, DoorOpen, FlaskConical, Monitor, Wifi } from 'lucide-react';
import { useSchoolStore, useUIStore } from '../store';
import { Modal, ConfirmDialog, Badge } from '../components/shared';
import { clsx } from 'clsx';

const ROOM_TYPES = ['classroom', 'lab', 'auditorium', 'special'];
const FACILITIES_OPTIONS = ['whiteboard', 'projector', 'computers', 'lab_equipment', 'ac', 'books', 'smart_board'];

const TYPE_CONFIG = {
  classroom: { icon: DoorOpen, color: 'from-brand-500 to-indigo-600', badge: 'badge-info' },
  lab: { icon: FlaskConical, color: 'from-green-500 to-emerald-600', badge: 'badge-success' },
  auditorium: { icon: Monitor, color: 'from-amber-500 to-orange-600', badge: 'badge-warning' },
  special: { icon: Wifi, color: 'from-purple-500 to-pink-600', badge: 'badge-purple' },
};

function RoomForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({ name: '', type: 'classroom', capacity: 40, facilities: [], isAvailable: true, ...initial });
  const f = k => ({ value: form[k], onChange: e => setForm(s => ({ ...s, [k]: e.target.value })) });
  const toggleFacility = (fac) => setForm(prev => ({ ...prev, facilities: prev.facilities.includes(fac) ? prev.facilities.filter(x=>x!==fac) : [...prev.facilities, fac] }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Room Name *</label><input className="input" placeholder="Room 101" {...f('name')} /></div>
        <div>
          <label className="label">Type</label>
          <select className="select" {...f('type')}>{ROOM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select>
        </div>
        <div><label className="label">Capacity</label><input className="input" type="number" min={1} max={200} {...f('capacity')} /></div>
      </div>
      <div>
        <label className="label">Facilities</label>
        <div className="flex flex-wrap gap-2">
          {FACILITIES_OPTIONS.map(fac => (
            <button key={fac} type="button" onClick={() => toggleFacility(fac)}
              className={clsx('px-2.5 py-1 rounded-lg text-xs font-medium transition-all border', form.facilities.includes(fac) ? 'bg-brand-600 text-white border-brand-500' : 'bg-surface-800 text-slate-400 border-white/[0.06] hover:border-brand-500/40')}>
              {fac.replace('_',' ')}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="available" checked={form.isAvailable} onChange={e => setForm(s => ({...s, isAvailable: e.target.checked}))} className="w-4 h-4 rounded accent-brand-500" />
        <label htmlFor="available" className="text-sm text-slate-300">Available for scheduling</label>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={() => onSave(form)}>Save Room</button>
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const { rooms, addRoom, updateRoom, deleteRoom } = useSchoolStore();
  const { addToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.type.includes(search.toLowerCase()));

  const handleSave = (data) => {
    if (modal === 'add') { addRoom(data); addToast({ type: 'success', message: `${data.name} added` }); }
    else { updateRoom(editTarget.id, data); addToast({ type: 'success', message: 'Room updated' }); }
    setModal(null); setEditTarget(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="section-header">
        <div>
          <h2 className="section-title">Rooms & Resources</h2>
          <p className="section-subtitle">{rooms.length} rooms · {rooms.filter(r=>r.type==='lab').length} labs</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}><Plus size={14} /> Add Room</button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-8" placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(r => {
          const cfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.classroom;
          const Icon = cfg.icon;
          return (
            <div key={r.id} className="glass p-5 group hover:border-brand-500/20 transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{r.name}</p>
                    <p className="text-slate-400 text-xs">Capacity: {r.capacity}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="btn-icon" onClick={() => { setEditTarget(r); setModal('edit'); }}><Edit3 size={12} className="text-slate-400" /></button>
                  <button className="btn-icon" onClick={() => setDeleteTarget(r)}><Trash2 size={12} className="text-red-400" /></button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className={`${cfg.badge} badge`}>{r.type}</span>
                <span className={`badge ${r.isAvailable ? 'badge-success' : 'badge-critical'}`}>
                  {r.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>

              {r.facilities?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {r.facilities.map(f => <span key={f} className="text-[10px] px-2 py-0.5 bg-surface-800 rounded-full text-slate-400">{f.replace('_',' ')}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="py-12 text-center text-slate-400">No rooms found</div>}

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Room' : 'Edit Room'} onClose={() => { setModal(null); setEditTarget(null); }}>
          <RoomForm initial={editTarget || {}} onSave={handleSave} onClose={() => { setModal(null); setEditTarget(null); }} />
        </Modal>
      )}
      {deleteTarget && (
        <ConfirmDialog title="Delete Room" message={`Delete ${deleteTarget.name}?`} onConfirm={() => { deleteRoom(deleteTarget.id); addToast({ type: 'warning', message: 'Room removed' }); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} confirmText="Delete" danger />
      )}
    </div>
  );
}
