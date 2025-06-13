import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  HostListener,
} from '@angular/core';
import { ChatService } from '../../core/services/chat.service';
import { Message } from '../../core/models/chat.model';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [NgIf, NgFor, NgClass, DatePipe, FormsModule],
  standalone: true,
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() otherUserId!: string;
  @Input() otherUserName!: string;
  @Input() onClose!: () => void;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  messages: Message[] = [];
  newMessage = '';
  loading = false;
  error = '';
  private messageSubscription!: Subscription;
  private processedMessageIds = new Set<string>(); // Track processed message IDs

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  // Add event listener for Enter key
  @HostListener('keydown.enter', ['$event'])
  onEnterKey(event: KeyboardEvent): void {
    // Prevent default behavior (form submission)
    event.preventDefault();

    // Send message if not empty
    if (this.newMessage.trim()) {
      this.sendMessage();
    }
  }

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.error = 'You must be logged in to use the chat';
      return;
    }

    // Initialize socket if not already connected
    if (!this.chatService.isSocketConnected()) {
      console.log('Socket not connected, initializing...');
      this.chatService.reinitializeSocket();

      // Add a delay before joining the room to ensure socket is connected
      setTimeout(() => this.setupChatRoom(), 1000);
    } else {
      // Socket is already connected, proceed immediately
      this.setupChatRoom();
    }

    // Load conversation history
    this.loadConversation();
  }

  private setupChatRoom(): void {
    // Get current user ID
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) {
      this.error = 'Unable to determine current user';
      return;
    }

    // Join the room with current user ID
    console.log('Joining room with user ID:', currentUserId);
    this.chatService.joinRoom(currentUserId);

    // Subscribe to new messages
    this.messageSubscription = this.chatService.newMessage$.subscribe(
      (message: any) => {
        if (message) {
          console.log('New message received in component:', message);

          // Only add messages that are part of this conversation
          if (
            (message.from === this.otherUserId &&
              message.to === currentUserId) ||
            (message.from === currentUserId && message.to === this.otherUserId)
          ) {
            // Check if message already exists to avoid duplicates
            if (!this.processedMessageIds.has(message._id)) {
              this.processedMessageIds.add(message._id);
              this.messages.push(message);
              this.scrollToBottom();
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

        // Add all existing message IDs to the processed set
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

    const messageData = {
      from: currentUserId,
      to: this.otherUserId,
      text: this.newMessage,
    };

    // Show optimistic UI update
    const tempMessage: Message = {
      _id: 'temp-' + Date.now(),
      from: currentUserId,
      to: this.otherUserId,
      text: this.newMessage,
      createdAt: new Date(),
    };

    // Add to UI immediately
    this.messages.push(tempMessage);
    const sentMessage = this.newMessage;
    this.newMessage = '';
    this.scrollToBottom();

    // Focus back on input field after sending
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }

    // Send via HTTP
    this.chatService.sendMessage(this.otherUserId, sentMessage).subscribe(
      (message) => {
        console.log('Message sent via HTTP:', message);
        // Add to processed IDs to prevent duplication
        this.processedMessageIds.add(message._id);

        // Replace temp message with real one
        const index = this.messages.findIndex((m) => m._id === tempMessage._id);
        if (index !== -1) {
          this.messages[index] = message;
        }
      },
      (error) => {
        console.error('Error sending message via HTTP:', error);
        this.error = 'Failed to send message';
      }
    );

    // Send via socket with correct message format
    this.chatService.sendSocketMessage(messageData);
  }

  getCurrentUserId(): string | null {
    const token = this.authService.getToken();
    if (!token) return null;

    try {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.userId || decodedToken.id || null;
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

  closeChat(): void {
    if (this.onClose) {
      this.onClose();
    }
  }

  ngOnDestroy(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }
}
