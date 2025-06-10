import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Message, ActiveChat } from '../models/chat.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socket!: Socket;
  private baseUrl = environment.apiUrl;
  private messageSubject = new BehaviorSubject<Message | null>(null);

  // Rename messages$ to newMessage$ to match usage
  newMessage$ = this.messageSubject.asObservable();

  constructor(private http: HttpClient) {}

  connectSocket() {
    // Check if socket already exists and is connected
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const token = localStorage.getItem('token');
    console.log(
      'Connecting socket with token:',
      token ? 'Token exists' : 'No token'
    );

    if (!token) {
      console.error('No token available for socket connection');
      return;
    }

    try {
      this.socket = io(this.baseUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('Error creating socket connection:', error);
    }
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
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

  isSocketConnected(): boolean {
    return this.socket?.connected || false;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Add getActiveChats method
  getActiveChats(): Observable<ActiveChat[]> {
    return this.http.get<ActiveChat[]>(`${this.baseUrl}/chat/active`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  }
}
