import {
  Injectable,
  UnauthorizedException,
  ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as process from 'node:process';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(email: string, username: string, password: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      throw new ConflictException('Email ou pseudo déjà utilisé.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    const isAlreadyLoggedIn = await this.prisma.refreshToken.findFirst({
      where: { userId: user.id },
    })

    if (isAlreadyLoggedIn) {
      throw new ConflictException('Utilisateur déjà connecté');
    }

    // Supprimer tous les anciens refresh tokens avant d'en générer un nouveau
    await this.prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    // Créer un nouveau refresh token
    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: expiresAt,
      },
    });

    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwt.signAsync(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  async refreshAccessToken(refreshToken: string) {

    const token = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: token.userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const newAccessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });

    return { accessToken: newAccessToken };
  }

  async logout(refreshToken: string) {
    const deletedToken = await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    if (deletedToken.count === 0) {
      throw new BadRequestException('Refresh token invalide') 
    }

    return { message: 'Déconnexion réussie' };
  }
}
