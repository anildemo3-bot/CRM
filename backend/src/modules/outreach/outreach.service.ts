import { Injectable } from '@nestjs/common';

let prospects: any[] = [];
let callLogs: any[] = [];
let sequences: any[] = [];
let emailTemplates: any[] = [];
let activities: any[] = [];
let sequenceEnrollments: any[] = [];
let inboxMessages: any[] = [];
let idCounter = 1;

const uid = () => `out_${idCounter++}_${Date.now()}`;

@Injectable()
export class OutreachService {

  // ─── PROSPECTS ───────────────────────────────────────────────

  getProspects(orgId: string, userId: string, role: string) {
    const list = prospects.filter(p => p.orgId === orgId);
    if (role === 'ADMIN' || role === 'MANAGER') return list;
    return list.filter(p => p.assignedTo === userId || !p.assignedTo);
  }

  createProspect(orgId: string, userId: string, data: any) {
    const p = {
      id: uid(), orgId,
      assignedTo: data.assignedTo || userId,
      status: 'NEW',
      channel: data.channel || 'EMAIL',
      ...data,
      createdAt: new Date(),
    };
    prospects.push(p);
    this._logActivity(orgId, userId, 'PROSPECT_CREATED', p.id, `Created prospect ${p.firstName} ${p.lastName}`);
    return p;
  }

  updateProspect(id: string, userId: string, orgId: string, data: any) {
    const idx = prospects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const prev = prospects[idx];
    prospects[idx] = { ...prev, ...data, updatedAt: new Date() };
    if (data.status && data.status !== prev.status) {
      this._logActivity(orgId, userId, 'STATUS_CHANGED', id, `Status: ${prev.status} -> ${data.status}`);
    }
    return prospects[idx];
  }

  deleteProspect(id: string) {
    prospects = prospects.filter(p => p.id !== id);
    activities = activities.filter(a => a.prospectId !== id);
    return { deleted: true };
  }

  importProspects(orgId: string, userId: string, rows: any[]) {
    const created = rows.map(row => ({
      id: uid(), orgId, assignedTo: userId, status: 'NEW',
      firstName: row['First Name'] || row.firstName || '',
      lastName: row['Last Name'] || row.lastName || '',
      email: row['Email'] || row.email || '',
      phone: row['Phone'] || row.phone || '',
      company: row['Company'] || row.company || '',
      title: row['Title'] || row.title || '',
      channel: row['Channel'] || row.channel || 'EMAIL',
      createdAt: new Date(),
    }));
    prospects.push(...created);
    return { imported: created.length, prospects: created };
  }

  assignProspect(id: string, assigneeId: string, orgId: string, userId: string) {
    return this.updateProspect(id, userId, orgId, { assignedTo: assigneeId });
  }

  // ─── CALL LOGS ───────────────────────────────────────────────

  getCallLogs(orgId: string, userId: string, role: string) {
    const list = callLogs.filter(c => c.orgId === orgId);
    if (role === 'ADMIN' || role === 'MANAGER') return list;
    return list.filter(c => c.userId === userId);
  }

  createCallLog(orgId: string, userId: string, data: any) {
    const log = {
      id: uid(), orgId, userId,
      prospectId: data.prospectId,
      outcome: data.outcome || 'NO_ANSWER',
      duration: data.duration || 0,
      notes: data.notes || '',
      callDate: data.callDate ? new Date(data.callDate) : new Date(),
      createdAt: new Date(),
    };
    callLogs.push(log);
    const map: Record<string, string> = {
      INTERESTED: 'QUALIFIED', NOT_INTERESTED: 'DEAD',
      CALLBACK: 'CALLBACK', ANSWERED: 'CONTACTED',
      NO_ANSWER: 'ATTEMPTED', VOICEMAIL: 'ATTEMPTED',
    };
    if (data.prospectId && map[data.outcome]) {
      this.updateProspect(data.prospectId, userId, orgId, { status: map[data.outcome] });
    }
    this._logActivity(orgId, userId, 'CALL_MADE', data.prospectId,
      `Call outcome: ${data.outcome}${data.duration ? ` (${data.duration}s)` : ''}`);
    if (data.outcome === 'INTERESTED') {
      this._logActivity(orgId, userId, 'MEETING_BOOKED', data.prospectId, 'Meeting / demo booked');
    }
    return log;
  }

  deleteCallLog(id: string) {
    callLogs = callLogs.filter(c => c.id !== id);
    return { deleted: true };
  }

  // ─── SEQUENCES ───────────────────────────────────────────────

  getSequences(orgId: string) {
    return sequences.filter(s => s.orgId === orgId);
  }

  createSequence(orgId: string, userId: string, data: any) {
    const seq = {
      id: uid(), orgId, createdBy: userId,
      name: data.name,
      description: data.description || '',
      steps: (data.steps || []).map((step: any, i: number) => ({
        id: `step_${i}_${Date.now()}`,
        type: step.type || 'EMAIL',
        dayOffset: step.dayOffset ?? i,
        subject: step.subject || '',
        body: step.body || '',
        templateId: step.templateId || null,
      })),
      isActive: true,
      enrolledCount: 0,
      createdAt: new Date(),
    };
    sequences.push(seq);
    return seq;
  }

  updateSequence(id: string, data: any) {
    const idx = sequences.findIndex(s => s.id === id);
    if (idx === -1) return null;
    sequences[idx] = { ...sequences[idx], ...data, updatedAt: new Date() };
    return sequences[idx];
  }

  deleteSequence(id: string) {
    sequences = sequences.filter(s => s.id !== id);
    sequenceEnrollments = sequenceEnrollments.filter(e => e.sequenceId !== id);
    return { deleted: true };
  }

  // ─── SEQUENCE ENROLLMENT ─────────────────────────────────────

  enrollProspects(orgId: string, userId: string, sequenceId: string, prospectIds: string[]) {
    const seq = sequences.find(s => s.id === sequenceId);
    if (!seq) return { error: 'Sequence not found' };
    const enrolled: any[] = [];
    for (const pid of prospectIds) {
      const existing = sequenceEnrollments.find(
        e => e.prospectId === pid && e.sequenceId === sequenceId && e.status === 'ACTIVE'
      );
      if (!existing) {
        const enrollment = {
          id: uid(), orgId, prospectId: pid, sequenceId,
          currentStep: 0, status: 'ACTIVE',
          nextStepAt: new Date(Date.now() + (seq.steps[0]?.dayOffset || 0) * 86400000),
          enrolledBy: userId, enrolledAt: new Date(),
        };
        sequenceEnrollments.push(enrollment);
        enrolled.push(enrollment);
        this._logActivity(orgId, userId, 'SEQUENCE_ENROLLED', pid, `Enrolled in sequence: ${seq.name}`);
      }
    }
    const seqIdx = sequences.findIndex(s => s.id === sequenceId);
    if (seqIdx !== -1) {
      sequences[seqIdx].enrolledCount = sequenceEnrollments.filter(
        e => e.sequenceId === sequenceId
      ).length;
    }
    return { enrolled: enrolled.length, enrollments: enrolled };
  }

  getEnrollments(orgId: string, prospectId?: string, sequenceId?: string) {
    let list = sequenceEnrollments.filter(e => e.orgId === orgId);
    if (prospectId) list = list.filter(e => e.prospectId === prospectId);
    if (sequenceId) list = list.filter(e => e.sequenceId === sequenceId);
    return list;
  }

  // ─── EMAIL TEMPLATES ─────────────────────────────────────────

  getTemplates(orgId: string) {
    return emailTemplates.filter(t => t.orgId === orgId);
  }

  createTemplate(orgId: string, userId: string, data: any) {
    const t = {
      id: uid(), orgId, createdBy: userId,
      name: data.name, subject: data.subject, body: data.body,
      channel: data.channel || 'EMAIL',
      tags: data.tags || [], createdAt: new Date(),
    };
    emailTemplates.push(t);
    return t;
  }

  updateTemplate(id: string, data: any) {
    const idx = emailTemplates.findIndex(t => t.id === id);
    if (idx === -1) return null;
    emailTemplates[idx] = { ...emailTemplates[idx], ...data, updatedAt: new Date() };
    return emailTemplates[idx];
  }

  deleteTemplate(id: string) {
    emailTemplates = emailTemplates.filter(t => t.id !== id);
    return { deleted: true };
  }

  // ─── INBOX ────────────────────────────────────────────────────

  getInbox(orgId: string, userId: string, role: string, prospectId?: string, channel?: string) {
    let list = inboxMessages.filter(m => m.orgId === orgId);
    if (prospectId) list = list.filter(m => m.prospectId === prospectId);
    if (channel) list = list.filter(m => m.channel === channel);
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      list = list.filter(m => m.assignedTo === userId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addInboxMessage(orgId: string, userId: string, data: any) {
    const msg = {
      id: uid(), orgId, userId,
      prospectId: data.prospectId,
      channel: data.channel || 'EMAIL',
      direction: data.direction || 'OUTBOUND',
      subject: data.subject || '',
      body: data.body,
      assignedTo: data.assignedTo || userId,
      isRead: data.direction === 'OUTBOUND',
      createdAt: new Date(),
    };
    inboxMessages.push(msg);
    this._logActivity(orgId, userId, `${msg.channel}_${msg.direction}`,
      data.prospectId, msg.subject || (msg.body || '').slice(0, 50));
    return msg;
  }

  markRead(id: string) {
    const idx = inboxMessages.findIndex(m => m.id === id);
    if (idx !== -1) inboxMessages[idx].isRead = true;
    return inboxMessages[idx];
  }

  // ─── ACTIVITY FEED ───────────────────────────────────────────

  private _logActivity(orgId: string, userId: string, type: string, prospectId: string, description: string) {
    activities.push({
      id: uid(), orgId, userId, prospectId,
      type, description, createdAt: new Date(),
    });
  }

  getActivities(orgId: string, prospectId?: string, userId?: string) {
    let list = activities.filter(a => a.orgId === orgId);
    if (prospectId) list = list.filter(a => a.prospectId === prospectId);
    if (userId) list = list.filter(a => a.userId === userId);
    return list
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 200);
  }

  // ─── SDR KPI DASHBOARD ───────────────────────────────────────

  getSDRStats(orgId: string) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sdrIds = [
      ...new Set([
        ...callLogs.filter(c => c.orgId === orgId).map(c => c.userId),
        ...inboxMessages
          .filter(m => m.orgId === orgId && m.direction === 'OUTBOUND')
          .map(m => m.userId),
      ]),
    ];

    return sdrIds.map(userId => {
      const myCalls = callLogs.filter(c => c.orgId === orgId && c.userId === userId);
      const myMsgs = inboxMessages.filter(m => m.orgId === orgId && m.userId === userId);
      const myProspects = prospects.filter(p => p.orgId === orgId && p.assignedTo === userId);

      const callsToday = myCalls.filter(c => new Date(c.callDate) >= today).length;
      const callsThisWeek = myCalls.filter(c => new Date(c.callDate) >= weekAgo).length;
      const emailsSent = myMsgs.filter(m => m.channel === 'EMAIL' && m.direction === 'OUTBOUND').length;
      const replies = myMsgs.filter(m => m.channel === 'EMAIL' && m.direction === 'INBOUND').length;
      const replyRate = emailsSent > 0 ? Math.round((replies / emailsSent) * 100) : 0;
      const qualified = myProspects.filter(p => p.status === 'QUALIFIED').length;
      const connected = myCalls.filter(c =>
        ['ANSWERED', 'INTERESTED', 'CALLBACK'].includes(c.outcome)
      ).length;
      const connectionRate = myCalls.length > 0 ? Math.round((connected / myCalls.length) * 100) : 0;

      const callsByDay = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekAgo);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        return {
          date: key,
          calls: myCalls.filter(c => new Date(c.callDate).toISOString().slice(0, 10) === key).length,
        };
      });

      const meetingsBooked = activities.filter(
        a => a.orgId === orgId && a.userId === userId && a.type === 'MEETING_BOOKED'
      ).length;

      return {
        userId, callsToday, callsThisWeek, emailsSent,
        replyRate, qualified, meetingsBooked, connectionRate, callsByDay,
        totalProspects: myProspects.length,
      };
    });
  }

  // ─── ANALYTICS ───────────────────────────────────────────────

  getAnalytics(orgId: string) {
    const orgLogs = callLogs.filter(c => c.orgId === orgId);
    const orgProspects = prospects.filter(p => p.orgId === orgId);
    const orgMsgs = inboxMessages.filter(m => m.orgId === orgId);

    const totalCalls = orgLogs.length;
    const answered = orgLogs.filter(c => ['ANSWERED', 'INTERESTED'].includes(c.outcome)).length;
    const connectionRate = totalCalls > 0 ? Math.round((answered / totalCalls) * 100) : 0;
    const qualified = orgProspects.filter(p => p.status === 'QUALIFIED').length;
    const conversionRate = totalCalls > 0 ? Math.round((qualified / totalCalls) * 100) : 0;

    const byOutcome = ['ANSWERED', 'NO_ANSWER', 'CALLBACK', 'VOICEMAIL', 'INTERESTED', 'NOT_INTERESTED']
      .map(o => ({ outcome: o, count: orgLogs.filter(c => c.outcome === o).length }));

    const byStatus = ['NEW', 'ATTEMPTED', 'CONTACTED', 'QUALIFIED', 'CALLBACK', 'DEAD']
      .map(s => ({ status: s, count: orgProspects.filter(p => p.status === s).length }));

    const byChannel = ['EMAIL', 'LINKEDIN', 'WHATSAPP', 'SMS'].map(ch => ({
      channel: ch,
      sent: orgMsgs.filter(m => m.channel === ch && m.direction === 'OUTBOUND').length,
      received: orgMsgs.filter(m => m.channel === ch && m.direction === 'INBOUND').length,
    }));

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return {
        date: key,
        calls: orgLogs.filter(c => new Date(c.callDate).toISOString().slice(0, 10) === key).length,
        emails: orgMsgs.filter(
          m => m.channel === 'EMAIL' && new Date(m.createdAt).toISOString().slice(0, 10) === key
        ).length,
      };
    });

    return {
      totalCalls, connectionRate, conversionRate, qualified,
      totalProspects: orgProspects.length,
      totalEmails: orgMsgs.filter(m => m.channel === 'EMAIL').length,
      byOutcome, byStatus, byChannel, last7,
    };
  }

  // ─── AI MESSAGE GENERATION ───────────────────────────────────

  generateMessage(data: {
    prospectName: string;
    company: string;
    channel: string;
    tone: string;
    context?: string;
  }) {
    const { prospectName, company, channel, tone, context } = data;
    const first = prospectName?.split(' ')[0] || 'there';

    const toneMap: Record<string, { g: string; cta: string }> = {
      PROFESSIONAL: {
        g: 'I hope this message finds you well.',
        cta: "I'd love to schedule a brief 15-minute call to explore how we can add value.",
      },
      FRIENDLY: {
        g: "Hope you're having a great week!",
        cta: 'Would love to grab 15 mins to chat — totally low-key, promise!',
      },
      DIRECT: {
        g: 'Quick note:',
        cta: "Worth a 10-min call? Reply YES and I'll send a calendar link.",
      },
    };

    const { g, cta } = toneMap[tone?.toUpperCase()] || toneMap['PROFESSIONAL'];
    const ctx = context || 'is growing fast';

    const templates: Record<string, string> = {
      EMAIL: `Subject: Quick question for ${company}\n\nHi ${first},\n\n${g}\n\nI noticed ${company} ${ctx} and thought there might be a great fit.\n\n${cta}\n\nBest,\n[Your Name]`,
      LINKEDIN: `Hi ${first}, ${g} I saw your work at ${company} and was impressed. ${context ? `Especially around ${context}. ` : ''}${cta}`,
      WHATSAPP: `Hey ${first}! ${g} Quick message about ${company} — ${ctx}. ${cta}`,
      SMS: `Hi ${first}, this is [Name] from [Company]. ${cta} Reply STOP to opt out.`,
    };

    return {
      message: templates[channel?.toUpperCase()] || templates['EMAIL'],
      channel: channel || 'EMAIL',
      tone: tone || 'PROFESSIONAL',
    };
  }

  getSuggestedFollowUps(prospectId: string) {
    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect) return [];
    const suggestions: any[] = [];
    if (prospect.status === 'CALLBACK')
      suggestions.push({ type: 'CALL', message: 'Follow up on callback request', urgency: 'HIGH' });
    if (prospect.status === 'CONTACTED')
      suggestions.push({ type: 'EMAIL', message: 'Send follow-up email after initial contact', urgency: 'MEDIUM' });
    if (prospect.status === 'QUALIFIED')
      suggestions.push({ type: 'MEETING', message: 'Schedule a demo or discovery call', urgency: 'HIGH' });
    if (prospect.status === 'NEW')
      suggestions.push({ type: 'EMAIL', message: 'Send initial outreach email', urgency: 'LOW' });
    return suggestions;
  }
}
