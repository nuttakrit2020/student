import fs from 'fs';
import path from 'path';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const dataDir = path.join(process.cwd(), 'data');

function readJSON(filename) {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function writeJSON(filename, data) {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ==================== STUDENTS ====================

export async function getStudents() {
  if (db) {
    const snapshot = await getDocs(collection(db, 'students'));
    return snapshot.docs.map(d => d.data());
  }
  return readJSON('students.json');
}

export async function getStudentById(id) {
  if (db) {
    const d = await getDoc(doc(db, 'students', id));
    return d.exists() ? d.data() : null;
  }
  const students = await getStudents();
  return students.find((s) => s.id === id) || null;
}

export async function updateStudent(id, updates) {
  if (db) {
    const docRef = doc(db, 'students', id);
    const d = await getDoc(docRef);
    if (!d.exists()) return null;
    if (updates.id && updates.id !== id) {
      const existing = await getDoc(doc(db, 'students', updates.id));
      if (existing.exists()) throw new Error('รหัสนักเรียนซ้ำกับคนอื่นที่มีอยู่แล้ว');
      // Create new, delete old
      const newData = { ...d.data(), ...updates };
      await setDoc(doc(db, 'students', updates.id), newData);
      await deleteDoc(docRef);
      return newData;
    } else {
      await updateDoc(docRef, updates);
      return { ...d.data(), ...updates };
    }
  }

  const students = await getStudents();
  const index = students.findIndex((s) => s.id === id);
  if (index === -1) return null;
  
  if (updates.id && updates.id !== id) {
    const existing = students.find((s) => s.id === updates.id);
    if (existing) throw new Error('รหัสนักเรียนซ้ำกับคนอื่นที่มีอยู่แล้ว');
  }

  students[index] = { ...students[index], ...updates };
  writeJSON('students.json', students);
  return students[index];
}

export async function addStudent(student) {
  const newStudent = {
    id: student.id,
    name: student.name,
    nickname: student.nickname || '',
    avatarUrl: student.avatarUrl || '',
    room: student.room || ''
  };

  if (db) {
    const docRef = doc(db, 'students', student.id);
    const d = await getDoc(docRef);
    if (d.exists()) throw new Error('รหัสนักเรียนซ้ำ');
    await setDoc(docRef, newStudent);
    return newStudent;
  }

  const students = await getStudents();
  if (students.find(s => s.id === student.id)) {
    throw new Error('รหัสนักเรียนซ้ำ');
  }
  students.push(newStudent);
  writeJSON('students.json', students);
  return newStudent;
}

export async function bulkAddStudents(newStudents) {
  const added = [];
  if (db) {
    const batch = writeBatch(db);
    for (const stu of newStudents) {
      const docRef = doc(db, 'students', stu.id);
      const d = await getDoc(docRef); // Note: Doing getDoc in a loop is slow, but acceptable for this size
      if (!d.exists()) {
        const newStudent = {
          id: stu.id,
          name: stu.name,
          nickname: stu.nickname || '',
          avatarUrl: stu.avatarUrl || '',
          room: stu.room || ''
        };
        batch.set(docRef, newStudent);
        added.push(newStudent);
      }
    }
    await batch.commit();
    return added;
  }

  const students = await getStudents();
  for (const stu of newStudents) {
    if (!students.find(s => s.id === stu.id)) {
      const newStudent = {
        id: stu.id,
        name: stu.name,
        nickname: stu.nickname || '',
        avatarUrl: stu.avatarUrl || '',
        room: stu.room || ''
      };
      students.push(newStudent);
      added.push(newStudent);
    }
  }
  writeJSON('students.json', students);
  return added;
}

export async function deleteStudent(id) {
  if (db) {
    const docRef = doc(db, 'students', id);
    const d = await getDoc(docRef);
    if (!d.exists()) return false;
    await deleteDoc(docRef);
    return true;
  }

  let students = await getStudents();
  const initialLength = students.length;
  students = students.filter(s => s.id !== id);
  if (students.length === initialLength) return false;
  writeJSON('students.json', students);
  return true;
}

export async function bulkDeleteStudents(ids) {
  if (db) {
    const batch = writeBatch(db);
    ids.forEach(id => {
      batch.delete(doc(db, 'students', id));
    });
    await batch.commit();
    return true;
  }

  let students = await getStudents();
  const initialLength = students.length;
  students = students.filter(s => !ids.includes(s.id));
  if (students.length === initialLength) return false;
  writeJSON('students.json', students);
  return true;
}

// ==================== SUBJECTS ====================

export async function getSubjects() {
  if (db) {
    const snapshot = await getDocs(collection(db, 'subjects'));
    return snapshot.docs.map(d => d.data());
  }
  return readJSON('subjects.json');
}

export async function getSubjectById(id) {
  if (db) {
    const d = await getDoc(doc(db, 'subjects', id));
    return d.exists() ? d.data() : null;
  }
  const subjects = await getSubjects();
  return subjects.find((s) => s.id === id) || null;
}

export async function addSubject(subject) {
  const subjects = await getSubjects();
  const newSubject = {
    id: `sub-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...subject,
  };

  if (db) {
    await setDoc(doc(db, 'subjects', newSubject.id), newSubject);
    return newSubject;
  }

  subjects.push(newSubject);
  writeJSON('subjects.json', subjects);
  return newSubject;
}

export async function updateSubject(id, updates) {
  if (db) {
    const docRef = doc(db, 'subjects', id);
    const d = await getDoc(docRef);
    if (!d.exists()) return null;
    const newData = { ...d.data(), ...updates };
    await updateDoc(docRef, updates);
    return newData;
  }

  const subjects = await getSubjects();
  const index = subjects.findIndex((s) => s.id === id);
  if (index === -1) return null;
  subjects[index] = { ...subjects[index], ...updates };
  writeJSON('subjects.json', subjects);
  return subjects[index];
}

export async function deleteSubject(id) {
  if (db) {
    await deleteDoc(doc(db, 'subjects', id));
    return true;
  }
  let subjects = await getSubjects();
  subjects = subjects.filter((s) => s.id !== id);
  writeJSON('subjects.json', subjects);
  return true;
}

export async function ensureDefaultSubject() {
  const subjects = await getSubjects();
  if (subjects.length > 0) return subjects[0];
  
  // Create default from old settings
  const settings = await getSettings();
  const defaultSub = {
    name: settings.subjectName || 'รายวิชาเริ่มต้น',
    className: settings.className || '',
    classSchedules: settings.classSchedules || {},
    targetLat: settings.targetLat || null,
    targetLng: settings.targetLng || null,
    targetRoomName: settings.targetRoomName || '',
  };
  return await addSubject(defaultSub);
}

// ==================== SETTINGS ====================

export async function getSettings() {
  if (db) {
    const d = await getDoc(doc(db, 'config', 'settings'));
    if (d.exists()) return d.data();
    return { subjectName: "รายวิชาการออกแบบ 3", className: "ชั้นมัธยมศึกษาปีที่ 3/1-8 เทอม 1/2569" };
  }

  const filePath = path.join(dataDir, 'settings.json');
  if (!fs.existsSync(filePath)) {
    return { subjectName: "รายวิชาการออกแบบ 3", className: "ชั้นมัธยมศึกษาปีที่ 3/1-8 เทอม 1/2569" };
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export async function updateSettings(updates) {
  const settings = await getSettings();
  const newSettings = { ...settings, ...updates };

  if (db) {
    await setDoc(doc(db, 'config', 'settings'), newSettings);
    return newSettings;
  }

  writeJSON('settings.json', newSettings);
  return newSettings;
}

// ==================== ASSIGNMENTS ====================

export async function getAssignments(subjectId = null) {
  const defaultSubjectId = (await getSubjects())[0]?.id;
  if (db) {
    const snapshot = await getDocs(collection(db, 'assignments'));
    const data = snapshot.docs.map(d => d.data());
    return subjectId ? data.filter(a => (a.subjectId || defaultSubjectId) === subjectId) : data;
  }
  const data = readJSON('assignments.json');
  return subjectId ? data.filter(a => (a.subjectId || defaultSubjectId) === subjectId) : data;
}

export async function getAssignmentById(id) {
  if (db) {
    const d = await getDoc(doc(db, 'assignments', id));
    return d.exists() ? d.data() : null;
  }
  const assignments = await getAssignments();
  return assignments.find((a) => a.id === id) || null;
}

export async function addAssignment(assignment) {
  const assignments = await getAssignments();
  const newAssignment = {
    id: `assign-${String(assignments.length + 1).padStart(3, '0')}`,
    ...assignment,
    createdAt: new Date().toISOString(),
  };

  if (db) {
    await setDoc(doc(db, 'assignments', newAssignment.id), newAssignment);
    return newAssignment;
  }

  assignments.push(newAssignment);
  writeJSON('assignments.json', assignments);
  return newAssignment;
}

export async function updateAssignment(id, updates) {
  if (db) {
    const docRef = doc(db, 'assignments', id);
    const d = await getDoc(docRef);
    if (!d.exists()) return null;
    const newData = { ...d.data(), ...updates };
    await updateDoc(docRef, updates);
    return newData;
  }

  const assignments = await getAssignments();
  const index = assignments.findIndex((a) => a.id === id);
  if (index === -1) return null;
  assignments[index] = { ...assignments[index], ...updates };
  writeJSON('assignments.json', assignments);
  return assignments[index];
}

export async function deleteAssignment(id) {
  if (db) {
    await deleteDoc(doc(db, 'assignments', id));
    // Also remove related submissions
    const snapshot = await getDocs(collection(db, 'submissions'));
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      if (d.data().assignmentId === id) {
        batch.delete(d.ref);
      }
    });
    await batch.commit();
    return;
  }

  let assignments = await getAssignments();
  assignments = assignments.filter((a) => a.id !== id);
  writeJSON('assignments.json', assignments);

  // Also remove related submissions
  let submissions = await getSubmissions();
  submissions = submissions.filter((s) => s.assignmentId !== id);
  writeJSON('submissions.json', submissions);
}

// ==================== SUBMISSIONS ====================

export async function getSubmissions(subjectId = null) {
  const defaultSubjectId = (await getSubjects())[0]?.id;
  if (db) {
    const snapshot = await getDocs(collection(db, 'submissions'));
    const data = snapshot.docs.map(d => d.data());
    return subjectId ? data.filter(s => (s.subjectId || defaultSubjectId) === subjectId) : data;
  }
  const data = readJSON('submissions.json');
  return subjectId ? data.filter(s => (s.subjectId || defaultSubjectId) === subjectId) : data;
}

export async function getSubmissionsByStudent(studentId, subjectId = null) {
  const submissions = await getSubmissions(subjectId);
  return submissions.filter((s) => s.studentId === studentId);
}

export async function getSubmissionsByAssignment(assignmentId) {
  const submissions = await getSubmissions();
  return submissions.filter((s) => s.assignmentId === assignmentId);
}

export async function getSubmission(studentId, assignmentId) {
  const submissions = await getSubmissions();
  return (
    submissions.find(
      (s) => s.studentId === studentId && s.assignmentId === assignmentId
    ) || null
  );
}

export async function markSubmission(studentId, assignmentId, submitted, score = null, subjectId = null) {
  const submissionId = `${studentId}_${assignmentId}`;
  
  if (db) {
    const docRef = doc(db, 'submissions', submissionId);
    if (submitted || score !== null) {
      const data = {
        studentId,
        assignmentId,
        subjectId,
        submitted: submitted,
        score: score,
        submittedAt: new Date().toISOString(),
      };
      await setDoc(docRef, data);
    } else {
      await deleteDoc(docRef);
    }
    return [];
  }

  let submissions = await getSubmissions();
  submissions = submissions.filter(
    (s) => !(s.studentId === studentId && s.assignmentId === assignmentId)
  );
  
  if (submitted || score !== null) {
    submissions.push({
      studentId,
      assignmentId,
      subjectId,
      submitted: submitted,
      score: score,
      submittedAt: new Date().toISOString(),
    });
  }
  
  writeJSON('submissions.json', submissions);
  return submissions;
}

// ==================== SUMMARY ====================

export async function getSubmissionSummary(subjectId = null) {
  const students = await getStudents();
  const assignments = await getAssignments(subjectId);
  const submissions = await getSubmissions(subjectId);

  const summary = students.map((student) => {
    const studentSubmissions = {};
    assignments.forEach((assignment) => {
      const sub = submissions.find(
        (s) =>
          s.studentId === student.id && s.assignmentId === assignment.id
      );
      studentSubmissions[assignment.id] = sub
        ? { submitted: sub.submitted, score: sub.score, submittedAt: sub.submittedAt, fileName: sub.fileName }
        : { submitted: false, score: null };
    });
    return {
      student,
      submissions: studentSubmissions,
    };
  });

  return { students, assignments, submissions: summary };
}

// ==================== ATTENDANCE ====================
export async function getAttendances(subjectId = null) {
  const defaultSubjectId = (await getSubjects())[0]?.id;
  if (db) {
    const snapshot = await getDocs(collection(db, 'attendances'));
    const data = snapshot.docs.map(d => d.data());
    return subjectId ? data.filter(a => (a.subjectId || defaultSubjectId) === subjectId) : data;
  }
  const data = readJSON('attendances.json');
  return subjectId ? data.filter(a => (a.subjectId || defaultSubjectId) === subjectId) : data;
}

export async function addAttendance(attendance) {
  if (db) {
    await setDoc(doc(db, 'attendances', attendance.id), attendance);
    return attendance;
  }
  const attendances = readJSON('attendances.json');
  attendances.push(attendance);
  writeJSON('attendances.json', attendances);
  return attendance;
}

export async function addAttendancesBatch(atts) {
  if (db) {
    for (let i = 0; i < atts.length; i += 400) {
      const chunk = atts.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const a of chunk) {
        batch.set(doc(db, 'attendances', a.id), a);
      }
      await batch.commit();
    }
    return atts;
  }
  // Fallback for JSON
  const attendances = readJSON('attendances.json');
  attendances.push(...atts);
  writeJSON('attendances.json', attendances);
  return atts;
}

export async function deleteAttendance(id) {
  if (db) {
    await deleteDoc(doc(db, 'attendances', id));
    return true;
  }
  const attendances = readJSON('attendances.json');
  const filtered = attendances.filter(a => a.id !== id);
  writeJSON('attendances.json', filtered);
  return true;
}

export async function deleteAttendancesBatch(ids) {
  if (db) {
    for (let i = 0; i < ids.length; i += 400) {
      const chunk = ids.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const id of chunk) {
        batch.delete(doc(db, 'attendances', id));
      }
      await batch.commit();
    }
    return;
  }
  const attendances = readJSON('attendances.json');
  const idSet = new Set(ids);
  const filtered = attendances.filter(a => !idSet.has(a.id));
  writeJSON('attendances.json', filtered);
}

export async function updateAttendance(id, updates) {
  if (db) {
    const docRef = doc(db, 'attendances', id);
    const d = await getDoc(docRef);
    if (!d.exists()) return null;
    await updateDoc(docRef, updates);
    return { ...d.data(), ...updates };
  }
  
  const attendances = readJSON('attendances.json');
  const index = attendances.findIndex((a) => a.id === id);
  if (index === -1) return null;
  
  attendances[index] = { ...attendances[index], ...updates };
  writeJSON('attendances.json', attendances);
  return attendances[index];
}
