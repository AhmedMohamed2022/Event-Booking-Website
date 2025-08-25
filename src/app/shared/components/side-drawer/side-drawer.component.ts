import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-side-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="drawer-backdrop" *ngIf="open" (click)="onBackdropClick()"></div>
    <aside class="side-drawer" [class.open]="open" tabindex="-1" #drawer>
      <button
        class="drawer-close"
        (click)="close.emit()"
        aria-label="Close menu"
      >
        &times;
      </button>
      <ng-content></ng-content>
    </aside>
  `,
  styles: [
    `
      .drawer-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(44, 44, 44, 0.4);
        z-index: 1040;
        transition: opacity 0.3s;
      }
      .side-drawer {
        position: fixed;
        top: 0;
        right: 0;
        width: 80vw;
        max-width: 340px;
        height: 100vh;
        background: #fff;
        box-shadow: -2px 0 16px rgba(0, 0, 0, 0.12);
        z-index: 1050;
        transform: translateX(100%);
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        padding: 2rem 1.5rem 1.5rem 1.5rem;
        outline: none;
      }
      .side-drawer.open {
        transform: translateX(0);
      }
      .drawer-close {
        background: none;
        border: none;
        font-size: 2rem;
        color: var(--accent-gold);
        align-self: flex-end;
        cursor: pointer;
        margin-bottom: 1.5rem;
        transition: color 0.2s;
      }
      .drawer-close:hover {
        color: #a88a2a;
      }
    `,
  ],
})
export class SideDrawerComponent implements AfterViewInit {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    if (this.open) {
      this.focusDrawer();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.open) this.close.emit();
  }

  onBackdropClick() {
    this.close.emit();
  }

  private focusDrawer() {
    const drawer: HTMLElement | null =
      this.el.nativeElement.querySelector('.side-drawer');
    if (drawer) drawer.focus();
  }
}
