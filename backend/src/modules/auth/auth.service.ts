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
