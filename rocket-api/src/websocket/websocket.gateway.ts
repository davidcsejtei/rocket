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
import { TelemetryMessage, KafkaStatus } from '../types/telemetry.types';

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

  constructor(private readonly kafkaService: KafkaService) {}

  afterInit(): void {
    this.kafkaService.onTelemetryMessage((message: TelemetryMessage) => {
      this.server.emit('telemetry-data', message);
    });

    this.kafkaService.onStatusChange((status: KafkaStatus) => {
      this.server.emit('kafka-status', status);
    });

    setInterval(() => {
      this.server.emit('kafka-status', this.kafkaService.getStatus());
    }, 5000);

    this.logger.log('WebSocket Gateway initialized with Kafka integration');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection-established', {
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });

    client.emit('kafka-status', this.kafkaService.getStatus());
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
}