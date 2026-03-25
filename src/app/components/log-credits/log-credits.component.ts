import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CreditService } from '../../services/credit.service';
import { CreditTypeService } from '../../services/credit-type.service';
import { CreditType } from '../../models/credit-type.model';

@Component({
  selector: 'app-log-credits',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './log-credits.component.html'
})
export class LogCreditsComponent implements OnInit {
  private auth = inject(AuthService);
  private creditService = inject(CreditService);
  private creditTypeService = inject(CreditTypeService);

  creditTypes = signal<CreditType[]>([]);
  loading = signal(false);
  success = signal(false);
  error = signal('');

  form = new FormGroup({
    credit_type_id: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    course_name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    earned_date: new FormControl<string>(new Date().toISOString().slice(0, 10), { nonNullable: true, validators: [Validators.required] }),
    source: new FormControl<'manual' | 'course' | 'external'>('manual', { nonNullable: true }),
    notes: new FormControl<string>('')
  });

  async ngOnInit(): Promise<void> {
    this.creditTypes.set(await this.creditTypeService.getAll());
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    this.success.set(false);
    const v = this.form.getRawValue();
    await this.creditService.addEntry({
      user_id: this.auth.user()!.user_id,
      credit_type_id: v.credit_type_id,
      amount: v.amount!,
      course_name: v.course_name,
      earned_date: v.earned_date,
      source: v.source,
      notes: v.notes ?? ''
    });
    this.loading.set(false);
    this.success.set(true);
    this.form.reset({ earned_date: new Date().toISOString().slice(0, 10), source: 'manual' });
  }
}
