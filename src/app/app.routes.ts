import { Routes } from '@angular/router';
import { authGuard, adminGuard, managerGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'credit-types', pathMatch: 'full' },
      {
        path: 'credit-types',
        loadComponent: () => import('./components/admin/credit-types/credit-types.component').then(m => m.CreditTypesComponent),
      },
      {
        path: 'goal-builder',
        loadComponent: () => import('./components/admin/goal-builder/goal-builder.component').then(m => m.GoalBuilderComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./components/admin/users/users.component').then(m => m.UsersComponent),
      },
      {
        path: 'credit-entry',
        loadComponent: () => import('./components/admin/credit-entry/credit-entry.component').then(m => m.CreditEntryComponent),
      },
    ],
  },
  {
    path: 'team-report',
    canActivate: [managerGuard],
    loadComponent: () => import('./components/admin/team-report/team-report.component').then(m => m.TeamReportComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
