import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useUIStore } from '../../store';
import { clsx } from 'clsx';

const icons = { success: CheckCircle, warning: AlertTriangle, error: XCircle, info: Info };
const styles = {
  success: 'border-green-500/30 bg-green-500/10 text-green-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
  info: 'border-brand-500/30 bg-brand-500/10 text-brand-300',
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => {
        const Icon = icons[toast.type] || Info;
        return (
          <div key={toast.id}
            className={clsx('flex items-start gap-3 px-4 py-3 rounded-xl border shadow-glass pointer-events-auto animate-slide-in-right max-w-sm', styles[toast.type] || styles.info)}
          >
            <Icon size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
              <p className="text-sm opacity-90">{toast.message}</p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="shrink-0 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function Modal({ title, children, onClose, size = 'md', footer }) {
  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative w-full glass shadow-glass animate-bounce-in', sizeClass)}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="btn-icon text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 pb-5 flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, onConfirm, onCancel, confirmText = 'Confirm', danger = false }) {
  return (
    <Modal title={title} onClose={onCancel} size="sm"
      footer={<>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmText}</button>
      </>}
    >
      <p className="text-slate-300 text-sm">{message}</p>
    </Modal>
  );
}

export function Badge({ type = 'info', children }) {
  const cls = { critical:'badge-critical', warning:'badge-warning', info:'badge-info', success:'badge-success', purple:'badge-purple' };
  return <span className={cls[type] || 'badge-info'}>{children}</span>;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
        {Icon && <Icon size={28} className="text-slate-500" />}
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-slate-400 text-sm mb-4 max-w-xs">{description}</p>
      {action}
    </div>
  );
}

export function LoadingSpinner({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin text-brand-400">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function ProgressBar({ value, max = 100, label }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      {label && <div className="flex justify-between text-xs text-slate-400 mb-1"><span>{label}</span><span>{pct}%</span></div>}
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function Avatar({ initials, size = 'md' }) {
  const s = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }[size];
  return (
    <div className={clsx(s, 'rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center font-bold text-white shrink-0')}>
      {initials}
    </div>
  );
}
