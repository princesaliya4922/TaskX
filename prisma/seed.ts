import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      password: hashedPassword,
      name: 'John Doe',
      avatarUrl: null,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      password: hashedPassword,
      name: 'Jane Smith',
      avatarUrl: null,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'mike@example.com' },
    update: {},
    create: {
      email: 'mike@example.com',
      password: hashedPassword,
      name: 'Mike Johnson',
      avatarUrl: null,
    },
  });

  console.log('✅ Created demo users');

  // Create demo organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
      ticketPrefix: 'DEMO',
      description: 'A demo organization for testing SprintX features',
      ownerId: user1.id,
    },
  });

  console.log('✅ Created demo organization');

  // Add members to organization
  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: user1.id,
        organizationId: organization.id,
      },
    },
    update: {},
    create: {
      userId: user1.id,
      organizationId: organization.id,
      role: 'ADMIN',
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: user2.id,
        organizationId: organization.id,
      },
    },
    update: {},
    create: {
      userId: user2.id,
      organizationId: organization.id,
      role: 'MEMBER',
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: user3.id,
        organizationId: organization.id,
      },
    },
    update: {},
    create: {
      userId: user3.id,
      organizationId: organization.id,
      role: 'MEMBER',
    },
  });

  console.log('✅ Added members to organization');

  // Create demo labels
  const bugLabel = await prisma.label.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: 'bug',
      },
    },
    update: {},
    create: {
      name: 'bug',
      color: '#ef4444',
      organizationId: organization.id,
    },
  });

  const featureLabel = await prisma.label.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: 'feature',
      },
    },
    update: {},
    create: {
      name: 'feature',
      color: '#3b82f6',
      organizationId: organization.id,
    },
  });

  const urgentLabel = await prisma.label.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: 'urgent',
      },
    },
    update: {},
    create: {
      name: 'urgent',
      color: '#f59e0b',
      organizationId: organization.id,
    },
  });

  console.log('✅ Created demo labels');

  // Create demo sprint
  const sprint = await prisma.sprint.create({
    data: {
      name: 'Sprint 1 - Initial Setup',
      organizationId: organization.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      goal: 'Set up the basic infrastructure and core features',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created demo sprint');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Created 3 demo users`);
  console.log(`- Created 1 demo organization: ${organization.name}`);
  console.log(`- Added 3 organization members`);
  console.log(`- Created 3 demo labels`);
  console.log(`- Created 1 active sprint`);
  console.log('\n🔐 Demo Login Credentials:');
  console.log('Email: john@example.com | Password: password123 (Admin)');
  console.log('Email: jane@example.com | Password: password123 (Member)');
  console.log('Email: mike@example.com | Password: password123 (Member)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
