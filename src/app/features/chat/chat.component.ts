import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { Message } from '../../core/models/chat.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: Message[] = [];
  newMessage = '';
  isLoading = false;
  error = '';
  private subscriptions: Subscription[] = [];

  // Add these properties
  @Input() otherUserId!: string;
  @Input() otherUserName!: string;
  @Input() onClose!: () => void;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef // ✅ Inject it
  ) {}

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      console.error('User not authenticated');
      this.error = 'Authentication required';
      return;
    }

    this.initializeChat();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this.otherUserId || !this.otherUserName) {
        this.error = 'Recipient information missing';
        return;
      }

      this.initializeChat();
    }, 0);
  }

  private initializeChat() {
    this.isLoading = true;
    const currentUserId = this.getCurrentUserId();

    if (!currentUserId || !this.otherUserId) {
      this.error = 'Missing user information';
      this.isLoading = false;
      return;
    }

    // Initialize socket connection
    if (!this.chatService.isSocketConnected()) {
      this.chatService.reinitializeSocket();
    }

    // Join user's room after short delay to ensure socket is connected
    setTimeout(() => {
      this.chatService.joinRoom(currentUserId);
      this.loadMessages();
    }, 1000);

    // Subscribe to new messages
    this.subscriptions.push(
      this.chatService.newMessage$.subscribe((message: Message | null) => {
        if (message) {
          this.handleNewMessage(message);
          this.cdr.detectChanges();
        }
      })
    );
  }

  // Update loadMessages to use otherUserId
  private loadMessages() {
    if (!this.otherUserId) {
      this.error = 'No recipient specified';
      return;
    }

    this.chatService.getConversation(this.otherUserId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.error = 'Failed to load messages';
        this.isLoading = false;
      },
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.otherUserId) return;

    const text = this.newMessage.trim();

    // Send via HTTP
    this.chatService.sendMessage(this.otherUserId, text).subscribe({
      next: (message) => {
        console.log('Message sent successfully:', message);
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.error = 'Failed to send message';
      },
    });

    // Send via Socket
    this.chatService.sendSocketMessage(this.otherUserId, text);

    // Clear input
    this.newMessage = '';
  }

  private handleNewMessage(message: Message) {
    // Avoid duplicates
    if (!this.messages.some((m) => m._id === message._id)) {
      this.messages.push(message);
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      const element = this.messagesContainer?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  // Change getCurrentUserId from private to public
  public getCurrentUserId(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch {
      return null;
    }
  }

  closeChat() {
    if (this.onClose) {
      this.onClose();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.chatService.disconnect();
  }
}
