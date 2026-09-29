export type WakeDetectorStatus = 'unsupported' | 'idle' | 'listening' | 'error';
export type WakeDetectorErrorType = 'permission' | 'unavailable';

interface SpeechRecognitionResultLike {
  [index: number]: { transcript: string };
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const browserWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition || null;
}

export class WakePhraseDetector {
  private recognition: SpeechRecognitionLike | null = null;
  private active = false;
  private restarting = false;

  public getStatus(): WakeDetectorStatus {
    if (!getConstructor()) return 'unsupported';
    return this.active ? 'listening' : 'idle';
  }

  public start(
    wakePhrase: string,
    onWake: () => void,
    onError: (message: string, type: WakeDetectorErrorType) => void
  ): boolean {
    const Constructor = getConstructor();
    if (!Constructor) return false;
    this.stop();

    const recognition = new Constructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, index) => {
        const result = event.results[index];
        return result ? result[0]?.transcript || '' : '';
      }).join(' ');
      if (transcript.toLowerCase().includes(wakePhrase.trim().toLowerCase())) {
        this.stop();
        onWake();
      }
    };
    recognition.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        const permissionError = event.error === 'not-allowed'
          || event.error === 'service-not-allowed'
          || event.error === 'audio-capture';
        onError(
          permissionError
            ? 'Microphone permission is required for wake phrase detection.'
            : 'Wake phrase detection is unavailable in this browser.',
          permissionError ? 'permission' : 'unavailable'
        );
      }
    };
    recognition.onend = () => {
      if (this.active && !this.restarting) {
        this.restarting = true;
        window.setTimeout(() => {
          this.restarting = false;
          if (!this.active) return;
          try {
            recognition.start();
          } catch {
            onError('Wake phrase detection stopped unexpectedly.', 'unavailable');
          }
        }, 250);
      }
    };

    this.recognition = recognition;
    this.active = true;
    try {
      recognition.start();
      return true;
    } catch {
      this.active = false;
      this.recognition = null;
      onError('Wake phrase detection could not start.', 'unavailable');
      return false;
    }
  }

  public stop(): void {
    this.active = false;
    this.restarting = false;
    if (this.recognition) {
      this.recognition.onend = null;
      this.recognition.onerror = null;
      this.recognition.onresult = null;
      try {
        this.recognition.stop();
      } catch {
        // Recognition may already be stopped by the browser.
      }
      this.recognition = null;
    }
  }
}
