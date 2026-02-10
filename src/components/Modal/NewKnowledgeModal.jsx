import React from 'react';
import { X, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './NewKnowledgeModal.module.css';

const NewKnowledgeModal = ({ items, onClose }) => {
    const navigate = useNavigate();

    if (!items || items.length === 0) return null;

    const handleItemClick = (itemId) => {
        navigate(`/knowledge?id=${itemId}`);
        onClose();
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={20} />
                </button>

                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <Sparkles className={styles.sparkleIcon} size={32} />
                        <BookOpen className={styles.bookIcon} size={32} />
                    </div>
                    <h2 className={styles.title}>
                        {items.length === 1
                            ? 'Tài liệu mới được cập nhật!'
                            : `${items.length} tài liệu mới được cập nhật!`}
                    </h2>
                    <p className={styles.subtitle}>
                        Nhấn vào tài liệu để xem chi tiết
                    </p>
                </div>

                <div className={styles.itemList}>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={styles.item}
                            onClick={() => handleItemClick(item.id)}
                        >
                            <div className={styles.itemIcon}>
                                <BookOpen size={20} />
                            </div>
                            <div className={styles.itemContent}>
                                <h3 className={styles.itemTitle}>{item.title}</h3>
                                {item.description && (
                                    <p className={styles.itemDescription}>{item.description}</p>
                                )}
                                <div className={styles.itemMeta}>
                                    <span className={styles.itemDate}>
                                        {item.updatedAt ? 'Cập nhật' : 'Tạo mới'}: {formatDate(item.updatedAt || item.createdAt)}
                                    </span>
                                    {item.author && (
                                        <span className={styles.itemAuthor}>bởi {item.author}</span>
                                    )}
                                </div>
                            </div>
                            <ArrowRight className={styles.itemArrow} size={20} />
                        </div>
                    ))}
                </div>

                <div className={styles.footer}>
                    <button className={styles.dismissBtn} onClick={onClose}>
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewKnowledgeModal;
