import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CreditService } from '../../services/credit.service';
import { CreditEntry } from '../../models/credit-entry.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html'
})
export class HistoryComponent implements OnInit {
  private auth = inject(AuthService);
  private creditService = inject(CreditService);

  entries = signal<CreditEntry[]>([]);
  loading = signal(true);
  year = signal(new Date().getFullYear());

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    const data = await this.creditService.getEntriesForUser(this.auth.user()!.user_id, this.year());
    this.entries.set(data);
    this.loading.set(false);
  }

  async changeYear(y: number): Promise<void> {
    this.year.set(y);
    await this.load();
  }

  async deleteEntry(id: string): Promise<void> {
    if (!confirm('Delete this entry?')) return;
    await this.creditService.deleteEntry(id);
    await this.load();
  }

  totalCredits(): number {
    return this.entries().reduce((s, e) => s + Number(e.amount), 0);
  }

  get years(): number[] {
    const cur = new Date().getFullYear();
    return [cur, cur - 1, cur - 2];
  }
}
