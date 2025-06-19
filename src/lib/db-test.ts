import { prisma } from './prisma';

export async function testDatabaseConnection() {
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Test query
    const userCount = await prisma.user.count();
    const orgCount = await prisma.organization.count();
    const ticketCount = await prisma.ticket.count();

    console.log('📊 Database Statistics:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Organizations: ${orgCount}`);
    console.log(`- Tickets: ${ticketCount}`);

    return {
      success: true,
      stats: {
        users: userCount,
        organizations: orgCount,
        tickets: ticketCount,
      },
    };
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    await prisma.$disconnect();
  }
}

export async function getDemoData() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        ticketPrefix: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
            tickets: true,
            sprints: true,
          },
        },
      },
    });

    const sprints = await prisma.sprint.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        goal: true,
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    return {
      users,
      organizations,
      sprints,
    };
  } catch (error) {
    console.error('❌ Failed to fetch demo data:', error);
    throw error;
  }
}
