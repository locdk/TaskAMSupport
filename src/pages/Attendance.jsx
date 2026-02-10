import React, { useState, useEffect, useMemo } from 'react';
import { useAppState } from '../context/AppStateContext';
import * as api from '../services/firestoreAPI';
import styles from './Attendance.module.css';
import { Clock, Calendar, LogIn, LogOut, Coffee, Timer } from 'lucide-react';

const getShiftDetails = (shiftCode, dateStr, userName, shiftDefinitions = [], actualTime = null) => {
    if (!shiftCode || shiftCode === '-' || shiftCode === 'Nghỉ') return null;

    // Find shift in dynamic definitions
    const shiftDef = shiftDefinitions.find(s => s.name === shiftCode);
    let times = shiftDef ? { start: shiftDef.startTime, end: shiftDef.endTime } : null;

    // Special case for Jerry on S3 (Keeping as requested if not in DB yet)
    if (shiftCode.startsWith('S3') && userName === 'Jerry') {
        times = { start: '22:00', end: '09:00' };
    }

    if (!times) return null;

    const [startH, startM] = times.start.split(':').map(Number);
    const [endH, endM] = times.end.split(':').map(Number);

    const startTime = new Date(dateStr);
    startTime.setHours(startH, startM, 0, 0);

    // 12-hour threshold logic for night shifts:
    // If shiftStart (based on record date) is > 12h in future compared to actual check-in,
    // it's a late check-in for yesterday's night shift.
    if (actualTime) {
        const checkIn = new Date(actualTime);
        if (startTime.getTime() - checkIn.getTime() > 12 * 60 * 60 * 1000) {
            startTime.setDate(startTime.getDate() - 1);
        }
    }

    const endTime = new Date(startTime);
    endTime.setHours(endH, endM, 0, 0);
    // If End hour < Start hour, it ends next calendar day relative to its own start
    if (endH < startH || (endH === startH && endM < startM) || (endH < 12 && startH > 18)) {
        endTime.setDate(endTime.getDate() + 1);
    }

    return { start: startTime, end: endTime };
};

const ColoredTime = ({ timeStr, type, shiftDetails }) => {
    if (!timeStr) return <span>--:--</span>;
    if (!shiftDetails) return <span>{new Date(timeStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>;

    const time = new Date(timeStr);
    let color = 'inherit';

    if (type === 'checkIn') {
        // Late if Actual > Scheduled (allowing 5 mins grace could be nice but strict for now)
        color = time <= shiftDetails.start ? '#4caf50' : '#f44336';
    } else if (type === 'checkOut') {
        // Early if Actual < Scheduled
        color = time >= shiftDetails.end ? '#4caf50' : '#f44336';
    }

    return (
        <span style={{ color, fontWeight: 'bold' }}>
            {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </span>
    );
};

const Attendance = () => {
    const { user, personnel, shiftDefinitions = [] } = useAppState();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [todayRecord, setTodayRecord] = useState(null);
    const [allRecords, setAllRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [historyFilter, setHistoryFilter] = useState('today'); // 'today', 'm0', 'm1', 'm2'

    // Update real-time clock
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch attendance data
    const fetchAttendance = async () => {
        try {
            const records = await api.getAttendance();
            const todayStr = new Date().toISOString().split('T')[0];

            // Filter today's records
            // Filter for current user's today record for the status card
            const todays = records.filter(r => r.date === todayStr);
            setAllRecords(records); // Set ALL records for history list

            // Find current user's record
            if (user) {
                const myRecord = todays.find(r => r.userId === user.id);
                setTodayRecord(myRecord || null);
            }
        } catch (err) {
            console.error('Failed to fetch attendance:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [user]);

    // Calculate elapsed time if checked in
    useEffect(() => {
        let interval;
        if (todayRecord && todayRecord.checkInTime && !todayRecord.checkOutTime) {
            interval = setInterval(() => {
                const start = new Date(todayRecord.checkInTime).getTime();
                const now = new Date().getTime();
                const diff = now - start;

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setElapsedTime(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            }, 1000);
        } else if (todayRecord && todayRecord.duration) {
            setElapsedTime(todayRecord.duration); // Show final duration if checked out
        } else {
            setElapsedTime('00:00:00');
        }
        return () => clearInterval(interval);
    }, [todayRecord]);

    const handleCheckIn = async () => {
        if (!user) return;

        const now = new Date();

        // ------------------------------------------------------------------
        // VALIDATION: Check Schedule
        // ------------------------------------------------------------------
        const dateStr = now.toISOString().split('T')[0];

        const todayRecordForCheck = allRecords.find(r => r.userId === user.id && r.date === dateStr);

        if (todayRecordForCheck) {
            // CASE 1: Record exists
            if (['OFF', 'NP', 'ME', 'NL', 'Nghỉ'].includes(todayRecordForCheck.status)) {
                alert(`Bạn đã đăng ký nghỉ (${todayRecordForCheck.status}) ngày hôm nay. Không thể chấm công.`);
                return;
            }
            // If status is 'Work', 'working', 'completed' -> It's a valid scheduled day (override or normal).
            // Proceed to check-in.
        } else {
            // CASE 2: No record -> Check Default Weekly Schedule
            // Priority: Check today's specific record (from manual registration/leave)
            if (todayRecord) {
                if (todayRecord.status === 'Work') {
                    // Explicitly registered to work -> Allow
                } else if (['OFF', 'NP', 'ME', 'NL', 'Nghỉ'].includes(todayRecord.status)) {
                    alert(`Bạn đã đăng ký nghỉ (${todayRecord.status}) hôm nay. Không thể Check-in.`);
                    return;
                }
            } else {
                // Should only check fixed schedule if NO specific record exists
                const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                const currentDay = days[now.getDay()];
                const shiftCode = user.workShifts?.[currentDay];

                // Strict check: Must have a valid shift code, not '-' or 'Nghỉ'
                if (!shiftCode || shiftCode === '-' || shiftCode === 'Nghỉ') {
                    alert('Bạn không có ca làm việc đăng ký trong lịch trình hôm nay. Vui lòng liên hệ quản lý nếu có sự thay đổi.');
                    return;
                }
            }
        }
        // ------------------------------------------------------------------

        // ------------------------------------------------------------------
        // VALIDATION: 90-minute check-in window
        // ------------------------------------------------------------------
        const CHECK_IN_WINDOW = 90; // minutes
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const currentDay = days[now.getDay()];
        let shiftCodeForWindow = user.workShifts?.[currentDay];

        // Night shift correction: before 9 AM, check yesterday's shift
        if (now.getHours() < 9 && user.workShifts) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yDayCode = days[yesterday.getDay()];
            const yShift = user.workShifts[yDayCode];
            if (yShift && yShift !== '-' && yShift !== 'Nghỉ') {
                shiftCodeForWindow = yShift;
            }
        }

        if (shiftCodeForWindow && shiftCodeForWindow !== '-' && shiftCodeForWindow !== 'Nghỉ') {
            // Find shift start time from definitions
            const shiftDef = shiftDefinitions.find(s => s.name === shiftCodeForWindow);
            if (shiftDef?.startTime) {
                const [sH, sM] = shiftDef.startTime.split(':').map(Number);
                const shiftStart = new Date(now);
                shiftStart.setHours(sH, sM, 0, 0);

                // Night shift correction for window calculation
                if (shiftStart.getTime() - now.getTime() > 12 * 60 * 60 * 1000) {
                    shiftStart.setDate(shiftStart.getDate() - 1);
                }
                if (now.getTime() - shiftStart.getTime() > 12 * 60 * 60 * 1000) {
                    shiftStart.setDate(shiftStart.getDate() + 1);
                }

                const diffMinutes = (now.getTime() - shiftStart.getTime()) / (1000 * 60);

                if (diffMinutes < -CHECK_IN_WINDOW || diffMinutes > CHECK_IN_WINDOW) {
                    const windowStart = new Date(shiftStart.getTime() - CHECK_IN_WINDOW * 60 * 1000);
                    const windowEnd = new Date(shiftStart.getTime() + CHECK_IN_WINDOW * 60 * 1000);
                    const fmtTime = (d) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                    alert(`Chưa đến khung giờ check-in!\n\nCa: ${shiftCodeForWindow} (${shiftDef.startTime})\nKhung giờ cho phép: ${fmtTime(windowStart)} - ${fmtTime(windowEnd)}`);
                    return;
                }
            }
        }
        // ------------------------------------------------------------------


        const record = {
            id: `ATT-${Date.now()}`,
            userId: user.id,
            userName: user.name,
            date: now.toISOString().split('T')[0],
            checkInTime: now.toISOString(),
            checkOutTime: null,
            duration: null,
            status: 'working',
            lastActive: now.toISOString()
        };

        try {
            const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString('en-GB');
            await api.addAttendance(record);
            await api.addAttendanceHistory({
                id: `HIST-${Date.now()}`,
                userId: user.id,
                userName: user.name,
                action: 'CHECK_IN',
                timestamp: now.toISOString(),
                details: `Vào ca làm lúc ${timeString}`
            });
            fetchAttendance();
        } catch (err) {
            alert('Lỗi điểm danh: ' + err.message);
        }
    };

    const handleCheckOut = async () => {
        if (!todayRecord) return;

        const now = new Date();
        const checkIn = todayRecord.checkInTime ? new Date(todayRecord.checkInTime) : null;

        let durationStr = '--:--:--';
        if (checkIn && !isNaN(checkIn.getTime())) {
            const diff = now.getTime() - checkIn.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            durationStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        try {
            const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString('en-GB');
            await api.updateAttendance(todayRecord.id, {
                checkOutTime: now.toISOString(),
                duration: durationStr,
                status: 'completed',
                lastActive: now.toISOString()
            });
            await api.addAttendanceHistory({
                id: `HIST-${Date.now()}`,
                userId: user.id,
                userName: user.name,
                action: 'CHECK_OUT',
                timestamp: now.toISOString(),
                details: `Tan ca làm lúc ${timeString}`
            });
            fetchAttendance();
        } catch (err) {
            alert('Lỗi check-out: ' + err.message);
        }
    };

    // Get current user's shift for today
    const getTodayShift = () => {
        if (!user || !user.workShifts) return 'Chưa đăng ký';
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const currentDay = days[new Date().getDay()];
        return user.workShifts[currentDay] || 'Nghỉ';
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    // --- STATISTICS CALCULATIONS ---
    const durationToSeconds = (duration) => {
        if (!duration) return 0;
        const [h, m, s] = duration.split(':').map(Number);
        return (h * 3600) + (m * 60) + (s || 0);
    };

    const secondsToDisplay = (totalSec) => {
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const stats = useMemo(() => {
        if (!user || allRecords.length === 0) return { week: '0h 0m', month: '0h 0m', onTimeRate: 0 };

        const myRecords = allRecords.filter(r => r.userId === user.id && r.status === 'completed');
        const now = new Date();

        // Start of week (Monday)
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        // Start of month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Start of last month
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const weekSec = myRecords
            .filter(r => new Date(r.date) >= startOfWeek)
            .reduce((acc, r) => acc + durationToSeconds(r.duration), 0);

        const monthSec = myRecords
            .filter(r => new Date(r.date) >= startOfMonth)
            .reduce((acc, r) => acc + durationToSeconds(r.duration), 0);

        const lastMonthSec = myRecords
            .filter(r => {
                const rDate = new Date(r.date);
                return rDate >= startOfLastMonth && rDate <= endOfLastMonth;
            })
            .reduce((acc, r) => acc + durationToSeconds(r.duration), 0);

        // On-time rate
        const totalWithShift = myRecords.filter(r => {
            const recordUser = personnel.find(p => p.id === r.userId);
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            const rDate = new Date(r.date);
            const dayCode = days[rDate.getDay()];
            let shiftCode = recordUser?.workShifts?.[dayCode];

            // Night Shift Correction
            const checkInDate = new Date(r.checkInTime);
            if (checkInDate.getHours() < 9 && recordUser?.workShifts) {
                const yDate = new Date(rDate);
                yDate.setDate(yDate.getDate() - 1);
                const yDayCode = days[yDate.getDay()];
                const yShift = recordUser.workShifts[yDayCode];
                if (yShift && (yShift.startsWith('S') || yShift.includes('Đêm'))) {
                    shiftCode = yShift;
                }
            }
            return shiftCode && shiftCode !== '-' && shiftCode !== 'Nghỉ';
        });

        const onTimeCount = totalWithShift.filter(r => {
            const recordUser = personnel.find(p => p.id === r.userId);
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            const rDate = new Date(r.date);
            const dayCode = days[rDate.getDay()];
            let shiftCode = recordUser?.workShifts?.[dayCode];

            // Night Shift Correction
            const checkInDate = new Date(r.checkInTime);
            if (checkInDate.getHours() < 9 && recordUser?.workShifts) {
                // Check if this is an early check-in for TODAY's shift (up to 3h 30m early)
                let isEarlyToday = false;
                const todayShiftCode = recordUser.workShifts[dayCode];
                if (todayShiftCode) {
                    const todayShiftDetails = getShiftDetails(todayShiftCode, r.date, r.userName, shiftDefinitions);
                    if (todayShiftDetails) {
                        const diff = todayShiftDetails.start.getTime() - checkInDate.getTime();
                        // 3 hours = 10800000 ms. Allow up to 3h 30m to be safe.
                        if (diff > 0 && diff <= 12600000) {
                            isEarlyToday = true;
                        }
                    }
                }

                if (!isEarlyToday) {
                    const yDate = new Date(rDate);
                    yDate.setDate(yDate.getDate() - 1);
                    const yDayCode = days[yDate.getDay()];
                    const yShift = recordUser.workShifts[yDayCode];
                    if (yShift && (yShift.startsWith('S') || yShift.includes('Đêm'))) {
                        shiftCode = yShift;
                    }
                }
            }

            const shiftDetails = getShiftDetails(shiftCode, r.date, r.userName, shiftDefinitions, r.checkInTime);
            if (!shiftDetails) return true;
            return new Date(r.checkInTime) <= shiftDetails.start;
        }).length;

        const rate = totalWithShift.length > 0 ? Math.round((onTimeCount / totalWithShift.length) * 100) : 100;

        return {
            week: secondsToDisplay(weekSec),
            month: secondsToDisplay(monthSec),
            lastMonth: secondsToDisplay(lastMonthSec),
            onTimeRate: rate
        };
    }, [user, allRecords, personnel, shiftDefinitions]);

    const groupedRecords = useMemo(() => {
        const filtered = allRecords.filter(r => {
            if (historyFilter === 'today') {
                return r.date === new Date().toISOString().split('T')[0];
            }
            const [mIdx] = historyFilter.match(/\d+/) || [0];
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() - parseInt(mIdx));
            const rDate = new Date(r.date);
            return rDate.getMonth() === targetDate.getMonth() && rDate.getFullYear() === targetDate.getFullYear();
        });

        const groups = filtered.reduce((acc, record) => {
            const date = record.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(record);
            return acc;
        }, {});

        return Object.keys(groups)
            .sort((a, b) => new Date(b) - new Date(a))
            .map(date => ({
                date,
                records: groups[date].sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
            }));
    }, [allRecords, historyFilter]);
    // -------------------------------

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Chấm Công & Điểm Danh</h1>
                <span className={styles.subtitle}>Quản lý thời gian làm việc của bạn</span>
            </div>

            <div className={styles.grid}>
                {/* Check In/Out Card */}
                <div className={`${styles.card} ${styles.actionCard}`}>
                    <div className={styles.timeDisplay}>
                        <div className={styles.currentTime}>
                            {currentTime.toLocaleTimeString('vi-VN', { hour12: false })}
                        </div>
                        <div className={styles.currentDate}>{formatDate(currentTime)}</div>
                        <div style={{
                            marginTop: '12px',
                            fontSize: '12px',
                            color: '#4caf50',
                            background: 'rgba(76, 175, 80, 0.1)',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            display: 'inline-block'
                        }}>
                            • Hệ thống tự động ghi nhận
                        </div>
                    </div>

                    {(!todayRecord || !todayRecord.checkInTime) ? (
                        <button className={`${styles.actionBtn} ${styles.btnCheckIn}`} onClick={handleCheckIn}>
                            <LogIn size={48} className={styles.icon} />
                            <span>CHECK IN</span>
                            <span className={styles.timerLabel}>Thủ công (Override)</span>
                        </button>
                    ) : !todayRecord.checkOutTime ? (
                        <button className={`${styles.actionBtn} ${styles.btnCheckOut} ${styles.pulse}`} onClick={handleCheckOut}>
                            <LogOut size={48} className={styles.icon} />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span>CHECK OUT</span>
                                <span className={styles.elapsedTime}>{elapsedTime}</span>
                            </div>
                        </button>
                    ) : (
                        <div className={`${styles.actionBtn} ${styles.btnCheckIn}`} style={{ filter: 'grayscale(1)', cursor: 'default', boxShadow: 'none', transform: 'none' }}>
                            <Coffee size={48} className={styles.icon} />
                            <span>HOÀN THÀNH</span>
                            <span className={styles.timerLabel}>Tổng: {todayRecord.duration}</span>
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className={`${styles.card} ${styles.infoCard}`}>
                    <h3 className={styles.sectionTitle}>
                        <Calendar size={20} />
                        Thông tin ca làm việc
                    </h3>

                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Nhân sự</span>
                        <span className={styles.infoValue}>{user?.name}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Ca đăng ký hôm nay</span>
                        <span className={`${styles.infoValue} ${styles.scheduleHighlight}`}>{getTodayShift()}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Giờ vào (Thực tế)</span>
                        <span className={styles.infoValue}>{todayRecord ? formatTime(todayRecord.checkInTime) : '--:--'}</span>
                    </div>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Giờ ra (Thực tế)</span>
                        <span className={styles.infoValue}>{todayRecord?.checkOutTime ? formatTime(todayRecord.checkOutTime) : '--:--'}</span>
                    </div>

                    <div className={styles.divider}></div>

                    <h3 className={styles.sectionTitle}>
                        <Timer size={20} />
                        Thống kê cá nhân
                    </h3>
                    <div className={styles.statsSummaryGrid}>
                        <div className={styles.statSummaryItem}>
                            <span className={styles.statSummaryLabel}>Tháng trước</span>
                            <span className={styles.statSummaryValue}>{stats.lastMonth}</span>
                        </div>
                        <div className={styles.statSummaryItem}>
                            <span className={styles.statSummaryLabel}>Tuần này</span>
                            <span className={styles.statSummaryValue}>{stats.week}</span>
                        </div>
                        <div className={styles.statSummaryItem}>
                            <span className={styles.statSummaryLabel}>Tháng này</span>
                            <span className={styles.statSummaryValue}>{stats.month}</span>
                        </div>
                        <div className={styles.statSummaryItem}>
                            <span className={styles.statSummaryLabel}>Tỉ lệ đúng giờ</span>
                            <span className={styles.statSummaryValue} style={{ color: stats.onTimeRate >= 80 ? '#4caf50' : '#f44336' }}>
                                {stats.onTimeRate}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance List */}
            <div className={styles.listSection}>
                <div className={styles.listHeaderActions}>
                    <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
                        <Timer size={20} />
                        Lịch sử chấm công
                    </h3>
                    <div className={styles.filterTabs}>
                        {[
                            { id: 'today', label: 'Hôm nay' },
                            ...[0, 1, 2].map(i => {
                                const d = new Date();
                                d.setMonth(d.getMonth() - i);
                                return { id: `m${i}`, label: `Tháng ${d.getMonth() + 1}` };
                            })
                        ].map(opt => (
                            <button
                                key={opt.id}
                                className={`${styles.filterTab} ${historyFilter === opt.id ? styles.filterTabActive : ''}`}
                                onClick={() => setHistoryFilter(opt.id)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className={styles.tableWrapper}>
                    {groupedRecords.map(({ date, records: dateRecords }) => (
                        <div key={date} style={{ marginBottom: '32px' }}>
                            <div style={{
                                padding: '12px 16px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                fontWeight: '600',
                                color: '#FFD700',
                                borderLeft: '4px solid #FFD700'
                            }}>
                                {formatDate(new Date(date))}
                            </div>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.th}>Nhân viên</th>
                                        <th className={styles.th}>Ca làm việc</th>
                                        <th className={styles.th}>Check In</th>
                                        <th className={styles.th}>Check Out</th>
                                        <th className={styles.th}>Thời gian</th>
                                        <th className={styles.th}>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dateRecords.map(record => {
                                        const recordUser = personnel.find(p => p.id === record.userId);
                                        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                                        const rDate = new Date(record.date);
                                        const dayCode = days[rDate.getDay()];

                                        let shiftCode = recordUser?.workShifts?.[dayCode];

                                        // Night Shift Correction: If check-in is before 9 AM, check if yesterday was a night shift
                                        const checkInDate = new Date(record.checkInTime);
                                        if (checkInDate.getHours() < 9 && recordUser?.workShifts) {
                                            const yDate = new Date(rDate);
                                            yDate.setDate(yDate.getDate() - 1);
                                            const yDayCode = days[yDate.getDay()];
                                            const yShift = recordUser.workShifts[yDayCode];

                                            if (yShift && (yShift.startsWith('S') || yShift.includes('Đêm'))) {
                                                shiftCode = yShift;
                                            }
                                        }

                                        const shiftDetails = getShiftDetails(shiftCode, record.date, record.userName, shiftDefinitions, record.checkInTime);

                                        return (
                                            <tr key={record.id}>
                                                <td className={styles.td}>
                                                    <div className={styles.userCell}>
                                                        <img
                                                            src={recordUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(record.userName)}&background=random`}
                                                            alt={record.userName}
                                                            className={styles.avatar}
                                                        />
                                                        <span>{record.userName}</span>
                                                    </div>
                                                </td>
                                                <td className={styles.td}>
                                                    {recordUser?.workShifts?.[['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(record.date).getDay()]] || '-'}
                                                </td>
                                                <td className={styles.td}>
                                                    <ColoredTime
                                                        timeStr={record.checkInTime}
                                                        type="checkIn"
                                                        shiftDetails={shiftDetails}
                                                    />
                                                </td>
                                                <td className={styles.td}>
                                                    <ColoredTime
                                                        timeStr={record.checkOutTime}
                                                        type="checkOut"
                                                        shiftDetails={shiftDetails}
                                                    />
                                                </td>
                                                <td className={styles.td}>{record.duration || 'Đang làm việc...'}</td>
                                                <td className={styles.td}>
                                                    {(() => {
                                                        const s = record.status;
                                                        const hasCheckIn = !!record.checkInTime;
                                                        const hasCheckOut = !!record.checkOutTime;

                                                        // Priority: Check actual time logs first
                                                        if (hasCheckIn && !hasCheckOut) {
                                                            return <span className={`${styles.statusBadge} ${styles.statusOnline}`}>Computing</span>;
                                                        }
                                                        if (hasCheckOut) {
                                                            return <span className={`${styles.statusBadge} ${styles.statusOffline}`}>Completed</span>;
                                                        }

                                                        // If no time logs, fall back to status text
                                                        if (s === 'Work' || s === 'working') {
                                                            return <span className={`${styles.statusBadge}`} style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}>Scheduled</span>;
                                                        }
                                                        if (s === 'completed') {
                                                            return <span className={`${styles.statusBadge} ${styles.statusOffline}`}>Completed</span>;
                                                        }

                                                        // Other statuses
                                                        return <span className={`${styles.statusBadge}`} style={{ background: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f' }}>{s}</span>;
                                                    })()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ))}

                    {allRecords.length === 0 && (
                        <div style={{ textAlign: 'center', opacity: 0.5, padding: '32px' }}>
                            Chưa có dữ liệu chấm công
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Attendance;
