import React, { useState, useMemo, useEffect } from 'react'; // Added React imports
import {
    Search,
    Plus,
    Store,
    Facebook,
    Instagram,
    MapPin,
    Navigation,
    Globe,
    Edit2,
    Trash2,
    RotateCcw,
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    Copy,
    Eye,
    EyeOff,
    Lock,
    Key,
    Clock,
    Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './StoreHandbook.module.css';
import { useAppState } from '../context/AppStateContext';
import StoreModal from '../components/Modal/StoreModal';
import StoreHistoryModal from '../components/Modal/StoreHistoryModal';

const PasscodeModal = ({ isOpen, onClose, onSuccess, settingsPasscode }) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // Default passcode is '1234' if not set
        const validCode = settingsPasscode || '1234';

        if (input === validCode) {
            onSuccess();
            onClose();
            setInput('');
            setError(false);
        } else {
            setError(true);
            setInput('');
        }
    };

    return (
        <div className={styles.passcodeOverlay}>
            <div className={styles.passcodeModal}>
                <div className={styles.passcodeHeader}>
                    <Lock size={24} className={styles.lockIcon} />
                    <h3>Nhập Passcode Bảo mật</h3>
                    <p>Vì lí do bảo mật nên bạn vui lòng nhập CODE nhé.<br />Thank You!</p>
                </div>
                <form onSubmit={handleSubmit} className={styles.passcodeForm}>
                    <div className={styles.passcodeInputWrapper}>
                        <input
                            type="password"
                            autoFocus
                            value={input}
                            onChange={(e) => { setInput(e.target.value); setError(false); }}
                            placeholder="Mã số..."
                            className={`${styles.passcodeInput} ${error ? styles.inputError : ''}`}
                            maxLength={6}
                        />
                        {error && <span className={styles.errorMsg}>Mã không đúng!</span>}
                    </div>
                    <div className={styles.passcodeActions}>
                        <button type="button" onClick={onClose} className={styles.passcodeCancel}>Hủy</button>
                        <button type="submit" className={styles.passcodeSubmit}>Xác nhận</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CredentialRow = ({ label, value, isPassword = false, isUnlocked, onUnlockRequest, onCopy }) => {
    const [showPassword, setShowPassword] = useState(false);

    if (!value) return null;

    const handleCopy = (e) => {
        e.stopPropagation();
        if (isPassword && !isUnlocked) {
            onUnlockRequest();
        } else {
            onCopy(value);
        }
    };

    const toggleView = (e) => {
        e.stopPropagation();
        if (isPassword && !isUnlocked) {
            onUnlockRequest();
        } else {
            setShowPassword(!showPassword);
        }
    };

    const displayValue = isPassword ? (isUnlocked && showPassword ? value : '••••••••') : value;

    return (
        <div className={styles.credentialRow}>
            <span className={styles.credentialLabel}>{label}:</span>
            <div className={styles.credentialValueGroup}>
                <span className={`${styles.credentialValue} ${isPassword ? styles.passwordFont : ''}`}>
                    {displayValue}
                </span>
                <div className={styles.credentialActions}>
                    {isPassword && (
                        <button
                            className={styles.iconBtn}
                            onClick={toggleView}
                            title={showPassword ? "Ẩn" : "Hiện"}
                        >
                            {(isUnlocked && showPassword) ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    )}
                    <button
                        className={styles.iconBtn}
                        onClick={handleCopy}
                        title="Sao chép"
                    >
                        <Copy size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const StoreHandbook = () => {
    const {
        stores,
        addStore,
        updateStore,
        softDeleteStore,
        restoreStore,
        deleteStore,
        user,
        settings,
        showToast,
        roles,
        canDo,
        isLoading
    } = useAppState();

    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editStore, setEditStore] = useState(null);
    const [viewMode, setViewMode] = useState('active');
    const [expandedStoreId, setExpandedStoreId] = useState(null);

    // Security States
    const [isSecurityUnlocked, setIsSecurityUnlocked] = useState(false);
    const [showPasscodeModal, setShowPasscodeModal] = useState(false);

    // Permission Logic
    const userRoleName = (user?.role || '').toLowerCase();

    // Strict Permission Check using canDo
    const canViewAll = canDo && canDo('store_handbook.view_all');
    const canSearchOnly = canDo && canDo('store_handbook.search_only');
    const canManage = canDo && canDo('store_handbook.manage');
    const isSuperUser = ['admin', 'manager', 'supervisor', 'quản lý'].includes(userRoleName);

    // Redirect if no access
    useEffect(() => {
        if (isLoading) return;

        if (!isSuperUser && !canViewAll && !canSearchOnly) {
            navigate('/');
        }
    }, [isLoading, isSuperUser, canViewAll, canSearchOnly, navigate]);

    // Edit access: 
    const isAMOrMKT = user?.parentTeam === 'AM' || user?.parentTeam === 'MKT Support';
    const canEdit = canManage || isSuperUser || (isAMOrMKT && canDo('store_handbook.edit')); // Ensure explicit edit permission if not superuser
    const canSeeTrash = ['admin', 'manager'].includes(userRoleName);

    // Import Permission: Only Manager and Supervisor
    const canImport = ['admin', 'manager', 'supervisor', 'quản lý'].includes(userRoleName);

    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    const filteredStores = useMemo(() => {
        // Visibility Check
        if (!isSuperUser) {
            if (canViewAll) {
                // Allowed to view all, proceed to filter by term
            } else if (canSearchOnly) {
                // Search Only Mode
                if (!searchTerm.trim()) return [];
            } else {
                // No permission
                return [];
            }
        }

        let data = stores || [];
        if (viewMode === 'trash') {
            data = data.filter(s => s.deletePending);
        } else {
            data = data.filter(s => !s.deletePending);
        }

        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter(s =>
                (s.name || '').toLowerCase().includes(lowerTerm) ||
                (s.notes || '').toLowerCase().includes(lowerTerm)
            );
        }
        // Natural numeric sort
        return data.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }));
    }, [stores, searchTerm, viewMode, canViewAll, canSearchOnly, isSuperUser]);

    // Reset page when filter changes
    useEffect(() => {
        setPage(1);
    }, [searchTerm, viewMode]);

    const paginatedStores = useMemo(() => {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        return filteredStores.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredStores, page]);

    const totalPages = Math.ceil(filteredStores.length / ITEMS_PER_PAGE);

    const handleEdit = (store, e) => {
        e.stopPropagation();
        setEditStore(store);
        setIsModalOpen(true);
    };

    const handleSave = async (data) => {
        if (editStore) {
            await updateStore(editStore.id, data);
        } else {
            await addStore({
                ...data,
                createdBy: user?.name || 'Unknown'
            });
        }
        setIsModalOpen(false);
        setEditStore(null);
    };

    const handleDeleteRequest = async (store, e) => {
        e.stopPropagation();
        if (window.confirm(`Bạn có chắc muốn xóa tiệm "${store.name}"?`)) {
            await softDeleteStore(store);
        }
    };

    const handlePermanentDelete = async (store, e) => {
        e.stopPropagation();
        if (window.confirm(`⚠️ XÓA VĨNH VIỄN "${store.name}"?`)) {
            await deleteStore(store.id);
        }
    };

    const handleRestore = async (store, e) => {
        e.stopPropagation();
        if (window.confirm(`Khôi phục tiệm "${store.name}"?`)) {
            await restoreStore(store.id);
        }
    };

    const copyToClipboard = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showToast("Đã sao chép vào bộ nhớ tạm!", "Thành công");
    };

    const toggleStoreExpand = (id) => {
        if (expandedStoreId === id) {
            setExpandedStoreId(null);
        } else {
            setExpandedStoreId(id);
        }
    };

    const handleUnlockRequest = () => {
        if (isSecurityUnlocked) return;
        setShowPasscodeModal(true);
    };

    const openLink = (url) => {
        if (!url) return;
        let finalUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            finalUrl = 'https://' + url;
        }
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
    };

    // History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Calculate pending delete count
    const pendingDeleteCount = useMemo(() => {
        if (!stores) return 0;
        return stores.filter(s => s.deletePending).length;
    }, [stores]);

    // Helper to check if platform section has any data
    const hasPlatformData = (platform) => {
        if (!platform) return false;
        return Object.values(platform).some(val => {
            if (Array.isArray(val)) return val.some(v => v && v.toString().trim() !== '');
            return val && val.toString().trim() !== '';
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div className={styles.titleGroup}>
                        <h1>Sổ tay thông tin Tiệm</h1>
                    </div>

                    <div className={styles.headerOptions}>
                        {isSecurityUnlocked && (
                            <div className={styles.securityBadge} title="Chế độ đang mở khóa">
                                <Key size={14} />
                            </div>
                        )}

                        {/* History Button */}
                        <button
                            className={styles.iconActionBtn}
                            onClick={() => setShowHistoryModal(true)}
                            title="Nhật ký hoạt động"
                        >
                            <Clock size={20} />
                        </button>

                        {canSeeTrash && (
                            <button
                                className={`${styles.iconActionBtn} ${viewMode === 'trash' ? styles.active : ''} ${pendingDeleteCount > 0 ? styles.hasTrash : ''}`}
                                onClick={() => setViewMode(viewMode === 'active' ? 'trash' : 'active')}
                                title={viewMode === 'active' ? `Thùng rác (${pendingDeleteCount})` : "Thoát thùng rác"}
                            >
                                <div className={styles.iconRel}>
                                    {viewMode === 'active' ? <Trash2 size={20} /> : <RotateCcw size={20} />}
                                    {viewMode === 'active' && pendingDeleteCount > 0 && (
                                        <span className={styles.badge}>{pendingDeleteCount}</span>
                                    )}
                                </div>
                            </button>
                        )}

                        {canImport && viewMode === 'active' && (
                            <button
                                className={styles.iconActionBtn}
                                onClick={() => navigate('/store-import')}
                                title="Import từ CSV"
                                style={{ marginRight: 8 }}
                            >
                                <Upload size={20} />
                            </button>
                        )}

                        {canEdit && viewMode === 'active' && (
                            <button className={styles.addBtn} onClick={() => { setEditStore(null); setIsModalOpen(true); }}>
                                <Plus size={18} /> <span>Thêm thông tin tiệm mới</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.searchContainer}>
                    <div className={styles.searchWrapper}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm thông tin tiệm, ghi chú..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.content}>

                <div className={styles.accordionList}>
                    {paginatedStores.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Store size={48} style={{ opacity: 0.2 }} />
                            <p>Không tìm thấy tiệm nào</p>
                        </div>
                    ) : (
                        <>
                            {paginatedStores.map(store => {
                                const isExpanded = expandedStoreId === store.id;

                                // Safe access to nested properties
                                const facebook = store.facebook || {};
                                const instagram = store.instagram || {};
                                const maps = store.maps || {};
                                const yelp = store.yelp || {};
                                const other = store.other || {};

                                return (
                                    <div key={store.id} className={`${styles.accordionItem} ${isExpanded ? styles.expanded : ''}`}>
                                        <div
                                            className={styles.accordionHeader}
                                            onClick={() => toggleStoreExpand(store.id)}
                                        >
                                            <div className={styles.accordionTitle}>
                                                <div className={styles.iconBox}>
                                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </div>
                                                <span className={styles.storeName}>{store.name}</span>
                                                {store.deletePending && (
                                                    <span className={styles.pendingTag}>Đang chờ xóa</span>
                                                )}
                                            </div>

                                            <div className={styles.headerActions}>
                                                {viewMode === 'active' ? (
                                                    canEdit && (
                                                        <>
                                                            <button className={styles.actionBtn} onClick={(e) => handleEdit(store, e)}><Edit2 size={16} /></button>
                                                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={(e) => handleDeleteRequest(store, e)}><Trash2 size={16} /></button>
                                                        </>
                                                    )
                                                ) : (
                                                    <>
                                                        <button className={`${styles.actionBtn} ${styles.restoreBtn}`} onClick={(e) => handleRestore(store, e)}><RotateCcw size={16} /></button>
                                                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={(e) => handlePermanentDelete(store, e)}><Trash2 size={16} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className={styles.accordionBody}>
                                                <div className={styles.platformGrid}>

                                                    {/* Facebook Section */}
                                                    {hasPlatformData(facebook) && (
                                                        <div className={styles.platformCard}>
                                                            <div className={styles.platformHeader}>
                                                                <Facebook size={18} className={styles.fbColor} /> <h4 className={styles.fbColor}>Facebook</h4>
                                                            </div>
                                                            <div className={styles.platformContent}>
                                                                <CredentialRow label="Link" value={facebook.link} onCopy={copyToClipboard} />
                                                                {(facebook.accounts || (facebook.account ? [facebook.account] : [])).map((acc, idx) => (
                                                                    <CredentialRow key={idx} label={idx === 0 ? "Account" : `Account ${idx + 1}`} value={acc} onCopy={copyToClipboard} />
                                                                ))}
                                                            </div>
                                                            {facebook.link && (
                                                                <button className={styles.visitBtn} onClick={() => openLink(facebook.link)}>
                                                                    Truy cập <Globe size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Instagram Section */}
                                                    {hasPlatformData(instagram) && (
                                                        <div className={styles.platformCard}>
                                                            <div className={styles.platformHeader}>
                                                                <Instagram size={18} className={styles.instaColor} /> <h4 className={styles.instaColor}>Instagram</h4>
                                                            </div>
                                                            <div className={styles.platformContent}>
                                                                <CredentialRow label="Link" value={instagram.link} onCopy={copyToClipboard} />
                                                                <CredentialRow label="User" value={instagram.username} onCopy={copyToClipboard} />
                                                                <CredentialRow
                                                                    label="Pass"
                                                                    value={instagram.password}
                                                                    isPassword
                                                                    isUnlocked={isSecurityUnlocked}
                                                                    onUnlockRequest={handleUnlockRequest}
                                                                    onCopy={copyToClipboard}
                                                                />
                                                                <CredentialRow
                                                                    label="2FA"
                                                                    value={instagram.twoFactor}
                                                                    isPassword
                                                                    isUnlocked={isSecurityUnlocked}
                                                                    onUnlockRequest={handleUnlockRequest}
                                                                    onCopy={copyToClipboard}
                                                                />
                                                            </div>
                                                            {instagram.link && (
                                                                <button className={styles.visitBtn} onClick={() => openLink(instagram.link)}>
                                                                    Truy cập <Globe size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Maps Section */}
                                                    {hasPlatformData(maps) && (
                                                        <div className={styles.platformCard}>
                                                            <div className={styles.platformHeader}>
                                                                <MapPin size={18} className={styles.mapsColor} /> <h4 className={styles.mapsColor}>Google Maps</h4>
                                                            </div>
                                                            <div className={styles.platformContent}>
                                                                <CredentialRow label="Link" value={maps.link} onCopy={copyToClipboard} />
                                                                {(maps.accounts || (maps.account ? [maps.account] : [])).map((acc, idx) => (
                                                                    <CredentialRow key={idx} label={idx === 0 ? "Account" : `Account ${idx + 1}`} value={acc} onCopy={copyToClipboard} />
                                                                ))}
                                                            </div>
                                                            {maps.link && (
                                                                <button className={styles.visitBtn} onClick={() => openLink(maps.link)}>
                                                                    Truy cập <Globe size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Yelp Section */}
                                                    {hasPlatformData(yelp) && (
                                                        <div className={styles.platformCard}>
                                                            <div className={styles.platformHeader}>
                                                                <Navigation size={18} className={styles.yelpColor} /> <h4 className={styles.yelpColor}>Yelp</h4>
                                                            </div>
                                                            <div className={styles.platformContent}>
                                                                <CredentialRow label="Link" value={yelp.link} onCopy={copyToClipboard} />
                                                                <CredentialRow label="Mail" value={yelp.mail} onCopy={copyToClipboard} />
                                                                <CredentialRow
                                                                    label="Pass"
                                                                    value={yelp.password}
                                                                    isPassword
                                                                    isUnlocked={isSecurityUnlocked}
                                                                    onUnlockRequest={handleUnlockRequest}
                                                                    onCopy={copyToClipboard}
                                                                />
                                                            </div>
                                                            {yelp.link && (
                                                                <button className={styles.visitBtn} onClick={() => openLink(yelp.link)}>
                                                                    Truy cập <Globe size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Other Section */}
                                                    {hasPlatformData(other) && (
                                                        <div className={styles.platformCard}>
                                                            <div className={styles.platformHeader}>
                                                                <Globe size={18} className={styles.otherColor} /> <h4 className={styles.otherColor}>Khác</h4>
                                                            </div>
                                                            <div className={styles.platformContent}>
                                                                <CredentialRow label="Link" value={other.link} onCopy={copyToClipboard} />
                                                                <CredentialRow label="Note" value={other.note} onCopy={copyToClipboard} />
                                                            </div>
                                                            {other.link && (
                                                                <button className={styles.visitBtn} onClick={() => openLink(other.link)}>
                                                                    Truy cập <Globe size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* General Notes */}
                                                    {store.notes && (
                                                        <div className={`${styles.platformCard} ${styles.notesCard}`}>
                                                            <div className={styles.platformHeader}>
                                                                <Edit2 size={18} /> <h4>Ghi chú chung</h4>
                                                            </div>
                                                            <div className={styles.noteContent}>
                                                                {store.notes}
                                                            </div>
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        className={styles.pageBtn}
                                        disabled={page === 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                    >
                                        &lt; Trước
                                    </button>
                                    <span className={styles.pageInfo}>
                                        Trang {page} / {totalPages}
                                    </span>
                                    <button
                                        className={styles.pageBtn}
                                        disabled={page === totalPages}
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    >
                                        Sau &gt;
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <StoreModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editStore}
            />

            <PasscodeModal
                isOpen={showPasscodeModal}
                onClose={() => setShowPasscodeModal(false)}
                settingsPasscode={settings?.viewPasswordPasscode}
                onSuccess={() => {
                    setIsSecurityUnlocked(true);
                    showToast("Đã mở khóa chế độ xem mật khẩu", "Thành công");
                }}
            />

            <StoreHistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
            />
        </div>
    );
};

export default StoreHandbook;
