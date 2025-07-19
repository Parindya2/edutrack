import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');
    const search = searchParams.get('search');
    
    let students;
    
    // Handle different combinations of filters
    if (grade && grade !== 'all' && search && search.trim()) {
      // Both grade and search filters
      students = await sql`
        SELECT * FROM students 
        WHERE grade = ${grade} AND name ILIKE ${'%' + search.trim() + '%'}
        ORDER BY name ASC
      `;
    } else if (grade && grade !== 'all') {
      // Only grade filter
      students = await sql`
        SELECT * FROM students 
        WHERE grade = ${grade}
        ORDER BY name ASC
      `;
    } else if (search && search.trim()) {
      // Only search filter
      students = await sql`
        SELECT * FROM students 
        WHERE name ILIKE ${'%' + search.trim() + '%'}
        ORDER BY name ASC
      `;
    } else {
      // No filters
      students = await sql`
        SELECT * FROM students 
        ORDER BY name ASC
      `;
    }
    
    return NextResponse.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch students' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, grade, address, contact } = await request.json();
    
    // Basic validation
    if (!name || !grade) {
      return NextResponse.json({ 
        success: false,
        error: 'Name and grade are required' 
      }, { status: 400 });
    }
    
    const result = await sql`
      INSERT INTO students (name, grade, address, contact)
      VALUES (${name.trim()}, ${grade.trim()}, ${address?.trim() || null}, ${contact?.trim() || null})
      RETURNING *
    `;
    
    return NextResponse.json({
      success: true,
      data: result[0],
      message: 'Student created successfully'
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create student' 
    }, { status: 500 });
  }
}