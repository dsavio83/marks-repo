
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { Users, BookOpen, ChevronRight, GraduationCap } from 'lucide-react';

interface TeacherClassesProps {
  teacher: User;
  state: any;
}

const TeacherClasses: React.FC<TeacherClassesProps> = ({ teacher, state }) => {
  const navigate = useNavigate();

  const myFormClasses = state.classes.filter((c: any) =>
    (typeof c.classTeacherId === 'object' ? c.classTeacherId.id : c.classTeacherId) === teacher.id
  );
  const mySubjectAssignments = state.assignments ? state.assignments.filter((a: any) => a.teacherId === teacher.id) : [];

  const classMap = new Map();
  myFormClasses.forEach((c: any) => classMap.set(c.id, { ...c, role: 'Class Teacher' }));
  mySubjectAssignments.forEach((a: any) => {
    const cls = state.classes.find((c: any) => c.id === a.classId);
    if (cls && !classMap.has(cls.id)) {
      classMap.set(cls.id, { ...cls, role: 'Subject Teacher' });
    }
  });

  const teacherClasses = Array.from(classMap.values());

  return (
    <div className="space-y-6 animate-fade-scale">
      <div className="px-2">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Teaching Dashboard</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Classes</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teacherClasses.map((cls: any) => (
          <div
            key={cls.id}
            onClick={() => navigate(`/teacher/class/${cls.id}`)}
            className="native-card !p-5 group active:scale-95 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-[80px] -z-0 opacity-50 group-hover:bg-blue-100 transition-colors"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 font-black text-xl shadow-sm border border-slate-50">
                  {cls.name.substring(0, 2)}
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                  <ChevronRight size={16} />
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-800 leading-tight mb-0.5">Class {cls.name}</h3>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600/70">{cls.role}</span>
                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{cls.section || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center text-[10px] font-black text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100/50">
                  <Users size={12} className="mr-2 text-slate-400" />
                  {state.users.filter((u: any) => u.classId === cls.id && u.role === UserRole.STUDENT).length} STUDENTS
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <GraduationCap size={16} />
                </div>
              </div>
            </div>
          </div>
        ))}

        {teacherClasses.length === 0 && (
          <div className="col-span-full py-20 text-center native-card border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100/50">
              <BookOpen size={28} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No assigned classes found</p>
            <p className="text-slate-300 text-xs mt-2">Please contact administrator for assignments.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherClasses;
