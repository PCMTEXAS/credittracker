import { Component, inject, signal, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { CreditTypeService } from '../../../services/credit-type.service';
import { CreditType } from '../../../models/credit-type.model';

@Component({
  selector: 'app-credit-types',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule],
  templateUrl: './credit-types.component.html',
})
export class CreditTypesComponent implements OnInit {
  private svc = inject(CreditTypeService);

  creditTypes = signal<CreditType[]>([]);
  loading = signal(true);
  saving = signal(false);
  errorMsg = signal('');
  successMsg = signal('');
  editingId = signal<string | null>(null);

  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80)] }),
    description: new FormControl<string>('', { nonNullable: true }),
  });

  readonly TYPE_COLORS = [
    '#0E2A5E','#F5821F','#198754','#0d6efd','#6f42c1',
    '#fd7e14','#20c997','#e83e8c','#343a40','#17a2b8',
  ];

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.creditTypes.set(await this.svc.getAll());
    } finally {
      this.loading.set(false);
    }
  }

  startEdit(ct: CreditType): void {
    this.editingId.set(ct.id);
    this.form.setValue({ name: ct.name, description: ct.description ?? '' });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset();
  }

  async save(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.errorMsg.set('');
    const { name, description } = this.form.getRawValue();
    try {
      const id = this.editingId();
      if (id) {
        await this.svc.update(id, name, description);
        this.successMsg.set('Credit type updated.');
      } else {
        await this.svc.create(name, description);
        this.successMsg.set('Credit type created.');
      }
      this.editingId.set(null);
      this.form.reset();
      await this.load();
      setTimeout(() => this.successMsg.set(''), 3000);
    } catch (e: unknown) {
      this.errorMsg.set(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      this.saving.set(false);
    }
  }

  async remove(id: string): Promise<void> {
    if (!confirm('Delete this credit type? Goals using it will also be removed.')) return;
    try {
      await this.svc.delete(id);
      await this.load();
      this.successMsg.set('Credit type deleted.');
      setTimeout(() => this.successMsg.set(''), 3000);
    } catch (e: unknown) {
      this.errorMsg.set(e instanceof Error ? e.message : 'Delete failed.');
    }
  }

  colorFor(index: number): string {
    return this.TYPE_COLORS[index % this.TYPE_COLORS.length];
  }
}
