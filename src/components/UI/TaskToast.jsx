import React, { useEffect, useState } from 'react';
import { X, Bell, Check } from 'lucide-react';
import styles from './TaskToast.module.css';

const TaskToast = ({ message, title = 'Thông báo', onClose, duration = 5000, showConfirmButton = false }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Only auto-dismiss if duration is set and no confirm button
        if (duration && !showConfirmButton) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, showConfirmButton]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300); // Match CSS animation time
    };

    return (
        <div className={`${styles.toastWrapper} ${isExiting ? styles.exit : styles.enter}`}>
            <div className={`${styles.toastContainer} ${showConfirmButton ? styles.welcomeToast : ''}`}>
                <div className={styles.iconCircle}>
                    <Bell size={20} className={styles.bellIcon} />
                </div>

                <div className={styles.toastBody}>
                    <h4 className={styles.toastTitle}>{title}</h4>
                    <p className={styles.toastMessage}>{message}</p>

                    {showConfirmButton && (
                        <button className={styles.confirmBtn} onClick={handleClose}>
                            <Check size={16} />
                            Tôi đã hiểu
                        </button>
                    )}
                </div>

                {!showConfirmButton && (
                    <button className={styles.closeBtn} onClick={handleClose}>
                        <X size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TaskToast;
