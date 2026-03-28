import api from "./api";

// --- CRM ---
export const contactsApi = {
  list: () => api.get("/crm/contacts"),
  create: (data: any) => api.post("/crm/contacts", data),
};

export const companiesApi = {
  list: () => api.get("/crm/companies"),
  create: (data: any) => api.post("/crm/companies", data),
  update: (id: string, data: any) => api.patch(`/crm/companies/${id}`, data),
};

export const pipelinesApi = {
  list: () => api.get("/crm/pipelines"),
};

export const dealsApi = {
  create: (data: any) => api.post("/crm/deals", data),
  updateStage: (id: string, stageId: string) =>
    api.patch(`/crm/deals/${id}/stage`, { stageId }),
  update: (id: string, data: any) => api.patch(`/crm/deals/${id}`, data),
};

// --- PROJECTS ---
export const projectsApi = {
  list: () => api.get("/projects"),
  create: (data: any) => api.post("/projects", data),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  members: () => api.get("/projects/members"),
  workload: () => api.get("/projects/workload"),
  dashboard: () => api.get("/projects/dashboard"),
};

export const tasksApi = {
  list: (projectId?: string) => api.get(`/projects/tasks${projectId ? `?projectId=${projectId}` : ""}`),
  create: (data: any) => api.post("/projects/tasks", data),
  importTasks: (rows: any[]) => api.post("/projects/tasks/import", { rows }, { timeout: 60000 }),
  distribute: () => api.post("/projects/tasks/auto-reassign", {}),
  update: (id: string, data: any) => api.patch(`/projects/tasks/${id}`, data),
  updateStatus: (id: string, data: any) => api.patch(`/projects/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/projects/tasks/${id}`),
  // Checklist
  addNote: (taskId: string, content: string) => api.post(`/projects/tasks/${taskId}/notes`, { content }),
  deleteNote: (noteId: string) => api.delete(`/projects/tasks/notes/${noteId}`),
  // Time tracking
  logTime: (data: any) => api.post("/projects/time", data),
  getTime: (taskId?: string) => api.get(`/projects/time${taskId ? `?taskId=${taskId}` : ""}`),
  deleteTime: (id: string) => api.delete(`/projects/time/${id}`),
};

// --- FINANCE ---
export const invoicesApi = {
  list: () => api.get("/finance/invoices"),
  create: (data: any) => api.post("/finance/invoices", data),
  update: (id: string, data: any) => api.patch(`/finance/invoices/${id}`, data),
};

// --- OPERATIONS ---
export const employeesApi = {
  list: () => api.get("/operations/employees"),
  create: (data: any) => api.post("/operations/employees", data),
  update: (id: string, data: any) => api.patch(`/operations/employees/${id}`, data),
  stats: () => api.get("/operations/stats"),
};

export const attendanceApi = {
  list: () => api.get("/operations/attendance"),
  mark: (data: any) => api.post("/operations/attendance", data),
};

// --- MARKETING ---
export const campaignsApi = {
  list: () => api.get("/marketing/campaigns"),
  create: (data: any) => api.post("/marketing/campaigns", data),
  update: (id: string, data: any) => api.patch(`/marketing/campaigns/${id}`, data),
};

export const leadsApi = {
  list: () => api.get("/marketing/leads"),
  create: (data: any) => api.post("/marketing/leads", data),
  updateScore: (id: string, score: number) =>
    api.patch(`/marketing/leads/${id}/score`, { score }),
};

// --- CLIENTS ---
export const ticketsApi = {
  list: () => api.get("/clients/tickets"),
  create: (data: any) => api.post("/clients/tickets", data),
  update: (id: string, data: any) => api.patch(`/clients/tickets/${id}`, data),
  stats: () => api.get("/clients/stats"),
};

// --- ANALYTICS ---
export const analyticsApi = {
  overview: () => api.get("/analytics/overview"),
  revenueByMonth: () => api.get("/analytics/revenue-by-month"),
};

// --- KNOWLEDGE ---
export const knowledgeApi = {
  scripts: () => api.get("/knowledge/scripts"),
  createScript: (data: any) => api.post("/knowledge/scripts", data),
  updateScript: (id: string, data: any) => api.patch(`/knowledge/scripts/${id}`, data),
  deleteScript: (id: string) => api.delete(`/knowledge/scripts/${id}`),
  playbooks: () => api.get("/knowledge/playbooks"),
  createPlaybook: (data: any) => api.post("/knowledge/playbooks", data),
  deletePlaybook: (id: string) => api.delete(`/knowledge/playbooks/${id}`),
  templates: () => api.get("/knowledge/templates"),
  createTemplate: (data: any) => api.post("/knowledge/templates", data),
  deleteTemplate: (id: string) => api.delete(`/knowledge/templates/${id}`),
};

// --- OUTREACH ---
export const outreachApi = {
  // Prospects
  prospects: () => api.get("/outreach/prospects"),
  createProspect: (data: any) => api.post("/outreach/prospects", data),
  updateProspect: (id: string, data: any) => api.patch(`/outreach/prospects/${id}`, data),
  deleteProspect: (id: string) => api.delete(`/outreach/prospects/${id}`),
  importProspects: (rows: any[]) => api.post("/outreach/prospects/import", { rows }),
  assignProspect: (id: string, assigneeId: string) => api.patch(`/outreach/prospects/${id}/assign`, { assigneeId }),
  // Calls
  calls: () => api.get("/outreach/calls"),
  createCall: (data: any) => api.post("/outreach/calls", data),
  deleteCall: (id: string) => api.delete(`/outreach/calls/${id}`),
  // Sequences
  sequences: () => api.get("/outreach/sequences"),
  createSequence: (data: any) => api.post("/outreach/sequences", data),
  updateSequence: (id: string, data: any) => api.patch(`/outreach/sequences/${id}`, data),
  deleteSequence: (id: string) => api.delete(`/outreach/sequences/${id}`),
  enrollProspects: (sequenceId: string, prospectIds: string[]) =>
    api.post(`/outreach/sequences/${sequenceId}/enroll`, { prospectIds }),
  getEnrollments: (prospectId?: string, sequenceId?: string) =>
    api.get(`/outreach/enrollments${prospectId ? `?prospectId=${prospectId}` : sequenceId ? `?sequenceId=${sequenceId}` : ""}`),
  // Templates
  templates: () => api.get("/outreach/templates"),
  createTemplate: (data: any) => api.post("/outreach/templates", data),
  updateTemplate: (id: string, data: any) => api.patch(`/outreach/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/outreach/templates/${id}`),
  // Inbox
  inbox: (prospectId?: string, channel?: string) =>
    api.get(`/outreach/inbox${prospectId ? `?prospectId=${prospectId}` : channel ? `?channel=${channel}` : ""}`),
  sendMessage: (data: any) => api.post("/outreach/inbox", data),
  markRead: (id: string) => api.patch(`/outreach/inbox/${id}/read`, {}),
  // Activity feed
  activities: (prospectId?: string) =>
    api.get(`/outreach/activities${prospectId ? `?prospectId=${prospectId}` : ""}`),
  // SDR stats
  sdrStats: () => api.get("/outreach/sdr-stats"),
  // Analytics
  analytics: () => api.get("/outreach/analytics"),
  // Daily distribution
  distributeLeads: (leadsPerSdr?: number) => api.post("/outreach/distribute", { leadsPerSdr }),
  myLeadsToday: () => api.get("/outreach/my-leads-today"),
  // AI
  generateMessage: (data: any) => api.post("/outreach/ai/generate-message", data),
  getFollowUps: (prospectId: string) => api.get(`/outreach/ai/follow-ups/${prospectId}`),
};

// --- NOTIFICATIONS ---
export const notificationsApi = {
  list: () => api.get("/notifications"),
  unreadCount: () => api.get("/notifications/unread-count"),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`, {}),
  markAllRead: () => api.patch("/notifications/read-all", {}),
};

// --- PARTNERS ---
export const partnersApi = {
  list: () => api.get("/partners"),
  create: (data: any) => api.post("/partners", data),
  update: (id: string, data: any) => api.patch(`/partners/${id}`, data),
  delete: (id: string) => api.delete(`/partners/${id}`),
  stats: () => api.get("/partners/stats"),
  payouts: () => api.get("/partners/payouts"),
  createPayout: (data: any) => api.post("/partners/payouts", data),
  approvePayout: (id: string) => api.patch(`/partners/payouts/${id}/approve`, {}),
};

export const teamApi = {
  members: () => api.get("/team/members"),
  invite: (data: { email: string; role: string }) => api.post("/team/invite", data),
  invites: () => api.get("/team/invites"),
  revokeInvite: (id: string) => api.delete(`/team/invites/${id}`),
  changeRole: (memberId: string, role: string) => api.patch(`/team/members/${memberId}/role`, { role }),
  removeMember: (memberId: string) => api.delete(`/team/members/${memberId}`),
};

export const superAdminApi = {
  stats: () => api.get("/super-admin/stats"),
  orgs: () => api.get("/super-admin/orgs"),
  orgDetail: (id: string) => api.get(`/super-admin/orgs/${id}`),
};

export const inviteApi = {
  validate: (token: string) => api.get(`/auth/invite/${token}`),
  accept: (data: { token: string; name: string; password: string }) => api.post("/auth/signup-invite", data),
};
