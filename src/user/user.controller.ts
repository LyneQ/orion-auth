import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, Patch, Put } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/:id')
  async getUserById(
    @Param('id') id: string,
    @Headers('authorization') accessToken: string,
  ) {
    if (!accessToken || accessToken === '') throw new BadRequestException('Access token manquant ou invalide');
    return this.userService.getUserById(id, accessToken.replace('Bearer ', ''));
  }

  @Patch('/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: {
      username?: string;
      email?: string;
      bio?: string;
      firstName?: string;
      lastName?: string;
    },
    @Headers('authorization') accessToken: string,
  ) {
    if ( !accessToken || accessToken === "" ) throw new BadRequestException("Access token manquant ou invalide");
    return this.userService.updateUser(id, body, accessToken.replace('Bearer ', ''));
  }

  @Delete("/")
  async deleteUser(@Headers('authorization') accessToken: string) {
    if ( !accessToken || accessToken === "" ) throw new BadRequestException("Access token manquant ou invalide");
    return this.userService.deleteUser(accessToken.replace('Bearer ', ''));
  }
}
