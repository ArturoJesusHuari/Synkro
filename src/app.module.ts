import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // 🔥 Asegurar que ConfigService esté disponible globalmente
import { DatabaseModule } from './database/database.module'; // 🔥 Importar DatabaseModule antes que los demás
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }), // 🔥 Hacer ConfigModule global
        DatabaseModule, // 🔥 Asegurar que DatabaseModule se carga antes
        UsersModule,
        ChatModule,
    ],
})
export class AppModule {}
