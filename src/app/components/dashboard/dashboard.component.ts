import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { GoalService } from '../../services/goal.service';
import { CreditService } from '../../services/credit.service';
import { CreditTypeService } from '../../services/credit-type.service';
import { GoalWithProgress } from '../../models/goal.model';
import { CreditEntry } from '../../models/credit-entry.model';
import { CreditType } from '../../models/credit-type.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NavbarComponent, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private goalService = inject(GoalService);
  private creditService = inject(CreditService);
  private creditTypeService = inject(CreditTypeService);

  readonly currentUser = this.auth.currentUser;
  readonly isAdmin = this.auth.isAdmin;
  readonly isManager = this.auth.isManager;

  readonly currentYear = new Date().getFullYear();

  loading = signal(true);
  goalsWithProgress = signal<GoalWithProgress[]>([]);
  recentEntries = signal<CreditEntry[]>([]);
  creditTypes = signal<CreditType[]>([]);

  readonly totalEarned = computed(() =>
    this.goalsWithProgress().reduce((sum, g) => sum + g.earned, 0)
  );
  readonly totalGoal = computed(() =>
    this.goalsWithProgress().reduce((sum, g) => sum + g.target_amount, 0)
  );
  readonly overallPercent = computed(() => {
    const goal = this.totalGoal();
    if (!goal) return 0;
    return Math.min(100, Math.round((this.totalEarned() / goal) * 100));
  });
  readonly overallStatus = computed(() => {
    const p = this.overallPercent();
    if (p >= 100) return 'complete';
    const yearFraction = this.getYearFraction();
    const paceNeeded = yearFraction * 100;
    if (p >= paceNeeded * 0.9) return 'on-track';
    if (p >= paceNeeded * 0.6) return 'at-risk';
    return 'behind';
  });

  readonly completeCount = computed(() =>
    this.goalsWithProgress().filter(g => g.status === 'complete').length
  );
  readonly atRiskCount = computed(() =>
    this.goalsWithProgress().filter(g => g.status === 'at-risk' || g.status === 'behind').length
  );

  async ngOnInit(): Promise<void> {
    const user = this.currentUser();
    if (!user) return;
    try {
      const [goals, entries, types] = await Promise.all([
        this.goalService.getGoalsForUser(user.user_id, this.currentYear),
        this.creditService.getEntriesForUser(user.user_id, this.currentYear),
        this.creditTypeService.getAll(),
      ]);

      this.creditTypes.set(types);
      const earnedByType = this.creditService.sumByType(entries);
      const yearFraction = this.getYearFraction();

      const withProgress: GoalWithProgress[] = goals.map(g => {
        const earned = earnedByType[g.credit_type_id] ?? 0;
        const percent = g.target_amount > 0 ? Math.min(100, Math.round((earned / g.target_amount) * 100)) : 0;
        const status = this.goalService.computeStatus(earned, g.target_amount, yearFraction);
        return { ...g, earned, percent, status };
      });

      this.goalsWithProgress.set(withProgress);
      this.recentEntries.set(entries.slice(0, 10));
    } finally {
      this.loading.set(false);
    }
  }

  private getYearFraction(): number {
    const now = new Date();
    const start = new Date(this.currentYear, 0, 1).getTime();
    const end = new Date(this.currentYear + 1, 0, 1).getTime();
    return (now.getTime() - start) / (end - start);
  }

  statusLabel(status: GoalWithProgress['status']): string {
    const labels: Record<string, string> = {
      complete: 'Complete',
      'on-track': 'On Track',
      'at-risk': 'At Risk',
      behind: 'Behind',
    };
    return labels[status] ?? status;
  }

  statusBadgeClass(status: GoalWithProgress['status']): string {
    const classes: Record<string, string> = {
      complete: 'bg-primary',
      'on-track': 'bg-success',
      'at-risk': 'bg-warning text-dark',
      behind: 'bg-danger',
    };
    return classes[status] ?? 'bg-secondary';
  }

  progressBarClass(status: GoalWithProgress['status']): string {
    const classes: Record<string, string> = {
      complete: 'bg-primary',
      'on-track': 'bg-success',
      'at-risk': 'bg-warning',
      behind: 'bg-danger',
    };
    return classes[status] ?? 'bg-secondary';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
