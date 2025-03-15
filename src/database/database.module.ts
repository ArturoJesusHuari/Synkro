import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';  // 🔥 Asegurar que ConfigService esté disponible
import { DatabaseService } from './database.service';

@Module({
    imports: [ConfigModule.forRoot()], // 🔥 Asegurar que ConfigModule está cargado
    providers: [DatabaseService],
    exports: [DatabaseService],
})
export class DatabaseModule {}
