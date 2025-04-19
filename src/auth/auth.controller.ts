import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(
    @Body() body: { email: string; username: string; password: string },
  ) {
    if (!body || !body.email || !body.username || !body.password) {
      throw new Error('Missing email, username or password in the request body');
    }
    return this.authService.register(body.email, body.username, body.password);
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
  logout(@Body() body: { refreshToken: string }) {
    return this.authService.logout(body.refreshToken);
  }



}
