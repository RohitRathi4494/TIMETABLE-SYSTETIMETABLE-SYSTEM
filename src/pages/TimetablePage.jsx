import { TimetableGrid } from '../components/timetable/TimetableGrid';

export default function TimetablePage() {
  return (
    <div className="p-6 max-w-full animate-fade-in">
      <div className="section-header mb-2">
        <div>
          <h2 className="section-title">Timetable</h2>
          <p className="section-subtitle">Drag & drop periods · Right-click for options · Ctrl+Z to undo</p>
        </div>
      </div>
      <div className="glass p-4 overflow-auto">
        <TimetableGrid />
      </div>
    </div>
  );
}
