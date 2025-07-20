
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword, isValidEmail, isValidPassword } from '@/lib/auth';

interface RegisterRequestBody {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequestBody = await request.json();

    const { fullName, email, password, confirmPassword } = body;

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Full name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Password must be at least 8 characters long and contain at least one letter and one number',
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Check if teacher already exists
    const existingTeacher = await sql`
      SELECT id FROM teachers WHERE email = ${email.toLowerCase()}
    `;

    if (existingTeacher.length > 0) {
      return NextResponse.json(
        { success: false, error: 'A teacher with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password and create teacher
    const passwordHash = await hashPassword(password);

    const result = await sql`
      INSERT INTO teachers (full_name, email, password_hash)
      VALUES (${fullName.trim()}, ${email.toLowerCase()}, ${passwordHash})
      RETURNING id, full_name, email, created_at
    `;

    const newTeacher = result[0];

    return NextResponse.json({
      success: true,
      message: 'Teacher registered successfully',
      teacher: {
        id: newTeacher.id,
        fullName: newTeacher.full_name,
        email: newTeacher.email,
        createdAt: newTeacher.created_at,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
