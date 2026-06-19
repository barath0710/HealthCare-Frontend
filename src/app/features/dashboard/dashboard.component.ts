import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { SignalrService } from '../../core/services/signalr.service';
import { Appointment } from '../../core/models/appointment.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  todayList: Appointment[] = [];
  upcomingList: Appointment[] = [];
  myUpcoming: Appointment[] = [];

  upcomingCount  = 0;
  attendedCount  = 0;
  cancelledCount = 0;

  loading = true;
  private sub = new Subscription();

  constructor(
    public auth: AuthService,
    private apptSvc: AppointmentService,
    public  signalr: SignalrService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.subscribeSignalR();
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  loadData(): void {
    if (this.auth.isDoctor()) {
      this.loadToday();
      this.loadUpcoming();
    }
    if (this.auth.isPatient()) {
      this.LoadMyUpcomingAndCounts();
    }
    this.loading = false;
  }

  loadToday(): void {
    this.apptSvc.getDoctorToday().subscribe({
      next: r => { this.todayList = r.data?.items ?? []; }
    });
  }

  loadUpcoming(): void {
    this.apptSvc.getDoctorUpcoming().subscribe({
      next: r => { this.upcomingList = r.data?.items ?? []; }
    });
  }

  // loadMy(): void {
  //   this.apptSvc.getMy().subscribe({
  //     next: r => { this.myList = r.data?.items ?? []; }
  //   });
  // }
  
  LoadMyUpcomingAndCounts() : void {
    this.apptSvc.getMy(1,200).subscribe({
      next : r =>{
        const all : Appointment[] = r.data?.items ?? [];

        const today = new Date();
        today.setHours(0,0,0,0);

        this.myUpcoming = all.filter(a =>{
          const apptDate = new Date(a.appointmentDate);
          apptDate.setHours(0,0,0,0);

          return apptDate >= today && !['CANCELLED','COMPLETED','NOSHOW'].includes(a.statusCode);
        }).sort((a,b) =>
        new Date(a.appointmentDate).getTime() - new Date(a.appointmentDate).getTime() );

        this.upcomingCount = this.myUpcoming.length;
        this.attendedCount = all.filter(a => a.statusCode === 'COMPLETED').length;
        this.cancelledCount = all.filter(a => a.statusCode === 'CANCELLED' || a.statusCode ==='NOSHOW').length;
      }
    });
  }

  subscribeSignalR(): void {
    if (this.auth.isDoctor()) {
      this.sub.add(this.signalr.newBooking$.subscribe(n => {
        this.loadToday();
        Swal.fire({ toast:true, position:'top-end', icon:'info',
          title:'📅 New Appointment',
          text:`${n.patientName} — ${n.appointmentDate} at ${n.appointmentTime}`,
          showConfirmButton:false, timer:5000, timerProgressBar:true });
      }));
      this.sub.add(this.signalr.rescheduled$.subscribe(() => this.loadToday()));
      this.sub.add(this.signalr.cancelled$.subscribe(() => this.loadToday()));
    }
    if (this.auth.isPatient()) {
      this.sub.add(this.signalr.statusChanged$.subscribe(n => {
        this.LoadMyUpcomingAndCounts();
        Swal.fire({ toast:true, position:'top-end', icon:'success',
          title:`Appointment ${n.statusName}`, text:n.message,
          showConfirmButton:false, timer:5000 });
      }));
    }
  }

  confirm(id: number): void {
    this.apptSvc.confirm(id).subscribe({
      next: () => { Swal.fire('Confirmed!','','success'); this.loadToday(); }
    });
  }

  complete(id: number): void {
    this.apptSvc.complete(id).subscribe({
      next: () => { Swal.fire('Completed!','','success'); this.loadToday(); }
    });
  }

  statusClass(code: string): string {
    const m: Record<string,string> = {
      PENDING:'badge-pending', CONFIRMED:'badge-confirmed',
      COMPLETED:'badge-completed', CANCELLED:'badge-cancelled',
      RESCHEDULED:'badge-rescheduled', NOSHOW:'badge-noshow'
    };
    return m[code] ?? 'badge-default';
  }
}