import { Injectable } from '@nestjs/common';

// In-memory store (same pattern as knowledge/partners)
let prospects: any[] = [];
let callLogs: any[] = [];
let sequences: any[] = [];
let emailTemplates: any[] = [];
let idCounter = 1;

const uid = () => `out_${idCounter++}_${Date.now()}`;

@Injectable()
export class OutreachService {

  // ─── PROSPECTS ───────────────────────────────────────────────

  getProspects(orgId: string, userId: string, role: string) {
    const list = prospects.filter(p => p.orgId === orgId);
    // managers see all, others see only their own
    if (role === 'ADMIN' || role === 'MANAGER') return list;
    return list.filter(p => p.assignedTo === userId || !p.assignedTo);
  }

  createProspect(orgId: string, userId: string, data: any) {
    const p = { id: uid(), orgId, assignedTo: userId, status: 'NEW', ...data, createdAt: new Date() };
    prospects.push(p);
    return p;
  }

  updateProspect(id: string, data: any) {
    const idx = prospects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    prospects[idx] = { ...prospects[idx], ...data };
    return prospects[idx];
  }

  deleteProspect(id: string) {
    prospects = prospects.filter(p => p.id !== id);
    return { deleted: true };
  }

  importProspects(orgId: string, userId: string, rows: any[]) {
    const created = rows.map(row => ({
      id: uid(),
      orgId,
      assignedTo: userId,
      status: 'NEW',
      firstName: row['First Name'] || row.firstName || '',
      lastName: row['Last Name'] || row.lastName || '',
      email: row['Email'] || row.email || '',
      phone: row['Phone'] || row.phone || '',
      company: row['Company'] || row.company || '',
      title: row['Title'] || row.title || '',
      createdAt: new Date(),
    }));
    prospects.push(...created);
    return { imported: created.length, prospects: created };
  }

  // ─── CALL LOGS ───────────────────────────────────────────────

  getCallLogs(orgId: string, userId: string, role: string) {
    const list = callLogs.filter(c => c.orgId === orgId);
    if (role === 'ADMIN' || role === 'MANAGER') return list;
    return list.filter(c => c.userId === userId);
  }

  createCallLog(orgId: string, userId: string, data: any) {
    const log = {
      id: uid(),
      orgId,
      userId,
      prospectId: data.prospectId,
      outcome: data.outcome || 'NO_ANSWER',
      duration: data.duration || 0,
      notes: data.notes || '',
      callDate: data.callDate || new Date(),
      createdAt: new Date(),
    };
    callLogs.push(log);
    // update prospect status based on outcome
    if (data.prospectId) {
      const outcomeToStatus: Record<string, string> = {
        INTERESTED: 'QUALIFIED',
        NOT_INTERESTED: 'DEAD',
        CALLBACK: 'CALLBACK',
        ANSWERED: 'CONTACTED',
        NO_ANSWER: 'ATTEMPTED',
        VOICEMAIL: 'ATTEMPTED',
      };
      const newStatus = outcomeToStatus[data.outcome];
      if (newStatus) this.updateProspect(data.prospectId, { status: newStatus });
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
      id: uid(),
      orgId,
      createdBy: userId,
      name: data.name,
      steps: data.steps || [],
      createdAt: new Date(),
    };
    sequences.push(seq);
    return seq;
  }

  updateSequence(id: string, data: any) {
    const idx = sequences.findIndex(s => s.id === id);
    if (idx === -1) return null;
    sequences[idx] = { ...sequences[idx], ...data };
    return sequences[idx];
  }

  deleteSequence(id: string) {
    sequences = sequences.filter(s => s.id !== id);
    return { deleted: true };
  }

  // ─── EMAIL TEMPLATES ─────────────────────────────────────────

  getTemplates(orgId: string) {
    return emailTemplates.filter(t => t.orgId === orgId);
  }

  createTemplate(orgId: string, userId: string, data: any) {
    const t = {
      id: uid(),
      orgId,
      createdBy: userId,
      name: data.name,
      subject: data.subject,
      body: data.body,
      tags: data.tags || [],
      createdAt: new Date(),
    };
    emailTemplates.push(t);
    return t;
  }

  updateTemplate(id: string, data: any) {
    const idx = emailTemplates.findIndex(t => t.id === id);
    if (idx === -1) return null;
    emailTemplates[idx] = { ...emailTemplates[idx], ...data };
    return emailTemplates[idx];
  }

  deleteTemplate(id: string) {
    emailTemplates = emailTemplates.filter(t => t.id !== id);
    return { deleted: true };
  }

  // ─── ANALYTICS ───────────────────────────────────────────────

  getAnalytics(orgId: string) {
    const orgLogs = callLogs.filter(c => c.orgId === orgId);
    const orgProspects = prospects.filter(p => p.orgId === orgId);

    const totalCalls = orgLogs.length;
    const answered = orgLogs.filter(c => c.outcome === 'ANSWERED' || c.outcome === 'INTERESTED').length;
    const connectionRate = totalCalls > 0 ? Math.round((answered / totalCalls) * 100) : 0;
    const qualified = orgProspects.filter(p => p.status === 'QUALIFIED').length;
    const conversionRate = totalCalls > 0 ? Math.round((qualified / totalCalls) * 100) : 0;

    const byOutcome = ['ANSWERED', 'NO_ANSWER', 'CALLBACK', 'VOICEMAIL', 'INTERESTED', 'NOT_INTERESTED'].map(o => ({
      outcome: o,
      count: orgLogs.filter(c => c.outcome === o).length,
    }));

    const byStatus = ['NEW', 'ATTEMPTED', 'CONTACTED', 'QUALIFIED', 'CALLBACK', 'DEAD'].map(s => ({
      status: s,
      count: orgProspects.filter(p => p.status === s).length,
    }));

    // calls per day (last 7 days)
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return {
        date: key,
        calls: orgLogs.filter(c => new Date(c.callDate).toISOString().slice(0, 10) === key).length,
      };
    });

    return { totalCalls, connectionRate, conversionRate, qualified, totalProspects: orgProspects.length, byOutcome, byStatus, last7 };
  }
}
