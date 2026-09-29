'use client';

import React, { useMemo, useState } from 'react';
import { FileText, Plus, Search, Trash2 } from 'lucide-react';
import { KaryaNote } from '@/types/karya';

interface NotesPanelProps {
  notes: KaryaNote[];
  onAddNote: (title: string, content: string) => void;
  onUpdateNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ notes, onAddNote, onUpdateNote, onDeleteNote }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return !query ? notes : notes.filter((note) => note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query));
  }, [notes, search]);

  const selectedNote = filteredNotes.find((note) => note.id === selectedNoteId) || notes.find((note) => note.id === selectedNoteId) || filteredNotes[0] || notes[0] || null;

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    onAddNote(title.trim(), content.trim());
    setTitle('');
    setContent('');
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-2 py-6">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1.4fr]">
        <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Notes</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Quick capture</h2>
            </div>
            <FileText className="h-5 w-5 text-violet-300" />
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <label className="block text-xs text-slate-300">
              <span className="mb-1 block">Note title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Chemistry" className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/60" />
            </label>
            <label className="block text-xs text-slate-300">
              <span className="mb-1 block">Contents</span>
              <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={6} placeholder="Summarize key ideas..." className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/60" />
            </label>
            <button type="submit" className="flex items-center gap-2 rounded-lg bg-violet-500/20 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-500/30">
              <Plus className="h-4 w-4" /> Create note
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <label className="relative block w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes" className="w-full rounded-lg border border-white/10 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/60" />
            </label>
          </div>

          {notes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-sm text-slate-400">No notes yet. Capture your first idea.</div>
          ) : filteredNotes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-sm text-slate-400">No notes match your search.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-[220px_1fr]">
              <aside className="space-y-2">
                {filteredNotes.map((note) => (
                  <button key={note.id} type="button" onClick={() => setSelectedNoteId(note.id)} className={`w-full rounded-xl border px-3 py-2 text-left transition ${selectedNote?.id === note.id ? 'border-violet-400/40 bg-violet-500/10 text-white' : 'border-white/10 bg-slate-950/30 text-slate-300 hover:border-white/20'}`}>
                    <p className="text-sm font-medium">{note.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">{note.content || 'No content yet.'}</p>
                  </button>
                ))}
              </aside>

              {selectedNote && (
                <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">{selectedNote.title}</h3>
                    <button type="button" aria-label={`Delete ${selectedNote.title}`} onClick={() => onDeleteNote(selectedNote.id)} className="rounded-lg border border-rose-400/25 bg-rose-500/10 p-2 text-rose-200"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <textarea value={selectedNote.content} onChange={(event) => onUpdateNote(selectedNote.id, event.target.value)} rows={10} className="w-full rounded-lg border border-white/10 bg-slate-950/80 p-3 text-sm text-white outline-none focus:border-violet-400/60" />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
