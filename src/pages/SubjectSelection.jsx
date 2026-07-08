import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, ChevronRight, ArrowLeft } from 'lucide-react';

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
  const { gradeId, roomId } = useParams();
  const navigate = useNavigate();

  const handleAreaSelect = (areaId) => {
    navigate(`/class/${gradeId}/${roomId}/subject/${areaId}`);
  };

  const formattedGrade = gradeId.replace('m', 'ม.');

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={18} />
          กลับ
        </button>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>ชั้น {formattedGrade} ห้อง {roomId}</h1>
          <p className="text-muted">กรุณาเลือกกลุ่มสาระการเรียนรู้</p>
        </div>
      </div>

      <div className="grid-cards delay-1">
        {LEARNING_AREAS.map((area) => (
          <button 
            key={area.id} 
            className="card"
            onClick={() => handleAreaSelect(area.id)}
            style={{ border: 'none', textAlign: 'left', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">
                <Book size={24} className="header-icon" />
                {area.name}
              </span>
              <ChevronRight size={20} color="var(--text-muted)" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
