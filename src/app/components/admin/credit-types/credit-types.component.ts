import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreditTypeService } from '../../../services/credit-type.service';
import { CreditType } from '../../../models/credit-type.model';

@Component({
  selector: 'app-credit-types',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './credit-types.component.html'
})
export class CreditTypesComponent implements OnInit {
  private service = inject(CreditTypeService);

  creditTypes = signal<CreditType[]>([]);
  loading = signal(true);
  saving = signal(false);
  editing = signal<CreditType | null>(null);

  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>(''),
    color: new FormControl<string>('#0E2A5E')
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.creditTypes.set(await this.service.getAll());
    this.loading.set(false);
  }

  startEdit(ct: CreditType): void {
    this.editing.set(ct);
    this.form.setValue({ name: ct.name, description: ct.description ?? '', color: ct.color ?? '#0E2A5E' });
  }

  startNew(): void {
    this.editing.set({ id: '', name: '', description: '', color: '#0E2A5E' });
    this.form.reset({ name: '', description: '', color: '#0E2A5E' });
  }

  cancelEdit(): void {
    this.editing.set(null);
    this.form.reset();
  }

  async save(): Promise<void> {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const payload: Partial<CreditType> = { ...v };
    if (this.editing()?.id) payload['id'] = this.editing()!.id;
    await this.service.upsert(payload);
    this.saving.set(false);
    this.editing.set(null);
    await this.load();
  }

  async delete(id: string): Promise<void> {
    if (!confirm('Delete this credit type? This cannot be undone.')) return;
    await this.service.delete(id);
    await this.load();
  }
}
