// Storage abstraction layer — swap localStorage for Supabase/Firebase here

export const STORAGE_KEYS = {
  USERS: 'carshare_users',
  GROUPS: 'carshare_groups',
  BOOKINGS: 'carshare_bookings',
  CURRENT_USER_ID: 'carshare_current_user_id',
} as const;

function isClient(): boolean {
  return typeof window !== 'undefined';
}

export const storage = {
  get<T>(key: string): T | null {
    if (!isClient()) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    if (!isClient()) return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string): void {
    if (!isClient()) return;
    localStorage.removeItem(key);
  },
};
