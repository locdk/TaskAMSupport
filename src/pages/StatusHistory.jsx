import React, { useState, useMemo } from 'react';
import {
    Search,
    Download,
    ArrowRight,
    Clock,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import styles from './StatusHistory.module.css';
import { useAppState } from '../context/AppStateContext';

const StatusHistory = () => {
    const { attendanceHistory = [], personnel, settings, isLoading } = useAppState();
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    if (isLoading) {
        return <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
    }

    // Permission Check
    if (settings?.userRole !== 'Manager') {
        return (
            <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Truy cập bị từ chối</h2>
                    <p>Chỉ tài khoản Quản lý (Manager) mới có quyền xem lịch sử cập nhật.</p>
                </div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Work': return '#1890ff';
            case 'OFF': return '#8c8c8c';
            case 'NP': return '#fa8c16';
            case 'ME': return '#9254de';
            case 'NL': return '#ff4d4f';
            default: return '#fff';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'Work': return 'Work';
            case 'OFF': return 'OFF';
            case 'NP': return 'Phép năm';
            case 'ME': return 'MAC Energy';
            case 'NL': return 'Nghỉ lễ';
            default: return status;
        }
    };

    const filteredHistory = useMemo(() => {
        return attendanceHistory.filter(item => {
            // Search filter
            if (searchTerm) {
                const person = personnel.find(p => p.id === item.userId);
                const name = person?.name || item.userName || '';
                if (!name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            }

            // Date range filter (optional - basic implementation)
            if (dateRange.start && item.date < dateRange.start) return false;
            if (dateRange.end && item.date > dateRange.end) return false;

            return true;
        });
    }, [attendanceHistory, searchTerm, dateRange, personnel]);

    // Pagination
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    const paginatedItems = filteredHistory.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getPersonDetails = (userId) => {
        return personnel.find(p => p.id === userId) || { name: 'Unknown', avatar: null, role: 'Staff' };
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <div className={styles.subtitle} style={{ marginBottom: '8px' }}>
                        Lịch làm việc / Quản lý nhân sự / Lịch sử cập nhật
                    </div>
                    <h1 className={styles.title}>Lịch sử Cập nhật Trạng thái</h1>
                    <div className={styles.subtitle}>Định dạng ngày thống nhất: DD/MM/YYYY</div>
                </div>
                <button className={styles.exportBtn}>
                    <Download size={16} />
                    Xuất báo cáo
                </button>
            </div>

            <div className={styles.filterSection}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Khoảng thời gian</label>
                    <div className={styles.input} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} color="#8c8c8c" />
                        <span>01/01/2026 - 31/12/2026</span>
                    </div>
                </div>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Tên nhân sự</label>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} size={16} />
                        <input
                            type="text"
                            className={`${styles.input} ${styles.searchInput}`}
                            placeholder="Tìm kiếm nhân viên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <button className={styles.filterBtn}>Lọc dữ liệu</button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Thời gian (HH:mm)</th>
                            <th className={styles.th}>Nhân sự</th>
                            <th className={styles.th}>Ngày áp dụng</th>
                            <th className={styles.th}>Hành động</th>
                            <th className={styles.th}>Nội dung thay đổi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedItems.length > 0 ? (
                            paginatedItems.map(item => {
                                const person = getPersonDetails(item.userId);
                                const timestamp = new Date(item.timestamp);
                                const dateFormatted = timestamp.toLocaleDateString('en-GB') + ' ' + timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <tr key={item.id}>
                                        <td className={styles.td} style={{ color: '#d9d9d9', fontSize: '13px' }}>
                                            <Clock size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                                            {dateFormatted}
                                        </td>
                                        <td className={styles.td}>
                                            <div className={styles.userCell}>
                                                <img
                                                    src={person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random`}
                                                    alt={person.name}
                                                    className={styles.avatar}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random`;
                                                    }}
                                                />
                                                <div className={styles.userInfo}>
                                                    <span className={styles.userName}>{person.name}</span>
                                                    <span className={styles.userRole}>{person.role || (person.parentTeam === 'MKT Support' ? 'Marketing Support' : 'Staff')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.td}>{item.date.split('-').reverse().join('/')}</td>
                                        <td className={styles.td}>
                                            <span className={`${styles.badge} ${item.action === 'request' ? styles.badgeRequest : styles.badgeUpdate}`}>
                                                {item.action === 'request' ? 'Xin nghỉ phép' : 'Cập nhật trạng thái'}
                                            </span>
                                        </td>
                                        <td className={styles.td}>
                                            <div className={styles.changeContent}>
                                                <span className={styles.statusTag} style={{
                                                    backgroundColor: `${getStatusColor(item.oldStatus)}20`,
                                                    color: getStatusColor(item.oldStatus)
                                                }}>
                                                    {getStatusLabel(item.oldStatus)}
                                                </span>
                                                <ArrowRight size={14} className={styles.arrow} />
                                                <span className={styles.statusTag} style={{
                                                    backgroundColor: `${getStatusColor(item.newStatus)}20`,
                                                    color: getStatusColor(item.newStatus)
                                                }}>
                                                    {getStatusLabel(item.newStatus)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className={styles.emptyMsg}>Không có dữ liệu lịch sử</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className={styles.footer}>
                <div className={styles.paginationInfo}>
                    Hiển thị {paginatedItems.length} trong tổng số {filteredHistory.length} bản ghi
                </div>
                <div className={styles.pagination}>
                    <button
                        className={styles.pageBtn}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.pageActive : ''}`}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        className={styles.pageBtn}
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatusHistory;
