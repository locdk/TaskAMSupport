import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Search,
    Plus,
    Bell,
    Settings,
    HelpCircle,
    Filter,
    ChevronDown,
    ChevronUp,
    MoreHorizontal,
    Calendar,
    AlertCircle,
    User,
    Check,
    AlertTriangle,
    Clock,
    Users,
    Trash2,
    Edit2,
    Copy,
    RefreshCcw,
    CheckCircle2,
    RotateCcw,
    X,
    MoreVertical,
    CheckCheck
} from 'lucide-react';
import styles from './TaskManagement.module.css';
import CreateTaskModal from '../components/Modal/CreateTaskModal';
import NotificationPanel from '../components/Notification/NotificationPanel';
import TaskToast from '../components/UI/TaskToast';
import { useAppState } from '../context/AppStateContext';


const TaskManagement = () => {
    const {
        tasks = [],
        personnel = [],
        attendance = [],
        updateTask,
        deleteTask,
        permanentlyDeleteTask,
        restoreTask,
        taskStatuses = [],
        taskPriorities = [],
        taskTypes = [],
        settings = {},
        notifications = [],
        markNotificationAsRead,
        showToast,
        user,
        canDo
    } = useAppState();
    const normalizedRole = (user?.role || '').trim().toLowerCase();
    const isAdmin = normalizedRole === 'admin';
    const userIsManager = normalizedRole === 'manager' || normalizedRole === 'admin' || canDo('tasks.delete_log');

    const [activeTab, setActiveTab] = useState('my'); // 'my', 'team', 'overdue', 'completed', 'logs'
    const [selectedAssignee, setSelectedAssignee] = useState(null); // Filter by assignee ID
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [openDropdown, setOpenDropdown] = useState(null); // { taskId, field }
    const [commentDrafts, setCommentDrafts] = useState({}); // { taskId: text }
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [copiedId, setCopiedId] = useState(null); // For delete confirmation modal
    const [deleteReason, setDeleteReason] = useState('');
    const [editingTaskId, setEditingTaskId] = useState(null); // Task ID being edited in detail view
    const [draftTask, setDraftTask] = useState(null); // { name, content } placeholder during edit
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);



    const location = useLocation();

    const myNotifications = useMemo(() => {
        const currentUserEmail = user?.email || '';
        return notifications.filter(n => !n.targetUserEmail || n.targetUserEmail.toLowerCase() === currentUserEmail.toLowerCase());
    }, [notifications, user]);

    const isTaskAssignedToMe = useCallback((task) => {
        if (!task || !user) return false;

        const cEmail = (user?.email || '').toLowerCase();
        const uName = (user?.name || '').trim().toLowerCase();
        const uId = (user?.id || '').toLowerCase();
        const ePrefix = cEmail.split('@')[0];

        const getStr = (val) => {
            if (!val) return '';
            if (typeof val === 'string') return val.trim().toLowerCase();
            if (val.name) return val.name.trim().toLowerCase();
            if (val.id) return val.id.toLowerCase();
            return '';
        };

        const isUserMatch = (val) => {
            const v = getStr(val);
            if (!v) return false;
            if (uId && v === uId) return true;
            if (uName) {
                if (v.includes(uName)) return true;
                const nameParts = uName.split(/\s+/).filter(p => p.length > 2);
                for (const p of nameParts) if (v.includes(p)) return true;
                const vParts = v.split(/\s+/).filter(p => p.length > 2);
                for (const p of vParts) if (uName.includes(p)) return true;
            }
            if (v === cEmail || (ePrefix && (v.includes(ePrefix) || ePrefix.includes(v)))) return true;
            if (v === 'nancy' && (cEmail.includes('nancy') || uName.includes('nancy'))) return true;
            return false;
        };

        const assigneeEmail = (task.assignee?.email || '').toLowerCase();
        return isUserMatch(task.am) ||
            isUserMatch(task.support) ||
            isUserMatch(task.assignee) ||
            assigneeEmail === cEmail;
    }, [user]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const taskId = params.get('id');
        const tabParam = params.get('tab');
        const searchParam = params.get('search');

        // Handle search from URL
        if (searchParam) {
            setSearchTerm(searchParam);
        }

        // Handle tab navigation from URL
        if (tabParam) {
            const validTabs = ['my', 'team', 'overdue', 'completed', 'logs'];
            if (validTabs.includes(tabParam)) {
                setActiveTab(tabParam);
            }
        } else if (searchParam) {
            // Default to 'team' (all) tab if searching and no specific tab requested
            setActiveTab('team');
        }
        // Default tab is 'my' for all users (set in useState above)

        if (taskId && tasks.length > 0) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                setExpandedTaskId(taskId);

                // Determine appropriate tab if not explicitly set by URL params
                if (!tabParam) {
                    if (task.deletePending && userIsManager) {
                        setActiveTab('logs');
                    } else if (task.status === 'Hoàn thành') {
                        setActiveTab('completed');
                    } else if (isTaskAssignedToMe(task)) {
                        setActiveTab('my');
                    } else {
                        setActiveTab('team');
                    }
                }
            }
        }
    }, [location.search, tasks, user, isAdmin, userIsManager, normalizedRole, isTaskAssignedToMe]);

    // Scroll to task when expanded via URL
    useEffect(() => {
        if (expandedTaskId) {
            const timer = setTimeout(() => {
                const element = document.getElementById(`task-${expandedTaskId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [expandedTaskId]);

    const toggleExpand = (taskId) => {
        setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    };

    const handleAddComment = (taskId) => {
        const draft = commentDrafts[taskId] || '';
        if (!draft.trim()) return;

        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} - ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;

        const newComment = {
            id: Date.now(),
            author: user?.name || 'User',
            text: draft,
            time: timeStr
        };

        const updatedComments = [...(task.comments || []), newComment];
        updateTask(taskId, { comments: updatedComments });

        // Clear draft for this task
        setCommentDrafts(prev => ({ ...prev, [taskId]: '' }));
    };

    const confirmDeleteTask = () => {
        if (taskToDelete) {
            deleteTask(taskToDelete.id, deleteReason);
            setTaskToDelete(null);
            setDeleteReason('');
        }
    };

    const canDeleteTask = (task) => {
        const userEmail = (user?.email || '').toLowerCase();
        const userRole = user?.role; // e.g., 'Manager', 'Admin'

        if (!userEmail || !userRole) return false;

        // Only creator or Manager/Admin OR has granular permission
        const role = (userRole || '').trim().toLowerCase();
        return (task.createdBy?.toLowerCase() === userEmail) || (role === 'manager') || (role === 'admin') || canDo('tasks.delete');
    };

    const canEditTask = (task) => {
        const userEmail = (user?.email || '').toLowerCase();
        const userRole = user?.role;

        if (!userEmail) return false;

        // Admin/Manager or explicit permission
        const role = (userRole || '').trim().toLowerCase();
        if (role === 'manager' || role === 'admin' || canDo('tasks.edit')) return true;

        // Creator or Assignee
        if (task.createdBy?.toLowerCase() === userEmail) return true;
        if (task.assignee?.email?.toLowerCase() === userEmail) return true;

        return false;
    };

    const updateTaskField = (taskId, field, value) => {
        // Ensure value is not undefined
        if (value === undefined) return;



        const updates = { [field]: value };

        // 1. Sync 'assignee' with 'support' name string
        if (field === 'assignee') {
            updates.support = value?.name || '';
        }

        // 2. Sync 'dueDate' with 'deadline' string display (DD/MM/YYYY)
        if (field === 'dueDate' && value) {
            const [year, month, day] = value.split('-');
            if (year && month && day) {
                updates.deadline = `${day}/${month}/${year}`;
            }
        }

        // Task completion logic is now handled in AppStateContext.js updateTask
        updateTask(taskId, updates);
        setOpenDropdown(null);
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = () => setOpenDropdown(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const CustomSelect = ({ value, options, onChange, renderAnchor, field, taskId, containerStyle }) => {
        const isOpen = openDropdown?.taskId === taskId && openDropdown?.field === field;

        return (
            <div className={styles.customSelectWrapper} onClick={(e) => e.stopPropagation()}>
                <div
                    className={`${styles.customSelectAnchor} ${isOpen ? styles.activeAnchor : ''}`}
                    style={containerStyle}
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(isOpen ? null : { taskId, field });
                    }}
                >
                    {renderAnchor(value)}
                    <ChevronDown size={14} className={styles.selectArrow} />
                </div>
                {isOpen && (
                    <div className={styles.dropdownList}>
                        {options.map(opt => {
                            const isString = typeof opt === 'string';


                            // Determine value based on field type
                            let optValue;
                            if (isString) {
                                optValue = opt;
                            } else if (field === 'assignee' || field === 'filter-assignee') {
                                optValue = opt.id; // Use unique ID instead of avatar or whole object
                            } else {
                                optValue = opt.name;
                            }
                            const isActive = value === optValue;

                            return (
                                <div
                                    key={isString ? opt : opt.name}
                                    className={`${styles.dropdownItem} ${isActive ? styles.dropdownItemActive : ''}`}
                                    onClick={() => onChange(optValue)}
                                >
                                    {field === 'status' && (
                                        (isString ? opt : opt.name) === 'Hoàn thành' ? <Check size={12} strokeWidth={3} /> : <span className={styles.itemDot} style={{ backgroundColor: isString ? getStatusDotColor(opt) : (opt.color || '#fff') }}></span>
                                    )}
                                    {field === 'type' && (
                                        <span className={styles.itemDot} style={{ backgroundColor: isString ? '#fff' : (opt.color || '#fff') }}></span>
                                    )}
                                    {field === 'priority' && (
                                        <span className={styles.itemDot} style={{ backgroundColor: isString ? '#fff' : (opt.color || '#fff') }}></span>
                                    )}
                                    {(field === 'assignee' || field === 'filter-assignee') && (
                                        opt.avatar ? <img src={opt.avatar} alt="" className={styles.assigneeImg} /> : <div className={styles.noAssignee}><User size={12} /></div>
                                    )}
                                    <span>{isString ? opt : opt.name}</span>
                                    {!isString && opt.activeCount !== undefined && opt.activeCount > 0 && (
                                        <span style={{
                                            marginLeft: 'auto',
                                            background: '#ff4d4f',
                                            color: '#fff',
                                            fontSize: '11px',
                                            padding: '2px 6px',
                                            borderRadius: '10px',
                                            fontWeight: 'bold',
                                            minWidth: '20px',
                                            textAlign: 'center',
                                            lineHeight: '1.2'
                                        }}>
                                            {opt.activeCount}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const getStatusDotColor = (statusName) => {
        const status = taskStatuses.find(s => s.name === statusName) ||
            taskStatuses.find(s => s.id === statusName);
        return status ? status.color : '#8c8c8c';
    };

    // Helper: Check if user is working on a specific YYYY-MM-DD date
    const checkUserAvailability = (user, dateStr) => {
        if (!user || !dateStr) return true; // Can't check

        const attRecord = (attendance || []).find(a => a.date === dateStr && a.userId === user.id);
        if (attRecord) {
            return attRecord.status === 'Work';
        }

        // Fallback to workDays
        const [y, m, d] = dateStr.split('-').map(Number);
        const dObj = new Date(y, m - 1, d);
        const dayMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const dayCode = dayMap[dObj.getDay()];
        const workDays = user.workDays || [];

        if (workDays.length > 0) {
            return workDays.includes(dayCode);
        }
        return false; // Default OFF if no info
    };

    const renderStatusBadge = (task) => {
        const isDone = task.status === 'Hoàn thành';

        const statusConfig = taskStatuses.find(s => s.name === task.status) ||
            taskStatuses.find(s => s.id === task.status) || {};
        let statusClass = styles.statusAnchor;

        return (
            <CustomSelect
                taskId={task.id}
                field="status"
                value={task.status}
                options={taskStatuses}
                onChange={(val) => updateTaskField(task.id, 'status', val)}
                containerStyle={{
                    color: statusConfig.color || '#8c8c8c',
                    backgroundColor: (statusConfig.color || '#8c8c8c') + '15',
                    border: `1px solid ${(statusConfig.color || '#8c8c8c')}40`,
                    padding: '4px 8px',
                    borderRadius: '6px'
                }}
                renderAnchor={(val) => (
                    <div className={statusClass}>
                        {val}
                    </div>
                )}
            />
        );
    };

    const handleStartEdit = (task) => {
        if (!canEditTask(task)) {
            showToast('Bạn không có quyền chỉnh sửa task này.', 'Lỗi', { type: 'error' });
            return;
        }
        setEditingTaskId(task.id);
        setDraftTask({ name: task.name, content: task.content });
    };

    const handleCancelEdit = () => {
        setEditingTaskId(null);
        setDraftTask(null);
    };

    const handleCopy = (e, text, id) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSaveEdit = () => {
        if (!draftTask || !editingTaskId) return;

        updateTask(editingTaskId, {
            name: draftTask.name,
            content: draftTask.content
        });

        setEditingTaskId(null);
        setDraftTask(null);
    };

    const truncateContent = (text, wordLimit = 15) => {
        if (!text) return '';
        const words = text.split(/\s+/);
        if (words.length <= wordLimit) return text;
        return words.slice(0, wordLimit).join(' ') + '...';
    };

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const renderTextWithLinks = (text) => {
        if (!text) return null;

        // Regex to match URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        // Split text by URLs and line breaks
        const parts = text.split(urlRegex);

        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.autoLink}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    const isOverdue = (dateStr) => {
        if (!dateStr) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(dateStr);
        return taskDate < today;
    };

    const renderPriority = (task) => {
        // Robust lookup: Try name, id, then badge to handle renamed priorities
        const priorityConfig = taskPriorities.find(p => p.name === task.priority) ||
            taskPriorities.find(p => p.id === task.priority) ||
            taskPriorities.find(p => p.badge === task.priority) || {};

        let pClass = `${styles.priorityTag} ${styles.priorityAnchor}`;

        if (task.deletePending) {
            return (
                <div className={pClass} style={{
                    backgroundColor: (priorityConfig.color || '#8c8c8c') + '15',
                    color: priorityConfig.color || '#8c8c8c',
                    border: `1px solid ${(priorityConfig.color || '#8c8c8c')}40`,
                    padding: '4px 8px',
                    borderRadius: '20px'
                }}>
                    {task.priority}
                </div>
            );
        }

        return (
            <CustomSelect
                taskId={task.id}
                field="priority"
                value={task.priority}
                options={taskPriorities}
                onChange={(val) => updateTaskField(task.id, 'priority', val)}
                containerStyle={{
                    backgroundColor: (priorityConfig.color || '#8c8c8c') + '15',
                    color: priorityConfig.color || '#8c8c8c',
                    border: `1px solid ${(priorityConfig.color || '#8c8c8c')}40`,
                    padding: '4px 8px',
                    borderRadius: '20px'
                }}
                renderAnchor={(val) => (
                    <div className={pClass}>
                        {val}
                    </div>
                )}
            />
        );
    };

    const filteredTasks = useMemo(() => {
        const matchesMyTask = (t) => {
            if (!t || t.deletePending) return false;

            // Only show active tasks in 'My Tasks' tab
            if (activeTab === 'my' && t.status === 'Hoàn thành') return false;

            return isTaskAssignedToMe(t);
        };

        let tasksToReturn = [];

        switch (activeTab) {
            case 'my':
                tasksToReturn = tasks.filter(t => matchesMyTask(t));
                break;
            case 'team':
                // All tasks AND not completed
                tasksToReturn = tasks.filter(t => t.status !== 'Hoàn thành');
                break;
            case 'overdue':
                // Tasks that are overdue (past due date and not completed)
                tasksToReturn = tasks.filter(t => {
                    if (!t.dueDate || t.status === 'Hoàn thành') return false;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const taskDate = new Date(t.dueDate);
                    const isOverdue = taskDate < today;
                    return isOverdue;
                });
                break;
            case 'completed':
                // Only completed tasks
                tasksToReturn = tasks.filter(t => t.status === 'Hoàn thành');
                break;
            case 'logs':
                // Tasks pending deletion
                tasksToReturn = tasks.filter(t => t.deletePending === true);
                break;
            default:
                tasksToReturn = tasks.filter(t => t.status !== 'Hoàn thành');
        }

        // Hide pending deletion tasks from normal tabs
        if (activeTab !== 'logs') {
            tasksToReturn = tasksToReturn.filter(t => !t.deletePending);
        }

        // Apply Assignee Filter if selected (BUT NOT for 'my' tab as it contradicts the tab's purpose and the UI hides the filter)
        if (selectedAssignee && activeTab !== 'my') {
            tasksToReturn = tasksToReturn.filter(t => t.assignee?.id === selectedAssignee);
        }

        // Hide design tasks from team tabs, but keep them in My Tasks
        if (activeTab !== 'my') {
            tasksToReturn = tasksToReturn.filter(t => (t.source || '').toLowerCase() !== 'design');
        }

        return tasksToReturn;
    }, [activeTab, tasks, user, selectedAssignee, isTaskAssignedToMe]);

    // Count tasks for each tab (using same logic as above)
    const { myTasksCount, teamTasksCount, overdueTasksCount, completedTasksCount, deletedTasksCount } = useMemo(() => {
        const matchesMyTaskCountFilter = (t) => {
            if (!t || t.deletePending || t.status === 'Hoàn thành') return false;

            const cEmail = (user?.email || '').toLowerCase();
            const uName = (user?.name || '').trim().toLowerCase();
            const uId = (user?.id || '').toLowerCase();
            const ePrefix = cEmail.split('@')[0];

            const getStr = (val) => {
                if (!val) return '';
                if (typeof val === 'string') return val.trim().toLowerCase();
                if (val.name) return val.name.trim().toLowerCase();
                if (val.id) return val.id.toLowerCase();
                return '';
            };

            const isUserMatch = (val) => {
                const v = getStr(val);
                if (!v) return false;
                if (uId && v === uId) return true;
                if (uName) {
                    if (v.includes(uName)) return true;

                    const nameParts = uName.split(/\s+/).filter(p => p.length > 2);
                    for (const p of nameParts) if (v.includes(p)) return true;
                }
                if (v === cEmail || (ePrefix && v === ePrefix)) return true;
                if (v === 'nancy' && (cEmail.includes('nancy') || uName.includes('nancy'))) return true;
                return false;
            };

            const assigneeEmail = (t.assignee?.email || '').toLowerCase();

            return isUserMatch(t.am) ||
                isUserMatch(t.support) ||
                isUserMatch(t.assignee) || /* Handle assignee as string or object */
                assigneeEmail === cEmail;
        };

        const myTasksCount = tasks.filter(t => matchesMyTaskCountFilter(t)).length;

        const teamTasksCount = tasks.filter(t => (t.source || '').toLowerCase() !== 'design' && !t.deletePending && t.status !== 'Hoàn thành').length;

        const overdueTasksCount = tasks.filter(t => {
            if ((t.source || '').toLowerCase() === 'design' || t.deletePending || !t.dueDate || t.status === 'Hoàn thành') return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const taskDate = new Date(t.dueDate);
            const isOverdue = taskDate < today;
            return isOverdue;
        }).length;

        const completedTasksCount = tasks.filter(t => {
            if ((t.source || '').toLowerCase() === 'design' || t.deletePending || t.status !== 'Hoàn thành') return false;
            return true;
        }).length;

        const deletedTasksCount = tasks.filter(t => (t.source || '').toLowerCase() !== 'design' && t.deletePending).length;

        return { myTasksCount, teamTasksCount, overdueTasksCount, completedTasksCount, deletedTasksCount };
    }, [tasks, user]);



    const groups = useMemo(() => {
        let groups = [];
        if (activeTab === 'completed') {
            // Group by Month/Year from completedAt or completedTimestamp
            const months = [...new Set(filteredTasks.map(t => {
                if (t.completedTimestamp) {
                    const date = new Date(t.completedTimestamp);
                    return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                }
                // Fallback for old data: "DD/MM/YYYY" or "HH:mm DD/MM/YYYY"
                if (t.completedAt) {
                    const parts = t.completedAt.split(' ');
                    const datePart = parts.length > 1 ? parts[1] : parts[0];
                    const [d, m, y] = datePart.split('/');
                    if (m && y) return `${m}/${y}`;
                }
                return 'Khác';
            }))];

            // Sort months descending (Newest first)
            months.sort((a, b) => {
                if (a === 'Khác') return 1;
                if (b === 'Khác') return -1;
                const [m1, y1] = a.split('/').map(Number);
                const [m2, y2] = b.split('/').map(Number);
                if (y1 !== y2) return y2 - y1;
                return m2 - m1;
            });

            groups = months.map(month => ({
                id: month,
                label: month === 'Khác' ? 'Thời gian khác' : `Tháng ${month}`,
                type: 'month',
                value: month,
                color: '#52c41a' // Green for success
            }));
        } else {
            groups = taskStatuses
                .filter(s => {
                    if (activeTab === 'logs') {
                        return true;
                    } else {
                        return s.name !== 'Hoàn thành';
                    }
                })
                .map(s => ({
                    id: s.id,
                    label: s.name,
                    statusMatch: [s.name],
                    type: 'status',
                    color: s.color
                }));
        }
        return groups;
    }, [activeTab, filteredTasks, taskStatuses]);

    // List of personnel from allowed teams (MKT Support and Designer)
    const { supportPersonnel, filteredSupportPersonnel, assigneeOptions } = useMemo(() => {
        const supportPersonnel = (personnel || []).filter(p => {
            if (!p) return false;
            // Only show personnel who have set up their work schedule
            if (!p.workDays || p.workDays.length === 0) return false;

            const pTeam = (p.parentTeam || p.team || '').toLowerCase();
            return pTeam === 'mkt support' || pTeam === 'designer';
        });

        const isAmUser = user?.parentTeam === 'AM';
        const userTeam = user?.team;

        const filteredSupportPersonnel = supportPersonnel.filter(s => {
            if (!isAmUser || !userTeam || userTeam === 'All Team') return true;
            if (s.team === 'All Team') return true;
            return s.team === userTeam;
        });

        // Calculate active tasks per personnel
        const activeTaskCounts = {};
        (tasks || []).forEach(t => {
            if (t.status !== 'Hoàn thành' && !t.deletePending && t.assignee?.id) {
                activeTaskCounts[t.assignee.id] = (activeTaskCounts[t.assignee.id] || 0) + 1;
            }
        });

        // Filter Assignee Options - Only Show Allowed Support
        const assigneeOptions = [
            { id: null, name: 'Tất cả thành viên', avatar: null },
            ...filteredSupportPersonnel.map(p => ({
                ...p,
                activeCount: activeTaskCounts[p.id] || 0
            }))
        ];

        return { supportPersonnel, filteredSupportPersonnel, assigneeOptions };
    }, [personnel, user, tasks]);

    // Grid column configuration
    const isCompletedTab = activeTab === 'completed';
    const isLogsTab = activeTab === 'logs';

    const gridStyle = {
        gridTemplateColumns: isLogsTab
            ? '3.5fr 0.8fr 1.2fr 1fr 1fr 1fr 1fr 32px'
            : isCompletedTab
                ? '3.5fr 0.8fr 1fr 1fr 1fr 1fr 1fr 32px'
                : '3.5fr 0.8fr 1.2fr 1fr 1fr 1fr 32px'
    };

    return (
        <div className={styles.container}>
            {/* Top Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.leftFilters}>
                    <button
                        className={`${styles.filterTab} ${styles.myTab} ${activeTab === 'my' ? styles.active : ''}`}
                        onClick={() => setActiveTab('my')}
                    >
                        Task của tôi ({myTasksCount})
                    </button>
                    <button
                        className={`${styles.filterTab} ${styles.teamTab} ${activeTab === 'team' ? styles.active : ''}`}
                        onClick={() => setActiveTab('team')}
                    >
                        Tổng Task ({teamTasksCount})
                    </button>
                    <button
                        className={`${styles.filterTab} ${styles.dangerTab} ${activeTab === 'overdue' ? styles.active : ''}`}
                        onClick={() => setActiveTab('overdue')}
                    >
                        Task quá hạn ({overdueTasksCount})
                    </button>
                    <button
                        className={`${styles.filterTab} ${styles.completedTab} ${activeTab === 'completed' ? styles.active : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Task đã hoàn thành ({completedTasksCount})
                    </button>
                    {userIsManager && (
                        <button
                            className={`${styles.filterTab} ${styles.logTab} ${activeTab === 'logs' ? styles.active : ''}`}
                            onClick={() => setActiveTab('logs')}
                        >
                            <Trash2 size={14} style={{ marginRight: 4 }} />
                            Nhật ký xóa ({deletedTasksCount})
                        </button>
                    )}
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


                    <button
                        className={styles.iconBtn}
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    >
                        <Bell size={20} />
                        {myNotifications.filter(n => !n.isRead).length > 0 && (
                            <span className={styles.notificationBadge}>
                                {myNotifications.filter(n => !n.isRead).length}
                            </span>
                        )}
                    </button>

                    <div className={styles.buttonGroup}>
                        {/* Assignee Filter */}
                        {activeTab !== 'my' && (
                            <CustomSelect
                                taskId="filter-assignee"
                                field="filter-assignee"
                                value={selectedAssignee}
                                top={true}
                                options={assigneeOptions}
                                onChange={(id) => setSelectedAssignee(id)}
                                renderAnchor={(val) => {
                                    const selectedUser = assigneeOptions.find(p => p.id === val);
                                    return (
                                        <div className={styles.assigneeFilterAnchor}>
                                            {selectedUser ? (
                                                <>
                                                    {selectedUser.avatar ? <img src={selectedUser.avatar} className={styles.assigneeImg} alt="" /> : <div className={styles.noAssignee}><User size={12} /></div>}
                                                    <span>{selectedUser.name}</span>
                                                    {selectedUser.activeCount !== undefined && selectedUser.activeCount > 0 && (
                                                        <span style={{
                                                            marginLeft: '8px',
                                                            background: '#ff4d4f',
                                                            color: '#fff',
                                                            fontSize: '11px',
                                                            padding: '2px 6px',
                                                            borderRadius: '10px',
                                                            fontWeight: 'bold',
                                                            minWidth: '20px',
                                                            textAlign: 'center',
                                                            lineHeight: '1.2'
                                                        }}>
                                                            {selectedUser.activeCount}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <div className={styles.noAssignee}><Users size={14} /></div>
                                                    <span>Tất cả thành viên</span>
                                                </>
                                            )}
                                        </div>
                                    )
                                }}
                            />
                        )}

                        <button className={styles.addTaskBtn} onClick={() => setIsModalOpen(true)}>
                            <Plus size={16} />
                            Tạo Task Mới
                        </button>
                    </div>
                </div>
            </div>

            {/* List Header */}
            <div className={styles.listHeader} style={gridStyle}>
                <div className={styles.hInfo}>THÔNG TIN TASK</div>
                <div className={styles.hPriority}>ƯU TIÊN</div>
                <div className={styles.hAssignee}>NGƯỜI LÀM</div>
                <div className={styles.hType}>LOẠI TASK</div>
                <div className={styles.hStatus}>TRẠNG THÁI</div>
                <div className={styles.hDate}>NGÀY THỰC HIỆN</div>
                {isCompletedTab && <div className={styles.hDateDone}>NGÀY HOÀN THÀNH</div>}
                {activeTab === 'logs' && <div className={styles.hDateDeleted}>NGÀY Y/C XÓA</div>}
                <div className={styles.hExpand}></div>
            </div>

            {/* Task Groups */}
            <div className={styles.taskGroups}>
                {groups.map(group => {
                    let groupTasks = [];

                    if (group.type === 'month') {
                        // Filter by month
                        groupTasks = filteredTasks.filter(t => {
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
                            return tMonth === group.value && (t.name || '').toLowerCase().includes(searchTerm.toLowerCase());
                        });

                        // Sort by completedTimestamp descending (Newest completed first)
                        groupTasks.sort((a, b) => {
                            const t1 = a.completedTimestamp || 0;
                            const t2 = b.completedTimestamp || 0;
                            return t2 - t1;
                        });

                    } else {
                        // Filter by Status (existing logic)
                        groupTasks = filteredTasks.filter(t =>
                            group.statusMatch.includes(t.status) &&
                            (t.name || '').toLowerCase().includes(searchTerm.toLowerCase())
                        );
                    }
                    // Don't show empty groups if needed, or show them. Screenshot shows all.

                    return (
                        <div key={group.id} className={styles.group}>
                            {activeTab !== 'logs' && (
                                <div className={styles.groupHeader}>
                                    <span className={styles.groupDot} style={{ backgroundColor: group.color }}></span>
                                    <span className={styles.groupTitle}>{group.label}</span>
                                    <span className={styles.taskCount}>{groupTasks.length}</span>
                                </div>
                            )}

                            <div className={styles.groupContent}>
                                {groupTasks.map(task => (
                                    <React.Fragment key={task.id}>
                                        <div
                                            id={`task-${task.id}`}
                                            className={`${styles.taskRow} ${task.isDone ? styles.taskDone : ''} ${expandedTaskId === task.id ? styles.expandedRow : ''} ${task.deletePending ? styles.deletePendingRow : ''}`}
                                            onClick={() => toggleExpand(task.id)}
                                            style={gridStyle}
                                        >
                                            <div className={styles.cellInfo}>
                                                <div className={styles.cellName} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {task.name}
                                                    {expandedTaskId === task.id && (
                                                        <button
                                                            onClick={(e) => handleCopy(e, task.name, `name-${task.id}`)}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                padding: '4px',
                                                                borderRadius: '4px',
                                                                color: copiedId === `name-${task.id}` ? '#52c41a' : 'var(--text-tertiary)',
                                                                backgroundColor: 'transparent',
                                                                border: 'none',
                                                                cursor: 'pointer'
                                                            }}
                                                            title="Copy tên tiệm"
                                                        >
                                                            {copiedId === `name-${task.id}` ? <Check size={14} /> : <Copy size={14} />}
                                                        </button>
                                                    )}
                                                </div>
                                                <div className={styles.cellContentText}>{truncateContent(task.content)}</div>
                                            </div>
                                            <div className={styles.cellPriority} onClick={(e) => !task.deletePending && e.stopPropagation()}>
                                                {renderPriority(task)}
                                            </div>
                                            <div className={styles.cellAssignee} onClick={(e) => !task.deletePending && e.stopPropagation()}>
                                                {task.deletePending && activeTab === 'logs' ? (
                                                    <div className={styles.assigneeAnchor}>
                                                        {task.assignee?.avatar ? (
                                                            <img src={task.assignee.avatar} alt="assignee" className={styles.assigneeImg} />
                                                        ) : (
                                                            <div className={styles.noAssignee}><User size={12} /></div>
                                                        )}
                                                        <span>{task.assignee?.name || 'Chưa gán'}</span>
                                                    </div>
                                                ) : (
                                                    <CustomSelect
                                                        taskId={task.id}
                                                        field="assignee"
                                                        value={task.assignee?.id}
                                                        options={filteredSupportPersonnel}
                                                        onChange={(id) => {
                                                            const p = filteredSupportPersonnel.find(u => u.id === id);

                                                            // Attendance Check
                                                            if (p) {
                                                                // Shift logic: 6AM today to 6AM tomorrow belongs to "today"
                                                                const effectiveDate = new Date(Date.now() - 6 * 60 * 60 * 1000);
                                                                const checkDay = String(effectiveDate.getDate()).padStart(2, '0');
                                                                const checkMonth = String(effectiveDate.getMonth() + 1).padStart(2, '0');
                                                                const checkYear = effectiveDate.getFullYear();
                                                                const checkDateStr = `${checkYear}-${checkMonth}-${checkDay}`;

                                                                // 1. Determine if we need to check "Today" (Current Shift)
                                                                // If Due Date is set AND it's different from Today, we SKIP today's check
                                                                // expecting the user is planning for the future.
                                                                const isFuturePlanning = task.dueDate && task.dueDate !== checkDateStr;

                                                                if (!isFuturePlanning) {
                                                                    if (!checkUserAvailability(p, checkDateStr)) {
                                                                        showToast(`Nhân sự ${p.name} đang OFF ngày ${checkDay}/${checkMonth}. Vui lòng chọn nhân sự khác hoặc đặt ngày thực hiện khác.`, 'Cảnh báo');
                                                                        return;
                                                                    }
                                                                }

                                                                // 2. Check Task Due Date (Execution Date)
                                                                if (task.dueDate && !checkUserAvailability(p, task.dueDate)) {
                                                                    showToast(`Nhân sự ${p.name} có lịch nghỉ vào ngày thực hiện (${formatDateDisplay(task.dueDate)}).`, 'Cảnh báo');
                                                                    return;
                                                                }
                                                            }

                                                            // Create a minimal object for persistence to avoid payload size limits
                                                            const minimalAssignee = p ? {
                                                                ...p,
                                                                avatar: '' // Strip large avatar string for storage
                                                            } : null;
                                                            updateTaskField(task.id, 'assignee', minimalAssignee);
                                                        }}
                                                        renderAnchor={(id) => {
                                                            const p = supportPersonnel.find(u => u.id === id);
                                                            const avatar = p?.avatar;
                                                            const name = p?.name || 'Chưa gán';
                                                            return (
                                                                <div className={styles.assigneeAnchor}>
                                                                    {avatar ? (
                                                                        <img src={avatar} alt="assignee" className={styles.assigneeImg} />
                                                                    ) : (
                                                                        <div className={styles.noAssignee}><User size={12} /></div>
                                                                    )}
                                                                    <span>{name}</span>
                                                                </div>
                                                            );
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <div className={styles.cellType} onClick={(e) => !task.deletePending && e.stopPropagation()}>
                                                {task.deletePending && activeTab === 'logs' ? (
                                                    <span className={styles.typeAnchor} style={{
                                                        color: taskTypes.find(t => t.name === task.type)?.color || '#8c8c8c',
                                                        backgroundColor: (taskTypes.find(t => t.name === task.type)?.color || '#8c8c8c') + '20',
                                                        border: `1px solid ${(taskTypes.find(t => t.name === task.type)?.color || '#8c8c8c')}40`,
                                                        padding: '6px 12px',
                                                        borderRadius: '20px'
                                                    }}>{task.type}</span>
                                                ) : (
                                                    <CustomSelect
                                                        taskId={task.id}
                                                        field="type"
                                                        value={task.type}
                                                        options={taskTypes}
                                                        onChange={(val) => updateTaskField(task.id, 'type', val)}
                                                        containerStyle={{
                                                            color: taskTypes.find(t => t.name === task.type)?.color || '#8c8c8c',
                                                            backgroundColor: (taskTypes.find(t => t.name === task.type)?.color || '#8c8c8c') + '20',
                                                            border: `1px solid ${(taskTypes.find(t => t.name === task.type)?.color || '#8c8c8c')}40`,
                                                            padding: '6px 12px',
                                                            borderRadius: '20px'
                                                        }}
                                                        renderAnchor={(val) => {
                                                            return <span className={styles.typeAnchor}>{val}</span>
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <div className={styles.cellStatus} onClick={(e) => !task.deletePending && e.stopPropagation()}>
                                                {task.deletePending && activeTab === 'logs' ? (
                                                    <div className={styles.statusBadge} style={{
                                                        color: (taskStatuses.find(s => s.name === task.status) || {}).color || '#8c8c8c',
                                                        backgroundColor: ((taskStatuses.find(s => s.name === task.status) || {}).color || '#8c8c8c') + '15',
                                                        border: `1px solid ${((taskStatuses.find(s => s.name === task.status) || {}).color || '#8c8c8c')}40`,
                                                        padding: '4px 8px',
                                                        borderRadius: '6px'
                                                    }}>
                                                        {task.status}
                                                    </div>
                                                ) : (
                                                    renderStatusBadge(task)
                                                )}
                                            </div>
                                            <div className={styles.cellDate} onClick={(e) => !task.deletePending && e.stopPropagation()}>
                                                {task.deletePending && activeTab === 'logs' ? (
                                                    <div className={styles.dateDisplay}>
                                                        <span>{formatDateDisplay(task.dueDate)}</span>
                                                    </div>
                                                ) : (
                                                    <div className={`${styles.datePickerWrapper} ${isOverdue(task.dueDate) ? styles.overdue : styles.normalDate}`}>
                                                        <input
                                                            type="date"
                                                            className={styles.dateInput}
                                                            value={task.dueDate}
                                                            onChange={(e) => {
                                                                const newDate = e.target.value;
                                                                // Check if Assignee is free on this new Date
                                                                if (task.assignee && newDate) {
                                                                    const fullAssignee = personnel.find(p => p.id === task.assignee.id);
                                                                    if (fullAssignee && !checkUserAvailability(fullAssignee, newDate)) {
                                                                        showToast(`Nhân sự ${fullAssignee.name} có lịch nghỉ vào ngày ${formatDateDisplay(newDate)}.`, 'Cảnh báo');
                                                                        return;
                                                                    }
                                                                }
                                                                updateTaskField(task.id, 'dueDate', newDate);
                                                            }}
                                                        />
                                                        <span>{formatDateDisplay(task.dueDate)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {isCompletedTab && (
                                                <div className={styles.cellDateDone}>
                                                    {task.completedAt || '-'}
                                                </div>
                                            )}
                                            {activeTab === 'logs' && (
                                                <div className={styles.cellDateDeleted}>
                                                    {task.deletedAt || '-'}
                                                </div>
                                            )}
                                            <div className={styles.expandCell}>
                                                <ChevronDown size={14} className={`${styles.expandIcon} ${expandedTaskId === task.id ? styles.iconRotated : ''}`} />
                                            </div>
                                        </div>

                                        {expandedTaskId === task.id && (
                                            <div className={styles.taskDetailContainer}>
                                                <div className={styles.detailBody}>
                                                    <div className={styles.detailMain}>
                                                        <div className={styles.detailSection}>
                                                            {editingTaskId === task.id ? (
                                                                <div className={styles.editForm}>
                                                                    <div className={styles.editGroup}>
                                                                        <label className={styles.detailLabel}>Tên tiệm</label>
                                                                        <input
                                                                            className={styles.editableInput}
                                                                            value={draftTask.name}
                                                                            onChange={(e) => setDraftTask({ ...draftTask, name: e.target.value })}
                                                                        />
                                                                    </div>
                                                                    <div className={styles.editGroup}>
                                                                        <label className={styles.detailLabel}>Nội dung chi tiết</label>
                                                                        <textarea
                                                                            className={styles.editableInput}
                                                                            style={{ minHeight: '120px', resize: 'vertical' }}
                                                                            value={draftTask.content}
                                                                            onChange={(e) => setDraftTask({ ...draftTask, content: e.target.value })}
                                                                        />
                                                                    </div>
                                                                    <div className={styles.editActions}>
                                                                        <button className={styles.btnSave} onClick={handleSaveEdit}>Lưu</button>
                                                                        <button className={styles.btnCancel} onClick={handleCancelEdit}>Hủy</button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <h5 className={styles.detailLabel} style={{ marginBottom: 0 }}>Nội dung chi tiết</h5>
                                                                        <div style={{ display: 'flex', gap: '8px' }}>
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
                                                                            <button
                                                                                className={styles.btnEdit}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleStartEdit(task);
                                                                                }}
                                                                            >
                                                                                <Edit2 size={14} /> Sửa
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div className={styles.fullContent}>
                                                                        {renderTextWithLinks(task.content)}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        <div className={styles.detailSection}>
                                                            <h5 className={styles.detailLabel}>Ghi chú & Thảo luận</h5>

                                                            {/* Comments List */}
                                                            {task.comments && task.comments.length > 0 && (
                                                                <div className={styles.commentsList}>
                                                                    {task.comments.map(c => (
                                                                        <div key={c.id} className={styles.commentItem}>
                                                                            <div className={styles.commentHeader}>
                                                                                <span className={styles.commentAuthor}>{c.author}</span>
                                                                                <span className={styles.commentTime}>{c.time}</span>
                                                                            </div>
                                                                            <div className={styles.commentText}>
                                                                                {renderTextWithLinks(c.text)}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <div className={styles.editorBox}>
                                                                <textarea
                                                                    placeholder="Nhập ghi chú hoặc phản hồi tại đây..."
                                                                    className={styles.commentEditor}
                                                                    value={commentDrafts[task.id] || ''}
                                                                    onChange={(e) => {
                                                                        const text = e.target.value;
                                                                        setCommentDrafts(prev => ({ ...prev, [task.id]: text }));
                                                                    }}
                                                                ></textarea>
                                                                <div className={styles.editorActions}>
                                                                    <button
                                                                        className={styles.btnSend}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleAddComment(task.id);
                                                                        }}
                                                                    >
                                                                        Gửi ghi chú
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={styles.detailSidebar}>
                                                        <div className={styles.sidebarSection}>
                                                            <h5 className={styles.detailLabel}>Nhân sự phụ trách</h5>
                                                            <div className={styles.actorItem}>
                                                                <span className={styles.actorRole}>AM phụ trách:</span>
                                                                <div
                                                                    className={styles.editableField}
                                                                    style={{ position: 'relative', display: 'inline-block' }}
                                                                >
                                                                    <span
                                                                        className={styles.actorName}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenDropdown(openDropdown?.taskId === task.id && openDropdown?.field === 'am'
                                                                                ? null
                                                                                : { taskId: task.id, field: 'am' });
                                                                        }}
                                                                        style={{
                                                                            cursor: 'pointer',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '4px',
                                                                            transition: 'background 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                    >
                                                                        {task.am || 'Chưa gán'}
                                                                        <ChevronDown size={14} style={{ opacity: 0.6 }} />
                                                                    </span>
                                                                    {openDropdown?.taskId === task.id && openDropdown?.field === 'am' && (
                                                                        <div
                                                                            className={styles.dropdown}
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: '100%',
                                                                                left: 0,
                                                                                zIndex: 1000,
                                                                                background: 'var(--bg-card)',
                                                                                border: '1px solid var(--border)',
                                                                                borderRadius: '8px',
                                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                                                minWidth: '200px',
                                                                                maxHeight: '250px',
                                                                                overflowY: 'auto',
                                                                                marginTop: '4px'
                                                                            }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            {personnel
                                                                                .filter(p => p.parentTeam === 'AM' && !p.name.includes('Tina'))
                                                                                .map(am => (
                                                                                    <div
                                                                                        key={am.id}
                                                                                        className={styles.dropdownItem}
                                                                                        style={{
                                                                                            padding: '10px 12px',
                                                                                            cursor: 'pointer',
                                                                                            borderBottom: '1px solid var(--border)',
                                                                                            transition: 'background 0.2s'
                                                                                        }}
                                                                                        onClick={() => {
                                                                                            updateTask(task.id, { am: am.name });
                                                                                            setOpenDropdown(null);
                                                                                        }}
                                                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                                                    >
                                                                                        {am.name}
                                                                                    </div>
                                                                                ))
                                                                            }
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={styles.actorItem}>
                                                                <span className={styles.actorRole}>Support thực hiện:</span>
                                                                <span className={styles.actorName}>{task.assignee?.name || task.support || 'Chưa gán'}</span>
                                                            </div>
                                                        </div>

                                                        <div className={styles.sidebarSection}>
                                                            <h5 className={styles.detailLabel}>Thông tin bổ sung</h5>
                                                            <div className={styles.metaItem}>
                                                                <span>Ngày thực hiện:</span>
                                                                <input
                                                                    type="date"
                                                                    value={task.dueDate || ''}
                                                                    onChange={(e) => updateTask(task.id, {
                                                                        dueDate: e.target.value,
                                                                        deadline: e.target.value ? `${e.target.value.split('-')[2]}/${e.target.value.split('-')[1]}/${e.target.value.split('-')[0]}` : null
                                                                    })}
                                                                    style={{
                                                                        background: 'var(--bg-secondary)',
                                                                        border: '1px solid var(--border)',
                                                                        borderRadius: '6px',
                                                                        padding: '4px 8px',
                                                                        color: 'var(--text-primary)',
                                                                        fontSize: '13px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className={styles.metaItem}>
                                                                <span>Team:</span>
                                                                <strong>{task.team || 'MKT'}</strong>
                                                            </div>
                                                            <div className={styles.metaItem}>
                                                                <span>Mức độ:</span>
                                                                {(() => {
                                                                    const pConfig = taskPriorities.find(p => p.name === task.priority) ||
                                                                        taskPriorities.find(p => p.id === task.priority) ||
                                                                        taskPriorities.find(p => p.badge === task.priority);
                                                                    return (
                                                                        <strong style={{ color: pConfig?.color || 'inherit' }}>
                                                                            {pConfig ? (pConfig.sub || pConfig.name) : task.priority}
                                                                        </strong>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div className={styles.metaItem}>
                                                                <span>Loại:</span>
                                                                <strong>{task.type}</strong>
                                                            </div>
                                                        </div>

                                                        {canDeleteTask(task) && !task.deletePending && (
                                                            <div className={styles.sidebarSection}>
                                                                <button
                                                                    className={styles.btnDelete}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTaskToDelete(task);
                                                                    }}
                                                                >
                                                                    <Trash2 size={14} />
                                                                    Xóa task này
                                                                </button>
                                                            </div>
                                                        )}

                                                        {task.deletePending && userIsManager && (
                                                            <div className={styles.sidebarSection}>
                                                                <h5 className={styles.detailLabel}>Quản lý xóa</h5>
                                                                <div className={styles.managerActions}>
                                                                    <button
                                                                        className={styles.btnRestore}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            restoreTask(task.id);
                                                                        }}
                                                                    >
                                                                        <RefreshCcw size={14} />
                                                                        Khôi phục Task
                                                                    </button>
                                                                    <button
                                                                        className={styles.btnFinalDelete}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            permanentlyDeleteTask(task.id);
                                                                        }}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                        Duyệt xóa vĩnh viễn
                                                                    </button>
                                                                </div>
                                                                <div className={styles.requestInfo}>
                                                                    Người y/c: <strong>{task.deletedBy}</strong>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                                {groupTasks.length === 0 && (
                                    <div className={styles.emptyGroup}>Không có task nào</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Task Delete Confirmation Modal */}
            {taskToDelete && (
                <div className={styles.confirmOverlay}>
                    <div className={styles.confirmModal}>
                        <div className={`${styles.confirmIcon} ${styles.dangerIcon}`}>
                            <Trash2 size={32} />
                        </div>
                        <h3>Xác nhận xóa task</h3>
                        <p>Bạn có chắc chắn muốn xóa task <strong>{taskToDelete.name}</strong>? Hành động này không thể hoàn tác.</p>

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
                                onClick={confirmDeleteTask}
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

            {/* Notification Panel */}
            <NotificationPanel
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                notifications={myNotifications}
                onMarkAllRead={() => markNotificationAsRead('all')}
                onMarkRead={markNotificationAsRead}
            />

            {/* Modal */}
            {isModalOpen && <CreateTaskModal onClose={() => setIsModalOpen(false)} />}

        </div>
    );
};

export default TaskManagement;
