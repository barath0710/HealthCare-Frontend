import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PatientService } from '../services/patient.service';
import { map, catchError, of } from 'rxjs';

export const profileGuard: CanActivateFn = () => {
  const auth       = inject(AuthService);
  const patientSvc = inject(PatientService);
  const router     = inject(Router);

  // Only applies to PATIENT role
  if (!auth.isPatient()) return of(true);

  return patientSvc.getMyProfile().pipe(
    map(res => {
      if (res.success && res.data) {
        // Profile exists — allow access
        return true;
      }
      // No profile — send to setup
      router.navigate(['/auth/profile-setup']);
      return false;
    }),
    catchError(() => {
      // API error (404 = profile missing) — send to setup
      router.navigate(['/auth/profile-setup']);
      return of(false);
    })
  );
};