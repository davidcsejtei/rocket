import { Module } from '@nestjs/common';
import { WebSocketGatewayService } from './websocket.gateway';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [KafkaModule],
  providers: [WebSocketGatewayService],
})
export class WebSocketModule {}