
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('=== /api/auth/me called ===');
    
    // Get token from cookie
    const token = request.cookies.get('token')?.value;
    
    console.log('Token found:', token ? 'YES' : 'NO');
    
    if (!token) {
      console.log('No token found in cookies');
      return NextResponse.json(
        { success: false, error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Verify token (now with await since verifyToken is async)
    let decoded;
    try {
      decoded = await verifyToken(token); // Added await here
      console.log('Token decoded successfully:', decoded);
    } catch (error) {
      console.log('Token verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Extract user ID from token
    const userId = decoded.userId || decoded.id;
    console.log('User ID from token:', userId);
    
    if (!userId) {
      console.log('No user ID found in token');
      return NextResponse.json(
        { success: false, error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    // Fetch user from database
    const teachers = await sql`
      SELECT id, full_name, email, profile_image 
      FROM teachers 
      WHERE id = ${userId}
    `;

    console.log('Teachers found:', teachers.length);

    if (teachers.length === 0) {
      console.log('No teacher found with ID:', userId);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const teacher = teachers[0];
    console.log('Teacher found:', teacher.email);

    return NextResponse.json({
      success: true,
      user: {
        id: teacher.id,
        fullName: teacher.full_name,
        email: teacher.email,
        profileImage: teacher.profile_image,
      },
    });

  } catch (error) {
    const err = error as any;
    console.error('/api/auth/me error:', err.message ?? err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}