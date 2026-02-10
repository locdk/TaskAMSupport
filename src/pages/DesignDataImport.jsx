import React, { useState, useEffect } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import styles from './DesignDataImport.module.css';
import Papa from 'papaparse';

const DESIGN_FIELDS = [
    { key: 'name', label: 'Tên Tiệm', required: true },
    { key: 'type', label: 'Loại Design', required: true },
    { key: 'completedAt', label: 'Ngày hoàn thành (dd/mm/yyyy)', required: true },
    { key: 'assignee', label: 'Người làm (Email/Tên)', required: true }
];

const DesignDataImport = () => {
    // Import State
    const [file, setFile] = useState(null);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [csvData, setCsvData] = useState([]);
    const [columnMapping, setColumnMapping] = useState({});
    const [preview, setPreview] = useState([]);
    const [importing, setImporting] = useState(false);
    const [results, setResults] = useState(null);

    // Context
    const {
        addTask,
        personnel = [],
        designTaskTypes = [],
        showToast
    } = useAppState();

    // Auto-map columns
    useEffect(() => {
        if (csvHeaders.length > 0) {
            const autoMap = {};
            DESIGN_FIELDS.forEach(field => {
                const match = csvHeaders.find(h =>
                    h.toLowerCase().includes(field.key.toLowerCase()) ||
                    h.toLowerCase().includes(field.label.toLowerCase())
                );
                if (match) {
                    autoMap[field.key] = match;
                }
            });
            setColumnMapping(autoMap);
        }
    }, [csvHeaders]);

    const downloadTemplate = () => {
        const headers = ['Store Name', 'Design Type', 'Completed Date', 'Assignee'];
        const sampleRow = ['Nail & Spa A', 'Logo', '30/12/2025', 'designer@example.com'];
        const filename = 'design_import_template.csv';

        const csvContent = [headers, sampleRow]
            .map(e => e.join(","))
            .join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResults(null);

            Papa.parse(selectedFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.meta.fields) {
                        setCsvHeaders(results.meta.fields);
                        setCsvData(results.data);
                        setPreview(results.data.slice(0, 5));
                    }
                },
                error: (error) => {
                    showToast('Lỗi đọc file CSV: ' + error.message, 'Lỗi', { type: 'error' });
                }
            });
        }
    };

    const handleMappingChange = (key, value) => {
        setColumnMapping(prev => ({ ...prev, [key]: value }));
    };

    const handleImport = async () => {
        // Validate required fields
        const missingRequired = DESIGN_FIELDS
            .filter(f => f.required && !columnMapping[f.key]);

        if (missingRequired.length > 0) {
            showToast(`Vui lòng chọn cột cho: ${missingRequired.map(f => f.label).join(', ')} `, 'Thiếu thông tin', { type: 'error' });
            return;
        }

        setImporting(true);
        let successCount = 0;
        let errorCount = 0;
        let errorDetails = [];

        try {
            for (let i = 0; i < csvData.length; i++) {
                const row = csvData[i];
                try {
                    // Extract data using mapping
                    const name = row[columnMapping.name];
                    if (!name) throw new Error("Thiếu Tên tiệm");

                    // Resolve Assignee
                    const assigneeRaw = row[columnMapping.assignee];
                    let assignee = null;
                    if (assigneeRaw) {
                        assignee = personnel.find(p =>
                            p.email?.toLowerCase() === assigneeRaw.toLowerCase() ||
                            p.name?.toLowerCase() === assigneeRaw.toLowerCase()
                        );
                    }

                    // Resolve Completed Date
                    const completedKey = columnMapping.completedAt;
                    const completedRaw = completedKey ? (row[completedKey] || '') : '';
                    let completedAt = null;
                    let completedTimestamp = null;
                    if (completedRaw && completedRaw.trim()) {
                        const parts = completedRaw.trim().split('/');
                        if (parts.length === 3) {
                            const [day, month, year] = parts.map(Number);
                            const dateObj = new Date(year, month - 1, day, 12, 0, 0);
                            if (!isNaN(dateObj.getTime())) {
                                completedAt = dateObj.toISOString();
                                completedTimestamp = dateObj.getTime();
                            }
                        }
                    }

                    // Resolve Type
                    const typeRaw = row[columnMapping.type];
                    if (!typeRaw) throw new Error("Thiếu Loại Design");

                    let type = typeRaw;
                    if (typeRaw) {
                        const t = (designTaskTypes || []).find(item => item.name.toLowerCase() === typeRaw.toLowerCase());
                        if (t) type = t.name;
                    }

                    const newTask = {
                        name: name,
                        title: `${type} - ${name}`,
                        content: `${type} cho ${name}`,
                        assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
                        support: assignee ? assignee.name : '',
                        status: 'Hoàn thành',
                        priority: 'Trung bình',
                        type: type,
                        source: 'design',
                        completedAt: completedAt || new Date().toISOString(),
                        completedTimestamp: completedTimestamp || Date.now(),
                        note: '',
                        comments: [],
                        createdAt: new Date().toISOString()
                    };

                    await addTask(newTask);
                    successCount++;

                } catch (err) {
                    errorCount++;
                    errorDetails.push(`Dòng ${i + 1}: ${err.message} `);
                }
            }

            setResults({
                total: csvData.length,
                success: successCount,
                errors: errorCount,
                errorDetails
            });

            if (successCount > 0) {
                showToast(`Đã import thành công ${successCount} tasks`, 'Thành công', { type: 'success' });
            }

        } catch (error) {
            showToast('Lỗi trong quá trình import: ' + error.message, 'Lỗi', { type: 'error' });
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Import Design Tasks</h1>
                <p className={styles.subtitle}>Nhập dữ liệu Design Task từ file CSV</p>
            </div>

            <div className={styles.content}>
                {/* Template Download */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <FileText size={20} />
                        <h2>Tải file mẫu Design</h2>
                    </div>
                    <p className={styles.sectionDesc}>
                        Tải file CSV mẫu với 4 cột: Tên Tiệm, Loại Design, Ngày hoàn thành, Người làm.
                    </p>
                    <button onClick={downloadTemplate} className={styles.btnSecondary}>
                        <Download size={18} />
                        Tải file mẫu CSV
                    </button>
                </div>

                {/* Import Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <Upload size={20} />
                        <h2>Import Tasks từ CSV</h2>
                    </div>
                    <p className={styles.sectionDesc}>
                        Chọn file CSV cần import.
                    </p>

                    <div className={styles.uploadArea}>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className={styles.fileInput}
                            id="csv-upload-design"
                        />
                        <label htmlFor="csv-upload-design" className={styles.uploadLabel}>
                            <Upload size={32} />
                            <span>{file ? file.name : 'Chọn file CSV'}</span>
                            <small>Kéo thả hoặc click để chọn file</small>
                        </label>
                    </div>

                    {file && csvHeaders.length > 0 && (
                        <div className={styles.mappingSection}>
                            <div className={styles.mappingHeader}>
                                <h3>Cấu hình cột dữ liệu</h3>
                            </div>
                            <div className={styles.mappingGrid}>
                                {DESIGN_FIELDS.map(field => (
                                    <div key={field.key} className={styles.mappingField}>
                                        <label className={styles.mappingLabel}>
                                            {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                                        </label>
                                        <select
                                            className={styles.mappingSelect}
                                            value={columnMapping[field.key] || ''}
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

                    {preview.length > 0 && (
                        <div className={styles.preview}>
                            <h3>Xem trước ({preview.length} dòng đầu tiên)</h3>
                            <div className={styles.previewTable}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Tên tiệm</th>
                                            <th>Loại Design</th>
                                            <th>Ngày hoàn thành</th>
                                            <th>Người làm</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, idx) => (
                                            <tr key={idx}>
                                                <td>{row[columnMapping.name] || '-'}</td>
                                                <td>{row[columnMapping.type] || '-'}</td>
                                                <td>{row[columnMapping.completedAt] || '-'}</td>
                                                <td>{row[columnMapping.assignee] || '-'}</td>
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
                            {importing ? 'Đang import...' : 'Bắt đầu Import'}
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
                                <span className={`${styles.statValue} ${styles.success} `}>{results.success}</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statLabel}>Lỗi:</span>
                                <span className={`${styles.statValue} ${styles.error} `}>{results.errors}</span>
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

export default DesignDataImport;
