import { Injectable } from '@nestjs/common';
import { StorageService } from 'src/storage/storage.service';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ChatService {
    constructor(private readonly dbService: DatabaseService, private readonly storageService: StorageService,) { }

    async getChats(userId: string) {
        const { data, error } = await this.dbService.getClient()
            .from('user_chats')
            .select('chat_id, deleted_at')
            .eq('user_id', userId)
            .is('deleted_at', null) // 🔥 Excluir chats eliminados
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        // 🔹 Obtener datos adicionales de cada chat
        const chatData = await Promise.all(
            data.map(async (chat) => {
                // Buscar el otro usuario en `user_chats`
                const { data: usersInChat } = await this.dbService.getClient()
                    .from('user_chats')
                    .select('user_id')
                    .eq('chat_id', chat.chat_id)
                    .neq('user_id', userId) // Excluir al usuario actual
                    .single();

                if (!usersInChat) return null; // Ignorar chats sin otro usuario

                // Buscar perfil del otro usuario
                const { data: profile } = await this.dbService.getClient()
                    .from('profiles')
                    .select('username, avatar')
                    .eq('id', usersInChat.user_id)
                    .single();

                if (!profile) return null; // Ignorar chats sin perfil asociado

                // 🔹 Obtener el último mensaje del chat
                const { data: lastMessage } = await this.dbService.getClient()
                    .from('messages')
                    .select('content, is_read, created_at, type_message, sender_id')
                    .eq('chat_id', chat.chat_id)
                    .gt('created_at', chat.deleted_at || '1970-01-01') // 🔥 Excluir mensajes eliminados
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();


                // 🔹 Contar los mensajes no leídos
                const { count: unreadCount } = await this.dbService.getClient()
                    .from('messages')
                    .select('id', { count: 'exact' }) // 🔥 Contar mensajes
                    .eq('chat_id', chat.chat_id)
                    .eq('is_read', false) // Solo mensajes no leídos
                    .neq('sender_id', userId); // Que no sean enviados por el usuario

                return {
                    chat_id: chat.chat_id,
                    type_message: lastMessage ? lastMessage.type_message : null,
                    username: profile?.username || null,
                    avatar: this.storageService.getPublicUrl('avatars', profile.avatar) || null,
                    lastMessage: lastMessage ? lastMessage.content : null,
                    lastSender: lastMessage ? lastMessage.sender_id : null,
                    unreadCount: unreadCount || 0, // 🔥 Si no hay mensajes no leídos, devolver 0
                    lastMessageAt: lastMessage ? lastMessage.created_at : null
                };
            })
        );

        return chatData.filter(chat => chat !== null); // 🔥 Filtrar chats válidos
    }

    async getMessages(chatId: string, userId: string, cursor?: string, limit = 20) {
        const { data: userChat, error: userChatError } = await this.dbService.getClient()
            .from('user_chats')
            .select('deleted_at')
            .eq('chat_id', chatId)
            .eq('user_id', userId)
            .single();

        if (userChatError || !userChat) throw new Error("Chat not found for this user");

        let query = this.dbService.getClient()
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .gt('created_at', userChat.deleted_at || '1970-01-01') // 🔥 Filtrar mensajes nuevos
            .order('created_at', { ascending: false })
            .limit(limit);

        if (cursor) {
            query = query.lt('created_at', cursor);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        // 🔹 2. Marcar como leídos los mensajes recibidos
        const unreadMessages = data.filter(msg => msg.sender_id !== userId && !msg.is_read);
        if (unreadMessages.length > 0) {
            await this.dbService.getClient()
                .from('messages')
                .update({ is_read: true })
                .eq('chat_id', chatId)
                .neq('sender_id', userId)
                .eq('is_read', false);
        }
        console.log(data)
        return data;
    }

    /** Enviar un mensaje */
    async sendMessage(chatId: string, senderId: string, content: string) {
        const { data, error } = await this.dbService.getClient()
            .from('messages')
            .insert([{ chat_id: chatId, sender_id: senderId, content }])
            .select('*')
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    /** Marcar chat como eliminado para un usuario */
    async deleteChat(userId: string, chatId: string) {
        const { data, error } = await this.dbService.getClient()
            .from('user_chats')
            .update({ deleted_at: new Date().toISOString() })
            .eq('chat_id', chatId)
            .eq('user_id', userId)
            .select('*')
            .single();

        if (error) throw new Error(error.message);
        return { message: "Chat deleted for user", data };
    }

    /** Obtener o crear un chat entre dos usuarios */
    async getOrCreateChat(user1: string, user2: string) {
        // 1. Buscar si ya existe un chat entre estos usuarios
        const { data: existingChats, error } = await this.dbService.getClient()
            .from('user_chats')
            .select('chat_id')
            .in('user_id', [user1, user2]); // Busca chats donde cualquiera de los 2 esté

        if (error) {
            throw new Error(error.message);
        }

        // Filtrar un chat donde estén AMBOS usuarios
        const chatCount = existingChats.reduce((acc, chat) => {
            acc[chat.chat_id] = (acc[chat.chat_id] || 0) + 1;
            return acc;
        }, {});

        const existingChatId = Object.keys(chatCount).find(chatId => chatCount[chatId] === 2);

        if (existingChatId) {
            return { chat_id: existingChatId };
        }

        // Si no existe, crearlo
        const { data: newChat, error: chatError } = await this.dbService.getClient()
            .from('chats')
            .insert([{ created_at: new Date().toISOString() }])
            .select('id')
            .single();

        if (chatError) throw new Error(chatError.message);

        // Asociar usuarios con el nuevo chat
        await this.dbService.getClient()
            .from('user_chats')
            .insert([
                { chat_id: newChat.id, user_id: user1 },
                { chat_id: newChat.id, user_id: user2 }
            ]);

        return { chat_id: newChat.id };
    }

    async markMessagesAsRead(chatId: string, userId: string) {

        const { error, data } = await this.dbService.getClient()
            .from('messages')
            .update({ is_read: true })
            .eq('id', chatId)
            .neq('sender_id', userId)
            .or('is_read.eq.false,is_read.is.null')

        if (error) {
            return { success: false, message: error.message };
        }
        return {
            success: true,
            message: "Mensaje marcados como leídos"
        };
    }

    /** Obtener el usuario con el que se tiene un chat */
    async getChatUser(chatId: string, userId: string) {
        const { data: usersInChat, error } = await this.dbService.getClient()
            .from('user_chats')
            .select('user_id')
            .eq('chat_id', chatId)
            .neq('user_id', userId) // Excluir al usuario actual
            .single();

        if (error || !usersInChat) {
            throw new Error('No se encontró el usuario en el chat');
        }

        // Buscar perfil del otro usuario
        const { data: profile, error: profileError } = await this.dbService.getClient()
            .from('profiles')
            .select('id, username, avatar')
            .eq('id', usersInChat.user_id)
            .single();

        if (profileError || !profile) {
            throw new Error('Perfil del usuario no encontrado');
        }

        profile.avatar = this.storageService.getPublicUrl('avatars', profile.avatar) || null;

        return profile;
    }

    async sendImage(chatId: string, senderId: string, file?: Express.Multer.File) {
        if (!file) throw new Error('No se proporcionó ninguna imagen.');

        // 🔥 Generar un nombre único para la imagen
        const fileExt = file.originalname.split('.').pop();
        const fileName = `chat_${chatId}_${crypto.randomUUID()}.${fileExt}`;
        const filePath = `chats/${chatId}/${fileName}`; // 🔥 Carpeta organizada por chat

        // 🔹 Subir la imagen a Supabase Storage
        const { data, error } = await this.dbService.getClient().storage
            .from('chat-images') // Nombre del bucket en Supabase
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) throw new Error(`Error al subir la imagen: ${error.message}`);

        // 🔹 Obtener la URL de la imagen subida
        const { data: publicUrl } =  this.dbService.getClient().storage
            .from('chat-images')
            .getPublicUrl(filePath);

        if (!publicUrl) throw new Error('No se pudo obtener la URL de la imagen.');

        const { data: message, error: msgError } = await this.dbService.getClient()
            .from('messages')
            .insert([{ chat_id: chatId, sender_id: senderId, content: publicUrl.publicUrl , is_file: true, type_message: "IMAGE"}])
            .select('*')
            .single();

        if (msgError) throw new Error(`Error al guardar el mensaje: ${msgError.message}`);

        return message;
    }

    async sendFile(chatId: string, senderId: string, file?: Express.Multer.File) {
        if (!file) throw new Error('No se proporcionó ningún archivo.');
    
        // 🔥 Generar un nombre único para el archivo
        const fileExt = file.originalname.split('.').pop();
        const fileName = `chat_${chatId}_${crypto.randomUUID()}.${fileExt}`;
        const filePath = `chats/${chatId}/${fileName}`; // 🔥 Carpeta organizada por chat
    
        // 🔹 Determinar el bucket según el tipo de archivo
        const bucketName = "chat-files";
    
        // 🔹 Subir el archivo a Supabase Storage
        const { data, error } = await this.dbService.getClient().storage
            .from(bucketName) // Nombre del bucket en Supabase
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });
    
        if (error) throw new Error(`Error al subir el archivo: ${error.message}`);
    
        // 🔹 Obtener la URL pública del archivo
        const { data: publicUrl } = this.dbService.getClient().storage
            .from(bucketName)
            .getPublicUrl(filePath);
    
        if (!publicUrl) throw new Error('No se pudo obtener la URL del archivo.');
    
        // 🔹 Determinar el tipo de mensaje
        const typeMessage = file.mimetype.startsWith("image") ? "IMAGE" : "FILE";
    
        // 🔹 Guardar el mensaje en la base de datos
        const { data: message, error: msgError } = await this.dbService.getClient()
            .from('messages')
            .insert([{ chat_id: chatId, sender_id: senderId, content: publicUrl.publicUrl, is_file: true, type_message: typeMessage }])
            .select('*')
            .single();
    
        if (msgError) throw new Error(`Error al guardar el mensaje: ${msgError.message}`);
    
        return message;
    }
    
}
