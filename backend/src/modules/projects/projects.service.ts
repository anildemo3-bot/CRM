import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  // ─── PROJECTS ─────────────────────────────────────────────────

  async getProjects(orgId: string) {
    return this.prisma.project.findMany({
      where: { organizationId: orgId },
      include: {
        tasks: {
          include: { assignee: { select: { id: true, name: true } } },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProject(orgId: string, data: any) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status || 'PLANNING',
        organizationId: orgId,
      },
    });
  }

  async updateProject(projectId: string, data: any) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status }),
      },
    });
  }

  async deleteProject(projectId: string) {
    await this.prisma.task.deleteMany({ where: { projectId } });
    return this.prisma.project.delete({ where: { id: projectId } });
  }

  // ─── TASKS ─────────────────────────────────────────────────────

  async getTasks(orgId: string, projectId?: string) {
    return this.prisma.task.findMany({
      where: {
        project: { organizationId: orgId },
        ...(projectId && { projectId }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        timeEntries: { include: { user: { select: { id: true, name: true } } } },
        notes: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(orgId: string, userId: string, data: any) {
    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'TODO',
        projectId: data.projectId,
        assigneeId: data.assigneeId || null,
        creatorId: userId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
      },
      include: {
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    });
  }

  async updateTask(taskId: string, data: any) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
      },
      include: {
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    });
  }

  async deleteTask(taskId: string) {
    await this.prisma.timeEntry.deleteMany({ where: { taskId } });
    await this.prisma.note.deleteMany({ where: { taskId } });
    return this.prisma.task.delete({ where: { id: taskId } });
  }

  // ─── SUBTASKS / NOTES (used as checklists) ────────────────────

  async getTaskNotes(taskId: string) {
    return this.prisma.note.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addTaskNote(taskId: string, userId: string, content: string) {
    return this.prisma.note.create({
      data: { content, userId, taskId },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async deleteTaskNote(noteId: string) {
    return this.prisma.note.delete({ where: { id: noteId } });
  }

  // ─── TIME TRACKING ─────────────────────────────────────────────

  async getTimeEntries(orgId: string, taskId?: string) {
    return this.prisma.timeEntry.findMany({
      where: {
        ...(taskId ? { taskId } : { task: { project: { organizationId: orgId } } }),
      },
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true, projectId: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async logTime(userId: string, data: any) {
    return this.prisma.timeEntry.create({
      data: {
        userId,
        taskId: data.taskId,
        duration: data.duration, // in minutes
        date: data.date ? new Date(data.date) : new Date(),
        note: data.note || null,
      },
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  async deleteTimeEntry(entryId: string) {
    return this.prisma.timeEntry.delete({ where: { id: entryId } });
  }

  // ─── WORKLOAD / DEVELOPER CAPACITY ─────────────────────────────

  async getWorkload(orgId: string) {
    const users = await this.prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedTasks: {
          where: { status: { not: 'DONE' } },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            project: { select: { id: true, name: true } },
          },
        },
        timeEntries: {
          where: {
            date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
          select: { duration: true },
        },
      },
    });

    return users.map((u) => {
      const activeTasks = u.assignedTasks;
      const hoursThisWeek = u.timeEntries.reduce((sum, e) => sum + e.duration, 0) / 60;
      const overdueTasks = activeTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date(),
      );
      const urgentTasks = activeTasks.filter((t) => t.priority === 'URGENT');

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        activeTasks: activeTasks.length,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        overdueTasks: overdueTasks.length,
        urgentTasks: urgentTasks.length,
        tasks: activeTasks,
        status:
          activeTasks.length > 8 ? 'OVERLOADED' : activeTasks.length < 2 ? 'IDLE' : 'NORMAL',
      };
    });
  }

  // ─── DASHBOARD ────────────────────────────────────────────────

  async getDashboard(orgId: string) {
    const [tasks, projects, timeEntries] = await Promise.all([
      this.prisma.task.findMany({
        where: { project: { organizationId: orgId } },
        select: { status: true, priority: true, dueDate: true, assigneeId: true },
      }),
      this.prisma.project.findMany({
        where: { organizationId: orgId },
        select: { status: true },
      }),
      this.prisma.timeEntry.findMany({
        where: {
          task: { project: { organizationId: orgId } },
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { duration: true, date: true },
      }),
    ]);

    const byStatus = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map((s) => ({
      status: s,
      count: tasks.filter((t) => t.status === s).length,
    }));

    const byPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => ({
      priority: p,
      count: tasks.filter((t) => t.priority === p).length,
    }));

    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE',
    ).length;

    const totalHours = timeEntries.reduce((sum, e) => sum + e.duration, 0) / 60;

    const projectsByStatus = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'].map((s) => ({
      status: s,
      count: projects.filter((p) => p.status === s).length,
    }));

    return {
      totalTasks: tasks.length,
      overdueTasks,
      totalHours: Math.round(totalHours),
      byStatus,
      byPriority,
      projectsByStatus,
    };
  }

  // ─── MEMBERS (for assignment dropdowns) ───────────────────────

  async getMembers(orgId: string) {
    return this.prisma.user.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, email: true, role: true },
    });
  }
}
