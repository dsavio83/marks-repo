
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Users, BookOpen,
  GraduationCap, ClipboardList, BarChart3, Settings,
  ChevronLeft, ChevronRight, Menu, Bell, FileSpreadsheet,
  FolderOpen, UserCog, Building, Layers, Database
} from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  appState?: any; // Added appState prop
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, appState, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = {
    [UserRole.ADMIN]: [
      { icon: <LayoutDashboard size={22} />, label: 'Dashboard', path: '/admin' },
      { icon: <Users size={22} />, label: 'Teachers', path: '/admin/teachers' },
      { icon: <GraduationCap size={22} />, label: 'Classes', path: '/admin/classes' },
      { icon: <BookOpen size={22} />, label: 'Subjects', path: '/admin/subjects' },
      { icon: <Settings size={22} />, label: 'Grades', path: '/admin/grades' },
      { icon: <Building size={22} />, label: 'School Details', path: '/admin/school' },
      { icon: <Database size={22} />, label: 'Data Management', path: '/admin/data' },
    ],
    [UserRole.TEACHER]: [
      { icon: <LayoutDashboard size={22} />, label: 'Dashboard', path: '/teacher' },
      { icon: <Layers size={22} />, label: 'My Classes', path: '/teacher/classes' },
      { icon: <Users size={22} />, label: 'Students', path: '/teacher/students' },
      { icon: <ClipboardList size={22} />, label: 'Mark Entry', path: '/teacher/section-marks' },
      { icon: <FileSpreadsheet size={22} />, label: 'Exams', path: '/teacher/exams' },
      { icon: <BarChart3 size={22} />, label: 'Reports', path: '/teacher/reports' },
    ],
    [UserRole.STUDENT]: [
      { icon: <LayoutDashboard size={22} />, label: 'Dashboard', path: '/student' },
      { icon: <BookOpen size={22} />, label: 'Courses', path: '/student/courses' },
      { icon: <ClipboardList size={22} />, label: 'Submit Marks', path: '/student/submit-marks' },
      { icon: <BarChart3 size={22} />, label: 'Grades', path: '/student/grades' },
    ]
  };

  // Logic to fetch Teacher's Classes (Still used for desktop sidebar quick links)
  let teacherClasses: any[] = [];
  if (user.role === UserRole.TEACHER && appState) {
    const myFormClasses = appState.classes.filter((c: any) =>
      (typeof c.classTeacherId === 'object' ? c.classTeacherId.id : c.classTeacherId) === user.id
    );
    // Note: assignments might not be populated in appState if not fetched. 
    // The current appState in App.tsx doesn't seem to fetch assignments explicitly from an API endpoint, 
    // but relies on what's locally stored or assumes they are part of something else.
    // However, checking App.tsx, assignments are part of default state but not fetched in fetchAllData.
    // We need to rely on what we have. If assignments are key for this, they must be fetched.
    // Assuming assignments are available or we need to derive them.

    // Actually, looking at App.tsx, assignments are NOT fetched from API. This is a problem.
    // But wait, the user says "Class assing and subject teachers assing and save properly show the admin panel".
    // This implies the data exists in the backend. 
    // In the frontend, we need to fetch assignments to know what classes a teacher has.

    // Let's first fix the ID comparison for classTeacherId.

    const mySubjectAssignments = appState.assignments ? appState.assignments.filter((a: any) => a.teacherId === user.id) : [];

    const classMap = new Map();
    // Add form classes first
    myFormClasses.forEach((c: any) => classMap.set(c.id, c));
    // Add subject classes
    mySubjectAssignments.forEach((a: any) => {
      const cls = appState.classes.find((c: any) => c.id === a.classId);
      if (cls) classMap.set(cls.id, cls);
    });
    teacherClasses = Array.from(classMap.values());
  }

  const currentMenu = menuItems[user.role as UserRole] || [];

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-slate-50 overflow-hidden safe-top safe-bottom">
        {/* Mobile Header - More Compact & Premium */}
        <header className="px-4 py-3 flex justify-between items-center bg-white/80 backdrop-blur-xl border-b border-slate-100 z-40 sticky top-0 print:hidden shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-premium ring-2 ring-white">
              <span className="font-bold text-base">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[140px]">{user?.name || 'User'}</h1>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{user?.role || 'Guest'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button className="w-9 h-9 flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl hover:bg-slate-100/50 active:scale-90 transition-all border border-slate-100" aria-label="Notifications"><Bell size={18} /></button>
            <button onClick={onLogout} className="w-9 h-9 flex items-center justify-center text-red-400 bg-red-50/50 rounded-xl hover:bg-red-100/50 active:scale-90 transition-all border border-red-100" aria-label="Logout"><LogOut size={18} /></button>
          </div>
        </header>

        {/* Mobile Content - Optimized Padding */}
        <main className="flex-1 overflow-y-auto bg-slate-50/30 pb-20 p-4 custom-scrollbar">
          <div className="animate-fade-scale max-w-lg mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation - Premium App Style */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 px-1 py-1 flex justify-around items-center z-50 safe-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.04)] print:hidden">
          {currentMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-400 active:scale-90 flex-1 min-w-0 ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-400 ${isActive ? 'bg-blue-600/10 shadow-sm' : 'bg-transparent'}`}>
                  <span className={`${isActive ? 'scale-110' : 'group-hover:scale-105'} transition-all duration-300`}>
                    {React.cloneElement(item.icon as React.ReactElement, { size: isActive ? 18 : 16, strokeWidth: isActive ? 2.5 : 2 })}
                  </span>
                </div>
                <span className={`text-[7px] mt-1 font-black uppercase tracking-tighter truncate w-full text-center transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0 text-blue-600' : 'opacity-60 -translate-y-0.5'}`}>{item.label}</span>
                {isActive && (
                  <div className="absolute -top-1 w-1 h-1 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }


  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside
        className={`${isCollapsed ? 'w-24' : 'w-72'} bg-white border-r border-slate-200 flex flex-col transition-all duration-500 ease-in-out relative z-30 shadow-sm print:hidden`}
      >
        <div className={`p-8 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-100">
                <BookOpen size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-black bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                SS Pro
              </h1>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold">SP</div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {currentMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center w-full px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-200/50 scale-[1.02]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                  }`}
              >
                <span className={`${isCollapsed ? '' : 'mr-4'} ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="text-sm font-bold tracking-tight">{item.label}</span>}
              </button>
            );
          })}

          {/* Teacher's Classes Section - Desktop Quick Links */}
          {user.role === UserRole.TEACHER && teacherClasses.length > 0 && (
            <div className="mt-8">
              {!isCollapsed && <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Quick Access</p>}
              {teacherClasses.map((cls) => {
                const path = `/teacher/class/${cls.id}`;
                const isActive = location.pathname === path;
                const isClassTeacher = cls.classTeacherId === user.id;

                let bgClass = '';
                let textClass = '';

                if (isActive) {
                  bgClass = 'bg-indigo-600 shadow-xl shadow-indigo-200/50 scale-[1.02]';
                  textClass = 'text-white';
                } else {
                  bgClass = 'hover:bg-slate-50';
                  textClass = isClassTeacher
                    ? 'text-blue-700 hover:text-blue-800'
                    : 'text-slate-700 hover:text-slate-900';
                }

                return (
                  <button
                    key={cls.id}
                    onClick={() => navigate(path)}
                    className={`flex items-center w-full px-4 py-3.5 rounded-2xl transition-all duration-300 group ${bgClass} ${textClass}`}
                  >
                    <span className={`${isCollapsed ? '' : 'mr-4'} ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
                      {isClassTeacher ? <UserCog size={20} /> : <FolderOpen size={20} />}
                    </span>
                    {!isCollapsed && (
                      <div className="text-left">
                        <span className="text-sm font-bold tracking-tight block">Class {cls.name}</span>
                        {isClassTeacher && <span className="text-[9px] uppercase tracking-widest opacity-70">Class Teacher</span>}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className={`flex items-center p-3 mb-4 rounded-2xl bg-slate-50 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 min-w-[40px] rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-black text-slate-800 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{user?.role || 'Guest'}</p>
              </div>
            )}
          </div>
          <button
            onClick={onLogout}
            className={`flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={20} className={isCollapsed ? '' : 'mr-4'} />
            {!isCollapsed && <span className="text-sm font-bold">Log out</span>}
          </button>
        </div>

        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-blue-600 shadow-sm z-50 transition-all hover:scale-110"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Desktop Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-slate-50/30 print:bg-white print:overflow-visible">
        <div className="max-w-6xl mx-auto py-10 px-8 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out print:p-0 print:max-w-none">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
