// ============================================================
// SHB-AgentOS: Supabase Client Setup
// Server-side and client-side Supabase clients
// ============================================================

import { createClient } from '@supabase/supabase-js';

// ============================================================
// Server-side client (API routes) — uses service_role key
// Full database access, bypasses RLS
// ============================================================
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================
// Client-side client (browser) — uses anon key
// Respects RLS policies
// ============================================================
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    throw new Error(
      'Missing Supabase public environment variables. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }

  return createClient(supabaseUrl, supabaseAnon);
}

// ============================================================
// Singleton server client for API routes
// Reused across requests to avoid creating new clients per request
// ============================================================
let _serverClient: ReturnType<typeof createClient> | null = null;

export function getServerClient() {
  if (!_serverClient) {
    _serverClient = createServerClient();
  }
  return _serverClient;
}
