import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CRMService {
  constructor(private prisma: PrismaService) {}

  // Contacts
  async getContacts(orgId: string) {
    return this.prisma.contact.findMany({ where: { organizationId: orgId }, include: { company: true } });
  }

  async createContact(orgId: string, data: any) {
    return this.prisma.contact.create({ data: { ...data, organizationId: orgId } });
  }

  // Pipelines & Stages
  async getPipelines(orgId: string) {
    return this.prisma.pipeline.findMany({ 
      where: { organizationId: orgId }, 
      include: { stages: { include: { deals: true }, orderBy: { order: 'asc' } } } 
    });
  }

  // Deals
  async createDeal(orgId: string, data: any) {
    return this.prisma.deal.create({ data: { ...data, organizationId: orgId } });
  }

  async updateDealStage(dealId: string, stageId: string) {
    return this.prisma.deal.update({ where: { id: dealId }, data: { stageId } });
  }

  async updateDeal(dealId: string, data: any) {
    return this.prisma.deal.update({ where: { id: dealId }, data });
  }

  // Companies
  async getCompanies(orgId: string) {
    return this.prisma.company.findMany({
      where: { organizationId: orgId },
      include: { _count: { select: { contacts: true, deals: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCompany(orgId: string, data: any) {
    return this.prisma.company.create({ data: { ...data, organizationId: orgId } });
  }

  async updateCompany(id: string, data: any) {
    return this.prisma.company.update({ where: { id }, data });
  }
}
