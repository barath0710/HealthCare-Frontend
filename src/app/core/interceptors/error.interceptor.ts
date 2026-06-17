import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      switch (err.status) {
        case 401:
          localStorage.clear();
          router.navigate(['/auth/login']);
          Swal.fire('Session expired', 'Please login again.', 'warning');
          break;
        case 403:
          Swal.fire('Access denied', 'You do not have permission.', 'error');
          break;
        case 400:
          Swal.fire('Validation error', err.error?.message || 'Check your input.', 'warning');
          break;
        case 500:
          Swal.fire('Server error', 'Something went wrong.', 'error');
          break;
      }
      return throwError(() => err);
    })
  );
};