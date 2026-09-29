'use client';

import React, { useState } from 'react';
import { VoiceState } from '@/types/karya';

interface VoiceOrbProps {
  state: VoiceState;
  volumeLevel?: number; // 0.0 to 1.0 from microphone
  interimTranscript?: string | null;
  onClick?: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  volumeLevel = 0,
  interimTranscript,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine dynamic scale based on volume when listening or speaking
  const dynamicScale =
    state === 'listening' || state === 'speaking'
      ? 1 + Math.min(volumeLevel * 0.35, 0.25)
      : isHovered
      ? 1.04
      : 1;

  // Determine color theme based on current state matching IMAGE 1
  const getGlowStyles = () => {
    switch (state) {
      case 'listening':
        return {
          core: 'from-cyan-400 via-indigo-500 to-fuchsia-500',
          outerGlow: 'rgba(6, 182, 212, 0.4)',
          ring: 'border-cyan-400/40',
          dot: 'bg-cyan-400 animate-ping',
        };
      case 'processing':
        return {
          core: 'from-amber-400 via-purple-500 to-indigo-600',
          outerGlow: 'rgba(168, 85, 247, 0.45)',
          ring: 'border-purple-400/40',
          dot: 'bg-purple-400 animate-pulse',
        };
      case 'speaking':
        return {
          core: 'from-fuchsia-500 via-purple-600 to-indigo-600',
          outerGlow: 'rgba(168, 85, 247, 0.4)',
          ring: 'border-indigo-400/40',
          dot: 'bg-indigo-400 animate-pulse',
        };
      case 'error':
        return {
          core: 'from-rose-500 via-red-600 to-amber-600',
          outerGlow: 'rgba(239, 68, 68, 0.4)',
          ring: 'border-rose-500/40',
          dot: 'bg-rose-500',
        };
      case 'idle':
      case 'ready':
      default:
        return {
          core: 'from-indigo-500 via-purple-600 to-blue-700',
          outerGlow: isHovered ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.25)',
          ring: 'border-indigo-500/25',
          dot: 'bg-indigo-400',
        };
    }
  };

  const currentGlow = getGlowStyles();

  // Status text for the pill underneath
  const getStatusText = () => {
    switch (state) {
      case 'connecting':
        return 'Connecting to AssemblyAI...';
      case 'listening':
        return 'KARYA IS LISTENING';
      case 'processing':
        return 'KARYA IS THINKING';
      case 'speaking':
        return 'KARYA IS SPEAKING';
      case 'error':
        return 'VOICE CONNECTION ERROR';
      case 'ready':
      case 'idle':
      default:
        return 'KARYA VOICE READY';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-4 sm:py-6 select-none">
      {/* Background soft ambient radial glow */}
      <div
        className="absolute h-72 w-72 sm:h-96 sm:w-96 rounded-full transition-all duration-700 blur-3xl pointer-events-none"
        style={{
          backgroundColor: currentGlow.outerGlow,
          transform: `scale(${
            state === 'listening' || state === 'speaking'
              ? 1.15 + volumeLevel * 0.4
              : 1
          })`,
        }}
      />

      {/* Interactive Orb Container */}
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex h-52 w-52 sm:h-64 sm:w-64 cursor-pointer items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
        aria-label={`Voice Orb (${state}). Click to toggle listening.`}
      >
        {/* Multiple thin concentric outer rings exactly matching IMAGE 1 */}
        <div
          className={`absolute inset-0 rounded-full border transition-all duration-500 ${currentGlow.ring} ${
            state === 'listening' || state === 'speaking' ? 'scale-110 animate-spin-slow' : 'scale-100'
          }`}
          style={{
            transform: `scale(${dynamicScale * 1.15})`,
          }}
        />

        <div
          className={`absolute inset-4 rounded-full border border-dashed transition-all duration-700 opacity-60 ${currentGlow.ring} ${
            state === 'listening' || state === 'speaking' ? 'animate-reverse-spin' : ''
          }`}
          style={{
            transform: `scale(${dynamicScale * 1.05})`,
          }}
        />

        {/* Listening wave aura */}
        {state === 'listening' && (
          <>
            <span
              className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping"
              style={{ animationDuration: '2s' }}
            />
            <span
              className="absolute inset-6 rounded-full bg-indigo-500/20 animate-ping"
              style={{ animationDuration: '2.5s', animationDelay: '0.4s' }}
            />
          </>
        )}

        {/* Processing orbital spinner */}
        {(state === 'processing' || state === 'connecting') && (
          <div className="absolute -inset-2 rounded-full border-2 border-transparent border-t-purple-400 border-r-indigo-400 animate-spin" />
        )}

        {/* Inner Glowing Filled Purple Orb Core matching IMAGE 1 */}
        <div
          className={`relative flex h-36 w-36 sm:h-48 sm:w-48 items-center justify-center rounded-full bg-gradient-to-tr ${currentGlow.core} shadow-2xl transition-transform duration-150 ease-out`}
          style={{
            transform: `scale(${dynamicScale})`,
            boxShadow: `0 0 50px ${currentGlow.outerGlow}, inset 0 0 30px rgba(255, 255, 255, 0.35)`,
          }}
        >
          {/* Glass specular highlight overlay */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/30 via-transparent to-black/30 pointer-events-none" />

          {/* Center Indicator: Live sound equalizer when active OR bright small center dot matching IMAGE 1 */}
          <div className="relative z-10 flex items-center justify-center">
            {state === 'listening' || state === 'speaking' ? (
              // Live animated equalizer bars
              <div className="flex items-center gap-1.5 h-10">
                <span
                  className="w-1.5 rounded-full bg-white/90 transition-all duration-75"
                  style={{ height: `${Math.max(8, volumeLevel * 44)}px` }}
                />
                <span
                  className="w-1.5 rounded-full bg-white/90 transition-all duration-75"
                  style={{ height: `${Math.max(14, volumeLevel * 60)}px` }}
                />
                <span
                  className="w-1.5 rounded-full bg-white/90 transition-all duration-75"
                  style={{ height: `${Math.max(10, volumeLevel * 48)}px` }}
                />
                <span
                  className="w-1.5 rounded-full bg-white/90 transition-all duration-75"
                  style={{ height: `${Math.max(16, volumeLevel * 54)}px` }}
                />
                <span
                  className="w-1.5 rounded-full bg-white/90 transition-all duration-75"
                  style={{ height: `${Math.max(8, volumeLevel * 38)}px` }}
                />
              </div>
            ) : (
              // Bright small center dot matching IMAGE 1
              <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-white/90 shadow-[0_0_15px_#ffffff] transition-all group-hover:scale-125" />
            )}
          </div>
        </div>
      </div>

      {/* State Status Tagline Pill directly underneath matching IMAGE 1 */}
      <div className="mt-5 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2 rounded-full bg-white/[0.04] px-4 py-1.5 border border-white/[0.08] backdrop-blur-md">
          <span
            className={`h-2 w-2 rounded-full ${
              state === 'connecting'
                ? 'bg-amber-400 animate-spin'
                : state === 'listening'
                ? 'bg-cyan-400 animate-ping'
                : state === 'speaking'
                ? 'bg-emerald-400 animate-pulse'
                : state === 'processing'
                ? 'bg-purple-400 animate-pulse'
                : state === 'error'
                ? 'bg-rose-500'
                : 'bg-indigo-400'
            }`}
          />
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            {getStatusText()}
          </span>
        </div>

        {/* Real-time partial transcript preview if user is speaking */}
        {interimTranscript && (
          <div className="max-w-md px-3 py-1 text-center text-xs font-medium text-cyan-300/90 italic animate-pulse">
            &ldquo;{interimTranscript}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
};
