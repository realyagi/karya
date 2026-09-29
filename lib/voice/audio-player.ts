/**
 * Low-Latency PCM16 Audio Stream Player
 * Decodes and seamlessly plays 24 kHz 16-bit mono PCM chunks received from AssemblyAI Voice Agent.
 * Supports instant interruption (barge-in) and user-gesture AudioContext preparation.
 */

export interface AudioPlayerCallbacks {
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onError?: (error: Error) => void;
}

export class AudioStreamPlayer {
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private callbacks: AudioPlayerCallbacks = {};
  private isPlaying: boolean = false;
  private scheduledCount: number = 0;
  private completedCount: number = 0;
  private playbackGeneration = 0;

  constructor(callbacks: AudioPlayerCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: AudioPlayerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Must be called during a user gesture (e.g. click) to unlock browser AudioContext autoplay
   */
  public prepareAudioContext(): void {
    if (typeof window === 'undefined') return;
    try {
      const ctx = this.initAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch((err) => {
          console.warn('[AudioPlayer] AudioContext resume failed:', err);
          this.callbacks.onError?.(
            new Error('Audio playback blocked by browser. Click to enable audio.')
          );
        });
      }
    } catch (err) {
      console.warn('[AudioPlayer] prepareAudioContext error:', err);
    }
  }

  private initAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 24000 });
      this.nextStartTime = this.audioContext.currentTime;
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  /**
   * Enqueue and play a base64-encoded 24 kHz PCM16 chunk
   */
  public enqueueBase64Chunk(base64Data: string) {
    if (typeof window === 'undefined' || !base64Data) return;

    try {
      const ctx = this.initAudioContext();

      // Decode base64 to binary
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Read as little-endian 16-bit PCM using DataView
      const numSamples = Math.floor(len / 2);
      if (numSamples === 0) return;

      const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const float32Array = new Float32Array(numSamples);

      for (let i = 0; i < numSamples; i++) {
        const int16Sample = dataView.getInt16(i * 2, true); // true = little-endian
        float32Array[i] = int16Sample / 32768.0;
      }

      // Create AudioBuffer at 24,000 Hz
      const audioBuffer = ctx.createBuffer(1, numSamples, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      // Create Source Node
      const source = ctx.createBufferSource();
      const generation = this.playbackGeneration;
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      // Schedule gapless playback
      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      this.activeSources.push(source);
      this.scheduledCount++;

      if (!this.isPlaying) {
        this.isPlaying = true;
        this.callbacks.onPlaybackStart?.();
      }

      source.onended = () => {
        if (generation !== this.playbackGeneration) return;
        // Remove from active sources list
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        this.completedCount++;

        if (this.completedCount >= this.scheduledCount && this.activeSources.length === 0) {
          this.isPlaying = false;
          this.callbacks.onPlaybackEnd?.();
        }
      };
    } catch (err: unknown) {
      console.error('[AudioStreamPlayer] Error processing audio chunk:', err);
      this.callbacks.onError?.(err as Error);
    }
  }

  /**
   * Immediately cancel any playing/queued audio (barge-in)
   */
  public interrupt() {
    this.playbackGeneration++;
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Source might have already ended
      }
    }
    this.activeSources = [];
    this.scheduledCount = 0;
    this.completedCount = 0;

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.nextStartTime = this.audioContext.currentTime;
    }

    if (this.isPlaying) {
      this.isPlaying = false;
      this.callbacks.onPlaybackEnd?.();
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public cleanup() {
    this.interrupt();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}
