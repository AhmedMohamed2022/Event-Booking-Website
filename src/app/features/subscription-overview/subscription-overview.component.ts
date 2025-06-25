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

    const contactLimit = this.subscription.plan === 'premium' ? 100 : 10;
    const contactsUsed = Math.round(
      (this.stats.usagePercentage / 100) * contactLimit
    );

    this.overviewModel = {
      contactsUsed,
      contactLimit,
      type: this.subscription.plan,
      expiryDate: this.subscription.endDate,
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
      this.subscriptionService.renewSubscription().subscribe({
        next: (updated) => {
          this.subscription = updated;
          this.tryBuildOverviewModel();
          // Show success message
        },
        error: (err) => {
          console.error('Renewal error:', err);
          // Show error message
        },
      });
    }
  }
}
