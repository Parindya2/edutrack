"use client";
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  GraduationCap,
  LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation'; 

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard'
    },
    {
      id: 'students',
      label: 'Students',
      icon: Users,
      href: '/students'
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: Calendar,
      href: '/attendance'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/settings'
    }
  ];

  const router = useRouter();
  
  const handleItemClick = (itemId: string, href: string) => {
    setActiveItem(itemId);
    router.push(href);
    console.log(`Navigating to ${itemId}`);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear any client-side data
        localStorage.removeItem('teacherId');
        localStorage.removeItem('token');
        
        // Redirect to login page
        router.push('/login');
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // You might want to show a toast notification here
      alert('Logout failed. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={`
      ${isCollapsed ? 'w-16' : 'w-64'} 
      bg-slate-900 
      h-full
      transition-all 
      duration-300 
      ease-in-out
      border-r 
      border-slate-700
      flex 
      flex-col
      relative
    `}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-blue-400" />
              <h1 className="text-xl font-bold text-white">AttendanceTracker</h1>
            </div>
          )}
          {isCollapsed && (
            <GraduationCap className="w-8 h-8 text-blue-400 mx-auto" />
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="
          absolute 
          -right-3 
          top-20 
          bg-slate-800 
          border 
          border-slate-600 
          rounded-full 
          p-1 
          text-slate-400 
          hover:text-white 
          hover:bg-slate-700 
          transition-colors
          z-10
        "
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item.id, item.href)}
                  className={`
                    w-full 
                    flex 
                    items-center 
                    space-x-3 
                    p-3 
                    rounded-lg 
                    transition-all 
                    duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`
            w-full 
            flex 
            items-center 
            space-x-3 
            p-3 
            rounded-lg 
            transition-all 
            duration-200
            text-slate-300 
            hover:bg-red-600 
            hover:text-white
            disabled:opacity-50
            disabled:cursor-not-allowed
          `}
        >
          <LogOut className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
          {!isCollapsed && (
            <span className="font-medium">
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          )}
        </button>
        
        {/* Footer text */}
        {!isCollapsed && (
          <div className="text-xs text-slate-400 text-center mt-4">
            © 2025 Student Attendance System
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;