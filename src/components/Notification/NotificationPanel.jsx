import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Bell, AlertTriangle, MessageSquare, X } from 'lucide-react';
import styles from './NotificationPanel.module.css';

const NotificationPanel = ({ isOpen, onClose, notifications, onMarkAllRead, onMarkRead }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    // Improve sorting and categorization
    const sortedNotifications = [...notifications].sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (parseInt(a.id) || 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (parseInt(b.id) || 0);
        return timeB - timeA;
    });

    // If category is not set by system, we'll put everything in 'recent'
    const recentNotifications = sortedNotifications.filter(n => n.category !== 'older');
    const olderNotifications = sortedNotifications.filter(n => n.category === 'older');

    const markAllAsRead = () => {
        if (onMarkAllRead) {
            onMarkAllRead();
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'new-task':
            case 'task-complete':
                return <Bell size={20} className={styles.iconBlue} />;
            case 'update':
            case 'task-update':
                return <MessageSquare size={20} className={styles.iconOrange} />;
            case 'overdue':
                return <AlertTriangle size={20} className={styles.iconRed} />;
            default:
                return <Bell size={20} />;
        }
    };

    const getNotificationBadge = (notification) => {
        if (notification.isRead) return null;
        return <span className={styles.badgeNew}>Mới</span>;
    };

    const handleActionClick = (notification) => {
        if (!notification.isRead && onMarkRead) {
            onMarkRead(notification.id);
        }
        onClose();
        if (notification.taskId) {
            navigate(`/tasks?id=${notification.taskId}`);
        }
    };

    const renderText = (text) => {
        if (!text) return '';
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const content = part.slice(2, -2);
                return <strong key={i} style={{ color: '#1890ff' }}>{content}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    /**
    * Updated time formatting to support Firestore Timestamps
    */
    const formatNotificationTime = (n) => {
        let date = null;

        if (n.createdAt && n.createdAt.seconds) {
            date = new Date(n.createdAt.seconds * 1000);
        } else if (n.time && n.time !== 'Vừa xong') {
            // Handle "HH:mm DD/MM/YYYY"
            const parts = n.time.split(' ');
            if (parts.length === 2 && parts[1].includes('/')) {
                const [h, m] = parts[0].split(':').map(Number);
                const [d, mon, y] = parts[1].split('/').map(Number);
                date = new Date(y, mon - 1, d, h, m);
            } else {
                date = new Date(n.time);
            }
        } else {
            const timestamp = parseInt(n.id);
            // Detect if ID is a timestamp (> year 2020)
            if (!isNaN(timestamp) && timestamp > 1600000000000) {
                date = new Date(timestamp);
            }
        }

        if (date && !isNaN(date.getTime())) {
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) return 'Vừa xong';
            if (diffMins < 60) return `${diffMins} phút trước`;
            if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ trước`;

            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${hours}:${minutes} ${day}/${month}/${year}`;
        }

        return 'Vừa xong';
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose}></div>
            <div className={styles.panel}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <h2 className={styles.title}>Thông báo</h2>
                        <button className={styles.closeBtn} onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                    <button className={styles.markAllRead} onClick={markAllAsRead}>
                        <CheckCheck size={16} />
                        Đánh dấu tất cả là đã đọc
                    </button>
                </div>

                <div className={styles.content}>
                    {recentNotifications.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionLabel}>MỚI NHẤT</div>
                            {recentNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                                    onClick={() => handleActionClick(notification)}
                                >
                                    <div className={styles.notificationIcon}>
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className={styles.notificationContent}>
                                        <div className={styles.notificationHeader}>
                                            <span className={styles.notificationTitle}>
                                                {notification.title}
                                            </span>
                                            {getNotificationBadge(notification)}
                                        </div>
                                        <div className={styles.notificationMessage}>
                                            {renderText(notification.message)}
                                        </div>
                                        <div className={styles.notificationMeta}>
                                            <span className={styles.metaItem}>
                                                📋 {notification.location || 'Hệ thống'}
                                            </span>
                                            <span className={styles.metaDivider}>•</span>
                                            <span className={styles.metaItem}>
                                                ⏰ {formatNotificationTime(notification)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className={styles.actionButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleActionClick(notification);
                                        }}
                                    >
                                        {notification.actionLabel || 'Xem'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {olderNotifications.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionLabel}>TRƯỚC ĐÓ</div>
                            {olderNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                                    onClick={() => handleActionClick(notification)}
                                >
                                    <div className={styles.notificationIcon}>
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className={styles.notificationContent}>
                                        <div className={styles.notificationHeader}>
                                            <span className={styles.notificationTitle}>
                                                {notification.title}
                                            </span>
                                            {getNotificationBadge(notification)}
                                        </div>
                                        <div className={styles.notificationMessage}>
                                            {renderText(notification.message)}
                                        </div>
                                        <div className={styles.notificationMeta}>
                                            <span className={styles.metaItem}>
                                                📋 {notification.location || 'Hệ thống'}
                                            </span>
                                            <span className={styles.metaDivider}>•</span>
                                            <span className={styles.metaItem}>
                                                ⏰ {formatNotificationTime(notification)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className={styles.actionButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleActionClick(notification);
                                        }}
                                    >
                                        {notification.actionLabel || 'Xem'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {notifications.length === 0 && (
                        <div className={styles.emptyState}>
                            <Bell size={48} className={styles.emptyIcon} />
                            <p>Đã hiển thị hết các thông báo gần đây</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationPanel;
