import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../../core/services/doctor.service';
import { PatientService } from '../../../core/services/patient.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { LookupService } from '../../../core/services/lookup.service';
import { AuthService } from '../../../core/services/auth.service';
import { Doctor, AvailableSlots } from '../../../core/models/doctor.model';
import Swal from 'sweetalert2';

type Step = 'doctor' | 'date' | 'reason' | 'confirm';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe],
  templateUrl: './book-appointment.component.html',
  styleUrls: ['./book-appointment.component.scss']
})
export class BookAppointmentComponent implements OnInit {

  // Step control 
  step: Step = 'doctor';
  steps: Step[] = ['doctor', 'date', 'reason', 'confirm'];

  //  Doctor search (Step 1) 
  doctors: any[] = [];
  specializations: any[] = [];
  search = '';
  specializationId?: number;
  loadingDoctors = false;
  searchTimer: any;

  // Selected data 
  selectedDoctor?: Doctor;
  selectedDate    = '';
  selectedSlot    = '';
  reasonForVisit  = '';
  minDate         = '';

  //  Slots (Step 2) 
  slots?: AvailableSlots;
  loadingSlots = false;

  //  Patient info 
  patientId?: number;
  loadingPatient = true;

  // Submission 
  submitting = false;

  constructor(
    private route:       ActivatedRoute,
    public  router:      Router,
    private doctorSvc:   DoctorService,
    private patientSvc:  PatientService,
    private apptSvc:     AppointmentService,
    private lookupSvc:   LookupService,
    public  auth:        AuthService
  ) {}

  ngOnInit(): void {
    const today  = new Date();
    this.minDate = today.toISOString().split('T')[0];

    this.loadMyPatientProfile();
    this.loadSpecializations();

    // Check for pre-filled query params (coming from doctor detail page)
    const params = this.route.snapshot.queryParamMap;
    const doctorId = params.get('doctorId');
    const date      = params.get('date');
    const time      = params.get('time');

    if (doctorId) {
      this.loadDoctorById(+doctorId, date, time);
    } else {
      this.loadDoctors();
    }
  }

  // Load the patient id who is logged In

  loadMyPatientProfile(): void {
    this.patientSvc.getMyProfile().subscribe({
      next: res => {
        if (res.success) this.patientId = res.data.id;
        this.loadingPatient = false;
      },
      error: () => {
        this.loadingPatient = false;
        Swal.fire('Profile missing',
          'Your patient profile is not set up. Contact admin.', 'error');
      }
    });
  }

  // Pre-filled doctor (from detail page) 
  loadDoctorById(id: number, date: string | null, time: string | null): void {
    this.doctorSvc.getById(id).subscribe({
      next: res => {
        if (res.success) {
          this.selectedDoctor = res.data;
          this.selectedDate = date || this.minDate;
          this.step = 'date';
          this.loadSlots();
          if (time) {
            // Wait for slots to load then auto-select
            setTimeout(() => { this.selectedSlot = time.slice(0, 5); }, 600);
          }
        }
      }
    });
  }

  // search doctor by id or licence number
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

  selectDoctor(doc: any): void {
    this.doctorSvc.getById(doc.id).subscribe({
      next: res => {
        if (res.success) {
          this.selectedDoctor = res.data;
          this.selectedDate = this.minDate;
          this.goToStep('date');
          this.loadSlots();
        }
      }
    });
  }

  // Date and  Slot setting
  loadSlots(): void {
    if (!this.selectedDoctor || !this.selectedDate) return;
    this.loadingSlots = true;
    this.selectedSlot = '';
    this.doctorSvc.getSlots(this.selectedDoctor.id, this.selectedDate).subscribe({
      next: res => {
        if (res.success) this.slots = res.data;
        this.loadingSlots = false;
      },
      error: () => { this.loadingSlots = false; }
    });
  }

  onDateChange(): void {
    this.loadSlots();
  }

  selectSlot(slot: string): void {
    this.selectedSlot = slot;
  }

 // Navigation set up
  goToStep(s: Step): void {
    this.step = s;
  }

  nextStep(): void {
    const idx = this.steps.indexOf(this.step);
    if (idx < this.steps.length - 1) {
      // Validate before moving forward
      if (this.step === 'doctor' && !this.selectedDoctor) {
        Swal.fire('Select a doctor', 'Please choose a doctor first.', 'warning');
        return;
      }
      if (this.step === 'date' && !this.selectedSlot) {
        Swal.fire('Select a time', 'Please pick a time slot.', 'warning');
        return;
      }
      this.step = this.steps[idx + 1];
    }
  }

  prevStep(): void {
    const idx = this.steps.indexOf(this.step);
    if (idx > 0) this.step = this.steps[idx - 1];
  }

  get stepIndex(): number { return this.steps.indexOf(this.step); }

 // Final submission method
  confirmBooking(): void {
    if (!this.selectedDoctor || !this.selectedSlot || !this.patientId) {
      Swal.fire('Missing info', 'Please complete all steps.', 'warning');
      return;
    }

    this.submitting = true;
    this.apptSvc.book({
      doctorId:        this.selectedDoctor.id,
      patientId:       this.patientId,
      appointmentDate: this.selectedDate,
      appointmentTime: this.selectedSlot + ':00',
      reasonForVisit:  this.reasonForVisit.trim() || undefined
    }).subscribe({
      next: res => {
        this.submitting = false;
        if (res.success) {
          Swal.fire({
            icon: 'success',
            title: 'Appointment booked!',
            html: `Your appointment with <strong>${this.selectedDoctor!.fullName}</strong>
                   on <strong>${this.formatDate(this.selectedDate)}</strong> at
                   <strong>${this.selectedSlot}</strong> is confirmed as pending.`,
            confirmButtonText: 'View my appointments'
          }).then(() => this.router.navigate(['/appointments']));
        }
      },
      error: () => { this.submitting = false; }
    });
  }

  // Helper methods
  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  get dayName(): string {
    if (!this.selectedDate) return '';
    return new Date(this.selectedDate + 'T00:00:00')
      .toLocaleDateString('en-US', { weekday: 'long' });
  }

  changeDoctor(): void {
    this.selectedDoctor = undefined;
    this.selectedSlot   = '';
    this.goToStep('doctor');
  }

  stepLabel(s: Step): string {
    const map: Record<Step, string> = {
      doctor: 'Doctor', date: 'Date & time',
      reason: 'Reason', confirm: 'Confirm'
    };
    return map[s];
  }
}