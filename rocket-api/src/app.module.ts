import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebSocketModule } from './websocket/websocket.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [WebSocketModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
