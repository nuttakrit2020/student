import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';

const GRADES = [
  { id: 'm1', name: 'มัธยมศึกษาปีที่ 1', rooms: 10 },
  { id: 'm2', name: 'มัธยมศึกษาปีที่ 2', rooms: 10 },
  { id: 'm3', name: 'มัธยมศึกษาปีที่ 3', rooms: 10 },
  { id: 'm4', name: 'มัธยมศึกษาปีที่ 4', rooms: 10 },
  { id: 'm5', name: 'มัธยมศึกษาปีที่ 5', rooms: 10 },
  { id: 'm6', name: 'มัธยมศึกษาปีที่ 6', rooms: 10 },
];

export default function Home() {
  const navigate = useNavigate();
  const [selectedGrade, setSelectedGrade] = useState(null);

  const handleRoomSelect = (gradeId, roomNum) => {
    navigate(`/class/${gradeId}/${roomNum}`);
  };

  return (
    <div className="home-page animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>ยินดีต้อนรับสู่ระบบส่งงาน</h1>
        <p className="text-muted" style={{ fontSize: '1.1rem' }}>
          กรุณาเลือกระดับชั้นและห้องเรียนของคุณเพื่อเริ่มต้น
        </p>
      </div>

      {!selectedGrade ? (
        <div className="grid-cards delay-1">
          {GRADES.map((grade) => (
            <button 
              key={grade.id} 
              className="card"
              onClick={() => setSelectedGrade(grade)}
              style={{ border: 'none', textAlign: 'left', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title">
                  <Users size={24} className="header-icon" />
                  {grade.name}
                </span>
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
              <span className="card-subtitle">มีทั้งหมด {grade.rooms} ห้องเรียน</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="glass-panel delay-2" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2>{selectedGrade.name} - เลือกห้องเรียน</h2>
            <button className="btn btn-outline" onClick={() => setSelectedGrade(null)}>
              ย้อนกลับ
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
            {Array.from({ length: selectedGrade.rooms }, (_, i) => i + 1).map(room => (
              <button
                key={room}
                className="btn btn-outline"
                style={{ padding: '1rem', fontSize: '1.25rem' }}
                onClick={() => handleRoomSelect(selectedGrade.id, room)}
              >
                ห้อง {room}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
