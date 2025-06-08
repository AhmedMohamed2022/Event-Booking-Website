import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { EventItemService } from '../../core/services/event-item.service';
import { EventItem } from '../../core/models/event-item.model';

@Component({
  selector: 'app-view-service',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './view-service.component.html',
  styleUrls: ['./view-service.component.css'],
})
export class ViewServiceComponent implements OnInit {
  service: EventItem | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private eventItemService: EventItemService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadService(id);
    }
  }

  loadService(id: string) {
    this.isLoading = true;
    this.error = null;

    this.eventItemService.getEventItemById(id).subscribe({
      next: (data) => {
        this.service = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load service details';
        this.isLoading = false;
        console.error('Service loading error:', error);
      },
    });
  }

  deleteService() {
    if (!this.service?._id) return;

    if (
      confirm(
        'Are you sure you want to delete this service? This action cannot be undone.'
      )
    ) {
      this.eventItemService.deleteEventItem(this.service._id).subscribe({
        next: () => {
          alert('Service deleted successfully');
          this.router.navigate(['/supplier-dashboard']);
        },
        error: (error) => {
          alert('Failed to delete service');
          console.error('Delete error:', error);
        },
      });
    }
  }

  formatCurrency(amount: number): string {
    return `${amount} JD`;
  }
}
