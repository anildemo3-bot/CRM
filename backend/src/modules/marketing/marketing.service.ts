import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class MarketingService {
  constructor(private prisma: PrismaService) {}

  async getCampaigns(orgId: string) {
    return this.prisma.campaign.findMany({
      where: { organizationId: orgId },
      include: { _count: { select: { leads: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCampaign(orgId: string, data: any) {
    return this.prisma.campaign.create({
      data: {
        name: data.name,
        type: data.type ?? 'EMAIL',
        status: data.status ?? 'ACTIVE',
        organizationId: orgId,
      },
    });
  }

  async updateCampaign(id: string, data: any) {
    return this.prisma.campaign.update({ where: { id }, data });
  }

  async getLeads(orgId: string) {
    return this.prisma.lead.findMany({
      where: { campaign: { organizationId: orgId } },
      include: { campaign: { select: { name: true, type: true } } },
      orderBy: { score: 'desc' },
    });
  }

  async createLead(data: any) {
    return this.prisma.lead.create({ data });
  }

  async updateLeadScore(id: string, score: number) {
    return this.prisma.lead.update({ where: { id }, data: { score } });
  }
}
