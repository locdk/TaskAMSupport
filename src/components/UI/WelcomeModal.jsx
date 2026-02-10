import React, { useState, useEffect } from 'react';
import { X, Check, Sun, Calendar, ListTodo } from 'lucide-react';
import styles from './WelcomeModal.module.css';

const WelcomeModal = ({ userName, attendanceMessage, taskCount, quote, isAMTeam, amStats, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300);
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className={`${styles.overlay} ${isExiting ? styles.fadeOut : styles.fadeIn}`} onClick={handleClose}>
            <div
                className={`${styles.modal} ${isExiting ? styles.slideOut : styles.slideIn}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <Sun className={styles.sunIcon} size={32} />
                    </div>
                    <h2 className={styles.title}>Chào ngày làm việc mới</h2>
                    <button className={styles.closeBtn} onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <div className={styles.greeting}>
                        <span className={styles.wave}>👋</span>
                        <div className={styles.greetingTextWrapper}>
                            <p className={styles.greetingText}>
                                Chào mừng <strong>{userName}</strong>!
                            </p>
                            {isAMTeam && <p className={styles.subGreeting}>Chúc bạn một ngày làm việc tràn đầy năng lượng.</p>}
                        </div>
                    </div>

                    {/* AM Team Stats */}
                    {isAMTeam && amStats && (
                        <div style={{ marginTop: '16px', marginBottom: '12px', width: '100%' }}>
                            <h3 style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'var(--text-secondary)',
                                marginBottom: '8px',
                                textAlign: 'center'
                            }}>
                                Tổng quan Task của bạn ngày hôm nay
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '8px'
                            }}>
                                <div style={{
                                    background: 'rgba(82, 196, 26, 0.1)',
                                    padding: '8px 4px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    border: '1px solid rgba(82, 196, 26, 0.2)'
                                }}>
                                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#52c41a', lineHeight: '1.2' }}>{amStats.completed}</span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap' }}>Hoàn thành</span>
                                </div>
                                <div style={{
                                    background: 'rgba(255, 77, 79, 0.1)',
                                    padding: '8px 4px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    border: '1px solid rgba(255, 77, 79, 0.2)'
                                }}>
                                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#ff4d4f', lineHeight: '1.2' }}>{amStats.new}</span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Mới</span>
                                </div>
                                <div style={{
                                    background: 'rgba(24, 144, 255, 0.1)',
                                    padding: '8px 4px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    border: '1px solid rgba(24, 144, 255, 0.2)'
                                }}>
                                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#1890ff', lineHeight: '1.2' }}>{amStats.processing}</span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap' }}>Đang xử lý</span>
                                </div>
                                <div style={{
                                    background: 'var(--bg-tertiary)',
                                    padding: '8px 4px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    border: '1px solid var(--bg-accent)'
                                }}>
                                    <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.2' }}>{amStats.other}</span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Khác</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Motivational Quote for AM Team (Compact) */}
                    {isAMTeam && quote && (
                        <div className={styles.quoteSection} style={{ marginTop: '36px', padding: '0 8px' }}>
                            <div className={styles.quoteCard} style={{ padding: '10px 12px' }}>
                                <p className={styles.quoteText} style={{ fontSize: '13px', lineHeight: '1.4', fontStyle: 'italic' }}>"{quote}"</p>
                            </div>
                        </div>
                    )}

                    {/* Attendance Status - Hidden for AM Team */}
                    {!isAMTeam && attendanceMessage && (
                        <div className={styles.section}>
                            <div className={styles.sectionIcon}>
                                <Calendar size={20} />
                            </div>
                            <div className={styles.sectionContent}>
                                <p className={styles.sectionText}>{attendanceMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* Task Count - Hidden for AM Team */}
                    {!isAMTeam && (
                        <div className={styles.section}>
                            <div className={styles.sectionIcon}>
                                <ListTodo size={20} />
                            </div>
                            <div className={styles.sectionContent}>
                                <h3 className={styles.sectionTitle}>Công việc hôm nay</h3>
                                <p className={styles.sectionText}>
                                    Bạn có <strong className={styles.taskCount}>{taskCount}</strong> task cần thực hiện
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Motivational Quote for MKT Support Team (Bottom Placement) */}
                    {!isAMTeam && quote && (
                        <div className={`${styles.quoteSection} ${styles.quoteBottom}`}>
                            <div className={styles.quoteCard}>
                                <p className={styles.quoteText}>"{quote}"</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button className={styles.confirmBtn} onClick={handleClose}>
                        <Check size={18} />
                        Tôi đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeModal;
