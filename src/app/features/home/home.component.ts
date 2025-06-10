import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { LanguageService } from '../../core/services/language.service';
import {
  EVENT_CATEGORIES,
  CategoryConfig,
} from '../../core/models/constants/categories.const';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  // Search form data
  searchForm = {
    city: '',
    eventType: '',
    people: '',
    date: '',
  };

  // Data for dropdowns
  cities = [
    'Amman',
    'Irbid',
    'Zarqa',
    'Aqaba',
    'Salt',
    'Madaba',
    'Karak',
    'Tafilah',
  ];

  // Update to use EVENT_CATEGORIES directly
  eventCategories: CategoryConfig[] = [];

  peopleRanges = [
    { min: 50, max: 100, label: '50-100' },
    { min: 100, max: 150, label: '100-150' },
    { min: 150, max: 200, label: '150-200' },
    { min: 200, max: 300, label: '200-300' },
    { min: 300, max: 500, label: '300-500' },
    { min: 500, max: null, label: '500+' },
  ];

  isAuthenticated = false;
  currentUser: any = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private translationService: TranslationService,
    private languageService: LanguageService
  ) {
    this.updateTranslations();
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });

    // Subscribe to language changes
    this.languageService.currentLanguage$.subscribe(() => {
      this.updateTranslations();
    });
  }

  private updateTranslations() {
    // Get translated categories (main categories only)
    this.eventCategories = this.translationService.getTranslatedCategories();
  }

  onSearchSubmit() {
    if (
      !this.searchForm.city ||
      !this.searchForm.eventType ||
      !this.searchForm.date
    ) {
      alert('Please fill in required fields: City, Event Type, and Date');
      return;
    }

    const selectedRange = this.peopleRanges.find(
      (range) => range.label === this.searchForm.people
    );

    const queryParams = {
      city: this.searchForm.city,
      category: this.searchForm.eventType, // This will be the main category value
      date: this.searchForm.date,
      minCapacity: selectedRange?.min,
      maxCapacity: selectedRange?.max,
    };

    // Remove undefined values
    Object.keys(queryParams).forEach(
      (key) =>
        queryParams[key as keyof typeof queryParams] === undefined &&
        delete queryParams[key as keyof typeof queryParams]
    );

    this.router.navigate(['/search-results'], { queryParams });
  }

  // Keep existing helper methods
  navigateToVendorJoin() {
    this.router.navigate(['/join']);
  }

  getDashboardLink(): string {
    if (!this.currentUser) return '/';

    switch (this.currentUser.role) {
      case 'admin':
        return '/admin-dashboard';
      case 'supplier':
        return '/supplier-dashboard';
      default:
        return '/client-dashboard';
    }
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }
}
