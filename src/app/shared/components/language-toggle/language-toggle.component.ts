import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './language-toggle.component.html',
  styleUrls: ['./language-toggle.component.css'],
})
export class LanguageToggleComponent {
  currentLanguage: string = 'en';

  constructor(private languageService: LanguageService) {
    this.languageService.currentLanguage$.subscribe((lang) => {
      this.currentLanguage = lang;
    });
  }

  toggleLanguage() {
    this.languageService.toggleLanguage();
  }

  isRTL(): boolean {
    return this.languageService.isRTL();
  }
}
