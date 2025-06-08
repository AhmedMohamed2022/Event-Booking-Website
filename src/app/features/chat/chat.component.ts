import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
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

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.initializeChat();
  }

  private initializeChat() {
    this.isLoading = true;
    const currentUserId = this.getCurrentUserId();

    if (!currentUserId) {
      this.error = 'User not authenticated';
      return;
    }

    // Connect socket
    this.chatService.connectSocket();

    // Join user's room
    this.chatService.joinRoom(currentUserId);

    // Load conversation history
    this.loadMessages();

    // Subscribe to new messages - Update this line
    this.subscriptions.push(
      this.chatService.newMessage$.subscribe((message: Message | null) => {
        if (message) {
          this.handleNewMessage(message);
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
