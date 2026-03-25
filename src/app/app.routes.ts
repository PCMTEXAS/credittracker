import { Routes } from '@angular/router';
import { authGuard, adminGuard, managerGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'log-credits', loadComponent: () => import('./components/log-credits/log-credits.component').then(m => m.LogCreditsComponent) },
      { path: 'history', loadComponent: () => import('./components/history/history.component').then(m => m.HistoryComponent) },
      { path: 'admin/credit-types', canActivate: [adminGuard], loadComponent: () => import('./components/admin/credit-types/credit-types.component').then(m => m.CreditTypesComponent) },
      { path: 'admin/goal-builder', canActivate: [adminGuard], loadComponent: () => import('./components/admin/goal-builder/goal-builder.component').then(m => m.GoalBuilderComponent) },
      { path: 'admin/users', canActivate: [adminGuard], loadComponent: () => import('./components/admin/users/users.component').then(m => m.UsersComponent) },
      { path: 'admin/team-report', canActivate: [managerGuard], loadComponent: () => import('./components/admin/team-report/team-report.component').then(m => m.TeamReportComponent) },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
