import { ref, reactive } from 'vue';
import { io, Socket } from 'socket.io-client';
import type { ConnectionState, ConnectionStatus, ServerMessage } from '@/types/websocket.types';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatInterval: number | null = null;

  public connectionStatus = reactive<ConnectionStatus>({
    state: 'disconnected',
    reconnectAttempts: 0,
  });

  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;
  private readonly heartbeatInterval_ms = 30000;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.updateConnectionState('connecting');

    const serverUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000';
    
    this.socket = io(serverUrl, {
      timeout: 5000,
      reconnection: false,
      transports: ['websocket', 'polling'],
      forceNew: true,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.updateConnectionState('disconnected');
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.updateConnectionState('connected');
      this.connectionStatus.connectedAt = new Date();
      this.connectionStatus.reconnectAttempts = 0;
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason: string) => {
      this.updateConnectionState('disconnected');
      this.connectionStatus.disconnectedAt = new Date();
      
      if (reason === 'io server disconnect') {
        this.connectionStatus.lastError = 'Server disconnected';
      } else {
        this.attemptReconnection();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      this.updateConnectionState('error');
      this.connectionStatus.lastError = error.message;
      this.attemptReconnection();
    });

    this.socket.on('connection-established', (data: ServerMessage) => {
      console.log('Connection established:', data);
    });

    this.socket.on('pong', (data: ServerMessage) => {
      console.log('Heartbeat received:', data);
    });
  }

  private updateConnectionState(state: ConnectionState): void {
    this.connectionStatus.state = state;
  }

  private attemptReconnection(): void {
    if (this.connectionStatus.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateConnectionState('error');
      this.connectionStatus.lastError = 'Max reconnection attempts reached';
      return;
    }

    if (this.reconnectTimer) {
      return;
    }

    this.updateConnectionState('reconnecting');
    this.connectionStatus.reconnectAttempts++;

    const delay = this.reconnectDelay * Math.pow(2, this.connectionStatus.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, this.heartbeatInterval_ms);
  }

  getUptime(): string {
    if (!this.connectionStatus.connectedAt || this.connectionStatus.state !== 'connected') {
      return '0s';
    }

    const uptimeMs = Date.now() - this.connectionStatus.connectedAt.getTime();
    const seconds = Math.floor(uptimeMs / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds}s`;
  }
}

export const websocketService = new WebSocketService();