'use client';

import React, { useMemo, useState } from 'react';
import { Check, CalendarClock, Pencil, Search, Trash2, Plus, X } from 'lucide-react';
import { KaryaTask, TaskPriority, TaskStatus } from '@/types/karya';

interface TaskManagerProps {
  tasks: KaryaTask[];
  onAddTask: (title: string, description: string, priority: TaskPriority, dueDate?: string) => void;
  onUpdateTask: (id: string, patch: Partial<KaryaTask>) => void;
  onDeleteTask: (id: string) => void;
  onDeleteAllTasks: () => void;
}

const priorityOrder: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };

export const TaskManager: React.FC<TaskManagerProps> = ({ tasks, onAddTask, onUpdateTask, onDeleteTask, onDeleteAllTasks }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const filteredTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => (statusFilter === 'all' ? true : task.status === statusFilter))
      .filter((task) => {
        if (!query) return true;
        const search = query.toLowerCase();
        return task.title.toLowerCase().includes(search) || task.description.toLowerCase().includes(search);
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'todo' ? -1 : 1;
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return (a.dueDate || '').localeCompare(b.dueDate || '');
      });
  }, [tasks, query, statusFilter]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    onAddTask(title.trim(), description.trim(), priority, dueDate || undefined);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
  };

  const completeTask = (task: KaryaTask) => {
    onUpdateTask(task.id, { status: task.status === 'completed' ? 'todo' : 'completed', updatedAt: new Date().toISOString() });
  };

  const beginEditing = (task: KaryaTask) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditDueDate(task.dueDate || '');
  };

  const saveEdit = (task: KaryaTask) => {
    const titleValue = editTitle.trim();
    if (!titleValue) return;
    onUpdateTask(task.id, {
      title: titleValue,
      description: editDescription.trim(),
      dueDate: editDueDate || undefined,
      updatedAt: new Date().toISOString(),
    });
    setEditingTaskId(null);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-2 py-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-[0_0_30px_rgba(79,70,229,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Tasks</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Your work queue</h2>
          </div>
          {tasks.length > 0 && (
            <button type="button" onClick={() => setConfirmDeleteAll(true)} className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/20">Delete all</button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-[1.5fr_1fr_110px_160px_auto]">
          <label className="text-xs text-slate-300">
            <span className="mb-1 block">Task title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Study chemistry" className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-indigo-400/60" />
          </label>
          <label className="text-xs text-slate-300">
            <span className="mb-1 block">Description</span>
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Review chapter 4" className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400/60" />
          </label>
          <label className="text-xs text-slate-300">
            <span className="mb-1 block">Priority</span>
            <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400/60">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="text-xs text-slate-300">
            <span className="mb-1 block">Due date</span>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400/60" />
          </label>
          <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/30">
            <Plus className="h-4 w-4" /> Add task
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="relative block w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" className="w-full rounded-lg border border-white/10 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400/60" />
          </label>

          <div className="flex gap-2 text-xs">
            {(['all', 'todo', 'in_progress', 'completed'] as const).map((filter) => (
              <button key={filter} type="button" onClick={() => setStatusFilter(filter)} className={`rounded-full px-3 py-1.5 capitalize ${statusFilter === filter ? 'bg-indigo-500/20 text-white ring-1 ring-indigo-400/40' : 'bg-white/[0.03] text-slate-400'}`}>
                {filter === 'all' ? 'All' : filter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-sm text-slate-400">
              No tasks match your current filter.
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                {editingTaskId === task.id && (
                  <div className="mb-4 grid gap-3 rounded-lg border border-indigo-400/20 bg-indigo-500/[0.05] p-3 md:grid-cols-[1.5fr_1fr_160px_auto_auto]">
                    <label className="text-xs text-slate-300">
                      <span className="mb-1 block">Title</span>
                      <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400/60" />
                    </label>
                    <label className="text-xs text-slate-300">
                      <span className="mb-1 block">Description</span>
                      <input value={editDescription} onChange={(event) => setEditDescription(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400/60" />
                    </label>
                    <label className="text-xs text-slate-300">
                      <span className="mb-1 block">Due date</span>
                      <input type="date" value={editDueDate} onChange={(event) => setEditDueDate(event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400/60" />
                    </label>
                    <button type="button" onClick={() => saveEdit(task)} className="self-end rounded-lg bg-emerald-500/20 px-3 py-2 text-xs text-emerald-100 hover:bg-emerald-500/30">Save</button>
                    <button type="button" onClick={() => setEditingTaskId(null)} className="self-end rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.05]">Cancel</button>
                  </div>
                )}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <button type="button" aria-label={task.status === 'completed' ? `Mark ${task.title} as not completed` : `Mark ${task.title} as completed`} onClick={() => completeTask(task)} className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${task.status === 'completed' ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200' : 'border-slate-500 bg-transparent text-slate-500'}`}>
                      {task.status === 'completed' && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-base font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-white'}`}>{task.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${task.priority === 'high' ? 'bg-rose-500/15 text-rose-200' : task.priority === 'medium' ? 'bg-amber-500/15 text-amber-100' : 'bg-emerald-500/15 text-emerald-100'}`}>{task.priority}</span>
                      </div>
                      {task.description && <p className="mt-1 text-xs text-slate-400">{task.description}</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                        {task.dueDate && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] px-2 py-1">
                            <CalendarClock className="h-3 w-3" /> {task.dueDate}
                          </span>
                        )}
                        <span className="capitalize">{task.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select aria-label={`Change priority for ${task.title}`} value={task.priority} onChange={(event) => onUpdateTask(task.id, { priority: event.target.value as TaskPriority, updatedAt: new Date().toISOString() })} className="rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-400/60">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <button type="button" onClick={() => beginEditing(task)} aria-label={`Edit ${task.title}`} className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1.5 text-xs text-slate-300"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => onDeleteTask(task.id)} className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-2 py-1.5 text-xs text-rose-200"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {confirmDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-400/20 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Delete all tasks?</h3>
              <button type="button" onClick={() => setConfirmDeleteAll(false)} aria-label="Close delete task confirmation" className="rounded-lg border border-white/10 p-2 text-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-3 text-sm text-slate-400">This removes every task in your local KARYA task list. This action cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDeleteAll(false)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300">Cancel</button>
              <button type="button" onClick={() => { onDeleteAllTasks(); setConfirmDeleteAll(false); }} className="rounded-lg bg-rose-500/20 px-3 py-2 text-xs text-rose-100">Delete all</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
