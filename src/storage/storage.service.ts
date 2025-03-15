import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
    constructor(private readonly dbService: DatabaseService, private configService: ConfigService) {}

    getPublicUrl(bucket: string, path: string) {
        if(!path){
            return null;
        }
        return `${this.configService.get<string>('SUPABASE_URL')}/storage/v1/object/public/${bucket}/${path}`;
    }

    async uploadFile(bucket: string, file: Express.Multer.File, fileName: string) {
        const { data, error } = await this.dbService.getClient().storage.from(bucket).upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true
        });

        if (error) throw new Error(error.message);
        return fileName;
    }
    async deleteFile(bucket: string, filePath: string) {
        const { error } = await this.dbService.getClient().storage.from(bucket).remove([filePath]);
        if (error) throw new Error(`Error al eliminar archivo: ${error.message}`);
    }
}
