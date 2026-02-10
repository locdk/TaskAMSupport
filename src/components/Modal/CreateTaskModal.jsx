import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle, ChevronDown, Check, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './CreateTaskModal.module.css';
import { useAppState } from '../../context/AppStateContext';
import TaskToast from '../UI/TaskToast';

const CreateTaskModal = ({ onClose, initialData = {} }) => {
    const { addTask, tasks, taskStatuses, taskPriorities, taskTypes, personnel, attendance, user } = useAppState();
    const navigate = useNavigate();
    const [shopName, setShopName] = useState(initialData.shopName || '');
    const [content, setContent] = useState(initialData.content || '');
    // Default to empty string for placeholder
    const [type, setType] = useState(initialData.type || '');
    const [priority, setPriority] = useState(initialData.priority || taskPriorities[0]?.name || 'Cao');
    // Filter Personnel (checking both parentTeam and team)
    const amList = (personnel || []).filter(p => {
        const pTeam = (p.parentTeam || p.team || '').toLowerCase();
        const hasSchedule = p.workDays && p.workDays.length > 0;
        return pTeam === 'am' && p.role !== 'Manager' && !p.name.includes('Tina Le') && hasSchedule;
    });
    const supportList = (personnel || []).filter(p => {
        const pTeam = (p.parentTeam || p.team || '').toLowerCase();
        const hasSchedule = p.workDays && p.workDays.length > 0;
        return (pTeam === 'mkt support' || pTeam === 'designer') && hasSchedule;
    });

    // Auto-fill AM with current user if they belong to AM team
    const currentUserTeam = (user?.parentTeam || user?.team || '').toLowerCase();
    const isCurrentUserAM = currentUserTeam === 'am';
    const isCurrentUserSupport = currentUserTeam === 'mkt support' || currentUserTeam === 'designer';
    const [selectedAM, setSelectedAM] = useState(initialData.am || (isCurrentUserAM ? user?.name : ''));
    // Auto-fill Support with current user if they belong to MKT Support or Designer team
    const [selectedSupport, setSelectedSupport] = useState(initialData.selectedSupport || (isCurrentUserSupport ? user?.id : ''));

    const selectedAmObj = (personnel || []).find(p => p.name === selectedAM && (p.parentTeam || p.team || '').toLowerCase() === 'am');
    const filteredSupportList = supportList.filter(s => {
        if (!selectedAmObj || !selectedAmObj.team || selectedAmObj.team === 'All Team') return true;
        if (s.team === 'All Team') return true;
        return s.team === selectedAmObj.team;
    });

    useEffect(() => {
        if (selectedSupport && !filteredSupportList.find(s => s.id === selectedSupport)) {
            setSelectedSupport('');
        }
    }, [filteredSupportList, selectedSupport]);

    // Calculate initial effective date based on 6AM shift logic
    const getInitialDate = () => {
        const d = new Date(Date.now() - 6 * 60 * 60 * 1000);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const [dueDate, setDueDate] = useState(getInitialDate());

    // Toast state
    const [toast, setToast] = useState(null); // { message, type }

    const [showWarning, setShowWarning] = useState(false);
    const [duplicateCount, setDuplicateCount] = useState(0);
    const [showConfirm, setShowConfirm] = useState(false);

    // Calendar related state
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());

    // Helper: Check if user is working on a specific YYYY-MM-DD date
    const checkUserAvailability = (user, dateStr) => {
        if (!user || !dateStr) return true;

        const attRecord = (attendance || []).find(a => a.date === dateStr && a.userId === user.id);
        if (attRecord) return attRecord.status === 'Work';

        const [y, m, d] = dateStr.split('-').map(Number);
        const dObj = new Date(y, m - 1, d);
        const dayMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const dayCode = dayMap[dObj.getDay()];
        const workDays = user.workDays || [];

        return workDays.length > 0 ? workDays.includes(dayCode) : false;
    };

    // Helper: Formatter
    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    // Check for duplicate tasks
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

    // Calendar logic
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Adjust for Monday start (0=Mon, ..., 6=Sun)
        const startDay = firstDay === 0 ? 6 : firstDay - 1;

        const days = [];
        for (let i = 0; i < startDay; i++) {
            days.push({ day: null });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, date: new Date(year, month, i) });
        }
        return days;
    };

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const selectDate = (date) => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        setDueDate(dateStr);
        setIsCalendarOpen(false);
    };

    const handleCreate = () => {
        // Find full assignee object if selected
        const assignedUser = personnel.find(p => p.id === selectedSupport) || null;

        // Check Attendance
        if (assignedUser) {
            // Shift logic for "Today"
            const shiftDate = new Date(Date.now() - 6 * 60 * 60 * 1000);
            const shiftDateStr = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, '0')}-${String(shiftDate.getDate()).padStart(2, '0')}`;

            // If user is choosing a different date than Today, we skip the immediate shift check
            const isFuturePlanning = dueDate !== shiftDateStr;

            // 1. Check current shift ONLY if not planning for future
            if (!isFuturePlanning) {
                if (!checkUserAvailability(assignedUser, shiftDateStr)) {
                    setToast({
                        message: `Nhân sự ${assignedUser.name} báo nghỉ (OFF) ngày hôm nay (${shiftDate.getDate()}/${shiftDate.getMonth() + 1}). Vui lòng chọn nhân sự khác hoặc đặt ngày thực hiện khác.`,
                        type: 'error'
                    });
                    return;
                }
            }

            // 2. Always check the selected Due Date
            if (!checkUserAvailability(assignedUser, dueDate)) {
                setToast({
                    message: `Nhân sự ${assignedUser.name} có lịch nghỉ vào ngày ${formatDateDisplay(dueDate)}.`,
                    type: 'error'
                });
                return;
            }
        }

        if (showWarning) {
            setShowConfirm(true);
        } else {
            const [y, m, d] = dueDate.split('-');
            const newTask = {
                id: `TASK-${Date.now()}`,
                title: `${shopName} - ${content.substring(0, 20)}...`,
                name: shopName,
                content: content,
                assignee: assignedUser,
                am: selectedAM,
                support: assignedUser?.name || '',
                status: initialData.forceStatus || taskStatuses[0]?.name || 'Mới',
                priority: priority,
                type: type,
                deadline: `${d}/${m}/${y}`,
                dueDate: dueDate,
                completedAt: initialData.forceStatus === 'Hoàn thành' ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')} ${d}/${m}/${y}` : undefined,
                completedTimestamp: initialData.forceStatus === 'Hoàn thành' ? Date.now() : undefined,
                comments: []
            };
            addTask(newTask);
            onClose();
        }
    };

    const confirmDuplicate = () => {
        const assignedUser = personnel.find(p => p.id === selectedSupport) || null;
        const [y, m, d] = dueDate.split('-');

        const newTask = {
            id: `TASK-${Date.now()}`,
            title: `${shopName} - ${content.substring(0, 20)}...`,
            name: shopName,
            content: content,
            assignee: assignedUser,
            am: selectedAM,
            support: assignedUser?.name || '',
            status: initialData.forceStatus || taskStatuses[0]?.name || 'Mới',
            priority: priority,
            type: type,
            deadline: `${d}/${m}/${y}`,
            dueDate: dueDate,
            completedAt: initialData.forceStatus === 'Hoàn thành' ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')} ${d}/${m}/${y}` : undefined,
            completedTimestamp: initialData.forceStatus === 'Hoàn thành' ? Date.now() : undefined,
            comments: []
        };
        addTask(newTask);
        onClose();
    };

    const handleCreateAndContinue = () => {
        // Find full assignee object if selected
        const assignedUser = personnel.find(p => p.id === selectedSupport) || null;

        // Check Attendance (same validation as handleCreate)
        if (assignedUser) {
            const shiftDate = new Date(Date.now() - 6 * 60 * 60 * 1000);
            const shiftDateStr = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, '0')}-${String(shiftDate.getDate()).padStart(2, '0')}`;
            const isFuturePlanning = dueDate !== shiftDateStr;

            if (!isFuturePlanning) {
                if (!checkUserAvailability(assignedUser, shiftDateStr)) {
                    setToast({
                        message: `Nhân sự ${assignedUser.name} báo nghỉ (OFF) ngày hôm nay (${shiftDate.getDate()}/${shiftDate.getMonth() + 1}). Vui lòng chọn nhân sự khác hoặc đặt ngày thực hiện khác.`,
                        type: 'error'
                    });
                    return;
                }
            }

            if (!checkUserAvailability(assignedUser, dueDate)) {
                setToast({
                    message: `Nhân sự ${assignedUser.name} có lịch nghỉ vào ngày ${formatDateDisplay(dueDate)}.`,
                    type: 'error'
                });
                return;
            }
        }

        // Create task
        const [y, m, d] = dueDate.split('-');
        const newTask = {
            id: `TASK-${Date.now()}`,
            title: `${shopName} - ${content.substring(0, 20)}...`,
            name: shopName,
            content: content,
            assignee: assignedUser,
            am: selectedAM,
            support: assignedUser?.name || '',
            status: initialData.forceStatus || taskStatuses[0]?.name || 'Mới',
            priority: priority,
            type: type,
            deadline: `${d}/${m}/${y}`,
            dueDate: dueDate,
            completedAt: initialData.forceStatus === 'Hoàn thành' ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')} ${d}/${m}/${y}` : undefined,
            completedTimestamp: initialData.forceStatus === 'Hoàn thành' ? Date.now() : undefined,
            comments: []
        };

        addTask(newTask);

        // Show success toast
        setToast({
            message: 'Task đã được tạo thành công!',
            type: 'success'
        });

        // Reset form for next task
        setShopName('');
        setContent('');
        setType('');
        setSelectedSupport('');
        setShowWarning(false);
        setDuplicateCount(0);
        setDueDate(getInitialDate());
        // Keep selectedAM and priority as they often stay the same
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{initialData.forceStatus === 'Hoàn thành' ? 'Ghi nhận Task Design Hoàn thành' : 'Tạo Task Mới'}</h2>
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
                        />
                    </div>

                    {showWarning && duplicateCount > 0 && (
                        <div className={styles.warningBox}>
                            <AlertTriangle size={20} className={styles.warnIcon} />
                            <div className={styles.warnContent}>
                                <strong>Tiệm này hiện đang có {duplicateCount} task đang xử lý</strong>
                                <p>Bạn có chắc chắn muốn tạo thêm task mới cho tiệm này không?</p>
                                <div style={{ marginTop: '4px' }}>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onClose();
                                            navigate(`/tasks?tab=team&search=${encodeURIComponent(shopName)}`);
                                        }}
                                        style={{ color: '#1890ff', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
                                    >
                                        Xem ngay
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label>Nội dung công việc</label>
                        <textarea
                            placeholder="Mô tả chi tiết yêu cầu, deadline, ghi chú..."
                            className={styles.textarea}
                            rows={4}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        ></textarea>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Loại task</label>
                            <div className={styles.selectWrapper}>
                                <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
                                    <option value="" disabled>...</option>
                                    {taskTypes.map(t => (
                                        <option key={t.id} value={t.name}>{t.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className={styles.selectIcon} />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Mức độ ưu tiên</label>
                            <div className={styles.selectWrapper}>
                                <select className={styles.select} value={priority} onChange={(e) => setPriority(e.target.value)}>
                                    {taskPriorities.map(p => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className={styles.selectIcon} />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>AM (Account Manager)</label>
                            <div className={styles.selectWrapper}>
                                <select
                                    className={styles.select}
                                    value={selectedAM}
                                    onChange={(e) => setSelectedAM(e.target.value)}
                                >
                                    <option value="">Chọn AM...</option>
                                    {amList.map(am => (
                                        <option key={am.id} value={am.name}>{am.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className={styles.selectIcon} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Support thực hiện <span className={styles.required}>*</span></label>
                            <div className={styles.selectWrapper}>
                                <select
                                    className={styles.select}
                                    value={selectedSupport}
                                    onChange={(e) => setSelectedSupport(e.target.value)}
                                >
                                    <option value="" disabled>...</option>
                                    {filteredSupportList.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className={styles.selectIcon} />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Ngày thực hiện</label>
                            <div className={styles.datePickerContainer}>
                                <div
                                    className={`${styles.dateDisplay} ${isCalendarOpen ? styles.dateDisplayActive : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsCalendarOpen(!isCalendarOpen);
                                    }}
                                >
                                    <Calendar size={16} className={styles.calendarIcon} />
                                    <span>{formatDateDisplay(dueDate)}</span>
                                    <ChevronDown size={14} className={`${styles.chevron} ${isCalendarOpen ? styles.chevronRotated : ''}`} />
                                </div>

                                {isCalendarOpen && (
                                    <div className={styles.calendarDropdown}>
                                        <div className={styles.calendarHeader}>
                                            <button type="button" onClick={handlePrevMonth} className={styles.calNavBtn}><ChevronLeft size={16} /></button>
                                            <span className={styles.currentMonth}>Tháng {viewDate.getMonth() + 1}, {viewDate.getFullYear()}</span>
                                            <button type="button" onClick={handleNextMonth} className={styles.calNavBtn}><ChevronRight size={16} /></button>
                                        </div>
                                        <div className={styles.calendarGrid}>
                                            {['Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'CN'].map(d => (
                                                <div key={d} className={styles.dayOfWeek}>{d}</div>
                                            ))}
                                            {getDaysInMonth(viewDate).map((d, i) => {
                                                const isToday = d.date && d.date.toDateString() === new Date().toDateString();
                                                const isSelected = d.date && `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, '0')}-${String(d.date.getDate()).padStart(2, '0')}` === dueDate;

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`${styles.dayCell} ${d.day ? styles.dayActive : ''} ${isToday ? styles.isToday : ''} ${isSelected ? styles.isSelected : ''}`}
                                                        onClick={() => d.day && selectDate(d.date)}
                                                    >
                                                        {d.day}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button onClick={onClose} className={styles.btnSecondary}>Hủy</button>
                    <div className={styles.footerRight}>
                        <button onClick={handleCreateAndContinue} className={styles.btnOutline}>Lưu và tạo tiếp</button>
                        <button onClick={handleCreate} className={styles.btnPrimary}>Tạo mới</button>
                    </div>
                </div>
            </div>

            {/* Confirmation Overlay used in Screenshot 3 */}
            {showConfirm && (
                <div className={styles.confirmOverlay}>
                    <div className={styles.confirmModal}>
                        <div className={styles.confirmIcon}>
                            <AlertTriangle size={32} />
                        </div>
                        <h3>Xác nhận tạo trùng</h3>
                        <p>Tiệm này đã có task được tạo trước đó. Bạn có chắc chắn muốn tạo thêm task mới cho tiệm này không?</p>
                        <div className={styles.confirmActions}>
                            <button onClick={() => setShowConfirm(false)} className={styles.btnSecondary}>Hủy</button>
                            <button onClick={confirmDuplicate} className={styles.btnPrimary}>Tiếp tục tạo</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <TaskToast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default CreateTaskModal;
