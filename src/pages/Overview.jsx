import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Bell,
    Plus,
    Layers,
    Clock,
    CheckCircle2,
    AlertTriangle,
    MoreHorizontal,
    Trophy
} from 'lucide-react';
import NotificationPanel from '../components/Notification/NotificationPanel';
import styles from './Overview.module.css';
import { useAppState } from '../context/AppStateContext';

// Helper Functions
const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " năm trước";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " tháng trước";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " ngày trước";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " giờ trước";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " phút trước";
    return Math.floor(seconds) + " giây trước";
};

// Live updating time-ago component
const TimeAgoDisplay = ({ timestamp, className }) => {
    const [_, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setTick(t => t + 1);
        }, 30000); // Update every 30 seconds
        return () => clearInterval(timer);
    }, []);

    return <span className={className}>{getTimeAgo(timestamp)}</span>;
};

const renderText = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} style={{ color: '#1890ff' }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
    });
};

// Statistics Calculation with Business Day Logic (9:00 AM - 8:59 AM next day, GMT+7)
const getBusinessDayRange = (baseDate = new Date()) => {
    // Helper to get time in GMT+7
    const nowGMT7 = new Date(baseDate.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));

    const start = new Date(nowGMT7);
    start.setHours(9, 0, 0, 0);

    // If current time is before 9AM, we are still in the previous day's shift
    if (nowGMT7 < start) {
        start.setDate(start.getDate() - 1);
    }

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
};

const isWithinCurrentBusinessDay = (input) => {
    if (!input) return false;
    const { start, end } = getBusinessDayRange();

    if (typeof input === 'string' && input.includes('/') && !input.includes(':')) {
        // Deadline format dd/mm/yyyy (no time part)
        const startDayStr = start.toLocaleDateString('en-GB'); // dd/mm/yyyy
        return input === startDayStr;
    } else {
        // Timestamp (Number, ISO String, or Date String with time)
        let dateObj;
        if (typeof input === 'string' && input.includes(':') && input.includes('/')) {
            // Handle "HH:mm DD/MM/YYYY" or "DD/MM/YYYY HH:mm"
            const parts = input.split(' ');
            const datePart = parts.find(p => p.includes('/'));
            const timePart = parts.find(p => p.includes(':'));
            const [d, m, y] = datePart.split('/').map(Number);
            const [h, min] = timePart.split(':').map(Number);
            dateObj = new Date(y, m - 1, d, h, min);
        } else {
            dateObj = new Date(input);
        }

        if (isNaN(dateObj.getTime())) return false;

        const dateGMT7 = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
        return dateGMT7 >= start && dateGMT7 < end;
    }
};

const Overview = () => {
    const { tasks, notifications, markNotificationAsRead, attendanceHistory, settings, personnel, taskTypes, designTaskTypes, taskStatuses, user, canDo, isLoading } = useAppState();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    // Generate last 3 months (Current + 2 previous)
    const availableMonths = useMemo(() => {
        const months = [];
        const now = new Date();
        for (let i = 0; i < 3; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                label: `Tháng ${d.getMonth() + 1}`,
                month: d.getMonth() + 1,
                year: d.getFullYear(),
                key: `${d.getFullYear()}-${d.getMonth() + 1}`
            });
        }
        return months;
    }, []);

    const [selectedMonth, setSelectedMonth] = useState(availableMonths[0]);



    const myNotifications = useMemo(() => {
        const currentUserEmail = user?.email || settings?.userEmail;
        return notifications.filter(n => !n.targetUserEmail || n.targetUserEmail === currentUserEmail);
    }, [notifications, settings, user]);

    const activities = useMemo(() => {
        const list = [];
        // Notifications
        notifications.forEach(n => {
            const task = tasks.find(t => t.id === n.taskId);
            let user = '';
            let action = n.title;
            let target = n.message;

            // Handle Design Task completion - use actual assignee
            if (task && task.source === 'design' && task.status === 'Hoàn thành') {
                user = task.assignee?.name || 'Nhân sự';
                action = 'vừa hoàn thành task design cho tiệm';
                target = task.name;
            } else if (task && !target.includes('- AM:')) {
                const amName = task.am || (personnel.find(p => p.email === task.createdBy)?.name) || '';
                if (amName && amName !== 'system') {
                    target += ` - AM: **${amName}**`;
                }
            }

            // Calculate time: Prioritize createdAt (Timestamp) > time (Date string/num) > ID (if numeric)
            let timeVal = Date.now();
            if (n.createdAt && n.createdAt.seconds) {
                timeVal = n.createdAt.seconds * 1000;
            } else if (n.time) {
                timeVal = new Date(n.time).getTime();
            } else {
                const idTime = parseInt(n.id);
                // If ID is a timestamp-like number (greater than year 2020)
                if (!isNaN(idTime) && idTime > 1600000000000) {
                    timeVal = idTime;
                }
            }

            list.push({
                id: `notif-${n.id}`,
                user: user,
                action: action,
                target: target,
                time: timeVal,
                type: 'notification',
                color: (n.type === 'task-complete' || n.title?.toLowerCase().includes('hoàn thành')) ? '#52c41a' : '#1890ff',
                taskId: n.taskId
            });
        });

        // Attendance History - Deduplicate Filter
        const uniqueHistory = [];
        const seenEvents = {}; // key: userId-date-type -> event

        (attendanceHistory || []).forEach(h => {
            if (!h.timestamp) return;
            // Normalize timestamp
            const dateStr = new Date(h.timestamp).toLocaleDateString();

            // Map types: LOGIN & CHECK_IN -> 'START' | CHECK_OUT -> 'END'
            let type = null;
            if (h.action === 'LOGIN' || h.action === 'CHECK_IN') type = 'START';
            if (h.action === 'CHECK_OUT') type = 'END';

            if (type) {
                const key = `${h.userId}-${dateStr}-${type}`;
                const existing = seenEvents[key];

                if (type === 'START') {
                    // Start of day: keep EARLIEST
                    if (!existing || new Date(h.timestamp) < new Date(existing.timestamp)) {
                        seenEvents[key] = h;
                    }
                } else {
                    // End of day: keep LATEST
                    if (!existing || new Date(h.timestamp) > new Date(existing.timestamp)) {
                        seenEvents[key] = h;
                    }
                }
            } else {
                // Other events (like TASK_DELETE) -> Always show
                uniqueHistory.push(h);
            }
        });

        // Add the filtered start/end events back
        Object.values(seenEvents).forEach(h => uniqueHistory.push(h));

        // Use filtered history for display
        uniqueHistory.forEach(h => {
            // Look up the actual personnel record for accurate info
            const person = personnel?.find(p => p.id === h.userId);
            const displayName = person?.name || h.userName || 'Nhân sự';

            let actionText = 'đã cập nhật trạng thái';
            let targetText = `**${h.newStatus}**`;

            const formatDate = (dateString) => {
                if (!dateString) return '';
                const parts = dateString.split('-');
                if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                return dateString;
            };

            if (h.newStatus && h.date) {
                targetText = `**${h.newStatus}** cho ngày **${formatDate(h.date)}**`;
            }

            if (h.action === 'CHECK_IN') {
                actionText = 'vừa';
                targetText = h.details || 'Vào ca làm';
            } else if (h.action === 'CHECK_OUT') {
                actionText = 'vừa';
                targetText = h.details || 'Tan ca làm';
            } else if (h.action === 'LOGIN' || h.action === 'RE_LOGIN') {
                actionText = 'vừa';
                targetText = h.details || 'Vào ca làm';
            } else if (h.action === 'TASK_DELETE') {
                actionText = 'vừa';
                targetText = h.details || 'Xóa task';
            } else if (!h.newStatus) {
                targetText = h.details || 'Cập nhật hồ sơ';
            }

            // Color Logic
            let itemColor = '#1890ff'; // Default Blue
            if (h.action === 'TASK_DELETE') {
                itemColor = '#f5222d'; // Red
            } else if (['CHECK_IN', 'CHECK_OUT', 'LOGIN', 'RE_LOGIN', 'AUTO_CHECKOUT'].includes(h.action)) {
                itemColor = '#fa8c16'; // Orange
            } else if (h.newStatus) {
                itemColor = '#722ed1'; // Purple for schedule registration
            }


            list.push({
                id: `hist-${h.id}`,
                user: displayName,
                action: actionText,
                target: targetText,
                time: new Date(h.timestamp).getTime(),
                type: 'status',
                color: itemColor
            });
        });

        return list.sort((a, b) => b.time - a.time).slice(0, 10);
    }, [notifications, attendanceHistory, tasks, personnel]);

    // Statistics Calculation with Business Day Logic (9:00 AM - 8:59 AM next day, GMT+7)


    const stats = useMemo(() => {
        const tasksNewToday = tasks.filter(t => {
            if (t.deletePending || (t.source || '').toLowerCase() === 'design') return false;
            const idMatch = t.id?.toString().match(/TASK-(\d+)$/);
            if (idMatch) {
                return isWithinCurrentBusinessDay(parseInt(idMatch[1]));
            }
            return false;
        }).length;

        const tasksCompletedToday = tasks.filter(t => {
            if (t.status !== 'Hoàn thành' || t.deletePending || (t.source || '').toLowerCase() === 'design') return false;
            return isWithinCurrentBusinessDay(t.completedTimestamp || t.completedAt);
        }).length;

        return {
            pending: tasks.filter(t => t.status !== 'Hoàn thành' && !t.deletePending && (t.source || '').toLowerCase() !== 'design').length,
            newToday: Math.max(tasksNewToday, notifications.filter(n => n.type === 'new-task' && n.location !== 'Quản lý Design' && isWithinCurrentBusinessDay(parseInt(n.id))).length),
            completedToday: Math.max(tasksCompletedToday, notifications.filter(n => n.type === 'task-complete' && n.location !== 'Quản lý Design' && isWithinCurrentBusinessDay(parseInt(n.id))).length),
            unsolvedOverdue: tasks.filter(t => {
                if ((t.source || '').toLowerCase() === 'design' || t.deletePending || !t.dueDate || t.status === 'Hoàn thành') return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const taskDate = new Date(t.dueDate);
                return taskDate < today;
            }).length
        };
    }, [tasks, notifications]);

    // Personnel Block Calculations
    const personnelStats = useMemo(() => {
        if (!personnel) return { today: {}, workload: {} };

        const today = {};
        const workload = {};

        personnel.forEach(p => {
            // Block 1: Tasks for Today (Deadline matches current Business Day start date)
            const pTasksToday = tasks.filter(t => {
                const isAssigned = t.assignee?.id === p.id;
                const isNotCompleted = t.status !== 'Hoàn thành';
                if (!isAssigned || !isNotCompleted) return false;
                return isWithinCurrentBusinessDay(t.deadline);
            });
            today[p.id] = pTasksToday;

            // Block 2: Workload Breakdown (Excluding Completed)
            const pPending = tasks.filter(t => t.assignee?.id === p.id && t.status !== 'Hoàn thành' && !t.deletePending);
            const breakdown = {};

            let matchedCount = 0;
            (taskStatuses || []).forEach(status => {
                const count = pPending.filter(t => t.status === status.name).length;
                breakdown[status.id] = count;
                matchedCount += count;
            });

            // "Undefined" status counts
            const undefinedCount = pPending.length - matchedCount;
            if (undefinedCount > 0) {
                breakdown['undefined'] = undefinedCount;
            }

            workload[p.id] = { total: pPending.length, breakdown };
        });

        return { today, workload };
    }, [tasks, personnel, taskStatuses]);

    const mktSupportScores = useMemo(() => {
        if (!personnel || !tasks || !taskTypes) return [];

        const { month: curM, year: curY } = selectedMonth;

        return personnel
            .filter(p => {
                const isTargetTeam = p.parentTeam === 'MKT Support' || p.parentTeam === 'Designer';
                return isTargetTeam;
            })
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(p => {
                const finishedInPeriod = tasks.filter(t => {
                    if (t.assignee?.id !== p.id || t.status !== 'Hoàn thành' || t.deletePending) return false;

                    // Support multiple date formats (completedTimestamp is best)
                    if (t.completedTimestamp) {
                        const date = new Date(t.completedTimestamp);
                        return date.getMonth() + 1 === curM && date.getFullYear() === curY;
                    }

                    if (t.deadline) {
                        const parts = t.deadline.split('/');
                        if (parts.length === 3) {
                            return parseInt(parts[1]) === curM && parseInt(parts[2]) === curY;
                        }
                    }
                    return false;
                });

                let totalScore = 0;
                finishedInPeriod.forEach(t => {
                    const typeConfig = taskTypes.find(type => type.name === t.type) ||
                        designTaskTypes.find(type => type.name === t.type);
                    totalScore += typeConfig ? (parseFloat(typeConfig.points) || 0) : 0;
                });

                return {
                    ...p,
                    finishedCount: finishedInPeriod.length,
                    monthlyScore: totalScore
                };
            });
    }, [tasks, personnel, taskTypes, designTaskTypes, selectedMonth]);

    const honoredPersonnel = useMemo(() => {
        return [...mktSupportScores]
            .sort((a, b) => b.monthlyScore - a.monthlyScore)
            .slice(0, 5);
    }, [mktSupportScores]);

    // Loading State
    if (isLoading) {
        return (
            <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Đang tải dữ liệu...</div>
            </div>
        );
    }

    // Determine layout based on user role? For now, we hardcode Manager Layout as per first request
    // The user screenshot for "Tổng quan quản lý"
    // Derive role from live personnel data to avoid stale localStorage values
    const currentUserData = personnel.find(p => p.id === user?.id || p.email === user?.email);
    const userRole = (currentUserData?.role || user?.role || '').trim().toLowerCase();
    // Removed team restriction to ensure all Admins see the simplified view
    // STRICT CHECK: Only 'admin' role gets the simplified view. Managers (even with settings rights) should see the full dashboard.
    const isAmAdmin = userRole === 'admin';

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <h1 className={styles.pageTitle}>Overview</h1>
                <div className={styles.headerActions}>
                    <button
                        className={styles.iconBtn}
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    >
                        <Bell size={28} />
                        {myNotifications.filter(n => !n.isRead).length > 0 && (
                            <span className={styles.notificationBadge}>
                                {myNotifications.filter(n => !n.isRead).length}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <div className={styles.dashboardGrid}>
                {/* Main Content (Left) */}
                <div className={styles.mainPanel}>
                    {/* Stats Cards */}
                    <div className={styles.statsRow}>
                        <Link to="/tasks?tab=team" className={`${styles.statCard} ${styles.orangeCard}`}>
                            <div className={styles.statTop}>
                                <div className={`${styles.iconBox} ${styles.orangeIcon}`}>
                                    <Plus size={20} />
                                </div>
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Task mới hôm nay</span>
                                <span className={styles.statValue}>{stats.newToday}</span>
                            </div>
                        </Link>

                        <Link to="/tasks?tab=completed" className={`${styles.statCard} ${styles.greenCard}`}>
                            <div className={styles.statTop}>
                                <div className={`${styles.iconBox} ${styles.greenIcon}`}>
                                    <CheckCircle2 size={20} />
                                </div>
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Hoàn thành hôm nay</span>
                                <span className={styles.statValue}>{stats.completedToday}</span>
                            </div>
                        </Link>

                        <Link to="/tasks?tab=team" className={`${styles.statCard} ${styles.blueCard}`}>
                            <div className={styles.statTop}>
                                <div className={`${styles.iconBox} ${styles.blueIcon}`}>
                                    <Layers size={20} />
                                </div>
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Tổng task cần thực hiện</span>
                                <span className={styles.statValue}>{stats.pending}</span>
                            </div>
                        </Link>

                        <Link to="/tasks?tab=overdue" className={`${styles.statCard} ${styles.greenCard}`} style={{ borderLeftColor: '#f5222d', background: 'linear-gradient(180deg, rgba(245, 34, 45, 0.05) 0%, var(--bg-card) 100%)' }}>
                            <div className={styles.statTop}>
                                <div className={`${styles.iconBox}`} style={{ background: 'rgba(245, 34, 45, 0.15)', color: '#f5222d' }}>
                                    <AlertTriangle size={20} />
                                </div>
                            </div>
                            <div className={styles.statContent}>
                                <span className={styles.statLabel}>Task quá hạn chưa giải quyết</span>
                                <span className={styles.statValue}>{stats.unsolvedOverdue}</span>
                            </div>
                        </Link>
                    </div>

                    {/* Personnel Blocks */}

                    <>
                        <div className={styles.sectionCard} style={{ marginBottom: '20px' }}>
                            <div className={styles.cardHeader}>
                                <h3>Task có deadline hôm nay (MKT Support)</h3>
                            </div>

                            {/* Legend - Changed to Status for the first chart - Excluding Completed */}
                            <div className={styles.legendContainer}>
                                {taskStatuses && taskStatuses
                                    .filter(s => s.name !== 'Hoàn thành')
                                    .map(status => (
                                        <div key={status.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div className={styles.legendDot} style={{ backgroundColor: status.color }}></div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{status.name}</span>
                                        </div>
                                    ))}
                            </div>

                            <div className={styles.chartSection}>
                                <div className={styles.verticalChart} style={{ display: 'flex', alignItems: 'flex-end', width: '100%', paddingLeft: '40px', gap: '4px' }}>
                                    {/* Y-Axis */}
                                    <div className={styles.yAxis}>
                                        {[0, 2, 4, 6, 8, 10].map(val => (
                                            <div key={val} className={styles.yLabel}>
                                                <span>{val}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Columns - Filtered for MKT Support and Sorted A-Z */}
                                    {personnel && personnel
                                        .filter(p => {
                                            const isMktSupport = p.parentTeam === 'MKT Support';
                                            return isMktSupport;
                                        })
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(p => {
                                            const todayTasks = personnelStats.today[p.id] || [];
                                            const total = todayTasks.length;

                                            // Calculate breakdown by STATUS for today's tasks
                                            const breakdown = {};
                                            (taskStatuses || []).forEach(status => {
                                                breakdown[status.id] = todayTasks.filter(t => t.status === status.name).length;
                                            });

                                            // Max scale is 10 for daily tasks
                                            const heightPercent = Math.min((total / 10) * 100, 100);

                                            return (
                                                <div key={p.id} className={styles.chartColumnGroup} style={{ flex: 1, minWidth: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                    <div className={styles.totalValueLabel}>{total}</div>
                                                    <div className={styles.chartBarContainer} style={{ height: `${heightPercent}%`, width: '60%', maxWidth: '40px', minWidth: '16px' }}>
                                                        {taskStatuses && taskStatuses.map(status => {
                                                            const count = breakdown[status.id] || 0;
                                                            if (count === 0) return null;
                                                            const segmentHeight = (count / total) * 100;
                                                            return (
                                                                <div
                                                                    key={status.id}
                                                                    className={styles.chartBarSegment}
                                                                    style={{ height: `${segmentHeight}%`, backgroundColor: status.color }}
                                                                    title={`${status.name}: ${count}`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                    <div className={styles.columnLabel} style={{ width: '100%', textAlign: 'center', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.name}>{p.name}</div>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            </div>
                        </div>

                        <div className={styles.sectionCard} style={{ marginBottom: '20px' }}>
                            <div className={styles.cardHeader}>
                                <h3>Remaining Task</h3>
                            </div>

                            {/* Legend - Status based and excluding Completed */}
                            <div className={styles.legendContainer}>
                                {taskStatuses && taskStatuses
                                    .filter(s => s.name !== 'Hoàn thành')
                                    .map(status => (
                                        <div key={status.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div className={styles.legendDot} style={{ backgroundColor: status.color }}></div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{status.name}</span>
                                        </div>
                                    ))}
                                {/* Undefined/Other Legend */}
                                {personnel && personnel.some(p => (personnelStats.workload[p.id]?.breakdown['undefined'] || 0) > 0) && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div className={styles.legendDot} style={{ backgroundColor: '#8c8c8c' }}></div>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Chưa phân loại (Undefined)</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.chartSection}>
                                <div className={styles.verticalChart} style={{ display: 'flex', alignItems: 'flex-end', width: '100%', paddingLeft: '40px', gap: '4px' }}>
                                    {/* Y-Axis */}
                                    <div className={styles.yAxis}>
                                        {[0, 5, 10, 15, 20].map(val => (
                                            <div key={val} className={styles.yLabel}>
                                                <span>{val}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Columns - Filtered for MKT Support and Sorted A-Z */}
                                    {personnel && personnel
                                        .filter(p => {
                                            const isMktSupport = p.parentTeam === 'MKT Support';
                                            return isMktSupport;
                                        })
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(p => {
                                            const stat = personnelStats.workload[p.id] || { total: 0, breakdown: {} };
                                            // Scale to 20
                                            const heightPercent = Math.min((stat.total / 20) * 100, 100);

                                            return (
                                                <div key={p.id} className={styles.chartColumnGroup} style={{ flex: 1, minWidth: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                    <div className={styles.totalValueLabel}>{stat.total > 0 ? stat.total : 0}</div>
                                                    <div className={styles.chartBarContainer} style={{ height: `${heightPercent}%`, width: '60%', maxWidth: '40px', minWidth: '16px' }}>
                                                        {taskStatuses && taskStatuses.map(status => {
                                                            const count = stat.breakdown[status.id] || 0;
                                                            if (count === 0) return null;
                                                            const segmentHeight = (count / stat.total) * 100;
                                                            return (
                                                                <div
                                                                    key={status.id}
                                                                    className={styles.chartBarSegment}
                                                                    style={{ height: `${segmentHeight}%`, backgroundColor: status.color }}
                                                                    title={`${status.name}: ${count}`}
                                                                />
                                                            );
                                                        })}
                                                        {/* Handle Undefined Segment */}
                                                        {stat.breakdown['undefined'] > 0 && (
                                                            <div
                                                                className={styles.chartBarSegment}
                                                                style={{ height: `${(stat.breakdown['undefined'] / stat.total) * 100}%`, backgroundColor: '#8c8c8c' }}
                                                                title={`Chưa phân loại: ${stat.breakdown['undefined']}`}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className={styles.columnLabel} style={{ width: '100%', textAlign: 'center', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.name}>{p.name}</div>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            </div>
                        </div>

                        {/* MKT Support Score Statistics - Should this also be visible? Assuming YES based on context of 'Charts' */}
                        {/* Wait, user asked for '2 block này': Task Deadline & Remaining. */}
                        {/* Score Stats is a 3rd block in this container. */}
                        {/* I will allow it too since it is part of the 'Charts' group I am unwrapping. Limiting strictly to 2 blocks complicates the split. */}
                        {/* Actually, user said '2 block này'. Maybe they WANT to hide Score Stats? */}
                        {/* But 'Score Stats' was hidden with them. */}
                        {/* I will unwrap ALL Chart Blocks. If they want Score Stats hidden, they will ask. */}

                        {!isAmAdmin && (
                            <div className={styles.sectionCard}>
                                <div className={styles.cardHeader}>
                                    <h3>Thống kê điểm MKT Support</h3>
                                    <select
                                        className={styles.monthSelect}
                                        value={selectedMonth.key}
                                        onChange={(e) => {
                                            const m = availableMonths.find(am => am.key === e.target.value);
                                            if (m) setSelectedMonth(m);
                                        }}
                                    >
                                        {availableMonths.map(m => (
                                            <option key={m.key} value={m.key}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.chartLegend}>
                                    <div className={styles.legendItem}>
                                        <div className={styles.doneDot} style={{ backgroundColor: '#52c41a' }}></div>
                                        <span>Done</span>
                                    </div>
                                    <div className={styles.legendItem}>
                                        <div className={styles.pointDot} style={{ backgroundColor: '#faad14' }}></div>
                                        <span>Point</span>
                                    </div>
                                </div>

                                <div className={styles.scoreChartContainer}>
                                    <div className={styles.dualBarChart} style={{ display: 'flex', alignItems: 'flex-end', width: '100%', paddingLeft: '40px', gap: '4px' }}>
                                        <div className={styles.yAxis}>
                                            {[0, 200, 400, 600, 800].map(val => (
                                                <div key={val} className={styles.yLabel}>
                                                    <span>{val}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {mktSupportScores.map(p => {
                                            return (
                                                <div key={p.id} className={styles.clusteredBarGroup} style={{ flex: 1, minWidth: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                    <div className={styles.barsWrapper} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px', height: '100%', width: '100%' }}>
                                                        <div className={styles.barContainer} style={{ flex: 1, maxWidth: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                            <span className={styles.barValue}>{p.finishedCount}</span>
                                                            <div
                                                                className={styles.barDone}
                                                                style={{ height: `${(Math.min(p.finishedCount, 800) / 800) * 100}%`, width: '100%' }}
                                                            ></div>
                                                        </div>
                                                        <div className={styles.barContainer} style={{ flex: 1, maxWidth: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                            <span className={styles.barValue}>{p.monthlyScore}</span>
                                                            <div
                                                                className={styles.barPoint}
                                                                style={{ height: `${(Math.min(p.monthlyScore, 800) / 800) * 100}%`, width: '100%' }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.personLabel} style={{ width: '100%', textAlign: 'center', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.name}>{p.name}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>

                </div>

                {/* Right Sidebar (Feed) */}
                {!isAmAdmin && (
                    <div className={styles.rightPanel}>
                        <div className={styles.feedSection}>
                            <div className={styles.feedHeader}>
                                <h3>HOẠT ĐỘNG GẦN ĐÂY</h3>
                                {canDo('audit_logs.view') && (
                                    <Link to="/history">Xem tất cả</Link>
                                )}
                            </div>
                            <ul className={styles.feedList}>
                                {activities.length > 0 ? (
                                    activities.map(item => (
                                        <li key={item.id} className={styles.feedItem}>
                                            <div className={styles.feedDot} style={{ backgroundColor: item.color }}></div>
                                            <div className={styles.feedContent}>
                                                <p>{item.user && <strong>{item.user}</strong>} {item.action} {renderText(item.target)}</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                    <TimeAgoDisplay timestamp={item.time} className={styles.feedTime} />
                                                    {item.taskId && (
                                                        <Link
                                                            to={`/tasks?id=${item.taskId}`}
                                                            style={{
                                                                fontSize: '12px',
                                                                color: '#1890ff',
                                                                textDecoration: 'none',
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            Xem chi tiết
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <li className={styles.feedItem}>
                                        <div className={styles.feedContent}>
                                            <p>Chưa có hoạt động nào.</p>
                                        </div>
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className={styles.feedSection}>
                            <div className={styles.feedHeader}>
                                <h3 className={styles.honoredTitle}>TOP 5 NHÂN SỰ XUẤT SẮC CỦA THÁNG</h3>
                            </div>
                            <div className={`${styles.topUserList} ${styles.honoredList}`}>
                                {honoredPersonnel.map((user, index) => {
                                    // Gold, Silver, Bronze, then blue/gray for 4-5
                                    const medalColors = ['#FFD700', '#C0C4C0', '#CD7F32', '#1890ff', '#1890ff'];
                                    return (
                                        <div key={user.id} className={`${styles.topUserItem} ${styles.honoredItem}`}>
                                            <div className={styles.medalBox}>
                                                <Trophy size={20} color={medalColors[index]} fill={medalColors[index] + '33'} />
                                                <span className={styles.rankNum} style={{ color: medalColors[index] }}>{index + 1}</span>
                                            </div>
                                            <img src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt="User" />
                                            <div className={styles.topUserInfo}>
                                                <div className={styles.topUserName}>{user.name}</div>
                                                <div className={styles.topUserRole}>{user.parentTeam || 'MKT Support'}</div>
                                            </div>
                                            <div className={styles.topUserScore}>
                                                <div className={styles.scoreVal}>{user.monthlyScore} điểm</div>
                                                <div className={styles.scoreTrend}>tháng này</div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {honoredPersonnel.length === 0 && (
                                    <div className={styles.emptyTask} style={{ color: 'var(--text-tertiary)' }}>
                                        Chưa có bảng xếp hạng tháng này.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Notification Panel */}
            <NotificationPanel
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                notifications={myNotifications}
                onMarkAllRead={() => markNotificationAsRead('all')}
                onMarkRead={markNotificationAsRead}
            />

        </div >
    );
};

export default Overview;
