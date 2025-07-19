import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const grade = searchParams.get('grade');
    
    let attendance;
    
    // Build date filter if year and month are provided
    let dateFilter = '';
    let dateParam = '';
    
    if (year && month) {
      // Validate year and month
      const yearInt = parseInt(year);
      const monthInt = parseInt(month);
      
      if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
        return NextResponse.json({
          success: false,
          error: 'Invalid year or month parameter'
        }, { status: 400 });
      }
      
      // Create start and end dates for the month
      const startDate = `${yearInt}-${monthInt.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(yearInt, monthInt, 0).getDate();
      const endDate = `${yearInt}-${monthInt.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
      
      if (grade && grade !== 'all') {
        // Both date and grade filters
        attendance = await sql`
          SELECT 
            a.id,
            a.student_id,
            a.date,
            a.present,
            a.created_at,
            a.updated_at,
            s.name as student_name,
            s.grade
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          WHERE a.date >= ${startDate}::date 
          AND a.date <= ${endDate}::date
          AND s.grade = ${grade}
          ORDER BY a.date DESC, s.name ASC
        `;
      } else {
        // Only date filter
        attendance = await sql`
          SELECT 
            a.id,
            a.student_id,
            a.date,
            a.present,
            a.created_at,
            a.updated_at,
            s.name as student_name,
            s.grade
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          WHERE a.date >= ${startDate}::date 
          AND a.date <= ${endDate}::date
          ORDER BY a.date DESC, s.name ASC
        `;
      }
    } else if (grade && grade !== 'all') {
      // Only grade filter (no date filter)
      attendance = await sql`
        SELECT 
          a.id,
          a.student_id,
          a.date,
          a.present,
          a.created_at,
          a.updated_at,
          s.name as student_name,
          s.grade
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE s.grade = ${grade}
        ORDER BY a.date DESC, s.name ASC
      `;
    } else {
      // No filters - get all attendance
      attendance = await sql`
        SELECT 
          a.id,
          a.student_id,
          a.date,
          a.present,
          a.created_at,
          a.updated_at,
          s.name as student_name,
          s.grade
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        ORDER BY a.date DESC, s.name ASC
      `;
    }
    
    return NextResponse.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch attendance',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { student_id, date, present } = await request.json();
    
    // Validate required fields
    if (!student_id || !date || typeof present !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'student_id, date, and present (boolean) are required'
      }, { status: 400 });
    }

    // Validate date format (should be YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({
        success: false,
        error: 'Date must be in YYYY-MM-DD format'
      }, { status: 400 });
    }

    // Validate the date is actually valid
    const parsedDate = new Date(date + 'T00:00:00.000Z');
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date provided'
      }, { status: 400 });
    }

    console.log(`Saving attendance: student_id=${student_id}, date=${date}, present=${present}`);

    const result = await sql`
      INSERT INTO attendance (student_id, date, present, updated_at)
      VALUES (${student_id}, ${date}::date, ${present}, CURRENT_TIMESTAMP)
      ON CONFLICT (student_id, date)
      DO UPDATE SET 
        present = ${present}, 
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    console.log('Attendance saved successfully:', result[0]);
    
    return NextResponse.json({
      success: true,
      data: result[0],
      message: 'Attendance saved successfully'
    });
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to save attendance',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}