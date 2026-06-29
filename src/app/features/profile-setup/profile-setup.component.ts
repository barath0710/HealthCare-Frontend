import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { PatientService } from '../../core/services/patient.service';
import { LookupService } from '../../core/services/lookup.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-setup.component.html',
  styleUrls: ['./profile-setup.component.scss']
})
export class ProfileSetupComponent implements OnInit {
  form!: FormGroup;
  genders: any[]= [];
  bloodGroups: any[] = [];
  loading= false;
  maxDate= '';

  constructor(
    private fb: FormBuilder,
    private patientSvc: PatientService,
    private lookupSvc:LookupService,
    public auth:AuthService,
    private router:Router
  ) {}

  ngOnInit(): void {
    // Max DOB = today (can't be born in the future)
    this.maxDate = new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      dateOfBirth:['', Validators.required],
      genderId:[null, Validators.required],
      bloodGroupId:[null, Validators.required],
      address:['', [Validators.required, Validators.maxLength(255)]],
      emergencyContactName: [''],
      emergencyContactPhone:['', Validators.pattern(/^\+?[0-9]{10,15}$/)]
    });

    this.loadLookups();
  }

  loadLookups(): void {
    this.lookupSvc.getGenders().subscribe({
      next: r => { if (r.success) this.genders = r.data; }
    });
    this.lookupSvc.getBloodGroups().subscribe({
      next: r => { if (r.success) this.bloodGroups = r.data; }
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;

    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.loading = false; return; }

    this.patientSvc.create({
      userId,
      ...this.form.value
    }).subscribe({
      next: res => {
        this.loading = false;
        if (res.success) {
          Swal.fire({
            icon: 'success',
            title: 'Profile complete!',
            text: 'Welcome to HealthCare. You can now book appointments.',
            timer: 2000,
            showConfirmButton: false
          });
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => { this.loading = false; }
    });
  }

  f(n: string) { return this.form.get(n); }

  get age(): number {
    const dob = this.form.get('dateOfBirth')?.value;
    if (!dob) return 0;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    return age;
  }
}