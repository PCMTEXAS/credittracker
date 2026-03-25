import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreditService } from '../../../services/credit.service';
import { CreditTypeService } from '../../../services/credit-type.service';
import { CreditType } from '../../../models/credit-type.model';
import { GoalRule, UserGoal } from '../../../models/goal.model';
import { AppUser } from '../../../models/user.model';

@Component({
  selector: 'app-goal-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './goal-builder.component.html'
})
export class GoalBuilderComponent implements OnInit {
  private creditService = inject(CreditService);
  private creditTypeService = inject(CreditTypeService);

  creditTypes = signal<CreditType[]>([]);
  users = signal<AppUser[]>([]);
  rules = signal<GoalRule[]>([]);
  userGoals = signal<UserGoal[]>([]);
  loading = signal(true);
  saving = signal(false);
  year = new Date().getFullYear();
  tab = signal<'rules' | 'individual'>('rules');

  ruleForm = new FormGroup({
    user_field: new FormControl<'job_title' | 'department' | 'role' | 'tag'>('role', { nonNullable: true }),
    field_value: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    credit_type_id: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    target_amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)])
  });

  goalForm = new FormGroup({
    user_id: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    credit_type_id: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    target_amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)])
  });

  async ngOnInit(): Promise<void> {
    const [ct, users, rules] = await Promise.all([
      this.creditTypeService.getAll(),
      this.creditService.getAllUsers(),
      this.creditService.getGoalRules(this.year)
    ]);
    this.creditTypes.set(ct);
    this.users.set(users);
    this.rules.set(rules);
    this.loading.set(false);
  }

  async addRule(): Promise<void> {
    if (this.ruleForm.invalid) { this.ruleForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.ruleForm.getRawValue();
    await this.creditService.upsertGoalRule({ ...v, target_amount: v.target_amount!, year: this.year });
    this.rules.set(await this.creditService.getGoalRules(this.year));
    this.ruleForm.reset({ user_field: 'role' });
    this.saving.set(false);
  }

  async deleteRule(id: string): Promise<void> {
    if (!confirm('Delete this rule?')) return;
    await this.creditService.deleteGoalRule(id!);
    this.rules.set(await this.creditService.getGoalRules(this.year));
  }

  async addGoal(): Promise<void> {
    if (this.goalForm.invalid) { this.goalForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.goalForm.getRawValue();
    await this.creditService.upsertGoal({ ...v, target_amount: v.target_amount!, year: this.year });
    this.saving.set(false);
    this.goalForm.reset();
  }

  ctName(id: string): string {
    return this.creditTypes().find(c => c.id === id)?.name ?? id;
  }
}
