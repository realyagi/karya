'use client';

import React from 'react';
import { Sparkles, User, Wrench, CheckCircle2, Clock } from 'lucide-react';
import { ConversationMessage, ToolCall } from '@/types/karya';

import { GeneratedImageViewer } from '@/components/image/GeneratedImageViewer';

interface MessageItemProps {
  message: ConversationMessage;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isKarya = message.role === 'karya';

  return (
    <div className={`flex w-full flex-col gap-2 ${isKarya ? 'items-start' : 'items-end'}`}>
      {/* Message Bubble Container */}
      <div className={`flex items-start gap-3 max-w-[85%] ${isKarya ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs ${
            isKarya
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
          }`}
        >
          {isKarya ? <Sparkles className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
            isKarya
              ? 'bg-white/[0.04] text-slate-200 border border-white/[0.08] shadow-md'
              : 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>

          {/* Generated Image Display */}
          {message.imageUrl && (
            <GeneratedImageViewer
              imageUrl={message.imageUrl}
              prompt={message.content}
            />
          )}

          {/* Tool Invocations Indicators (for future tool-assisted replies) */}
          {message.toolInvocations && message.toolInvocations.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5 border-t border-white/10 pt-2">
              {message.toolInvocations.map((tool: ToolCall) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between rounded-lg bg-black/20 px-2.5 py-1.5 text-[11px] text-slate-300"
                >
                  <div className="flex items-center gap-1.5">
                    <Wrench className="h-3 w-3 text-indigo-400" />
                    <span className="font-mono text-indigo-300">{tool.displayName || tool.toolName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {tool.status === 'completed' ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Clock className="h-3 w-3 animate-spin" /> In Progress
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timestamp & Role label */}
      <div
        className={`flex items-center gap-1.5 text-[10px] text-slate-400 px-1 ${
          isKarya ? 'pl-10' : 'pr-10'
        }`}
      >
        <span>{isKarya ? 'KARYA' : 'You'}</span>
        <span>•</span>
        <span>{message.timestamp}</span>
      </div>
    </div>
  );
};
