import { Injectable, signal, computed } from '@angular/core';
import { inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AppUser } from '../models/user.model';

const ADMIN_USER_ID = 'VIPLS';
const ADMIN_PASSWORD = 'DC2026';

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);

  private _currentUser = signal<AppUser | null>(this.loadStoredUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => {
    const role = this._currentUser()?.role;
    return role === 'admin';
  });
  readonly isManager = computed(() => {
    const role = this._currentUser()?.role;
    return role === 'admin' || role === 'manager';
  });

  private loadStoredUser(): AppUser | null {
    try {
      const stored = sessionStorage.getItem('ct_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  async login(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Admin bypass
    if (userId.toUpperCase() === ADMIN_USER_ID && password === ADMIN_PASSWORD) {
      const adminUser: AppUser = {
        user_id: 'admin-bypass',
        email: 'patrick@pcmtexas.com',
        name: 'Patrick Schulte',
        role: 'admin',
        job_title: 'CEO',
        department: 'Executive',
        is_active: true,
      };
      this._currentUser.set(adminUser);
      sessionStorage.setItem('ct_user', JSON.stringify(adminUser));
      return { success: true };
    }

    try {
      const hash = await sha256(password);
      const { data, error } = await this.supabase.client
        .from('app_users')
        .select('user_id, email, name, role, job_title, department, tags, is_active')
        .eq('user_id', userId)
        .eq('password_hash', hash)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { success: false, error: 'Invalid credentials' };
      }

      const user: AppUser = {
        user_id: data['user_id'],
        email: data['email'],
        name: data['name'] || data['user_id'],
        role: data['role'] || 'reporter',
        job_title: data['job_title'] || '',
        department: data['department'] || '',
        tags: data['tags'] || [],
        is_active: data['is_active'],
      };

      this._currentUser.set(user);
      sessionStorage.setItem('ct_user', JSON.stringify(user));
      return { success: true };
    } catch {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  logout(): void {
    this._currentUser.set(null);
    sessionStorage.removeItem('ct_user');
  }
}
