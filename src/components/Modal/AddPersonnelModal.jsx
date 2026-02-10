import React, { useState } from 'react';
import { X, Upload, Users, User, Mail, Send, Shield, ChevronDown, Plus, Loader2, BookOpen } from 'lucide-react';
import styles from './AddPersonnelModal.module.css';
import { useAppState } from '../../context/AppStateContext';

const AddPersonnelModal = ({ onClose, person = null }) => {
    const { addPersonnel, updatePersonnel, teams = [], roles = [], shiftDefinitions = [], user } = useAppState();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEdit = !!person;
    const isAmAdmin = user?.role === 'Admin' && user?.parentTeam === 'AM';

    // Helper to get default shift name
    const getDefaultShift = () => {
        if (shiftDefinitions.length > 0) {
            return shiftDefinitions[0].name;
        }
        return 'Ca 1';
    };

    const [formData, setFormData] = useState({
        name: person?.name || '',
        avatar: person?.avatar || '',
        parentTeam: person?.parentTeam || (isAmAdmin ? 'AM' : 'MKT Support'),
        team: person?.team || '',
        telegram: person?.telegram || '',
        email: person?.email || '',
        role: person?.role || 'Nhân viên',
        type: person?.type || 'CHÍNH THỨC',
        workShifts: person?.workShifts || (person?.workDays || []).reduce((acc, day) => ({ ...acc, [day]: person?.workShift || getDefaultShift() }), {}),
        permissions: person?.permissions || []
    });

    const [selectedDaysForShift, setSelectedDaysForShift] = useState([]);

    const parentTeams = (teams || []).filter(t => {
        if (!t || !t.name) return false;
        if (!['MKT Support', 'AM'].includes(t.name)) return false;
        if (isAmAdmin) return t.name === 'AM';
        return true;
    });
    const miniTeams = (teams || []).filter(t => t && t.name && !['MKT Support', 'AM'].includes(t.name));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (isEdit) {
                // Prepare the base update object with all core fields
                // We always send these to ensure consistency with the new schedule grid
                const updates = {
                    ...formData,
                    workDays: Object.keys(formData.workShifts),
                    workShift: Object.values(formData.workShifts)[0] || '',
                    updatedAt: new Date().toISOString()
                };

                // Optimization: If avatar hasn't changed, don't re-send the large base64 string
                if (formData.avatar === person.avatar) {
                    delete updates.avatar;
                }

                // Remove id from updates to avoid redundant field update
                delete updates.id;

                await updatePersonnel(person.id, updates);
            } else {
                // Generate a safe unique ID using timestamp and random string
                const uniqueId = `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                const newPerson = {
                    id: uniqueId,
                    ...formData,
                    workDays: Object.keys(formData.workShifts),
                    workShift: Object.values(formData.workShifts)[0] || getDefaultShift()
                };
                await addPersonnel(newPerson);
            }
            onClose();
        } catch (err) {
            console.error(isEdit ? "Failed to update personnel:" : "Failed to add personnel:", err);
            alert("Không thể lưu thay đổi: " + (err.message || "Máy chủ không phản hồi (có thể do ảnh quá lớn)"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Resize to max 256x256 (Thumbnails only need small resolution)
                    const maxDim = 256;
                    if (width > height) {
                        if (width > maxDim) {
                            height *= maxDim / width;
                            width = maxDim;
                        }
                    } else {
                        if (height > maxDim) {
                            width *= maxDim / height;
                            height = maxDim;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.6 quality to ensure it's well under 100KB limit
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    resolve(dataUrl);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert("File quá lớn! Vui lòng chọn ảnh dưới 10MB.");
                return;
            }
            try {
                const compressed = await compressImage(file);
                // Final safety check: base64 overhead is ~33%, limit is 100KB
                if (compressed.length > 90000) {
                    alert("Ảnh sau khi nén vẫn quá lớn cho máy chủ. Vui lòng thử ảnh khác đơn giản hơn.");
                    return;
                }
                setFormData({ ...formData, avatar: compressed });
            } catch (err) {
                console.error("Compression failed:", err);
                alert("Lỗi xử lý ảnh. Vui lòng thử ảnh khác.");
            }
        }
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <div className={styles.iconBox}>{isEdit ? <User size={20} /> : <Plus size={20} />}</div>
                        <div>
                            <h2>{isEdit ? 'Chỉnh Sửa Nhân Sự' : 'Thêm Nhân Sự Mới'}</h2>
                            <p>{isEdit ? 'Cập nhật thông tin tài khoản nhân sự' : 'Thiết lập thông tin tài khoản cho nhân viên mới'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={isSubmitting} className={styles.closeBtn}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarPreview}>
                            {formData.avatar ? (
                                <img src={formData.avatar} alt="Preview" />
                            ) : (
                                <div className={styles.avatarPlaceholder}><User size={32} /></div>
                            )}
                            <label className={styles.uploadOverlay}>
                                <Upload size={16} />
                                <input type="file" hidden onChange={handleAvatarChange} accept="image/*" disabled={isSubmitting} />
                            </label>
                        </div>
                        <div className={styles.avatarInfo}>
                            <span className={styles.avatarLabel}>Ảnh đại diện</span>
                            <span className={styles.avatarHint}>JPG, PNG, GIF. Tối đa 2MB.</span>
                        </div>
                    </div>

                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label>Họ và tên <span className={styles.required}>*</span></label>
                            <div className={styles.inputWrapper}>
                                <User size={16} className={styles.inputIcon} />
                                <input
                                    type="text"
                                    required
                                    placeholder="Nhập họ và tên nhân viên..."
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email công ty <span className={styles.required}>*</span></label>
                            <div className={styles.inputWrapper}>
                                <Mail size={16} className={styles.inputIcon} />
                                <input
                                    type="email"
                                    required
                                    placeholder="email@company.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Team <span className={styles.required}>*</span></label>
                                <div className={styles.selectWrapper}>
                                    <Users size={16} className={styles.inputIcon} />
                                    <select
                                        value={formData.parentTeam}
                                        onChange={(e) => setFormData({ ...formData, parentTeam: e.target.value })}
                                        disabled={isSubmitting}
                                    >
                                        {parentTeams.map(t => (
                                            <option key={t.id} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className={styles.dropdownIcon} />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Mini Team</label>
                                <div className={styles.selectWrapper}>
                                    <Users size={16} className={styles.inputIcon} />
                                    <select
                                        value={formData.team}
                                        onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Không có</option>
                                        {miniTeams.map(t => (
                                            <option key={t.id} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className={styles.dropdownIcon} />
                                </div>
                            </div>
                        </div>

                        <div className={styles.scheduleSection}>
                            <div className={styles.formGroup}>
                                <label>Lịch làm việc & Ca (Chọn ngày rồi chọn ca)</label>
                                <div className={styles.daySelector}>
                                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => {
                                        const isWorking = !!formData.workShifts[day];
                                        const currentShift = formData.workShifts[day];
                                        const isSelected = selectedDaysForShift.includes(day);

                                        return (
                                            <div key={day} className={styles.dayShiftGroup}>
                                                <button
                                                    type="button"
                                                    className={`${styles.dayBtn} ${isWorking ? styles.dayBtnActive : ''} ${isSelected ? styles.dayBtnSelected : ''}`}
                                                    onClick={() => {
                                                        const newSelected = isSelected
                                                            ? selectedDaysForShift.filter(d => d !== day)
                                                            : [...selectedDaysForShift, day];
                                                        setSelectedDaysForShift(newSelected);

                                                        // Toggle work status if not already selected
                                                        if (!isWorking && !isSelected) {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                workShifts: { ...prev.workShifts, [day]: getDefaultShift() }
                                                            }));
                                                        } else if (isWorking && isSelected) {
                                                            // If already selected and clicked again, remove work status
                                                            const newShifts = { ...formData.workShifts };
                                                            delete newShifts[day];
                                                            setFormData(prev => ({ ...prev, workShifts: newShifts }));
                                                            setSelectedDaysForShift(selectedDaysForShift.filter(d => d !== day));
                                                        }
                                                    }}
                                                    disabled={isSubmitting}
                                                >
                                                    <span className={styles.dayName}>{day}</span>
                                                    {isWorking && <span className={styles.dayShiftLabel}>{currentShift}</span>}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedDaysForShift.length > 0 && (
                                <div className={styles.formGroup} style={{ marginTop: '10px' }}>
                                    <label>Gán ca cho {selectedDaysForShift.join(', ')}:</label>
                                    <div className={styles.shiftSelector}>
                                        {(shiftDefinitions.length > 0 ? shiftDefinitions : [{ name: 'Ca 1' }, { name: 'Ca 2' }, { name: 'Ca 3' }]).map(shiftDef => {
                                            const shiftName = shiftDef.name;
                                            return (
                                                <button
                                                    type="button"
                                                    key={shiftName}
                                                    className={styles.shiftBtn}
                                                    onClick={() => {
                                                        const newShifts = { ...formData.workShifts };
                                                        selectedDaysForShift.forEach(day => {
                                                            newShifts[day] = shiftName;
                                                        });
                                                        setFormData(prev => ({ ...prev, workShifts: newShifts }));
                                                        setSelectedDaysForShift([]); // Clear selection after applying
                                                    }}
                                                    disabled={isSubmitting}
                                                >
                                                    {shiftName}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label>ID Telegram</label>
                            <div className={styles.inputWrapper}>
                                <Send size={16} className={styles.inputIcon} />
                                <input
                                    type="text"
                                    placeholder="@username"
                                    value={formData.telegram}
                                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Vai trò hệ thống</label>
                            <div className={styles.selectWrapper}>
                                <Shield size={16} className={styles.inputIcon} />
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    disabled={isSubmitting || (isEdit && person.role === 'Manager')}
                                    title={isEdit && person.role === 'Manager' ? 'Không thể thay đổi vai trò Manager' : ''}
                                >
                                    {roles.map(r => (
                                        <option key={r.id} value={r.name}>{r.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className={styles.dropdownIcon} />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Quyền hạn bổ sung</label>
                            <div className={styles.daySelector} style={{ gap: '10px' }}>
                                {[
                                    { id: 'knowledge.view', label: 'Xem Quy trình' },
                                    { id: 'knowledge.manage', label: 'Quản lý Quy trình' }
                                ].map(perm => {
                                    const hasPerm = (formData.permissions || []).includes(perm.id);
                                    return (
                                        <button
                                            type="button"
                                            key={perm.id}
                                            className={`${styles.dayBtn} ${hasPerm ? styles.dayBtnActive : ''} ${hasPerm ? styles.dayBtnSelected : ''}`}
                                            style={{ flexDirection: 'row', gap: '8px', minWidth: 'auto', padding: '10px 16px' }}
                                            onClick={() => {
                                                const currentPerms = formData.permissions || [];
                                                const newPerms = hasPerm
                                                    ? currentPerms.filter(p => p !== perm.id)
                                                    : [...currentPerms, perm.id];
                                                setFormData({ ...formData, permissions: newPerms });
                                            }}
                                            disabled={isSubmitting}
                                        >
                                            <BookOpen size={16} />
                                            <span className={styles.dayName} style={{ fontSize: '13px' }}>{perm.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button type="button" onClick={onClose} disabled={isSubmitting} className={styles.cancelBtn}>Hủy bỏ</button>
                        <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className={styles.spin} />
                                    Đang xử lý...
                                </>
                            ) : (
                                isEdit ? 'Cập nhật ngay' : 'Xác nhận thêm'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPersonnelModal;
