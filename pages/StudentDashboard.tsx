import React, { useState, useMemo, useEffect } from 'react';
import { User, Subject } from '../types';
import {
    Award, Book, Calendar, MapPin, User as UserIcon,
    TrendingUp, CheckCircle2, AlertCircle,
    ChevronRight, Percent, FileText, Star, Settings, X, Save, Phone, Mail,
    Filter, Home, GraduationCap, Layout as LayoutIcon, BrainCircuit,
    ArrowUpRight, Sparkles, ChevronLeft, BookOpen, Droplets, CreditCard, Palette
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { LEARNING_ICONS } from '../constants';
import { userAPI } from '../services/api';

interface StudentDashboardProps {
    student: User;
    state: any;
    setState: React.Dispatch<React.SetStateAction<any>>;
    view: 'dashboard' | 'courses' | 'grades';
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ student, state, setState, view: initialView }) => {
    // Navigation State
    const [activeTab, setActiveTab] = useState<string>('dashboard');

    useEffect(() => {
        if (initialView) setActiveTab(initialView);
    }, [initialView]);

    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [showBioModal, setShowBioModal] = useState(false);
    const [selectedAiAnalysis, setSelectedAiAnalysis] = useState<any | null>(null);

    // Bio Form State
    const [bioForm, setBioForm] = useState({
        dob: '',
        fatherName: '',
        motherName: '',
        address: '',
        mobile: '',
        email: '',
        category: '',
        bloodGroup: ''
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

    // Derived Data
    const myClass = state.classes.find((c: any) => c.id === student.classId);
    const myStudents = state.users.filter((u: any) => u.classId === student.classId && u.role === 'STUDENT');

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

    const myExams = useMemo(() => {
        const exams = state.exams.filter((e: any) => e.classId === myClass?.id);
        return exams.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }, [state.exams, myClass]);

    // Auto-select the first exam on load
    useEffect(() => {
        if (myExams.length > 0 && selectedExamId === '') {
            setSelectedExamId(myExams[0].id);
        }
    }, [myExams]);

    const filteredExams = useMemo(() => {
        if (selectedExamId === 'all') return myExams;
        return myExams.filter((e: any) => e.id === selectedExamId);
    }, [selectedExamId, myExams]);

    const applicableScheme = state.gradeSchemes.find((s: any) => s.applicableClasses.includes(myClass?.gradeLevel));

    // Strict Grade Logic
    const getGrade = (percent: number) => {
        // Hardcoded Logic for Class 5-8 and 9-10
        let level = 0;
        if (myClass && myClass.gradeLevel) {
            const match = String(myClass.gradeLevel).match(/\d+/);
            if (match) {
                level = parseInt(match[0], 10);
            }
        }

        // Scheme for 9 and 10
        if (level === 9 || level === 10) {
            if (percent >= 90) return 'A+';
            if (percent >= 80) return 'A';
            if (percent >= 70) return 'B+';
            if (percent >= 60) return 'B';
            if (percent >= 50) return 'C+';
            if (percent >= 40) return 'C';
            if (percent >= 30) return 'D+';
            if (percent >= 20) return 'D';
            return 'E';
        }

        // Scheme for 5 to 8
        if (level >= 5 && level <= 8) {
            if (percent >= 80) return 'A';
            if (percent >= 60) return 'B';
            if (percent >= 40) return 'C';
            if (percent >= 30) return 'D';
            return 'E';
        }

        if (!applicableScheme) return '-';
        // Ensure boundaries are sorted descending
        const sorted = [...applicableScheme.boundaries].sort((a: any, b: any) => b.minPercent - a.minPercent);
        const boundary = sorted.find((b: any) => percent >= b.minPercent);
        return boundary ? boundary.grade : 'F';
    };

    // Color Helpers
    const getGradeColor = (grade: string) => {
        if (grade === 'F') return 'text-red-600';
        if (grade?.startsWith('A')) return 'text-emerald-600';
        return 'text-slate-800';
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

    const attendance = useMemo(() => {
        if (filteredExams.length === 0) return '0';
        let totalAtt = 0;
        let count = 0;
        filteredExams.forEach((exam: any) => {
            const att = state.attendance.find((a: any) => a.examId === exam.id && a.studentId === student.id);
            if (att) {
                totalAtt += parseFloat(att.percentage);
                count++;
            } else {
                totalAtt += 95;
                count++;
            }
        });
        return count > 0 ? (totalAtt / count).toFixed(1) : '95';
    }, [filteredExams, state.attendance, student.id]);


    // Helper to render exam card
    const renderExamCard = (exam: any, detailed: boolean = false) => {
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

                const grade = getGrade(percent);

                return {
                    id: sub?.id,
                    name: sub?.name,
                    shortCode: sub?.shortCode,
                    te: mark?.teMark || '-',
                    ce: mark?.ceMark || '-',
                    total: mark?.teMark === 'A' ? 'A' : total,
                    max,
                    grade,
                    isPass: percent >= 35,
                    percent: percent,
                    aiAdvice: mark?.aiAdvice,
                    aiAnalysis: mark?.aiAnalysis,
                    teacher: sub?.teacher
                };
            });

        const examPercent = examMax > 0 ? (examObt / examMax) * 100 : 0;
        const examGrade = getGrade(examPercent);
        const isPass = examPercent >= 35;

        if (detailed) {
            return (
                <div key={exam.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-black text-slate-800 mb-1">{exam.name}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Report Card</p>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {isPass ? 'PASS' : 'FAIL'}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[9px] uppercase font-black tracking-wider text-slate-400">
                                <tr>
                                    <th className="p-4 pl-6">Subject</th>
                                    <th className="p-4 text-center">Marks</th>
                                    <th className="p-4 text-center">Grade</th>
                                    <th className="p-4 text-center pr-6">Analysis</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                                {subjectsData.map((sub: any, i: number) => (
                                    <tr key={i} onClick={() => setSelectedAiAnalysis(sub)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                                        <td className="p-4 pl-6 text-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 h-8 rounded-full ${sub.isPass ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                                                <div>
                                                    <p>{sub.name}</p>
                                                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{sub.shortCode}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-slate-900 text-sm">{sub.total}</span>
                                            <span className="text-slate-400 text-[10px] ml-1">/ {sub.max}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-md text-[10px] border ${sub.isPass ? 'bg-white border-slate-200 text-slate-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                                {sub.grade}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center pr-6">
                                            <button className="p-2 rounded-full hover:bg-blue-50 text-blue-500 transition-colors">
                                                <BrainCircuit size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50/80 border-t-2 border-slate-100">
                                    <td className="p-4 pl-6 font-black uppercase text-[10px] tracking-widest text-slate-500">Total Score</td>
                                    <td className="p-4 text-center font-black text-slate-800 text-sm">{examObt} <span className="text-slate-400 font-bold text-[10px]">/ {examMax}</span></td>
                                    <td className={`p-4 text-center font-black ${getGradeColor(examGrade)} text-sm`}>{examGrade}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Percentage</p>
                            <p className="text-lg font-black text-blue-600">{examPercent.toFixed(1)}%</p>
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Result</p>
                            <p className={`text-lg font-black ${isPass ? 'text-emerald-500' : 'text-rose-500'}`}>{isPass ? 'Passed' : 'Failed'}</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div key={exam.id} onClick={() => { setSelectedExamId(exam.id); setActiveTab('grades'); }} className="group bg-white rounded-3xl p-5 border border-slate-100 shadow-md shadow-slate-200/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className="inline-block px-2 py-1 rounded-md bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-wider mb-2">Exam</span>
                        <h3 className="text-base font-black text-slate-800 leading-tight">{exam.name}</h3>
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-lg ${isPass ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'}`}>
                        {examGrade}
                    </div>
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Score</p>
                        <p className="text-xl font-black text-slate-700">{examObt}<span className="text-[10px] text-slate-400 font-bold">/{examMax}</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
                        <p className="text-xl font-black text-blue-600">{examPercent.toFixed(0)}%</p>
                    </div>
                </div>
            </div>
        );
    };

    const handleSaveBio = async () => {
        try {
            const updatedUser = { ...student, ...bioForm };
            await userAPI.update(student.id, updatedUser);
            setState((prev: any) => ({
                ...prev,
                users: prev.users.map((u: User) => u.id === student.id ? updatedUser : u)
            }));
            setShowBioModal(false);
        } catch (error) {
            console.error("Failed to update bio", error);
            alert("Failed to update profile.");
        }
    };

    // --- SUB-COMPONENTS ---
    const ExamSelector = () => (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-6">
            <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Exam</label>
                <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer text-slate-700"
                >
                    <option value="all">All Exams Summary</option>
                    {myExams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </div>
        </div>
    );

    const BottomNav = () => (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40 md:hidden">
            {[
                { id: 'dashboard', icon: Home, label: 'Home' },
                { id: 'courses', icon: Book, label: 'Subjects' },
                { id: 'grades', icon: Award, label: 'Results' },
                { id: 'profile', icon: UserIcon, label: 'Profile' },
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center gap-1 transition-colors ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`}
                >
                    <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                    <span className="text-[9px] font-bold uppercase tracking-wide">{item.label}</span>
                </button>
            ))}
        </div>
    );

    const AiAnalysisPage = () => {
        if (!selectedAiAnalysis) return null;
        const { subjectName, advice, analysis, score, max, grade, teacher, te, ce } = selectedAiAnalysis;

        return (
            <div className="fixed inset-0 bg-slate-50 z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="p-6 pb-24 max-w-lg mx-auto">
                    <button onClick={() => setSelectedAiAnalysis(null)} className="flex items-center gap-2 text-slate-500 font-bold text-sm mb-6 hover:text-blue-600 transition-colors">
                        <ChevronLeft size={18} /> Back to Report
                    </button>

                    <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
                        <div className="relative z-10 text-center">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl mx-auto flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
                                <BrainCircuit size={32} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 mb-1">{subjectName}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Performance Insight</p>

                            <div className="mt-6 flex justify-center gap-6 divide-x divide-slate-100">
                                <div className="text-center px-4">
                                    <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1">Total</p>
                                    <p className="text-2xl font-black text-slate-800">{score}<span className="text-xs text-slate-400 font-bold">/{max}</span></p>
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1">Grade</p>
                                    <p className={`text-2xl font-black ${getGradeColor(grade)}`}>{grade}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-center gap-4 text-xs font-bold text-slate-500">
                                <span>TE: {te}</span>
                                <span>CE: {ce}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Sparkles size={14} className="text-blue-500" /> Key Observations
                            </h3>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                {analysis || "Detailed analysis is pending for this subject."}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-3xl border border-emerald-100/50 shadow-sm">
                            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <ArrowUpRight size={14} className="text-emerald-600" /> Action Plan
                            </h3>
                            <p className="text-sm font-bold text-emerald-700 leading-relaxed italic">
                                "{advice || "Continue consistent practice to improve further."}"
                            </p>
                        </div>
                        {teacher && (
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
                                    {teacher.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Subject Teacher</p>
                                    <p className="text-sm font-bold text-slate-800">{teacher.name}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const HomeView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 pt-4">
            {/* Header */}
            <div className="flex justify-between items-center text-slate-800">
                <div>
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        Hi, {student.name.split(' ')[0]} <span className="text-2xl">👋</span>
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Class {myClass?.name} Student</p>
                </div>
                <div onClick={() => setActiveTab('profile')} className="w-11 h-11 bg-white rounded-full overflow-hidden border-2 border-slate-100 shadow-sm cursor-pointer p-1">
                    <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <UserIcon size={20} />
                    </div>
                </div>
            </div>

            {/* Exam Selector in Dashboard */}
            <ExamSelector />

            {/* Selected Exam Section */}
            {filteredExams.length > 0 ? (
                <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Star size={16} className="text-amber-500 fill-amber-500" />
                            {selectedExamId === 'all' ? 'Latest Result' : 'Selected Result'}
                        </h3>
                        <button onClick={() => setActiveTab('grades')} className="text-[10px] font-black text-blue-600 uppercase tracking-wider hover:underline">View Full Report</button>
                    </div>
                    {/* Render the selected exam (or latest if 'all') */}
                    {renderExamCard(selectedExamId === 'all' ? myExams[0] : filteredExams[0], false)}
                </div>
            ) : (
                <div className="bg-slate-50 rounded-3xl p-8 text-center border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No exams available yet</p>
                </div>
            )}

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Class Rank</p>
                        <h2 className="text-4xl font-black text-white">{myRank}</h2>
                        <p className="text-[9px] font-bold text-slate-500 mt-1">Top {Math.min(5, myStudents.length)} in class</p>
                    </div>
                    <Award className="absolute -bottom-4 -right-4 text-slate-800" size={80} />
                </div>
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Attendance</p>
                        <h2 className="text-4xl font-black text-slate-800">{attendance}<span className="text-lg">%</span></h2>
                        <p className="text-[9px] font-bold text-emerald-500 mt-1">Good Record</p>
                    </div>
                    <CheckCircle2 className="absolute -bottom-4 -right-4 text-slate-50" size={80} />
                </div>
            </div>

            {/* Performance Graph */}
            {myPerformance.examResults.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={14} className="text-blue-500" /> Progress
                        </h3>
                    </div>
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={myPerformance.examResults}>
                                <defs>
                                    <linearGradient id="colorWaveHome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="percentage" stroke="#3b82f6" strokeWidth={3} fill="url(#colorWaveHome)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );

    const ExamsView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 pt-4">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Exam Results</h1>
                </div>
                {/* Exam Selector in Results */}
                <ExamSelector />
            </div>

            {/* If 'all' is selected, show list of cards. If specific, show detailed table */}
            {selectedExamId === 'all' ? (
                <div className="grid grid-cols-1 gap-4">
                    {myExams.length > 0 ? myExams.map((e: any) => renderExamCard(e, false)) : (
                        <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase">No exams found</div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredExams.map((e: any) => renderExamCard(e, true))}
                </div>
            )}
        </div>
    );

    const SubjectsView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight pt-2">My Subjects</h1>
            <div className="grid grid-cols-2 gap-3">
                {mySubjects.map((sub: any, idx) => {
                    const iconObj = LEARNING_ICONS.find(i => sub.name.trim().toLowerCase().includes(i.label.toLowerCase())) || LEARNING_ICONS[idx % LEARNING_ICONS.length];
                    return (
                        <div key={sub.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden group hover:shadow-md transition-all">
                            {/* Hover Animation Background */}
                            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br ${iconObj.color.replace('text-', 'from-').replace('600', '100').replace('500', '100')} to-transparent rounded-full opacity-0 group-hover:scale-150 group-hover:opacity-20 transition-all duration-500`}></div>

                            <div className="relative z-10 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-50">
                                <span className={iconObj.color}>{iconObj.icon}</span>
                            </div>
                            <div className="relative z-10">
                                <h3 className="font-bold text-slate-800 text-xs line-clamp-1">{sub.name}</h3>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-0.5">{sub.shortCode || 'SUB'}</p>
                            </div>
                            <div className="relative z-10 w-full pt-3 border-t border-slate-50 mt-1">
                                <p className="text-[9px] font-bold text-slate-500 truncate">{sub.teacher?.name || 'Assigned soon'}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const ProfileView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="relative mt-4 mb-10">
                <div className="h-32 bg-slate-900 rounded-[2.5rem] w-full absolute top-0 z-0"></div>
                <div className="relative z-10 pt-16 text-center">
                    <div className="w-28 h-28 bg-white p-1.5 rounded-full mx-auto shadow-xl">
                        <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-4xl text-slate-400 font-black">
                            {student.name.charAt(0)}
                        </div>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 mt-3">{student.name}</h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Class {myClass?.name} • Roll - {student.admissionNo}</p>
                </div>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-4 text-xs font-bold text-slate-600 space-y-4">
                <h3 className="uppercase tracking-widest text-slate-400 text-[10px] font-black pl-2">Personal Details</h3>
                <div className="grid grid-cols-1 gap-1">
                    {[
                        { l: 'Full Name', v: student.name },
                        { l: 'Admission No', v: student.admissionNo },
                        { l: 'Date of Birth', v: student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A' },
                        { l: 'Gender', v: student.gender || 'Not Specified' },
                        { l: 'Category', v: student.category || 'General' },
                        { l: 'Blood Group', v: 'N/A' }, // Add if available
                    ].map((item, i) => (
                        <div key={i} className="flex justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <span className="text-slate-400">{item.l}</span>
                            <span className="text-slate-900">{item.v}</span>
                        </div>
                    ))}
                </div>

                <h3 className="uppercase tracking-widest text-slate-400 text-[10px] font-black pl-2 mt-4">Family & Contact</h3>
                <div className="grid grid-cols-1 gap-1">
                    {[
                        { l: 'Father Name', v: student.fatherName },
                        { l: 'Mother Name', v: student.motherName },
                        { l: 'Mobile', v: student.mobile },
                        { l: 'Email', v: student.email },
                        { l: 'Address', v: student.address },
                    ].map((item, i) => (
                        <div key={i} className="flex justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <span className="text-slate-400">{item.l}</span>
                            <span className="text-slate-900 text-right max-w-[60%] truncate">{item.v || '-'}</span>
                        </div>
                    ))}
                </div>

                <button onClick={() => setShowBioModal(true)} className="w-full py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 mt-4 hover:bg-blue-700 transition-colors">
                    Edit Profile Information
                </button>
            </div>
        </div>
    );

    const renderBioModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-black text-slate-800">Edit Profile</h2>
                    <button onClick={() => setShowBioModal(false)}><X size={20} className="text-slate-500" /></button>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mobile</label>
                        <input type="text" value={bioForm.mobile} onChange={e => setBioForm({ ...bioForm, mobile: e.target.value })} className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Address</label>
                        <textarea value={bioForm.address} onChange={e => setBioForm({ ...bioForm, address: e.target.value })} className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 outline-none focus:border-blue-500 transition-all resize-none" />
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button onClick={() => setShowBioModal(false)} className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200">Cancel</button>
                    <button onClick={handleSaveBio} className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-blue-600 shadow-lg shadow-blue-500/30">Save</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl md:max-w-4xl md:bg-transparent md:shadow-none font-sans text-base">
            <div className="hidden md:flex justify-between items-center mb-6">
                <h1 className="text-2xl font-black text-slate-800">Student Portal</h1>
                <div className="flex gap-2">
                    {['dashboard', 'grades', 'courses', 'profile'].map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 md:p-0">
                {activeTab === 'dashboard' && <HomeView />}
                {activeTab === 'courses' && <SubjectsView />}
                {activeTab === 'grades' && <ExamsView />}
                {activeTab === 'profile' && <ProfileView />}
            </div>

            {selectedAiAnalysis && <AiAnalysisPage />}
            {showBioModal && renderBioModal()}
            <BottomNav />
        </div>
    );
};

export default StudentDashboard;
