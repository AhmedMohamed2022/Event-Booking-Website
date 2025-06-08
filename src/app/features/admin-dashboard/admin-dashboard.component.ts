// src/app/features/admin/admin-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { AdminStats, JoinRequest } from '../../core/models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule],
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
    private router: Router
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
    if (confirm('Are you sure you want to approve this supplier?')) {
      this.adminService.approveJoinRequest(request._id).subscribe({
        next: (response) => {
          request.status = 'approved';
          // Show success message to admin
          this.showSuccessMessage(
            `Supplier ${request.name} has been approved successfully. They can now login with their phone number.`
          );
        },
        error: (err) => {
          this.showErrorMessage('Failed to approve supplier request');
          console.error('Approve error:', err);
        },
      });
    }
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

  private showSuccessMessage(message: string): void {
    // Implement your success message logic here
    alert(message);
  }

  private showErrorMessage(message: string): void {
    // Implement your error message logic here
    alert(message);
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.router.navigate(['/']);
    }
  }
}
