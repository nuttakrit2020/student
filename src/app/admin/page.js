'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

function AssignmentModal({ adminKey, assignment, onClose, onSuccess }) {
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
        title, description, deadline, maxScore: Number(maxScore), worksheetUrl, adminKey 
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

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const [data, setData] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminKey, setAdminKey] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [className, setClassName] = useState('');
  const [targetLat, setTargetLat] = useState(null);
  const [targetLng, setTargetLng] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [showQrCode, setShowQrCode] = useState(true);
  const [adminAvatarUrl, setAdminAvatarUrl] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);
  
  // Student management states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBulkStudentModal, setShowBulkStudentModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filterRoom, setFilterRoom] = useState('');
  const [filterAttRoom, setFilterAttRoom] = useState('');
  const [filterAttDate, setFilterAttDate] = useState('today');
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [calendarRoom, setCalendarRoom] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [classSchedules, setClassSchedules] = useState({
    '3/1': { day: 4, start: '13:30', end: '14:20', label: 'พฤหัสบดี 13:30-14:20' },
    '3/2': { day: 5, start: '11:50', end: '12:40', label: 'ศุกร์ 11:50-12:40' },
    '3/3': { day: 5, start: '08:30', end: '09:20', label: 'ศุกร์ 08:30-09:20' },
    '3/4': { day: 5, start: '12:40', end: '13:30', label: 'ศุกร์ 12:40-13:30' },
    '3/5': { day: 1, start: '13:30', end: '14:20', label: 'จันทร์ 13:30-14:20' },
    '3/6': { day: 3, start: '08:30', end: '09:20', label: 'พุธ 08:30-09:20' },
    '3/7': { day: 1, start: '14:20', end: '15:10', label: 'จันทร์ 14:20-15:10' },
    '3/8': { day: 5, start: '10:10', end: '11:00', label: 'ศุกร์ 10:10-11:00' },
  });

  // Drag to check states
  const [isDragging, setIsDragging] = useState(false);
  const [dragTargetStatus, setDragTargetStatus] = useState(null);

  const [toasts, setToasts] = useState([]);
  const router = useRouter();
  const fileInputRef = useRef(null);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchData = useCallback(async (key) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: key }),
      });

      if (res.ok) {
        const result = await res.json();
        setData(result);
        if (result.settings) {
          setSubjectName(result.settings.subjectName || '');
          setClassName(result.settings.className || '');
          setTargetLat(result.settings.targetLat || null);
          setTargetLng(result.settings.targetLng || null);
          setQrCode(result.settings.qrCode || '');
          setAdminAvatarUrl(result.settings.adminAvatarUrl || '');
          if (result.settings.classSchedules) {
            setClassSchedules(result.settings.classSchedules);
          }
        }
      } else {
        router.push('/');
      }
      
      // Fetch attendances
      const attRes = await fetch(`/api/attendance?adminKey=${key}`);
      if (attRes.ok) {
        const attResult = await attRes.json();
        setAttendances(attResult);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
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
              isOk: newType === 'leave' ? null : true
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
        fetchData();
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
        body: JSON.stringify({ adminKey, targetLat: null, targetLng: null })
      });
      if (res.ok) {
        setTargetLat(null);
        setTargetLng(null);
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
            body: JSON.stringify({ adminKey, targetLat: lat, targetLng: lng })
          });
          if (res.ok) {
            setTargetLat(lat);
            setTargetLng(lng);
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="loading-text">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!data) return null;

  const { students, assignments, submissions: summaryData } = data;

  // Stats
  const totalStudents = students.length;
  const totalAssignments = assignments.length;
  const totalExpected = totalStudents * totalAssignments;
  const totalSubmitted = summaryData.reduce((acc, s) => {
    return acc + Object.values(s.submissions).filter((v) => v.submitted).length;
  }, 0);
  const submitRate = totalExpected > 0 ? Math.round((totalSubmitted / totalExpected) * 100) : 0;

  return (
    <div className="page-container">
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
        <div className="student-header">
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
              <p>{subjectName || 'รายวิชาการออกแบบ 3'} {className || 'ชั้นมัธยมศึกษาปีที่ 3/1-8 เทอม 1/2569'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              🚪 ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalStudents}</div>
            <div className="stat-label">👩‍🎓 นักเรียน</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalAssignments}</div>
            <div className="stat-label">📋 งานทั้งหมด</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalSubmitted}/{totalExpected}</div>
            <div className="stat-label">📤 ส่งงานแล้ว</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{submitRate}%</div>
            <div className="stat-label">📊 อัตราการส่ง</div>
          </div>
        </div>

        {/* Nav */}
        <div className="admin-nav">
          <button
            className={`nav-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            📊 สรุปการส่งงาน
          </button>
          <button
            className={`nav-btn ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            📋 จัดการงาน
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
            📍 ประวัติเช็คชื่อ
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
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>📊 ตารางสรุปการส่งงาน</h2>
            </div>

            {assignments.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📭</div>
                <p>ยังไม่มีงานที่สร้าง</p>
              </div>
            ) : (
              <div className="table-wrapper" onMouseUp={handleMouseUpOrLeave} onMouseLeave={handleMouseUpOrLeave}>
                <table className="data-table" style={{ userSelect: 'none' }}>
                  <thead>
                    <tr>
                      <th>รหัส</th>
                      <th>ชื่อ-สกุล</th>
                      {assignments.map((a) => (
                        <th 
                          key={a.id} 
                          title={`${a.title}\n(คลิกเพื่อกรอกคะแนนให้ทุกคน)`} 
                          style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer', background: 'var(--bg-primary)' }}
                          onClick={() => handleBulkScore('assignment', a.id, a.maxScore || 10, a.title)}
                        >
                          {a.title.length > 15 ? a.title.substring(0, 15) + '...' : a.title} ✏️
                        </th>
                      ))}
                      <th style={{ cursor: 'pointer', background: 'var(--bg-primary)' }} onClick={() => handleBulkScore('student', 'midtermScore', 20, 'สอบกลางภาค')} title="คลิกเพื่อกรอกคะแนนให้ทุกคน">กลางภาค ✏️ (20)</th>
                      <th style={{ cursor: 'pointer', background: 'var(--bg-primary)' }} onClick={() => handleBulkScore('student', 'finalScore', 20, 'สอบปลายภาค')} title="คลิกเพื่อกรอกคะแนนให้ทุกคน">ปลายภาค ✏️ (20)</th>
                      <th style={{ cursor: 'pointer', background: 'var(--bg-primary)' }} onClick={() => handleBulkScore('student', 'behaviorScore', 10, 'จิตพิสัย')} title="คลิกเพื่อกรอกคะแนนให้ทุกคน">จิตพิสัย ✏️ (10)</th>
                      <th>รวม (100)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((row) => {
                      const submittedCount = Object.values(row.submissions).filter((v) => v.submitted).length;
                      return (
                        <tr key={row.student.id}>
                          <td style={{ fontFamily: 'var(--font-en)', fontWeight: 600 }}>{row.student.id}</td>
                          <td>{row.student.name}</td>
                          {assignments.map((a) => {
                            const sub = row.submissions[a.id];
                            return (
                              <td
                                key={a.id}
                                className={sub?.submitted ? 'cell-submitted' : 'cell-not-submitted'}
                                title={sub?.submitted ? 'ส่งแล้ว (คลิกหรือลากเพื่อสลับสถานะ)' : 'ยังไม่ส่ง (คลิกหรือลากเพื่อสลับสถานะ)'}
                                style={{ textAlign: 'center', cursor: 'pointer', position: 'relative' }}
                                onMouseDown={() => handleCellMouseDown(row.student.id, a.id, sub?.submitted, sub?.score)}
                                onMouseEnter={() => handleCellMouseEnter(row.student.id, a.id, sub?.submitted, sub?.score)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '1.2rem' }}>{sub?.submitted ? '✅' : '❌'}</span>
                                  <input 
                                    type="number" 
                                    className="score-input"
                                    placeholder="-"
                                    value={sub?.score ?? ''} 
                                    onChange={(e) => handleScoreChange(row.student.id, a.id, sub?.submitted, e.target.value)} 
                                    onMouseDown={(e) => e.stopPropagation()}
                                    style={{ 
                                      width: '40px', 
                                      padding: '2px 4px', 
                                      fontSize: '0.85rem', 
                                      textAlign: 'center',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '4px',
                                      background: 'var(--bg-primary)',
                                      color: 'var(--text-primary)'
                                    }}
                                  />
                                </div>
                              </td>
                            );
                          })}
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              className="score-input"
                              placeholder="-"
                              value={row.student.midtermScore ?? ''}
                              onChange={(e) => handleStudentScoreChange(row.student.id, 'midtermScore', e.target.value)}
                              min={0} max={20}
                              style={{ width: '45px', padding: '2px 4px', fontSize: '0.85rem', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              className="score-input"
                              placeholder="-"
                              value={row.student.finalScore ?? ''}
                              onChange={(e) => handleStudentScoreChange(row.student.id, 'finalScore', e.target.value)}
                              min={0} max={20}
                              style={{ width: '45px', padding: '2px 4px', fontSize: '0.85rem', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              className="score-input"
                              placeholder="-"
                              value={row.student.behaviorScore ?? ''}
                              onChange={(e) => handleStudentScoreChange(row.student.id, 'behaviorScore', e.target.value)}
                              min={0} max={10}
                              style={{ width: '45px', padding: '2px 4px', fontSize: '0.85rem', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            />
                          </td>
                          <td style={{
                            fontFamily: 'var(--font-en)',
                            fontWeight: 700,
                            textAlign: 'center',
                            color: 'var(--text-primary)'
                          }}>
                            {(() => {
                              const assignmentScore = Object.values(row.submissions).reduce((sum, s) => sum + (Number(s.score) || 0), 0);
                              const totalScore = assignmentScore + (Number(row.student.midtermScore) || 0) + (Number(row.student.finalScore) || 0) + (Number(row.student.behaviorScore) || 0);
                              return totalScore;
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
                style={{ width: 'auto', minWidth: '150px', padding: '8px 12px' }}
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
                ✅ ตั้งพิกัดห้องเรียนแล้ว (ระยะที่อนุญาต: ไม่เกิน 8 เมตร)
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
                <table>
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

        {activeTab === 'calendar' && (() => {
          const rooms = data?.students ? [...new Set(data.students.map(s => s.room || '').filter(Boolean))].sort() : [];
          const students = data?.students || [];
          const filteredStudents = calendarRoom ? students.filter(s => s.room === calendarRoom) : students;

          // Calculate week dates
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (calendarWeekOffset * 7)); // Monday
          const weekDays = [];
          const dayNames = ['\u0e08.', '\u0e2d.', '\u0e1e.', '\u0e1e\u0e24.', '\u0e28.'];
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

          return (
            <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="card-header" style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{'\ud83d\udcc5'} ตารางเช็คชื่อรายสัปดาห์</h2>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setCalendarWeekOffset(o => o - 1)} style={{ padding: '8px 12px' }}>{'\u25c0'} สัปดาห์ก่อน</button>
                <span style={{ fontWeight: 600, fontSize: '1rem', minWidth: '200px', textAlign: 'center' }}>{weekLabel}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setCalendarWeekOffset(o => o + 1)} style={{ padding: '8px 12px' }}>สัปดาห์ถัดไป {'\u25b6'}</button>
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
                  {rooms.map(room => (
                    <option key={room} value={room}>{room} {classSchedules[getRoomKey(room)] ? `(${classSchedules[getRoomKey(room)].label})` : ''}</option>
                  ))}
                </select>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">{'\ud83d\udced'}</div>
                  <p>ไม่พบนักเรียนตามที่กรอง</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ position: 'sticky', left: 0, background: 'var(--bg-primary)', zIndex: 2, minWidth: '40px' }}>#</th>
                        <th style={{ position: 'sticky', left: '40px', background: 'var(--bg-primary)', zIndex: 2, minWidth: '120px' }}>ชื่อนักเรียน</th>
                        <th style={{ position: 'sticky', left: '160px', background: 'var(--bg-primary)', zIndex: 2, minWidth: '60px' }}>ห้อง</th>
                        {weekDays.map((d, i) => {
                          const isToday = d.toLocaleDateString('th-TH') === todayStr;
                          return (
                            <th key={i} style={{ textAlign: 'center', minWidth: '70px', background: isToday ? '#e8f0fe' : undefined, borderBottom: isToday ? '3px solid #1a73e8' : undefined }}>
                              <div>{dayNames[i]}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.getDate()}/{d.getMonth()+1}</div>
                            </th>
                          );
                        })}
                        <th style={{ textAlign: 'center', minWidth: '50px' }}>สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, idx) => {
                        const roomKey = getRoomKey(student.room);
                        const schedule = classSchedules[roomKey];
                        let presentCount = 0;
                        let scheduledCount = 0;

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
                              const isClassDay = schedule ? schedule.day === jsDay : true;
                              const att = attMap[student.id] && attMap[student.id][dateStr];

                              let cellContent = '';
                              let cellStyle = { textAlign: 'center', fontSize: '1.2rem' };

                              if (!isClassDay) {
                                // Not a scheduled class day for this room
                                cellContent = '\u2014';
                                cellStyle.color = '#ddd';
                                cellStyle.background = '#fafafa';
                              } else if (isFuture) {
                                scheduledCount++;
                                cellContent = '\u23f3';
                                cellStyle.color = '#bbb';
                              } else {
                                scheduledCount++;
                                if (att) {
                                  presentCount++;
                                  if (att.type === 'leave') {
                                    cellContent = '🟡';
                                    cellStyle.background = '#fff9c4';
                                  } else if (att.isOk === false) {
                                    cellContent = '\u26a0\ufe0f';
                                    cellStyle.background = '#fff3e0';
                                  } else {
                                    cellContent = '\u2705';
                                    cellStyle.background = '#e6f4ea';
                                  }
                                } else {
                                  cellContent = '\u274c';
                                  cellStyle.background = '#fce8e6';
                                }
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
                              if (att && att.type === 'leave') tooltip = `ลา: ${att.reason}`;
                              else if (att && att.isOk === false) tooltip = `ผิดจุด! ห่าง ${att.distance} ม.`;
                              else if (!isClassDay) tooltip = 'ไม่มีคาบเรียน';
                              
                              return (
                                <td 
                                  key={i} 
                                  style={cellStyle} 
                                  title={tooltip}
                                  onClick={() => {
                                    if (isClassDay && !isFuture) {
                                      setEditingCell({
                                        student,
                                        dateStr,
                                        att
                                      });
                                    }
                                  }}
                                >
                                  {cellContent}
                                </td>
                              );
                            })}
                            <td style={{ textAlign: 'center', fontWeight: 600, fontFamily: 'var(--font-en)' }}>
                              {schedule ? (
                                <span style={{ color: presentCount >= 1 ? '#137333' : '#d93025' }}>
                                  {presentCount === 1 ? '\u2705 \u0e21\u0e32' : '\u274c \u0e02\u0e32\u0e14'}
                                </span>
                              ) : (
                                <span style={{ color: '#999' }}>-</span>
                              )}
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
                <span>🟡 = ลา</span>
                <span>{'\u274c'} = ขาดเรียน</span>
                <span>{'\u26a0\ufe0f'} = มาแต่ผิดจุด (นอกรัศมี 8 ม.)</span>
                <span>{'\u2014'} = ไม่มีคาบเรียนวันนี้</span>
                <span>{'\u23f3'} = ยังไม่ถึงวัน</span>
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
                            let roomFound = null;
                            Object.entries(classSchedules).forEach(([room, sched]) => {
                              if (sched.day === day.id && sched.start === startTime) {
                                roomFound = room;
                              }
                            });
                            
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
          );
        })()}

        {editingCell && (
          <div className="modal-overlay" onClick={() => setEditingCell(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <h3 style={{ marginBottom: '16px', textAlign: 'center' }}>✏️ แก้ไขการเช็คชื่อ</h3>
              <p style={{ marginBottom: '8px' }}><strong>นักเรียน:</strong> {editingCell.student.name} ({editingCell.student.nickname})</p>
              <p style={{ marginBottom: '16px' }}><strong>วันที่:</strong> {editingCell.dateStr}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  className="btn btn-secondary"
                  style={{ background: '#e6f4ea', borderColor: '#137333', color: '#137333', textAlign: 'left', padding: '12px' }}
                  onClick={() => {
                    handleEditAttendance(editingCell.student.id, editingCell.dateStr, 'present');
                    setEditingCell(null);
                  }}
                >
                  🟢 มาเรียน (ปกติ)
                </button>
                
                <div style={{ background: '#fff9c4', border: '1px solid #b08d00', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ color: '#b08d00', fontWeight: 600, marginBottom: '8px' }}>🟡 ลาเรียน</div>
                  <input 
                    type="text" 
                    placeholder="เหตุผลการลา..." 
                    className="form-input"
                    id="leave-reason-input"
                    defaultValue={editingCell.att?.type === 'leave' ? editingCell.att.reason : ''}
                  />
                  <button 
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '8px', width: '100%' }}
                    onClick={() => {
                      const r = document.getElementById('leave-reason-input').value;
                      handleEditAttendance(editingCell.student.id, editingCell.dateStr, 'leave', r);
                      setEditingCell(null);
                    }}
                  >
                    บันทึกสถานะลา
                  </button>
                </div>

                <button 
                  className="btn btn-secondary"
                  style={{ background: '#fce8e6', borderColor: '#d93025', color: '#d93025', textAlign: 'left', padding: '12px' }}
                  onClick={() => {
                    handleEditAttendance(editingCell.student.id, editingCell.dateStr, 'absent');
                    setEditingCell(null);
                  }}
                >
                  🔴 ขาดเรียน (ลบข้อมูล)
                </button>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingCell(null)}>ยกเลิก</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>⚙️ ตั้งค่าระบบ</h2>
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
                      body: JSON.stringify({ subjectName, className, adminKey, qrCode })
                    });
                    if (res.ok) addToast('บันทึกการตั้งค่าสำเร็จ');
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
