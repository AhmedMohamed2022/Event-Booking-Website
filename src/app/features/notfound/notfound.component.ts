import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="not-found-section py-5">
      <div class="container text-center">
        <div class="row justify-content-center">
          <div class="col-lg-6">
            <h1 class="display-1 text-warning">404</h1>
            <h2 class="mb-4">{{ 'notFound.title' | translate }}</h2>
            <p class="text-muted mb-4">
              {{ 'notFound.description' | translate }}
            </p>
            <a routerLink="/" class="btn btn-warning">
              {{ 'notFound.backHome' | translate }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .not-found-section {
        min-height: 70vh;
        display: flex;
        align-items: center;
      }
    `,
  ],
})
export class NotFoundComponent {}
