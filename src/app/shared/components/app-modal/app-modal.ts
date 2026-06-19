import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { PatientService } from '../../../core/services/patient.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { LookupService } from '../../../core/services/lookup.service';
import { Doctor, AvailableSlots } from '../../../core/models/doctor.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-app-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './app-modal.html',
  styleUrls: ['./app-modal.scss']
})
export class AppModalComponent implements OnInit {

  // Doctor pick list (shared by both modals)
  doctors: any[] = [];
  specializations: any[] = [];
  search = '';
  specializationId?: number;
  loadingDoctors = false;
  searchTimer: any;

  // Schedule view state
  scheduleDoctor?: Doctor;

  // Booking flow state
  bookDoctor?: Doctor;
  selectedDate = '';
  selectedSlot = '';
  reasonForVisit = '';
  slots?: AvailableSlots;
  loadingSlots = false;
  minDate = '';
  patientId?: number;
  submitting = false;
  bookStep: 'pick' | 'slot' | 'confirm' = 'pick';

  constructor(
    public  modal:     ModalService,
    private doctorSvc: DoctorService,
    private patientSvc:PatientService,
    private apptSvc:   AppointmentService,
    private lookupSvc: LookupService,
    private router:    Router
  ) {}

  ngOnInit(): void {
    const today  = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.selectedDate = this.minDate;

    this.loadSpecializations();
    this.loadDoctors();

    this.patientSvc.getMyProfile().subscribe({
      next: res => { if (res.success) this.patientId = res.data.id; }
    });
  }

  get isOpen(): boolean { return this.modal.activeModal() !== null; }
  get type()   { return this.modal.activeModal(); }

  close(): void {
    this.modal.close();
    this.reset();
  }

  reset(): void {
    this.scheduleDoctor = undefined;
    this.bookDoctor      = undefined;
    this.selectedSlot    = '';
    this.reasonForVisit  = '';
    this.bookStep        = 'pick';
    this.search          = '';
  }

  loadDoctors(): void {
    this.loadingDoctors = true;
    this.doctorSvc.getAll(1, 50, this.search, this.specializationId).subscribe({
      next: res => {
        if (res.success) this.doctors = res.data.items;
        this.loadingDoctors = false;
      },
      error: () => { this.loadingDoctors = false; }
    });
  }

  loadSpecializations(): void {
    this.lookupSvc.getSpecializations().subscribe({
      next: res => { if (res.success) this.specializations = res.data; }
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadDoctors(), 400);
  }

  // ── SCHEDULE MODAL ────────────────────────────────────────────────────────
  viewSchedule(doc: any): void {
    this.doctorSvc.getById(doc.id).subscribe({
      next: res => { if (res.success) this.scheduleDoctor = res.data; }
    });
  }

  backToScheduleList(): void {
    this.scheduleDoctor = undefined;
  }

  dayLabel(day: number): string {
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day] ?? '';
  }

  get orderedAvailabilities() {
    if (!this.scheduleDoctor?.availabilities) return [];
    const order = [1,2,3,4,5,6,0];
    return [...this.scheduleDoctor.availabilities]
      .sort((a,b) => order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek));
  }

  // ── BOOKING MODAL ─────────────────────────────────────────────────────────
  pickDoctorToBook(doc: any): void {
    this.doctorSvc.getById(doc.id).subscribe({
      next: res => {
        if (res.success) {
          this.bookDoctor = res.data;
          this.bookStep   = 'slot';
          this.loadSlots();
        }
      }
    });
  }

  loadSlots(): void {
    if (!this.bookDoctor || !this.selectedDate) return;
    this.loadingSlots  = true;
    this.selectedSlot  = '';
    this.doctorSvc.getSlots(this.bookDoctor.id, this.selectedDate).subscribe({
      next: res => {
        if (res.success) this.slots = res.data;
        this.loadingSlots = false;
      },
      error: () => { this.loadingSlots = false; }
    });
  }

  onDateChange(): void { this.loadSlots(); }

  selectSlot(slot: string): void { this.selectedSlot = slot; }

  goToConfirm(): void {
    if (!this.selectedSlot) {
      Swal.fire('Select a time', 'Please pick a time slot first.', 'warning');
      return;
    }
    this.bookStep = 'confirm';
  }

  backToSlot(): void { this.bookStep = 'slot'; }

  backToDoctorPick(): void {
    this.bookDoctor   = undefined;
    this.bookStep      = 'pick';
    this.selectedSlot  = '';
  }

  confirmBooking(): void {
    if (!this.bookDoctor || !this.selectedSlot || !this.patientId) return;
    this.submitting = true;
    this.apptSvc.book({
      doctorId:        this.bookDoctor.id,
      patientId:       this.patientId,
      appointmentDate: this.selectedDate,
      appointmentTime: this.selectedSlot + ':00',
      reasonForVisit:  this.reasonForVisit.trim() || undefined
    }).subscribe({
      next: res => {
        this.submitting = false;
        if (res.success) {
          this.close();
          Swal.fire({
            icon: 'success',
            title: 'Appointment booked!',
            text: `Your booking with ${this.bookDoctor!.fullName} is pending confirmation.`,
            confirmButtonText: 'View my appointments'
          }).then(() => this.router.navigate(['/appointments']));
        }
      },
      error: () => { this.submitting = false; }
    });
  }

  get dayName(): string {
    if (!this.selectedDate) return '';
    return new Date(this.selectedDate + 'T00:00:00')
      .toLocaleDateString('en-US', { weekday: 'long' });
  }

  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
}