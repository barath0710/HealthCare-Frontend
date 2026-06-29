import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { AppointmentService } from './appointment.service';
import { DoctorService } from './doctor.service';
import { PatientService } from './patient.service';

export interface AdminStats {
  totalDoctors:       number;
  totalPatients:      number;
  totalAppointments:  number;
  pendingAppointments:number;
  confirmedToday:     number;
  completedTotal:     number;
  cancelledTotal:     number;
  pendingDeleteReqs:  number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {

  constructor(
    private http:      HttpClient,
    private apptSvc:   AppointmentService,
    private doctorSvc: DoctorService,
    private patientSvc:PatientService
  ) {}

  getStats(): Observable<AdminStats> {
    return forkJoin({
      doctors:     this.doctorSvc.getAll(1, 1),
      patients:    this.patientSvc.getAll(1, 1),
      allAppts:    this.apptSvc.getAll(1, 1),
      pending:     this.apptSvc.getAll(1, 1, 'PENDING'),
      confirmed:   this.apptSvc.getAll(1, 1, 'CONFIRMED'),
      completed:   this.apptSvc.getAll(1, 1, 'COMPLETED'),
      cancelled:   this.apptSvc.getAll(1, 1, 'CANCELLED'),
      deleteReqs:  this.doctorSvc.getPendingDeleteRequests()
    }).pipe(
      map(r => ({
        totalDoctors:        r.doctors.data?.totalCount       ?? 0,
        totalPatients:       r.patients.data?.totalCount      ?? 0,
        totalAppointments:   r.allAppts.data?.totalCount      ?? 0,
        pendingAppointments: r.pending.data?.totalCount       ?? 0,
        confirmedToday:      r.confirmed.data?.totalCount     ?? 0,
        completedTotal:      r.completed.data?.totalCount     ?? 0,
        cancelledTotal:      r.cancelled.data?.totalCount     ?? 0,
        pendingDeleteReqs:   r.deleteReqs.data?.length        ?? 0
      }))
    );
  }
}