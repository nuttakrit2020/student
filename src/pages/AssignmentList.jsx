import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle, Loader2, Send } from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const LEARNING_AREAS_MAP = {
  'thai': 'ภาษาไทย',
  'math': 'คณิตศาสตร์',
  'science': 'วิทยาศาสตร์และเทคโนโลยี',
  'social': 'สังคมศึกษา ศาสนา และวัฒนธรรม',
  'health': 'สุขศึกษาและพลศึกษา',
  'art': 'ศิลปะ',
  'career': 'การงานอาชีพ',
  'foreign': 'ภาษาต่างประเทศ',
};

export default function AssignmentList() {
  const { gradeId, roomId, subjectId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [assignmentName, setAssignmentName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedGrade = gradeId.replace('m', 'ม.');
  const areaName = LEARNING_AREAS_MAP[subjectId] || subjectId;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('กรุณาแนบไฟล์งานก่อนส่ง');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload File to Firebase Storage
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${studentNumber}_${studentName.replace(/\s+/g, '_')}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `assignments/${gradeId}/room_${roomId}/${subjectId}/${subjectCode}/${fileName}`);
      
      const uploadResult = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 2. Save Data to Firestore
      await addDoc(collection(db, 'submissions'), {
        grade: gradeId,
        room: roomId,
        learningArea: areaName,
        subjectCode: subjectCode.toUpperCase(),
        subjectName: subjectName,
        assignmentTitle: assignmentName,
        studentName: studentName,
        studentNumber: Number(studentNumber),
        fileUrl: downloadURL,
        fileName: selectedFile.name,
        submittedAt: serverTimestamp()
      });

      alert(`ส่งงานสำเร็จ!\nวิชา: ${subjectCode} ${subjectName}\nงาน: ${assignmentName}\nชื่อ: ${studentName} เลขที่ ${studentNumber}`);
      
      // Reset form
      setSubjectCode('');
      setSubjectName('');
      setAssignmentName('');
      setStudentName('');
      setStudentNumber('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error) {
      console.error("Error submitting assignment: ", error);
      alert('เกิดข้อผิดพลาดในการส่งงาน: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={18} />
          กลับ
        </button>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>กลุ่มสาระ: {areaName}</h1>
          <p className="text-muted">ชั้น {formattedGrade} ห้อง {roomId} - ฟอร์มส่งงาน</p>
        </div>
      </div>

      <div className="glass-panel delay-1" style={{ padding: '2rem', border: '1px solid var(--border)' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Send size={24} className="header-icon" />
          กรอกข้อมูลและแนบไฟล์งาน
        </h2>
        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label">รหัสวิชา (เช่น ว31101)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="กรอกรหัสวิชา" 
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                required 
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label">ชื่อวิชา (เช่น วิทยาศาสตร์ชีวภาพ)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="กรอกชื่อวิชา" 
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                required 
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ชื่องาน / ใบงาน</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="กรอกชื่องาน (เช่น ใบงานที่ 1 ระบบนิเวศ)" 
              value={assignmentName}
              onChange={(e) => setAssignmentName(e.target.value)}
              required 
              disabled={isSubmitting}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label">เลขที่</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="เลขที่" 
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                required 
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label">ชื่อ - นามสกุล</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="กรอกชื่อ-นามสกุลของคุณ" 
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required 
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">แนบไฟล์งาน (PDF, Image, Word)</label>
            
            <input 
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={isSubmitting}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            
            <div 
              onClick={!isSubmitting ? triggerFileInput : undefined}
              style={{ 
              border: `2px dashed ${selectedFile ? 'var(--secondary)' : 'var(--border)'}`, 
              padding: '2rem', 
              textAlign: 'center',
              borderRadius: 'var(--radius-md)',
              backgroundColor: selectedFile ? '#F0F9FF' : '#F8FAFC',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}>
              {selectedFile ? (
                <div>
                  <CheckCircle size={32} style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }} />
                  <p style={{ fontWeight: '500', color: 'var(--primary)' }}>เลือกไฟล์แล้ว: {selectedFile.name}</p>
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>คลิกเพื่อเปลี่ยนไฟล์</p>
                </div>
              ) : (
                <div>
                  <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <p className="text-muted">คลิกเพื่อเลือกไฟล์ที่ต้องการส่ง</p>
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  กำลังส่งงาน...
                </>
              ) : (
                'ยืนยันการส่งงาน'
              )}
            </button>
          </div>
        </form>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
