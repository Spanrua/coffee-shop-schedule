import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import ClockRecords from './pages/ClockRecords';
import EmployeeClockRecords from './pages/EmployeeClockRecords';
import PayrollManagement from './pages/PayrollManagement';
import EmployeePayroll from './pages/EmployeePayroll';
import AvailableTimes from './pages/AvailableTimes';
import ScheduleManagement from './pages/ScheduleManagement';
import EmployeeSchedule from './pages/EmployeeSchedule';
import AdminRequests from './pages/AdminRequests';
import EmployeeRequests from './pages/EmployeeRequests';

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/employee" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={isAdmin ? "/admin" : "/employee"} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={isAdmin ? "/admin" : "/employee"} /> : <RegisterPage />} />
      <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute adminOnly><EmployeeManagement /></PrivateRoute>} />
      <Route path="/admin/scheduling" element={<PrivateRoute adminOnly><ScheduleManagement /></PrivateRoute>} />
      <Route path="/admin/requests" element={<PrivateRoute adminOnly><AdminRequests /></PrivateRoute>} />
      <Route path="/admin/clock-records" element={<PrivateRoute adminOnly><ClockRecords /></PrivateRoute>} />
      <Route path="/admin/payroll" element={<PrivateRoute adminOnly><PayrollManagement /></PrivateRoute>} />
      <Route path="/employee" element={<PrivateRoute><EmployeeDashboard /></PrivateRoute>} />
      <Route path="/employee/available-times" element={<PrivateRoute><AvailableTimes /></PrivateRoute>} />
      <Route path="/employee/schedule" element={<PrivateRoute><EmployeeSchedule /></PrivateRoute>} />
      <Route path="/employee/requests" element={<PrivateRoute><EmployeeRequests /></PrivateRoute>} />
      <Route path="/employee/clock-records" element={<PrivateRoute><EmployeeClockRecords /></PrivateRoute>} />
      <Route path="/employee/payroll" element={<PrivateRoute><EmployeePayroll /></PrivateRoute>} />
      <Route path="/" element={<Navigate to={user ? (isAdmin ? "/admin" : "/employee") : "/login"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
