import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditService } from '../../../services/credit.service';
import { AppUser } from '../../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  private creditService = inject(CreditService);
  users = signal<AppUser[]>([]);
  loading = signal(true);

  async ngOnInit(): Promise<void> {
    this.users.set(await this.creditService.getAllUsers());
    this.loading.set(false);
  }
}
