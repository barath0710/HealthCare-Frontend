import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AppModalComponent } from './shared/components/app-modal/app-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent, NavbarComponent,AppModalComponent],
  template: `
    <div class="app-shell">
      <app-sidebar *ngIf="auth.isLoggedIn()"></app-sidebar>
      <main [class.with-sidebar]="auth.isLoggedIn()">
        <app-navbar *ngIf="auth.isLoggedIn()"></app-navbar>
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
    <app-app-modal></app-app-modal>
  `,
  styles: [`
    .app-shell { display:flex; min-height:100vh; background:#f0f2f5; }
    main { flex:1; display:flex; flex-direction:column; }
    main.with-sidebar { margin-left:240px; }
    .page-content { flex:1; padding:24px; }
  `]
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}