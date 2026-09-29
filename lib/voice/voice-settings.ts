export interface SupportedVoice {
  id: string;
  name: string;
  accent: string;
  language: string;
}

// This catalog mirrors AssemblyAI's Voice Agent API voice documentation.
export const SUPPORTED_VOICES: SupportedVoice[] = [
  { id: 'alba', name: 'Alba', accent: 'American English', language: 'English' },
  { id: 'eve', name: 'Eve', accent: 'American English', language: 'English' },
  { id: 'george', name: 'George', accent: 'American English', language: 'English' },
  { id: 'jane', name: 'Jane', accent: 'American English', language: 'English' },
  { id: 'jean', name: 'Jean', accent: 'American English', language: 'English' },
  { id: 'mary', name: 'Mary', accent: 'American English', language: 'English' },
  { id: 'michael', name: 'Michael', accent: 'American English', language: 'English' },
  { id: 'anna', name: 'Anna', accent: 'British English', language: 'English' },
  { id: 'charles', name: 'Charles', accent: 'British English', language: 'English' },
  { id: 'paul', name: 'Paul', accent: 'British English', language: 'English' },
  { id: 'vera', name: 'Vera', accent: 'British English', language: 'English' },
  { id: 'giovanni', name: 'Giovanni', accent: 'Italian', language: 'Italian' },
  { id: 'lola', name: 'Lola', accent: 'Spanish', language: 'Spanish' },
  { id: 'juergen', name: 'Juergen', accent: 'German', language: 'German' },
  { id: 'rafael', name: 'Rafael', accent: 'Portuguese', language: 'Portuguese' },
  { id: 'estelle', name: 'Estelle', accent: 'French', language: 'French' },
];

export const DEFAULT_VOICE_ID = 'alba';
export const VOICE_PREFERENCE_KEY = 'karya.voice';

export function isSupportedVoice(value: string): boolean {
  return SUPPORTED_VOICES.some((voice) => voice.id === value);
}
