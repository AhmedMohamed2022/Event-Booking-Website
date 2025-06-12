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
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  EVENT_CATEGORIES,
  CategoryConfig,
} from '../../core/models/constants/categories.const';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
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

  categories: CategoryConfig[] = EVENT_CATEGORIES;
  showOtherServiceInput = false;

  constructor(
    private fb: FormBuilder,
    private joinService: JoinService,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
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
      otherServiceType: [''],
      notes: [''],
    });

    // Watch for serviceType changes
    this.joinForm.get('serviceType')?.valueChanges.subscribe((value) => {
      this.showOtherServiceInput = value === 'other';
      if (this.showOtherServiceInput) {
        this.joinForm
          .get('otherServiceType')
          ?.setValidators([Validators.required]);
      } else {
        this.joinForm.get('otherServiceType')?.clearValidators();
      }
      this.joinForm.get('otherServiceType')?.updateValueAndValidity();
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
      if (field.errors['required']) {
        return this.translate.instant('join.form.validation.required', {
          field: this.translate.instant(`join.form.labels.${fieldName}`),
        });
      }
      if (field.errors['minlength']) {
        return this.translate.instant('join.form.validation.minLength', {
          field: this.translate.instant(`join.form.labels.${fieldName}`),
          count: 2,
        });
      }
      if (field.errors['pattern']) {
        return this.translate.instant('join.form.validation.phoneInvalid');
      }
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
    this.errorMessage = this.translate.instant('join.status.pending');
  }

  showApprovedMessage() {
    this.showSuccess = true;
    this.errorMessage = this.translate.instant('join.status.approved');
  }
}
