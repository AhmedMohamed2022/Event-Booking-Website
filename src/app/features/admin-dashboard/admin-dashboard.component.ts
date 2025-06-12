// src/app/features/admin/admin-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { AdminStats, JoinRequest } from '../../core/models/admin.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';

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

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = '';

    // Load admin stats
    this.adminService.getAdminStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard data';
        this.loading = false;
        console.error('Dashboard error:', err);
      },
    });

    // Load join requests
    this.adminService.getJoinRequests().subscribe({
      next: (requests) => {
        this.joinRequests = requests;
      },
      error: (err) => {
        console.error('Join requests error:', err);
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
}
