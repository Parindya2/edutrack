import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET a specific student by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const student = await sql`
      SELECT * FROM students WHERE id = ${id}
    `;
    
    if (student.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Student not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: student[0]
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch student' 
    }, { status: 500 });
  }
}

// UPDATE a specific student by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name, grade, address, contact } = await request.json();
    
    // Basic validation
    if (!name || !grade) {
      return NextResponse.json({ 
        success: false,
        error: 'Name and grade are required' 
      }, { status: 400 });
    }
    
    const result = await sql`
      UPDATE students 
      SET name = ${name.trim()}, 
          grade = ${grade.trim()}, 
          address = ${address?.trim() || null}, 
          contact = ${contact?.trim() || null}
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Student not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: result[0],
      message: 'Student updated successfully'
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update student' 
    }, { status: 500 });
  }
}

// DELETE a specific student by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const result = await sql`
      DELETE FROM students WHERE id = ${id} RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Student not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete student' 
    }, { status: 500 });
  }
}