import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../../../core/services/modal.service';
import { Patient } from '../../../core/models/patient.model';
import { PagedResult } from '../../../core/models/api.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss']
})
export class PatientListComponent implements OnInit {

  patients: Patient[]= [];
  pagedResult!: PagedResult<Patient>;
  search = '';
  page = 1;
  pageSize = 10;
  loading = false;
  searchTimer: any;

  constructor(
    private patientSvc: PatientService,
    public  auth:AuthService,
    public  modal:ModalService
  ) {}

  ngOnInit(): void {
    this.load();
    window.addEventListener('patientAdded', () => this.load());
  }

  load(): void {
    this.loading = true;
    this.patientSvc.getAll(this.page, this.pageSize, this.search).subscribe({
      next: res => {
        if (res.success) {
          this.patients    = res.data.items;
          this.pagedResult = res.data;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page = 1;
      this.load();
    }, 400);
  }

  clearSearch(): void {
    this.search = '';
    this.page   = 1;
    this.load();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.pagedResult?.totalPages) return;
    this.page = p;
    this.load();
  }

  get pages(): number[] {
    if (!this.pagedResult) return [];
    return Array.from({ length: this.pagedResult.totalPages }, (_, i) => i + 1);
  }

  openAddPatient(): void {
    this.modal.open('addPatient');
  }

  viewPatient(id: number): void {
    this.modal.open('viewPatient', { patientId: id });
  }

  editPatient(patient: Patient): void {
    this.modal.open('editPatient', { patient });
  }

  deletePatient(patient: Patient): void {
    Swal.fire({
      title: `Delete ${patient.fullName}?`,
      text: 'This will soft-delete the patient. Appointments are preserved.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      confirmButtonColor: '#ef4444'
    }).then(r => {
      if (r.isConfirmed) {
        this.patientSvc.delete(patient.id).subscribe({
          next: () => {
            Swal.fire('Deleted!', '', 'success');
            this.load();
          }
        });
      }
    });
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}