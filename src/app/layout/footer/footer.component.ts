import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer mt-auto py-3 bg-light">
      <div class="container text-center">
        <span class="text-muted"
          >© 2024 Event Booking. All rights reserved.</span
        >
      </div>
    </footer>
  `,
})
export class FooterComponent {}
