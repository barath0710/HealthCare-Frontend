import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SignalrService } from '../../../core/services/signalr.service';
import { ModalService } from '../../../core/services/modal.service';
import { routes } from '../../../app.routes';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  notifCount = 0;
  private sub = new Subscription();

  navItems = [
    { label: 'Dashboard',icon: '📊', route: '/dashboard',roles: ['ADMIN','DOCTOR','PATIENT'] },
    { label: 'Doctors',icon: '👨‍⚕️', route: '/doctors',roles: ['ADMIN','PATIENT'] },
    {label : 'admin',icon:'🛡️',route:'/admin',roles:['ADMIN']},
    { label: 'Patients',icon: '🧑', route: '/patients',roles: ['ADMIN','DOCTOR'] },
    { label: 'My Profile',icon: '👤', route: '/patients/my-profile', roles: ['PATIENT',] },
    { label: 'Appointments', icon: '📅', route: '/appointments', roles: ['ADMIN','DOCTOR','PATIENT'] },
  ];

  constructor(
    public auth: AuthService,
    public signalr: SignalrService,
    public modal: ModalService
  ) {}

  ngOnInit(): void {
    if (this.auth.isDoctor() || this.auth.isPatient()) {
      this.signalr.connect();
    }
    if (this.auth.isDoctor()) {
      this.sub.add(this.signalr.newBooking$.subscribe(() => this.notifCount++));
    }
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  get visibleItems() {
    const role = this.auth.getUserRole();
    return this.navItems.filter(i => i.roles.includes(role));
  }

  get user() { return this.auth.currentUser(); }

  clearNotif() { this.notifCount = 0; }

  openSchedule(): void {
    this.modal.open('schedule');
  }

  openBookSlot(): void {
    this.modal.open('booking');
  }

  logout() { this.auth.logout(); }
}