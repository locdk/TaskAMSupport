import React, { useState } from 'react';
import { X, AlertTriangle, Check, ChevronDown } from 'lucide-react';
import styles from './RecordDesignModal.module.css';
import { useAppState } from '../../context/AppStateContext';

const RecordDesignModal = ({ onClose, editTask = null }) => {
    const { addTask, updateTask, tasks, personnel, designTaskTypes, user } = useAppState();
    const [shopName, setShopName] = useState(editTask?.name || '');
    const [type, setType] = useState(editTask?.type || designTaskTypes[0]?.name || '');
    const [note, setNote] = useState(editTask?.content || '');
    const [assignedId, setAssignedId] = useState(editTask?.assignee?.id || user?.id);
    const [showWarning, setShowWarning] = useState(false);
    const [duplicateCount, setDuplicateCount] = useState(0);
    const [showConfirm, setShowConfirm] = useState(false);



    const handleNameChange = (e) => {
        const val = e.target.value;
        setShopName(val);

        if (!val.trim()) {
            setShowWarning(false);
            setDuplicateCount(0);
            return;
        }

        const count = tasks.filter(t =>
            t.name.toLowerCase().trim() === val.toLowerCase().trim() &&
            t.status !== 'Hoàn thành'
        ).length;

        if (count > 0) {
            setShowWarning(true);
            setDuplicateCount(count);
        } else {
            setShowWarning(false);
            setDuplicateCount(0);
        }
    };

    const handleRecord = () => {
        if (!shopName.trim()) return;

        if (showWarning && !showConfirm && !editTask) {
            setShowConfirm(true);
            return;
        }

        if (editTask) {
            const selectedAssignee = personnel.find(p => p.id === assignedId);
            updateTask(editTask.id, {
                name: shopName,
                title: `${shopName} - Design`,
                content: note,
                type: type,
                assignee: selectedAssignee,
                support: selectedAssignee?.name
            });
            onClose();
            return;
        }

        const assignedUser = personnel.find(p => p.id === assignedId) || user;
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${d}/${m}/${y}`;

        const newTask = {
            id: `TASK-${Date.now()}`,
            title: `${shopName} - Design`,
            name: shopName,
            content: note,
            assignee: assignedUser,
            support: assignedUser?.name || user?.name || 'Unknown',
            status: 'Hoàn thành',
            priority: 'Thường',
            type: type,
            deadline: `${d}/${m}/${y}`,
            dueDate: `${y}-${m}-${d}`,
            completedAt: timeStr,
            completedTimestamp: Date.now(),
            source: 'design',
            comments: []
        };

        addTask(newTask);
        onClose();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h2>{editTask ? 'Sửa Bản Ghi Design' : 'Ghi Nhận Design Hoàn Thành'}</h2>
                        <p>{editTask ? 'Cập nhật thông tin task đã thiết kế' : 'Ghi lại các ấn phẩm thiết kế đã hoàn thành cho tiệm'}</p>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <div className={styles.body}>
                    <div className={styles.formGroup}>
                        <label>Tên tiệm <span className={styles.required}>*</span></label>
                        <input
                            type="text"
                            placeholder="Nhập tên tiệm (VD: Nails Bar Cali...)"
                            value={shopName}
                            onChange={handleNameChange}
                            className={styles.input}
                            autoFocus
                        />
                    </div>

                    {showWarning && duplicateCount > 0 && (
                        <div className={styles.warningBox}>
                            <AlertTriangle size={20} className={styles.warnIcon} />
                            <div className={styles.warnContent}>
                                <strong>Tiệm này hiện đang có {duplicateCount} task đang xử lý</strong>
                                <p>Có thể yêu cầu thiết kế này thuộc về một task đang mở. Bạn vẫn muốn ghi nhận một bản ghi độc lập?</p>
                            </div>
                        </div>
                    )}

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Loại ấn phẩm thiết kế</label>
                            <div className={styles.selectWrapper}>
                                <select
                                    className={styles.select}
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    {designTaskTypes.map(t => (
                                        <option key={t.id} value={t.name}>{t.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className={styles.selectIcon} />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Người thực hiện</label>
                            <div className={styles.selectWrapper}>
                                <select
                                    className={styles.select}
                                    value={assignedId}
                                    onChange={(e) => setAssignedId(e.target.value)}
                                >
                                    {Array.from(new Map(personnel
                                        .filter(p => {
                                            const hasSchedule = p.workDays && p.workDays.length > 0;
                                            return (p.team === 'Designer' || p.id === user?.id || p.id === editTask?.assignee?.id) && hasSchedule;
                                        })
                                        .map(p => [p.id, p])).values()) // Deduplicate by ID
                                        .map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))
                                    }
                                </select>
                                <ChevronDown size={14} className={styles.selectIcon} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Ghi chú / Nội dung chi tiết</label>
                        <textarea
                            placeholder="Mô tả nội dung design (VD: Menu 2 mặt, Logo mới...)"
                            className={styles.textarea}
                            rows={4}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        ></textarea>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button onClick={onClose} className={styles.btnSecondary}>Hủy bỏ</button>
                    <button
                        onClick={handleRecord}
                        className={styles.btnPrimary}
                        disabled={!shopName.trim()}
                    >
                        {editTask ? 'Cập nhật thay đổi' : 'Ghi nhận hoàn thành'}
                    </button>
                </div>

                {showConfirm && (
                    <div className={styles.confirmOverlay}>
                        <div className={styles.confirmModal}>
                            <div className={styles.confirmIcon}>
                                <AlertTriangle size={32} />
                            </div>
                            <h3>Xác nhận ghi nhận trùng?</h3>
                            <p>Tiệm này đang có task chưa hoàn thành. Việc ghi nhận này sẽ tạo một mục riêng biệt trong lịch sử Design.</p>
                            <div className={styles.confirmActions}>
                                <button onClick={() => setShowConfirm(false)} className={styles.btnSecondary}>Hủy</button>
                                <button onClick={() => { setShowConfirm(false); handleRecord(); }} className={styles.btnPrimary}>Vẫn ghi nhận</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecordDesignModal;
