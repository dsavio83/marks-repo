
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface SchoolDetails {
  name: string;
  place: string;
  schoolCode: string;
  headMasterName: string;
  address?: string;
  reportLanguages?: string[];
}

export interface GradeBoundary {
  grade: string;
  minPercent: number;
}

export interface GradeScheme {
  id: string;
  name: string;
  applicableClasses: string[]; // e.g. ["9", "10"]
  boundaries: GradeBoundary[];
}

export interface Subject {
  id: string;
  name: string;
  shortCode?: string; // New field for Short Code (e.g., ENG, MAT)
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "10-A"
  section: string;
  gradeLevel: string; // e.g. "10"
  classTeacherId: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  // Metadata for student & teacher
  admissionNo?: string;
  mobile?: string;
  email?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  category?: 'General' | 'OBC' | 'OEC' | 'SC' | 'ST';
  caste?: string;
  religion?: string;
  fatherName?: string;
  motherName?: string;
  address?: string;
  transportMode?: 'School Bus' | 'Private Bus' | 'Govt. Bus' | 'Auto' | 'Jeep' | 'Bicycle' | 'Two Wheeler' | 'Car' | 'Cab' | 'By Walk';
  classId?: string;
}

export interface MarkSection {
  id: string;
  name: string;
  markValue: number;
  maxMarks: number;
}

export interface DetailedMark {
  sectionId: string;
  marks: number;
}

export interface ExamSubjectConfig {
  subjectId: string;
  maxTe: number;
  maxCe: number;
  included: boolean;
  markSections?: MarkSection[];
}

export interface Exam {
  id: string;
  name: string; // e.g., "Half Yearly Exam"
  classId: string;
  subjectConfigs: ExamSubjectConfig[];
}

export interface MarkRecord {
  id?: string;
  studentId: string;
  subjectId: string;
  examId: string;
  teMark?: string;
  ceMark?: string;
  detailedMarks?: DetailedMark[];
  isLocked?: boolean;
  aiAnalysis?: string;
  aiAdvice?: string;
}

export interface AttendanceRecord {
  examId: string;
  studentId: string;
  percentage: string;
}

export interface SubjectAssignment {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
}
