import React from 'react';
import {
  Sparkles,
  GraduationCap,
  MessageSquare,
  HelpCircle,
  Layers,
  Calendar,
  Award,
  BookMarked,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { StudentProfile } from '../types';
import { isCurrentlySpeaking, stopSpeaking } from '../utils/audio';

export type MainTab = 'chat' | 'quiz' | 'flashcards' | 'planner' | 'teach_back' | 'notes';

interface HeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  profile: StudentProfile;
  onOpenProfile: () => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  profile,
  onOpenProfile,
  isSpeaking,
  onStopSpeaking,
}) => {
  const navItems: { id: MainTab; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'Tutor Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'quiz', label: 'Quiz & Exams', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Layers className="w-4 h-4" /> },
    { id: 'planner', label: 'Study Planner', icon: <Calendar className="w-4 h-4" /> },
    { id: 'teach_back', label: 'Teach-Back', icon: <Award className="w-4 h-4" /> },
    { id: 'notes', label: 'Notes Vault', icon: <BookMarked className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Brand & Profile Row */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm ring-2 ring-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">EduGenie</span>
                <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-200/60 px-1.5 py-0.5 rounded">
                  Gemini Powered
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 font-normal">
                Learn smarter · Understand deeper · Grow independently
              </p>
            </div>
          </div>

          {/* Student Profile Quick View & Speech Control */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isSpeaking && (
              <button
                onClick={onStopSpeaking}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors animate-pulse"
                title="Stop EduGenie voice playback"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Speaking...</span>
                <span className="text-[10px] underline">Stop</span>
              </button>
            )}

            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors group"
            >
              <GraduationCap className="w-4 h-4 text-sky-600 group-hover:scale-105 transition-transform" />
              <div className="text-left hidden md:block">
                <div className="font-semibold text-slate-800 leading-none">
                  {profile.name || 'Student'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {profile.grade} · {profile.subject}
                </div>
              </div>
              <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 ml-1" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none border-t border-slate-100 pt-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
