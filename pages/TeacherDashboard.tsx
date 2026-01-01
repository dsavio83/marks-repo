
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, ClassRoom, Subject, MarkRecord } from '../types';
import { getAIAnalysis } from '../services/geminiService';
import { Plus, Users, TrendingUp, Award, Sparkles, UserPlus, Search, Calendar, MapPin, Phone, Trash2, Edit2, ClipboardList, X, Download, Upload, Filter, Mail, Bus, PieChart, CheckCircle2, AlertCircle } from 'lucide-react';
import { userAPI } from '../services/api';

interface TeacherDashboardProps {
    teacher: User;
    state: any;
    setState: any;
    view?: 'dashboard' | 'students';
}

const getId = (obj: any) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj.id || obj._id || '';
};

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ teacher, state, setState, view = 'dashboard' }) => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use prop for view
    const activeView = view;

    const [showAddStudent, setShowAddStudent] = useState(false);
    const [editingStudent, setEditingStudent] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Toast State
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    // Analytics State
    const [selectedExamId, setSelectedExamId] = useState('');

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
    };

    // 1. Classes where I am the "Class Teacher"
    const myFormClasses = state.classes.filter((c: any) =>
        getId(c.classTeacherId) === getId(teacher)
    );
    // Default to the first class owned by teacher
    const primaryClass = myFormClasses[0];

    // Students in my class
    const myStudents = primaryClass
        ? state.users.filter((u: any) => {
            return u.role === UserRole.STUDENT && getId(u.classId) === getId(primaryClass);
        })
        : [];

    // --- Statistics Logic ---
    const genderStats = useMemo(() => {
        const boys = myStudents.filter((s: any) => s.gender === 'Male').length;
        const girls = myStudents.filter((s: any) => s.gender === 'Female').length;
        return { boys, girls, total: myStudents.length };
    }, [myStudents]);

    const casteStats = useMemo(() => {
        const counts: any = {};
        myStudents.forEach((s: any) => {
            const c = s.category || 'General';
            if (!counts[c]) counts[c] = { male: 0, female: 0, total: 0 };
            counts[c].total++;
            if (s.gender === 'Male') counts[c].male++;
            else counts[c].female++;
        });
        return counts;
    }, [myStudents]);

    const examStats = useMemo(() => {
        if (!selectedExamId || !primaryClass) return null;
        const exam = state.exams.find((e: any) => e.id === selectedExamId);
        if (!exam) return null;

        let passed = 0;
        let failed = 0;
        let passedBoys = 0;
        let passedGirls = 0;
        let subjectStats: any[] = [];

        // Calculate subject wise pass/fail first
        const subjects = exam.subjectConfigs.filter((c: any) => c.included).map((c: any) => state.subjects.find((s: any) => s.id === c.subjectId));

        subjects.forEach((sub: any) => {
            if (!sub) return;
            const config = exam.subjectConfigs.find((c: any) => c.subjectId === sub.id);
            const maxTotal = (config.maxTe || 0) + (config.maxCe || 0);
            const passMark = maxTotal * 0.35; // Assuming 35% is pass

            let subPass = 0;
            let subFail = 0;
            let subPassBoys = 0;
            let subPassGirls = 0;

            myStudents.forEach((stu: any) => {
                const mark = state.marks.find((m: any) => m.studentId === stu.id && m.examId === selectedExamId && m.subjectId === sub.id);
                const te = parseInt(mark?.teMark === 'A' ? '0' : mark?.teMark || '0');
                const ce = parseInt(mark?.ceMark === 'A' ? '0' : mark?.ceMark || '0');
                const total = te + ce;
                if (total >= passMark) {
                    subPass++;
                    if (stu.gender === 'Male') subPassBoys++; else subPassGirls++;
                } else {
                    subFail++;
                }
            });
            subjectStats.push({ name: sub.name, passed: subPass, failed: subFail, passBoys: subPassBoys, passGirls: subPassGirls });
        });

        // Calculate Overall Pass/Fail
        myStudents.forEach((stu: any) => {
            let passedAll = true;
            exam.subjectConfigs.filter((c: any) => c.included).forEach((c: any) => {
                const maxTotal = (c.maxTe || 0) + (c.maxCe || 0);
                const passMark = maxTotal * 0.35;
                const mark = state.marks.find((m: any) => m.studentId === stu.id && m.examId === selectedExamId && m.subjectId === c.subjectId);
                const te = parseInt(mark?.teMark === 'A' ? '0' : mark?.teMark || '0');
                const ce = parseInt(mark?.ceMark === 'A' ? '0' : mark?.ceMark || '0');
                if ((te + ce) < passMark) passedAll = false;
            });

            if (passedAll) {
                passed++;
                if (stu.gender === 'Male') passedBoys++; else passedGirls++;
            } else {
                failed++;
            }
        });

        return { passed, failed, passedBoys, passedGirls, subjectStats };

    }, [selectedExamId, myStudents, state.marks]);

    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const addOrUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!primaryClass) {
            alert("⚠️ You must be assigned as a Class Teacher to add students.");
            return;
        }
        setIsSaving(true);
        try {
            const formData = new FormData(e.target as HTMLFormElement);
            const admissionNo = (formData.get('admissionNo') as string).trim();
            const mobile = (formData.get('mobile') as string).trim();

            if (!admissionNo || !mobile) {
                showToast('Admission No and Mobile are required', 'error');
                setIsSaving(false);
                return;
            }

            const studentData = {
                name: (formData.get('name') as string).trim(),
                username: admissionNo, // admission no as username
                admissionNo: admissionNo,
                mobile: mobile,
                password: mobile, // mobile as password
                email: (formData.get('email') as string).trim() || undefined,
                gender: formData.get('gender') as any,
                dob: formData.get('dob') as string,
                category: formData.get('category') as any,
                caste: (formData.get('caste') as string).trim() || undefined,
                classId: getId(primaryClass),
                address: (formData.get('address') as string).trim() || undefined,
                fatherName: (formData.get('fatherName') as string).trim() || undefined,
                transportMode: formData.get('transportMode') as any,
                role: UserRole.STUDENT,
            };

            let savedStudent;
            if (editingStudent) {
                const response = await userAPI.update(editingStudent.id, studentData);
                savedStudent = response.data;
            } else {
                const response = await userAPI.create(studentData);
                savedStudent = response.data;
            }

            setState((prev: any) => {
                const updatedUsers = editingStudent
                    ? prev.users.map((u: any) => u.id === editingStudent.id ? savedStudent : u)
                    : [...prev.users, savedStudent];

                return { ...prev, users: updatedUsers };
            });

            showToast(editingStudent ? 'Student updated successfully' : 'Student registered successfully', 'success');
            setShowAddStudent(false);
            setEditingStudent(null);
        } catch (error: any) {
            console.error('Failed to save student:', error);
            const errorMsg = error.response?.data?.message || 'Failed to save student';
            showToast(errorMsg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteStudent = async (id: string) => {
        if (!confirm('Are you sure you want to remove this student? This action cannot be undone.')) return;
        setDeletingId(id);
        try {
            await userAPI.delete(id);
            setState((prev: any) => ({
                ...prev,
                users: prev.users.filter((u: any) => u.id !== id),
                marks: prev.marks.filter((m: any) => m.studentId !== id) // Clean up marks too
            }));
            showToast('Student removed successfully', 'success');
        } catch (error: any) {
            console.error('Failed to remove student:', error);
            const errorMsg = error.response?.data?.message || 'Failed to remove student';
            showToast(errorMsg, 'error');
        } finally {
            setDeletingId(null);
        }
    };

    // --- Export/Import Logic (Reuse) ---
    const handleExport = () => {
        if (myStudents.length === 0) {
            showToast("No students to export.", 'error');
            return;
        }

        const headers = ["Class", "Division", "Name", "AdmissionNo", "Gender", "Category", "Caste", "Mobile", "Email", "Transport", "DOB", "Address"];
        const rows = myStudents.map((s: any) => [
            `"${primaryClass.gradeLevel}"`,
            `"${primaryClass.section}"`,
            `"${s.name}"`,
            `"${s.admissionNo}"`,
            `"${s.gender}"`,
            `"${s.category}"`,
            `"${s.caste || ''}"`,
            `"${s.mobile}"`,
            `"${s.email || ''}"`,
            `"${s.transportMode || ''}"`,
            `"${s.dob}"`,
            `"${s.address || ''}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((e: any[]) => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `students_class_${primaryClass?.name}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Export generated successfully", 'success');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !primaryClass) return;

        setIsSaving(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split('\n');
                const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;

                let successCount = 0;
                let errorCount = 0;

                showToast(`Importing ${lines.length - startIndex} students...`, 'success');

                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Simple split by comma, handling potential quoted values manually for basic fields
                    // In a production app, a proper CSV parser library like papaparse would be better
                    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());

                    if (cols.length < 4) continue;

                    // New format with Class and Section at [0] and [1]
                    // [0]:Class, [1]:Section, [2]:Name, [3]:AdmissionNo, [4]:Gender, [5]:Category, [6]:Caste, [7]:Mobile, [8]:Email, [9]:Transport, [10]:DOB, [11]:Address

                    const lowerHeader = lines[0].toLowerCase();
                    const hasClassCols = lowerHeader.includes('class') || lowerHeader.includes('division') || lowerHeader.includes('section');
                    const offset = hasClassCols ? 2 : 0;

                    const name = cols[offset + 0];
                    const admissionNo = cols[offset + 1];
                    const gender = cols[offset + 2];
                    const category = cols[offset + 3];
                    const caste = cols[offset + 4];
                    const mobile = cols[offset + 5] || admissionNo;
                    const email = cols[offset + 6];
                    const transport = cols[offset + 7];
                    const dob = cols[offset + 8];
                    const address = cols[offset + 9];

                    if (!name || !admissionNo) continue;

                    const studentData = {
                        name,
                        username: admissionNo,
                        admissionNo: admissionNo,
                        mobile: mobile,
                        password: mobile, // default password as mobile
                        gender: (gender === 'Male' || gender === 'Female') ? gender : 'Male',
                        role: UserRole.STUDENT,
                        classId: getId(primaryClass),
                        category: (category as any) || 'General',
                        caste: caste || undefined,
                        email: email || undefined,
                        transportMode: transport as any || undefined,
                        dob: dob || undefined,
                        address: address || undefined
                    };

                    try {
                        const response = await userAPI.create(studentData);
                        const savedStudent = response.data;
                        setState((prev: any) => ({
                            ...prev,
                            users: [...prev.users.filter((u: any) => u.id !== savedStudent.id), savedStudent]
                        }));
                        successCount++;
                    } catch (err) {
                        console.error('Failed to import student:', studentData.name, err);
                        errorCount++;
                    }
                }

                if (successCount > 0) {
                    showToast(`Successfully imported ${successCount} students.${errorCount > 0 ? ` (${errorCount} failed)` : ''}`, 'success');
                } else if (errorCount > 0) {
                    showToast(`Failed to import students. Check console for details.`, 'error');
                }
            } catch (e) {
                console.error('Import error:', e);
                showToast('Import failed', 'error');
            } finally {
                setIsSaving(false);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    if (!primaryClass) {
        return (
            <div className="p-20 text-center text-slate-400 font-bold">
                You are not assigned as a Class Teacher to any class.
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-10">
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Class Teacher Panel</span>
                    <h1 className="text-3xl font-black text-slate-900 mt-2">Class {primaryClass.name}</h1>
                    <p className="text-slate-400 font-bold">Total Students: {genderStats.total}</p>
                </div>
            </div>

            {activeView === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold"><Users /></div>
                            <div>
                                <p className="text-slate-400 text-xs font-black uppercase">Total Students</p>
                                <p className="text-2xl font-black text-slate-800">{genderStats.total}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold"><Users /></div>
                            <div>
                                <p className="text-slate-400 text-xs font-black uppercase">Boys</p>
                                <p className="text-2xl font-black text-slate-800">{genderStats.boys}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 font-bold"><Users /></div>
                            <div>
                                <p className="text-slate-400 text-xs font-black uppercase">Girls</p>
                                <p className="text-2xl font-black text-slate-800">{genderStats.girls}</p>
                            </div>
                        </div>
                    </div>

                    {/* Caste Stats Table */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-lg font-black text-slate-800 mb-4">Community Analysis</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-xl">Category</th>
                                        <th className="px-4 py-3">Boys</th>
                                        <th className="px-4 py-3">Girls</th>
                                        <th className="px-4 py-3 rounded-r-xl">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {Object.keys(casteStats).map(cat => (
                                        <tr key={cat}>
                                            <td className="px-4 py-3 font-bold text-slate-700">{cat}</td>
                                            <td className="px-4 py-3 font-medium text-slate-600">{casteStats[cat].male}</td>
                                            <td className="px-4 py-3 font-medium text-slate-600">{casteStats[cat].female}</td>
                                            <td className="px-4 py-3 font-black text-slate-800">{casteStats[cat].total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Exam Stats */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-800">Exam Performance</h3>
                            <select
                                value={selectedExamId}
                                onChange={(e) => setSelectedExamId(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none"
                            >
                                <option value="">Select Exam</option>
                                {state.exams.filter((e: any) => {
                                    const examClassId = typeof e.classId === 'object' && e.classId ? (e.classId.id || e.classId._id) : e.classId;
                                    return examClassId === primaryClass.id;
                                }).map((e: any) => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                        </div>

                        {examStats ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-2xl bg-green-50 text-green-700 text-center">
                                        <p className="text-xs font-black uppercase">Passed</p>
                                        <p className="text-2xl font-black">{examStats.passed}</p>
                                        <p className="text-[10px] font-bold opacity-70">Boys: {examStats.passedBoys}, Girls: {examStats.passedGirls}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-center">
                                        <p className="text-xs font-black uppercase">Failed</p>
                                        <p className="text-2xl font-black">{examStats.failed}</p>
                                    </div>
                                </div>

                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mt-4">Subject Wise Pass/Fail</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {examStats.subjectStats.map((sub: any) => (
                                        <div key={sub.name} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl">
                                            <span className="font-bold text-slate-700">{sub.name}</span>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-green-600 mr-2">Pass: {sub.passed} (B:{sub.passBoys}/G:{sub.passGirls})</span>
                                                <span className="text-xs font-bold text-red-500">Fail: {sub.failed}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-slate-400 font-bold text-sm">Select an exam to view analysis</div>
                        )}
                    </div>
                </div>
            )}

            {activeView === 'students' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-500">
                    {/* Header / Filter Toolbar */}
                    <div className="p-6 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-center gap-4 bg-slate-50/30">
                        <div className="relative flex-1 w-full xl:max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm"
                            />
                        </div>

                        <div className="flex gap-2 w-full xl:w-auto">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />

                            <button onClick={handleImportClick} className="flex-1 xl:flex-none px-4 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 flex items-center justify-center text-xs uppercase tracking-wider">
                                <Upload size={16} className="mr-2" /> Import
                            </button>
                            <button onClick={handleExport} className="flex-1 xl:flex-none px-4 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 flex items-center justify-center text-xs uppercase tracking-wider">
                                <Download size={16} className="mr-2" /> Export
                            </button>
                            <button
                                onClick={() => { setEditingStudent(null); setShowAddStudent(true); }}
                                className="flex-1 xl:flex-none px-6 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center whitespace-nowrap"
                            >
                                <UserPlus size={18} className="mr-2" /> Add Student
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Transport</th>
                                    <th className="px-6 py-4">Details</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {myStudents.length > 0 ? (
                                    myStudents
                                        .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.admissionNo.includes(searchTerm))
                                        .map((student: any) => (
                                            <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black mr-3 ${student.gender === 'Female' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Roll #{student.admissionNo}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="flex items-center text-xs font-bold text-slate-500"><Phone size={12} className="mr-1.5 text-slate-300" /> {student.mobile}</span>
                                                        {student.email && <span className="flex items-center text-xs font-bold text-slate-500"><Mail size={12} className="mr-1.5 text-slate-300" /> {student.email}</span>}
                                                        <span className="flex items-center text-xs font-bold text-slate-500"><MapPin size={12} className="mr-1.5 text-slate-300" /> {student.address?.substring(0, 15) || 'N/A'}...</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Bus size={14} className="text-slate-300" />
                                                        <span className="text-xs font-bold text-slate-600">{student.transportMode || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex gap-2">
                                                            <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">{student.gender}</span>
                                                            <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">{student.category}</span>
                                                        </div>
                                                        {student.caste && <span className="text-[10px] text-slate-400 font-bold ml-1">Caste: {student.caste}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <button onClick={() => { setEditingStudent(student); setShowAddStudent(true); }} className="p-2 text-slate-400 hover:text-blue-500 bg-white border border-slate-100 rounded-lg hover:border-blue-100 transition-all"><Edit2 size={16} /></button>
                                                        <button onClick={() => deleteStudent(student.id)} className="p-2 text-slate-300 hover:text-red-500 bg-white border border-slate-100 rounded-lg hover:border-red-100 transition-all"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-400 font-bold text-sm">
                                            No students found in your class.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Student Modal */}
            {showAddStudent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-2xl font-black text-slate-900">{editingStudent ? 'Edit Student' : 'New Registration'}</h3>
                            <button onClick={() => { setShowAddStudent(false); setEditingStudent(null); }} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-2xl"><X size={24} /></button>
                        </div>

                        <div className="bg-blue-50/50 p-4 border-b border-blue-100">
                            <p className="text-center text-blue-600 font-bold text-xs uppercase">Class: {primaryClass.name}</p>
                        </div>

                        <form onSubmit={addOrUpdateStudent} className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Full Name *</label>
                                    <input name="name" defaultValue={editingStudent?.name} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admission No *</label>
                                    <input name="admissionNo" defaultValue={editingStudent?.admissionNo} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Father Name</label>
                                    <input name="fatherName" defaultValue={editingStudent?.fatherName} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender *</label>
                                    <select name="gender" defaultValue={editingStudent?.gender} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold">
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category *</label>
                                    <select name="category" defaultValue={editingStudent?.category} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold">
                                        <option>General</option>
                                        <option>OBC</option>
                                        <option>SC</option>
                                        <option>ST</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Caste Name (Optional)</label>
                                    <input name="caste" defaultValue={editingStudent?.caste} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email ID (Optional)</label>
                                    <input name="email" type="email" defaultValue={editingStudent?.email} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile (Password) *</label>
                                    <input name="mobile" defaultValue={editingStudent?.mobile} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Birth Date *</label>
                                    <input name="dob" type="date" defaultValue={editingStudent?.dob} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transport Mode</label>
                                    <select name="transportMode" defaultValue={editingStudent?.transportMode} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold">
                                        <option value="">Select Transport</option>
                                        <option>School Bus</option>
                                        <option>Private Bus</option>
                                        <option>Govt. Bus</option>
                                        <option>Auto</option>
                                        <option>Jeep</option>
                                        <option>Bicycle</option>
                                        <option>Two Wheeler</option>
                                        <option>Car</option>
                                        <option>Cab</option>
                                        <option>By Walk</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Home Address</label>
                                    <textarea name="address" rows={2} defaultValue={editingStudent?.address} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" />
                                </div>
                            </div>
                            <div className="pt-8">
                                <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-[2rem] shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center">
                                    {editingStudent ? 'Update Student' : 'Register Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-300">
                    <div className={`px-8 py-4 rounded-[2rem] shadow-2xl flex items-center space-x-3 border border-white/10 backdrop-blur-xl text-white ${toast.type === 'success' ? 'bg-slate-900' : 'bg-red-600'}`}>
                        {toast.type === 'success' ? <CheckCircle2 size={24} className="text-green-400" /> : <AlertCircle size={24} className="text-white" />}
                        <span className="font-black uppercase tracking-widest text-xs">{toast.msg}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
