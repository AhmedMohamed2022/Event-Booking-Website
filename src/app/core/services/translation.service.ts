// src/app/services/translation.service.ts
import { Injectable } from '@angular/core';
import { LanguageService } from './language.service';
import {
  EVENT_CATEGORIES,
  CategoryConfig,
} from '../models/constants/categories.const';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  // Arabic translations for categories
  private readonly AR_CATEGORIES: CategoryConfig[] = [
    {
      value: 'venues',
      label: 'القاعات والصالات',
      subcategories: [
        { value: 'wedding-halls', label: 'قاعات الأفراح' },
        { value: 'conference-rooms', label: 'قاعات المؤتمرات' },
        { value: 'outdoor-venues', label: 'أماكن خارجية' },
        { value: 'hotels', label: 'فنادق' },
      ],
    },
    {
      value: 'catering',
      label: 'خدمات الطعام',
      subcategories: [
        { value: 'buffet', label: 'بوفيه مفتوح' },
        { value: 'food-stations', label: 'محطات الطعام' },
        { value: 'beverages', label: 'المشروبات' },
        { value: 'desserts', label: 'الحلويات والكيك' },
      ],
    },
    // ...continue with other categories
  ];

  // Arabic translations for event types
  private readonly AR_EVENT_TYPES = [
    { value: 'wedding', label: 'زفاف' },
    { value: 'engagement', label: 'خطوبة' },
    { value: 'birthday', label: 'عيد ميلاد' },
    { value: 'conference', label: 'مؤتمر' },
    { value: 'corporate', label: 'حدث شركات' },
    { value: 'graduation', label: 'تخرج' },
    { value: 'social', label: 'لقاء اجتماعي' },
  ];

  constructor(private languageService: LanguageService) {}

  getTranslatedCategories(): CategoryConfig[] {
    return this.languageService.getCurrentLanguage() === 'ar'
      ? this.AR_CATEGORIES
      : EVENT_CATEGORIES;
  }

  // Helper method to get category label by value
  getCategoryLabel(value: string): string {
    const categories = this.getTranslatedCategories();
    const category = categories.find((cat) => cat.value === value);
    return category?.label || value;
  }

  // Helper method to get event type label by value
}
