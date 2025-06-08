export interface Message {
  _id: string;
  from: string;
  to: string;
  text: string;
  createdAt: Date;
}

export interface ChatPreview {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

// Add this interface to match backend response
export interface ActiveChat {
  otherUser: {
    _id: string;
    name: string;
  };
  lastMessage: {
    content: string;
    timestamp: Date;
  };
  unreadCount: number;
}
