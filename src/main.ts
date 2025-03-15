import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "*", 
    methods: "GET,POST,PUT,DELETE",  // Métodos HTTP permitidos
    allowedHeaders: 'Content-Type, Authorization, user-id', // Cabeceras permitidas
  });

  await app.listen(3000);
}
bootstrap();

