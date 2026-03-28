import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async getMembers(orgId: string) {
    return this.prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, email: true, role: true, createdAt: true, avatar: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteMember(orgId: string, invitedById: string, email: string, role: string) {
    // Revoke any existing pending invite for same email+org
    await this.prisma.invite.updateMany({
      where: { email, organizationId: orgId, status: 'PENDING' },
      data: { status: 'REVOKED' },
    });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invite = await this.prisma.invite.create({
      data: { email, role: role as any, organizationId: orgId, invitedById, expiresAt },
    });
    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      token: invite.token,
      inviteUrl: `/accept-invite/${invite.token}`,
      expiresAt: invite.expiresAt,
    };
  }

  async getInvites(orgId: string) {
    return this.prisma.invite.findMany({
      where: { organizationId: orgId, status: 'PENDING' },
      include: { invitedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvite(inviteId: string, orgId: string) {
    return this.prisma.invite.updateMany({
      where: { id: inviteId, organizationId: orgId },
      data: { status: 'REVOKED' },
    });
  }

  async changeRole(memberId: string, orgId: string, newRole: string) {
    if (newRole === 'SUPER_ADMIN') throw new BadRequestException('Cannot assign SUPER_ADMIN role');
    const adminCount = await this.prisma.user.count({
      where: { organizationId: orgId, role: 'ADMIN' },
    });
    const target = await this.prisma.user.findFirst({ where: { id: memberId, organizationId: orgId } });
    if (!target) throw new BadRequestException('Member not found');
    if (target.role === 'ADMIN' && newRole !== 'ADMIN' && adminCount <= 1) {
      throw new BadRequestException('Cannot demote the last admin');
    }
    return this.prisma.user.update({ where: { id: memberId }, data: { role: newRole as any } });
  }

  async removeMember(memberId: string, orgId: string, requesterId: string) {
    if (memberId === requesterId) throw new BadRequestException('Cannot remove yourself');
    const adminCount = await this.prisma.user.count({ where: { organizationId: orgId, role: 'ADMIN' } });
    const target = await this.prisma.user.findFirst({ where: { id: memberId, organizationId: orgId } });
    if (!target) throw new BadRequestException('Member not found');
    if (target.role === 'ADMIN' && adminCount <= 1) throw new BadRequestException('Cannot remove the last admin');
    return this.prisma.user.delete({ where: { id: memberId } });
  }
}
