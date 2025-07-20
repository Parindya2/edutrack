"use client";
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import StudentForm from '@/app/components/StudentForm'


export interface Student {
  id: number;
  name: string;
  grade: string;
  address: string;
  contact: string;
}


const StudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
useEffect(() => {
  fetch('/api/students')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setStudents(data.data);
      } else {
        console.error('Failed to load students');
      }
    })
    .catch(error => console.error('Error fetching students:', error));
}, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
  fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setStudents(prev => [...prev, data.data]); // append new student
      } else {
        alert(data.error || 'Failed to add student');
      }
    })
    .catch(err => {
      console.error('Add student error:', err);
      alert('An error occurred while adding student');
    });
};


  const handleEditStudent = (studentData: Omit<Student, 'id'>) => {
    if (!editingStudent) return;
    setStudents(students.map(student =>
      student.id === editingStudent.id
        ? { ...student, ...studentData }
        : student
    ));
    setEditingStudent(null);
  };

  const handleDeleteStudent = (studentId: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(student => student.id !== studentId));
    }
  };

  const openEditForm = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingStudent(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search on Anything..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Id</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.grade}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{student.address}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.contact}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button onClick={() => openEditForm(student)} className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteStudent(student.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student Form Modal */}
      <StudentForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editingStudent ? handleEditStudent : handleAddStudent}
        editingStudent={editingStudent}
      />
    </div>
  );
};

export default StudentsPage;
