import { supabase } from '@/lib/supabase';
import { mapProfile } from '@/lib/mappers';
import { User } from '@/types';

type ProfileRow = { id: string; name: string; profile_image: string | null; color: string; created_at: string };
type AuthUser   = { id: string; email?: string | null; user_metadata: Record<string, unknown> };

async function fetchGroupId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.group_id ?? null;
}

// Returns the profile row + null error on success, or null data + error string on failure.
//
// Attempted in order:
//   1. Direct SELECT  — fast path, blocked if RLS policies are missing
//   2. get_own_profile SECURITY DEFINER RPC — bypasses RLS; diagnoses whether
//      the profile exists but is hidden vs genuinely absent
//   3. INSERT new profile
//   4. Retry SELECT / RPC after unique-conflict (23505) — trigger created the row in the gap
//   5. create_profile SECURITY DEFINER RPC + get_own_profile — last resort
async function ensureProfile(
  user: AuthUser,
): Promise<{ data: ProfileRow | null; error: string | null }> {
  const userId = user.id;
  const email  = user.email ?? '';
  const meta   = user.user_metadata ?? {};

  // ── 1. Direct SELECT ─────────────────────────────────────────────
  console.log(`[ensureProfile] SELECT profiles WHERE id = '${userId}'`);
  const { data: existing, error: readErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  console.log('[ensureProfile] SELECT result →', {
    data:  existing  ?? null,
    error: readErr   ? JSON.stringify(readErr) : null,
  });

  if (existing) {
    console.log('[ensureProfile] ✓ found profile:', existing.name);
    return { data: existing as ProfileRow, error: null };
  }

  // ── 2. get_own_profile SECURITY DEFINER RPC ───────────────────────
  // If this returns the row but step 1 didn't, RLS policies are missing/wrong.
  // Fix: run supabase/fix-rls.sql in the Supabase SQL Editor.
  console.log('[ensureProfile] direct SELECT empty — trying get_own_profile RPC');
  const { data: ownRows, error: ownErr } = await supabase.rpc('get_own_profile');

  console.log('[ensureProfile] get_own_profile RPC →', {
    data:  ownRows ?? null,
    error: ownErr  ? JSON.stringify(ownErr) : null,
  });

  if (!ownErr && Array.isArray(ownRows) && ownRows.length > 0) {
    console.warn(
      '[ensureProfile] ⚠ RLS is blocking the direct SELECT but the profile exists. ' +
      'Fix: run supabase/fix-rls.sql in Supabase → SQL Editor.',
    );
    return { data: ownRows[0] as ProfileRow, error: null };
  }
  if (ownErr) {
    console.log('[ensureProfile] get_own_profile not available:', ownErr.message, '— continuing to INSERT');
  }

  // ── 3. INSERT new profile ────────────────────────────────────────
  if (readErr) {
    console.error('[ensureProfile] original SELECT error (full):', JSON.stringify(readErr));
  } else {
    console.log('[ensureProfile] profile row genuinely absent — inserting for', userId);
  }

  const name  = (meta.name  as string | undefined) ?? email.split('@')[0] ?? 'משתמש';
  const color = (meta.color as string | undefined) ?? '#22C55E';

  const { data: created, error: insertErr } = await supabase
    .from('profiles')
    .insert({ id: userId, name, profile_image: null, color, created_at: new Date().toISOString() })
    .select()
    .single();

  console.log('[ensureProfile] INSERT result →', {
    data:  created   ?? null,
    error: insertErr ? JSON.stringify(insertErr) : null,
  });

  if (!insertErr && created) {
    console.log('[ensureProfile] ✓ inserted profile:', created.name);
    return { data: created as ProfileRow, error: null };
  }

  // ── 4. Unique conflict (23505): trigger created the row in the gap → re-fetch ──
  if (insertErr?.code === '23505') {
    console.log('[ensureProfile] conflict (23505) — DB trigger already created the row; retrying SELECT');

    const { data: retry } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (retry) {
      console.log('[ensureProfile] ✓ found on retry SELECT:', retry.name);
      return { data: retry as ProfileRow, error: null };
    }

    // Still blocked by RLS on retry → try the SECURITY DEFINER RPC
    const { data: retryOwn } = await supabase.rpc('get_own_profile');
    if (Array.isArray(retryOwn) && retryOwn.length > 0) {
      console.warn('[ensureProfile] ⚠ RLS blocking retry SELECT — found via RPC. Fix RLS policies.');
      return { data: retryOwn[0] as ProfileRow, error: null };
    }
  }

  // ── 5. create_profile SECURITY DEFINER RPC → get_own_profile ─────
  console.log('[ensureProfile] last resort: create_profile RPC for', userId);
  const { error: createErr } = await supabase.rpc('create_profile', {
    p_user_id: userId,
    p_name:    name,
    p_emoji:   '😀',
    p_color:   color,
  });

  console.log('[ensureProfile] create_profile RPC →', {
    error: createErr ? JSON.stringify(createErr) : null,
  });

  if (createErr) {
    const msg = `create_profile RPC failed: ${createErr.message} (code: ${createErr.code ?? 'none'})`;
    console.error('[ensureProfile]', msg);
    return { data: null, error: msg };
  }

  // Fetch after create — try RPC first (bypasses RLS), then direct SELECT
  const { data: afterRpc, error: afterRpcErr } = await supabase.rpc('get_own_profile');
  console.log('[ensureProfile] get_own_profile after create_profile →', {
    data:  afterRpc    ?? null,
    error: afterRpcErr ? JSON.stringify(afterRpcErr) : null,
  });

  if (!afterRpcErr && Array.isArray(afterRpc) && afterRpc.length > 0) {
    console.log('[ensureProfile] ✓ found after create_profile RPC:', afterRpc[0].name);
    return { data: afterRpc[0] as ProfileRow, error: null };
  }

  const { data: finalRetry } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (finalRetry) {
    console.log('[ensureProfile] ✓ found on final direct SELECT:', finalRetry.name);
    return { data: finalRetry as ProfileRow, error: null };
  }

  const finalMsg = insertErr
    ? `INSERT failed (${insertErr.code}): ${insertErr.message}`
    : afterRpcErr
    ? `post-create SELECT failed (${afterRpcErr.code}): ${afterRpcErr.message}`
    : 'profile not found after all attempts — check RLS policies in Supabase dashboard';

  console.error('[ensureProfile] ✗ all attempts failed:', finalMsg);
  return { data: null, error: finalMsg };
}

export const authService = {
  async signup(data: {
    name: string;
    email: string;
    password: string;
    profileEmoji?: string;
    color?: string;
  }): Promise<{ user: User | null; error: string | null }> {
    const emoji = data.profileEmoji ?? '😀';
    const color = data.color ?? '#22C55E';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        // Stored as raw_user_meta_data — used by DB trigger + ensureProfile fallback
        data: { name: data.name.trim(), profileEmoji: emoji, color },
      },
    });

    if (authError) {
      console.error('[signup] auth error:', authError.message);
      const msg = authError.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('email address')) {
        return { user: null, error: 'כתובת האימייל כבר קיימת במערכת' };
      }
      return { user: null, error: authError.message };
    }
    if (!authData.user) return { user: null, error: 'שגיאה ביצירת החשבון' };

    console.log('[signup] auth user created:', authData.user.id);
    console.log('[signup] session:', authData.session ? 'present' : 'null — email confirmation may be enabled');

    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert(
        { id: authData.user.id, name: data.name.trim(), profile_image: emoji, color },
        { onConflict: 'id' },
      );

    if (upsertErr) {
      console.error('[signup] direct upsert failed:', upsertErr.code, upsertErr.message);

      const { error: rpcErr } = await supabase.rpc('create_profile', {
        p_user_id: authData.user.id,
        p_name:    data.name.trim(),
        p_emoji:   emoji,
        p_color:   color,
      });

      if (rpcErr) {
        console.error('[signup] RPC create_profile also failed:', rpcErr.code, rpcErr.message);
      } else {
        console.log('[signup] profile created via RPC ok');
      }
    } else {
      console.log('[signup] profile upsert ok');
    }

    return {
      user: {
        id:           authData.user.id,
        name:         data.name.trim(),
        email:        data.email.trim().toLowerCase(),
        profileEmoji: emoji,
        color,
        groupId:      null,
        createdAt:    new Date().toISOString(),
      },
      error: null,
    };
  },

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User | null; error: string | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    });

    if (error) {
      console.error('[login] auth error:', error.message);
      return { user: null, error: 'אימייל או סיסמה שגויים' };
    }
    if (!data.user) return { user: null, error: 'שגיאה בכניסה' };

    // Log auth state so we can verify session is active before hitting the DB
    console.log('[login] signInWithPassword ok');
    console.log('[login] user.id:', data.user.id);
    console.log('[login] user.email:', data.user.email);
    console.log('[login] session exists:', !!data.session);
    if (data.session) {
      console.log('[login] access_token (first 30 chars):', data.session.access_token.slice(0, 30) + '...');
    } else {
      console.error('[login] ⚠ NO SESSION returned — email confirmation may be required in Supabase settings');
    }

    // Confirm the session is live on the client before touching the DB
    const { data: { user: confirmedUser }, error: getUserErr } = await supabase.auth.getUser();
    if (getUserErr) console.error('[login] getUser error:', JSON.stringify(getUserErr));
    const authUser = (confirmedUser ?? data.user) as AuthUser;
    console.log('[login] confirmed user — id:', authUser.id, '| email:', authUser.email);

    // Run profile fetch and group lookup in parallel.
    // groupId === null is normal when the user hasn't joined a group yet.
    const [profileResult, groupId] = await Promise.all([
      ensureProfile(authUser),
      fetchGroupId(authUser.id),
    ]);

    if (!profileResult.data) {
      console.error('[login] ✗ profile failed:', profileResult.error);
      return {
        user:  null,
        error: process.env.NODE_ENV === 'development'
          ? `שגיאה: ${profileResult.error}`
          : 'שגיאה בטעינת הפרופיל — נסה שוב',
      };
    }

    // groupId === null → user has no group yet → login page redirects to /setup
    console.log(
      '[login] ✓ login complete — profile:', profileResult.data.name,
      '| groupId:', groupId ?? 'none (will show create/join screen)',
    );
    return { user: mapProfile(profileResult.data, authUser.email ?? '', groupId), error: null };
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  async updateUser(
    id: string,
    updates: { name?: string; profileEmoji?: string; color?: string },
  ): Promise<{ error: string | null }> {
    const patch: Record<string, string> = {};
    if (updates.name         !== undefined) patch.name          = updates.name.trim();
    if (updates.profileEmoji !== undefined) patch.profile_image = updates.profileEmoji;
    if (updates.color        !== undefined) patch.color         = updates.color;

    const { error } = await supabase.from('profiles').update(patch).eq('id', id);
    if (error) console.error('[updateUser] error:', error.message);
    return { error: error ? 'שגיאה בעדכון הפרופיל' : null };
  },
};
