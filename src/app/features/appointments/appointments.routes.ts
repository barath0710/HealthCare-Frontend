import { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./appointment-list/appointment-list.component').then(m => m.AppointmentListComponent)
  },
  {
    path: 'book',
    loadComponent: () =>
      import('./book-appointment/book-appointment.component').then(m => m.BookAppointmentComponent)
  },
  {
    path: ':id/history',
    loadComponent: () =>
      import('./appointment-history/appointment-history.component').then(m => m.AppointmentHistoryComponent)
  }
];