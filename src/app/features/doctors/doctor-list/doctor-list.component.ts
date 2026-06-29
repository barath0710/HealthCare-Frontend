import { Component, OnInit ,OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../../core/services/doctor.service';
import { LookupService } from '../../../core/services/lookup.service';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorListItem } from '../../../core/models/doctor.model';
import { PagedResult } from '../../../core/models/api.model';
import Swal from 'sweetalert2';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './doctor-list.component.html',
  styleUrls: ['./doctor-list.component.scss']
})
export class DoctorListComponent implements OnInit , OnDestroy {
  private refreshListener = () => this.loadDoctors();

  ngOnInit(): void {
    this.loadSpecializations();
    this.loadDoctors();

    // Refresh list when doctor is added via modal
    window.addEventListener('doctorAdded', this.refreshListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('doctorAdded', this.refreshListener);
  }

  // Datas
  doctors: DoctorListItem[]   = [];
  specializations: any[]      = [];
  pagedResult!: PagedResult<DoctorListItem>;

  // needed filters for doctor list
  search            = '';
  specializationId?: number;
  page              = 1;
  pageSize          = 9;

  // Current State
  loading           = false;
  searchTimer: any;

  constructor(
    private doctorSvc: DoctorService,
    private lookupSvc: LookupService,
    public  auth:      AuthService,
    private router:    Router,
    public modal : ModalService
  ) {}

  openAddDoctor(): void {
  this.modal.open('addDoctor');
  console.log(this.modal.activeModal());
}
  // Loaders
  loadDoctors(): void {
    this.loading = true;
    this.doctorSvc.getAll(
      this.page,
      this.pageSize,
      this.search,
      this.specializationId
    ).subscribe({
      next: res => {
        if (res.success) {
          this.pagedResult = res.data;
          this.doctors     = res.data.items;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadSpecializations(): void {
    this.lookupSvc.getSpecializations().subscribe({
      next: res => { if (res.success) this.specializations = res.data; }
    });
  }

  // ── Search (debounced) ────────────────────────────────────────────────────
  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page = 1;
      this.loadDoctors();
    }, 400);
  }

  // ── Filter by specialization ──────────────────────────────────────────────
  onSpecializationChange(): void {
    this.page = 1;
    this.loadDoctors();
  }

  // ── Clear all filters ─────────────────────────────────────────────────────
  clearFilters(): void {
    this.search           = '';
    this.specializationId = undefined;
    this.page             = 1;
    this.loadDoctors();
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  goToPage(p: number): void {
    if (p < 1 || p > this.pagedResult?.totalPages) return;
    this.page = p;
    this.loadDoctors();
  }

  get pages(): number[] {
    if (!this.pagedResult) return [];
    return Array.from({ length: this.pagedResult.totalPages }, (_, i) => i + 1);
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  viewProfile(id: number): void {
    this.router.navigate(['/doctors', id]);
  }

  bookAppointment(doctor: DoctorListItem): void {
    if (!this.auth.isPatient()) {
      Swal.fire('Access denied',
        'Only patients can book appointments.', 'warning');
      return;
    }
    this.router.navigate(['/appointments/book'],
      { queryParams: { doctorId: doctor.id } });
  }

  requestDelete(id: number): void {
    Swal.fire({
      title: 'Request profile deletion?',
      input: 'textarea',
      inputLabel: 'Reason for deletion',
      inputPlaceholder: 'Enter your reason...',
      showCancelButton: true,
      confirmButtonText: 'Submit request',
      confirmButtonColor: '#ef4444'
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.doctorSvc.requestDeletion(id, result.value).subscribe({
          next: () => Swal.fire('Submitted!',
            'Deletion request sent to admin.', 'success')
        });
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  get hasFilters(): boolean {
    return !!this.search || !!this.specializationId;
  }

  experienceLabel(years: number): string {
    return years === 1 ? '1 yr' : `${years} yrs`;
  }
}