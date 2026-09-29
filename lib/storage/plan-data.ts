import { KaryaPlan } from '@/types/plan';

export const PLAN_STORAGE_KEY_PREFIX = 'karya.plans.v1';

function getStorageKey(prefix: string, userId?: string | null): string {
  return userId ? `${prefix}.${userId}` : prefix;
}

export function loadPlans(userId?: string | null): KaryaPlan[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey(PLAN_STORAGE_KEY_PREFIX, userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function savePlans(plans: KaryaPlan[], userId?: string | null): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(getStorageKey(PLAN_STORAGE_KEY_PREFIX, userId), JSON.stringify(plans));
  }
}