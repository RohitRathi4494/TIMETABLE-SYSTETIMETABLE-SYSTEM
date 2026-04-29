import { Bell, Search, Undo2, Redo2, AlertTriangle, LogOut } from 'lucide-react';
import { useUIStore, useTimetableStore } from '../../store';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../firebase/auth';
import { clsx } from 'clsx';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/timetable': 'Timetable',
  '/teachers': 'Teachers',
  '/classes': 'Classes',
  '/subjects': 'Subjects',
  '/rooms': 'Rooms',
  '/substitutions': 'Substitutions',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

export function TopNav({ conflictCount = 0 }) {
  const { toggleConflictPanel } = useUIStore();
  const { undo, redo, history, future } = useTimetableStore();
  const { userProfile, currentUser } = useAuth();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'EduSchedule AI';

  const displayName = userProfile?.name || currentUser?.email?.split('@')[0] || 'Admin';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="h-14 flex items-center gap-4 px-6 border-b border-white/[0.06] bg-surface-900/50 backdrop-blur-md shrink-0">
      <h1 className="text-base font-bold text-white">{title}</h1>

      {/* Search */}
      <div className="flex-1 max-w-sm ml-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-8 py-1.5 text-xs" placeholder="Search teachers, classes, subjects..." />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Undo / Redo */}
        <button onClick={undo} disabled={!history.length}
          className={clsx('btn-icon', !history.length && 'opacity-30 cursor-not-allowed')}
          title="Undo (Ctrl+Z)">
          <Undo2 size={16} className="text-slate-400" />
        </button>
        <button onClick={redo} disabled={!future.length}
          className={clsx('btn-icon', !future.length && 'opacity-30 cursor-not-allowed')}
          title="Redo (Ctrl+Y)">
          <Redo2 size={16} className="text-slate-400" />
        </button>

        {/* Conflicts */}
        <button
          onClick={toggleConflictPanel}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200',
            conflictCount > 0
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 animate-pulse-soft'
              : 'bg-green-500/10 text-green-400 border border-green-500/20'
          )}
        >
          <AlertTriangle size={13} />
          {conflictCount > 0 ? `${conflictCount} Conflicts` : 'No Conflicts'}
        </button>

        {/* Profile avatar with name */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-[11px]">
            {initials || 'A'}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs text-slate-200 font-semibold leading-none">{displayName}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{userProfile?.role || 'admin'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
