import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseService } from '../database/database.service';
import { StorageModule } from '../storage/storage.module'; // 👈 Asegúrate de importar el módulo

@Module({
  imports: [StorageModule], // 👈 Importa el módulo que contiene StorageService
  providers: [UsersService, DatabaseService],
  controllers: [UsersController],
})
export class UsersModule {}
