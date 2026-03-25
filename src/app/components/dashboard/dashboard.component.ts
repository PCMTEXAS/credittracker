import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CreditService } from '../../services/credit.service';
import { CreditTypeService } from '../../services/credit-type.service';
import { GoalProgress } from '../../models/goal.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private creditService = inject(CreditService);
  private creditTypeService = inject(CreditTypeService);

  year = new Date().getFullYear();
  progress = signal<GoalProgress[]>([]);
  totalEarned = signal(0);
  totalTarget = signal(0);
  loading = signal(true);

  async ngOnInit(): Promise<void> {
    const user = this.auth.user()!;
    const creditTypes = await this.creditTypeService.getAll();
    const prog = await this.creditService.computeProgress(user.user_id, user, this.year, creditTypes);
    this.progress.set(prog);
    this.totalEarned.set(prog.reduce((s, p) => s + p.earned, 0));
    this.totalTarget.set(prog.reduce((s, p) => s + p.target, 0));
    this.loading.set(false);
  }

  getProgressColor(percent: number): string {
    if (percent >= 100) return 'bg-success';
    if (percent >= 60) return 'bg-primary';
    if (percent >= 30) return 'bg-warning';
    return 'bg-danger';
  }
}
