import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../../core/services/doctor.service';
import { AuthService } from '../../../core/services/auth.service';
import { Doctor, AvailableSlots } from '../../../core/models/doctor.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe],
  templateUrl:'./doctor-detail.component.html',
  styleUrls: ['./doctor-detail.component.scss']
})
export class DoctorDetailComponent implements OnInit {

  doctor!: Doctor;
  slots!: AvailableSlots;
  pendingRequests: any[] = [];


  loading         = true;
  loadingSlots    = false;
  selectedDate    = '';
  selectedSlot    = '';
  activeTab: 'profile' | 'schedule' | 'slots' | 'admin' = 'profile';
  minDate         = '';

  constructor(
    private route:     ActivatedRoute,
    private router:    Router,
    private doctorSvc: DoctorService,
    public  auth:      AuthService
  ) {}

  ngOnInit(): void {
    // Set minimum date to today
    const today  = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.selectedDate = this.minDate;

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDoctor(id);

    if (this.auth.isAdmin()) {
      this.loadPendingRequests();
    }
  }

  // Loaders 
  loadDoctor(id: number): void {
    this.loading = true;
    this.doctorSvc.getById(id).subscribe({
      next: res => {
        if (res.success) {
          this.doctor = res.data;
          this.loadSlots();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/doctors']);
      }
    });
  }

  loadSlots(): void {
    if (!this.selectedDate) return;
    this.loadingSlots = true;
    this.selectedSlot = '';
    this.doctorSvc.getSlots(this.doctor.id, this.selectedDate).subscribe({
      next: res => {
        if (res.success) this.slots = res.data;
        this.loadingSlots = false;
      },
      error: () => { this.loadingSlots = false; }
    });
  }

  loadPendingRequests(): void {
    this.doctorSvc.getPendingDeleteRequests().subscribe({
      next: res => {
        if (res.success) {
          // Filter only requests for this doctor
          this.pendingRequests = res.data.filter(
            (r: any) => r.doctorId === this.doctor?.id
          );
        }
      }
    });
  }

  //  Date change 
  onDateChange(): void {
    this.loadSlots();
  }

  // Back Button
  goBack() : void{
    this.router.navigate(['/doctors'])
  }

  //  Slot selection 
  selectSlot(slot: string): void {
    this.selectedSlot = this.selectedSlot === slot ? '' : slot;
  }

  // Book appointment 
  bookAppointment(): void {
    if (!this.selectedSlot) {
      Swal.fire('Select a slot', 'Please pick a time slot first.', 'warning');
      return;
    }
    this.router.navigate(['/appointments/book'], {
      queryParams: {
        doctorId: this.doctor.id,
        date:     this.selectedDate,
        time:     this.selectedSlot + ':00'
      }
    });
  }

  // Request own deletion (Doctor)
  requestDeletion(): void {
    Swal.fire({
      title: 'Request profile deletion?',
      text:  'Your request will be sent to admin for approval.',
      input: 'textarea',
      inputLabel: 'Reason',
      inputPlaceholder: 'Enter your reason here...',
      inputAttributes: { 'aria-label': 'Reason for deletion' },
      showCancelButton: true,
      confirmButtonText: 'Submit request',
      confirmButtonColor: '#ef4444',
      inputValidator: val => {
        if (!val?.trim()) return 'Please enter a reason.';
        return null;
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        this.doctorSvc.requestDeletion(this.doctor.id, result.value).subscribe({
          next: () => Swal.fire('Submitted!',
            'Your deletion request has been sent to admin.', 'success')
        });
      }
    });
  }

  // ── Admin: approve/reject delete request ──────────────────────────────────
  reviewRequest(requestId: number, approve: boolean): void {
    const action = approve ? 'approve' : 'reject';
    Swal.fire({
      title: `${approve ? 'Approve' : 'Reject'} deletion request?`,
      input: 'textarea',
      inputLabel: 'Review notes (optional)',
      inputPlaceholder: 'Add notes...',
      showCancelButton: true,
      confirmButtonText: approve ? 'Yes, approve' : 'Yes, reject',
      confirmButtonColor: approve ? '#10b981' : '#ef4444'
    }).then(result => {
      if (result.isConfirmed) {
        this.doctorSvc.reviewDeleteRequest(
          requestId, approve, result.value
        ).subscribe({
          next: () => {
            Swal.fire('Done!',
              `Request ${action}d successfully.`, 'success');
            this.loadPendingRequests();
            if (approve) this.router.navigate(['/doctors']);
          }
        });
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  get dayName(): string {
    if (!this.selectedDate) return '';
    return new Date(this.selectedDate + 'T00:00:00')
      .toLocaleDateString('en-US', { weekday: 'long' });
  }

  get orderedAvailabilities() {
    if (!this.doctor?.availabilities) return [];
    const order = [1, 2, 3, 4, 5, 6, 0]; // Mon–Sun
    return [...this.doctor.availabilities]
      .sort((a, b) => order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek));
  }

  dayLabel(day: number): string {
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day] ?? '';
  }

  isOwnProfile(): boolean {
    return this.auth.isDoctor() &&
      this.doctor?.userId === this.auth.currentUser()?.id;
  }

  setTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
  }
}