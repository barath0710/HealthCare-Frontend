import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AppointmentService } from '../../../core/services/appointment.service';
import { LookupService } from '../../../core/services/lookup.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { Appointment } from '../../../core/models/appointment.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe],
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.scss']
})
export class AppointmentListComponent implements OnInit, OnDestroy {

  appointments: Appointment[] = [];
  statuses: any[] = [];

  // Filters (Admin only)
  statusFilter = '';
  page = 1;
  pageSize = 10;
  totalPages = 1;
  totalCount = 0;

  loading = true;
  private sub = new Subscription();

  constructor(
    private apptSvc:   AppointmentService,
    private lookupSvc: LookupService,
    public  auth:      AuthService,
    public  signalr:   SignalrService,
    private router:    Router
  ) {}

  ngOnInit(): void {
    this.loadStatuses();
    this.loadAppointments();
    this.subscribeRealtime();
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  // Data Loading Based on the role
  loadAppointments(): void {
    this.loading = true;

    if (this.auth.isAdmin()) {
      this.apptSvc.getAll(this.page, this.pageSize, this.statusFilter || undefined)
        .subscribe(res => this.handleResult(res));
    } else if (this.auth.isDoctor()) {
      this.apptSvc.getDoctorUpcoming(this.page, this.pageSize)
        .subscribe(res => this.handleResult(res));
    } else {
      this.apptSvc.getMy(this.page, this.pageSize)
        .subscribe(res => this.handleResult(res));
    }
  }

  private handleResult(res: any): void {
    if (res.success) {
      this.appointments = res.data.items;
      this.totalPages    = res.data.totalPages;
      this.totalCount    = res.data.totalCount;
    }
    this.loading = false;
  }

  loadStatuses(): void {
    this.lookupSvc.getAppointmentStatuses().subscribe({
      next: res => { if (res.success) this.statuses = res.data; }
    });
  }

  // RealTime Referesh page
  subscribeRealtime(): void {
    if (this.auth.isDoctor() || this.auth.isPatient()) {
      this.signalr.connect();
    }
    this.sub.add(this.signalr.newBooking$.subscribe(() => this.loadAppointments()));
    this.sub.add(this.signalr.statusChanged$.subscribe(() => this.loadAppointments()));
    this.sub.add(this.signalr.rescheduled$.subscribe(() => this.loadAppointments()));
    this.sub.add(this.signalr.cancelled$.subscribe(() => this.loadAppointments()));
  }

  // Added Filters
  onStatusFilterChange(): void {
    this.page = 1;
    this.loadAppointments();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadAppointments();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Actions Performed (Confirm,complete,cancel,noShow,reschudule,timeline Hiatory)
  confirm(appt: Appointment): void {
    Swal.fire({
      title: 'Confirm this appointment?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, confirm',
      confirmButtonColor: '#10b981'
    }).then(r => {
      if (r.isConfirmed) {
        this.apptSvc.confirm(appt.id).subscribe({
          next: () => { Swal.fire('Confirmed!', '', 'success'); this.loadAppointments(); }
        });
      }
    });
  }

  complete(appt: Appointment): void {
    Swal.fire({
      title: 'Mark as completed?',
      text: 'This finalizes the consultation. No further changes allowed.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, complete',
      confirmButtonColor: '#0f766e'
    }).then(r => {
      if (r.isConfirmed) {
        this.apptSvc.complete(appt.id).subscribe({
          next: () => { Swal.fire('Completed!', '', 'success'); this.loadAppointments(); }
        });
      }
    });
  }

  cancel(appt: Appointment): void {
    Swal.fire({
      title: 'Cancel this appointment?',
      input: 'textarea',
      inputLabel: 'Reason (optional)',
      inputPlaceholder: 'Why are you cancelling?',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel',
      confirmButtonColor: '#ef4444'
    }).then(r => {
      if (r.isConfirmed) {
        this.apptSvc.cancel(appt.id, r.value).subscribe({
          next: () => { Swal.fire('Cancelled', '', 'success'); this.loadAppointments(); }
        });
      }
    });
  }

  noShow(appt: Appointment): void {
    Swal.fire({
      title: 'Mark as no-show?',
      text: 'Use this if the patient did not attend.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, mark no-show',
      confirmButtonColor: '#6b7280'
    }).then(r => {
      if (r.isConfirmed) {
        this.apptSvc.noShow(appt.id).subscribe({
          next: () => { Swal.fire('Marked', '', 'success'); this.loadAppointments(); }
        });
      }
    });
  }

  reschedule(appt: Appointment): void {
    Swal.fire({
      title: 'Reschedule appointment',
      html: `
        <input type="date" id="r-date" class="swal2-input" min="${new Date().toISOString().split('T')[0]}">
        <input type="time" id="r-time" class="swal2-input">
      `,
      showCancelButton: true,
      confirmButtonText: 'Reschedule',
      confirmButtonColor: '#f59e0b',
      preConfirm: () => {
        const date = (document.getElementById('r-date') as HTMLInputElement).value;
        const time = (document.getElementById('r-time') as HTMLInputElement).value;
        if (!date || !time) {
          Swal.showValidationMessage('Please select both date and time');
          return false;
        }
        return { date, time };
      }
    }).then(r => {
      if (r.isConfirmed && r.value) {
        this.apptSvc.reschedule(appt.id, r.value.date, r.value.time + ':00').subscribe({
          next: () => { Swal.fire('Rescheduled!', '', 'success'); this.loadAppointments(); },
          error: () => {}
        });
      }
    });
  }

  viewHistory(appt: Appointment): void {
    this.router.navigate(['/appointments', appt.id, 'history']);
  }

 // Helper methods
  statusClass(code: string): string {
    const map: Record<string, string> = {
      PENDING: 'badge-pending', CONFIRMED: 'badge-confirmed',
      COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled',
      RESCHEDULED: 'badge-rescheduled', NOSHOW: 'badge-noshow'
    };
    return map[code] ?? 'badge-default';
  }

  get pageTitle(): string {
    if (this.auth.isDoctor())  return 'My Appointments';
    if (this.auth.isPatient()) return 'My Appointments';
    return 'All Appointments';
  }

  get emptyMessage(): string {
    if (this.auth.isPatient()) return "You haven't booked any appointments yet.";
    if (this.auth.isDoctor())  return 'No upcoming appointments.';
    return 'No appointments match this filter.';
  }
}