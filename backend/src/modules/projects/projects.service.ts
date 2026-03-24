import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async getProjects(orgId: string) {
    return this.prisma.project.findMany({ 
      where: { organizationId: orgId },
      include: { tasks: true, _count: { select: { tasks: true } } }
    });
  }

  async createProject(orgId: string, data: any) {
    return this.prisma.project.create({
      data: { name: data.name, description: data.description, status: data.status, organizationId: orgId },
    });
  }

  async getTasks(orgId: string) {
    return this.prisma.task.findMany({
      where: { project: { organizationId: orgId } },
      include: { assignee: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(data: any) {
    return this.prisma.task.create({ data });
  }

  async updateTaskStatus(taskId: string, status: any) {
    return this.prisma.task.update({ where: { id: taskId }, data: { status } });
  }
}
