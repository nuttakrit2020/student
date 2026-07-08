import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, Download, FileText, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterRoom, setFilterRoom] = useState('all');
  const [searchSubject, setSearchSubject] = useState('');

  useEffect(() => {
    const isTeacher = localStorage.getItem('teacherAuth');
    if (!isTeacher) {
      navigate('/');
    } else {
      fetchSubmissions();
    }
  }, [navigate]);

  const fetchSubmissions = async () => {
    try {
      // Create a query against the collection. 
      // Firestore requires indexes for complex ordering, so we fetch all and sort in memory if needed.
      const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubmissions(data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      // Fallback without ordering if index is missing
      try {
        const querySnapshot = await getDocs(collection(db, 'submissions'));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort in memory by submittedAt desc
        data.sort((a, b) => {
          const timeA = a.submittedAt?.toMillis() || 0;
          const timeB = b.submittedAt?.toMillis() || 0;
          return timeB - timeA;
        });
        setSubmissions(data);
      } catch (innerError) {
        alert("ไม่สามารถโหลดข้อมูลได้");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teacherAuth');
    navigate('/');
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (filterGrade !== 'all' && sub.grade !== filterGrade) return false;
    if (filterRoom !== 'all' && sub.room !== filterRoom) return false;
    if (searchSubject && !sub.subjectName?.toLowerCase().includes(searchSubject.toLowerCase()) 
        && !sub.subjectCode?.toLowerCase().includes(searchSubject.toLowerCase())) {
      return false;
    }
    return true;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>แดชบอร์ดครูผู้สอน</h1>
          <p className="text-muted">ระบบตรวจสอบงานนักเรียน</p>
        </div>
        <button className="btn btn-outline" onClick={handleLogout} style={{ padding: '0.5rem 1rem' }}>
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>ตัวกรองข้อมูล</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">ระดับชั้น</label>
            <select className="form-select" value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
              <option value="all">ทั้งหมด</option>
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
            <select className="form-select" value={filterRoom} onChange={e => setFilterRoom(e.target.value)}>
              <option value="all">ทั้งหมด</option>
              {Array.from({length: 10}, (_, i) => i + 1).map(r => (
                <option key={r} value={r.toString()}>{r}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">ค้นหาวิชา</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="ชื่อวิชา หรือ รหัสวิชา..." 
                value={searchSubject}
                onChange={e => setSearchSubject(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
            <Loader2 size={32} className="animate-spin text-muted" />
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            ไม่พบข้อมูลการส่งงาน
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>วันเวลาที่ส่ง</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>นักเรียน</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>รหัสวิชา</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>ชื่องาน</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>ไฟล์งาน</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map(sub => (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{formatDate(sub.submittedAt)}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '500' }}>{sub.studentName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ม.{(sub.grade || '').replace('m', '')}/{sub.room} เลขที่ {sub.studentNumber}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '500' }}>{sub.subjectCode}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.subjectName}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{sub.assignmentTitle}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <a 
                      href={sub.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{ padding: '0.5rem', display: 'inline-flex' }}
                      title={sub.fileName}
                    >
                      <FileText size={18} style={{ color: 'var(--secondary)' }} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
