/* eslint-disable */
'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

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

function AssignmentModal({ adminKey, subjectId, assignment, onClose, onSuccess }) {
  const isEditing = !!assignment;
  const [title, setTitle] = useState(assignment?.title || '');
  const [description, setDescription] = useState(assignment?.description || '');
  const [deadline, setDeadline] = useState(assignment?.deadline || '');
  const [maxScore, setMaxScore] = useState(assignment?.maxScore || 10);
  const [worksheetUrl, setWorksheetUrl] = useState(assignment?.worksheetUrl || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const method = isEditing ? 'PATCH' : 'POST';
      const bodyData = { 
        title, description, deadline, maxScore: Number(maxScore), worksheetUrl, adminKey, subjectId 
      };
      if (isEditing) {
        bodyData.id = assignment.id;
      }

      const res = await fetch('/api/assignments', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      alert(isEditing ? 'ไม่สามารถแก้ไขงานได้' : 'ไม่สามารถเพิ่มงานได้');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{isEditing ? '✏️ แก้ไขงาน' : '➕ เพิ่มงานใหม่'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ชื่องาน *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ใบงานที่ 4: พืชรอบตัวเรา"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>รายละเอียด</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายรายละเอียดงาน..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>กำหนดส่ง</label>
              <input
                type="date"
                className="form-input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>คะแนนเต็ม</label>
              <input
                type="number"
                className="form-input"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                min={1}
                max={100}
              />
            </div>
          </div>

          <div className="form-group">
            <label>🔗 ลิงก์ใบงาน (URL)</label>
            <input
              type="url"
              className="form-input"
              value={worksheetUrl}
              onChange={(e) => setWorksheetUrl(e.target.value)}
              placeholder="https://docs.google.com/... หรือลิงก์ใบงาน"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!title.trim() || saving}
              style={{ width: 'auto', opacity: !title.trim() ? 0.5 : 1 }}
            >
              {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StudentModal({ adminKey, student, onClose, onSuccess }) {
  const isEditing = !!student;
  const [id, setId] = useState(student?.id || '');
  const [name, setName] = useState(student?.name || '');
  const [nickname, setNickname] = useState(student?.nickname || '');
  const [room, setRoom] = useState(student?.room || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id.trim() || !name.trim()) return;

    setSaving(true);
    try {
      const method = isEditing ? 'PATCH' : 'POST';
      const bodyData = { 
        adminKey,
        student: isEditing ? undefined : { id, name, nickname, room },
        updates: isEditing ? { id, name, nickname, room } : undefined,
        id: isEditing ? student.id : undefined // Original ID if editing
      };

      const res = await fetch('/api/admin/students', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      alert(isEditing ? 'ไม่สามารถแก้ไขข้อมูลได้' : 'ไม่สามารถเพิ่มรายชื่อได้');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{isEditing ? '✏️ แก้ไขข้อมูลนักเรียน' : '➕ เพิ่มนักเรียนใหม่'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>รหัสนักเรียน (5 หลัก) *</label>
            <input
              type="text"
              className="form-input"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="เช่น 67001"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>ชื่อ-นามสกุล *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ธนกฤต สุขสมบูรณ์"
              required
            />
          </div>
          <div className="form-group">
            <label>ชื่อเล่น</label>
            <input
              type="text"
              className="form-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="เช่น กฤต"
            />
          </div>
          <div className="form-group">
            <label>ห้องเรียน</label>
            <input
              type="text"
              className="form-input"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="เช่น ม.1/1"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={!id.trim() || !name.trim() || saving}>
              {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkStudentModal({ adminKey, onClose, onSuccess }) {
  const [bulkText, setBulkText] = useState('');
  const [room, setRoom] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    setSaving(true);
    try {
      const lines = bulkText.split('\n').map(line => line.trim()).filter(line => line);
      const students = [];
      
      for (const line of lines) {
        // match pattern: id then name (maybe nickname at the end if we want, but let's just do id and name for now)
        // usually copy paste from excel will be separated by tab
        const parts = line.split(/\t+|\s{2,}| /); // split by tab, multiple spaces, or single space
        if (parts.length >= 2) {
          const id = parts[0];
          const name = parts.slice(1).join(' '); // Rejoin the rest as name
          students.push({ id, name, room });
        }
      }

      if (students.length === 0) {
        alert('ไม่พบข้อมูลนักเรียนในรูปแบบที่ถูกต้อง (ต้องมี รหัส และ ชื่อ)');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk', students, adminKey }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      alert('ไม่สามารถเพิ่มข้อมูลได้');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <h2>📋 วางรายชื่อนักเรียน (Bulk Add)</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          คัดลอกรายชื่อจาก Excel หรือ Google Sheets มาวางที่นี่<br/>
          <strong>รูปแบบ:</strong> รหัสนักเรียน <i>(เว้นวรรค/Tab)</i> ชื่อ-นามสกุล
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ห้องเรียน (กำหนดให้ทุกคนที่นำเข้า)</label>
            <input
              type="text"
              className="form-input"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="เช่น ม.1/1 (ไม่บังคับ)"
            />
          </div>
          <div className="form-group">
            <label>รายชื่อ</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '200px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`67001 สมชาย ใจดี\n67002 สมหญิง สวยงาม`}
              required
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={!bulkText.trim() || saving}>
              {saving ? 'กำลังประมวลผล...' : '➕ นำเข้ารายชื่อ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Haversine distance in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return Math.round(R * c);
}

const ScoreInput = ({ initialValue, onChange, min, max, style, placeholder }) => {
  const [val, setVal] = useState(initialValue ?? '');
  
  useEffect(() => {
    setVal(initialValue ?? '');
  }, [initialValue]);

  return (
    <input
      type="number"
      className="score-input"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={(e) => {
        if (e.target.value !== String(initialValue ?? '')) {
           onChange(e.target.value);
        }
      }}
      min={min} max={max} style={style} placeholder={placeholder}
    />
  );
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const [data, setData] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminKey, setAdminKey] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [className, setClassName] = useState('');
  const [targetLat, setTargetLat] = useState(null);
  const [targetLng, setTargetLng] = useState(null);
  const [targetRoomName, setTargetRoomName] = useState('');
  const [googleSheetUrls, setGoogleSheetUrls] = useState({});
  const [qrCode, setQrCode] = useState('');
  const [showQrCode, setShowQrCode] = useState(true);
  const [adminAvatarUrl, setAdminAvatarUrl] = useState('');
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState('');
  const [googleAppScriptUrl, setGoogleAppScriptUrl] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);
  
  // Student management states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBulkStudentModal, setShowBulkStudentModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filterRoom, setFilterRoom] = useState('');
  const [filterSummaryRoom, setFilterSummaryRoom] = useState('');
  const [filterAttRoom, setFilterAttRoom] = useState('');
  const [filterAttDate, setFilterAttDate] = useState('today');
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [calendarRoom, setCalendarRoom] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [classSchedules, setClassSchedules] = useState([]);
  
  const [brushMode, setBrushMode] = useState(null); // 'present', 'leave', 'delete'
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const applyBrush = (student, dateStr, isoDateStr, att, mode) => {
    if (!mode) return;
    if (mode === 'present' && att && att.type === 'present' && att.isOk !== false) return;
    if (mode === 'leave' && att && att.type === 'leave') return;
    if (mode === 'delete' && !att) return;

    if (mode === 'present') {
      const newAttId = crypto.randomUUID();
      setAttendances(prev => {
         const filtered = prev.filter(a => !(att && a.id === att.id));
         return [...filtered, { id: newAttId, studentId: student.id, subjectId: selectedSubject, type: 'present', status: 'approved', timestamp: isoDateStr, createdAt: isoDateStr }];
      });
      if (att) fetch(`/api/attendance?id=${att.id}&adminKey=${adminKey}`, { method: 'DELETE' });
      fetch('/api/attendance', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ studentId: student.id, subjectId: selectedSubject, type: 'present', adminKey, timestamp: isoDateStr }) });
    } else if (mode === 'leave') {
      const newAttId = crypto.randomUUID();
      setAttendances(prev => {
         const filtered = prev.filter(a => !(att && a.id === att.id));
         return [...filtered, { id: newAttId, studentId: student.id, subjectId: selectedSubject, type: 'leave', status: 'approved', reason: 'ลากิจ/ลาป่วย (แก้ไขโดยครู)', timestamp: isoDateStr, createdAt: isoDateStr }];
      });
      if (att) fetch(`/api/attendance?id=${att.id}&adminKey=${adminKey}`, { method: 'DELETE' });
      fetch('/api/attendance', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ studentId: student.id, subjectId: selectedSubject, type: 'leave', reason: 'ลากิจ/ลาป่วย (แก้ไขโดยครู)', adminKey, timestamp: isoDateStr }) });
    } else if (mode === 'delete') {
      if (att) {
        setAttendances(prev => prev.filter(a => a.id !== att.id));
        fetch(`/api/attendance?id=${att.id}&adminKey=${adminKey}`, { method: 'DELETE' });
      }
    }
  };

  const getNormalizedSchedules = (scheds) => {
    if (!scheds) return [];
    if (Array.isArray(scheds)) return scheds;
    return Object.entries(scheds).map(([room, data]) => ({ id: `${room}_${data.day}_${data.start}`, room, ...data }));
  };

  // Drag to check states
  const [dragTargetStatus, setDragTargetStatus] = useState(null);

  
  const [toasts, setToasts] = useState([]);
  const [sheetData, setSheetData] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const router = useRouter();
  const fileInputRef = useRef(null);
  const selectedSubjectRef = useRef(selectedSubject);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchData = useCallback(async (key, overrideSubjectId = null) => {
    setIsRefreshing(true);
    setLoadProgress(5);
    try {
      const currentSubId = overrideSubjectId || selectedSubjectRef.current;
      setLoadProgress(15);
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: key, subjectId: currentSubId }),
      });
      setLoadProgress(45);

      if (res.ok) {
        const result = await res.json();
        setLoadProgress(55);
        setData(result);

        if (result.subjects) {
          setSubjects(result.subjects);
          if (!currentSubId && result.subjects.length > 0) {
            const firstId = result.subjects[0].id;
            setSelectedSubject(firstId);
            selectedSubjectRef.current = firstId;
            return fetchData(key, firstId);
          }
        }

        if (result.settings) {
          setQrCode(result.settings.qrCode || '');
          setAdminAvatarUrl(result.settings.adminAvatarUrl || '');
        }

        if (result.subjects && currentSubId) {
          const sub = result.subjects.find(s => s.id === currentSubId);
          if (sub) {
            setSubjectName(sub.name || '');
            setClassName(sub.className || '');
            setTargetLat(sub.targetLat || null);
            setTargetLng(sub.targetLng || null);
            setTargetRoomName(sub.targetRoomName || '');
            setClassSchedules(getNormalizedSchedules(sub.classSchedules));
            setGoogleSheetUrls(sub.googleSheetUrls || (sub.googleSheetUrl ? { 'default': sub.googleSheetUrl } : {}));
          }
        }
        setLoadProgress(65);
      } else {
        router.push('/');
        return;
      }
      
      // Fetch attendances
      setLoadProgress(70);
      const attRes = await fetch(`/api/attendance?adminKey=${key}&subjectId=${currentSubId || ''}`);
      setLoadProgress(90);
      if (attRes.ok) {
        const attResult = await attRes.json();
        setAttendances(attResult);
      }
      setLoadProgress(100);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setIsRefreshing(false);
        setLoadProgress(0);
      }, 300);
    }
  }, [router]);

  useEffect(() => {
    const key = sessionStorage.getItem('adminKey');
    if (!key) {
      router.push('/');
      return;
    }
    setAdminKey(key);
    fetchData(key);
  }, [router, fetchData]);

  const isStudentInSubject = (roomStr) => {
    if (!roomStr) return false;
    const cleanedRoom = roomStr.replace(/^ม\.?\s*/, '').trim();

    const normalized = getNormalizedSchedules(classSchedules);
    if (normalized.length > 0) {
      return normalized.some(s => s.room === cleanedRoom || s.room === roomStr);
    }
    
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
    
    return true;
  };

  const { students, summaryData, assignments } = useMemo(() => {
    if (!data) return { students: [], summaryData: [], assignments: [] };
    return {
      students: (data.students || []).filter(s => isStudentInSubject(s.room)),
      summaryData: (data.submissions || []).filter(s => isStudentInSubject(s.student?.room)),
      assignments: data.assignments || []
    };
  }, [data, className, classSchedules]);

  const { preMidterm, postMidterm } = useMemo(() => {
    const pre = [];
    const post = [];
    assignments.forEach(a => {
      const match = a.title.match(/(\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1]);
        const minor = parseInt(match[2]);
        if (major > 2 || (major === 2 && minor >= 3)) {
          post.push(a);
        } else {
          pre.push(a);
        }
      } else {
        pre.push(a);
      }
    });
    return { preMidterm: pre, postMidterm: post };
  }, [assignments]);

  // Pre-compute attendance stats for all students (PERF: avoid recalculating in every row render)
  const attendanceStats = useMemo(() => {
    const stats = {};
    if (!classSchedules || !attendances) return stats;

    const normalizedScheds = getNormalizedSchedules(classSchedules);
    if (normalizedScheds.length === 0) return stats;

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const startOfSemester = new Date('2026-05-18T00:00:00+07:00');

    // Build attendance index: { "studentId_YYYY-MM-DD": attendance }
    const attIndex = {};
    for (const att of attendances) {
      const aDate = new Date(att.timestamp);
      const key = `${att.studentId}_${aDate.getFullYear()}-${String(aDate.getMonth() + 1).padStart(2, '0')}-${String(aDate.getDate()).padStart(2, '0')}`;
      attIndex[key] = att;
    }

    // Pre-compute class days list per room
    const roomClassDays = {};
    for (const s of normalizedScheds) {
      if (!roomClassDays[s.room]) roomClassDays[s.room] = new Set();
      roomClassDays[s.room].add(s.day);
    }

    // Pre-compute all class dates per room
    const roomClassDates = {};
    for (const [room, daysSet] of Object.entries(roomClassDays)) {
      const dates = [];
      let d = new Date(startOfSemester);
      while (d <= todayDate) {
        const dateStrIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (daysSet.has(d.getDay()) && !holidays.includes(dateStrIso)) {
          dates.push(dateStrIso);
        }
        d.setDate(d.getDate() + 1);
      }
      roomClassDates[room] = dates;
    }

    for (const row of summaryData) {
      const cleanedRoom = (row.student?.room || '').replace(/^ม\.?\s*/, '').trim();
      const classDates = roomClassDates[cleanedRoom] || roomClassDates[row.student?.room] || [];
      
      let present = 0, leave = 0, absent = 0;
      for (const dateStr of classDates) {
        const att = attIndex[`${row.student.id}_${dateStr}`];
        if (att) {
          if (att.type === 'leave') leave++;
          else present++;
        } else {
          absent++;
        }
      }
      stats[row.student.id] = { present, leave, absent };
    }
    return stats;
  }, [summaryData, classSchedules, attendances]);

  // Stats
  const { totalStudents, totalExpected, totalSubmitted, submitRate } = useMemo(() => {
    const filteredSummaryData = filterSummaryRoom 
      ? summaryData.filter(row => row.student.room === filterSummaryRoom)
      : summaryData;

    const tStudents = filteredSummaryData.length;
    const tAssignments = assignments.length;
    const tExpected = tStudents * tAssignments;
    const tSubmitted = filteredSummaryData.reduce((acc, s) => {
      return acc + Object.values(s.submissions).filter((v) => v.submitted).length;
    }, 0);
    const sRate = tExpected > 0 ? Math.round((tSubmitted / tExpected) * 100) : 0;
    return { totalStudents: tStudents, totalAssignments: tAssignments, totalExpected: tExpected, totalSubmitted: tSubmitted, submitRate: sRate };
  }, [assignments, summaryData, filterSummaryRoom]);

  const handleStudentScoreChange = async (studentId, field, newScoreStr) => {
    const newScore = newScoreStr === '' ? null : Number(newScoreStr);
    
    // Optimistic UI Update
    setData(prevData => {
      const newSubmissions = [...prevData.submissions];
      const studentIndex = newSubmissions.findIndex(s => s.student.id === studentId);
      if (studentIndex !== -1) {
        newSubmissions[studentIndex] = {
          ...newSubmissions[studentIndex],
          student: {
            ...newSubmissions[studentIndex].student,
            [field]: newScore
          }
        };
      }
      return { ...prevData, submissions: newSubmissions };
    });

    try {
      await fetch('/api/admin/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: studentId,
          updates: { [field]: newScore },
          adminKey
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // ==================== EXPORT EXCEL ====================
  const handleExportExcel = () => {
    if (!summaryData || summaryData.length === 0) return;

    const rows = summaryData
      .sort((a, b) => {
        const roomA = a.student.room || '';
        const roomB = b.student.room || '';
        if (roomA !== roomB) return roomA.localeCompare(roomB, 'th');
        return (a.student.id || '').localeCompare(b.student.id || '');
      })
      .map((row, idx) => {
        // Use pre-computed attendance stats
        const { present: presentCount, leave: leaveCount, absent: absentCount } = attendanceStats[row.student.id] || { present: 0, leave: 0, absent: 0 };

        const assignmentScore = Object.values(row.submissions).reduce((sum, s) => sum + (Number(s.score) || 0), 0);
        const behaviorScore = Math.max(0, 10 - (absentCount * 2) - (leaveCount * 1));
        const midterm = Number(row.student.midtermScore) || 0;
        const final_ = Number(row.student.finalScore) || 0;
        const totalScore = assignmentScore + midterm + final_ + behaviorScore;

        let grade;
        if (totalScore < 50) grade = 0;
        else if (totalScore < 55) grade = 1;
        else if (totalScore < 60) grade = 1.5;
        else if (totalScore < 65) grade = 2;
        else if (totalScore < 70) grade = 2.5;
        else if (totalScore < 75) grade = 3;
        else if (totalScore < 80) grade = 3.5;
        else grade = 4;

        const rowData = {
          'ที่': idx + 1,
          'ห้อง': row.student.room || '',
          'รหัส': row.student.id,
          'ชื่อ-สกุล': row.student.name,
        };

        // Assignment scores (Pre-midterm)
        preMidterm.forEach(a => {
          const sub = row.submissions[a.id];
          rowData[a.title] = sub?.submitted ? (Number(sub.score) || 0) : '-';
        });

        rowData['กลางภาค (20)'] = midterm;

        // Assignment scores (Post-midterm)
        postMidterm.forEach(a => {
          const sub = row.submissions[a.id];
          rowData[a.title] = sub?.submitted ? (Number(sub.score) || 0) : '-';
        });

        rowData['ปลายภาค (20)'] = final_;
        rowData['จิตพิสัย (10)'] = behaviorScore;
        rowData['มาเรียน'] = presentCount;
        rowData['ลา'] = leaveCount;
        rowData['ขาด'] = absentCount;
        rowData['รวม (100)'] = totalScore;
        rowData['เกรด'] = grade;

        return rowData;
      });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'สรุปคะแนน');

    // Auto-width columns
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length * 2, ...rows.map(r => String(r[key] || '').length)) + 2
    }));
    ws['!cols'] = colWidths;

    const subjectName = data?.settings?.subjectName || 'คะแนน';
    const fileName = `${subjectName}_สรุปคะแนน.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleBulkScore = async (type, idOrField, maxScore, title) => {
    if (!data || !data.submissions) return;
    
    const summaryData = data.submissions;
    const filteredStudents = filterRoom ? summaryData.filter(s => s.student.room === filterRoom) : summaryData;

    const scoreStr = prompt(`กรอกคะแนนที่ต้องการให้ "ทุกคนที่อยู่ในตาราง" สำหรับ:\n${title}\n(คะแนนเต็ม ${maxScore})`);
    if (scoreStr === null || scoreStr === '') return;
    const score = Number(scoreStr);
    if (isNaN(score) || score < 0 || score > maxScore) {
      return alert(`กรุณากรอกตัวเลขระหว่าง 0 ถึง ${maxScore}`);
    }

    if (!confirm(`ยืนยันการให้คะแนน ${score} กับนักเรียนทุกคนที่แสดงในตาราง (${filteredStudents.length} คน)?`)) return;

    if (type === 'assignment') {
      const promises = filteredStudents.map(row => 
        handleUpdateSubmission(row.student.id, idOrField, row.submissions[idOrField]?.submitted, row.submissions[idOrField]?.score, true, score)
      );
      await Promise.all(promises);
    } else {
      const promises = filteredStudents.map(row => 
        handleStudentScoreChange(row.student.id, idOrField, score)
      );
      await Promise.all(promises);
    }
    addToast(`กรอกคะแนน ${title} ให้ทุกคนเรียบร้อยแล้ว`, 'success');
  };

  const handleDeleteAssignment = async (id, title) => {
    if (!confirm(`ต้องการลบ "${title}" หรือไม่?\nข้อมูลการส่งงานที่เกี่ยวข้องจะถูกลบด้วย`)) return;

    try {
      const res = await fetch(`/api/assignments?id=${id}&adminKey=${adminKey}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        addToast('ลบงานสำเร็จ');
        fetchData(adminKey);
      }
    } catch (err) {
      addToast('ไม่สามารถลบงานได้', 'error');
    }
  };

  const handleUpdateSubmission = async (studentId, assignmentId, currentStatus, currentScore, overrideTargetStatus = null, overrideTargetScore = undefined) => {
    const targetStatus = overrideTargetStatus !== null ? overrideTargetStatus : !currentStatus;
    const targetScore = overrideTargetScore !== undefined ? overrideTargetScore : currentScore;
    
    if (currentStatus === targetStatus && currentScore === targetScore) return; // No change needed

    // Optimistic UI Update
    setData(prevData => {
      const newData = { ...prevData };
      const newSummaryData = [...newData.submissions];
      const studentIndex = newSummaryData.findIndex(s => s.student.id === studentId);
      if (studentIndex !== -1) {
        newSummaryData[studentIndex] = {
          ...newSummaryData[studentIndex],
          submissions: {
            ...newSummaryData[studentIndex].submissions,
            [assignmentId]: {
              ...newSummaryData[studentIndex].submissions[assignmentId],
              submitted: targetStatus,
              score: targetScore,
              submittedAt: (targetStatus && !currentStatus) ? new Date().toISOString() : newSummaryData[studentIndex].submissions[assignmentId]?.submittedAt
            }
          }
        };
      }
      newData.submissions = newSummaryData;
      return newData;
    });

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          assignmentId,
          submitted: targetStatus,
          score: targetScore,
          adminKey
        }),
      });

      if (!res.ok) {
        fetchData(adminKey);
        addToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
      }
    } catch (err) {
      fetchData(adminKey);
      addToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const handleCellMouseDown = (studentId, assignmentId, currentStatus, currentScore) => {
    setIsDragging(true);
    const target = !currentStatus;
    setDragTargetStatus({ submitted: target, score: currentScore });
    handleUpdateSubmission(studentId, assignmentId, currentStatus, currentScore, target, currentScore);
  };

  const handleCellMouseEnter = (studentId, assignmentId, currentStatus, currentScore) => {
    if (isDragging && dragTargetStatus !== null) {
      handleUpdateSubmission(studentId, assignmentId, currentStatus, currentScore, dragTargetStatus.submitted, dragTargetStatus.score);
    }
  };

  const handleScoreChange = (studentId, assignmentId, currentStatus, newScoreStr) => {
    const newScore = newScoreStr === '' ? null : Number(newScoreStr);
    const newStatus = newScore !== null ? true : currentStatus;
    handleUpdateSubmission(studentId, assignmentId, currentStatus, undefined, newStatus, newScore);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    setDragTargetStatus(null);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target.result;
        
        try {
          const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              adminKey,
              subjectId: selectedSubject,
              adminAvatarUrl: base64Image
            })
          });

          if (res.ok) {
            const data = await res.json();
            setAdminAvatarUrl(data.settings.adminAvatarUrl);
            addToast('เปลี่ยนรูปโปรไฟล์สำเร็จ');
          } else {
            addToast('ไม่สามารถเปลี่ยนรูปโปรไฟล์ได้', 'error');
          }
        } catch (err) {
          addToast('เกิดข้อผิดพลาดในการบันทึกรูปโปรไฟล์', 'error');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      addToast('เกิดข้อผิดพลาดในการอ่านไฟล์', 'error');
    }
  };

  const showAttendanceEditPopup = async (student, dateStr, att) => {
    const defaultReason = att?.type === 'leave' ? att.reason : '';
    const res = await MySwal.fire({
      title: '✏️ แก้ไขการเช็คชื่อ',
      html: `
        <div style="text-align: left; font-size: 1rem; line-height: 1.5; margin-bottom: 16px;">
          <p><strong>นักเรียน:</strong> ${student.name} (${student.nickname || '-'})</p>
          <p><strong>วันที่:</strong> ${dateStr}</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button id="btn-present" class="swal2-confirm swal2-styled" style="background: #e6f4ea; color: #137333; width: 100%; text-align: left; justify-content: flex-start; padding: 12px 20px;">🟢 มาเรียน (ปกติ)</button>
          
          <div style="background: #fff9c4; border: 1px solid #b08d00; border-radius: 8px; padding: 12px; margin-top: 8px;">
            <div style="color: #b08d00; font-weight: 600; margin-bottom: 8px; text-align: left;">🟡 ลาเรียน</div>
            <input type="text" id="leave-reason-input" class="swal2-input" placeholder="เหตุผลการลา..." value="${defaultReason}" style="width: 100%; box-sizing: border-box; margin: 0 0 8px 0; font-size: 0.95rem;">
            <button id="btn-leave" class="swal2-confirm swal2-styled" style="background: #f39c12; width: 100%; margin: 0; padding: 10px;">บันทึกสถานะลา</button>
          </div>

          <button id="btn-absent" class="swal2-confirm swal2-styled" style="background: #fce8e6; color: #d93025; width: 100%; text-align: left; justify-content: flex-start; padding: 12px 20px; margin-top: 8px;">🔴 ขาดเรียน (ลบข้อมูล)</button>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'ยกเลิก',
      didOpen: () => {
        const popup = MySwal.getPopup();
        popup.querySelector('#btn-present').addEventListener('click', () => {
          handleEditAttendance(student.id, dateStr, 'present');
          MySwal.close();
        });
        popup.querySelector('#btn-leave').addEventListener('click', () => {
          const r = popup.querySelector('#leave-reason-input').value;
          handleEditAttendance(student.id, dateStr, 'leave', r);
          MySwal.close();
        });
        popup.querySelector('#btn-absent').addEventListener('click', () => {
          handleEditAttendance(student.id, dateStr, 'absent');
          MySwal.close();
        });
      }
    });
  };

  const handleEditAttendance = async (studentId, dateStr, newType, newReason = '') => {
    try {
      // dateStr is 'DD/MM/YYYY' (Thai year). Convert to YYYY-MM-DD
      const dateParts = dateStr.split('/');
      const yyyy = parseInt(dateParts[2]) - 543;
      const mm = dateParts[1].padStart(2, '0');
      const dd = dateParts[0].padStart(2, '0');
      const searchDate = `${yyyy}-${mm}-${dd}`;

      let existingAtt = data.attendances.find(a => 
        a.studentId === studentId && 
        (a.timestamp.startsWith(searchDate) || new Date(a.createdAt).toLocaleDateString('th-TH') === dateStr)
      );

      if (newType === 'absent') {
        if (existingAtt) {
           await handleDeleteAttendance(existingAtt.id, 'ลบสถานะเช็คชื่อ', true);
        }
        return;
      }

      if (existingAtt) {
        const res = await fetch('/api/attendance', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminKey: adminKey,
            id: existingAtt.id,
            updates: {
              type: newType,
              reason: newReason,
              isOk: newType === 'leave' ? null : true,
              status: 'approved'
            }
          })
        });
        if (res.ok) {
          addToast('บันทึกการแก้ไขสำเร็จ');
          fetchData(adminKey);
        } else {
          addToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
        }
      } else {
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminKey: adminKey,
            studentId: studentId,
            type: newType,
            reason: newReason,
            timestamp: `${searchDate}T08:00:00.000Z`
          })
        });
        if (res.ok) {
          addToast('บันทึกการเพิ่มข้อมูลสำเร็จ');
          fetchData(adminKey);
        } else {
          addToast('เกิดข้อผิดพลาดในการเพิ่มข้อมูล', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      addToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  const handleDeleteAttendance = async (id, name, silent = false) => {
    if (!silent && !confirm(`ต้องการลบประวัติเช็คชื่อของ ${name} ใช่หรือไม่?\nนักเรียนจะสามารถกดเช็คชื่อใหม่ได้`)) return;
    try {
      const res = await fetch(`/api/attendance?id=${id}&adminKey=${adminKey}`, { method: 'DELETE' });
      if (res.ok) {
        if (!silent) addToast('ลบประวัติเช็คชื่อสำเร็จ');
        fetchData(adminKey);
      } else {
        addToast('ไม่สามารถลบประวัติเช็คชื่อได้', 'error');
      }
    } catch (err) {
      addToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!confirm(`ต้องการลบนักเรียน ${id} - ${name} ใช่หรือไม่?\nข้อมูลการส่งงานที่เกี่ยวข้องจะสูญหาย`)) return;

    try {
      const res = await fetch(`/api/admin/students?id=${id}&adminKey=${adminKey}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        addToast('ลบนักเรียนสำเร็จ');
        setSelectedStudents((prev) => prev.filter(selectedId => selectedId !== id));
        fetchData(adminKey);
      } else {
        const data = await res.json();
        addToast(data.error || 'ไม่สามารถลบนักเรียนได้', 'error');
      }
    } catch (err) {
      addToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleDeleteAllStudents = async () => {
    if (!summaryData || summaryData.length === 0) return;
    if (!confirm(`🚨 ยืนยันที่จะ ลบนักเรียนทั้งหมด (${summaryData.length} คน) ออกจากระบบ?\n\n(คำเตือน: การกระทำนี้จะลบงานที่ส่งแล้วทั้งหมดด้วย และไม่สามารถกู้คืนได้)`)) return;
    
    // confirm twice for safety
    if (!confirm('ยืนยันอีกครั้ง! คุณต้องการล้างข้อมูลนักเรียนทั้งหมดจริงๆ ใช่หรือไม่?')) return;
    
    const allIds = summaryData.map(s => s.student.id);
    try {
      const res = await fetch(`/api/admin/students?action=bulk&ids=${allIds.join(',')}&adminKey=${adminKey}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData(adminKey);
        showToast('ลบนักเรียนทั้งหมดออกจากระบบแล้ว', 'success');
        setSelectedStudents([]);
      } else {
        const error = await res.json();
        showToast(error.error || 'ล้มเหลว', 'error');
      }
    } catch (err) {
      showToast('เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว', 'error');
    }
  };

  const handleBulkDeleteStudents = async () => {
    if (selectedStudents.length === 0) return;
    if (!confirm(`ต้องการลบนักเรียนจำนวน ${selectedStudents.length} คน ใช่หรือไม่?\nข้อมูลการส่งงานที่เกี่ยวข้องจะสูญหายทั้งหมด`)) return;

    try {
      const ids = selectedStudents.join(',');
      const res = await fetch(`/api/admin/students?action=bulk&ids=${ids}&adminKey=${adminKey}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        addToast(data.message || 'ลบนักเรียนสำเร็จ');
        setSelectedStudents([]);
        fetchData(adminKey);
      } else {
        const data = await res.json();
        addToast(data.error || 'ไม่สามารถลบนักเรียนได้', 'error');
      }
    } catch (err) {
      addToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (filteredStudents) => {
    if (selectedStudents.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.student.id));
    }
  };

  const handleEditLink = (assignment) => {
    setEditLinkId(assignment.id);
    setEditLinkUrl(assignment.worksheetUrl || '');
  };

  const handleSaveLink = async () => {
    try {
      const res = await fetch('/api/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editLinkId, worksheetUrl: editLinkUrl, adminKey }),
      });
      if (res.ok) {
        addToast('บันทึกลิงก์ใบงานสำเร็จ! 🔗');
        setEditLinkId(null);
        setEditLinkUrl('');
        fetchData(adminKey);
      } else {
        addToast('ไม่สามารถบันทึกได้', 'error');
      }
    } catch (err) {
      addToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleClearTargetLocation = async () => {
    if (!confirm('ต้องการยกเลิกการตั้งค่าพิกัดห้องเรียนใช่หรือไม่?\n(ระบบจะหยุดการคำนวณระยะทางชั่วคราว)')) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, subjectId: selectedSubject, targetLat: null, targetLng: null, targetRoomName: null })
      });
      if (res.ok) {
        setTargetLat(null);
        setTargetLng(null);
        setTargetRoomName('');
        addToast('ยกเลิกพิกัดห้องเรียนสำเร็จ');
      } else {
        addToast('ไม่สามารถยกเลิกพิกัดได้', 'error');
      }
    } catch (err) {
      addToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSetTargetLocation = () => {
    const roomName = window.prompt("ระบุชื่อห้องเรียน (เช่น ห้องคอมพิวเตอร์ 1):", targetRoomName || "");
    if (roomName === null) return;

    if (!navigator.geolocation) {
      addToast('เบราว์เซอร์ของคุณไม่รองรับ GPS', 'error');
      return;
    }
    setSavingSettings(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminKey, subjectId: selectedSubject, targetLat: lat, targetLng: lng, targetRoomName: roomName })
          });
          if (res.ok) {
            setTargetLat(lat);
            setTargetLng(lng);
            setTargetRoomName(roomName);
            addToast('บันทึกพิกัดห้องเรียนสำเร็จ');
          } else {
            addToast('ไม่สามารถบันทึกพิกัดได้', 'error');
          }
        } catch (err) {
          addToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
        } finally {
          setSavingSettings(false);
        }
      },
      (err) => {
        setSavingSettings(false);
        addToast('ไม่สามารถดึงพิกัด GPS ได้ (กรุณาอนุญาต Location)', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminKey');
    router.push('/');
  };

  // isStudentInSubject and useMemo hooks moved above early returns to fix React Error #310
  const activeSheetUrl = useMemo(() => {
    return filterSummaryRoom && googleSheetUrls[filterSummaryRoom] 
      ? googleSheetUrls[filterSummaryRoom] 
      : (!filterSummaryRoom && Object.keys(googleSheetUrls).length > 0) 
        ? (googleSheetUrls['default'] || Object.values(googleSheetUrls)[0] || '') 
        : '';
  }, [filterSummaryRoom, googleSheetUrls]);

  useEffect(() => {
    if (!activeSheetUrl) {
      setSheetData(null);
      return;
    }
    setSheetLoading(true);
    setSheetError('');
    fetch(`/api/sheet?url=${encodeURIComponent(activeSheetUrl)}`)
      .then(res => res.json())
      .then(resData => {
         if (resData.error) throw new Error(resData.error);
         setSheetData(resData.data);
      })
      .catch(err => {
         console.error('Sheet fetch error:', err);
         setSheetError(err.message);
      })
      .finally(() => setSheetLoading(false));
  }, [activeSheetUrl]);

  const { totalAssignments, syncSubmitPercentage } = useMemo(() => {
    let tAssignments = 0;
    let tSubmitted = 0;
    let tStudents = 0;

    if (sheetData && sheetData.length > 0) {
      const firstRow = sheetData[0];
      const assignmentCols = Object.keys(firstRow).filter(k => k && k.trim().startsWith('งาน'));
      tAssignments = assignmentCols.length;

      // Calculate based entirely on the Google Sheet data for accuracy
      sheetData.forEach(row => {
         // Check if this is a valid student row (has an ID-like field)
         const hasId = Object.values(row).some(val => val && String(val).trim().length >= 4 && !isNaN(parseInt(val)));
         if (hasId) {
            tStudents++;
            assignmentCols.forEach(col => {
               const val = row[col];
               if (val && String(val).trim() !== '0') {
                 tSubmitted++;
               }
            });
         }
      });
    }

    const expectedTotal = tStudents * tAssignments;
    const sPercentage = expectedTotal > 0 ? Math.round((tSubmitted / expectedTotal) * 100) : 0;

    return { 
      totalAssignments: tAssignments, 
      syncSubmitPercentage: sPercentage 
    };
  }, [sheetData]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="loading-text">กำลังโหลดข้อมูล...</p>
        {loadProgress > 0 && (
          <div style={{ width: '200px', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
            <div style={{ width: `${loadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #4facfe, #00f2fe)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
          </div>
        )}
      </div>
    );
  }

  if (!data) return null;



  return (
    <div className="page-container">
      {/* Loading overlay - blocks UI during data refresh */}
      {isRefreshing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '16px',
        }}>
          <div className="spinner" />
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>กำลังโหลดข้อมูล...</p>
          <div style={{ width: '240px', height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${loadProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4facfe, #00f2fe)',
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{loadProgress}%</span>
        </div>
      )}
      {qrCode && (
        <>
          {showQrCode ? (
            <div style={{
              position: 'fixed',
              top: '32px',
              right: '32px',
              background: 'var(--bg-card)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--border-light)',
              padding: '24px',
              borderRadius: '24px',
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              zIndex: 1000,
              animation: 'fadeIn 0.5s ease',
              maxWidth: '350px'
            }}>
              <button 
                onClick={() => setShowQrCode(false)}
                title="ซ่อน QR Code"
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)', transition: 'background 0.2s ease' }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.05)'}
              >
                ✕
              </button>
              <div style={{ background: 'white', padding: '12px', borderRadius: '16px', width: '100%', marginTop: '8px' }}>
                <img src={qrCode} alt="QR Code" style={{ width: '100%', height: 'auto', aspectRatio: '1/1', objectFit: 'contain', display: 'block' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>สแกนเพื่อเข้าสู่ระบบ</div>
                <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>สำหรับนักเรียน</div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowQrCode(true)}
              style={{
                position: 'fixed',
                top: '32px',
                right: '32px',
                background: 'var(--bg-card)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid var(--border-light)',
                padding: '12px 16px',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 1000,
                cursor: 'pointer',
                animation: 'fadeIn 0.3s ease',
                color: 'var(--text-primary)',
                fontWeight: '600'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>📱</span>
              แสดง QR Code
            </button>
          )}
        </>
      )}
      <div className="content-wrapper">
        {/* Toast */}
        <div className="toast-container">
          {toasts.map((t) => (
            <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
          ))}
        </div>

        {/* Header */}
        <div className="student-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="student-info" style={{ cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
            <div 
              className="student-avatar" 
              style={adminAvatarUrl ? { background: 'none', padding: 0 } : { background: 'linear-gradient(135deg, #fc5c7c, #fcbc5c)' }}
            >
              {adminAvatarUrl ? (
                <img src={adminAvatarUrl} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : '👨‍🏫'}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleAvatarChange} 
            />
            <div className="student-details">
              <h2>แดชบอร์ดครู</h2>
              <p>{subjectName || 'กำลังโหลด...'} {className || ''}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '1.2rem' }}>📚</span>
              <select 
                className="form-input" 
                style={{ minWidth: '200px', border: 'none', background: 'transparent', padding: '0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}
                value={selectedSubject}
                onChange={(e) => {
                  const newSubId = e.target.value;
                  setSelectedSubject(newSubId);
                  selectedSubjectRef.current = newSubId;
                  fetchData(adminKey, newSubId);
                }}
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.className ? `${s.name || ''} ${s.className ? `(${s.className})` : ''}` : '(วิชาที่ไม่มีชื่อ)'}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              🚪 ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalStudents}</div>
            <div className="stat-label">👩‍🎓 นักเรียนทั้งหมด</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalAssignments}</div>
            <div className="stat-label">📋 จำนวนงาน (ชิ้น)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: syncSubmitPercentage >= 80 ? '#34a853' : (syncSubmitPercentage >= 50 ? '#fbbc04' : '#ea4335') }}>
              {syncSubmitPercentage}%
            </div>
            <div className="stat-label">✅ อัตราการส่งงาน</div>
          </div>
        </div>

        {/* Nav */}
        <div className="admin-nav">
          <button
            className={`nav-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            📊 สรุปคะแนน (Google Sheet)
          </button>
          <button
            className={`nav-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            👩‍🎓 รายชื่อนักเรียน
          </button>
          <button
            className={`nav-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            📍 ประวัติเช็คชื่อรายวัน
          </button>
          <button
            className={`nav-btn ${activeTab === 'attendance_summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance_summary')}
          >
            📋 สรุปเวลาเรียน (ขาด/ลา/มา)
          </button>
          <button
            className={`nav-btn ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            📅 ตารางรายสัปดาห์
          </button>
          <button
            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ ตั้งค่า
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'summary' && (
          <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="card-header" style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>📊 ตารางสรุปการส่งงาน</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  className="form-input"
                  style={{ padding: '6px 12px', width: 'auto', minWidth: '180px', fontSize: '0.95rem', fontWeight: 600 }}
                  value={filterSummaryRoom}
                  onChange={(e) => setFilterSummaryRoom(e.target.value)}
                >
                  <option value="">🏫 ทุกห้องเรียน ({summaryData.length} คน)</option>
                  {(() => {
                    const summaryRooms = [...new Set(summaryData.map(s => s.student.room || '').filter(Boolean))].sort();
                    return summaryRooms.map(r => (
                      <option key={r} value={r}>
                        {r} ({summaryData.filter(s => s.student.room === r).length} คน)
                      </option>
                    ));
                  })()}
                </select>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleExportExcel}
                  style={{ width: 'auto', padding: '6px 16px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                >
                  📥 ส่งออก Excel
                </button>
              </div>
            </div>

            {(() => {
              const activeSheetUrl = filterSummaryRoom && googleSheetUrls[filterSummaryRoom] 
                ? googleSheetUrls[filterSummaryRoom] 
                : (!filterSummaryRoom && Object.keys(googleSheetUrls).length > 0) 
                  ? (googleSheetUrls['default'] || Object.values(googleSheetUrls)[0] || '') 
                  : '';

              if (activeSheetUrl) {
                return (
                  <div className="google-sheet-wrapper" style={{ width: '100%', height: '800px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', marginTop: '16px' }}>
                    <iframe 
                      key={activeSheetUrl}
                      src={activeSheetUrl}
                      width="100%" 
                      height="100%" 
                      style={{ border: 'none' }}
                      title="Google Sheet Summary"
                    />
                  </div>
                );
              }

              return (
                <div className="empty-state">
                  <div className="icon">📊</div>
                  <p>โปรดตั้งค่าลิงก์ Google Sheet ในเมนู "ตั้งค่าระบบ"</p>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>📋 จัดการงาน</h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddModal(true)}
                style={{ width: 'auto' }}
              >
                ➕ เพิ่มงานใหม่
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📭</div>
                <p>ยังไม่มีงาน — คลิก &quot;เพิ่มงานใหม่&quot; เพื่อเริ่มต้น</p>
              </div>
            ) : (
              <div className="assignment-list">
                {assignments.map((assignment) => {
                  const submittedCount = summaryData.filter(
                    (s) => s.submissions[assignment.id]?.submitted
                  ).length;

                  return (
                    <div key={assignment.id} className="assignment-card submitted">
                      <div className="assignment-top">
                        <div className="assignment-info">
                          <h3>{assignment.title}</h3>
                          <p>{assignment.description}</p>
                        </div>
                        <div className="status-badge success">
                          {submittedCount}/{totalStudents} คน
                        </div>
                      </div>

                      <div className="assignment-meta" style={{ marginBottom: '12px' }}>
                        {assignment.deadline && <span>📅 กำหนดส่ง: {assignment.deadline}</span>}
                        <span>⭐ คะแนนเต็ม: {assignment.maxScore}</span>
                        {assignment.worksheetUrl && (
                          <span>🔗 <a href={assignment.worksheetUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>ดูใบงาน</a></span>
                        )}
                      </div>

                      <div className="assignment-actions">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditAssignment(assignment)}
                          >
                            ✏️ แก้ไข
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                          >
                            🗑️ ลบงาน
                          </button>
                        </div>

                      {/* Mini progress */}
                      <div className="progress-bar-wrapper" style={{ marginTop: '12px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (() => {
                    // unique rooms for filter
          const rooms = [...new Set(summaryData.map(s => s.student.room || '').filter(Boolean))].sort();
          // filtered students
          const filteredStudents = filterRoom ? summaryData.filter(s => s.student.room === filterRoom) : summaryData;
          
          return (
            <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="card-header" style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>👩‍🎓 รายชื่อนักเรียน ({filteredStudents.length} คน)</h2>
                  <select 
                    className="form-input" 
                    style={{ padding: '4px 8px', width: 'auto', minWidth: '120px' }}
                    value={filterRoom}
                    onChange={(e) => {
                      setFilterRoom(e.target.value);
                      setSelectedStudents([]); // reset selection when filter changes
                    }}
                  >
                    <option value="">ทุกห้องเรียน</option>
                    {rooms.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {summaryData && summaryData.length > 0 && (
                    <button className="btn btn-danger btn-sm" onClick={handleDeleteAllStudents} style={{ width: 'auto', background: 'var(--error)' }}>
                      🚨 ลบทั้งหมด
                    </button>
                  )}
                  {selectedStudents.length > 0 && (
                    <button className="btn btn-danger btn-sm" onClick={handleBulkDeleteStudents} style={{ width: 'auto' }}>
                      🗑️ ลบที่เลือก ({selectedStudents.length})
                    </button>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowBulkStudentModal(true)} style={{ width: 'auto' }}>
                    📋 วางรายชื่อทีละเยอะๆ
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddStudentModal(true)} style={{ width: 'auto' }}>
                    ➕ เพิ่มคนเดียว
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                          onChange={() => toggleSelectAll(filteredStudents)}
                        />
                      </th>
                      <th>ลำดับ</th>
                      <th>รูป</th>
                      <th>รหัส</th>
                      <th>ชื่อ-สกุล</th>
                      <th>ชื่อเล่น</th>
                      <th>ห้องเรียน</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((row, index) => {
                      const isSelected = selectedStudents.includes(row.student.id);
                      return (
                        <tr key={row.student.id} style={{ backgroundColor: isSelected ? 'var(--bg-secondary)' : 'transparent' }}>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleSelectStudent(row.student.id)}
                            />
                          </td>
                          <td style={{ fontFamily: 'var(--font-en)' }}>{index + 1}</td>
                          <td>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', overflow: 'hidden' }}>
                              {row.student.avatarUrl ? (
                                <img src={row.student.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                row.student.nickname?.charAt(0) || row.student.name?.charAt(0) || '?'
                              )}
                            </div>
                          </td>
                          <td style={{ fontFamily: 'var(--font-en)', fontWeight: 600 }}>{row.student.id}</td>
                          <td>{row.student.name}</td>
                          <td>{row.student.nickname || '-'}</td>
                          <td>{row.student.room || '-'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => setEditStudent(row.student)} style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}>
                                ✏️ แก้ไข
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStudent(row.student.id, row.student.name)} style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}>
                                🗑️ ลบ
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {activeTab === 'attendance' && (() => {
          const rooms = data?.students ? [...new Set(data.students.map(s => s.room || '').filter(Boolean))].sort() : [];
          
          let filteredAttendances = [...attendances];
          
          // Date Filter
          if (filterAttDate === 'today') {
            const todayStr = new Date().toLocaleDateString('th-TH');
            filteredAttendances = filteredAttendances.filter(att => new Date(att.timestamp).toLocaleDateString('th-TH') === todayStr);
          }
          
          // Room Filter
          if (filterAttRoom) {
            filteredAttendances = filteredAttendances.filter(att => {
              const student = data?.students?.find(s => s.id === att.studentId);
              return student && student.room === filterAttRoom;
            });
          }

          return (
            <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>📍 ประวัติเช็คชื่อ</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                {targetLat && targetLng && (
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={handleClearTargetLocation}
                    disabled={savingSettings}
                  >
                    ❌ ล้างพิกัด
                  </button>
                )}
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={handleSetTargetLocation}
                  disabled={savingSettings}
                >
                  {savingSettings ? 'กำลังประมวลผล...' : '📍 ดึงพิกัดปัจจุบันเป็นห้องเรียน'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <select
                  className="form-input"
                  style={{ width: 'auto', minWidth: '180px', padding: '8px 16px', borderRadius: '20px', background: 'rgba(108, 92, 231, 0.05)', border: 'none', fontWeight: 500 }}
                value={filterAttDate}
                onChange={(e) => setFilterAttDate(e.target.value)}
              >
                <option value="today">📅 เฉพาะวันนี้</option>
                <option value="all">📅 ดูทั้งหมดทุกวัน</option>
              </select>
              <select 
                className="form-input" 
                style={{ width: 'auto', minWidth: '150px', padding: '8px 12px' }}
                value={filterAttRoom}
                onChange={(e) => setFilterAttRoom(e.target.value)}
              >
                <option value="">🏫 ดูทุกห้องเรียน</option>
                {rooms.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>
            
            {targetLat && targetLng && (
              <div style={{ background: '#e6f4ea', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', color: '#137333', border: '1px solid #ceead6' }}>
                ✅ ตั้งพิกัดห้องเรียนแล้ว {targetRoomName ? `(ห้อง: ${targetRoomName}) ` : ''}(ระยะที่อนุญาต: ไม่เกิน 8 เมตร)
              </div>
            )}
            
            {!targetLat && (
              <div style={{ background: '#fef7e0', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', color: '#b06000', border: '1px solid #feefc3' }}>
                ⚠️ คุณครูยังไม่ได้ตั้งพิกัดห้องเรียน กรุณากดปุ่ม <b>"ดึงพิกัดปัจจุบันเป็นห้องเรียน"</b> เพื่อให้ระบบตรวจสอบระยะทางอัตโนมัติ
              </div>
            )}
            
            {filteredAttendances.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📭</div>
                <p>ไม่พบประวัติการเช็คชื่อตามที่กรอง</p>
              </div>
            ) : (
              <div className="table-responsive">
                  <table className="modern-table">
                  <thead>
                    <tr>
                      <th>วัน/เวลา</th>
                      <th>ห้องเรียน</th>
                      <th>รหัสนักเรียน</th>
                      <th>ชื่อนักเรียน</th>
                      <th>พิกัด (GPS)</th>
                      <th>รูปถ่าย</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendances.map((att) => {
                      const studentInfo = data?.students?.find(s => s.id === att.studentId);
                      return (
                        <tr key={att.id}>
                          <td>{new Date(att.timestamp).toLocaleString('th-TH')}</td>
                          <td>{studentInfo ? studentInfo.room || '-' : '-'}</td>
                          <td>{att.studentId}</td>
                          <td>{studentInfo ? studentInfo.name : 'ไม่ทราบชื่อ'}</td>
                          <td>
                            {att.type === 'leave' ? (
                              <span style={{ color: '#b08d00', fontWeight: 600, fontSize: '0.9rem', background: '#fff9c4', padding: '4px 8px', borderRadius: '12px', display: 'inline-block' }}>
                                🟡 ลา: {att.reason}
                              </span>
                            ) : att.distance !== undefined && att.distance !== null ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ 
                                  color: att.isOk ? '#137333' : '#d93025', 
                                  fontWeight: 600, 
                                  fontSize: '0.9rem',
                                  background: att.isOk ? '#e6f4ea' : '#fce8e6',
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  display: 'inline-block',
                                  textAlign: 'center'
                                }}>
                                  {att.isOk ? `🟢 ตรงจุด (${att.distance} ม.)` : `🔴 ผิดจุด! ห่าง ${att.distance} ม.`}
                                </span>
                                <a href={`https://maps.google.com/?q=${att.lat},${att.lng}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" style={{ padding: '2px 4px', fontSize: '11px', display: 'inline-block', textAlign: 'center' }}>
                                  🗺️ ดูแผนที่
                                </a>
                              </div>
                            ) : (
                              <a href={`https://maps.google.com/?q=${att.lat},${att.lng}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-block' }}>
                                🗺️ ดูแผนที่ (ไม่มีระบบคำนวณ)
                              </a>
                            )}
                          </td>
                          <td>
                            {att.type === 'leave' ? (
                              <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.85rem' }}>ไม่มีรูป (ลา)</span>
                            ) : (
                              <a href={att.photo} target="_blank" rel="noopener noreferrer">
                                <img src={att.photo} alt="รูปถ่าย" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />
                              </a>
                            )}
                          </td>
                          <td>
                            <button 
                              className="btn btn-danger btn-sm" 
                              onClick={() => handleDeleteAttendance(att.id, studentInfo ? studentInfo.name : att.studentId)}
                              style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-block' }}
                              title="ลบเพื่อให้นักเรียนเช็คชื่อใหม่"
                            >
                              🗑️ ลบ/ทำใหม่
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
        })()}

        {activeTab === 'attendance_summary' && (() => {
          const rooms = data?.students ? [...new Set(data.students.map(s => s.room || '').filter(Boolean))].sort() : [];
          const students = data?.students || [];
          const allAttendances = data?.attendances || [];
          const roomSchedules = classSchedules || [];
          const hols = holidays || [];
          
          const studentsForRoom = students.filter(s => {
             if (!filterSummaryRoom) return true;
             const sRoom = (s.room || '').replace(/^ม\.?\s*/, '').trim();
             const targetRoom = filterSummaryRoom.replace(/^ม\.?\s*/, '').trim();
             return sRoom === targetRoom;
          });

          let earliestDate = new Date();
          if (allAttendances.length > 0) {
             const dates = allAttendances.map(a => new Date(a.timestamp).getTime());
             earliestDate = new Date(Math.min(...dates));
          } else {
             earliestDate.setDate(earliestDate.getDate() - 30);
          }
          
          const startOfTerm = earliestDate;
          startOfTerm.setHours(0,0,0,0);
          
          const today = new Date();
          today.setHours(23,59,59,999);

          return (
            <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="card-header" style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>📋 สรุปเวลาเรียน (ขาด/ลา/มา)</h2>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
                <select
                  className="form-input"
                  style={{ padding: '6px 12px', width: 'auto', minWidth: '180px', fontSize: '0.95rem', fontWeight: 600 }}
                  value={filterSummaryRoom}
                  onChange={e => setFilterSummaryRoom(e.target.value)}
                >
                  <option value="">🏫 ทุกห้องเรียน</option>
                  {rooms.map(room => (
                    <option key={room} value={room}>ห้อง {room}</option>
                  ))}
                </select>
                
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                     const html = document.getElementById('attendance-summary-table').outerHTML;
                     const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel' });
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url;
                     a.download = `สรุปเวลาเรียน_${filterSummaryRoom || 'ทั้งหมด'}.xls`;
                     a.click();
                  }}
                  style={{ width: 'auto', padding: '6px 16px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                >
                  📥 ส่งออก Excel
                </button>
              </div>

              <div className="table-responsive">
                <table id="attendance-summary-table" className="table" style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', border: '1px solid #ddd', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>เลขที่</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>รหัส</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left' }}>ชื่อ-สกุล</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>วันที่มีเรียนทั้งหมด</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', color: '#34a853' }}>มา (วัน)</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', color: '#fbbc05' }}>ลา (วัน)</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', color: '#ea4335' }}>ขาด (วัน)</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>สรุปคะแนนขาด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsForRoom.map(student => {
                        const roomScheds = getNormalizedSchedules(roomSchedules).filter(s => {
                          const cleanedRoom = (student.room || '').replace(/^ม\.?\s*/, '').trim();
                          return s.room === cleanedRoom || s.room === student.room;
                        });
                        const classDays = roomScheds.map(s => s.day);
                        
                        let khadCount = 0;
                        let laCount = 0;
                        let totalClassDays = 0;
                        
                        for (let d = new Date(startOfTerm); d <= today; d.setDate(d.getDate() + 1)) {
                           const jsDay = d.getDay() === 0 ? 7 : d.getDay();
                           const dateStrIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                           if (classDays.length > 0 && (!classDays.includes(jsDay) || hols.includes(dateStrIso))) continue;
                           totalClassDays++;
                           const dateStr = d.toLocaleDateString('th-TH');
                           const att = allAttendances.find(a => a.studentId === student.id && new Date(a.timestamp).toLocaleDateString('th-TH') === dateStr);
                           if (att) {
                              if (att.type === 'leave') laCount++;
                           } else {
                              khadCount++;
                           }
                        }
                        
                        const totalKhad = khadCount + (laCount * 0.5);
                        const totalMa = totalClassDays - totalKhad;
                        
                        return (
                          <tr key={student.id}>
                            <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>{student.number || '-'}</td>
                            <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>{student.studentId || student.id}</td>
                            <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left', whiteSpace: 'nowrap' }}>{student.name || '-'}</td>
                            <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>{totalClassDays}</td>
                            <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', color: '#34a853', fontWeight: 600 }}>{totalMa}</td>
                            <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', color: '#fbbc05', fontWeight: 600 }}>{laCount}</td>
                            <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', color: '#ea4335', fontWeight: 600 }}>{khadCount}</td>
                            <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>{totalKhad}</td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {activeTab === 'calendar' && (() => {
          const rooms = data?.students ? [...new Set(data.students.map(s => s.room || '').filter(Boolean))].sort() : [];
          const students = data?.students || [];
          const filteredStudents = calendarRoom ? students.filter(s => s.room === calendarRoom) : students;

          // Calculate week dates
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (calendarWeekOffset * 7)); // Monday
          const weekDays = [];
          const dayNames = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.'];
          const dayIndices = [1, 2, 3, 4, 5]; // Mon=1, Tue=2, ...Fri=5
          for (let i = 0; i < 5; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            weekDays.push(d);
          }

          const weekLabel = `${weekDays[0].toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - ${weekDays[4].toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`;

          // Build attendance lookup
          const attMap = {};
          attendances.forEach(att => {
            const dateStr = new Date(att.timestamp).toLocaleDateString('th-TH');
            if (!attMap[att.studentId]) attMap[att.studentId] = {};
            attMap[att.studentId][dateStr] = att;
          });

          const todayStr = now.toLocaleDateString('th-TH');

          // Helper: get room key from student.room (e.g., "ม.3/1" -> "3/1", or "3/1" -> "3/1")
          const getRoomKey = (room) => {
            if (!room) return '';
            return room.replace(/^ม\.?\s*/, '').trim();
          };

          const pendingLeaves = attendances.filter(a => a.type === 'leave' && a.status === 'pending');
          const pendingLeavesWithStudent = pendingLeaves.map(a => ({
             ...a,
             student: (data?.students || []).find(s => s.id === a.studentId)
          })).filter(a => a.student);

          return (
            <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingLeavesWithStudent.length > 0 && (
                <div className="card" style={{ borderLeft: '4px solid #f39c12', background: '#fffef0' }}>
                  <div className="card-header" style={{ marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#d68200' }}>🔔 คำร้องขอลาเรียนรออนุมัติ ({pendingLeavesWithStudent.length})</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {pendingLeavesWithStudent.map(req => {
                      const reqDate = new Date(req.timestamp).toLocaleDateString('th-TH');
                      return (
                        <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #f0e6cc' }}>
                          <div>
                            <strong>{req.student.name} ({req.student.nickname})</strong>
                            <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '4px' }}>
                              ขอลาวันที่: {reqDate} <br/>
                              เหตุผล: {req.reason}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={async () => {
                                await fetch('/api/attendance', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ adminKey, id: req.id, updates: { status: 'approved' } })
                                });
                                fetchData(adminKey);
                                addToast('อนุมัติการลาแล้ว');
                              }}
                            >อนุมัติ</button>
                            <button 
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#d93025', borderColor: '#d93025' }}
                              onClick={async () => {
                                if (!confirm(`ต้องการปฏิเสธคำร้องขอลาของ ${req.student.name} ใช่หรือไม่?`)) return;
                                try {
                                  const res = await fetch(`/api/attendance?id=${req.id}&adminKey=${adminKey}`, { method: 'DELETE' });
                                  if (res.ok) {
                                    addToast('ปฏิเสธการลาเรียบร้อยแล้ว');
                                    fetchData(adminKey);
                                  } else {
                                    addToast('ไม่สามารถปฏิเสธการลาได้', 'error');
                                  }
                                } catch (err) {
                                  addToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
                                }
                              }}
                            >ปฏิเสธ</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            
              <div className="card">
                <div className="card-header" style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{'\ud83d\udcc5'} ตารางเช็คชื่อรายสัปดาห์</h2>
                </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-card)', padding: '12px 20px', borderRadius: '50px', boxShadow: 'var(--shadow-card)', border: '1px solid rgba(108, 92, 231, 0.1)' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setCalendarWeekOffset(o => o - 1)} style={{ padding: '8px 16px', borderRadius: '20px' }}>{'◀'} สัปดาห์ก่อน</button>
                  <span style={{ fontWeight: 600, fontSize: '1.05rem', minWidth: '220px', textAlign: 'center', color: 'var(--text-primary)' }}>{weekLabel}</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => setCalendarWeekOffset(o => o + 1)} style={{ padding: '8px 16px', borderRadius: '20px' }}>สัปดาห์ถัดไป {'▶'}</button>
                {calendarWeekOffset !== 0 && (
                  <button className="btn btn-primary btn-sm" onClick={() => setCalendarWeekOffset(0)} style={{ padding: '8px 12px' }}>{'\ud83d\udccd'} สัปดาห์นี้</button>
                )}
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ background: '#f8cecc', color: '#a23733', borderColor: '#b85450' }}
                  onClick={() => {
                     const now = new Date();
                     const startOfWeekNow = new Date(now);
                     startOfWeekNow.setDate(now.getDate() - now.getDay() + 1);
                     startOfWeekNow.setHours(0, 0, 0, 0);
                     const startOfSemester = new Date('2026-05-18T00:00:00+07:00');
                     const diff = startOfSemester.getTime() - startOfWeekNow.getTime();
                     const diffWeeks = Math.round(diff / (7 * 24 * 60 * 60 * 1000));
                     setCalendarWeekOffset(diffWeeks);
                  }}
                >
                  📅 เริ่มเทอม (18 พ.ค. 69)
                </button>
                <select
                  className="form-input"
                  style={{ width: 'auto', minWidth: '150px', padding: '8px 12px' }}
                  value={calendarRoom}
                  onChange={(e) => setCalendarRoom(e.target.value)}
                >
                  <option value="">{'\ud83c\udfeb'} ดูทุกห้องเรียน</option>
                  {rooms.map(room => {
                    const roomKey = getRoomKey(room);
                    const roomScheds = getNormalizedSchedules(classSchedules).filter(s => s.room === roomKey || s.room === room);
                    const label = roomScheds.map(s => s.label).join(', ');
                    return <option key={room} value={room}>{room} {label ? `(${label})` : ''}</option>;
                  })}
                </select>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">{'\ud83d\udced'}</div>
                  <p>ไม่พบนักเรียนตามที่กรอง</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th style={{ position: 'sticky', left: 0, background: 'var(--bg-primary)', zIndex: 2, minWidth: '40px' }}>#</th>
                        <th style={{ position: 'sticky', left: '40px', background: 'var(--bg-primary)', zIndex: 2, minWidth: '120px' }}>ชื่อนักเรียน</th>
                        <th style={{ position: 'sticky', left: '160px', background: 'var(--bg-primary)', zIndex: 2, minWidth: '60px' }}>ห้อง</th>
                        {weekDays.map((d, i) => {
                          const isToday = d.toLocaleDateString('th-TH') === todayStr;
                          return (
                            <th key={i} style={{ textAlign: 'center', minWidth: '70px' }} className={isToday ? 'today-col' : ''}>
                              <div className={isToday ? 'today-header' : ''}>
                                <div>{dayNames[i]}</div>
                                <div style={{ fontSize: '0.75rem', color: isToday ? 'white' : 'var(--text-secondary)' }}>{d.getDate()}/{d.getMonth()+1}</div>
                              </div>
                            </th>
                          );
                        })}
                        <th style={{ textAlign: 'center', minWidth: '50px' }}>สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, idx) => {
                        const roomScheds = getNormalizedSchedules(classSchedules).filter(s => {
                          const cleanedRoom = (student.room || '').replace(/^ม\.?\s*/, '').trim();
                          return s.room === cleanedRoom || s.room === student.room;
                        });
                        const classDays = roomScheds.map(s => s.day);
                        let presentCount = 0;
                        let scheduledCount = 0;
                        let weekStatus = '-';

                        return (
                          <tr key={student.id}>
                            <td style={{ position: 'sticky', left: 0, background: 'var(--bg-primary)', zIndex: 1, fontFamily: 'var(--font-en)' }}>{idx + 1}</td>
                            <td style={{ position: 'sticky', left: '40px', background: 'var(--bg-primary)', zIndex: 1, whiteSpace: 'nowrap' }}>{student.nickname || student.name}</td>
                            <td style={{ position: 'sticky', left: '160px', background: 'var(--bg-primary)', zIndex: 1, fontSize: '0.8rem' }}>{student.room || '-'}</td>
                            {weekDays.map((d, i) => {
                              const dateStr = d.toLocaleDateString('th-TH');
                              const isFuture = d > now;
                              const isToday = dateStr === todayStr;
                              const jsDay = dayIndices[i]; // 1=Mon...5=Fri
                              const isClassDay = classDays.length > 0 ? classDays.includes(jsDay) : true;
                              const att = attMap[student.id] && attMap[student.id][dateStr];

                              let cellContent = '';
                              let cellStyle = { textAlign: 'center', fontSize: '1.2rem' };

                              if (isClassDay) {
                                if (att) {
                                  presentCount++;
                                  if (att.type === 'leave') {
                                    if (att.status === 'pending') {
                                      cellContent = '⏳';
                                      cellStyle.background = '#fdf3d8';
                                      weekStatus = '⏳ ลา (รออนุมัติ)';
                                    } else {
                                      cellContent = '🟡';
                                      cellStyle.background = '#fff9c4';
                                      weekStatus = '🟡 ลา';
                                    }
                                  } else if (att.isOk === false) {
                                    cellContent = '⚠️';
                                    cellStyle.background = '#fff3e0';
                                    weekStatus = '✅ มา (ผิดจุด)';
                                  } else {
                                    cellContent = '✅';
                                    cellStyle.background = '#e6f4ea';
                                    weekStatus = '✅ มา';
                                  }
                                } else {
                                  if (!isClassDay) {
                                    cellContent = '\u2014';
                                    cellStyle.color = '#ddd';
                                    cellStyle.background = '#fafafa';
                                  } else if (isFuture || isToday) {
                                    scheduledCount++;
                                    cellContent = <span className="empty-cell" />;
                                    cellStyle.color = '#bbb';
                                    weekStatus = '⏳ รอเช็คชื่อ';
                                  } else {
                                    scheduledCount++;
                                    cellContent = '❌';
                                    cellStyle.background = '#fce8e6';
                                    weekStatus = '❌ ขาด';
                                  }
                                }
                              } else {
                                cellContent = '\u2014';
                                cellStyle.color = '#ddd';
                                cellStyle.background = '#fafafa';
                              }

                              if (isToday && isClassDay) {
                                cellStyle.borderLeft = '2px solid #1a73e8';
                                cellStyle.borderRight = '2px solid #1a73e8';
                              }
                              
                              if (isClassDay && !isFuture) {
                                cellStyle.cursor = 'pointer';
                                cellStyle.transition = 'background 0.2s';
                                // Simple hover effect via inline style isn't possible, but we keep the cursor
                              }

                              let tooltip = '';
                              if (att && att.type === 'leave') {
                                tooltip = att.status === 'pending' ? `รออนุมัติลา: ${att.reason}` : `ลา: ${att.reason}`;
                              }
                              else if (att && att.isOk === false) tooltip = `ผิดจุด! ห่าง ${att.distance} ม.`;
                              else if (!isClassDay) tooltip = 'ไม่มีคาบเรียน';
                              
                              return (
                                <td 
                                  key={i} 
                                  style={{ ...cellStyle, userSelect: 'none' }} 
                                  title={tooltip}
                                  onMouseDown={() => {
                                    if (isClassDay && !isFuture) {
                                      const isoDateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T08:00:00+07:00`;
                                      if (brushMode) {
                                        setIsDragging(true);
                                        applyBrush(student, dateStr, isoDateStr, att, brushMode);
                                      } else {
                                        MySwal.fire({
                                          title: `แก้ไขเช็คชื่อ: ${student.nickname || student.name || student.id}`,
                                          text: `วันที่: ${dateStr}`,
                                          showDenyButton: true,
                                          showCancelButton: true,
                                          confirmButtonText: '✅ มาเรียน',
                                          denyButtonText: '🟡 ลา',
                                          cancelButtonText: '❌ ลบข้อมูล (ขาด)',
                                          confirmButtonColor: '#34a853',
                                          denyButtonColor: '#fbbc04',
                                          cancelButtonColor: '#ea4335',
                                        }).then((result) => {
                                          if (result.isConfirmed) applyBrush(student, dateStr, isoDateStr, att, 'present');
                                          else if (result.isDenied) applyBrush(student, dateStr, isoDateStr, att, 'leave');
                                          else if (result.dismiss === Swal.DismissReason.cancel) applyBrush(student, dateStr, isoDateStr, att, 'delete');
                                        });
                                      }
                                    }
                                  }}
                                  onMouseEnter={() => {
                                    if (isDragging && brushMode && isClassDay && !isFuture) {
                                      const isoDateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T08:00:00+07:00`;
                                      applyBrush(student, dateStr, isoDateStr, att, brushMode);
                                    }
                                  }}
                                >
                                  {cellContent}
                                </td>
                              );
                            })}
                            <td style={{ textAlign: 'center', fontWeight: 600, fontFamily: 'var(--font-en)' }}>
                              <span style={{ 
                                color: classDays.length > 0 ? (
                                  weekStatus.includes('✅') ? '#137333' : 
                                  weekStatus.includes('❌') ? '#d93025' : 
                                  weekStatus.includes('🟡') ? '#d68200' :
                                  weekStatus.includes('⏳') ? '#f39c12' : '#999'
                                ) : '#999'
                              }}>
                                {classDays.length > 0 ? weekStatus : '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                <span>{'\u2705'} = มาเรียน</span>
                <span>🟡 = ลา (อนุมัติ)</span>
                <span>⏳ = ลา (รออนุมัติ) / ยังไม่ถึงวัน</span>
                <span>{'\u274c'} = ขาดเรียน</span>
                <span>{'\u26a0\ufe0f'} = มาแต่ผิดจุด (นอกรัศมี 8 ม.)</span>
                <span>{'\u2014'} = ไม่มีคาบเรียนวันนี้</span>
              </div>

              {/* Cute Schedule reference */}
              <div style={{ marginTop: '24px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>{'\ud83c\udfeb'} ตารางสอน</h3>
                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '10px 8px', border: '1px solid #ddd', minWidth: '80px' }}>วัน / เวลา</th>
                        {['08.30-09.20', '09.20-10.10', '10.10-11.00', '11.00-11.50', '11.50-12.40', '12.40-13.30', '13.30-14.20', '14.20-15.10'].map(t => (
                          <th key={t} style={{ padding: '10px 8px', border: '1px solid #ddd', minWidth: '80px', fontWeight: 500, color: '#555' }}>{t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: 1, name: 'จันทร์', color: '#fff2cc', border: '#d6b656', text: '#b48c17' },
                        { id: 2, name: 'อังคาร', color: '#f8cecc', border: '#b85450', text: '#a23733' },
                        { id: 3, name: 'พุธ', color: '#d5e8d4', border: '#82b366', text: '#5b8e3e' },
                        { id: 4, name: 'พฤหัสบดี', color: '#ffe6cc', border: '#d79b00', text: '#b38100' },
                        { id: 5, name: 'ศุกร์', color: '#dae8fc', border: '#6c8ebf', text: '#4a70a8' },
                      ].map(day => (
                        <tr key={day.id}>
                          <td style={{ padding: '8px', border: '1px solid #ddd', background: day.color, fontWeight: 600, borderLeft: `4px solid ${day.border}`, color: day.text }}>
                            {day.name}
                          </td>
                          {['08:30', '09:20', '10:10', '11:00', '11:50', '12:40', '13:30', '14:20'].map(startTime => {
                            const sched = getNormalizedSchedules(classSchedules).find(s => s.day === day.id && s.start === startTime);
                            let roomFound = sched ? sched.room : null;
                            
                            return (
                              <td key={startTime} style={{ padding: '8px', border: '1px solid #ddd', background: roomFound ? day.color : '#fff' }}>
                                {roomFound ? (
                                  <div style={{ background: '#fff', padding: '4px 10px', borderRadius: '16px', fontWeight: 600, border: `1.5px solid ${day.border}`, color: day.text, display: 'inline-block', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                    ม.{roomFound}
                                  </div>
                                ) : (
                                  <span style={{ color: '#f0f0f0' }}>-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        

        {activeTab === 'settings' && (
          <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>⚙️ ตั้งค่าระบบ</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  style={{ background: '#f8d7da', color: '#721c24', borderColor: '#f5c6cb' }}
                  onClick={() => {
                    if (subjects.length <= 1) {
                      alert('ไม่สามารถลบวิชาเดียวที่มีอยู่ได้');
                      return;
                    }
                    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบวิชา "${subjectName}"? (ข้อมูลทั้งหมดจะถูกลบ)`)) {
                      fetch(`/api/subjects?id=${selectedSubject}&adminKey=${adminKey}`, { method: 'DELETE' })
                      .then(res => res.json())
                      .then(data => {
                        if (data.success) {
                          addToast('ลบวิชาเรียบร้อยแล้ว', 'success');
                          setSelectedSubject('');
                          selectedSubjectRef.current = '';
                          fetchData(adminKey, '');
                        } else {
                          addToast(data.error || 'ลบไม่สำเร็จ', 'error');
                        }
                      });
                    }
                  }}
                >
                  🗑️ ลบวิชานี้
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const name = prompt('กรุณากรอกชื่อวิชาใหม่ (เช่น คณิตศาสตร์)');
                    if (!name || !name.trim()) return;
                    const cName = prompt('กรุณากรอกชื่อชั้นเรียน (เช่น ม.4/1)');
                    if (!cName || !cName.trim()) return;
                    
                    // call API to create subject
                    fetch('/api/subjects', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ adminKey, subject: { name: name.trim(), className: cName.trim() } })
                    })
                    .then(res => res.json())
                    .then(data => {
                      if (data.id) {
                        addToast('เพิ่มวิชาเรียบร้อยแล้ว');
                        setSelectedSubject(data.id);
                        selectedSubjectRef.current = data.id;
                        fetchData(adminKey, data.id);
                      } else {
                        addToast(data.error || 'ไม่สามารถเพิ่มวิชาได้', 'error');
                      }
                    });
                  }}
                >
                  ➕ เพิ่มรายวิชาใหม่
                </button>
              </div>
            </div>
            <div className="card" style={{ maxWidth: '600px' }}>
              <div className="form-group">
                <label>ชื่อวิชา</label>
                <input
                  type="text"
                  className="form-input"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="เช่น วิทยาศาสตร์และเทคโนโลยี"
                />
              </div>
              <div className="form-group">
                <label>ชื่อชั้นเรียน/ห้อง</label>
                <input
                  type="text"
                  className="form-input"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="เช่น ม.1/2569"
                />
              </div>
              <div className="form-group">
                <label>รูป QR Code (สำหรับให้นักเรียนสแกน)</label>
                {qrCode && (
                  <img src={qrCode} alt="QR Code" style={{ width: '150px', height: '150px', objectFit: 'contain', marginBottom: '12px', display: 'block', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'white' }} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => setQrCode(e.target.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ padding: '8px' }}
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>* แนะนำให้ใช้รูปที่มีขนาดไม่ใหญ่เกินไป (ไม่เกิน 1MB)</p>
              </div>

              <div className="form-group" style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>📅 ตารางเรียนของแต่ละห้อง (ใช้สำหรับการเช็คชื่อ)</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {getNormalizedSchedules(classSchedules).map((sched) => (
                    <div key={sched.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      <div>
                        <span style={{ fontWeight: 600, marginRight: '12px' }}>ห้อง {sched.room}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{sched.label}</span>
                      </div>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        style={{ color: 'var(--error)', padding: '4px 8px' }}
                        onClick={() => {
                          const newSched = getNormalizedSchedules(classSchedules).filter(s => s.id !== sched.id);
                          setClassSchedules(newSched);
                        }}
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                  {Object.keys(classSchedules || {}).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      ยังไม่ได้เพิ่มตารางเรียน
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ flex: '1', minWidth: '100px' }}>
                    <label style={{ fontSize: '0.85rem' }}>ห้อง (เช่น 4/5)</label>
                    <input type="text" id="new-sched-room" className="form-input" style={{ padding: '8px' }} placeholder="4/5" />
                  </div>
                  <div style={{ flex: '1', minWidth: '120px' }}>
                    <label style={{ fontSize: '0.85rem' }}>วัน</label>
                    <select id="new-sched-day" className="form-input" style={{ padding: '8px' }}>
                      <option value="1">จันทร์</option>
                      <option value="2">อังคาร</option>
                      <option value="3">พุธ</option>
                      <option value="4">พฤหัสบดี</option>
                      <option value="5">ศุกร์</option>
                    </select>
                  </div>
                  <div style={{ flex: '1', minWidth: '100px' }}>
                    <label style={{ fontSize: '0.85rem' }}>เริ่ม (เช่น 13:30)</label>
                    <input type="time" id="new-sched-start" className="form-input" style={{ padding: '8px' }} />
                  </div>
                  <div style={{ flex: '1', minWidth: '100px' }}>
                    <label style={{ fontSize: '0.85rem' }}>สิ้นสุด (เช่น 15:10)</label>
                    <input type="time" id="new-sched-end" className="form-input" style={{ padding: '8px' }} />
                  </div>
                  <div style={{ flex: '1', minWidth: '120px' }}>
                    <label style={{ fontSize: '0.85rem' }}>สถานที่ (ตัวเลือก)</label>
                    <input type="text" id="new-sched-location" className="form-input" style={{ padding: '8px' }} placeholder="เช่น ห้อง 117" />
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '8px 16px', height: '38px' }}
                    onClick={() => {
                      const room = document.getElementById('new-sched-room').value.trim();
                      const day = parseInt(document.getElementById('new-sched-day').value);
                      const start = document.getElementById('new-sched-start').value;
                      const end = document.getElementById('new-sched-end').value;
                      const location = document.getElementById('new-sched-location').value.trim();
                      
                      if (!room || !start || !end) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
                      
                      const dayNames = { 1: 'จ.', 2: 'อ.', 3: 'พ.', 4: 'พฤ.', 5: 'ศ.' };
                      const label = `${dayNames[day]} ${start}-${end}${location ? ` ${location}` : ''}`;
                      
                      const newScheds = [...getNormalizedSchedules(classSchedules)];
                      newScheds.push({ id: Date.now().toString() + Math.random().toString(36).substr(2, 5), room, day, start, end, label });
                      setClassSchedules(newScheds);
                      
                      document.getElementById('new-sched-room').value = '';
                      document.getElementById('new-sched-start').value = '';
                      document.getElementById('new-sched-end').value = '';
                      document.getElementById('new-sched-location').value = '';
                    }}
                  >
                    + เพิ่ม
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '24px' }}>
                  * การเพิ่มตารางเรียนจะช่วยให้ระบบรู้ว่านักเรียนห้องนี้เรียนวันไหน และสามารถคำนวณการเช็คชื่อได้อย่างแม่นยำ
                </p>
              </div>
              
              <div className="form-group" style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>📝 ลิงก์ Google Sheet (แยกตามห้อง)</h3>
                
                {/* รายการที่เพิ่มแล้ว */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {Object.entries(googleSheetUrls).map(([room, url]) => (
                    <div key={room} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      <span style={{ fontWeight: 600, minWidth: '80px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>🏫 {room === 'default' ? 'ทุกห้อง' : room}</span>
                      <input
                        type="url"
                        className="form-input"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem', margin: 0 }}
                        value={url}
                        onChange={(e) => {
                          setGoogleSheetUrls(prev => ({ ...prev, [room]: e.target.value }));
                        }}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                      />
                      <button 
                        className="btn btn-secondary btn-sm" 
                        style={{ color: 'var(--error)', padding: '4px 8px', whiteSpace: 'nowrap' }}
                        onClick={() => {
                          setGoogleSheetUrls(prev => {
                            const next = { ...prev };
                            delete next[room];
                            return next;
                          });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {Object.keys(googleSheetUrls).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      ยังไม่ได้เพิ่มลิงก์ Google Sheet
                    </div>
                  )}
                </div>

                {/* เพิ่มลิงก์ใหม่ */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <div style={{ flex: '1', minWidth: '140px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>พิมพ์หรือเลือกห้อง</label>
                    <input type="text" id="new-sheet-room" list="room-list" className="form-input" style={{ padding: '8px' }} placeholder="ม.3/1 (เว้นว่าง = ทุกห้อง)" />
                    <datalist id="room-list">
                      {(() => {
                        const allRooms = [...new Set(
                          summaryData.map(s => s.student.room).filter(Boolean)
                        )].sort();
                        return allRooms.map(r => (
                          <option key={r} value={r} />
                        ));
                      })()}
                    </datalist>
                  </div>
                  <div style={{ flex: '3', minWidth: '250px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>ลิงก์ Google Sheet</label>
                    <input type="url" id="new-sheet-url" className="form-input" style={{ padding: '8px' }} placeholder="https://docs.google.com/spreadsheets/d/..." />
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '8px 20px', height: '38px', whiteSpace: 'nowrap' }}
                    onClick={() => {
                      let room = document.getElementById('new-sheet-room').value.trim();
                      if (!room) room = 'default';
                      const url = document.getElementById('new-sheet-url').value.trim();
                      if (!url) return alert('กรุณากรอกลิงก์ Google Sheet');
                      setGoogleSheetUrls(prev => ({ ...prev, [room]: url }));
                      document.getElementById('new-sheet-url').value = '';
                      document.getElementById('new-sheet-room').value = '';
                    }}
                  >
                    + เพิ่มลิงก์
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '24px' }}>
                  * เลือกห้อง → วางลิงก์ → กดเพิ่ม → กดบันทึกการตั้งค่า<br/>
                  * เวลาเลือกกรองห้องในแท็บ "สรุปการส่งงาน" จะแสดง Sheet ของห้องนั้นโดยอัตโนมัติ
                </p>
              </div>


              
              
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>🏖️ วันหยุด / วันยกเลิกคลาส (ระบบจะไม่นับขาดในวันนี้)</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {holidays.map(h => (
                    <span key={h} style={{ background: '#fce8e6', color: '#c5221f', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {new Date(h).toLocaleDateString('th-TH')}
                      <button className="btn btn-sm" style={{ padding: 0, background: 'transparent', color: '#c5221f', fontSize: '1rem', marginLeft: '4px' }} onClick={() => setHolidays(prev => prev.filter(x => x !== h))}>×</button>
                    </span>
                  ))}
                  {holidays.length === 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ยังไม่ได้เพิ่มวันหยุด</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="date" className="form-input" style={{ width: 'auto' }} value={newHoliday} onChange={e => setNewHoliday(e.target.value)} />
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    if (!newHoliday) return;
                    if (holidays.includes(newHoliday)) return;
                    setHolidays(prev => [...prev, newHoliday].sort());
                    setNewHoliday('');
                  }}>+ เพิ่มวันหยุด</button>
                </div>
              </div>
              
              <button 
                className="btn btn-primary" 
                style={{ width: 'auto' }}
                disabled={savingSettings}
                onClick={async () => {
                  setSavingSettings(true);
                  try {
                    const res = await fetch('/api/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        subjectId: selectedSubject, 
                        subjectName, 
                        className, 
                        classSchedules,
                        targetLat,
                        targetLng,
                        targetRoomName,
                        googleSheetUrls,
                        adminKey, 
                        qrCode 
                      })
                    });
                    if (res.ok) {
                      addToast('บันทึกการตั้งค่าสำเร็จ');
                      fetchData(adminKey);
                    }
                    else addToast('เกิดข้อผิดพลาด', 'error');
                  } catch (e) {
                    addToast('เกิดข้อผิดพลาด', 'error');
                  } finally {
                    setSavingSettings(false);
                  }
                }}
              >
                {savingSettings ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่า'}
              </button>
            </div>
          </div>
        )}

        {/* Add/Edit Assignment Modal */}
        {(showAddModal || editAssignment) && (
          <AssignmentModal
            adminKey={adminKey}
            subjectId={selectedSubject}
            assignment={editAssignment}
            onClose={() => {
              setShowAddModal(false);
              setEditAssignment(null);
            }}
            onSuccess={() => {
              setShowAddModal(false);
              setEditAssignment(null);
              addToast(editAssignment ? 'แก้ไขงานสำเร็จ' : 'เพิ่มงานใหม่สำเร็จ');
              fetchData(adminKey);
            }}
          />
        )}

        {/* Add/Edit Student Modal */}
        {(showAddStudentModal || editStudent) && (
          <StudentModal
            adminKey={adminKey}
            student={editStudent}
            onClose={() => {
              setShowAddStudentModal(false);
              setEditStudent(null);
            }}
            onSuccess={() => {
              setShowAddStudentModal(false);
              setEditStudent(null);
              addToast(editStudent ? 'แก้ไขรายชื่อสำเร็จ' : 'เพิ่มนักเรียนใหม่สำเร็จ');
              fetchData(adminKey);
            }}
          />
        )}

        {/* Bulk Student Modal */}
        {showBulkStudentModal && (
          <BulkStudentModal
            adminKey={adminKey}
            onClose={() => setShowBulkStudentModal(false)}
            onSuccess={() => {
              setShowBulkStudentModal(false);
              addToast('นำเข้ารายชื่อสำเร็จ');
              fetchData(adminKey);
            }}
          />
        )}
      </div>
    </div>
  );
}
