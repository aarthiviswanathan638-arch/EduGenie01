import React, { useState } from 'react';
import {
  BookMarked,
  Copy,
  Check,
  Trash2,
  Download,
  Search,
  Filter,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { SavedNote, StudentProfile } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface NotesVaultViewProps {
  notes: SavedNote[];
  onDeleteNote: (id: string) => void;
  profile: StudentProfile;
  onGenerateQuickCheatSheet: (topic: string) => void;
}

export const NotesVaultView: React.FC<NotesVaultViewProps> = ({
  notes,
  onDeleteNote,
  profile,
  onGenerateQuickCheatSheet,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedNote, setSelectedNote] = useState<SavedNote | null>(notes[0] || null);
  const [copied, setCopied] = useState(false);
  const [cheatTopic, setCheatTopic] = useState('');

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || n.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (note: SavedNote) => {
    const blob = new Blob([note.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const subjects = ['All', ...Array.from(new Set(notes.map((n) => n.subject)))];

  return (
    <div className="max-w-6xl mx-auto py-4 px-2 sm:px-4">
      {/* Vault Header & Generator Prompt */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Notes & Revision Vault</h2>
              <p className="text-xs text-slate-500">
                Curated summaries, high-yield formula sheets, and study notes saved from your sessions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Total Saved Notes: <span className="font-bold text-slate-800">{notes.length}</span>
            </span>
          </div>
        </div>

        {/* Quick Revision Cheat Sheet Generator */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={cheatTopic}
            onChange={(e) => setCheatTopic(e.target.value)}
            placeholder="Generate rapid revision cheat sheet on a topic (e.g. Calculus Differentiation, Thermodynamics)..."
            className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-hidden bg-slate-50/50 focus:bg-white w-full"
          />
          <button
            onClick={() => {
              if (cheatTopic.trim()) {
                onGenerateQuickCheatSheet(cheatTopic.trim());
                setCheatTopic('');
              }
            }}
            disabled={!cheatTopic.trim()}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Generate Cheat Sheet</span>
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Your Vault is Empty</h3>
          <p className="text-xs text-slate-500">
            Save explanations, revision summaries, and step-by-step guides from your Tutor Chat
            sessions by clicking "Save Note" on any message!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Notes Sidebar List */}
          <div className="md:col-span-5 space-y-3">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search notes..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden bg-white"
                />
              </div>

              {subjects.length > 2 && (
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-hidden"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Note Cards List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredNotes.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/60 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-sky-800 uppercase tracking-wider">
                        {note.subject}
                      </span>
                      <span>{new Date(note.date).toLocaleDateString()}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{note.title}</h4>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {note.content.replace(/[#*`]/g, '')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Note Preview & Action Pane */}
          <div className="md:col-span-7">
            {selectedNote ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
                      {selectedNote.subject} · {selectedNote.topic}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedNote.title}</h3>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-center">
                    <button
                      onClick={() => handleCopy(selectedNote.content)}
                      className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                      title="Copy Note Markdown"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleDownload(selectedNote)}
                      className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                      title="Download as .md file"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Delete this note?')) {
                          onDeleteNote(selectedNote.id);
                          setSelectedNote(null);
                        }
                      }}
                      className="p-1.5 border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Markdown content */}
                <div className="max-h-[550px] overflow-y-auto pr-2">
                  <MarkdownRenderer content={selectedNote.content} />
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                Select a note on the left to read and review.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
