import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SearchService } from '../../core/services/search-result.service';
import { EventItem } from '../../core/models/event-item.model';
import {
  EVENT_CATEGORIES,
  CategoryConfig,
} from '../../core/models/constants/categories.const';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './search-result.component.html',
  styleUrls: ['./search-result.component.css'],
})
export class SearchResultComponent implements OnInit {
  results: EventItem[] = [];
  filteredResults: EventItem[] = [];
  loading = false;
  error: string | null = null;
  currentParams: any = {};
  selectedCategory: CategoryConfig | undefined;

  // Updated filter state
  filters = {
    minPrice: 0,
    maxPrice: 10000,
    selectedSubcategories: [] as string[],
    priceRange: { min: 0, max: 10000 },
  };

  // Store ratings
  serviceRatings: { [key: string]: string } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private searchService: SearchService
  ) {}

  ngOnInit() {
    this.loading = true;
    this.route.queryParams.subscribe((params) => {
      this.currentParams = params;
      // Find the selected category from EVENT_CATEGORIES
      if (params['category']) {
        this.selectedCategory = EVENT_CATEGORIES.find(
          (c) => c.value === params['category']
        );
      }
      this.searchEvents();
    });
  }

  searchEvents() {
    this.loading = true;
    this.error = null;

    this.searchService.searchEvents(this.currentParams).subscribe({
      next: (data: EventItem[]) => {
        this.results = data;
        this.filteredResults = [...data];
        this.calculatePriceRange();
        // Pre-generate ratings
        data.forEach((service) => {
          this.generateStarRating(service._id);
        });
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to fetch results. Please try again.';
        this.loading = false;
        console.error('Search failed:', error);
      },
    });
  }

  onSubcategoryFilterChange(subcategoryValue: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.filters.selectedSubcategories.push(subcategoryValue);
    } else {
      this.filters.selectedSubcategories =
        this.filters.selectedSubcategories.filter(
          (s) => s !== subcategoryValue
        );
    }
    this.applyFilters();
  }

  onPriceRangeChange() {
    this.applyFilters();
  }

  applyFilters() {
    this.filteredResults = this.results.filter((item) => {
      // Subcategory filter
      const subcategoryMatch =
        this.filters.selectedSubcategories.length === 0 ||
        this.filters.selectedSubcategories.includes(item.subcategory || '');

      // Price filter
      const priceMatch =
        item.price >= this.filters.priceRange.min &&
        item.price <= this.filters.priceRange.max;

      return subcategoryMatch && priceMatch;
    });
  }

  calculatePriceRange() {
    if (this.results.length > 0) {
      const prices = this.results.map((item) => item.price);
      this.filters.minPrice = Math.min(...prices);
      this.filters.maxPrice = Math.max(...prices);
      this.filters.priceRange = {
        min: this.filters.minPrice,
        max: this.filters.maxPrice,
      };
    }
  }

  clearFilters() {
    this.filters.selectedSubcategories = [];
    this.filters.priceRange = {
      min: this.filters.minPrice,
      max: this.filters.maxPrice,
    };
    this.filteredResults = this.results;
  }

  viewServiceDetails(serviceId: string) {
    this.router.navigate(['/service', serviceId]);
  }

  generateStarRating(serviceId: string): string {
    if (!this.serviceRatings[serviceId]) {
      const rating = Math.floor(Math.random() * 2) + 4;
      this.serviceRatings[serviceId] = '⭐'.repeat(rating);
    }
    return this.serviceRatings[serviceId];
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.includes('placeholder.png')) {
      img.src = '/assets/placeholder.png';
    }
  }

  getCategoryLabel(value: string): string {
    const category = EVENT_CATEGORIES.find((c) => c.value === value);
    return category?.label || value;
  }

  getSubcategoryLabel(value: string): string {
    const subcategory = this.selectedCategory?.subcategories.find(
      (s) => s.value === value
    );
    return subcategory?.label || value;
  }
}
