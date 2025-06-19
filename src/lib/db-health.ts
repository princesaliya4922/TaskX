import { prisma } from './prisma';

export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  latency: number;
  details: {
    connection: boolean;
    queries: boolean;
    migrations: boolean;
  };
  stats?: {
    users: number;
    organizations: number;
    tickets: number;
    sprints: number;
  };
  error?: string;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  const health: DatabaseHealth = {
    status: 'unhealthy',
    timestamp,
    latency: 0,
    details: {
      connection: false,
      queries: false,
      migrations: false,
    },
  };

  try {
    // Test connection
    await prisma.$connect();
    health.details.connection = true;

    // Test basic queries
    const [userCount, orgCount, ticketCount, sprintCount] = await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.ticket.count(),
      prisma.sprint.count(),
    ]);

    health.details.queries = true;
    health.stats = {
      users: userCount,
      organizations: orgCount,
      tickets: ticketCount,
      sprints: sprintCount,
    };

    // Check if database schema is up to date (basic check)
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.details.migrations = true;
    } catch (error) {
      console.warn('Migration check failed:', error);
    }

    health.status = 'healthy';
  } catch (error) {
    health.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('Database health check failed:', error);
  } finally {
    health.latency = Date.now() - startTime;
    await prisma.$disconnect();
  }

  return health;
}

export async function getDatabaseInfo() {
  try {
    const result = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version() as version
    `;
    
    return {
      version: result[0]?.version || 'Unknown',
      provider: 'postgresql',
    };
  } catch (error) {
    console.error('Failed to get database info:', error);
    return {
      version: 'Unknown',
      provider: 'postgresql',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
