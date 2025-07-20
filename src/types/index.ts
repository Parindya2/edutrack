export interface Student {
  id: number;
  name: string;
  grade: string;
  address?: string;
  contact?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: number;
  student_id: number;
  date: string;
  present: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceWithStudent extends Attendance {
  student_name: string;
  grade: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalPresent: number;
  totalAbsent: number;
  presentPercentage: number;
  absentPercentage: number;
}

export interface AttendanceRecord {
  studentId: number;
  name: string;
  grade: string;
  dates: { [key: string]: boolean };
}

export interface MonthlyAttendanceData {
  day: string;
  present: number;
  absent: number;
}