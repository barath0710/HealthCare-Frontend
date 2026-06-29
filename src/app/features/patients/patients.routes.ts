import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';

export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'DOCTOR'] },
    loadComponent: () =>
      import('./patient-list/patient-list.component')
        .then(m => m.PatientListComponent)
  },
  {
    path: 'my-profile',
    canActivate: [roleGuard],
    data: { roles: ['PATIENT'] },
    loadComponent: () =>
      import('./patient-profile/patient-profile.component')
        .then(m => m.PatientProfileComponent)
  }
];