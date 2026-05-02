import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Log on the client so we can verify env vars are loaded
if (typeof window !== 'undefined') {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[Supabase] ❌ Missing env vars!\n' +
      '  NEXT_PUBLIC_SUPABASE_URL =', supabaseUrl || 'MISSING', '\n' +
      '  NEXT_PUBLIC_SUPABASE_ANON_KEY =', supabaseAnonKey ? '(set)' : 'MISSING',
    );
  } else {
    console.log(
      '[Supabase] ✓ Config loaded\n' +
      '  URL:', supabaseUrl, '\n' +
      '  Key prefix:', supabaseAnonKey.slice(0, 24) + '…',
    );
  }
}

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession:    true,
      autoRefreshToken:  true,
      detectSessionInUrl: false, // avoid window.location parsing issues during SSR
    },
  },
);

export const isSupabaseReady = !!(supabaseUrl && supabaseAnonKey);
