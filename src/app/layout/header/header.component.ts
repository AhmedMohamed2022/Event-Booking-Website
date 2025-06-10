import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container">
        <a class="navbar-brand" routerLink="/">
          {{ getCurrentLanguage() === 'ar' ? 'حجز المناسبات' : 'EventBook' }}
        </a>

        <div class="ms-auto d-flex align-items-center gap-3">
          <button
            class="btn btn-outline-primary"
            (click)="switchLanguage()"
            [disabled]="languageService.isSwitching()"
          >
            {{ getCurrentLanguage() === 'en' ? 'عربي' : 'English' }}
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .btn-outline-primary {
        transition: all 0.3s ease;
      }
      .btn-outline-primary:hover {
        transform: translateY(-1px);
      }
      [dir='rtl'] .ms-2 {
        margin-right: 0.5rem !important;
        margin-left: 0 !important;
      }
    `,
  ],
})
export class HeaderComponent {
  constructor(public languageService: LanguageService) {}

  getCurrentLanguage(): string {
    return this.languageService.getCurrentLanguage();
  }

  switchLanguage(): void {
    const currentLang = this.getCurrentLanguage();
    this.languageService.setLanguage(currentLang === 'en' ? 'ar' : 'en');
  }
}
