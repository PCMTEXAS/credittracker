import { Component, inject, signal, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { UserService } from '../../../services/user.service';
import { AppUser } from '../../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  private userSvc = inject(UserService);

  users = signal<AppUser[]>([]);
  loading = signal(true);
  saving = signal(false);
  editingId = signal<string | null>(null);
  errorMsg = signal('');
  successMsg = signal('');

  editForm = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    job_title: new FormControl<string>('', { nonNullable: true }),
    department: new FormControl<string>('', { nonNullable: true }),
    tags: new FormControl<string>('', { nonNullable: true }),
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.users.set(await this.userSvc.getAllUsers());
    } finally {
      this.loading.set(false);
    }
  }

  startEdit(user: AppUser): void {
    this.editingId.set(user.user_id);
    this.editForm.setValue({
      name: user.name,
      job_title: user.job_title ?? '',
      department: user.department ?? '',
      tags: (user.tags ?? []).join(', '),
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editForm.reset();
  }

  async saveEdit(): Promise<void> {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    const id = this.editingId();
    if (!id) return;
    this.saving.set(true);
    this.errorMsg.set('');
    const v = this.editForm.getRawValue();
    try {
      await this.userSvc.updateUserFields(id, {
        name: v.name.trim(),
        job_title: v.job_title.trim() || undefined,
        department: v.department.trim() || undefined,
        tags: v.tags ? v.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      this.editingId.set(null);
      await this.load();
      this.flash('User updated.');
    } catch (e: unknown) {
      this.errorMsg.set(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      this.saving.set(false);
    }
  }

  private flash(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3000);
  }

  roleClass(role: string): string {
    const map: Record<string, string> = {
      admin: 'bg-danger',
      manager: 'bg-warning text-dark',
      reporter: 'bg-secondary',
    };
    return map[role] ?? 'bg-secondary';
  }
}
