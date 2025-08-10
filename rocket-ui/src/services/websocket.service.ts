import { ref, reactive } from 'vue';
import { io, Socket } from 'socket.io-client';
import type { ConnectionState, ConnectionStatus, ServerMessage } from '@/types/websocket.types';
import type { TelemetryMessage, KafkaStatus } from '@/types/telemetry.types';
import type { AnomalyAlert, AnomalyStatus } from '@/types/anomaly.types';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatInterval: number | null = null;

  public connectionStatus = reactive<ConnectionStatus>({
    state: 'disconnected',
    reconnectAttempts: 0,
  });

  public kafkaStatus = reactive<KafkaStatus>({
    state: 'disconnected',
    messagesReceived: 0,
  });

  public telemetryMessages = ref<TelemetryMessage[]>([]);
  private readonly maxMessages = 15;

  public anomalyStatus = reactive<AnomalyStatus>({
    state: 'disconnected',
    anomaliesReceived: 0,
  });

  public recentAnomalies = ref<AnomalyAlert[]>([]);
  public allAnomalies = ref<AnomalyAlert[]>([]);
  private readonly maxRecentAnomalies = 10;
  private readonly maxAllAnomalies = 50;

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
      this.requestKafkaStatus();
    });

    this.socket.on('disconnect', (reason: string) => {
      this.updateConnectionState('disconnected');
      this.connectionStatus.disconnectedAt = new Date();
      this.kafkaStatus.state = 'disconnected';
      this.anomalyStatus.state = 'disconnected';
      
      if (reason === 'io server disconnect') {
        this.connectionStatus.lastError = 'Server disconnected';
      } else {
        this.attemptReconnection();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      this.updateConnectionState('error');
      this.connectionStatus.lastError = error.message;
      this.kafkaStatus.state = 'error';
      this.kafkaStatus.lastError = 'API connection failed';
      this.anomalyStatus.state = 'error';
      this.anomalyStatus.lastError = 'API connection failed';
      this.attemptReconnection();
    });

    this.socket.on('connection-established', (data: ServerMessage) => {
      console.log('Connection established:', data);
    });

    this.socket.on('pong', (data: ServerMessage) => {
      console.log('Heartbeat received:', data);
    });

    this.socket.on('kafka-status', (status: KafkaStatus) => {
      Object.assign(this.kafkaStatus, status);
    });

    this.socket.on('telemetry-data', (message: TelemetryMessage) => {
      this.addTelemetryMessage(message);
    });

    this.socket.on('kafka-error', (error: { message: string }) => {
      this.kafkaStatus.state = 'error';
      this.kafkaStatus.lastError = error.message;
    });

    this.socket.on('anomaly-status', (status: AnomalyStatus) => {
      Object.assign(this.anomalyStatus, status);
    });

    this.socket.on('anomaly-alert', (alert: AnomalyAlert) => {
      this.addAnomalyAlert(alert);
    });

    this.socket.on('anomaly-error', (error: { message: string }) => {
      this.anomalyStatus.state = 'error';
      this.anomalyStatus.lastError = error.message;
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

  private addTelemetryMessage(message: TelemetryMessage): void {
    this.telemetryMessages.value.unshift(message);
    
    if (this.telemetryMessages.value.length > this.maxMessages) {
      this.telemetryMessages.value = this.telemetryMessages.value.slice(0, this.maxMessages);
    }
  }

  requestKafkaStatus(): void {
    if (this.socket?.connected) {
      this.socket.emit('get-kafka-status');
    }
  }

  private addAnomalyAlert(alert: AnomalyAlert): void {
    // Add to recent anomalies (newest first)
    this.recentAnomalies.value.unshift(alert);
    if (this.recentAnomalies.value.length > this.maxRecentAnomalies) {
      this.recentAnomalies.value = this.recentAnomalies.value.slice(0, this.maxRecentAnomalies);
    }

    // Add to all anomalies (newest first)
    this.allAnomalies.value.unshift(alert);
    if (this.allAnomalies.value.length > this.maxAllAnomalies) {
      this.allAnomalies.value = this.allAnomalies.value.slice(0, this.maxAllAnomalies);
    }
  }

  requestAnomalyStatus(): void {
    if (this.socket?.connected) {
      this.socket.emit('get-anomaly-status');
    }
  }
}

export const websocketService = new WebSocketService();