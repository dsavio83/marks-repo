
import { User, ClassRoom, Subject, GradeScheme, MarkRecord, SubjectAssignment, Exam, UserRole, SchoolDetails, AttendanceRecord } from './types';
import { INITIAL_GRADE_SCHEMES, SEED_USERS, SEED_SUBJECTS, SEED_CLASSES, SEED_ASSIGNMENTS } from './constants';

const STORAGE_KEY = 'school_management_data_v3';

interface AppState {
  users: User[];
  classes: ClassRoom[];
  subjects: Subject[];
  gradeSchemes: GradeScheme[];
  marks: MarkRecord[];
  attendance: AttendanceRecord[];
  assignments: SubjectAssignment[];
  exams: Exam[];
  schoolDetails: SchoolDetails;
}

const initialState: AppState = {
  users: SEED_USERS,
  classes: SEED_CLASSES,
  subjects: SEED_SUBJECTS,
  gradeSchemes: INITIAL_GRADE_SCHEMES,
  marks: [],
  attendance: [],
  assignments: SEED_ASSIGNMENTS,
  exams: [],
  schoolDetails: {
    name: 'Smart School',
    place: 'Chennai',
    schoolCode: 'SCH001',
    headMasterName: 'Principal'
  }
};

export const getAppState = (): AppState => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    const parsed = JSON.parse(data);
    // Ensure new fields exist if loading from old localstorage structure
    if (!parsed.assignments) parsed.assignments = SEED_ASSIGNMENTS;
    if (!parsed.exams) parsed.exams = [];
    if (!parsed.attendance) parsed.attendance = [];
    if (!parsed.gradeSchemes) parsed.gradeSchemes = initialState.gradeSchemes;
    if (!parsed.schoolDetails) parsed.schoolDetails = initialState.schoolDetails;
    return parsed;
  }
  return initialState;
};

export const saveAppState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearAppState = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};
