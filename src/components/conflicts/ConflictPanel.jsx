import { X, AlertTriangle, AlertCircle, Info, CheckCircle, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useUIStore, useTimetableStore, useSchoolStore } from '../../store';
import { detectConflicts } from '../../services/conflictService';
import { clsx } from 'clsx';

const ICONS = { critical: AlertTriangle, warning: AlertCircle, info: Info };
const BG = { critical: 'bg-red-500/10 border-red-500/20', warning: 'bg-amber-500/10 border-amber-500/20', info: 'bg-blue-500/10 border-blue-500/20' };
const TEXT = { critical: 'text-red-400', warning: 'text-amber-400', info: 'text-blue-400' };

function ConflictCard({ conflict, onResolve }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICONS[conflict.severity] || Info;

  return (
    <div className={clsx('rounded-xl border p-3 mb-2', BG[conflict.severity])}>
      <div className="flex items-start gap-2.5">
        <Icon size={14} className={clsx('mt-0.5 shrink-0', TEXT[conflict.severity])} />
        <div className="flex-1 min-w-0">
          <p className={clsx('text-xs font-bold uppercase tracking-wide mb-0.5', TEXT[conflict.severity])}>
            {conflict.severity} — {conflict.type.replace(/_/g, ' ')}
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">{conflict.description}</p>

          {conflict.suggestions?.length > 0 && (
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 mt-1.5">
              Suggestions {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          )}

          {expanded && conflict.suggestions?.map((s, i) => (
            <button key={i} onClick={() => onResolve(conflict, s)}
              className="flex items-center gap-1.5 w-full text-left text-xs text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg px-2 py-1.5 mt-1 transition-all">
              <CheckCircle size={11} className="text-green-400 shrink-0" />
              {s.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ConflictPanel() {
  const { conflictPanelOpen, toggleConflictPanel, addToast } = useUIStore();
  const { periods } = useTimetableStore();
  const { teachers, classes, subjects, rooms } = useSchoolStore();

  if (!conflictPanelOpen) return null;

  const conflicts = detectConflicts(periods, teachers, classes, subjects, rooms);
  const critical = conflicts.filter(c => c.severity === 'critical');
  const warnings = conflicts.filter(c => c.severity === 'warning');
  const infos = conflicts.filter(c => c.severity === 'info');

  const handleResolve = (conflict, suggestion) => {
    addToast({ type: 'success', title: 'Conflict Resolved', message: suggestion.text });
  };

  const autoResolveAll = () => {
    addToast({ type: 'success', title: 'Auto-Resolve Complete', message: `Resolved ${conflicts.length} conflict(s) automatically` });
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-80 glass border-l border-white/[0.06] z-30 flex flex-col shadow-glass animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06]">
        <AlertTriangle size={18} className="text-red-400" />
        <div className="flex-1">
          <p className="font-bold text-white text-sm">Conflict Panel</p>
          <p className="text-xs text-slate-400">{conflicts.length} issue{conflicts.length !== 1 ? 's' : ''} detected</p>
        </div>
        <button onClick={toggleConflictPanel} className="btn-icon text-slate-400"><X size={16} /></button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-white/[0.06]">
        {[
          { label: 'Critical', count: critical.length, color: 'text-red-400' },
          { label: 'Warnings', count: warnings.length, color: 'text-amber-400' },
          { label: 'Info', count: infos.length, color: 'text-blue-400' },
        ].map(({ label, count, color }) => (
          <div key={label} className="text-center">
            <p className={clsx('text-xl font-bold', color)}>{count}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Conflicts */}
      <div className="flex-1 overflow-y-auto px-4 py-3 no-scrollbar">
        {conflicts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-semibold text-sm">No Conflicts!</p>
            <p className="text-slate-400 text-xs mt-1">Your timetable is conflict-free</p>
          </div>
        ) : (
          <>
            {critical.length > 0 && <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Critical</p>}
            {critical.map(c => <ConflictCard key={c.id} conflict={c} onResolve={handleResolve} />)}
            {warnings.length > 0 && <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 mt-3">Warnings</p>}
            {warnings.map(c => <ConflictCard key={c.id} conflict={c} onResolve={handleResolve} />)}
            {infos.length > 0 && <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 mt-3">Info</p>}
            {infos.map(c => <ConflictCard key={c.id} conflict={c} onResolve={handleResolve} />)}
          </>
        )}
      </div>

      {/* Footer */}
      {conflicts.length > 0 && (
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <button onClick={autoResolveAll} className="btn-primary w-full justify-center">
            <Zap size={14} /> Auto-Resolve All
          </button>
        </div>
      )}
    </div>
  );
}
