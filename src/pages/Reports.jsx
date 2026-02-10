import React, { useState, useMemo } from 'react';
import {
    Calendar,
    Download,
    TrendingUp,
    CheckCircle2,
    Briefcase,
    Zap,
    ArrowUpRight,
    LayoutGrid,
    ChevronDown,
    MoreHorizontal,
    Monitor,
    Clock,
    Layers,
    AlertCircle,
    UploadCloud,
    RefreshCcw
} from 'lucide-react';
import styles from './Reports.module.css';

import GoogleSheetConfig from '../components/GoogleSheetConfig';
import { useAppState } from '../context/AppStateContext';

const Reports = () => {
    const { tasks, personnel, taskTypes, designTaskTypes, attendance, showToast, settings, shiftDefinitions } = useAppState();
    const [timeTab, setTimeTab] = useState('month'); // 'week', 'month', 'quarter', 'year', 'custom'
    const startInputRef = React.useRef(null);
    const endInputRef = React.useRef(null);
    const [customRange, setCustomRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [isSyncing, setIsSyncing] = useState(false);



    // Filter Personnel to all MKT Support members
    const teamPersonnel = useMemo(() => {
        return (personnel || []).filter(p => {
            const pTeam = (p.parentTeam || p.team || '').toLowerCase();
            const hasWorkShifts = p.workShifts && Object.keys(p.workShifts).length > 0;
            return pTeam === 'mkt support' && hasWorkShifts;
        });
    }, [personnel]);

    const teamPersonnelIds = useMemo(() => new Set(teamPersonnel.map(p => p.id)), [teamPersonnel]);

    // All MKT Support IDs including Chris and Designers for top level metrics
    const allMktSupportIds = useMemo(() => {
        return new Set((personnel || []).filter(p => {
            const pTeam = (p.parentTeam || p.team || '').toLowerCase();
            const hasWorkShifts = p.workShifts && Object.keys(p.workShifts).length > 0;
            return pTeam === 'mkt support' && hasWorkShifts;
        }).map(p => p.id));
    }, [personnel]);

    // Statistics Calculation with GMT+7 & Business Day Logic
    const getRangeForFilter = (filter) => {
        const now = new Date();
        const nowGMT7 = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));

        const start = new Date(nowGMT7);
        const end = new Date(nowGMT7);

        // Reset to end of day for comparison
        end.setHours(23, 59, 59, 999);

        switch (filter) {
            case 'week':
                // Current week (Monday to Sunday)
                const day = nowGMT7.getDay(); // 0 (Sun) to 6 (Sat)
                const diff = nowGMT7.getDate() - (day === 0 ? 6 : day - 1); // Adjust to Monday
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                break;
            case 'last-month':
                // Set to first day of last month
                start.setMonth(start.getMonth() - 1);
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                // Set to last day of last month
                end.setDate(0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(nowGMT7.getMonth() / 3);
                start.setMonth(quarter * 3);
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                break;
            case 'year':
                start.setMonth(0);
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                break;
            case 'custom':
                const cStart = new Date(customRange.start);
                const cEnd = new Date(customRange.end);
                cStart.setHours(0, 0, 0, 0);
                cEnd.setHours(23, 59, 59, 999);
                return { start: cStart, end: cEnd };
            default:
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
        }
        return { start, end };
    };

    const parseDate = (val) => {
        if (!val) return null;
        if (typeof val === 'string') {
            // Handle DD/MM/YYYY or hh:mm DD/MM/YYYY
            const dateMatch = val.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (dateMatch) {
                const [_, d, m, y] = dateMatch;
                const date = new Date(y, m - 1, d);
                // If it's a completion date, let's set it to end of day to be safe
                // but for range comparison, the comparison itself is inclusive.
                return date;
            }
        }
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
    };

    const isWithinRange = (val, range) => {
        const date = parseDate(val);
        if (!date) return false;
        return date >= range.start && date <= range.end;
    };

    // Calculate Metrics based on selected timeTab
    const range = useMemo(() => getRangeForFilter(timeTab), [timeTab, customRange]);

    // Update customRange values when a standard timeTab is selected to stay in sync
    React.useEffect(() => {
        if (timeTab !== 'custom') {
            const r = getRangeForFilter(timeTab);
            setCustomRange({
                start: r.start.toISOString().split('T')[0],
                end: r.end.toISOString().split('T')[0]
            });
        }
    }, [timeTab]);

    // Filter tasks TO include all MKT Support members (for top cards) but exclude source='design' and deleted tasks
    const teamTasks = useMemo(() => {
        return tasks.filter(t => t.assignee && allMktSupportIds.has(t.assignee.id) && t.source !== 'design' && !t.deletePending);
    }, [tasks, allMktSupportIds]);

    const designTasks = useMemo(() => {
        return tasks.filter(t => t.source === 'design' && isWithinRange(t.completedTimestamp || t.completedAt, range) && !t.deletePending);
    }, [tasks, range]);

    const designTypeDist = useMemo(() => {
        const dist = {};
        designTasks.forEach(t => {
            const type = t.type || 'Khác';
            dist[type] = (dist[type] || 0) + 1;
        });
        return Object.entries(dist).map(([name, count]) => {
            const config = designTaskTypes.find(dt => dt.name === name);
            return {
                name,
                count,
                color: config?.color || '#8c8c8c',
                percent: designTasks.length > 0 ? Math.round((count / designTasks.length) * 100) : 0
            };
        }).sort((a, b) => b.count - a.count);
    }, [designTasks, designTaskTypes]);

    const DesignPieChart = ({ data }) => {
        if (!data || data.length === 0) return <div className={styles.emptyData}>Không có dữ liệu design.</div>;

        let cumulativePercent = 0;

        const getCoordinatesForPercent = (percent) => {
            const x = Math.cos(2 * Math.PI * percent);
            const y = Math.sin(2 * Math.PI * percent);
            return [x, y];
        };

        const getLabelPosition = (startPercent, slicePercent) => {
            const angle = 2 * Math.PI * (startPercent + slicePercent / 2) - Math.PI / 2;
            const radius = 0.65;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            return { x, y };
        };

        return (
            <div className={styles.pieChartWrapper}>
                <svg viewBox="-1.2 -1.2 2.4 2.4" className={styles.pieChartSvg}>
                    {data.map((slice, i) => {
                        const slicePercent = slice.count / designTasks.length;
                        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                        const startPercentForLabel = cumulativePercent;
                        cumulativePercent += slicePercent;
                        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                        const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
                        const pathData = [
                            `M ${startX} ${startY}`,
                            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                            `L 0 0`,
                        ].join(' ');

                        const labelPos = getLabelPosition(startPercentForLabel, slicePercent);

                        return (
                            <g key={i}>
                                <path d={pathData} fill={slice.color} stroke="#1a1b22" strokeWidth="0.02" />
                                {slicePercent > 0.06 && (
                                    <text
                                        x={labelPos.x}
                                        y={labelPos.y}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className={styles.pieLabel}
                                        fill="#fff"
                                        fontWeight="700"
                                    >
                                        <tspan x={labelPos.x} dy="-0.08" fontSize="0.09" fontWeight="600">{slice.name}</tspan>
                                        <tspan x={labelPos.x} dy="0.13" fontSize="0.13" fontWeight="800">{slice.count}</tspan>
                                        <tspan x={labelPos.x} dy="0.12" fontSize="0.09" fontWeight="600">({slice.percent}%)</tspan>
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
                <div className={styles.pieLegend}>
                    {data.map((slice, i) => (
                        <div key={i} className={styles.pieLegendItem}>
                            <span className={styles.pieLegendColor} style={{ backgroundColor: slice.color }}></span>
                            <span className={styles.pieLegendName}>{slice.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // 1. Task Received (Actually created in period)
    const receivedTasksInPeriod = teamTasks.filter(t => {
        const createdTimestamp = parseInt(t.id?.toString().match(/TASK-(\d+)$/)?.[1] || 0);
        return createdTimestamp && isWithinRange(createdTimestamp, range);
    });

    // 2. Task Completed (Completed in period)
    const completedInPeriod = teamTasks.filter(t =>
        t.status === 'Hoàn thành' &&
        isWithinRange(t.completedTimestamp || t.completedAt, range)
    );

    // 3. Pending Tasks (Backlog at the end of the period)
    const totalPending = teamTasks.filter(t => {
        const createdTimestamp = parseInt(t.id?.toString().match(/TASK-(\d+)$/)?.[1] || 0);
        const isCreatedBeforeOrDuring = createdTimestamp && createdTimestamp <= range.end;

        const completedDate = parseDate(t.completedTimestamp || t.completedAt);
        const isNotYetCompleted = t.status !== 'Hoàn thành';
        const isCompletedAfterPeriod = completedDate && completedDate > range.end;

        return isCreatedBeforeOrDuring && (isNotYetCompleted || isCompletedAfterPeriod);
    });

    // 4. Total Tasks involved in this period (Received + Old Backlog that was worked on/completed)
    // This is useful for capacity/productivity but we'll prioritize "Received" for the primary card
    const totalActiveTasks = receivedTasksInPeriod.length;



    // 4. On-time Rate
    const onTimeTasks = completedInPeriod.filter(t => {
        if (!t.deadline || !(t.completedTimestamp || t.completedAt)) return true;
        const [d, m, y] = t.deadline.split('/').map(Number);
        const deadlineDate = new Date(y, m - 1, d);
        deadlineDate.setHours(23, 59, 59, 999);
        const completeDate = new Date(t.completedTimestamp || t.completedAt);
        return completeDate <= deadlineDate;
    });

    const completionRate = receivedTasksInPeriod.length > 0
        ? Math.round((completedInPeriod.length / receivedTasksInPeriod.length) * 100)
        : (completedInPeriod.length > 0 ? 100 : 0);

    const onTimeRate = completedInPeriod.length > 0
        ? Math.round((onTimeTasks.length / completedInPeriod.length) * 100)
        : 100;

    // 5. Rework Rate (Calculated based on tasks handled in period)
    const reworkTasks = teamTasks.filter(t =>
        (t.status === 'Làm lại' || t.status === 'Thực hiện lại') &&
        (isWithinRange(t.completedTimestamp || t.completedAt, range) || isWithinRange(parseInt(t.id?.toString().match(/TASK-(\d+)$/)?.[1] || 0), range))
    ).length;

    // We compare rework to completed tasks to see error rate of output
    const reworkRate = completedInPeriod.length > 0 ? Math.round((reworkTasks / completedInPeriod.length) * 100) : 0;

    // 6. Total Points (Weighted score)
    const totalPoints = completedInPeriod.reduce((acc, t) => {
        const typeConfig = taskTypes.find(type => type.name === t.type);
        return acc + (parseFloat(typeConfig?.points) || 0);
    }, 0);

    const metrics = [
        { label: 'Task đã nhận', value: totalActiveTasks, trend: 'Trong kỳ', trendDir: 'neutral', icon: <Briefcase size={20} color="#0066ff" />, color: '#0066ff' },
        { label: 'Đã hoàn thành', value: completedInPeriod.length, trend: `${completionRate}%`, trendDir: 'up', icon: <CheckCircle2 size={20} color="#2ecc71" />, color: '#2ecc71' },
        { label: 'Tổng điểm', value: totalPoints, trend: 'Điểm số', trendDir: 'up', icon: <TrendingUp size={20} color="#8e44ad" />, color: '#8e44ad' },
        { label: 'Task tồn đọng', value: totalPending.length, trend: 'Đang xử lý', trendDir: 'neutral', icon: <Layers size={20} color="#e67e22" />, color: '#e67e22' },
        { label: 'Chất lượng', value: `${100 - reworkRate}%`, trend: 'Ổn định', trendDir: 'up', icon: <ArrowUpRight size={20} color="#fd79a8" />, color: '#fd79a8' },
        { label: 'Đúng hạn', value: `${onTimeRate}%`, trend: 'Tỉ lệ', trendDir: 'up', icon: <Zap size={20} color="#f1c40f" />, color: '#f1c40f' }
    ];

    // Attendance Calculations Helper
    function durationToSeconds(duration) {
        if (!duration) return 0;
        const parts = duration.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
        return 0;
    }

    function secondsToDisplay(totalSec) {
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        return `${h}h${m}m`;
    }

    const getShiftTimes = (shiftCode, dateStr, checkInTime) => {
        if (!shiftCode || shiftCode === '-' || shiftCode === 'Nghỉ') return null;

        const shiftDef = (shiftDefinitions || []).find(s => s.name === shiftCode);
        if (!shiftDef) return null;

        const [startH, startM] = shiftDef.startTime.split(':').map(Number);
        const startTime = new Date(dateStr);
        startTime.setHours(startH, startM, 0, 0);

        // Date correction logic for night shifts
        if (checkInTime) {
            const checkIn = new Date(checkInTime);
            // If the calculated start time (based on record date) is > 12h ahead of check-in,
            // it implies the shift started "Yesterday" relative to this check-in date logic
            if (startTime.getTime() - checkIn.getTime() > 12 * 60 * 60 * 1000) {
                startTime.setDate(startTime.getDate() - 1);
            }
        }
        return startTime;
    };

    // Personnel Statistics
    const personnelStats = useMemo(() => {
        return teamPersonnel.map(p => {
            const pTasks = teamTasks.filter(t => t.assignee?.id === p.id);

            const pReceived = pTasks.filter(t => {
                const createdTimestamp = parseInt(t.id?.toString().match(/TASK-(\d+)$/)?.[1] || 0);
                return createdTimestamp && isWithinRange(createdTimestamp, range);
            }).length;

            const pCompleted = pTasks.filter(t =>
                t.status === 'Hoàn thành' &&
                isWithinRange(t.completedTimestamp || t.completedAt, range)
            ).length;

            const pPoints = pTasks.filter(t =>
                t.status === 'Hoàn thành' &&
                isWithinRange(t.completedTimestamp || t.completedAt, range)
            ).reduce((acc, t) => {
                const typeConfig = taskTypes.find(type => type.name === t.type);
                return acc + (parseFloat(typeConfig?.points) || 0);
            }, 0);

            const pPending = pTasks.filter(t => {
                const createdTimestamp = parseInt(t.id?.toString().match(/TASK-(\d+)$/)?.[1] || 0);
                const isCreatedBeforeOrDuring = createdTimestamp && createdTimestamp <= range.end;
                const completedDate = parseDate(t.completedTimestamp || t.completedAt);
                const isNotYetCompleted = t.status !== 'Hoàn thành';
                const isCompletedAfterPeriod = completedDate && completedDate > range.end;
                return isCreatedBeforeOrDuring && (isNotYetCompleted || isCompletedAfterPeriod);
            }).length;

            const pRate = pReceived > 0 ? Math.round((pCompleted / pReceived) * 100) : (pCompleted > 0 ? 100 : 0);

            const pOnTime = pTasks.filter(t => {
                if (t.status !== 'Hoàn thành') return false;
                if (!isWithinRange(t.completedTimestamp || t.completedAt, range)) return false;
                if (!t.deadline) return true;
                const [d, m, y] = t.deadline.split('/').map(Number);
                const deadlineDate = new Date(y, m - 1, d);
                deadlineDate.setHours(23, 59, 59, 999);
                const completeDate = new Date(t.completedTimestamp || t.completedAt);
                return completeDate <= deadlineDate;
            }).length;
            const pOnTimeRate = pCompleted > 0 ? Math.round((pOnTime / pCompleted) * 100) : 100;

            const pAttendance = attendance.filter(r => r.userId === p.id && isWithinRange(r.date, range));
            const pWorkSec = pAttendance.reduce((acc, r) => acc + durationToSeconds(r.duration), 0);
            const pWorkHours = secondsToDisplay(pWorkSec);

            const pTotalShifts = pAttendance.filter(r => {
                const shiftCode = p.workShifts?.[['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(r.date).getDay()]];
                return shiftCode && shiftCode !== '-' && shiftCode !== 'Nghỉ';
            }).length;

            let pTotalLateSec = 0;
            const pLateCount = pAttendance.filter(r => {
                const shiftCode = p.workShifts?.[['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(r.date).getDay()]];
                const shiftStart = getShiftTimes(shiftCode, r.date, r.checkInTime);
                if (!shiftStart) return false;
                const checkIn = new Date(r.checkInTime);
                if (checkIn > shiftStart) {
                    pTotalLateSec += Math.floor((checkIn - shiftStart) / 1000);
                    return true;
                }
                return false;
            }).length;

            const pLateDuration = pTotalLateSec > 0 ? secondsToDisplay(pTotalLateSec) : '0h0m';

            return {
                id: p.id,
                name: p.name.split(' ').pop(),
                fullName: p.name,
                avatar: p.avatar,
                role: p.role,
                team: p.team,
                received: pReceived,
                completed: pCompleted,
                pending: pPending,
                points: pPoints,
                rate: pRate,
                onTimeRate: pOnTimeRate,
                lateDuration: pLateDuration,
                lateCount: pLateCount,
                shiftCount: pTotalShifts
            };
        }).sort((a, b) => b.points - a.points);
    }, [teamPersonnel, teamTasks, range, taskTypes, isWithinRange, attendance, shiftDefinitions]);

    const backlogStats = teamPersonnel.map(p => {
        const pTasks = teamTasks.filter(t => t.assignee?.id === p.id);
        const pPending = pTasks.filter(t => t.status !== 'Hoàn thành').length;
        return { name: p.name, pending: pPending };
    }).sort((a, b) => b.pending - a.pending);

    // Task Type Distribution
    const typeDistribution = useMemo(() => {
        const dist = {};
        receivedTasksInPeriod.forEach(t => {
            const type = t.type || 'Chưa phân loại';
            dist[type] = (dist[type] || 0) + 1;
        });
        return Object.entries(dist).map(([name, count]) => ({
            name,
            count,
            percent: receivedTasksInPeriod.length > 0 ? Math.round((count / receivedTasksInPeriod.length) * 100) : 0
        })).sort((a, b) => b.count - a.count);
    }, [receivedTasksInPeriod]);

    const handleExportPDF = () => {
        window.print();
    };

    const handleSyncGoogleSheets = async (targetTasks = null, customSheetName = null) => {
        const tasksToUse = targetTasks || receivedTasksInPeriod;
        if (!tasksToUse || tasksToUse.length === 0) {
            if (!targetTasks) showToast('Không có dữ liệu để đồng bộ.', 'error');
            return;
        }

        const webhookUrl = settings?.reportSyncWebhook || settings?.googleSheetWebhook;
        if (!webhookUrl) {
            if (!targetTasks) showToast('Vui lòng cấu hình Webhook URL ở cuối trang trước khi đồng bộ.', 'error');
            return;
        }

        setIsSyncing(true);
        const SCRIPT_URL = webhookUrl;

        try {
            if (!targetTasks) showToast('Đang bắt đầu đồng bộ Google Sheets...', 'info');

            const monthStr = customSheetName || `Tháng ${String(range.start.getMonth() + 1).padStart(2, '0')}-${range.start.getFullYear()}`;

            const payload = {
                sheetName: monthStr,
                tasks: tasksToUse.map(task => {
                    // Extract date from ID if createdAt is missing
                    let autoCreatedAt = '';
                    const idMatch = task.id?.toString().match(/TASK-(\d+)$/);
                    if (idMatch) {
                        const ts = parseInt(idMatch[1]);
                        if (ts > 1000000000000) { // Valid timestamp check
                            autoCreatedAt = new Date(ts).toLocaleString('en-GB');
                        }
                    }

                    return {
                        id: task.id,
                        name: task.name || '',
                        type: task.type || '',
                        status: task.status || '',
                        priority: task.priority || '',
                        assignee: task.support || (task.assignee?.name) || '',
                        createdAt: task.createdAt || autoCreatedAt || '',
                        deadline: task.deadline || task.dueDate || '',
                        completedAt: task.completedAt || task.completedTimestamp || '',
                        content: (task.content || task.title || '').substring(0, 500)
                    };
                })
            };

            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!targetTasks) showToast(`Đã đồng bộ vào Sheet: ${monthStr}`, 'success');
            return true;
        } catch (error) {
            console.error('Sync Error:', error);
            if (!targetTasks) showToast('Lỗi đồng bộ: ' + error.message, 'error');
            return false;
        } finally {
            setIsSyncing(false);
        }
    };

    // Auto-sync logic for 10AM on the 1st of the month
    React.useEffect(() => {
        const checkAutoSync = async () => {
            const now = new Date();
            const nowGMT7 = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));

            // If it's the 1st day of the month and after 10 AM
            if (nowGMT7.getDate() === 1 && nowGMT7.getHours() >= 10) {
                const lastMonthDate = new Date(nowGMT7);
                lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
                const monthYear = `${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}-${lastMonthDate.getFullYear()}`;
                const syncKey = `auto_sync_done_${monthYear}`;

                if (!localStorage.getItem(syncKey)) {
                    console.log('Triggering auto-sync for previous month...');

                    // Calculate range for previous month
                    const prevStart = new Date(nowGMT7.getFullYear(), nowGMT7.getMonth() - 1, 1, 0, 0, 0);
                    const prevEnd = new Date(nowGMT7.getFullYear(), nowGMT7.getMonth(), 0, 23, 59, 59);

                    const prevMonthTasks = tasks.filter(t => {
                        const isOriginal = t.source !== 'design' && !t.deletePending;
                        const createdTimestamp = parseInt(t.id?.toString().match(/TASK-(\d+)$/)?.[1] || 0);
                        return isOriginal && createdTimestamp && createdTimestamp >= prevStart && createdTimestamp <= prevEnd;
                    });

                    if (prevMonthTasks.length > 0) {
                        const success = await handleSyncGoogleSheets(prevMonthTasks, `Tháng ${monthYear}`);
                        if (success) {
                            localStorage.setItem(syncKey, 'true');
                            showToast(`Tự động đồng bộ tháng ${monthYear} thành công!`, 'success');
                        }
                    }
                }
            }
        };

        const timer = setTimeout(checkAutoSync, 5000); // Check 5s after load
        return () => clearTimeout(timer);
    }, [tasks]);

    const handleExportCSV = () => {
        if (!receivedTasksInPeriod || receivedTasksInPeriod.length === 0) {
            alert('Không có dữ liệu trong khoảng thời gian này để xuất.');
            return;
        }

        // Define CSV headers
        const headers = [
            "ID",
            "Tên Tiệm",
            "Loại Task",
            "Trạng thái",
            "Mức độ ưu tiên",
            "Người thực hiện",
            "Lấy từ",
            "Ngày tạo",
            "Hạn chót",
            "Ngày hoàn thành",
            "Nội dung"
        ];

        // Format data rows
        const rows = receivedTasksInPeriod.map(task => [
            task.id,
            task.name || '',
            task.type || '',
            task.status || '',
            task.priority || '',
            task.support || (task.assignee?.name) || '',
            task.source || 'manual',
            task.createdAt || '',
            task.deadline || task.dueDate || '',
            task.completedAt || task.completedTimestamp || '',
            (task.content || '').replace(/\n/g, ' ').replace(/"/g, '""') // Sanitize content
        ]);

        // Construct CSV content
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        // Create download link
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const dateStr = range.start.toLocaleDateString('en-GB').replace(/\//g, '-');

        link.setAttribute("href", url);
        link.setAttribute("download", `Bao-cao-task-${timeTab}-${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={styles.container}>
            <div className={styles.breadcrumb}>
                <span>Overview</span> / <span>Báo cáo hiệu suất</span>

            </div>

            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>Báo cáo Hiệu suất Team MKT Support</h1>
                    <p className={styles.subtitle}>
                        Phân tích năng suất nhóm, khối lượng công việc và tình trạng dự án theo thời gian.
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.controlsBar}>
                        <div className={styles.timeTabs}>
                            <div className={`${styles.timeTab} ${timeTab === 'last-month' ? styles.timeTabActive : ''}`} onClick={() => setTimeTab('last-month')}>Tháng trước</div>
                            <div className={`${styles.timeTab} ${timeTab === 'week' ? styles.timeTabActive : ''}`} onClick={() => setTimeTab('week')}>Tuần này</div>
                            <div className={`${styles.timeTab} ${timeTab === 'month' ? styles.timeTabActive : ''}`} onClick={() => setTimeTab('month')}>Tháng này</div>
                            <div className={`${styles.timeTab} ${timeTab === 'quarter' ? styles.timeTabActive : ''}`} onClick={() => setTimeTab('quarter')}>Quý này</div>
                            <div className={`${styles.timeTab} ${timeTab === 'year' ? styles.timeTabActive : ''}`} onClick={() => setTimeTab('year')}>Năm nay</div>
                        </div>
                        <div className={`${styles.datePicker} ${timeTab === 'custom' ? styles.datePickerHover : ''}`} onClick={() => {
                            if (startInputRef.current?.showPicker) startInputRef.current.showPicker();
                        }}>
                            <Calendar size={16} />
                            <div className={styles.customDateInputs}>
                                <div className={styles.dateTrigger}>
                                    {range.start.toLocaleDateString('en-GB')}
                                    <input
                                        type="date"
                                        ref={startInputRef}
                                        className={styles.realInput}
                                        value={customRange.start}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            setCustomRange(prev => ({ ...prev, start: e.target.value }));
                                            setTimeTab('custom');
                                        }}
                                    />
                                </div>
                                <span>-</span>
                                <div className={styles.dateTrigger} onClick={(e) => {
                                    e.stopPropagation();
                                    if (endInputRef.current?.showPicker) endInputRef.current.showPicker();
                                }}>
                                    {range.end.toLocaleDateString('en-GB')}
                                    <input
                                        type="date"
                                        ref={endInputRef}
                                        className={styles.realInput}
                                        value={customRange.end}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            setCustomRange(prev => ({ ...prev, end: e.target.value }));
                                            setTimeTab('custom');
                                        }}
                                    />
                                </div>
                            </div>
                            <ChevronDown size={14} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className={styles.exportBtn} onClick={handleExportCSV} style={{ backgroundColor: '#107c10' }}>
                            <LayoutGrid size={16} />
                            <span>Xuất Excel</span>
                        </button>
                        <button className={styles.exportBtn} onClick={handleExportPDF} style={{ backgroundColor: '#6b7280' }}>
                            <Download size={16} />
                            <span>Xuất PDF</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.metricsGrid}>
                {metrics.map((m, i) => {
                    const colorClass = m.color === '#0066ff' ? styles.blueMetric :
                        m.color === '#8e44ad' ? styles.purpleMetric :
                            m.color === '#e67e22' ? styles.orangeMetric :
                                m.color === '#2ecc71' ? styles.greenMetric : styles.yellowMetric;
                    return (
                        <div key={i} className={`${styles.metricCard} ${colorClass}`}>
                            <div className={styles.metricHeader}>
                                <div className={styles.metricIcon} style={{ backgroundColor: `${m.color}15` }}>
                                    {m.icon}
                                </div>
                                <span className={styles.metricLabel}>{m.label}</span>
                            </div>
                            <div className={styles.metricValueWrapper}>
                                <span className={styles.metricValue}>{m.value}</span>
                                <div className={`${styles.trend} ${styles[m.trendDir]}`}>
                                    {m.trend}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.mainCharts}>
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        Hiệu suất nhân sự
                    </div>
                    <table className={styles.reportTable}>
                        <thead>
                            <tr>
                                <th>Thành viên</th>
                                <th>Đã nhận</th>
                                <th>Đã xong</th>
                                <th>Đúng hạn</th>
                                <th>Tỉ lệ</th>
                                <th>Tổng điểm</th>
                            </tr>
                        </thead>
                        <tbody>
                            {personnelStats.map((p, i) => (
                                <tr key={i}>
                                    <td>
                                        <div className={styles.memberCell}>
                                            {p.avatar ? (
                                                <img src={p.avatar} className={styles.memberAvatarImg} alt={p.fullName} />
                                            ) : (
                                                <div className={styles.memberAvatarStub} style={{ backgroundColor: `hsl(${i * 60}, 60%, 50%)` }}>
                                                    {p.name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{p.fullName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{p.received}</td>
                                    <td>{p.completed}</td>
                                    <td>
                                        <span className={styles.efficiency} style={{ color: p.onTimeRate >= 98 ? '#00ff88' : p.onTimeRate >= 90 ? '#f1c40f' : '#ff4d4f' }}>
                                            {p.onTimeRate}%
                                        </span>
                                    </td>
                                    <td>
                                        <span className={styles.efficiency} style={{ color: p.rate >= 80 ? '#00ff88' : p.rate >= 50 ? '#f1c40f' : '#ff4d4f' }}>
                                            {p.rate}%
                                        </span>
                                    </td>
                                    <td className={styles.efficiency}>{p.points}</td>
                                </tr>
                            ))}
                            {personnelStats.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', py: '20px', color: 'var(--text-tertiary)' }}>
                                        Chưa có dữ liệu thành viên trong kỳ này.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardTitle}>
                    Báo cáo Chấm công (MKT Support)
                </div>
                <table className={styles.reportTable}>
                    <thead>
                        <tr>
                            <th>Thành viên</th>
                            <th>Tổng ca</th>
                            <th>Đúng giờ</th>
                            <th>Đi muộn</th>
                            <th>Thời gian đi trễ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {personnelStats.map((p, i) => (
                            <tr key={i}>
                                <td>
                                    <div className={styles.memberCell}>
                                        <div className={styles.memberAvatarStub} style={{ backgroundColor: `hsl(${i * 60}, 60%, 50%)` }}>
                                            {p.avatar ? (
                                                <img src={p.avatar} className={styles.memberAvatarImg} alt={p.fullName} />
                                            ) : (
                                                p.name.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{p.fullName}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{p.shiftCount} ca</td>
                                <td style={{ color: '#00ff88' }}>{p.shiftCount - p.lateCount}</td>
                                <td style={{ color: p.lateCount > 0 ? '#ff4d4f' : 'inherit' }}>{p.lateCount} ca</td>
                                <td style={{ fontWeight: 700, color: p.lateCount > 0 ? '#ff4d4f' : 'inherit' }}>{p.lateDuration}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.lowerGrid}>
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        Báo cáo Design (Vivian)
                    </div>
                    <div className={styles.designReportBody}>
                        <div className={styles.designSummary}>
                            <div className={styles.designMetric}>
                                <span className={styles.designMetricLabel}>Tổng Design hoàn thành</span>
                                <span className={styles.designMetricValue}>{designTasks.length}</span>
                            </div>
                            <div className={styles.designMetric}>
                                <span className={styles.designMetricLabel}>Điểm Design đạt được</span>
                                <span className={styles.designMetricValue}>
                                    {designTasks.reduce((acc, t) => {
                                        const config = designTaskTypes.find(dt => dt.name === t.type);
                                        return acc + (parseFloat(config?.points) || 0);
                                    }, 0)}
                                </span>
                            </div>
                        </div>
                        <div className={styles.designChartSection}>
                            <h5 className={styles.subTitle}>Phân bổ loại hình Design</h5>
                            <DesignPieChart data={designTypeDist} />
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        Phân bổ theo loại Task Support (Trong kỳ)
                    </div>
                    <div className={styles.typeDistributionContainer}>
                        {typeDistribution.length > 0 ? (
                            typeDistribution.map((item, i) => (
                                <div key={i} className={styles.distRow}>
                                    <div className={styles.distInfo}>
                                        <span className={styles.distName}>{item.name}</span>
                                        <span className={styles.distCount}>{item.count} task</span>
                                    </div>
                                    <div className={styles.distBarWrapper}>
                                        <div
                                            className={styles.distBar}
                                            style={{
                                                width: `${(item.count / receivedTasksInPeriod.length) * 100}%`,
                                                backgroundColor: `hsl(${210 + (i * 40)}, 70%, 50%)`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyData}>Không có dữ liệu trong kỳ này.</div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.card} style={{ marginTop: '24px' }}>
                <div className={styles.cardTitle}>
                    Thông tin bổ sung
                </div>
                <div className={styles.additionalStats}>
                    <div className={styles.statBox}>
                        <span className={styles.statLabel}>Tiệm đã hỗ trợ (Support)</span>
                        <span className={styles.statValue}>{new Set(receivedTasksInPeriod.map(t => t.name)).size}</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statLabel}>Trung bình hoàn thành</span>
                        <span className={styles.statValue}>
                            {completedInPeriod.length > 0 ? (completedInPeriod.length / Math.ceil((range.end - range.start) / (1000 * 60 * 60 * 24))).toFixed(1) : 0}
                            <small> task/ngày</small>
                        </span>
                    </div>
                </div>
            </div>

        </div >
    );
};

export default Reports;
