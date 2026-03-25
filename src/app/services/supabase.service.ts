/**
 * Supabase Service
 * ----------------
 * Centralised Supabase client. Credentials come from environment files
 * which are populated at build time from environment variables (never hardcoded).
 *
 * SECURITY NOTES:
 * - The anon key is safe to expose in the browser; Row-Level Security (RLS)
 *   in Supabase enforces access control.
 * - The service-role key must NEVER appear in client-side code.
 * - All database queries use Supabase's query builder which automatically
 *   parameterises values, preventing SQL injection.
 */

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Credentials sourced from environment — see .env.example
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  // ── Example: safe parameterised query ────────────────────────────
  // Supabase JS SDK parameterises all .eq() / .filter() values automatically.
  //
  //   BAD  (SQL injection risk):
  //     this.supabase.rpc('raw_sql', { query: `SELECT * FROM credits WHERE id = '${id}'` })
  //
  //   GOOD (parameterised):
  //     this.supabase.from('credits').select('*').eq('id', id)
  //
  // If you need raw SQL, always use parameterised RPC functions defined in
  // Supabase with $1, $2 placeholders.
}
