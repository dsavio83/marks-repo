
import React, { useState, useEffect } from 'react';
import { User, Exam, Subject, ClassRoom, ExamSubjectConfig } from '../types';
import { Save, Plus, Trash2, BookOpen, AlertCircle, X, CheckSquare, Square, CheckCircle2, Edit2 } from 'lucide-react';
import { examAPI } from '../services/api';

interface ExamManagerProps {
  teacher: User;
  state: any;
  setState: any;
}

const getId = (obj: any) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj.id || obj._id || '';
};

const ExamManager: React.FC<ExamManagerProps> = ({ teacher, state, setState }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examName, setExamName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [configs, setConfigs] = useState<ExamSubjectConfig[]>([]);

  // Toast State
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
  };

  // STRICT RULE: Only classes where I am the "Class Teacher"
  const myFormClasses = state.classes.filter((c: any) =>
    getId(c.classTeacherId) === getId(teacher)
  );

  const handleOpenModal = (exam?: Exam) => {
    if (exam) {
      setEditingExam(exam);
      setExamName(exam.name);
      setSelectedClassId(getId(exam.classId));
      setConfigs(state.subjects.map((sub: Subject) => {
        const existingConfig = exam.subjectConfigs.find((c: any) => getId(c.subjectId) === sub.id);
        if (existingConfig) {
          return {
            ...existingConfig,
            subjectId: sub.id, // Ensure it's a string ID
            included: true
          };
        }
        // Default config for subjects not in the exam
        const name = sub.name.toLowerCase();
        let maxTe = 40;
        let maxCe = 10;
        if (name.includes('math') || name.includes('english') || name.includes('social')) {
          maxTe = 80;
          maxCe = 20;
        } else if (
          name.includes('art') || name.includes('work') ||
          name.includes('physical') || name.includes('sport') || name.includes('yoga')
        ) {
          maxTe = 15;
          maxCe = 25;
        }
        return {
          subjectId: sub.id,
          maxTe,
          maxCe,
          included: false
        };
      }));
    } else {
      setEditingExam(null);
      setExamName('');
      setSelectedClassId('');
      setConfigs([]);
    }
    setShowModal(true);
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    // Initialize configs
    const newConfigs = state.subjects.map((sub: Subject) => {
      const name = sub.name.toLowerCase();
      let maxTe = 40;
      let maxCe = 10;

      if (name.includes('math') || name.includes('english') || name.includes('social')) {
        maxTe = 80;
        maxCe = 20;
      } else if (
        name.includes('art') || name.includes('work') ||
        name.includes('physical') || name.includes('sport') || name.includes('yoga')
      ) {
        maxTe = 15;
        maxCe = 25;
      }

      return {
        subjectId: sub.id,
        maxTe,
        maxCe,
        included: true
      };
    });
    setConfigs(newConfigs);
  };

  const toggleSubject = (subjectId: string) => {
    setConfigs(configs.map(c => c.subjectId === subjectId ? { ...c, included: !c.included } : c));
  };

  const updateConfig = (subjectId: string, field: 'maxTe' | 'maxCe', value: number) => {
    setConfigs(configs.map(c => c.subjectId === subjectId ? { ...c, [field]: value } : c));
  };



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !examName) return;

    try {
      const examData = {
        name: examName,
        classId: selectedClassId,
        subjectConfigs: configs.filter(c => c.included)
      };

      let savedExam;
      if (editingExam) {
        const response = await examAPI.update(editingExam.id, examData);
        savedExam = response.data.exam;
      } else {
        const response = await examAPI.create(examData);
        // Merge response (which has ID) with sent data (which has subjectConfigs) to avoid undefined error
        savedExam = { ...examData, ...response.data.exam };
      }

      setState((prev: any) => {
        const updatedExams = editingExam
          ? prev.exams.map((ex: any) => ex.id === editingExam.id ? { ...ex, ...savedExam } : ex)
          : [...prev.exams, savedExam];

        return { ...prev, exams: updatedExams };
      });

      showToast(editingExam ? 'Exam updated successfully' : 'Exam created successfully', 'success');
      setShowModal(false);
    } catch (e) {
      console.error(e);
      showToast('Failed to save exam', 'error');
    }
  };

  const deleteExam = async (id: string) => {
    if (!window.confirm("Are you sure? This will delete all marks associated with this exam.")) return;
    try {
      await examAPI.delete(id);
      // Use functional update to ensure we are working with the latest state
      setState((prev: any) => ({
        ...prev,
        exams: prev.exams.filter((e: any) => e.id !== id),
        marks: prev.marks.filter((m: any) => m.examId !== id)
      }));
      showToast('Exam deleted successfully', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to delete exam', 'error');
    }
  };


  const myExams = state.exams.filter((ex: any) => {
    return myFormClasses.some((c: any) => c.id === getId(ex.classId));
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-10">
          <h1 className="text-3xl font-black text-slate-900">Exam Management</h1>
          <p className="text-slate-400 font-bold truncate">Create exams and configure subject marks (Class Teachers Only)</p>
        </div>
        <div className="col-span-2 flex justify-end">
          <button
            onClick={() => handleOpenModal()}
            disabled={myFormClasses.length === 0}
            className="p-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed aspect-square"
            title="Create Exam"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myExams.length > 0 ? myExams.map((exam: Exam) => {
          const examClassId = typeof (exam.classId as any) === 'object' && exam.classId ? ((exam.classId as any).id || (exam.classId as any)._id) : exam.classId;
          const cls = state.classes.find((c: any) => c.id === examClassId);
          return (
            <div key={exam.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:shadow-xl transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                  <BookOpen size={24} />
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleOpenModal(exam)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-xl"><Edit2 size={16} /></button>
                  <button onClick={() => deleteExam(exam.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-xl"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-1">{exam.name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Class {cls?.name}</p>

              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Included Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {exam.subjectConfigs?.map((c: any) => {
                    const subId = getId(c.subjectId);
                    const sub = state.subjects.find((s: any) => s.id === subId);
                    return (
                      <span key={`exam-sub-${subId}`} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">
                        {sub?.name} ({c.maxTe}/{c.maxCe})
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <AlertCircle size={32} className="text-slate-300" />
            </div>
            {myFormClasses.length === 0 ? (
              <p className="text-slate-400 font-bold">You are not assigned as a Class Teacher for any class.<br />Only Class Teachers can create exams.</p>
            ) : (
              <p className="text-slate-400 font-bold">No exams created for your classes yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800">{editingExam ? 'Edit Exam' : 'Create New Exam'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl"><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class</label>
                  <select
                    required
                    value={selectedClassId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    disabled={!!editingExam}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="">Select Class</option>
                    {myFormClasses.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Exam Name</label>
                  <input
                    required
                    placeholder="e.g. Quarterly Exam"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              {selectedClassId && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configure Subjects</label>
                    <span className="text-[10px] text-slate-400 italic">Uncheck subjects not in this exam</span>
                  </div>
                  <div className="space-y-2">
                    {configs.map((config) => {
                      const subject = state.subjects.find((s: any) => s.id === config.subjectId);
                      if (!subject) return null;
                      return (
                        <div key={`config-${config.subjectId}`} className={`flex flex-col p-4 rounded-[2rem] border ${config.included ? 'bg-white border-blue-100 shadow-md' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => toggleSubject(config.subjectId)}
                              className={`${config.included ? 'text-blue-600' : 'text-slate-400'}`}
                            >
                              {config.included ? <CheckSquare size={24} /> : <Square size={24} />}
                            </button>
                            <span className="flex-1 font-black text-slate-800">{subject.name}</span>

                            {config.included && (
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center">
                                  <span className="text-[8px] font-black uppercase text-slate-400 mb-0.5 tracking-widest">Max TE</span>
                                  <input
                                    type="number"
                                    value={config.maxTe}
                                    onChange={(e) => updateConfig(config.subjectId, 'maxTe', parseInt(e.target.value) || 0)}
                                    className="w-16 bg-slate-50 border border-slate-100 rounded-xl py-2 text-center font-black text-sm text-blue-600 outline-none focus:ring-2 focus:ring-blue-100"
                                  />
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-[8px] font-black uppercase text-slate-400 mb-0.5 tracking-widest">Max CE</span>
                                  <input
                                    type="number"
                                    value={config.maxCe}
                                    onChange={(e) => updateConfig(config.subjectId, 'maxCe', parseInt(e.target.value) || 0)}
                                    className="w-16 bg-slate-50 border border-slate-100 rounded-xl py-2 text-center font-black text-sm text-purple-600 outline-none focus:ring-2 focus:ring-purple-100"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Detailed Mark Sections */}
                          {config.included && (
                            <div className="mt-4 pt-4 border-t border-slate-50">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mark Sections (Detailed Entry)</h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSections = [...(config.markSections || []), { id: Math.random().toString(36).substr(2, 9), name: '', markValue: 1, maxMarks: 0 }];
                                    setConfigs(configs.map(c => c.subjectId === config.subjectId ? { ...c, markSections: newSections } : c));
                                  }}
                                  className="text-[10px] font-black text-blue-600 uppercase flex items-center hover:underline"
                                >
                                  <Plus size={12} className="mr-1" /> Add Section
                                </button>
                              </div>

                              <div className="space-y-2">
                                {(config.markSections || []).map((section: any, sIdx: number) => (
                                  <div key={section.id || section._id || sIdx} className="flex items-center gap-2 group">
                                    <input
                                      placeholder="Section Name (e.g. 1 Mark Qns)"
                                      value={section.name}
                                      onChange={(e) => {
                                        const newSections = [...(config.markSections || [])];
                                        newSections[sIdx].name = e.target.value;
                                        setConfigs(configs.map(c => c.subjectId === config.subjectId ? { ...c, markSections: newSections } : c));
                                      }}
                                      className="flex-1 bg-slate-50 border-none rounded-lg px-3 py-1.5 text-[11px] font-black"
                                    />
                                    <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-2">
                                      <span className="text-[8px] font-black text-slate-400 uppercase">Val</span>
                                      <input
                                        type="number"
                                        step="0.5"
                                        value={section.markValue}
                                        onChange={(e) => {
                                          const newVal = parseFloat(e.target.value) || 0;
                                          const newSections = [...(config.markSections || [])];
                                          newSections[sIdx].markValue = newVal;
                                          // Auto-calculate Max based on Qty
                                          const qty = newSections[sIdx].qty || 0;
                                          newSections[sIdx].maxMarks = newVal * qty;
                                          // Auto-update Name if it's default
                                          if (!newSections[sIdx].name || newSections[sIdx].name.toLowerCase().includes('mark qns')) {
                                            newSections[sIdx].name = `${newVal} Mark Qns`;
                                          }
                                          setConfigs(configs.map(c => c.subjectId === config.subjectId ? { ...c, markSections: newSections } : c));
                                        }}
                                        className="w-10 bg-transparent border-none py-1.5 text-xs font-bold text-center"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-2">
                                      <span className="text-[8px] font-black text-slate-400 uppercase">Qty</span>
                                      <input
                                        type="number"
                                        value={section.qty || (section.markValue > 0 ? section.maxMarks / section.markValue : 0)}
                                        onChange={(e) => {
                                          const newQty = parseInt(e.target.value) || 0;
                                          const newSections = [...(config.markSections || [])];
                                          newSections[sIdx].qty = newQty;
                                          newSections[sIdx].maxMarks = (newSections[sIdx].markValue || 1) * newQty;
                                          setConfigs(configs.map(c => c.subjectId === config.subjectId ? { ...c, markSections: newSections } : c));
                                        }}
                                        className="w-10 bg-transparent border-none py-1.5 text-xs font-bold text-center text-blue-600"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 min-w-[50px]">
                                      <span className="text-[8px] font-black text-slate-400 uppercase">Max</span>
                                      <span className="px-1 text-xs font-black text-blue-700">{section.maxMarks}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newSections = (config.markSections || []).filter((_: any, i: number) => i !== sIdx);
                                        setConfigs(configs.map(c => c.subjectId === config.subjectId ? { ...c, markSections: newSections } : c));
                                      }}
                                      className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                                {(config.markSections || []).length > 0 && (
                                  <div className="flex justify-end pt-1 pr-12">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                      Total Detailed: {(config.markSections || []).reduce((acc: number, s: any) => acc + s.maxMarks, 0)}
                                      {(config.markSections || []).reduce((acc: number, s: any) => acc + s.maxMarks, 0) > config.maxTe &&
                                        <span className="ml-2 text-red-500">(! Exceeds TE)</span>
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200/50 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center">
                  <Save size={20} className="mr-2" /> Save Exam Configuration
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

export default ExamManager;
