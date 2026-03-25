import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CreditEntry } from '../models/credit-entry.model';
import { GoalProgress, UserGoal, GoalRule } from '../models/goal.model';
import { CreditType } from '../models/credit-type.model';
import { AppUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class CreditService {
  private sb = inject(SupabaseService);

  async getEntriesForUser(userId: string, year?: number): Promise<CreditEntry[]> {
    let q = this.sb.client
      .from('credit_entries')
      .select('*, credit_type:credit_types(name,color)')
      .eq('user_id', userId)
      .order('earned_date', { ascending: false });
    if (year) {
      q = q.gte('earned_date', `${year}-01-01`).lte('earned_date', `${year}-12-31`);
    }
    const { data } = await q;
    return (data as CreditEntry[]) ?? [];
  }

  async getAllEntries(year?: number): Promise<CreditEntry[]> {
    let q = this.sb.client
      .from('credit_entries')
      .select('*, credit_type:credit_types(name,color)')
      .order('earned_date', { ascending: false });
    if (year) {
      q = q.gte('earned_date', `${year}-01-01`).lte('earned_date', `${year}-12-31`);
    }
    const { data } = await q;
    return (data as CreditEntry[]) ?? [];
  }

  async addEntry(entry: Omit<CreditEntry, 'id' | 'created_at'>): Promise<void> {
    await this.sb.client.from('credit_entries').insert(entry);
  }

  async deleteEntry(id: string): Promise<void> {
    await this.sb.client.from('credit_entries').delete().eq('id', id);
  }

  async getGoalsForUser(userId: string, year: number): Promise<UserGoal[]> {
    const { data } = await this.sb.client
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year);
    return (data as UserGoal[]) ?? [];
  }

  async upsertGoal(goal: UserGoal): Promise<void> {
    await this.sb.client.from('user_goals').upsert(goal, { onConflict: 'user_id,credit_type_id,year' });
  }

  async deleteGoal(id: string): Promise<void> {
    await this.sb.client.from('user_goals').delete().eq('id', id);
  }

  async getGoalRules(year: number): Promise<GoalRule[]> {
    const { data } = await this.sb.client
      .from('goal_rules')
      .select('*')
      .eq('year', year);
    return (data as GoalRule[]) ?? [];
  }

  async upsertGoalRule(rule: Omit<GoalRule, 'id'>): Promise<void> {
    await this.sb.client.from('goal_rules').insert(rule);
  }

  async deleteGoalRule(id: string): Promise<void> {
    await this.sb.client.from('goal_rules').delete().eq('id', id);
  }

  async computeProgress(userId: string, user: AppUser, year: number, creditTypes: CreditType[]): Promise<GoalProgress[]> {
    const [goals, entries, rules] = await Promise.all([
      this.getGoalsForUser(userId, year),
      this.getEntriesForUser(userId, year),
      this.getGoalRules(year)
    ]);

    // Apply goal rules to fill in goals the user doesn't have explicitly
    const allGoals: UserGoal[] = [...goals];
    for (const rule of rules) {
      const alreadySet = allGoals.some(g => g.credit_type_id === rule.credit_type_id);
      if (alreadySet) continue;
      let matches = false;
      if (rule.user_field === 'role' && user.role === rule.field_value) matches = true;
      if (rule.user_field === 'job_title' && user.job_title === rule.field_value) matches = true;
      if (rule.user_field === 'department' && user.department === rule.field_value) matches = true;
      if (rule.user_field === 'tag' && (user.tags ?? []).includes(rule.field_value)) matches = true;
      if (matches) {
        allGoals.push({ user_id: userId, credit_type_id: rule.credit_type_id, target_amount: rule.target_amount, year });
      }
    }

    return allGoals.map(goal => {
      const ct = creditTypes.find(c => c.id === goal.credit_type_id);
      const earned = entries.filter(e => e.credit_type_id === goal.credit_type_id).reduce((sum, e) => sum + Number(e.amount), 0);
      const percent = Math.min(100, Math.round((earned / goal.target_amount) * 100));
      return {
        credit_type_id: goal.credit_type_id,
        credit_type_name: ct?.name ?? 'Unknown',
        color: ct?.color,
        target: goal.target_amount,
        earned,
        percent,
        remaining: Math.max(0, goal.target_amount - earned)
      };
    });
  }

  async getAllUsers(): Promise<AppUser[]> {
    const { data } = await this.sb.client
      .from('app_users')
      .select('user_id, name, role, job_title, department, email, is_active, tags')
      .eq('is_active', true)
      .order('name');
    return (data as AppUser[]) ?? [];
  }
}
