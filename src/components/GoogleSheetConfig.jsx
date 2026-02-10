import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import styles from './GoogleSheetConfig.module.css';
import { useAppState } from '../context/AppStateContext';

const GoogleSheetConfig = ({
    configKey = 'googleSheetWebhook',
    label = 'Google Sheet Sync Configuration (Webhook)',
    description = 'Dán đường dẫn Web App URL từ Google Apps Script để đồng bộ dữ liệu tự động.',
    placeholder = 'https://script.google.com/macros/s/...'
}) => {
    const { settings, updateSettingsData, showToast } = useAppState();

    // Webhook Configuration State
    const [webhookUrl, setWebhookUrl] = useState('');
    const [savingWebhook, setSavingWebhook] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);

    // Load existing webhook URL on mount/update
    useEffect(() => {
        if (settings?.[configKey]) {
            setWebhookUrl(settings[configKey]);
        } else {
            setWebhookUrl('');
        }
    }, [settings, configKey]);

    const handleSaveWebhook = async () => {
        setSavingWebhook(true);
        try {
            await updateSettingsData({ [configKey]: webhookUrl });
            showToast('Đã lưu cấu hình Webhook thành công!', 'Thành công');
        } catch (error) {
            showToast('Lỗi lưu cấu hình: ' + error.message, 'Lỗi');
        } finally {
            setSavingWebhook(false);
        }
    };

    const handleTestConnection = async () => {
        if (!webhookUrl) return;
        setTestingConnection(true);
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'test_connection',
                    message: 'Hello from Task Manager App!',
                    timestamp: new Date().toISOString(),
                    user: 'User Test'
                })
            });
            showToast('Đã gửi yêu cầu kiểm tra! Vui lòng kiểm tra Google Sheet.', 'Đã gửi', { type: 'success' });
        } catch (error) {
            showToast('Lỗi kết nối: ' + error.message, 'Lỗi', { type: 'error' });
        } finally {
            setTestingConnection(false);
        }
    };

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <FileText size={20} />
                <h2>{label}</h2>
            </div>
            <p className={styles.sectionDesc}>
                {description}
            </p>
            <div className={styles.uploadArea}>
                <input
                    type="text"
                    className={styles.fileInput}
                    placeholder={placeholder}
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleTestConnection}
                        className={styles.btnSecondary}
                        disabled={testingConnection || !webhookUrl}
                        style={{ minWidth: '130px', whiteSpace: 'nowrap' }}
                    >
                        {testingConnection ? 'Đang test...' : 'Kiểm tra kết nối'}
                    </button>
                    <button
                        onClick={handleSaveWebhook}
                        className={styles.btnPrimary}
                        disabled={savingWebhook}
                        style={{ minWidth: '150px', whiteSpace: 'nowrap' }}
                    >
                        {savingWebhook ? 'Đang lưu...' : 'Lưu cấu hình'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoogleSheetConfig;
