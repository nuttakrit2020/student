import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, ChevronRight, UserCircle, LogOut } from 'lucide-react';

const LEARNING_AREAS = [
  { id: 'thai', name: 'ภาษาไทย' },
  { id: 'math', name: 'คณิตศาสตร์' },
  { id: 'science', name: 'วิทยาศาสตร์และเทคโนโลยี' },
  { id: 'social', name: 'สังคมศึกษา ศาสนา และวัฒนธรรม' },
  { id: 'health', name: 'สุขศึกษาและพลศึกษา' },
  { id: 'art', name: 'ศิลปะ' },
  { id: 'career', name: 'การงานอาชีพ' },
  { id: 'foreign', name: 'ภาษาต่างประเทศ' },
];

export default function SubjectSelection() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('userProfile');
    if (!saved) {
      navigate('/');
    } else {
      setProfile(JSON.parse(saved));
    }
  }, [navigate]);

  const handleAreaSelect = (areaId) => {
    localStorage.setItem('savedLearningArea', areaId);
    navigate(`/area/${areaId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('userProfile');
    localStorage.removeItem('savedLearningArea');
    navigate('/');
  };

  if (!profile) return null;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>สวัสดี, {profile.studentName}</h1>
          <p className="text-muted">ชั้น ม.{profile.grade.replace('m', '')} ห้อง {profile.room} | เลขที่ {profile.studentNumber}</p>
        </div>
        <button className="btn btn-outline" onClick={handleLogout} style={{ padding: '0.5rem 1rem' }}>
          <LogOut size={18} />
          เปลี่ยนผู้ใช้
        </button>
      </div>

      <div className="glass-panel delay-1" style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Book size={24} className="header-icon" />
          เลือกกลุ่มสาระการเรียนรู้ที่จะส่งงาน
        </h2>
        
        <div className="grid-cards" style={{ marginTop: '0' }}>
          {LEARNING_AREAS.map((area) => (
            <button 
              key={area.id} 
              className="card"
              onClick={() => handleAreaSelect(area.id)}
              style={{ border: 'none', textAlign: 'left', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title">
                  {area.name}
                </span>
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
