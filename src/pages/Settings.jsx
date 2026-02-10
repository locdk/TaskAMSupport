import React, { useState, useEffect } from 'react';
import {
    User, Bell, Shield, Moon, Globe, Lock, Mail, Briefcase, Save,
    CheckCircle2, Building2, Upload, Image as ImageIcon, LayoutDashboard,
    GripVertical, RotateCcw, Plus, AlertCircle, AlertTriangle, ArrowDown,
    Flame, Settings2, Shapes, Copy, Trash2, PlusCircle, Palette, Users,
    Key, ShieldCheck, Check, ChevronDown, ChevronRight, Clock, Star, BookOpen,
    FileText, ClipboardList, Info, Lightbulb, Zap, Target, Award, Bookmark, RefreshCw, Store
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import styles from './Settings.module.css';
import { useAppState } from '../context/AppStateContext';
import * as api from '../services/firestoreAPI';
import * as firestoreAPI from '../services/firestoreAPI'; // Add explicit alias if needed, or just use api

const PERMISSION_GROUPS = [
    {
        id: 'tasks',
        name: 'Quản lý Công việc (Tasks)',
        icon: <Briefcase size={16} />,
        permissions: [
            { key: 'tasks.view_all', name: 'Xem tất cả Task', desc: 'Có thể xem tất cả các task của các team khác nhau.' },
            { key: 'tasks.create', name: 'Tạo Task mới', desc: 'Quyền tạo mới các nhiệm vụ trên hệ thống.' },
            { key: 'tasks.edit', name: 'Chỉnh sửa tất cả', desc: 'Có thể sửa tên, nội dung, người làm của bất kỳ task nào.' },
            { key: 'tasks.edit_assigned', name: 'Chỉnh sửa cá nhân', desc: 'Chỉ có thể sửa task được gán cho chính mình.' },
            { key: 'tasks.delete', name: 'Xóa Task', desc: 'Gửi yêu cầu xóa hoặc xóa vĩnh viễn nhiệm vụ.' },
            { key: 'tasks.approve', name: 'Duyệt hoàn thành', desc: 'Quyền xác nhận task đã được hoàn thành tốt.' },
            { key: 'tasks.comment', name: 'Bình luận', desc: 'Gửi bình luận và trao đổi trong nội dung task.' },
            { key: 'tasks.delete_log', name: 'Xem log Xóa & Duyệt', desc: 'Quyền xem danh sách task bị xóa và duyệt xóa vĩnh viễn.' },
        ]
    },
    {
        id: 'store_handbook',
        name: 'Sổ tay thông tin Tiệm',
        icon: <Store size={16} />,
        permissions: [
            { key: 'store_handbook.view_all', name: 'Quản lý sổ tay tiệm', desc: 'Xem toàn bộ danh sách tiệm (List Show All).' },
            { key: 'store_handbook.search_only', name: 'Truy cập sổ tay tiệm', desc: 'Chỉ hiển thị khi tìm kiếm (List Hide).' },
            { key: 'store_handbook.manage', name: 'Thêm/Sửa/Xóa', desc: 'Quyền thêm, chỉnh sửa và xóa thông tin tiệm.' },
        ]
    },
    {
        id: 'design',
        name: 'Quản lý Design',
        icon: <Palette size={16} />,
        permissions: [
            { key: 'design.view', name: 'Truy cập Design', desc: 'Truy cập trang quản lý task design.' },
            { key: 'design.manage', name: 'Quản lý Design', desc: 'Quyền quản lý, chỉnh sửa task design.' },
        ]
    },
    {
        id: 'personnel',
        name: 'Quản lý Nhân sự',
        icon: <Users size={16} />,
        permissions: [
            { key: 'personnel.view_all', name: 'Xem nhân sự', desc: 'Xem danh sách và thông tin chi tiết nhân viên.' },
            { key: 'personnel.add', name: 'Thêm nhân viên', desc: 'Thêm tài khoản mới vào hệ thống.' },
            { key: 'personnel.edit', name: 'Sửa nhân viên', desc: 'Cập nhật thông tin, vai trò, lịch trình nhân viên.' },
            { key: 'personnel.delete', name: 'Xóa nhân viên', desc: 'Gỡ bỏ tài khoản nhân viên khỏi hệ thống.' },
        ]
    },
    {
        id: 'schedule_knowledge',
        name: 'Lịch & Quy trình',
        icon: <Clock size={16} />,
        permissions: [
            { key: 'knowledge.view', name: 'Xem Quy trình', desc: 'Quyền truy cập và xem các tài liệu hướng dẫn.' },
            { key: 'knowledge.manage', name: 'Quản lý Quy trình', desc: 'Quyền thêm, sửa, xóa các bài viết hướng dẫn.' },
            { key: 'schedule.view', name: 'Xem Lịch làm', desc: 'Quyền xem lịch làm việc của nhân sự.' },
            { key: 'schedule.register', name: 'Đăng ký Lịch/Off', desc: 'Quyền đăng ký lịch làm việc và nghỉ phép cá nhân.' },
            { key: 'schedule.manage', name: 'Quản lý Lịch làm', desc: 'Sắp xếp và chỉnh sửa ca làm việc của nhân sự.' },
            { key: 'attendance.manage', name: 'Quản lý Chấm công', desc: 'Xem và chỉnh sửa dữ liệu chấm công của nhân sự.' },
            { key: 'schedule.approve_leave', name: 'Xét duyệt đơn xin phép', desc: 'Quyền duyệt hoặc từ chối yêu cầu nghỉ phép vượt giới hạn (>5 người/ngày).' },
        ]
    },
    {
        id: 'system',
        name: 'Hệ thống & Báo cáo',
        icon: <Settings2 size={16} />,
        permissions: [
            { key: 'reports.view', name: 'Xem Báo cáo', desc: 'Xem thống kê hiệu suất và báo cáo điểm danh.' },
            { key: 'audit_logs.view', name: 'Xem Nhật ký', desc: 'Theo dõi lịch sử hoạt động của hệ thống.' },
            { key: 'settings.edit', name: 'Cài đặt hệ thống', desc: 'Toàn quyền cấu hình tổ chức, team và vai trò.' },
        ]
    }
];

const PRESET_COLORS = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#eb2f96',
    '#fa8c16', '#13c2c2', '#2f54eb', '#fa541c', '#cf1322', '#d4380d'
];

const ICON_OPTIONS = [
    { name: 'BookOpen', component: BookOpen, label: 'Sách' },
    { name: 'FileText', component: FileText, label: 'Tài liệu' },
    { name: 'ClipboardList', component: ClipboardList, label: 'Danh sách' },
    { name: 'Info', component: Info, label: 'Thông tin' },
    { name: 'Lightbulb', component: Lightbulb, label: 'Ý tưởng' },
    { name: 'Zap', component: Zap, label: 'Nhanh' },
    { name: 'Target', component: Target, label: 'Mục tiêu' },
    { name: 'Award', component: Award, label: 'Thành tích' },
    { name: 'Bookmark', component: Bookmark, label: 'Đánh dấu' },
    { name: 'Settings2', component: Settings2, label: 'Cài đặt' },
    { name: 'Star', component: Star, label: 'Sao' },
    { name: 'AlertCircle', component: AlertCircle, label: 'Cảnh báo' }
];

const sanitizeList = (list) => {
    if (!Array.isArray(list)) return [];
    const seenIds = new Set();
    return list
        .filter(item => {
            if (!item || item.id === undefined || item.id === null) return false;
            const idStr = String(item.id);
            if (seenIds.has(idStr)) return false;
            seenIds.add(idStr);
            return true;
        })
        .map(item => ({ ...item, id: String(item.id) }));
};

const Settings = () => {
    const {
        settings: globalSettings,
        user,
        isLoading,
        taskStatuses: globalStatuses,
        taskPriorities: globalPriorities,
        taskTypes: globalTypes,
        teams: globalTeams,
        roles: globalRoles,
        designTaskTypes: globalDesignTypes,
        shiftDefinitions: globalShifts,
        personnel: globalPersonnel,
        knowledgeCategories: globalKnowledgeCategories,
        showToast,
        fetchAllData,
        clearAttendance
    } = useAppState();

    const [isSaving, setIsSaving] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);

    // Local draft states
    const [localSettings, setLocalSettings] = useState({});
    const [taskStatuses, setTaskStatuses] = useState([]);
    const [taskPriorities, setTaskPriorities] = useState([]);
    const [taskTypes, setTaskTypes] = useState([]);
    const [designTaskTypes, setDesignTaskTypes] = useState([]);
    const [shiftDefinitions, setShiftDefinitions] = useState([]);
    const [teams, setTeams] = useState([]);
    const [roles, setRoles] = useState([]);
    const [knowledgeCategories, setKnowledgeCategories] = useState([]);
    const [personnel, setPersonnel] = useState([]);
    const [deletedItems, setDeletedItems] = useState({
        status: [], priority: [], type: [], designTaskType: [], shift: [], team: [], role: [], knowledgeCategory: []
    });
    const [expandedRoleGroups, setExpandedRoleGroups] = useState({});

    // Sync from global once
    useEffect(() => {
        if (!isLoading && globalSettings && !hasInitialized) {
            const initialSettings = { ...globalSettings };
            if (!initialSettings.telegramTemplate) {
                initialSettings.telegramTemplate = `✅ *TASK HOÀN THÀNH*\n\n` +
                    `🏘 *Tên Tiệm:* {storeName}\n` +
                    `📝 *Nội dung:*\n{title}\n\n` +
                    `🛑 *Mức độ:* {priority} {priorityIcon}\n` +
                    `👷🏻‍♂️ *Support:* {support}\n` +
                    `🧑💼 *AM:* {am}\n` +
                    `🏷️ *Loại:* {type}\n` +
                    `📆 *Ngày nhận:* {date}\n` +
                    `🟢 *Trạng thái:* Hoàn thành\n` +
                    `🗒️ *Notes:* {notes}\n\n` +
                    `⏰ *Thời gian hoàn thành:* {completionTime}\n` +
                    `🥇 *Bởi:* {actor}`;
            }
            setLocalSettings(initialSettings);
            setTaskStatuses(sanitizeList(globalStatuses));
            setTaskPriorities(sanitizeList(globalPriorities));
            setTaskTypes(sanitizeList(globalTypes));
            setDesignTaskTypes(sanitizeList(globalDesignTypes));
            setShiftDefinitions(sanitizeList(globalShifts));
            setTeams(sanitizeList(globalTeams));
            setRoles(sanitizeList(globalRoles));
            setKnowledgeCategories(sanitizeList(globalKnowledgeCategories));
            setPersonnel(sanitizeList(globalPersonnel));
            setHasInitialized(true);
        }
    }, [isLoading, globalSettings, globalStatuses, globalPriorities, globalTypes, globalDesignTypes, globalShifts, globalTeams, globalRoles, globalPersonnel, globalKnowledgeCategories, hasInitialized]);

    const updateLocalItem = (type, item) => {
        const setters = {
            status: setTaskStatuses,
            priority: setTaskPriorities,
            type: setTaskTypes,
            designTaskType: setDesignTaskTypes,
            shift: setShiftDefinitions,
            team: setTeams,
            role: setRoles,
            knowledgeCategory: setKnowledgeCategories
        };
        const setter = setters[type];
        if (!setter) return;
        setter(prev => {
            const exists = prev.some(i => i.id === String(item.id));
            if (exists) return prev.map(i => i.id === String(item.id) ? { ...item, id: String(item.id) } : i);
            return [...prev, { ...item, id: String(item.id) }];
        });
    };

    const deleteLocalItem = (type, id) => {
        const setters = {
            status: setTaskStatuses,
            priority: setTaskPriorities,
            type: setTaskTypes,
            designTaskType: setDesignTaskTypes,
            shift: setShiftDefinitions,
            team: setTeams,
            role: setRoles,
            knowledgeCategory: setKnowledgeCategories
        };
        const setter = setters[type];
        if (setter) {
            setter(prev => prev.filter(i => i.id !== String(id)));
            setDeletedItems(prev => ({ ...prev, [type]: [...(prev[type] || []), String(id)] }));
        }
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const type = result.type;
        const startIndex = result.source.index;
        const endIndex = result.destination.index;
        const listMap = {
            status: [taskStatuses, setTaskStatuses],
            priority: [taskPriorities, setTaskPriorities],
            type: [taskTypes, setTaskTypes],
            designTaskType: [designTaskTypes, setDesignTaskTypes],
            shift: [shiftDefinitions, setShiftDefinitions],
            team: [teams, setTeams],
            role: [roles, setRoles],
            knowledgeCategory: [knowledgeCategories, setKnowledgeCategories]
        };
        const [list, setter] = listMap[type] || [];
        if (!setter) return;
        const newList = Array.from(list);
        const [removed] = newList.splice(startIndex, 1);
        newList.splice(endIndex, 0, removed);
        setter(newList.map((item, index) => ({ ...item, order: index })));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalSettings(prev => ({ ...prev, logo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleGroup = (roleId, groupId) => {
        const key = `${roleId}-${groupId}`;
        setExpandedRoleGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const addLocalItem = (type) => {
        const newItem = {
            id: Date.now().toString(),
            name: type === 'shift' ? 'Ca mới' : 'Mới',
            order: type === 'shift' ? shiftDefinitions.length : 0
        };

        if (type === 'shift') {
            newItem.startTime = '08:00';
            newItem.endTime = '17:00';
        }

        updateLocalItem(type, newItem);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const finalRoles = roles; // Remove automatic Manager permission override to allow custom control

            // Sanitize roles to ensure permissions/teams are arrays
            const sanitizedRoles = finalRoles.map(r => ({
                ...r,
                permissions: Array.isArray(r.permissions) ? r.permissions : [],
                // Ensure id is string
                id: String(r.id)
            }));

            const categories = [
                { type: 'status', list: taskStatuses, update: api.updateTaskStatus, add: api.addTaskStatus, delete: api.deleteTaskStatus, global: globalStatuses },
                { type: 'priority', list: taskPriorities, update: api.updateTaskPriority, add: api.addTaskPriority, delete: api.deleteTaskPriority, global: globalPriorities },
                { type: 'type', list: taskTypes, update: api.updateTaskType, add: api.addTaskType, delete: api.deleteTaskType, global: globalTypes },
                { type: 'designTaskType', list: designTaskTypes, update: api.updateDesignTaskType, add: api.addDesignTaskType, delete: api.deleteDesignTaskType, global: globalDesignTypes },
                { type: 'shift', list: shiftDefinitions, update: api.updateShiftDefinition, add: api.addShiftDefinition, delete: api.deleteShiftDefinition, global: globalShifts },
                { type: 'team', list: teams, update: api.updateTeam, add: api.addTeam, delete: api.deleteTeam, global: globalTeams },
                { type: 'role', list: sanitizedRoles, update: api.updateRole, add: api.addRole, delete: api.deleteRole, global: globalRoles },
                { type: 'knowledgeCategory', list: knowledgeCategories, update: api.updateKnowledgeCategory, add: api.addKnowledgeCategory, delete: api.deleteKnowledgeCategory, global: globalKnowledgeCategories }
            ];

            const promises = [api.updateSettings(localSettings.id, localSettings)];

            for (const cat of categories) {
                if (deletedItems[cat.type]) {
                    for (const id of deletedItems[cat.type]) {
                        if (cat.global.some(g => String(g.id) === id)) {
                            promises.push(cat.delete(id));
                        }
                    }
                }
                for (const item of cat.list) {
                    const isExisting = cat.global.some(g => String(g.id) === item.id);
                    promises.push(isExisting ? cat.update(item) : cat.add(item));
                }
            }

            if (user) {
                const u = personnel.find(p => p.id === user.id);
                if (u) promises.push(api.updatePersonnel(user.id, u));
            }

            await Promise.all(promises);
            await fetchAllData();
            setDeletedItems({ status: [], priority: [], type: [], designTaskType: [], shift: [], team: [], role: [], knowledgeCategory: [] });
            showToast("Đã lưu tất cả thay đổi hệ thống thành công!", "Thành công");
        } catch (err) {
            console.error(err);
            showToast(`Lỗi: ${err.message || 'Không thể lưu cài đặt'}`, "Lỗi");
        } finally {
            setTimeout(() => setIsSaving(false), 1000);
        }
    };

    if (!hasInitialized) return <div className={styles.container}><p>Đang tải dữ liệu cấu hình...</p></div>;

    const currentUser = user ? (personnel || []).find(p => p.id === user.id) : null;
    const allAvailablePermissions = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));

    const renderConfigList = (items, type, title, icon, addLabel) => (
        <div className={styles.section}>
            <div className={styles.configHeader}>
                <h3 className={styles.configTitle}>{icon} {title}</h3>
            </div>
            <Droppable droppableId={`${type}-list`} type={type}>
                {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className={styles.cardList}>
                        {items.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(p, snapshot) => (
                                    <div ref={p.innerRef} {...p.draggableProps} className={`${styles.configCard} ${snapshot.isDragging ? styles.dragging : ''}`}>
                                        <div {...p.dragHandleProps} className={styles.dragHandle}><GripVertical size={14} /></div>
                                        <div className={styles.cardMain}>
                                            <input
                                                value={item.name}
                                                className={styles.cardInput}
                                                onChange={e => updateLocalItem(type, { ...item, name: e.target.value })}
                                            />
                                            {/* Knowledge Category specific fields */}
                                            {type === 'knowledgeCategory' && (
                                                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Tên hiển thị</label>
                                                        <input
                                                            value={item.label || ''}
                                                            className={styles.cardInput}
                                                            onChange={e => updateLocalItem(type, { ...item, label: e.target.value })}
                                                            placeholder="VD: Quy trình, Hướng dẫn..."
                                                        />
                                                    </div>
                                                    <div style={{ width: '140px' }}>
                                                        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Icon</label>
                                                        <select
                                                            value={item.icon || 'BookOpen'}
                                                            className={styles.cardInput}
                                                            onChange={e => updateLocalItem(type, { ...item, icon: e.target.value })}
                                                            style={{ padding: '6px 8px', cursor: 'pointer' }}
                                                        >
                                                            {ICON_OPTIONS.map(opt => (
                                                                <option key={opt.name} value={opt.name}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Point Management for Design Tasks and Task Types */}
                                            {(type === 'designTaskType' || type === 'type') && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Điểm số:</span>
                                                    <input
                                                        type="number"
                                                        value={item.points || 0}
                                                        onChange={e => updateLocalItem(type, { ...item, points: Number(e.target.value) || 0 })}
                                                        style={{
                                                            width: '50px',
                                                            padding: '2px 4px',
                                                            borderRadius: '4px',
                                                            border: '1px solid var(--border-color)',
                                                            backgroundColor: 'var(--bg-secondary)',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '12px'
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            )}
                                            {item.desc !== undefined && (
                                                <span className={styles.cardSub}>{item.desc || 'Chưa có mô tả'}</span>
                                            )}
                                        </div>
                                        <div className={styles.cardPreview}>
                                            <span className={styles.previewLabel}>Xem trước</span>
                                            <span
                                                className={styles.previewBadge}
                                                style={{ backgroundColor: `${item.color}20`, color: item.color, border: `1px solid ${item.color}40`, display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                {type === 'knowledgeCategory' && item.icon && (() => {
                                                    const IconComponent = ICON_OPTIONS.find(opt => opt.name === item.icon)?.component || BookOpen;
                                                    return <IconComponent size={14} />;
                                                })()}
                                                {type === 'knowledgeCategory' ? (item.label || item.name) : item.name}
                                            </span>
                                        </div>
                                        <div className={styles.colorPickerContainer}>
                                            {PRESET_COLORS.slice(0, 5).map(c => (
                                                <div
                                                    key={c}
                                                    className={`${styles.colorOption} ${item.color === c ? styles.activeColor : ''}`}
                                                    style={{ backgroundColor: c }}
                                                    onClick={() => updateLocalItem(type, { ...item, color: c })}
                                                />
                                            ))}
                                            <div className={styles.customColorPicker}>
                                                <Plus size={12} className={styles.plusIcon} />
                                                <input
                                                    type="color"
                                                    className={styles.colorInput}
                                                    value={item.color || '#ffffff'}
                                                    onChange={e => updateLocalItem(type, { ...item, color: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.actionIcons}>
                                            <Trash2 size={14} className={styles.iconBtn} onClick={() => deleteLocalItem(type, item.id)} />
                                        </div>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
            <button className={styles.addItemBtn} onClick={() => {
                const newItem = {
                    id: Date.now().toString(),
                    name: 'Mới',
                    color: '#1890ff',
                    desc: ''
                };
                // Add required fields for knowledge categories
                if (type === 'knowledgeCategory') {
                    newItem.label = 'Danh mục mới';
                    newItem.icon = 'BookOpen';
                    newItem.order = items.length;
                }
                updateLocalItem(type, newItem);
            }}>
                <Plus size={14} /> {addLabel}
            </button>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.breadcrumb}>
                <span>Cấu hình</span> / <span>Cài đặt hệ thống</span>
            </div>

            <div className={styles.header}>
                <h1 className={styles.title}>Cài đặt hệ thống</h1>
                <p className={styles.subtitle}>Quản lý thông tin tổ chức, đội ngũ và các quy trình công việc.</p>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className={styles.settingsGrid}>

                    {/* Organization Section */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}><Building2 size={20} className={styles.sectionIcon} /> Thông tin tổ chức</h2>
                        <div className={styles.logoUploadContainer}>
                            <div className={styles.logoPreview}>
                                <img src={localSettings.logo || 'https://via.placeholder.com/150'} alt="Logo" />
                            </div>
                            <div className={styles.logoUploadActions}>
                                <label className={styles.uploadBtn}>
                                    <Upload size={16} /> <span>Thay đổi Logo</span>
                                    <input type="file" hidden onChange={handleLogoChange} accept="image/*" />
                                </label>
                                <p className={styles.logoDesc}>Định dạng: JPG, PNG. Tối đa 2MB.</p>
                            </div>
                        </div>
                        <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                            <label>Tên thương hiệu</label>
                            <input value={localSettings.brandName || ''} onChange={e => setLocalSettings({ ...localSettings, brandName: e.target.value })} placeholder="Nhập tên thương hiệu..." />
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}><User size={20} className={styles.sectionIcon} /> Thông tin cá nhân</h2>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Họ và tên</label>
                                <input value={currentUser?.name || ''}
                                    onChange={e => user && setPersonnel(prev => prev.map(p => p.id === user.id ? { ...p, name: e.target.value } : p))}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email công ty</label>
                                <input value={currentUser?.email || ''}
                                    onChange={e => user && setPersonnel(prev => prev.map(p => p.id === user.id ? { ...p, email: e.target.value } : p))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security Section (New) */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}><Lock size={20} className={styles.sectionIcon} /> Bảo mật Sổ tay Tiệm</h2>
                        <div className={styles.formGroup}>
                            <label>Passcode xem mật khẩu (Master Key)</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="text"
                                    value={localSettings.viewPasswordPasscode || ''}
                                    onChange={e => setLocalSettings({ ...localSettings, viewPasswordPasscode: e.target.value })}
                                    placeholder="Nhập mã bí mật (VD: 1234)..."
                                />
                                <span className={styles.inputHelper}>Mã này dùng để mở khóa xem mật khẩu trong Sổ tay tiệm.</span>
                            </div>
                        </div>
                    </div>

                    {/* Telegram & Options Section */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}><Bell size={20} className={styles.sectionIcon} /> Thông báo & Tùy chọn</h2>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Telegram Bot Token</label>
                                <div className={styles.inputWrapper}>
                                    <input type="password" value={localSettings.telegramBotToken || ''} onChange={e => setLocalSettings({ ...localSettings, telegramBotToken: e.target.value })} placeholder="Xác thực Bot..." />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Telegram Chat ID</label>
                                <input value={localSettings.telegramChatId || ''} onChange={e => setLocalSettings({ ...localSettings, telegramChatId: e.target.value })} placeholder="ID nhóm nhận tin..." />
                            </div>
                        </div>
                        <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
                            <label>Mẫu tin nhắn Telegram (Done Task)</label>
                            <textarea
                                rows={8}
                                value={localSettings.telegramTemplate || ''}
                                onChange={e => setLocalSettings({ ...localSettings, telegramTemplate: e.target.value })}
                                placeholder="Nhập mẫu tin nhắn..."
                            />
                            <p className={styles.labelDesc} style={{ marginTop: '8px' }}>
                                Biến khả dụng: {'{storeName}'}, {'{title}'} (Nội dung), {'{task}'} (Tiêu đề task), {'{priority}'}, {'{priorityIcon}'}, {'{support}'}, {'{am}'}, {'{type}'}, {'{date}'}, {'{notes}'}, {'{completionTime}'}, {'{actor}'}, {'{supportTelegramId}'}, {'{amTelegramId}'}
                            </p>
                        </div>
                        <div className={styles.toggleRow} onClick={() => setLocalSettings(prev => ({ ...prev, enableAmAttendance: !prev.enableAmAttendance }))}>
                            <div className={styles.toggleLabel}>
                                <Clock size={16} />
                                <div>
                                    <span>Bật điểm danh cho AM Team</span>
                                    <p className={styles.labelDesc}>Cho phép nhân viên AM thực hiện check-in/out hàng ngày.</p>
                                </div>
                            </div>
                            <div className={`${styles.toggle} ${localSettings.enableAmAttendance ? styles.on : ''}`}>
                                <div className={styles.toggleHandle}></div>
                            </div>
                        </div>
                    </div>

                    {/* Status & Priority Management */}
                    <div className={styles.configGrid}>
                        {renderConfigList(taskStatuses, 'status', 'Trạng thái Task', <Shapes size={18} className={styles.sectionIcon} />, 'Thêm trạng thái')}
                        {renderConfigList(taskPriorities, 'priority', 'Mức độ ưu tiên', <Flame size={18} className={styles.sectionIcon} />, 'Thêm độ ưu tiên')}
                    </div>

                    {/* Standard Task Types Section */}
                    {renderConfigList(taskTypes, 'type', 'Loại Task (AM + SP)', <LayoutDashboard size={18} className={styles.sectionIcon} />, 'Thêm loại Task')}

                    {/* Design Task Types Section */}
                    {renderConfigList(designTaskTypes, 'designTaskType', 'Loại Task Design', <Palette size={18} className={styles.sectionIcon} />, 'Thêm loại Design')}

                    {/* Knowledge Categories Section */}
                    {renderConfigList(knowledgeCategories, 'knowledgeCategory', 'Danh mục Quy trình & Hướng dẫn', <BookOpen size={18} className={styles.sectionIcon} />, 'Thêm danh mục')}

                    {/* Shift Definitions Section */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}><Clock size={18} className={styles.sectionIcon} /> Quản lý Ca làm việc</h3>
                        <Droppable droppableId="shift-list" type="shift">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className={styles.cardList}>
                                    {shiftDefinitions.map((item, index) => (
                                        <Draggable key={item.id} draggableId={item.id} index={index}>
                                            {(p) => (
                                                <div ref={p.innerRef} {...p.draggableProps} className={styles.card}>
                                                    <div {...p.dragHandleProps} className={styles.dragHandle}><GripVertical size={14} /></div>
                                                    <div className={styles.cardMain}>
                                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                            <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
                                                                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Tên ca</label>
                                                                <input
                                                                    value={item.name}
                                                                    className={styles.cardInput}
                                                                    onChange={e => updateLocalItem('shift', { ...item, name: e.target.value })}
                                                                    placeholder="VD: Ca 1, S1, HC..."
                                                                />
                                                            </div>
                                                            <div style={{ width: '120px' }}>
                                                                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Giờ bắt đầu</label>
                                                                <input
                                                                    type="time"
                                                                    value={item.startTime || ''}
                                                                    onChange={e => updateLocalItem('shift', { ...item, startTime: e.target.value })}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '6px 8px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid var(--border-color)',
                                                                        backgroundColor: 'var(--bg-secondary)',
                                                                        color: 'var(--text-primary)',
                                                                        fontSize: '13px'
                                                                    }}
                                                                />
                                                            </div>
                                                            <div style={{ width: '120px' }}>
                                                                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Giờ kết thúc</label>
                                                                <input
                                                                    type="time"
                                                                    value={item.endTime || ''}
                                                                    onChange={e => updateLocalItem('shift', { ...item, endTime: e.target.value })}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '6px 8px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid var(--border-color)',
                                                                        backgroundColor: 'var(--bg-secondary)',
                                                                        color: 'var(--text-primary)',
                                                                        fontSize: '13px'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        {item.desc !== undefined && (
                                                            <span className={styles.cardSub}>{item.desc || 'Chưa có mô tả'}</span>
                                                        )}
                                                    </div>
                                                    <button className={styles.deleteBtn} onClick={() => deleteLocalItem('shift', item.id)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                        <button className={styles.addBtn} onClick={() => addLocalItem('shift')}>
                            <PlusCircle size={16} /> Thêm ca làm việc
                        </button>
                    </div>

                    {/* Teams Section */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}><Users size={18} className={styles.sectionIcon} /> Quản lý Team (Phòng ban)</h3>
                        <Droppable droppableId="team-list" type="team">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className={styles.permissionGrid}>
                                    {teams.map((item, index) => (
                                        <Draggable key={item.id} draggableId={item.id} index={index}>
                                            {(p) => (
                                                <div ref={p.innerRef} {...p.draggableProps} className={styles.permissionItem}>
                                                    <div {...p.dragHandleProps} className={styles.dragHandle}><GripVertical size={14} /></div>
                                                    <div className={styles.permInfo} style={{ flex: 1 }}>
                                                        <input value={item.name} className={styles.cardInput} onChange={e => updateLocalItem('team', { ...item, name: e.target.value })} />
                                                    </div>
                                                    <Trash2 size={14} className={styles.iconBtn} onClick={() => deleteLocalItem('team', item.id)} />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                        <button className={styles.addItemBtn} style={{ marginTop: '12px' }} onClick={() => updateLocalItem('team', { id: Date.now().toString(), name: 'Phòng ban mới' })}>
                            <Plus size={14} /> Thêm Team mới
                        </button>
                    </div>

                    {/* Roles & Permissions Section */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}><ShieldCheck size={20} className={styles.sectionIcon} /> Vai trò & Phân quyền hệ thống</h2>
                        <p className={styles.subtitle} style={{ marginBottom: '20px' }}>Tùy chỉnh quyền truy cập chi tiết cho từng nhóm vai trò trong tổ chức.</p>

                        <Droppable droppableId="role-list" type="role">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className={styles.permissionGroupsContainer}>
                                    {roles.map((role, index) => {
                                        const hasAllPermissions = allAvailablePermissions.every(p => Array.isArray(role.permissions) && role.permissions.includes(p));
                                        return (
                                            <Draggable key={role.id} draggableId={role.id} index={index}>
                                                {(p, snapshot) => (
                                                    <div
                                                        ref={p.innerRef}
                                                        {...p.draggableProps}
                                                        className={`${styles.permissionGroupWrapper} ${snapshot.isDragging ? styles.dragging : ''}`}
                                                    >
                                                        <div className={`${styles.permissionGroupHeader} ${expandedRoleGroups[`${role.id}-all`] ? styles.expanded : ''}`} onClick={() => toggleGroup(role.id, 'all')}>
                                                            <div {...p.dragHandleProps} className={styles.dragHandle} style={{ marginRight: 10 }}>
                                                                <GripVertical size={16} />
                                                            </div>
                                                            <div className={styles.groupInfo} style={{ flex: 1 }}>
                                                                <Lock size={16} />
                                                                <input
                                                                    value={role.name}
                                                                    className={styles.cardInput}
                                                                    onChange={e => updateLocalItem('role', { ...role, name: e.target.value })}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    disabled={role.name === 'Manager'}
                                                                    style={role.name === 'Manager' ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                                                                />
                                                                {hasAllPermissions && <span className={styles.allPermsBadge}><Star size={10} style={{ marginRight: 4 }} /> QUYỀN TỐI CAO</span>}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                {!hasAllPermissions && (
                                                                    <button
                                                                        className={styles.restoreBtn}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateLocalItem('role', { ...role, permissions: allAvailablePermissions });
                                                                            showToast(`Đã cấp quyền tối cao cho ${role.name}`, "Thành công");
                                                                        }}
                                                                    >
                                                                        Cấp quyền tối cao
                                                                    </button>
                                                                )}
                                                                {role.name !== 'Manager' && (
                                                                    <Trash2 size={14} className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); deleteLocalItem('role', role.id); }} />
                                                                )}
                                                                {expandedRoleGroups[`${role.id}-all`] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                            </div>
                                                        </div>

                                                        {expandedRoleGroups[`${role.id}-all`] && (
                                                            <div className={styles.permissionGrid}>
                                                                {PERMISSION_GROUPS.map(group => (
                                                                    <div key={group.id} style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                                                                        <div className={styles.permissionLabelSection}>
                                                                            <span className={styles.permissionLabelText}>{group.name}</span>
                                                                        </div>
                                                                        <div className={styles.permissionGrid}>
                                                                            {group.permissions.map(perm => {
                                                                                const isActive = (Array.isArray(role.permissions) && role.permissions.includes(perm.key));
                                                                                return (
                                                                                    <div key={perm.key}
                                                                                        className={`${styles.permissionItem} ${isActive ? styles.permissionItemActive : ''}`}
                                                                                        onClick={() => {
                                                                                            const oldPerms = Array.isArray(role.permissions) ? role.permissions : [];
                                                                                            const newPerms = isActive
                                                                                                ? oldPerms.filter(p => p !== perm.key)
                                                                                                : [...oldPerms, perm.key];
                                                                                            updateLocalItem('role', { ...role, permissions: newPerms });
                                                                                        }}>
                                                                                        <div className={styles.permCheckbox}>
                                                                                            {isActive && <Check size={12} />}
                                                                                        </div>
                                                                                        <div className={styles.permInfo}>
                                                                                            <span className={styles.permTitle}>{perm.name}</span>
                                                                                            <span className={styles.permDesc}>{perm.desc}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                        <button className={styles.addItemBtn} style={{ marginTop: '20px' }} onClick={() => updateLocalItem('role', { id: 'role-' + Date.now(), name: 'Vai trò mới', permissions: [] })}>
                            <Plus size={14} /> Thêm Vai trò mới
                        </button>
                    </div>

                    {/* Maintenance Section */}
                    {(() => {
                        const userRole = (user?.role || '').toLowerCase();
                        const isAdminOrManager = userRole === 'admin' || userRole === 'manager' || userRole === 'quản lý';
                        return isAdminOrManager;
                    })() && (
                            <div className={`${styles.section} ${styles.dangerSection}`}>
                                <h2 className={styles.sectionTitle} style={{ color: '#ff4d4f' }}>
                                    <AlertTriangle size={20} className={styles.sectionIcon} /> Khu vực bảo trì
                                </h2>
                                <p className={styles.subtitle} style={{ marginBottom: '20px' }}>
                                    Các thao tác dọn dẹp dữ liệu hệ thống. Cẩn trọng: Không thể hoàn tác.
                                </p>
                                <div className={styles.maintenanceItem}>
                                    <div className={styles.maintenanceInfo}>
                                        <span className={styles.maintenanceTitle}>Làm mới dữ liệu chấm công</span>
                                        <p className={styles.maintenanceDesc}>Xóa toàn bộ lịch sử check-in/out để bắt đầu ghi nhận lại từ đầu.</p>
                                    </div>
                                    <button
                                        className={styles.destructiveBtn}
                                        onClick={async () => {
                                            if (window.confirm("BẠN CÓ CHẮC CHẮN? Thao tác này sẽ xóa VĨNH VIỄN toàn bộ lịch sử chấm công (Check-in/Check-out) của tất cả nhân sự.\n\nLƯU Ý: Lịch làm việc đã đăng ký sẽ KHÔNG bị xóa.")) {
                                                try {
                                                    setIsSaving(true);
                                                    await clearAttendance();
                                                    showToast("Đã xóa sạch lịch sử chấm công.", "Thành công");
                                                } catch (err) {
                                                    showToast("Lỗi khi xóa dữ liệu: " + err.message, "Lỗi");
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }
                                        }}
                                    >
                                        <Trash2 size={16} /> Xóa dữ liệu
                                    </button>
                                </div>

                                <div className={styles.maintenanceItem} style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginTop: '16px' }}>
                                    <div className={styles.maintenanceInfo}>
                                        <span className={styles.maintenanceTitle}>Đặt lại lịch làm việc</span>
                                        <p className={styles.maintenanceDesc}>Thiết lập lại ca làm việc mẫu cho toàn bộ nhân sự (AM: Ca 1-3/HC, MKT: S1-S3).</p>
                                    </div>
                                    <button
                                        className={styles.destructiveBtn}
                                        style={{ backgroundColor: '#faad14' }}
                                        onClick={async () => {
                                            if (window.confirm("Thao tác này sẽ XÓA và TẠO LẠI lịch làm việc cho tất cả nhân sự?")) {
                                                try {
                                                    setIsSaving(true);
                                                    // Using the global function imported or from context mechanism
                                                    // Since we need to ensure the import is correct, let's look at the file.
                                                    // But assuming firestoreAPI is available based on context usage in other files
                                                    await firestoreAPI.resetAllPersonnelSchedule();
                                                    showToast("Đã đặt lại dữ liệu lịch làm việc.", "Thành công");
                                                } catch (err) {
                                                    showToast("Lỗi: " + err.message, "Lỗi");
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }
                                        }}
                                    >
                                        <RefreshCw size={16} /> Đặt lại Lịch
                                    </button>
                                </div>

                                <div className={styles.maintenanceItem} style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginTop: '16px' }}>
                                    <div className={styles.maintenanceInfo}>
                                        <span className={styles.maintenanceTitle}>Xóa lịch sử đã xem tài liệu</span>
                                        <p className={styles.maintenanceDesc}>Xóa toàn bộ trạng thái "đã xem" của tất cả tài liệu trong Knowledge Hub.</p>
                                    </div>
                                    <button
                                        className={styles.destructiveBtn}
                                        style={{ backgroundColor: '#722ed1' }}
                                        onClick={async () => {
                                            if (window.confirm("Xóa lịch sử đã xem tài liệu? Tất cả tài liệu sẽ hiển thị là chưa đọc.")) {
                                                try {
                                                    setIsSaving(true);
                                                    await firestoreAPI.clearAllKnowledgeReads();
                                                    showToast("Đã xóa lịch sử đã xem tài liệu.", "Thành công");
                                                } catch (err) {
                                                    showToast("Lỗi: " + err.message, "Lỗi");
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }
                                        }}
                                    >
                                        <Trash2 size={16} /> Xóa lịch sử
                                    </button>
                                </div>

                                <div className={styles.maintenanceItem} style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginTop: '16px' }}>
                                    <div className={styles.maintenanceInfo}>
                                        <span className={styles.maintenanceTitle}>Xóa lịch sử Sổ tay tiệm</span>
                                        <p className={styles.maintenanceDesc}>Xóa toàn bộ nhật ký hoạt động chỉnh sửa trong Sổ tay tiệm.</p>
                                    </div>
                                    <button
                                        className={styles.destructiveBtn}
                                        style={{ backgroundColor: '#eb2f96' }}
                                        onClick={async () => {
                                            if (window.confirm("Xóa toàn bộ lịch sử hoạt động Sổ tay tiệm? Thao tác này không thể hoàn tác.")) {
                                                try {
                                                    setIsSaving(true);
                                                    await firestoreAPI.clearAllStoreLogs();
                                                    showToast("Đã xóa lịch sử Sổ tay tiệm.", "Thành công");
                                                } catch (err) {
                                                    showToast("Lỗi: " + err.message, "Lỗi");
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }
                                        }}
                                    >
                                        <Trash2 size={16} /> Xóa lịch sử
                                    </button>
                                </div>

                                <div className={styles.maintenanceItem} style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginTop: '16px' }}>
                                    <div className={styles.maintenanceInfo}>
                                        <span className={styles.maintenanceTitle}>Xóa nhật ký hoạt động Task</span>
                                        <p className={styles.maintenanceDesc}>Xóa toàn bộ thông báo và lịch sử hoạt động của Task trong hệ thống.</p>
                                    </div>
                                    <button
                                        className={styles.destructiveBtn}
                                        style={{ backgroundColor: '#1890ff' }}
                                        onClick={async () => {
                                            if (window.confirm("Xóa toàn bộ nhật ký hoạt động Task? Thao tác này không thể hoàn tác.")) {
                                                try {
                                                    setIsSaving(true);
                                                    await firestoreAPI.clearAllNotifications();
                                                    showToast("Đã xóa nhật ký hoạt động Task.", "Thành công");
                                                } catch (err) {
                                                    showToast("Lỗi: " + err.message, "Lỗi");
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }
                                        }}
                                    >
                                        <Trash2 size={16} /> Xóa nhật ký
                                    </button>
                                </div>
                            </div>
                        )}
                </div>
            </DragDropContext>

            <div className={styles.footer}>
                <button
                    className={`${styles.saveBtn} ${isSaving ? styles.saving : ''}`}
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>
                            <div className={styles.spinner}></div>
                            <span>Đang xử lý...</span>
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            <span>Lưu tất cả thay đổi</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Settings;
