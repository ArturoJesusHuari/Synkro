import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../storage/storage.service'; // 👈 Importa correctamente

@Injectable()
export class UsersService {
    constructor(
        private readonly dbService: DatabaseService,
        private readonly storageService: StorageService, // Servicio de Supabase Storage
    ) {}

    /** Obtener contactos con URL del avatar */
    async getContacts(userId: string) {
        const { data, error } = await this.dbService.getClient()
            .from('profiles')
            .select('id, username, avatar, info')
            .neq('id', userId);

        if (error) throw new Error(error.message);
        return data.map(user => ({
            ...user,
            avatar: user.avatar ? this.storageService.getPublicUrl('avatars', user.avatar) : null
        }));
    }

    /** 🔎 Buscar contactos */
    async searchUsers(query: string) {
        const { data, error } = await this.dbService.getClient()
            .from('profiles')
            .select('id, username, avatar, info')
            .ilike('username', `%${query}%`);

        if (error) throw new Error(error.message);

        return data.map(user => ({
            ...user,
            avatar: user.avatar ? this.storageService.getPublicUrl('avatars', user.avatar) : null
        }));
    }

    /** Obtener perfil del usuario */
    async getProfile(userId: string) {
        const { data, error } = await this.dbService.getClient()
            .from('profiles')
            .select('id, username, avatar, info')
            .eq('id', userId)
            .single();
        if (error) throw new Error(error.message);
        return {
            ...data,
            avatar: data.avatar ? this.storageService.getPublicUrl('avatars', data.avatar) : null
        };
    }

    /** Actualizar perfil */
    async updateProfile(userId: string, info: string, avatarFile?: Express.Multer.File) {
        let avatarPath = '';
    
        // Verificar si hay una nueva imagen antes de subir
        if (avatarFile) {
            // Obtener el perfil actual para eliminar la imagen anterior
            const existingProfile = await this.getProfile(userId);
            if (existingProfile.avatar) {
                const oldAvatarPath = existingProfile.avatar.split('/avatars/')[1]; // Extraer solo el nombre del archivo
                await this.storageService.deleteFile('avatars', oldAvatarPath); // Eliminar la imagen anterior
            }
    
            // Subir la nueva imagen y obtener el path
            avatarPath = await this.storageService.uploadFile('avatars', avatarFile, `${userId}-${Date.now()}`);
        }
    
        const updateData: any = { info };
        if (avatarPath) updateData.avatar = avatarPath;
    
        // Actualizar en la base de datos
        const { data, error } = await this.dbService.getClient()
            .from('profiles')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();
    
        if (error) throw new Error(error.message);
    
        return {
            ...data,
            avatar: data.avatar ? this.storageService.getPublicUrl('avatars', data.avatar) : null
        };
    }
}
