import { Routes } from '@angular/router';

export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../patients/patient-list/patient-list.component').then(m => m.PatientListComponent)
  }
];