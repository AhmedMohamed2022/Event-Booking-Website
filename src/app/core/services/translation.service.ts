import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  EVENT_CATEGORIES,
  CategoryConfig,
} from '../models/constants/categories.const';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  constructor(private translate: TranslateService) {}

  // Get translated text
  get(key: string, params?: any): Observable<string> {
    return this.translate.get(key, params);
  }

  // Get instant translation (use only when sure translation is loaded)
  instant(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }

  // Get translated categories
  getTranslatedCategories(): CategoryConfig[] {
    return EVENT_CATEGORIES.map((category) => ({
      ...category,
      label: this.instant(`categories.${category.value}`),
      subcategories: category.subcategories.map((sub) => ({
        ...sub,
        label: this.instant(`subcategories.${sub.value}`),
      })),
    }));
  }

  // Get translated cities
  getTranslatedCities(): string[] {
    const cities = [
      'Amman',
      'Irbid',
      'Zarqa',
      'Aqaba',
      'Salt',
      'Madaba',
      'Karak',
      'Tafilah',
    ];
    return cities.map((city) => this.instant(`cities.${city.toLowerCase()}`));
  }

  // Get translated people ranges
  getTranslatedPeopleRanges(): any[] {
    return [
      { min: 50, max: 100, label: this.instant('peopleRanges.50-100') },
      { min: 100, max: 150, label: this.instant('peopleRanges.100-150') },
      { min: 150, max: 200, label: this.instant('peopleRanges.150-200') },
      { min: 200, max: 300, label: this.instant('peopleRanges.200-300') },
      { min: 300, max: 500, label: this.instant('peopleRanges.300-500') },
      { min: 500, max: null, label: this.instant('peopleRanges.500+') },
    ];
  }
}
