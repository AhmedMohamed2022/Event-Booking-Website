import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
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

  eventTypes = [
    'Wedding',
    'Engagement',
    'Funeral',
    'Conference',
    'Birthday',
    'Corporate Event',
    'Graduation',
    'Anniversary',
  ];

  peopleRanges = [
    { min: 50, max: 100, label: '50-100' },
    { min: 100, max: 150, label: '100-150' },
    { min: 150, max: 200, label: '150-200' },
    { min: 200, max: 300, label: '200-300' },
    { min: 300, max: 500, label: '300-500' },
    { min: 500, max: null, label: '500+' },
  ];

  services = [
    { name: 'Event Halls', icon: '🏛️' },
    { name: 'Decorations', icon: '🎨' },
    { name: 'Catering', icon: '🍽️' },
    { name: 'Audio/Video', icon: '🎵' },
    { name: 'Photography', icon: '📸' },
    { name: 'Transportation', icon: '🚗' },
  ];

  constructor(private router: Router) {}

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
    this.router.navigate(['/vendor-join']);
  }
}
