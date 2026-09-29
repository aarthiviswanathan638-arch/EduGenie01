import React, { useState, useEffect } from 'react';
import { Header, MainTab } from './components/Header';
import { TutorChat } from './components/TutorChat';
import { QuizView } from './components/QuizView';
import { FlashcardsView } from './components/FlashcardsView';
import { StudyPlanView } from './components/StudyPlanView';
import { TeachBackArena } from './components/TeachBackArena';
import { NotesVaultView } from './components/NotesVaultView';
import { StudentProfileModal } from './components/StudentProfileModal';
import { StudentProfile, LearningMode, ChatMessage, SavedNote } from './types';
import { DEFAULT_PROFILE } from './constants/modes';
import { stopSpeaking } from './utils/audio';

const STORAGE_KEYS = {
  PROFILE: 'edugenie_student_profile',
  MESSAGES: 'edugenie_chat_messages',
  NOTES: 'edugenie_saved_notes',
  MODE: 'edugenie_active_mode',
};

const INITIAL_NOTE: SavedNote = {
  id: 'seed-note-1',
  title: 'EduGenie: 12 Pedagogical Learning Modes Guide',
  subject: 'General Science',
  topic: 'Learning Strategies',
  content: `## Welcome to EduGenie 🧞‍♂️

EduGenie is your intelligent, adaptive learning companion powered by Google Gemini, designed to prioritize **true understanding** over superficial answers.

### The 12 Learning Modes:

1. **Explain Mode**: Structured concept breakdown from fundamentals to applications.
2. **Simplify Mode**: "ELI10" everyday analogies for intuitive clarity without loss of accuracy.
3. **Deep Dive Mode**: Formal mathematical foundations, theoretical nuance, and edge cases.
4. **Step-by-Step Mode**: Interactive problem solving where EduGenie presents one step and prompts you to solve the next!
5. **Homework Guidance Mode**: Ethical mentoring that reviews your reasoning and pinpoints errors without shaming.
6. **Quiz Mode**: Dynamic active recall with instant hints, adaptive difficulty, and constructive explanations.
7. **Flashcard Mode**: High-yield question-and-answer cards with mnemonics and mastery tracking.
8. **Teach-Back Mode**: The Feynman Technique — explain a concept in your own words, and EduGenie highlights your strengths and gaps.
9. **Exam Mode**: Realistic exam papers with rubrics and marking schemes.
10. **Revision Mode**: Rapid cheat sheets and formula summaries before big tests.
11. **Summarize Mode**: Turn lengthy textbook chapters or papers into structured study notes.
12. **Study Plan Mode**: Spaced repetition schedules with active recall sessions and realistic breaks.

> *"Learn smarter. Understand deeper. Grow independently."*`,
  mode: 'explain',
  date: Date.now(),
};

export default function App() {
  // Load saved profile or fallback
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // Current active mode
  const [currentMode, setCurrentMode] = useState<LearningMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MODE);
      return (saved as LearningMode) || 'explain';
    } catch {
      return 'explain';
    }
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<MainTab>('chat');

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Saved Notes Vault state
  const [notes, setNotes] = useState<SavedNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      return saved ? JSON.parse(saved) : [INITIAL_NOTE];
    } catch {
      return [INITIAL_NOTE];
    }
  });

  // Cross-tab interaction bridges
  const [quizBridgeTopic, setQuizBridgeTopic] = useState<string>('');
  const [flashcardBridgeTopic, setFlashcardBridgeTopic] = useState<string>('');

  // Profile modal toggle
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Global Audio Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Persist profile
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not persist profile', e);
    }
  }, [profile]);

  // Persist current mode
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MODE, currentMode);
    } catch (e) {
      console.warn('Could not persist mode', e);
    }
  }, [currentMode]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not persist messages', e);
    }
  }, [messages]);

  // Persist notes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (e) {
      console.warn('Could not persist notes', e);
    }
  }, [notes]);

  const handleSaveNote = (newNote: Omit<SavedNote, 'id' | 'date'>) => {
    const note: SavedNote = {
      ...newNote,
      id: `note-${Date.now()}`,
      date: Date.now(),
    };
    setNotes((prev) => [note, ...prev]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleStartQuizOnTopic = (topic: string) => {
    setQuizBridgeTopic(topic);
    setActiveTab('quiz');
  };

  const handleGenerateFlashcardsOnTopic = (topic: string) => {
    setFlashcardBridgeTopic(topic);
    setActiveTab('flashcards');
  };

  const handleGenerateQuickCheatSheet = (topic: string) => {
    setCurrentMode('revision');
    setActiveTab('chat');
    // Pre-send request to chat
    const userPrompt = `Generate a rapid revision cheat sheet for: ${topic}. Include core definitions, essential formulas with units, and top exam traps.`;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userPrompt,
      mode: 'revision',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-sky-100 selection:text-sky-900">
      {/* Top Persistent Navigation Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          stopSpeaking();
          setIsSpeaking(false);
          setActiveTab(tab);
        }}
        profile={profile}
        onOpenProfile={() => setIsProfileOpen(true)}
        isSpeaking={isSpeaking}
        onStopSpeaking={handleStopSpeaking}
      />

      {/* Main Learning Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {activeTab === 'chat' && (
          <TutorChat
            messages={messages}
            setMessages={setMessages}
            currentMode={currentMode}
            setCurrentMode={setCurrentMode}
            profile={profile}
            onSaveNote={handleSaveNote}
            onStartQuizOnTopic={handleStartQuizOnTopic}
            onGenerateFlashcardsOnTopic={handleGenerateFlashcardsOnTopic}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            profile={profile}
            initialTopic={quizBridgeTopic}
            onSaveNotes={(title, content) =>
              handleSaveNote({
                title,
                content,
                subject: profile.subject,
                topic: quizBridgeTopic || profile.focusTopic || profile.subject,
                mode: 'quiz',
              })
            }
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsView
            profile={profile}
            initialTopic={flashcardBridgeTopic}
            onSaveToVault={(title, content) =>
              handleSaveNote({
                title,
                content,
                subject: profile.subject,
                topic: flashcardBridgeTopic || profile.focusTopic || profile.subject,
                mode: 'flashcards',
              })
            }
          />
        )}

        {activeTab === 'planner' && <StudyPlanView profile={profile} />}

        {activeTab === 'teach_back' && <TeachBackArena profile={profile} />}

        {activeTab === 'notes' && (
          <NotesVaultView
            notes={notes}
            onDeleteNote={handleDeleteNote}
            profile={profile}
            onGenerateQuickCheatSheet={handleGenerateQuickCheatSheet}
          />
        )}
      </main>

      {/* Student Profile Customizer Modal */}
      <StudentProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSave={(updated) => setProfile(updated)}
      />
    </div>
  );
}
