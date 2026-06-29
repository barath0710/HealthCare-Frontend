import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-staff-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './staff-register.html',
  styleUrls: ['./staff-register.scss']
})
export class StaffRegister implements OnInit {
  form!: FormGroup;
  loading  = false;
  showPw   = false;

  // Staff roles only — not shown to public
  staffRoles = [
    { id: 1, name: 'Admin',  code: 'ADMIN' },
    { id: 2, name: 'Doctor', code: 'DOCTOR' }
  ];

  constructor(
    private fb:FormBuilder,
    private auth:AuthService,
    private router:Router
  ) {}

  ngOnInit(): void {
    // Only accessible if already logged in as Admin
    if (!this.auth.isAdmin()) {
      this.router.navigate(['/dashboard']);
    }

    this.form = this.fb.group({
      firstName:   ['', [Validators.required, Validators.maxLength(50)]],
      lastName:    ['', [Validators.required, Validators.maxLength(50)]],
      email:       ['', [Validators.required, Validators.email]],
      password:    ['', [Validators.required, Validators.minLength(8),
                         Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      userRoleId:  [null, Validators.required]   // Shown ONLY to admin
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;

    // Call register directly — does NOT auto-login (same as patient register)
    this.auth.register({
      ...this.form.value,
      userRoleId: +this.form.value.userRoleId
    }).subscribe({
      next: res => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Staff account created!',
          html: `User ID: <strong>${res.data.user.id}</strong><br>
                 Share credentials with the staff member.`,
          confirmButtonText: 'OK'
        }).then(() => this.router.navigate(['/admin']));
      },
      error: () => { this.loading = false; }
    });
  }

  f(n: string) { return this.form.get(n); }
}