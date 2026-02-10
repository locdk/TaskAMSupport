import React, { useEffect, useState, useMemo } from 'react';
import { X, History, Plus, Edit2, Trash2, RotateCcw, Clock, Search } from 'lucide-react';
import styles from './StoreHistoryModal.module.css';
import * as firestoreAPI from '../../services/firestoreAPI';
import { useAppState } from '../../context/AppStateContext';

const StoreHistoryModal = ({ isOpen, onClose }) => {
    const { user, clearStoreLogs } = useAppState();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            const unsubscribe = firestoreAPI.subscribeToStoreLogs((data) => {
                setLogs(data);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [isOpen]);

    const filteredLogs = useMemo(() => {
        if (!searchTerm.trim()) return logs;
        const s = searchTerm.toLowerCase();
        return logs.filter(log =>
            (log.userName || '').toLowerCase().includes(s) ||
            (log.storeName || '').toLowerCase().includes(s) ||
            (log.details || '').toLowerCase().includes(s)
        );
    }, [logs, searchTerm]);

    if (!isOpen) return null;

    const getActionIcon = (action) => {
        switch (action) {
            case 'create': return <Plus size={16} />;
            case 'update': return <Edit2 size={16} />;
            case 'delete_request': return <Trash2 size={16} />;
            case 'permanent_delete': return <Trash2 size={16} />;
            case 'restore': return <RotateCcw size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const getActionClass = (action) => {
        switch (action) {
            case 'create': return styles.create;
            case 'update': return styles.update;
            case 'delete_request': return styles.delete;
            case 'permanent_delete': return styles.delete;
            case 'restore': return styles.restore;
            default: return '';
        }
    };



    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const d = timestamp.toDate ? timestamp.toDate() : (timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp));
        return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const renderDetails = (text) => {
        if (!text) return '';
        const lines = text.split('\n');

        return lines.map((line, idx) => {
            const parts = line.split(/(\*\*.*?\*\*)/g);
            const content = parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    const contentStr = part.slice(2, -2);
                    return <strong key={pIdx} className={styles.highlight}>{contentStr}</strong>;
                }
                return <span key={pIdx}>{part}</span>;
            });

            if (idx === 0) {
                return <div key={idx} className={styles.logHeaderLine}>{content}</div>;
            }

            return (
                <div key={idx} className={styles.logDetailLine}>
                    <span className={styles.bullet}>•</span>
                    <div className={styles.lineContent}>{content}</div>
                </div>
            );
        });
    };

    const getActionLabel = (action) => {
        switch (action) {
            case 'create': return 'Thêm tiệm mới';
            case 'update': return 'Cập nhật thông tin';
            case 'delete_request': return 'Yêu cầu xóa';
            case 'permanent_delete': return 'Xóa vĩnh viễn';
            case 'restore': return 'Khôi phục tiệm';
            default: return 'Thao tác';
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.headerLeft}>
                        <h2><History size={20} /> Nhật ký hoạt động</h2>
                    </div>
                    <div className={styles.headerSearch}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Tìm nhân viên, tên tiệm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    {['manager'].includes((user?.role || '').toLowerCase()) && (
                        <button
                            className={styles.clearAllBtn}
                            onClick={() => {
                                if (window.confirm("Bạn có chắc muốn xóa vĩnh viễn TOÀN BỘ nhật ký? Hành động này không thể hoàn tác.")) {
                                    clearStoreLogs();
                                }
                            }}
                            title="Xóa toàn bộ nhật ký"
                        >
                            <Trash2 size={16} />
                            <span>Xóa tất cả</span>
                        </button>
                    )}
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.logList}>
                        {filteredLogs.length === 0 ? (
                            <div className={styles.emptyState}>
                                <History size={48} style={{ opacity: 0.2 }} />
                                <p>{searchTerm ? "Không tìm thấy kết quả phù hợp" : "Chưa có lịch sử hoạt động nào"}</p>
                            </div>
                        ) : (
                            filteredLogs.map(log => (
                                <div key={log.id} className={styles.logItem}>
                                    <div className={`${styles.logIcon} ${getActionClass(log.action)}`}>
                                        {getActionIcon(log.action)}
                                    </div>
                                    <div className={styles.logContent}>
                                        <div className={styles.logHeader}>
                                            <div className={styles.logInfo}>
                                                <span className={styles.userName}>{log.userName || 'Unknown'}</span>
                                                <span className={`${styles.actionBadge} ${getActionClass(log.action)}`}>
                                                    {getActionLabel(log.action)}
                                                </span>
                                            </div>
                                            <span className={styles.timestamp}>
                                                <Clock size={12} /> {formatTime(log.timestamp)}
                                            </span>
                                        </div>
                                        <div className={styles.detailsArea}>
                                            {renderDetails(log.details || `Thao tác trên tiệm **${log.storeName}**`)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreHistoryModal;
