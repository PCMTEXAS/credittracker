import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditService } from '../../../services/credit.service';
import { CreditTypeService } from '../../../services/credit-type.service';
import { CreditType } from '../../../models/credit-type.model';
import { AppUser } from '../../../models/user.model';
import { GoalProgress } from '../../../models/goal.model';

interface UserReport {
  user: AppUser;
  progress: GoalProgress[];
  totalEarned: number;
  totalTarget: number;
  overallPercent: number;
}

@Component({
  selector: 'app-team-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-report.component.html'
})
export class TeamReportComponent implements OnInit {
  private creditService = inject(CreditService);
  private creditTypeService = inject(CreditTypeService);

  reports = signal<UserReport[]>([]);
  creditTypes = signal<CreditType[]>([]);
  loading = signal(true);
  year = new Date().getFullYear();

  async ngOnInit(): Promise<void> {
    const [users, creditTypes] = await Promise.all([
      this.creditService.getAllUsers(),
      this.creditTypeService.getAll()
    ]);
    this.creditTypes.set(creditTypes);

    const reports: UserReport[] = await Promise.all(
      users.map(async (user) => {
        const progress = await this.creditService.computeProgress(user.user_id, user, this.year, creditTypes);
        const totalEarned = progress.reduce((s, p) => s + p.earned, 0);
        const totalTarget = progress.reduce((s, p) => s + p.target, 0);
        const overallPercent = totalTarget > 0 ? Math.round((totalEarned / totalTarget) * 100) : 0;
        return { user, progress, totalEarned, totalTarget, overallPercent };
      })
    );

    this.reports.set(reports);
    this.loading.set(false);
  }

  getBarColor(percent: number): string {
    if (percent >= 100) return 'bg-success';
    if (percent >= 60) return 'bg-primary';
    if (percent >= 30) return 'bg-warning';
    return 'bg-danger';
  }
}
