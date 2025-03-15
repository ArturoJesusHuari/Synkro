import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { DatabaseModule } from '../database/database.module'; // 👈 Importar DatabaseModule
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, ConfigModule], // 👈 Asegúrate de importar ConfigModule también
  providers: [StorageService],
  exports: [StorageService], // 👈 Exportar StorageService para que otros módulos puedan usarlo
})
export class StorageModule {}
