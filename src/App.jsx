import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Overview from './pages/Overview';
import TaskManagement from './pages/TaskManagement';
import Personnel from './pages/Personnel';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Schedule from './pages/Schedule';
import ActivityHistory from './pages/ActivityHistory';
import Attendance from './pages/Attendance';
import Login from './pages/Login';
import KnowledgeHub from './pages/KnowledgeHub';
import StoreHandbook from './pages/StoreHandbook';
import StoreImport from './pages/StoreImport';
import NewKnowledgeModal from './components/Modal/NewKnowledgeModal';
import { AppStateProvider, useAppState } from './context/AppStateContext';

import DesignTaskManagement from './pages/DesignTaskManagement';
import DataImport from './pages/DataImport';
import DesignDataImport from './pages/DesignDataImport';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user } = useAppState();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const IndexRedirect = () => {
  const { user } = useAppState();
  const role = (user?.role || '').trim().toLowerCase();

  // Adjusted: Case insensitive check
  if (user?.parentTeam === 'AM' && role !== 'admin' && role !== 'manager') {
    return <Navigate to="/tasks" replace />;
  }
  return <Overview />;
};

const SettingsRoute = ({ children }) => {
  const { canDo } = useAppState();

  if (!canDo('settings.edit')) {
    return <Navigate to="/" replace />;
  }
  return children ? children : <Settings />;
};

const DesignDataImportRoute = ({ children }) => {
  const { canDo, user } = useAppState();
  const role = (user?.role || '').toLowerCase();

  if (canDo('design.manage') || role === 'manager' || role === 'admin') {
    return children;
  }
  return <Navigate to="/" replace />;
};

const ActivityHistoryRoute = () => {
  const { canDo } = useAppState();

  if (!canDo('audit_logs.view')) {
    return <Navigate to="/" replace />;
  }
  return <ActivityHistory />;
};

const DesignTaskRoute = () => {
  const { canDo } = useAppState();

  if (!canDo('design.view')) {
    return <Navigate to="/" replace />;
  }
  return <DesignTaskManagement />;
};

function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

function AppContent() {
  const { isLoading, newKnowledgeModal, setNewKnowledgeModal, welcomeModal } = useAppState();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#1a1b1e',
        color: '#fff',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#1890ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p>Đang tải dữ liệu hệ thống...</p>
      </div>
    );
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<IndexRedirect />} />
            <Route path="tasks" element={<TaskManagement />} />
            <Route path="design-tasks" element={<DesignTaskRoute />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="history" element={<ActivityHistoryRoute />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="personnel" element={<Personnel />} />
            <Route path="reports" element={<Reports />} />
            <Route path="knowledge" element={<KnowledgeHub />} />
            <Route path="store-handbook" element={<StoreHandbook />} />
            <Route path="store-import" element={<StoreImport />} />
            <Route path="data-import" element={<SettingsRoute><DataImport /></SettingsRoute>} />
            <Route path="design-import" element={<DesignDataImportRoute><DesignDataImport /></DesignDataImportRoute>} />
            <Route path="settings" element={<SettingsRoute />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {/* New Knowledge Notification Modal */}
      {!welcomeModal && newKnowledgeModal && newKnowledgeModal.items && (
        <NewKnowledgeModal
          items={newKnowledgeModal.items}
          onClose={() => setNewKnowledgeModal(null)}
        />
      )}
    </>
  );
}

export default App;
