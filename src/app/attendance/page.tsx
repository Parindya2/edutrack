"use client";
import React, { useState, useEffect } from 'react';
import { ChevronDown, Calendar, GraduationCap, CalendarDays } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  grade: string;
  attendance: boolean[];
}

const AttendancePage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('July');
  const [selectedGrade, setSelectedGrade] = useState('5th');
  const [students, setStudents] = useState<Student[]>([]);
  const [daysInMonth, setDaysInMonth] = useState<number>(31);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);

  // Generate years (current year and a few years back/forward)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => (currentYear - 3 + i).toString());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const grades = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

  useEffect(() => {
    // Calculate days in selected month
    const monthIndex = months.indexOf(selectedMonth);
    const days = new Date(parseInt(selectedYear), monthIndex + 1, 0).getDate();
    setDaysInMonth(days);

    // Fetch students with their attendance data whenever year or month changes
    fetchStudentsWithAttendance(days, selectedYear, monthIndex + 1);
  }, [selectedYear, selectedMonth]);

  const fetchStudentsWithAttendance = async (daysCount: number, year: string, month: number) => {
    try {
      // Fetch students (all students initially, filter applied on search)
      const studentRes = await fetch(`/api/students`);
      const studentData = await studentRes.json();

      if (!studentData.success) {
        console.error('Failed to fetch students:', studentData.error);
        return;
      }

      // Fetch attendance data for the selected month
      let attendanceData = { success: false, data: [] };
      try {
        const attendanceRes = await fetch(`/api/attendance?year=${year}&month=${month.toString().padStart(2, '0')}`);
        if (attendanceRes.ok) {
          attendanceData = await attendanceRes.json();
        } else {
          console.warn('Attendance API not available, using empty attendance data');
        }
      } catch (attendanceError) {
        console.warn('Failed to fetch attendance data:', attendanceError);
        
      }

     
      console.log('Fetched students:', studentData.data?.length || 0);
      console.log('Fetched attendance records:', attendanceData.data?.length || 0);
      console.log('Selected period:', `${selectedMonth} ${selectedYear}`, 'Days in month:', daysCount);
      
      // Process students with attendance data
      const studentsWithAttendance = studentData.data.map((student: any) => {
        // Initialize attendance array for the month
        const attendance = Array(daysCount).fill(false);

        // Fill in actual attendance from database
        if (attendanceData.success && attendanceData.data) {
          attendanceData.data.forEach((record: any) => {
            if (record.student_id === student.id) {
              // Parse the date more carefully
              let recordDate;
              if (typeof record.date === 'string') {
                // Create date object from string
                recordDate = new Date(record.date);
              } else {
                recordDate = new Date(record.date);
              }
              
              
              if (isNaN(recordDate.getTime())) {
                console.error(`Invalid date: ${record.date}`);
                return; 
              }
              
              // Check if the record date is in the selected month/year
              const recordMonth = recordDate.getMonth() + 1; // 1-based month (using getMonth instead of getUTCMonth)
              const recordYear = recordDate.getFullYear(); // using getFullYear instead of getUTCFullYear
              const selectedMonthIndex = months.indexOf(selectedMonth) + 1;
              const selectedYearNum = parseInt(selectedYear);
              
              console.log(`Record date: ${record.date}, Parsed date: ${recordDate}, Month: ${recordMonth}, Year: ${recordYear}, Selected: ${selectedMonthIndex}/${selectedYearNum}`);
              
              // Only process if the record is for the selected month/year
              if (recordMonth === selectedMonthIndex && recordYear === selectedYearNum) {
                const day = recordDate.getDate() - 1; // Convert to 0-based index (using getDate instead of getUTCDate)
                console.log(`Processing attendance for student ${student.id}, date: ${record.date}, day: ${day + 1}, present: ${record.present}`);
                
                if (day >= 0 && day < daysCount) {
                  attendance[day] = record.present;
                }
              } else {
                console.log(`Skipping record for different month/year: ${recordMonth}/${recordYear} vs ${selectedMonthIndex}/${selectedYearNum}`);
              }
            }
          });
        }

        return {
          ...student,
          attendance: attendance
        };
      });

      setStudents(studentsWithAttendance);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleAttendanceToggle = async (studentId: number, dayIndex: number) => {
    // Calculate the date string from selectedYear, selectedMonth and dayIndex
    const monthIndex = months.indexOf(selectedMonth) + 1; // 1-based month
    const day = dayIndex + 1;

    
    const dateStr = `${selectedYear}-${monthIndex.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    // Find current present status and toggle it
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const currentStatus = student.attendance[dayIndex];
    const newStatus = !currentStatus;

    // Update local state immediately for responsiveness
    setStudents(prevStudents =>
      prevStudents.map(s => {
        if (s.id === studentId) {
          const updatedAttendance = [...s.attendance];
          updatedAttendance[dayIndex] = newStatus;
          return { ...s, attendance: updatedAttendance };
        }
        return s;
      })
    );

    // Send POST request to save attendance
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          date: dateStr,
          present: newStatus
        }),
      });

      const result = await res.json();
      if (!result.success) {
        console.error('Failed to save attendance:', result.error);
        // Revert state on error
        setStudents(prevStudents =>
          prevStudents.map(s => {
            if (s.id === studentId) {
              const revertedAttendance = [...s.attendance];
              revertedAttendance[dayIndex] = currentStatus;
              return { ...s, attendance: revertedAttendance };
            }
            return s;
          })
        );
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      // Revert state on error
      setStudents(prevStudents =>
        prevStudents.map(s => {
          if (s.id === studentId) {
            const revertedAttendance = [...s.attendance];
            revertedAttendance[dayIndex] = currentStatus;
            return { ...s, attendance: revertedAttendance };
          }
          return s;
        })
      );
    }
  };

  const handleSearch = async () => {
    const monthIndex = months.indexOf(selectedMonth) + 1;
    
    try {
      // Fetch students with grade filter
      const studentRes = await fetch(`/api/students?grade=${selectedGrade}`);
      const studentData = await studentRes.json();

      if (!studentData.success) {
        console.error('Failed to fetch students:', studentData.error);
        return;
      }

      // Fetch attendance data for the selected month
      let attendanceData = { success: false, data: [] };
      try {
        const attendanceRes = await fetch(`/api/attendance?year=${selectedYear}&month=${monthIndex.toString().padStart(2, '0')}`);
        if (attendanceRes.ok) {
          attendanceData = await attendanceRes.json();
        } else {
          console.warn('Attendance API not available, using empty attendance data');
        }
      } catch (attendanceError) {
        console.warn('Failed to fetch attendance data:', attendanceError);
        
      }

      // Process students with attendance data
      const studentsWithAttendance = studentData.data.map((student: any) => {
        const attendance = Array(daysInMonth).fill(false);

        if (attendanceData.success && attendanceData.data) {
          attendanceData.data.forEach((record: any) => {
            if (record.student_id === student.id) {
              // Parse the date more carefully
              let recordDate;
              if (typeof record.date === 'string') {
                // Create date object from string
                recordDate = new Date(record.date);
              } else {
                recordDate = new Date(record.date);
              }
              
              // Validate the date
              if (isNaN(recordDate.getTime())) {
                console.error(`Invalid date: ${record.date}`);
                return; // Skip this record
              }
              
              // Check if the record date is in the selected month/year
              const recordMonth = recordDate.getMonth() + 1; // 1-based month (using getMonth instead of getUTCMonth)
              const recordYear = recordDate.getFullYear(); // using getFullYear instead of getUTCFullYear
              const selectedMonthIndex = months.indexOf(selectedMonth) + 1;
              const selectedYearNum = parseInt(selectedYear);
              
              console.log(`Record date: ${record.date}, Parsed date: ${recordDate}, Month: ${recordMonth}, Year: ${recordYear}, Selected: ${selectedMonthIndex}/${selectedYearNum}`);
              
              // Only process if the record is for the selected month/year
              if (recordMonth === selectedMonthIndex && recordYear === selectedYearNum) {
                const day = recordDate.getDate() - 1; // Convert to 0-based index (using getDate instead of getUTCDate)
                console.log(`Processing attendance for student ${student.id}, date: ${record.date}, day: ${day + 1}, present: ${record.present}`);
                
                if (day >= 0 && day < daysInMonth) {
                  attendance[day] = record.present;
                }
              } else {
                console.log(`Skipping record for different month/year: ${recordMonth}/${recordYear} vs ${selectedMonthIndex}/${selectedYearNum}`);
              }
            }
          });
        }

        return {
          ...student,
          attendance: attendance
        };
      });

      setStudents(studentsWithAttendance);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Attendance</h1>
          
          {/* Controls */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            {/* Year Selector */}
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Year:</label>
              <div className="relative">
                <button
                  onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                >
                  <CalendarDays className="w-4 h-4 text-gray-500" />
                  {selectedYear}
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {isYearDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {years.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setIsYearDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Month Selector */}
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Month:</label>
              <div className="relative">
                <button
                  onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
                >
                  <Calendar className="w-4 h-4 text-gray-500" />
                  {selectedMonth}
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {isMonthDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {months.map((month) => (
                      <button
                        key={month}
                        onClick={() => {
                          setSelectedMonth(month);
                          setIsMonthDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Grade Selector */}
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Grade:</label>
              <div className="relative">
                <button
                  onClick={() => setIsGradeDropdownOpen(!isGradeDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                >
                  <GraduationCap className="w-4 h-4 text-gray-500" />
                  {selectedGrade}
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {isGradeDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {grades.map((grade) => (
                      <button
                        key={grade}
                        onClick={() => {
                          setSelectedGrade(grade);
                          setIsGradeDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Search Button */}
            <div className="mt-6">
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium"
              >
                Search
              </button>
            </div>
          </div>

          {/* Current Selection Display */}
          <div className="text-sm text-gray-600 mb-4">
            Viewing attendance for <span className="font-medium">{selectedGrade} Grade</span> - <span className="font-medium">{selectedMonth} {selectedYear}</span>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Student Id
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-24 bg-gray-50 z-10 min-w-[200px]">
                  Name
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                  <th key={day} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[40px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student, index) => (
                <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit z-10">
                    {student.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-24 bg-inherit z-10 min-w-[200px]">
                    {student.name}
                  </td>
                  {student.attendance.slice(0, daysInMonth).map((isPresent, dayIndex) => (
                    <td key={dayIndex} className="px-3 py-4 text-center">
                      <button
                        onClick={() => handleAttendanceToggle(student.id, dayIndex)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isPresent
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {isPresent && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary or No Data Message */}
        {students.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No students found for the selected criteria. Try adjusting your filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;