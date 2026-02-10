import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderOpen,
    CheckSquare,
    Users,
    BarChart3,
    Settings,
    Calendar as CalendarIcon,
    Palette,
    LogOut,
    Clock,
    Menu,
    X,
    Sun,
    Moon,
    Upload,
    BookOpen,
    History,
    Store
} from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './Sidebar.module.css';
import { useAppState } from '../../context/AppStateContext';

const Sidebar = () => {
    const { settings, personnel, logout, user, canDo, updateSettings } = useAppState();
    const [isOpen, setIsOpen] = useState(false);

    // Local state for instant toggle response
    const [localDarkMode, setLocalDarkMode] = useState(settings?.isDarkMode ?? true);

    // Sync local state when global settings update
    useEffect(() => {
        if (settings?.isDarkMode !== undefined) {
            setLocalDarkMode(settings.isDarkMode);
        }
    }, [settings?.isDarkMode]);

    const handleThemeToggle = () => {
        const newMode = !localDarkMode;
        setLocalDarkMode(newMode);
        document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
        updateSettings({ isDarkMode: newMode });
    };

    // Close sidebar when route changes on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setIsOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const isUserOnline = (p) => {
        if (!p.isOnline || !p.lastSeen) return false;

        // Detect and handle Firestore Timestamp objects or numbers
        const lastSeen = p.lastSeen?.toMillis ? p.lastSeen.toMillis() : (p.lastSeen?.seconds ? p.lastSeen.seconds * 1000 : p.lastSeen);
        if (!lastSeen) return false;

        const diff = Date.now() - lastSeen;
        return diff < 15 * 60 * 1000; // 15 minutes threshold
    };

    const amTeam = (personnel || []).filter(p =>
        (p.parentTeam || '').toUpperCase() === 'AM' &&
        isUserOnline(p)
    ).filter(Boolean);

    const mktTeam = (personnel || []).filter(p =>
        (p.parentTeam || '').toUpperCase().includes('MKT') &&
        isUserOnline(p)
    ).filter(Boolean);

    const isEmployeeRole = (role) => {
        const r = (role || '').toLowerCase();
        return r === 'nhân viên' || r === 'staff' || r === 'member';
    };

    const isMktSupportEmployee = user?.parentTeam === 'MKT Support' && isEmployeeRole(user?.role);
    const isAmEmployee = user?.parentTeam === 'AM' && isEmployeeRole(user?.role);
    const userRole = (user?.role || '').toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'quản lý' || userRole === 'manager'; // robust check
    const isAmAdmin = isAdmin && user?.parentTeam === 'AM';

    // Helper to identify Graphic Designer (consistent with Personnel.jsx)
    const getJobTitle = (u) => {
        if (!u) return '';
        if (u.name === 'Vivian' || u.id === '02') return 'Graphic Designer';
        return u.position || '';
    };
    const isGraphicDesigner = getJobTitle(user) === 'Graphic Designer';

    // Menu Item Filtering
    const menu = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/tasks', label: 'Quản Lý Task AM + SP', icon: CheckSquare },
        { path: '/design-tasks', label: 'Quản Lý Task Design', icon: Palette },
        { path: '/schedule', label: 'Lịch làm việc', icon: CalendarIcon },
        { path: '/attendance', label: 'Chấm Công', icon: Clock },
        { path: '/personnel', label: 'Đội ngũ nhân sự', icon: Users },
        { path: '/store-handbook', label: 'Sổ tay thông tin Tiệm', icon: Store },
        { path: '/knowledge', label: 'Quy trình & Hướng dẫn', icon: BookOpen },
        { path: '/reports', label: 'Báo cáo & Thống kê', icon: BarChart3 },
        { path: '/history', label: 'Nhật ký hoạt động', icon: History },
    ].filter(item => {
        // Hide Overview for AM Team unless Admin or Manager
        if (item.path === '/' && (user?.parentTeam === 'AM')) {
            const r = (user?.role || '').trim().toLowerCase();
            if (r !== 'admin' && r !== 'manager') return false;
        }

        // Use Permission System for Reports
        if (item.path === '/reports') {
            return canDo('reports.view');
        }

        // Use Permission System for Personnel
        if (item.path === '/personnel') {
            return canDo('personnel.view_all');
        }

        if (item.path === '/history') {
            return canDo('audit_logs.view');
        }

        if (item.path === '/design-tasks') {
            return canDo('design.view');
        }

        // Hide Attendance for AM Team if globally disabled
        if (item.path === '/attendance') {
            const isAmTeamMember = user?.parentTeam === 'AM';
            if (isAmTeamMember && !settings?.enableAmAttendance) return false;
        }

        // Hide Store Handbook if no permissions
        if (item.path === '/store-handbook') {
            return canDo('store_handbook.view_all') || canDo('store_handbook.search_only');
        }

        return true;
    });

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className={styles.mobileToggle}
                onClick={toggleSidebar}
                aria-label="Toggle Menu"
            >
                <Menu size={24} />
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Bottom Navigation for Mobile */}
            <nav className={styles.bottomNav}>
                {menu.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`
                        }
                    >
                        <item.icon size={20} className={styles.bottomNavIcon} />
                        <span className={styles.bottomNavLabel}>{item.label}</span>
                    </NavLink>
                ))}

                {/* Mobile Settings Link */}
                {canDo('settings.edit') && (
                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`
                        }
                    >
                        <Settings size={20} className={styles.bottomNavIcon} />
                        <span className={styles.bottomNavLabel}>Setting</span>
                    </NavLink>
                )}
            </nav>

            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                {/* Close Button for Mobile */}
                <button
                    className={styles.closeBtn}
                    onClick={() => setIsOpen(false)}
                >
                    <X size={20} />
                </button>

                {/* Header: Acme Corp */}
                <div className={styles.header}>
                    <div className={styles.brandIcon}>
                        {settings.logo ? (
                            <img
                                src={settings.logo}
                                alt="Logo"
                                className={styles.logoImage}
                                style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }}
                            />
                        ) : (
                            <div className={styles.gridIcon}>
                                <div className={styles.gridDot}></div>
                                <div className={styles.gridDot}></div>
                                <div className={styles.gridDot}></div>
                                <div className={styles.gridDot}></div>
                            </div>
                        )}
                    </div>
                    <div className={styles.brandInfo}>
                        <h2 className={styles.brandName}>{settings.brandName}</h2>
                        <span className={styles.brandSubtitle}>{user?.parentTeam ? `${user.parentTeam} Team` : 'Task System'}</span>
                    </div>
                </div>

                {/* Menu */}
                <div className={styles.menuContainer}>
                    <nav className={styles.nav}>
                        {menu.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `${styles.navItem} ${isActive ? styles.active : ''}`
                                }
                            >
                                <item.icon size={20} className={styles.navIcon} />
                                <span className={styles.navLabel}>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {canDo('settings.edit') && (
                        <>
                            <div className={styles.divider}></div>
                            <nav className={styles.nav}>
                                <NavLink
                                    to="/data-import"
                                    className={({ isActive }) =>
                                        `${styles.navItem} ${isActive ? styles.active : ''}`
                                    }
                                >
                                    <Upload size={20} className={styles.navIcon} />
                                    <span className={styles.navLabel}>Import/Export Dữ liệu</span>
                                </NavLink>
                                <NavLink
                                    to="/settings"
                                    className={({ isActive }) =>
                                        `${styles.navItem} ${isActive ? styles.active : ''}`
                                    }
                                >
                                    <Settings size={20} className={styles.navIcon} />
                                    <span className={styles.navLabel}>Cài đặt hệ thống</span>
                                </NavLink>
                            </nav>
                        </>
                    )}

                    <div className={styles.divider}></div>

                    {/* Online Users Section */}
                    <div className={styles.onlineStatusSection}>
                        <div className={styles.teamGroup}>
                            <div className={styles.teamHeader}>
                                <span className={styles.teamTitle}>MKT SUPPORT</span>
                                <span className={styles.onlineCount}>{mktTeam.length}</span>
                            </div>
                            <div className={styles.avatarGrid}>
                                {mktTeam.map(p => (
                                    <div key={p.id} className={styles.onlineAvatarWrapper}>
                                        <img
                                            src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random`}
                                            alt={p.name}
                                            className={styles.onlineAvatar}
                                        />
                                        <span className={p.status === 'idle' ? styles.statusDotIdle : styles.statusDot}></span>
                                        <div className={styles.tooltip}>{p.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.teamGroup}>
                            <div className={styles.teamHeader}>
                                <span className={styles.teamTitle}>AM TEAM</span>
                                <span className={styles.onlineCount}>{amTeam.length}</span>
                            </div>
                            <div className={styles.avatarGrid}>
                                {amTeam.map(p => (
                                    <div key={p.id} className={styles.onlineAvatarWrapper}>
                                        <img
                                            src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random`}
                                            alt={p.name}
                                            className={styles.onlineAvatar}
                                        />
                                        <span className={p.status === 'idle' ? styles.statusDotIdle : styles.statusDot}></span>
                                        <div className={styles.tooltip}>{p.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <div className={styles.avatar}>
                        <img src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=random"} alt={user?.name || 'User'} />
                    </div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user?.name || 'User'}</span>
                        <span className={styles.userRole}>{user?.role || 'Member'}</span>
                    </div>
                    <button
                        onClick={handleThemeToggle}
                        className={styles.themeToggle}
                        title={localDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                    >
                        {localDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button
                        onClick={logout}
                        className={styles.logoutBtn}
                        title="Đăng xuất"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
