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

const CAMERA_FILTERS = [
  { name: 'ปกติ', value: 'none' },
  { name: '🌟 ออร่าผิวขาว', value: 'brightness(1.25) contrast(0.9) saturate(1.05)' },
  { name: '✨ หน้าเนียน', value: 'blur(1px) brightness(1.15) contrast(0.95)' },
  { name: '🌸 แก้มอมชมพู', value: 'brightness(1.1) sepia(0.2) hue-rotate(-20deg) saturate(1.2)' },
  { name: '🔥 สายฝอ', value: 'sepia(0.3) saturate(1.4) contrast(1.1) brightness(0.95)' },
  { name: '🎞️ ฟิล์ม', value: 'sepia(0.4) contrast(1.2) brightness(0.9) saturate(1.2)' },
  { name: '👽 มนุษย์ต่างดาว', value: 'saturate(3) hue-rotate(90deg)' },
];

function AttendanceCheckModal({ student, onClose, onSuccess }) {
  const [step, setStep] = useState('map'); // 'map' or 'camera'
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [loading, setLoading] = useState(false);
  const [gpsData, setGpsData] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Request GPS immediately
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

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    // Request camera only when in camera step
    if (step === 'camera') {
      setCameraReady(false);
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then((s) => {
          streamRef.current = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.error(err);
          alert('ไม่สามารถเข้าถึงกล้องได้ หากคุณใช้งานผ่านแอป LINE กรุณากดเมนูมุมขวาบน ⋯ หรือมุมล่างขวา แล้วเลือก "เปิดด้วยเบราว์เซอร์เริ่มต้น" (Open in external browser)');
        });
    } else {
      // Stop camera if going back
      setCameraReady(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  }, [step]);

  const handleCapture = async () => {
    if (!gpsData) return alert('กำลังรอพิกัด GPS... หากรอนานเกินไป กรุณาตรวจสอบการอนุญาต Location');
    setLoading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400 * (videoRef.current.videoHeight / videoRef.current.videoWidth);
      const ctx = canvas.getContext('2d');
      // Mirror the canvas context so the saved photo matches the mirrored video preview
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      if (selectedFilter !== 'none') {
        ctx.filter = selectedFilter;
      }
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
      <div className="modal" style={{ textAlign: 'center', width: '90%', maxWidth: '500px' }}>
        <h3>📍 เช็คชื่อเข้าเรียน</h3>
        
        {step === 'map' && (
          <div>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>กำลังดึงพิกัดตำแหน่งปัจจุบันของคุณ...</p>
            {gpsData ? (
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd', marginBottom: '16px' }}>
                <iframe
                  width="100%"
                  height="250"
                  frameBorder="0"
                  style={{ border: 0, display: 'block' }}
                  src={`https://maps.google.com/maps?q=${gpsData.lat},${gpsData.lng}&z=16&output=embed`}
                  allowFullScreen
                ></iframe>
                <div style={{ background: '#f8f9fa', padding: '8px', fontSize: '12px', color: '#555' }}>
                  พิกัด: {gpsData.lat.toFixed(5)}, {gpsData.lng.toFixed(5)}
                </div>
              </div>
            ) : (
              <div style={{ height: '250px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', marginBottom: '16px' }}>
                {gpsError ? (
                  <span style={{ color: 'red', padding: '0 16px' }}>{gpsError}</span>
                ) : (
                  <span style={{ color: '#666' }}>กำลังรอ GPS...</span>
                )}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setStep('camera')} 
                disabled={!gpsData}
              >
                ต่อไป: ถ่ายรูปยืนยัน 📸
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {step === 'camera' && (
          <div>
            <p style={{ fontSize: '14px', color: '#666' }}>กรุณาถ่ายรูปให้เห็นใบหน้าและสถานที่เรียน</p>
            
            <div style={{ margin: '16px 0', position: 'relative' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                onLoadedMetadata={() => setCameraReady(true)}
                style={{ 
                  width: '100%', maxWidth: '400px', borderRadius: '8px', backgroundColor: '#000', 
                  transform: 'scaleX(-1)', filter: selectedFilter 
                }} 
              />
            </div>
            
            <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', padding: '8px 0', marginBottom: '16px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              {CAMERA_FILTERS.map(f => (
                <button
                  key={f.name}
                  onClick={() => setSelectedFilter(f.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: selectedFilter === f.value ? '2px solid var(--accent-primary)' : '1px solid #ddd',
                    background: selectedFilter === f.value ? '#e8f0fe' : '#fff',
                    color: selectedFilter === f.value ? 'var(--accent-primary)' : '#555',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={handleCapture} disabled={loading || !cameraReady}>
                {loading ? 'กำลังบันทึก...' : '📸 ถ่ายรูปและเช็คชื่อ'}
              </button>
              <button className="btn btn-secondary" onClick={() => setStep('map')} disabled={loading}>
                ย้อนกลับ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaveRequestModal({ student, onClose, onSuccess }) {
  const todayStr = new Date().toLocaleDateString('sv').split('T')[0];
  const [leaveDate, setLeaveDate] = useState(todayStr);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return alert('กรุณาระบุเหตุผลการลา');
    if (!leaveDate) return alert('กรุณาเลือกวันที่ต้องการลา');
    setLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId: student.id, 
          type: 'leave',
          reason: reason,
          timestamp: new Date(leaveDate + 'T08:00:00.000Z').toISOString() 
        })
      });
      if (res.ok) {
        onSuccess('ส่งคำร้องขอลาเรียนสำเร็จแล้ว');
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
      <div className="modal" style={{ width: '90%', maxWidth: '400px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>📝 แจ้งลาเรียน</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>วันที่ต้องการลา</label>
            <input 
              type="date"
              className="form-input"
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>เหตุผลการลา (ไปไหน ทำไมถึงลา)</label>
            <textarea 
              className="form-input" 
              rows="4"
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              placeholder="เช่น ลาป่วยไปหาหมอ, ลากิจไปต่างจังหวัดกับครอบครัว..."
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading || !reason.trim()}>
              {loading ? 'กำลังส่ง...' : '📤 ส่งคำร้อง'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StudentCalendar({ attendances, classSchedules, studentRoom }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const today = new Date();
  const displayDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  const getRoomKey = (r) => r ? '3/' + r.replace(/^ม\.?\s*/, '').replace(/^3\//, '').trim() : '';
  const schedule = classSchedules ? classSchedules[getRoomKey(studentRoom)] : null;
  const classDay = schedule ? schedule.day : null;
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const monthName = `${thaiMonths[month]} ${year + 543}`;
  
  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="card-title">📅 ปฏิทินเช็คชื่อ</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setMonthOffset(o => o - 1)} style={{ padding: '4px 8px' }}>◀</button>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', minWidth: '100px', textAlign: 'center' }}>{monthName}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setMonthOffset(o => o + 1)} style={{ padding: '4px 8px' }}>▶</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
          <div key={d} style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
        {days.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} />;
          
          const cy = date.getFullYear();
          const cm = String(date.getMonth() + 1).padStart(2, '0');
          const cd = String(date.getDate()).padStart(2, '0');
          const dateStr = `${cy}-${cm}-${cd}`;
          
          const ty = today.getFullYear();
          const tm = String(today.getMonth() + 1).padStart(2, '0');
          const td = String(today.getDate()).padStart(2, '0');
          const todayStr = `${ty}-${tm}-${td}`;
          
          const isToday = dateStr === todayStr;
          const isClassDay = classDay !== null && date.getDay() === classDay;
          
          const att = attendances.find(a => {
            const aDate = new Date(a.timestamp);
            const ay = aDate.getFullYear();
            const am = String(aDate.getMonth() + 1).padStart(2, '0');
            const ad = String(aDate.getDate()).padStart(2, '0');
            const aDateStr = `${ay}-${am}-${ad}`;
            return a.timestamp.startsWith(dateStr) || aDateStr === dateStr;
          });
          
          let circleColor = 'transparent';
          let textColor = '#333';
          let content = date.getDate();
          
          if (isClassDay) {
             if (att) {
                if (att.type === 'leave') {
                   if (att.status === 'pending') {
                     circleColor = '#f39c12'; // Orange/amber for pending
                     textColor = '#fff';
                     content = '⏳';
                   } else {
                     circleColor = '#fbbc04'; // Yellow for approved
                     textColor = '#fff';
                   }
                } else {
                   circleColor = '#34a853';
                   textColor = '#fff';
                }
             } else if (date < today && date >= new Date('2026-05-18T00:00:00+07:00')) {
                circleColor = '#ea4335';
                textColor = '#fff';
             } else if (isToday) {
                circleColor = '#ea4335';
                textColor = '#fff';
             } else {
                circleColor = '#f1f3f4';
             }
          }
          
          return (
            <div key={dateStr} style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: circleColor, color: textColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: content === '⏳' ? '0.8rem' : '0.9rem', fontWeight: isToday ? 700 : 500,
                border: isToday ? '2px solid #1a73e8' : 'none'
              }}>
                {content}
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px', fontSize: '0.8rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#34a853' }}></div> มาเรียน
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fbbc04' }}></div> ลา (อนุมัติ)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f39c12' }}></div> ลา (รออนุมัติ)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ea4335' }}></div> ขาด
        </div>
      </div>
    </div>
  );
}

export default function StudentPage() {
  const [student, setStudent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [settings, setSettings] = useState({ subjectName: '', className: '', classSchedules: {} });
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isLineBrowser, setIsLineBrowser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Detect LINE In-App Browser
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (userAgent.indexOf("Line") > -1) {
      setIsLineBrowser(true);
      // Try to force external browser if not already tried (works on some Android devices)
      if (!window.location.search.includes("openExternalBrowser=1")) {
        const separator = window.location.href.includes("?") ? "&" : "?";
        window.location.href = window.location.href + separator + "openExternalBrowser=1";
      }
    }
  }, []);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchData = useCallback(async (studentData) => {
    try {
      const [assignRes, subRes, setRes, attRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch(`/api/submissions?studentId=${studentData.id}`),
        fetch('/api/settings'),
        fetch(`/api/attendance?studentId=${studentData.id}`),
      ]);

      const assignData = await assignRes.json();
      const subData = await subRes.json();
      const setData = await setRes.json();
      const attData = await attRes.json();

      setAssignments(assignData.assignments || []);
      setSubmissions(subData.submissions || []);
      setAttendances(Array.isArray(attData) ? attData : []);
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

  // Compute attendance stats
  let presentCount = 0;
  let leaveCount = 0;
  let absentCount = 0;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const startOfSemester = new Date('2026-05-18T00:00:00+07:00');
  const getRoomKey = (r) => r ? '3/' + r.replace(/^ม\.?\s*/, '').replace(/^3\//, '').trim() : '';
  const roomKey = getRoomKey(student?.room);
  
  const classSchedules = {
    '3/1': { day: 4 },
    '3/2': { day: 5 },
    '3/3': { day: 5 },
    '3/4': { day: 5 },
    '3/5': { day: 1 },
    '3/6': { day: 3 },
    '3/7': { day: 1 },
    '3/8': { day: 5 }
  };
  
  const schedule = classSchedules[roomKey];
  const classDay = schedule ? schedule.day : null;
  if (classDay !== null) {
    let d = new Date(startOfSemester);
    while (d <= todayDate) {
      if (d.getDay() === classDay) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;
        const att = attendances.find(a => {
          const aDate = new Date(a.timestamp);
          const ay = aDate.getFullYear();
          const am = String(aDate.getMonth() + 1).padStart(2, '0');
          const ad = String(aDate.getDate()).padStart(2, '0');
          const aDateStr = `${ay}-${am}-${ad}`;
          return a.timestamp.startsWith(dateStr) || aDateStr === dateStr;
        });

        if (att) {
          if (att.type === 'leave') {
            leaveCount++;
          } else {
            presentCount++;
          }
        } else {
          absentCount++;
        }
      }
      d.setDate(d.getDate() + 1);
    }
  }

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
      {isLineBrowser && (
        <div style={{ background: '#ffeb3b', color: '#333', padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
          ⚠️ ท่านกำลังใช้งานผ่านแอป LINE ซึ่งอาจไม่รองรับกล้อง/GPS<br/>
          กรุณากดเมนู ⋯ (3 จุด) แล้วเลือก <b>"เปิดด้วยเบราว์เซอร์เริ่มต้น"</b> (Open in external browser) เพื่อใช้งานเช็คชื่อ
        </div>
      )}
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setShowAttendanceModal(true)}>
                📍 เช็คชื่อ
              </button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, background: '#fff3cd', color: '#856404', borderColor: '#ffeeba' }} onClick={() => setShowLeaveModal(true)}>
                📝 ลาเรียน
              </button>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              🚪 ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Student Calendar */}
        <StudentCalendar attendances={attendances} classSchedules={{
          '3/1': { day: 4, label: 'พฤหัสบดี' },
          '3/2': { day: 5, label: 'ศุกร์' },
          '3/3': { day: 5, label: 'ศุกร์' },
          '3/4': { day: 5, label: 'ศุกร์' },
          '3/5': { day: 1, label: 'จันทร์' },
          '3/6': { day: 3, label: 'พุธ' },
          '3/7': { day: 1, label: 'จันทร์' },
          '3/8': { day: 5, label: 'ศุกร์' }
        }} studentRoom={student?.room} />

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

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#34a853' }}>{presentCount}</div>
            <div className="stat-label">มาเรียน</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#fbbc04' }}>{leaveCount}</div>
            <div className="stat-label">ลา</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ea4335' }}>{absentCount}</div>
            <div className="stat-label">ขาด</div>
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
              fetchData(student);
            }}
          />
        )}
        
        {showLeaveModal && (
          <LeaveRequestModal
            student={student}
            onClose={() => setShowLeaveModal(false)}
            onSuccess={(msg) => {
              setShowLeaveModal(false);
              addToast(msg);
              fetchData(student);
            }}
          />
        )}
      </div>
    </div>
  );
}
