'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  VoiceState,
  MicPermissionState,
  ConversationMessage,
  ActivityEvent,
} from '@/types/karya';
import { AudioStreamManager } from '@/lib/voice/audio-recorder';
import { AudioStreamPlayer } from '@/lib/voice/audio-player';
import { AssemblyAIVoiceClient } from '@/lib/voice/assemblyai-client';
import { VoiceOrb } from './VoiceOrb';
import { AudioControls } from './AudioControls';
import { WakeDetectorErrorType, WakePhraseDetector } from '@/lib/voice/wake-detector';

export interface VoiceWorkspaceController {
  toggleListening: () => Promise<void>;
  state: VoiceState;
  volumeLevel: number;
  interimTranscript: string | null;
  permission: MicPermissionState;
  errorMessage: string | null;
}

interface VoiceWorkspaceProps {
  onAddMessage?: (message: ConversationMessage) => void;
  onAddActivityEvent?: (event: ActivityEvent) => void;
  onUserTranscript?: (text: string) => void;
  selectedVoice: string;
  handsFree: {
    enabled: boolean;
    wakePhrase: string;
    requireWakePhrase: boolean;
    continueListening: boolean;
    startAutomatically: boolean;
    stopAfterResponse: boolean;
  };
  onVoiceStateChange?: (state: VoiceState) => void;
  renderCustom?: (controller: VoiceWorkspaceController) => React.ReactNode;
}

// Generate genuinely unique IDs across ticks and turns
function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const VoiceWorkspace: React.FC<VoiceWorkspaceProps> = ({
  onAddMessage,
  onAddActivityEvent,
  onUserTranscript,
  onVoiceStateChange,
  selectedVoice,
  handsFree,
  renderCustom,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');

  useEffect(() => {
    onVoiceStateChange?.(voiceState);
  }, [voiceState, onVoiceStateChange]);
  const [permission, setPermission] = useState<MicPermissionState>('prompt');
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [interimTranscript, setInterimTranscript] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRecorderRef = useRef<AudioStreamManager | null>(null);
  const audioPlayerRef = useRef<AudioStreamPlayer | null>(null);
  const voiceClientRef = useRef<AssemblyAIVoiceClient | null>(null);

  // Authoritative session guards to prevent duplicate connections or loops
  const activeSessionRef = useRef<boolean>(false);
  const isConnectingRef = useRef<boolean>(false);
  const turnSpeakingLoggedRef = useRef<boolean>(false);
  const finalizedUserItemsRef = useRef<Set<string>>(new Set());
  const finalizedRepliesRef = useRef<Set<string>>(new Set());
  const selectedVoiceRef = useRef(selectedVoice);
  const wakeDetectorRef = useRef<WakePhraseDetector | null>(null);
  const handleToggleListeningRef = useRef<(() => Promise<void>) | null>(null);
  const handsFreeRef = useRef(handsFree);
  const [wakeStatus, setWakeStatus] = useState<'off' | 'waiting' | 'unavailable' | 'permission-required'>('off');

  // Helper to format timestamps
  const getFormattedTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
    voiceClientRef.current?.setVoice(selectedVoice);
  }, [selectedVoice]);

  useEffect(() => {
    handsFreeRef.current = handsFree;
  }, [handsFree]);

  useEffect(() => {
    // 1. Initialize Player for AssemblyAI synthesized voice
    const player = new AudioStreamPlayer({
      onPlaybackStart: () => {
        setVoiceState('speaking');
        onAddActivityEvent?.({
          id: generateId('act'),
          type: 'response_ready',
          title: 'KARYA Responding',
          description: 'Streaming voice response',
          timestamp: getFormattedTime(),
          status: 'completed',
        });
      },
      onPlaybackEnd: () => {
        // When playback completes, if session is still active, return to listening
        if (activeSessionRef.current) {
          setVoiceState('listening');
        }
      },
      onError: (err) => {
        console.error('[AudioPlayer] Error:', err);
      },
    });
    audioPlayerRef.current = player;

    // 2. Initialize Recorder for 24 kHz microphone capture
    const recorder = new AudioStreamManager({
      onVolumeChange: (vol) => setVolumeLevel(vol),
      onError: (err) => {
        setErrorMessage(err);
        setVoiceState('error');
      },
      onPermissionChange: (perm) => {
        setPermission(perm);
        if (perm === 'granted') {
          setErrorMessage(null);
        }
      },
      onAudioChunk: (chunk) => {
        // Stream audio chunk to AssemblyAI WebSocket (only active when streaming)
        voiceClientRef.current?.sendAudioChunk(chunk);
      },
    });
    audioRecorderRef.current = recorder;

    // 3. Initialize AssemblyAI Client with full event dispatching
    const client = new AssemblyAIVoiceClient({}, {
      voice: selectedVoiceRef.current,
    });
    client.setHandlers({
      onSessionReady: () => {
        console.log('[VoiceWorkspace] session.ready received. Unlocking audio streaming.');
        activeSessionRef.current = true;
        isConnectingRef.current = false;
        turnSpeakingLoggedRef.current = false;

        // Allow microphone to start streaming audio chunks
        recorder.startStreaming();
        setVoiceState('listening');

        onAddActivityEvent?.({
          id: generateId('act'),
          type: 'intent_understood',
          title: 'Voice Agent Ready',
          description: 'AssemblyAI real-time session initialized',
          timestamp: getFormattedTime(),
          status: 'completed',
        });
      },

      onUserSpeechStarted: () => {
        // User barge-in: immediately stop active playback
        player.interrupt();
        setVoiceState('listening');

        // Log user speech detected ONCE per turn
        if (!turnSpeakingLoggedRef.current) {
          turnSpeakingLoggedRef.current = true;
          onAddActivityEvent?.({
            id: generateId('act'),
            type: 'voice_received',
            title: 'User Speech Detected',
            description: 'Streaming audio to agent',
            timestamp: getFormattedTime(),
            status: 'in_progress',
          });
        }
      },

      onUserSpeechStopped: () => {
        // Do NOT spam activity panel with repeated "Processing User Query" events.
        // Simply update the visual orb state to processing until final transcript arrives.
        setVoiceState('processing');
      },

      onUserTranscriptDelta: (text) => {
        // Update live interim transcript preview
        setInterimTranscript(text);
      },

      onUserTranscript: (text, itemId) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const transcriptKey = itemId || trimmed;
        if (finalizedUserItemsRef.current.has(transcriptKey)) return;
        finalizedUserItemsRef.current.add(transcriptKey);

        // Clear interim transcript
        setInterimTranscript(null);
        turnSpeakingLoggedRef.current = false;
        setVoiceState('processing');

        // 1. Add finalized user message
        onAddMessage?.({
          id: generateId('msg'),
          role: 'user',
          content: trimmed,
          timestamp: getFormattedTime(),
        });

        // 2. Log transcription complete
        onAddActivityEvent?.({
          id: generateId('act'),
          type: 'transcription_complete',
          title: 'Transcription Complete',
          description: `User: "${trimmed}"`,
          timestamp: getFormattedTime(),
          status: 'completed',
        });

        // 3. Log processing query EXACTLY ONCE per turn
        onAddActivityEvent?.({
          id: generateId('act'),
          type: 'intent_understood',
          title: 'Processing User Query',
          description: 'Analyzing intent and generating response',
          timestamp: getFormattedTime(),
          status: 'in_progress',
        });
        onUserTranscript?.(trimmed);
      },

      onAgentStarted: () => {
        setVoiceState('processing');
      },

      onAgentAudioChunk: (base64Audio) => {
        player.enqueueBase64Chunk(base64Audio);
      },

      onAgentTranscript: (text, replyId, interrupted) => {
        const trimmed = text.trim();
        if (!trimmed || interrupted) return;
        const transcriptKey = replyId || trimmed;
        if (finalizedRepliesRef.current.has(transcriptKey)) return;
        finalizedRepliesRef.current.add(transcriptKey);

        onAddMessage?.({
          id: generateId('msg'),
          role: 'karya',
          content: trimmed,
          timestamp: getFormattedTime(),
        });
      },

      onAgentReplyDone: (status) => {
        console.log('[VoiceWorkspace] Agent reply complete. Status:', status);
        if (status === 'interrupted') {
          player.interrupt();
          if (activeSessionRef.current) {
            setVoiceState('listening');
          }
        } else if (!player.getIsPlaying() && activeSessionRef.current) {
          if (handsFreeRef.current.enabled && handsFreeRef.current.stopAfterResponse) {
            activeSessionRef.current = false;
            recorder.stopListening();
            client.disconnect();
            setVoiceState('idle');
          } else {
            setVoiceState('listening');
          }
        }
      },

      onError: (err) => {
        console.error('[VoiceWorkspace] Voice Agent Error:', err);
        setErrorMessage(err.message);
        setVoiceState('error');
        stopSessionInternal();
      },

      onSessionEnded: () => {
        console.log('[VoiceWorkspace] Voice session ended.');
        stopSessionInternal();
      },
    });
    voiceClientRef.current = client;

    const stopSessionInternal = () => {
      activeSessionRef.current = false;
      isConnectingRef.current = false;
      turnSpeakingLoggedRef.current = false;
      finalizedUserItemsRef.current.clear();
      finalizedRepliesRef.current.clear();
      recorder.stopListening();
      player.interrupt();
      client.disconnect();
      setVoiceState('idle');
      setInterimTranscript(null);
    };

    return () => {
      stopSessionInternal();
      recorder.cleanup();
      player.cleanup();
      client.disconnect();
    };
  }, [onAddMessage, onAddActivityEvent, onUserTranscript]);

  // Cleanly stop any ongoing session
  const stopSession = useCallback(() => {
    activeSessionRef.current = false;
    isConnectingRef.current = false;
    turnSpeakingLoggedRef.current = false;
    finalizedUserItemsRef.current.clear();
    finalizedRepliesRef.current.clear();

    audioRecorderRef.current?.stopListening();
    audioPlayerRef.current?.interrupt();
    voiceClientRef.current?.disconnect();

    setVoiceState('idle');
    setInterimTranscript(null);
  }, []);

  // Toggle voice session
  const handleToggleListening = useCallback(async () => {
    const recorder = audioRecorderRef.current;
    const client = voiceClientRef.current;
    const player = audioPlayerRef.current;

    if (!recorder || !client || !player) return;

    // If already active or connecting, clicking the mic stops the session
    if (activeSessionRef.current || isConnectingRef.current) {
      stopSession();
      return;
    }

    // Start a new session
    try {
      isConnectingRef.current = true;
      setErrorMessage(null);
      setVoiceState('connecting');

      // 1. Prime AudioContext during the user gesture to satisfy browser autoplay policy
      player.prepareAudioContext();

      // 2. Request microphone permission
      const micGranted = await recorder.startListening();
      if (!micGranted) {
        isConnectingRef.current = false;
        setVoiceState('error');
        return;
      }

      // 3. Connect to AssemblyAI Voice Agent API via server token
      await client.connect();
    } catch (err: unknown) {
      console.error('[VoiceWorkspace] Failed to start voice session:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      isConnectingRef.current = false;
      activeSessionRef.current = false;
      recorder.stopListening();
      player.interrupt();
      setVoiceState('error');
    }
  }, [stopSession]);

  useEffect(() => {
    handleToggleListeningRef.current = handleToggleListening;
  }, [handleToggleListening]);

  useEffect(() => {
    if (!handsFree.enabled || activeSessionRef.current || isConnectingRef.current) {
      wakeDetectorRef.current?.stop();
      setWakeStatus('off');
      return;
    }

    const detector = wakeDetectorRef.current || new WakePhraseDetector();
    wakeDetectorRef.current = detector;
    const started = detector.start(
      handsFree.wakePhrase,
      () => {
        setWakeStatus('off');
        void handleToggleListeningRef.current?.();
      },
      (message, type: WakeDetectorErrorType) => {
        console.warn('[WakeDetector]', message);
        setWakeStatus(type === 'permission' ? 'permission-required' : 'unavailable');
      }
    );
    setWakeStatus(started ? 'waiting' : 'unavailable');

    return () => {
      detector.stop();
      setWakeStatus('off');
    };
  }, [handsFree.enabled, handsFree.wakePhrase, voiceState]);

  useEffect(() => () => wakeDetectorRef.current?.stop(), []);

  const handleSelectQuickAction = useCallback(
    () => {
      if (!activeSessionRef.current && !isConnectingRef.current) {
        handleToggleListening();
      }
    },
    [handleToggleListening]
  );

  if (renderCustom) {
    return (
      <>
        {renderCustom({
          toggleListening: handleToggleListening,
          state: voiceState,
          volumeLevel,
          interimTranscript,
          permission,
          errorMessage,
        })}
      </>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full px-4 sm:px-6">
      {/* Product Tagline */}
      <div className="text-center max-w-xl mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Don&apos;t navigate software. Just speak.
          </span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          KARYA listens, interprets intent, and responds naturally with synthetic voice.
        </p>
      </div>

      {/* Voice Orb - Visual Focal Point */}
      <VoiceOrb
        state={voiceState}
        volumeLevel={volumeLevel}
        onClick={handleToggleListening}
      />

      {/* Audio Controls */}
      <AudioControls
        state={voiceState}
        permission={permission}
        errorMessage={errorMessage}
        onToggleListen={handleToggleListening}
      />

      {handsFree.enabled && (
        <div className="mt-3 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] px-4 py-2 text-xs text-cyan-100">
          {wakeStatus === 'waiting'
            ? `Waiting for "${handsFree.wakePhrase}"`
            : wakeStatus === 'permission-required'
            ? 'Microphone permission required for wake detection'
            : wakeStatus === 'unavailable'
            ? 'Wake phrase unavailable — use the voice orb'
            : 'Hands-Free active'}
        </div>
      )}
    </div>
  );
};
