import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getInvoices(orgId: string) {
    return this.prisma.invoice.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInvoice(orgId: string, data: any) {
    return this.prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        tax: data.tax ?? 0,
        status: data.status ?? 'DRAFT',
        organizationId: orgId,
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
      },
    });
  }

  async updateInvoice(id: string, data: any) {
    return this.prisma.invoice.update({
      where: { id },
      data,
    });
  }
}
