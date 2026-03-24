import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async getTickets(orgId: string) {
    return this.prisma.ticket.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTicket(orgId: string, data: any) {
    return this.prisma.ticket.create({
      data: {
        subject: data.subject,
        description: data.description ?? '',
        status: data.status ?? 'OPEN',
        priority: data.priority ?? 'MEDIUM',
        organizationId: orgId,
      },
    });
  }

  async updateTicket(id: string, data: any) {
    return this.prisma.ticket.update({ where: { id }, data });
  }

  async getStats(orgId: string) {
    const [open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.ticket.count({ where: { organizationId: orgId, status: 'OPEN' } }),
      this.prisma.ticket.count({ where: { organizationId: orgId, status: 'IN_PROGRESS' } }),
      this.prisma.ticket.count({ where: { organizationId: orgId, status: 'RESOLVED' } }),
      this.prisma.ticket.count({ where: { organizationId: orgId, status: 'CLOSED' } }),
    ]);
    return { open, inProgress, resolved, closed, total: open + inProgress + resolved + closed };
  }
}
