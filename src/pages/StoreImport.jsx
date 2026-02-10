import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle2, Store } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { Navigate } from 'react-router-dom';
import styles from './StoreImport.module.css';
import Papa from 'papaparse';

const StoreImport = () => {
    const { addStore, showToast, user, roles } = useAppState();

    const userRoleName = (user?.role || '').toLowerCase();

    // Import Permission: Only Manager and Supervisor
    const canImport = ['admin', 'manager', 'supervisor', 'quản lý'].includes(userRoleName);

    if (!canImport) {
        return <Navigate to="/store-handbook" replace />;
    }

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [importing, setImporting] = useState(false);
    const [results, setResults] = useState(null);
    const [csvHeaders, setCsvHeaders] = useState([]);

    // Define the structure of fields we want to map
    const [columnMapping, setColumnMapping] = useState({
        name: '', // Display Name
        maps_link: '', // Google Maps Link
        maps_account: '', // Google Account
        notes: '', // General Notes

        // Facebook
        fb_link: '',
        fb_account: '',

        // Instagram
        insta_link: '',
        insta_user: '',
        insta_pass: '',
        insta_2fa: '',

        // Yelp
        yelp_link: '',
        yelp_mail: '',
        yelp_pass: '',

        // Other
        other_link: '',
        other_note: ''
    });

    const SYSTEM_FIELDS = [
        { key: 'name', label: 'Tên Tiệm (Name) *', required: true },
        { key: 'maps_link', label: 'Google Maps Link', required: false },
        { key: 'maps_account', label: 'Google Account Quản lý', required: false },
        { key: 'notes', label: 'Ghi chú chung', required: false },

        { key: 'fb_link', label: 'Facebook Link', required: false },
        { key: 'fb_account', label: 'Facebook Account', required: false },

        { key: 'insta_link', label: 'Instagram Link', required: false },
        { key: 'insta_user', label: 'Instagram User', required: false },
        { key: 'insta_pass', label: 'Instagram Pass', required: false },
        { key: 'insta_2fa', label: 'Instagram 2FA', required: false },

        { key: 'yelp_link', label: 'Yelp Link', required: false },
        { key: 'yelp_mail', label: 'Yelp Mail', required: false },
        { key: 'yelp_pass', label: 'Yelp Pass', required: false },

        { key: 'other_link', label: 'Khác (Link)', required: false },
        { key: 'other_note', label: 'Khác (Ghi chú)', required: false },
    ];

    const autoMapColumns = (headers) => {
        const mapping = { ...columnMapping };
        const lowerHeaders = headers.map(h => h.toLowerCase());

        const findMatch = (keywords) => {
            for (let i = 0; i < headers.length; i++) {
                if (keywords.some(k => lowerHeaders[i].includes(k) || k.includes(lowerHeaders[i]))) return headers[i];
            }
            return '';
        };

        // Auto-mapping logic
        mapping.name = findMatch(['tên tiệm', 'shop name', 'name', 'store']);
        mapping.maps_link = findMatch(['địa chỉ', 'address', 'maps link', 'google maps', 'location']);
        mapping.maps_account = findMatch(['google account', 'maps account', 'account review', 'tài khoản google', 'maps acc']);
        mapping.notes = findMatch(['ghi chú', 'notes', 'general note']);

        mapping.fb_link = findMatch(['facebook link', 'fb link']);
        mapping.fb_account = findMatch(['facebook account', 'fb account']);

        mapping.insta_link = findMatch(['instagram link', 'insta link']);
        mapping.insta_user = findMatch(['instagram user', 'insta user']);
        mapping.insta_pass = findMatch(['instagram pass', 'insta pass']);
        mapping.insta_2fa = findMatch(['instagram 2fa', 'insta 2fa']);

        mapping.yelp_link = findMatch(['yelp link']);
        mapping.yelp_mail = findMatch(['yelp mail', 'yelp email']);
        mapping.yelp_pass = findMatch(['yelp pass']);

        mapping.other_link = findMatch(['other link', 'khác link']);
        mapping.other_note = findMatch(['other note', 'khác note']);

        setColumnMapping(mapping);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.csv')) {
            showToast('Vui lòng chọn file CSV', 'Lỗi');
            return;
        }

        setFile(selectedFile);

        // Parse CSV for preview and headers
        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                if (result.meta.fields) {
                    setCsvHeaders(result.meta.fields);
                    autoMapColumns(result.meta.fields);
                }
                setPreview(result.data.slice(0, 5)); // Show first 5 rows
            },
            error: (error) => {
                showToast('Lỗi đọc file: ' + error.message, 'Lỗi');
            }
        });
    };

    const handleMappingChange = (field, value) => {
        setColumnMapping(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImport = async () => {
        if (!file) {
            showToast('Vui lòng chọn file CSV', 'Lỗi');
            return;
        }

        if (!columnMapping.name) {
            showToast('Vui lòng chọn cột cho Tên Tiệm', 'Lỗi');
            return;
        }

        setImporting(true);
        setResults(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (result) => {
                const rows = result.data;
                let successCount = 0;
                let errorCount = 0;
                const errors = [];

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];

                    // Skip if name is missing
                    const storeName = row[columnMapping.name];
                    if (!storeName) {
                        errorCount++;
                        errors.push(`Dòng ${i + 2}: Thiếu tên tiệm`);
                        continue;
                    }

                    try {
                        const newStore = {
                            id: `STORE-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
                            name: storeName,

                            // Maps / Address
                            maps: {
                                link: row[columnMapping.maps_link] || '',
                                account: row[columnMapping.maps_account] || ''
                            },

                            // Facebook
                            facebook: {
                                link: row[columnMapping.fb_link] || '',
                                account: row[columnMapping.fb_account] || ''
                            },

                            // Instagram
                            instagram: {
                                link: row[columnMapping.insta_link] || '',
                                username: row[columnMapping.insta_user] || '',
                                password: row[columnMapping.insta_pass] || '',
                                twoFactor: row[columnMapping.insta_2fa] || ''
                            },

                            // Yelp
                            yelp: {
                                link: row[columnMapping.yelp_link] || '',
                                mail: row[columnMapping.yelp_mail] || '',
                                password: row[columnMapping.yelp_pass] || ''
                            },

                            // Other
                            other: {
                                link: row[columnMapping.other_link] || '',
                                note: row[columnMapping.other_note] || ''
                            },

                            notes: row[columnMapping.notes] || '',
                            createdAt: new Date().toISOString(),
                            deletePending: false
                        };

                        await addStore(newStore);
                        successCount++;
                    } catch (error) {
                        errorCount++;
                        errors.push(`Dòng ${i + 2}: ${error.message}`);
                    }
                }

                setResults({
                    total: rows.length,
                    success: successCount,
                    errors: errorCount,
                    errorDetails: errors
                });

                if (successCount > 0) {
                    showToast(`Đã import thành công ${successCount}/${rows.length} tiệm!`, 'Thành công');
                }

                setImporting(false);
            },
            error: (error) => {
                showToast('Lỗi import: ' + error.message, 'Lỗi');
                setImporting(false);
            }
        });
    };

    const downloadTemplate = () => {
        const template = `Name,Maps Link,Maps Account,Facebook Link,Facebook Account,Insta Link,Insta User,Insta Pass,Insta 2FA,Yelp Link,Yelp Mail,Yelp Pass,Other Link,Other Note,Notes
Example Nail,https://maps.google.com/...,google_acc@gmail.com,https://fb.com/...,page_admin@gmail.com,https://instagram.com/...,insta_user,pass123,KEY2FA,https://yelp.com/...,yelp@gmail.com,yelpPass,https://tiktok.com/...,TikTok Account,Ghi chú chung cho tiệm này`;

        const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'store_import_template.csv';
        link.click();
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Import Sổ tay thông tin (Store Handbook)</h1>
                <p className={styles.subtitle}>Nhập dữ liệu thông tin tiệm hàng loạt từ file CSV</p>
            </div>

            <div className={styles.content}>
                {/* Template Download */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <FileText size={20} />
                        <h2>Tải file mẫu</h2>
                    </div>
                    <p className={styles.sectionDesc}>
                        Tải file CSV mẫu với các cột tương ứng để nhập liệu nhanh chóng
                    </p>
                    <button onClick={downloadTemplate} className={styles.btnSecondary}>
                        <Download size={18} />
                        Tải file mẫu CSV
                    </button>
                </div>

                {/* Mapping Section */}
                {file && csvHeaders.length > 0 && (
                    <div className={styles.mappingSection}>
                        <div className={styles.mappingHeader}>
                            <h3>Cấu hình cột dữ liệu</h3>
                        </div>
                        <div className={styles.mappingGrid}>
                            {SYSTEM_FIELDS.map(field => (
                                <div key={field.key} className={styles.mappingField}>
                                    <label className={styles.mappingLabel}>
                                        {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                                    </label>
                                    <select
                                        className={styles.mappingSelect}
                                        value={columnMapping[field.key]}
                                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                    >
                                        <option value="">-- Chọn cột --</option>
                                        {csvHeaders.map(header => (
                                            <option key={header} value={header}>{header}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Import Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <Upload size={20} />
                        <h2>Import Data</h2>
                    </div>
                    <p className={styles.sectionDesc}>
                        Chọn file CSV (File → Download → CSV từ Google Sheets)
                    </p>

                    <div className={styles.uploadArea}>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className={styles.fileInput}
                            id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className={styles.uploadLabel}>
                            <Upload size={32} />
                            <span>{file ? file.name : 'Chọn file CSV'}</span>
                            <small>Kéo thả hoặc click để chọn file</small>
                        </label>
                    </div>

                    {preview.length > 0 && (
                        <div className={styles.preview}>
                            <h3>Xem trước ({preview.length} dòng đầu tiên)</h3>
                            <div className={styles.previewTable}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Tên Tiệm</th>
                                            <th>FB Link</th>
                                            <th>Insta User</th>
                                            <th>Maps Link</th>
                                            <th>Maps Acc</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, idx) => (
                                            <tr key={idx}>
                                                <td>{row[columnMapping.name] || '-'}</td>
                                                <td>{row[columnMapping.fb_link] || '-'}</td>
                                                <td>{row[columnMapping.insta_user] || '-'}</td>
                                                <td>{row[columnMapping.maps_link] || '-'}</td>
                                                <td>{row[columnMapping.maps_account] || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {file && (
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className={styles.btnPrimary}
                        >
                            <Store size={20} />
                            {importing ? 'Đang import...' : 'Tiến hành Import'}
                        </button>
                    )}
                </div>

                {/* Results */}
                {results && (
                    <div className={styles.results}>
                        <div className={styles.resultHeader}>
                            <CheckCircle2 size={24} color="#52c41a" />
                            <h3>Kết quả Import</h3>
                        </div>
                        <div className={styles.resultStats}>
                            <div className={styles.stat}>
                                <span className={styles.statLabel}>Tổng số:</span>
                                <span className={styles.statValue}>{results.total}</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statLabel}>Thành công:</span>
                                <span className={`${styles.statValue} ${styles.success}`}>{results.success}</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statLabel}>Lỗi:</span>
                                <span className={`${styles.statValue} ${styles.error}`}>{results.errors}</span>
                            </div>
                        </div>

                        {results.errorDetails.length > 0 && (
                            <div className={styles.errorList}>
                                <h4>Chi tiết lỗi:</h4>
                                {results.errorDetails.map((err, idx) => (
                                    <div key={idx} className={styles.errorItem}>
                                        <AlertCircle size={16} />
                                        <span>{err}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreImport;
