import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import StudentAuth from './pages/StudentAuth';
import TeacherAuth from './pages/TeacherAuth';
import SubjectSelection from './pages/SubjectSelection';
import AssignmentList from './pages/AssignmentList';
import TeacherDashboard from './pages/TeacherDashboard';
import { BookOpen } from 'lucide-react';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <div className="header-title">
              <BookOpen className="header-icon" size={24} />
              ระบบส่งงานนักเรียน ม.1 - ม.6
            </div>
          </div>
        </header>

        <main className="container animate-fade-in">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/student-auth" element={<StudentAuth />} />
            <Route path="/teacher-auth" element={<TeacherAuth />} />
            <Route path="/area" element={<SubjectSelection />} />
            <Route path="/area/:subjectId" element={<AssignmentList />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
