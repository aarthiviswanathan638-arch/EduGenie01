import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  CheckCircle,
  Clock,
  Download,
  Copy,
  Check,
  Volume2,
  Lightbulb,
} from 'lucide-react';
import { Flashcard, FlashcardDeck, StudentProfile } from '../types';
import { speakText } from '../utils/audio';

interface FlashcardsViewProps {
  profile: StudentProfile;
  initialTopic?: string;
  onSaveToVault?: (title: string, content: string) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  profile,
  initialTopic = '',
  onSaveToVault,
}) => {
  const [topic, setTopic] = useState(
    initialTopic || profile.focusTopic || `${profile.subject} Key Definitions & Formulas`
  );
  const [cardCount, setCardCount] = useState(8);
  const [isLoading, setIsLoading] = useState(false);
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStatuses, setCardStatuses] = useState<Record<string, 'unstudied' | 'learning' | 'mastered'>>({});
  const [copied, setCopied] = useState(false);

  const handleGenerateDeck = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setDeck(null);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStatuses({});

    try {
      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          subject: profile.subject,
          grade: profile.grade,
          cardCount,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate flashcards');

      const data = await res.json();
      const generatedDeck: FlashcardDeck = {
        id: `deck-${Date.now()}`,
        title: data.deckTitle || `Deck: ${topic}`,
        topic: data.topic || topic,
        subject: profile.subject,
        createdAt: Date.now(),
        cards: data.cards || [],
      };

      setDeck(generatedDeck);
    } catch (err) {
      console.error('Flashcard error:', err);
      alert('Could not generate flashcards. Please check your topic and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentCard = deck?.cards[currentIndex];

  const handleFlip = () => setIsFlipped((prev) => !prev);

  const handleNext = () => {
    if (!deck) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % deck.cards.length);
  };

  const handlePrev = () => {
    if (!deck) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + deck.cards.length) % deck.cards.length);
  };

  const handleShuffle = () => {
    if (!deck) return;
    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    setDeck({ ...deck, cards: shuffled });
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const markStatus = (status: 'learning' | 'mastered') => {
    if (!currentCard) return;
    setCardStatuses((prev) => ({ ...prev, [currentCard.id]: status }));
    handleNext();
  };

  const masteredCount = Object.values(cardStatuses).filter((s) => s === 'mastered').length;
  const learningCount = Object.values(cardStatuses).filter((s) => s === 'learning').length;

  const exportAsMarkdown = () => {
    if (!deck) return;
    let md = `# Flashcard Deck: ${deck.title}\n**Subject**: ${deck.subject} | **Topic**: ${deck.topic}\n\n`;
    deck.cards.forEach((c, i) => {
      md += `### Card ${i + 1}: ${c.front}\n- **Key Term**: ${c.keyTerm}\n- **Explanation**: ${c.back}\n`;
      if (c.mnemonic) md += `- **Mnemonic**: ${c.mnemonic}\n`;
      if (c.example) md += `- **Example**: ${c.example}\n`;
      md += `\n---\n\n`;
    });
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4">
      {/* Deck Setup Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active Recall Flashcards</h2>
              <p className="text-xs text-slate-500">
                Spaced repetition card decks with mnemonics, key terms, and active recall testing.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {profile.grade} · <span className="font-semibold text-slate-800">{profile.subject}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7">
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Deck Topic or Vocabulary
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Organic Chemistry Reactions, Cell Organelles, World War II Treaties"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Cards
            </label>
            <select
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden bg-white"
            >
              <option value={5}>5 Cards</option>
              <option value={8}>8 Cards</option>
              <option value={12}>12 Cards</option>
              <option value={16}>16 Cards</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex items-end">
            <button
              onClick={handleGenerateDeck}
              disabled={isLoading || !topic.trim()}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Building Deck...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Deck</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Flashcard Study Studio */}
      {deck && currentCard && (
        <div className="space-y-4">
          {/* Deck Top Meta & Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{deck.title}</span>
              <span>·</span>
              <span>
                Card {currentIndex + 1} of {deck.cards.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{masteredCount} Mastered</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{learningCount} In Review</span>
              </div>
              <button
                onClick={exportAsMarkdown}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 border border-slate-200 px-2 py-0.5 rounded-md transition-colors"
                title="Copy Deck as Markdown"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Export'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Card Canvas */}
          <div
            onClick={handleFlip}
            className="w-full min-h-[300px] sm:min-h-[340px] bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-10 shadow-xs cursor-pointer hover:border-indigo-300 transition-all flex flex-col justify-between select-none relative group"
          >
            {/* Top Indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-indigo-700 uppercase tracking-wider">
                {isFlipped ? 'Answer & Explanation' : 'Question / Concept Prompt'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakText(isFlipped ? currentCard.back : currentCard.front);
                  }}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition-colors"
                  title="Listen to card audio"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <span className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Click to flip</span>
                </span>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="my-auto py-4 text-center">
              {!isFlipped ? (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">
                    Concept Prompt
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 max-w-xl mx-auto leading-relaxed">
                    {currentCard.front}
                  </h3>
                </div>
              ) : (
                <div className="space-y-4 max-w-xl mx-auto text-left animate-in fade-in duration-150">
                  <div>
                    <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                      Key Term:
                    </span>
                    <h4 className="text-lg font-bold text-slate-900">{currentCard.keyTerm}</h4>
                  </div>

                  <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
                    {currentCard.back}
                  </p>

                  {currentCard.mnemonic && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Memory Trick (Mnemonic): </span>
                        {currentCard.mnemonic}
                      </div>
                    </div>
                  )}

                  {currentCard.example && (
                    <div className="text-xs text-slate-600 border-l-2 border-indigo-400 pl-3 italic">
                      <span className="font-semibold text-slate-700 not-italic">Example: </span>
                      {currentCard.example}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Status / Difficulty */}
            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
              <span className="capitalize">{currentCard.difficulty} Level</span>
              <span className="text-slate-400 text-[11px]">EduGenie Active Recall Deck</span>
            </div>
          </div>

          {/* Card Controls & Rating Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 transition-colors"
                title="Previous card"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleShuffle}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-medium text-slate-700 transition-colors"
                title="Shuffle deck"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>
              <button
                onClick={handleNext}
                className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 transition-colors"
                title="Next card"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Active Recall Mastery Rating Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => markStatus('learning')}
                className="flex-1 sm:flex-initial px-4 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Need Review</span>
              </button>
              <button
                onClick={() => markStatus('mastered')}
                className="flex-1 sm:flex-initial px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Got It! (Mastered)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
