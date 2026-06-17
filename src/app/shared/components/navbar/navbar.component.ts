import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar">
      <h2 class="page-title">{{ pageTitle }}</h2>
      <div class="navbar-right">
        <span class="user-chip" *ngIf="auth.currentUser() as u">
          {{ u.fullName }} &nbsp;·&nbsp;
          <span class="role-pill">{{ u.roleCode }}</span>
        </span>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 24px; background: #fff;
      border-bottom: 1px solid #e5e7eb;
      position: sticky; top: 0; z-index: 50;
    }
    .page-title { font-size: 17px; font-weight: 600; color: #111827; margin: 0; }
    .user-chip { font-size: 13px; color: #6b7280; }
    .role-pill {
      background: #ede9fe; color: #6d28d9;
      font-size: 11px; padding: 2px 8px;
      border-radius: 10px; font-weight: 500;
    }
  `]
})
export class NavbarComponent {
  pageTitle = 'Dashboard';

  constructor(public auth: AuthService, router: Router) {
    router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: any) => {
        const url = e.urlAfterRedirects;
        if (url.includes('dashboard'))    return 'Dashboard';
        if (url.includes('doctors'))      return 'Doctors';
        if (url.includes('patients'))     return 'Patients';
        if (url.includes('appointments')) return 'Appointments';
        return 'HealthCare';
      })
    ).subscribe(title => this.pageTitle = title);
  }
}