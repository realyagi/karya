export type ThemePreference = 'dark' | 'light' | 'system';
export type AccentPreference = 'default' | 'blue' | 'purple' | 'cyan' | 'green' | 'amber';
export type DensityPreference = 'comfortable' | 'compact';
export type AnimationPreference = 'full' | 'reduced' | 'off';
export type LanguagePreference = 'auto' | string;

export interface KaryaSettings {
  appearance: {
    theme: ThemePreference;
    accent: AccentPreference;
    density: DensityPreference;
    animations: AnimationPreference;
    backgroundEffects: boolean;
    glassEffects: boolean;
  };
  voice: {
    voiceId: string;
  };
  language: {
    input: LanguagePreference;
    output: LanguagePreference;
    timezone: string;
  };
  handsFree: {
    enabled: boolean;
    wakePhrase: string;
    startAutomatically: boolean;
    stopAfterResponse: boolean;
    continueListening: boolean;
    requireWakePhrase: boolean;
  };
  privacy: {
    conversationHistory: boolean;
    saveTranscripts: boolean;
    saveActivity: boolean;
    memoryEnabled: boolean;
  };
  notifications: {
    browser: boolean;
    taskReminders: boolean;
    voiceSession: boolean;
  };
}

export const SETTINGS_STORAGE_KEY_PREFIX = 'karya.settings';
const LEGACY_VOICE_KEY = 'karya.voice';

function getStorageKey(prefix: string, userId?: string | null): string {
  return userId ? `${prefix}.${userId}` : prefix;
}

export const DEFAULT_KARYA_SETTINGS: KaryaSettings = {
  appearance: {
    theme: 'dark',
    accent: 'default',
    density: 'comfortable',
    animations: 'full',
    backgroundEffects: true,
    glassEffects: true,
  },
  voice: { voiceId: 'alba' },
  language: { input: 'auto', output: 'auto', timezone: 'system' },
  handsFree: {
    enabled: false,
    wakePhrase: 'Hey Karya',
    startAutomatically: false,
    stopAfterResponse: true,
    continueListening: false,
    requireWakePhrase: true,
  },
  privacy: {
    conversationHistory: true,
    saveTranscripts: true,
    saveActivity: true,
    memoryEnabled: true,
  },
  notifications: {
    browser: false,
    taskReminders: false,
    voiceSession: false,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function loadKaryaSettings(userId?: string | null): KaryaSettings {
  if (typeof window === 'undefined') return DEFAULT_KARYA_SETTINGS;

  try {
    const raw = window.localStorage.getItem(getStorageKey(SETTINGS_STORAGE_KEY_PREFIX, userId));
    if (!raw) {
      const legacyVoice = window.localStorage.getItem(LEGACY_VOICE_KEY);
      return legacyVoice
        ? { ...DEFAULT_KARYA_SETTINGS, voice: { voiceId: legacyVoice } }
        : DEFAULT_KARYA_SETTINGS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return DEFAULT_KARYA_SETTINGS;

    return {
      ...DEFAULT_KARYA_SETTINGS,
      ...parsed,
      appearance: {
        ...DEFAULT_KARYA_SETTINGS.appearance,
        ...(isRecord(parsed.appearance) ? parsed.appearance : {}),
      },
      voice: {
        ...DEFAULT_KARYA_SETTINGS.voice,
        ...(isRecord(parsed.voice) ? parsed.voice : {}),
      },
      language: {
        ...DEFAULT_KARYA_SETTINGS.language,
        ...(isRecord(parsed.language) ? parsed.language : {}),
      },
      handsFree: {
        ...DEFAULT_KARYA_SETTINGS.handsFree,
        ...(isRecord(parsed.handsFree) ? parsed.handsFree : {}),
      },
      privacy: {
        ...DEFAULT_KARYA_SETTINGS.privacy,
        ...(isRecord(parsed.privacy) ? parsed.privacy : {}),
      },
      notifications: {
        ...DEFAULT_KARYA_SETTINGS.notifications,
        ...(isRecord(parsed.notifications) ? parsed.notifications : {}),
      },
    } as KaryaSettings;
  } catch {
    return DEFAULT_KARYA_SETTINGS;
  }
}

export function saveKaryaSettings(settings: KaryaSettings, userId?: string | null): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(getStorageKey(SETTINGS_STORAGE_KEY_PREFIX, userId), JSON.stringify(settings));
  }
}
