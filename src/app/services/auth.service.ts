/**
 * Auth Service
 * ------------
 * Handles authentication via Supabase Auth.
 *
 * SECURITY BEST PRACTICES:
 * - NEVER hardcode admin credentials (username/password) in source code.
 * - Passwords are hashed server-side by Supabase Auth using bcrypt.
 *   If you implement custom password hashing, use bcrypt (cost >= 12) or
 *   Argon2id — never MD5, SHA-1, or plain SHA-256.
 * - Session tokens are stored in httpOnly cookies or Supabase's built-in
 *   session management.
 * - Always validate and sanitise user input before rendering in templates
 *   to prevent XSS. Angular's default template binding ({{ }}) auto-escapes
 *   HTML, but avoid using [innerHTML] with untrusted data.
 */

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Sign in with email + password.
   * Credentials are sent over HTTPS to Supabase Auth — never stored locally.
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabaseService.client.auth.signOut();
    if (error) throw error;
  }

  async getSession() {
    const { data, error } = await this.supabaseService.client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  /**
   * SECURITY: Do NOT create admin accounts via client-side code.
   * Use Supabase dashboard or a server-side admin script with the
   * service-role key (stored in env vars, never in the browser).
   */
}
