import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventItem } from '../../core/models/event-item.model';
import { ServiceDetailService } from '../../core/services/ServiceDetails.service';
import { ChatDialogService } from '../../core/services/chat-dialog.service';
import { ChatService } from '../../core/services/chat.service';
import { ChatComponent } from '../chat/chat.component';
import { AuthService } from '../../core/services/auth.service';
import { ContactService } from '../../core/services/contact.service';
import {
  ContactChatService,
  ContactChatAccess,
} from '../../core/services/contact-chat.service';
// Add translation imports
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';
import { TranslationService } from '../../core/services/translation.service';
import { isContactOnlyService } from '../../core/models/constants/categories.const';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule], // Add TranslateModule
  templateUrl: './service-details.component.html',
  styleUrls: ['./service-details.component.css'],
})
export class ServiceDetailComponent implements OnInit {
  service: any = null;
  relatedServices: EventItem[] = [];
  loading = false;
  error: string | null = null;
  serviceId: string = '';
  serviceRating: string = '';

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

  // Contact chat access
  chatAccess: ContactChatAccess = { canChat: false };
  checkingChatAccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private serviceDetailService: ServiceDetailService,
    private chatDialog: ChatDialogService,
    private chatService: ChatService,
    private authService: AuthService,
    private contactService: ContactService,
    private contactChatService: ContactChatService,
    // Add translation services
    private translate: TranslateService,
    private languageService: LanguageService,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.serviceId = params['id'];
      this.loadServiceDetails();
    });

    // Subscribe to language changes
    this.translate.onLangChange.subscribe(() => {
      this.updateTranslations();
    });
  }

  private updateTranslations() {
    // Update any dynamic translations if needed
    // This method will be called when language changes
    if (this.service) {
      // Update translated category and location if needed
      this.service.translatedCategory =
        this.translationService.getTranslatedCategory(this.service.category);
      this.service.translatedLocation =
        this.translationService.getTranslatedCity(this.service.location?.city);
    }
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

        // Update translations for the loaded service
        this.updateTranslations();

        // Check chat access if user is authenticated
        if (this.authService.isAuthenticated() && this.service?.supplier?._id) {
          this.checkChatAccess();
        }

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

      // Check if user can chat (has approved contact request)
      if (!this.chatAccess.canChat) {
        console.log('User cannot chat - no approved contact request');
        alert(
          this.chatAccess.reason ||
            'You need an approved contact request to chat with this supplier.'
        );
        return;
      }

      console.log('User authenticated and can chat:', user);
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

  // Update the canChat method to check contact request approval
  canChat(): boolean {
    // User must be authenticated, be a client, and have approved contact request
    return (
      this.authService.isAuthenticated() &&
      this.authService.getCurrentUser()?.role === 'client' &&
      this.chatAccess.canChat
    );
  }

  // Initialize chat connection
  initializeChat() {
    // First check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, skipping chat initialization');
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.log('No token available, skipping chat initialization');
      return;
    }

    // Initialize chat only if authenticated and token exists
    if (!this.chatService.isSocketConnected()) {
      console.log('Initializing chat connection...');
      this.chatService.reinitializeSocket();
    }
  }

  // Utility methods
  shouldShowBookingButton(): boolean {
    if (!this.service) return false;

    // Use the new contact-only service logic
    return !isContactOnlyService(
      this.service.category,
      this.service.subcategory
    );
  }

  formatDate(date: Date | string): string {
    const dateObj = new Date(date);
    const currentLang = this.languageService.getCurrentLanguage();

    if (currentLang === 'ar') {
      return dateObj.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else {
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  }

  // Update the generateStarRating method to be private
  private generateStarRating(): string {
    const rating = Math.floor(Math.random() * 2) + 4;
    return '⭐'.repeat(rating);
  }

  // Helper method to get translated category
  getTranslatedCategory(): string {
    return this.service?.category
      ? this.translationService.getTranslatedCategory(this.service.category)
      : '';
  }

  // Helper method to get translated subcategory
  getTranslatedSubcategory(): string {
    return this.service?.subcategory
      ? this.translationService.getTranslatedSubcategory(
          this.service.subcategory
        )
      : '';
  }

  // Helper method to get translated city
  getTranslatedCity(): string {
    return this.service?.location?.city
      ? this.translationService.getTranslatedCity(this.service.location.city)
      : '';
  }

  // Contact request methods
  sendContactRequest() {
    if (!this.service || !this.authService.isAuthenticated()) {
      // Redirect to login if not authenticated
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: `/service/${this.serviceId}`,
          action: 'contact',
        },
      });
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('No current user found');
      return;
    }

    const contactRequest = {
      client: currentUser.id,
      supplier: this.service.supplier._id,
      service: this.service._id,
      message: `I'm interested in your ${this.service.name} service. Please contact me for more details.`,
    };

    this.contactService.sendContactRequest(contactRequest).subscribe({
      next: (response) => {
        if (response.success) {
          alert(
            'Contact request sent successfully! The supplier will contact you soon.'
          );
        } else {
          alert(response.message || 'Failed to send contact request');
        }
      },
      error: (error) => {
        console.error('Error sending contact request:', error);
        if (error.error?.message) {
          alert(error.error.message);
        } else {
          alert('Failed to send contact request. Please try again.');
        }
      },
    });
  }

  // Check if user can send contact request
  canSendContactRequest(): boolean {
    return (
      this.authService.isAuthenticated() &&
      this.authService.getCurrentUser()?.role === 'client'
    );
  }

  // Get tooltip for chat button
  getChatButtonTooltip(): string {
    if (this.checkingChatAccess) {
      return 'Checking chat access...';
    }

    if (!this.authService.isAuthenticated()) {
      return 'Please login to chat with supplier';
    }

    if (this.authService.getCurrentUser()?.role !== 'client') {
      return 'Only clients can chat with suppliers';
    }

    if (this.chatAccess.canChat) {
      return 'Chat with supplier (contact request approved)';
    }

    return this.chatAccess.reason || 'Contact request required to chat';
  }

  // Check if user can chat with this supplier
  checkChatAccess() {
    if (!this.service?.supplier?._id) return;

    this.checkingChatAccess = true;
    this.contactChatService
      .checkChatAccess(this.service.supplier._id)
      .subscribe({
        next: (access) => {
          this.chatAccess = access;
          this.checkingChatAccess = false;
          console.log('Chat access checked:', access);
        },
        error: (error) => {
          console.error('Error checking chat access:', error);
          this.checkingChatAccess = false;
          this.chatAccess = { canChat: false, reason: 'Error checking access' };
        },
      });
  }
}
