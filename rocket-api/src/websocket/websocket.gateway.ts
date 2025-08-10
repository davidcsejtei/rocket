import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { AnomalyService } from '../anomaly/anomaly.service';
import { TelemetryMessage, KafkaStatus } from '../types/telemetry.types';
import { AnomalyAlert, AnomalyStatus } from '../types/anomaly.types';

@WebSocketGateway({
  cors: {
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class WebSocketGatewayService implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('WebSocketGateway');

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly anomalyService: AnomalyService
  ) {}

  afterInit(): void {
    this.kafkaService.onTelemetryMessage((message: TelemetryMessage) => {
      this.server.emit('telemetry-data', message);
    });

    this.kafkaService.onAnomalyMessage((anomaly: AnomalyAlert) => {
      this.logger.log(`Broadcasting anomaly alert from Kafka: ${anomaly.anomalyType} (${anomaly.severity})`);
      this.server.emit('anomaly-alert', anomaly);
      this.anomalyService.processAnomalyAlert(anomaly);
    });

    this.kafkaService.onStatusChange((status: KafkaStatus) => {
      this.server.emit('kafka-status', status);
    });

    this.anomalyService.onAnomalyAlert((alert: AnomalyAlert) => {
      this.server.emit('anomaly-alert', alert);
    });

    this.anomalyService.onStatusChange((status: AnomalyStatus) => {
      this.server.emit('anomaly-status', status);
    });

    setInterval(() => {
      this.server.emit('kafka-status', this.kafkaService.getStatus());
      this.server.emit('anomaly-status', this.anomalyService.getStatus());
    }, 5000);

    this.logger.log('WebSocket Gateway initialized with Kafka and Anomaly integration');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection-established', {
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });

    client.emit('kafka-status', this.kafkaService.getStatus());
    client.emit('anomaly-status', this.anomalyService.getStatus());
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): void {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('get-status')
  handleGetStatus(client: Socket): void {
    client.emit('status-update', {
      status: 'connected',
      serverTime: new Date().toISOString(),
      clientId: client.id,
    });
  }

  @SubscribeMessage('get-kafka-status')
  handleGetKafkaStatus(client: Socket): void {
    client.emit('kafka-status', this.kafkaService.getStatus());
  }

  @SubscribeMessage('get-anomaly-status')
  handleGetAnomalyStatus(client: Socket): void {
    client.emit('anomaly-status', this.anomalyService.getStatus());
  }
}