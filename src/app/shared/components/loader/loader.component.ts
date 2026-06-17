import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-wrap">
      <div class="spinner"></div>
    </div>
  `,
  styles: [`
    .loader-wrap {
      display: flex; align-items: center; justify-content: center;
      padding: 40px;
    }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid #e5e7eb;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoaderComponent {}