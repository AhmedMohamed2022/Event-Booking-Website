import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslationService } from '../../core/services/translation.service';
import {
  EVENT_CATEGORIES,
  CategoryConfig,
} from '../../core/models/constants/categories.const';

interface TranslatedCity {
  original: string;
  translated: string;
}

interface PeopleRange {
  min: number;
  max: number | null;
  label: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('searchModal') searchModal!: ElementRef;

  private destroy$ = new Subject<void>();

  // Search form data
  searchForm = {
    city: '',
    eventType: '',
    people: '',
    date: '',
  };

  // Modal state
  isSearchModalOpen = false;

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

  // Translated cities for display
  translatedCities: TranslatedCity[] = [];

  // Event categories with translations
  eventCategories: CategoryConfig[] = [];

  peopleRanges: PeopleRange[] = [];

  // Popular categories for quick access
  popularCategories = ['wedding', 'engagement', 'conference', 'birthday'];

  isAuthenticated = false;
  currentUser: any = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private translationService: TranslationService,
    private languageService: LanguageService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
      });

    // Wait for translations to be loaded before initial update
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateTranslations();
    });

    // Initial load
    this.translate.get('header.brandName').subscribe(() => {
      this.updateTranslations();
    });

    // Add escape key listener for modal
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  private handleEscapeKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isSearchModalOpen) {
      this.closeSearchModal();
    }
  }

  private updateTranslations() {
    // Get translated categories
    this.eventCategories = this.translationService.getTranslatedCategories();

    // Update translated cities
    this.translatedCities = this.cities.map((city) => ({
      original: city,
      translated: this.translate.instant(`cities.${city.toLowerCase()}`),
    }));

    // Update people ranges with translations
    this.peopleRanges = this.translationService.getTranslatedPeopleRanges();
  }

  // Modal methods
  openSearchModal() {
    this.isSearchModalOpen = true;
    document.body.classList.add('modal-open');
    // Focus on first input after modal opens
    setTimeout(() => {
      const firstInput = document.querySelector(
        '.search-modal input, .search-modal select'
      ) as HTMLElement;
      firstInput?.focus();
    }, 100);
  }

  closeSearchModal() {
    this.isSearchModalOpen = false;
    document.body.classList.remove('modal-open');
  }

  onModalBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeSearchModal();
    }
  }

  // Category selection handling
  onCategoryChange() {
    // Remove subcategory logic, just keep category selection logic if needed
  }

  // Quick category selection
  selectCategory(categoryValue: string) {
    this.searchForm.eventType = categoryValue;
    this.openSearchModal();
  }

  onSearchSubmit() {
    if (
      !this.searchForm.city ||
      !this.searchForm.eventType ||
      !this.searchForm.date
    ) {
      // Use translated alert message
      const alertMessage =
        this.languageService.getCurrentLanguage() === 'ar'
          ? 'يرجى ملء الحقول المطلوبة: المدينة، نوع المناسبة، والتاريخ'
          : 'Please fill in required fields: City, Event Type, and Date';
      alert(alertMessage);
      return;
    }

    const selectedRange = this.peopleRanges.find(
      (range) => range.label === this.searchForm.people
    );

    const queryParams: any = {
      city: this.searchForm.city,
      category: this.searchForm.eventType,
      date: this.searchForm.date,
      minCapacity: selectedRange?.min,
      maxCapacity: selectedRange?.max,
    };

    // Remove undefined values
    Object.keys(queryParams).forEach(
      (key) => queryParams[key] === undefined && delete queryParams[key]
    );

    this.closeSearchModal();
    this.router.navigate(['/search-results'], { queryParams });
  }

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
    const confirmMessage =
      this.languageService.getCurrentLanguage() === 'ar'
        ? 'هل أنت متأكد من أنك تريد تسجيل الخروج؟'
        : 'Are you sure you want to logout?';

    if (confirm(confirmMessage)) {
      this.authService.logout();
    }
  }

  getCategoryIcon(categoryValue: string): string {
    const iconMap: { [key: string]: string } = {
      wedding: 'fas fa-ring',
      engagement: 'fas fa-heart',
      conference: 'fas fa-microphone',
      birthday: 'fas fa-birthday-cake',
      corporate: 'fas fa-briefcase',
      graduation: 'fas fa-graduation-cap',
      funeral: 'fas fa-dove',
    };

    return iconMap[categoryValue] || 'fas fa-calendar-alt';
  }

  // Scroll to section
  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
