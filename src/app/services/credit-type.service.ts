import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CreditType } from '../models/credit-type.model';

@Injectable({ providedIn: 'root' })
export class CreditTypeService {
  private sb = inject(SupabaseService);

  async getAll(): Promise<CreditType[]> {
    const { data } = await this.sb.client.from('credit_types').select('*').order('name');
    return (data as CreditType[]) ?? [];
  }

  async upsert(ct: Partial<CreditType>): Promise<void> {
    await this.sb.client.from('credit_types').upsert(ct);
  }

  async delete(id: string): Promise<void> {
    await this.sb.client.from('credit_types').delete().eq('id', id);
  }
}
