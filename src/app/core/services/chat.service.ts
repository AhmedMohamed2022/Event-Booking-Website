import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client'; // Changed this line
import { Message, ActiveChat } from '../models/chat.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socket!: Socket;
  private baseUrl = environment.apiUrl;
  private messageSubject = new BehaviorSubject<Message | null>(null);
  private isInitialized = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Add namespace
  private readonly SOCKET_NAMESPACE = '/chat';

  // Rename messages$ to newMessage$ to match usage
  newMessage$ = this.messageSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    // Subscribe to both user and token changes
    this.authService.token$.subscribe((token) => {
      if (token && !this.isInitialized) {
        this.initializeSocket();
      } else if (!token) {
        this.disconnect();
      }
    });
  }

  public initializeSocket() {
    const token = this.authService.getToken();

    if (!token) {
      console.warn('No authentication token available, waiting for token...');
      return;
    }

    // Add additional logging
    console.log(
      'Initializing socket with token:',
      token ? 'Present' : 'Missing'
    );

    try {
      if (this.socket?.connected) {
        console.log('Socket already connected, disconnecting first...');
        this.socket.disconnect();
      }

      // Ensure baseUrl ends with /chat namespace
      const socketUrl = `${this.baseUrl}${this.SOCKET_NAMESPACE}`;
      console.log('Connecting to socket URL:', socketUrl);

      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 5000,
        path: '/socket.io', // Add explicit path
        autoConnect: true,
        forceNew: true, // Force new connection
      });

      this.setupSocketListeners();
      this.isInitialized = true;
    } catch (error) {
      console.error('Socket initialization error:', error);
      this.handleSocketError(error);
    }
  }

  public reinitializeSocket() {
    if (this.socket?.connected) {
      this.socket.disconnect();
    }
    this.isInitialized = false;
    this.reconnectAttempts = 0;
    this.initializeSocket();
  }

  public connectSocket() {
    const token = this.authService.getToken();
    if (!token) {
      console.warn('No token available for socket connection');
      return;
    }

    try {
      // Ensure baseUrl ends with /chat namespace
      const socketUrl = `${this.baseUrl}${this.SOCKET_NAMESPACE}`;
      console.log('Attempting socket connection to:', socketUrl);

      if (this.socket?.connected) {
        console.log('Socket already connected, disconnecting first...');
        this.socket.disconnect();
      }

      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 5000,
        path: '/socket.io', // Add explicit path
        autoConnect: true,
        forceNew: true, // Force new connection
      });

      this.setupSocketListeners();
      this.isInitialized = true;
    } catch (error) {
      console.error('Socket connection error:', error);
      this.handleSocketError(error);
    }
  }

  private handleSocketError(error: any) {
    console.error('Detailed socket error:', {
      error,
      socketState: {
        isConnected: this.socket?.connected,
        namespace: this.SOCKET_NAMESPACE,
        url: this.baseUrl,
        attempts: this.reconnectAttempts,
      },
    });
  }

  private setupSocketListeners() {
    if (!this.socket) {
      console.warn('Socket not initialized in setupSocketListeners');
      return;
    }

    this.socket.on('connect', () => {
      console.log('Socket connected successfully. Socket ID:', this.socket.id);
      console.log('Connection details:', {
        namespace: this.SOCKET_NAMESPACE,
        transport: this.socket.io.engine.transport.name,
      });
      this.reconnectAttempts = 0;
      this.isInitialized = true;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      console.log('Connection attempt details:', {
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
        url: this.baseUrl + this.SOCKET_NAMESPACE,
      });

      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isInitialized = false;

      if (reason === 'io server disconnect') {
        // Server forced disconnect, try reconnecting
        this.reconnectAttempts = 0;
        this.initializeSocket();
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('receiveMessage', (message: Message) => {
      console.log('Received message:', message);
      this.messageSubject.next(message);
    });

    this.socket.on('messageSent', (message: Message) => {
      console.log('Message sent confirmation:', message);
      this.messageSubject.next(message);
    });
  }

  joinRoom(userId: string) {
    if (this.socket) {
      this.socket.emit('join', userId);
    }
  }

  // Get conversation history
  getConversation(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/chat/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  }

  // Send message through HTTP
  sendMessage(to: string, text: string): Observable<Message> {
    return this.http.post<Message>(
      `${this.baseUrl}/chat`,
      { to, text },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
  }

  // Send message through socket
  sendSocketMessage(to: string, text: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('sendMessage', { to, text });
    }
  }

  public isSocketConnected(): boolean {
    const isConnected = this.socket?.connected || false;
    console.log('Socket connection status:', isConnected);
    return isConnected;
  }

  // Update disconnect method
  public disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.isInitialized = false;
      this.reconnectAttempts = 0;
    }
  }

  // Add method to check socket state
  public getSocketState() {
    return {
      isConnected: this.socket?.connected || false,
      isInitialized: this.isInitialized,
      reconnectAttempts: this.reconnectAttempts,
      namespace: this.SOCKET_NAMESPACE,
    };
  }

  // Add getActiveChats method
  getActiveChats(): Observable<ActiveChat[]> {
    return this.http.get<ActiveChat[]>(`${this.baseUrl}/chat/active`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  }
}
