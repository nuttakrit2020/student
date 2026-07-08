import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Loader2, ArrowLeft, GraduationCap } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';

export default function TeacherAuth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if teacher is already logged in
    const isTeacher = localStorage.getItem('teacherAuth');
    if (isTeacher) {
      navigate('/teacher');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Very basic authentication query
      const q = query(collection(db, 'teachers'), where('username', '==', username), where('password', '==', password));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Success
        localStorage.setItem('teacherAuth', 'true');
        navigate('/teacher');
      } else {
        // Fallback to basic PIN for legacy support
        if (username === 'admin' && password === '1234') {
          localStorage.setItem('teacherAuth', 'true');
          navigate('/teacher');
        } else {
          alert('ชื่อผู้ใช้ หรือ รหัสผ่าน ไม่ถูกต้อง');
        }
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (username.length < 4) {
      alert('ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Check if username exists
      const q = query(collection(db, 'teachers'), where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('ชื่อผู้ใช้นี้ถูกใช้งานไปแล้ว กรุณาเปลี่ยนใหม่');
        setIsSubmitting(false);
        return;
      }
      
      // Add new teacher
      await addDoc(collection(db, 'teachers'), {
        name: teacherName,
        username: username,
        password: password, // Note: In a real app, hash this!
        createdAt: serverTimestamp()
      });
      
      alert('ลงทะเบียนสำเร็จ! เข้าสู่ระบบให้อัตโนมัติ...');
      localStorage.setItem('teacherAuth', 'true');
      navigate('/teacher');
      
    } catch (error) {
      console.error("Error registering teacher:", error);
      alert("เกิดข้อผิดพลาดในการลงทะเบียน: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
      
      <button className="btn btn-outline" onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem', marginBottom: '2rem' }}>
        <ArrowLeft size={18} />
        กลับไปหน้าเลือกสถานะ
      </button>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', backgroundColor: '#F1F5F9', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
          <GraduationCap size={40} style={{ color: 'var(--primary)' }} />
        </div>
        <h2>ระบบสำหรับครูผู้สอน</h2>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          <button 
            style={{ 
              flex: 1, padding: '1.25rem', background: activeTab === 'login' ? 'transparent' : '#F8FAFC',
              border: 'none', borderBottom: activeTab === 'login' ? '3px solid var(--primary)' : '3px solid transparent',
              fontWeight: activeTab === 'login' ? '600' : '400', color: activeTab === 'login' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem'
            }}
            onClick={() => setActiveTab('login')}
          >
            เข้าสู่ระบบ
          </button>
          <button 
            style={{ 
              flex: 1, padding: '1.25rem', background: activeTab === 'register' ? 'transparent' : '#F8FAFC',
              border: 'none', borderBottom: activeTab === 'register' ? '3px solid var(--primary)' : '3px solid transparent',
              fontWeight: activeTab === 'register' ? '600' : '400', color: activeTab === 'register' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem'
            }}
            onClick={() => setActiveTab('register')}
          >
            ลงทะเบียนครู
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          {activeTab === 'login' ? (
            <div className="animate-fade-in">
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">ชื่อผู้ใช้ (Username)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="กรอกชื่อผู้ใช้ของคุณ" 
                      value={username} 
                      onChange={e => setUsername(e.target.value)} 
                      required
                      disabled={isSubmitting}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <User size={18} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">รหัสผ่าน</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="กรอกรหัสผ่าน" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required
                      disabled={isSubmitting}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--text-muted)' }} />
                  </div>
                </div>
                
                <div style={{ marginTop: '2rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', backgroundColor: 'var(--primary)' }} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'เข้าสู่ระบบ'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <form onSubmit={handleRegister}>
                
                <div className="form-group">
                  <label className="form-label">ชื่อ - นามสกุล (สำหรับแสดงผล)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="เช่น ครูสมชาย ใจดี" 
                    value={teacherName} 
                    onChange={e => setTeacherName(e.target.value)} 
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ตั้งชื่อผู้ใช้ (Username)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="ใช้ภาษาอังกฤษหรือตัวเลข (เช่น somchai123)" 
                      value={username} 
                      onChange={e => setUsername(e.target.value)} 
                      required
                      disabled={isSubmitting}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <User size={18} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">ตั้งรหัสผ่าน</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="ตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required
                      disabled={isSubmitting}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--text-muted)' }} />
                  </div>
                </div>
                
                <div style={{ marginTop: '2rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', backgroundColor: 'var(--primary)' }} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'ลงทะเบียนบัญชีครู'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
