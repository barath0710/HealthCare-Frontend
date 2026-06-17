import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment, AppointmentHistory } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-appointment-history',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './appointment-history.component.html',
  styleUrls: ['./appointment-history.component.scss']
})
export class AppointmentHistoryComponent implements OnInit {
  appointment?: Appointment;
  history: AppointmentHistory[] = [];
  loading = true;

  constructor(
    private route:  ActivatedRoute,
    public  router: Router,
    private apptSvc: AppointmentService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  load(id: number): void {
    this.apptSvc.getById(id).subscribe({
      next: res => { if (res.success) this.appointment = res.data; }
    });

    this.apptSvc.getHistory(id).subscribe({
      next: res => {
        if (res.success) this.history = res.data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  actionIcon(action: string): string {
    const map: Record<string,string> = {
      BOOKED: '📅', CONFIRMED: '✅', COMPLETED: '✔️',
      CANCELLED: '✕', RESCHEDULED: '🔄', NOSHOW: '🚫'
    };
    return map[action] ?? '•';
  }

  actionClass(action: string): string {
    const map: Record<string,string> = {
      BOOKED: 'hl-blue', CONFIRMED: 'hl-green', COMPLETED: 'hl-teal',
      CANCELLED: 'hl-red', RESCHEDULED: 'hl-amber', NOSHOW: 'hl-gray'
    };
    return map[action] ?? 'hl-gray';
  }
}