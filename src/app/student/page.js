'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      {type === 'success' ? '✅' : '❌'} {message}
    </div>
  );
}


function EditProfileModal({ student, onClose, onSuccess }) {
  const [nickname, setNickname] = useState(student.nickname || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(student.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreview(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('studentId', student.id);
      if (nickname) formData.append('nickname', nickname);
      if (file) formData.append('avatar', file);

      const res = await fetch('/api/students', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const { student: updated } = await res.json();
        onSuccess(updated);
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (err) {
      alert('ไม่สามารถอัปเดตโปรไฟล์ได้');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>✏️ แก้ไขโปรไฟล์</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'center' }}>
            <div 
              style={{ 
                width: 100, height: 100, borderRadius: '50%', background: 'var(--accent-gradient)', 
                margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', cursor: 'pointer', border: '3px solid white', boxShadow: 'var(--shadow-card)',
                color: 'white', fontSize: '2rem', fontWeight: 'bold'
              }}
              onClick={() => fileInputRef.current.click()}
            >
              {preview ? (
                <img src={preview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                nickname?.charAt(0) || student?.name?.charAt(0) || '?'
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" style={{ display: 'none' }} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current.click()}>
              📸 เปลี่ยนรูป
            </button>
          </div>
          
          <div className="form-group">
            <label>ชื่อเล่น</label>
            <input 
              type="text" 
              className="form-input" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)} 
              placeholder="กรอกชื่อเล่นของคุณ"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AttendanceCheckModal({ student, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [gpsData, setGpsData] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsData({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (err) => {
          setGpsError('ไม่สามารถเข้าถึงตำแหน่ง GPS ได้ (กรุณาอนุญาต Location)');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGpsError('อุปกรณ์นี้ไม่รองรับ GPS');
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then((s) => {
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(err => {
        console.error(err);
        alert('ไม่สามารถเข้าถึงกล้องได้ (กรุณาอนุญาต Camera)');
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleCapture = async () => {
    if (!gpsData) return alert('กำลังรอพิกัด GPS... หากรอนานเกินไป กรุณาตรวจสอบการอนุญาต Location');
    setLoading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400 * (videoRef.current.videoHeight / videoRef.current.videoWidth);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const photo = canvas.toDataURL('image/jpeg', 0.6);

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId: student.id, 
          lat: gpsData.lat, 
          lng: gpsData.lng, 
          photo, 
          timestamp: new Date().toISOString() 
        })
      });

      if (res.ok) {
        onSuccess('เช็คชื่อและบันทึกพิกัดสำเร็จแล้ว!');
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ textAlign: 'center' }}>
        <h3>📍 เช็คชื่อเข้าเรียน</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>กรุณาถ่ายรูปให้เห็นใบหน้าและสถานที่เรียน</p>
        
        <div style={{ margin: '16px 0', position: 'relative' }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: '400px', borderRadius: '8px', backgroundColor: '#000' }} />
          {gpsData && (
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
              📍 {gpsData.lat.toFixed(4)}, {gpsData.lng.toFixed(4)}
            </div>
          )}
        </div>
        
        {gpsError && <p style={{ color: 'red', fontSize: '14px', marginBottom: '8px' }}>{gpsError}</p>}
        
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={handleCapture} disabled={loading || !streamRef.current}>
            {loading ? 'กำลังบันทึก...' : '📸 ถ่ายรูปและเช็คชื่อ'}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [settings, setSettings] = useState({ subjectName: '', className: '' });
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const router = useRouter();

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchData = useCallback(async (studentData) => {
    try {
      const [assignRes, subRes, setRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch(`/api/submissions?studentId=${studentData.id}`),
        fetch('/api/settings'),
      ]);

      const assignData = await assignRes.json();
      const subData = await subRes.json();
      const setData = await setRes.json();

      setAssignments(assignData.assignments || []);
      setSubmissions(subData.submissions || []);
      if (setData.settings) {
        setSettings(setData.settings);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem('student');
    if (!stored) {
      router.push('/');
      return;
    }
    const studentData = JSON.parse(stored);
    setStudent(studentData);
    fetchData(studentData);
  }, [router, fetchData]);

  const getSubmissionForAssignment = (assignmentId) => {
    return submissions.find((s) => s.assignmentId === assignmentId);
  };

  const handleProfileSuccess = (updatedStudent) => {
    setShowProfileModal(false);
    addToast('อัปเดตโปรไฟล์สำเร็จ! 🌟');
    setStudent(updatedStudent);
    sessionStorage.setItem('student', JSON.stringify(updatedStudent));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('student');
    router.push('/');
  };

  const submittedCount = assignments.filter((a) => getSubmissionForAssignment(a.id)).length;
  const totalCount = assignments.length;
  const progressPercent = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="loading-text">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrapper">
        {/* Toast notifications */}
        <div className="toast-container">
          {toasts.map((t) => (
            <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
          ))}
        </div>

        {/* Student Header */}
        <div className="student-header">
          <div className="student-info" style={{ cursor: 'pointer' }} onClick={() => setShowProfileModal(true)}>
            <div 
              className="student-avatar"
              style={student?.avatarUrl ? { background: 'none', padding: 0 } : {}}
            >
              {student?.avatarUrl ? (
                <img 
                  src={student.avatarUrl} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                />
              ) : (
                student?.nickname?.charAt(0) || '?'
              )}
            </div>
            <div className="student-details">
              <h2>{student?.name}</h2>
              <p>
                ID: {student?.id} • {student?.nickname} 
                {student?.room ? ` • ห้อง ${student.room}` : ''}
              </p>
              {settings.subjectName && <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>{settings.subjectName} {settings.className}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAttendanceModal(true)}>
              📍 เช็คชื่อ
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              🚪 ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalCount}</div>
            <div className="stat-label">งานทั้งหมด</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{submittedCount}</div>
            <div className="stat-label">ส่งแล้ว ✅</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalCount - submittedCount}</div>
            <div className="stat-label">ยังไม่ส่ง ❌</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-header">
            <span className="card-title">📊 ความคืบหน้า</span>
            <span style={{ color: 'var(--accent-secondary)', fontFamily: 'var(--font-en)', fontWeight: 700 }}>
              {progressPercent}%
            </span>
          </div>
          <div className="progress-bar-wrapper">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(145deg, #ffffff, #f5f8ff)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
            <span className="card-title">🏆 สรุปคะแนน</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>เต็ม 100</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(() => {
              const assignmentScore = submissions.reduce((sum, s) => sum + (Number(s.score) || 0), 0);
              const midtermScore = Number(student?.midtermScore) || 0;
              const finalScore = Number(student?.finalScore) || 0;
              const behaviorScore = Number(student?.behaviorScore) || 0;
              const totalScore = assignmentScore + midtermScore + finalScore + behaviorScore;

              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>📝 คะแนนใบงาน</span>
                    <strong style={{ fontFamily: 'var(--font-en)' }}>{assignmentScore} <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>/ 50</span></strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>📝 สอบกลางภาค</span>
                    <strong style={{ fontFamily: 'var(--font-en)' }}>{midtermScore} <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>/ 20</span></strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>📝 สอบปลายภาค</span>
                    <strong style={{ fontFamily: 'var(--font-en)' }}>{finalScore} <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>/ 20</span></strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>❤️ จิตพิสัย / มาเรียน</span>
                    <strong style={{ fontFamily: 'var(--font-en)' }}>{behaviorScore} <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>/ 10</span></strong>
                  </div>
                  <div style={{ height: '1px', background: 'var(--border-light)', margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-primary)' }}>รวมทั้งหมด</span>
                    <strong style={{ fontFamily: 'var(--font-en)', fontSize: '1.3rem', color: 'var(--accent-primary)' }}>{totalScore} <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>/ 100</span></strong>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Assignment List */}
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>📋 รายการงาน</h2>
        </div>

        {assignments.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>ยังไม่มีงานที่มอบหมาย</p>
          </div>
        ) : (
          <div className="assignment-list">
            {assignments.map((assignment) => {
              const sub = getSubmissionForAssignment(assignment.id);
              const isSubmitted = !!sub;

              return (
                <div
                  key={assignment.id}
                  className={`assignment-card ${isSubmitted ? 'submitted' : 'not-submitted'}`}
                >
                  <div className="assignment-top">
                    <div className="assignment-info">
                      <h3>{assignment.title}</h3>
                      <p>{assignment.description}</p>
                    </div>
                    <div className={`status-badge ${isSubmitted ? 'success' : 'danger'}`}>
                      {isSubmitted ? '✅ ส่งแล้ว' : '❌ ยังไม่ส่ง'}
                    </div>
                  </div>

                  <div className="assignment-meta">
                    {assignment.deadline && (
                      <span>📅 กำหนดส่ง: {assignment.deadline}</span>
                    )}
                    <span>⭐ คะแนนเต็ม: {assignment.maxScore}</span>
                    {isSubmitted && sub.score != null && (
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                        🎯 ได้คะแนน: {sub.score} / {assignment.maxScore}
                      </span>
                    )}
                  </div>

                  {assignment.worksheetUrl && !isSubmitted && (
                    <div className="assignment-actions">
                      <a
                        href={assignment.worksheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ width: 'auto', textDecoration: 'none' }}
                      >
                        📝 ทำใบงาน
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Profile Modal */}
        {showProfileModal && (
          <EditProfileModal
            student={student}
            onClose={() => setShowProfileModal(false)}
            onSuccess={(newAvatarUrl) => {
              setStudent({ ...student, avatarUrl: newAvatarUrl });
              setShowProfileModal(false);
              addToast('อัปเดตโปรไฟล์เรียบร้อยแล้ว');
            }}
          />
        )}

        {showAttendanceModal && (
          <AttendanceCheckModal
            student={student}
            onClose={() => setShowAttendanceModal(false)}
            onSuccess={(msg) => {
              setShowAttendanceModal(false);
              addToast(msg);
            }}
          />
        )}
      </div>
    </div>
  );
}
