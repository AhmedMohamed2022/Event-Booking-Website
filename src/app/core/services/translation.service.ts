// src/app/services/translation.service.ts
import { Injectable, LOCALE_ID, Inject } from '@angular/core';

export interface TranslatedOption {
  label: string;
  value: string;
}

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private currentLocale: string;

  constructor(@Inject(LOCALE_ID) locale: string) {
    this.currentLocale = locale;
  }

  getTranslatedCities(): TranslatedOption[] {
    if (this.currentLocale.startsWith('ar')) {
      return [
        { label: 'عمان', value: 'Amman' },
        { label: 'إربد', value: 'Irbid' },
        { label: 'الزرقاء', value: 'Zarqa' },
        { label: 'العقبة', value: 'Aqaba' },
        { label: 'السلط', value: 'Salt' },
        { label: 'مأدبا', value: 'Madaba' },
        { label: 'الكرك', value: 'Karak' },
        { label: 'الطفيلة', value: 'Tafilah' },
      ];
    }
    return [
      { label: 'Amman', value: 'Amman' },
      { label: 'Irbid', value: 'Irbid' },
      { label: 'Zarqa', value: 'Zarqa' },
      { label: 'Aqaba', value: 'Aqaba' },
      { label: 'Salt', value: 'Salt' },
      { label: 'Madaba', value: 'Madaba' },
      { label: 'Karak', value: 'Karak' },
      { label: 'Tafilah', value: 'Tafilah' },
    ];
  }

  getTranslatedEventTypes(): TranslatedOption[] {
    if (this.currentLocale.startsWith('ar')) {
      return [
        { label: 'عرس', value: 'Wedding' },
        { label: 'خطوبة', value: 'Engagement' },
        { label: 'جنازة', value: 'Funeral' },
        { label: 'مؤتمر', value: 'Conference' },
        { label: 'عيد ميلاد', value: 'Birthday' },
        { label: 'حدث شركي', value: 'Corporate Event' },
        { label: 'تخرج', value: 'Graduation' },
        { label: 'ذكرى سنوية', value: 'Anniversary' },
      ];
    }
    return [
      { label: 'Wedding', value: 'Wedding' },
      { label: 'Engagement', value: 'Engagement' },
      { label: 'Funeral', value: 'Funeral' },
      { label: 'Conference', value: 'Conference' },
      { label: 'Birthday', value: 'Birthday' },
      { label: 'Corporate Event', value: 'Corporate Event' },
      { label: 'Graduation', value: 'Graduation' },
      { label: 'Anniversary', value: 'Anniversary' },
    ];
  }

  getTranslatedPeopleRanges(): {
    min: number | null;
    max: number | null;
    label: string;
  }[] {
    return [
      { min: 50, max: 100, label: '50-100' },
      { min: 100, max: 150, label: '100-150' },
      { min: 150, max: 200, label: '150-200' },
      { min: 200, max: 300, label: '200-300' },
      { min: 300, max: 500, label: '300-500' },
      { min: 500, max: null, label: '500+' },
    ];
  }

  getTranslatedServices(): TranslatedOption[] {
    if (this.currentLocale.startsWith('ar')) {
      return [
        { label: 'قاعات المناسبات', value: 'Event Halls' },
        { label: 'ديكورات', value: 'Decorations' },
        { label: 'خدمات الطعام', value: 'Catering' },
        { label: 'صوت/فيديو', value: 'Audio/Video' },
        { label: 'تصوير', value: 'Photography' },
        { label: 'نقل', value: 'Transportation' },
      ];
    }
    return [
      { label: 'Event Halls', value: 'Event Halls' },
      { label: 'Decorations', value: 'Decorations' },
      { label: 'Catering', value: 'Catering' },
      { label: 'Audio/Video', value: 'Audio/Video' },
      { label: 'Photography', value: 'Photography' },
      { label: 'Transportation', value: 'Transportation' },
    ];
  }
}
