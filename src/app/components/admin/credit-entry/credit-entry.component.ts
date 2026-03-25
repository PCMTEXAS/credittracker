import { Component, inject, signal, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { CreditService } from '../../../services/credit.service';
import { CreditTypeService } from '../../../services/credit-type.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { CreditEntry } from '../../../models/credit-entry.model';
import { CreditType } from '../../../models/credit-type.model';
import { AppUser } from '../../../models/user.model';

@Component({
  selector: 'app-credit-entry',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule],
  templateUrl: './credit-entry.component.html',
})
export class CreditEntryComponent implements OnInit {
  private creditSvc = inject(CreditService);
  private ctSvc = inject(CreditTypeService);
  private userSvc = inject(UserService);
  private auth = inject(AuthService);

  readonly isAdmin = this.auth.isAdmin;
  readonly currentUser = this.auth.currentUser;
  readonly currentYear = new Date().getFullYear();

  creditTypes = signal<CreditType[]>([]);
  users = signal<AppUser[]>([]);
  entries = signal<CreditEntry[]>([]);

  loading = signal(true);
  saving = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  form = new FormGroup({
    user_id: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    credit_type_id: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.5)]),
    course_name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    earned_date: new FormControl<string>(this.today(), { nonNullable: true, validators: [Validators.required] }),
    source: new FormControl<'manual' | 'course' | 'external'>('manual', { nonNullable: true }),
    notes: new FormControl<string>('', { nonNullable: true }),
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const [types, users] = await Promise.all([
        this.ctSvc.getAll(),
        this.isAdmin() ? this.userSvc.getAllUsers() : Promise.resolve([]),
      ]);
      this.creditTypes.set(types);
      this.users.set(users);

      // Default user_id for non-admins
      const me = this.currentUser();
      if (me && !this.isAdmin()) {
        this.form.controls.user_id.setValue(me.user_id);
      }

      await this.loadEntries();
    } finally {
      this.loading.set(false);
    }
  }

  async loadEntries(): Promise<void> {
    const me = this.currentUser();
    if (!me) return;
    const userId = this.isAdmin() ? undefined : me.user_id;
    const all = userId
      ? await this.creditSvc.getEntriesForUser(userId, this.currentYear)
      : await this.creditSvc.getAllEntriesForYear(this.currentYear);
    this.entries.set(all);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.errorMsg.set('');
    const v = this.form.getRawValue();
    try {
      await this.creditSvc.addEntry({
        user_id: v.user_id,
        credit_type_id: v.credit_type_id,
        amount: v.amount!,
        course_name: v.course_name.trim(),
        earned_date: v.earned_date,
        source: v.source,
        notes: v.notes.trim() || undefined,
      });
      // Reset form but keep user/date
      const uid = v.user_id;
      const date = v.earned_date;
      this.form.reset({
        user_id: uid,
        credit_type_id: '',
        amount: null,
        course_name: '',
        earned_date: date,
        source: 'manual',
        notes: '',
      });
      await this.loadEntries();
      this.flash('Credit entry saved successfully.');
    } catch (e: unknown) {
      this.errorMsg.set(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      this.saving.set(false);
    }
  }

  async remove(id: string): Promise<void> {
    if (!confirm('Delete this credit entry?')) return;
    try {
      await this.creditSvc.deleteEntry(id);
      await this.loadEntries();
    } catch (e: unknown) {
      this.errorMsg.set(e instanceof Error ? e.message : 'Delete failed.');
    }
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private flash(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 4000);
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  userName(userId: string): string {
    return this.users().find(u => u.user_id === userId)?.name ?? userId;
  }

  sourceLabel(source: string): string {
    const map: Record<string, string> = { manual: 'Manual', course: 'Course', external: 'External' };
    return map[source] ?? source;
  }
}
