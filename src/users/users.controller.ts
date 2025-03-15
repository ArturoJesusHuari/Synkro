import { Controller, Get, Query, Headers, Put, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('contacts')
    getContacts(@Headers('user-id') userId: string) {
        return this.usersService.getContacts(userId);
    }

    @Get('search')
    searchUsers(@Query('query') query: string) {
        return this.usersService.searchUsers(query);
    }

    @Get('profile')
    getProfile(@Headers('user-id') userId: string) {
        return this.usersService.getProfile(userId);
    }

    @Put('profile')
    @UseInterceptors(FileInterceptor('avatar')) // Para manejar archivos
    updateProfile(
        @Headers('user-id') userId: string,
        @Body() body: { info: string },
        @UploadedFile() avatarFile?: Express.Multer.File
    ) {
        return this.usersService.updateProfile(userId, body.info, avatarFile);
    }
}
