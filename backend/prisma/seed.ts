// @ts-ignore
const { PrismaClient } = require('@prisma/client');
// @ts-ignore
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // ── CLEAN SLATE ───────────────────────────────────────────────
  await prisma.lineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.note.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.board.deleteMany();
  await prisma.project.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.message.deleteMany();
  await prisma.user.deleteMany();
  await prisma.orgSettings.deleteMany();
  await prisma.organization.deleteMany();

  const pw = await bcrypt.hash('niche123', 10);

  // ── 1. ORGANIZATION ───────────────────────────────────────────
  const org = await prisma.organization.create({
    data: {
      name: 'Niche CRM Global',
      slug: 'niche-crm-global',
      settings: { create: { currency: 'USD', timezone: 'EST' } },
    },
  });

  // ── 2. USERS (5) ─────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { email: 'nic@niche.com', password: pw, name: 'Nic Niche', role: 'ADMIN', organizationId: org.id },
  });
  const sarah = await prisma.user.create({
    data: { email: 'sarah@niche.com', password: pw, name: 'Sarah Johnson', role: 'DEVELOPER', organizationId: org.id },
  });
  const mike = await prisma.user.create({
    data: { email: 'mike@niche.com', password: pw, name: 'Mike Chen', role: 'MANAGER', organizationId: org.id },
  });
  const emma = await prisma.user.create({
    data: { email: 'emma@niche.com', password: pw, name: 'Emma Lee', role: 'SALES', organizationId: org.id },
  });
  const john = await prisma.user.create({
    data: { email: 'john@niche.com', password: pw, name: 'John Park', role: 'DEVELOPER', organizationId: org.id },
  });
  const lisa = await prisma.user.create({
    data: { email: 'lisa@niche.com', password: pw, name: 'Lisa Wang', role: 'DEVELOPER', organizationId: org.id },
  });

  // ── 3. COMPANIES (8) ─────────────────────────────────────────
  const [acme, globex, initech, soylent, umbrella, wayne, stark, cyberdyne] = await Promise.all([
    prisma.company.create({ data: { name: 'Acme Corp', website: 'acme.com', industry: 'SaaS', size: 120, organizationId: org.id } }),
    prisma.company.create({ data: { name: 'Globex Inc', website: 'globex.com', industry: 'Finance', size: 350, organizationId: org.id } }),
    prisma.company.create({ data: { name: 'Initech', website: 'initech.com', industry: 'E-commerce', size: 85, organizationId: org.id } }),
    prisma.company.create({ data: { name: 'Soylent Corp', website: 'soylent.com', industry: 'Health Tech', size: 200, organizationId: org.id } }),
    prisma.company.create({ data: { name: 'Umbrella Tech', website: 'umbrella.io', industry: 'Cybersecurity', size: 430, organizationId: org.id } }),
    prisma.company.create({ data: { name: 'Wayne Enterprises', website: 'wayne.com', industry: 'Conglomerate', size: 12000, organizationId: org.id } }),
    prisma.company.create({ data: { name: 'Stark Industries', website: 'stark.com', industry: 'Defense / AI', size: 5000, organizationId: org.id } }),
    prisma.company.create({ data: { name: 'Cyberdyne Systems', website: 'cyberdyne.com', industry: 'Robotics', size: 280, organizationId: org.id } }),
  ]);

  // ── 4. CONTACTS (10) ─────────────────────────────────────────
  const [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10] = await Promise.all([
    prisma.contact.create({ data: { firstName: 'Alice', lastName: 'Walker', email: 'alice@acme.com', phone: '+1-555-0101', position: 'CEO', organizationId: org.id, companyId: acme.id } }),
    prisma.contact.create({ data: { firstName: 'Bob', lastName: 'Chen', email: 'bob@globex.com', phone: '+1-555-0102', position: 'CTO', organizationId: org.id, companyId: globex.id } }),
    prisma.contact.create({ data: { firstName: 'Carol', lastName: 'Dunn', email: 'carol@initech.com', phone: '+1-555-0103', position: 'VP Sales', organizationId: org.id, companyId: initech.id } }),
    prisma.contact.create({ data: { firstName: 'Dan', lastName: 'Fox', email: 'dan@soylent.com', phone: '+1-555-0104', position: 'Founder', organizationId: org.id, companyId: soylent.id } }),
    prisma.contact.create({ data: { firstName: 'Eve', lastName: 'Miles', email: 'eve@umbrella.io', phone: '+1-555-0105', position: 'CISO', organizationId: org.id, companyId: umbrella.id } }),
    prisma.contact.create({ data: { firstName: 'Frank', lastName: 'Wayne', email: 'frank@wayne.com', phone: '+1-555-0106', position: 'COO', organizationId: org.id, companyId: wayne.id } }),
    prisma.contact.create({ data: { firstName: 'Grace', lastName: 'Stark', email: 'grace@stark.com', phone: '+1-555-0107', position: 'Head of AI', organizationId: org.id, companyId: stark.id } }),
    prisma.contact.create({ data: { firstName: 'Henry', lastName: 'Lee', email: 'henry@cyberdyne.com', phone: '+1-555-0108', position: 'CTO', organizationId: org.id, companyId: cyberdyne.id } }),
    prisma.contact.create({ data: { firstName: 'Iris', lastName: 'Park', email: 'iris@acme.com', phone: '+1-555-0109', position: 'Procurement', organizationId: org.id, companyId: acme.id } }),
    prisma.contact.create({ data: { firstName: 'Jake', lastName: 'Moon', email: 'jake@globex.com', phone: '+1-555-0110', position: 'CFO', organizationId: org.id, companyId: globex.id } }),
  ]);

  // ── 5. PIPELINE + STAGES ─────────────────────────────────────
  const pipeline = await prisma.pipeline.create({
    data: {
      name: 'Default Sales Pipeline',
      organizationId: org.id,
      stages: {
        create: [
          { name: 'Lead', order: 1 },
          { name: 'Qualified', order: 2 },
          { name: 'Meeting Booked', order: 3 },
          { name: 'Proposal Sent', order: 4 },
          { name: 'Negotiation', order: 5 },
          { name: 'Closed Won', order: 6 },
        ],
      },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  });
  const [s1, s2, s3, s4, s5, s6] = pipeline.stages;

  // ── 6. DEALS (10) ────────────────────────────────────────────
  await Promise.all([
    prisma.deal.create({ data: { title: 'Acme Corp — SaaS Platform', value: 24000, status: 'OPEN', organizationId: org.id, stageId: s4.id, contactId: c1.id, companyId: acme.id, expectedClose: new Date('2026-04-30') } }),
    prisma.deal.create({ data: { title: 'Globex — Enterprise Suite', value: 48000, status: 'OPEN', organizationId: org.id, stageId: s5.id, contactId: c2.id, companyId: globex.id, expectedClose: new Date('2026-04-15') } }),
    prisma.deal.create({ data: { title: 'Initech — Growth Package', value: 12000, status: 'OPEN', organizationId: org.id, stageId: s2.id, contactId: c3.id, companyId: initech.id, expectedClose: new Date('2026-05-15') } }),
    prisma.deal.create({ data: { title: 'Soylent Corp — Starter Plan', value: 6000, status: 'WON', organizationId: org.id, stageId: s6.id, contactId: c4.id, companyId: soylent.id, expectedClose: new Date('2026-03-15') } }),
    prisma.deal.create({ data: { title: 'Umbrella Tech — Security Suite', value: 36000, status: 'OPEN', organizationId: org.id, stageId: s3.id, contactId: c5.id, companyId: umbrella.id, expectedClose: new Date('2026-05-01') } }),
    prisma.deal.create({ data: { title: 'Wayne Enterprises — Custom ERP', value: 120000, status: 'OPEN', organizationId: org.id, stageId: s4.id, contactId: c6.id, companyId: wayne.id, expectedClose: new Date('2026-06-30') } }),
    prisma.deal.create({ data: { title: 'Stark Industries — AI Dashboard', value: 75000, status: 'OPEN', organizationId: org.id, stageId: s3.id, contactId: c7.id, companyId: stark.id, expectedClose: new Date('2026-05-20') } }),
    prisma.deal.create({ data: { title: 'Cyberdyne — Robotics CRM', value: 18000, status: 'OPEN', organizationId: org.id, stageId: s1.id, contactId: c8.id, companyId: cyberdyne.id, expectedClose: new Date('2026-07-01') } }),
    prisma.deal.create({ data: { title: 'Acme Corp — Support Retainer', value: 4800, status: 'WON', organizationId: org.id, stageId: s6.id, contactId: c9.id, companyId: acme.id, expectedClose: new Date('2026-03-01') } }),
    prisma.deal.create({ data: { title: 'Globex — Analytics Add-on', value: 9500, status: 'LOST', organizationId: org.id, stageId: s2.id, contactId: c10.id, companyId: globex.id, expectedClose: new Date('2026-02-28') } }),
  ]);

  // ── 7. PROJECTS (5) + TASKS ───────────────────────────────────
  const p1 = await prisma.project.create({
    data: {
      name: 'Acme Corp — CRM Build',
      description: 'Full custom CRM system for Acme sales team',
      status: 'ACTIVE',
      organizationId: org.id,
      tasks: {
        create: [
          { title: 'Backend API setup', description: 'NestJS + Prisma scaffold with auth', priority: 'URGENT', status: 'DONE', creatorId: admin.id, assigneeId: sarah.id, dueDate: new Date('2026-03-10') },
          { title: 'Frontend dashboard UI', description: 'Next.js + Tailwind dark theme dashboard', priority: 'HIGH', status: 'IN_PROGRESS', creatorId: admin.id, assigneeId: sarah.id, dueDate: new Date('2026-04-05') },
          { title: 'Integration testing', description: 'Write E2E tests for all API endpoints', priority: 'HIGH', status: 'TODO', creatorId: admin.id, assigneeId: john.id, dueDate: new Date('2026-04-20') },
          { title: 'Client demo preparation', description: 'Prepare live demo environment and slides', priority: 'MEDIUM', status: 'TODO', creatorId: admin.id, assigneeId: mike.id, dueDate: new Date('2026-04-25') },
          { title: 'Deploy to production', description: 'Vercel + Render deploy with env vars', priority: 'URGENT', status: 'TODO', creatorId: admin.id, assigneeId: john.id, dueDate: new Date('2026-04-30') },
        ],
      },
    },
    include: { tasks: true },
  });

  const p2 = await prisma.project.create({
    data: {
      name: 'Globex — Analytics Platform',
      description: 'Real-time analytics dashboard for finance team',
      status: 'ACTIVE',
      organizationId: org.id,
      tasks: {
        create: [
          { title: 'Data pipeline architecture', description: 'Design ETL pipeline from PostgreSQL → charts', priority: 'URGENT', status: 'IN_PROGRESS', creatorId: admin.id, assigneeId: john.id, dueDate: new Date('2026-04-10') },
          { title: 'Chart components (Recharts)', description: 'Bar, Line, Pie charts with dark theme', priority: 'HIGH', status: 'TODO', creatorId: admin.id, assigneeId: lisa.id, dueDate: new Date('2026-04-18') },
          { title: 'Export to PDF feature', description: 'Allow users to download reports as PDF', priority: 'MEDIUM', status: 'TODO', creatorId: admin.id, assigneeId: john.id, dueDate: new Date('2026-04-28') },
          { title: 'Real-time WebSocket updates', description: 'Live data refresh every 30s via WS', priority: 'HIGH', status: 'REVIEW', creatorId: admin.id, assigneeId: sarah.id, dueDate: new Date('2026-04-12') },
          { title: 'QA + bug fixes round 1', description: 'Fix issues found during client UAT', priority: 'HIGH', status: 'TODO', creatorId: mike.id, assigneeId: lisa.id, dueDate: new Date('2026-05-01') },
        ],
      },
    },
    include: { tasks: true },
  });

  const p3 = await prisma.project.create({
    data: {
      name: 'Umbrella Tech — Security Dashboard',
      description: 'Threat monitoring + incident response dashboard',
      status: 'ACTIVE',
      organizationId: org.id,
      tasks: {
        create: [
          { title: 'Threat feed integration', description: 'Connect to VirusTotal + Shodan APIs', priority: 'URGENT', status: 'TODO', creatorId: admin.id, assigneeId: john.id, dueDate: new Date('2026-04-15') },
          { title: 'Incident timeline UI', description: 'Visual timeline of security events', priority: 'HIGH', status: 'IN_PROGRESS', creatorId: admin.id, assigneeId: lisa.id, dueDate: new Date('2026-04-20') },
          { title: 'Alert notification system', description: 'Email + Slack alerts on critical events', priority: 'URGENT', status: 'TODO', creatorId: admin.id, assigneeId: sarah.id, dueDate: new Date('2026-04-10') },
          { title: 'Role-based access control', description: 'RBAC for analyst vs admin roles', priority: 'HIGH', status: 'REVIEW', creatorId: admin.id, assigneeId: john.id, dueDate: new Date('2026-04-14') },
        ],
      },
    },
    include: { tasks: true },
  });

  const p4 = await prisma.project.create({
    data: {
      name: 'Wayne Enterprises — Custom ERP',
      description: 'Enterprise resource planning system for 12,000 employees',
      status: 'PLANNING',
      organizationId: org.id,
      tasks: {
        create: [
          { title: 'Requirements gathering', description: 'Meetings with 5 department heads', priority: 'HIGH', status: 'DONE', creatorId: mike.id, assigneeId: mike.id, dueDate: new Date('2026-03-20') },
          { title: 'System architecture design', description: 'Design microservices architecture + DB schema', priority: 'URGENT', status: 'IN_PROGRESS', creatorId: admin.id, assigneeId: sarah.id, dueDate: new Date('2026-04-08') },
          { title: 'Vendor selection for hosting', description: 'Evaluate AWS vs Azure vs GCP', priority: 'MEDIUM', status: 'TODO', creatorId: mike.id, assigneeId: mike.id, dueDate: new Date('2026-04-22') },
          { title: 'Security compliance review', description: 'GDPR + SOC2 compliance checklist', priority: 'URGENT', status: 'TODO', creatorId: admin.id, assigneeId: john.id, dueDate: new Date('2026-04-30') },
        ],
      },
    },
    include: { tasks: true },
  });

  const p5 = await prisma.project.create({
    data: {
      name: 'Stark Industries — AI Dashboard',
      description: 'AI/ML model monitoring and management portal',
      status: 'ACTIVE',
      organizationId: org.id,
      tasks: {
        create: [
          { title: 'ML model metrics API', description: 'REST endpoints for accuracy, drift, latency', priority: 'URGENT', status: 'IN_PROGRESS', creatorId: admin.id, assigneeId: lisa.id, dueDate: new Date('2026-04-08') },
          { title: 'Model comparison UI', description: 'Side-by-side model performance comparison', priority: 'HIGH', status: 'TODO', creatorId: admin.id, assigneeId: sarah.id, dueDate: new Date('2026-04-18') },
          { title: 'Alerting on model drift', description: 'Trigger alert when accuracy drops >5%', priority: 'HIGH', status: 'TODO', creatorId: admin.id, assigneeId: john.id, dueDate: new Date('2026-04-25') },
          { title: 'Access control + audit logs', description: 'Track who accessed which model and when', priority: 'MEDIUM', status: 'REVIEW', creatorId: mike.id, assigneeId: lisa.id, dueDate: new Date('2026-04-15') },
          { title: 'Documentation + user guide', description: 'Write docs for all dashboard features', priority: 'LOW', status: 'TODO', creatorId: mike.id, assigneeId: emma.id, dueDate: new Date('2026-05-05') },
        ],
      },
    },
    include: { tasks: true },
  });

  // ── 8. NOTES (checklist items) on tasks ──────────────────────
  const allTasks = [
    ...p1.tasks, ...p2.tasks, ...p3.tasks, ...p4.tasks, ...p5.tasks,
  ];

  // Add checklist notes to the first 8 tasks
  const noteSets = [
    ['Set up NestJS project', 'Configure Prisma + PostgreSQL', 'Add JWT auth middleware', 'Write health check endpoint'],
    ['Create layout + sidebar', 'Build dashboard widgets', 'Add dark theme tokens', 'Mobile responsiveness check'],
    ['Write unit tests for auth', 'Write integration tests for CRM', 'Set up CI pipeline for tests'],
    ['Prepare slide deck', 'Set up demo DB with sample data', 'Rehearse demo flow'],
    ['Configure Vercel env vars', 'Set up Render backend', 'Run smoke tests post-deploy'],
    ['Design DB schema for ETL', 'Set up Kafka for streaming', 'Write aggregation queries'],
    ['Build BarChart component', 'Build LineChart component', 'Add tooltips + legends'],
    ['Integrate PDF library', 'Design PDF layout template', 'Handle large data pagination'],
  ];

  for (let i = 0; i < Math.min(allTasks.length, noteSets.length); i++) {
    for (const content of noteSets[i]) {
      await prisma.note.create({
        data: { content, userId: admin.id, taskId: allTasks[i].id },
      });
    }
  }

  // ── 9. TIME ENTRIES ──────────────────────────────────────────
  const timeData = [
    { userId: sarah.id, taskId: p1.tasks[0].id, duration: 240, note: 'Initial API scaffold', daysAgo: 10 },
    { userId: sarah.id, taskId: p1.tasks[0].id, duration: 180, note: 'Auth + JWT middleware', daysAgo: 9 },
    { userId: sarah.id, taskId: p1.tasks[1].id, duration: 300, note: 'Dashboard layout', daysAgo: 7 },
    { userId: sarah.id, taskId: p1.tasks[1].id, duration: 210, note: 'Widget components', daysAgo: 6 },
    { userId: john.id, taskId: p2.tasks[0].id, duration: 360, note: 'ETL pipeline design', daysAgo: 5 },
    { userId: john.id, taskId: p2.tasks[0].id, duration: 270, note: 'Pipeline implementation', daysAgo: 4 },
    { userId: lisa.id, taskId: p2.tasks[3].id, duration: 180, note: 'WebSocket server setup', daysAgo: 3 },
    { userId: lisa.id, taskId: p2.tasks[3].id, duration: 150, note: 'Client-side WS hooks', daysAgo: 2 },
    { userId: john.id, taskId: p3.tasks[3].id, duration: 240, note: 'RBAC middleware', daysAgo: 4 },
    { userId: lisa.id, taskId: p3.tasks[1].id, duration: 195, note: 'Timeline component', daysAgo: 3 },
    { userId: sarah.id, taskId: p4.tasks[1].id, duration: 420, note: 'Architecture docs', daysAgo: 2 },
    { userId: mike.id, taskId: p4.tasks[0].id, duration: 300, note: 'Dept head interviews', daysAgo: 8 },
    { userId: lisa.id, taskId: p5.tasks[0].id, duration: 330, note: 'Metrics API endpoints', daysAgo: 3 },
    { userId: lisa.id, taskId: p5.tasks[3].id, duration: 165, note: 'Audit log schema', daysAgo: 2 },
    { userId: sarah.id, taskId: p5.tasks[1].id, duration: 120, note: 'Comparison UI wireframe', daysAgo: 1 },
  ];

  for (const entry of timeData) {
    const date = new Date();
    date.setDate(date.getDate() - entry.daysAgo);
    await prisma.timeEntry.create({
      data: { userId: entry.userId, taskId: entry.taskId, duration: entry.duration, note: entry.note, date },
    });
  }

  // ── 10. INVOICES (7) ─────────────────────────────────────────
  await Promise.all([
    prisma.invoice.create({ data: { invoiceNumber: 'INV-001', amount: 12000, tax: 0, status: 'PAID', organizationId: org.id, clientId: c1.id, dueDate: new Date('2026-02-28') } }),
    prisma.invoice.create({ data: { invoiceNumber: 'INV-002', amount: 4500, tax: 450, status: 'SENT', organizationId: org.id, clientId: c2.id, dueDate: new Date('2026-04-15') } }),
    prisma.invoice.create({ data: { invoiceNumber: 'INV-003', amount: 25000, tax: 2500, status: 'SENT', organizationId: org.id, clientId: c3.id, dueDate: new Date('2026-03-31') } }),
    prisma.invoice.create({ data: { invoiceNumber: 'INV-004', amount: 8000, tax: 0, status: 'PAID', organizationId: org.id, clientId: c4.id, dueDate: new Date('2026-02-15') } }),
    prisma.invoice.create({ data: { invoiceNumber: 'INV-005', amount: 3200, tax: 320, status: 'DRAFT', organizationId: org.id, dueDate: new Date('2026-05-01') } }),
    prisma.invoice.create({ data: { invoiceNumber: 'INV-006', amount: 60000, tax: 6000, status: 'SENT', organizationId: org.id, clientId: c6.id, dueDate: new Date('2026-04-30') } }),
    prisma.invoice.create({ data: { invoiceNumber: 'INV-007', amount: 37500, tax: 3750, status: 'DRAFT', organizationId: org.id, clientId: c7.id, dueDate: new Date('2026-05-15') } }),
  ]);

  // ── 11. EMPLOYEES (6) ────────────────────────────────────────
  await Promise.all([
    prisma.employee.create({ data: { name: 'Sarah Johnson', email: 'sarah.emp@niche.com', role: 'Senior Developer', salary: 95000, joiningDate: new Date('2023-01-15'), organizationId: org.id } }),
    prisma.employee.create({ data: { name: 'Mike Chen', email: 'mike.emp@niche.com', role: 'Project Manager', salary: 85000, joiningDate: new Date('2022-06-01'), organizationId: org.id } }),
    prisma.employee.create({ data: { name: 'Emma Lee', email: 'emma.emp@niche.com', role: 'SDR / Sales', salary: 65000, joiningDate: new Date('2024-01-10'), organizationId: org.id } }),
    prisma.employee.create({ data: { name: 'John Park', email: 'john.emp@niche.com', role: 'Backend Developer', salary: 78000, joiningDate: new Date('2023-07-20'), organizationId: org.id } }),
    prisma.employee.create({ data: { name: 'Lisa Wang', email: 'lisa.emp@niche.com', role: 'UI / Frontend Dev', salary: 72000, joiningDate: new Date('2023-03-08'), organizationId: org.id } }),
    prisma.employee.create({ data: { name: 'Nic Niche', email: 'nic.emp@niche.com', role: 'CEO / Admin', salary: 150000, joiningDate: new Date('2021-01-01'), organizationId: org.id } }),
  ]);

  // ── 12. CAMPAIGNS + LEADS (3 campaigns, 10 leads) ────────────
  const camp1 = await prisma.campaign.create({ data: { name: 'Q1 Cold Email — SaaS Founders', type: 'EMAIL', status: 'ACTIVE', organizationId: org.id } });
  const camp2 = await prisma.campaign.create({ data: { name: 'LinkedIn DM — E-commerce Brands', type: 'SOCIAL', status: 'ACTIVE', organizationId: org.id } });
  const camp3 = await prisma.campaign.create({ data: { name: 'SMS Re-engagement — Lost Leads', type: 'SMS', status: 'ACTIVE', organizationId: org.id } });

  await Promise.all([
    prisma.lead.create({ data: { email: 'tom@techstartup.com', phone: '+1-555-0301', score: 92, campaignId: camp1.id } }),
    prisma.lead.create({ data: { email: 'anna@ecomstore.com', score: 81, campaignId: camp1.id } }),
    prisma.lead.create({ data: { email: 'paul@fintech.io', score: 74, campaignId: camp1.id } }),
    prisma.lead.create({ data: { email: 'nina@healthapp.co', phone: '+1-555-0304', score: 68, campaignId: camp2.id } }),
    prisma.lead.create({ data: { email: 'omar@retailchain.com', score: 55, campaignId: camp2.id } }),
    prisma.lead.create({ data: { email: 'priya@saasplatform.com', phone: '+1-555-0306', score: 88, campaignId: camp2.id } }),
    prisma.lead.create({ data: { email: 'quinn@logistics.com', score: 41, campaignId: camp3.id } }),
    prisma.lead.create({ data: { email: 'rose@marketing.agency', score: 37, campaignId: camp3.id } }),
    prisma.lead.create({ data: { email: 'sam@devtools.dev', phone: '+1-555-0309', score: 29, campaignId: camp3.id } }),
    prisma.lead.create({ data: { email: 'tara@realestate.com', score: 63, campaignId: camp2.id } }),
  ]);

  // ── 13. SUPPORT TICKETS (6) ──────────────────────────────────
  await Promise.all([
    prisma.ticket.create({ data: { subject: 'Critical: Login bypass identified', description: 'Security vulnerability found in auth flow — JWT secret exposed in logs.', status: 'OPEN', priority: 'URGENT', organizationId: org.id } }),
    prisma.ticket.create({ data: { subject: 'Export to CSV missing phone field', description: 'The phone column is absent from all CSV exports. Affects all users.', status: 'IN_PROGRESS', priority: 'HIGH', organizationId: org.id } }),
    prisma.ticket.create({ data: { subject: 'Dashboard load time > 8 seconds', description: 'Dashboard takes 8-10s to load on first paint. Likely N+1 query issue.', status: 'RESOLVED', priority: 'MEDIUM', organizationId: org.id } }),
    prisma.ticket.create({ data: { subject: 'Slack integration OAuth failure', description: 'OAuth callback fails intermittently — 500 error on redirect.', status: 'OPEN', priority: 'HIGH', organizationId: org.id } }),
    prisma.ticket.create({ data: { subject: 'Invoice PDF showing wrong tax', description: 'Tax calculation rounds down instead of up, causing invoice mismatch.', status: 'IN_PROGRESS', priority: 'MEDIUM', organizationId: org.id } }),
    prisma.ticket.create({ data: { subject: 'Mobile layout broken on iOS 17', description: 'Sidebar overlaps main content on iPhone 15 Safari.', status: 'OPEN', priority: 'HIGH', organizationId: org.id } }),
  ]);

  console.log('');
  console.log('✅  Seed complete!');
  console.log('');
  console.log('   Org     : Niche CRM Global');
  console.log('   Login   : nic@niche.com  /  niche123');
  console.log('');
  console.log('   Users seeded   : 6  (admin, manager, 3 devs, 1 sales)');
  console.log('   Companies      : 8');
  console.log('   Contacts       : 10');
  console.log('   Projects       : 5  (23 tasks total)');
  console.log('   Deals          : 10');
  console.log('   Time entries   : 15');
  console.log('   Checklist notes: 29');
  console.log('   Invoices       : 7');
  console.log('   Employees      : 6');
  console.log('   Campaigns      : 3  (10 leads)');
  console.log('   Tickets        : 6');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
