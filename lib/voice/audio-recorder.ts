/**
 * Web Audio API Audio Recorder & Stream Manager
 * Captures microphone audio at 24 kHz mono PCM16, analyzes volume in real-time,
 * and converts audio frames to little-endian base64 chunks for AssemblyAI Voice Agent.
 */

import { VoiceState, MicPermissionState } from '@/types/karya';

export interface AudioVisualizerCallbacks {
  onVolumeChange?: (volume: number) => void;
  onStateChange?: (state: VoiceState) => void;
  onError?: (error: string) => void;
  onPermissionChange?: (permission: MicPermissionState) => void;
  onAudioChunk?: (base64Pcm16Chunk: string) => void;
}

export class AudioStreamManager {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private muteGainNode: GainNode | null = null;
  private callbacks: AudioVisualizerCallbacks = {};
  private currentState: VoiceState = 'idle';
  private isStreaming: boolean = false;

  constructor(callbacks?: AudioVisualizerCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  public setCallbacks(callbacks: AudioVisualizerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getState(): VoiceState {
    return this.currentState;
  }

  public setState(state: VoiceState) {
    this.currentState = state;
    this.callbacks.onStateChange?.(state);
  }

  public startStreaming() {
    this.isStreaming = true;
  }

  public stopStreaming() {
    this.isStreaming = false;
  }

  public getIsStreaming(): boolean {
    return this.isStreaming;
  }

  /**
   * Request microphone access and begin 24 kHz PCM16 capture
   */
  public async startListening(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (this.mediaStream && this.audioContext && this.audioContext.state !== 'closed') {
      return true;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = 'Audio recording is not supported in this browser environment.';
      this.callbacks.onError?.(errorMsg);
      this.callbacks.onPermissionChange?.('unsupported');
      this.setState('error');
      return false;
    }

    try {
      this.callbacks.onPermissionChange?.('prompt');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;
      stream.getTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          if (this.mediaStream === stream && this.isStreaming) {
            this.callbacks.onError?.('Microphone input ended unexpectedly.');
            this.cleanup();
            this.setState('error');
          }
        });
      });
      this.callbacks.onPermissionChange?.('granted');

      // Initialize Web Audio API AudioContext at 24,000 Hz for AssemblyAI
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 24000 });

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(stream);

      // Analyser Node for visual frequency analysis
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.sourceNode.connect(this.analyser);

      // ScriptProcessorNode for real-time PCM16 frame extraction
      // Buffer size: 2048 samples (~85ms chunks at 24 kHz)
      this.processorNode = this.audioContext.createScriptProcessor(2048, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        const inputBuffer = e.inputBuffer.getChannelData(0);
        if (!inputBuffer || inputBuffer.length === 0) return;

        // 1. Calculate volume for visual feedback (always active while mic open)
        let sumSquares = 0;
        const len = inputBuffer.length;
        const pcm16Buffer = new ArrayBuffer(len * 2);
        const dataView = new DataView(pcm16Buffer);

        for (let i = 0; i < len; i++) {
          const s = inputBuffer[i];
          sumSquares += s * s;

          // Float32 [-1.0, 1.0] to 16-bit signed PCM little-endian
          const clamped = Math.max(-1, Math.min(1, s));
          const val = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
          dataView.setInt16(i * 2, val, true); // true = little-endian
        }

        const rms = Math.sqrt(sumSquares / len);
        const normalizedVolume = Math.min(1, Math.max(0, rms * 5));
        this.callbacks.onVolumeChange?.(normalizedVolume);

        // 2. Only stream audio chunks to AssemblyAI if session is ready and streaming is enabled
        if (!this.isStreaming) return;

        // Convert little-endian PCM16 ArrayBuffer to base64 chunk
        const bytes = new Uint8Array(pcm16Buffer);
        let binaryString = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binaryString += String.fromCharCode.apply(
            null,
            Array.from(bytes.subarray(i, i + chunkSize))
          );
        }
        const base64Chunk = window.btoa(binaryString);

        // 3. Emit chunk for streaming to AssemblyAI WebSocket
        this.callbacks.onAudioChunk?.(base64Chunk);
      };

      this.sourceNode.connect(this.processorNode);

      // IMPORTANT: Connect through a muted gain node to prevent microphone audio
      // from playing through the speakers (which causes acoustic feedback and repeated VAD triggers)
      this.muteGainNode = this.audioContext.createGain();
      this.muteGainNode.gain.value = 0;
      this.processorNode.connect(this.muteGainNode);
      this.muteGainNode.connect(this.audioContext.destination);

      return true;
    } catch (err: unknown) {
      const error = err as Error;
      let errorMsg = 'Failed to access microphone.';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
        this.callbacks.onPermissionChange?.('denied');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMsg = 'No microphone device was detected on your system.';
        this.callbacks.onPermissionChange?.('unsupported');
      }

      this.callbacks.onError?.(errorMsg);
      this.setState('error');
      this.cleanup();
      return false;
    }
  }

  /**
   * Stop listening and release microphone streams
   */
  public stopListening() {
    this.stopStreaming();
    this.cleanup();
    this.setState('idle');
    this.callbacks.onVolumeChange?.(0);
  }

  /**
   * Clean up all active audio resources
   */
  public cleanup() {
    this.isStreaming = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.muteGainNode) {
      this.muteGainNode.disconnect();
      this.muteGainNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}
