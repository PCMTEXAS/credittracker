import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CreditType } from '../models/credit-type.model';

const TYPE_COLORS = [
  '#0E2A5E', '#F5821F', '#198754', '#0d6efd', '#6f42c1',
  '#fd7e14', '#20c997', '#e83e8c', '#343a40', '#17a2b8',
];

@Injectable({ providedIn: 'root' })
export class CreditTypeService {
  private supabase = inject(SupabaseService);

  async getAll(): Promise<CreditType[]> {
    const { data, error } = await this.supabase.client
      .from('credit_types')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []).map((t, i) => ({ ...t, color: t['color'] || TYPE_COLORS[i % TYPE_COLORS.length] }));
  }

  async create(name: string, description?: string): Promise<CreditType> {
    const { data, error } = await this.supabase.client
      .from('credit_types')
      .insert({ name: name.trim(), description: description?.trim() || null })
      .select()
      .single();
    if (error) throw error;
    return data as CreditType;
  }

  async update(id: string, name: string, description?: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('credit_types')
      .update({ name: name.trim(), description: description?.trim() || null })
      .eq('id', id);
    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('credit_types')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
