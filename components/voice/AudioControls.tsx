'use client';

import React from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { VoiceState, MicPermissionState } from '@/types/karya';

interface AudioControlsProps {
  state: VoiceState;
  permission: MicPermissionState;
  errorMessage?: string | null;
  onToggleListen: () => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  state,
  permission,
  errorMessage,
  onToggleListen,
}) => {
  const isActive =
    state === 'listening' ||
    state === 'processing' ||
    state === 'speaking';

  return (
    <div className="flex flex-col items-center gap-3 mt-6 sm:mt-8">
      {/* Primary Microphone Trigger Button */}
      <div className="relative group">
        {/* Glow halo when active */}
        {isActive && (
          <div className="absolute -inset-2 rounded-full bg-cyan-500/30 blur-md animate-pulse" />
        )}

        <button
          type="button"
          onClick={onToggleListen}
          disabled={state === 'connecting'}
          className={`relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all duration-300 shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
            state === 'connecting'
              ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/50 cursor-wait'
              : isActive
              ? 'bg-rose-500/20 text-rose-300 border-2 border-rose-500/50 hover:bg-rose-500/30'
              : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white border border-white/20 hover:scale-105 hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]'
          }`}
          aria-label={state === 'connecting' ? 'Connecting microphone' : isActive ? 'Stop listening' : 'Start listening'}
          title={state === 'connecting' ? 'Connecting to voice session...' : isActive ? 'Stop listening' : 'Click to speak'}
        >
          {state === 'connecting' ? (
            <Mic className="h-6 w-6 sm:h-7 sm:w-7 animate-spin text-amber-300" />
          ) : isActive ? (
            <MicOff className="h-6 w-6 sm:h-7 sm:w-7 animate-pulse" />
          ) : (
            <Mic className="h-6 w-6 sm:h-7 sm:w-7" />
          )}
        </button>
      </div>

      {/* Action text & status */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-medium text-slate-300">
          {state === 'connecting'
            ? 'Establishing voice session...'
            : isActive
            ? 'Tap to end session'
            : 'Tap microphone to speak'}
        </span>
        <span className="text-[11px] text-slate-400">
          Phase 2: Live AssemblyAI Voice Agent Connection Active
        </span>
      </div>

      {/* Permission or error callout if microphone access issue occurs */}
      {errorMessage && (
        <div className="mt-2 flex max-w-sm items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-left text-xs text-rose-300 border border-rose-500/20">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {permission === 'denied' && !errorMessage && (
        <div className="mt-2 flex max-w-sm items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-left text-xs text-amber-300 border border-amber-500/20">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>Microphone access blocked in browser. Enable microphone permissions to use voice input.</span>
        </div>
      )}
    </div>
  );
};
