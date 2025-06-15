import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ContactService } from '../../core/services/contact.service';
import { ContactMessage } from '../../core/models/contact.model';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
})
export class ContactComponent {
  formData: ContactMessage = {
    _id: '',
    name: '',
    email: '',
    message: '',
    status: 'pending',
  };

  isSubmitting = false;
  submitError = '';
  submitSuccess = false;

  contactInfo = [
    {
      icon: 'fas fa-map-marker-alt',
      type: 'address',
    },
    {
      icon: 'fas fa-phone',
      type: 'phone',
    },
    {
      icon: 'fas fa-envelope',
      type: 'email',
    },
  ];

  constructor(
    private contactService: ContactService,
    private translate: TranslateService
  ) {}

  onSubmit(form: NgForm): void {
    if (form.invalid) return;

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = false;

    this.contactService.sendMessage(this.formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        form.resetForm();

        // Show success message
        this.translate
          .get('contact.form.successMessage')
          .subscribe((msg: string) => {
            this.showSuccessMessage(msg);
          });
      },
      error: (error) => {
        this.isSubmitting = false;
        this.translate
          .get('contact.form.errorMessage')
          .subscribe((msg: string) => {
            this.submitError = msg;
            this.showErrorMessage(msg);
          });
        console.error('Contact form error:', error);
      },
    });
  }

  private showSuccessMessage(message: string): void {
    // You can implement a proper notification system here
    const notification = document.createElement('div');
    notification.className =
      'alert alert-success position-fixed top-0 end-0 m-3';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  private showErrorMessage(message: string): void {
    const notification = document.createElement('div');
    notification.className =
      'alert alert-danger position-fixed top-0 end-0 m-3';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}
