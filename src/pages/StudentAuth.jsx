import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Plus, Users, Loader2, ArrowLeft, Lock } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default function StudentAuth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  
  // Login State
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Register State
  const [grade, setGrade] = useState('m1');
  const [room, setRoom] = useState('1');
  const [studentNumber, setStudentNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if profile is already saved
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      checkSavedAreaAndRedirect();
    } else {
      fetchStudents();
    }
  }, []);

  const checkSavedAreaAndRedirect = () => {
    const savedArea = localStorage.getItem('savedLearningArea');
    if (savedArea) {
      navigate(`/area/${savedArea}`);
    } else {
      navigate('/area');
    }
  };

  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'students'));
      const studentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by grade, room, number
      studentsList.sort((a, b) => {
        const gradeA = a.grade || '';
        const gradeB = b.grade || '';
        if (gradeA !== gradeB) return gradeA.localeCompare(gradeB);
        
        const roomA = Number(a.room) || 0;
        const roomB = Number(b.room) || 0;
        if (roomA !== roomB) return roomA - roomB;
        
        const numA = Number(a.studentNumber) || 0;
        const numB = Number(b.studentNumber) || 0;
        return numA - numB;
      });
      setStudents(studentsList);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (student) => {
    // Basic verification: If student has a password, ask for it.
    // If not, use studentNumber as fallback password.
    const expectedPassword = student.password || student.studentNumber.toString();
    const enteredPassword = prompt(`กรุณากรอกรหัสผ่านสำหรับ ${student.studentName}:\n(หากยังไม่เคยตั้งรหัสผ่าน ให้ใช้เลขประจำตัวนักเรียน)`);
    
    if (enteredPassword === null) return; // Cancelled
    
    if (enteredPassword === expectedPassword) {
      localStorage.setItem('userProfile', JSON.stringify(student));
      checkSavedAreaAndRedirect();
    } else {
      alert('รหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newStudent = {
        grade,
        room,
        studentNumber: Number(studentNumber),
        studentName,
        password, // Save simple password
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'students'), newStudent);
      const studentWithId = { id: docRef.id, ...newStudent };
      
      // Auto login after register
      localStorage.setItem('userProfile', JSON.stringify(studentWithId));
      checkSavedAreaAndRedirect();
    } catch (error) {
      console.error("Error adding student:", error);
      alert("เกิดข้อผิดพลาดในการลงทะเบียน: " + error.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={40} className="animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      
      <button className="btn btn-outline" onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem', marginBottom: '2rem' }}>
        <ArrowLeft size={18} />
        กลับไปหน้าเลือกสถานะ
      </button>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          <button 
            style={{ 
              flex: 1, padding: '1.5rem', background: activeTab === 'login' ? 'transparent' : '#F8FAFC',
              border: 'none', borderBottom: activeTab === 'login' ? '3px solid var(--secondary)' : '3px solid transparent',
              fontWeight: activeTab === 'login' ? '600' : '400', color: activeTab === 'login' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.1rem'
            }}
            onClick={() => setActiveTab('login')}
          >
            เข้าสู่ระบบ
          </button>
          <button 
            style={{ 
              flex: 1, padding: '1.5rem', background: activeTab === 'register' ? 'transparent' : '#F8FAFC',
              border: 'none', borderBottom: activeTab === 'register' ? '3px solid var(--secondary)' : '3px solid transparent',
              fontWeight: activeTab === 'register' ? '600' : '400', color: activeTab === 'register' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.1rem'
            }}
            onClick={() => setActiveTab('register')}
          >
            สมัครเข้าใช้งานใหม่
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          {activeTab === 'login' ? (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={24} className="header-icon" />
                รายชื่อนักเรียน
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {students.length === 0 ? (
                  <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>ยังไม่มีรายชื่อในระบบ กรุณาสมัครใช้งาน</p>
                ) : (
                  students.map(student => (
                    <button 
                      key={student.id}
                      className="btn btn-outline"
                      style={{ justifyContent: 'flex-start', padding: '1rem', textAlign: 'left' }}
                      onClick={() => handleLogin(student)}
                    >
                      <User size={20} />
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{student.studentName || 'ไม่ระบุชื่อ'}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          ชั้น ม.{(student.grade || '').replace('m', '') || '?'} ห้อง {student.room || '?'} | เลขที่ {student.studentNumber || '?'}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h2 style={{ marginBottom: '1.5rem' }}>กรอกข้อมูลเพื่อลงทะเบียน</h2>
              <form onSubmit={handleRegister}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">ระดับชั้น</label>
                    <select className="form-select" value={grade} onChange={e => setGrade(e.target.value)} disabled={isSubmitting}>
                      <option value="m1">ม.1</option>
                      <option value="m2">ม.2</option>
                      <option value="m3">ม.3</option>
                      <option value="m4">ม.4</option>
                      <option value="m5">ม.5</option>
                      <option value="m6">ม.6</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">ห้อง</label>
                    <select className="form-select" value={room} onChange={e => setRoom(e.target.value)} disabled={isSubmitting}>
                      {Array.from({length: 10}, (_, i) => i + 1).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">เลขที่</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="กรอกเลขที่" 
                    value={studentNumber} 
                    onChange={e => setStudentNumber(e.target.value)} 
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">ชื่อ - นามสกุล</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="กรอกชื่อ-นามสกุล" 
                    value={studentName} 
                    onChange={e => setStudentName(e.target.value)} 
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ตั้งรหัสผ่าน (เอาไว้ล็อกอินครั้งหน้า)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="ตั้งรหัสผ่าน (เช่น ตัวเลข 4-6 หลัก)" 
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
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'ลงทะเบียนและเข้าใช้งาน'}
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
