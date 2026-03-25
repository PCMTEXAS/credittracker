import { Component, inject, signal, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { GoalService } from '../../../services/goal.service';
import { CreditTypeService } from '../../../services/credit-type.service';
import { UserService } from '../../../services/user.service';
import { CreditType } from '../../../models/credit-type.model';
import { AppUser } from '../../../models/user.model';
import { GoalRule, UserGoal } from '../../../models/goal.model';

type TabId = 'rules' | 'bulk' | 'individual';

@Component({
  selector: 'app-goal-builder',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule],
  templateUrl: './goal-builder.component.html',
})
export class GoalBuilderComponent implements OnInit {
  private goalSvc = inject(GoalService);
  private ctSvc = inject(CreditTypeService);
  private userSvc = inject(UserService);

  readonly currentYear = new Date().getFullYear();
  activeTab = signal<TabId>('rules');

  creditTypes = signal<CreditType[]>([]);
  users = signal<AppUser[]>([]);
  rules = signal<GoalRule[]>([]);
  userGoals = signal<UserGoal[]>([]);

  loading = signal(true);
  saving = signal(false);
  applyingRules = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  // Rule-based form
  ruleForm = new FormGroup({
    user_field: new FormControl<'job_title' | 'department' | 'role' | 'tag'>('job_title', { nonNullable: true }),
    field_value: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    credit_type_id: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    target_amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.5)]),
  });

  // Bulk form
  bulkForm = new FormGroup({
    credit_type_id: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    target_amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.5)]),
    user_ids: new FormControl<string[]>([], { nonNullable: true }),
  });

  // Individual form
  indivForm = new FormGroup({
    user_id: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    credit_type_id: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    target_amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.5)]),
  });

  async ngOnInit(): Promise<void> {
    await this.loadAll();
  }

  async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const [types, users, rules, goals] = await Promise.all([
        this.ctSvc.getAll(),
        this.userSvc.getAllUsers(),
        this.goalSvc.getRules(this.currentYear),
        this.goalSvc.getAllGoalsForYear(this.currentYear),
      ]);
      this.creditTypes.set(types);
      this.users.set(users);
      this.rules.set(rules);
      this.userGoals.set(goals);
    } finally {
      this.loading.set(false);
    }
  }

  setTab(tab: TabId): void { this.activeTab.set(tab); }

  // ── Rule-based ────────────────────────────────────────────────────────────

  async saveRule(): Promise<void> {
    if (this.ruleForm.invalid) { this.ruleForm.markAllAsTouched(); return; }
    this.saving.set(true);
    this.errorMsg.set('');
    try {
      const v = this.ruleForm.getRawValue();
      await this.goalSvc.createRule({
        user_field: v.user_field,
        field_value: v.field_value.trim(),
        credit_type_id: v.credit_type_id,
        target_amount: v.target_amount!,
        year: this.currentYear,
      });
      this.ruleForm.reset({ user_field: 'job_title', field_value: '', credit_type_id: '', target_amount: null });
      await this.loadAll();
      this.flash('Rule created successfully.');
    } catch (e: unknown) {
      this.errorMsg.set(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteRule(id: string): Promise<void> {
    if (!confirm('Delete this rule?')) return;
    try {
      await this.goalSvc.deleteRule(id);
      await this.loadAll();
      this.flash('Rule deleted.');
    } catch (e: unknown) {
      this.errorMsg.set(e instanceof Error ? e.message : 'Delete failed.');
    }
  }

  async applyRules(): Promise<void> {
    if (!confirm(`Apply all rules for ${this.currentYear}? This will upsert matching user goals.`)) return;
    this.applyingRules.set(true);
    try {
      const result = await this.goalSvc.applyRules(this.currentYear);
      await this.loadAll();
      this.flash(`Rules applied — ${result.applied} goal assignments updated.`);
    } catch (e: unknown) {
      this.errorMsg.set(e instanceof Error ? e.message : 'Apply failed.');
    } finally {
      this.applyingRules.set(false);
    }
  }

  // ── Bulk ──────────────────────────────────────────────────────────────────

  toggleBulkUser(userId: string): void {
    const current = this.bulkForm.controls.user_ids.value;
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    this.bulkForm.controls.user_ids.setValue(updated);
  }

  isBulkSelected(userId: string): boolean {
    return this.bulkForm.controls.user_ids.value.includes(userId);
  }

  selectAllUsers(): void {
    this.bulkForm.controls.user_ids.setValue(this.users().map(u => u.user_id));
  }

  clearAllUsers(): void {
    this.bulkForm.controls.user_ids.setValue([]);
  }

  async saveBulk(): Promise<void> {
    const v = this.bulkForm.getRawValue();
    if (!v.credit_type_id || !v.target_amount || v.user_ids.length === 0) {
      this.bulkForm.markAllAsTouched();
      this.errorMsg.set('Select a credit type, amount, and at least one user.');
      return;
    }
    this.saving.set(true);
    this.errorMsg.set('');
    try {
      await Promise.all(
        v.user_ids.map(uid => this.goalSvc.upsertGoal(uid, v.credit_type_id, v.target_amount!, this.currentYear))
      );
      this.bulkForm.reset({ credit_type_id: '', target_amount: null, user_ids: [] });
      await this.loadAll();
      this.flash(`Goals assigned to ${v.user_ids.length} users.`);
    } catch (e: unknown) {
      this.errorMsg.set(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      this.saving.set(false);
    }
  }

  // ── Individual ────────────────────────────────────────────────────────────

  async saveIndividual(): Promise<void> {
    if (this.indivForm.invalid) { this.indivForm.markAllAsTouched(); return; }
    this.saving.set(true);
    this.errorMsg.set('');
    const v = this.indivForm.getRawValue();
    try {
      await this.goalSvc.upsertGoal(v.user_id, v.credit_type_id, v.target_amount!, this.currentYear);
      this.indivForm.reset({ user_id: '', credit_type_id: '', target_amount: null });
      await this.loadAll();
      this.flash('Individual goal saved.');
    } catch (e: unknown) {
      this.errorMsg.set(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteGoal(id: string): Promise<void> {
    if (!confirm('Delete this goal assignment?')) return;
    try {
      await this.goalSvc.deleteGoal(id);
      await this.loadAll();
    } catch (e: unknown) {
      this.errorMsg.set(e instanceof Error ? e.message : 'Delete failed.');
    }
  }

  userName(userId: string): string {
    return this.users().find(u => u.user_id === userId)?.name ?? userId;
  }

  private flash(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 4000);
  }

  fieldLabel(field: string): string {
    const labels: Record<string, string> = { job_title: 'Job Title', department: 'Department', role: 'Role', tag: 'Tag' };
    return labels[field] ?? field;
  }
}
