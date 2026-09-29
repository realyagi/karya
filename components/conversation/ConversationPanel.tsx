'use client';

import React from 'react';
import { MessageSquare, Radio } from 'lucide-react';
import { ConversationMessage } from '@/types/karya';
import { MessageItem } from './MessageItem';

interface ConversationPanelProps {
  messages?: ConversationMessage[];
}

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  messages = [],
}) => {
  const hasMessages = messages.length > 0;

  return (
    <div className="glass-panel flex flex-col h-full rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Conversation
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Radio className={`h-3 w-3 ${hasMessages ? 'text-emerald-400' : 'text-indigo-400'} animate-pulse`} />
          <span>{hasMessages ? 'Active Stream' : 'Standby'}</span>
        </div>
      </div>

      {/* Body / Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {hasMessages ? (
          messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))
        ) : (
          /* Empty State (Phase 1) */
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center px-4 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4 text-indigo-400">
              <MessageSquare className="h-6 w-6 opacity-70" />
            </div>
            <h4 className="text-sm font-semibold tracking-wide text-slate-200">
              KARYA is ready.
            </h4>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">
              Speak naturally. Ask a question, create something, find something, or get something done.
            </p>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="border-t border-white/[0.06] bg-black/20 px-4 py-2 text-[10px] text-slate-400 flex items-center justify-between">
        <span>{hasMessages ? 'Live Conversation Stream' : 'waiting speech input'}</span>
        <span className="font-mono text-slate-400">{messages.length} msgs</span>
      </div>
    </div>
  );
};
