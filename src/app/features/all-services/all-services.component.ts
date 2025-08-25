import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  EVENT_CATEGORIES,
  getServiceIconClass,
  CATEGORY_TO_SUBCATEGORY_FALLBACK,
  CategoryConfig,
} from '../../core/models/constants/categories.const';
import { TranslationService } from '../../core/services/translation.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-all-services',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <section class="services-section py-5">
      <div class="container">
        <div class="text-center mb-5">
          <h2 class="section-title">{{ 'home.allServices' | translate }}</h2>
          <p class="section-subtitle text-muted">
            {{ 'home.allServicesSubtitle' | translate }}
          </p>
        </div>
        <div class="row g-4">
          <div
            class="col-6 col-md-4 col-lg-3"
            *ngFor="let category of eventCategories"
          >
            <div
              class="service-card text-center"
              (click)="selectCategory(category.value)"
            >
              <div class="service-icon">
                <i [class]="getCategoryIcon(category.value)"></i>
              </div>
              <h6 class="service-title">{{ category.label }}</h6>
              <div class="service-count">
                {{ category.subcategories.length }}
                {{ 'home.services' | translate }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['../home/home.component.css'],
})
export class AllServicesComponent implements OnInit, OnDestroy {
  eventCategories: CategoryConfig[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private translationService: TranslationService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.updateTranslations();
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateTranslations();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateTranslations() {
    this.eventCategories = this.translationService.getTranslatedCategories();
  }

  getCategoryIcon(categoryValue: string): string {
    return getServiceIconClass(categoryValue);
  }

  selectCategory(categoryValue: string) {
    const fallbackSub = CATEGORY_TO_SUBCATEGORY_FALLBACK[categoryValue];
    const queryParams = fallbackSub
      ? { subcategory: fallbackSub }
      : { category: categoryValue };
    this.router.navigate(['/search-results'], { queryParams });
  }
}
