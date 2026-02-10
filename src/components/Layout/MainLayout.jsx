import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TaskToast from '../UI/TaskToast';
import WelcomeModal from '../UI/WelcomeModal';
import { useAppState } from '../../context/AppStateContext';
import styles from './MainLayout.module.css';

const MainLayout = () => {
  const { toast, setToast, welcomeModal, setWelcomeModal, user, updateAttendance } = useAppState();

  // Activity Tracking
  React.useEffect(() => {
    if (!user) return;

    let timeout;
    const handleActivity = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Update lastActive in attendance record every 5 mins or on significant activity
        // Here we just debounce to 5 minutes to avoid spamming API
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];

        // We only update if we can find an open session in Attendance page logic, 
        // but here we just send the update signal. The Context logic handles finding the record.
        updateAttendance({
          userId: user.id,
          date: dateStr,
          lastActive: now.toISOString()
        }).catch(err => console.error("Failed to update last active", err));

      }, 5 * 60 * 1000); // 5 minutes debounce/throttle
    };

    // Initial update on mount if logged in
    handleActivity();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearTimeout(timeout);
    };
  }, [user, updateAttendance]);

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.mainContent}>
        <div className={styles.contentScroll}>
          <Outlet />
        </div>
      </main>

      {toast && (
        <TaskToast
          title={toast.title}
          message={toast.message}
          showConfirmButton={toast.showConfirmButton}
          onClose={() => setToast(null)}
        />
      )}

      {welcomeModal && (
        <WelcomeModal
          {...welcomeModal}
          onClose={() => setWelcomeModal(null)}
        />
      )}
    </div>
  );
};

export default MainLayout;
