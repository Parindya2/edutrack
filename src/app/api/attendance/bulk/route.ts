import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { attendanceData } = await request.json();
    
    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Attendance data is required' 
      }, { status: 400 });
    }
    
    // Process each attendance record
    const results = [];
    
    for (const record of attendanceData) {
      const { student_id, date, present } = record;
      
      if (!student_id || !date) {
        continue; // Skip invalid records
      }
      
      try {
        const result = await sql`
          INSERT INTO attendance (student_id, date, present)
          VALUES (${student_id}, ${date}, ${present})
          ON CONFLICT (student_id, date)
          DO UPDATE SET 
            present = ${present}, 
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;
        
        results.push(result[0]);
      } catch (error) {
        console.error(`Error saving attendance for student ${student_id}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: results,
      message: `${results.length} attendance records saved successfully`
    });
  } catch (error) {
    console.error('Error saving bulk attendance:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to save bulk attendance' 
    }, { status: 500 });
  }
}