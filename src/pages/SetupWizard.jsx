import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, ChevronRight, ChevronLeft, Users, BookOpen,
  GraduationCap, Table2, Zap, Info
} from 'lucide-react';
import { useSchoolStore, useAssignmentStore, useTimetableStore, useUIStore, useSectionConfigStore } from '../store';
import { generateFromAssignments } from '../services/generatorService';
import { ProgressBar } from '../components/shared';
import { clsx } from 'clsx';

const STEPS = [
  { id: 'group',   label: 'Groups',      icon: GraduationCap, desc: 'Choose which group to generate' },
  { id: 'assign',  label: 'Assignments', icon: Table2,         desc: 'Assign teachers to subjects per class' },
  { id: 'generate',label: 'Generate',    icon: Zap,            desc: 'Auto-create the timetable' },
];

// ─── Step 1: Group Selector ────────────────────────────────────────
function StepGroup({ selectedGroup, onSelect }) {
  const { classes } = useSchoolStore();
  const groups = [
    { id: 'VI-X',   label: 'Classes VI – X',   grades: [6,7,8,9,10],   color: 'from-brand-500 to-indigo-600' },
    { id: 'XI-XII', label: 'Classes XI – XII',  grades: [11,12],        color: 'from-purple-500 to-pink-600' },
    { id: 'ALL',    label: 'All Classes',        grades: [1,2,3,4,5,6,7,8,9,10,11,12], color: 'from-cyan-500 to-teal-600' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">
        Select which group of classes you want to create a timetable for. You can run the generator separately for each group.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {groups.map(g => {
          const count = classes.filter(c => g.grades.includes(c.grade)).length;
          return (
            <button key={g.id} onClick={() => onSelect(g)}
              className={clsx(
                'p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5',
                selectedGroup?.id === g.id
                  ? 'border-brand-500 bg-brand-600/10'
                  : 'border-white/[0.08] bg-surface-800/50 hover:border-white/20'
              )}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center mb-4`}>
                <GraduationCap size={22} className="text-white" />
              </div>
              <p className="font-bold text-white text-lg">{g.label}</p>
              <p className="text-slate-400 text-sm mt-1">{count} class{count !== 1 ? 'es' : ''} available</p>
              {selectedGroup?.id === g.id && (
                <div className="flex items-center gap-1.5 mt-3 text-brand-400 text-xs font-semibold">
                  <CheckCircle size={13} /> Selected
                </div>
              )}
            </button>
          );
        })}
      </div>
      {selectedGroup && (
        <div className="glass-sm p-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Info size={14} className="text-brand-400" />
            <p className="text-sm font-semibold text-white">Classes in {selectedGroup.label}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {classes.filter(c => selectedGroup.grades.includes(c.grade))
              .sort((a,b) => a.grade - b.grade || a.section.localeCompare(b.section))
              .map(c => (
                <span key={c.id} className="badge-purple badge">Class {c.grade}{c.section}</span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Assignment Matrix ─────────────────────────────────────
function StepAssign({ selectedGroup }) {
  const { classes, subjects, teachers } = useSchoolStore();
  const { assignments, upsertAssignment } = useAssignmentStore();

  const filteredClasses = classes
    .filter(c => selectedGroup?.grades.includes(c.grade))
    .sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section));

  // Only show subjects relevant to these classes
  const relevantSubjectIds = [...new Set(filteredClasses.flatMap(c => c.subjects || []))];
  const relevantSubjects = subjects.filter(s => relevantSubjectIds.includes(s.id));

  const getAssignment = (classId, subjectId) =>
    assignments.find(a => a.classId === classId && a.subjectId === subjectId);

  const getQualifiedTeachers = (subjectName) =>
    teachers.filter(t => t.subjects.includes(subjectName));

  return (
    <div>
      <p className="text-slate-400 text-sm mb-4">
        For each class, assign a teacher and set periods per week for every subject.
        Leave teacher empty to skip that subject for that class.
      </p>
      <div className="overflow-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface-800/80">
              <th className="px-3 py-3 text-left text-slate-400 font-semibold sticky left-0 bg-surface-800 z-10 min-w-[100px]">Class</th>
              {relevantSubjects.map(s => (
                <th key={s.id} className="px-2 py-3 text-center text-slate-400 font-semibold min-w-[160px] border-l border-white/[0.04]">
                  <p className="text-slate-200">{s.name}</p>
                  <p className="text-slate-500 text-[10px]">{s.periodsPerWeek} periods/wk default</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredClasses.map(cls => (
              <tr key={cls.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-3 py-2 sticky left-0 bg-surface-900 z-10">
                  <p className="font-bold text-white">Class {cls.grade}{cls.section}</p>
                  <p className="text-slate-500 text-[10px]">{cls.strength} students</p>
                </td>
                {relevantSubjects.map(subj => {
                  const asgn = getAssignment(cls.id, subj.id);
                  const qualTeachers = getQualifiedTeachers(subj.name);
                  const hasSubject = (cls.subjects || []).includes(subj.id);

                  if (!hasSubject) {
                    return (
                      <td key={subj.id} className="px-2 py-2 border-l border-white/[0.04] text-center">
                        <span className="text-slate-600 text-[10px]">—</span>
                      </td>
                    );
                  }

                  return (
                    <td key={subj.id} className="px-2 py-2 border-l border-white/[0.04]">
                      <div className="space-y-1">
                        <select
                          className="w-full bg-surface-800 border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                          value={asgn?.teacherId || ''}
                          onChange={e => upsertAssignment({
                            classId: cls.id, subjectId: subj.id,
                            teacherId: e.target.value,
                            periodsPerWeek: asgn?.periodsPerWeek || subj.periodsPerWeek || 4,
                          })}
                        >
                          <option value="">— Teacher —</option>
                          {qualTeachers.map(t => (
                            <option key={t.id} value={t.id}>{t.name.split(' ').slice(-1)[0]}, {t.name.split(' ')[0]}</option>
                          ))}
                          {qualTeachers.length === 0 && (
                            <option disabled>No qualified teacher</option>
                          )}
                        </select>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 text-[10px]">Periods/wk:</span>
                          <input
                            type="number" min={1} max={10}
                            value={asgn?.periodsPerWeek || subj.periodsPerWeek || 4}
                            onChange={e => upsertAssignment({
                              classId: cls.id, subjectId: subj.id,
                              teacherId: asgn?.teacherId || '',
                              periodsPerWeek: parseInt(e.target.value) || 1,
                            })}
                            className="w-12 bg-surface-800 border border-white/[0.08] rounded px-1 py-0.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                          />
                        </div>
                      </div>
                      {asgn?.teacherId && (
                        <div className="mt-1">
                          <span className="badge-success badge text-[9px]">✓ Assigned</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 glass-sm p-4">
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-slate-400 text-xs">Total Assignments</p>
            <p className="text-white font-bold">{assignments.filter(a => filteredClasses.some(c => c.id === a.classId) && a.teacherId).length}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Missing Teachers</p>
            <p className="text-red-400 font-bold">
              {filteredClasses.flatMap(c => (c.subjects||[]).map(sid => ({ c, sid }))).filter(({c,sid}) =>
                !assignments.find(a => a.classId === c.id && a.subjectId === sid && a.teacherId)
              ).length}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Total Periods/Week</p>
            <p className="text-brand-400 font-bold">
              {assignments.filter(a => filteredClasses.some(c => c.id === a.classId) && a.teacherId)
                .reduce((s, a) => s + (a.periodsPerWeek || 0), 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Generate ──────────────────────────────────────────────
function StepGenerate({ selectedGroup, onDone }) {
  const { classes, subjects, teachers, rooms, school } = useSchoolStore();
  const { assignments } = useAssignmentStore();
  const { configs: sectionConfigs } = useSectionConfigStore();
  const { bulkSetPeriods, setGenerating, generationProgress, isGenerating } = useTimetableStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();

  const filteredClasses = classes.filter(c => selectedGroup?.grades.includes(c.grade));
  const filteredAssignments = assignments.filter(a =>
    filteredClasses.some(c => c.id === a.classId) && a.teacherId
  );
  // Only include configs for classes in this group
  const relevantConfigs = sectionConfigs.filter(cfg =>
    filteredClasses.some(c => c.id === cfg.classId)
  );
  const optionalGroupCount = relevantConfigs.reduce(
    (s, c) => s + (c.fifthSubjectGroup?.length || 0) + (c.sixthSubjectGroup?.length || 0), 0
  );

  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [stats, setStats] = useState(null);

  const handleGenerate = async () => {
    setStatus('running');
    setGenerating(true, 0);
    try {
      const newPeriods = await generateFromAssignments(
        filteredAssignments, classes, subjects, teachers, rooms,
        school.periodsPerDay || 8, school.workingDays,
        (pct) => setGenerating(true, pct),
        relevantConfigs
      );
      bulkSetPeriods(newPeriods);
      setStats({
        periods: newPeriods.length,
        classes: [...new Set(newPeriods.map(p => p.classId))].length,
        teachers: [...new Set(newPeriods.map(p => p.teacherId))].length,
      });
      setStatus('done');
      addToast({ type: 'success', title: '🎉 Timetable Generated!', message: `${newPeriods.length} periods scheduled conflict-free` });
    } catch (e) {
      setStatus('error');
      addToast({ type: 'error', message: 'Generation failed. Please check your assignments.' });
    } finally {
      setGenerating(false, 0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-sm p-5">
        <p className="text-white font-semibold mb-3">Generation Summary</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Classes', value: filteredClasses.length, color: 'text-brand-400' },
            { label: 'Core Assignments', value: filteredAssignments.length, color: 'text-purple-400' },
            { label: 'Optional Groups', value: optionalGroupCount, color: 'text-amber-400' },
            { label: 'Periods to Place', value: filteredAssignments.reduce((s,a)=>s+(a.periodsPerWeek||0),0), color: 'text-cyan-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-surface-800/50 rounded-xl p-3">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {status === 'idle' && (
        <button onClick={handleGenerate} className="btn-primary w-full justify-center py-4 text-base">
          <Zap size={18} /> Generate Timetable for {selectedGroup?.label}
        </button>
      )}

      {status === 'running' && (
        <div className="glass-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            <p className="text-white font-semibold">Generating timetable...</p>
          </div>
          <ProgressBar value={generationProgress} max={100} label="Placing periods conflict-free" />
          <p className="text-slate-400 text-xs">This usually takes a few seconds depending on complexity.</p>
        </div>
      )}

      {status === 'done' && stats && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-6 text-center">
            <CheckCircle size={36} className="text-green-400 mx-auto mb-3" />
            <p className="text-white font-bold text-lg">Timetable Generated!</p>
            <p className="text-slate-400 text-sm mt-1">
              {stats.periods} periods across {stats.classes} classes and {stats.teachers} teachers
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/timetable/output?view=class')}
              className="btn-primary justify-center py-3">
              <GraduationCap size={15} /> Class-wise Timetable
            </button>
            <button onClick={() => navigate('/timetable/output?view=teacher')}
              className="btn-secondary justify-center py-3">
              <Users size={15} /> Teacher-wise Timetable
            </button>
          </div>
          <button onClick={() => navigate('/timetable')} className="btn-secondary w-full justify-center">
            Open Grid Editor
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 text-center">
          <p className="text-red-400 font-bold">Generation Failed</p>
          <p className="text-slate-400 text-sm mt-1">Please ensure all classes have teacher assignments.</p>
          <button onClick={() => setStatus('idle')} className="btn-danger mt-4">Try Again</button>
        </div>
      )}
    </div>
  );
}

// ─── Main Wizard ───────────────────────────────────────────────────
export default function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const canNext = () => {
    if (currentStep === 0) return !!selectedGroup;
    if (currentStep === 1) return true;
    return false;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Timetable Setup Wizard</h2>
        <p className="text-slate-400 mt-1">Assign teachers to subjects, then auto-generate conflict-free timetables</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <button onClick={() => i < currentStep && setCurrentStep(i)}
                className={clsx(
                  'flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all',
                  isActive ? 'bg-brand-600 text-white' : isDone ? 'text-green-400 cursor-pointer hover:bg-white/[0.05]' : 'text-slate-500 cursor-default'
                )}>
                {isDone
                  ? <CheckCircle size={16} />
                  : <div className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border', isActive ? 'border-white bg-white text-brand-600' : 'border-slate-600 text-slate-600')}>{i+1}</div>
                }
                {step.label}
              </button>
              {i < STEPS.length - 1 && <div className={clsx('flex-1 h-px mx-2', i < currentStep ? 'bg-green-500/40' : 'bg-white/[0.06]')} />}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="glass p-6 mb-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
          {(() => { const Icon = STEPS[currentStep].icon; return <Icon size={20} className="text-brand-400" />; })()}
          <div>
            <p className="font-bold text-white">{STEPS[currentStep].label}</p>
            <p className="text-slate-400 text-xs">{STEPS[currentStep].desc}</p>
          </div>
        </div>

        {currentStep === 0 && <StepGroup selectedGroup={selectedGroup} onSelect={setSelectedGroup} />}
        {currentStep === 1 && <StepAssign selectedGroup={selectedGroup} />}
        {currentStep === 2 && <StepGenerate selectedGroup={selectedGroup} />}
      </div>

      {/* Navigation */}
      {currentStep < 2 && (
        <div className="flex justify-between">
          <button onClick={() => setCurrentStep(s => s - 1)} disabled={currentStep === 0}
            className={clsx('btn-secondary', currentStep === 0 && 'opacity-30 cursor-not-allowed')}>
            <ChevronLeft size={15} /> Back
          </button>
          <button onClick={() => setCurrentStep(s => s + 1)} disabled={!canNext()}
            className={clsx('btn-primary', !canNext() && 'opacity-50 cursor-not-allowed')}>
            {currentStep === 1 ? 'Proceed to Generate' : 'Next'}
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
