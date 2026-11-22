import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import DashboardLayout from './components/layout/DashboardLayout';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentFees from './pages/student/StudentFees';
import StudentMenu from './pages/student/StudentMenu';
import StudentComplaints from './pages/student/StudentComplaints';
import StudentProfile from './pages/student/StudentProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentRecords from './pages/admin/StudentRecords';
import AdminFees from './pages/admin/AdminFees';
import MenuManager from './pages/admin/MenuManager';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import NotificationsPage from './pages/NotificationsPage';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

const MainApp = () => {
  const { user, loading, isAdmin, isStudent } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'forgot-password'
  const [currentTab, setCurrentTab] = useState(isAdmin ? 'admin-dashboard' : 'dashboard');

  // Synchronize and strictly guard tabs on role change or initial load
  useEffect(() => {
    if (user) {
      if (isAdmin && !['admin-dashboard', 'students', 'admin-fees', 'menu-manager', 'admin-complaints', 'admin-analytics', 'notifications'].includes(currentTab)) {
        setCurrentTab('admin-dashboard');
      } else if (isStudent && !['dashboard', 'menu', 'fees', 'complaints', 'profile', 'notifications'].includes(currentTab)) {
        // Students MUST NEVER access admin pages
        setCurrentTab('dashboard');
      }
    }
  }, [user, isAdmin, isStudent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-navy-950 font-black text-xl flex items-center justify-center animate-pulse">
          SM
        </div>
        <p className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
          Verifying Smart Mess Session...
        </p>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!user) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot-password') {
      return <ForgotPassword onSwitchToLogin={() => setAuthView('login')} />;
    }
    return (
      <Login
        onSwitchToRegister={() => setAuthView('register')}
        onSwitchToForgotPassword={() => setAuthView('forgot-password')}
      />
    );
  }

  // Tab Titles map
  const tabTitles = {
    // Student
    dashboard: 'Student Overview',
    menu: "Today's & Weekly Food Menu",
    fees: 'Mess Invoices & Online Payments',
    complaints: 'Hostel Mess Grievance Helpdesk',
    profile: 'Student Profile & Dining Details',
    // Admin
    'admin-dashboard': 'Executive Mess Operations Dashboard',
    students: 'Hostel Block & Room-Wise Directory',
    'admin-fees': 'Fee Billing & Reconciliation Treasury',
    'menu-manager': '7-Day Weekly Food Menu Planner',
    'admin-complaints': 'Grievance Redressal & Helpdesk',
    'admin-analytics': 'Operations Analytics & Financial Intelligence',
    notifications: 'Notification Center & Alert History',
  };

  // Safe navigation handler enforcing strict role separation
  const handleSelectTab = (tab) => {
    if (isStudent && ['admin-dashboard', 'students', 'admin-fees', 'menu-manager', 'admin-complaints', 'admin-analytics'].includes(tab)) {
      console.warn('Unauthorized access attempt: Student cannot access admin tabs.');
      setCurrentTab('dashboard');
      return;
    }
    setCurrentTab(tab);
  };

  // Render appropriate tab content
  const renderContent = () => {
    if (currentTab === 'notifications') {
      return <NotificationsPage onNavigate={handleSelectTab} />;
    }

    if (isAdmin) {
      switch (currentTab) {
        case 'students':
          return <StudentRecords />;
        case 'admin-fees':
          return <AdminFees />;
        case 'menu-manager':
          return <MenuManager />;
        case 'admin-complaints':
          return <AdminComplaints />;
        case 'admin-analytics':
          return <AdminAnalytics onNavigate={handleSelectTab} />;
        case 'admin-dashboard':
        default:
          return <AdminDashboard onNavigate={handleSelectTab} />;
      }
    } else {
      // Role is student
      switch (currentTab) {
        case 'menu':
          return <StudentMenu />;
        case 'fees':
          return <StudentFees />;
        case 'complaints':
          return <StudentComplaints onNavigate={handleSelectTab} />;
        case 'profile':
          return <StudentProfile />;
        case 'dashboard':
        default:
          return <StudentDashboard onNavigate={handleSelectTab} />;
      }
    }
  };

  return (
    <DashboardLayout
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      tabTitle={tabTitles[currentTab] || 'Hostel Mess Portal'}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
