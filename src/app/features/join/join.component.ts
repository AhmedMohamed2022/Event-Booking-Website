import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { JoinService } from '../../core/services/join.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { JoinStatus } from '../../core/models/join.model';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.css'],
})
export class JoinComponent {
  joinForm: FormGroup;
  isSubmitting = false;
  showSuccess = false;
  showError = false;
  errorMessage = '';

  cities = [
    { value: 'Amman', label: 'Amman' },
    { value: 'Irbid', label: 'Irbid' },
    { value: 'Zarqa', label: 'Zarqa' },
    { value: 'Aqaba', label: 'Aqaba' },
    { value: 'Salt', label: 'Salt' },
    { value: 'Madaba', label: 'Madaba' },
    { value: 'Karak', label: 'Karak' },
    { value: 'Tafilah', label: 'Tafilah' },
  ];

  serviceTypes = [
    { value: 'Hall', label: 'Hall' },
    { value: 'Decoration', label: 'Decoration' },
    { value: 'Sound', label: 'Sound' },
    { value: 'Photography', label: 'Photography' },
    { value: 'Catering', label: 'Catering' },
    { value: 'Music', label: 'Music' },
    { value: 'Planning', label: 'Event Planning' },
    { value: 'Other', label: 'Other' },
  ];

  constructor(
    private fb: FormBuilder,
    private joinService: JoinService,
    private authService: AuthService,
    private router: Router
  ) {
    this.joinForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^((?:(?:\+962|0)(?:7(?:7|8|9)))|(?:7(?:7|8|9)))\d{7}$/
          ),
        ],
      ],
      city: ['', Validators.required],
      serviceType: ['', Validators.required],
      notes: [''],
    });
  }

  onSubmit() {
    if (this.joinForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.hideAlerts();

      this.joinService.submitJoinRequest(this.joinForm.value).subscribe({
        next: (response) => {
          this.showSuccess = true;
          this.joinForm.reset();
          this.isSubmitting = false;
        },
        error: (error) => {
          this.showError = true;
          this.errorMessage =
            error.error?.message ||
            'Failed to submit request. Please try again.';
          this.isSubmitting = false;
        },
      });
    }
  }

  hideAlerts() {
    this.showSuccess = false;
    this.showError = false;
  }

  getFieldError(fieldName: string): string {
    const field = this.joinForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength'])
        return `${fieldName} must be at least 2 characters`;
      if (field.errors['pattern'])
        return 'Please enter a valid Jordanian phone number';
    }
    return '';
  }

  // Add helper method to explain format
  getPhoneHint(): string {
    return 'Enter your number in any format: 07X XXX XXXX, 7X XXX XXXX, or +962 7X XXX XXXX';
  }

  checkJoinStatus(): void {
    const phone = this.joinForm.get('phone')?.value;
    if (!phone) return;

    if (this.authService.getCurrentUser()?.role === 'supplier') {
      this.router.navigate(['/supplier-dashboard']);
    } else {
      this.joinService.checkStatus(phone).subscribe({
        next: (status: JoinStatus) => {
          if (status === 'pending') {
            this.showPendingMessage();
          } else if (status === 'approved') {
            this.showApprovedMessage();
          }
        },
        error: (error) => {
          this.showError = true;
          this.errorMessage = error.error?.message || 'Failed to check status';
        },
      });
    }
  }

  showPendingMessage() {
    this.showSuccess = true;
    this.errorMessage = 'Your request is pending approval.';
  }

  showApprovedMessage() {
    this.showSuccess = true;
    this.errorMessage = 'Your request has been approved.';
  }
}
