
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

  // Logic to fetch Teacher's Classes (Same as Layout)
  // Logic to fetch Teacher's Classes (Same as Layout)
  const myFormClasses = state.classes.filter((c: any) =>
    (typeof c.classTeacherId === 'object' ? c.classTeacherId.id : c.classTeacherId) === teacher.id
  );
  const mySubjectAssignments = state.assignments ? state.assignments.filter((a: any) => a.teacherId === teacher.id) : [];

  const classMap = new Map();
  // Add form classes
  myFormClasses.forEach((c: any) => classMap.set(c.id, { ...c, role: 'Class Teacher' }));
  // Add subject classes
  mySubjectAssignments.forEach((a: any) => {
    const cls = state.classes.find((c: any) => c.id === a.classId);
    if (cls && !classMap.has(cls.id)) {
      classMap.set(cls.id, { ...cls, role: 'Subject Teacher' });
    }
  });

  const teacherClasses = Array.from(classMap.values());

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-12">
          <h1 className="text-3xl font-black text-slate-900">My Classes</h1>
          <p className="text-slate-400 font-bold">Manage marks and view details for your classes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teacherClasses.map((cls: any) => (
          <div key={cls.id} onClick={() => navigate(`/teacher/class/${cls.id}`)} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:shadow-xl transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl">
                {cls.name.substring(0, 2)}
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ChevronRight size={20} />
              </div>
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-1">Class {cls.name}</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">{cls.role}</p>

            <div className="flex gap-2">
              <div className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                <Users size={14} className="mr-2" />
                {state.users.filter((u: any) => u.classId === cls.id && u.role === UserRole.STUDENT).length} Students
              </div>
            </div>
          </div>
        ))}

        {teacherClasses.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <BookOpen size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold">No classes assigned to you.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherClasses;
