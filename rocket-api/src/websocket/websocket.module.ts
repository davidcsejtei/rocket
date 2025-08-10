import { Module } from '@nestjs/common';
import { WebSocketGatewayService } from './websocket.gateway';
import { KafkaModule } from '../kafka/kafka.module';
import { AnomalyModule } from '../anomaly/anomaly.module';

@Module({
  imports: [KafkaModule, AnomalyModule],
  providers: [WebSocketGatewayService],
})
export class WebSocketModule {}