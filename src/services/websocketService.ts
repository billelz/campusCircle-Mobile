import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';

// WebSocket URL - derive from API URL
const WS_BASE_URL = 'ws://192.168.1.143:8081/ws';

export interface ChatMessage {
  sender: string;
  recipient: string;
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'FILE';
  timestamp?: string;
}

export interface TypingIndicator {
  sender: string;
  recipient: string;
  isTyping: boolean;
}

export interface ReadReceipt {
  sender: string;
  recipient: string;
  conversationId: string;
}

type MessageCallback = (message: ChatMessage) => void;
type TypingCallback = (data: TypingIndicator) => void;
type ReadReceiptCallback = (data: ReadReceipt) => void;
type ConnectionCallback = (connected: boolean) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private messageCallbacks: Map<string, MessageCallback> = new Map();
  private typingCallbacks: Map<string, TypingCallback> = new Map();
  private readReceiptCallbacks: Map<string, ReadReceiptCallback> = new Map();
  private connectionCallbacks: ConnectionCallback[] = [];
  private username: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  async connect(username: string): Promise<void> {
    if (this.isConnecting || (this.client?.connected && this.username === username)) {
      return;
    }

    this.isConnecting = true;
    this.username = username;

    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      this.client = new Client({
        brokerURL: WS_BASE_URL,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        debug: (str) => {
          console.log('STOMP: ' + str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.subscribeToUserQueues();
          this.notifyConnectionChange(true);
        },
        onDisconnect: () => {
          console.log('WebSocket disconnected');
          this.notifyConnectionChange(false);
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame.headers['message']);
          this.isConnecting = false;
        },
        onWebSocketError: (event) => {
          console.error('WebSocket error:', event);
          this.isConnecting = false;
        },
      });

      this.client.activate();
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  disconnect(): void {
    if (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
      this.client = null;
    }
    this.username = null;
    this.notifyConnectionChange(false);
  }

  private subscribeToUserQueues(): void {
    if (!this.client?.connected || !this.username) return;

    // Subscribe to direct messages
    const messageSub = this.client.subscribe(
      `/user/${this.username}/queue/messages`,
      (message: IMessage) => {
        try {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          this.messageCallbacks.forEach((callback) => callback(chatMessage));
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }
    );
    this.subscriptions.set('messages', messageSub);

    // Subscribe to typing indicators
    const typingSub = this.client.subscribe(
      `/user/${this.username}/queue/typing`,
      (message: IMessage) => {
        try {
          const typingData: TypingIndicator = JSON.parse(message.body);
          this.typingCallbacks.forEach((callback) => callback(typingData));
        } catch (e) {
          console.error('Error parsing typing indicator:', e);
        }
      }
    );
    this.subscriptions.set('typing', typingSub);

    // Subscribe to read receipts
    const readSub = this.client.subscribe(
      `/user/${this.username}/queue/read-receipts`,
      (message: IMessage) => {
        try {
          const readData: ReadReceipt = JSON.parse(message.body);
          this.readReceiptCallbacks.forEach((callback) => callback(readData));
        } catch (e) {
          console.error('Error parsing read receipt:', e);
        }
      }
    );
    this.subscriptions.set('readReceipts', readSub);
  }

  sendMessage(recipient: string, content: string, messageType: string = 'TEXT'): void {
    if (!this.client?.connected) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    const message: ChatMessage = {
      sender: this.username || '',
      recipient,
      content,
      messageType: messageType as 'TEXT' | 'IMAGE' | 'FILE',
      timestamp: new Date().toISOString(),
    };

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(message),
    });
  }

  sendTypingIndicator(recipient: string, isTyping: boolean): void {
    if (!this.client?.connected) return;

    this.client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ recipient, isTyping }),
    });
  }

  sendReadReceipt(recipient: string, conversationId: string): void {
    if (!this.client?.connected) return;

    this.client.publish({
      destination: '/app/chat.read',
      body: JSON.stringify({ recipient, conversationId }),
    });
  }

  // Callback registration
  onMessage(id: string, callback: MessageCallback): void {
    this.messageCallbacks.set(id, callback);
  }

  offMessage(id: string): void {
    this.messageCallbacks.delete(id);
  }

  onTyping(id: string, callback: TypingCallback): void {
    this.typingCallbacks.set(id, callback);
  }

  offTyping(id: string): void {
    this.typingCallbacks.delete(id);
  }

  onReadReceipt(id: string, callback: ReadReceiptCallback): void {
    this.readReceiptCallbacks.set(id, callback);
  }

  offReadReceipt(id: string): void {
    this.readReceiptCallbacks.delete(id);
  }

  onConnectionChange(callback: ConnectionCallback): void {
    this.connectionCallbacks.push(callback);
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => callback(connected));
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
