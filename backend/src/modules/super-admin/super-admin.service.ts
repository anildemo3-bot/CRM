import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [orgs, users, deals, tasks] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.user.count(),
      this.prisma.deal.count(),
      this.prisma.task.count(),
    ]);
    return { orgs, users, deals, tasks };
  }

  async getOrgs() {
    return this.prisma.organization.findMany({
      include: {
        _count: { select: { users: true, deals: true, projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrgDetail(orgId: string) {
    return this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        _count: { select: { users: true, deals: true, projects: true, contacts: true } },
      },
    });
  }
}
