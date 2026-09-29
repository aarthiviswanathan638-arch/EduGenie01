import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Clock,
  CheckCircle2,
  Circle,
  Coffee,
  BookOpen,
  Target,
  Download,
  Copy,
  Check,
  Award,
} from 'lucide-react';
import { StudyPlan, StudentProfile } from '../types';

interface StudyPlanViewProps {
  profile: StudentProfile;
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({ profile }) => {
  const [topic, setTopic] = useState(
    profile.focusTopic || `${profile.subject} Comprehensive Mastery`
  );
  const [examDate, setExamDate] = useState('In 2 Weeks');
  const [availableHours, setAvailableHours] = useState('1.5 hours daily');
  const [proficiency, setProficiency] = useState('Intermediate (reviewing core gaps)');
  const [targetGoal, setTargetGoal] = useState('Score A / High Distinction');
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const handleGeneratePlan = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setPlan(null);
    setCompletedItems({});

    try {
      const res = await fetch('/api/study-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          subject: profile.subject,
          examDate,
          availableHoursPerDay: availableHours,
          currentProficiency: proficiency,
          targetGoal,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate study plan');

      const data = await res.json();
      setPlan({
        id: `plan-${Date.now()}`,
        planTitle: data.planTitle || `Study Roadmap: ${topic}`,
        overview: data.overview || '',
        subject: profile.subject,
        targetGoal,
        examDate,
        estimatedTotalHours: data.estimatedTotalHours || 20,
        phases: data.phases || [],
        examReadinessChecklist: data.examReadinessChecklist || [],
        proStudyTips: data.proStudyTips || [],
        createdAt: Date.now(),
      });
    } catch (err) {
      console.error('Study plan error:', err);
      alert('Could not generate plan. Please verify the information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSession = (sessionId: string) => {
    setCompletedItems((prev) => ({ ...prev, [sessionId]: !prev[sessionId] }));
  };

  const handleCopyPlan = () => {
    if (!plan) return;
    let md = `# ${plan.planTitle}\n**Subject**: ${plan.subject} | **Goal**: ${plan.targetGoal}\n**Timeline**: ${plan.examDate}\n\n`;
    md += `## Overview\n${plan.overview}\n\n`;
    plan.phases.forEach((phase) => {
      md += `### Phase ${phase.phaseNumber}: ${phase.phaseName} (${phase.durationDays} days)\n*Objective*: ${phase.objective}\n\n`;
      phase.dailySessions.forEach((s) => {
        md += `- **${s.day}** [${s.durationMinutes} mins]: ${s.focusTopic} (${s.method})\n`;
        s.actionItems.forEach((a) => (md += `  - ${a}\n`));
      });
      md += '\n';
    });
    md += `### Exam Readiness Checklist:\n`;
    plan.examReadinessChecklist.forEach((item) => (md += `- [ ] ${item}\n`));
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4">
      {/* Plan Parameters Setup */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Personalized Study Planner</h2>
              <p className="text-xs text-slate-500">
                Spaced repetition schedules with active recall, realistic breaks, and milestone drills.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {profile.grade} · <span className="font-semibold text-slate-800">{profile.subject}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="sm:col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Topic or Syllabus
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. AP Calculus AB, Organic Chemistry"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Exam Date / Timeline
            </label>
            <input
              type="text"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              placeholder="e.g. In 2 Weeks, Next Friday"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Daily Study Time
            </label>
            <input
              type="text"
              value={availableHours}
              onChange={(e) => setAvailableHours(e.target.value)}
              placeholder="e.g. 1 hour, 45 mins"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Target Goal / Desired Outcome
            </label>
            <input
              type="text"
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              placeholder="e.g. Score 90%+, Pass Final Exam, Master Fundamentals"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden bg-white"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGeneratePlan}
              disabled={isLoading || !topic.trim()}
              className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Drafting Schedule...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Build Study Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Study Plan Display */}
      {plan && (
        <div className="space-y-6">
          {/* Plan Meta Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{plan.planTitle}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target: <span className="font-semibold text-slate-700">{plan.targetGoal}</span> ·
                  Timeline: <span className="font-semibold text-slate-700">{plan.examDate}</span>
                </p>
              </div>

              <button
                onClick={handleCopyPlan}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors self-start sm:self-center"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Plan Markdown'}</span>
              </button>
            </div>

            <p className="text-sm text-slate-700 mt-3 leading-relaxed">{plan.overview}</p>

            {/* Pro Study Tips */}
            {plan.proStudyTips && plan.proStudyTips.length > 0 && (
              <div className="mt-4 p-3.5 bg-teal-50/60 border border-teal-200/80 rounded-xl text-xs text-teal-950">
                <span className="font-bold block mb-1">EduGenie Study Strategy:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {plan.proStudyTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Phased Sessions */}
          <div className="space-y-4">
            {plan.phases.map((phase) => (
              <div
                key={phase.phaseNumber}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">
                      {phase.phaseNumber}
                    </span>
                    <h4 className="text-base font-bold text-slate-900">{phase.phaseName}</h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {phase.durationDays} Days Duration
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-4 italic">Objective: {phase.objective}</p>

                {/* Session Action Items List */}
                <div className="space-y-3">
                  {phase.dailySessions.map((session, sIdx) => {
                    const sessionKey = `${phase.phaseNumber}-${sIdx}`;
                    const isDone = completedItems[sessionKey];

                    return (
                      <div
                        key={sIdx}
                        onClick={() => toggleSession(sessionKey)}
                        className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isDone
                            ? 'bg-slate-50 border-slate-200 text-slate-400 line-through opacity-70'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <button
                              type="button"
                              className="mt-0.5 text-teal-600 shrink-0"
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-300" />
                              )}
                            </button>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">
                                {session.day}: {session.focusTopic}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Method: <span className="capitalize font-medium">{session.method.replace('_', ' ')}</span> · Duration: {session.durationMinutes} mins + {session.breakMinutes} min break
                              </div>

                              <ul className="list-disc pl-4 mt-2 space-y-1 text-slate-700 not-italic">
                                {session.actionItems.map((act, aIdx) => (
                                  <li key={aIdx}>{act}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{session.durationMinutes}m</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Exam Readiness Checklist */}
          {plan.examReadinessChecklist && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-sky-600" />
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Exam Readiness Checklist
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {plan.examReadinessChecklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
