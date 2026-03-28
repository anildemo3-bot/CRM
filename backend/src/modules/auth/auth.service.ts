import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(data: any) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new UnauthorizedException('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const orgName = data.organizationName ?? data.orgName ?? 'My Agency';
    const slug = orgName.toLowerCase().replace(/\s+/g, '-');
    
    // Check if slug exists, if so append random string
    const existingOrg = await this.prisma.organization.findUnique({ where: { slug } });
    const finalSlug = existingOrg ? `${slug}-${Math.random().toString(36).substring(7)}` : slug;

    const org = await this.prisma.organization.create({
      data: {
        name: orgName,
        slug: finalSlug,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'ADMIN',
        organizationId: org.id,
      },
    });

    return this.generateTokens(user);
  }

  async changePassword(data: any) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new UnauthorizedException('User not found');
    const valid = await bcrypt.compare(data.currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');
    const hashed = await bcrypt.hash(data.newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    return { message: 'Password changed successfully' };
  }

  async login(data: any) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateTokens(user);
  }

  async validateInviteToken(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        organization: { select: { name: true, id: true } },
        invitedBy: { select: { name: true } },
      },
    });
    if (!invite || invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired invite link');
    }
    return {
      email: invite.email,
      role: invite.role,
      orgName: invite.organization.name,
      orgId: invite.organization.id,
      invitedBy: invite.invitedBy.name,
    };
  }

  async signupViaInvite(data: { token: string; name: string; password: string }) {
    const invite = await this.prisma.invite.findUnique({
      where: { token: data.token },
      include: { organization: true },
    });
    if (!invite || invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired invite link');
    }
    const existing = await this.prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) throw new UnauthorizedException('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: invite.email,
        password: hashedPassword,
        role: invite.role,
        organizationId: invite.organizationId,
      },
    });
    await this.prisma.invite.update({ where: { token: data.token }, data: { status: 'ACCEPTED' } });
    return this.generateTokens(user);
  }

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role, orgId: user.organizationId };
    const access_token = this.jwtService.sign(payload);
    return {
      access_token,
      accessToken: access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }
}
