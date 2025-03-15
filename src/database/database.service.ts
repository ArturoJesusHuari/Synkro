import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService {
    private supabase: SupabaseClient;

    constructor(private configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL') ?? '';
        const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY') ?? '';
        
        this.supabase = createClient(
            supabaseUrl,
            supabaseAnonKey,
        );

    }

    getClient(): SupabaseClient {
        return this.supabase;
    }
}
