import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  roles: any[] = [];
  showPw = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      firstName:   ['', [Validators.required, Validators.maxLength(50)]],
      lastName:    ['', [Validators.required, Validators.maxLength(50)]],
      email:       ['', [Validators.required, Validators.email]],
      password:    ['', [Validators.required, Validators.minLength(8),
                         Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
    }); 

    this.auth.getRoles().subscribe(res => {
      if (res.success) this.roles = res.data;
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.auth.register({ ...this.form.value,userRoleId : 3 }).subscribe({
      next: res => {
         this.loading = false;  
        Swal.fire({ icon:'success', title:'Account Created!', text:'Please Login...',
          confirmButtonText:'Go to Login'
      }).then(() =>{  
      this.router.navigate(['/auth/login'])
  });
},
      error: () => { this.loading = false; }
    });
  }

  f(name: string) { return this.form.get(name); }
}
