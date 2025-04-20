import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {AuthService} from '../auth/auth.service';
import * as fs from 'node:fs';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {
  }

  async getUserById(id: string, accessToken: string,) {

    if (!id || id === "") throw new BadRequestException("Id manquant ou invalide");
    if ( !accessToken || accessToken === "" ) throw new BadRequestException("Access token manquant ou invalide");

    const isAuthorized = await this.prisma.sessions.findUnique({
      where: { accessToken: accessToken },
      select: { userId: true, user: true },
    });

    if (!isAuthorized || isAuthorized.user.id !== id)
      throw new UnauthorizedException('Access non autorisé: vous n\'avez pas le droit de modifier cet utilisateur. Veuillez vous connecter avec un autre compte ou contacter un administrateur pour obtenir de l\'aide.');

    const user = await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) throw new BadRequestException("Utilisateur introuvable");
    return user;
  }

  async updateUser(
    id: string,
    data: {
      username?: string;
      email?: string;
      bio?: string;
      firstName?: string;
      lastName?: string;
    },
    accessToken: string,
  ) {

    if (!id || id === "") throw new BadRequestException("Id manquant ou invalide");
    if ( !accessToken || accessToken === "" ) throw new BadRequestException("Access token manquant ou invalide");

    const isAuthorized = await this.prisma.sessions.findUnique({
      where: { accessToken: accessToken },
      select: { userId: true, user: true },
    });

    if (!isAuthorized || isAuthorized.userId !== id)
      throw new UnauthorizedException('Access non autorisé: vous n\'avez pas le droit de modifier cet utilisateur. Veuillez vous connecter avec un autre compte ou contacter un administrateur pour obtenir de l\'aide.');

    const user = await this.prisma.users.findUnique({ where: { id } });

    if (!user) throw new NotFoundException("L'utilisateur existe pas");

    return this.prisma.users.update({
      where: { id },
      data,
    });
  }

  async deleteUser(accessToken: string) {
    const token = accessToken.replace('Bearer ', '');
    const payload = this.authService.verifyToken(token);
    const userId = payload.sub;

    if (!userId) throw new UnauthorizedException("Access token invalide");
    if ( !accessToken || accessToken === "" ) throw new BadRequestException("Access token manquant ou invalide");

    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    const avatarFileName = user.profilePicture ? user.profilePicture.split("\\")[1] : null

    if (avatarFileName) {
      fs.unlinkSync(`./uploads/${avatarFileName}`);
    }

    await this.prisma.users.delete({ where: { id: userId } });

    return { message: 'Compte supprimé avec succès' };
  }

}
