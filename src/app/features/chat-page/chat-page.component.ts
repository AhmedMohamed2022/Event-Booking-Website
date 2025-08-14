import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  HostListener,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { Message } from '../../core/models/chat.model';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.css'],
  imports: [NgIf, NgFor, NgClass, DatePipe, FormsModule],
  standalone: true,
})
export class ChatPageComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  otherUserId!: string;
  otherUserName!: string;
  messages: Message[] = [];
  newMessage = '';
  loading = false;
  error = '';
  private messageSubscription!: Subscription;
  private processedMessageIds = new Set<string>();

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  @HostListener('keydown.enter', ['$event'])
  onEnterKey(event: KeyboardEvent): void {
    event.preventDefault();
    if (this.newMessage.trim()) {
      this.sendMessage();
    }
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    this.route.params.subscribe((params) => {
      this.otherUserId = params['userId'];
      this.initializeChat();
    });

    this.route.queryParams.subscribe((queryParams) => {
      this.otherUserName = queryParams['userName'] || 'User';
    });
  }

  private initializeChat(): void {
    if (!this.chatService.isSocketConnected()) {
      console.log('Socket not connected, initializing...');
      this.chatService.reinitializeSocket();
      setTimeout(() => this.setupChatRoom(), 1000);
    } else {
      this.setupChatRoom();
    }

    this.loadConversation();
  }

  private setupChatRoom(): void {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      this.error = 'Unable to determine current user';
      return;
    }

    console.log('Joining room with user ID:', currentUserId);
    this.chatService.joinRoom(currentUserId);

    this.messageSubscription = this.chatService.newMessage$.subscribe(
      (message: any) => {
        if (message) {
          console.log('New message received in component:', message);

          if (
            (message.from === this.otherUserId &&
              message.to === currentUserId) ||
            (message.from === currentUserId && message.to === this.otherUserId)
          ) {
            const messageExists = this.messages.some(
              (m) => m._id === message._id
            );

            if (!messageExists && !this.processedMessageIds.has(message._id)) {
              this.processedMessageIds.add(message._id);
              this.messages.push(message);
              this.scrollToBottom();
              console.log('New message added to conversation:', message._id);
            } else {
              console.log('Duplicate message skipped:', message._id);
            }
          }
        }
      },
      (error: any) => {
        console.error('Error in message subscription:', error);
        this.error = 'Error receiving messages';
      }
    );
  }

  loadConversation(): void {
    this.loading = true;
    this.error = '';

    this.chatService.getConversation(this.otherUserId).subscribe(
      (messages) => {
        console.log('Conversation loaded:', messages);
        this.messages = messages;
        messages.forEach((msg) => this.processedMessageIds.add(msg._id));
        this.loading = false;
        this.scrollToBottom();
      },
      (error) => {
        console.error('Error loading conversation:', error);
        this.error = 'Failed to load conversation';
        this.loading = false;
      }
    );
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      this.error = 'Unable to determine current user';
      return;
    }

    const messageText = this.newMessage.trim();
    this.newMessage = '';

    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }

    this.chatService.sendMessage(this.otherUserId, messageText).subscribe(
      (message) => {
        console.log('Message sent via HTTP:', message);
        this.processedMessageIds.add(message._id);
      },
      (error) => {
        console.error('Error sending message via HTTP:', error);
        this.error = 'Failed to send message';
        this.newMessage = messageText;
      }
    );
  }

  getCurrentUserId(): string | null {
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      return user.id;
    }

    const token = this.authService.getToken();
    if (!token) return null;

    try {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.id || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  ngOnDestroy(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }
}
