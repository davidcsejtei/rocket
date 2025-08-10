export type ConnectionState = 
  | 'connecting'
  | 'connected' 
  | 'disconnected'
  | 'error'
  | 'reconnecting';

export interface ConnectionStatus {
  state: ConnectionState;
  connectedAt?: Date;
  disconnectedAt?: Date;
  reconnectAttempts: number;
  lastError?: string;
}

export interface ServerMessage {
  timestamp: string;
  clientId?: string;
  status?: string;
  serverTime?: string;
}