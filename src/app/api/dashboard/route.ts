import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); 
    const grade = searchParams.get('grade');
    
    console.log('Dashboard API called with params:', { month, grade });
    
    // Get total students count
    let totalStudentsQuery;
    if (grade && grade !== 'all') {
      totalStudentsQuery = sql`SELECT COUNT(*) as count FROM students WHERE grade = ${grade}`;
    } else {
      totalStudentsQuery = sql`SELECT COUNT(*) as count FROM students`;
    }
    
    const totalStudentsResult = await totalStudentsQuery;
    const totalStudents = parseInt(totalStudentsResult[0].count) || 0;
    
    // Calculate the expected total attendance records based on students and days
    let expectedTotalRecords = 0;
    let daysToConsider = 0;
    
    if (month) {
      // Parse the month to get year and month
      const [year, monthNum] = month.split('-').map(Number);
      const today = new Date();
      const selectedMonth = new Date(year, monthNum - 1, 1); // monthNum - 1 because Date months are 0-based
      
      // Get the last day of the selected month
      const lastDayOfMonth = new Date(year, monthNum, 0).getDate();
      
      // If it's the current month, only count days up to today
      // If it's a past month, count all days in the month
      // If it's a future month, don't count any days
      if (year === today.getFullYear() && monthNum === today.getMonth() + 1) {
        // Current month - count days up to today
        daysToConsider = Math.min(today.getDate(), lastDayOfMonth);
      } else if (selectedMonth < today) {
        // Past month - count all days
        daysToConsider = lastDayOfMonth;
      } else {
        // Future month - don't count any days
        daysToConsider = 0;
      }
      
      expectedTotalRecords = totalStudents * daysToConsider;
    }
    
    // Get actual present records count
    let presentCountQuery;
    if (month && grade && grade !== 'all') {
      // Both month and grade filters
      presentCountQuery = sql`
        SELECT COUNT(*) as present_count
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE DATE_TRUNC('month', a.date) = DATE_TRUNC('month', ${month + '-01'}::date)
        AND s.grade = ${grade}
        AND a.present = true
      `;
    } else if (month) {
      // Only month filter
      presentCountQuery = sql`
        SELECT COUNT(*) as present_count
        FROM attendance a
        WHERE DATE_TRUNC('month', a.date) = DATE_TRUNC('month', ${month + '-01'}::date)
        AND a.present = true
      `;
    } else if (grade && grade !== 'all') {
      // Only grade filter - for this case, we'll use the traditional method
      // since we don't have a specific time range
      presentCountQuery = sql`
        SELECT COUNT(*) as present_count
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE s.grade = ${grade}
        AND a.present = true
      `;
    } else {
      // No filters - get all present attendance
      presentCountQuery = sql`
        SELECT COUNT(*) as present_count
        FROM attendance a
        WHERE a.present = true
      `;
    }
    
    const presentResult = await presentCountQuery;
    const presentCount = parseInt(presentResult[0].present_count) || 0;
    
    // Calculate absent count
    let absentCount;
    let totalRecords;
    
    if (month && expectedTotalRecords > 0) {
      // For month-based queries, use expected total - present = absent
      absentCount = expectedTotalRecords - presentCount;
      totalRecords = expectedTotalRecords;
    } else {
      // For non-month queries, fall back to traditional method
      let explicitAbsentQuery;
      if (grade && grade !== 'all') {
        explicitAbsentQuery = sql`
          SELECT COUNT(*) as absent_count
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          WHERE s.grade = ${grade}
          AND a.present = false
        `;
      } else {
        explicitAbsentQuery = sql`
          SELECT COUNT(*) as absent_count
          FROM attendance a
          WHERE a.present = false
        `;
      }
      
      const absentResult = await explicitAbsentQuery;
      absentCount = parseInt(absentResult[0].absent_count) || 0;
      totalRecords = presentCount + absentCount;
    }
    
    // Calculate percentages
    const presentPercentage = totalRecords > 0 ? parseFloat((presentCount / totalRecords * 100).toFixed(1)) : 0;
    const absentPercentage = totalRecords > 0 ? parseFloat((absentCount / totalRecords * 100).toFixed(1)) : 0;
    
    // Get daily attendance data for chart
    let dailyAttendanceQuery;
    if (month && grade && grade !== 'all') {
      dailyAttendanceQuery = sql`
        SELECT 
          EXTRACT(DAY FROM a.date) as day,
          SUM(CASE WHEN a.present = true THEN 1 ELSE 0 END) as present,
          COUNT(DISTINCT s.id) as total_students_that_day
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE DATE_TRUNC('month', a.date) = DATE_TRUNC('month', ${month + '-01'}::date)
        AND s.grade = ${grade}
        GROUP BY EXTRACT(DAY FROM a.date), a.date
        ORDER BY a.date
      `;
    } else if (month) {
      dailyAttendanceQuery = sql`
        SELECT 
          EXTRACT(DAY FROM a.date) as day,
          SUM(CASE WHEN a.present = true THEN 1 ELSE 0 END) as present,
          COUNT(DISTINCT a.student_id) as total_students_that_day
        FROM attendance a
        WHERE DATE_TRUNC('month', a.date) = DATE_TRUNC('month', ${month + '-01'}::date)
        GROUP BY EXTRACT(DAY FROM a.date), a.date
        ORDER BY a.date
      `;
    } else if (grade && grade !== 'all') {
      dailyAttendanceQuery = sql`
        SELECT 
          EXTRACT(DAY FROM a.date) as day,
          SUM(CASE WHEN a.present = true THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN a.present = false THEN 1 ELSE 0 END) as absent
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE s.grade = ${grade}
        GROUP BY EXTRACT(DAY FROM a.date), a.date
        ORDER BY a.date
        LIMIT 30
      `;
    } else {
      dailyAttendanceQuery = sql`
        SELECT 
          EXTRACT(DAY FROM a.date) as day,
          SUM(CASE WHEN a.present = true THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN a.present = false THEN 1 ELSE 0 END) as absent
        FROM attendance a
        GROUP BY EXTRACT(DAY FROM a.date), a.date
        ORDER BY a.date DESC
        LIMIT 30
      `;
    }
    
    const dailyAttendanceResult = await dailyAttendanceQuery;
    
    // Format chart data
    const chartData = dailyAttendanceResult.map(row => {
      const present = parseInt(row.present) || 0;
      let absent;
      
      if (month && row.total_students_that_day) {
        // For month queries, calculate absent as total students - present for that day
        absent = totalStudents - present;
      } else {
        absent = parseInt(row.absent) || 0;
      }
      
      return {
        day: row.day.toString(),
        present: present,
        absent: absent
      };
    });
    
    // If month is selected but no chart data, create chart data showing all absent
    if (month && chartData.length === 0 && daysToConsider > 0) {
      for (let day = 1; day <= daysToConsider; day++) {
        chartData.push({
          day: day.toString(),
          present: 0,
          absent: totalStudents
        });
      }
    }
    
    const responseData = {
      totalStudents,
      totalPresent: presentCount,
      totalAbsent: absentCount,
      presentPercentage,
      absentPercentage,
      chartData,
      debug: {
        expectedTotalRecords,
        daysToConsider,
        month,
        grade
      }
    };
    
    console.log('Dashboard API response data:', responseData);
    
    return NextResponse.json({
      success: true,
      data: responseData
    });
    
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}