import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Bookmark,
  RefreshCw,
  HelpCircle,
  Layers,
  ArrowRight,
  GitCommit,
  FileCheck,
  RotateCcw,
} from 'lucide-react';
import { ChatMessage, LearningMode, StudentProfile, SavedNote } from '../types';
import { LEARNING_MODES } from '../constants/modes';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ModeSelector } from './ModeSelector';
import { speakText, stopSpeaking } from '../utils/audio';

interface TutorChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  currentMode: LearningMode;
  setCurrentMode: (mode: LearningMode) => void;
  profile: StudentProfile;
  onSaveNote: (note: Omit<SavedNote, 'id' | 'date'>) => void;
  onStartQuizOnTopic: (topic: string) => void;
  onGenerateFlashcardsOnTopic: (topic: string) => void;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
}

export const TutorChat: React.FC<TutorChatProps> = ({
  messages,
  setMessages,
  currentMode,
  setCurrentMode,
  profile,
  onSaveNote,
  onStartQuizOnTopic,
  onGenerateFlashcardsOnTopic,
  isSpeaking,
  setIsSpeaking,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || input).trim();
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      mode: currentMode,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      mode: currentMode,
      timestamp: Date.now(),
    };

    setMessages([...newMessages, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          studentProfile: profile,
          currentMode,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.statusText}`);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId ? { ...msg, content: accumulatedText } : msg
                    )
                  );
                }
              } catch {
                // Ignore parse errors on partial stream chunks
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Chat stream failed:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  'I encountered a brief issue connecting to the Gemini knowledge base. Please try asking again!',
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string, id: string) => {
    if (activeSpeechId === id && isSpeaking) {
      stopSpeaking();
      setActiveSpeechId(null);
      setIsSpeaking(false);
      return;
    }

    setActiveSpeechId(id);
    setIsSpeaking(true);

    speakText(
      text,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        setActiveSpeechId(null);
      },
      () => {
        setIsSpeaking(false);
        setActiveSpeechId(null);
      }
    );
  };

  const handleSaveToVault = (msg: ChatMessage) => {
    const titleSnippet = msg.content.slice(0, 45).replace(/[#*`]/g, '').trim() + '...';
    onSaveNote({
      title: `${currentMode.toUpperCase()}: ${titleSnippet}`,
      subject: profile.subject,
      topic: profile.focusTopic || profile.subject,
      content: msg.content,
      mode: msg.mode || currentMode,
    });
    setSavedNoteId(msg.id);
    setTimeout(() => setSavedNoteId(null), 2500);
  };

  const clearChat = () => {
    if (confirm('Clear current learning session conversation?')) {
      stopSpeaking();
      setMessages([]);
    }
  };

  // Sample prompt recommendations
  const activeModeDetails = LEARNING_MODES.find((m) => m.id === currentMode) || LEARNING_MODES[0];
  const suggestedPrompts = [
    activeModeDetails.samplePrompt,
    `Help me master ${profile.focusTopic || profile.subject} step-by-step for ${profile.grade} level.`,
    `What are the most common exam traps students make in ${profile.subject}?`,
    `Can you test my understanding of ${profile.focusTopic || 'this topic'} with a quick question?`,
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto">
      {/* Mode Selector Bar */}
      <ModeSelector currentMode={currentMode} onSelectMode={setCurrentMode} />

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto px-1 sm:px-2 py-3 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="py-8 px-4 text-center max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto text-sky-600 shadow-xs">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Hello, {profile.name || 'Learner'}!
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-lg mx-auto">
                I am <span className="font-semibold text-slate-900">EduGenie</span>, your personalized{' '}
                <span className="text-sky-700 font-semibold">{profile.subject}</span> learning assistant for{' '}
                <span className="text-slate-800 font-medium">{profile.grade}</span> level.
              </p>
              <div className="mt-2 text-xs text-slate-500">
                Current Mode:{' '}
                <span className="font-semibold text-slate-800">{activeModeDetails.name}</span> —{' '}
                {activeModeDetails.tagline}
              </div>
            </div>

            {/* Suggested Starter Prompts */}
            <div className="text-left space-y-2 pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Suggested Starters
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestedPrompts.map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(promptText)}
                    className="p-3 text-xs text-left bg-white hover:bg-sky-50/50 border border-slate-200/80 hover:border-sky-300 rounded-xl transition-all text-slate-700 hover:text-sky-900 shadow-2xs group flex items-start justify-between"
                  >
                    <span>"{promptText}"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600 shrink-0 ml-2 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const msgMode = msg.mode
              ? LEARNING_MODES.find((m) => m.id === msg.mode)?.name
              : undefined;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-xs">
                    EG
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 transition-all ${
                    isUser
                      ? 'bg-slate-900 text-white shadow-xs rounded-br-xs'
                      : 'bg-white border border-slate-200/90 shadow-2xs rounded-bl-xs'
                  }`}
                >
                  {/* Message Header / Mode Badge */}
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-slate-100/60 text-xs">
                    <span
                      className={`font-semibold ${
                        isUser ? 'text-slate-300' : 'text-slate-900 flex items-center gap-1.5'
                      }`}
                    >
                      {isUser ? profile.name || 'You' : 'EduGenie'}
                      {!isUser && msgMode && (
                        <span className="text-[10px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                          {msgMode}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Message Content */}
                  {isUser ? (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
                      {msg.content}
                    </div>
                  ) : (
                    <div>
                      {msg.content ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-sky-600 animate-ping" />
                          <span>EduGenie is thinking...</span>
                        </div>
                      )}

                      {/* Assistant Response Actions & Educational Shortcuts */}
                      {msg.content && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          {/* Left: Tools (Read Aloud, Copy, Save Note) */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSpeak(msg.content, msg.id)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                                activeSpeechId === msg.id && isSpeaking
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                              }`}
                              title="Listen to EduGenie read this aloud"
                            >
                              {activeSpeechId === msg.id && isSpeaking ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Listen</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleCopy(msg.content, msg.id)}
                              className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>

                            <button
                              onClick={() => handleSaveToVault(msg)}
                              className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                              title="Save to Notes Vault"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                              <span>{savedNoteId === msg.id ? 'Saved!' : 'Save Note'}</span>
                            </button>
                          </div>

                          {/* Right: Pedagogy Actions */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const snippet = msg.content.slice(0, 60);
                                onStartQuizOnTopic(snippet);
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors font-medium text-[11px]"
                            >
                              <HelpCircle className="w-3 h-3" />
                              <span>Quiz Me On This</span>
                            </button>

                            <button
                              onClick={() => {
                                const snippet = msg.content.slice(0, 60);
                                onGenerateFlashcardsOnTopic(snippet);
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors font-medium text-[11px]"
                            >
                              <Layers className="w-3 h-3" />
                              <span>Make Flashcards</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    {(profile.name || 'S')[0].toUpperCase()}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Area */}
      <div className="pt-2 pb-3 bg-slate-50/80">
        {/* Step-by-Step / Homework Mode Banner */}
        {currentMode === 'step_by_step' && (
          <div className="mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800">
            <span className="flex items-center gap-1.5 font-medium">
              <GitCommit className="w-3.5 h-3.5 text-amber-600" />
              Step-by-Step Mode active: Solve or submit one step at a time!
            </span>
            <span className="text-[11px] text-amber-600 font-normal">Active Learning</span>
          </div>
        )}

        {currentMode === 'homework' && (
          <div className="mb-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
            <span className="flex items-center gap-1.5 font-medium">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              Homework Guidance: EduGenie will guide your reasoning and review errors constructively.
            </span>
          </div>
        )}

        <div className="relative bg-white border border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 rounded-2xl shadow-sm transition-all overflow-hidden">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentMode === 'step_by_step'
                ? 'Type your attempt for the next step...'
                : currentMode === 'homework'
                ? 'Paste the problem or your current solution for constructive review...'
                : `Ask EduGenie in ${activeModeDetails.name}... (Press Enter to send, Shift+Enter for new line)`
            }
            className="w-full px-4 pt-3 pb-12 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden resize-none max-h-40 overflow-y-auto"
          />

          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded transition-colors"
                  title="Clear conversation"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {profile.grade} · {profile.difficulty}
              </span>
            </div>

            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Send</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
