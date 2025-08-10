import { TelemetryMessage } from './telemetry.types';

export type AnomalyType = 
  | 'engine_underperformance'
  | 'fuel_leak' 
  | 'sensor_malfunction'
  | 'guidance_failure'
  | 'thermal_anomaly'
  | 'engine_shutdown'
  | 'multiple_anomalies';

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AnomalyAlert {
  alertId: string;
  timestamp: string;
  rocketId: string;
  missionTime: number;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  affectedParameter: string;
  currentValue: number;
  expectedRange: string;
  description: string;
  originalTelemetry: TelemetryMessage;
  totalAnomalies?: number;
}

export type AnomalyConnectionState = 
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface AnomalyStatus {
  state: AnomalyConnectionState;
  connectedAt?: Date;
  disconnectedAt?: Date;
  lastError?: string;
  anomaliesReceived: number;
}