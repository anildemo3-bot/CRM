// @ts-ignore
const { PrismaClient } = require('@prisma/client');
// @ts-ignore
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Clean slate - delete in dependency order
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

  const hashedPassword = await bcrypt.hash('niche123', 10);

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Niche CRM Global',
      slug: 'niche-crm-global',
      settings: {
        create: { currency: 'USD', timezone: 'EST' },
      },
    },
  });

  // 2. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'nic@niche.com',
      password: hashedPassword,
      name: 'Nic Niche',
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      email: 'sarah@niche.com',
      password: hashedPassword,
      name: 'Sarah Johnson',
      role: 'DEVELOPER',
      organizationId: org.id,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: 'mike@niche.com',
      password: hashedPassword,
      name: 'Mike Chen',
      role: 'MANAGER',
      organizationId: org.id,
    },
  });

  // 3. Create Companies
  const companies = await Promise.all([
    prisma.company.create({ data: { name: 'Acme Corp', website: 'acme.com', industry: 'SaaS', size: 120, organizationId: org.id } }),
    prisma.company.create({ data: { name: 'Globex Inc', website: 'globex.com', industry: 'Finance', size: 350, organizationId: org.id } }),
    prisma.company.create({ data: { name: 'Initech', website: 'initech.com', industry: 'E-commerce', size: 85, organizationId: org.id } }),
    prisma.company.create({ data: { name: 'Soylent Corp', website: 'soylent.com', industry: 'Health Tech', size: 200, organizationId: org.id } }),
  ]);

  // 4. Create Contacts
  const contacts = await Promise.all([
    prisma.contact.create({ data: { firstName: 'Alice', lastName: 'Walker', email: 'alice@acme.com', phone: '+1-555-0101', position: 'CEO', organizationId: org.id, companyId: companies[0].id } }),
    prisma.contact.create({ data: { firstName: 'Bob', lastName: 'Chen', email: 'bob@globex.com', phone: '+1-555-0102', position: 'CTO', organizationId: org.id, companyId: companies[1].id } }),
    prisma.contact.create({ data: { firstName: 'Carol', lastName: 'Dunn', email: 'carol@initech.com', phone: '+1-555-0103', position: 'VP Sales', organizationId: org.id, companyId: companies[2].id } }),
    prisma.contact.create({ data: { firstName: 'Dan', lastName: 'Fox', email: 'dan@soylent.com', phone: '+1-555-0104', position: 'Founder', organizationId: org.id, companyId: companies[3].id } }),
  ]);

  // 5. Create Pipeline & Stages
  const pipeline = await prisma.pipeline.create({
    data: {
      name: 'Default Sales Pipeline',
      organizationId: org.id,
      stages: {
        create: [
          { name: 'Lead', order: 1 },
          { name: 'Qualified', order: 2 },
          { name: 'Meeting', order: 3 },
          { name: 'Proposal', order: 4 },
          { name: 'Negotiation', order: 5 },
          { name: 'Closed Won', order: 6 },
        ],
      },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  });

  const [s1, s2, s3, s4, s5, s6] = pipeline.stages;

  // 6. Create Deals
  await Promise.all([
    prisma.deal.create({ data: { title: 'Acme Corp — SaaS Platform', value: 24000, status: 'OPEN', organizationId: org.id, stageId: s4.id, contactId: contacts[0].id, companyId: companies[0].id, expectedClose: new Date('2026-04-30') } }),
    prisma.deal.create({ data: { title: 'Globex — Enterprise Suite', value: 48000, status: 'OPEN', organizationId: org.id, stageId: s5.id, contactId: contacts[1].id, companyId: companies[1].id, expectedClose: new Date('2026-04-15') } }),
    prisma.deal.create({ data: { title: 'Initech — Growth Package', value: 12000, status: 'OPEN', organizationId: org.id, stageId: s2.id, contactId: contacts[2].id, companyId: companies[2].id, expectedClose: new Date('2026-05-15') } }),
    prisma.deal.create({ data: { title: 'Soylent Corp — Starter Plan', value: 6000, status: 'WON', organizationId: org.id, stageId: s6.id, contactId: contacts[3].id, companyId: companies[3].id, expectedClose: new Date('2026-03-15') } }),
    prisma.deal.create({ data: { title: 'New Lead — Tech Startup', value: 9500, status: 'OPEN', organizationId: org.id, stageId: s1.id, expectedClose: new Date('2026-06-01') } }),
    prisma.deal.create({ data: { title: 'E-commerce Brand — Retainer', value: 3500, status: 'OPEN', organizationId: org.id, stageId: s3.id, expectedClose: new Date('2026-05-01') } }),
  ]);

  // 7. Create Projects & Tasks
  const p1 = await prisma.project.create({
    data: {
      name: 'Acme Corp — CRM Build',
      description: 'Full custom CRM system for Acme sales team',
      status: 'ACTIVE',
      organizationId: org.id,
      tasks: {
        create: [
          { title: 'Backend API setup', priority: 'URGENT', status: 'DONE', creatorId: admin.id, assigneeId: dev1.id },
          { title: 'Frontend dashboard', priority: 'HIGH', status: 'IN_PROGRESS', creatorId: admin.id, assigneeId: dev1.id },
          { title: 'Integration testing', priority: 'HIGH', status: 'TODO', creatorId: admin.id, assigneeId: dev2.id },
          { title: 'Client demo preparation', priority: 'MEDIUM', status: 'TODO', creatorId: admin.id },
        ],
      },
    },
  });

  const p2 = await prisma.project.create({
    data: {
      name: 'Globex — Analytics Platform',
      description: 'Real-time analytics dashboard for finance team',
      status: 'ACTIVE',
      organizationId: org.id,
      tasks: {
        create: [
          { title: 'Data pipeline architecture', priority: 'URGENT', status: 'IN_PROGRESS', creatorId: admin.id, assigneeId: dev2.id },
          { title: 'Chart components', priority: 'HIGH', status: 'TODO', creatorId: admin.id, assigneeId: dev1.id },
          { title: 'Export to PDF feature', priority: 'MEDIUM', status: 'TODO', creatorId: admin.id },
        ],
      },
    },
  });

  const p3 = await prisma.project.create({
    data: {
      name: 'Initech — Landing Page',
      description: 'Marketing landing page with A/B testing',
      status: 'PLANNING',
      organizationId: org.id,
      tasks: {
        create: [
          { title: 'Design mockups', priority: 'HIGH', status: 'IN_PROGRESS', creatorId: admin.id },
          { title: 'Copy writing', priority: 'MEDIUM', status: 'TODO', creatorId: admin.id },
        ],
      },
    },
  });

  // 8. Create Invoices
  await Promise.all([
    prisma.invoice.create({ data: { invoiceNumber: 'INV-001', amount: 12000, tax: 0, status: 'PAID', organizationId: org.id, clientId: contacts[0].id, dueDate: new Date('2026-02-28') } }),
    prisma.invoice.create({ data: { invoiceNumber: 'INV-002', amount: 4500, tax: 450, status: 'SENT', organizationId: org.id, clientId: contacts[1].id, dueDate: new Date('2026-04-15') } }),
    prisma.invoice.create({ data: { invoiceNumber: 'INV-003', amount: 25000, tax: 2500, status: 'SENT', organizationId: org.id, clientId: contacts[2].id, dueDate: new Date('2026-03-31') } }),
    prisma.invoice.create({ data: { invoiceNumber: 'INV-004', amount: 8000, tax: 0, status: 'PAID', organizationId: org.id, clientId: contacts[3].id, dueDate: new Date('2026-02-15') } }),
    prisma.invoice.create({ data: { invoiceNumber: 'INV-005', amount: 3200, tax: 320, status: 'DRAFT', organizationId: org.id, dueDate: new Date('2026-05-01') } }),
  ]);

  // 9. Create Employees
  await Promise.all([
    prisma.employee.create({ data: { name: 'Sarah Johnson', email: 'sarah@niche.com', role: 'Senior Developer', salary: 95000, joiningDate: new Date('2023-01-15'), organizationId: org.id } }),
    prisma.employee.create({ data: { name: 'Mike Chen', email: 'mike@niche.com', role: 'Project Manager', salary: 85000, joiningDate: new Date('2022-06-01'), organizationId: org.id } }),
    prisma.employee.create({ data: { name: 'Emma Lee', email: 'emma@niche.com', role: 'SDR', salary: 65000, joiningDate: new Date('2024-01-10'), organizationId: org.id } }),
    prisma.employee.create({ data: { name: 'John Park', email: 'john@niche.com', role: 'Developer', salary: 78000, joiningDate: new Date('2023-07-20'), organizationId: org.id } }),
    prisma.employee.create({ data: { name: 'Lisa Wang', email: 'lisa@niche.com', role: 'UI Designer', salary: 72000, joiningDate: new Date('2023-03-08'), organizationId: org.id } }),
  ]);

  // 10. Create Campaigns & Leads
  const camp1 = await prisma.campaign.create({ data: { name: 'Q1 Cold Email — SaaS Founders', type: 'EMAIL', status: 'ACTIVE', organizationId: org.id } });
  const camp2 = await prisma.campaign.create({ data: { name: 'LinkedIn DM — E-commerce Brands', type: 'SOCIAL', status: 'ACTIVE', organizationId: org.id } });
  const camp3 = await prisma.campaign.create({ data: { name: 'SMS Re-engagement — Lost Leads', type: 'SMS', status: 'ACTIVE', organizationId: org.id } });

  await Promise.all([
    prisma.lead.create({ data: { email: 'alice.walker@example.com', phone: '+1-555-0201', score: 92, campaignId: camp1.id } }),
    prisma.lead.create({ data: { email: 'bob.chen@example.com', score: 74, campaignId: camp1.id } }),
    prisma.lead.create({ data: { email: 'carol.dunn@example.com', score: 58, campaignId: camp2.id } }),
    prisma.lead.create({ data: { email: 'dan.fox@example.com', score: 41, campaignId: camp3.id } }),
  ]);

  // 11. Create Support Tickets
  await Promise.all([
    prisma.ticket.create({ data: { subject: 'Critical: Login bypass identified', description: 'Security vulnerability found in auth flow.', status: 'OPEN', priority: 'URGENT', organizationId: org.id } }),
    prisma.ticket.create({ data: { subject: 'Export to CSV missing field', description: 'The "phone" field is missing from CSV exports.', status: 'IN_PROGRESS', priority: 'MEDIUM', organizationId: org.id } }),
    prisma.ticket.create({ data: { subject: 'Dashboard load time latency', description: 'Dashboard takes 8s to load on first paint.', status: 'RESOLVED', priority: 'LOW', organizationId: org.id } }),
    prisma.ticket.create({ data: { subject: 'Slack integration auth error', description: 'OAuth callback fails intermittently.', status: 'OPEN', priority: 'HIGH', organizationId: org.id } }),
  ]);

  console.log(`✅ Seed complete for org: ${org.name}`);
  console.log(`   Login: nic@niche.com / niche123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
