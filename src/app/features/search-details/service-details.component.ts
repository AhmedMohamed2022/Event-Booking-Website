import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventItem } from '../../core/models/event-item.model';
import { ServiceDetailService } from '../../core/services/ServiceDetails.service';
import { ChatDialogService } from '../../core/services/chat-dialog.service';
import { ChatService } from '../../core/services/chat.service'; // Import ChatService
import { ChatComponent } from '../chat/chat.component'; // Add this import
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-details.component.html',
  styleUrls: ['./service-details.component.css'],
})
export class ServiceDetailComponent implements OnInit {
  service: any = null;
  relatedServices: EventItem[] = [];
  loading = false;
  error: string | null = null;
  serviceId: string = '';
  serviceRating: string = ''; // Add this property

  // Image gallery
  currentImageIndex = 0;
  showImageModal = false;

  // Video gallery
  currentVideoIndex = 0;
  showVideoModal = false;
  activeMediaType: 'image' | 'video' = 'image';

  // Google Maps URLs
  googleMapUrl = '';
  directionUrl = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private serviceDetailService: ServiceDetailService,
    private chatDialog: ChatDialogService,
    private chatService: ChatService, // Inject ChatService
    private authService: AuthService // Add this
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.serviceId = params['id'];
      this.loadServiceDetails();
    });
  }

  loadServiceDetails() {
    this.loading = true;
    this.error = null;

    this.serviceDetailService.getServiceById(this.serviceId).subscribe({
      next: (data: any) => {
        console.log('Service detail fetched:', data);
        this.service = data;
        // Generate rating once when data is loaded
        this.serviceRating = this.generateStarRating();
        // Backend returns googleMapUrl and directionUrl from the controller
        this.googleMapUrl = data.googleMapUrl || '';
        this.directionUrl = data.directionUrl || '';
        this.loadRelatedServices();
        this.loading = false;
      },
      error: (error) => {
        console.error(this.serviceId);
        console.error('Error fetching service details:');
        this.error = 'Failed to load service details. Please try again.';
        this.loading = false;
        console.error('Service detail fetch failed:', error);
      },
    });
  }

  loadRelatedServices() {
    if (this.service) {
      const searchParams = {
        category: this.service.category,
        minPrice: Math.max(0, this.service.price - 200),
        maxPrice: this.service.price + 200,
      };

      this.serviceDetailService.getRelatedServices(searchParams).subscribe({
        next: (data: EventItem[]) => {
          // Filter out current service and limit to 6 results
          this.relatedServices = data
            .filter((item) => item._id !== this.service?._id)
            .slice(0, 6);
        },
        error: (error) => {
          console.error('Related services fetch failed:', error);
        },
      });
    }
  }

  // Image gallery methods
  nextImage() {
    if (this.service?.images) {
      this.currentImageIndex =
        (this.currentImageIndex + 1) % this.service.images.length;
    }
  }

  prevImage() {
    if (this.service?.images) {
      this.currentImageIndex =
        this.currentImageIndex === 0
          ? this.service.images.length - 1
          : this.currentImageIndex - 1;
    }
  }

  selectImage(index: number) {
    this.currentImageIndex = index;
  }

  openImageModal() {
    this.showImageModal = true;
  }

  closeImageModal() {
    this.showImageModal = false;
  }

  // Video gallery methods
  nextVideo() {
    if (this.service?.videos) {
      this.currentVideoIndex =
        (this.currentVideoIndex + 1) % this.service.videos.length;
    }
  }

  prevVideo() {
    if (this.service?.videos) {
      this.currentVideoIndex =
        this.currentVideoIndex === 0
          ? this.service.videos.length - 1
          : this.currentVideoIndex - 1;
    }
  }

  selectVideo(index: number) {
    this.currentVideoIndex = index;
    this.activeMediaType = 'video';
  }

  openVideoModal() {
    this.showVideoModal = true;
    this.activeMediaType = 'video';
  }

  closeVideoModal() {
    this.showVideoModal = false;
    this.activeMediaType = 'image';
  }

  // Navigation methods
  bookNow() {
    this.router.navigate(['/booking', this.serviceId]);
  }

  contactSupplier() {
    if (this.service?.supplier.phone) {
      window.open(`tel:${this.service.supplier.phone}`, '_self');
    }
  }

  viewRelatedService(serviceId: string) {
    this.router.navigate(['/service', serviceId]);
  }

  goBack() {
    window.history.back();
  }

  openGoogleMaps() {
    if (this.googleMapUrl) {
      window.open(this.googleMapUrl, '_blank');
    }
  }

  openDirections() {
    if (this.directionUrl) {
      window.open(this.directionUrl, '_blank');
    }
  }

  // Chat method
  openChat() {
    console.log('Opening chat...');

    // Check authentication using AuthService
    this.authService.currentUser$.subscribe((user) => {
      if (!user) {
        console.log('User not authenticated, redirecting to login');
        this.router.navigate(['/login'], {
          queryParams: {
            returnUrl: `/service/${this.serviceId}`,
            action: 'chat',
          },
        });
        return;
      }

      // Verify supplier exists
      if (!this.service?.supplier) {
        console.error('No supplier information found');
        return;
      }

      console.log('User authenticated:', user);
      console.log('Initializing chat with supplier:', {
        supplierId: this.service.supplier._id,
        supplierName: this.service.supplier.name,
      });

      try {
        // Initialize chat service connection
        this.chatService.connectSocket();

        // Open chat dialog with supplier info
        this.chatDialog.openChat(
          this.service.supplier._id,
          this.service.supplier.name || 'Supplier'
        );

        console.log('Chat dialog opened successfully');
      } catch (error) {
        console.error('Error opening chat:', error);
      }
    });
  }

  // Update the canChat method to properly decode the token
  canChat(): boolean {
    let isClient = false;
    this.authService.currentUser$.subscribe((user) => {
      isClient = user?.role === 'client';
    });
    return isClient;
  }

  // Utility methods
  shouldShowBookingButton(): boolean {
    return (
      this.service?.category.toLowerCase() !== 'hall' &&
      this.service?.category.toLowerCase() !== 'farm'
    );
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Update the generateStarRating method to be private
  private generateStarRating(): string {
    const rating = Math.floor(Math.random() * 2) + 4;
    return '⭐'.repeat(rating);
  }
}
