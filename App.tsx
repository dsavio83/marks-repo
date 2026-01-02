
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ExamManager from './pages/ExamManager';
import Reports from './pages/Reports';
import StudentDashboard from './pages/StudentDashboard';
import MarkEntry from './pages/MarkEntry';
import TeacherClasses from './pages/TeacherClasses';
import SectionMarkEntry from './pages/SectionMarkEntry';
import Layout from './components/Layout';
import { authAPI, userAPI, classAPI, subjectAPI, examAPI, markAPI, attendanceAPI, gradeAPI, schoolAPI } from './services/api';
import { getAppState, saveAppState } from './store';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState(() => getAppState());
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Fetch all data from API
  const fetchAllData = async () => {
    try {
      setLoading(true);
      console.log('Fetching all app data from API...');

      // Fetch all data in parallel
      const [
        usersRes,
        classesRes,
        subjectsRes,
        examsRes,
        marksRes,
        assignmentsRes,
        attendanceRes,
        gradesRes,
        schoolRes
      ] = await Promise.all([
        userAPI.getAll().catch(err => { console.error('Users fetch error:', err); return { data: [] }; }),
        classAPI.getAll().catch(err => { console.error('Classes fetch error:', err); return { data: [] }; }),
        subjectAPI.getAll().catch(err => { console.error('Subjects fetch error:', err); return { data: [] }; }),
        examAPI.getAll().catch(err => { console.error('Exams fetch error:', err); return { data: [] }; }),
        markAPI.getAll().catch(err => { console.error('Marks fetch error:', err); return { data: [] }; }),
        classAPI.getAllAssignments().catch(err => { console.error('Assignments fetch error:', err); return { data: [] }; }),
        attendanceAPI.getAll().catch(err => { console.error('Attendance fetch error:', err); return { data: [] }; }),
        gradeAPI.getAll().catch(err => { console.error('Grades fetch error:', err); return { data: [] }; }),
        schoolAPI.get().catch(err => { console.error('School fetch error:', err); return { data: null }; })
      ]);

      console.log('API Data fetched successfully');

      // Update state with fetched data, ensuring we don't overwrite with nulls
      setAppState(prev => ({
        ...prev,
        users: Array.isArray(usersRes.data) ? usersRes.data : prev.users,
        classes: Array.isArray(classesRes.data) ? classesRes.data : prev.classes,
        subjects: Array.isArray(subjectsRes.data) ? subjectsRes.data : prev.subjects,
        exams: Array.isArray(examsRes.data) ? examsRes.data : prev.exams,
        marks: Array.isArray(marksRes.data) ? marksRes.data : prev.marks,
        assignments: Array.isArray(assignmentsRes.data) ? assignmentsRes.data : prev.assignments,
        attendance: Array.isArray(attendanceRes.data) ? attendanceRes.data : prev.attendance,
        gradeSchemes: Array.isArray(gradesRes.data) ? gradesRes.data : prev.gradeSchemes,
        schoolDetails: (schoolRes.data && typeof schoolRes.data === 'object' && Object.keys(schoolRes.data).length > 0)
          ? schoolRes.data
          : prev.schoolDetails
      }));

      setDataLoaded(true);
    } catch (error) {
      console.error('Critical error fetching data:', error);
      setDataLoaded(true); // Still allow app to show (maybe using local data)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Found token, verifying session...');
      // Verify token and get user profile
      authAPI.getProfile()
        .then(response => {
          if (response.data && response.data.id && response.data.role) {
            console.log('Session verified for:', response.data.username);
            setCurrentUser(response.data);
            fetchAllData();
          } else {
            console.error('Invalid profile data received:', response.data);
            localStorage.removeItem('token');
            setDataLoaded(true);
          }
        })
        .catch(err => {
          console.error('Session verification failed:', err.message);
          localStorage.removeItem('token');
          setDataLoaded(true);
        });
    } else {
      setDataLoaded(true);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Fetch data from API after login
    fetchAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setDataLoaded(true); // No need to load data when logged out
  };

  if (!dataLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-bold">Loading data from database...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout user={currentUser} appState={appState} onLogout={handleLogout}>
        <Routes>
          {currentUser.role === UserRole.ADMIN && (
            <>
              <Route path="/admin" element={<AdminDashboard state={appState} setState={setAppState} />} />
              <Route path="/admin/teachers" element={<AdminDashboard state={appState} setState={setAppState} />} />
              <Route path="/admin/classes" element={<AdminDashboard state={appState} setState={setAppState} />} />
              <Route path="/admin/subjects" element={<AdminDashboard state={appState} setState={setAppState} />} />
              <Route path="/admin/grades" element={<AdminDashboard state={appState} setState={setAppState} />} />
              <Route path="/admin/school" element={<AdminDashboard state={appState} setState={setAppState} />} />
              <Route path="/admin/data" element={<AdminDashboard state={appState} setState={setAppState} />} />
              <Route path="*" element={<Navigate to="/admin" />} />
            </>
          )}

          {currentUser.role === UserRole.TEACHER && (
            <>
              <Route path="/teacher" element={<TeacherDashboard teacher={currentUser} state={appState} setState={setAppState} view="dashboard" />} />
              <Route path="/teacher/classes" element={<TeacherClasses teacher={currentUser} state={appState} />} />
              <Route path="/teacher/students" element={<TeacherDashboard teacher={currentUser} state={appState} setState={setAppState} view="students" />} />
              <Route path="/teacher/marks" element={<MarkEntry teacher={currentUser} state={appState} setState={setAppState} />} />
              <Route path="/teacher/section-marks" element={<SectionMarkEntry user={currentUser} state={appState} setState={setAppState} />} />
              <Route path="/teacher/class/:classId" element={<MarkEntry teacher={currentUser} state={appState} setState={setAppState} />} />
              <Route path="/teacher/exams" element={<ExamManager teacher={currentUser} state={appState} setState={setAppState} />} />
              <Route path="/teacher/reports" element={<Reports teacher={currentUser} state={appState} />} />
              <Route path="*" element={<Navigate to="/teacher" />} />
            </>
          )}

          {currentUser.role === UserRole.STUDENT && (
            <>
              <Route path="/student" element={<StudentDashboard student={currentUser} state={appState} setState={setAppState} view="dashboard" />} />
              <Route path="/student/courses" element={<StudentDashboard student={currentUser} state={appState} setState={setAppState} view="courses" />} />
              <Route path="/student/grades" element={<StudentDashboard student={currentUser} state={appState} setState={setAppState} view="grades" />} />
              <Route path="/student/submit-marks" element={<SectionMarkEntry user={currentUser} state={appState} setState={setAppState} />} />
              <Route path="*" element={<Navigate to="/student" />} />
            </>
          )}
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
