import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, GraduationCap } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>ยินดีต้อนรับสู่ระบบส่งงาน</h1>
        <p className="text-muted" style={{ fontSize: '1.1rem' }}>
          กรุณาเลือกสถานะเพื่อเข้าใช้งานระบบ
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', width: '100%', maxWidth: '700px' }}>
        
        {/* Student Role */}
        <div 
          className="glass-panel card" 
          onClick={() => navigate('/student-auth')}
          style={{ padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px solid transparent', transition: 'all 0.3s' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--secondary)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <div style={{ backgroundColor: '#EFF6FF', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
            <Users size={48} style={{ color: 'var(--secondary)' }} />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>นักเรียน</h2>
          <p className="text-muted">ส่งงานและดูประวัติการส่งงาน</p>
        </div>

        {/* Teacher Role */}
        <div 
          className="glass-panel card" 
          onClick={() => navigate('/teacher-auth')}
          style={{ padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px solid transparent', transition: 'all 0.3s' }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
          <div style={{ backgroundColor: '#F1F5F9', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
            <GraduationCap size={48} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>ครูผู้สอน</h2>
          <p className="text-muted">ตรวจงานและจัดการวิชาเรียน</p>
        </div>

      </div>
    </div>
  );
}
