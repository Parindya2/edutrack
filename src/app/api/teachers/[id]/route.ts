import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db'; 

// GET - Fetch teacher profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id;
    
    // Validate teacher ID is a number
    if (isNaN(Number(teacherId))) {
      return NextResponse.json(
        { message: 'Invalid teacher ID' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      SELECT id, full_name, email, profile_image, created_at, updated_at 
      FROM teachers 
      WHERE id = ${teacherId}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { message: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json(
      { message: 'Failed to fetch teacher data' },
      { status: 500 }
    );
  }
}

// PUT - Update teacher profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id;
    
    // Validate teacher ID is a number
    if (isNaN(Number(teacherId))) {
      return NextResponse.json(
        { message: 'Invalid teacher ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { full_name, email, profile_image } = body;

    // Validate required fields
    if (!full_name || !email) {
      return NextResponse.json(
        { message: 'Full name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists for another teacher
    const existingTeacher = await sql`
      SELECT id FROM teachers 
      WHERE email = ${email} AND id != ${teacherId}
    `;

    if (existingTeacher.length > 0) {
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 400 }
      );
    }

    // Update teacher
    const result = await sql`
      UPDATE teachers 
      SET 
        full_name = ${full_name},
        email = ${email},
        profile_image = ${profile_image || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${teacherId}
      RETURNING id, full_name, email, profile_image, created_at, updated_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { message: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { message: 'Failed to update teacher data' },
      { status: 500 }
    );
  }
}