import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <section class="terms-section py-5">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <h1 class="text-center mb-4">{{ 'terms.title' | translate }}</h1>
            <div class="card shadow-sm">
              <div class="card-body">
                <div *ngFor="let section of 'terms.sections' | translate">
                  <h5 class="mb-3">{{ section.title }}</h5>
                  <p class="mb-4">{{ section.content }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class TermsComponent {}
