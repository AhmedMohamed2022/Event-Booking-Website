// src/app/features/add-service/add-service.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { EventItemService } from '../../core/services/event-item.service';
import { CreateEventItemRequest } from '../../core/models/event-item.model';
import {
  CategoryConfig,
  EVENT_CATEGORIES,
} from '../../core/models/constants/categories.const';

@Component({
  selector: 'app-add-service',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-service-eng.component.html',
  styleUrls: ['./add-service-eng.component.css'],
})
export class AddServiceComponent implements OnInit {
  serviceForm: FormGroup;
  isLoading = false;
  isUploading = false;
  selectedImages: File[] = [];
  selectedVideos: File[] = [];
  availableDates: string[] = [];

  categories = EVENT_CATEGORIES;
  selectedCategory?: CategoryConfig;
  subcategories: { value: string; label: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private eventItemService: EventItemService,
    private router: Router
  ) {
    this.serviceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      category: ['', Validators.required],
      subcategory: [''],
      price: ['', [Validators.required, Validators.min(1)]],
      city: [''],
      area: [''],
      lat: [''],
      lng: [''],
      minCapacity: [''],
      maxCapacity: [''],
    });
  }

  ngOnInit(): void {}

  onImageSelect(event: any): void {
    const files = Array.from(event.target.files) as File[];
    if (files.length + this.selectedImages.length > 5) {
      alert('You can upload up to 5 images maximum');
      return;
    }
    this.selectedImages = [...this.selectedImages, ...files];
  }

  onVideoSelect(event: any): void {
    const files = Array.from(event.target.files) as File[];
    if (files.length + this.selectedVideos.length > 3) {
      alert('You can upload up to 3 videos maximum');
      return;
    }
    this.selectedVideos = [...this.selectedVideos, ...files];
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
  }

  removeVideo(index: number): void {
    this.selectedVideos.splice(index, 1);
  }

  addAvailableDate(event: any): void {
    const date = event.target.value;
    if (date && !this.availableDates.includes(date)) {
      this.availableDates.push(date);
    }
    event.target.value = '';
  }

  removeAvailableDate(index: number): void {
    this.availableDates.splice(index, 1);
  }

  async onSubmit(): Promise<void> {
    if (this.serviceForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;

    try {
      const formValue = this.serviceForm.value;

      const eventItemData: CreateEventItemRequest = {
        name: formValue.name,
        description: formValue.description,
        category: formValue.category,
        subcategory: formValue.subcategory,
        price: Number(formValue.price),
        location: {
          city: formValue.city,
          area: formValue.area,
          coordinates: {
            lat: formValue.lat ? Number(formValue.lat) : undefined,
            lng: formValue.lng ? Number(formValue.lng) : undefined,
          },
        },
        availableDates: this.availableDates,
        minCapacity: formValue.minCapacity
          ? Number(formValue.minCapacity)
          : undefined,
        maxCapacity: formValue.maxCapacity
          ? Number(formValue.maxCapacity)
          : undefined,
      };

      // Create the event item first
      const createdItem = await this.eventItemService
        .createEventItem(eventItemData)
        .toPromise();

      // Upload media if any files are selected
      if (this.selectedImages.length > 0 || this.selectedVideos.length > 0) {
        await this.uploadMedia(createdItem!._id!);
      }

      alert('Service added successfully!');
      this.router.navigate(['/supplier-dashboard']);
    } catch (error: any) {
      console.error('Error creating service:', error);
      alert('An error occurred while adding the service. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  private async uploadMedia(eventItemId: string): Promise<void> {
    if (this.selectedImages.length === 0 && this.selectedVideos.length === 0) {
      return;
    }

    this.isUploading = true;

    try {
      const formData = new FormData();

      this.selectedImages.forEach((image) => {
        formData.append('images', image);
      });

      this.selectedVideos.forEach((video) => {
        formData.append('videos', video);
      });

      await this.eventItemService
        .uploadEventMedia(eventItemId, formData)
        .toPromise();
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Service created but there was an error uploading files');
    } finally {
      this.isUploading = false;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.serviceForm.controls).forEach((key) => {
      const control = this.serviceForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.serviceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.serviceForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['minlength']) return 'Text must be longer';
      if (field.errors['min']) return 'Value must be greater than zero';
    }
    return '';
  }

  goBack(): void {
    this.router.navigate(['/supplier-dashboard']);
  }

  onCategoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    const category = this.categories.find((c) => c.value === value);
    this.subcategories = category?.subcategories || [];
    this.serviceForm.patchValue({ subcategory: '' });
  }
}
