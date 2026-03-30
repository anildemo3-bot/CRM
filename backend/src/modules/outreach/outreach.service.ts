import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

const FULL_ACCESS_ROLES = ['ADMIN', 'MANAGER', 'SUPER_ADMIN', 'SALES'];
const COLD_CALLER_ROLES = ['COLD_CALLER', 'SALES', 'ADMIN', 'MANAGER', 'SUPER_ADMIN'];
const OUTREACHER_ROLES  = ['OUTREACHER', 'SALES', 'ADMIN', 'MANAGER', 'SUPER_ADMIN'];

@Injectable()
export class OutreachService {
  constructor(private prisma: PrismaService) {}

  // ─── PROSPECTS ───────────────────────────────────────────────

  async getProspects(orgId: string, userId: string, role: string) {
    const where: any = { organizationId: orgId };
    if (!FULL_ACCESS_ROLES.includes(role)) {
      where.assignedTo = userId;
    }
    return this.prisma.prospect.findMany({
      where,
      include: { _count: { select: { callLogs: true, messages: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProspect(orgId: string, userId: string, data: any) {
    const p = await this.prisma.prospect.create({
      data: {
        organizationId: orgId,
        assignedTo: data.assignedTo || userId,
        status: 'NEW',
        channel: data.channel || 'EMAIL',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        title: data.title || null,
      },
    });
    await this._logActivity(orgId, userId, 'PROSPECT_CREATED', p.id, `Created prospect ${p.firstName} ${p.lastName}`);
    return p;
  }

  async updateProspect(id: string, userId: string, orgId: string, data: any) {
    const prev = await this.prisma.prospect.findUnique({ where: { id } });
    const updated = await this.prisma.prospect.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.company !== undefined && { company: data.company }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.channel !== undefined && { channel: data.channel }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
      },
    });
    if (data.status && prev && data.status !== prev.status) {
      await this._logActivity(orgId, userId, 'STATUS_CHANGED', id, `Status: ${prev.status} → ${data.status}`);
    }
    return updated;
  }

  async deleteProspect(id: string) {
    await this.prisma.outreachActivity.deleteMany({ where: { prospectId: id } });
    await this.prisma.outreachCall.deleteMany({ where: { prospectId: id } });
    await this.prisma.outreachMessage.deleteMany({ where: { prospectId: id } });
    return this.prisma.prospect.delete({ where: { id } });
  }

  async importProspects(orgId: string, userId: string, rows: any[]) {
    const created = await Promise.all(rows.map(row =>
      this.prisma.prospect.create({
        data: {
          organizationId: orgId,
          assignedTo: userId,
          status: 'NEW',
          firstName: row['First Name'] || row.firstName || '',
          lastName: row['Last Name'] || row.lastName || '',
          email: row['Email'] || row.email || null,
          phone: row['Phone'] || row.phone || null,
          company: row['Company'] || row.company || null,
          title: row['Title'] || row.title || null,
          channel: row['Channel'] || row.channel || 'EMAIL',
        },
      })
    ));
    return { imported: created.length, prospects: created };
  }

  async assignProspect(id: string, assigneeId: string, orgId: string, userId: string) {
    return this.updateProspect(id, userId, orgId, { assignedTo: assigneeId });
  }

  // ─── DAILY DISTRIBUTION ──────────────────────────────────────

  async distributeLeads(orgId: string, leadsPerSdr: number = 55) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all COLD_CALLER/OUTREACHER/SALES/ADMIN/MANAGER users in the org
    const sdrs = await this.prisma.user.findMany({
      where: { organizationId: orgId, role: { in: ['COLD_CALLER', 'OUTREACHER', 'SALES', 'ADMIN', 'MANAGER'] } },
      select: { id: true, name: true },
    });

    if (sdrs.length === 0) return { distributed: 0, sdrs: 0 };

    // Get available prospects (NEW or ATTEMPTED, not distributed today)
    const available = await this.prisma.prospect.findMany({
      where: {
        organizationId: orgId,
        status: { in: ['NEW', 'ATTEMPTED'] },
        OR: [
          { distributedDate: null },
          { distributedDate: { lt: today } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: sdrs.length * leadsPerSdr,
    });

    if (available.length === 0) return { distributed: 0, sdrs: sdrs.length, message: 'No available leads to distribute' };

    let idx = 0;
    let totalDistributed = 0;
    const now = new Date();

    for (const sdr of sdrs) {
      const batch = available.slice(idx, idx + leadsPerSdr);
      if (batch.length === 0) break;
      await this.prisma.prospect.updateMany({
        where: { id: { in: batch.map(p => p.id) } },
        data: { assignedTo: sdr.id, distributedDate: now },
      });
      idx += leadsPerSdr;
      totalDistributed += batch.length;
    }

    return { distributed: totalDistributed, sdrs: sdrs.length, leadsPerSdr };
  }

  async getMyLeadsToday(orgId: string, userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leads = await this.prisma.prospect.findMany({
      where: {
        organizationId: orgId,
        assignedTo: userId,
        distributedDate: { gte: today },
      },
      include: {
        callLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { callLogs: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const total = leads.length;
    const called = leads.filter(l => l._count.callLogs > 0).length;
    const booked = leads.filter(l => l.status === 'QUALIFIED').length;
    const notInterested = leads.filter(l => l.status === 'DEAD').length;

    return { leads, stats: { total, called, booked, notInterested, pending: total - called } };
  }

  // ─── CALL LOGS ───────────────────────────────────────────────

  async getCallLogs(orgId: string, userId: string, role: string) {
    const where: any = { orgId };
    if (!FULL_ACCESS_ROLES.includes(role)) where.userId = userId;
    return this.prisma.outreachCall.findMany({
      where,
      include: { prospect: { select: { id: true, firstName: true, lastName: true, company: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCallLog(orgId: string, userId: string, data: any) {
    const log = await this.prisma.outreachCall.create({
      data: {
        orgId, userId,
        prospectId: data.prospectId,
        outcome: data.outcome || 'NO_ANSWER',
        duration: data.duration || 0,
        notes: data.notes || '',
        callDate: data.callDate ? new Date(data.callDate) : new Date(),
      },
    });

    const statusMap: Record<string, string> = {
      INTERESTED: 'QUALIFIED', NOT_INTERESTED: 'DEAD',
      CALLBACK: 'CALLBACK', ANSWERED: 'CONTACTED',
      NO_ANSWER: 'ATTEMPTED', VOICEMAIL: 'ATTEMPTED',
    };
    if (data.prospectId && statusMap[data.outcome]) {
      await this.prisma.prospect.update({
        where: { id: data.prospectId },
        data: { status: statusMap[data.outcome] },
      });
    }

    await this._logActivity(orgId, userId, 'CALL_MADE', data.prospectId,
      `Call outcome: ${data.outcome}${data.duration ? ` (${data.duration}s)` : ''}`);

    if (data.outcome === 'INTERESTED') {
      await this._logActivity(orgId, userId, 'MEETING_BOOKED', data.prospectId, 'Meeting / demo booked');
    }

    return log;
  }

  async deleteCallLog(id: string) {
    return this.prisma.outreachCall.delete({ where: { id } });
  }

  // ─── SEQUENCES ───────────────────────────────────────────────

  async getSequences(orgId: string) {
    return this.prisma.outreachSequence.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
  }

  async createSequence(orgId: string, userId: string, data: any) {
    return this.prisma.outreachSequence.create({
      data: {
        orgId, createdBy: userId,
        name: data.name,
        description: data.description || '',
        steps: data.steps || [],
        isActive: true,
        enrolledCount: 0,
      },
    });
  }

  async updateSequence(id: string, data: any) {
    return this.prisma.outreachSequence.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.steps && { steps: data.steps }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteSequence(id: string) {
    return this.prisma.outreachSequence.delete({ where: { id } });
  }

  // ─── TEMPLATES ───────────────────────────────────────────────

  async getTemplates(orgId: string) {
    return this.prisma.outreachTemplate.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
  }

  async createTemplate(orgId: string, userId: string, data: any) {
    return this.prisma.outreachTemplate.create({
      data: {
        orgId, createdBy: userId,
        name: data.name,
        subject: data.subject || null,
        body: data.body,
        channel: data.channel || 'EMAIL',
      },
    });
  }

  async updateTemplate(id: string, data: any) {
    return this.prisma.outreachTemplate.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.channel && { channel: data.channel }),
      },
    });
  }

  async deleteTemplate(id: string) {
    return this.prisma.outreachTemplate.delete({ where: { id } });
  }

  // ─── INBOX ───────────────────────────────────────────────────

  async getInbox(orgId: string, userId: string, role: string, prospectId?: string, channel?: string) {
    const where: any = { orgId };
    if (prospectId) where.prospectId = prospectId;
    if (channel) where.channel = channel;
    if (!FULL_ACCESS_ROLES.includes(role)) where.assignedTo = userId;
    return this.prisma.outreachMessage.findMany({
      where,
      include: { prospect: { select: { id: true, firstName: true, lastName: true, company: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addInboxMessage(orgId: string, userId: string, data: any) {
    const msg = await this.prisma.outreachMessage.create({
      data: {
        orgId, userId,
        prospectId: data.prospectId,
        channel: data.channel || 'EMAIL',
        direction: data.direction || 'OUTBOUND',
        subject: data.subject || null,
        body: data.body,
        assignedTo: data.assignedTo || userId,
        isRead: data.direction === 'OUTBOUND',
      },
    });
    await this._logActivity(orgId, userId, `${msg.channel}_${msg.direction}`,
      data.prospectId, msg.subject || (msg.body || '').slice(0, 50));
    return msg;
  }

  async markRead(id: string) {
    return this.prisma.outreachMessage.update({ where: { id }, data: { isRead: true } });
  }

  // ─── ACTIVITY FEED ───────────────────────────────────────────

  private async _logActivity(orgId: string, userId: string, type: string, prospectId: string, description: string) {
    return this.prisma.outreachActivity.create({
      data: { orgId, userId, prospectId, type, description },
    });
  }

  async getActivities(orgId: string, prospectId?: string, userId?: string) {
    const where: any = { orgId };
    if (prospectId) where.prospectId = prospectId;
    if (userId) where.userId = userId;
    return this.prisma.outreachActivity.findMany({
      where,
      include: { prospect: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  // ─── SDR STATS ───────────────────────────────────────────────

  async getSDRStats(orgId: string) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [calls, messages, prospects, activities] = await Promise.all([
      this.prisma.outreachCall.findMany({ where: { orgId } }),
      this.prisma.outreachMessage.findMany({ where: { orgId } }),
      this.prisma.prospect.findMany({ where: { organizationId: orgId } }),
      this.prisma.outreachActivity.findMany({ where: { orgId } }),
    ]);

    const sdrIds = [...new Set([
      ...calls.map(c => c.userId),
      ...messages.filter(m => m.direction === 'OUTBOUND').map(m => m.userId),
    ])];

    return sdrIds.map(userId => {
      const myCalls = calls.filter(c => c.userId === userId);
      const myMsgs = messages.filter(m => m.userId === userId);
      const myProspects = prospects.filter(p => p.assignedTo === userId);

      const callsToday = myCalls.filter(c => new Date(c.callDate) >= today).length;
      const callsThisWeek = myCalls.filter(c => new Date(c.callDate) >= weekAgo).length;
      const emailsSent = myMsgs.filter(m => m.channel === 'EMAIL' && m.direction === 'OUTBOUND').length;
      const replies = myMsgs.filter(m => m.channel === 'EMAIL' && m.direction === 'INBOUND').length;
      const replyRate = emailsSent > 0 ? Math.round((replies / emailsSent) * 100) : 0;
      const qualified = myProspects.filter(p => p.status === 'QUALIFIED').length;
      const meetingsBooked = activities.filter(a => a.userId === userId && a.type === 'MEETING_BOOKED').length;
      const connected = myCalls.filter(c => ['ANSWERED', 'INTERESTED', 'CALLBACK'].includes(c.outcome)).length;
      const connectionRate = myCalls.length > 0 ? Math.round((connected / myCalls.length) * 100) : 0;

      const callsByDay = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekAgo); d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        return { date: key, calls: myCalls.filter(c => new Date(c.callDate).toISOString().slice(0, 10) === key).length };
      });

      return { userId, callsToday, callsThisWeek, emailsSent, replyRate, qualified, meetingsBooked, connectionRate, callsByDay, totalProspects: myProspects.length };
    });
  }

  // ─── ANALYTICS ───────────────────────────────────────────────

  async getAnalytics(orgId: string) {
    const [calls, prospects, messages] = await Promise.all([
      this.prisma.outreachCall.findMany({ where: { orgId } }),
      this.prisma.prospect.findMany({ where: { organizationId: orgId } }),
      this.prisma.outreachMessage.findMany({ where: { orgId } }),
    ]);

    const totalCalls = calls.length;
    const answered = calls.filter(c => ['ANSWERED', 'INTERESTED'].includes(c.outcome)).length;
    const connectionRate = totalCalls > 0 ? Math.round((answered / totalCalls) * 100) : 0;
    const qualified = prospects.filter(p => p.status === 'QUALIFIED').length;
    const conversionRate = totalCalls > 0 ? Math.round((qualified / totalCalls) * 100) : 0;

    const byOutcome = ['ANSWERED', 'NO_ANSWER', 'CALLBACK', 'VOICEMAIL', 'INTERESTED', 'NOT_INTERESTED']
      .map(o => ({ outcome: o, count: calls.filter(c => c.outcome === o).length }));
    const byStatus = ['NEW', 'ATTEMPTED', 'CONTACTED', 'QUALIFIED', 'CALLBACK', 'DEAD']
      .map(s => ({ status: s, count: prospects.filter(p => p.status === s).length }));
    const byChannel = ['EMAIL', 'LINKEDIN', 'WHATSAPP', 'SMS'].map(ch => ({
      channel: ch,
      sent: messages.filter(m => m.channel === ch && m.direction === 'OUTBOUND').length,
      received: messages.filter(m => m.channel === ch && m.direction === 'INBOUND').length,
    }));
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return {
        date: key,
        calls: calls.filter(c => new Date(c.callDate).toISOString().slice(0, 10) === key).length,
        emails: messages.filter(m => m.channel === 'EMAIL' && new Date(m.createdAt).toISOString().slice(0, 10) === key).length,
      };
    });

    return { totalCalls, connectionRate, conversionRate, qualified, totalProspects: prospects.length, totalEmails: messages.filter(m => m.channel === 'EMAIL').length, byOutcome, byStatus, byChannel, last7 };
  }

  // ─── AI ──────────────────────────────────────────────────────

  generateMessage(data: { prospectName: string; company: string; channel: string; tone: string; context?: string }) {
    const { prospectName, company, channel, tone, context } = data;
    const first = prospectName?.split(' ')[0] || 'there';
    const toneMap: Record<string, { g: string; cta: string }> = {
      PROFESSIONAL: { g: 'I hope this message finds you well.', cta: "I'd love to schedule a brief 15-minute call." },
      FRIENDLY: { g: "Hope you're having a great week!", cta: 'Would love to grab 15 mins to chat!' },
      DIRECT: { g: 'Quick note:', cta: "Worth a 10-min call? Reply YES and I'll send a link." },
    };
    const { g, cta } = toneMap[tone?.toUpperCase()] || toneMap['PROFESSIONAL'];
    const ctx = context || 'is growing fast';
    const templates: Record<string, string> = {
      EMAIL: `Subject: Quick question for ${company}\n\nHi ${first},\n\n${g}\n\nI noticed ${company} ${ctx}.\n\n${cta}\n\nBest,\n[Your Name]`,
      LINKEDIN: `Hi ${first}, ${g} I saw your work at ${company}. ${ctx}. ${cta}`,
      WHATSAPP: `Hey ${first}! ${g} Quick message about ${company} — ${ctx}. ${cta}`,
      SMS: `Hi ${first}, this is [Name]. ${cta} Reply STOP to opt out.`,
    };
    return { message: templates[channel?.toUpperCase()] || templates['EMAIL'], channel: channel || 'EMAIL', tone: tone || 'PROFESSIONAL' };
  }

  async getSuggestedFollowUps(prospectId: string) {
    const prospect = await this.prisma.prospect.findUnique({ where: { id: prospectId } });
    if (!prospect) return [];
    const suggestions: any[] = [];
    if (prospect.status === 'CALLBACK') suggestions.push({ type: 'CALL', message: 'Follow up on callback request', urgency: 'HIGH' });
    if (prospect.status === 'CONTACTED') suggestions.push({ type: 'EMAIL', message: 'Send follow-up email', urgency: 'MEDIUM' });
    if (prospect.status === 'QUALIFIED') suggestions.push({ type: 'MEETING', message: 'Schedule a demo call', urgency: 'HIGH' });
    if (prospect.status === 'NEW') suggestions.push({ type: 'EMAIL', message: 'Send initial outreach email', urgency: 'LOW' });
    return suggestions;
  }

  // ─── ENROLLMENTS (stub - kept for compatibility) ──────────────

  async enrollProspects(orgId: string, userId: string, sequenceId: string, prospectIds: string[]) {
    const seq = await this.prisma.outreachSequence.findUnique({ where: { id: sequenceId } });
    if (!seq) return { error: 'Sequence not found' };
    for (const pid of prospectIds) {
      await this._logActivity(orgId, userId, 'SEQUENCE_ENROLLED', pid, `Enrolled in sequence: ${seq.name}`);
    }
    await this.prisma.outreachSequence.update({ where: { id: sequenceId }, data: { enrolledCount: { increment: prospectIds.length } } });
    return { enrolled: prospectIds.length };
  }

  async getEnrollments(orgId: string) {
    return [];
  }
}
