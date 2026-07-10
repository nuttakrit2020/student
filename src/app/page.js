'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [settings, setSettings] = useState({ subjectName: '', className: '' });
  const router = useRouter();

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(err => console.error('Error loading settings:', err));
  }, []);

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (studentId.length !== 5) {
      setError('กรุณากรอกรหัสนักเรียน 5 หลัก');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด');
        return;
      }

      // Store student data in sessionStorage
      sessionStorage.setItem('student', JSON.stringify(data.student));
      router.push('/student');
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminKey === 'admin2569') {
      sessionStorage.setItem('adminKey', adminKey);
      router.push('/admin');
    } else {
      setError('รหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleIdChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
    setStudentId(val);
    setError('');
  };

  return (
    <div className="login-container">
      {/* Floating particles */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0, overflow: 'hidden'
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${20 + i * 15}px`,
            height: `${20 + i * 15}px`,
            borderRadius: '50%',
            background: `rgba(124, 92, 252, ${0.03 + i * 0.01})`,
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            animation: `float${i % 2 === 0 ? 'A' : 'B'} ${8 + i * 2}s ease-in-out infinite`,
          }} />
        ))}
        <style>{`
          @keyframes floatA {
            0%, 100% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-30px) translateX(15px); }
          }
          @keyframes floatB {
            0%, 100% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(20px) translateX(-10px); }
          }
        `}</style>
      </div>

      <div className="login-card">
        {!showAdminLogin ? (
          <>
            <div className="login-icon" style={{ background: 'transparent', boxShadow: 'none', width: '120px', height: '120px' }}>
              <img src="/Nawang.webp" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h1>{settings.subjectName || 'ระบบเก็บงานนักเรียน'}</h1>
            <p className="subtitle">{settings.className || 'ม.1/2569'} — เข้าสู่ระบบด้วยรหัสประจำตัว</p>

            <form onSubmit={handleStudentLogin}>
              <div className="input-group">
                <label>รหัสประจำตัวนักเรียน</label>
                <input
                  id="student-id-input"
                  type="text"
                  className="input-field"
                  placeholder="_ _ _ _ _"
                  value={studentId}
                  onChange={handleIdChange}
                  maxLength={5}
                  inputMode="numeric"
                  autoFocus
                  disabled={loading}
                />
              </div>

              {error && (
                <div style={{
                  color: 'var(--danger)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  marginBottom: '16px',
                  animation: 'slideUp 0.3s ease',
                }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                id="login-btn"
                type="submit"
                className="btn btn-primary"
                disabled={loading || studentId.length !== 5}
                style={{ opacity: studentId.length !== 5 ? 0.5 : 1 }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>🔓 เข้าสู่ระบบ</>
                )}
              </button>
            </form>

            <button
              className="admin-link"
              onClick={() => { setShowAdminLogin(true); setError(''); }}
            >
              👨‍🏫 เข้าหน้าครู (Admin)
            </button>
          </>
        ) : (
          <>
            <div className="login-icon">👨‍🏫</div>
            <h1>เข้าสู่ระบบครู</h1>
            <p className="subtitle">กรอกรหัสผ่านเพื่อจัดการงาน</p>

            <form onSubmit={handleAdminLogin}>
              <div className="input-group">
                <label>รหัสผ่าน Admin</label>
                <input
                  id="admin-key-input"
                  type="password"
                  className="input-field"
                  placeholder="••••••"
                  value={adminKey}
                  onChange={(e) => { setAdminKey(e.target.value); setError(''); }}
                  autoFocus
                  style={{ letterSpacing: '4px' }}
                />
              </div>

              {error && (
                <div style={{
                  color: 'var(--danger)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  marginBottom: '16px',
                  animation: 'slideUp 0.3s ease',
                }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                id="admin-login-btn"
                type="submit"
                className="btn btn-primary"
                disabled={!adminKey}
                style={{ opacity: !adminKey ? 0.5 : 1 }}
              >
                🔐 เข้าสู่ระบบ
              </button>
            </form>

            <button
              className="admin-link"
              onClick={() => { setShowAdminLogin(false); setError(''); }}
            >
              ← กลับหน้านักเรียน
            </button>
          </>
        )}
      </div>
    </div>
  );
}
