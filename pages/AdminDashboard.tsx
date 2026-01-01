
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { User, UserRole, ClassRoom, Subject, GradeScheme, GradeBoundary } from '../types';
import {
    Plus, Edit2, Trash2, Search, Filter,
    MoreVertical, CheckCircle2, UserPlus, BookOpen,
    Settings, GraduationCap, X, Save, Users, Layers, Upload, Building, AlertCircle, Download, Database, RefreshCw, Loader2
} from 'lucide-react';
import { saveAppState, clearAppState } from '../store';
import { userAPI, classAPI, subjectAPI, gradeAPI, schoolAPI } from '../services/api';

interface AdminDashboardProps {
    state: any;
    setState: any;
}

const getId = (obj: any) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj.id || obj._id || '';
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ state, setState }) => {
    const location = useLocation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const jsonInputRef = useRef<HTMLInputElement>(null);

    // Determine active view based on URL path
    const pathPart = location.pathname.split('/').pop();
    const activeTab = ['teachers', 'students', 'classes', 'subjects', 'grades', 'school', 'data'].includes(pathPart || '')
        ? pathPart as 'teachers' | 'students' | 'classes' | 'subjects' | 'grades' | 'school' | 'data'
        : 'stats';

    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    // Toast State
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    // State for Class Creation (Subject Mapping)
    const [selectedSubjects, setSelectedSubjects] = useState<{ [key: string]: string }>({}); // subjectId -> teacherId

    // State for Grade Editing
    const [editingGradeScheme, setEditingGradeScheme] = useState<GradeScheme | null>(null);

    // Loading states for save and delete operations
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // State for Class Statistics (subject counts)
    const [classStats, setClassStats] = useState<{ [key: string]: { subjectCount: number } }>({});

    // Fetch class statistics when classes change or tab becomes active
    useEffect(() => {
        if (activeTab === 'classes' && state.classes.length > 0) {
            const fetchStats = async () => {
                const stats: any = {};
                await Promise.all(state.classes.map(async (c: any) => {
                    try {
                        const response = await classAPI.getSubjects(c.id);
                        stats[c.id] = { subjectCount: response.data.length };
                    } catch (e) {
                        console.error(`Failed to fetch stats for class ${c.id}`, e);
                        stats[c.id] = { subjectCount: 0 };
                    }
                }));
                setClassStats(stats);
            };
            fetchStats();
        }
    }, [activeTab, state.classes]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
    };

    // Initialize selected subjects when editing a class
    useEffect(() => {
        if (editingItem && activeTab === 'classes') {
            const assignments = state.assignments.filter((a: any) => a.classId === editingItem.id);
            const map: any = {};
            assignments.forEach((a: any) => {
                map[a.subjectId] = a.teacherId;
            });
            setSelectedSubjects(map);
        } else if (!showModal) {
            // Only clear when modal is closed, not when data changes
            setSelectedSubjects({});
        }
    }, [editingItem, activeTab, showModal]);

    // --- DATA MANAGEMENT (JSON Backup/Restore) ---

    const handleBackupData = () => {
        try {
            const dataStr = JSON.stringify(state, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

            const exportFileDefaultName = `smart_school_data_${new Date().toISOString().slice(0, 10)}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();

            showToast("Backup downloaded successfully!", "success");
        } catch (e) {
            showToast("Failed to generate backup", "error");
        }
    };

    const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                // Basic validation check
                if (!json.users || !json.classes || !json.subjects) {
                    throw new Error("Invalid data format");
                }

                if (window.confirm("Warning: This will overwrite all current data. Are you sure you want to restore from this file?")) {
                    setState(json);
                    saveAppState(json); // Force save to local storage immediately
                    showToast("Data restored successfully!", "success");
                    // Optional: Reload page to ensure clean state
                    // window.location.reload(); 
                }
            } catch (err) {
                console.error(err);
                showToast("Invalid JSON file or corrupted data.", "error");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    const handleFactoryReset = () => {
        if (window.confirm("DANGER: This will delete ALL data and return to the initial demo state. This cannot be undone. Are you sure?")) {
            clearAppState();
        }
    };

    // --- CSV Export Teachers (Existing) ---
    const handleExportTeachers = () => {
        const teachers = state.users.filter((u: any) => u.role === UserRole.TEACHER);
        if (teachers.length === 0) {
            showToast("No teachers to export.", 'error');
            return;
        }
        const headers = ["Class", "Division", "Name", "Username", "Password", "Mobile", "Email", "DOB"];
        const rows = teachers.map((t: any) => {
            const tClass = state.classes.find((c: any) => getId(c.classTeacherId) === t.id);
            return [
                `"${tClass?.gradeLevel || ''}"`, `"${tClass?.section || ''}"`,
                `"${t.name}"`, `"${t.username}"`, `"${t.password || ''}"`, `"${t.mobile || ''}"`, `"${t.email || ''}"`, `"${t.dob || ''}"`
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((e: any[]) => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "teachers_list.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Teachers exported successfully", 'success');
    };

    // --- CSV Import Teachers (Existing) ---
    // --- CSV Export Students (New for Admin) ---
    const handleExportStudents = () => {
        const students = state.users.filter((u: any) => u.role === UserRole.STUDENT);
        if (students.length === 0) {
            showToast("No students to export.", 'error');
            return;
        }
        const headers = ["Class", "Division", "Name", "AdmissionNo", "Gender", "Category", "Caste", "Mobile", "Email", "Transport", "DOB", "Address"];
        const rows = students.map((s: any) => {
            const sClass = state.classes.find((c: any) => c.id === getId(s.classId));
            return [
                `"${sClass?.gradeLevel || ''}"`, `"${sClass?.section || ''}"`,
                `"${s.name}"`, `"${s.admissionNo}"`, `"${s.gender}"`, `"${s.category}"`,
                `"${s.caste || ''}"`, `"${s.mobile || ''}"`, `"${s.email || ''}"`,
                `"${s.transportMode || ''}"`, `"${s.dob || ''}"`, `"${s.address || ''}"`
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((e: any[]) => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "students_list_all.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Students exported successfully", 'success');
    };

    // --- CSV Import Students (New for Admin) ---
    const handleImportStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSaving(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split('\n');
                const lowerHeader = lines[0].toLowerCase();
                const startIndex = (lowerHeader.includes('name') || lowerHeader.includes('class')) ? 1 : 0;
                const hasClassCols = lowerHeader.includes('class') || lowerHeader.includes('division') || lowerHeader.includes('section');

                let successCount = 0;
                let errorCount = 0;

                showToast(`Importing ${lines.length - startIndex} students...`, 'success');

                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
                    if (cols.length < 2) continue;

                    const offset = hasClassCols ? 2 : 0;
                    const gradeLevel = hasClassCols ? cols[0] : '';
                    const sectionName = hasClassCols ? cols[1].toUpperCase() : '';

                    // Find correct class
                    const targetClass = state.classes.find((c: any) =>
                        c.gradeLevel === gradeLevel && c.section === sectionName
                    );

                    const admissionNo = cols[offset + 1];
                    const mobile = cols[offset + 5] || admissionNo;

                    const studentData = {
                        name: cols[offset + 0],
                        username: admissionNo,
                        admissionNo: admissionNo,
                        mobile: mobile,
                        password: mobile, // default password as mobile
                        gender: (cols[offset + 2] === 'Female' ? 'Female' : 'Male') as any,
                        category: (cols[offset + 3] || 'General') as any,
                        caste: cols[offset + 4] || '',
                        email: cols[offset + 6] || '',
                        transportMode: cols[offset + 7] as any || '',
                        dob: cols[offset + 8] || '',
                        address: cols[offset + 9] || '',
                        role: UserRole.STUDENT,
                        classId: targetClass ? targetClass.id : undefined
                    };

                    if (!studentData.classId && hasClassCols) {
                        console.warn(`Class ${gradeLevel}-${sectionName} not found for student ${studentData.name}. Skipping class assignment.`);
                    }

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
            } catch (error) {
                showToast('Failed to import CSV.', 'error');
            } finally {
                setIsSaving(false);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleImportTeachers = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSaving(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split('\n');
                const lowerHeader = lines[0].toLowerCase();
                const startIndex = (lowerHeader.includes('name') || lowerHeader.includes('class')) ? 1 : 0;
                const hasClassCols = lowerHeader.includes('class') || lowerHeader.includes('division') || lowerHeader.includes('section');

                let successCount = 0;
                let errorCount = 0;

                showToast(`Importing ${lines.length - startIndex} teachers...`, 'success');

                for (let i = startIndex; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
                    if (cols.length < 2) continue;

                    const offset = hasClassCols ? 2 : 0;

                    const teacherData = {
                        name: cols[offset + 0],
                        username: cols[offset + 1],
                        password: cols[offset + 2] || '123456',
                        mobile: cols[offset + 3] || '',
                        email: cols[offset + 4] || '',
                        dob: cols[offset + 5] || '',
                        role: UserRole.TEACHER
                    };

                    try {
                        const response = await userAPI.create(teacherData);
                        const savedTeacher = response.data;
                        setState((prev: any) => ({
                            ...prev,
                            users: [...prev.users.filter((u: any) => u.id !== savedTeacher.id), savedTeacher]
                        }));
                        successCount++;
                    } catch (err) {
                        console.error('Failed to import teacher:', teacherData.name, err);
                        errorCount++;
                    }
                }

                if (successCount > 0) {
                    showToast(`Successfully imported ${successCount} teachers.${errorCount > 0 ? ` (${errorCount} failed)` : ''}`, 'success');
                } else if (errorCount > 0) {
                    showToast(`Failed to import teachers. Check console for details.`, 'error');
                }
            } catch (error) {
                showToast('Failed to import CSV.', 'error');
            } finally {
                setIsSaving(false);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // --- CRUD Handlers (Updated for safety) ---

    const handleSaveTeacher = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get('name') as string;
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;
        const mobile = formData.get('mobile') as string;
        const email = formData.get('email') as string;

        // Validate required fields
        if (!name || name.trim() === '') {
            alert('❌ Name is required!');
            return;
        }
        if (!username || username.trim() === '') {
            alert('❌ Username is required!');
            return;
        }

        // Validate password for new teachers or when password is provided
        if (!editingItem && (!password || password.trim() === '')) {
            alert('❌ Password is required for new teachers!');
            return;
        }
        if (password && password.trim() !== '') {
            if (password.length < 2) {
                alert('❌ Password must be at least 2 characters long!');
                return;
            }
        }

        // Validate mobile if provided
        if (mobile && mobile.trim() !== '' && !/^\d{10}$/.test(mobile)) {
            alert('❌ Mobile number must be exactly 10 digits!');
            return;
        }

        // Validate email if provided
        if (email && email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('❌ Please enter a valid email address!');
            return;
        }

        setIsSaving(true);
        try {
            const teacherData: any = {
                name: name.trim(),
                username: username.trim(),
                role: UserRole.TEACHER
            };

            // Only include optional fields if they have values
            if (mobile && mobile.trim() !== '') {
                teacherData.mobile = mobile.trim();
            }
            if (email && email.trim() !== '') {
                teacherData.email = email.trim();
            }
            if (formData.get('dob')) {
                teacherData.dob = formData.get('dob') as string;
            }

            // Only include password if it's provided (for create or update)
            if (password && password.trim() !== '') {
                teacherData.password = password.trim();
            }

            if (editingItem) {
                // Update existing teacher
                const response = await userAPI.update(editingItem.id, teacherData);
                setState((prev: any) => ({
                    ...prev,
                    users: prev.users.map((u: any) => u.id === editingItem.id ? response.data : u)
                }));

                // Show different message based on whether password was updated
                if (password && password.trim() !== '') {
                    showToast('✅ Teacher updated successfully! Password changed.', 'success');
                } else {
                    showToast('✅ Teacher updated successfully! Password unchanged.', 'success');
                }
            } else {
                // Create new teacher
                const response = await userAPI.create(teacherData);
                setState((prev: any) => ({
                    ...prev,
                    users: [...prev.users, response.data]
                }));
                showToast('✅ Teacher added successfully!', 'success');
            }
            setShowModal(false);
            setEditingItem(null);
        } catch (error: any) {
            console.error('Failed to save teacher:', error);
            const errorMsg = error.response?.data?.message || 'Failed to save teacher';
            const details = error.response?.data?.details;
            if (details && details.length > 0) {
                alert(`❌ Validation Error:\n\n${details.join('\n')}`);
            } else {
                alert(`❌ Error: ${errorMsg}`);
            }
            showToast(errorMsg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSubject = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get('name') as string;
        const shortCode = formData.get('shortCode') as string;

        if (!name || name.trim() === '') {
            alert('❌ Subject name is required!');
            return;
        }

        setIsSaving(true);
        try {
            const subData = {
                name: name.trim(),
                shortCode: shortCode?.toUpperCase() || '',
            };

            if (editingItem) {
                // Update existing subject
                const response = await subjectAPI.update(editingItem.id, subData);
                setState((prev: any) => ({
                    ...prev,
                    subjects: prev.subjects.map((s: any) => s.id === editingItem.id ? response.data : s)
                }));
                showToast('✅ Subject updated successfully!', 'success');
            } else {
                // Create new subject
                const response = await subjectAPI.create(subData);
                setState((prev: any) => ({
                    ...prev,
                    subjects: [...prev.subjects, response.data]
                }));
                showToast('✅ Subject added successfully!', 'success');
            }
            setShowModal(false);
            setEditingItem(null);
        } catch (error: any) {
            console.error('Failed to save subject:', error);
            const errorMsg = error.response?.data?.message || 'Failed to save subject';
            const details = error.response?.data?.details;
            if (details && details.length > 0) {
                alert(`❌ Validation Error:\n\n${details.join('\n')}`);
            } else {
                alert(`❌ Error: ${errorMsg}`);
            }
            showToast(errorMsg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveClass = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        const formData = new FormData(e.target as HTMLFormElement);
        const gradeLevel = formData.get('gradeLevel') as string;
        const section = (formData.get('section') as string);
        const classTeacherId = formData.get('classTeacherId') as string;

        // Validate required fields
        if (!section || section.trim() === '') {
            alert('❌ Section is required!');
            return;
        }

        setIsSaving(true);
        try {
            const classData = {
                name: `${gradeLevel}-${section.toUpperCase()}`,
                gradeLevel,
                section: section.toUpperCase(),
                classTeacherId: classTeacherId || undefined,
                subjects: Object.keys(selectedSubjects).map(subjectId => ({
                    subjectId,
                    teacherId: selectedSubjects[subjectId]
                }))
            };

            if (editingItem) {
                // Update existing class
                const response = await classAPI.update(editingItem.id, classData);
                setState((prev: any) => ({
                    ...prev,
                    classes: prev.classes.map((c: any) => c.id === editingItem.id ? response.data : c)
                }));
                showToast('✅ Class updated successfully!', 'success');
            } else {
                // Create new class
                const response = await classAPI.create(classData);
                setState((prev: any) => ({
                    ...prev,
                    classes: [...prev.classes, response.data]
                }));
                showToast('✅ Class created successfully!', 'success');
            }

            setShowModal(false);
            setEditingItem(null);
        } catch (error: any) {
            console.error('Failed to save class:', error);
            const errorMsg = error.response?.data?.message || 'Failed to save class';
            const details = error.response?.data?.details;
            if (details && details.length > 0) {
                alert(`❌ Validation Error:\n\n${details.join('\n')}`);
            } else {
                alert(`❌ Error: ${errorMsg}`);
            }
            showToast(errorMsg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveGradeScheme = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGradeScheme) return;

        setIsSaving(true);
        try {
            const validBoundaries = editingGradeScheme.boundaries.filter(b => b.grade.trim() !== '');
            const isExisting = editingGradeScheme.id && editingGradeScheme.id.length > 5;

            // Create a clean data object without the empty ID for new items
            const { id, ...dataWithoutId } = editingGradeScheme;
            const payload = {
                ...dataWithoutId,
                boundaries: validBoundaries,
                // Ensure applicableClasses are trimmed and clean
                applicableClasses: editingGradeScheme.applicableClasses.map(s => s.trim()).filter(s => s !== '')
            };

            let savedScheme;
            if (isExisting) {
                const response = await gradeAPI.update(editingGradeScheme.id, payload);
                savedScheme = response.data;
            } else {
                const response = await gradeAPI.create(payload);
                savedScheme = response.data;
            }

            setState((prev: any) => ({
                ...prev,
                gradeSchemes: isExisting
                    ? prev.gradeSchemes.map((s: any) => s.id === savedScheme.id ? savedScheme : s)
                    : [...prev.gradeSchemes, savedScheme]
            }));

            showToast(`✅ Grade scheme ${isExisting ? 'updated' : 'added'} successfully!`, 'success');
            setShowModal(false);
            setEditingGradeScheme(null);
        } catch (error: any) {
            console.error('Failed to save grade scheme:', error);
            const msg = error.response?.data?.message || 'Failed to save grade scheme';
            showToast(`❌ Error: ${msg}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSchoolDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formData = new FormData(e.target as HTMLFormElement);
            const reportLanguages = Array.from(formData.getAll('reportLanguages')) as string[];
            const details = {
                name: (formData.get('name') as string).trim(),
                place: (formData.get('place') as string).trim(),
                schoolCode: (formData.get('schoolCode') as string).trim(),
                headMasterName: (formData.get('headMasterName') as string).trim(),
                address: (formData.get('address') as string).trim(),
                reportLanguages
            };

            const response = await schoolAPI.update(details);
            setState((prev: any) => ({ ...prev, schoolDetails: response.data }));
            showToast('School details updated successfully!', 'success');
        } catch (error: any) {
            console.error('Failed to update school details:', error);
            showToast('Failed to update school details', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteItem = async (type: 'users' | 'classes' | 'subjects' | 'gradeSchemes', id: string) => {
        if (!confirm('⚠️ Are you sure? This action cannot be undone.')) return;

        setDeletingId(id);
        try {
            // Delete from API
            if (type === 'users') {
                await userAPI.delete(id);
            } else if (type === 'classes') {
                await classAPI.delete(id);
            } else if (type === 'subjects') {
                await subjectAPI.delete(id);
            } else if (type === 'gradeSchemes') {
                await gradeAPI.delete(id);
            }

            // Update local state
            setState((prev: any) => {
                const newState = { ...prev };
                if (type === 'users') {
                    newState.users = prev.users.filter((u: any) => u.id !== id);
                } else if (type === 'classes') {
                    newState.classes = prev.classes.filter((c: any) => c.id !== id);
                    newState.assignments = prev.assignments.filter((a: any) => a.classId !== id);
                    newState.exams = prev.exams.filter((e: any) => e.classId !== id);
                } else if (type === 'subjects') {
                    newState.subjects = prev.subjects.filter((s: any) => s.id !== id);
                    newState.assignments = prev.assignments.filter((a: any) => a.subjectId !== id);
                } else if (type === 'gradeSchemes') {
                    newState.gradeSchemes = prev.gradeSchemes.filter((g: any) => g.id !== id);
                }
                return newState;
            });
            showToast('✅ Item deleted successfully!', 'success');
        } catch (error: any) {
            console.error('Failed to delete item:', error);
            const errorMsg = error.response?.data?.message || 'Failed to delete item';
            alert(`❌ Delete Error: ${errorMsg}`);
            showToast(errorMsg, 'error');
        } finally {
            setDeletingId(null);
        }
    };

    // --- Render Helpers ---


    // Fetch class subjects when editing a class
    useEffect(() => {
        if (activeTab === 'classes' && editingItem) {
            const fetchSubjects = async () => {
                try {
                    const response = await classAPI.getSubjects(editingItem.id);
                    const subjects = response.data;
                    const mapping: any = {};
                    subjects.forEach((s: any) => {
                        // Handle populated or unpopulated IDs
                        const subjectId = getId(s.subjectId);
                        const teacherId = getId(s.teacherId);
                        mapping[subjectId] = teacherId || '';
                    });
                    setSelectedSubjects(mapping);
                } catch (error) {
                    console.error('Failed to fetch class subjects', error);
                    showToast('Failed to load class subjects', 'error');
                }
            };
            fetchSubjects();
        } else {
            setSelectedSubjects({});
        }
    }, [editingItem, activeTab]);

    const renderSubjectMapping = () => {
        const teachers = state.users.filter((u: any) => u.role === UserRole.TEACHER);
        return (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 sticky top-0 bg-white z-10 block pb-2">
                    Assign Subjects & Teachers
                </label>
                {state.subjects.map((sub: any) => {
                    const isChecked = selectedSubjects.hasOwnProperty(sub.id);
                    return (
                        <div key={sub.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isChecked ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                            <input
                                type="checkbox"
                                id={`subject-${sub.id}`}
                                name={`subject-checkbox-${sub.id}`}
                                checked={isChecked}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedSubjects(prev => {
                                        const newState = { ...prev };
                                        if (checked) {
                                            newState[sub.id] = teachers[0]?.id || '';
                                        } else {
                                            delete newState[sub.id];
                                        }
                                        return newState;
                                    });
                                }}
                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className={`text-sm font-bold flex-1 ${isChecked ? 'text-blue-800' : 'text-slate-500'}`}>{sub.name}</span>

                            {isChecked && (
                                <select
                                    value={selectedSubjects[sub.id] || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedSubjects(prev => ({ ...prev, [sub.id]: val }));
                                    }}
                                    className="text-sm bg-white border border-blue-200 text-slate-700 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium w-40"
                                >
                                    {teachers.length > 0 ? (
                                        teachers.map((t: any) => (
                                            <option key={`teacher-${sub.id}-${t.id}`} value={t.id}>{t.name}</option>
                                        ))
                                    ) : (
                                        <option key={`no-teachers-${sub.id}`} value="">No teachers available</option>
                                    )}
                                </select>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderGradeEditor = () => {
        if (!editingGradeScheme) return null;
        return (
            <form onSubmit={handleSaveGradeScheme} className="p-8 space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scheme Name</label>
                    <input
                        value={editingGradeScheme.name}
                        onChange={e => setEditingGradeScheme({ ...editingGradeScheme, name: e.target.value })}
                        required
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Applicable Classes (Comma separated)</label>
                    <input
                        value={editingGradeScheme.applicableClasses.join(',')}
                        onChange={e => setEditingGradeScheme({ ...editingGradeScheme, applicableClasses: e.target.value.split(',').map(s => s.trim()) })}
                        placeholder="e.g. 9, 10"
                        required
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Boundaries</label>
                        <button
                            type="button"
                            onClick={() => setEditingGradeScheme({
                                ...editingGradeScheme,
                                boundaries: [...editingGradeScheme.boundaries, { grade: '', minPercent: 0 }]
                            })}
                            className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                        >
                            + Add Grade
                        </button>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2 max-h-60 overflow-y-auto">
                        {editingGradeScheme.boundaries.map((b, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input
                                    placeholder="Grade"
                                    value={b.grade}
                                    onChange={(e) => {
                                        const newBoundaries = [...editingGradeScheme.boundaries];
                                        newBoundaries[idx].grade = e.target.value;
                                        setEditingGradeScheme({ ...editingGradeScheme, boundaries: newBoundaries });
                                    }}
                                    className="w-20 p-2 rounded-xl border border-slate-200 text-center font-bold"
                                />
                                <span className="text-xs font-bold text-slate-400">Min %</span>
                                <input
                                    type="number"
                                    placeholder="%"
                                    value={b.minPercent}
                                    onChange={(e) => {
                                        const newBoundaries = [...editingGradeScheme.boundaries];
                                        newBoundaries[idx].minPercent = parseInt(e.target.value) || 0;
                                        setEditingGradeScheme({ ...editingGradeScheme, boundaries: newBoundaries });
                                    }}
                                    className="flex-1 p-2 rounded-xl border border-slate-200 font-bold"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newBoundaries = editingGradeScheme.boundaries.filter((_, i) => i !== idx);
                                        setEditingGradeScheme({ ...editingGradeScheme, boundaries: newBoundaries });
                                    }}
                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200/50 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center">
                    <Save size={20} className="mr-2" /> Save Scheme
                </button>
            </form>
        );
    };

    const renderModal = () => {
        if (!showModal) return null;
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up">
                    <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xl font-black text-slate-800">
                            {editingItem || editingGradeScheme ? 'Edit' : 'Add New'} {activeTab === 'grades' ? 'Scheme' : activeTab.slice(0, -1)}
                        </h3>
                        <button onClick={() => { setShowModal(false); setEditingItem(null); setEditingGradeScheme(null); }} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl">
                            <X size={20} />
                        </button>
                    </div>

                    {activeTab === 'grades' ? renderGradeEditor() : (
                        <form onSubmit={
                            activeTab === 'teachers' ? handleSaveTeacher :
                                activeTab === 'classes' ? handleSaveClass :
                                    handleSaveSubject
                        } className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">

                            {activeTab === 'teachers' && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                                            <input name="name" defaultValue={editingItem?.name} required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Username</label>
                                            <input name="username" defaultValue={editingItem?.username} required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Mobile</label>
                                            <input name="mobile" defaultValue={editingItem?.mobile} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                                            <input name="email" defaultValue={editingItem?.email} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">DOB</label>
                                            <input name="dob" type="date" defaultValue={editingItem?.dob} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">
                                                Password {!editingItem && <span className="text-red-500">*</span>}
                                            </label>
                                            <input
                                                name="password"
                                                type="password"
                                                placeholder={editingItem ? "Leave empty to keep current password" : "Enter password (min 2 characters)"}
                                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold"
                                            />
                                            {editingItem ? (
                                                <p className="text-[10px] text-blue-600 font-bold mt-1 flex items-center gap-1">
                                                    <AlertCircle size={12} />
                                                    Leave empty to keep current password, or enter new password (min 2 chars) to update
                                                </p>
                                            ) : (
                                                <p className="text-[10px] text-slate-400 mt-1">Password must be at least 2 characters</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'classes' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Grade Level</label>
                                            <select name="gradeLevel" defaultValue={editingItem?.gradeLevel} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold">
                                                {['Pre-KG', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(g => (
                                                    <option key={`grade-${g}`} value={g}>{g}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Division</label>
                                            <input name="section" defaultValue={editingItem?.section} required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold" placeholder="A, B, C..." />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Class Teacher</label>
                                        <select
                                            name="classTeacherId"
                                            defaultValue={
                                                editingItem?.classTeacherId
                                                    ? (typeof editingItem.classTeacherId === 'object' ? (editingItem.classTeacherId._id || editingItem.classTeacherId.id) : editingItem.classTeacherId)
                                                    : ''
                                            }
                                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold"
                                        >
                                            <option key="select-teacher" value="">Select Teacher</option>
                                            {state.users.filter((u: any) => u.role === UserRole.TEACHER).map((t: any) => (
                                                <option key={`class-teacher-${t.id}`} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {renderSubjectMapping()}
                                </>
                            )}

                            {activeTab === 'subjects' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Subject Name</label>
                                        <input name="name" defaultValue={editingItem?.name} required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Short Code</label>
                                        <input name="shortCode" defaultValue={editingItem?.shortCode} placeholder="e.g. ENG, MAT" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold" />
                                    </div>
                                </>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200/50 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={20} className="mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} className="mr-2" />
                                            Save {activeTab.slice(0, -1)}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 capitalize">{activeTab === 'stats' ? 'Dashboard' : activeTab === 'data' ? 'Data Management' : activeTab}</h1>
                    <p className="text-slate-400 font-bold">Manage {activeTab === 'stats' ? 'school metrics' : activeTab === 'data' ? 'backup and restore' : activeTab}</p>
                </div>
                {activeTab !== 'stats' && activeTab !== 'school' && activeTab !== 'data' && (
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            if (activeTab === 'grades') {
                                setEditingGradeScheme({
                                    id: '',
                                    name: '',
                                    applicableClasses: [],
                                    boundaries: [{ grade: 'A+', minPercent: 90 }, { grade: 'A', minPercent: 80 }]
                                });
                            } else {
                                setEditingGradeScheme(null);
                            }
                            setShowModal(true);
                        }}
                        className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center"
                    >
                        <Plus size={18} className="mr-2" /> Add {activeTab === 'grades' ? 'Scheme' : activeTab.slice(0, -1)}
                    </button>
                )}
            </div>

            {activeTab === 'stats' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Users size={32} /></div>
                        <div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Total Teachers</p>
                            <p className="text-3xl font-black text-slate-900">{state.users.filter((u: any) => u.role === UserRole.TEACHER).length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600"><GraduationCap size={32} /></div>
                        <div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Total Classes</p>
                            <p className="text-3xl font-black text-slate-900">{state.classes.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600"><BookOpen size={32} /></div>
                        <div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Subjects</p>
                            <p className="text-3xl font-black text-slate-900">{state.subjects.length}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* DATA MANAGEMENT TAB */}
            {activeTab === 'data' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-lg flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6">
                            <Download size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Backup Data</h3>
                        <p className="text-slate-400 font-bold mb-8">Download all school data including students, marks, and settings as a JSON file to your computer.</p>
                        <button
                            onClick={handleBackupData}
                            className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto"
                        >
                            Download Backup
                        </button>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-lg flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-6">
                            <Upload size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Restore Data</h3>
                        <p className="text-slate-400 font-bold mb-8">Restore data from a previously saved JSON file. <br /><span className="text-red-500">Warning: This overwrites current data!</span></p>

                        <input
                            type="file"
                            ref={jsonInputRef}
                            onChange={handleRestoreData}
                            accept=".json"
                            className="hidden"
                        />
                        <button
                            onClick={() => jsonInputRef.current?.click()}
                            className="px-8 py-4 bg-purple-600 text-white font-black rounded-2xl shadow-xl shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all w-full md:w-auto"
                        >
                            Select JSON File to Restore
                        </button>
                    </div>

                    <div className="col-span-1 md:col-span-2 mt-4">
                        <div className="bg-red-50 p-8 rounded-[3rem] border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                                    <RefreshCw size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-red-700">Factory Reset</h3>
                                    <p className="text-red-500 font-bold text-sm">Clear all data and return to initial demo state.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleFactoryReset}
                                className="px-6 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all"
                            >
                                Reset App
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'teachers' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                placeholder="Search teachers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <input type="file" ref={fileInputRef} onChange={handleImportTeachers} accept=".csv" className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100"><Upload size={18} /></button>
                            <button onClick={handleExportTeachers} className="p-3 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100"><Download size={18} /></button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Credentials</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {state.users.filter((u: any) => u.role === UserRole.TEACHER && u.name.toLowerCase().includes(searchTerm.toLowerCase())).map((t: any) => (
                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-700">{t.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-slate-500">
                                                Username: <span className="text-slate-800">{t.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{t.mobile}<br />{t.email}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => { setEditingItem(t); setShowModal(true); }}
                                                disabled={deletingId !== null}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteItem('users', t.id)}
                                                disabled={deletingId !== null}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                                            >
                                                {deletingId === t.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'classes' && (
                <div className="space-y-8">
                    {['Pre-KG', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(grade => {
                        const classesInGrade = state.classes.filter((c: any) => c.gradeLevel === grade);
                        if (classesInGrade.length === 0) return null;

                        return (
                            <div key={`grade-group-${grade}`}>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    Grade {grade}
                                    <div className="flex-1 h-px bg-slate-200"></div>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {classesInGrade.map((c: any) => {
                                        // Handle populated teacher object or ID string
                                        const teacherName = typeof c.classTeacherId === 'object' && c.classTeacherId
                                            ? c.classTeacherId.name
                                            : (state.users.find((u: any) => u.id === c.classTeacherId)?.name || 'No Teacher Assigned');

                                        const studentCount = state.users.filter((u: any) => u.role === UserRole.STUDENT && getId(u.classId) === c.id).length;
                                        const subjectCount = classStats[c.id]?.subjectCount || 0;
                                        return (
                                            <div key={c.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:shadow-lg transition-all">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl">
                                                        {c.name.replace('-', '')}
                                                    </div>
                                                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => { setEditingItem(c); setShowModal(true); }} className="p-2 bg-slate-50 rounded-xl text-blue-500 hover:bg-blue-100"><Edit2 size={16} /></button>
                                                        <button onClick={() => deleteItem('classes', c.id)} className="p-2 bg-slate-50 rounded-xl text-red-500 hover:bg-red-100"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-800">Class {c.name}</h3>
                                                <p className="text-sm font-bold text-slate-400 mb-4">{teacherName}</p>
                                                <div className="flex flex-wrap gap-2 text-xs font-black uppercase text-slate-400">
                                                    <div className="bg-slate-50 px-3 py-2 rounded-xl flex items-center gap-2">
                                                        <Users size={14} /> {studentCount} Students
                                                    </div>
                                                    <div className="bg-slate-50 px-3 py-2 rounded-xl flex items-center gap-2">
                                                        <BookOpen size={14} /> {subjectCount} Subjects
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'subjects' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {state.subjects.map((s: any) => (
                        <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 mb-1">{s.name}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.shortCode || 'N/A'}</p>
                            </div>
                            <div className="flex justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                <button onClick={() => { setEditingItem(s); setShowModal(true); }} className="p-2 bg-slate-50 rounded-xl text-blue-500 hover:bg-blue-100"><Edit2 size={16} /></button>
                                <button onClick={() => deleteItem('subjects', s.id)} className="p-2 bg-slate-50 rounded-xl text-red-500 hover:bg-red-100"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'grades' && (
                <div className="space-y-6">
                    {(!state.gradeSchemes || state.gradeSchemes.length === 0) ? (
                        <div className="bg-white p-12 rounded-[3rem] text-center border-4 border-dashed border-slate-100 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600"><Layers size={24} /></div>
                            <h3 className="text-xl font-black text-slate-800 mb-1">No Grade Schemes</h3>
                            <p className="text-slate-400 font-bold">Click the "Add Scheme" button above to create one.</p>
                        </div>
                    ) : (
                        state.gradeSchemes.map((scheme: any) => (
                            <div key={scheme.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800">{scheme.name}</h3>
                                        <p className="text-sm font-bold text-slate-400 mt-1 flex items-center gap-2">
                                            <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                                            Applicable Classes: {scheme.applicableClasses.join(', ')}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => { setEditingGradeScheme(scheme); setShowModal(true); }} className="p-2 bg-white rounded-xl text-blue-500 border border-slate-100 hover:bg-blue-50 transition-colors"><Edit2 size={16} /></button>
                                        <button onClick={() => deleteItem('gradeSchemes', scheme.id)} className="p-2 bg-white rounded-xl text-red-500 border border-slate-100 hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3 relative z-10">
                                    {scheme.boundaries.map((b: any, idx: number) => (
                                        <div key={idx} className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                                            <span className="text-xl font-black text-blue-600">{b.grade}</span>
                                            <div className="w-px h-6 bg-slate-200"></div>
                                            <span className="text-xs font-bold text-slate-400">≥ {b.minPercent}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'school' && (
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-[3rem] border border-slate-100 shadow-lg">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <Building size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">School Configuration</h2>
                    </div>
                    <form onSubmit={handleSaveSchoolDetails} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">School Name</label>
                            <input name="name" defaultValue={state.schoolDetails?.name} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-lg" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Place/City</label>
                                <input name="place" defaultValue={state.schoolDetails?.place} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-bold" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">School Code</label>
                                <input name="schoolCode" defaultValue={state.schoolDetails?.schoolCode} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-bold" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Headmaster Name</label>
                            <input name="headMasterName" defaultValue={state.schoolDetails?.headMasterName} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-bold" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                            <textarea name="address" rows={3} defaultValue={state.schoolDetails?.address} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-bold" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">AI Report Languages</label>
                            <div className="flex flex-wrap gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                {['English', 'Tamil', 'Malayalam'].map(lang => (
                                    <label key={lang} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            name="reportLanguages"
                                            value={lang}
                                            defaultChecked={state.schoolDetails?.reportLanguages?.includes(lang)}
                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors">{lang}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-[2rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                            Update School Details
                        </button>
                    </form>
                </div>
            )}

            {/* Render Modal */}
            {renderModal()}

            {/* Toast */}
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

export default AdminDashboard;
