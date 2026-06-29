// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router } from '@angular/router';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { AuthService } from '../../../core/services/auth.service';
// import Swal from 'sweetalert2';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [CommonModule, RouterModule, ReactiveFormsModule],
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.scss']
// })
// export class LoginComponent implements OnInit {
//   form!: FormGroup;
//   loading = false;
//   showPw  = false;

//   constructor(
//     private fb: FormBuilder,
//     public  auth: AuthService,
//     private router: Router
//   ) {}

//   ngOnInit(): void {
//     if (this.auth.isLoggedIn()) this.router.navigate(['/dashboard']);
//     this.form = this.fb.group({
//       email:    ['', [Validators.required, Validators.email]],
//       password: ['', [Validators.required, Validators.minLength(8)]]
//     });
//   }

//   submit(): void {
//     if (this.form.invalid) { this.form.markAllAsTouched(); return; }
//     this.loading = true;
//     this.auth.login(this.form.value).subscribe({
//       next: res => {
//         Swal.fire({ icon:'success', title:`Welcome, ${res.data.user.firstName}!`,
//           timer:1500, showConfirmButton:false });
//         this.router.navigate(['/dashboard']);
//       },
//       error: () => { this.loading = false; }
//     });
//   }

//   get email()    { return this.form.get('email'); }
//   get password() { return this.form.get('password'); }
// }


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { PatientService } from '../../../core/services/patient.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  showPw  = false;

  constructor(
    private fb:         FormBuilder,
    public  auth:       AuthService,
    private patientSvc: PatientService,
    private router:     Router
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) this.navigateAfterLogin();

    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;

    this.auth.login(this.form.value).subscribe({
      next: res => {
        if (res.success) {
          Swal.fire({
            icon: 'success',
            title: `Welcome, ${res.data.user.firstName}!`,
            timer: 1200,
            showConfirmButton: false
          }).then(() => this.navigateAfterLogin());
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private navigateAfterLogin(): void {
    // Admin and Doctor go straight to dashboard — no profile check needed
    if (!this.auth.isPatient()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Patient — check if profile exists
    this.patientSvc.getMyProfile().subscribe({
      next: res => {
        if (res.success && res.data) {
          // Profile complete — go to dashboard
          this.router.navigate(['/dashboard']);
        } else {
          // Profile missing — go to setup
          this.router.navigate(['/auth/profile-setup']);
        }
      },
      error: () => {
        // 404 or error — profile missing, go to setup
        this.router.navigate(['/auth/profile-setup']);
      }
    });
  }

  get email()    { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
}