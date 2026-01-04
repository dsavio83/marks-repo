
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, UserRole, ClassRoom, Subject, MarkRecord, Exam } from '../types';
import MarkInputRow from '../components/MarkInputRow';
import { Save, CheckCircle2, AlertCircle, Calendar, CheckSquare, Square, ChevronRight, Loader2, Cloud, CloudOff, X, Smartphone, Plus, Trash2, ClipboardList } from 'lucide-react';
import { markAPI, attendanceAPI } from '../services/api';

interface MarkEntryProps {
  teacher: User;
  state: any;
  setState: any;
}

// helper to extract ID from potentially populated object
const getId = (ref: any) => typeof ref === 'object' && ref ? (ref.id || ref._id) : ref;

const MarkEntry: React.FC<MarkEntryProps> = ({ teacher, state, setState }) => {
  const { classId } = useParams(); // Get classId from route if present

  // State for selections
  const [internalSelectedClassId, setInternalSelectedClassId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const [showToast, setShowToast] = useState(false);

  // Reset selections when classId from URL changes (Quick Access)
  useEffect(() => {
    setSelectedExamId('');
    setSelectedSubjectId('');
  }, [classId]);

  // Use classId from URL or internal selection
  const activeClassId = classId || internalSelectedClassId;

  // Toggles for Mark Columns
  const [includeTe, setIncludeTe] = useState(true);
  const [includeCe, setIncludeCe] = useState(true);

  // Auto-save State
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'modified' | 'saving'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<Date>(new Date());

  // Auto-save Logic (Every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoSaveStatus === 'modified') {
        triggerAutoSave();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoSaveStatus]);

  const triggerAutoSave = () => {
    setAutoSaveStatus('saving');
    // Simulate save delay (since data is already in state, this is visual feedback)
    setTimeout(() => {
      setAutoSaveStatus('saved');
      setLastSavedTime(new Date());
    }, 800);
  };

  // Get all classes relevant to this teacher
  const relevantClasses = state.classes.filter((c: any) => {
    const isCT = getId(c.classTeacherId) === getId(teacher);
    const hasAssignment = state.assignments.some((a: any) =>
      getId(a.classId) === c.id && getId(a.teacherId) === getId(teacher)
    );
    return isCT || hasAssignment;
  });

  // Get all exams for selected class
  const relevantExams = state.exams.filter((exam: Exam) => {
    const examClassId = getId(exam.classId);
    if (!activeClassId) return false;
    if (examClassId !== activeClassId) return false;

    // Permissions check
    const isCT = state.classes.some((c: any) =>
      c.id === examClassId && getId(c.classTeacherId) === getId(teacher)
    );
    const isST = state.assignments.some((a: any) =>
      getId(a.classId) === examClassId && getId(a.teacherId) === getId(teacher)
    );
    return isCT || isST;
  });

  const selectedExam = state.exams.find((e: any) => e.id === selectedExamId);
  const selectedClass = state.classes.find((c: any) => c.id === activeClassId);

  // Filter students
  const students = selectedClass ? state.users.filter((u: any) => {
    const studentClassId = getId(u.classId);
    return u.role === UserRole.STUDENT && studentClassId === selectedClass.id;
  }) : [];

  // Determine if current user is the Class Teacher for this specific class
  const isClassTeacher = getId(selectedClass?.classTeacherId) === getId(teacher);

  // Get configured subjects for this exam, FILTERED by Teacher Assignment
  const examSubjects = selectedExam ? selectedExam.subjectConfigs.map((config: any) => {
    const subId = getId(config.subjectId);
    const sub = state.subjects.find((s: any) => s.id === subId);
    if (!sub) return null;

    // Logic: 
    // 1. If Class Teacher, they *can* see all subjects (usually required for oversight).
    // 2. If Subject Teacher, strictly show only assigned subjects.
    const isAssigned = state.assignments.some((a: any) =>
      getId(a.classId) === getId(selectedExam.classId) &&
      getId(a.subjectId) === subId &&
      getId(a.teacherId) === getId(teacher)
    );

    if (!isClassTeacher && !isAssigned) {
      return null;
    }
    return { ...sub, config };
  }).filter(Boolean) : [];

  // Auto-select subject if only one exists
  useEffect(() => {
    if (examSubjects.length === 1 && !selectedSubjectId) {
      setSelectedSubjectId(examSubjects[0].id);
    }
  }, [examSubjects, selectedSubjectId]);

  const activeConfig = selectedExam?.subjectConfigs.find((c: any) => getId(c.subjectId) === selectedSubjectId);
  const maxTeMarks = activeConfig?.maxTe || 0;
  const maxCeMarks = activeConfig?.maxCe || 0;

  // Detailed Entry State
  const [detailedStudentId, setDetailedStudentId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleMarkUpdate = React.useCallback((studentId: string, type: 'te' | 'ce' | 'att', val: string) => {
    const upperVal = val.toUpperCase();
    const numVal = parseFloat(val);
    const max = type === 'te' ? maxTeMarks : maxCeMarks;

    // Basic validation before optimistic update
    if (type !== 'att' && !isNaN(numVal) && numVal > max) {
      alert(`Maximum mark is ${max}`);
      return;
    }

    // Mark as modified for auto-save
    setAutoSaveStatus('modified');

    // 1. OPTIMISTIC UPDATE
    setState((prev: any) => {
      if (type === 'att') {
        const existingIndex = prev.attendance.findIndex((a: any) =>
          getId(a.examId) === selectedExamId && getId(a.studentId) === studentId
        );
        let updatedAtt = [...prev.attendance];
        const newAtt = {
          examId: selectedExamId,
          studentId,
          percentage: upperVal,
          updatedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
          updatedAtt[existingIndex] = { ...updatedAtt[existingIndex], ...newAtt };
        } else {
          updatedAtt.push(newAtt);
        }
        return { ...prev, attendance: updatedAtt };
      } else {
        const existingIndex = prev.marks.findIndex((m: any) =>
          getId(m.studentId) === studentId &&
          getId(m.subjectId) === selectedSubjectId &&
          getId(m.examId) === selectedExamId
        );

        let updatedMarks = [...prev.marks];
        const newMark = {
          studentId,
          subjectId: selectedSubjectId,
          examId: selectedExamId,
          [type === 'te' ? 'teMark' : 'ceMark']: upperVal,
          updatedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
          updatedMarks[existingIndex] = { ...updatedMarks[existingIndex], ...newMark };
        } else {
          updatedMarks.push(newMark);
        }
        return { ...prev, marks: updatedMarks };
      }
    });

    // 2. BACKGROUND API CALL
    const performAsyncUpdate = async () => {
      try {
        if (type === 'att') {
          await attendanceAPI.upsert({
            examId: selectedExamId,
            studentId,
            percentage: upperVal
          });
        } else {
          const markData = {
            studentId,
            subjectId: selectedSubjectId,
            examId: selectedExamId,
            [type === 'te' ? 'teMark' : 'ceMark']: upperVal
          };
          await markAPI.create(markData);
        }
      } catch (error) {
        console.error('Failed to sync mark/attendance with server:', error);
        setAutoSaveStatus('modified');
      }
    };

    performAsyncUpdate();
  }, [selectedExamId, selectedSubjectId, maxTeMarks, maxCeMarks, setState]);

  const handleDetailedMarkUpdate = async (studentId: string, sectionId: string, val: string) => {
    const numVal = parseFloat(val) || 0;

    setState((prev: any) => {
      const markIndex = prev.marks.findIndex((m: any) =>
        getId(m.studentId) === studentId &&
        getId(m.subjectId) === selectedSubjectId &&
        getId(m.examId) === selectedExamId
      );

      if (markIndex === -1) return prev;

      const updatedMarks = [...prev.marks];
      const currentMark = { ...updatedMarks[markIndex] };
      const detailedMarks = [...(currentMark.detailedMarks || [])];

      const secIndex = detailedMarks.findIndex(dm => dm.sectionId === sectionId);
      if (secIndex >= 0) {
        detailedMarks[secIndex] = { sectionId, marks: numVal };
      } else {
        detailedMarks.push({ sectionId, marks: numVal });
      }

      currentMark.detailedMarks = detailedMarks;
      updatedMarks[markIndex] = currentMark;

      return { ...prev, marks: updatedMarks };
    });

    setAutoSaveStatus('modified');
  };

  const saveDetailedMarks = async (studentId: string) => {
    const mark = state.marks.find((m: any) =>
      getId(m.studentId) === studentId &&
      getId(m.subjectId) === selectedSubjectId &&
      getId(m.examId) === selectedExamId
    );
    if (!mark) return;

    try {
      await markAPI.create({
        ...mark,
        studentId,
        subjectId: selectedSubjectId,
        examId: selectedExamId
      });

      // Auto-trigger AI Analysis after saving detailed marks
      await runAIAnalysis(studentId);

      setDetailedStudentId(null);
      showToastMsg('Detailed marks saved and analyzed');
    } catch (e) {
      console.error(e);
      alert('Failed to save detailed marks');
    }
  };

  const toggleLock = async (studentId: string) => {
    const mark = state.marks.find((m: any) =>
      getId(m.studentId) === studentId &&
      getId(m.subjectId) === selectedSubjectId &&
      getId(m.examId) === selectedExamId
    );
    if (!mark) return;

    const newLockedStatus = !mark.isLocked;

    setState((prev: any) => {
      const idx = prev.marks.findIndex((m: any) => m.id === mark.id);
      if (idx === -1) return prev;
      const updated = [...prev.marks];
      updated[idx] = { ...updated[idx], isLocked: newLockedStatus };
      return { ...prev, marks: updated };
    });

    try {
      await markAPI.create({
        ...mark,
        studentId,
        subjectId: selectedSubjectId,
        examId: selectedExamId,
        isLocked: newLockedStatus
      });
    } catch (e) {
      console.error(e);
    }
  };

  const runAIAnalysis = async (studentId: string) => {
    const mark = state.marks.find((m: any) =>
      getId(m.studentId) === studentId &&
      getId(m.subjectId) === selectedSubjectId &&
      getId(m.examId) === selectedExamId
    );
    if (!mark || !mark.id) {
      alert('Please save marks first before running AI analysis');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await markAPI.analyze(mark.id);
      setState((prev: any) => {
        const idx = prev.marks.findIndex((m: any) => m.id === mark.id);
        const updated = [...prev.marks];
        updated[idx] = { ...updated[idx], aiAnalysis: response.data.analysis, aiAdvice: response.data.advice };
        return { ...prev, marks: updated };
      });
      showToastMsg('AI Analysis Complete');
    } catch (e) {
      console.error(e);
      alert('AI Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const showToastMsg = (msg: string) => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {activeClassId && selectedClass ? (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Class {selectedClass.name}</span>
              <ChevronRight size={12} className="text-slate-300" />
              <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest">Mark Entry</span>
            </div>
          ) : (
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gradebook</h1>
          )}
          <p className="text-slate-400 font-bold text-xs">Enter marks for exams and subjects</p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-100 shadow-sm transition-all whitespace-nowrap">
            {autoSaveStatus === 'saving' && <Loader2 size={14} className="text-blue-500 animate-spin" />}
            {autoSaveStatus === 'modified' && <CloudOff size={14} className="text-amber-500" />}
            {autoSaveStatus === 'saved' && <Cloud size={14} className="text-green-500" />}

            <span className={`text-[10px] font-black uppercase tracking-wider ${autoSaveStatus === 'saving' ? 'text-blue-600' :
              autoSaveStatus === 'modified' ? 'text-amber-600' : 'text-slate-400'
              }`}>
              {autoSaveStatus === 'saving' ? 'Saving...' :
                autoSaveStatus === 'modified' ? 'Unsaved' :
                  'Saved'}
            </span>
          </div>

          <button
            onClick={() => window.location.href = '/teacher/section-marks'}
            className="w-10 h-10 md:w-auto md:px-4 md:py-2.5 bg-slate-100 text-slate-700 font-black rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-all text-xs"
            title="Detailed Entry Mode"
          >
            <ClipboardList size={18} className="md:mr-2" />
            <span className="hidden md:inline">Detailed</span>
          </button>

          <button
            onClick={() => showToastMsg('Manual save triggered')}
            className="flex-1 md:flex-none px-5 py-2.5 bg-blue-600 text-white font-black rounded-xl shadow-premium flex items-center justify-center hover:bg-blue-700 transition-all text-xs"
          >
            <Save size={18} className="mr-2" /> Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {!classId && (
          <div className="native-card !p-3">
            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Class</label>
            <select
              value={internalSelectedClassId}
              onChange={(e) => {
                setInternalSelectedClassId(e.target.value);
                setSelectedExamId('');
                setSelectedSubjectId('');
              }}
              className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-700 font-bold outline-none text-sm appearance-none"
            >
              <option value="">Choose Class...</option>
              {relevantClasses.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className={`native-card !p-3 ${!classId ? '' : 'md:col-span-1'}`}>
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Exam</label>
          <select
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              setSelectedSubjectId('');
            }}
            disabled={!activeClassId}
            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-700 font-bold outline-none text-sm appearance-none disabled:bg-slate-100"
          >
            <option value="">{activeClassId ? 'Choose Exam...' : 'Select Class First'}</option>
            {relevantExams.map((ex: any) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>
        <div className={`native-card !p-3 ${!classId ? '' : 'md:col-span-1'}`}>
          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={!selectedExamId}
            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-700 font-bold outline-none text-sm appearance-none disabled:bg-slate-100"
          >
            <option value="">{selectedExamId ? 'Choose Subject...' : 'Select Exam First'}</option>
            {examSubjects.map((sub: any) => (
              <option key={sub.id} value={sub.id}>{sub.name} ({sub.config.maxTe}/{sub.config.maxCe})</option>
            ))}
          </select>
        </div>
      </div>

      {selectedExamId && selectedSubjectId ? (
        <div className="animate-slide-up">
          <div className="native-card !p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 backdrop-blur-sm sticky top-[60px] z-30 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-premium">
                {selectedClass?.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <span className="text-[8px] font-black text-blue-600 uppercase tracking-[0.2em] block truncate">{selectedExam.name}</span>
                <h3 className="text-sm font-black text-slate-900 truncate">
                  {state.subjects.find((s: any) => s.id === selectedSubjectId)?.name}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-100">
                <button
                  onClick={() => setIncludeTe(!includeTe)}
                  className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${includeTe ? 'text-blue-600' : 'text-slate-400'}`}
                >
                  {includeTe ? <CheckSquare size={14} /> : <Square size={14} />}
                  TE ({maxTeMarks})
                </button>
                <div className="w-px h-3 bg-slate-200"></div>
                <button
                  onClick={() => setIncludeCe(!includeCe)}
                  className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${includeCe ? 'text-blue-600' : 'text-slate-400'}`}
                >
                  {includeCe ? <CheckSquare size={14} /> : <Square size={14} />}
                  CE ({maxCeMarks})
                </button>
              </div>

              {maxCeMarks > 0 && (
                <button
                  onClick={async () => {
                    const valStr = prompt(`Auto Fill CE Mark (Max: ${maxCeMarks})\n\nEnter a value to apply to all students.\nEnter 'C' to CLEAR all CE marks.`);
                    if (valStr === null) return;

                    const isClear = valStr.trim().toUpperCase() === 'C';
                    let val = 0;

                    if (!isClear) {
                      val = parseFloat(valStr);
                      if (isNaN(val) || val < 0 || val > maxCeMarks) {
                        alert(`⚠️ ERROR: Invalid mark! entered value (${val}) exceeds maximum CE marks (${maxCeMarks}).`);
                        return;
                      }
                    }

                    const finalVal = isClear ? '' : val.toString();
                    const bulkLoad: any[] = [];

                    // Update State
                    setState((prev: any) => {
                      const newMarks = [...prev.marks];
                      students.forEach((student: any) => {
                        const idx = newMarks.findIndex((m: any) =>
                          getId(m.studentId) === student.id &&
                          getId(m.subjectId) === selectedSubjectId &&
                          getId(m.examId) === selectedExamId
                        );
                        const existing = idx >= 0 ? newMarks[idx] : null;
                        if (existing?.isLocked) return; // Skip locked

                        const updatedMark = existing
                          ? { ...existing, ceMark: finalVal, updatedAt: new Date().toISOString() }
                          : {
                            studentId: student.id,
                            subjectId: selectedSubjectId,
                            examId: selectedExamId,
                            ceMark: finalVal,
                            teMark: '0',
                            updatedAt: new Date().toISOString()
                          };

                        if (idx >= 0) newMarks[idx] = updatedMark;
                        else newMarks.push(updatedMark);

                        bulkLoad.push({
                          studentId: student.id,
                          subjectId: selectedSubjectId,
                          examId: selectedExamId,
                          teMark: existing?.teMark, // Preserve TE
                          ceMark: finalVal,
                          detailedMarks: existing?.detailedMarks || [] // Preserve details
                        });
                      });
                      return { ...prev, marks: newMarks };
                    });

                    if (bulkLoad.length > 0) {
                      try {
                        await markAPI.bulkCreate({ marks: bulkLoad });
                        showToastMsg(isClear ? `Cleared CE for ${bulkLoad.length} students` : `Updated CE to ${finalVal} for ${bulkLoad.length} students`);
                      } catch (e) {
                        console.error(e);
                        alert('Failed to sync auto-fill to server');
                      }
                    }
                  }}
                  className="w-9 h-9 flex items-center justify-center bg-pink-500 text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-pink-200"
                  title="Auto Fill CE"
                >
                  <Smartphone size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {students.map((student: any) => {
              const mark = state.marks.find((m: any) =>
                getId(m.studentId) === student.id &&
                getId(m.subjectId) === selectedSubjectId &&
                getId(m.examId) === selectedExamId
              );

              // Fix for phantom 0.50 marks reported by user
              const cleanPhantom = (val: any) => {
                if (!val && val !== 0) return '';
                const n = parseFloat(val);
                // Check closely for 0.5 or 0.50
                return Math.abs(n - 0.5) < 0.0001 ? '' : val;
              };

              const safeTeMark = cleanPhantom(mark?.teMark);
              const safeCeMark = cleanPhantom(mark?.ceMark);

              const att = state.attendance.find((a: any) =>
                getId(a.examId) === selectedExamId && getId(a.studentId) === student.id
              );

              return (
                <MarkInputRow
                  key={student.id}
                  student={student}
                  teMark={safeTeMark}
                  ceMark={safeCeMark}
                  attendance={att?.percentage}
                  teEnabled={includeTe}
                  ceEnabled={includeCe}
                  maxTeMarks={maxTeMarks}
                  maxCeMarks={maxCeMarks}
                  onUpdate={handleMarkUpdate}
                  onDetailedEntry={(sid) => setDetailedStudentId(sid)}
                  hasMarkSections={(activeConfig?.markSections || []).length > 0}
                  isLocked={mark?.isLocked}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="native-card py-24 text-center border-2 border-dashed border-slate-200 flex flex-col items-center justify-center opacity-60">
          <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4 text-slate-400">
            <Calendar size={28} />
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Select context to start entry</p>
        </div>
      )}

      {/* Detailed Entry Modal */}
      {detailedStudentId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-800">Detailed Mark Entry</h3>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  {students.find(s => s.id === detailedStudentId)?.name} • {state.subjects.find((s: any) => s.id === selectedSubjectId)?.name}
                </p>
              </div>
              <button onClick={() => setDetailedStudentId(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Summary Score */}
              {(() => {
                const mark = state.marks.find((m: any) => getId(m.studentId) === detailedStudentId && getId(m.subjectId) === selectedSubjectId);
                const totalDetailed = mark?.detailedMarks?.reduce((acc: any, dm: any) => acc + dm.marks, 0) || 0;
                const roundedTotal = Math.ceil(totalDetailed);
                const recordedTe = parseFloat(mark?.teMark || '0');
                const isMismatch = roundedTotal !== recordedTe;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-4 rounded-2xl border ${isMismatch ? 'bg-amber-50 border-amber-200' : 'bg-blue-50/50 border-blue-100'}`}>
                        <span className="block text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Calculated (Sections)</span>
                        <div className="text-2xl font-black text-slate-900">
                          {totalDetailed}
                          <span className="text-xs font-bold text-slate-400 ml-1">→ {roundedTotal}</span>
                        </div>
                      </div>
                      <div className={`p-4 rounded-2xl border ${isMismatch ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Recorded TE</span>
                        <div className="text-2xl font-black text-slate-800">
                          {mark?.teMark || 0}
                          {isMismatch && <AlertCircle size={16} className="text-amber-500 inline ml-2 mb-1" />}
                        </div>
                      </div>
                    </div>

                    {isMismatch && (
                      <div className="flex items-center justify-between p-3 bg-amber-100/50 rounded-xl border border-amber-200">
                        <span className="text-[10px] font-bold text-amber-700 uppercase">Total mismatch detected!</span>
                        <button
                          onClick={() => {
                            setState((prev: any) => {
                              const idx = prev.marks.findIndex((m: any) => m.id === mark.id);
                              const updated = [...prev.marks];
                              updated[idx] = { ...updated[idx], teMark: roundedTotal.toString() };
                              return { ...prev, marks: updated };
                            });
                          }}
                          className="px-3 py-1 bg-amber-600 text-white text-[10px] font-black uppercase rounded-lg shadow-sm hover:bg-amber-700 transition-all"
                        >
                          Sync Record to {roundedTotal}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Sections Table */}
              <div className="space-y-4">
                {(activeConfig?.markSections || []).map((section: any) => {
                  const mark = state.marks.find((m: any) => getId(m.studentId) === detailedStudentId && getId(m.subjectId) === selectedSubjectId);
                  const detailedVal = mark?.detailedMarks?.find((dm: any) => dm.sectionId === section.id)?.marks;

                  return (
                    <div key={section.id} className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[11px] font-black text-slate-600 uppercase tracking-wide">{section.name} ({section.markValue} Mark Qns)</label>
                        <span className="text-[10px] font-bold text-slate-400">Max: {section.maxMarks}</span>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        value={detailedVal ?? ''}
                        onChange={(e) => handleDetailedMarkUpdate(detailedStudentId, section.id, e.target.value)}
                        disabled={mark?.isLocked}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-lg font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                        placeholder="Enter score..."
                      />
                    </div>
                  );
                })}
              </div>

              {/* AI Analysis View */}
              {(state.marks.find((m: any) => getId(m.studentId) === detailedStudentId && getId(m.subjectId) === selectedSubjectId)?.aiAdvice) && (
                <div className="bg-purple-50 p-6 rounded-[2rem] border border-purple-100">
                  <h4 className="flex items-center text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-3">
                    <Smartphone size={14} className="mr-2" /> AI Progress Advice
                  </h4>
                  <p className="text-sm font-bold text-purple-900 leading-relaxed italic">
                    {state.marks.find((m: any) => getId(m.studentId) === detailedStudentId && getId(m.subjectId) === selectedSubjectId)?.aiAdvice}
                  </p>
                </div>
              )}
            </div>

            <div className="px-8 py-6 border-t border-slate-50 w-full flex gap-3">
              <button
                onClick={() => runAIAnalysis(detailedStudentId)}
                disabled={isAnalyzing}
                className="flex-1 py-4 bg-purple-600 text-white font-black rounded-2xl shadow-xl shadow-purple-200 hover:bg-purple-700 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 size={18} className="animate-spin mr-2" /> : <Smartphone size={18} className="mr-2" />}
                Run AI
              </button>
              <button
                onClick={() => saveDetailedMarks(detailedStudentId)}
                className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center"
              >
                <Save size={18} className="mr-2" /> Save & Close
              </button>
              <button
                onClick={() => toggleLock(detailedStudentId)}
                className={`p-4 rounded-2xl border transition-all ${state.marks.find((m: any) => getId(m.studentId) === detailedStudentId && getId(m.subjectId) === selectedSubjectId)?.isLocked
                  ? 'bg-amber-100 border-amber-200 text-amber-600'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                title={state.marks.find((m: any) => getId(m.studentId) === detailedStudentId && getId(m.subjectId) === selectedSubjectId)?.isLocked ? "Unlock Marks" : "Lock Marks"}
              >
                {state.marks.find((m: any) => getId(m.studentId) === detailedStudentId && getId(m.subjectId) === selectedSubjectId)?.isLocked ? <CheckSquare size={24} /> : <Square size={24} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center space-x-3 border border-white/10 backdrop-blur-xl">
            <CheckCircle2 size={24} className="text-green-400" />
            <span className="font-black uppercase tracking-widest text-xs">Updated Successfully</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkEntry;
