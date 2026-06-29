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
import { PatientModalViewComponent } from '../../../features/patients/patient-model-view/patient-model-view';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-app-modal',
  standalone: true,
  imports: [CommonModule, FormsModule,PatientModalViewComponent],
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

  // Add these properties to the class
  addDoctorForm = {
  userId:null as number | null,
  licenseNumber:'',
  specializationId: null as number | null,
  qualification:'',
  experienceYears: null as number | null,
  consultationFee: null as number | null,
  bio:''
};
addDoctorLoading  = false;
addDoctorErrors: Record<string, string> = {};

availableUsers: any[] = [];
loadingUsers = false;

genders: any[]     = [];
bloodGroups: any[] = [];

patientForm = {
  userId:               null as number | null,
  dateOfBirth:          '',
  address:              '',
  genderId:             null as number | null,
  bloodGroupId:         null as number | null,
  emergencyContactName: '',
  emergencyContactPhone:''
};
patientFormErrors: Record<string, string> = {};
patientFormLoading = false;
editingPatientId?: number; 

  constructor(
    public  modal:     ModalService,
    private doctorSvc: DoctorService,
    private patientSvc:PatientService,
    private apptSvc:   AppointmentService,
    private lookupSvc: LookupService,
    private router:    Router,
    private auth : AuthService
  ) {}

  ngOnInit(): void {
    const today  = new Date();
    this.minDate = today.toISOString().split('T')[0];
    this.selectedDate = this.minDate;

    this.loadSpecializations();
    this.loadPatientLookups();
    this.loadDoctors();
    const role1 = this.auth.getUserRole();
    // const role = this.auth.getRole1();
  
    if (this.auth.isLoggedIn() && role1 === 'PATIENT'){
    this.patientSvc.getMyProfile().subscribe({
      next: res => { if (res.success) this.patientId = res.data.id; }
    });
  }
  }

  get type(): string | null {
  return this.modal.activeModal();
}

  get isOpen(): boolean {
  const type = this.modal.activeModal();

  // Pre-fill edit form when editPatient modal opens
  if (type === 'editPatient' && this.modal.modalData()) {
    const p = this.modal.modalData().patient;
    if (p && this.editingPatientId !== p.id) {
      this.editingPatientId          = p.id;
      this.patientForm.dateOfBirth   = p.dateOfBirth?.split('T')[0] ?? '';
      this.patientForm.address       = p.address ?? '';
      this.patientForm.genderId      = p.genderId ?? null;
      this.patientForm.bloodGroupId  = p.bloodGroupId ?? null;
      this.patientForm.emergencyContactName  = p.emergencyContactName ?? '';
      this.patientForm.emergencyContactPhone = p.emergencyContactPhone ?? '';
    }
  }

  // Reset edit state when modal closes
  if (!type) {
    this.editingPatientId = undefined;
    this.resetPatientForm();
  }

  return type !== null;
}

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

  // SCHEDULE MODAL 
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

  // BOOKING MODAL
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

  loadAvailableUsers(): void {
  // Load users with DOCTOR role who don't have a profile yet
  // We call the auth/roles endpoint — but we need users
  // Simplest: admin knows the userId, so we show a number input
}

validateAddDoctor(): boolean {
  this.addDoctorErrors = {};
  const f = this.addDoctorForm;
  if (!f.userId) this.addDoctorErrors['userId'] = 'User ID is required.';
  if (!f.licenseNumber.trim()) this.addDoctorErrors['licenseNumber'] = 'License number is required.';
  if (!f.specializationId) this.addDoctorErrors['specializationId'] = 'Specialization is required.';
  if (!f.qualification.trim()) this.addDoctorErrors['qualification'] = 'Qualification is required.';
  if (!f.experienceYears || f.experienceYears < 0) this.addDoctorErrors['experienceYears'] = 'Valid experience is required.';
  if (!f.consultationFee || f.consultationFee <= 0) this.addDoctorErrors['consultationFee'] = 'Valid fee is required.';
  return Object.keys(this.addDoctorErrors).length === 0;
}

submitAddDoctor(): void {
  if (!this.validateAddDoctor()) return;
  this.addDoctorLoading = true;

  this.doctorSvc.create(this.addDoctorForm).subscribe({
    next: res => {
      this.addDoctorLoading = false;
      if (res.success) {
        Swal.fire({ icon:'success', title:'Doctor added!',
          text:`${res.data.fullName} has been created.`,
          timer:2000, showConfirmButton:false });
        this.resetAddDoctorForm();
        this.close();
        // Emit to refresh the list
        window.dispatchEvent(new CustomEvent('doctorAdded'));
      }
    },
    error: () => { this.addDoctorLoading = false; }
  });
}

resetAddDoctorForm(): void {
  this.addDoctorForm = {
    userId:           null,
    licenseNumber:    '',
    specializationId: null,
    qualification:    '',
    experienceYears:  null,
    consultationFee:  null,
    bio:              ''
  };
  this.addDoctorErrors = {};
}

// Called from ngOnInit — load lookups needed for patient form

loadPatientLookups(): void {
  this.lookupSvc.getGenders().subscribe({
    next: res => { if (res.success) this.genders = res.data; }
  });
  this.lookupSvc.getBloodGroups().subscribe({
    next: res => { if (res.success) this.bloodGroups = res.data; }
  });
}

validatePatientForm(isEdit = false): boolean {
  this.patientFormErrors = {};
  const f = this.patientForm;
  if (!isEdit && !f.userId) this.patientFormErrors['userId'] = 'User ID is required.';
  if (!f.dateOfBirth)       this.patientFormErrors['dateOfBirth'] = 'Date of birth is required.';
  if (!f.address.trim())    this.patientFormErrors['address'] = 'Address is required.';
  if (!f.genderId)          this.patientFormErrors['genderId'] = 'Gender is required.';
  if (!f.bloodGroupId)      this.patientFormErrors['bloodGroupId'] = 'Blood group is required.';
  return Object.keys(this.patientFormErrors).length === 0;
}

submitAddPatient(): void {
  if (!this.validatePatientForm()) return;
  this.patientFormLoading = true;
  this.patientSvc.create(this.patientForm as any).subscribe({
    next: res => {
      this.patientFormLoading = false;
      if (res.success) {
        Swal.fire({ icon:'success', title:'Patient added!',
          text:`${res.data.fullName} has been registered.`,
          timer:2000, showConfirmButton:false });
        this.resetPatientForm();
        this.close();
        window.dispatchEvent(new CustomEvent('patientAdded'));
      }
    },
    error: () => { this.patientFormLoading = false; }
  });
}

submitEditPatient(): void {
  if (!this.validatePatientForm(true) || !this.editingPatientId) return;
  this.patientFormLoading = true;
  const payload = {
    address:               this.patientForm.address,
    genderId:              this.patientForm.genderId,
    bloodGroupId:          this.patientForm.bloodGroupId,
    emergencyContactName:  this.patientForm.emergencyContactName,
    emergencyContactPhone: this.patientForm.emergencyContactPhone
  };
  this.patientSvc.update(this.editingPatientId,payload).subscribe({
    next: res => {
      console.log('Success', res);
      this.patientFormLoading = false;
      if (res.success) {
        Swal.fire({ icon:'success', title:'Profile updated!',
          timer:1800, showConfirmButton:false });
        this.resetPatientForm();
        this.close();
        window.dispatchEvent(new CustomEvent('patientAdded'));
        window.dispatchEvent(new CustomEvent('patientUpdated'));
      }
    },
    error: () => { this.patientFormLoading = false; }
  });
}

resetPatientForm(): void {
  this.patientForm = {
    userId: null, dateOfBirth: '', address: '',
    genderId: null, bloodGroupId: null,
    emergencyContactName: '', emergencyContactPhone: ''
  };
  this.patientFormErrors = {};
  this.editingPatientId  = undefined;
}

}