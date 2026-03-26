import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

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
    // Fetch current task to compare status / assignee
    const prev = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { organizationId: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    const updated = await this.prisma.task.update({
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
        project: { select: { organizationId: true } },
      },
    });

    const orgId = updated.project?.organizationId;
    if (!orgId) return updated;

    // Notify on status change
    if (data.status && prev && data.status !== prev.status) {
      const statusLabel: Record<string, string> = {
        TODO: 'To Do', IN_PROGRESS: 'In Progress', REVIEW: 'Review', DONE: 'Done',
      };
      this.notifications.push(
        orgId,
        updated.assigneeId,
        'TASK_STATUS_CHANGED',
        `Task moved to ${statusLabel[data.status] || data.status}`,
        `"${updated.title}" was moved from ${statusLabel[prev.status] || prev.status} → ${statusLabel[data.status] || data.status}`,
        { taskId, prevStatus: prev.status, newStatus: data.status },
      );
    }

    // Notify on new assignment
    if (data.assigneeId && data.assigneeId !== prev?.assigneeId) {
      this.notifications.push(
        orgId,
        data.assigneeId,
        'TASK_ASSIGNED',
        'Task assigned to you',
        `You have been assigned "${updated.title}"`,
        { taskId },
      );
    }

    return updated;
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
        tasks: {
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
      const activeTasks = u.tasks;
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

  // ─── AUTO-REASSIGN OVERDUE ────────────────────────────────────

  async autoReassignOverdue(orgId: string) {
    const now = new Date();

    // Find all overdue active tasks
    const overdueTasks = await this.prisma.task.findMany({
      where: {
        project: { organizationId: orgId },
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { lt: now },
      },
      include: { assignee: { select: { id: true, name: true } } },
    });

    if (overdueTasks.length === 0) return { reassigned: 0, tasks: [] };

    // Get member workloads — find least-loaded developer
    const members = await this.prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        tasks: {
          where: { status: { not: 'DONE' } },
          select: { id: true },
        },
      },
    });

    if (members.length === 0) return { reassigned: 0, tasks: [] };

    const reassigned: any[] = [];

    for (const task of overdueTasks) {
      // Pick member with fewest active tasks (round-robin with load balancing)
      const sorted = [...members].sort(
        (a, b) => a.tasks.length - b.tasks.length,
      );
      const target = sorted[0];

      // Skip if already assigned to the least-loaded person
      if (task.assigneeId === target.id) continue;

      const updated = await this.prisma.task.update({
        where: { id: task.id },
        data: { assigneeId: target.id },
        select: { id: true, title: true },
      });

      // Notify the new assignee
      this.notifications.push(
        orgId,
        target.id,
        'TASK_REASSIGNED',
        'Overdue task reassigned to you',
        `"${task.title}" was auto-reassigned to you because it is overdue`,
        { taskId: task.id, previousAssigneeId: task.assigneeId },
      );

      // Update the in-memory count so the next iteration is balanced
      const memberIdx = members.findIndex(m => m.id === target.id);
      if (memberIdx !== -1) {
        members[memberIdx].tasks.push({ id: task.id });
      }

      reassigned.push({
        taskId: task.id,
        title: updated.title,
        fromAssignee: task.assignee?.name ?? 'Unassigned',
        toAssignee: target.name,
      });
    }

    return { reassigned: reassigned.length, tasks: reassigned };
  }

  // ─── REPORTING ────────────────────────────────────────────────

  async getReport(orgId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const [tasks, projects, timeEntries, members] = await Promise.all([
      this.prisma.task.findMany({
        where: { project: { organizationId: orgId } },
        include: {
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          timeEntries: { select: { duration: true } },
        },
      }),
      this.prisma.project.findMany({
        where: { organizationId: orgId },
        include: { _count: { select: { tasks: true } }, tasks: { select: { status: true } } },
      }),
      this.prisma.timeEntry.findMany({
        where: {
          task: { project: { organizationId: orgId } },
          date: { gte: thirtyDaysAgo },
        },
        include: {
          user: { select: { id: true, name: true } },
          task: { select: { title: true } },
        },
      }),
      this.prisma.user.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true, role: true },
      }),
    ]);

    // Tasks by status
    const byStatus = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map(s => ({
      status: s,
      count: tasks.filter(t => t.status === s).length,
    }));

    // Tasks by priority
    const byPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => ({
      priority: p,
      count: tasks.filter(t => t.priority === p).length,
    }));

    // Tasks per developer (with completion rate)
    const byDeveloper = members.map(m => {
      const myTasks = tasks.filter(t => t.assigneeId === m.id);
      const done = myTasks.filter(t => t.status === 'DONE').length;
      const overdue = myTasks.filter(t =>
        t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
      ).length;
      const totalMinutes = myTasks.reduce(
        (sum, t) => sum + t.timeEntries.reduce((s, e) => s + e.duration, 0), 0
      );
      return {
        id: m.id,
        name: m.name,
        role: m.role,
        total: myTasks.length,
        done,
        active: myTasks.filter(t => t.status !== 'DONE').length,
        overdue,
        completionRate: myTasks.length > 0 ? Math.round((done / myTasks.length) * 100) : 0,
        hoursLogged: Math.round(totalMinutes / 60 * 10) / 10,
      };
    });

    // Overdue tasks list
    const overdueList = tasks
      .filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE')
      .map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        assignee: t.assignee?.name ?? 'Unassigned',
        project: t.project?.name ?? '',
        daysOverdue: Math.floor((now.getTime() - new Date(t.dueDate!).getTime()) / 86400000),
      }))
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    // Project progress
    const projectProgress = projects.map(p => {
      const total = p.tasks.length;
      const done = p.tasks.filter(t => t.status === 'DONE').length;
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        total,
        done,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });

    // Time logged per day (last 30 days)
    const timeByDay: Record<string, number> = {};
    for (const entry of timeEntries) {
      const key = new Date(entry.date).toISOString().slice(0, 10);
      timeByDay[key] = (timeByDay[key] || 0) + entry.duration;
    }
    const timeChart = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = d.toISOString().slice(0, 10);
      return { date: key, hours: Math.round((timeByDay[key] || 0) / 60 * 10) / 10 };
    });

    return {
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'DONE').length,
        overdueTasks: overdueList.length,
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
        totalHoursLogged: Math.round(timeEntries.reduce((s, e) => s + e.duration, 0) / 60),
      },
      byStatus,
      byPriority,
      byDeveloper,
      overdueList,
      projectProgress,
      timeChart,
    };
  }
}
