'use client';

import React from 'react';
import { 
  Mic, 
  FileText, 
  BrainCircuit, 
  Wrench, 
  CheckCircle2, 
  Volume2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { ActivityEvent, ActivityEventType, ActivityEventStatus } from '@/types/karya';

interface ActivityEventItemProps {
  event: ActivityEvent;
}

export const ActivityEventItem: React.FC<ActivityEventItemProps> = ({ event }) => {
  const getEventIcon = (type: ActivityEventType) => {
    switch (type) {
      case 'voice_received':
        return <Mic className="h-3.5 w-3.5 text-cyan-400" />;
      case 'transcription_complete':
        return <FileText className="h-3.5 w-3.5 text-indigo-400" />;
      case 'intent_understood':
        return <BrainCircuit className="h-3.5 w-3.5 text-purple-400" />;
      case 'tool_called':
        return <Wrench className="h-3.5 w-3.5 text-amber-400" />;
      case 'tool_completed':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
      case 'response_ready':
        return <Volume2 className="h-3.5 w-3.5 text-cyan-400" />;
    }
  };

  const getStatusBadge = (status: ActivityEventStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
            Done
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
            <Clock className="h-2.5 w-2.5 animate-spin" /> Active
          </span>
        );
      case 'queued':
        return (
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400 border border-white/10">
            Queued
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-2.5 w-2.5" /> Error
          </span>
        );
    }
  };

  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/[0.02] p-3 border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08]">
        {getEventIcon(event.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-xs font-semibold text-slate-200 truncate">
            {event.title}
          </h5>
          {getStatusBadge(event.status)}
        </div>

        {event.description && (
          <p className="mt-1 text-[11px] text-slate-400 leading-snug">
            {event.description}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
          <span className="font-mono">{event.timestamp}</span>
          {event.durationMs && (
            <span>{event.durationMs}ms</span>
          )}
        </div>
      </div>
    </div>
  );
};
