import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  async getEmployees(orgId: string) {
    return this.prisma.employee.findMany({
      where: { organizationId: orgId },
      include: { _count: { select: { attendance: true, reviews: true } } },
      orderBy: { joiningDate: 'desc' },
    });
  }

  async createEmployee(orgId: string, data: any) {
    return this.prisma.employee.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        salary: data.salary ? parseFloat(data.salary) : null,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
        organizationId: orgId,
      },
    });
  }

  async updateEmployee(id: string, data: any) {
    return this.prisma.employee.update({ where: { id }, data });
  }

  async getAttendance(orgId: string) {
    return this.prisma.attendance.findMany({
      where: { employee: { organizationId: orgId } },
      include: { employee: { select: { name: true, email: true } } },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  async markAttendance(data: any) {
    return this.prisma.attendance.create({ data });
  }

  async getStats(orgId: string) {
    const [total, reviews] = await Promise.all([
      this.prisma.employee.count({ where: { organizationId: orgId } }),
      this.prisma.performanceReview.findMany({
        where: { employee: { organizationId: orgId } },
        orderBy: { date: 'desc' },
        take: 20,
      }),
    ]);
    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
    return { total, avgRating: Math.round(avgRating * 10) / 10, openRoles: 4 };
  }
}
