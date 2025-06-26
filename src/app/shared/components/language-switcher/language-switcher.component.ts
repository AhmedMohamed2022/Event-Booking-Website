// import { Component } from '@angular/core';
// import { LanguageService } from '../../../core/services/language.service';

// @Component({
//   selector: 'app-language-switcher',
//   standalone: true,
//   template: `
//     <div class="language-switcher">
//       <button (click)="switchLanguage()" class="btn btn-link">
//         {{ getCurrentLanguage() === 'en' ? 'عربي' : 'English' }}
//       </button>
//     </div>
//   `,
//   styles: [
//     `
//       .language-switcher {
//         padding: 8px;
//       }
//     `,
//   ],
// })
// export class LanguageSwitcherComponent {
//   constructor(private languageService: LanguageService) {}

//   getCurrentLanguage(): string {
//     return localStorage.getItem('language') || 'en';
//   }

//   switchLanguage() {
//     const currentLang = this.getCurrentLanguage();
//     this.languageService.setLanguage(currentLang === 'en' ? 'ar' : 'en');
//   }
// }
