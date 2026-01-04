
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import Swal from 'sweetalert2';
import {
    Save, AlertCircle, CheckCircle2,
    ChevronRight, Loader2, BookOpen,
    Lock, Unlock, Smartphone, X, UserX
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
    const displaySections = sections.filter((s: any) => s.name.toUpperCase() !== 'CE');

    // Filter students to show
    const filteredStudents = user.role === UserRole.STUDENT
        ? [user]
        : state.users.filter((u: any) => u.role === UserRole.STUDENT && getId(u.classId) === selectedClassId);

    // Local state for edits
    const [entryData, setEntryData] = useState<Record<string, Record<string, number>>>({});
    const [absentMap, setAbsentMap] = useState<Record<string, boolean>>({});

    // Initialize data from existing marks
    useEffect(() => {
        if (!selectedExamId || !selectedSubjectId) return;

        const newEntryData: Record<string, Record<string, number>> = {};
        const newAbsentMap: Record<string, boolean> = {};

        filteredStudents.forEach((student: any) => {
            const mark = state.marks.find((m: any) =>
                getId(m.studentId) === student.id &&
                getId(m.subjectId) === selectedSubjectId &&
                getId(m.examId) === selectedExamId
            );

            if (mark) {
                // Check if marked as Absent ('A')
                if (mark.teMark === 'A') {
                    newAbsentMap[student.id] = true;
                }

                if (mark.detailedMarks) {
                    newEntryData[student.id] = {};
                    mark.detailedMarks.forEach((dm: any) => {
                        newEntryData[student.id][dm.sectionId] = dm.marks;
                    });
                }
            }
        });
        setEntryData(newEntryData);
        setAbsentMap(newAbsentMap);
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

    const toggleAbsent = (studentId: string) => {
        setAbsentMap(prev => ({ ...prev, [studentId]: !prev[studentId] }));
    };

    const handleBulkSave = async (shouldLock: boolean = true) => {
        if (!selectedExamId || !selectedSubjectId || !activeConfig) return;

        setIsSaving(true);
        try {
            const bulkPayloads: any[] = [];
            const allSections = activeConfig.markSections || [];
            // Filter out CE for validation purposes
            const teSections = allSections.filter((s: any) => s.name.toUpperCase() !== 'CE');

            for (const student of filteredStudents) {
                const isAbsent = absentMap[student.id];

                // If student is entering, they might be already locked
                const existingMark = state.marks.find((m: any) =>
                    getId(m.studentId) === student.id &&
                    getId(m.subjectId) === selectedSubjectId &&
                    getId(m.examId) === selectedExamId
                );

                if (user.role === UserRole.STUDENT && existingMark?.isLocked) {
                    continue; // Skip if already locked for students
                }

                // Check if this student should be processed
                const hasEntry = !!entryData[student.id];

                if (!isAbsent && !hasEntry && !existingMark) {
                    continue;
                }

                let savePayload: any;

                if (isAbsent) {
                    savePayload = {
                        studentId: student.id,
                        subjectId: selectedSubjectId,
                        examId: selectedExamId,
                        detailedMarks: [], // Clear detailed marks if absent
                        teMark: 'A', // Mark as Absent
                        ceMark: 'A',
                        isLocked: shouldLock // Lock based on request
                    };
                } else {
                    const studentMarks = entryData[student.id] || {};

                    // Iterate over ALL sections to ensure completeness. Default to 0 if missing.
                    const detailedMarks = allSections.map((section: any) => {
                        const val = studentMarks[section.id];
                        const markVal = (val === undefined || val === null) ? 0 : val;
                        return {
                            sectionId: section.id,
                            marks: markVal
                        };
                    });

                    // Calculate TE Total for Validation (Exclude CE)
                    const teMarksOnly = detailedMarks.filter((dm: any) => {
                        const sec = allSections.find((s: any) => s.id === dm.sectionId);
                        return sec && sec.name.toUpperCase() !== 'CE';
                    });

                    const totalObtained = teMarksOnly.reduce((acc: number, curr: any) => acc + (curr.marks as number), 0);
                    const roundedTotal = Math.ceil(totalObtained);

                    // Validation: Must not exceed activeConfig.maxTe
                    if (roundedTotal > activeConfig.maxTe) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Invalid TE Marks',
                            text: `TE Mark exceeds maximum limit.\n(${student.name})`,
                            confirmButtonColor: '#d33'
                        });
                        setIsSaving(false);
                        return;
                    }

                    // STRICT VALIDATION: Compare with Authoritative Mark (MarkEntry.tsx)
                    // The mark from "Enter marks for exams and subjects" is FINAL.
                    const existingTeRaw = existingMark?.teMark;
                    const existingTeVal = parseFloat(existingTeRaw);

                    // If existing mark is Absent ('A'), we should not be entering marks here unless we unlock/change there
                    if (existingTeRaw === 'A') {
                        Swal.fire({
                            icon: 'error',
                            title: 'Student is Absent',
                            text: `Student is marked Absent in Main Exam Entry. Cannot enter split marks.\n(${student.name})`,
                            confirmButtonColor: '#d33'
                        });
                        setIsSaving(false);
                        return;
                    }

                    // If Main Mark exists, Total MUST match exactly
                    if (!isNaN(existingTeVal)) {
                        if (Math.abs(roundedTotal - existingTeVal) > 0.01) { // Float safety
                            Swal.fire({
                                icon: 'error',
                                title: 'Total Mismatch',
                                text: `TE மதிப்பெண் அதிகமாக உள்ளது, அல்லது குறைவாக உள்ளது சரியான மதிப்பெண் பிரிவுகளை உட்படுத்தவும்.\n(${student.name} - Given: ${existingTeVal}, Calc: ${roundedTotal})`,
                                confirmButtonColor: '#d33'
                            });
                            setIsSaving(false);
                            return;
                        }
                    } else {
                        // If NO Main Mark exists, we BLOCK because Main Mark is the Authority.
                        // "Enter marks for exams and subjects ... mark only correct."
                        Swal.fire({
                            icon: 'warning',
                            title: 'Main Mark Missing',
                            text: `Main Exam Mark not found for ${student.name}. Please enter the Total Mark in "Enter marks for exams and subjects" page first.`,
                            confirmButtonColor: '#f59e0b'
                        });
                        setIsSaving(false);
                        return;
                    }

                    savePayload = {
                        studentId: student.id,
                        subjectId: selectedSubjectId,
                        examId: selectedExamId,
                        detailedMarks,
                        teMark: existingTeRaw, // V CRITICAL: Do NOT replace the authoritative total. Use exact existing value.
                        isLocked: shouldLock // Lock based on request
                    };
                }

                bulkPayloads.push(savePayload);
            }

            if (bulkPayloads.length > 0) {
                const res = await markAPI.bulkCreate({ marks: bulkPayloads });

                // Update local state with the returned marks to reflect "Locked" status immediately
                if (res && res.data && Array.isArray(res.data)) {
                    setState((prev: any) => {
                        // Remove old marks that are being updated
                        const otherMarks = prev.marks.filter((m: any) =>
                            !bulkPayloads.some(bp =>
                                getId(bp.studentId) === getId(m.studentId) &&
                                getId(bp.subjectId) === getId(m.subjectId) &&
                                getId(bp.examId) === getId(m.examId)
                            )
                        );
                        return { ...prev, marks: [...otherMarks, ...res.data] };
                    });
                }

                showToastMsg(shouldLock ? 'Marks saved and locked successfully!' : 'Marks saved and unlocked successfully!');
            } else {
                showToastMsg('No changes to save.', 'error');
            }

        } catch (error: any) {
            console.error(error);
            showToastMsg('Failed to save marks', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleLock = async (student: any) => {
        const existingMark = state.marks.find((m: any) =>
            getId(m.studentId) === student.id &&
            getId(m.subjectId) === selectedSubjectId &&
            getId(m.examId) === selectedExamId
        );

        const currentLock = existingMark?.isLocked || false;
        const newLockState = !currentLock;
        const isAbsent = absentMap[student.id];

        let payload: any;

        if (isAbsent) {
            payload = {
                studentId: student.id,
                subjectId: selectedSubjectId,
                examId: selectedExamId,
                detailedMarks: [],
                teMark: 'A',
                ceMark: 'A',
                isLocked: newLockState
            };
        } else {
            const studentMarks = entryData[student.id] || {};
            const detailedMarks = Object.entries(studentMarks).map(([sid, m]) => ({
                sectionId: sid,
                marks: m
            }));
            const totalObtained = detailedMarks.reduce((acc: number, curr: any) => acc + (curr.marks as number), 0);
            const roundedTotal = Math.ceil(totalObtained);

            if (roundedTotal > activeConfig.maxTe) {
                showToastMsg(`Cannot lock: Total marks exceed limit`, 'error');
                return;
            }

            // STRICT VALIDATION FOR LOCKING AS WELL
            const existingTeRaw = existingMark?.teMark;
            const existingTeVal = parseFloat(existingTeRaw);

            if (!isNaN(existingTeVal)) {
                if (Math.abs(roundedTotal - existingTeVal) > 0.01) {
                    showToastMsg(`Cannot lock: Section total (${roundedTotal}) does not match Main Mark (${existingTeVal})`, 'error');
                    return;
                }
            } else {
                // Block if no main mark
                showToastMsg(`Cannot lock: Main Exam Mark not found`, 'error');
                return;
            }

            payload = {
                studentId: student.id,
                subjectId: selectedSubjectId,
                examId: selectedExamId,
                detailedMarks,
                teMark: existingTeRaw,  // Preserve Authoritative Mark
                isLocked: newLockState
            };
        }

        try {
            const res = await markAPI.bulkCreate({ marks: [payload] });
            if (res && res.data && res.data[0]) {
                const updatedMark = res.data[0];
                setState((prev: any) => ({
                    ...prev,
                    marks: [
                        ...prev.marks.filter((m: any) =>
                            !(getId(m.studentId) === student.id &&
                                getId(m.subjectId) === selectedSubjectId &&
                                getId(m.examId) === selectedExamId)
                        ),
                        updatedMark
                    ]
                }));
                showToastMsg(newLockState ? 'Locked' : 'Unlocked');
            }
        } catch (e) {
            console.error(e);
            showToastMsg('Failed to toggle lock', 'error');
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
        <div className="space-y-4 max-w-5xl mx-auto pb-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
                    <BookOpen size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Section Marks Management</h1>
                    <p className="text-slate-500 font-bold text-xs">Manage detailed split marks for students</p>
                </div>
            </div>

            <div className="native-card !p-4 bg-white/80 backdrop-blur-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {user.role !== UserRole.STUDENT && (
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Class</label>
                            <select
                                value={selectedClassId}
                                onChange={(e) => { setSelectedClassId(e.target.value); setSelectedExamId(''); setSelectedSubjectId(''); }}
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="">Select Class...</option>
                                {relevantClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Exam</label>
                        <select
                            value={selectedExamId}
                            onChange={(e) => { setSelectedExamId(e.target.value); setSelectedSubjectId(''); }}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50"
                            disabled={!selectedClassId}
                        >
                            <option value="">Select Exam...</option>
                            {relevantExams.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                        <select
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50"
                            disabled={!selectedExamId}
                        >
                            <option value="">Select Subject...</option>
                            {examSubjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {selectedClassId && selectedExamId && selectedSubjectId && (
                <div className="space-y-4 animate-fade-scale">
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-premium">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800">Detailed Mark Entry</h3>
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                                    Limit: {activeConfig?.maxTe} Marks
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {activeConfig?.markSections?.some((s: any) => s.name.toUpperCase() === 'CE') && user.role !== UserRole.STUDENT && (
                                <button
                                    onClick={() => {
                                        const ceSection = activeConfig.markSections.find((s: any) => s.name.toUpperCase() === 'CE');
                                        if (!ceSection) return;

                                        const valStr = prompt(`Enter CE mark to apply for all students (Max: ${ceSection.maxMarks}):`);
                                        if (valStr === null) return;

                                        const val = parseFloat(valStr);
                                        if (isNaN(val) || val < 0 || val > ceSection.maxMarks) {
                                            showToastMsg(`Invalid mark. Please enter a number between 0 and ${ceSection.maxMarks}`, 'error');
                                            return;
                                        }

                                        setEntryData(prev => {
                                            const newData = { ...prev };
                                            filteredStudents.forEach((student: any) => {
                                                const existingMark = state.marks.find((m: any) =>
                                                    getId(m.studentId) === student.id &&
                                                    getId(m.subjectId) === selectedSubjectId &&
                                                    getId(m.examId) === selectedExamId
                                                );

                                                if (existingMark?.isLocked || absentMap[student.id]) return;

                                                if (!newData[student.id]) newData[student.id] = {};
                                                newData[student.id] = {
                                                    ...newData[student.id],
                                                    [ceSection.id]: val
                                                };
                                            });
                                            return newData;
                                        });
                                        showToastMsg(`Applied CE mark ${val} to all eligible students`, 'success');
                                    }}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Smartphone size={16} />
                                    <span className="text-xs uppercase tracking-widest">Auto Fill CE</span>
                                </button>
                            )}

                            {user.role !== UserRole.STUDENT && (
                                <button
                                    onClick={() => handleBulkSave(false)}
                                    disabled={isSaving}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-amber-100 text-amber-700 rounded-xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
                                    <span className="text-xs uppercase tracking-widest">Unlock All</span>
                                </button>
                            )}

                            <button
                                onClick={() => handleBulkSave(true)}
                                disabled={isSaving}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                <span className="text-xs uppercase tracking-widest">
                                    {user.role === UserRole.STUDENT ? 'Submit & Lock' : 'Save All'}
                                </span>
                            </button>
                        </div>
                    </div>



                    <div className="space-y-3">
                        {filteredStudents.map((student: any) => {
                            const studentData = entryData[student.id] || {};
                            // Use displaySections (TE) for draftTotal
                            const draftTotal = displaySections.reduce((a: number, b: any) => a + (studentData[b.id] || 0), 0);

                            const existingMark = state.marks.find((m: any) => getId(m.studentId) === student.id && getId(m.subjectId) === selectedSubjectId && getId(m.examId) === selectedExamId);
                            const isLocked = existingMark?.isLocked;

                            // Check Authoritative Total
                            const targetTotalStr = existingMark?.teMark;
                            const targetTotal = parseFloat(targetTotalStr);
                            const roundedDraft = Math.ceil(draftTotal as number);

                            const totalExceeds = roundedDraft > (activeConfig?.maxTe || 0);
                            const isMismatch = !isNaN(targetTotal) && Math.abs(roundedDraft - targetTotal) > 0.01;

                            const isAbsent = absentMap[student.id];
                            const hasError = totalExceeds || isMismatch;

                            return (
                                <div className={`native-card !p-4 transition-all ${isLocked ? 'bg-amber-50/30 border-amber-200' : ''} ${hasError ? 'bg-red-50/50 border-red-100' : ''}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0 md:w-1/4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${isAbsent ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {isAbsent ? 'A' : student.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-xs truncate ${isAbsent ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{student.name}</span>
                                                    {isLocked && <Lock size={10} className="text-amber-500" />}
                                                </div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Roll #{student.admissionNo}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 flex-1 justify-end">
                                            {/* Absent Toggle */}
                                            {user.role !== UserRole.STUDENT && (
                                                <button
                                                    onClick={() => toggleAbsent(student.id)}
                                                    disabled={isLocked}
                                                    className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-black uppercase transition-all ${isAbsent ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                                >
                                                    <UserX size={12} />
                                                    {isAbsent ? 'Absent' : 'Present'}
                                                </button>
                                            )}

                                            <div className="flex-1 overflow-x-auto custom-scrollbar -mx-2 px-2 flex justify-center">
                                                <div className="flex gap-2 min-w-max">
                                                    {displaySections.map((s: any) => (
                                                        <div key={s.id} className="flex flex-col items-center">
                                                            <span className="text-[7px] font-black text-slate-400 uppercase mb-1 tracking-tighter truncate w-14 text-center">{s.name}</span>
                                                            <input
                                                                id={`input-${student.id}-${s.id}`}
                                                                type="text"
                                                                disabled={isLocked || isSaving || isAbsent}
                                                                value={entryData[student.id]?.[s.id] ?? ''}
                                                                onChange={(e) => handleInputChange(student.id, s.id, e.target.value)}
                                                                className={`w-12 p-2 bg-slate-50 border border-slate-100 rounded-lg font-black text-[11px] text-center text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all disabled:opacity-50 disabled:bg-slate-100`}
                                                                placeholder={isAbsent ? '-' : `/${s.maxMarks}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end sm:flex-col sm:items-end gap-2 shrink-0">
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest sm:hidden">Total</p>
                                                <div className={`px-3 py-1.5 rounded-lg text-xs font-black ${isAbsent ? 'bg-slate-100 text-slate-400' : (hasError ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-blue-50 text-blue-700 border border-blue-100')}`}>
                                                    {isAbsent ? 'Absent' : draftTotal}
                                                    {!isAbsent && <span className={`opacity-70 text-[10px] ml-1 ${hasError ? 'text-red-100' : 'text-blue-400'}`}>/ {!isNaN(targetTotal) ? targetTotal : activeConfig?.maxTe}</span>}
                                                </div>
                                            </div>

                                            {/* Lock Toggle - Moved to End */}
                                            {user.role !== UserRole.STUDENT && (
                                                <div className="pl-4 border-l border-slate-100 ml-2">
                                                    <label className="flex flex-col items-center gap-1 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={!!isLocked}
                                                            onChange={() => handleToggleLock(student)}
                                                        />
                                                        <div className={`w-8 h-8 rounded-xl border transition-all flex items-center justify-center ${isLocked ? 'bg-amber-100 border-amber-300 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300'}`}>
                                                            {isLocked ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 group-hover:border-slate-400" />}
                                                        </div>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest ${isLocked ? 'text-amber-600' : 'text-slate-300'}`}>
                                                            {isLocked ? 'Locked' : 'Open'}
                                                        </span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )
            }

            {
                !selectedSubjectId && (
                    <div className="py-20 text-center animate-fade-scale">
                        <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-blue-600 border border-blue-100">
                            <BookOpen size={28} />
                        </div>
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Awaiting Configuration</p>
                        <p className="text-slate-500 font-bold text-sm mt-1">Select class, exam and subject above</p>
                    </div>
                )
            }

            {
                toast && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-bottom-10 duration-300">
                        <div className={`px-6 py-3 rounded-2xl shadow-premium flex items-center space-x-3 border border-white/10 backdrop-blur-xl text-white ${toast.type === 'success' ? 'bg-slate-900/90' : 'bg-red-600/90'}`}>
                            {toast.type === 'success' ? <CheckCircle2 size={18} className="text-green-400" /> : <AlertCircle size={18} className="text-white" />}
                            <span className="font-black uppercase tracking-widest text-[10px]">{toast.msg}</span>
                            <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-white/10 rounded-full"><X size={12} /></button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default SectionMarkEntry;
