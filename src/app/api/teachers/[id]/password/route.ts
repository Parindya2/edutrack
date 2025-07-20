import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db'; 
import bcrypt from 'bcryptjs';

// PUT - Update teacher password
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
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Fetch current password hash
    const teacher = await sql`
      SELECT password_hash FROM teachers 
      WHERE id = ${teacherId}
    `;

    if (teacher.length === 0) {
      return NextResponse.json(
        { message: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, teacher[0].password_hash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await sql`
      UPDATE teachers 
      SET 
        password_hash = ${hashedNewPassword},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${teacherId}
    `;

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { message: 'Failed to update password' },
      { status: 500 }
    );
  }
}