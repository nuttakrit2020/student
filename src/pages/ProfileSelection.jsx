import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Plus, Users, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ProfileSelection() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMode, setIsAddingMode] = useState(false);
  
  // New student form
  const [grade, setGrade] = useState('m1');
  const [room, setRoom] = useState('1');
  const [studentNumber, setStudentNumber] = useState('');
  const [studentName, setStudentName] = useState('');
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

  const handleSelectProfile = (student) => {
    localStorage.setItem('userProfile', JSON.stringify(student));
    checkSavedAreaAndRedirect();
  };

  const handleAddProfile = async (e) => {
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
      
      // Save and redirect
      localStorage.setItem('userProfile', JSON.stringify(studentWithId));
      checkSavedAreaAndRedirect();
    } catch (error) {
      console.error("Error adding student:", error);
      alert("เกิดข้อผิดพลาดในการเพิ่มชื่อ: " + error.message);
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
    <div className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>ยินดีต้อนรับสู่ระบบส่งงาน</h1>
        <p className="text-muted" style={{ fontSize: '1.1rem' }}>
          กรุณาเลือกชื่อของคุณ หรือเพิ่มชื่อใหม่หากยังไม่มีในระบบ
        </p>
      </div>

      {!isAddingMode ? (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Users size={24} className="header-icon" />
              เลือกผู้ใช้งาน
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {students.length === 0 ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>ยังไม่มีรายชื่อในระบบ</p>
              ) : (
                students.map(student => (
                  <button 
                    key={student.id}
                    className="btn btn-outline"
                    style={{ justifyContent: 'flex-start', padding: '1rem', textAlign: 'left' }}
                    onClick={() => handleSelectProfile(student)}
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

            <hr style={{ margin: '1.5rem 0', borderColor: 'var(--border)' }} />
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => setIsAddingMode(true)}
            >
              <Plus size={20} />
              เพิ่มข้อมูลนักเรียนใหม่
            </button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>เพิ่มข้อมูลของคุณ</h2>
            
            <form onSubmit={handleAddProfile}>
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
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'บันทึกข้อมูล'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setIsAddingMode(false)} disabled={isSubmitting}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
