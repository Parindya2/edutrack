
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { verifyPassword, generateToken, isValidEmail } from '@/lib/auth';

interface LoginRequestBody {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== LOGIN ATTEMPT START ===');
    
    const body: LoginRequestBody = await request.json();
    const { email, password } = body;

    console.log('Login attempt for email:', email);

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Find teacher
    const teachers = await sql`
      SELECT id, full_name, email, password_hash, profile_image 
      FROM teachers 
      WHERE email = ${email.toLowerCase()}
    `;

    if (teachers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const teacher = teachers[0];

    // Verify password
    const isPasswordValid = await verifyPassword(password, teacher.password_hash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('Password verified, generating token...');

    // Generate token (now async)
    const token = await generateToken({
      userId: teacher.id,
      id: teacher.id,
      email: teacher.email,
      fullName: teacher.full_name,
      type: 'teacher'
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      token: token,
      teacher: {
        id: teacher.id,
        fullName: teacher.full_name,
        email: teacher.email,
        profileImage: teacher.profile_image,
      },
    });

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    console.log('Login successful for:', teacher.email);
    return response;
  } catch (error: any) {
    console.error('Login error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}