import { Controller, Get, Post, Body, Param, Query, Headers, BadRequestException, NotFoundException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ChatService } from './chat.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    /** 📜 Listar chats */
    @Get('chats')
    getChats(@Headers('user-id') userId: string) {
        return this.chatService.getChats(userId);
    }

    /** Obtener mensajes de un chat con paginación */
    @Get('messages/:chatId')
    getMessages(
        @Param('chatId') chatId: string,
        @Headers('user-id') userId: string,  // 🔥 Asegurar que el usuario se identifica
        @Query('cursor') cursor?: string,
        @Query('limit') limit = '20'
    ) {
        return this.chatService.getMessages(chatId, userId, cursor, parseInt(limit));
    }

    /** Enviar un mensaje en un chat existente */
    @Post('send')
    async sendMessage(
        @Body('chatId') chatId: string,
        @Headers('user-id') senderId: string,
        @Body('content') content: string
    ) {
        if (!chatId || !senderId || !content) {
            throw new BadRequestException('chatId, senderId y content son obligatorios');
        }

        try {
            return await this.chatService.sendMessage(chatId, senderId, content);
        } catch (error) {
            if (error.message === 'The specified chat does not exist') {
                throw new NotFoundException('The specified chat does not exist');
            }
            throw new BadRequestException(error.message);
        }
    }

    /** Obtener o crear un chat entre dos usuarios */
    @Post('chats')
    getOrCreateChat(
        @Headers('user-id') user1: string,
        @Body('user2') user2: string
    ) {
        if (user1 != user2) {
            return this.chatService.getOrCreateChat(user1, user2);
        } else {
            throw new BadRequestException("You can't start a chat with yourself");
        }
    }

    @Post('mark-as-read/:chatId')
    async markAsRead(
        @Param('chatId') chatId: string,
        @Headers('user-id') userId: string
    ) {
        return this.chatService.markMessagesAsRead(chatId, userId);
    }

    /** Obtener el usuario con el que se tiene un chat */
    @Get('user/:chatId')
    async getChatUser(
        @Param('chatId') chatId: string,
        @Headers('user-id') userId: string
    ) {
        return this.chatService.getChatUser(chatId, userId);
    }

    @Post('send-image/:chatId')
    @UseInterceptors(FileInterceptor('file')) // 🔥 Habilitar subida de archivos
    async sendImage(
        @Param('chatId') chatId: string,
        @Headers('user-id') senderId: string,
        @UploadedFile() file?: Express.Multer.File
    ) {
        return this.chatService.sendImage(chatId, senderId, file);
    }

    @Post('send-file/:chatId')
    @UseInterceptors(FileInterceptor('file')) // 🔥 Habilitar subida de archivos
    async sendFile(
        @Param('chatId') chatId: string,
        @Headers('user-id') senderId: string,
        @UploadedFile() file?: Express.Multer.File
    ) {
        return this.chatService.sendFile(chatId, senderId, file);
    }


}
