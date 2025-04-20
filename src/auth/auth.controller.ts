import { Body, Controller, HttpCode, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('avatarUrl', {
    storage: diskStorage({
      destination: './uploads', // dossier local
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        const filename = `${uniqueSuffix}${ext}`;
        callback(null, filename);
      },
    }),
  }))
  async register(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { email: string; username: string; password: string, bio: string, firstName: string, lastName: string },
  ) {

    if (!body || !body.email || !body.username || !body.password || !body.firstName || !body.lastName) {
      throw new Error('Missing email, username or password in the request body');
    }

    const avatarUrl = file.filename;

    return this.authService.register(body.email, body.username, body.password, body.bio, body.firstName, body.lastName, avatarUrl);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    if (!body || !body.email || !body.password) {
      throw new Error('Missing email or password in the request body');
    }
    return this.authService.login(body.email, body.password);
  }

  @Post('refresh')
  async refreshAccessToken(@Body() body: { refreshToken: string }) {
    if (!body || !body.refreshToken) {
      throw new Error('Missing refreshToken in the request body');
    }
    return this.authService.refreshAccessToken(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Body() body: { accessToken: string }) {
    return this.authService.logout(body.accessToken);
  }



}
