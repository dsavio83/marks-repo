import React, { useState, useMemo, useEffect } from 'react';
import { User, MarkRecord, GradeScheme, Subject, Exam } from '../types';
import {
    Award, Book, Calendar, MapPin, User as UserIcon,
    TrendingUp, Clock, CheckCircle2, AlertCircle,
    ChevronRight, BookOpen, GraduationCap, LayoutDashboard,
    Percent, FileText, Star, Settings, X, Save, Phone, Mail,
    Filter
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { LEARNING_ICONS } from '../constants';
import { userAPI } from '../services/api';

interface StudentDashboardProps {
    student: User;
    state: any;
    setState: React.Dispatch<React.SetStateAction<any>>;
    view: 'dashboard' | 'courses' | 'grades';
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ student, state, setState, view }) => {
    const [selectedExamId, setSelectedExamId] = useState<string>('all');
    const [showBioModal, setShowBioModal] = useState(false);

    // Bio Form State
    const [bioForm, setBioForm] = useState({
        dob: '',
        fatherName: '',
        motherName: '',
        address: '',
        mobile: '',
        email: '',
        category: '',
        bloodGroup: '' // Extra field if needed later, but keeping to standard User type for now
    });

    useEffect(() => {
        if (student) {
            setBioForm({
                dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
                fatherName: student.fatherName || '',
                motherName: student.motherName || '',
                address: student.address || '',
                mobile: student.mobile || '',
                email: student.email || '',
                category: student.category || '',
                bloodGroup: ''
            });
        }
    }, [student]);

    const myClass = state.classes.find((c: any) => c.id === student.classId);
    const myStudents = state.users.filter((u: any) => u.classId === student.classId && u.role === 'STUDENT');

    // Logic to find subjects and assigned teachers
    const mySubjects = state.subjects.map((sub: Subject) => {
        const assignment = state.assignments.find((a: any) => a.classId === myClass?.id && a.subjectId === sub.id);
        if (assignment) {
            return {
                ...sub,
                teacher: state.users.find((u: any) => u.id === assignment.teacherId),
                assignmentId: assignment.id
            };
        }
        return null;
    }).filter(Boolean);

    // Filter exams that belong to this class
    const myExams = useMemo(() => state.exams.filter((e: any) => e.classId === myClass?.id), [state.exams, myClass]);

    // Exam Selection Logic
    const filteredExams = useMemo(() => {
        if (selectedExamId === 'all') return myExams;
        return myExams.filter((e: any) => e.id === selectedExamId);
    }, [selectedExamId, myExams]);

    // Grade Logic
    const applicableScheme = state.gradeSchemes.find((s: any) => s.applicableClasses.includes(myClass?.gradeLevel));
    const getGrade = (percent: number) => {
        if (!applicableScheme) return '-';
        const boundary = applicableScheme.boundaries.find((b: any) => percent >= b.minPercent);
        return boundary ? boundary.grade : 'F';
    };

    const calculateStudentPerformance = (studentId: string, examsToUse: any[]) => {
        let totalMax = 0;
        let totalObtained = 0;
        let examResults: any[] = [];
        let totalPercentageSum = 0;
        let examsCounted = 0;

        examsToUse.forEach((exam: any) => {
            let examMax = 0;
            let examObt = 0;

            exam.subjectConfigs.forEach((conf: any) => {
                if (!conf.included) return;
                const mark = state.marks.find((m: any) => m.examId === exam.id && m.subjectId === conf.subjectId && m.studentId === studentId);

                const te = parseInt(mark?.teMark === 'A' ? '0' : mark?.teMark || '0');
                const ce = parseInt(mark?.ceMark === 'A' ? '0' : mark?.ceMark || '0');
                const max = (conf.maxTe || 0) + (conf.maxCe || 0);

                examMax += max;
                examObt += (te + ce);
            });

            if (examMax > 0) {
                const percent = (examObt / examMax) * 100;
                examResults.push({
                    id: exam.id,
                    name: exam.name,
                    percentage: percent,
                    total: examObt,
                    max: examMax
                });
                totalPercentageSum += percent;
                examsCounted++;
                totalMax += examMax;
                totalObtained += examObt;
            }
        });

        return {
            overallPercentage: examsCounted > 0 ? (totalPercentageSum / examsCounted) : 0,
            examResults,
            totalObtained,
            totalMax
        };
    };

    const myPerformance = useMemo(() => calculateStudentPerformance(student.id, filteredExams), [student.id, filteredExams, state.marks]);

    // Rank Calculation (Always Global based on ALL exams unless specific needed, usually rank is cumulative)
    // However, if a user filters by exam, they might want rank in THAT exam.
    const myRank = useMemo(() => {
        if (filteredExams.length === 0) return '-';

        const classPerformance = myStudents.map((s: any) => ({
            id: s.id,
            ...calculateStudentPerformance(s.id, filteredExams)
        }));

        classPerformance.sort((a: any, b: any) => b.overallPercentage - a.overallPercentage);

        const rank = classPerformance.findIndex((p: any) => p.id === student.id) + 1;
        return rank > 0 ? rank : '-';
    }, [myStudents, filteredExams, state.marks]);

    // Attendance
    const attendance = useMemo(() => {
        if (filteredExams.length === 0) return '0';
        // Average attendance across filtered exams or latest?
        // Let's take average if multiple, or exact if one.
        let totalAtt = 0;
        let count = 0;
        filteredExams.forEach((exam: any) => {
            const att = state.attendance.find((a: any) => a.examId === exam.id && a.studentId === student.id);
            if (att) {
                totalAtt += parseFloat(att.percentage);
                count++;
            } else {
                totalAtt += 95; // Default mock if missing
                count++;
            }
        });
        return count > 0 ? (totalAtt / count).toFixed(1) : '95';
    }, [filteredExams, state.attendance, student.id]);

    const handleSaveBio = async () => {
        try {
            const updatedUser = { ...student, ...bioForm };
            await userAPI.update(student.id, updatedUser);

            // Update local state
            setState((prev: any) => ({
                ...prev,
                users: prev.users.map((u: User) => u.id === student.id ? updatedUser : u)
            }));

            setShowBioModal(false);
            // Optional: Success toast
        } catch (error) {
            console.error("Failed to update bio", error);
            alert("Failed to update profile. Please try again.");
        }
    };

    // --- MODAL ---
    const renderBioModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-black text-slate-800">Edit Profile</h2>
                        <p className="text-xs text-slate-500 font-medium">Update your personal information</p>
                    </div>
                    <button onClick={() => setShowBioModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Date of Birth</label>
                            <input type="date" value={bioForm.dob} onChange={e => setBioForm({ ...bioForm, dob: e.target.value })}
                                className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mobile</label>
                            <input type="text" value={bioForm.mobile} onChange={e => setBioForm({ ...bioForm, mobile: e.target.value })} placeholder="Mobile No"
                                className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Father's Name</label>
                            <input type="text" value={bioForm.fatherName} onChange={e => setBioForm({ ...bioForm, fatherName: e.target.value })}
                                className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mother's Name</label>
                            <input type="text" value={bioForm.motherName} onChange={e => setBioForm({ ...bioForm, motherName: e.target.value })}
                                className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Address</label>
                        <textarea value={bioForm.address} onChange={e => setBioForm({ ...bioForm, address: e.target.value })} rows={3}
                            className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Email</label>
                        <input type="email" value={bioForm.email} onChange={e => setBioForm({ ...bioForm, email: e.target.value })}
                            className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button onClick={() => setShowBioModal(false)} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSaveBio} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-colors flex items-center justify-center gap-2">
                        <Save size={14} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );

    // --- VIEW: DASHBOARD ---
    const renderDashboard = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Filter */}
            <div className="flex justify-between items-center px-1">
                <h1 className="text-xl font-black text-slate-800 tracking-tight">Dashboard Overview</h1>
                <div className="relative">
                    <select
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
                    >
                        <option value="all">All Exams</option>
                        {myExams.map((exam: any) => (
                            <option key={exam.id} value={exam.id}>{exam.name}</option>
                        ))}
                    </select>
                    <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>

            {/* Welcome Banner */}
            <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center space-x-5">
                        <div className="w-18 h-18 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl font-black shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                            {student.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10">Student</span>
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            </div>
                            <h1 className="text-3xl font-black leading-tight tracking-tight">Hello, {student.name.split(' ')[0]}!</h1>
                            <p className="text-blue-100/90 font-bold text-xs mt-1 uppercase tracking-wider flex items-center gap-2">
                                Class {myClass?.name} <span className="w-1 h-1 rounded-full bg-blue-300"></span> Roll #{student.admissionNo}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center min-w-[100px] hover:bg-white/20 transition-colors">
                            <p className="text-[9px] uppercase font-black text-blue-200 mb-1 tracking-widest">Class Rank</p>
                            <p className="text-2xl font-black tracking-tight">{myRank}<span className="text-[10px] font-bold opacity-60 ml-1 aline-top">/ {myStudents.length}</span></p>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-indigo-500/30 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><CheckCircle2 size={20} /></div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Attendance</p>
                            <h3 className="text-xl font-black text-slate-800">{attendance}%</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Percent size={20} /></div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Avg. Score</p>
                            <h3 className="text-xl font-black text-slate-800">{myPerformance.overallPercentage.toFixed(1)}%</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100 hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600"><Star size={20} /></div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Marks</p>
                            <h3 className="text-xl font-black text-slate-800">{myPerformance.totalObtained} <span className="text-[10px] text-slate-300 font-bold">/ {myPerformance.totalMax}</span></h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 mb-6 flex items-center uppercase tracking-widest">
                        <TrendingUp className="mr-2 text-blue-500" size={16} /> Performance Trend
                    </h3>
                    <div className="h-48 w-full mt-2">
                        {myPerformance.examResults.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={myPerformance.examResults}>
                                    <defs>
                                        <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} domain={[0, 100]} width={25} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorPerf)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest">No Data Available</div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-4 right-4 animate-fade-in">
                        <button onClick={() => setShowBioModal(true)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            <Settings size={14} />
                        </button>
                    </div>
                    <h3 className="text-xs font-black text-slate-800 mb-6 flex items-center uppercase tracking-widest">
                        <UserIcon className="mr-2 text-indigo-500" size={16} /> Student Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-3 relative z-10">
                        {[
                            {
                                label: "DOB",
                                val: student.dob ? (() => {
                                    try {
                                        const d = new Date(student.dob);
                                        return `${d.getDate()} ${d.toLocaleString('default', { month: 'long' })}, ${d.getFullYear()}`;
                                    } catch { return student.dob }
                                })() : 'Not Listed',
                                icon: Calendar,
                                color: 'text-blue-500 bg-blue-50'
                            },
                            { label: "Phone", val: student.mobile, icon: Phone, color: 'text-emerald-500 bg-emerald-50' },
                            { label: "Father", val: student.fatherName, icon: UserIcon, color: 'text-indigo-500 bg-indigo-50' },
                            { label: "Email", val: student.email, icon: Mail, color: 'text-rose-500 bg-rose-50' },
                            { label: "Category", val: student.category, icon: Award, color: 'text-purple-500 bg-purple-50' },
                            { label: "Address", val: student.address, icon: MapPin, color: 'text-orange-500 bg-orange-50' },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col p-3 bg-slate-50/80 rounded-2xl border border-slate-100/50">
                                <div className="flex justify-between items-start mb-1">
                                    <item.icon size={14} className={`${item.color.split(' ')[0]} mb-2`} />
                                </div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{item.label}</p>
                                <p className="text-[11px] font-bold text-slate-800 truncate">{item.val || '—'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // --- VIEW: COURSES ---
    const renderCourses = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end px-2">
                <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">My Journey</p>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Active Subjects</h1>
                </div>
                <div className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
                    {mySubjects.length} Courses
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mySubjects.map((sub: any, idx) => {
                    const iconObj = LEARNING_ICONS.find(i => sub.name.trim().toLowerCase().includes(i.label.toLowerCase())) || LEARNING_ICONS[idx % LEARNING_ICONS.length];

                    // Generate consistent color for teacher
                    const getTeacherColor = (name: string) => {
                        const colors = [
                            'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-500',
                            'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500',
                            'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
                        ];
                        let hash = 0;
                        for (let i = 0; i < name.length; i++) {
                            hash = name.charCodeAt(i) + ((hash << 5) - hash);
                        }
                        return colors[Math.abs(hash) % colors.length];
                    };
                    const teacherColor = sub.teacher?.name ? getTeacherColor(sub.teacher.name) : 'bg-slate-400';

                    return (
                        <div key={sub.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 group hover:border-blue-200 transition-all relative overflow-hidden hover:shadow-md">
                            <div className={`absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br ${iconObj.color.replace('text-', 'from-').replace('400', '100')} to-transparent rounded-full opacity-20 group-hover:scale-110 transition-transform`}></div>

                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-slate-50">
                                    <span className={`${iconObj.color} text-2xl`}>{iconObj.icon}</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 leading-tight mb-1">{sub.name}</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">{sub.shortCode || 'CORE'}</p>

                                <div className="flex items-center gap-3 pt-5 border-t border-slate-50">
                                    <div className={`w-8 h-8 ${teacherColor} rounded-2xl flex items-center justify-center text-white font-black text-[10px] shadow-sm shadow-blue-500/10`}>
                                        {sub.teacher?.name.charAt(0) || 'T'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Instructor</p>
                                        <p className="text-[11px] font-bold text-slate-700 truncate">{sub.teacher?.name || 'Not Assigned'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );

    // --- VIEW: GRADES ---
    const renderGrades = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end px-2">
                <div>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Academic Performance</p>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Exam Analysis</h1>
                </div>
                <div className="relative">
                    <select
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
                    >
                        <option value="all">All Exams</option>
                        {myExams.map((exam: any) => (
                            <option key={exam.id} value={exam.id}>{exam.name}</option>
                        ))}
                    </select>
                    <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>

            {filteredExams.length > 0 ? filteredExams.map((exam: any) => {
                // Calculate results for this specific exam
                let examMax = 0;
                let examObt = 0;
                const subjectsData = exam.subjectConfigs
                    .filter((c: any) => c.included)
                    .map((conf: any) => {
                        const sub = state.subjects.find((s: any) => s.id === conf.subjectId);
                        const mark = state.marks.find((m: any) => m.examId === exam.id && m.subjectId === conf.subjectId && m.studentId === student.id);

                        const te = mark?.teMark === 'A' ? 0 : parseInt(mark?.teMark || '0');
                        const ce = mark?.ceMark === 'A' ? 0 : parseInt(mark?.ceMark || '0');
                        const total = te + ce;
                        const max = (conf.maxTe || 0) + (conf.maxCe || 0);
                        const percent = max > 0 ? (total / max) * 100 : 0;

                        examMax += max;
                        examObt += total;

                        return {
                            name: sub?.name,
                            shortCode: sub?.shortCode,
                            te: mark?.teMark || '-',
                            ce: mark?.ceMark || '-',
                            total,
                            max,
                            grade: getGrade(percent),
                            isPass: percent >= 35,
                            percent: percent
                        };
                    });

                const examPercent = examMax > 0 ? (examObt / examMax) * 100 : 0;
                const examGrade = getGrade(examPercent);
                const isPass = examPercent >= 35;

                return (
                    <div key={exam.id} className="bg-white rounded-3xl overflow-hidden mb-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="p-5 flex justify-between items-center bg-slate-50/50 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                    <FileText size={24} />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-black text-slate-800 text-sm truncate">{exam.name}</h3>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{subjectsData.length} Subjects</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="text-right">
                                    <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Overall</p>
                                    <p className={`text-lg font-black ${isPass ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {examPercent.toFixed(1)}% <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[10px] ml-1 text-slate-600">{examGrade}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-50">
                            {subjectsData.map((row: any, idx: number) => (
                                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                {row.shortCode || row.name.substring(0, 3).toUpperCase()}
                                            </span>
                                            <div>
                                                <p className="font-bold text-slate-800 text-xs truncate">{row.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden sm:block text-right">
                                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Marks</p>
                                            <p className="text-xs font-black text-slate-800">{row.total}<span className="text-[9px] text-slate-300 ml-0.5">/{row.max}</span></p>
                                        </div>
                                        <div className="text-right w-16">
                                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Grade</p>
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={`text-[9px] font-black ${row.isPass ? 'text-emerald-500' : 'text-rose-500'} uppercase`}>{row.isPass ? 'Pass' : 'Fail'}</span>
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-700 border border-slate-200">
                                                    {row.grade}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }) : (
                <div className="bg-white rounded-3xl py-20 text-center text-slate-400 font-bold opacity-50 border border-slate-100 border-dashed">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={28} />
                    </div>
                    No exam records found.
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-0 pb-10">
            {view === 'dashboard' && renderDashboard()}
            {view === 'courses' && renderCourses()}
            {view === 'grades' && renderGrades()}
            {showBioModal && renderBioModal()}
        </div>
    );
};

export default StudentDashboard;
