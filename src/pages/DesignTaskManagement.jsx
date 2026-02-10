import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Plus,
    ChevronDown,
    Edit2,
    Trash2,
    Copy,
    Check,
    Upload
} from 'lucide-react';
import styles from './TaskManagement.module.css';
import RecordDesignModal from '../components/Modal/RecordDesignModal';
import { useAppState } from '../context/AppStateContext';


const DesignTaskManagement = () => {
    const navigate = useNavigate();
    const { tasks, personnel, addTask, updateTask, deleteTask, settings, designTaskTypes, canDo, user } = useAppState();
    const role = (user?.role || '').toLowerCase();
    const canManage = canDo('design.manage') || role === 'admin' || role === 'manager';
    const VIVIAN_ID = 'P-1769293992028-520';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    // Filter for completed design tasks assigned to Vivian
    const filteredTasks = useMemo(() => {
        return tasks.filter(t =>
            t.source === 'design' &&
            !t.deletePending &&
            (t.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => (b.completedTimestamp || 0) - (a.completedTimestamp || 0));
    }, [tasks, searchTerm]);

    const toggleExpand = (taskId) => {
        setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    };

    const handleDelete = (e, task) => {
        e.stopPropagation();
        setTaskToDelete(task);
    };

    const confirmDelete = () => {
        if (taskToDelete) {
            deleteTask(taskToDelete.id, deleteReason);
            setTaskToDelete(null);
            setDeleteReason('');
        }
    };

    const handleEdit = (e, task) => {
        e.stopPropagation();
        setTaskToEdit(task);
        setIsModalOpen(true);
    };

    const handleCopy = (e, text, id) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // List of months for grouping
    const months = useMemo(() => {
        const monthSet = new Set(filteredTasks.map(t => {
            if (t.completedTimestamp) {
                const date = new Date(t.completedTimestamp);
                return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
            }
            if (t.completedAt) {
                const parts = t.completedAt.split(' ');
                const datePart = parts.length > 1 ? parts[1] : parts[0];
                const [d, m, y] = datePart.split('/');
                if (m && y) return `${m}/${y}`;
            }
            return 'Khác';
        }));

        return [...monthSet].sort((a, b) => {
            if (a === 'Khác') return 1;
            if (b === 'Khác') return -1;
            const [m1, y1] = a.split('/').map(Number);
            const [m2, y2] = b.split('/').map(Number);
            if (y1 !== y2) return y2 - y1;
            return m2 - m1;
        });
    }, [filteredTasks]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>Quản Lý Task Design</h1>
                    <p className={styles.subtitle}>Ghi nhận các yêu cầu thiết kế đã hoàn thành.</p>
                </div>

                <div className={styles.rightActions}>
                    <div className={styles.searchBox}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Tìm theo tên tiệm..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {canManage && (
                        <>
                            <button
                                className={styles.addTaskBtn}
                                onClick={() => navigate('/design-import')}
                                style={{ backgroundColor: '#2fac66', marginRight: '10px' }}
                            >
                                <Upload size={16} />
                                Import Excel
                            </button>
                            <button className={styles.addTaskBtn} onClick={() => setIsModalOpen(true)}>
                                <Plus size={16} />
                                Ghi nhận Design
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className={styles.listHeader} style={{ gridTemplateColumns: '2fr 1fr 1.5fr 1fr 40px' }}>
                <div style={{ textAlign: 'left' }}>TÊN TIỆM</div>
                <div style={{ textAlign: 'center' }}>LOẠI DESIGN</div>
                <div style={{ textAlign: 'right' }}>THỜI GIAN HOÀN THÀNH</div>
                <div style={{ textAlign: 'center' }}>NGƯỜI LÀM</div>
                <div className={styles.hExpand}></div>
            </div>

            <div className={styles.taskGroups}>
                {months.map(month => {
                    const groupTasks = filteredTasks.filter(t => {
                        let tMonth = 'Khác';
                        if (t.completedTimestamp) {
                            const date = new Date(t.completedTimestamp);
                            tMonth = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                        } else if (t.completedAt) {
                            const parts = t.completedAt.split(' ');
                            const datePart = parts.length > 1 ? parts[1] : parts[0];
                            const [d, m, y] = datePart.split('/');
                            if (m && y) tMonth = `${m}/${y}`;
                        }
                        return tMonth === month;
                    });

                    return (
                        <div key={month} className={styles.group}>
                            <div className={styles.groupHeader}>
                                <span className={styles.groupDot} style={{ backgroundColor: '#52c41a' }}></span>
                                <span className={styles.groupTitle}>{month === 'Khác' ? 'Thời gian khác' : `Tháng ${month}`}</span>
                                <span className={styles.taskCount}>{groupTasks.length}</span>
                            </div>
                            <div className={styles.groupContent}>
                                {groupTasks.map(task => (
                                    <React.Fragment key={task.id}>
                                        <div
                                            className={`${styles.taskRow} ${expandedTaskId === task.id ? styles.expandedRow : ''}`}
                                            style={{ gridTemplateColumns: '2fr 1fr 1.5fr 1fr 40px' }}
                                            onClick={() => toggleExpand(task.id)}
                                        >
                                            <div className={styles.cellName} style={{ textAlign: 'left' }}>{task.name}</div>
                                            <div className={styles.cellType} style={{ textAlign: 'center' }}>
                                                <span className={styles.typeAnchor} style={{
                                                    color: designTaskTypes.find(t => t.name === task.type)?.color || '#8c8c8c',
                                                    backgroundColor: (designTaskTypes.find(t => t.name === task.type)?.color || '#8c8c8c') + '20',
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px'
                                                }}>
                                                    {task.type}
                                                </span>
                                            </div>
                                            <div className={styles.cellDateDone} style={{ textAlign: 'right', justifyContent: 'flex-end' }}>{task.completedAt || '-'}</div>
                                            <div className={styles.cellAssignee} style={{ textAlign: 'center', justifyContent: 'center' }}>
                                                <div className={styles.assigneeAnchor}>
                                                    <img src={task.assignee?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee?.name || 'User')}&background=random`} className={styles.assigneeImg} alt="" />
                                                    <span>{task.assignee?.name || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className={styles.expandCell}>
                                                <ChevronDown size={16} className={`${styles.expandIcon} ${expandedTaskId === task.id ? styles.iconRotated : ''}`} />
                                            </div>
                                        </div>

                                        {expandedTaskId === task.id && (
                                            <div className={styles.taskDetailContainer}>
                                                <div className={styles.detailBody} style={{ gridTemplateColumns: '1fr auto' }}>
                                                    <div className={styles.detailMain}>
                                                        <div className={styles.detailSection}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                                <h4 className={styles.detailLabel} style={{ marginBottom: 0 }}>Ghi chú / Nội dung</h4>
                                                                {task.content && (
                                                                    <button
                                                                        className={styles.btnCopy}
                                                                        onClick={(e) => handleCopy(e, task.content, task.id)}
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '6px',
                                                                            padding: '4px 10px',
                                                                            borderRadius: '6px',
                                                                            fontSize: '12px',
                                                                            color: copiedId === task.id ? '#52c41a' : 'var(--text-secondary)',
                                                                            border: '1px solid',
                                                                            borderColor: copiedId === task.id ? '#52c41a' : 'var(--bg-tertiary)',
                                                                            backgroundColor: 'transparent',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        {copiedId === task.id ? (
                                                                            <><Check size={14} /> Đã Copy</>
                                                                        ) : (
                                                                            <><Copy size={14} /> Copy nội dung</>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className={styles.fullContent}>
                                                                {task.content || <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>Không có ghi chú.</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.detailSidebar} style={{ borderLeft: '1px solid var(--bg-tertiary)', paddingLeft: '24px' }}>
                                                        <div className={styles.detailSection}>
                                                            <h4 className={styles.detailLabel}>Thao tác</h4>
                                                            <div className={styles.managerActions}>
                                                                {canManage && (
                                                                    <>
                                                                        <button className={styles.btnEdit} onClick={(e) => handleEdit(e, task)}>
                                                                            <Edit2 size={14} /> Sửa thông tin
                                                                        </button>
                                                                        <button className={styles.btnDelete} onClick={(e) => handleDelete(e, task)}>
                                                                            <Trash2 size={14} /> Xóa bản ghi
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {filteredTasks.length === 0 && (
                    <div className={styles.emptyGroup}>Chưa có dữ liệu task hoàn thành.</div>
                )}
            </div>

            {isModalOpen && (
                <RecordDesignModal
                    onClose={() => {
                        setIsModalOpen(false);
                        setTaskToEdit(null);
                    }}
                    editTask={taskToEdit}
                />
            )}

            {/* Delete Confirmation Modal */}
            {taskToDelete && (
                <div className={styles.confirmOverlay}>
                    <div className={styles.confirmModal}>
                        <div className={`${styles.confirmIcon} ${styles.dangerIcon}`}>
                            <Trash2 size={32} />
                        </div>
                        <h3>Xác nhận xóa task</h3>
                        <p>Bạn có chắc chắn muốn xóa task cho tiệm <strong>{taskToDelete.name}</strong>? Hành động này không thể hoàn tác.</p>

                        <div className={styles.deleteReasonContainer}>
                            <label>Lí do xóa task:</label>
                            <textarea
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder="Nhập lí do xóa task (bắt buộc)..."
                                className={styles.deleteReasonInput}
                                autoFocus
                            />
                        </div>

                        <div className={styles.confirmActions}>
                            <button onClick={() => { setTaskToDelete(null); setDeleteReason(''); }} className={styles.btnConfirmCancel}>Hủy</button>
                            <button
                                onClick={confirmDelete}
                                className={styles.btnConfirmDelete}
                                disabled={!deleteReason.trim()}
                                style={{ opacity: deleteReason.trim() ? 1 : 0.5, cursor: deleteReason.trim() ? 'pointer' : 'not-allowed' }}
                            >
                                Xóa vĩnh viễn
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesignTaskManagement;
