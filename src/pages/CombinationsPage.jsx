/**
 * Subject Combinations — Section-wise configuration for Classes XI & XII
 *
 * Each class section (11A, 11B, 12A …) can independently have:
 *   • CORE subjects   — whole section attends (1st – 4th subjects typically)
 *   • 5TH SUBJECT POOL — students pick ONE; all options run simultaneously
 *   • 6TH / ADDITIONAL POOL — students pick ONE; all options run simultaneously
 *       at a DIFFERENT slot from the 5th-subject pool
 *
 * There are 19 subjects in total from which any combination can be chosen.
 */
import { useState, useCallback } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronUp, Users, BookOpen,
  Check, Info, AlertTriangle, GraduationCap, X,
  Layers, Star, PlusCircle, CheckCircle, Settings2
} from 'lucide-react';
import { useSchoolStore, useSectionConfigStore, useUIStore } from '../store';
import { getSubjectColor } from '../data/demoData';
import { clsx } from 'clsx';

// ─── Subject pill used in the big grid ───────────────────────────
function SubjectPill({ subject, selected, onClick, compact = false }) {
  const color = getSubjectColor(subject.name);
  return (
    <button onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-150',
        selected
          ? `${color.bg} ${color.border} ${color.text} scale-[1.02]`
          : 'bg-surface-800/50 border-white/[0.06] text-slate-400 hover:border-white/20 hover:text-slate-200'
      )}>
      {selected && <Check size={10} />}
      {subject.code}
      {!compact && <span className="text-[10px] opacity-70">({subject.periodsPerWeek}p)</span>}
    </button>
  );
}

// ─── A single split-group option row ─────────────────────────────
function SplitGroupRow({ entry, subjects, teachers, rooms, onChange, onRemove }) {
  const subj = subjects.find(s => s.id === entry.subjectId);
  const color = subj ? getSubjectColor(subj.name) : null;

  return (
    <div className={clsx(
      'flex items-center gap-2 p-2.5 rounded-xl border transition-all group',
      color ? `${color.bg} ${color.border}` : 'bg-surface-800/40 border-white/[0.06]'
    )}>
      <div className="w-1.5 h-8 rounded-full bg-current opacity-40 shrink-0" />

      {/* Subject */}
      <select value={entry.subjectId || ''} onChange={e => onChange('subjectId', e.target.value)}
        className="bg-surface-900/80 border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none flex-1">
        <option value="">— Subject —</option>
        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      {/* Teacher */}
      <select value={entry.teacherId || ''} onChange={e => onChange('teacherId', e.target.value)}
        className="bg-surface-900/80 border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none w-36">
        <option value="">— Teacher —</option>
        {teachers.map(t => <option key={t.id} value={t.id}>{t.name.split(' ').slice(-1)[0]}, {t.name.split(' ')[0]}</option>)}
      </select>

      {/* Room */}
      <select value={entry.roomId || ''} onChange={e => onChange('roomId', e.target.value)}
        className="bg-surface-900/80 border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none w-28">
        <option value="">— Room —</option>
        {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>

      {/* Periods */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-slate-500 text-[10px]">P/wk</span>
        <input type="number" min={1} max={10} value={entry.periodsPerWeek || 4}
          onChange={e => onChange('periodsPerWeek', parseInt(e.target.value) || 1)}
          className="w-10 bg-surface-900/80 border border-white/[0.08] rounded px-1 py-1 text-xs text-slate-200 text-center focus:outline-none" />
      </div>

      {/* Students */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-slate-500 text-[10px]">~</span>
        <input type="number" min={1} max={99} value={entry.estimatedStudents || 20}
          onChange={e => onChange('estimatedStudents', parseInt(e.target.value) || 1)}
          className="w-10 bg-surface-900/80 border border-white/[0.08] rounded px-1 py-1 text-xs text-slate-200 text-center focus:outline-none" />
        <Users size={10} className="text-slate-500" />
      </div>

      <button onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all shrink-0">
        <X size={12} className="text-red-400" />
      </button>
    </div>
  );
}

// ─── Split Group Panel (5th or 6th subject) ───────────────────────
function SplitGroupPanel({ title, icon: Icon, subtitle, color, group, classId, field, subjects, teachers, rooms, updateField }) {
  const addEntry = () => {
    const updated = [...(group || []), {
      id: `sg-${Date.now()}`, subjectId: '', teacherId: '', roomId: '',
      periodsPerWeek: 4, estimatedStudents: 20,
    }];
    updateField(classId, field, updated);
  };

  const updateEntry = (id, key, val) => {
    updateField(classId, field, group.map(e => e.id === id ? { ...e, [key]: val } : e));
  };

  const removeEntry = (id) => {
    updateField(classId, field, group.filter(e => e.id !== id));
  };

  const totalStudents = (group || []).reduce((s, e) => s + (e.estimatedStudents || 0), 0);

  return (
    <div className={`rounded-2xl border p-4 ${color}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Icon size={14} />
            <p className="font-bold text-sm">{title}</p>
            {group?.length > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-black/20">
                {group.length} options · ~{totalStudents} students split
              </span>
            )}
          </div>
          <p className="text-[11px] opacity-70">{subtitle}</p>
        </div>
        <button onClick={addEntry} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-black/20 hover:bg-black/30 rounded-lg transition-all">
          <Plus size={11} /> Add Option
        </button>
      </div>

      {(!group || group.length === 0) ? (
        <div className="py-4 text-center border-2 border-dashed border-current opacity-30 rounded-xl text-xs">
          No options yet — click "Add Option"
        </div>
      ) : (
        <div className="space-y-2">
          {/* Column headers */}
          <div className="flex items-center gap-2 px-3 text-[10px] opacity-50 font-semibold uppercase tracking-wider">
            <span className="flex-1">Subject</span>
            <span className="w-36">Teacher</span>
            <span className="w-28">Room</span>
            <span className="w-14 text-center">P/wk</span>
            <span className="w-14 text-center">Students</span>
            <span className="w-6" />
          </div>
          {group.map(entry => (
            <SplitGroupRow
              key={entry.id}
              entry={entry}
              subjects={subjects}
              teachers={teachers}
              rooms={rooms}
              onChange={(key, val) => updateEntry(entry.id, key, val)}
              onRemove={() => removeEntry(entry.id)}
            />
          ))}
          {/* Live preview */}
          <div className="mt-2 px-2 py-1.5 rounded-lg bg-black/10 text-[11px]">
            <span className="opacity-60">During this period: </span>
            {group.map((e, i) => {
              const s = subjects.find(x => x.id === e.subjectId);
              return (
                <span key={e.id}>
                  {i > 0 && <span className="opacity-40 mx-1.5">|</span>}
                  <span className="font-semibold">{s?.name || '?'}</span>
                  <span className="opacity-50"> ~{e.estimatedStudents}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Per-Section Configuration Card ──────────────────────────────
function SectionCard({ cls, subjects, teachers, rooms }) {
  const { getConfig, updateField, deleteConfig } = useSectionConfigStore();
  const config = getConfig(cls.id);
  const [expanded, setExpanded] = useState(false);

  const toggleCore = (subjectId) => {
    const cur = config.coreSubjects || [];
    const exists = cur.find(e => e.subjectId === subjectId);
    const updated = exists
      ? cur.filter(e => e.subjectId !== subjectId)
      : [...cur, { subjectId, teacherId: '', periodsPerWeek: subjects.find(s => s.id === subjectId)?.periodsPerWeek || 4 }];
    updateField(cls.id, 'coreSubjects', updated);
  };

  const updateCoreTeacher = (subjectId, teacherId) => {
    const updated = (config.coreSubjects || []).map(e =>
      e.subjectId === subjectId ? { ...e, teacherId } : e
    );
    updateField(cls.id, 'coreSubjects', updated);
  };

  const updateCorePeriodsPerWeek = (subjectId, val) => {
    const updated = (config.coreSubjects || []).map(e =>
      e.subjectId === subjectId ? { ...e, periodsPerWeek: val } : e
    );
    updateField(cls.id, 'coreSubjects', updated);
  };

  const coreSubjects = config.coreSubjects || [];
  const fifthGroup = config.fifthSubjectGroup || [];
  const sixthGroup = config.sixthSubjectGroup || [];
  const totalSubjects = coreSubjects.length + (fifthGroup.length ? 1 : 0) + (sixthGroup.length ? 1 : 0);
  const assignedCoreCount = coreSubjects.filter(e => e.teacherId).length;

  const isConfigured = coreSubjects.length > 0;

  return (
    <div className="glass mb-3 overflow-hidden">
      {/* Header */}
      <div onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-all">
        <div className={clsx(
          'w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0',
          cls.grade >= 11
            ? 'bg-gradient-to-br from-purple-500 to-pink-600'
            : 'bg-gradient-to-br from-brand-500 to-indigo-600'
        )}>
          {cls.grade}{cls.section}
        </div>

        <div className="flex-1">
          <p className="font-bold text-white">Class {cls.grade} – Section {cls.section}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-slate-400 text-xs">{cls.strength} students</span>
            {isConfigured && (
              <>
                <span className="text-slate-600 text-xs">·</span>
                <span className="text-green-400 text-xs">{coreSubjects.length} core</span>
                {fifthGroup.length > 0 && <><span className="text-slate-600 text-xs">·</span><span className="text-amber-400 text-xs">{fifthGroup.length} options (5th)</span></>}
                {sixthGroup.length > 0 && <><span className="text-slate-600 text-xs">·</span><span className="text-purple-400 text-xs">{sixthGroup.length} options (6th)</span></>}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConfigured
            ? <CheckCircle size={14} className="text-green-400" />
            : <span className="text-slate-500 text-xs">Not configured</span>
          }
          {expanded
            ? <ChevronUp size={16} className="text-slate-400" />
            : <ChevronDown size={16} className="text-slate-400" />
          }
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-5 pt-2 border-t border-white/[0.06] space-y-5">

          {/* ── SECTION 1: Core Subjects ── */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={13} className="text-green-400" />
              <p className="text-xs font-bold text-green-400 uppercase tracking-wider">Core Subjects</p>
              <span className="text-slate-500 text-[11px] normal-case font-normal ml-1">Whole section attends — click to toggle</span>
            </div>

            {/* Subject picker grid */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {subjects.map(s => (
                <SubjectPill
                  key={s.id}
                  subject={s}
                  selected={coreSubjects.some(e => e.subjectId === s.id)}
                  onClick={() => toggleCore(s.id)}
                />
              ))}
            </div>

            {/* Teacher assignment for selected core subjects */}
            {coreSubjects.length > 0 && (
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="bg-surface-800/60 px-3 py-1.5 flex items-center gap-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  <span className="flex-1">Subject</span>
                  <span className="w-40">Teacher</span>
                  <span className="w-14 text-center">P/wk</span>
                </div>
                {coreSubjects.map(entry => {
                  const subj = subjects.find(s => s.id === entry.subjectId);
                  const color = getSubjectColor(subj?.name);
                  const eligibleTeachers = teachers.filter(t =>
                    t.subjects.some(ts => subj?.name?.toLowerCase().includes(ts.toLowerCase()) || ts.toLowerCase().includes(subj?.name?.toLowerCase()))
                  );
                  return (
                    <div key={entry.subjectId}
                      className={clsx('flex items-center gap-2 px-3 py-2 border-t border-white/[0.04]', color.bg)}>
                      <div className={clsx('flex-1 flex items-center gap-2 text-xs font-semibold', color.text)}>
                        <span className={`w-2 h-2 rounded-full border ${color.border}`} />
                        {subj?.name}
                      </div>
                      <select value={entry.teacherId || ''} onChange={e => updateCoreTeacher(entry.subjectId, e.target.value)}
                        className="w-40 bg-surface-900/80 border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none">
                        <option value="">— Select Teacher —</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}
                            className={eligibleTeachers.find(et => et.id === t.id) ? 'font-bold' : ''}>
                            {eligibleTeachers.find(et => et.id === t.id) ? '★ ' : ''}{t.name.split(' ').slice(-1)[0]}, {t.name.split(' ')[0]}
                          </option>
                        ))}
                      </select>
                      <input type="number" min={1} max={10} value={entry.periodsPerWeek || 4}
                        onChange={e => updateCorePeriodsPerWeek(entry.subjectId, parseInt(e.target.value) || 1)}
                        className="w-14 text-center bg-surface-900/80 border border-white/[0.08] rounded-lg px-1 py-1 text-xs text-slate-200 focus:outline-none" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── SECTION 2: 5th Subject Pool ── */}
          <SplitGroupPanel
            title="5th Subject Group"
            icon={Star}
            subtitle="Students choose ONE — all options run simultaneously during this slot"
            color="bg-amber-500/10 border-amber-500/20 text-amber-300"
            group={fifthGroup}
            classId={cls.id}
            field="fifthSubjectGroup"
            subjects={subjects}
            teachers={teachers}
            rooms={rooms}
            updateField={updateField}
          />

          {/* ── SECTION 3: 6th / Additional Subject Pool ── */}
          <SplitGroupPanel
            title="6th / Additional Subject Group"
            icon={PlusCircle}
            subtitle="Students choose ONE additional subject — all options run simultaneously at a separate slot"
            color="bg-purple-500/10 border-purple-500/20 text-purple-300"
            group={sixthGroup}
            classId={cls.id}
            field="sixthSubjectGroup"
            subjects={subjects}
            teachers={teachers}
            rooms={rooms}
            updateField={updateField}
          />

          {/* Subject count check */}
          {coreSubjects.length > 0 && (
            <div className="rounded-xl bg-surface-800/40 p-3 text-xs">
              <p className="text-slate-400 font-semibold mb-1">Subject count per student (example):</p>
              <div className="flex flex-wrap gap-2">
                {coreSubjects.slice(0, 4).map(e => {
                  const s = subjects.find(x => x.id === e.subjectId);
                  return <span key={e.subjectId} className="text-green-300 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-lg">{s?.code}</span>;
                })}
                {fifthGroup.length > 0 && (
                  <span className="text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                    {subjects.find(s => s.id === fifthGroup[0]?.subjectId)?.code || '?'} (5th)
                  </span>
                )}
                {sixthGroup.length > 0 && (
                  <span className="text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg">
                    {subjects.find(s => s.id === sixthGroup[0]?.subjectId)?.code || '?'} (6th)
                  </span>
                )}
                <span className="text-slate-500 ml-1">= max {coreSubjects.length + (fifthGroup.length ? 1 : 0) + (sixthGroup.length ? 1 : 0)} subjects / student</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Subject Reference Panel ──────────────────────────────────────
function SubjectReference({ subjects }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-5">
      <button onClick={() => setShow(s => !s)}
        className="flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors">
        <BookOpen size={13} />
        {show ? 'Hide' : 'Show'} all 19 available subjects
        {show ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {show && (
        <div className="mt-3 glass-sm p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {subjects.map((s, i) => {
              const color = getSubjectColor(s.name);
              return (
                <div key={s.id} className={clsx('flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs', color.bg, color.border)}>
                  <span className={clsx('font-bold', color.text)}>{s.code}</span>
                  <span className="text-slate-300 truncate">{s.name}</span>
                  <span className="ml-auto text-slate-500">{s.periodsPerWeek}p</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function CombinationsPage() {
  const { subjects, teachers, rooms, classes } = useSchoolStore();
  const [filterGrade, setFilterGrade] = useState('senior'); // 'senior' | 'all'

  const displayClasses = classes
    .filter(c => filterGrade === 'all' ? true : c.grade >= 11)
    .sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section));

  const seniorClasses = classes.filter(c => c.grade >= 11);

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="section-header mb-2">
        <div>
          <h2 className="section-title">Subject Combinations</h2>
          <p className="section-subtitle">
            Configure which of the 19 subjects each section offers, with 5th and 6th subject options
            <span className="badge-purple badge ml-2">XI – XII</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilterGrade(f => f === 'senior' ? 'all' : 'senior')}
            className="btn-secondary text-xs">
            <Settings2 size={13} />
            {filterGrade === 'senior' ? 'Show all grades' : 'Show XI-XII only'}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="glass-sm p-4 mb-5 border border-brand-500/20 bg-brand-500/5">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-brand-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-400 space-y-1">
            <p><span className="text-white font-semibold">19 subjects offered</span> — each student picks up to 6.</p>
            <p><span className="text-green-300 font-semibold">Core (1-4):</span> Whole section attends together. Select subjects + assign teachers.</p>
            <p><span className="text-amber-300 font-semibold">5th Subject:</span> Students split into groups simultaneously (e.g. 25 go to Math, 15 go to Bio at the same time).</p>
            <p><span className="text-purple-300 font-semibold">6th / Additional:</span> Same concept — another set of simultaneous options (e.g. PE, Economics, Fine Arts).</p>
          </div>
        </div>
      </div>

      {seniorClasses.length === 0 && (
        <div className="glass-sm p-4 mb-5 border border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
          <p className="text-amber-300 text-sm">No Class XI/XII found — add them in the <strong>Classes</strong> page first.</p>
        </div>
      )}

      <SubjectReference subjects={subjects} />

      {/* Section cards */}
      {displayClasses.length === 0 ? (
        <div className="glass py-16 text-center">
          <GraduationCap size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-white font-bold">No sections found</p>
          <p className="text-slate-400 text-sm mt-1">Add classes in the Classes page first.</p>
        </div>
      ) : (
        displayClasses.map(cls => (
          <SectionCard
            key={cls.id}
            cls={cls}
            subjects={subjects}
            teachers={teachers}
            rooms={rooms}
          />
        ))
      )}
    </div>
  );
}
