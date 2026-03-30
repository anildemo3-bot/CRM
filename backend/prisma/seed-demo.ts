/**
 * Demo seed script — creates one user per role for testing.
 * Run: npx ts-node prisma/seed-demo.ts
 *
 * All demo users share org "Demo Agency" and password: Demo@1234
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Demo@1234';

const DEMO_USERS = [
  { name: 'Admin Demo',       email: 'admin@demo.com',       role: 'ADMIN'       },
  { name: 'Manager Demo',     email: 'manager@demo.com',     role: 'MANAGER'     },
  { name: 'Developer Demo',   email: 'developer@demo.com',   role: 'DEVELOPER'   },
  { name: 'Cold Caller Demo', email: 'coldcaller@demo.com',  role: 'COLD_CALLER' },
  { name: 'Outreacher Demo',  email: 'outreacher@demo.com',  role: 'OUTREACHER'  },
  { name: 'Freelancer Demo',  email: 'freelancer@demo.com',  role: 'FREELANCER'  },
];

async function main() {
  console.log('Seeding demo users...\n');

  // Get or create demo org
  let org = await prisma.organization.findFirst({ where: { slug: 'demo-agency' } });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'Demo Agency', slug: 'demo-agency' },
    });
    console.log('Created org: Demo Agency');
  } else {
    console.log('Using existing org: Demo Agency');
  }

  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const u of DEMO_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`  SKIP  ${u.email} (already exists)`);
      continue;
    }
    await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: hashed,
        role: u.role as any,
        organizationId: org.id,
      },
    });
    console.log(`  ✓  ${u.email}  [${u.role}]`);
  }

  console.log('\nDemo credentials:');
  console.log('Password for all: Demo@1234\n');
  for (const u of DEMO_USERS) {
    console.log(`  ${u.role.padEnd(12)} ${u.email}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
