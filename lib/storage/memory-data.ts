import { KaryaMemory } from '@/types/memory';

export const MEMORY_STORAGE_KEY_PREFIX = 'karya.memory.v1';

function getStorageKey(prefix: string, userId?: string | null): string {
  return userId ? `${prefix}.${userId}` : prefix;
}

export function loadMemories(userId?: string | null): KaryaMemory[] {
  if (typeof window === 'undefined') return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(getStorageKey(MEMORY_STORAGE_KEY_PREFIX, userId)) || '[]');
    return Array.isArray(value) ? value as KaryaMemory[] : [];
  } catch { return []; }
}

export function saveMemories(memories: KaryaMemory[], userId?: string | null): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(getStorageKey(MEMORY_STORAGE_KEY_PREFIX, userId), JSON.stringify(memories));
}