import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  HelpCircle,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { StudentProfile, TeachBackReview } from '../types';
import { speakText } from '../utils/audio';

interface TeachBackArenaProps {
  profile: StudentProfile;
}

const SUGGESTED_CONCEPTS: Record<string, string[]> = {
  Mathematics: [
    'What is a Derivative (Rate of Change)?',
    'Why is the Pythagorean Theorem true?',
    'What does the Limit of a function mean?',
  ],
  Physics: [
    "Newton's Third Law (Action & Reaction)",
    'Conservation of Energy',
    'Special Relativity Time Dilation',
  ],
  Chemistry: [
    'Chemical Equilibrium & Le Chatelier’s Principle',
    'Covalent vs Ionic Bonding',
    'Acids, Bases, and pH',
  ],
  Biology: [
    'Natural Selection & Evolution',
    'How Cellular Respiration produces ATP',
    'DNA Replication mechanism',
  ],
  'Computer Science': [
    'How Binary Search works and why O(log n)',
    'Recursion vs Iteration',
    'The Client-Server HTTP architecture',
  ],
  'Economics & Business': [
    'Supply and Demand Equilibrium',
    'Opportunity Cost',
    'Inflation and Purchasing Power',
  ],
};

export const TeachBackArena: React.FC<TeachBackArenaProps> = ({ profile }) => {
  const [concept, setConcept] = useState(
    profile.focusTopic || (SUGGESTED_CONCEPTS[profile.subject]?.[0] || 'How Photosynthesis works')
  );
  const [studentExplanation, setStudentExplanation] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [review, setReview] = useState<TeachBackReview | null>(null);

  const handleEvaluate = async () => {
    if (!concept.trim() || !studentExplanation.trim()) return;
    setIsEvaluating(true);
    setReview(null);

    try {
      const res = await fetch('/api/teach-back/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          studentExplanation,
          targetLevel: profile.grade,
        }),
      });

      if (!res.ok) throw new Error('Evaluation failed');
      const data = await res.json();
      setReview(data);
    } catch (err) {
      console.error('Teach back error:', err);
      alert('Could not evaluate explanation right now. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const getMasteryColor = (rating: string) => {
    switch (rating) {
      case 'Mastery':
        return 'text-emerald-700 bg-emerald-50 border-emerald-300';
      case 'Advanced':
        return 'text-sky-700 bg-sky-50 border-sky-300';
      case 'Competent':
        return 'text-indigo-700 bg-indigo-50 border-indigo-300';
      case 'Developing':
      default:
        return 'text-amber-700 bg-amber-50 border-amber-300';
    }
  };

  const currentSuggestions = SUGGESTED_CONCEPTS[profile.subject] || [
    'How gravity works',
    'The Water Cycle',
    'Why leaves are green',
  ];

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4">
      {/* Intro Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Teach-Back Arena (Feynman Method)</h2>
              <p className="text-xs text-slate-500">
                The ultimate test of understanding: explain the concept in your own words, and let
                EduGenie analyze your clarity and depth.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {profile.grade} · <span className="font-semibold text-slate-800">{profile.subject}</span>
          </div>
        </div>

        {/* Concept Selector */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Concept to Teach EduGenie
            </label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g. How Natural Selection works, Derivatives in Calculus"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden bg-white"
            />
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400">Recommended topics:</span>
            {currentSuggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setConcept(s)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border border-slate-200/80 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Student's Teaching Submission Area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs mb-6">
        <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
          Your Explanation (Teach EduGenie like I am a curious student):
        </label>
        <p className="text-xs text-slate-500 mb-3">
          Use your own words, analogies, and examples. Don't worry about being perfect — the goal is
          to surface what you truly know!
        </p>

        <textarea
          rows={6}
          value={studentExplanation}
          onChange={(e) => setStudentExplanation(e.target.value)}
          placeholder={`"Imagine you want to explain ${concept} to a friend... Here is how it works..."`}
          className="w-full p-4 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden bg-slate-50/50 focus:bg-white resize-y leading-relaxed"
        />

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
          <span className="text-xs text-slate-400">
            {studentExplanation.trim().split(/\s+/).filter(Boolean).length} words
          </span>

          <button
            onClick={handleEvaluate}
            disabled={isEvaluating || !concept.trim() || !studentExplanation.trim()}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isEvaluating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>EduGenie is analyzing your explanation...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Evaluate My Explanation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Review & Evaluation Banner */}
      {review && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
          {/* Top Rating Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold uppercase text-slate-400">Concept</span>
              <h3 className="text-lg font-bold text-slate-900">{concept}</h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Feynman Mastery Rating:</span>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider ${getMasteryColor(
                  review.masteryRating
                )}`}
              >
                {review.masteryRating}
              </span>
            </div>
          </div>

          {/* Overall Assessment */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed">
            <span className="font-bold text-slate-900 block mb-1">EduGenie Assessment:</span>
            {review.overallAssessment}
          </div>

          {/* Strengths & Accurate Insights */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>What You Explained Brilliantly:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {review.strengths.map((str, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-950 flex items-start gap-2"
                >
                  <span className="font-bold text-emerald-700">•</span>
                  <span>{str}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Misconceptions or Gaps */}
          {review.misconceptionsOrGaps && review.misconceptionsOrGaps.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Misconceptions or Nuances to Refine:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {review.misconceptionsOrGaps.map((gap, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-amber-950 flex items-start gap-2"
                  >
                    <span className="font-bold text-amber-700">•</span>
                    <span>{gap}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How to Improve / Master's Analogy */}
          <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl text-xs text-purple-950 space-y-2">
            <div>
              <span className="font-bold block mb-1">How to make your explanation airtight:</span>
              <p className="leading-relaxed">{review.howToImproveExplanation}</p>
            </div>

            {review.clarifyingAnalogy && (
              <div className="pt-2 border-t border-purple-200/80">
                <span className="font-bold block mb-0.5">Master's Clarifying Analogy:</span>
                <p className="italic text-purple-900">"{review.clarifyingAnalogy}"</p>
              </div>
            )}
          </div>

          {/* Follow-up Checkpoint Challenge */}
          {review.followUpCheckpointQuestion && (
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-950">
              <span className="font-bold block mb-1 text-sky-900">
                Quick Boundary Check Challenge:
              </span>
              <p className="leading-relaxed">{review.followUpCheckpointQuestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
