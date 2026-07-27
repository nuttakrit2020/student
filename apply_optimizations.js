const fs = require('fs');

const path = 'src/app/admin/page.js';
let code = fs.readFileSync(path, 'utf8');

// 1. Add useMemo to React imports
if (!code.includes('useMemo')) {
  code = code.replace(/import \{ useState, useEffect, useCallback, useRef \} from 'react';/, `import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';`);
}

// 2. Optimize students and summaryData
const targetDataBlock = `  const students = (data.students || []).filter(s => isStudentInSubject(s.room));
  const summaryData = (data.submissions || []).filter(s => isStudentInSubject(s.student?.room));
  const assignments = data.assignments || [];

  // Stats
  const totalStudents = students.length;
  const totalAssignments = assignments.length;
  const totalExpected = totalStudents * totalAssignments;
  const totalSubmitted = summaryData.reduce((acc, s) => {
    return acc + Object.values(s.submissions).filter((v) => v.submitted).length;
  }, 0);
  const submitRate = totalExpected > 0 ? Math.round((totalSubmitted / totalExpected) * 100) : 0;`;

const replacementDataBlock = `  const { students, summaryData, assignments } = useMemo(() => {
    if (!data) return { students: [], summaryData: [], assignments: [] };
    return {
      students: (data.students || []).filter(s => isStudentInSubject(s.room)),
      summaryData: (data.submissions || []).filter(s => isStudentInSubject(s.student?.room)),
      assignments: data.assignments || []
    };
  }, [data, className, classSchedules]);

  // Stats
  const { totalStudents, totalAssignments, totalExpected, totalSubmitted, submitRate } = useMemo(() => {
    const tStudents = students.length;
    const tAssignments = assignments.length;
    const tExpected = tStudents * tAssignments;
    const tSubmitted = summaryData.reduce((acc, s) => {
      return acc + Object.values(s.submissions).filter((v) => v.submitted).length;
    }, 0);
    const sRate = tExpected > 0 ? Math.round((tSubmitted / tExpected) * 100) : 0;
    return { totalStudents: tStudents, totalAssignments: tAssignments, totalExpected: tExpected, totalSubmitted: tSubmitted, submitRate: sRate };
  }, [students, assignments, summaryData]);`;

if (code.includes(targetDataBlock)) {
  code = code.replace(targetDataBlock, replacementDataBlock);
  console.log("Replaced useMemo for data block.");
}

// 3. Optimize filteredStudents in the Summary tab
const targetSummaryFilteredStudentsBlock = `          // unique rooms for filter
          const rooms = [...new Set(summaryData.map(s => s.student.room || '').filter(Boolean))].sort();
          // filtered students
          const filteredStudents = filterRoom ? summaryData.filter(s => s.student.room === filterRoom) : summaryData;`;

const replacementSummaryFilteredStudentsBlock = `          // unique rooms for filter
          const rooms = useMemo(() => [...new Set(summaryData.map(s => s.student.room || '').filter(Boolean))].sort(), [summaryData]);
          // filtered students
          const filteredStudents = useMemo(() => filterRoom ? summaryData.filter(s => s.student.room === filterRoom) : summaryData, [summaryData, filterRoom]);`;

if (code.includes(targetSummaryFilteredStudentsBlock)) {
  code = code.replace(targetSummaryFilteredStudentsBlock, replacementSummaryFilteredStudentsBlock);
  console.log("Replaced useMemo for summary filteredStudents.");
}

// 4. Inject showAttendanceEditPopup
const targetEditAttendanceFunc = `  const handleEditAttendance = async (studentId, dateStr, newType, newReason = '') => {`;
const replacementEditAttendanceFunc = `  const showAttendanceEditPopup = async (student, dateStr, att) => {
    const defaultReason = att?.type === 'leave' ? att.reason : '';
    const res = await MySwal.fire({
      title: '✏️ แก้ไขการเช็คชื่อ',
      html: \`
        <div style="text-align: left; font-size: 1rem; line-height: 1.5; margin-bottom: 16px;">
          <p><strong>นักเรียน:</strong> \${student.name} (\${student.nickname || '-'})</p>
          <p><strong>วันที่:</strong> \${dateStr}</p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button id="btn-present" class="swal2-confirm swal2-styled" style="background: #e6f4ea; color: #137333; width: 100%; text-align: left; justify-content: flex-start; padding: 12px 20px;">🟢 มาเรียน (ปกติ)</button>
          
          <div style="background: #fff9c4; border: 1px solid #b08d00; border-radius: 8px; padding: 12px; margin-top: 8px;">
            <div style="color: #b08d00; font-weight: 600; margin-bottom: 8px; text-align: left;">🟡 ลาเรียน</div>
            <input type="text" id="leave-reason-input" class="swal2-input" placeholder="เหตุผลการลา..." value="\${defaultReason}" style="width: 100%; box-sizing: border-box; margin: 0 0 8px 0; font-size: 0.95rem;">
            <button id="btn-leave" class="swal2-confirm swal2-styled" style="background: #f39c12; width: 100%; margin: 0; padding: 10px;">บันทึกสถานะลา</button>
          </div>

          <button id="btn-absent" class="swal2-confirm swal2-styled" style="background: #fce8e6; color: #d93025; width: 100%; text-align: left; justify-content: flex-start; padding: 12px 20px; margin-top: 8px;">🔴 ขาดเรียน (ลบข้อมูล)</button>
        </div>
      \`,
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

  const handleEditAttendance = async (studentId, dateStr, newType, newReason = '') => {`;

if (code.includes(targetEditAttendanceFunc) && !code.includes("showAttendanceEditPopup")) {
  code = code.replace(targetEditAttendanceFunc, replacementEditAttendanceFunc);
  console.log("Injected showAttendanceEditPopup.");
}

// 5. Replace onClick in calendar table
const targetCalendarOnClick = `                                  <td 
                                    key={i} 
                                    className="att-cell"
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
                                  >`;

const replacementCalendarOnClick = `                                  <td 
                                    key={i} 
                                    className="att-cell"
                                    style={cellStyle}
                                    title={tooltip}
                                    onClick={() => {
                                      if (isClassDay && !isFuture) {
                                        showAttendanceEditPopup(student, dateStr, att);
                                      }
                                    }}
                                  >`;

if (code.includes(targetCalendarOnClick)) {
  code = code.replace(targetCalendarOnClick, replacementCalendarOnClick);
  console.log("Replaced calendar cell onClick.");
}

// 6. Remove editingCell modal from render
// Let's use a regex to strip it out since it's a large block
const editingCellRegex = /\{editingCell && \([\s\S]*?<\/div>[\s]*<\/div>[\s]*\)\}/;
if (editingCellRegex.test(code)) {
  code = code.replace(editingCellRegex, "");
  console.log("Removed editingCell modal.");
}

fs.writeFileSync(path, code);
console.log("Optimizations applied successfully.");
