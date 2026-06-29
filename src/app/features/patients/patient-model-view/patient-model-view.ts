import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../core/models/patient.model';

@Component({
  selector: 'app-patient-modal-view',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="loader-wrap" *ngIf="loading"><div class="spinner"></div></div>

    <div *ngIf="!loading && patient">
      <div class="patient-head">
        <div class="pav">{{ initials(patient.fullName) }}</div>
        <div>
          <h3>{{ patient.fullName }}</h3>
          <p>{{ age }} yrs · {{ patient.genderName }} ·
             <span class="btag">{{ patient.bloodGroupCode }}</span>
          </p>
        </div>
      </div>

      <div class="detail-grid">
        <div class="d-item"><span class="d-lbl">Email</span><span>{{ patient.email }}</span></div>
        <div class="d-item"><span class="d-lbl">Phone</span><span>{{ patient.phoneNumber }}</span></div>
        <div class="d-item"><span class="d-lbl">Date of birth</span>
          <span>{{ patient.dateOfBirth | date:'dd MMM yyyy' }}</span></div>
        <div class="d-item"><span class="d-lbl">Age</span><span>{{ age }} years</span></div>
        <div class="d-item full"><span class="d-lbl">Address</span>
          <span>{{ patient.address }}</span></div>
        <div class="d-item" *ngIf="patient.emergencyContactName">
          <span class="d-lbl">Emergency contact</span>
          <span>{{ patient.emergencyContactName }}</span>
        </div>
        <div class="d-item" *ngIf="patient.emergencyContactPhone">
          <span class="d-lbl">Emergency phone</span>
          <span>{{ patient.emergencyContactPhone }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loader-wrap { display:flex; justify-content:center; padding:30px; }
    .spinner { width:28px; height:28px; border:3px solid #e5e7eb;
               border-top-color:#667eea; border-radius:50%;
               animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .patient-head { display:flex; align-items:center; gap:14px;
                    padding:14px; background:#f8f9ff; border-radius:10px; margin-bottom:16px; }
    .pav { width:44px; height:44px; background:linear-gradient(135deg,#667eea,#764ba2);
           border-radius:50%; display:flex; align-items:center; justify-content:center;
           color:#fff; font-weight:700; font-size:15px; flex-shrink:0; }
    h3 { font-size:15px; font-weight:600; color:#111827; margin:0 0 4px; }
    p  { font-size:13px; color:#6b7280; margin:0; }
    .btag { background:#fee2e2; color:#b91c1c; padding:1px 7px;
            border-radius:7px; font-size:11px; font-weight:700; }
    .detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .d-item { display:flex; flex-direction:column; gap:3px;
              &.full { grid-column:1/-1; } }
    .d-lbl { font-size:11px; color:#9ca3af; font-weight:600;
              text-transform:uppercase; letter-spacing:.04em; }
    span:not(.d-lbl) { font-size:13px; color:#111827; }
  `]
})
export class PatientModalViewComponent implements OnInit {
  @Input() patientId!: number;
  patient?: Patient;
  loading = true;

  constructor(private patientSvc: PatientService) {}

  ngOnInit(): void {
    if (this.patientId) {
      this.patientSvc.getById(this.patientId).subscribe({
        next: res => { if (res.success) this.patient = res.data; this.loading = false; },
        error: () => { this.loading = false; }
      });
    }
  }

  get age(): number {
    if (!this.patient) return 0;
    const today = new Date();
    const birth = new Date(this.patient.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    return age;
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}