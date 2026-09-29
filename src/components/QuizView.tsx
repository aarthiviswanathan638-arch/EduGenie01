import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Award,
  ChevronRight,
  BookOpen,
  Volume2,
} from 'lucide-react';
import { QuizQuestion, QuizSet, StudentProfile } from '../types';
import { speakText } from '../utils/audio';

interface QuizViewProps {
  profile: StudentProfile;
  initialTopic?: string;
  onSaveNotes?: (title: string, content: string) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ profile, initialTopic = '' }) => {
  const [topic, setTopic] = useState(initialTopic || profile.focusTopic || `${profile.subject} Core Fundamentals`);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [quizSet, setQuizSet] = useState<QuizSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Current question interaction state
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [shortAnswerText, setShortAnswerText] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    isCorrect: boolean;
    score: number;
    feedback: string;
    strengths?: string[];
    correctiveTip: string;
    whyMistakeOccurred?: string;
  } | null>(null);

  const [completed, setCompleted] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setQuizSet(null);
    setCurrentIndex(0);
    setCompleted(false);
    setSelectedOption('');
    setShortAnswerText('');
    setEvaluationResult(null);
    setShowHint(false);

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          subject: profile.subject,
          grade: profile.grade,
          difficulty,
          count: questionCount,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate quiz');

      const data = await res.json();
      setQuizSet({
        id: `quiz-${Date.now()}`,
        topic: data.topic || topic,
        overview: data.overview || '',
        subject: profile.subject,
        grade: profile.grade,
        questions: data.questions || [],
      });
      setScoreHistory({ correct: 0, total: (data.questions || []).length });
    } catch (err) {
      console.error('Quiz generation error:', err);
      alert('Could not generate quiz right now. Please try a different topic or check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentQ = quizSet?.questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!currentQ || isEvaluating) return;

    const answer = currentQ.type === 'short_answer' ? shortAnswerText.trim() : selectedOption;
    if (!answer) return;

    setIsEvaluating(true);

    try {
      const res = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          studentAnswer: answer,
          correctAnswer: currentQ.correctAnswer,
          conceptTested: currentQ.conceptTested,
          grade: profile.grade,
        }),
      });

      const evalData = await res.json();
      setEvaluationResult(evalData);

      // Update question state in set
      const isCorrect = evalData.isCorrect || evalData.score >= 70;
      if (isCorrect) {
        setScoreHistory((prev) => ({ ...prev, correct: prev.correct + 1 }));
      }

      setQuizSet((prev) => {
        if (!prev) return prev;
        const updated = [...prev.questions];
        updated[currentIndex] = {
          ...updated[currentIndex],
          studentAnswer: answer,
          isCorrect,
          score: evalData.score,
          feedback: evalData.feedback,
          reviewed: true,
        };
        return { ...prev, questions: updated };
      });
    } catch (err) {
      console.error('Evaluation error:', err);
      // Fallback simple check
      const isMatch = answer.toLowerCase().trim() === currentQ.correctAnswer.toLowerCase().trim();
      setEvaluationResult({
        isCorrect: isMatch,
        score: isMatch ? 100 : 0,
        feedback: isMatch
          ? 'Great job! You grasped this concept correctly.'
          : `Good attempt. The expected answer is: ${currentQ.correctAnswer}.`,
        correctiveTip: currentQ.explanation,
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (!quizSet) return;
    if (currentIndex < quizSet.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption('');
      setShortAnswerText('');
      setEvaluationResult(null);
      setShowHint(false);
    } else {
      setCompleted(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4">
      {/* Quiz Header & Setup Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Quiz & Exam Master</h2>
              <p className="text-xs text-slate-500">
                Active recall testing with real-time feedback & constructive explanations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{profile.grade}</span>
            <span>·</span>
            <span className="font-semibold text-slate-800">{profile.subject}</span>
          </div>
        </div>

        {/* Generator Controls */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Quiz Topic or Concept
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Newton's Laws, Quadratic Equations, Photosynthesis"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-hidden bg-white"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Questions
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-hidden bg-white"
            >
              <option value={3}>3 Questions (Quick Drill)</option>
              <option value={5}>5 Questions (Standard)</option>
              <option value={8}>8 Questions (Deep Practice)</option>
              <option value={10}>10 Questions (Full Test)</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex items-end">
            <button
              onClick={handleGenerateQuiz}
              disabled={isLoading || !topic.trim()}
              className="w-full px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Building...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Quiz</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quiz Live Interactive Panel */}
      {quizSet && !completed && currentQ && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs animate-in fade-in duration-200">
          {/* Progress Tracker */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                Question {currentIndex + 1} of {quizSet.questions.length}
              </span>
              <span>·</span>
              <span className="capitalize text-slate-600">{currentQ.difficulty} Difficulty</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Score:</span>
              <span className="font-bold text-sky-700">
                {scoreHistory.correct} / {currentIndex + (evaluationResult ? 1 : 0)}
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-sky-700 uppercase tracking-wider mb-1">
              Concept: {currentQ.conceptTested}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* Options / Input Formats */}
          {currentQ.type === 'short_answer' ? (
            <div className="mb-6">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Type your answer or reasoning below:
              </label>
              <textarea
                rows={3}
                value={shortAnswerText}
                onChange={(e) => setShortAnswerText(e.target.value)}
                disabled={evaluationResult !== null}
                placeholder="Explain the step or answer in your own words..."
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-hidden bg-white"
              />
            </div>
          ) : (
            <div className="space-y-2.5 mb-6">
              {(currentQ.options || ['True', 'False']).map((opt, idx) => {
                const isSelected = selectedOption === opt;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={evaluationResult !== null}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <span>{opt}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-sky-600 bg-sky-600' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Hint Expander */}
          <div className="mb-6">
            {!showHint ? (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Need a hint? (EduGenie prompt)</span>
              </button>
            ) : (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Hint: </span>
                  {currentQ.hint}
                </div>
              </div>
            )}
          </div>

          {/* Evaluation Result Feedback Banner (Following EduGenie Pedagogy) */}
          {evaluationResult && (
            <div
              className={`p-4 rounded-xl border mb-6 animate-in fade-in duration-200 ${
                evaluationResult.isCorrect
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {evaluationResult.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-600" />
                )}
                <span className="font-bold text-sm">
                  {evaluationResult.isCorrect ? 'Well done!' : "You're close! Let's understand why:"}
                </span>
                <span className="text-xs ml-auto font-semibold">
                  Score: {evaluationResult.score}/100
                </span>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed mb-2">{evaluationResult.feedback}</p>

              {evaluationResult.whyMistakeOccurred && (
                <div className="text-xs text-slate-700 mt-1">
                  <span className="font-semibold">Why this occurred: </span>
                  {evaluationResult.whyMistakeOccurred}
                </div>
              )}

              {evaluationResult.correctiveTip && (
                <div className="text-xs font-medium text-slate-800 mt-2 pt-2 border-t border-slate-200/60">
                  <span className="font-semibold text-slate-900">Correct Method: </span>
                  {evaluationResult.correctiveTip}
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              {currentQ.type === 'mcq'
                ? 'Multiple Choice'
                : currentQ.type === 'true_false'
                ? 'True / False'
                : 'Concept Reasoning'}
            </span>

            {!evaluationResult ? (
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={
                  isEvaluating ||
                  (currentQ.type === 'short_answer' ? !shortAnswerText.trim() : !selectedOption)
                }
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                {isEvaluating ? 'Evaluating...' : 'Check Answer'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <span>
                  {currentIndex < quizSet.questions.length - 1 ? 'Next Question' : 'Complete Quiz'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completion Summary Screen */}
      {completed && quizSet && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">Quiz Completed!</h3>
            <p className="text-sm text-slate-600 mt-1">
              Topic: <span className="font-semibold text-slate-800">{quizSet.topic}</span>
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-around">
            <div>
              <div className="text-2xl font-bold text-sky-700">{scoreHistory.correct}</div>
              <div className="text-xs text-slate-500">Correct Answers</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {Math.round((scoreHistory.correct / quizSet.questions.length) * 100)}%
              </div>
              <div className="text-xs text-slate-500">Mastery Score</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-2xl font-bold text-slate-700">{quizSet.questions.length}</div>
              <div className="text-xs text-slate-500">Total Tested</div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            EduGenie Principle: Mistakes are stepping stones. Review your questions or try a deeper
            practice session to lock in mastery.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setCompleted(false);
                setCurrentIndex(0);
                setScoreHistory({ correct: 0, total: quizSet.questions.length });
                setSelectedOption('');
                setShortAnswerText('');
                setEvaluationResult(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry This Quiz</span>
            </button>

            <button
              onClick={() => {
                setQuizSet(null);
                setCompleted(false);
              }}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              New Quiz Topic
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
