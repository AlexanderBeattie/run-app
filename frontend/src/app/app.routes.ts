import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { organizerGuard } from './core/guards/organizer.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', canActivate: [authGuard], loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'map', canActivate: [authGuard], loadComponent: () => import('./features/map/map-view.component').then(m => m.MapViewComponent) },
  { path: 'clubs', canActivate: [authGuard], loadComponent: () => import('./features/clubs/club-list.component').then(m => m.ClubListComponent) },
  { path: 'clubs/create', canActivate: [organizerGuard], loadComponent: () => import('./features/clubs/create-club.component').then(m => m.CreateClubComponent) },
  { path: 'clubs/create-run', canActivate: [organizerGuard], loadComponent: () => import('./features/clubs/create-run.component').then(m => m.CreateRunComponent) },
  { path: 'clubs/edit-run/:id', canActivate: [organizerGuard], loadComponent: () => import('./features/clubs/edit-run.component').then(m => m.EditRunComponent) },
  { path: 'clubs/edit/:id', canActivate: [organizerGuard], loadComponent: () => import('./features/clubs/edit-club.component').then(m => m.EditClubComponent) },
  { path: 'clubs/:id', canActivate: [authGuard], loadComponent: () => import('./features/clubs/club-profile.component').then(m => m.ClubProfileComponent) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/profile/runner-profile.component').then(m => m.RunnerProfileComponent) },
  { path: 'organiser', canActivate: [organizerGuard], loadComponent: () => import('./features/clubs/organiser-home.component').then(m => m.OrganiserHomeComponent) },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: '**', redirectTo: 'home' }
];