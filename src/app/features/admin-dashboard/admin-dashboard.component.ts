// src/app/features/admin/admin-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { AdminStats, JoinRequest } from '../../core/models/admin.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';
import { ContactMessage } from '../../core/models/contact.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStats | null = null;
  joinRequests: JoinRequest[] = [];
  loading = true;
  error = '';
  selectedTab = 'overview';

  // Update the contact messages property to be an array
  contactMessages: any[] = [];

  // Update the contactInfoArray structure
  contactInfoArray = [
    {
      icon: 'bi bi-geo-alt',
      type: 'address',
    },
    {
      icon: 'bi bi-telephone',
      type: 'phone',
    },
    {
      icon: 'bi bi-envelope',
      type: 'email',
    },
  ];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadContactMessages();
  }

  // Load contact messages
  loadContactMessages() {
    this.adminService.getContactMessages().subscribe({
      next: (response: any) => {
        // Ensure we're getting an array of messages
        this.contactMessages = Array.isArray(response.messages)
          ? response.messages
          : [];
      },
      error: (error) => {
        console.error('Error loading contact messages:', error);
      },
    });
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = '';

    // Use forkJoin to handle multiple requests
    forkJoin({
      stats: this.adminService.getAdminStats(),
      requests: this.adminService.getJoinRequests(),
      messages: this.adminService.getContactMessages(),
    }).subscribe({
      next: (data: any) => {
        this.stats = data.stats;
        this.joinRequests = data.requests;
        // Ensure messages is an array
        this.contactMessages = Array.isArray(data.messages.messages)
          ? data.messages.messages
          : [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard data';
        this.loading = false;
        console.error('Dashboard error:', err);
      },
    });
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
  }

  approveRequest(request: JoinRequest): void {
    this.translate
      .get('adminDashboard.requests.confirmation.approve')
      .subscribe((msg: string) => {
        if (confirm(msg)) {
          this.adminService.approveJoinRequest(request._id).subscribe({
            next: (response) => {
              request.status = 'approved';
              this.translate
                .get('adminDashboard.requests.confirmation.success.approved', {
                  name: request.name,
                })
                .subscribe((successMsg: string) => {
                  this.showSuccessMessage(successMsg);
                });
            },
            error: (err) => {
              this.translate
                .get('adminDashboard.requests.confirmation.error.approve')
                .subscribe((errorMsg: string) => {
                  this.showErrorMessage(errorMsg);
                });
            },
          });
        }
      });
  }

  rejectRequest(request: JoinRequest): void {
    this.adminService.rejectJoinRequest(request._id).subscribe({
      next: (response) => {
        request.status = 'rejected';
        alert('Request rejected successfully');
      },
      error: (err) => {
        alert('Failed to reject request');
        console.error('Reject error:', err);
      },
    });
  }

  markAsReviewed(request: JoinRequest): void {
    this.adminService.markAsReviewed(request._id).subscribe({
      next: (response) => {
        request.status = 'reviewed';
        alert('Request marked as reviewed');
      },
      error: (err) => {
        alert('Failed to update request');
        console.error('Review error:', err);
      },
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge bg-warning text-dark';
      case 'reviewed':
        return 'badge bg-info';
      case 'approved':
        return 'badge bg-success';
      case 'rejected':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getPendingRequests(): JoinRequest[] {
    return this.joinRequests.filter((req) => req.status === 'pending');
  }

  getReviewedRequests(): JoinRequest[] {
    return this.joinRequests.filter((req) => req.status === 'reviewed');
  }

  logout() {
    this.translate
      .get('adminDashboard.header.logoutConfirm')
      .subscribe((msg: string) => {
        if (confirm(msg)) {
          this.authService.logout();
          this.router.navigate(['/']);
        }
      });
  }

  private showSuccessMessage(message: string): void {
    // Replace plain alerts with proper UI notifications
    const notification = document.createElement('div');
    notification.className = 'alert alert-success';
    notification.textContent = message;
    // Add to DOM and remove after timeout
  }

  private showErrorMessage(message: string): void {
    // Replace plain alerts with proper UI notifications
    const notification = document.createElement('div');
    notification.className = 'alert alert-danger';
    notification.textContent = message;
    // Add to DOM and remove after timeout
  }

  // Add method to unlock suppliers
  // unlockSupplier(supplierId: string): void {
  //   this.adminService.unlockSupplier(supplierId).subscribe({
  //     next: () => {
  //       this.loadDashboardData(); // Refresh data
  //       this.showSuccessMessage('Supplier unlocked successfully');
  //     },
  //     error: (err) => {
  //       this.showErrorMessage('Failed to unlock supplier');
  //     },
  //   });
  // }
  // Add property to track unlocking state
  unlockingSupplier: string | null = null;

  // Update unlockSupplier method
  unlockSupplier(supplierId: string): void {
    if (this.unlockingSupplier) return;

    this.unlockingSupplier = supplierId;
    this.adminService.unlockSupplier(supplierId).subscribe({
      next: () => {
        // Remove supplier from locked list
        if (this.stats?.lockedSuppliers) {
          this.stats.lockedSuppliers = this.stats.lockedSuppliers.filter(
            (s) => s._id !== supplierId
          );
        }
        this.showSuccessMessage(
          this.translate.instant('adminDashboard.locked.success')
        );
        this.unlockingSupplier = null;
      },
      error: (err) => {
        console.error('Unlock error:', err);
        this.showErrorMessage(
          this.translate.instant('adminDashboard.locked.error')
        );
        this.unlockingSupplier = null;
      },
    });
  }
  // Add new methods
  getMessageStatusBadge(status: string): string {
    return `badge ${
      status === 'pending' ? 'bg-warning text-dark' : 'bg-success'
    }`;
  }

  viewMessageDetails(message: ContactMessage): void {
    const details = `
      ${this.translate.instant('adminDashboard.messages.table.name')}: ${
      message.name
    }
      ${this.translate.instant('adminDashboard.messages.table.email')}: ${
      message.email
    }
      ${this.translate.instant('adminDashboard.messages.table.message')}:
      ${message.message}
    `;
    // Replace with proper modal implementation
    alert(details);
  }

  markMessageAsRead(message: ContactMessage): void {
    // You'll need to add this method to your AdminService
    this.adminService.markContactMessageAsRead(message._id).subscribe({
      next: () => {
        message.status = 'read';
        this.showSuccessMessage(
          this.translate.instant('adminDashboard.messages.marked.success')
        );
      },
      error: (err) => {
        this.showErrorMessage(
          this.translate.instant('adminDashboard.messages.marked.error')
        );
      },
    });
  }
}
