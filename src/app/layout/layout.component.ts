import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../core/services/language.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TranslateModule],
  template: `
    <div class="app-layout" [class.rtl]="isRTL">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      .app-layout {
        min-height: 100vh;
        transition: all 0.3s ease;
      }

      .rtl {
        direction: rtl;
      }

      .rtl * {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
    `,
  ],
})
export class LayoutComponent implements OnInit {
  isRTL = false;

  constructor(private languageService: LanguageService) {}

  ngOnInit() {
    this.languageService.currentLanguage$.subscribe(() => {
      this.isRTL = this.languageService.isRTL();
    });
  }
}
