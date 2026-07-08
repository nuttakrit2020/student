import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Loader2, ArrowLeft, Search, CheckCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';

export default function StudentAuth() {
  const navigate = useNavigate();
  
  // Login State
  const [studentNumber, setStudentNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  
  // Registration (Auto) State
  const [grade, setGrade] = useState('m1');
  const [room, setRoom] = useState('1');
  const [studentName, setStudentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if profile is already saved
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      checkSavedAreaAndRedirect();
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

  const handleSearchStudent = async (e) => {
    e.preventDefault();
    if (!studentNumber) return;
    
    setIsSearching(true);
    setNotFound(false);
    
    try {
      const q = query(collection(db, 'students'), where('studentNumber', '==', Number(studentNumber)));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Found student, log them in
        const studentData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
        localStorage.setItem('userProfile', JSON.stringify(studentData));
        checkSavedAreaAndRedirect();
      } else {
        // Not found, show registration form
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error searching student:", error);
      alert('เกิดข้อผิดพลาดในการค้นหาข้อมูล');
    } finally {
      setIsSearching(false);
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
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'students'), newStudent);
      const studentWithId = { id: docRef.id, ...newStudent };
      
      // Auto login after register
      localStorage.setItem('userProfile', JSON.stringify(studentWithId));
      checkSavedAreaAndRedirect();
    } catch (error) {
      console.error("Error adding student:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
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
        <div style={{ display: 'inline-flex', backgroundColor: '#EFF6FF', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
          <User size={40} style={{ color: 'var(--secondary)' }} />
        </div>
        <h2>เข้าใช้งานสำหรับนักเรียน</h2>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        
        {!notFound ? (
          <form onSubmit={handleSearchStudent} className="animate-fade-in">
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '1.1rem', textAlign: 'center', display: 'block', marginBottom: '1rem' }}>
                กรอกเลขประจำตัวนักเรียน 5 หลัก
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="เช่น 12345" 
                  value={studentNumber} 
                  onChange={e => setStudentNumber(e.target.value)} 
                  required
                  disabled={isSearching}
                  style={{ fontSize: '1.25rem', textAlign: 'center', letterSpacing: '2px', padding: '1rem' }}
                />
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={isSearching || !studentNumber}>
                {isSearching ? <Loader2 size={20} className="animate-spin" /> : (
                  <>
                    <Search size={20} />
                    เข้าสู่ระบบ
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="animate-fade-in">
            <div style={{ backgroundColor: '#FFFBEB', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid #FDE68A', textAlign: 'center' }}>
              <p style={{ color: '#D97706', margin: 0 }}>ไม่พบเลขประจำตัว <b>{studentNumber}</b> ในระบบ</p>
              <p style={{ color: '#D97706', margin: 0, fontSize: '0.875rem' }}>กรุณากรอกข้อมูลของคุณเพื่อใช้งานครั้งแรก</p>
            </div>

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
              <label className="form-label">ชื่อ - นามสกุล</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="กรอกชื่อ-นามสกุลของคุณ" 
                value={studentName} 
                onChange={e => setStudentName(e.target.value)} 
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (
                  <>
                    <CheckCircle size={20} />
                    บันทึกข้อมูลและเข้าใช้งาน
                  </>
                )}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setNotFound(false)} disabled={isSubmitting}>
                ยกเลิก
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
