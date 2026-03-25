import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { UserGoal, GoalRule, GoalWithProgress } from '../models/goal.model';

@Injectable({ providedIn: 'root' })
export class GoalService {
  private supabase = inject(SupabaseService);

  // ─── User Goals ───────────────────────────────────────────────────────────

  async getGoalsForUser(userId: string, year: number): Promise<UserGoal[]> {
    const { data, error } = await this.supabase.client
      .from('user_goals')
      .select('*, credit_types(name)')
      .eq('user_id', userId)
      .eq('year', year);
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      credit_type_name: (r['credit_types'] as { name: string } | null)?.name ?? '',
    }));
  }

  async getAllGoalsForYear(year: number): Promise<UserGoal[]> {
    const { data, error } = await this.supabase.client
      .from('user_goals')
      .select('*, credit_types(name)')
      .eq('year', year);
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      credit_type_name: (r['credit_types'] as { name: string } | null)?.name ?? '',
    }));
  }

  async upsertGoal(userId: string, creditTypeId: string, target: number, year: number): Promise<void> {
    const { error } = await this.supabase.client
      .from('user_goals')
      .upsert(
        { user_id: userId, credit_type_id: creditTypeId, target_amount: target, year },
        { onConflict: 'user_id,credit_type_id,year' }
      );
    if (error) throw error;
  }

  async deleteGoal(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('user_goals')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // ─── Goal Rules ───────────────────────────────────────────────────────────

  async getRules(year: number): Promise<GoalRule[]> {
    const { data, error } = await this.supabase.client
      .from('goal_rules')
      .select('*, credit_types(name)')
      .eq('year', year)
      .order('user_field');
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      credit_type_name: (r['credit_types'] as { name: string } | null)?.name ?? '',
    }));
  }

  async createRule(rule: Omit<GoalRule, 'id' | 'created_at' | 'credit_type_name'>): Promise<void> {
    const { error } = await this.supabase.client
      .from('goal_rules')
      .insert(rule);
    if (error) throw error;
  }

  async deleteRule(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('goal_rules')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // Apply goal rules to all matching users
  async applyRules(year: number): Promise<{ applied: number }> {
    // Fetch all rules and users, then upsert goals
    const { data: rules } = await this.supabase.client
      .from('goal_rules')
      .select('*')
      .eq('year', year);

    const { data: users } = await this.supabase.client
      .from('app_users')
      .select('user_id, role, job_title, department, tags')
      .eq('is_active', true);

    if (!rules || !users) return { applied: 0 };

    const upserts: Array<{ user_id: string; credit_type_id: string; target_amount: number; year: number }> = [];

    for (const rule of rules) {
      for (const user of users) {
        let matches = false;
        if (rule['user_field'] === 'job_title' && user['job_title']?.toLowerCase() === rule['field_value'].toLowerCase()) matches = true;
        if (rule['user_field'] === 'department' && user['department']?.toLowerCase() === rule['field_value'].toLowerCase()) matches = true;
        if (rule['user_field'] === 'role' && user['role'] === rule['field_value']) matches = true;
        if (rule['user_field'] === 'tag' && (user['tags'] || []).includes(rule['field_value'])) matches = true;

        if (matches) {
          upserts.push({
            user_id: user['user_id'],
            credit_type_id: rule['credit_type_id'],
            target_amount: rule['target_amount'],
            year,
          });
        }
      }
    }

    if (upserts.length > 0) {
      await this.supabase.client
        .from('user_goals')
        .upsert(upserts, { onConflict: 'user_id,credit_type_id,year' });
    }

    return { applied: upserts.length };
  }

  // ─── Progress Calculation ─────────────────────────────────────────────────

  computeStatus(earned: number, target: number, yearFraction: number): GoalWithProgress['status'] {
    if (earned >= target) return 'complete';
    const pace = target * yearFraction;
    const ratio = earned / (pace || 1);
    if (ratio >= 0.9) return 'on-track';
    if (ratio >= 0.6) return 'at-risk';
    return 'behind';
  }
}
