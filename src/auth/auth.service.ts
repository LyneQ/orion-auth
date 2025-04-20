import {
  Injectable,
  UnauthorizedException,
  ConflictException, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { NotFoundError } from 'rxjs';
import * as process from 'node:process';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {
  }

  private readonly JWT_SECRET = process.env.JWT_SECRET;

  verifyToken(token: string) {
    try {
      return this.jwt.verify(token);
    } catch (err) {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }

  async register(email: string, username: string, password: string, bio: string, firstName: string, lastName: string, avatarUrl: string) {
    const existingUser = await this.prisma.users.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      if (avatarUrl) await unlink(join('__dirname', '..', 'uploads', avatarUrl.split('/').pop() || ''));
      throw new ConflictException('Email ou pseudo déjà utilisé.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.users.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName: firstName,
        lastName: lastName,
        profilePicture: avatarUrl ? join( 'static', avatarUrl) : null,
        bio: bio || null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        bio: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new UnauthorizedException('Email ou mot de passe invalide');
    }

    const isAlreadyLoggedIn = await this.prisma.sessions.findFirst({
      where: { userId: user.id },
    });

    if (isAlreadyLoggedIn) {
      throw new ConflictException('Utilisateur déjà connecté');
    }

    // Supprimer tous les anciens refresh sessions avant d'en générer un nouveau
    await this.prisma.sessions.deleteMany({
      where: { userId: user.id },
    });

    // Créer un nouveau access token
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwt.signAsync(payload);

    // Créer un nouveau refresh token
    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.sessions.create({
      data: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        userId: user.id,
        expiresAt: expiresAt,
      },
    });


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

    const token = await this.prisma.sessions.findUnique({
      where: { refreshToken: refreshToken },
    });

    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: token.userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const newAccessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });

    await this.prisma.sessions.update({
      where: { id: token.id },
      data: {
        accessToken: newAccessToken,
      },
    });

    return { accessToken: newAccessToken };
  }

  async logout(accessToken: string) {

    if (!accessToken) {
      throw new BadRequestException('Access token manquant ou invalide');
    }

    const tokenOwner = await this.prisma.sessions.findUnique({
      where: { accessToken },
    });

    if (!tokenOwner) {
      throw new BadRequestException('Access token introuvable ou déjà invalide');
    }

    await this.prisma.sessions.delete({
      where: { accessToken },
    });

    return { message: 'Déconnexion réussie' };
  }

  async getAuthenticatedUser(accessToken: string) {
    if (!accessToken) {
      throw new BadRequestException('Access token manquant ou invalide');
    }

    const userId = await this.prisma.sessions.findUnique({
      where: { accessToken },
      select: { userId: true },
    });

    if (!userId) {
      throw new NotFoundException('Access token manquant ou invalide');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId!.userId },
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
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }

}
