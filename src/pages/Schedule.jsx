import React, { useState, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Check,
    AlertCircle
} from 'lucide-react';
import styles from './Schedule.module.css';

import { useAppState } from '../context/AppStateContext';
import DayScheduleModal from '../components/Modal/DayScheduleModal';
import UpdateStatusModal from '../components/Modal/UpdateStatusModal';

const Schedule = () => {
    const { personnel, attendance, updateAttendance, settings, user, shiftDefinitions = [], canDo } = useAppState();

    const canView = canDo('schedule.view') || canDo('schedule.manage') || user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'Quản lý';

    if (!canView) {
        return (
            <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <AlertCircle size={64} color="#ff4d4f" style={{ marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Truy cập bị từ chối</h3>
                    <p style={{ color: '#666' }}>Bạn không có quyền xem Lịch làm việc.</p>
                </div>
            </div>
        );
    }

    // Helper to get default shift name

    // Helper to get default shift name
    const getDefaultShift = () => {
        if (shiftDefinitions.length > 0) {
            return shiftDefinitions[0].name;
        }
        return 'Ca 1';
    };
    const isAdmin = user?.role === 'Admin';
    const isAmAdmin = isAdmin && user?.parentTeam === 'AM';
    const isAmEmployee = user?.parentTeam === 'AM' && user?.role === 'Nhân viên';
    const [selection, setSelection] = useState([1, 2, 4]); // Selected IDs
    const [showModal, setShowModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const todayDisplay = useMemo(() => {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }, []);

    const calendarHeader = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];



    const teamPersonnel = React.useMemo(() => {
        return (personnel || []).filter(p => {
            const isMktSupport = p.parentTeam === 'MKT Support';
            // Only include if they are MKT Support AND have work shifts configured
            const hasWorkShifts = p.workShifts && Object.keys(p.workShifts).length > 0;
            return isMktSupport && hasWorkShifts;
        });
    }, [personnel]);

    const workingTodayPersonnel = React.useMemo(() => {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const dayMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const currentDayCode = dayMap[today.getDay()];

        return teamPersonnel.filter(p => {
            // Work status today filter
            const record = (attendance || []).find(a => a.date === todayStr && a.userId === p.id);
            if (record) {
                return ['Work', 'working', 'completed'].includes(record.status);
            }

            // Fallback to workDays if no attendance record
            const workDays = p.workDays || [];
            return workDays.includes(currentDayCode);
        });
    }, [teamPersonnel, attendance]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Adjust for Monday start (0=Mon, ..., 6=Sun)
        const startDay = firstDay === 0 ? 6 : firstDay - 1;

        const prevMonthDays = new Date(year, month, 0).getDate();

        const days = [];

        // Prev month filler
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({
                date: prevMonthDays - i,
                fullDate: new Date(year, month - 1, prevMonthDays - i),
                prev: true
            });
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const isToday = new Date().toDateString() === d.toDateString();
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;

            const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            const dayAttendance = (attendance || []).filter(a => a.date === dayStr);

            // AUTO-SYNC: Add default "Work" status for team members if no record exists
            // Map JS getDay() to T2-CN
            const dayMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            const currentDayCode = dayMap[d.getDay()];

            teamPersonnel.forEach(member => {
                const hasRecord = dayAttendance.some(a => a.userId === member.id);
                if (!hasRecord) {
                    // Check if member works on this day with a specific shift
                    const workShifts = member.workShifts || {};
                    const specificShift = workShifts[currentDayCode];

                    if (specificShift) {
                        dayAttendance.push({
                            id: `default-${dayStr}-${member.id}`,
                            userId: member.id,
                            userName: member.name,
                            status: 'Work',
                            workShift: specificShift,
                            date: dayStr,
                            isDefault: true
                        });
                    } else {
                        // If no shift defined for this day and no record, they are OFF
                        dayAttendance.push({
                            id: `off-${dayStr}-${member.id}`,
                            userId: member.id,
                            userName: member.name,
                            status: 'OFF',
                            date: dayStr,
                            isDefault: true
                        });
                    }
                }
            });

            // Enrich attendance with full personnel data and filter to only current team members
            // DEDUPLICATION: Ensure one record per user per day
            const uniqueAttendanceMap = new Map();

            dayAttendance.forEach(a => {
                if (teamPersonnel.some(tp => tp.id === a.userId)) {
                    // If duplicate, last one wins (or we could prioritize 'Work' status)
                    // Given we pushed defaults later, we might want to prioritize existing DB records?
                    // Actually, 'dayAttendance' has DB records first, then defaults pushed.
                    // If DB has duplicates, we keep the last one encountered or specific logic.
                    // Simple map set handles "last one wins" or "first one wins" depending on checking.

                    if (!uniqueAttendanceMap.has(a.userId)) {
                        uniqueAttendanceMap.set(a.userId, a);
                    } else {
                        // If we already have a record, determine which one is "better" to keep
                        const existing = uniqueAttendanceMap.get(a.userId);
                        const isExistingVirtual = (existing.id || '').startsWith('default-') || (existing.id || '').startsWith('off-');
                        const isCurrentVirtual = (a.id || '').startsWith('default-') || (a.id || '').startsWith('off-');

                        if (isExistingVirtual && !isCurrentVirtual) {
                            uniqueAttendanceMap.set(a.userId, a); // Replace virtual with real
                        } else if (!isExistingVirtual && !isCurrentVirtual) {
                            // Both are real! Pick the one with more data (e.g. checkInTime or working status)
                            const existingHasData = !!(existing.checkInTime || existing.lastActive);
                            const currentHasData = !!(a.checkInTime || a.lastActive);

                            if (!existingHasData && currentHasData) {
                                uniqueAttendanceMap.set(a.userId, a);
                            } else if (existing.status === 'Work' && a.status === 'working') {
                                uniqueAttendanceMap.set(a.userId, a); // 'working' is more specific than just 'Work'
                            }
                        }
                    }
                }
            });

            const detailedAttendance = Array.from(uniqueAttendanceMap.values())
                .filter(a => {
                    // Only include if we can find the person in teamPersonnel
                    const person = teamPersonnel.find(p => p.id === a.userId);
                    return person !== undefined;
                })
                .map(a => {
                    const person = teamPersonnel.find(p => p.id === a.userId);
                    const jobTitle = (person?.name === 'Vivian') ? 'Graphic Designer' : 'Marketing Support';

                    // Priority: Record's shift > Member's day-specific shift > Member's primary shift > default
                    const finalShift = a.workShift || (person?.workShifts?.[currentDayCode]) || person?.workShift || getDefaultShift();

                    return {
                        ...a,
                        role: jobTitle,
                        avatar: person?.avatar,
                        workShift: finalShift
                    };
                });

            // Summary counters
            const workCount = detailedAttendance.filter(a => ['Work', 'working', 'completed'].includes(a.status)).length;
            const offCount = detailedAttendance.filter(a => ['OFF', 'NP', 'ME', 'NL'].includes(a.status)).length;
            const pendingCount = detailedAttendance.filter(a => (a.status || '').startsWith('PENDING_')).length;

            days.push({
                date: i,
                fullDate: d,
                current: true,
                isToday,
                isWeekend,
                weekendText: isWeekend ? 'Cuối tuần' : '',
                details: detailedAttendance,
                counts: { work: workCount, off: offCount, pending: pendingCount }
            });
        }

        // Next month filler
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                date: i,
                fullDate: new Date(year, month + 1, i),
                next: true
            });
        }

        return days;
    };

    const days = getDaysInMonth(currentDate);

    const minDate = new Date(2026, 0, 1);

    const handlePrevMonth = () => {
        const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        if (prevMonth >= minDate) {
            setCurrentDate(prevMonth);
        }
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        const today = new Date();
        if (today < minDate) {
            setCurrentDate(minDate);
        } else {
            setCurrentDate(today);
        }
    };

    const toggleSelection = (id) => {
        if (selection.includes(id)) {
            setSelection(selection.filter(item => item !== id));
        } else {
            setSelection([...selection, id]);
        }
    };

    const isPrevDisabled = currentDate.getFullYear() === 2026 && currentDate.getMonth() === 0;

    const handleDayClick = (day) => {
        if (day.prev || day.next) return;

        // Show modal if we have details or even if empty (to verify empty state)
        // Check if details exist to be safe, but usually array is initialized
        if (day.details) {
            setSelectedDay(day);
            setShowModal(true);
        }
    };

    const handleUpdateStatus = async (record) => {
        // Record should contain { date, status, userId, userName }
        await updateAttendance(record);
    };

    const getTagClass = (type) => {
        switch (type) {
            case 'Work': return styles.tagWork;
            case 'NL': return styles.tagNL;
            case 'NP': return styles.tagNP;
            case 'ME': return styles.tagME;
            case 'OFF': return styles.tagOFF;
            default: return '';
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <div className={styles.monthNav}>
                        <button
                            className={styles.navBtn}
                            onClick={handlePrevMonth}
                            disabled={isPrevDisabled}
                            style={{ opacity: isPrevDisabled ? 0.5 : 1, cursor: isPrevDisabled ? 'not-allowed' : 'pointer' }}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <h1 className={styles.title}>Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}</h1>
                        <button className={styles.navBtn} onClick={handleNextMonth}><ChevronRight size={24} /></button>
                    </div>
                    <p className={styles.subtitle}>Theo dõi trạng thái làm việc và nghỉ phép của nhân sự</p>
                </div>
                <div className={styles.headerActions}>
                    {(canDo('schedule.register') || canDo('schedule.manage')) && (
                        <button className={styles.regLeaveBtn} onClick={() => setShowUpdateModal(true)}>
                            <Plus size={18} />
                            <span>Đăng ký lịch làm / Off</span>
                        </button>
                    )}
                </div>
            </header>

            <div className={styles.pageBody}>
                <div className={styles.calendarWrapper}>
                    <div className={styles.calendarHeader}>
                        {calendarHeader.map(day => (
                            <div key={day} className={styles.dayName}>{day}</div>
                        ))}
                    </div>
                    <div className={styles.calendarGrid}>
                        {days.map((day, idx) => (
                            <div
                                key={idx}
                                className={`${styles.calendarCell} ${day.isWeekend ? styles.weekend : ''} ${day.prev || day.next ? styles.otherMonth : ''}`}
                                onClick={() => handleDayClick(day)}
                            >
                                <span className={`${styles.dateNum} ${day.isToday ? styles.today : ''}`}>
                                    {day.date}
                                </span>
                                {day.isWeekend && <div className={styles.weekendText}>{day.weekendText}</div>}

                                {/* Compact Content */}
                                {day.current && (
                                    <div className={styles.compactStats}>
                                        {day.counts.work > 0 && (
                                            <div className={`${styles.statPill} ${styles.statWork}`}>
                                                <div className={styles.dotWork}></div>
                                                <span>{day.counts.work} Work</span>
                                            </div>
                                        )}
                                        {day.counts.off > 0 && (
                                            <div className={`${styles.statPill} ${styles.statOff}`}>
                                                <div className={styles.dotOff}></div>
                                                <span>{day.counts.off} Off</span>
                                            </div>
                                        )}
                                        {day.counts.pending > 0 && (
                                            <div className={`${styles.statPill} ${styles.statPending}`} style={{ backgroundColor: 'rgba(250, 173, 20, 0.15)', color: '#faad14', border: '1px solid rgba(250, 140, 22, 0.2)' }}>
                                                <div className={styles.dotPending} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#faad14' }}></div>
                                                <span>{day.counts.pending} Chờ duyệt</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.rightPanel}>
                    <div className={styles.panelSection}>
                        <div className={styles.panelTitle}>
                            <span>Support làm việc hôm nay</span>
                            <span className={styles.personCount}>{workingTodayPersonnel.length} người</span>
                        </div>
                        <div className={styles.personnelList}>
                            {workingTodayPersonnel.map(p => {
                                const today = new Date();
                                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                const record = (attendance || []).find(a => a.date === todayStr && a.userId === p.id);
                                // Always true in this filtered list, but kept for consistency if logic changes
                                const isWorking = true;

                                return (
                                    <div key={p.id} className={styles.personItem} onClick={(e) => { e.stopPropagation(); toggleSelection(p.id); }}>
                                        <div className={`${styles.checkbox} ${selection.includes(p.id) ? styles.checkboxChecked : ''}`}>
                                            {selection.includes(p.id) && <Check size={12} color="#fff" />}
                                        </div>
                                        <div className={styles.avatarWrapper}>
                                            <img
                                                src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'User')}&background=random`}
                                                alt={p.name}
                                                className={styles.personAvatar}
                                            />
                                            <div className={`${styles.statusDot} ${styles.dotWork}`}></div>
                                        </div>
                                        <div className={styles.personInfo}>
                                            <span className={styles.personName}>{p.name}</span>
                                            <span className={styles.personStatus}>Đang làm</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={styles.panelSection}>
                        <div className={styles.panelTitle}>CHÚ THÍCH TRẠNG THÁI</div>
                        <div className={styles.legend}>
                            <div className={styles.legendItem}>
                                <div className={`${styles.legendTag} ${styles.tagWork}`}>Work</div>
                                <span className={styles.legendText}>Đang làm việc</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={`${styles.legendTag} ${styles.tagOFF}`}>OFF</div>
                                <span className={styles.legendText}>Nghỉ (Không lương)</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={`${styles.legendTag} ${styles.tagNP}`}>NP</div>
                                <span className={styles.legendText}>Nghỉ phép năm</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={`${styles.legendTag} ${styles.tagME}`}>ME</div>
                                <span className={styles.legendText}>Nghỉ MAC Energy</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={`${styles.legendTag} ${styles.tagNL}`}>NL</div>
                                <span className={styles.legendText}>Nghỉ lễ</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={`${styles.legendTag}`} style={{ backgroundColor: 'rgba(250, 173, 20, 0.2)', color: '#faad14', width: '36px', padding: '2px 4px', borderRadius: '4px', fontSize: '9px', fontWeight: '700', textAlign: 'center' }}>WAIT</div>
                                <span className={styles.legendText}>Chờ duyệt (Quota)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Day Detail Modal */}
            {showModal && selectedDay && (
                <DayScheduleModal
                    date={selectedDay.fullDate}
                    data={days.find(d => d.current && d.fullDate.toDateString() === selectedDay.fullDate.toDateString())?.details || []}
                    onClose={() => setShowModal(false)}
                    onUpdateItem={handleUpdateStatus}
                    userRole={(canDo('schedule.manage') || canDo('attendance.manage') || canDo('schedule.approve_leave') || user?.role === 'Manager' || user?.role === 'Admin') ? 'Manager' : ((isAmAdmin || isAmEmployee) ? 'Nhân viên' : (user?.role || settings?.userRole))}
                    shiftDefinitions={shiftDefinitions}
                />
            )}

            {showUpdateModal && (
                <UpdateStatusModal
                    onClose={() => setShowUpdateModal(false)}
                    onUpdate={handleUpdateStatus}
                />
            )}
        </div>
    );
};

export default Schedule;
