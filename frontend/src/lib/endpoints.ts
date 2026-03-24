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
};

export const tasksApi = {
  list: () => api.get("/projects/tasks"),
  create: (data: any) => api.post("/projects/tasks", data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/projects/tasks/${id}`, { status }),
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
