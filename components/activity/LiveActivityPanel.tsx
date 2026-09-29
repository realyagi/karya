'use client';

import React from 'react';
import { Activity, Zap } from 'lucide-react';
import { ActivityEvent } from '@/types/karya';
import { ActivityEventItem } from './ActivityEventItem';

interface LiveActivityPanelProps {
  events?: ActivityEvent[];
}

export const LiveActivityPanel: React.FC<LiveActivityPanelProps> = ({
  events = [],
}) => {
  const hasEvents = events.length > 0;

  return (
    <div className="glass-panel flex flex-col h-full rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            LIVE ACTIVITY
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Zap className="h-3 w-3 text-purple-400" />
          <span>Real-Time Stream</span>
        </div>
      </div>

      {/* Body / Activity Event List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {hasEvents ? (
          events.map((event) => (
            <ActivityEventItem key={event.id} event={event} />
          ))
        ) : (
          /* Empty State (Phase 1) */
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center px-4 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-4 text-purple-400">
              <Activity className="h-6 w-6 opacity-70" />
            </div>
            <h4 className="text-sm font-semibold tracking-wide text-slate-200">
              No Active Tasks
            </h4>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">
              Actions will appear here when KARYA starts working.
            </p>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="border-t border-white/[0.06] bg-black/20 px-4 py-2 text-[10px] text-slate-400 flex items-center justify-between">
        <span>{hasEvents ? 'Telemetry streaming' : 'Event telemetry standby'}</span>
        <span className="font-mono text-slate-400">{events.length} events</span>
      </div>
    </div>
  );
};
