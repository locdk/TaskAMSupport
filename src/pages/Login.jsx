import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { Building2, CheckSquare } from 'lucide-react';

const Login = () => {
    const { login, user, settings, checkEmailStatus, setPassword: setContextPassword } = useAppState();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [step, setStep] = useState('email'); // 'email', 'password', 'setup'
    const [loading, setLoading] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Wait for settings to load
    React.useEffect(() => {
        if (settings && (settings.brandName === 'MAC USA ONE' || settings.logo)) {
            setSettingsLoaded(true);
        } else {
            // Give it a moment to load
            const timer = setTimeout(() => setSettingsLoaded(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [settings]);

    React.useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError('');
        const status = await checkEmailStatus(email);
        setLoading(false);

        if (status.exists) {
            if (status.hasPassword && !isForgotPassword) {
                setStep('password');
            } else {
                setStep('setup');
                setIsForgotPassword(true); // Ensure it's in forgot/setup mode
            }
        } else {
            setError('Email không tồn tại trong hệ thống.');
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!password) return;

        setLoading(true);
        setError('');
        const result = await login(email, password);
        setLoading(false);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    const handleSetupSubmit = async (e) => {
        e.preventDefault();
        if (!password || !confirmPassword) return;

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự.');
            return;
        }

        setLoading(true);
        setError('');
        const success = await setContextPassword(email, password);
        if (success) {
            const loginResult = await login(email, password);
            setLoading(false);
            if (loginResult.success) {
                navigate('/');
            } else {
                setError('Lỗi đăng nhập sau khi cài đặt mật khẩu.');
            }
        } else {
            setLoading(false);
            setError('Lỗi cài đặt mật khẩu.');
        }
    };

    const handleForgotPassword = () => {
        setIsForgotPassword(true);
        setIsPromptOpen(true);
        if (step === 'password') {
            setStep('setup');
            setPassword('');
            setConfirmPassword('');
        } else {
            setStep('email');
        }
        setError('');
    };

    const resetFlow = () => {
        setStep('email');
        setIsPromptOpen(false);
        setIsForgotPassword(false);
        setPassword('');
        setConfirmPassword('');
        setError('');
    };

    // Show loading while settings are being fetched
    if (!settingsLoaded) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, #1a1b1e 0%, #000000 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif",
                color: '#fff'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '4px solid rgba(255, 255, 255, 0.1)',
                        borderTop: '4px solid #1890ff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>Đang tải...</p>
                </div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #1a1b1e 0%, #000000 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
            color: '#fff'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)',
                pointerEvents: 'none'
            }}></div>

            <div style={{
                width: '100%',
                maxWidth: '480px',
                padding: '40px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Logo Section */}
                <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    {settings.logo ? (
                        <img
                            src={settings.logo}
                            alt="Logo"
                            style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '14px',
                                objectFit: 'contain'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '56px',
                            height: '56px',
                            backgroundColor: settings.primaryColor || '#FFD700',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000'
                        }}>
                            <CheckSquare size={36} strokeWidth={2.5} />
                        </div>
                    )}
                    <span style={{
                        fontSize: '32px',
                        fontWeight: '800',
                        letterSpacing: '-0.5px',
                        background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.7))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {settings.brandName || 'TaskMaster'}
                    </span>
                </div>

                <div style={{ marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#fff' }}>
                        Welcome Back!
                    </h1>
                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)' }}>
                        Đăng nhập để bắt đầu công việc
                    </p>
                </div>

                {!isPromptOpen ? (
                    <button
                        onClick={() => setIsPromptOpen(true)}
                        style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: settings.primaryColor || '#FFD700',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#000',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            transition: 'transform 0.2s, background-color 0.2s',
                            boxShadow: `0 4px 12px ${settings.primaryColor}33` || '0 4px 12px rgba(255, 215, 0, 0.2)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.opacity = '1';
                        }}
                    >
                        <Building2 size={20} />
                        Đăng nhập bằng Email Công ty của bạn
                    </button>
                ) : (
                    <div>
                        {step === 'email' && (
                            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {isForgotPassword && (
                                    <div style={{
                                        color: settings.primaryColor || '#FFD700',
                                        fontSize: '14px',
                                        marginBottom: '8px',
                                        textAlign: 'center',
                                        background: 'rgba(255, 215, 0, 0.1)',
                                        padding: '8px',
                                        borderRadius: '8px'
                                    }}>
                                        Đang ở chế độ khôi phục mật khẩu. Vui lòng nhập email.
                                    </div>
                                )}
                                <input
                                    type="email"
                                    placeholder="Nhập email công ty của bạn..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        backgroundColor: settings.primaryColor || '#FFD700',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#000',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    {loading ? 'Đang kiểm tra...' : 'Tiếp tục'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetFlow}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Quay lại
                                </button>
                            </form>
                        )}

                        {step === 'password' && (
                            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', textAlign: 'left', fontSize: '14px' }}>
                                    Email: <strong>{email}</strong>
                                </div>
                                <input
                                    type="password"
                                    placeholder="Nhập mật khẩu của bạn..."
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        backgroundColor: settings.primaryColor || '#FFD700',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#000',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStep('email'); setPassword(''); setError(''); }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Sử dụng email khác
                                </button>
                            </form>
                        )}

                        {step === 'setup' && (
                            <form onSubmit={handleSetupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', textAlign: 'left', fontSize: '14px' }}>
                                    Email: <strong>{email}</strong>
                                    <p style={{ marginTop: '4px', fontSize: '12px', color: settings.primaryColor || '#FFD700' }}>
                                        {isForgotPassword ? 'Vui lòng nhập mật khẩu mới để khôi phục tài khoản.' : 'Bạn chưa cài đặt mật khẩu. Vui lòng tạo mật khẩu mới.'}
                                    </p>
                                </div>
                                <input
                                    type="password"
                                    placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)..."
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                    autoFocus
                                />
                                <input
                                    type="password"
                                    placeholder="Xác nhận mật khẩu..."
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        backgroundColor: settings.primaryColor || '#FFD700',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#000',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    {loading ? 'Đang thực hiện...' : 'Cài đặt và Đăng nhập'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setStep('email'); setPassword(''); setConfirmPassword(''); setError(''); }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Sử dụng email khác
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {error && (
                    <div style={{ marginTop: '16px', color: '#ff4d4f', fontSize: '14px', background: 'rgba(255, 77, 79, 0.1)', padding: '8px', borderRadius: '8px' }}>
                        {error}
                    </div>
                )}

                <p style={{ marginTop: '24px', fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
                    Sử dụng email đã được đăng ký trong hệ thống để truy cập
                </p>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    margin: '32px 0',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '12px',
                    fontWeight: '600'
                }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                    HOẶC
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                </div>

                {(!isPromptOpen || step === 'password') && (
                    <div style={{ display: 'flex', justifyContent: 'center', fontSize: '14px', marginTop: isPromptOpen ? '16px' : '0' }}>
                        <span
                            onClick={handleForgotPassword}
                            style={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                        >
                            Quên mật khẩu?
                        </span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{
                position: 'absolute',
                bottom: '32px',
                display: 'flex',
                gap: '32px',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.4)'
            }}>
                <span style={{ cursor: 'pointer' }}>Hỗ trợ</span>
                <span style={{ cursor: 'pointer' }}>Chính sách bảo mật</span>
                <span>© {new Date().getFullYear()} {settings.brandName || 'TaskMaster'}</span>
            </div>
        </div>
    );
};

export default Login;
