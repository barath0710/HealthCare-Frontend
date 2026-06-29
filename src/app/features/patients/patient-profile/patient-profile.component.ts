import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PatientService } from '../../../core/services/patient.service';
import { ModalService } from '../../../core/services/modal.service';
import { Patient } from '../../../core/models/patient.model';
import { AppModalComponent } from '../../../shared/components/app-modal/app-modal';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, DatePipe,AppModalComponent],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.scss']
})
export class PatientProfileComponent implements OnInit {
  patient?: Patient;
  loading = true;

  constructor(
    private patientSvc: PatientService,
    public  modal:      ModalService
  ) {}

  ngOnInit(): void {
    this.load();
    window.addEventListener('patientUpdated', () => this.load());
  }

  load(): void {
    this.patientSvc.getMyProfile().subscribe({
      next: res => {
        if (res.success) this.patient = res.data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  editProfile(): void {
    this.modal.open('editPatient', { patient: this.patient });
  }

  get age(): number {
    if (!this.patient) return 0;
    const today = new Date();
    const birth = new Date(this.patient.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())){
        age--;
    }
    return age;
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}