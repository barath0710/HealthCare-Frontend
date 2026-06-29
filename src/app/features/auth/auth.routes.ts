import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'profile-setup',
    loadComponent: () =>
      import('../profile-setup/profile-setup.component')
        .then(m => m.ProfileSetupComponent)
  },
  {
    path : 'staff-register',
    loadComponent : () => 
      import('./staff-register/staff-register')
        .then(m => m.StaffRegister)
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];