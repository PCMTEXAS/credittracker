import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CreditEntry } from '../models/credit-entry.model';

@Injectable({ providedIn: 'root' })
export class CreditService {
  private supabase = inject(SupabaseService);

  async getEntriesForUser(userId: string, year: number): Promise<CreditEntry[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const { data, error } = await this.supabase.client
      .from('credit_entries')
      .select('*, credit_types(name)')
      .eq('user_id', userId)
      .gte('earned_date', startDate)
      .lte('earned_date', endDate)
      .order('earned_date', { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      credit_type_name: (r['credit_types'] as { name: string } | null)?.name ?? '',
    }));
  }

  async getAllEntriesForYear(year: number): Promise<CreditEntry[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const { data, error } = await this.supabase.client
      .from('credit_entries')
      .select('*, credit_types(name)')
      .gte('earned_date', startDate)
      .lte('earned_date', endDate);
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      credit_type_name: (r['credit_types'] as { name: string } | null)?.name ?? '',
    }));
  }

  async addEntry(entry: Omit<CreditEntry, 'id' | 'created_at' | 'credit_type_name'>): Promise<void> {
    const { error } = await this.supabase.client
      .from('credit_entries')
      .insert(entry);
    if (error) throw error;
  }

  async deleteEntry(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('credit_entries')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // Sum earned credits per credit type for a user/year
  sumByType(entries: CreditEntry[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const e of entries) {
      result[e.credit_type_id] = (result[e.credit_type_id] || 0) + e.amount;
    }
    return result;
  }
}
