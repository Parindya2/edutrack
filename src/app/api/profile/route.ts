
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Return teacher data (you might want to fetch fresh data from database)
    const teacher = {
      id: decoded.teacherId,
      email: decoded.email,
      fullName: decoded.fullName || 'Unknown User',
      profileImage: null 
    };

    return NextResponse.json({
      success: true,
      teacher: teacher
    });

  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid token' },
      { status: 401 }
    );
  }
}