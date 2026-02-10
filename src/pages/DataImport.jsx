
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Upload, Download, FileText, AlertCircle, CheckCircle2, X, UploadCloud, RefreshCcw } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import styles from './DataImport.module.css';
import Papa from 'papaparse';

import GoogleSheetConfig from '../components/GoogleSheetConfig';

const SUPPORT_FIELDS = [
    { key: 'name', label: 'Tên Tiệm', required: true },
    { key: 'content', label: 'Nội dung', required: true },
    { key: 'support', label: 'Support (Email/Tên)', required: false },
    { key: 'am', label: 'AM (Account Manager)', required: false },
    { key: 'status', label: 'Trạng thái', required: false },
    { key: 'priority', label: 'Mức độ', required: false },
    { key: 'deadline', label: 'Deadline (dd/mm/yyyy)', required: false },
    { key: 'completedAt', label: 'Ngày hoàn thành (dd/mm/yyyy)', required: false },
    { key: 'type', label: 'Loại Task', required: false },
    { key: 'note', label: 'Ghi chú', required: false }
];



const DataImport = () => {
    // Import State
    const [file, setFile] = useState(null);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [csvData, setCsvData] = useState([]);
    const [columnMapping, setColumnMapping] = useState({});
    const [preview, setPreview] = useState([]);
    const [importing, setImporting] = useState(false);
    const [results, setResults] = useState(null);

    // Sync Report State
    const [syncPeriod, setSyncPeriod] = useState('month');
    const [isSyncingReport, setIsSyncingReport] = useState(false);

    // Context
    const {
        tasks,
        addTask,
        personnel,
        taskStatuses,
        taskPriorities,
        taskTypes,
        designTaskTypes,
        showToast,
        settings,
        canDo,
        user
    } = useAppState();

    const currentFields = SUPPORT_FIELDS;

    // Auto-map columns when headers or import type changes
    useEffect(() => {
        if (csvHeaders.length > 0) {
            const autoMap = {};
            currentFields.forEach(field => {
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

    const getReportRange = (period) => {
        const now = new Date();
        const nowGMT7 = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
        const start = new Date(nowGMT7);
        const end = new Date(nowGMT7);
        end.setHours(23, 59, 59, 999);

        if (period === 'last-month') {
            start.setMonth(start.getMonth() - 1);
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setDate(0);
            end.setHours(23, 59, 59, 999);
        } else {
            // month
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
        }
        return { start, end };
    };

    const handleSyncReport = async () => {
        const webhookUrl = settings?.reportSyncWebhook || settings?.googleSheetWebhook;
        if (!webhookUrl) {
            showToast('Vui lòng cấu hình Webhook URL trước khi đồng bộ.', 'error');
            return;
        }

        setIsSyncingReport(true);
        try {
            const range = getReportRange(syncPeriod);

            // Filter Logic 
            const mktSupportIds = new Set((personnel || []).filter(p => {
                const pTeam = (p.parentTeam || p.team || '').toLowerCase();
                const hasWorkShifts = p.workShifts && Object.keys(p.workShifts).length > 0;
                return pTeam === 'mkt support' && hasWorkShifts;
            }).map(p => p.id));

            const tasksToSync = tasks.filter(t => {
                if (!t.assignee || !mktSupportIds.has(t.assignee.id)) return false;
                if (t.source === 'design' || t.deletePending) return false;

                const createdTimestamp = parseInt(t.id?.toString().match(/TASK-(\d+)$/)?.[1] || 0);
                if (!createdTimestamp) return false;

                const date = new Date(createdTimestamp);
                return date >= range.start && date <= range.end;
            });

            if (tasksToSync.length === 0) {
                showToast('Không có dữ liệu task trong khoảng thời gian này.', 'info');
                return;
            }

            showToast(`Đang đồng bộ ${tasksToSync.length} task...`, 'info');

            const monthStr = `Tháng ${String(range.start.getMonth() + 1).padStart(2, '0')} -${range.start.getFullYear()} `;

            const payload = {
                sheetName: monthStr,
                tasks: tasksToSync.map(task => {
                    // Helper to format any timestamp (Firestore or number or string)
                    const formatTimestamp = (val) => {
                        if (!val) return '';
                        // If it's a Firestore Timestamp object
                        if (val?.seconds) {
                            return new Date(val.seconds * 1000).toLocaleString('en-GB');
                        }
                        // If it's already a formatted string (contains /)
                        if (typeof val === 'string' && val.includes('/')) {
                            return val;
                        }
                        // If it's a number (timestamp in ms)
                        if (typeof val === 'number' && val > 1000000000000) {
                            return new Date(val).toLocaleString('en-GB');
                        }
                        return String(val);
                    };

                    // Extract createdAt from task ID if not available
                    let createdAtFormatted = formatTimestamp(task.createdAt);
                    if (!createdAtFormatted) {
                        const idMatch = task.id?.toString().match(/TASK-(\d+)$/);
                        if (idMatch) {
                            const ts = parseInt(idMatch[1]);
                            if (ts > 1000000000000) {
                                createdAtFormatted = new Date(ts).toLocaleString('en-GB');
                            }
                        }
                    }

                    return {
                        id: task.id,
                        name: task.name || '',
                        content: (task.content || task.title || '').substring(0, 500),
                        type: task.type || '',
                        status: task.status || '',
                        priority: task.priority || '',
                        assignee: task.support || (task.assignee?.name) || '',
                        createdAt: createdAtFormatted,
                        deadline: task.deadline || task.dueDate || '',
                        completedAt: formatTimestamp(task.completedAt) || formatTimestamp(task.completedTimestamp)
                    };
                })
            };

            await fetch(webhookUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            showToast(`Đã đồng bộ thành công vào Sheet: ${monthStr} `, 'success');

        } catch (error) {
            showToast('Lỗi đồng bộ: ' + error.message, 'error');
        } finally {
            setIsSyncingReport(false);
        }
    };

    const downloadTemplate = () => {
        let headers, sampleRow, filename;

        headers = ['Store Name', 'Task Content', 'Assignee', 'Status', 'Priority', 'Deadline', 'Completed Date', 'Task Type', 'Notes'];
        sampleRow = ['Nail & Spa A', 'Thiết kế logo mới', 'designer@example.com', 'Mới', 'Cao', '30/12/2025', '', 'Design', 'Gấp'];
        filename = 'task_import_template.csv';

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
        const missingRequired = currentFields
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
                    const noteKey = columnMapping.note;
                    const note = noteKey ? (row[noteKey] || '') : '';

                    // Create comments array from note if exists
                    const comments = [];
                    if (note && note.trim()) {
                        comments.push({
                            id: `import-${Date.now()}-${i}`,
                            author: 'Import',
                            text: note.trim(),
                            time: new Date().toLocaleString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: '2-digit'
                            })
                        });
                    }

                    // Resolve Assignee (Common logic)
                    const assigneeRaw = row[columnMapping.assignee] || row[columnMapping.support];
                    let assignee = null;
                    if (assigneeRaw) {
                        assignee = personnel.find(p =>
                            p.email?.toLowerCase() === assigneeRaw.toLowerCase() ||
                            p.name?.toLowerCase() === assigneeRaw.toLowerCase()
                        );
                    }

                    // Resolve Completed Date (Common logic)
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

                    let newTask = {};

                    // --- SUPPORT TASK LOGIC ---
                    const content = row[columnMapping.content];
                    if (!name || !content) throw new Error("Thiếu Tên tiệm hoặc Nội dung");

                    // Resolve Status
                    const statusRaw = row[columnMapping.status];
                    let status = 'Mới';
                    if (statusRaw) {
                        const s = taskStatuses.find(item => item.name.toLowerCase() === statusRaw.toLowerCase());
                        if (s) status = s.name;
                    }

                    // Resolve Priority
                    const priorityRaw = row[columnMapping.priority];
                    let priority = 'Trung bình';
                    if (priorityRaw) {
                        const p = taskPriorities.find(item => item.name.toLowerCase() === priorityRaw.toLowerCase());
                        if (p) priority = p.name;
                    }

                    // Resolve Type
                    const typeRaw = row[columnMapping.type];
                    let type = 'Khác';
                    if (typeRaw) {
                        const t = taskTypes.find(item => item.name.toLowerCase() === typeRaw.toLowerCase());
                        if (t) type = t.name;
                    }

                    // Resolve AM
                    const amRaw = row[columnMapping.am];
                    let amName = '';
                    if (amRaw) {
                        const amPerson = personnel.find(p =>
                            p.email?.toLowerCase() === amRaw.toLowerCase() ||
                            p.name?.toLowerCase() === amRaw.toLowerCase()
                        );
                        amName = amPerson ? amPerson.name : amRaw;
                    }

                    // Deadline
                    const deadlineKey = columnMapping.deadline;
                    const deadlineRaw = deadlineKey ? (row[deadlineKey] || '') : '';
                    let deadline = deadlineRaw;
                    let dueDate = null;
                    if (deadlineRaw && deadlineRaw.trim()) {
                        const parts = deadlineRaw.trim().split('/');
                        if (parts.length === 3) {
                            const [day, month, year] = parts;
                            dueDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                            deadline = deadlineRaw.trim();
                        }
                    }

                    newTask = {
                        name: name,
                        title: content,
                        content: content,
                        assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
                        support: assignee ? assignee.name : '',
                        am: amName,
                        status: status,
                        priority: priority,
                        type: type,
                        deadline: deadline || null,
                        dueDate: dueDate || null,
                        completedAt: completedAt || null,
                        completedTimestamp: completedTimestamp || null,
                        note: note || '',
                        comments: comments,
                        source: 'import',
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
                <h1 className={styles.title}>Import/Export Dữ liệu</h1>
                <p className={styles.subtitle}>Nhập dữ liệu task từ Google Sheets hoặc xuất dữ liệu hiện tại</p>
            </div>

            <div className={styles.content}>
                {/* Webhook Settings Section */}
                {/* Webhook Settings Section - Store Logs */}
                <GoogleSheetConfig
                    label="Google Sheet Sync Nhật ký hoạt động (Webhook)"
                />

                {/* Webhook Settings Section - Report Sync */}
                <GoogleSheetConfig
                    configKey="reportSyncWebhook"
                    label="Google Sheet Sync Dữ liệu Task (Webhook)"
                    description="Dán đường dẫn Web App URL để đồng bộ dữ liệu báo cáo Task."
                />

                {/* Report Sync Action */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <UploadCloud size={20} />
                        <h2>Đồng bộ Dữ liệu Task lên Google Sheet</h2>
                    </div>
                    <p className={styles.sectionDesc}>
                        Chọn kỳ báo cáo và đồng bộ dữ liệu Tasks MKT Support lên Google Sheets.
                    </p>
                    <div className={styles.syncContainer}>
                        <div style={{ width: 1, height: 24, background: '#444', margin: '0 8px' }} />
                        <select
                            value={syncPeriod}
                            onChange={(e) => setSyncPeriod(e.target.value)}
                            className={styles.mappingSelect}
                            style={{ minWidth: '150px' }}
                        >
                            <option value="month">Tháng này</option>
                            <option value="last-month">Tháng trước</option>
                        </select>
                        <button
                            className={styles.syncBtn}
                            onClick={handleSyncReport}
                            disabled={isSyncingReport}
                        >
                            {isSyncingReport ? <RefreshCcw className={styles.spin} size={16} /> : <UploadCloud size={16} />}
                            {isSyncingReport ? 'Đang đồng bộ...' : 'Đồng bộ Báo cáo'}
                        </button>
                    </div>
                </div>

                {/* Template Download */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <FileText size={20} />
                        <h2>Tải file mẫu</h2>
                    </div>
                    <p className={styles.sectionDesc}>
                        Tải file CSV mẫu để biết cấu trúc dữ liệu cần thiết
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
                        Chọn file CSV từ Google Sheets của bạn (File → Download → CSV)
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

                    {file && csvHeaders.length > 0 && (
                        <div className={styles.mappingSection}>
                            <div className={styles.mappingHeader}>
                                <h3>Cấu hình cột dữ liệu</h3>
                            </div>
                            <div className={styles.mappingGrid}>
                                {currentFields.map(field => (
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
                                            <th>Nội dung</th>
                                            <th>Support</th>
                                            <th>Trạng thái</th>
                                            <th>Deadline</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, idx) => (
                                            <tr key={idx}>
                                                <td>{row[columnMapping.name] || '-'}</td>
                                                <td>{(row[columnMapping.content])?.substring(0, 50) || '-'}</td>
                                                <td>{row[columnMapping.support] || '-'}</td>
                                                <td>{row[columnMapping.status] || '-'}</td>
                                                <td>{row[columnMapping.deadline] || '-'}</td>
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

export default DataImport;
