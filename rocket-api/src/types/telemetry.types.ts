export interface TelemetryMessage {
  timestamp: string;
  rocketId: string;
  altitude: number;
  velocity: number;
  fuel: number;
  temperature: number;
  status: 'launching' | 'flight' | 'landing' | 'landed';
}

export type KafkaConnectionState = 
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface KafkaStatus {
  state: KafkaConnectionState;
  connectedAt?: Date;
  disconnectedAt?: Date;
  lastError?: string;
  messagesReceived: number;
}