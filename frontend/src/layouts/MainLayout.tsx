import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dynamic titles based on current route
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/dashboard':
        return { title: 'Dashboard Overview', subtitle: 'Live attendance insights and system metrics' };
      case '/students':
        return { title: 'Student Management', subtitle: 'Manage student records and facial encodings' };
      case '/students/register':
        return { title: 'Register New Student', subtitle: 'Enter student details and enroll facial data' };
      case '/attendance/start':
        return { title: 'Launch Attendance Session', subtitle: 'Select subject and start live facial recognition' };
      case '/attendance/history':
        return { title: 'Attendance History', subtitle: 'Browse completed lecture logs and attendance stats' };
      case '/reports':
        return { title: 'Analytics & Reports', subtitle: 'Comprehensive student percentages and subject trends' };
      default:
        if (location.pathname.startsWith('/students/face-registration')) {
          return { title: 'Face Registration Studio', subtitle: 'Capture 5 high-accuracy face samples' };
        }
        if (location.pathname.startsWith('/attendance/camera')) {
          return { title: 'Live Attendance Camera', subtitle: 'Real-time AI face recognition session' };
        }
        if (location.pathname.startsWith('/attendance/result')) {
          return { title: 'Session Attendance Summary', subtitle: 'Review present and absent roll call results' };
        }
        return { title: 'Smart Attendance System', subtitle: 'Automated facial recognition platform' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onCloseMobile={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={title}
          subtitle={subtitle}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
