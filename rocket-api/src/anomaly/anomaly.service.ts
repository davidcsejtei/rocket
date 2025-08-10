import { Injectable, Logger } from '@nestjs/common';
import { AnomalyAlert, AnomalyStatus, AnomalyConnectionState } from '../types/anomaly.types';

@Injectable()
export class AnomalyService {
  private readonly logger = new Logger(AnomalyService.name);
  private status: AnomalyStatus = {
    state: 'connected',
    anomaliesReceived: 0,
    connectedAt: new Date(),
  };

  private onAnomalyAlertCallback: (alert: AnomalyAlert) => void;
  private onStatusChangeCallback: (status: AnomalyStatus) => void;

  constructor() {
    this.logger.log('Anomaly service initialized');
  }

  processAnomalyAlert(anomaly: AnomalyAlert): void {
    this.status.anomaliesReceived++;
    this.updateStatus(this.status.state);
    this.logger.warn(`Processing anomaly #${this.status.anomaliesReceived}: ${anomaly.anomalyType} (${anomaly.severity}) for rocket ${anomaly.rocketId}`);
    
    if (this.onAnomalyAlertCallback) {
      this.onAnomalyAlertCallback(anomaly);
    }
  }

  private isValidAnomalyAlert(data: any): data is AnomalyAlert {
    const validAnomalyTypes = [
      'engine_underperformance', 'fuel_leak', 'sensor_malfunction',
      'guidance_failure', 'thermal_anomaly', 'engine_shutdown', 'multiple_anomalies'
    ];
    
    const validSeverities = ['low', 'medium', 'high', 'critical'];

    return (
      data &&
      typeof data.alertId === 'string' &&
      typeof data.timestamp === 'string' &&
      typeof data.rocketId === 'string' &&
      typeof data.missionTime === 'number' &&
      validAnomalyTypes.includes(data.anomalyType) &&
      validSeverities.includes(data.severity) &&
      typeof data.affectedParameter === 'string' &&
      typeof data.currentValue === 'number' &&
      typeof data.expectedRange === 'string' &&
      typeof data.description === 'string' &&
      typeof data.originalTelemetry === 'object'
    );
  }

  private updateStatus(state: AnomalyConnectionState): void {
    this.status.state = state;
    
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback({ ...this.status });
    }
  }

  onAnomalyAlert(callback: (alert: AnomalyAlert) => void): void {
    this.onAnomalyAlertCallback = callback;
  }

  onStatusChange(callback: (status: AnomalyStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  getStatus(): AnomalyStatus {
    return { ...this.status };
  }
}