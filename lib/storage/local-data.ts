import { KaryaNote, KaryaTask } from '@/types/karya';

export const TASKS_STORAGE_KEY_PREFIX = 'karya.tasks.v1';
export const NOTES_STORAGE_KEY_PREFIX = 'karya.notes.v1';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function getStorageKey(prefix: string, userId?: string | null): string {
  return userId ? `${prefix}.${userId}` : prefix;
}

export function loadTasks(userId?: string | null): KaryaTask[] {
  return readJson<KaryaTask[]>(getStorageKey(TASKS_STORAGE_KEY_PREFIX, userId), []);
}

export function saveTasks(tasks: KaryaTask[], userId?: string | null): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(getStorageKey(TASKS_STORAGE_KEY_PREFIX, userId), JSON.stringify(tasks));
  }
}

export function loadNotes(userId?: string | null): KaryaNote[] {
  return readJson<KaryaNote[]>(getStorageKey(NOTES_STORAGE_KEY_PREFIX, userId), []);
}

export function saveNotes(notes: KaryaNote[], userId?: string | null): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(getStorageKey(NOTES_STORAGE_KEY_PREFIX, userId), JSON.stringify(notes));
  }
}
