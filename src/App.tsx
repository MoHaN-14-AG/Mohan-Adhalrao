import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { NewComplaint } from './pages/NewComplaint';
import { NewServiceRequest } from './pages/NewServiceRequest';
import { OfficerConsole } from './pages/OfficerConsole';
import { PublicScorecard } from './pages/PublicScorecard';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginRegister } from './pages/LoginRegister';

// Protected Route wrapper
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Main Routing Component
const MainContent: React.FC = () => {
  const { role } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100/70 text-gray-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pb-16">
        <Routes>
          {/* Default Route: Role-adapted view */}
          <Route
            path="/"
            element={
              role === 'officer' ? (
                <OfficerConsole />
              ) : role === 'admin' ? (
                <AdminDashboard />
              ) : (
                <CitizenDashboard />
              )
            }
          />

          <Route
            path="/new-complaint"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <NewComplaint />
              </ProtectedRoute>
            }
          />

          <Route
            path="/new-service"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <NewServiceRequest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={['officer', 'admin']}>
                <OfficerConsole />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Public Scorecard - Open to all citizens & visitors */}
          <Route path="/scorecard" element={<PublicScorecard />} />

          <Route path="/login" element={<LoginRegister />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer with Civic Seal & Student Project Credits */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-bold text-white">SetuSeva CiRM</span> • Mira-Bhayandar Municipal Corporation
            <div className="text-[11px] text-slate-400 mt-0.5">
              Citizen Relationship Management Platform • Engineering Capstone Project
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-amber-400 font-mono">MBMC Civic Transparency</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-400">SQLite / PostgreSQL Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <MainContent />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
