import React from 'react';
import {
  BookOpen,
  Sparkles,
  Compass,
  GitCommit,
  FileText,
  HelpCircle,
  Layers,
  Award,
  CheckCircle,
  Zap,
  ListOrdered,
  Calendar,
} from 'lucide-react';
import { LearningMode, LearningModeInfo } from '../types';
import { LEARNING_MODES } from '../constants/modes';

interface ModeSelectorProps {
  currentMode: LearningMode;
  onSelectMode: (mode: LearningMode) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Compass: <Compass className="w-4 h-4" />,
  GitCommit: <GitCommit className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  HelpCircle: <HelpCircle className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
  Award: <Award className="w-4 h-4" />,
  CheckCircle: <CheckCircle className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  ListOrdered: <ListOrdered className="w-4 h-4" />,
  Calendar: <Calendar className="w-4 h-4" />,
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onSelectMode }) => {
  const activeModeInfo = LEARNING_MODES.find((m) => m.id === currentMode) || LEARNING_MODES[0];

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Learning Mode
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs font-medium text-sky-700">12 Specialized Pedagogical Modes</span>
        </div>
      </div>

      {/* Horizontal Mode Chips with clean interactive button states */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
        {LEARNING_MODES.map((mode) => {
          const isActive = mode.id === currentMode;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap font-medium ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/70'
              }`}
              title={mode.description}
            >
              <span className={isActive ? 'text-sky-400' : 'text-slate-500'}>
                {iconMap[mode.iconName]}
              </span>
              <span>{mode.name.replace(' Mode', '')}</span>
            </button>
          );
        })}
      </div>

      {/* Current Mode Description Banner */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-start sm:items-center gap-2 text-slate-600">
          <span className="font-semibold text-slate-900">{activeModeInfo.name}:</span>
          <span>{activeModeInfo.description}</span>
        </div>
        <div className="text-slate-500 shrink-0 font-medium">
          Category: <span className="text-slate-700">{activeModeInfo.category}</span>
        </div>
      </div>
    </div>
  );
};
