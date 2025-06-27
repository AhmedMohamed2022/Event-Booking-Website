import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../../core/services/subscription.service';
import {
  SupplierSubscription,
  SubscriptionStats,
} from '../../core/models/subscription.model';
import { TranslateModule } from '@ngx-translate/core';

interface SubscriptionOverviewViewModel {
  contactsUsed: number;
  contactLimit: number;
  type: string;
  expiryDate: string;
  status: string;
}

@Component({
  selector: 'app-subscription-overview',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './subscription-overview.component.html',
  styleUrls: ['./subscription-overview.component.css'],
})
export class SubscriptionOverviewComponent implements OnInit {
  subscription?: SupplierSubscription;
  stats?: SubscriptionStats;
  loading = true;
  error = '';

  overviewModel?: SubscriptionOverviewViewModel;

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.loadSubscriptionData();
  }

  private loadSubscriptionData(): void {
    this.loading = true;
    this.error = '';

    this.subscriptionService.getCurrentSubscription().subscribe({
      next: (subscription) => {
        this.subscription = subscription;
        this.tryBuildOverviewModel();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load subscription data';
        this.loading = false;
        console.error('Subscription error:', err);
      },
    });

    this.subscriptionService.getSubscriptionStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.tryBuildOverviewModel();
      },
      error: (err) => {
        console.error('Stats error:', err);
      },
    });
  }

  private tryBuildOverviewModel(): void {
    if (!this.subscription || !this.stats) return;

    const contactLimit = this.stats.maxContacts || 50;
    const contactsUsed = this.stats.currentContacts || 0;

    this.overviewModel = {
      contactsUsed,
      contactLimit,
      type: this.subscription.type,
      expiryDate: this.subscription.expiryDate,
      status: this.subscription.status,
    };
  }

  getProgressBarClass(): string {
    if (!this.stats) return 'bg-secondary';

    const percentage = this.stats.usagePercentage;
    if (percentage > 90) return 'bg-danger';
    if (percentage > 75) return 'bg-warning';
    return 'bg-success';
  }

  handleRenewClick(): void {
    if (confirm('Are you sure you want to renew your subscription?')) {
      const planType = this.subscription?.type || 'basic';
      this.subscriptionService.renewSubscription(planType).subscribe({
        next: (response) => {
          if (response.success && response.subscription) {
            this.subscription = response.subscription;
            this.tryBuildOverviewModel();
            alert('Subscription renewed successfully!');
          } else {
            alert(response.message || 'Failed to renew subscription');
          }
        },
        error: (err) => {
          console.error('Renewal error:', err);
          alert('Failed to renew subscription. Please try again.');
        },
      });
    }
  }

  handlePlanChange(newPlanType: 'basic' | 'premium' | 'enterprise'): void {
    if (confirm(`Are you sure you want to change to ${newPlanType} plan?`)) {
      this.subscriptionService.renewSubscription(newPlanType).subscribe({
        next: (response) => {
          if (response.success && response.subscription) {
            this.subscription = response.subscription;
            this.tryBuildOverviewModel();
            alert(`Successfully changed to ${newPlanType} plan!`);
          } else {
            alert(response.message || 'Failed to change plan');
          }
        },
        error: (err) => {
          console.error('Plan change error:', err);
          alert('Failed to change plan. Please try again.');
        },
      });
    }
  }
}
