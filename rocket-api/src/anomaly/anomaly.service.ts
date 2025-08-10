import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, KafkaMessage } from 'kafkajs';
import { AnomalyAlert, AnomalyStatus, AnomalyConnectionState } from '../types/anomaly.types';

@Injectable()
export class AnomalyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnomalyService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private status: AnomalyStatus = {
    state: 'disconnected',
    anomaliesReceived: 0,
  };

  private onAnomalyAlertCallback: (alert: AnomalyAlert) => void;
  private onStatusChangeCallback: (status: AnomalyStatus) => void;

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'rocket-api-anomalies',
      brokers,
    });

    this.consumer = this.kafka.consumer({
      groupId: process.env.KAFKA_ANOMALY_CONSUMER_GROUP || 'rocket-api-anomaly-consumers',
    });
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    try {
      this.updateStatus('connecting');
      this.logger.log('Attempting to connect to Kafka for anomaly detection...');
      
      await this.consumer.connect();
      this.logger.log('Anomaly consumer connected, subscribing to topic...');
      
      await this.consumer.subscribe({ topic: 'rocket-anomalies', fromBeginning: false });
      this.logger.log('Subscribed to rocket-anomalies topic');
      
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          await this.processAnomalyMessage(message);
        },
      });

      this.updateStatus('connected');
      this.status.connectedAt = new Date();
      this.status.lastError = undefined;
      this.logger.log('Anomaly consumer is now running and ready to receive alerts');
      
    } catch (error) {
      this.logger.error('Failed to connect to Kafka for anomalies:', error.message);
      this.updateStatus('error');
      this.status.lastError = `Anomaly connection failed: ${error.message}`;
      
      setTimeout(() => {
        this.logger.log('Retrying anomaly Kafka connection in 5 seconds...');
        this.connect();
      }, 5000);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
      this.updateStatus('disconnected');
      this.status.disconnectedAt = new Date();
      this.logger.log('Disconnected from anomaly Kafka consumer');
    } catch (error) {
      this.logger.error('Error disconnecting from anomaly Kafka consumer:', error);
    }
  }

  private async processAnomalyMessage(message: KafkaMessage): Promise<void> {
    try {
      const messageValue = message.value?.toString();
      if (!messageValue) return;

      const anomalyAlert: AnomalyAlert = JSON.parse(messageValue);
      
      if (this.isValidAnomalyAlert(anomalyAlert)) {
        this.status.anomaliesReceived++;
        this.updateStatus(this.status.state);
        this.logger.warn(`Anomaly detected #${this.status.anomaliesReceived}: ${anomalyAlert.anomalyType} (${anomalyAlert.severity}) for rocket ${anomalyAlert.rocketId}`);
        
        if (this.onAnomalyAlertCallback) {
          this.onAnomalyAlertCallback(anomalyAlert);
        }
      } else {
        this.logger.warn('Invalid anomaly alert format:', messageValue);
      }
    } catch (error) {
      this.logger.error('Error processing anomaly message:', error);
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