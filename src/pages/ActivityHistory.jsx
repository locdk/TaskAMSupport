import React, { useState, useMemo } from 'react';
import {
    Search,
    Download,
    ArrowRight,
    Clock,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Filter,
    Inbox,
    Store
} from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './StatusHistory.module.css';
import { useAppState } from '../context/AppStateContext';

const ActivityHistory = () => {
    const { notifications = [], attendanceHistory = [], storeLogs = [], personnel, settings, tasks = [], isLoading } = useAppState();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, task, attendance, store
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 100;

    if (isLoading) {
        return <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
    }

    const mergedActivities = useMemo(() => {
        const list = [];

        // 1. Task Notifications
        notifications.forEach(n => {
            const task = (tasks || []).find(t => t.id === n.taskId);
            let details = n.message;
            if (task && !details.includes('- AM:')) {
                const amName = task.am || (personnel?.find(p => p.email === task.createdBy)?.name) || '';
                if (amName && amName !== 'system') {
                    details += ` - AM: **${amName}**`;
                }
            }
            list.push({
                id: `notif-${n.id}`,
                originId: n.id,
                userName: 'Hệ thống',
                action: n.title,
                details: details,
                timestamp: (n.createdAt && n.createdAt.toMillis ? n.createdAt.toMillis() : (n.createdAt && n.createdAt.seconds ? n.createdAt.seconds * 1000 : (n.createdAt ? new Date(n.createdAt).getTime() : (parseInt(n.id) || Date.now())))) || Date.now(),
                type: 'task',
                taskId: n.taskId,
                color: '#1890ff',
                category: n.type // 'new-task', 'task-update', 'task-complete'
            });
        });

        // 2. Attendance History
        (attendanceHistory || []).forEach(h => {
            let actionText = 'Cập nhật trạng thái';
            let detailText = `Từ **${h.oldStatus}** sang **${h.newStatus}**`;

            if (h.newStatus && h.date) {
                const parts = h.date.split('-');
                if (parts.length === 3) {
                    detailText += ` cho ngày **${parts[2]}/${parts[1]}/${parts[0]}**`;
                } else {
                    detailText += ` cho ngày **${h.date}**`;
                }
            }

            let itemType = 'attendance';
            let itemColor = h.newStatus ? '#722ed1' : '#52c41a';

            if (h.action === 'CHECK_IN') {
                actionText = 'Vào ca làm';
                detailText = h.details || 'Nhân viên đã vào ca làm';
            } else if (h.action === 'CHECK_OUT') {
                actionText = 'Tan ca làm';
                detailText = h.details || 'Nhân viên đã tan ca làm';
            } else if (h.action === 'LOGIN') {
                actionText = 'Đăng nhập';
                detailText = h.details || 'Vào ca làm hệ thống';
            } else if (h.action === 'STORE_UPDATE' || h.action === 'STORE_DELETE_REQ') {
                actionText = 'Cập nhật Sổ tay';
                detailText = h.details || 'Cập nhật thông tin tiệm';
                itemType = 'store';
                itemColor = '#fa8c16';
            } else if (!h.newStatus) {
                detailText = h.details || 'Cập nhật thông tin hồ sơ';
            }

            list.push({
                id: `hist-${h.id}`,
                originId: h.id,
                userName: h.userName || 'Nhân sự',
                userId: h.userId,
                action: actionText,
                details: detailText,
                timestamp: (h.timestamp && h.timestamp.toMillis ? h.timestamp.toMillis() : (h.timestamp && h.timestamp.seconds ? h.timestamp.seconds * 1000 : (h.timestamp ? new Date(h.timestamp).getTime() : Date.now()))) || Date.now(),
                type: itemType,
                color: itemColor
            });
        });

        // 3. Store Logs
        (storeLogs || []).forEach(sl => {
            let actionText = 'Cập nhật Sổ tay';
            if (sl.action === 'create') actionText = 'Thêm tiệm mới';
            else if (sl.action === 'update') actionText = 'Cập nhật thông tin tiệm';
            else if (sl.action === 'delete_request' || sl.action === 'delete') actionText = 'Yêu cầu xóa tiệm';
            else if (sl.action === 'permanent_delete') actionText = 'Xóa vĩnh viễn tiệm';
            else if (sl.action === 'restore') actionText = 'Khôi phục tiệm';

            list.push({
                id: `store-${sl.id}`,
                originId: sl.id,
                userName: sl.userName || 'Hệ thống',
                userId: sl.userId,
                action: actionText,
                details: sl.details || `Sổ tay: **${sl.storeName}**`,
                timestamp: (sl.timestamp && sl.timestamp.toMillis ? sl.timestamp.toMillis() : (sl.timestamp && sl.timestamp.seconds ? sl.timestamp.seconds * 1000 : (sl.timestamp ? new Date(sl.timestamp).getTime() : Date.now()))) || Date.now(),
                type: 'store',
                color: '#fa8c16'
            });
        });

        // Sort descending
        return list.sort((a, b) => b.timestamp - a.timestamp);
    }, [notifications, attendanceHistory, storeLogs]);

    const filteredActivities = useMemo(() => {
        return mergedActivities.filter(item => {
            // Search filter
            const search = searchTerm.toLowerCase();
            if (search && !item.userName.toLowerCase().includes(search) && !item.action.toLowerCase().includes(search) && !item.details.toLowerCase().includes(search)) {
                return false;
            }

            // Type filter
            if (filterType !== 'all' && item.type !== filterType) return false;

            return true;
        });
    }, [mergedActivities, searchTerm, filterType]);

    // Pagination
    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
    const paginatedItems = filteredActivities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getTimeFormatted = (ts) => {
        const d = new Date(ts);
        return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const renderDetails = (text) => {
        if (!text) return '';
        // Basic markdown-like bold parsing
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} style={{ color: 'var(--primary)' }}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const handleExportCSV = () => {
        if (!filteredActivities.length) return;

        // Headers
        const headers = ['Thời gian', 'Đối tượng', 'Hoạt động', 'Chi tiết', 'Loại'];

        // Rows
        const rows = filteredActivities.map(item => {
            const time = getTimeFormatted(item.timestamp);
            const user = item.userName || '';
            const action = item.action || '';
            // Strip markdown-like ** ** from details for cleaner CSV
            const details = (item.details || '').replace(/\*\*/g, '');
            let typeLabel = 'Hệ thống';
            if (item.type === 'task') typeLabel = 'Nhiệm vụ';
            else if (item.type === 'attendance') typeLabel = 'Chấm công';
            else if (item.type === 'store') typeLabel = 'Sổ tay';

            // Escape double quotes and wrap in quotes
            const formatField = (field) => `"${field.replace(/"/g, '""')}"`;

            return [
                formatField(time),
                formatField(user),
                formatField(action),
                formatField(details),
                formatField(typeLabel)
            ].join(',');
        });

        // Combine with BOM for UTF-8 support in Excel
        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const date = new Date();
        const dateStr = `${String(date.getDate()).padStart(2, '0')}_${String(date.getMonth() + 1).padStart(2, '0')}_${date.getFullYear()}`;
        link.setAttribute('download', `nhat_ky_hoat_dong_${dateStr}.csv`);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Nhật ký Hoạt động Hệ thống</h1>
                    <p className={styles.subtitle}>Theo dõi tất cả thay đổi về công việc và trạng thái nhân sự</p>
                </div>
                <button className={styles.exportBtn} onClick={handleExportCSV}>
                    <Download size={16} />
                    Xuất CSV
                </button>
            </div>

            <div className={styles.filterSection}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Tìm kiếm</label>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} size={16} />
                        <input
                            type="text"
                            className={`${styles.input} ${styles.searchInput}`}
                            placeholder="Tìm nhân sự, nội dung..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Loại hoạt động</label>
                    <select
                        className={styles.input}
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ width: '180px' }}
                    >
                        <option value="all">Tất cả hoạt động</option>
                        <option value="task">Cập nhật công việc</option>
                        <option value="attendance">Trạng thái nhân sự</option>
                        <option value="store">Sổ tay thông tin Tiệm</option>
                    </select>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th} style={{ width: '180px' }}>Thời gian</th>
                            <th className={styles.th} style={{ width: '200px' }}>Đối tượng</th>
                            <th className={styles.th}>Hoạt động</th>
                            <th className={styles.th}>Chi tiết</th>
                            <th className={styles.th} style={{ width: '120px' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedItems.length > 0 ? (
                            paginatedItems.map(item => (
                                <tr key={item.id}>
                                    <td className={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8c8c8c', fontSize: '13px' }}>
                                            <Clock size={14} />
                                            {getTimeFormatted(item.timestamp)}
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <div className={styles.userCell}>
                                            <div className={styles.avatarInitial} style={{ backgroundColor: item.color + '33', color: item.color }}>
                                                {item.type === 'task' ? <Inbox size={14} /> : (item.type === 'store' ? <Store size={14} /> : (item.userName?.charAt(0) || 'U'))}
                                            </div>
                                            <span className={styles.userName}>{item.userName}</span>
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <span className={`${styles.badge} ${item.type === 'task' ? styles.badgeUpdate : styles.badgeRequest}`}>
                                            {item.action}
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                                            {renderDetails(item.details)}
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        {item.taskId && (
                                            <Link
                                                to={`/tasks?id=${item.taskId}`}
                                                className={styles.pageBtn}
                                                style={{ width: 'auto', padding: '0 12px', fontSize: '12px', textDecoration: 'none' }}
                                            >
                                                Chi tiết
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className={styles.emptyMsg}>Không tìm thấy hoạt động nào</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className={styles.footer}>
                <div className={styles.paginationInfo}>
                    Trang {currentPage} / {totalPages || 1}
                </div>
                <div className={styles.pagination}>
                    <button
                        className={styles.pageBtn}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        className={styles.pageBtn}
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityHistory;
