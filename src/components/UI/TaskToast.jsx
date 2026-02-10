import React, { useEffect, useState } from 'react';
import { X, Bell, Check, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import styles from './TaskToast.module.css';

const TaskToast = ({ message, title = 'Thông báo', onClose, duration = 4000, type = 'info', showConfirmButton = false }) => {
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

    const getIcon = () => {
        switch (type) {
            case 'success': return <Check size={16} />;
            case 'warning': return <AlertTriangle size={16} />;
            case 'error': return <AlertCircle size={16} />;
            case 'info': default: return <Bell size={16} />;
        }
    };

    const renderText = (text) => {
        if (!text) return '';
        // Split by markdown bold markers **text**
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div className={`${styles.toastWrapper} ${isExiting ? styles.exit : styles.enter}`}>
            <div className={`${styles.toastContainer} ${styles[type]} ${showConfirmButton ? styles.welcomeToast : ''}`}>
                <div className={styles.iconCircle}>
                    {getIcon()}
                </div>

                <div className={styles.toastBody}>
                    <h4 className={styles.toastTitle}>{title}</h4>
                    <p className={styles.toastMessage}>{renderText(message)}</p>

                    {showConfirmButton && (
                        <button className={styles.confirmBtn} onClick={handleClose}>
                            <Check size={16} />
                            Tôi đã hiểu
                        </button>
                    )}
                </div>

                {!showConfirmButton && (
                    <button className={styles.closeBtn} onClick={handleClose}>
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TaskToast;
