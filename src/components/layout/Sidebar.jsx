import { useAuth } from '../../context/AuthContext';
import { logout } from '../../firebase/auth';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Users, BookOpen, Building2,
  DoorOpen, ArrowLeftRight, BarChart3, Settings, ChevronLeft,
  GraduationCap, Sparkles, Zap, Wand2, TableProperties, Layers,
  LogOut,
} from 'lucide-react';
import { useUIStore } from '../../store';
import { clsx } from 'clsx';

const navItems = [
  { to: '/',                  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/setup',             icon: Wand2,           label: 'Setup Wizard',       highlight: true },
  { to: '/combinations',      icon: Layers,          label: 'Subject Combos',     badge: 'XI-XII' },
  { to: '/timetable',         icon: CalendarDays,    label: 'Timetable Grid' },
  { to: '/timetable/output',  icon: TableProperties, label: 'Timetable Output' },
  { to: '/teachers',          icon: Users,           label: 'Teachers' },
  { to: '/classes',           icon: GraduationCap,   label: 'Classes' },
  { to: '/subjects',          icon: BookOpen,        label: 'Subjects' },
  { to: '/rooms',             icon: DoorOpen,        label: 'Rooms' },
  { to: '/substitutions',     icon: ArrowLeftRight,  label: 'Substitutions' },
  { to: '/analytics',         icon: BarChart3,       label: 'Analytics' },
  { to: '/settings',          icon: Settings,        label: 'Settings' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, toggleAIChat } = useUIStore();
  const { userProfile, currentUser } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className={clsx(
      'h-screen flex flex-col bg-surface-900/80 backdrop-blur-md border-r border-white/[0.06]',
      'transition-all duration-300 shrink-0',
      sidebarCollapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className={clsx(
        'flex items-center border-b border-white/[0.06] py-5',
        sidebarCollapsed ? 'flex-col gap-4 px-0' : 'flex-row gap-3 px-4'
      )}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-white text-sm leading-none">EduSchedule</p>
            <p className="text-brand-400 text-xs font-semibold mt-0.5">AI</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={clsx(
            'btn-icon text-slate-400 transition-colors hover:text-white',
            sidebarCollapsed ? 'p-1' : 'ml-auto'
          )}
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <ChevronLeft size={16} className={clsx('transition-transform duration-300', sidebarCollapsed && 'rotate-180')} />
        </button>
      </div>

      {/* AI Button */}
      <div className="px-3 py-3 border-b border-white/[0.06]">
        <button
          onClick={toggleAIChat}
          className={clsx(
            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-sm',
            'bg-gradient-to-r from-brand-600/30 to-purple-600/30 border border-brand-500/30',
            'text-brand-300 hover:from-brand-600/50 hover:to-purple-600/50 transition-all duration-200',
            sidebarCollapsed && 'justify-center px-0'
          )}
        >
          <Sparkles size={16} className="shrink-0" />
          {!sidebarCollapsed && <span>AI Assistant</span>}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map(({ to, icon: Icon, label, highlight, badge }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => clsx(
              'nav-item',
              isActive && 'active',
              highlight && !isActive && 'border border-amber-500/20 text-amber-400 hover:text-amber-300',
              sidebarCollapsed && 'justify-center px-0'
            )}
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
            {!sidebarCollapsed && highlight && (
              <span className="ml-auto text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">NEW</span>
            )}
            {!sidebarCollapsed && badge && !highlight && (
              <span className="ml-auto text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">{badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="px-3 py-3 border-t border-white/[0.06] space-y-1">
        {!sidebarCollapsed && (
          <div className="px-2 py-2">
            <p className="text-xs font-semibold text-slate-300 truncate">
              {userProfile?.name || currentUser?.email?.split('@')[0] || 'Admin'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">
              {userProfile?.role || 'admin'} · EduSchedule AI
            </p>
          </div>
        )}
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className={clsx(
            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-sm',
            'text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200',
            sidebarCollapsed && 'justify-center px-0'
          )}
          title="Sign Out"
        >
          <LogOut size={16} className="shrink-0" />
          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
