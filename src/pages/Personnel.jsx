import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    Plus,
    Info,
    ChevronLeft,
    ChevronRight,
    Users,
    Edit2,
    Trash2
} from 'lucide-react';
import styles from './Personnel.module.css';
import { useAppState } from '../context/AppStateContext';
import AddPersonnelModal from '../components/Modal/AddPersonnelModal';

const Personnel = () => {
    // 1. Safe State Initialization
    const { personnel = [], tasks = [], teams = [], canDo = () => false, deletePersonnel, user, shiftDefinitions = [] } = useAppState();
    const [activeTab, setActiveTab] = useState('MKT Support');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm]);

    const isMktSupportEmployee = user?.parentTeam === 'MKT Support' && user?.role === 'Nhân viên';
    const isAmEmployee = user?.parentTeam === 'AM' && user?.role === 'Nhân viên';
    const isAmAdmin = user?.role === 'Admin' && user?.parentTeam === 'AM';

    const handleEdit = (person) => {
        setSelectedPerson(person);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa nhân sự này? Thao tác này không thể hoàn tác.")) {
            try {
                await deletePersonnel(id);
            } catch (err) {
                alert("Không thể xóa nhân sự: " + err.message);
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPerson(null);
    };

    // 2. Helper Functions with Full Null Checks
    const getJobTitle = (member) => {
        if (!member) return 'Staff';
        if (member.name === 'Vivian' || member.id === '02') return 'Graphic Designer';
        if (member.parentTeam === 'MKT Support') return 'Marketing Support';
        if (member.parentTeam === 'AM') return 'Account Manager';
        return member.team || 'Staff';
    };

    const getJobTitleStyle = (title) => {
        if (!title) return {};

        // 1. Check if title matches a team name
        const teamConfig = Array.isArray(teams) ? teams.find(t => t && t.name && t.name.toLowerCase() === title.toLowerCase()) : null;
        if (teamConfig && teamConfig.color) {
            return {
                backgroundColor: `${teamConfig.color}15`,
                color: teamConfig.color,
                borderColor: `${teamConfig.color}30`
            };
        }

        // 2. Custom colors for specific titles
        const customColors = {
            'Graphic Designer': '#d9363e', // Red-ish
            'Marketing Support': '#1890ff', // Blue
            'Account Manager': '#52c41a', // Green
            'Staff': '#8c8c8c', // Gray
            'Leader': '#faad14', // Gold
            'Manager': '#722ed1', // Purple
        };

        if (customColors[title]) {
            const color = customColors[title];
            return {
                backgroundColor: `${color}15`,
                color: color,
                borderColor: `${color}30`
            };
        }

        // 3. Hash function for consistent random colors for other titles
        let hash = 0;
        for (let i = 0; i < title.length; i++) {
            hash = title.charCodeAt(i) + ((hash << 5) - hash);
        }

        const hue = Math.abs(hash % 360);
        return {
            backgroundColor: `hsla(${hue}, 70%, 50%, 0.1)`,
            color: `hsl(${hue}, 70%, 50%)`,
            borderColor: `hsla(${hue}, 70%, 50%, 0.2)`
        };
    };

    const getInitials = (name) => {
        if (!name || typeof name !== 'string') return '??';
        return name.split(/\s+/).filter(Boolean).map(n => n[0]).join('').toUpperCase();
    };

    // 3. Robust Filtering Logic
    const filteredPersonnel = useMemo(() => {
        return (personnel || []).filter(member => {
            if (!member) return false;

            // Match Parent Team Tab (Case-insensitive)
            const parentTeam = (member.parentTeam || member.team || '').toLowerCase();
            if (parentTeam !== activeTab.toLowerCase()) return false;

            // Search Filter
            const search = searchTerm.toLowerCase();
            if (!search) return true;

            return (
                (member.name || '').toLowerCase().includes(search) ||
                (member.email || '').toLowerCase().includes(search) ||
                (member.telegram || '').toLowerCase().includes(search) ||
                (member.id || '').toString().includes(search)
            );
        }).sort((a, b) => {
            // Manager first
            if (a.role === 'Manager' && b.role !== 'Manager') return -1;
            if (a.role !== 'Manager' && b.role === 'Manager') return 1;
            return 0;
        });
    }, [personnel, activeTab, searchTerm]);

    // 4. Tab Definitions
    const mainTabs = useMemo(() => {
        return teams
            .filter(t => t && t.name && ['MKT Support', 'AM'].includes(t.name))
            .sort((a, b) => {
                if (a.name === 'MKT Support') return -1;
                if (b.name === 'MKT Support') return 1;
                return 0;
            });
    }, [teams]);



    // Pagination Logic
    const totalPages = Math.ceil(filteredPersonnel.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredPersonnel.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Quản lý Đội ngũ</h1>

                <div className={styles.tabs}>
                    {mainTabs.length > 0 ? (
                        mainTabs.map(team => {
                            const count = (personnel || []).filter(p => {
                                const pTeam = (p.parentTeam || p.team || '').toLowerCase();
                                return pTeam === team.name.toLowerCase();
                            }).length;

                            return (
                                <div
                                    key={team.id}
                                    className={`${styles.tab} ${activeTab.toLowerCase() === team.name.toLowerCase() ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab(team.name)}
                                >
                                    <Users size={18} />
                                    <span>{team.name} Team</span>
                                    <span className={styles.count}>{count}</span>
                                </div>
                            );
                        })
                    ) : (
                        <div className={styles.tabPlaceholder}>Đang tải danh sách team...</div>
                    )}
                </div>
            </div>

            <div className={styles.infoBanner}>
                <div className={styles.infoIcon}>
                    <Info size={20} />
                </div>
                <p className={styles.infoText}>
                    Tài khoản nhân sự được liên kết trực tiếp với <strong>Email công ty</strong>. Nhân viên bắt buộc phải đăng nhập bằng Email này để truy cập hệ thống.
                </p>
            </div>

            <div className={styles.controls}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm nhân sự theo tên, ID, email..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.actionBtns}>
                    {canDo('personnel.add') && (
                        <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
                            <Plus size={18} />
                            <span>Thêm nhân sự</span>
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th} style={{ width: '80px' }}>STT</th>
                            <th className={styles.th}>TÊN NHÂN VIÊN</th>
                            <th className={styles.th}>VAI TRÒ</th>
                            <th className={styles.th}>VỊ TRÍ</th>
                            <th className={styles.th}>ID TELEGRAM</th>
                            <th className={styles.th}>EMAIL</th>
                            <th className={styles.th} style={{ width: '450px' }}>LỊCH TRÌNH CỐ ĐỊNH</th>
                            {(user?.role === 'Admin' || user?.role === 'Manager') && (
                                <th className={styles.th} style={{ width: '100px', textAlign: 'center' }}>ĐÃ XONG</th>
                            )}
                            {!isMktSupportEmployee && !isAmEmployee && (canDo('personnel.edit') || canDo('personnel.delete')) && (
                                <th className={styles.th} style={{ width: '120px', textAlign: 'center' }}>THAO TÁC</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPersonnel.length > 0 ? (
                            currentItems.map((member, index) => {
                                // If member.team is different from activeTab, it's a 'mini-team'
                                const displayMiniTeam = member.team && member.team.toLowerCase() !== activeTab.toLowerCase();

                                return (
                                    <tr key={member.id || `row-${index}`}>
                                        <td className={`${styles.td} ${styles.stt}`}>
                                            {startIndex + index + 1}
                                        </td>
                                        <td className={styles.td}>
                                            <div className={styles.userCell}>
                                                <div className={styles.avatarWrapper}>
                                                    <img
                                                        src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=random`}
                                                        alt={member.name}
                                                        className={styles.avatar}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=random`;
                                                        }}
                                                    />
                                                    <span className={(member.firebaseUid || member.status === 'active' || member.isOnline || member.lastSeen) ? styles.onlineDot : styles.offlineDot}></span>
                                                </div>
                                                <div className={styles.userDetail}>
                                                    <span className={styles.userName}>{member.name || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.td}>
                                            <span className={styles.userRole} style={{ fontSize: '13px' }}>{member.role || 'Nhân viên'}</span>
                                        </td>
                                        <td className={styles.td}>
                                            {(() => {
                                                const title = getJobTitle(member);
                                                return (
                                                    <span className={styles.jobBadge} style={getJobTitleStyle(title)}>
                                                        {title}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className={`${styles.td} ${styles.telegram}`}>{member.telegram || '-'}</td>
                                        <td className={`${styles.td} ${styles.email}`}>{member.email || 'N/A'}</td>
                                        <td className={styles.td}>
                                            <div className={styles.scheduleGrid}>
                                                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => {
                                                    const shift = member.workShifts?.[day];
                                                    if (!shift) return null;
                                                    return (
                                                        <div key={day} className={styles.scheduleItem}>
                                                            <span className={styles.dayLabel}>{day}:</span>
                                                            <span className={`${styles.shiftBadgeMini} ${(() => {
                                                                const idx = shiftDefinitions.findIndex(s => s.name === shift);
                                                                if (idx === 0) return styles.shift1;
                                                                if (idx === 1) return styles.shift2;
                                                                if (idx === 2) return styles.shift3;
                                                                return styles.shiftOther;
                                                            })()}`}>
                                                                {shift}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {(!member.workShifts || Object.keys(member.workShifts).length === 0) && '-'}
                                            </div>
                                        </td>
                                        {(canDo('reports.view') || canDo('tasks.view_all')) && (
                                            <td className={styles.td} style={{ textAlign: 'center' }}>
                                                <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '15px' }}>
                                                    {tasks.filter(t => t.assignee?.id === member.id && t.status === 'Hoàn thành').length}
                                                </span>
                                            </td>
                                        )}
                                        {(canDo('personnel.edit') || canDo('personnel.delete')) && (
                                            <td className={styles.td}>
                                                <div className={styles.tableActions}>
                                                    {(canDo('personnel.edit') &&
                                                        (!isAmAdmin || member.parentTeam === 'AM')) && (
                                                            <button
                                                                className={styles.actionBtn}
                                                                onClick={() => handleEdit(member)}
                                                                title="Chỉnh sửa"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        )}
                                                    {(canDo('personnel.delete') &&
                                                        (!isAmAdmin || member.parentTeam === 'AM')) && (
                                                            <button
                                                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                                onClick={() => handleDelete(member.id)}
                                                                title="Xóa"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="9" className={styles.emptyMsg}>
                                    {searchTerm
                                        ? `Không tìm thấy nhân sự "${searchTerm}" trong ${activeTab} Team`
                                        : `Chưa có nhân sự thuộc ${activeTab} Team`}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className={styles.footer}>
                <div className={styles.paginationInfo}>
                    Hiển thị {Math.min(startIndex + 1, filteredPersonnel.length)} - {Math.min(startIndex + itemsPerPage, filteredPersonnel.length)} của {filteredPersonnel.length} nhân sự
                </div>
                {totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button
                            className={`${styles.pageBtn} ${currentPage === 1 ? styles.disabled : ''}`}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={18} />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <div
                                key={page}
                                className={`${styles.pageIndicator} ${currentPage === page ? styles.pageActive : ''}`}
                                onClick={() => setCurrentPage(page)}
                                style={{ cursor: 'pointer' }}
                            >
                                {page}
                            </div>
                        ))}

                        <button
                            className={`${styles.pageBtn} ${currentPage === totalPages ? styles.disabled : ''}`}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Components */}
            {isModalOpen && (
                <AddPersonnelModal
                    onClose={handleCloseModal}
                    person={selectedPerson}
                />
            )}
        </div>
    );
};

export default Personnel;
