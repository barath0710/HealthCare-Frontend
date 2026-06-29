import { Component, OnInit } from '@angular/core';
import { AdminService, AdminStats } from '../../core/services/admin.service';
import { Appointment } from '../../core/models/appointment.model';
import { AppointmentService } from '../../core/services/appointment.service';
import { DoctorService } from '../../core/services/doctor.service';
import { LookupService } from '../../core/services/lookup.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

type AdminTab = 'overview' | 'appointments' | 'deleteRequests' | 'lookups';

@Component({
  selector: 'app-admin',
  imports: [CommonModule,DatePipe,FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})

export class AdminPanelComponent implements OnInit {

  activeTab: AdminTab = 'overview';

  // Stats
  stats?: AdminStats;
  statsLoading = true;

  // Appointments
  appointments: Appointment[] = [];
  apptStatusFilter  = '';
  apptPage          = 1;
  apptPageSize      = 10;
  apptTotalPages    = 1;
  apptTotalCount    = 0;
  apptLoading       = false;
  statuses: any[]   = [];

  // Delete Requests
  deleteRequests: any[]   = [];
  allDeleteRequests: any[]= [];
  deleteTab: 'pending' | 'all' = 'pending';
  deleteLoading = false;

  // Lookups 
  lookupTab: 'specializations' | 'statuses' | 'genders' | 'bloodGroups' = 'specializations';
  specializations: any[] = [];
  appointmentStatuses: any[] = [];
  genders: any[]    = [];
  bloodGroups: any[]= [];
  lookupLoading     = false;

  constructor(
    private adminSvc:  AdminService,
    private apptSvc:   AppointmentService,
    private doctorSvc: DoctorService,
    private lookupSvc: LookupService,
    public  auth:      AuthService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadStatuses();
  }

  // Tab control
  setTab(tab: AdminTab): void {
    this.activeTab = tab;
    if (tab === 'appointments' && !this.appointments.length) this.loadAppointments();
    if (tab === 'deleteRequests') this.loadDeleteRequests();
    if (tab === 'lookups') this.loadAllLookups();
  }

  // Stats 
  loadStats(): void {
    this.statsLoading = true;
    this.adminSvc.getStats().subscribe({
      next: stats => { this.stats = stats; this.statsLoading = false; },
      error: () => { this.statsLoading = false; }
    });
  }

  loadStatuses(): void {
    this.lookupSvc.getAppointmentStatuses().subscribe({
      next: res => { if (res.success) this.statuses = res.data; }
    });
  }

  // Appointments
  loadAppointments(): void {
    this.apptLoading = true;
    this.apptSvc.getAll(
      this.apptPage,
      this.apptPageSize,
      this.apptStatusFilter || undefined
    ).subscribe({
      next: res => {
        if (res.success) {
          this.appointments   = res.data.items;
          this.apptTotalPages = res.data.totalPages;
          this.apptTotalCount = res.data.totalCount;
        }
        this.apptLoading = false;
      },
      error: () => { this.apptLoading = false; }
    });
  }

  onApptFilterChange(): void {
    this.apptPage = 1;
    this.loadAppointments();
  }

  apptGoToPage(p: number): void {
    if (p < 1 || p > this.apptTotalPages) return;
    this.apptPage = p;
    this.loadAppointments();
  }

  get apptPages(): number[] {
    return Array.from({ length: this.apptTotalPages }, (_, i) => i + 1);
  }

  confirmAppt(id: number): void {
    this.apptSvc.confirm(id).subscribe({
      next: () => { Swal.fire('Confirmed!','','success'); this.loadAppointments(); }
    });
  }

  cancelAppt(id: number): void {
    Swal.fire({
      title: 'Cancel this appointment?',
      input: 'textarea', inputLabel: 'Reason (optional)',
      showCancelButton: true, confirmButtonText: 'Cancel it',
      confirmButtonColor: '#ef4444'
    }).then(r => {
      if (r.isConfirmed) {
        this.apptSvc.cancel(id, r.value).subscribe({
          next: () => { Swal.fire('Cancelled','','success'); this.loadAppointments(); }
        });
      }
    });
  }

  // Delete Requests
  loadDeleteRequests(): void {
    this.deleteLoading = true;
    this.doctorSvc.getPendingDeleteRequests().subscribe({
      next: res => {
        if (res.success) this.deleteRequests = res.data;
        this.deleteLoading = false;
      }
    });
    this.doctorSvc.getAllDeleteRequests().subscribe({
      next: res => { if (res.success) this.allDeleteRequests = res.data; }
    });
  }

  reviewRequest(id: number, approve: boolean): void {
    Swal.fire({
      title: approve ? 'Approve deletion?' : 'Reject deletion?',
      input: 'textarea', inputLabel: 'Review notes (optional)',
      showCancelButton: true,
      confirmButtonText: approve ? 'Approve' : 'Reject',
      confirmButtonColor: approve ? '#10b981' : '#ef4444'
    }).then(r => {
      if (r.isConfirmed) {
        this.doctorSvc.reviewDeleteRequest(id, approve, r.value).subscribe({
          next: () => {
            Swal.fire('Done!', approve ? 'Doctor deleted.' : 'Request rejected.', 'success');
            this.loadDeleteRequests();
            this.loadStats();
          }
        });
      }
    });
  }

  // Lookups
  loadAllLookups(): void {
    this.lookupLoading = true;
    this.lookupSvc.getSpecializations().subscribe({
      next: res => { if (res.success) this.specializations = res.data; }
    });
    this.lookupSvc.getAppointmentStatuses().subscribe({
      next: res => { if (res.success) this.appointmentStatuses = res.data; }
    });
    this.lookupSvc.getGenders().subscribe({
      next: res => { if (res.success) this.genders = res.data; }
    });
    this.lookupSvc.getBloodGroups().subscribe({
      next: res => {
        if (res.success) this.bloodGroups = res.data;
        this.lookupLoading = false;
      }
    });
  }

  // Helpers
  statusClass(code: string): string {
    const m: Record<string, string> = {
      PENDING:'badge-pending', CONFIRMED:'badge-confirmed',
      COMPLETED:'badge-completed', CANCELLED:'badge-cancelled',
      RESCHEDULED:'badge-rescheduled', NOSHOW:'badge-noshow'
    };
    return m[code] ?? 'badge-default';
  }

  refreshAll(): void {
    this.loadStats();
    if (this.activeTab === 'appointments') this.loadAppointments();
    if (this.activeTab === 'deleteRequests') this.loadDeleteRequests();
  }
}