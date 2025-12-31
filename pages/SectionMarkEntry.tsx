
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import {
    Save, AlertCircle, CheckCircle2,
    ChevronRight, Loader2, BookOpen,
    Lock, Smartphone, X
} from 'lucide-react';
import { markAPI } from '../services/api';

interface SectionMarkEntryProps {
    user: User;
    state: any;
    setState: any;
}

const getId = (ref: any) => typeof ref === 'object' && ref ? (ref.id || ref._id) : ref;

const SectionMarkEntry: React.FC<SectionMarkEntryProps> = ({ user, state, setState }) => {
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    // If student, auto-set class
    useEffect(() => {
        if (user.role === UserRole.STUDENT) {
            setSelectedClassId(getId(user.classId));
        }
    }, [user]);

    const relevantClasses = state.classes.filter((c: any) => {
        if (user.role === UserRole.ADMIN) return true;
        if (user.role === UserRole.STUDENT) return getId(c.id) === getId(user.classId);

        // Teacher logic
        const isCT = getId(c.classTeacherId) === user.id;
        const hasAssignment = state.assignments.some((a: any) =>
            getId(a.classId) === c.id && getId(a.teacherId) === user.id
        );
        return isCT || hasAssignment;
    });

    const relevantExams = state.exams.filter((e: any) => getId(e.classId) === selectedClassId);
    const selectedExam = state.exams.find((e: any) => e.id === selectedExamId);

    const examSubjects = selectedExam ? selectedExam.subjectConfigs.map((config: any) => {
        const subId = getId(config.subjectId);
        const sub = state.subjects.find((s: any) => s.id === subId);
        if (!sub) return null;

        if (user.role === UserRole.STUDENT) return { ...sub, config };
        if (user.role === UserRole.ADMIN) return { ...sub, config };

        // Teacher check
        const isCT = state.classes.some((c: any) => c.id === selectedClassId && getId(c.classTeacherId) === user.id);
        const isAssigned = state.assignments.some((a: any) =>
            getId(a.classId) === selectedClassId && getId(a.subjectId) === subId && getId(a.teacherId) === user.id
        );
        return (isCT || isAssigned) ? { ...sub, config } : null;
    }).filter(Boolean) : [];

    const activeConfig = selectedExam?.subjectConfigs.find((c: any) => getId(c.subjectId) === selectedSubjectId);
    const sections = activeConfig?.markSections || [];

    // Filter students to show
    const filteredStudents = user.role === UserRole.STUDENT
        ? [user]
        : state.users.filter((u: any) => u.role === UserRole.STUDENT && getId(u.classId) === selectedClassId);

    // Local state for edits
    const [entryData, setEntryData] = useState<Record<string, Record<string, number>>>({});

    // Initialize data from existing marks
    useEffect(() => {
        if (!selectedExamId || !selectedSubjectId) return;

        const newEntryData: Record<string, Record<string, number>> = {};
        filteredStudents.forEach((student: any) => {
            const mark = state.marks.find((m: any) =>
                getId(m.studentId) === student.id &&
                getId(m.subjectId) === selectedSubjectId &&
                getId(m.examId) === selectedExamId
            );
            if (mark && mark.detailedMarks) {
                newEntryData[student.id] = {};
                mark.detailedMarks.forEach((dm: any) => {
                    newEntryData[student.id][dm.sectionId] = dm.marks;
                });
            }
        });
        setEntryData(newEntryData);
    }, [selectedExamId, selectedSubjectId, state.marks]);

    const showToastMsg = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleInputChange = (studentId: string, sectionId: string, val: string) => {
        const numVal = parseFloat(val);
        const section = sections.find((s: any) => s.id === sectionId);

        if (!isNaN(numVal) && section && numVal > section.maxMarks) {
            return; // Cap at max
        }

        setEntryData(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [sectionId]: isNaN(numVal) ? 0 : numVal
            }
        }));

        // Auto-jump logic
        if (section && section.maxMarks < 10 && val.length === 1) {
            const currentIdx = sections.indexOf(section);
            if (currentIdx < sections.length - 1) {
                const nextSection = sections[currentIdx + 1];
                const nextId = `input-${studentId}-${nextSection.id}`;
                const nextEl = document.getElementById(nextId);
                if (nextEl) (nextEl as HTMLInputElement).focus();
            }
        }
    };

    const handleBulkSave = async () => {
        if (!selectedExamId || !selectedSubjectId || !activeConfig) return;

        setIsSaving(true);
        try {
            for (const student of filteredStudents) {
                // If student is entering, they might be already locked
                const existingMark = state.marks.find((m: any) =>
                    getId(m.studentId) === student.id &&
                    getId(m.subjectId) === selectedSubjectId &&
                    getId(m.examId) === selectedExamId
                );

                if (user.role === UserRole.STUDENT && existingMark?.isLocked) {
                    continue; // Skip if already locked
                }

                const studentMarks = entryData[student.id] || {};
                const detailedMarks = Object.entries(studentMarks).map(([sid, m]) => ({
                    sectionId: sid,
                    marks: m
                }));

                const totalObtained = detailedMarks.reduce((acc: number, curr: any) => acc + (curr.marks as number), 0);
                const roundedTotal = Math.ceil(totalObtained);

                // Strict validation: Must match activeConfig.maxTe exactly
                if (roundedTotal !== activeConfig.maxTe) {
                    showToastMsg(`Error for ${student.name}: Total marks (${roundedTotal}) must match exactly with Max TE (${activeConfig.maxTe})`, 'error');
                    setIsSaving(false);
                    return;
                }

                // Final Save Data
                const savePayload = {
                    studentId: student.id,
                    subjectId: selectedSubjectId,
                    examId: selectedExamId,
                    detailedMarks,
                    teMark: roundedTotal.toString(),
                    // Auto-lock for student submissions
                    isLocked: user.role === UserRole.STUDENT ? true : (existingMark?.isLocked || false)
                };

                const res = await markAPI.create(savePayload);

                // Trigger AI Analysis
                await markAPI.analyze(res.data.mark.id);
            }

            showToastMsg('All marks saved, locked, and AI analyzed successfully!');
            // Refresh local state (in a real app, use a proper state management Refresh)
            // fetchAllData() is in App.tsx, but we can't call it here easily without a shared context.
            // For now, let's assume the user will see the updates on next load or we trigger a manual refresh.
            // Better: Update state manually
        } catch (error: any) {
            console.error(error);
            showToastMsg('Failed to save some marks', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (sections.length === 0 && selectedSubjectId) {
        return (
            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
                <h2 className="text-xl font-black text-slate-800">No Mark Sections Defined</h2>
                <p className="text-slate-500 font-bold mb-6">This subject does not have detailed mark sections configured in Exam Manager.</p>
                <button onClick={() => setSelectedSubjectId('')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black">Go Back</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6">
                    {user.role !== UserRole.STUDENT && (
                        <div className="flex-1 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Class</label>
                            <select
                                value={selectedClassId}
                                onChange={(e) => { setSelectedClassId(e.target.value); setSelectedExamId(''); setSelectedSubjectId(''); }}
                                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Choose Class...</option>
                                {relevantClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Exam</label>
                        <select
                            value={selectedExamId}
                            onChange={(e) => { setSelectedExamId(e.target.value); setSelectedSubjectId(''); }}
                            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!selectedClassId}
                        >
                            <option value="">Choose Exam...</option>
                            {relevantExams.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Subject</label>
                        <select
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!selectedExamId}
                        >
                            <option value="">Choose Subject...</option>
                            {examSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {selectedClassId && selectedExamId && selectedSubjectId && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Detailed Mark Entry</h3>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                                Max TE Allowed: {activeConfig?.maxTe}
                            </p>
                        </div>
                        <button
                            onClick={handleBulkSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {user.role === UserRole.STUDENT ? 'Submit & Lock' : 'Bulk Save & AI Run'}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-8 py-4 sticky left-0 bg-slate-50 z-10 w-64">Student Name</th>
                                    {sections.map((s: any) => (
                                        <th key={s.id} className="px-6 py-4 text-center min-w-[120px]">
                                            {s.name}
                                            <div className="text-[8px] opacity-70 mt-1">Max: {s.maxMarks}</div>
                                        </th>
                                    ))}
                                    <th className="px-8 py-4 text-right">Draft Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredStudents.map((student: any) => {
                                    const studentData = entryData[student.id] || {};
                                    const draftTotal = Object.values(studentData).reduce((a: number, b: any) => a + (b as number), 0);
                                    const isLocked = state.marks.find((m: any) => getId(m.studentId) === student.id && getId(m.subjectId) === selectedSubjectId && getId(m.examId) === selectedExamId)?.isLocked;

                                    return (
                                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-slate-700">{student.name}</span>
                                                    {isLocked && <Lock size={12} className="text-amber-500" />}
                                                </div>
                                            </td>
                                            {sections.map((s: any) => (
                                                <td key={s.id} className="px-4 py-2">
                                                    <input
                                                        id={`input-${student.id}-${s.id}`}
                                                        type="number"
                                                        step="0.5"
                                                        disabled={isLocked || isSaving}
                                                        value={entryData[student.id]?.[s.id] ?? ''}
                                                        onChange={(e) => handleInputChange(student.id, s.id, e.target.value)}
                                                        className="w-full text-center p-3 bg-slate-50 rounded-xl border border-slate-100 font-black text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all disabled:opacity-50"
                                                        placeholder="-"
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-8 py-4 text-right">
                                                <span className={`px-4 py-2 rounded-xl text-sm font-black ${Math.ceil(draftTotal as number) > (activeConfig?.maxTe || 0) ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
                                                    {draftTotal}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!selectedSubjectId && (
                <div className="bg-white p-24 rounded-[3rem] text-center border-4 border-dashed border-slate-100 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-6 text-blue-600">
                        <BookOpen size={32} />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Select selections above to start entry.</p>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-bottom-10 duration-300">
                    <div className={`px-8 py-4 rounded-[2rem] shadow-2xl flex items-center space-x-3 border border-white/10 backdrop-blur-xl text-white ${toast.type === 'success' ? 'bg-slate-900' : 'bg-red-600'}`}>
                        {toast.type === 'success' ? <CheckCircle2 size={24} className="text-green-400" /> : <AlertCircle size={24} className="text-white" />}
                        <span className="font-black uppercase tracking-widest text-xs">{toast.msg}</span>
                        <button onClick={() => setToast(null)} className="ml-4 p-1 hover:bg-white/10 rounded-full"><X size={14} /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SectionMarkEntry;
