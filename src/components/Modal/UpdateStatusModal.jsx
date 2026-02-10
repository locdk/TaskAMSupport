import React, { useState } from 'react';
import { X, Calendar, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, Send, Info } from 'lucide-react';
import styles from './UpdateStatusModal.module.css';
import { useAppState } from '../../context/AppStateContext';
import * as firestoreAPI from '../../services/firestoreAPI';

const UpdateStatusModal = ({ onClose, onUpdate, initialDate = new Date() }) => {
    const { attendance, settings, personnel, addAttendanceHistory, user, canDo } = useAppState();
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [status, setStatus] = useState('Work');
    const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [personDropdownOpen, setPersonDropdownOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null); // For Admin/Manager to pick

    const isBoss = canDo('attendance.manage');
    const canApproveLeave = canDo('schedule.approve_leave') || isBoss;
    const currentUser = (personnel || []).find(p => p.email === (user?.email || settings?.userEmail || '')) || personnel[0];
    const targetUser = isBoss && selectedUserId ? personnel.find(p => p.id === selectedUserId) : currentUser;

    const statusOptions = [
        { value: 'Work', label: 'Work (Làm việc)', color: '#1890ff' },
        { value: 'ME', label: 'ME (Nghỉ MAC Energy)', color: '#9254de' },
        { value: 'NP', label: 'NP (Nghỉ phép)', color: '#fa8c16' },
        { value: 'NL', label: 'NL (Nghỉ lễ)', color: '#ff4d4f' },
        { value: 'OFF', label: 'OFF (Nghỉ)', color: '#8c8c8c' }
    ];

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const getFormattedDateISO = (d) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // Derived Logic for Warning
    const dateStr = getFormattedDateISO(selectedDate);
    const dayOfWeek = selectedDate.getDay(); // 0-6
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Mon-Fri
    const isLeaveStatus = ['OFF', 'NP', 'ME', 'NL'].includes(status);

    const leaveCount = attendance.filter(a =>
        a.date === dateStr &&
        (['OFF', 'NP', 'ME', 'NL'].includes(a.status) || (a.status || '').startsWith('PENDING_')) &&
        a.userId !== targetUser?.id
    ).length;

    const showWarning = isLeaveStatus && isWeekday && leaveCount >= 5;

    const existingRecord = attendance.find(a => a.date === dateStr && a.userId === targetUser?.id);
    const existingStatusLabel = statusOptions.find(opt => opt.value === existingRecord?.status)?.label
        || (existingRecord?.status?.startsWith('PENDING_') ? 'Chờ duyệt ' + existingRecord.status.split('_')[1] : null)
        || (existingRecord?.status === 'working' ? 'Đang làm việc' : null)
        || (existingRecord?.status === 'completed' ? 'Đã hoàn thành' : null)
        || existingRecord?.status;

    const handleRequestApproval = async () => {
        const confirmMsg = `Bạn có chắc chắn muốn gửi yêu cầu xin nghỉ ${status} vào ngày ${getFormattedDate()} (vượt quá giới hạn) tới Quản lý không?`;
        if (!window.confirm(confirmMsg)) return;

        // 1. Send Notification to users with approval permission
        // Find roles that have schedule.approve_leave or attendance.manage permission
        const approverRoleNames = (settings?.roles || [])
            .filter(r => Array.isArray(r.permissions) && (r.permissions.includes('schedule.approve_leave') || r.permissions.includes('attendance.manage')))
            .map(r => r.name);
        const approvers = personnel.filter(p => approverRoleNames.includes(p.role) && p.id !== targetUser.id);
        const notifPromises = approvers.map(mgr =>
            firestoreAPI.addNotification({
                userId: mgr.id,
                title: 'Yêu cầu duyệt nghỉ vượt giới hạn',
                message: `${targetUser.name} xin nghỉ ${status} ngày ${getFormattedDate()} (Đã có ${leaveCount} người nghỉ).`,
                type: 'approval_request',
                link: '/schedule', // Link to schedule to approve
                createdAt: new Date().toISOString(),
                read: false,
                metadata: {
                    requesterId: targetUser.id,
                    date: dateStr,
                    requestedStatus: status
                }
            })
        );
        await Promise.all(notifPromises);

        // 2. Create "PENDING" attendance record
        // We use a prefix "PENDING_" so it doesn't count as real OFF yet
        // Status: PENDING_OFF, PENDING_NP ...
        const pendingStatus = `PENDING_${status}`;

        onUpdate({
            date: dateStr,
            status: pendingStatus, // Store as pending
            userId: targetUser.id,
            userName: targetUser.name
        });

        alert("Yêu cầu của bạn đã được gửi thành công!");
        onClose();
    };

    const handleUpdate = () => {
        if (showWarning) {
            if (canApproveLeave) {
                if (!window.confirm(`CẢNH BÁO: Đã có ${leaveCount} nhân sự nghỉ hôm nay. Bạn có chắc chắn muốn duyệt thêm?`)) {
                    return;
                }
            } else {
                // Should not happen via this button, but safety check
                return;
            }
        }

        if (targetUser) {
            const existingRecord = attendance.find(a => a.date === dateStr && a.userId === targetUser.id);
            const oldStatus = existingRecord?.status || 'Work';

            // Only log if status changes
            if (oldStatus !== status) {
                addAttendanceHistory({
                    userId: targetUser.id,
                    userName: targetUser.name,
                    oldStatus: oldStatus,
                    newStatus: status,
                    date: dateStr,
                    action: 'update'
                });
            }
        }

        // Auto Check-in Logic: If registering "Work" for Today + Self -> Start session immediately
        let finalStatus = status;
        let checkInTime = undefined;

        const todayStr = getFormattedDateISO(new Date());
        const isToday = dateStr === todayStr;
        const isSelf = currentUser && targetUser && (currentUser.id === targetUser.id);

        if (status === 'Work' && isToday && isSelf) {
            finalStatus = 'working';
            checkInTime = new Date().toISOString();
        }

        onUpdate({
            date: dateStr,
            status: finalStatus,
            userId: targetUser.id,
            userName: targetUser.name,
            ...(checkInTime ? { checkInTime } : {})
        });
        onClose();
    };

    // Calendar generation logic
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday

        // Adjust for Monday start (0=Mon, ..., 6=Sun)
        const startDay = firstDay === 0 ? 6 : firstDay - 1;

        const result = [];
        for (let i = 0; i < startDay; i++) {
            result.push({ day: null }); // Filler
        }
        for (let i = 1; i <= days; i++) {
            result.push({ day: i, date: new Date(year, month, i) });
        }
        return result;
    };

    const days = getDaysInMonth(currentMonth);

    const isSelected = (d) => {
        return d.date &&
            d.date.getDate() === selectedDate.getDate() &&
            d.date.getMonth() === selectedDate.getMonth() &&
            d.date.getFullYear() === selectedDate.getFullYear();
    };

    // Helper to get formatted date string
    const getFormattedDate = () => {
        return `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;
    };

    const selectedOption = statusOptions.find(o => o.value === status);

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Cập nhật Trạng thái Làm việc</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.body}>
                    {/* Left Column */}
                    <div className={styles.formSection}>
                        {isBoss && (
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Chọn Nhân sự</label>
                                <div className={styles.customSelectWrapper} onClick={() => setPersonDropdownOpen(!personDropdownOpen)}>
                                    <div className={styles.customSelectAnchor}>
                                        {targetUser?.avatar && <img src={targetUser.avatar} className={styles.itemAvatar} alt="" />}
                                        {targetUser?.name || 'Chọn nhân sự...'}
                                        <ChevronDown size={16} className={`${styles.selectArrow} ${personDropdownOpen ? styles.arrowRotate : ''}`} />
                                    </div>
                                    {personDropdownOpen && (
                                        <div className={styles.dropdownList} style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {personnel
                                                .filter(p => {
                                                    if (!settings?.enableAmAttendance && p.parentTeam === 'AM') return false;
                                                    return p.parentTeam === 'MKT Support' || p.parentTeam === 'AM';
                                                })
                                                .map(p => (
                                                    <div
                                                        key={p.id}
                                                        className={styles.dropdownItem}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedUserId(p.id);
                                                            setPersonDropdownOpen(false);
                                                        }}
                                                    >
                                                        {p.avatar && <img src={p.avatar} className={styles.itemAvatar} alt="" />}
                                                        {p.name}
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Chọn ngày</label>
                            <div className={styles.inputWrapper}>
                                <Calendar size={16} className={styles.inputIcon} />
                                <input
                                    type="text"
                                    value={getFormattedDate()}
                                    readOnly
                                    className={styles.input}
                                />
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Trạng thái</label>

                            <div className={styles.customSelectWrapper} onClick={() => setDropdownOpen(!dropdownOpen)}>
                                <div className={`${styles.customSelectAnchor}`} style={{
                                    backgroundColor: selectedOption?.color + '20',
                                    color: selectedOption?.color,
                                    borderColor: dropdownOpen ? selectedOption?.color : 'transparent'
                                }}>
                                    <span className={styles.badgeDot} style={{ backgroundColor: selectedOption?.color }}></span>
                                    {selectedOption?.label}
                                    <ChevronDown size={16} className={`${styles.selectArrow} ${dropdownOpen ? styles.arrowRotate : ''}`} />
                                </div>

                                {dropdownOpen && (
                                    <div className={styles.dropdownList}>
                                        {statusOptions.map(opt => (
                                            <div
                                                key={opt.value}
                                                className={styles.dropdownItem}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setStatus(opt.value);
                                                    setDropdownOpen(false);
                                                }}
                                            >
                                                <span className={styles.itemDot} style={{ backgroundColor: opt.color }}></span>
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {existingRecord && (
                            <div className={styles.existingNotify}>
                                <Info size={16} color="#1890ff" />
                                <span>Bạn đã có lịch <strong>{existingStatusLabel}</strong> ngày này rồi.</span>
                            </div>
                        )}

                        <div className={styles.noteBox}>
                            <div className={styles.noteTitle}>Ghi chú trạng thái:</div>
                            <div className={styles.legendGrid}>
                                {statusOptions.map(opt => (
                                    <div key={opt.value} className={styles.legendItem}>
                                        <div className={styles.dot} style={{ backgroundColor: opt.color }}></div>
                                        <span>{opt.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Warning Box */}
                        {showWarning && (
                            <div className={styles.warningBox}>
                                <AlertTriangle size={18} className={styles.warningIcon} color="#faad14" />
                                <div className={styles.warningText}>
                                    <span className={styles.warningHighlight}>Đã đạt giới hạn nghỉ (5 người).</span><br />
                                    {canApproveLeave
                                        ? "Bạn có thể phớt lờ giới hạn và duyệt ngoại lệ cho trường hợp này."
                                        : "Vui lòng 'Gửi yêu cầu duyệt' tới Manager để xem xét trường hợp này."
                                    }
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className={styles.calendarSection}>
                        <div className={styles.calHeader}>
                            <span className={styles.calTitle}>
                                Tháng {currentMonth.getMonth() + 1} {currentMonth.getFullYear()}
                            </span>
                            <div className={styles.calNav}>
                                <button onClick={handlePrevMonth} className={styles.navBtn}><ChevronLeft size={16} /></button>
                                <button onClick={handleNextMonth} className={styles.navBtn}><ChevronRight size={16} /></button>
                            </div>
                        </div>
                        <div className={styles.calGrid}>
                            {['HAI', 'BA', 'TƯ', 'NĂM', 'SÁU', 'BẢY', 'CN'].map(d => (
                                <div key={d} className={styles.dayName}>{d}</div>
                            ))}
                            {days.map((d, i) => {
                                const isWeekend = d.date && (d.date.getDay() === 0 || d.date.getDay() === 6);
                                return (
                                    <div
                                        key={i}
                                        className={`${styles.dayCell} ${isSelected(d) ? styles.daySelected : ''} ${isWeekend ? styles.dayWeekend : ''}`}
                                        onClick={() => d.day && setSelectedDate(d.date)}
                                        style={{ visibility: d.day ? 'visible' : 'hidden' }}
                                    >
                                        {d.day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    {showWarning && !canApproveLeave ? (
                        <>
                            <button onClick={onClose} className={styles.btnCancel}>
                                Chọn ngày khác
                            </button>
                            <button onClick={handleRequestApproval} className={styles.btnUpdate} style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}>
                                <Send size={14} />
                                Gửi yêu cầu duyệt
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={onClose} className={styles.btnCancel}>Hủy</button>
                            {showWarning ? (
                                <button onClick={handleUpdate} className={styles.btnUpdate} style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}>
                                    <AlertTriangle size={14} />
                                    Gửi Manager xét duyệt
                                </button>
                            ) : (
                                <button onClick={handleUpdate} className={styles.btnUpdate}>
                                    <RefreshCw size={14} />
                                    Cập nhật trạng thái
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpdateStatusModal;
