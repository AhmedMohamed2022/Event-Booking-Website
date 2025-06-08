import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  EVENT_TYPES,
  EVENT_CATEGORIES,
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
    subcategory: '', // Add this
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

  // Replace existing eventTypes
  eventTypes = EVENT_TYPES;

  // Add categories
  categories = EVENT_CATEGORIES;
  subcategories: { value: string; label: string }[] = [];

  peopleRanges = [
    { min: 50, max: 100, label: '50-100' },
    { min: 100, max: 150, label: '100-150' },
    { min: 150, max: 200, label: '150-200' },
    { min: 200, max: 300, label: '200-300' },
    { min: 300, max: 500, label: '300-500' },
    { min: 500, max: null, label: '500+' },
  ];

  // Update services array to match categories
  services = EVENT_CATEGORIES.map((cat) => ({
    name: cat.label,
    icon: this.getCategoryIcon(cat.value),
  }));

  private getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      venues: '🏛️',
      catering: '🍽️',
      decoration: '🎨',
      entertainment: '🎵',
      photography: '📸',
      equipment: '⚙️',
    };
    return icons[category] || '✨';
  }

  isAuthenticated = false;
  currentUser: any = null;
  currentLang = 'en';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });
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
      category: this.searchForm.eventType,
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

  // Update the onEventTypeChange method
  onEventTypeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    const category = this.categories.find((c) => c.value === value);
    this.subcategories = category?.subcategories || [];
    this.searchForm.subcategory = '';
  }
}
