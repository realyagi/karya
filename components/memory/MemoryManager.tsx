import React from 'react';
import { KaryaMemory } from '@/types/memory';
import { Trash2, Sparkles } from 'lucide-react';

export const MemoryManager = ({ memories }: { memories: KaryaMemory[] }) => {
  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">KARYA Memory</h2>
            <p className="text-xs text-slate-400">Things KARYA has learned about you</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {memories.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
            No memories stored yet. Tell KARYA to remember something.
          </div>
        ) : (
          memories.map(m => (
            <div key={m.id} className="flex items-start justify-between rounded-xl border border-white/5 bg-white/[0.01] p-4">
              <p className="text-sm text-slate-200">{m.content}</p>
              <p className="text-[10px] text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};