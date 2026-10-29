import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from '../layouts/MainLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { StudentsPage } from '../pages/StudentsPage';
import { RegisterStudentPage } from '../pages/RegisterStudentPage';
import { FaceRegistrationPage } from '../pages/FaceRegistrationPage';
import { StartAttendancePage } from '../pages/StartAttendancePage';
import { AttendanceCameraPage } from '../pages/AttendanceCameraPage';
import { AttendanceResultPage } from '../pages/AttendanceResultPage';
import { HistoryPage } from '../pages/HistoryPage';
import { ReportsPage } from '../pages/ReportsPage';
import { LoadingSpinner } from '../components/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner text="Checking authorization..." className="min-h-screen" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner text="Loading..." className="min-h-screen" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected Main Layout Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/register" element={<RegisterStudentPage />} />
        <Route path="students/face-registration/:id" element={<FaceRegistrationPage />} />
        <Route path="attendance/start" element={<StartAttendancePage />} />
        <Route path="attendance/camera/:sessionId" element={<AttendanceCameraPage />} />
        <Route path="attendance/result/:sessionId" element={<AttendanceResultPage />} />
        <Route path="attendance/history" element={<HistoryPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
