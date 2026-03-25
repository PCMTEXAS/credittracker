import { Injectable, signal, computed } from '@angular/core';
import { inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AppUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private _user = signal<AppUser | null>(this.loadSession());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');
  readonly isManager = computed(() => ['admin','manager'].includes(this._user()?.role ?? ''));

  private loadSession(): AppUser | null {
    try {
      const s = localStorage.getItem('ct_session');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  }

  async login(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Admin bypass
    if (userId.toUpperCase() === 'VIPLS' && password === 'DC2026') {
      const u: AppUser = { user_id: 'VIPLS', role: 'admin', name: 'Patrick Schulte' };
      localStorage.setItem('ct_session', JSON.stringify(u));
      this._user.set(u);
      return { success: true };
    }

    const hash = await this.sha256(password);
    const { data, error } = await this.supabase.client
      .from('app_users')
      .select('user_id, role, name, job_title, department, tags, email, is_active')
      .eq('user_id', userId)
      .eq('password_hash', hash)
      .eq('is_active', true)
      .single();

    if (error || !data) return { success: false, error: 'Invalid credentials' };

    localStorage.setItem('ct_session', JSON.stringify(data));
    this._user.set(data as AppUser);
    return { success: true };
  }

  logout(): void {
    localStorage.removeItem('ct_session');
    this._user.set(null);
  }

  private async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
