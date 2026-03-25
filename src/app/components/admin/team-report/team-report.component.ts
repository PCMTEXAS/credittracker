import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { GoalService } from '../../../services/goal.service';
import { CreditService } from '../../../services/credit.service';
import { UserService } from '../../../services/user.service';
import { CreditTypeService } from '../../../services/credit-type.service';
import { AppUser } from '../../../models/user.model';
import { CreditType } from '../../../models/credit-type.model';

interface UserRow {
  user: AppUser;
  totalGoal: number;
  totalEarned: number;
  percent: number;
  status: 'complete' | 'on-track' | 'at-risk' | 'behind' | 'no-goal';
  byType: Record<string, { goal: number; earned: number; percent: number }>;
}

@Component({
  selector: 'app-team-report',
  standalone: true,
  imports: [NavbarComponent, FormsModule],
  templateUrl: './team-report.component.html',
})
export class TeamReportComponent implements OnInit {
  private goalSvc = inject(GoalService);
  private creditSvc = inject(CreditService);
  private userSvc = inject(UserService);
  private ctSvc = inject(CreditTypeService);

  readonly currentYear = new Date().getFullYear();
  selectedYear = signal(this.currentYear);
  filterStatus = signal<string>('all');
  filterDept = signal<string>('all');
  searchText = signal('');

  loading = signal(true);
  rows = signal<UserRow[]>([]);
  creditTypes = signal<CreditType[]>([]);

  readonly departments = computed(() => {
    const depts = [...new Set(this.rows().map(r => r.user.department).filter(Boolean))];
    return depts.sort() as string[];
  });

  readonly filtered = computed(() => {
    let list = this.rows();
    const status = this.filterStatus();
    const dept = this.filterDept();
    const text = this.searchText().toLowerCase();
    if (status !== 'all') list = list.filter(r => r.status === status);
    if (dept !== 'all') list = list.filter(r => r.user.department === dept);
    if (text) list = list.filter(r =>
      r.user.name.toLowerCase().includes(text) ||
      (r.user.job_title ?? '').toLowerCase().includes(text)
    );
    return list;
  });

  readonly summary = computed(() => {
    const all = this.rows();
    return {
      total: all.length,
      complete: all.filter(r => r.status === 'complete').length,
      onTrack: all.filter(r => r.status === 'on-track').length,
      atRisk: all.filter(r => r.status === 'at-risk').length,
      behind: all.filter(r => r.status === 'behind').length,
      noGoal: all.filter(r => r.status === 'no-goal').length,
    };
  });

  async ngOnInit(): Promise<void> {
    await this.loadReport();
  }

  async loadReport(): Promise<void> {
    this.loading.set(true);
    const year = this.selectedYear();
    try {
      const [users, goals, entries, types] = await Promise.all([
        this.userSvc.getAllUsers(),
        this.goalSvc.getAllGoalsForYear(year),
        this.creditSvc.getAllEntriesForYear(year),
        this.ctSvc.getAll(),
      ]);
      this.creditTypes.set(types);

      const yearFraction = this.getYearFraction(year);

      const rows: UserRow[] = users.map(user => {
        const userGoals = goals.filter(g => g.user_id === user.user_id);
        const userEntries = entries.filter(e => e.user_id === user.user_id);
        const earnedByType = this.creditSvc.sumByType(userEntries);

        const byType: UserRow['byType'] = {};
        let totalGoal = 0;
        let totalEarned = 0;

        for (const g of userGoals) {
          const earned = earnedByType[g.credit_type_id] ?? 0;
          const pct = g.target_amount > 0 ? Math.min(100, Math.round((earned / g.target_amount) * 100)) : 0;
          byType[g.credit_type_id] = { goal: g.target_amount, earned, percent: pct };
          totalGoal += g.target_amount;
          totalEarned += earned;
        }

        const percent = totalGoal > 0 ? Math.min(100, Math.round((totalEarned / totalGoal) * 100)) : 0;
        let status: UserRow['status'] = 'no-goal';
        if (totalGoal > 0) {
          if (totalEarned >= totalGoal) status = 'complete';
          else {
            const pace = totalGoal * yearFraction;
            const ratio = totalEarned / (pace || 1);
            if (ratio >= 0.9) status = 'on-track';
            else if (ratio >= 0.6) status = 'at-risk';
            else status = 'behind';
          }
        }

        return { user, totalGoal, totalEarned, percent, status, byType };
      });

      this.rows.set(rows);
    } finally {
      this.loading.set(false);
    }
  }

  private getYearFraction(year: number): number {
    const now = new Date();
    if (year < now.getFullYear()) return 1;
    const start = new Date(year, 0, 1).getTime();
    const end = new Date(year + 1, 0, 1).getTime();
    return (now.getTime() - start) / (end - start);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      complete: 'Complete', 'on-track': 'On Track',
      'at-risk': 'At Risk', behind: 'Behind', 'no-goal': 'No Goal',
    };
    return map[status] ?? status;
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      complete: 'bg-primary', 'on-track': 'bg-success',
      'at-risk': 'bg-warning text-dark', behind: 'bg-danger', 'no-goal': 'bg-secondary',
    };
    return map[status] ?? 'bg-secondary';
  }

  progressBarClass(status: string): string {
    const map: Record<string, string> = {
      complete: 'bg-primary', 'on-track': 'bg-success',
      'at-risk': 'bg-warning', behind: 'bg-danger', 'no-goal': 'bg-secondary',
    };
    return map[status] ?? 'bg-secondary';
  }

  exportCSV(): void {
    const rows = this.filtered();
    const headers = ['Name', 'Job Title', 'Department', 'Total Goal', 'Earned', 'Percent', 'Status'];
    const lines = rows.map(r => [
      r.user.name, r.user.job_title ?? '', r.user.department ?? '',
      r.totalGoal, r.totalEarned, r.percent + '%', this.statusLabel(r.status),
    ].map(v => `"${v}"`).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-report-${this.selectedYear()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
