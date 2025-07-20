"use client";
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Users, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const AttendanceDashboard = () => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('07');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalPresent: 0,
    totalAbsent: 0,
    presentPercentage: 0,
    absentPercentage: 0,
    chartData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      // Combine year and month for the API call
      const monthParam = `${selectedYear}-${selectedMonth}`;
      params.append('month', monthParam);
      
      if (selectedGrade !== 'all') {
        params.append('grade', selectedGrade);
      }

      console.log('Fetching dashboard data...');
      const response = await fetch(`/api/dashboard?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);

      if (result.success) {
        setDashboardData(result.data);
      } else {
        throw new Error(result.error || 'API returned unsuccessful response');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, selectedMonth, selectedGrade]);

  const years = [
    { value: '2022', label: '2022' },
    { value: '2023', label: '2023' },
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' }
  ];

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const grades = [
    { value: 'all', label: 'All Grades' },
    { value: '1st', label: '1st Grade' },
    { value: '2nd', label: '2nd Grade' },
    { value: '3rd', label: '3rd Grade' },
    { value: '4th', label: '4th Grade' },
    { value: '5th', label: '5th Grade' },
    { value: '6th', label: '6th Grade' },
    { value: '7th', label: '7th Grade' },
    { value: '8th', label: '8th Grade' },
    { value: '9th', label: '9th Grade' },
    { value: '10th', label: '10th Grade' },
    { value: '11th', label: '11th Grade' },
    { value: '12th', label: '12th Grade' }
  ];

  // Transform chart data to include attendance percentage for line chart
  const lineChartData = (dashboardData.chartData as any[])?.map((item: any) => {
    const present = Number(item?.present) || 0;
    const absent = Number(item?.absent) || 0;
    const total = present + absent;
    
    return {
      day: item?.day || '',
      present: present,
      absent: absent,
      attendancePercentage: total > 0 ? Math.round((present / total) * 100) : 0
    };
  }) || [];

  const pieChartData = [
    { name: 'Present', value: dashboardData.presentPercentage, color: '#10B981' },
    { name: 'Absent', value: dashboardData.absentPercentage, color: '#EF4444' }
  ];

  // Get current month name for display
  const currentMonthName = months.find(m => m.value === selectedMonth)?.label || '';

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Attendance Dashboard</h1>
            <p className="text-gray-600">
              {currentMonthName} {selectedYear} • {selectedGrade === 'all' ? 'All Grades' : selectedGrade}
            </p>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Year</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            >
              {years.map(year => (
                <option key={year.value} value={year.value}>{year.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Month</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            >
              {grades.map(grade => (
                <option key={grade.value} value={grade.value}>{grade.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Students</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {dashboardData.totalStudents}
              </p>
              <p className="text-xs text-gray-400 mt-1">registered students</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Present</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {dashboardData.presentPercentage}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {dashboardData.totalPresent} attendance records
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Absent</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {dashboardData.absentPercentage}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {dashboardData.totalAbsent} absence records
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Daily Attendance Trend</h2>
            <div className="text-sm text-gray-500">
              {currentMonthName} {selectedYear}
            </div>
          </div>
          {lineChartData && lineChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-medium text-gray-800">{`Day ${label}`}</p>
                            <p className="text-blue-600">{`Attendance: ${payload[0].value}%`}</p>
                            <p className="text-sm text-gray-600">{`Present: ${data.present || 0}`}</p>
                            <p className="text-sm text-gray-600">{`Absent: ${data.absent || 0}`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="attendancePercentage" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3B82F6' }}
                    activeDot={{ r: 6, fill: '#1D4ED8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Daily Attendance Percentage</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-4xl mb-2">📊</p>
                <p className="font-medium">No attendance data available</p>
                <p className="text-sm">for {currentMonthName} {selectedYear}</p>
              </div>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Attendance Distribution</h2>
            <div className="text-sm text-gray-500">
              Overall for selected period
            </div>
          </div>
          {pieChartData[0].value > 0 || pieChartData[1].value > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        return (
                          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p className="font-medium text-gray-800">{data.name}</p>
                            <p className="text-blue-600">{`${data.value}%`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Present: {dashboardData.presentPercentage}%
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Absent: {dashboardData.absentPercentage}%
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-4xl mb-2">📈</p>
                <p className="font-medium">No data to display</p>
                <p className="text-sm">Add attendance records to see distribution</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;