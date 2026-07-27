const fs = require('fs');
const path = 'src/app/admin/page.js';
let code = fs.readFileSync(path, 'utf8');

const regex1 = /const students = \(data\.students \|\| \[\]\)\.filter\(s => isStudentInSubject\(s\.room\)\);\s*const summaryData = \(data\.submissions \|\| \[\]\)\.filter\(s => isStudentInSubject\(s\.student\?\.room\)\);\s*const assignments = data\.assignments \|\| \[\];\s*\/\/ Stats\s*const totalStudents = students\.length;\s*const totalAssignments = assignments\.length;\s*const totalExpected = totalStudents \* totalAssignments;\s*const totalSubmitted = summaryData\.reduce\(\(acc, s\) => \{\s*return acc \+ Object\.values\(s\.submissions\)\.filter\(\(v\) => v\.submitted\)\.length;\s*\}, 0\);\s*const submitRate = totalExpected > 0 \? Math\.round\(\(totalSubmitted \/ totalExpected\) \* 100\) : 0;/g;

const replacement1 = `  const { students, summaryData, assignments } = useMemo(() => {
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

code = code.replace(regex1, replacement1);

const regex2 = /\/\/ unique rooms for filter\s*const rooms = \[\.\.\.new Set\(summaryData\.map\(s => s\.student\.room \|\| ''\)\.filter\(Boolean\)\)\]\.sort\(\);\s*\/\/ filtered students\s*const filteredStudents = filterRoom \? summaryData\.filter\(s => s\.student\.room === filterRoom\) : summaryData;/g;
const replacement2 = `          // unique rooms for filter
          const rooms = useMemo(() => [...new Set(summaryData.map(s => s.student.room || '').filter(Boolean))].sort(), [summaryData]);
          // filtered students
          const filteredStudents = useMemo(() => filterRoom ? summaryData.filter(s => s.student.room === filterRoom) : summaryData, [summaryData, filterRoom]);`;

code = code.replace(regex2, replacement2);

fs.writeFileSync(path, code);
console.log("Regex replacements applied.");
