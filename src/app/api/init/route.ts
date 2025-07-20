import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';

export async function POST() {
  try {
    await initDB();
    return NextResponse.json({ 
      message: 'Database initialized successfully',
      success: true 
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      error: 'Failed to initialize database',
      success: false 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST method to initialize database' 
  });
}