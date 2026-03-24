import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(orgId: string) {
    const [
      projectCount,
      deals,
      invoices,
      contactCount,
      employeeCount,
      openTickets,
      taskCount,
      campaignCount,
    ] = await Promise.all([
      this.prisma.project.count({ where: { organizationId: orgId } }),
      this.prisma.deal.findMany({ where: { organizationId: orgId } }),
      this.prisma.invoice.findMany({ where: { organizationId: orgId } }),
      this.prisma.contact.count({ where: { organizationId: orgId } }),
      this.prisma.employee.count({ where: { organizationId: orgId } }),
      this.prisma.ticket.count({ where: { organizationId: orgId, status: 'OPEN' } }),
      this.prisma.task.count({ where: { project: { organizationId: orgId } } }),
      this.prisma.campaign.count({ where: { organizationId: orgId } }),
    ]);

    const totalRevenue = invoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + i.amount, 0);

    const outstanding = invoices
      .filter((i) => i.status === 'SENT')
      .reduce((sum, i) => sum + i.amount, 0);

    const activeDeals = deals.filter((d) => d.status === 'OPEN').length;
    const wonDeals = deals.filter((d) => d.status === 'WON').length;
    const pipelineValue = deals
      .filter((d) => d.status === 'OPEN')
      .reduce((sum, d) => sum + (d.value ?? 0), 0);

    const conversionRate =
      deals.length > 0 ? Math.round((wonDeals / deals.length) * 100) : 0;

    return {
      totalRevenue,
      outstanding,
      activeDeals,
      wonDeals,
      pipelineValue,
      conversionRate,
      totalProjects: projectCount,
      totalContacts: contactCount,
      totalEmployees: employeeCount,
      openTickets,
      totalTasks: taskCount,
      totalCampaigns: campaignCount,
    };
  }

  async getRevenueByMonth(orgId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { organizationId: orgId, status: 'PAID' },
      orderBy: { createdAt: 'asc' },
    });

    const byMonth: Record<string, number> = {};
    for (const inv of invoices) {
      const key = inv.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
      byMonth[key] = (byMonth[key] ?? 0) + inv.amount;
    }

    return Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue }));
  }
}
