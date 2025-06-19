import { NextResponse } from 'next/server';
import { testDatabaseConnection, getDemoData } from '@/lib/db-test';

export async function GET() {
  try {
    // Test database connection
    const connectionTest = await testDatabaseConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          details: connectionTest.error 
        },
        { status: 500 }
      );
    }

    // Get demo data
    const demoData = await getDemoData();

    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      stats: connectionTest.stats,
      data: demoData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Test Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
