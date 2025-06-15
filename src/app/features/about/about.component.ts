import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <section class="about-section py-5">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <h1 class="text-center mb-4">{{ 'about.title' | translate }}</h1>
            <div class="card shadow-sm">
              <div class="card-body">
                <h5 class="mb-4">{{ 'about.mission.title' | translate }}</h5>
                <p>{{ 'about.mission.description' | translate }}</p>

                <h5 class="mb-4 mt-5">
                  {{ 'about.whatWeDo.title' | translate }}
                </h5>
                <div class="row g-4">
                  <div
                    class="col-md-6"
                    *ngFor="
                      let feature of 'about.whatWeDo.features' | translate
                    "
                  >
                    <div class="feature-card p-4 bg-light rounded">
                      <i [class]="feature.icon"></i>
                      <h6 class="mt-3">{{ feature.title }}</h6>
                      <p class="text-muted small">{{ feature.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .feature-card {
        transition: transform 0.3s ease;
      }
      .feature-card:hover {
        transform: translateY(-5px);
      }
    `,
  ],
})
export class AboutComponent {}
