import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Store,
    Facebook,
    Instagram,
    MapPin,
    Navigation,
    Globe,
    FileText,
    Plus,
    Trash2
} from 'lucide-react';
import styles from './StoreModal.module.css';

const StoreModal = ({ isOpen, onClose, onSave, initialData = null }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState({
        name: '',
        facebook: { link: '', accounts: [''] }, // changed account -> accounts array
        instagram: { link: '', username: '', password: '', twoFactor: '' },
        maps: { link: '', accounts: [''] }, // changed account -> accounts array
        yelp: { link: '', mail: '', password: '' },
        other: { link: '', note: '' },
        notes: ''
    });

    useEffect(() => {
        if (initialData) {
            // Helper to normalize accounts from old string or new array
            const getInfoAccounts = (info) => {
                if (info?.accounts && Array.isArray(info.accounts)) return info.accounts;
                if (info?.account) return [info.account];
                return [''];
            };

            setFormData({
                name: initialData.name || '',
                facebook: {
                    link: '',
                    ...initialData.facebook,
                    accounts: getInfoAccounts(initialData.facebook)
                },
                instagram: { link: '', username: '', password: '', twoFactor: '', ...initialData.instagram },
                maps: {
                    link: '',
                    ...initialData.maps,
                    accounts: getInfoAccounts(initialData.maps)
                },
                yelp: { link: '', mail: '', password: '', ...initialData.yelp },
                other: { link: '', note: '', ...initialData.other },
                notes: initialData.notes || ''
            });
        } else {
            setFormData({
                name: '',
                facebook: { link: '', accounts: [''] },
                instagram: { link: '', username: '', password: '', twoFactor: '' },
                maps: { link: '', accounts: [''] },
                yelp: { link: '', mail: '', password: '' },
                other: { link: '', note: '' },
                notes: ''
            });
        }
        setActiveTab('general');
    }, [initialData, isOpen]);

    const handleChange = (section, field, value) => {
        if (section === 'root') {
            setFormData(prev => ({ ...prev, [field]: value }));
        } else {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            }));
        }
    };

    // New handlers for multi-account arrays
    const handleAccountChange = (section, index, value) => {
        setFormData(prev => {
            const newAccounts = [...prev[section].accounts];
            newAccounts[index] = value;
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    accounts: newAccounts
                }
            };
        });
    };

    const handleAddAccount = (section) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                accounts: [...prev[section].accounts, '']
            }
        }));
    };

    const handleRemoveAccount = (section, index) => {
        setFormData(prev => {
            const newAccounts = prev[section].accounts.filter((_, i) => i !== index);
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    accounts: newAccounts.length ? newAccounts : [''] // Keep at least one empty
                }
            };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'general', label: 'Thông tin chung', icon: Store },
        { id: 'facebook', label: 'Facebook', icon: Facebook },
        { id: 'instagram', label: 'Instagram', icon: Instagram },
        { id: 'maps', label: 'Google Maps', icon: MapPin },
        { id: 'yelp', label: 'Yelp', icon: Navigation },
        { id: 'other', label: 'Khác', icon: Globe },
    ];

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>
                        <Store size={20} className={styles.titleIcon} />
                        {initialData ? 'Chỉnh sửa thông tin Tiệm' : 'Thêm Tiệm mới'}
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.tabsContainer}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form className={styles.body} onSubmit={handleSubmit}>
                    {activeTab === 'general' && (
                        <div className={styles.tabContent}>
                            <div className={styles.formGroup}>
                                <label>Tên tiệm <span className={styles.required}>*</span></label>
                                <div className={styles.inputWrapper}>
                                    <Store size={16} className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleChange('root', 'name', e.target.value)}
                                        placeholder="Nhập tên tiệm (VD: Nail Bar & Spa...)"
                                        className={styles.input}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label><FileText size={14} /> Ghi chú chung</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleChange('root', 'notes', e.target.value)}
                                    placeholder="Ghi chú thêm về tiệm, địa chỉ, số điện thoại..."
                                    className={styles.textarea}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'facebook' && (
                        <div className={styles.tabContent}>
                            <div className={styles.formGroup}>
                                <label>Facebook Page Link</label>
                                <input
                                    type="text"
                                    value={formData.facebook.link}
                                    onChange={(e) => handleChange('facebook', 'link', e.target.value)}
                                    placeholder="https://facebook.com/..."
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Tài khoản đang quản lý (Admin/Editor)</label>
                                <div className={styles.multiInputList}>
                                    {formData.facebook.accounts.map((acc, index) => (
                                        <div key={index} className={styles.multiInputRow}>
                                            <input
                                                type="text"
                                                value={acc}
                                                onChange={(e) => handleAccountChange('facebook', index, e.target.value)}
                                                placeholder="VD: Nguyễn Văn A, Team Marketing..."
                                                className={styles.input}
                                            />
                                            {formData.facebook.accounts.length > 1 && (
                                                <button
                                                    type="button"
                                                    className={styles.removeBtn}
                                                    onClick={() => handleRemoveAccount('facebook', index)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className={styles.addInputBtn}
                                        onClick={() => handleAddAccount('facebook')}
                                    >
                                        <Plus size={14} /> Thêm tài khoản
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'instagram' && (
                        <div className={styles.tabContent}>
                            <div className={styles.formGroup}>
                                <label>Instagram Link</label>
                                <input
                                    type="text"
                                    value={formData.instagram.link}
                                    onChange={(e) => handleChange('instagram', 'link', e.target.value)}
                                    placeholder="https://instagram.com/..."
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={formData.instagram.username}
                                    onChange={(e) => handleChange('instagram', 'username', e.target.value)}
                                    placeholder="Tên đăng nhập..."
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Password</label>
                                <input
                                    type="text"
                                    value={formData.instagram.password}
                                    onChange={(e) => handleChange('instagram', 'password', e.target.value)}
                                    placeholder="Mật khẩu..."
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>2FA (Mã xác thực 2 lớp)</label>
                                <input
                                    type="text"
                                    value={formData.instagram.twoFactor}
                                    onChange={(e) => handleChange('instagram', 'twoFactor', e.target.value)}
                                    placeholder="Mã backup hoặc ghi chú 2FA..."
                                    className={styles.input}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'maps' && (
                        <div className={styles.tabContent}>
                            <div className={styles.formGroup}>
                                <label>Google Maps Link</label>
                                <input
                                    type="text"
                                    value={formData.maps.link}
                                    onChange={(e) => handleChange('maps', 'link', e.target.value)}
                                    placeholder="https://maps.google.com/..."
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Tài khoản quản lý (Google Account)</label>
                                <div className={styles.multiInputList}>
                                    {formData.maps.accounts.map((acc, index) => (
                                        <div key={index} className={styles.multiInputRow}>
                                            <input
                                                type="text"
                                                value={acc}
                                                onChange={(e) => handleAccountChange('maps', index, e.target.value)}
                                                placeholder="VD: admin@gmail.com..."
                                                className={styles.input}
                                            />
                                            {formData.maps.accounts.length > 1 && (
                                                <button
                                                    type="button"
                                                    className={styles.removeBtn}
                                                    onClick={() => handleRemoveAccount('maps', index)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className={styles.addInputBtn}
                                        onClick={() => handleAddAccount('maps')}
                                    >
                                        <Plus size={14} /> Thêm tài khoản
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'yelp' && (
                        <div className={styles.tabContent}>
                            <div className={styles.formGroup}>
                                <label>Yelp Link</label>
                                <input
                                    type="text"
                                    value={formData.yelp.link}
                                    onChange={(e) => handleChange('yelp', 'link', e.target.value)}
                                    placeholder="https://yelp.com/..."
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email đăng nhập</label>
                                <input
                                    type="text"
                                    value={formData.yelp.mail}
                                    onChange={(e) => handleChange('yelp', 'mail', e.target.value)}
                                    placeholder="Email..."
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Password</label>
                                <input
                                    type="text"
                                    value={formData.yelp.password}
                                    onChange={(e) => handleChange('yelp', 'password', e.target.value)}
                                    placeholder="Mật khẩu..."
                                    className={styles.input}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'other' && (
                        <div className={styles.tabContent}>
                            <div className={styles.formGroup}>
                                <label>Link khác</label>
                                <input
                                    type="text"
                                    value={formData.other.link}
                                    onChange={(e) => handleChange('other', 'link', e.target.value)}
                                    placeholder="Website, Tiktok, Twitter..."
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Ghi chú thêm</label>
                                <input
                                    type="text"
                                    value={formData.other.note}
                                    onChange={(e) => handleChange('other', 'note', e.target.value)}
                                    placeholder="Ghi chú về link này..."
                                    className={styles.input}
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.footer}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Hủy bỏ
                        </button>
                        <button type="submit" className={styles.submitBtn}>
                            <Save size={18} />
                            {initialData ? 'Lưu thay đổi' : 'Thêm mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StoreModal;
