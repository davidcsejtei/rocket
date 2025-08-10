import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, KafkaMessage } from 'kafkajs';
import { TelemetryMessage, KafkaStatus, KafkaConnectionState } from '../types/telemetry.types';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private status: KafkaStatus = {
    state: 'disconnected',
    messagesReceived: 0,
  };

  private onTelemetryMessageCallback: (message: TelemetryMessage) => void;
  private onStatusChangeCallback: (status: KafkaStatus) => void;

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'rocket-api',
      brokers,
    });

    this.consumer = this.kafka.consumer({
      groupId: process.env.KAFKA_CONSUMER_GROUP || 'rocket-api-consumers',
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
      this.logger.log('Attempting to connect to Kafka...');
      
      await this.consumer.connect();
      this.logger.log('Kafka consumer connected, subscribing to topic...');
      
      await this.consumer.subscribe({ topic: 'rocket-telemetry', fromBeginning: false });
      this.logger.log('Subscribed to rocket-telemetry topic');
      
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          await this.processMessage(message);
        },
      });

      this.updateStatus('connected');
      this.status.connectedAt = new Date();
      this.status.lastError = undefined;
      this.logger.log('Kafka consumer is now running and ready to receive messages');
      
    } catch (error) {
      this.logger.error('Failed to connect to Kafka:', error.message);
      this.updateStatus('error');
      this.status.lastError = `Connection failed: ${error.message}`;
      
      setTimeout(() => {
        this.logger.log('Retrying Kafka connection in 5 seconds...');
        this.connect();
      }, 5000);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.consumer.disconnect();
      this.updateStatus('disconnected');
      this.status.disconnectedAt = new Date();
      this.logger.log('Disconnected from Kafka');
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka:', error);
    }
  }

  private async processMessage(message: KafkaMessage): Promise<void> {
    try {
      const messageValue = message.value?.toString();
      if (!messageValue) return;

      const telemetryData: TelemetryMessage = JSON.parse(messageValue);
      
      if (this.isValidTelemetryMessage(telemetryData)) {
        this.status.messagesReceived++;
        this.updateStatus(this.status.state);
        this.logger.debug(`Processed telemetry message #${this.status.messagesReceived} from rocket ${telemetryData.rocketId}`);
        
        if (this.onTelemetryMessageCallback) {
          this.onTelemetryMessageCallback(telemetryData);
        }
      } else {
        this.logger.warn('Invalid telemetry message format:', messageValue);
      }
    } catch (error) {
      this.logger.error('Error processing Kafka message:', error);
    }
  }

  private isValidTelemetryMessage(data: any): data is TelemetryMessage {
    return (
      data &&
      typeof data.timestamp === 'string' &&
      typeof data.rocketId === 'string' &&
      typeof data.missionTime === 'number' &&
      typeof data.stage === 'number' &&
      ['prelaunch', 'ascent', 'coasting', 'descent', 'landed', 'abort'].includes(data.status) &&
      typeof data.altitude === 'number' &&
      typeof data.velocity === 'number' &&
      typeof data.acceleration === 'number' &&
      typeof data.machNumber === 'number' &&
      typeof data.pitch === 'number' &&
      typeof data.yaw === 'number' &&
      typeof data.roll === 'number' &&
      typeof data.fuelRemaining === 'number' &&
      typeof data.fuelMass === 'number' &&
      typeof data.thrust === 'number' &&
      typeof data.burnRate === 'number' &&
      typeof data.engineEfficiency === 'number' &&
      typeof data.engineTemp === 'number' &&
      typeof data.airDensity === 'number' &&
      typeof data.dragForce === 'number' &&
      typeof data.totalMass === 'number' &&
      typeof data.thrustToWeight === 'number' &&
      typeof data.apogee === 'number' &&
      typeof data.sensorNoise === 'number' &&
      typeof data.guidanceError === 'number' &&
      typeof data.fuelLeakRate === 'number' &&
      typeof data.activeAnomalies === 'number'
    );
  }

  private updateStatus(state: KafkaConnectionState): void {
    this.status.state = state;
    
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback({ ...this.status });
    }
  }

  onTelemetryMessage(callback: (message: TelemetryMessage) => void): void {
    this.onTelemetryMessageCallback = callback;
  }

  onStatusChange(callback: (status: KafkaStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }

  getStatus(): KafkaStatus {
    return { ...this.status };
  }
}