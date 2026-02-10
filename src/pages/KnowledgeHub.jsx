import React, { useState, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
    Search,
    Plus,
    BookOpen,
    FileText,
    ClipboardList,
    Info,
    X,
    Edit2,
    Trash2,
    ArrowRight,
    Lightbulb,
    Zap,
    Target,
    Award,
    Bookmark,
    Settings2,
    Star,
    AlertCircle,
    User
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import styles from './KnowledgeHub.module.css';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/firestoreAPI';

const ICON_MAP = {
    'BookOpen': BookOpen,
    'FileText': FileText,
    'ClipboardList': ClipboardList,
    'Info': Info,
    'Lightbulb': Lightbulb,
    'Zap': Zap,
    'Target': Target,
    'Award': Award,
    'Bookmark': Bookmark,
    'Settings2': Settings2,
    'Star': Star,
    'AlertCircle': AlertCircle
};

const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

const KnowledgeHub = () => {
    const {
        knowledge,
        knowledgeCategories,
        addKnowledge,
        updateKnowledge,
        deleteKnowledge,
        user,
        personnel,
        canDo
    } = useAppState();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedItem, setSelectedItem] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isReadersListOpen, setIsReadersListOpen] = useState(false);

    const categories = useMemo(() => {
        const base = [
            { id: 'all', label: 'Tất cả', icon: <BookOpen size={18} /> }
        ];
        const dynamic = (knowledgeCategories || []).map(cat => {
            const IconComponent = ICON_MAP[cat.icon] || BookOpen;
            return {
                id: cat.id,
                label: cat.label || cat.name,
                icon: <IconComponent size={18} />
            };
        });
        return [...base, ...dynamic];
    }, [knowledgeCategories]);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '',
        description: ''
    });

    // Default category when adding new
    const defaultCategory = knowledgeCategories.length > 0 ? knowledgeCategories[0].id : '';

    const userRole = (user?.role || '').toLowerCase();
    const isManager = canDo('knowledge.manage') || userRole === 'manager' || userRole === 'admin' || userRole === 'quản lý';

    const filteredKnowledge = useMemo(() => {
        return knowledge.filter(item => {
            const matchesSearch =
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.content?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = activeCategory === 'all' || item.category === activeCategory;

            return matchesSearch && matchesCategory;
        });
    }, [knowledge, searchTerm, activeCategory]);

    const handleOpenAdd = () => {
        setFormData({ title: '', content: '', category: defaultCategory, description: '' });
        setSelectedItem(null);
        setIsEditModalOpen(true);
    };

    const handleOpenEdit = (e, item) => {
        e.stopPropagation();
        setSelectedItem(item);
        setFormData({
            title: item.title,
            content: item.content,
            category: item.category,
            description: item.description || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content || !formData.category) {
            alert('Vui lòng nhập đầy đủ tiêu đề, nội dung và chọn danh mục');
            return;
        }

        if (selectedItem) {
            await updateKnowledge(selectedItem.id, formData);
        } else {
            await addKnowledge({
                ...formData,
                author: user?.name || 'System',
                authorEmail: user?.email
            });
        }
        setIsEditModalOpen(false);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
            await deleteKnowledge(id);
        }
    };

    const handleItemClick = async (item) => {
        setSelectedItem(item);
        setIsViewModalOpen(true);

        // Track that this user has read this article
        if (user) {
            try {
                await api.markKnowledgeAsRead(item.id, user.id, user.name || user.email);
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }
    };

    const canView = canDo('knowledge.view') || isManager;

    if (!canView) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <AlertCircle size={64} className={styles.emptyIcon} color="#ff4d4f" />
                    <h3>Truy cập bị từ chối</h3>
                    <p>Bạn không có quyền xem Quy trình & Hướng dẫn.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>Trung tâm Quy trình & Hướng dẫn</h1>
                    {isManager && (
                        <button className={styles.addBtn} onClick={handleOpenAdd}>
                            <Plus size={20} />
                            Tạo tài liệu mới
                        </button>
                    )}
                </div>

                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Tìm kiếm hướng dẫn, quy trình, từ khóa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isManager && knowledgeCategories.length === 0 && (
                    <div className={styles.categoryWarning}>
                        <Info size={16} />
                        <span>Bạn chưa tạo danh mục nào. Hãy <button onClick={() => navigate('/settings')} className={styles.inlineLink}>vào Cài đặt</button> để tạo danh mục trước khi viết bài.</span>
                    </div>
                )}
            </div>

            <div className={styles.contentWrapper}>
                <aside className={styles.sidebar}>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.activeCategory : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </aside>

                <main className={styles.mainArea}>
                    <div className={styles.grid} key={activeCategory}>
                        {filteredKnowledge.map(item => {
                            const category = categories.find(c => c.id === item.category);
                            const categoryData = knowledgeCategories.find(cat => cat.id === item.category);
                            const glowColor = categoryData?.color || '#0096ff';

                            return (
                                <div
                                    key={item.id}
                                    className={styles.card}
                                    onClick={() => handleItemClick(item)}
                                    style={{
                                        '--glow-color': glowColor,
                                        '--icon-color': glowColor
                                    }}
                                >
                                    <div className={styles.cardHeader}>
                                        <div className={styles.cardIcon}>
                                            {category?.icon || <FileText />}
                                        </div>
                                        {isManager && (
                                            <div className={styles.cardActions}>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={(e) => handleOpenEdit(e, item)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={(e) => handleDelete(e, item.id)}
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {item.category && (
                                        <div className={styles.categoryBadge}>
                                            {category?.label || 'Chưa phân loại'}
                                        </div>
                                    )}

                                    <h3 className={styles.cardTitle}>{item.title}</h3>
                                    <p className={styles.cardDescription}>
                                        {item.description || stripHtml(item.content).substring(0, 120) + '...'}
                                    </p>

                                    <div className={styles.cardFooter}>
                                        <span className={styles.cardAuthor}>
                                            <User size={14} />
                                            {item.author || 'Member'}
                                        </span>
                                        <ArrowRight size={16} className={styles.cardArrow} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {filteredKnowledge.length === 0 && (
                        <div className={styles.emptyState}>
                            <BookOpen size={64} className={styles.emptyIcon} />
                            <h3>Không tìm thấy tài liệu phù hợp</h3>
                            <p>Thử thay đổi từ khóa tìm kiếm hoặc danh mục</p>
                        </div>
                    )}
                </main>
            </div>

            {/* View Modal */}
            {isViewModalOpen && selectedItem && (
                <div className={styles.modalOverlay} onClick={() => setIsViewModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <h2 className={styles.modalTitle}>{selectedItem.title}</h2>
                                <span className={styles.categoryBadge} style={{ width: 'fit-content' }}>
                                    {categories.find(c => c.id === selectedItem.category)?.label || 'Chưa phân loại'}
                                </span>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setIsViewModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.viewer}>
                                {/* Removed description display as requested */}
                                <div
                                    className="ql-editor"
                                    style={{ padding: 0 }}
                                    dangerouslySetInnerHTML={{ __html: selectedItem.content }}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            {selectedItem.readBy && selectedItem.readBy.length > 0 && (
                                <div
                                    className={styles.readerCount}
                                    title="Nhấn để xem danh sách"
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    onClick={() => setIsReadersListOpen(true)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {selectedItem.readBy.slice(0, 5).map((reader, idx) => {
                                            const p = personnel?.find(person => person.id === reader.userId);
                                            const avatar = p?.avatar || null;
                                            const name = p?.name || reader.userName || '?';
                                            return (
                                                <div key={idx} style={{
                                                    width: '26px',
                                                    height: '26px',
                                                    borderRadius: '50%',
                                                    border: '2px solid #2C2D31', // Matches modal bg mostly
                                                    marginLeft: idx > 0 ? '-10px' : 0,
                                                    backgroundColor: '#444',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    position: 'relative',
                                                    zIndex: 5 - idx
                                                }}>
                                                    {avatar ? (
                                                        <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <span style={{ fontSize: '10px', color: '#fff', fontWeight: '600' }}>{name.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {selectedItem.readBy.length > 5 && (
                                            <div style={{
                                                width: '26px',
                                                height: '26px',
                                                borderRadius: '50%',
                                                border: '2px solid #2C2D31',
                                                marginLeft: '-10px',
                                                backgroundColor: '#333',
                                                color: '#bbb',
                                                fontSize: '10px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                                zIndex: 0
                                            }}>
                                                +{selectedItem.readBy.length - 5}
                                            </div>
                                        )}
                                    </div>
                                    <span style={{ marginLeft: '4px' }}>{selectedItem.readBy.length} người đã đọc</span>
                                </div>
                            )}
                            <button className={styles.cancelBtn} onClick={() => setIsViewModalOpen(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Add Modal */}
            {isEditModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>{selectedItem ? 'Chỉnh sửa tài liệu' : 'Tạo tài liệu mới'}</h2>
                            <button className={styles.closeBtn} onClick={() => setIsEditModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Tiêu đề Tài liệu</label>
                                <input
                                    className={styles.input}
                                    placeholder="Vd: Hướng dẫn check-in đúng cách"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label className={styles.label}>Danh mục</label>
                                    {isManager && (
                                        <button
                                            type="button"
                                            className={styles.linkBtn}
                                            onClick={() => navigate('/settings')}
                                            style={{ fontSize: '12px', color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            Quản lý danh mục
                                        </button>
                                    )}
                                </div>
                                <select
                                    className={styles.select}
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="" disabled>Chọn danh mục...</option>
                                    {knowledgeCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Description field removed per user request */}

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nội dung chi tiết</label>
                                <ReactQuill
                                    theme="snow"
                                    value={formData.content}
                                    onChange={(content) => setFormData({ ...formData, content })}
                                    className={styles.quillEditor}
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, 3, false] }],
                                            ['bold', 'italic', 'underline', 'strike'],
                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                            ['link', 'clean']
                                        ],
                                    }}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setIsEditModalOpen(false)}>Hủy</button>
                            <button className={styles.addBtn} onClick={handleSave}>Lưu tài liệu</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Readers List Modal */}
            {isReadersListOpen && selectedItem && (
                <div className={styles.modalOverlay} style={{ zIndex: 1100 }} onClick={() => setIsReadersListOpen(false)}>
                    <div className={styles.modal} style={{ maxWidth: '400px', maxHeight: '600px', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle} style={{ fontSize: '18px' }}>Người đã xem ({selectedItem.readBy?.length || 0})</h3>
                            <button className={styles.closeBtn} onClick={() => setIsReadersListOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalBody} style={{ overflowY: 'auto', paddingRight: '4px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[...(selectedItem.readBy || [])].sort((a, b) => new Date(b.readAt || 0) - new Date(a.readAt || 0)).map((reader, idx) => {
                                    const person = personnel?.find(p => p.id === reader.userId);
                                    const avatar = person?.avatar || null;
                                    const name = person?.name || reader.userName || 'Unknown';
                                    const time = reader.readAt ? new Date(reader.readAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '';

                                    return (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#333', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {avatar ? (
                                                    <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ fontSize: '16px', color: '#fff', fontWeight: '600' }}>{name.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{name}</div>
                                                {time && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>Đã xem lúc: {time}</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KnowledgeHub;
