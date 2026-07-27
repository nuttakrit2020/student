# -*- coding: utf-8 -*-
import re

with open('src/app/student/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update AttendanceCheckModal signature
content = content.replace(
    "function AttendanceCheckModal({ student, settings, onClose, onSuccess }) {",
    "function AttendanceCheckModal({ student, settings, subjectId, onClose, onSuccess }) {"
)

# 2. Update AttendanceCheckModal fetch body
old_body_att = '''body: JSON.stringify({ 
          studentId: student.id, 
          lat: gpsData.lat, 
          lng: gpsData.lng, 
          photo, 
          timestamp: new Date().toISOString() 
        })'''
new_body_att = '''body: JSON.stringify({ 
          studentId: student.id, 
          subjectId,
          lat: gpsData.lat, 
          lng: gpsData.lng, 
          photo, 
          timestamp: new Date().toISOString() 
        })'''
content = content.replace(old_body_att, new_body_att)

# 3. Update LeaveRequestModal signature
content = content.replace(
    "function LeaveRequestModal({ student, onClose, onSuccess }) {",
    "function LeaveRequestModal({ student, subjectId, onClose, onSuccess }) {"
)

# 4. Update LeaveRequestModal fetch body
old_body_leave = '''body: JSON.stringify({ 
          studentId: student.id, 
          type: 'leave',
          reason: reason,
          timestamp: new Date(leaveDate + 'T08:00:00.000Z').toISOString() 
        })'''
new_body_leave = '''body: JSON.stringify({ 
          studentId: student.id, 
          subjectId,
          type: 'leave',
          reason: reason,
          timestamp: new Date(leaveDate + 'T08:00:00.000Z').toISOString() 
        })'''
content = content.replace(old_body_leave, new_body_leave)

# 5. Update component invocations
content = content.replace(
    '''<AttendanceCheckModal
            student={student}
            settings={settings}''',
    '''<AttendanceCheckModal
            student={student}
            settings={settings}
            subjectId={selectedSubject}'''
)
content = content.replace(
    '''<LeaveRequestModal
            student={student}''',
    '''<LeaveRequestModal
            student={student}
            subjectId={selectedSubject}'''
)

# 6. Add subject selector to UI
old_ui = '''<div className="profile-info">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{student.name}</h1>
            <p style={{ opacity: 0.9 }}>ชื่อเล่น: {student.nickname} | ห้อง: {student.room} | เลขที่: {student.number}</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowProfileModal(true)} style={{ alignSelf: 'flex-start' }}>?? แก้ไขโปรไฟล์</button>
        </div>
      </div>'''

new_ui = '''<div className="profile-info">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{student.name}</h1>
            <p style={{ opacity: 0.9 }}>ชื่อเล่น: {student.nickname} | ห้อง: {student.room} | เลขที่: {student.number}</p>
          </div>
          <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowProfileModal(true)}>?? แก้ไขโปรไฟล์</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '8px' }}>
              <span style={{ fontSize: '1rem' }}>??</span>
              <select 
                className="form-input" 
                style={{ border: 'none', background: 'transparent', padding: '0', color: 'white', fontWeight: 600 }}
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                }}
              >
                {subjects.map(s => <option key={s.id} value={s.id} style={{color: 'black'}}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>'''

content = content.replace(old_ui, new_ui)

with open('src/app/student/page.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated student page.')
