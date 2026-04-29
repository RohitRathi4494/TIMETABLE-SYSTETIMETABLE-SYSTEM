import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { AIChat } from './components/ai/AIChat';
import { ConflictPanel } from './components/conflicts/ConflictPanel';
import { ToastContainer } from './components/shared';
import { useSchoolStore, useTimetableStore } from './store';
import { detectConflicts } from './services/conflictService';
import { useAuth } from './context/AuthContext';

import Dashboard from './pages/Dashboard';
import TimetablePage from './pages/TimetablePage';
import TeachersPage from './pages/TeachersPage';
import ClassesPage from './pages/ClassesPage';
import SubjectsPage from './pages/SubjectsPage';
import RoomsPage from './pages/RoomsPage';
import SubstitutionsPage from './pages/SubstitutionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import SetupWizard from './pages/SetupWizard';
import TimetableOutputPage from './pages/TimetableOutputPage';
import CombinationsPage from './pages/CombinationsPage';
import LoginPage from './pages/LoginPage';
import TeacherView from './pages/TeacherView';

// ─── Full Admin Layout ────────────────────────────────────────────
function AdminLayout() {
  const { teachers, subjects, classes, rooms } = useSchoolStore();
  const { periods, undo, redo } = useTimetableStore();

  const conflicts = useMemo(
    () => detectConflicts(periods, teachers, classes, subjects, rooms),
    [periods, teachers, classes, subjects, rooms]
  );

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav conflictCount={conflicts.length} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/setup" element={<SetupWizard />} />
            <Route path="/combinations" element={<CombinationsPage />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/timetable/output" element={<TimetableOutputPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/substitutions" element={<SubstitutionsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Catch-all: redirect unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {/* Global overlays */}
      <AIChat />
      <ConflictPanel />
      <ToastContainer />
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading EduSchedule AI…</p>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────
export default function App() {
  const { currentUser, userProfile, loading } = useAuth();

  // Still resolving auth state
  if (loading) return <LoadingScreen />;

  // Not logged in → show login
  if (!currentUser) return <LoginPage />;

  // Teacher role → show their personal timetable view only
  if (userProfile?.role === 'teacher') return <TeacherView />;

  // Admin role (or any other role) → show full system
  return <AdminLayout />;
}
