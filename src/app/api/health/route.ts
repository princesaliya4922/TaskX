import { NextResponse } from 'next/server';
import { checkDatabaseHealth, getDatabaseInfo } from '@/lib/db-health';

export async function GET() {
  try {
    const [health, dbInfo] = await Promise.all([
      checkDatabaseHealth(),
      getDatabaseInfo(),
    ]);

    const response = {
      service: 'SprintX API',
      status: health.status,
      timestamp: health.timestamp,
      uptime: process.uptime(),
      database: {
        ...health,
        info: dbInfo,
      },
      environment: {
        node: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
      },
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        service: 'SprintX API',
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
