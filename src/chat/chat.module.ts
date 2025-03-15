import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { StorageModule } from '../storage/storage.module';
import { DatabaseService } from '../database/database.service';

@Module({
    imports: [StorageModule],
    controllers: [ChatController],
    providers: [ChatService, DatabaseService],
})
export class ChatModule {}
