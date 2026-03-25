import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AppUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private supabase = inject(SupabaseService);

  async getAllUsers(): Promise<AppUser[]> {
    const { data, error } = await this.supabase.client
      .from('app_users')
      .select('user_id, email, name, role, job_title, department, tags, is_active')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return (data || []).map(d => ({
      user_id: d['user_id'],
      email: d['email'] || '',
      name: d['name'] || d['user_id'],
      role: d['role'] || 'reporter',
      job_title: d['job_title'] || '',
      department: d['department'] || '',
      tags: d['tags'] || [],
      is_active: d['is_active'],
    }));
  }

  async updateUserFields(userId: string, fields: Partial<Pick<AppUser, 'name' | 'job_title' | 'department' | 'tags'>>): Promise<void> {
    const { error } = await this.supabase.client
      .from('app_users')
      .update(fields)
      .eq('user_id', userId);
    if (error) throw error;
  }
}
