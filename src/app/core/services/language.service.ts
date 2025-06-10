import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private switching = false;
  private currentLanguageSubject = new BehaviorSubject<string>(
    this.getInitialLanguage()
  );
  currentLanguage$ = this.currentLanguageSubject.asObservable();

  constructor() {
    this.initialize();
  }

  private getInitialLanguage(): string {
    const urlLang = window.location.pathname.includes('/ar/') ? 'ar' : 'en';
    const savedLang = localStorage.getItem('language');
    return savedLang || urlLang;
  }

  private initialize(): void {
    const lang = this.currentLanguageSubject.value;
    this.applyLanguage(lang, false);
  }

  private applyLanguage(lang: string, redirect: boolean): void {
    if (this.switching) return;

    try {
      this.switching = true;

      // Update document attributes
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

      // Update storage
      localStorage.setItem('language', lang);

      // Update bootstrap CSS
      const bootstrapLink = document.getElementById(
        'bootstrap-css'
      ) as HTMLLinkElement;
      if (bootstrapLink) {
        bootstrapLink.href =
          lang === 'ar'
            ? 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css'
            : 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
      }

      // Redirect if needed
      if (redirect) {
        const baseUrl = window.location.origin;
        const currentPath = window.location.pathname.replace(/^\/ar\//, '/');
        const newPath = lang === 'ar' ? `/ar${currentPath}` : currentPath;
        const newUrl = `${baseUrl}${newPath}${window.location.search}`;

        // Use replace to avoid browser history stacking
        window.location.replace(newUrl);
      }
    } finally {
      this.switching = false;
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  setLanguage(lang: 'en' | 'ar'): void {
    if (this.switching || lang === this.getCurrentLanguage()) return;
    this.currentLanguageSubject.next(lang);
    this.applyLanguage(lang, true);
  }

  isSwitching(): boolean {
    return this.switching;
  }
}
