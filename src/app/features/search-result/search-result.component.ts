import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SearchService } from '../../core/services/search-result.service';
import { EventItem } from '../../core/models/event-item.model';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Add RouterModule here
  templateUrl: './search-result.component.html',
  styleUrls: ['./search-result.component.css'],
})
export class SearchResultComponent implements OnInit {
  results: EventItem[] = [];
  filteredResults: EventItem[] = [];
  loading = false;
  error: string | null = null;

  // Current search parameters
  currentParams: any = {};

  // Filter states
  filters = {
    categories: [] as string[],
    minPrice: 0,
    maxPrice: 10000,
    selectedCategories: [] as string[],
    priceRange: { min: 0, max: 10000 },
  };

  // Category mappings for different event types
  categoryMappings: { [key: string]: string[] } = {
    Wedding: [
      'Flowers',
      'Chairs',
      'Tables',
      'Decoration',
      'Photography',
      'Catering',
      'Music',
    ],
    Engagement: ['Flowers', 'Decoration', 'Photography', 'Catering', 'Music'],
    Funeral: ['Tents', 'Food', 'Sound', 'Chairs', 'Transportation'],
    Conference: ['Sound', 'Chairs', 'Tables', 'Catering', 'Photography'],
    Birthday: ['Decoration', 'Catering', 'Music', 'Photography'],
    'Corporate Event': ['Sound', 'Catering', 'Tables', 'Chairs', 'Photography'],
    Graduation: ['Decoration', 'Photography', 'Catering', 'Sound'],
    Anniversary: ['Flowers', 'Decoration', 'Photography', 'Catering', 'Music'],
  };

  // Add this property to store ratings
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
      this.loadCategoryFilters(params['category']);
      this.searchEvents();
      this.results.forEach((service) => {
        console.log('Image URLs:', service.images);
      });
    });
  }

  searchEvents() {
    this.loading = true;
    this.error = null;

    this.searchService.searchEvents(this.currentParams).subscribe({
      next: (data: EventItem[]) => {
        this.results = data;
        this.filteredResults = [...data]; // Create a new array reference
        this.calculatePriceRange();
        // Pre-generate ratings for all services
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

  loadCategoryFilters(eventType: string) {
    if (eventType && this.categoryMappings[eventType]) {
      this.filters.categories = this.categoryMappings[eventType];
    } else {
      // Default categories if event type not found
      this.filters.categories = [
        'Decoration',
        'Catering',
        'Sound',
        'Photography',
        'Transportation',
      ];
    }
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

  // Update the onCategoryFilterChange method
  onCategoryFilterChange(category: string, event: any) {
    const checked = event.target.checked;

    if (checked) {
      this.filters.selectedCategories.push(category);
    } else {
      this.filters.selectedCategories = this.filters.selectedCategories.filter(
        (c) => c !== category
      );
    }
    this.applyFilters();
  }

  onPriceRangeChange() {
    this.applyFilters();
  }

  // Update the applyFilters method to be more precise
  applyFilters() {
    this.filteredResults = this.results.filter((item) => {
      // Category filter
      const categoryMatch =
        this.filters.selectedCategories.length === 0 ||
        this.filters.selectedCategories.includes(item.category) ||
        (item.subcategory &&
          this.filters.selectedCategories.includes(item.subcategory));

      // Price filter
      const priceMatch =
        item.price >= this.filters.priceRange.min &&
        item.price <= this.filters.priceRange.max;

      return categoryMatch && priceMatch;
    });
  }

  clearFilters() {
    this.filters.selectedCategories = [];
    this.filters.priceRange = {
      min: this.filters.minPrice,
      max: this.filters.maxPrice,
    };
    this.filteredResults = this.results;
  }

  viewServiceDetails(serviceId: string) {
    this.router.navigate(['/service', serviceId]);
  }

  // Replace the old generateStarRating with this
  generateStarRating(serviceId: string): string {
    // Generate rating only once per service and store it
    if (!this.serviceRatings[serviceId]) {
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
      this.serviceRatings[serviceId] = '⭐'.repeat(rating);
    }
    return this.serviceRatings[serviceId];
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    console.warn('Image failed to load:', img.src);
    if (img && !img.src.includes('placeholder.png')) {
      img.src = '/assets/placeholder.png';
    }
  }
}
