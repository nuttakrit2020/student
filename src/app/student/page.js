/* eslint-disable */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

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

  const compressImage = (file, maxSize = 200) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let avatarUrl = undefined;
      if (file) {
        avatarUrl = await compressImage(file, 200);
      }

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
          nickname,
          avatarUrl
        }),
      });

      if (res.ok) {
        const { student: updated } = await res.json();
        onSuccess(updated);
      } else {
        MySwal.fire({ text: 'เกิดข้อผิดพลาดในการบันทึก', icon: "error" });
      }
    } catch (err) {
      MySwal.fire({ text: 'ไม่สามารถอัปเดตโปรไฟล์ได้', icon: "error" });
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

function AttendanceCheckModal({ student, settings, subjectId, onClose, onSuccess }) {
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
          MySwal.fire({ text: 'ไม่สามารถเข้าถึงกล้องได้ หากคุณใช้งานผ่านแอป LINE กรุณากดเมนูมุมขวาบน ⋯ หรือมุมล่างขวา แล้วเลือก "เปิดด้วยเบราว์เซอร์เริ่มต้น" (Open in external browser)', icon: "error" });
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
    if (!gpsData) return MySwal.fire({ text: 'กำลังรอพิกัด GPS... หากรอนานเกินไป กรุณาตรวจสอบการอนุญาต Location', icon: "error" });
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
          subjectId,
          lat: gpsData.lat, 
          lng: gpsData.lng, 
          photo, 
          timestamp: new Date().toISOString() 
        })
      });

      if (res.ok) {
        onSuccess('เช็คชื่อและบันทึกพิกัดสำเร็จแล้ว!');
      } else {
        MySwal.fire({ text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', icon: "error" });
      }
    } catch (err) {
      MySwal.fire({ text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ', icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ textAlign: 'center', width: '90%', maxWidth: '500px' }}>
        <h3>📍 เช็คชื่อเข้าเรียน</h3>
        
        {step === 'map' && (
          <div>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px', fontWeight: settings?.targetRoomName ? 'bold' : 'normal', color: settings?.targetRoomName ? 'var(--accent-primary)' : '#666' }}>
              {settings?.targetRoomName ? `กรุณาไปที่ ${settings.targetRoomName} ก่อนทำการเช็คชื่อ` : 'กำลังดึงพิกัดตำแหน่งปัจจุบันของคุณ...'}
            </p>
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

function LeaveRequestModal({ student, subjectId, onClose, onSuccess }) {
  const todayStr = new Date().toLocaleDateString('sv').split('T')[0];
  const [leaveDate, setLeaveDate] = useState(todayStr);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return MySwal.fire({ text: 'กรุณาระบุเหตุผลการลา', icon: "error" });
    if (!leaveDate) return MySwal.fire({ text: 'กรุณาเลือกวันที่ต้องการลา', icon: "error" });
    setLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId: student.id, 
          subjectId,
          type: 'leave',
          reason: reason,
          timestamp: new Date(leaveDate + 'T08:00:00.000Z').toISOString() 
        })
      });
      if (res.ok) {
        onSuccess('ส่งคำร้องขอลาเรียนสำเร็จแล้ว');
      } else {
        MySwal.fire({ text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', icon: "error" });
      }
    } catch (err) {
      MySwal.fire({ text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ', icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '90%', maxWidth: '400px' }}>
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

  const getNormalizedSchedules = (scheds) => {
    if (!scheds) return [];
    if (Array.isArray(scheds)) return scheds;
    return Object.entries(scheds).map(([room, data]) => ({ id: `${room}_${data.day}_${data.start}`, room, ...data }));
  };

  const today = new Date();
  const displayDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const roomScheds = getNormalizedSchedules(classSchedules).filter(s => {
    const cleanedRoom = (studentRoom || '').replace(/^ม\.?\s*/, '').trim();
    return s.room === cleanedRoom || s.room === studentRoom;
  });
  const classDays = roomScheds.map(s => s.day);

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
          const isClassDay = classDays.length > 0 && classDays.includes(date.getDay());
          
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
                     circleColor = '#f39c12';
                     textColor = '#fff';
                     content = '⏳';
                   } else {
                     circleColor = '#fbbc04';
                     textColor = '#fff';
                   }
                } else if (att.isOk === false) {
                   circleColor = '#ff9800';
                   textColor = '#fff';
                   content = '⚠️';
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
  const [attendances, setAttendances] = useState([]);
  const [settings, setSettings] = useState({ subjectName: '', className: '', classSchedules: {} });
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [sheetData, setSheetData] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showLocationWarningModal, setShowLocationWarningModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isLineBrowser, setIsLineBrowser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (userAgent.indexOf("Line") > -1) {
      setIsLineBrowser(true);
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

  const fetchData = useCallback(async (studentData, subjectId = null) => {
    try {
      const subjectsRes = await fetch('/api/subjects');
      const subjectsList = await subjectsRes.json();
      if (Array.isArray(subjectsList) && subjectsList.length > 0) {
        // Filter subjects based on student room
        const roomStr = studentData.room || '';
        const cleanedRoom = roomStr.replace(/^ม\.?\s*/, '').trim();
        
        let filteredSubjects = subjectsList.filter(subject => {
          if (!roomStr) return true;
          
          const classSchedules = subject.classSchedules || {};
          let hasSchedules = false;
          let matchSchedule = false;
          
          for (const [key, scheds] of Object.entries(classSchedules)) {
            if (Array.isArray(scheds) && scheds.length > 0) {
              hasSchedules = true;
              if (scheds.some(s => s.room === cleanedRoom || s.room === roomStr || key === cleanedRoom || key === roomStr)) {
                matchSchedule = true;
                break;
              }
            }
          }
          
          if (hasSchedules && matchSchedule) return true;
          if (hasSchedules && !matchSchedule) return false;
          
          const className = subject.className || '';
          if (className) {
            if (className.includes(cleanedRoom) || className.includes(roomStr)) return true;
            
            const rangeMatch = className.match(/(\d)\/(\d)(?:-(\d))/);
            if (rangeMatch) {
               const grade = rangeMatch[1];
               const start = parseInt(rangeMatch[2]);
               const end = parseInt(rangeMatch[3]);
               const rMatch = cleanedRoom.match(/(\d)\/(\d)/);
               if (rMatch) {
                  const rGrade = rMatch[1];
                  const rRoom = parseInt(rMatch[2]);
                  if (rGrade === grade && rRoom >= start && rRoom <= end) return true;
               }
            }
            
            const exactMatch = className.match(/(\d)\/(\d)/);
            if (exactMatch) {
               const grade = exactMatch[1];
               const room = exactMatch[2];
               if (cleanedRoom === `${grade}/${room}`) return true;
            }

            const gradeMatch = className.match(/ม\.?\s*(\d)/);
            if (gradeMatch) {
               const grade = gradeMatch[1];
               if (cleanedRoom.startsWith(`${grade}/`)) return true;
            }
            
            return false;
          }
          
          return true; // No schedules, no className -> show to all
        });
        
        if (filteredSubjects.length === 0) {
           filteredSubjects = subjectsList; // Fallback
        }

        setSubjects(filteredSubjects);
        if (!subjectId || !filteredSubjects.find(s => s.id === subjectId)) {
          subjectId = filteredSubjects[0].id;
          setSelectedSubject(subjectId);
        }
      }

      const [setRes, attRes] = await Promise.all([
        fetch('/api/settings'),
        fetch(`/api/attendance?studentId=${studentData.id}&subjectId=${subjectId || ''}`),
      ]);

      const setData = await setRes.json();
      const attData = await attRes.json();

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

  const handleSubjectChange = useCallback((newSubjectId) => {
    setSelectedSubject(newSubjectId);
    if (student) {
      setLoading(true);
      fetchData(student, newSubjectId);
    }
  }, [student, fetchData]);

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

  const getNormalizedSchedules = (scheds) => {
    if (!scheds) return [];
    if (Array.isArray(scheds)) return scheds;
    return Object.entries(scheds).map(([room, data]) => ({ id: `${room}_${data.day}_${data.start}`, room, ...data }));
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

  const handleCheckInClick = () => {
    const hideWarning = localStorage.getItem('hideLocationWarning');
    if (hideWarning === 'true') {
      setShowAttendanceModal(true);
    } else {
      setShowLocationWarningModal(true);
    }
  };

  const handleProceedCheckIn = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideLocationWarning', 'true');
    }
    setShowLocationWarningModal(false);
    setShowAttendanceModal(true);
  };

  // Compute attendance stats
  let presentCount = 0;
  let leaveCount = 0;
  let absentCount = 0;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const startOfSemester = new Date(settings.semesterStart || '2026-05-18T00:00:00+07:00');
  
  // Get class schedules from selected subject (no more hardcoded)
  const currentSubject = subjects.find(s => s.id === selectedSubject);
  const subjectSchedules = currentSubject?.classSchedules || settings.classSchedules || {};
  const getRoomKey = (r) => {
    if (!r) return '';
    const cleaned = r.replace(/^ม\.?\s*/, '').trim();
    // Try to find exact match first
    if (subjectSchedules[cleaned]) return cleaned;
    // Try with common prefixes
    for (const key of Object.keys(subjectSchedules)) {
      if (cleaned === key || r === key) return key;
    }
    return cleaned;
  };
  const roomKey = getRoomKey(student?.room);
  const activeSheetUrl = currentSubject?.googleSheetUrls?.[roomKey] 
                || currentSubject?.googleSheetUrls?.[student?.room]
                || currentSubject?.googleSheetUrls?.['default'] 
                || (currentSubject?.googleSheetUrls && Object.values(currentSubject.googleSheetUrls).length > 0 ? Object.values(currentSubject.googleSheetUrls)[0] : '')
                || settings?.googleSheetUrls?.[roomKey]
                || settings?.googleSheetUrls?.[student?.room]
                || settings?.googleSheetUrls?.['default']
                || '';

  useEffect(() => {
    if (!activeSheetUrl) {
      setSheetData(null);
      return;
    }
    setSheetLoading(true);
    setSheetError('');
    fetch(`/api/sheet?url=${encodeURIComponent(activeSheetUrl)}`)
      .then(res => res.json())
      .then(data => {
         if (data.error) throw new Error(data.error);
         setSheetData(data.data);
      })
      .catch(err => {
         console.error('Sheet fetch error:', err);
         setSheetError(err.message);
      })
      .finally(() => setSheetLoading(false));
  }, [activeSheetUrl]);

  
  const schedule = subjectSchedules[roomKey];
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
              {currentSubject && <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>{currentSubject.name} {currentSubject.className}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '1.2rem' }}>📚</span>
              <select 
                className="form-input" 
                style={{ flex: 1, border: 'none', background: 'transparent', padding: '4px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.className ? `${s.name || ''} ${s.className ? `(${s.className})` : ''}` : '(วิชาที่ไม่มีชื่อ)'}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleCheckInClick}>
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
        <StudentCalendar attendances={attendances} classSchedules={subjectSchedules} studentRoom={student?.room} />

        {/* Attendance Stats Removed as requested */}

        {/* Google Sheet Summary */}
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>📊 สรุปคะแนน</h2>
        </div>
        {(() => {
          if (!activeSheetUrl) {
            return (
              <div className="empty-state" style={{ marginBottom: '24px' }}>
                <div className="icon">📊</div>
                <p>ครูผู้สอนยังไม่ได้เชื่อมโยงลิงก์คะแนน</p>
              </div>
            );
          }

          if (sheetLoading) {
            return (
              <div className="empty-state" style={{ marginBottom: '24px' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                <p>กำลังดึงข้อมูลคะแนนล่าสุด...</p>
              </div>
            );
          }

          if (sheetError) {
             return (
              <div className="empty-state" style={{ marginBottom: '24px' }}>
                <div className="icon">⚠️</div>
                <p>ไม่สามารถดึงข้อมูลได้: {sheetError}</p>
              </div>
             );
          }

          if (sheetData && student) {
             const studentRow = sheetData.find(row => {
                return Object.values(row).some(val => {
                    if (!val) return false;
                    const sVal = String(val).trim();
                    if (sVal === student.id) return true;
                    if (student.firstName && sVal.includes(student.firstName)) return true;
                    return false;
                });
             });

             if (!studentRow) {
                return (
                  <div className="empty-state" style={{ marginBottom: '24px' }}>
                    <div className="icon">🕵️</div>
                    <p>ไม่พบข้อมูลของคุณในตารางคะแนน (ไม่พบรหัส {student.id})</p>
                  </div>
                );
             }

             // Render student data natively!
             // Filter out generic columns like 'รหัส', 'ชื่อ', 'ที่', 'ลำดับ'
             const scoreEntries = Object.entries(studentRow).filter(([key, val]) => {
                if (!key) return false;
                const k = key.trim().toLowerCase();
                if (k.includes('รหัส') || k.includes('ชื่อ') || k.includes('สกุล') || k === 'ที่' || k === 'ลำดับ' || k === 'id') return false;
                return true;
             });

             // Calculate custom metrics based on school rules
             let tAssignments = 0;
             let tSubmitted = 0;
             let behaviorScore = 0;
             
             scoreEntries.forEach(([key, val]) => {
                const k = key.trim();
                if (k.startsWith('งาน')) {
                   tAssignments++;
                   if (val && String(val).trim() !== '0') tSubmitted++;
                } else if (k === 'มา') {
                   behaviorScore = parseFloat(val) || 0;
                }
             });

             const unsubmitted = tAssignments - tSubmitted;

             const calculateGrade = (score) => {
                if (score >= 80) return '4';
                if (score >= 75) return '3.5';
                if (score >= 70) return '3';
                if (score >= 65) return '2.5';
                if (score >= 60) return '2';
                if (score >= 55) return '1.5';
                if (score >= 50) return '1';
                return '0';
             };

             // Categorize scores for better UI
             const scoreCategories = {
                overview: [],
                attendance: [],
                exams: [],
                assignments: [],
                others: []
             };

             scoreEntries.forEach(([key, val]) => {
                let k = key.trim();
                if (k === 'สอบ') return; // Hide 'สอบ' from the UI as requested
                
                let displayKey = k;
                let displayVal = val;
                const numVal = parseFloat(val);
                let isNum = !isNaN(numVal);

                // Apply custom overrides
                if (k === 'เก็บ') {
                   displayKey = 'งานค้างส่ง';
                   displayVal = String(unsubmitted);
                   isNum = true;
                } else if (k === 'มา') {
                   displayKey = 'จิตพิสัย';
                   displayVal = String(behaviorScore);
                   isNum = true;
                } else if (k === 'รวม') {
                   displayKey = 'คะแนนรวม';
                   if (isNum) {
                      const grade = calculateGrade(numVal);
                      displayVal = `${numVal} (เกรด ${grade})`;
                   }
                } else if (k === 'ก่อนกลาง') {
                   displayKey = 'คะแนนก่อนกลางภาค';
                } else if (k === 'กลาง') {
                   displayKey = 'สอบกลางภาค';
                } else if (k === 'ก่อนปลาย') {
                   displayKey = 'คะแนนก่อนปลายภาค';
                } else if (k === 'ปลาย') {
                   displayKey = 'สอบปลายภาค';
                } else if (k === 'พิเศษ') {
                   displayKey = 'คะแนนพิเศษ';
                }

                const searchKey = displayKey.toLowerCase();
                const item = { key: displayKey, val: displayVal, isNum, numVal };

                if (searchKey.includes('รวม') || searchKey.includes('ค้างส่ง') || searchKey.includes('เกรด')) {
                    scoreCategories.overview.push(item);
                } else if (searchKey === 'มา' || searchKey === 'ขาด' || searchKey === 'ลา' || searchKey.includes('เลขที่')) {
                    scoreCategories.attendance.push(item);
                } else if (searchKey.includes('กลาง') || searchKey.includes('ปลาย') || searchKey.includes('สอบ') || searchKey.includes('พิเศษ') || searchKey === 'จิตพิสัย') {
                    scoreCategories.exams.push(item);
                } else if (searchKey.includes('งาน') || searchKey.includes('แบบฝึก') || searchKey.includes('ชิ้น')) {
                    scoreCategories.assignments.push(item);
                } else {
                    scoreCategories.others.push(item);
                }
             });

             const renderScoreCard = (item, icon, color) => (
               <div key={item.key} style={{ 
                 background: 'var(--bg-primary)', 
                 borderRadius: '12px', 
                 padding: '16px', 
                 boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                 border: `1px solid ${color}30`,
                 borderLeft: `4px solid ${color}`,
                 display: 'flex',
                 flexDirection: 'column',
                 gap: '8px',
                 transition: 'transform 0.2s',
                 cursor: 'default'
               }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
               >
                 <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                   {icon} {item.key}
                 </span>
                 <strong style={{ fontSize: '1.5rem', fontFamily: 'var(--font-en)', color: 'var(--text-primary)', lineHeight: 1 }}>
                   {item.val || '0'}
                 </strong>
               </div>
             );

             const renderListItem = (item, icon) => (
                <div key={item.key} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: '10px',
                  border: '1px solid var(--border-light)', marginBottom: '8px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <span style={{ background: 'var(--bg-secondary)', padding: '6px', borderRadius: '6px', display: 'flex' }}>{icon}</span>
                    {item.key}
                  </span>
                  <strong style={{ fontFamily: 'var(--font-en)', fontSize: '1.1rem', color: item.numVal === 0 ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                    {item.val || '0'}
                  </strong>
                </div>
             );

             return (
               <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Overview Section */}
                  {scoreCategories.overview.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                       {scoreCategories.overview.map(item => {
                         let color = '#4facfe';
                         if (item.key.includes('รวม')) color = '#fbbc04';
                         if (item.key.includes('เกรด')) color = '#34a853';
                         return renderScoreCard(item, '🎯', color);
                       })}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    
                    {/* Assignments Section */}
                    {scoreCategories.assignments.length > 0 && (
                      <div className="card" style={{ background: 'linear-gradient(to bottom right, #ffffff, #f8faff)', padding: '20px' }}>
                        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>📝</span>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>ภาระงาน</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {scoreCategories.assignments.map(item => renderListItem(item, '📄'))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Exams Section */}
                      {scoreCategories.exams.length > 0 && (
                        <div className="card" style={{ background: 'linear-gradient(to bottom right, #ffffff, #fffcf5)', padding: '20px' }}>
                          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.2rem' }}>✍️</span>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>คะแนนเก็บทั้งหมด</h3>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {scoreCategories.exams.map(item => renderListItem(item, '✏️'))}
                          </div>
                        </div>
                      )}

                      {/* Attendance & Others Section */}
                      {(scoreCategories.attendance.length > 0 || scoreCategories.others.length > 0) && (
                        <div className="card" style={{ background: 'linear-gradient(to bottom right, #ffffff, #f5fff8)', padding: '20px' }}>
                          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.2rem' }}>📊</span>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>ข้อมูลอื่นๆ</h3>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                            {[...scoreCategories.attendance, ...scoreCategories.others].map(item => (
                              <div key={item.key} style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.key}</span>
                                <strong style={{ fontFamily: 'var(--font-en)', fontSize: '1.2rem' }}>{item.val || '0'}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
               </div>
             );
          }

          return null;
        })()}

        {/* Edit Profile Modal */}
        {showProfileModal && (
          <EditProfileModal
            student={student}
            onClose={() => setShowProfileModal(false)}
            onSuccess={(updatedStudent) => {
              setStudent(updatedStudent);
              sessionStorage.setItem('student', JSON.stringify(updatedStudent));
              setShowProfileModal(false);
              addToast('อัปเดตข้อมูลสำเร็จ');
            }}
          />
        )}

        {showAttendanceModal && (
          <AttendanceCheckModal
            student={student}
            settings={settings}
            subjectId={selectedSubject}
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
            subjectId={selectedSubject}
            onClose={() => setShowLeaveModal(false)}
            onSuccess={(msg) => {
              setShowLeaveModal(false);
              addToast(msg);
              fetchData(student);
            }}
          />
        )}

        {/* Location Warning Modal */}
        {showLocationWarningModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ textAlign: 'center', maxWidth: '400px' }}>
              <h3 style={{ color: '#ea4335', marginBottom: '16px' }}>⚠️ คำเตือน</h3>
              <p style={{ marginBottom: '16px', lineHeight: '1.5' }}>
                กรุณากดเช็คชื่อ <b>ภายในห้องเรียนหรือสถานที่เรียนเท่านั้น</b>
                {settings?.targetRoomName && (
                  <span style={{ display: 'block', color: 'var(--accent-primary)', marginTop: '8px', fontWeight: 'bold' }}>
                    (ห้องเรียนปัจจุบัน: {settings.targetRoomName})
                  </span>
                )}
                <br />
                ระบบจะตรวจสอบพิกัด GPS ของคุณ หากอยู่ไม่ตรงจุด จะถือว่าการเช็คชื่อไม่สมบูรณ์
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                <input 
                  type="checkbox" 
                  id="dontShowAgain" 
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                <label htmlFor="dontShowAgain" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                  รับทราบและไม่ต้องแสดงข้อความนี้อีก
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={handleProceedCheckIn}>
                  เข้าใจแล้ว ดำเนินการต่อ
                </button>
                <button className="btn btn-secondary" onClick={() => setShowLocationWarningModal(false)}>
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
