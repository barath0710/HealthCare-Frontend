// import { Routes } from '@angular/router';
// import { authGuard } from './core/guards/auth.guard';
// import { roleGuard } from './core/guards/role.guard';

// export const routes: Routes = [
//   { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

//   {
//     path: 'auth',
//     loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
//   },
//   {
//     path: 'dashboard',
//     canActivate: [authGuard],
//     loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
//   },
//   {
//     path: 'doctors',
//     canActivate: [authGuard],
//     loadChildren: () => import('./features/doctors/doctors.routes').then(m => m.DOCTORS_ROUTES)
//   },
//   {
//     path: 'patients',
//     canActivate: [authGuard, roleGuard],
//     data: { roles: ['ADMIN', 'DOCTOR'] },
//     loadChildren: () => import('./features/patients/patients.routes').then(m => m.PATIENTS_ROUTES)
//   },
//   {
//   path: 'admin',
//   canActivate: [authGuard, roleGuard],
//   data: { roles: ['ADMIN'] },
//   loadChildren: () =>
//     import('./features/admin/admin.route').then(m => m.ADMIN_ROUTES)
// },
//   {
//     path: 'appointments',
//     canActivate: [authGuard],
//     loadChildren: () => import('./features/appointments/appointments.routes').then(m => m.APPOINTMENTS_ROUTES)
//   },
//   { path: '**', redirectTo: '/dashboard' }
// ];

import { Routes } from '@angular/router';
import { authGuard }    from './core/guards/auth.guard';
import { roleGuard }    from './core/guards/role.guard';
import { profileGuard } from './core/guards/profile.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, profileGuard],   // ← profileGuard added
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: 'doctors',
    canActivate: [authGuard, profileGuard],   // ← profileGuard added
    loadChildren: () =>
      import('./features/doctors/doctors.routes').then(m => m.DOCTORS_ROUTES)
  },
  {
    path: 'patients',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'DOCTOR'] },
    loadChildren: () =>
      import('./features/patients/patients.routes').then(m => m.PATIENTS_ROUTES)
  },
  {
    // Patient own profile — allowed even before guard (for profile-setup flow)
    path: 'patients/my-profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/patients/patient-profile/patient-profile.component')
        .then(m => m.PatientProfileComponent)
  },
  {
    path: 'appointments',
    canActivate: [authGuard, profileGuard],   // ← profileGuard added
    loadChildren: () =>
      import('./features/appointments/appointments.routes')
        .then(m => m.APPOINTMENTS_ROUTES)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadChildren: () =>
      import('./features/admin/admin.route').then(m => m.ADMIN_ROUTES)
  },
  { path: '**', redirectTo: '/dashboard' }
];