import React from 'react';
import { X, Camera, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import styles from './DayScheduleModal.module.css';

const DayScheduleModal = ({ onClose, date, data = [], onUpdateItem, userRole, shiftDefinitions = [] }) => {
    const [editingId, setEditingId] = React.useState(null);
    const [isCapturing, setIsCapturing] = React.useState(false);
    const modalRef = React.useRef(null);
    const isBoss = userRole === 'Manager' || userRole === 'Admin';

    // Helper to get default shift name
    const getDefaultShift = () => {
        if (shiftDefinitions.length > 0) {
            return shiftDefinitions[0].name;
        }
        return 'Ca 1';
    };

    const statusOptions = [
        ...shiftDefinitions.map(shift => ({
            label: `Work (${shift.name})`,
            status: 'Work',
            shift: shift.name
        })),
        { label: 'OFF (Không lương)', status: 'OFF', shift: '' },
        { label: 'NP (Phép năm)', status: 'NP', shift: '' },
        { label: 'ME (MAC Energy)', status: 'ME', shift: '' },
        { label: 'NL (Nghỉ lễ)', status: 'NL', shift: '' },
    ];

    // Helper to format date like "February 6, 2026"
    const formatDate = (dateObj) => {
        if (!dateObj) return '';
        const d = new Date(dateObj);
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getShiftClass = (shift) => {
        const s = (shift || '').toLowerCase();

        if (s === 'pending' || s === 'chờ duyệt') return styles.shiftPending;

        if (s === 'ca 3' || s === 'ca 3a') return styles.shiftCa3;

        // Dynamic colors based on shift index if possible, or fallback to styles
        const index = shiftDefinitions.findIndex(sd => sd.name.toLowerCase() === s);

        if (index === 0) return styles.shiftCa1;
        if (index === 1) return styles.shiftCa2;
        if (index === 2) return styles.shiftCa3;
        if (index > 2) return styles.shiftOther;

        if (s === 'work') return styles.shiftCa1;
        if (s === 'off') return styles.shiftOFF;
        if (s === 'np' || s === 'phép năm') return styles.shiftNP;
        if (s === 'me' || s === 'mac energy') return styles.shiftME;
        if (s === 'nl' || s === 'nghỉ lễ') return styles.shiftNL;
        return styles.shiftOther;
    };

    const getShiftLabel = (status, shiftName) => {
        if ((status || '').startsWith('PENDING_')) return 'CHỜ DUYỆT';

        if (status === 'OFF') return 'OFF';
        if (status === 'NL') return 'NL';
        if (status === 'NP') return 'NP';
        if (status === 'ME') return 'ME';

        if (shiftName) return shiftName;
        return getDefaultShift();
    };

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const quotes = [
        "Success is not final, failure is not fatal: It is the courage to continue that counts.",
        "The only way to do great work is to love what you do.",
        "Believe you can and you're halfway there.",
        "Your limitation—it's only your imagination.",
        "Push yourself, because no one else is going to do it for you.",
        "Great things never came from comfort zones.",
        "Dream it. Wish it. Do it.",
        "Success doesn’t just find you. You have to go out and get it.",
        "The harder you work for something, the greater you’ll feel when you achieve it.",
        "Dream bigger. Do bigger.",
        "Don’t stop when you’re tired. Stop when you’re done.",
        "Wake up with determination. Go to bed with satisfaction.",
        "Do something today that your future self will thank you for.",
        "Little things make big days.",
        "It’s going to be hard, but hard does not mean impossible.",
        "Don’t wait for opportunity. Create it.",
        "Every day is a second chance.",
        "Focus on being productive instead of busy.",
        "Work hard in silence, let your success be your noise.",
        "The key to success is to focus on goals, not obstacles."
    ];

    const [randomQuote] = React.useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

    // Sorting logic using shiftDefinitions order
    const getSortWeight = (status, shift) => {
        if (status !== 'Work') return 100; // Put non-work at bottom

        const shiftName = shift || getDefaultShift();
        const index = shiftDefinitions.findIndex(sd => sd.name === shiftName);

        return index !== -1 ? index : 99;
    };

    const sortedData = [...data].sort((a, b) => {
        const weightA = getSortWeight(a.status, a.workShift);
        const weightB = getSortWeight(b.status, b.workShift);
        return weightA - weightB;
    });

    const handleCapture = async () => {
        if (!modalRef.current) return;

        try {
            setIsCapturing(true);
            const canvas = await html2canvas(modalRef.current, {
                backgroundColor: '#ffffff', // Match modal background (Light theme)
                scale: 2 // High resolution
            });

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    alert('Không thể tạo ảnh.');
                    setIsCapturing(false);
                    return;
                }

                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            [blob.type]: blob
                        })
                    ]);
                    alert('Đã copy ảnh lịch làm việc vào clipboard!');
                } catch (err) {
                    console.error("Clipboard write failed", err);
                    // Fallback to download
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/png');
                    link.download = `Lich_Lam_Viec_${date.getDate()}_${date.getMonth() + 1}.png`;
                    link.click();
                }
                setTimeout(() => setIsCapturing(false), 1000);
            }, 'image/png');
        } catch (err) {
            console.error(err);
            alert('Có lỗi khi chụp ảnh.');
            setIsCapturing(false);
        }
    };

    const getShiftColor = (index) => {
        const colors = ['#28a745', '#1890ff', '#9254de', '#fa8c16', '#eb2f96', '#13c2c2'];
        return colors[index % colors.length];
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()} ref={modalRef}>
                <div className={styles.header}>
                    <h2 className={styles.title}>MARKETING SUPPORT TEAM</h2>
                    <p className={styles.subtitle}>{formatDate(date)}</p>
                    <div className={styles.headerActions}>
                        <button className={styles.closeBtn} onClick={handleCapture} title="Chụp ảnh">
                            {isCapturing ? <Check size={20} color="#52c41a" /> : <Camera size={20} />}
                        </button>
                        <button className={styles.closeBtn} onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className={styles.body}>
                    <table className={styles.table}>
                        <colgroup>
                            <col style={{ width: '50px' }} />
                            <col style={{ width: '25%' }} />
                            <col style={{ width: '35%' }} />
                            <col style={{ width: 'auto' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th className={styles.stt}>STT</th>
                                <th>Tên nhân sự</th>
                                <th>Job Title</th>
                                <th style={{ textAlign: 'center' }}>Ca làm việc</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.length > 0 ? (
                                sortedData.map((item, index) => {
                                    const shiftLabel = getShiftLabel(item.status, item.workShift);
                                    return (
                                        <tr key={index}>
                                            <td className={styles.stt}>{index + 1}</td>
                                            <td>
                                                <div className={styles.userInfo}>
                                                    {item.avatar ? (
                                                        <img src={item.avatar} alt={item.userName} className={styles.avatar} />
                                                    ) : (
                                                        <div className={styles.avatarFallback}>{getInitials(item.userName)}</div>
                                                    )}
                                                    <span>{item.userName}</span>
                                                </div>
                                            </td>
                                            <td className={styles.role}>{item.role || 'Nhân viên'}</td>
                                            <td style={{ textAlign: 'center', position: 'relative' }}>
                                                <div
                                                    className={`${styles.shiftBadge} ${getShiftClass(shiftLabel)} ${isBoss ? styles.editableBadge : ''}`}
                                                    onClick={() => isBoss && setEditingId(editingId === item.userId ? null : item.userId)}
                                                >
                                                    {shiftLabel}
                                                </div>

                                                {editingId === item.userId && isBoss && (
                                                    <div className={`${styles.statusDropdown} ${index > sortedData.length - 4 ? styles.dropup : ''}`}>
                                                        {statusOptions.map(opt => (
                                                            <div
                                                                key={opt.label}
                                                                className={styles.dropdownItem}
                                                                onClick={() => {
                                                                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                                                    onUpdateItem({
                                                                        date: dateStr,
                                                                        status: opt.status,
                                                                        workShift: opt.shift,
                                                                        userId: item.userId,
                                                                        userName: item.userName
                                                                    });
                                                                    setEditingId(null);
                                                                }}
                                                            >
                                                                {opt.label}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                        Chưa có dữ liệu lịch làm việc cho ngày này.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.footer}>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                        <div style={{ marginBottom: '8px' }}>
                            <span style={{ color: '#666', fontSize: '13px', fontWeight: 600 }}>
                                Ca 1 : 9:00 AM - 5:00 PM &nbsp;/&nbsp; Ca 2 : 10:00 AM - 6:00 PM &nbsp;/&nbsp; Ca 3: 11:00 AM - 9:00 PM
                            </span>
                        </div>
                        <div style={{ color: '#d46b08', fontSize: '12px', fontWeight: 700, fontStyle: 'italic', marginBottom: '8px' }}>
                            Central (Texas) Time
                        </div>
                        <div style={{ color: '#333', fontSize: '14px', fontStyle: 'italic', fontFamily: 'serif', fontWeight: 700, letterSpacing: '0.5px' }}>
                            "{randomQuote}"
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DayScheduleModal;
