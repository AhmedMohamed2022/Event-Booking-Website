import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { io } from 'socket.io-client';
import { Message, ActiveChat } from '../models/chat.model';
import { RateLimiterService } from './rate-limiter.service';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socket: any; // Socket.io client instance
  private baseUrl = environment.apiUrl;
  private socketUrl = this.baseUrl.replace('/api', '');
  private messageSubject = new Subject<any>();
  private initialized = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Use root namespace
  private readonly SOCKET_NAMESPACE = '';

  // Public observable for new messages
  public newMessage$ = this.messageSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private rateLimiter: RateLimiterService
  ) {
    if (this.authService.isAuthenticated()) {
      this.initializeSocket();
    }

    this.authService.authChange.subscribe((isAuthenticated: boolean) => {
      if (isAuthenticated) {
        this.initializeSocket();
      } else {
        this.disconnect();
      }
    });
  }

  // Method to reinitialize socket connection
  reinitializeSocket() {
    if (this.socket?.connected) {
      this.socket.disconnect();
    }
    this.initialized = false;
    this.reconnectAttempts = 0;
    this.initializeSocket();
  }

  // Method to check if socket is connected
  isSocketConnected(): boolean {
    const isConnected = this.socket?.connected || false;
    console.log('Socket connection status:', isConnected);
    return isConnected;
  }

  // Method to disconnect socket
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      console.log(
        'Socket disconnected:',
        this.socket.disconnected ? 'successfully' : 'failed'
      );
      this.initialized = false;
      this.reconnectAttempts = 0;
    }
  }

  // Method to connect socket (called from components)
  connectSocket(): boolean {
    console.log('Attempting socket connection to:', this.socketUrl);

    if (!this.authService.isAuthenticated()) {
      console.error('Cannot connect socket: User not authenticated');
      return false;
    }

    if (this.socket?.connected) {
      console.log('Socket already connected, disconnecting first...');
      this.disconnect();
    }

    this.initializeSocket();

    // Return connection status after a brief delay to allow connection to establish
    return this.isSocketConnected();
  }

  initializeSocket() {
    try {
      // Get token
      const token = this.authService.getToken();
      console.log(
        'Initializing socket with token:',
        token ? 'Present' : 'Missing'
      );

      if (!token) {
        console.error('Cannot initialize socket: No authentication token');
        return;
      }

      // Disconnect existing socket if any
      this.disconnect();

      // Set socket URL
      const socketUrl = this.socketUrl;
      console.log('Socket URL:', socketUrl);

      // Create new socket connection with auth token
      this.socket = io(socketUrl, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        path: '/socket.io',
      });

      // Setup socket event listeners
      this.setupSocketListeners();

      // Set initialization flag
      this.initialized = true;
      this.reconnectAttempts = 0;
    } catch (error) {
      this.handleSocketError('Socket initialization error', error);
    }
  }

  private handleSocketError(context: string, error: any) {
    console.error(`Socket Error (${context}):`, error);

    // Log additional details for debugging
    console.log('Socket state:', {
      initialized: this.initialized,
      connected: this.socket?.connected,
      reconnectAttempts: this.reconnectAttempts,
      url: this.socketUrl,
    });

    // Check if token is still valid
    const token = this.authService.getToken();
    if (!token) {
      console.error('Socket error may be due to missing authentication token');
    }
  }

  private setupSocketListeners() {
    if (!this.socket) {
      console.error('Cannot setup listeners: Socket not initialized');
      return;
    }

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected successfully. Socket ID:', this.socket.id);
      console.log('Connection details:', this.socket.io.engine);
      this.reconnectAttempts = 0;
    });

    this.socket.on('connect_error', (error: any) => {
      this.handleSocketError('Connection error', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error(
          `Failed to connect after ${this.maxReconnectAttempts} attempts`
        );
        this.socket.disconnect();
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('error', (error: any) => {
      this.handleSocketError('Socket error', error);
    });

    // Message events
    this.socket.on('receiveMessage', (message: any) => {
      console.log('Message received via receiveMessage event:', message);
      this.messageSubject.next(message);
    });

    this.socket.on('message', (message: any) => {
      console.log('Message received via message event:', message);
      this.messageSubject.next(message);
    });

    this.socket.on('messageSent', (message: any) => {
      console.log('Message sent confirmation received:', message);
      this.messageSubject.next(message);
    });

    this.socket.on('newMessage', (message: any) => {
      console.log('New message received via newMessage event:', message);
      this.messageSubject.next(message);
    });
  }

  joinRoom(userId: string) {
    if (this.socket && this.socket.connected) {
      console.log('Joining room for user:', userId);
      this.socket.emit('join', userId);
    } else {
      console.warn('Cannot join room: Socket not connected');
      // Try to reconnect
      this.reinitializeSocket();

      // Try joining again after a longer delay to ensure connection is established
      setTimeout(() => {
        if (this.socket && this.socket.connected) {
          console.log('Retrying join room for user:', userId);
          this.socket.emit('join', userId);
        } else {
          console.warn(
            'Still cannot join room after retry: Socket not connected'
          );
          // One final attempt with even longer delay
          setTimeout(() => {
            if (this.socket && this.socket.connected) {
              console.log('Final attempt to join room for user:', userId);
              this.socket.emit('join', userId);
            } else {
              console.error('Failed to join room after multiple attempts');
            }
          }, 3000);
        }
      }, 2000);
    }
  }

  // Get conversation history
  getConversation(userId: string): Observable<Message[]> {
    const endpoint = `/chat/${userId}`;

    if (!this.rateLimiter.canMakeCall(endpoint)) {
      return throwError(
        () =>
          new Error(
            'Rate limit exceeded. Please wait before making more requests.'
          )
      );
    }

    this.rateLimiter.recordCall(endpoint);

    return this.http.get<Message[]>(`${this.baseUrl}/chat/${userId}`).pipe(
      catchError((error) => {
        if (error.status === 429) {
          this.rateLimiter.recordFailedCall(endpoint);
        }
        return throwError(() => error);
      })
    );
  }

  // Send message through HTTP
  sendMessage(to: string, text: string): Observable<Message> {
    const endpoint = '/chat';

    if (!this.rateLimiter.canMakeCall(endpoint)) {
      return throwError(
        () =>
          new Error(
            'Rate limit exceeded. Please wait before making more requests.'
          )
      );
    }

    this.rateLimiter.recordCall(endpoint);

    return this.http.post<Message>(`${this.baseUrl}/chat`, { to, text }).pipe(
      catchError((error) => {
        if (error.status === 429) {
          this.rateLimiter.recordFailedCall(endpoint);
        }
        return throwError(() => error);
      })
    );
  }

  // Send message through socket
  sendSocketMessage(message: any) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Cannot send message: Socket not connected');
      this.reinitializeSocket();
      setTimeout(() => this.retrySendMessage(message), 2000);
      return;
    }

    console.log('Sending message via socket:', message);
    this.socket.emit('sendMessage', message);
    this.socket.emit('message', message);
  }

  private retrySendMessage(message: any, attempts = 0) {
    if (attempts >= 3) {
      console.error('Failed to send message after multiple attempts');
      return;
    }

    if (this.socket && this.socket.connected) {
      console.log(`Retry attempt ${attempts + 1}: Sending message via socket`);
      this.socket.emit('sendMessage', message);
      this.socket.emit('message', message);
    } else if (attempts < 2) {
      console.log(
        `Socket still not connected. Scheduling retry attempt ${
          attempts + 2
        }...`
      );
      setTimeout(() => this.retrySendMessage(message, attempts + 1), 2000);
    }
  }

  // Method to get socket state for debugging
  getSocketState() {
    return {
      initialized: this.initialized,
      connected: this.socket?.connected || false,
      reconnectAttempts: this.reconnectAttempts,
      url: this.socketUrl,
    };
  }

  // Get active chats
  getActiveChats(): Observable<ActiveChat[]> {
    const endpoint = '/chat/active';

    if (!this.rateLimiter.canMakeCall(endpoint)) {
      return throwError(
        () =>
          new Error(
            'Rate limit exceeded. Please wait before making more requests.'
          )
      );
    }

    this.rateLimiter.recordCall(endpoint);

    return this.http.get<ActiveChat[]>(`${this.baseUrl}/chat/active`).pipe(
      catchError((error) => {
        if (error.status === 429) {
          this.rateLimiter.recordFailedCall(endpoint);
        }
        return throwError(() => error);
      })
    );
  }
}
