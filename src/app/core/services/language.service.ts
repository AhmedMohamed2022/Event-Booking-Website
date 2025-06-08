import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private currentLang = new BehaviorSubject<string>(
    localStorage.getItem('language') || 'en'
  );
  currentLang$ = this.currentLang.asObservable();

  constructor() {
    this.setInitialLanguage();
  }

  private setInitialLanguage() {
    const savedLang = localStorage.getItem('language') || 'en';
    document.documentElement.lang = savedLang;
    document.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    this.currentLang.next(savedLang);
  }

  setLanguage(lang: string) {
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.currentLang.next(lang);
    window.location.reload();
  }

  getCurrentLanguage(): string {
    return this.currentLang.value;
  }

  getDirection(): string {
    return this.currentLang.value === 'ar' ? 'rtl' : 'ltr';
  }
}
