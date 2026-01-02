
import React from 'react';
import { Book, Calculator, FlaskConical, Globe, Palette, Languages, Trophy, Music, Monitor, Cpu } from 'lucide-react';
import { User, UserRole, Subject, ClassRoom, SubjectAssignment } from './types';

export const LEARNING_ICONS = [
  { icon: <Languages className="w-8 h-8" />, label: "English", color: "text-blue-400" },
  { icon: <Languages className="w-8 h-8" />, label: "Language 1", color: "text-indigo-500" },
  { icon: <Languages className="w-8 h-8" />, label: "Language 2", color: "text-pink-500" },
  { icon: <Calculator className="w-8 h-8" />, label: "Math", color: "text-green-400" },
  { icon: <FlaskConical className="w-8 h-8" />, label: "Science", color: "text-purple-400" },
  { icon: <Globe className="w-8 h-8" />, label: "Social", color: "text-orange-400" },
  { icon: <Palette className="w-8 h-8" />, label: "Art", color: "text-pink-400" },
  { icon: <Languages className="w-8 h-8" />, label: "Tamil", color: "text-indigo-400" },
  { icon: <Languages className="w-8 h-8" />, label: "Malayalam", color: "text-emerald-400" },
  { icon: <Languages className="w-8 h-8" />, label: "Hindi", color: "text-amber-400" },
  { icon: <Languages className="w-8 h-8" />, label: "Arabic", color: "text-green-500" },
  { icon: <Trophy className="w-8 h-8" />, label: "Sports", color: "text-yellow-400" },
  { icon: <Music className="w-8 h-8" />, label: "Music", color: "text-rose-400" },
  { icon: <FlaskConical className="w-8 h-8" />, label: "Physics", color: "text-cyan-400" },
  { icon: <FlaskConical className="w-8 h-8" />, label: "Chemistry", color: "text-fuchsia-400" },
  { icon: <FlaskConical className="w-8 h-8" />, label: "Biology", color: "text-lime-400" },
  { icon: <Book className="w-8 h-8" />, label: "History", color: "text-stone-400" },
  { icon: <Globe className="w-8 h-8" />, label: "Geography", color: "text-teal-400" },
  { icon: <Monitor className="w-8 h-8" />, label: "Computer", color: "text-slate-400" },
  { icon: <Cpu className="w-8 h-8" />, label: "IT", color: "text-violet-400" },
];

export const SUBJECT_FACTS = [
  "Mathematics is the language of the universe.",
  "Science is a way of thinking much more than it is a body of knowledge.",
  "Art washes away from the soul the dust of everyday life.",
  "Language is the road map of a culture.",
  "Geography is the subject which holds the key to our future.",
  "Sports build character and teach us how to handle both victory and defeat."
];

export const INITIAL_GRADE_SCHEMES = [
  {
    id: 'scheme-a',
    name: 'High School Grading (9-10)',
    applicableClasses: ['9', '10'],
    boundaries: [
      { grade: 'A+', minPercent: 91 },
      { grade: 'A', minPercent: 81 },
      { grade: 'B+', minPercent: 71 },
      { grade: 'B', minPercent: 61 },
      { grade: 'C+', minPercent: 51 },
      { grade: 'C', minPercent: 41 },
      { grade: 'D', minPercent: 33 },
      { grade: 'E', minPercent: 0 },
    ]
  },
  {
    id: 'scheme-b',
    name: 'Middle School Grading (6-8)',
    applicableClasses: ['6', '7', '8'],
    boundaries: [
      { grade: 'A+', minPercent: 90 },
      { grade: 'A', minPercent: 80 },
      { grade: 'B+', minPercent: 70 },
      { grade: 'B', minPercent: 60 },
      { grade: 'C', minPercent: 50 },
      { grade: 'D', minPercent: 40 },
      { grade: 'F', minPercent: 0 },
    ]
  }
];

// Seed Data
export const SEED_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'Mathematics' },
  { id: 'sub-2', name: 'Science' },
  { id: 'sub-3', name: 'Social Science' },
  { id: 'sub-4', name: 'English' },
  { id: 'sub-5', name: 'Tamil' }
];

export const SEED_USERS: User[] = [
  { id: 'admin-1', username: 'admin', name: 'Principal Admin', role: UserRole.ADMIN, password: 'admin' },
  { id: 't-1', username: 'kavitha', name: 'Kavitha R', role: UserRole.TEACHER, password: '123' },
  { id: 't-2', username: 'suresh', name: 'Suresh K', role: UserRole.TEACHER, password: '123' },
  { id: 't-3', username: 'anita', name: 'Anita M', role: UserRole.TEACHER, password: '123' },
  // Students
  { id: 's-1', username: '1001', name: 'Arun Kumar', role: UserRole.STUDENT, admissionNo: '1001', mobile: '9876543210', classId: 'cls-1', gender: 'Male', category: 'OBC' },
  { id: 's-2', username: '1002', name: 'Priya S', role: UserRole.STUDENT, admissionNo: '1002', mobile: '9876543211', classId: 'cls-1', gender: 'Female', category: 'General' },
  { id: 's-3', username: '1003', name: 'Rajesh M', role: UserRole.STUDENT, admissionNo: '1003', mobile: '9876543212', classId: 'cls-1', gender: 'Male', category: 'SC' },
];

export const SEED_CLASSES: ClassRoom[] = [
  { id: 'cls-1', name: '10-A', gradeLevel: '10', section: 'A', classTeacherId: 't-1' }
];

export const SEED_ASSIGNMENTS: SubjectAssignment[] = [
  { id: 'asg-1', classId: 'cls-1', subjectId: 'sub-1', teacherId: 't-1' }, // Math by Kavitha
  { id: 'asg-2', classId: 'cls-1', subjectId: 'sub-2', teacherId: 't-2' }, // Science by Suresh
  { id: 'asg-3', classId: 'cls-1', subjectId: 'sub-3', teacherId: 't-3' }, // Social by Anita
  { id: 'asg-4', classId: 'cls-1', subjectId: 'sub-4', teacherId: 't-1' }, // English by Kavitha
];
