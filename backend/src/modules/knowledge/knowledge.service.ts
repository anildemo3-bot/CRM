import { Injectable } from '@nestjs/common';

let SCRIPTS: any[] = [
  { id: 's1', category: 'Outreach', title: 'Cold Email — SaaS Pain Point', content: 'Subject: Quick question, {{first_name}}\n\nHey {{first_name}}, saw you\'re scaling {{company}}.\n\nWe help SaaS teams reduce [pain] by [X]%.\n\nWorth a 15-min call this week?', tags: ['cold', 'saas', 'email'], createdAt: new Date().toISOString() },
  { id: 's2', category: 'Sales', title: 'Discovery Call Framework', content: '1. SITUATION: Walk me through how you handle [X]?\n2. PROBLEM: What\'s the biggest challenge?\n3. IMPLICATION: What happens if you don\'t solve this?\n4. NEED-PAYOFF: If we fixed that, what would it mean for you?', tags: ['sales', 'discovery', 'SPIN'], createdAt: new Date().toISOString() },
  { id: 's3', category: 'Outreach', title: 'LinkedIn DM Opener', content: 'Hey {{first_name}}, saw your post about [topic] — resonated a lot.\n\nWe help [niche] companies [outcome]. Would a quick call make sense?', tags: ['linkedin', 'dm'], createdAt: new Date().toISOString() },
];

let PLAYBOOKS: any[] = [
  { id: 'p1', title: 'New Client Onboarding', category: 'Delivery', steps: 8, performance: 'High', lastUpdated: '2024-03-10', createdAt: new Date().toISOString() },
  { id: 'p2', title: 'Lead-to-Close Playbook', category: 'Sales', steps: 12, performance: 'Top', lastUpdated: '2024-03-08', createdAt: new Date().toISOString() },
  { id: 'p3', title: 'Churn Prevention SOP', category: 'Retention', steps: 6, performance: 'Med', lastUpdated: '2024-03-05', createdAt: new Date().toISOString() },
];

let TEMPLATES: any[] = [
  { id: 't1', title: 'Proposal Template — Agency Retainer', category: 'Sales', description: 'Full agency retainer proposal with pricing tiers', uses: 42, createdAt: new Date().toISOString() },
  { id: 't2', title: 'NDA Template', category: 'Legal', description: 'Standard mutual NDA for client engagements', uses: 28, createdAt: new Date().toISOString() },
  { id: 't3', title: 'Sprint Report Template', category: 'Delivery', description: 'Weekly sprint summary for client updates', uses: 67, createdAt: new Date().toISOString() },
];

let counter = 100;

@Injectable()
export class KnowledgeService {
  getScripts() { return SCRIPTS; }
  createScript(data: any) {
    const item = { id: `s${++counter}`, ...data, createdAt: new Date().toISOString() };
    SCRIPTS.push(item);
    return item;
  }
  updateScript(id: string, data: any) {
    SCRIPTS = SCRIPTS.map(s => s.id === id ? { ...s, ...data } : s);
    return SCRIPTS.find(s => s.id === id);
  }
  deleteScript(id: string) {
    SCRIPTS = SCRIPTS.filter(s => s.id !== id);
    return { success: true };
  }

  getPlaybooks() { return PLAYBOOKS; }
  createPlaybook(data: any) {
    const item = { id: `p${++counter}`, ...data, createdAt: new Date().toISOString() };
    PLAYBOOKS.push(item);
    return item;
  }
  updatePlaybook(id: string, data: any) {
    PLAYBOOKS = PLAYBOOKS.map(p => p.id === id ? { ...p, ...data } : p);
    return PLAYBOOKS.find(p => p.id === id);
  }
  deletePlaybook(id: string) {
    PLAYBOOKS = PLAYBOOKS.filter(p => p.id !== id);
    return { success: true };
  }

  getTemplates() { return TEMPLATES; }
  createTemplate(data: any) {
    const item = { id: `t${++counter}`, ...data, uses: 0, createdAt: new Date().toISOString() };
    TEMPLATES.push(item);
    return item;
  }
  deleteTemplate(id: string) {
    TEMPLATES = TEMPLATES.filter(t => t.id !== id);
    return { success: true };
  }
}
