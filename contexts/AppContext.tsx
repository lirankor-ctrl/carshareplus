'use client';

import React, {
  createContext, useContext, useEffect,
  useState, useCallback, useRef,
} from 'react';
import { User, CarGroup, Booking } from '@/types';
import { supabase } from '@/lib/supabase';
import { mapProfile, mapGroup, mapBooking } from '@/lib/mappers';

interface AppContextValue {
  currentUser:    User | null;
  group:          CarGroup | null;
  members:        User[];
  bookings:       Booking[];
  isLoading:      boolean;
  loadStatus:     string;
  loadError:      string | null;
  refreshAll:     () => Promise<void>;
  reloadBookings: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ---------------------------------------------------------------------------
// Timeout wrapper — rejects if the query takes longer than `ms` milliseconds.
// The rejection is caught by the outer try/catch in the INITIAL_SESSION handler.
// ---------------------------------------------------------------------------
function withTimeout<T>(query: PromiseLike<T>, label: string, ms = 6000): Promise<T> {
  return Promise.race([
    Promise.resolve(query),
    new Promise<never>((_, reject) =>
      setTimeout(() => {
        console.error(`[timeout] "${label}" exceeded ${ms}ms — Supabase may be unreachable or paused`);
        reject(new Error(`Timeout: ${label}`));
      }, ms),
    ),
  ]);
}

// ---------------------------------------------------------------------------
// Module-level data fetcher
// ---------------------------------------------------------------------------
async function fetchAllData(
  authUserId: string,
  authEmail: string,
  onStatus: (s: string) => void = () => {},
): Promise<{
  user:     User     | null;
  group:    CarGroup | null;
  members:  User[];
  bookings: Booking[];
}> {
  const empty = { user: null, group: null, members: [], bookings: [] };

  // ── Step 1: profile + membership ─────────────────────────────────
  onStatus('טוען פרופיל');
  console.log('[fetchAllData] step 1 — profile + membership for', authUserId);

  const [profileRes, membershipRes] = await Promise.all([
    withTimeout(
      supabase.from('profiles').select('*').eq('id', authUserId).single(),
      'profiles fetch',
    ),
    withTimeout(
      supabase.from('group_members').select('group_id').eq('user_id', authUserId).maybeSingle(),
      'group_members fetch',
    ),
  ]);

  console.log('[fetchAllData] profile result:', profileRes.error?.code ?? 'ok', profileRes.data?.name ?? 'null');
  console.log('[fetchAllData] membership result:', membershipRes.error?.code ?? 'ok', membershipRes.data?.group_id ?? 'null');

  // Profile missing — try to auto-create it
  if (profileRes.error || !profileRes.data) {
    if (profileRes.error?.code !== 'PGRST116') {
      console.error('[fetchAllData] profile error:', profileRes.error?.code, profileRes.error?.message);
    } else {
      console.warn('[fetchAllData] no profile row — attempting auto-create');
    }

    onStatus('יוצר פרופיל חדש');
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const meta  = authUser.user_metadata ?? {};
      const name  = (meta.name  as string | undefined) ?? authEmail.split('@')[0] ?? 'משתמש';
      const emoji = (meta.profileEmoji as string | undefined) ?? '😀';
      const color = (meta.color as string | undefined) ?? '#22C55E';

      const { data: created, error: createErr } = await withTimeout(
        supabase.from('profiles').insert({ id: authUserId, name, profile_image: emoji, color }).select().single(),
        'profile auto-create',
      );

      if (createErr) {
        console.error('[fetchAllData] auto-create failed:', createErr.code, createErr.message);
        return empty;
      }
      console.log('[fetchAllData] profile auto-created:', created?.name);
      const user = mapProfile(created!, authEmail, null);
      return { ...empty, user };
    }
    return empty;
  }

  if (membershipRes.error) {
    console.error('[fetchAllData] membership error (non-fatal):', membershipRes.error.message);
  }

  const groupId = membershipRes.data?.group_id ?? null;
  const user    = mapProfile(profileRes.data, authEmail, groupId);

  console.log('[fetchAllData] groupId:', groupId ?? 'none — will show create/join screen');

  // No group is valid — user just hasn't joined one yet
  if (!groupId) return { ...empty, user };

  // ── Step 2: group + members + bookings ───────────────────────────
  onStatus('טוען קבוצה');
  console.log('[fetchAllData] step 2 — group data for', groupId);

  const [groupRes, membersRes, bookingsRes] = await Promise.all([
    withTimeout(
      supabase.from('car_groups').select('*, group_members(user_id)').eq('id', groupId).single(),
      'car_groups fetch',
    ),
    withTimeout(
      supabase.from('group_members')
        .select('user_id, profiles(id, name, profile_image, color, created_at)')
        .eq('group_id', groupId),
      'members fetch',
    ),
    withTimeout(
      supabase.from('bookings').select('*').eq('group_id', groupId)
        .order('date', { ascending: true }).order('start_time', { ascending: true }),
      'bookings fetch',
    ),
  ]);

  if (groupRes.error)    console.error('[fetchAllData] group error:',    groupRes.error.code,    groupRes.error.message);
  if (membersRes.error)  console.error('[fetchAllData] members error:',  membersRes.error.code,  membersRes.error.message);
  if (bookingsRes.error) console.error('[fetchAllData] bookings error:', bookingsRes.error.code, bookingsRes.error.message);

  console.log('[fetchAllData] group:', groupRes.data?.car_name ?? 'null');
  console.log('[fetchAllData] members count:', (membersRes.data ?? []).length);
  console.log('[fetchAllData] bookings count:', (bookingsRes.data ?? []).length);

  const userIds = ((groupRes.data?.group_members ?? []) as { user_id: string }[]).map(m => m.user_id);
  const group   = groupRes.data ? mapGroup(groupRes.data, userIds) : null;

  const members: User[] = (membersRes.data ?? []).map((m: any) => ({
    id:           m.profiles.id,
    name:         m.profiles.name,
    email:        '',
    profileEmoji: m.profiles.profile_image ?? '😀',
    color:        m.profiles.color,
    groupId,
    createdAt:    m.profiles.created_at,
  }));

  const bookings = (bookingsRes.data ?? []).map(mapBooking);

  onStatus('סיום טעינה');
  return { user, group, members, bookings };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [group,       setGroup      ] = useState<CarGroup | null>(null);
  const [members,     setMembers    ] = useState<User[]>([]);
  const [bookings,    setBookings   ] = useState<Booking[]>([]);
  const [isLoading,   setIsLoading  ] = useState(true);
  const [loadStatus,  setLoadStatus ] = useState('בודק חיבור ל-Supabase');
  const [loadError,   setLoadError  ] = useState<string | null>(null);

  const applyData = (d: { user: User | null; group: CarGroup | null; members: User[]; bookings: Booking[] }) => {
    setCurrentUser(d.user);
    setGroup(d.group);
    setMembers(d.members);
    setBookings(d.bookings);
  };

  // ------------------------------------------------------------------
  // refreshAll
  // ------------------------------------------------------------------
  const refreshAll = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) { console.error('[refreshAll] getUser error:', error.message); return; }
      if (!user) { applyData({ user: null, group: null, members: [], bookings: [] }); return; }
      const data = await fetchAllData(user.id, user.email ?? '');
      applyData(data);
    } catch (err) {
      console.error('[refreshAll] unexpected error:', err);
    }
  }, []);

  // ------------------------------------------------------------------
  // reloadBookings
  // ------------------------------------------------------------------
  const reloadBookings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: mem } = await supabase
        .from('group_members').select('group_id').eq('user_id', user.id).maybeSingle();
      if (!mem?.group_id) return;
      const { data: rows } = await supabase
        .from('bookings').select('*').eq('group_id', mem.group_id)
        .order('date').order('start_time');
      setBookings((rows ?? []).map(mapBooking));
    } catch (err) {
      console.error('[reloadBookings] unexpected error:', err);
    }
  }, []);

  // ------------------------------------------------------------------
  // Auth state — bootstrap on mount via getSession() (does not depend on
  // INITIAL_SESSION event which can be unreliable with newer Supabase keys)
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    // Safety net: unblock UI after 10 s no matter what
    const safetyTimer = setTimeout(() => {
      if (cancelled) return;
      console.warn('[Auth] 10 s safety timeout — forcing isLoading=false');
      setLoadError('הטעינה לקחה יותר מדי זמן — בדוק חיבור לאינטרנט');
      setIsLoading(false);
    }, 10000);

    async function bootstrap() {
      try {
        // ── Step 1: check if Supabase is reachable ───────────────────
        console.log('[Auth] calling getSession()…');
        setLoadStatus('בודק חיבור ל-Supabase');

        const { data: sessionData, error: sessionErr } = await withTimeout(
          supabase.auth.getSession(),
          'getSession',
          8000,
        );

        if (sessionErr) {
          console.error('[Auth] getSession error:', sessionErr);
          if (!cancelled) setLoadError('שגיאה בחיבור לשרת — ' + sessionErr.message);
          return;
        }

        const session = sessionData?.session ?? null;
        console.log('[Auth] session:', session ? `found (${session.user.id})` : 'none');

        // ── Step 2: load app data if session exists ───────────────────
        if (!cancelled) setLoadStatus('בודק משתמש מחובר');

        if (session?.user) {
          const data = await fetchAllData(
            session.user.id,
            session.user.email ?? '',
            (s) => { if (!cancelled) setLoadStatus(s); },
          );
          if (!cancelled) applyData(data);
        } else {
          console.log('[Auth] no session — will redirect to login');
          if (!cancelled) setLoadStatus('מעביר לדף כניסה');
        }
      } catch (err) {
        console.error('[Auth] bootstrap error:', err);
        if (!cancelled) setLoadError('שגיאה בטעינת המשתמש — נסה לרענן');
      } finally {
        clearTimeout(safetyTimer);
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();

    // Listen for subsequent auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;
        console.log('[Auth] state change:', event, '| user:', session?.user?.id ?? 'none');

        if (event === 'SIGNED_OUT') {
          applyData({ user: null, group: null, members: [], bookings: [] });
          setLoadError(null);
        }
        // SIGNED_IN / TOKEN_REFRESHED handled by explicit refreshAll() in pages
      },
    );

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------------
  // Realtime — bookings
  // ------------------------------------------------------------------
  const groupId = currentUser?.groupId ?? null;

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`bookings:${groupId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `group_id=eq.${groupId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const b = mapBooking(payload.new as any);
            setBookings(prev => prev.some(x => x.id === b.id) ? prev : [...prev, b]
              .sort((a, z) => a.date.localeCompare(z.date) || a.startTime.localeCompare(z.startTime)));
          } else if (payload.eventType === 'UPDATE') {
            const b = mapBooking(payload.new as any);
            setBookings(prev => prev.map(x => x.id === b.id ? b : x));
          } else if (payload.eventType === 'DELETE') {
            const id = (payload.old as any).id as string;
            setBookings(prev => prev.filter(x => x.id !== id));
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId]);

  // ------------------------------------------------------------------
  // Realtime — group membership
  // ------------------------------------------------------------------
  const refreshAllRef = useRef(refreshAll);
  useEffect(() => { refreshAllRef.current = refreshAll; }, [refreshAll]);

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`members:${groupId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` },
        () => { refreshAllRef.current(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId]);

  return (
    <AppContext.Provider value={{
      currentUser, group, members, bookings,
      isLoading, loadStatus, loadError,
      refreshAll, reloadBookings, setCurrentUser,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
