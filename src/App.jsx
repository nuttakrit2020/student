import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProfileSelection from './pages/ProfileSelection';
import SubjectSelection from './pages/SubjectSelection';
import AssignmentList from './pages/AssignmentList';
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
            <Route path="/" element={<ProfileSelection />} />
            <Route path="/area" element={<SubjectSelection />} />
            <Route path="/area/:subjectId" element={<AssignmentList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
