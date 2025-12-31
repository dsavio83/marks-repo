import React, { useState, useMemo, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { Printer, Award, CheckSquare, Square, Download, Loader2, FileText, Smartphone } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { RenderCell } from "../src/utils/RenderCell";

interface ReportsProps {
    teacher: User;
    state: any;
}

// --- Helper Components ---

const SignatureLine = ({ label, name }: { label: string, name?: string }) => (
    <div className="flex flex-col items-center justify-end min-w-[100px]" style={{ width: '100%' }}>
        {name && <span className="text-[10px] font-black text-black uppercase mb-1 font-serif">{name}</span>}
        <div className="w-full border-b-[1.5px] border-black mb-1"></div>
        <span className="text-[9px] font-black text-black uppercase tracking-wider">{label}</span>
    </div>
);

// --- Progress Card Component (A4 Portrait - Professional Design) ---
// --- Progress Card Component (A4 Portrait - Academic Standard) ---
const ProgressCardA4: React.FC<{ data: any, selectedExam: any, selectedClass: any, settings: any, schoolDetails: any, classTeacher: any }> = ({
    data, selectedExam, selectedClass, settings, schoolDetails, classTeacher
}) => (
    <div className="progress-card-item bg-white mx-auto print:mx-0 mb-12 print:mb-0 relative box-border text-black transition-all"
        style={{ width: '210mm', minHeight: '297mm', breakAfter: 'page', pageBreakAfter: 'always', padding: '15mm' }}>

        <div className="flex flex-col min-h-full font-sans" style={{ lineHeight: '1.4' }}>
            {/* Header Section */}
            <div className="text-center w-full mb-6">
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, textTransform: 'uppercase', color: '#000', margin: '0 0 2px 0' }}>
                    {schoolDetails?.name || 'SMART SCHOOL'}
                </h1>
                <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#000', margin: '0 0 12px 0' }}>
                    {schoolDetails?.place || 'CHENNAI'}
                </h2>

                <div className="flex items-center justify-center w-full mb-4">
                    <div className="flex-1 h-[1px] bg-[#000]"></div>
                    <span className="px-6 text-[14px] font-bold italic text-[#000] uppercase tracking-widest">
                        PROGRESS REPORT
                    </span>
                    <div className="flex-1 h-[1px] bg-[#000]"></div>
                </div>

                <div className="text-[12px] font-bold text-[#dc2626] uppercase tracking-wider">
                    Academic Year 2025-2026 &bull; {selectedExam?.name || 'ANNUAL EXAMINATION'}
                </div>
            </div>

            {/* Student Info Table - Robust Structure */}
            <div className="w-full mb-8">
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '14px', tableLayout: 'fixed' }}>
                    <tbody>
                        <tr style={{ height: '45px' }}>
                            <td style={{ width: '18%', padding: '8px 12px', fontWeight: 600, border: '1.2px solid #000', backgroundColor: '#f8fafc', verticalAlign: 'middle' }}>Student Name</td>
                            <td style={{ width: '32%', padding: '8px 12px', fontWeight: 700, border: '1.2px solid #000', textTransform: 'uppercase', verticalAlign: 'middle' }}>{data.student.name}</td>
                            <td style={{ width: '18%', padding: '8px 12px', fontWeight: 600, border: '1.2px solid #000', backgroundColor: '#f8fafc', verticalAlign: 'middle' }}>Admission No</td>
                            <td style={{ width: '32%', padding: '8px 12px', fontWeight: 700, border: '1.2px solid #000', verticalAlign: 'middle' }}>{data.student.admissionNo}</td>
                        </tr>
                        <tr style={{ height: '45px' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600, border: '1.2px solid #000', backgroundColor: '#f8fafc', verticalAlign: 'middle' }}>Class & Div</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, border: '1.2px solid #000', verticalAlign: 'middle' }}>{selectedClass?.gradeLevel} - {selectedClass?.section}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, border: '1.2px solid #000', backgroundColor: '#f8fafc', verticalAlign: 'middle' }}>Date of Birth</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, border: '1.2px solid #000', verticalAlign: 'middle' }}>{data.student.dob ? new Date(data.student.dob).toLocaleDateString() : '-'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Main Marks Table - Enhanced Spacing */}
            <div className="w-full mb-8">
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: '2px solid #000' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #000' }}>
                            <th style={{ borderRight: '1.5px solid #000', width: '35%', textAlign: 'left', padding: '15px 18px', fontWeight: 900, fontSize: '12px', verticalAlign: 'middle' }}>SUBJECT DOMAIN</th>
                            {settings.showTe && <th style={{ borderRight: '1.5px solid #000', width: '12%', textAlign: 'center', fontWeight: 900, fontSize: '12px', verticalAlign: 'middle' }}>T.E</th>}
                            {settings.showCe && <th style={{ borderRight: '1.5px solid #000', width: '12%', textAlign: 'center', fontWeight: 900, fontSize: '12px', verticalAlign: 'middle' }}>C.E</th>}
                            {settings.showTotal && <th style={{ borderRight: '1.5px solid #000', width: '18%', textAlign: 'center', fontWeight: 900, fontSize: '12px', verticalAlign: 'middle' }}>TOTAL</th>}
                            {settings.showPercentage && <th style={{ borderRight: '1.5px solid #000', width: '10%', textAlign: 'center', fontWeight: 900, fontSize: '12px', verticalAlign: 'middle' }}>%</th>}
                            {settings.showGrade && <th style={{ width: '13%', textAlign: 'center', fontWeight: 900, fontSize: '12px', verticalAlign: 'middle' }}>GRADE</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.subjects.map((sub: any) => (
                            <tr key={sub.id} style={{ borderBottom: '1.5px solid #000' }}>
                                <td style={{ borderRight: '1.5px solid #000', padding: '12px 18px', fontWeight: 700, fontSize: '13px', verticalAlign: 'middle' }}>
                                    {sub.name}
                                </td>
                                {settings.showTe && <td style={{ borderRight: '1.5px solid #000', textAlign: 'center', fontWeight: 700, fontSize: '13px', verticalAlign: 'middle' }}>
                                    {sub.teStr !== '-' ? sub.teStr : '0'}
                                </td>}
                                {settings.showCe && <td style={{ borderRight: '1.5px solid #000', textAlign: 'center', fontWeight: 700, fontSize: '13px', verticalAlign: 'middle' }}>
                                    {sub.ceStr !== '-' ? sub.ceStr : '0'}
                                </td>}
                                {settings.showTotal && <td style={{ borderRight: '1.5px solid #000', textAlign: 'center', fontWeight: 700, fontSize: '13px', verticalAlign: 'middle' }}>
                                    {sub.total || 0} / {sub.max || 0}
                                </td>}
                                {settings.showPercentage && <td style={{ borderRight: '1.5px solid #000', textAlign: 'center', fontWeight: 700, fontSize: '13px', verticalAlign: 'middle' }}>
                                    {Math.round(sub.percent || 0)}%
                                </td>}
                                {settings.showGrade && <td style={{ textAlign: 'center', fontWeight: 900, fontSize: '14px', verticalAlign: 'middle' }}>
                                    {sub.grade || '-'}
                                </td>}
                            </tr>
                        ))}
                        {/* Consolidated Performance Row */}
                        <tr style={{ backgroundColor: '#f1f5f9' }}>
                            <td style={{ borderRight: '1.5px solid #000', textAlign: 'center', fontWeight: 900, fontSize: '13px', verticalAlign: 'middle', padding: '15px 0' }}>
                                CONSOLIDATED PERFORMANCE
                            </td>
                            <td style={{ borderRight: '1.5px solid #000' }} colSpan={(settings.showTe ? 1 : 0) + (settings.showCe ? 1 : 0)}></td>
                            <td style={{ borderRight: '1.5px solid #000', textAlign: 'center', fontWeight: 900, fontSize: '13px', verticalAlign: 'middle' }}>
                                {data.grandTotal} / {data.maxTotal}
                            </td>
                            <td style={{ borderRight: '1.5px solid #000' }}></td>
                            <td style={{ textAlign: 'center', fontWeight: 900, fontSize: '16px', verticalAlign: 'middle' }}>
                                {data.grade}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Results Summary and Attendance Line */}
            <div className="flex justify-between items-center w-full px-2 mb-4" style={{ fontWeight: 700, fontSize: '10px', borderBottom: '1px solid #000', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <span>RESULT: {data.result}</span>
                    <span>PERCENTAGE: {data.percentage.toFixed(2)}%</span>
                    <span>CLASS RANK: #{data.rank}</span>
                </div>
                <div style={{ fontWeight: 600 }}>
                    Attendance: {data.attendance ? `${data.attendance}% Overall Attendance` : 'N/A'}
                </div>
            </div>

            {/* Signature Block - Flex Div Layout */}
            <div className="flex justify-between w-full mb-8 pt-4">
                <div className="flex flex-col items-center" style={{ width: '30%' }}>
                    <div style={{ fontWeight: 600, fontSize: '11.5px', marginBottom: '4px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{classTeacher?.name}</div>
                    <div style={{ width: '100%', borderTop: '1px solid #000', paddingTop: '4px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Class Teacher</div>
                </div>
                <div className="flex flex-col items-center" style={{ width: '30%' }}>
                    <div style={{ height: '22px' }}></div>
                    <div style={{ width: '100%', borderTop: '1px solid #000', paddingTop: '4px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Parent Signature</div>
                </div>
                <div className="flex flex-col items-center" style={{ width: '30%' }}>
                    <div style={{ height: '22px' }}></div>
                    <div style={{ width: '100%', borderTop: '1px solid #000', paddingTop: '4px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Headmaster</div>
                </div>
            </div>

            {/* Performance Analysis starts here (Continuous) */}
            <div className="w-full flex items-center justify-center mb-6 mt-4">
                <div className="flex-1 h-[1px] bg-[#000]"></div>
                <span className="px-6 text-[14px] font-bold italic text-[#000] tracking-tight">
                    Performance Analysis for {data.student.name}
                </span>
                <div className="flex-1 h-[1px] bg-[#000]"></div>
            </div>

            <div className="space-y-6">
                {(data.allAdvices || []).map((adv: any, idx: number) => (
                    <div key={idx} style={{ paddingLeft: '12px', borderLeft: '2.5px solid #000', marginBottom: '20px' }}>
                        <div className="flex justify-between items-center mb-2">
                            <span style={{ fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>{adv.subject}</span>
                            <div style={{ fontWeight: 700, fontSize: '10px' }}>
                                SCORE: {adv.total} / {adv.max} ({adv.percent.toFixed(0)}%)
                                <span style={{ marginLeft: '12px', fontSize: '12px' }}>{adv.grade || '-'}</span>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', marginBottom: '8px', border: '1px solid #000', tableLayout: 'fixed' }}>
                            <thead>
                                <tr style={{ height: '30px', backgroundColor: '#f3f4f6' }}>
                                    {adv.sections.map((s: any, sIdx: number) => (
                                        <th key={sIdx} style={{ border: '1px solid #000', fontWeight: 700, fontSize: '9px', textTransform: 'uppercase', verticalAlign: 'middle' }}>
                                            <div style={{ minHeight: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.markValue} Units</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ height: '32px' }}>
                                    {adv.sections.map((s: any, sIdx: number) => (
                                        <td key={sIdx} style={{ border: '1px solid #000', padding: '0', verticalAlign: 'middle' }}>
                                            <table style={{ width: '100%', height: '32px', borderCollapse: 'collapse' }}>
                                                <tbody>
                                                    <tr>
                                                        <td style={{ borderRight: '1px solid #e2e8f0', width: '33%', fontWeight: 500, fontSize: '9px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                            <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.max}</div>
                                                        </td>
                                                        <td style={{ borderRight: '1px solid #e2e8f0', width: '34%', fontWeight: 600, fontSize: '10px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                            <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.obt}</div>
                                                        </td>
                                                        <td style={{ width: '33%', fontWeight: 500, fontSize: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                            <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.percent.toFixed(0)}%</div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>

                        <p className="text-[10px] font-medium leading-relaxed px-1 report-multilingual" style={{ color: '#334155' }}>
                            {adv.advice || adv.analysis || "Consistently follow practice activities to improve scores."}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);


// --- NEW DEFINITIONS FOR CONSOLIDATED REPORT ---

const ReportFooter = ({ classTeacher }: { classTeacher: any }) => (
    <footer className="report-footer absolute bottom-[10mm] left-[15mm] right-[15mm] z-50">
        <div className="flex w-full">

            {/* Left – Class Teacher */}
            <div className="w-1/2 pr-5 flex items-end">
                <div className="w-full text-center">
                    <div className="text-[9px] font-bold text-slate-800 uppercase mb-1 font-serif">
                        {classTeacher?.name || 'Class Teacher'}
                    </div>
                    <div className="w-full border-b border-slate-800 mb-1"></div>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                        Class Teacher Signature
                    </p>
                </div>
            </div>

            {/* Right – Headmaster */}
            <div className="w-1/2 pl-5 flex items-end">
                <div className="w-full text-center">
                    <div className="w-full h-[15px]"></div>
                    <div className="w-full border-b border-slate-800 mb-1"></div>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                        Headmaster Signature
                    </p>
                </div>
            </div>

        </div>
    </footer>
);

const StudentMarksTable = ({ students, startIndex = 0, selectedExam, state, orientation, displayMode }: any) => {
    const getIdResilient = (ref: any) => {
        if (!ref) return null;
        if (typeof ref === 'string') return ref;
        return ref.id || ref._id || ref.toString();
    };

    return (
        <table className="w-full text-left border-collapse text-[8px]" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: orientation === 'landscape' ? 'fixed' : 'auto' }}>
            <thead>
                <tr className="text-black uppercase font-black" style={{ backgroundColor: '#ffffff', WebkitPrintColorAdjust: 'exact', height: '40px' }}>
                    <th style={{ border: '1px solid #000', width: '30px' }}><RenderCell>SL NO</RenderCell></th>
                    <th style={{ border: '1px solid #000', minWidth: '250px' }}><RenderCell className="name">STUDENT NAME</RenderCell></th>
                    {selectedExam.subjectConfigs.map((config: any) => {
                        const configSubId = getIdResilient(config.subjectId);
                        const sub = state.subjects.find((s: any) => (s.id || s._id) === configSubId);
                        const label = sub?.name?.substring(0, 3).toUpperCase() || 'SUB';
                        return (
                            <th key={configSubId} style={{ border: '1px solid #000', width: '32px' }}>
                                <RenderCell className="font-black text-[8px]">{label}</RenderCell>
                            </th>
                        );
                    })}
                    <th style={{ border: '1px solid #000', width: '40px' }}><RenderCell>TOTAL</RenderCell></th>
                    <th style={{ border: '1px solid #000', width: '35px' }}><RenderCell>GRADE</RenderCell></th>
                    <th style={{ border: '1px solid #000', width: '32px' }}><RenderCell>%</RenderCell></th>
                    <th style={{ border: '1px solid #000', width: '32px' }}><RenderCell>RANK</RenderCell></th>
                </tr>
            </thead>
            <tbody>
                {students.map((data: any, idx: number) => (
                    <tr key={data.student.id} className="student-row" style={{ height: '36px' }}>
                        <td style={{ border: '1px solid #000' }}>
                            <RenderCell className="font-bold">{startIndex + idx + 1}</RenderCell>
                        </td>
                        <td style={{ border: '1px solid #000' }}>
                            <RenderCell className="name font-black text-[10px] uppercase">{data.student.name}</RenderCell>
                        </td>
                        {selectedExam.subjectConfigs.map((config: any) => {
                            const configSubId = getIdResilient(config.subjectId);
                            const subResult = data.subjects.find((s: any) => s.id === configSubId);
                            return (
                                <td key={configSubId} style={{ border: '1px solid #000' }}>
                                    <RenderCell>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0px' }}>
                                            <div style={{ fontWeight: 900, fontSize: '10px', color: '#000', lineHeight: '1' }}>
                                                {subResult?.total !== undefined && !isNaN(subResult.total) ? subResult.total : '-'}
                                            </div>
                                            <div style={{ fontSize: '8px', color: '#000', fontWeight: '900', lineHeight: '1', marginTop: '2px' }}>
                                                {subResult?.grade || '-'}
                                            </div>
                                        </div>
                                    </RenderCell>
                                </td>
                            );
                        })}
                        <td style={{ border: '1px solid #000' }}>
                            <RenderCell className="font-black text-[10px]">{!isNaN(data.grandTotal) ? data.grandTotal : '-'}</RenderCell>
                        </td>
                        <td style={{ border: '1px solid #000' }}>
                            <RenderCell className="font-black text-[10px]">{data.grade}</RenderCell>
                        </td>
                        <td style={{ border: '1px solid #000' }}>
                            <RenderCell className="font-bold">{!isNaN(data.percentage) ? `${data.percentage.toFixed(0)}%` : '-'}</RenderCell>
                        </td>
                        <td style={{ border: '1px solid #000' }}>
                            <RenderCell className="font-bold">{startIndex + idx + 1}</RenderCell>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const OverallStatsTable = ({ summary, selectedClass, classTeacher }: any) => (
    <div className="mb-3 overflow-hidden">
        <table className="w-full text-[9px] border-collapse" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: '1.5px solid #000' }}>
            <thead>
                <tr className="text-black font-black uppercase tracking-tight" style={{ backgroundColor: '#f8fafc', WebkitPrintColorAdjust: 'exact', height: '36px', borderBottom: '1.5px solid #000' }}>
                    <th style={{ borderRight: '1px solid #000', width: '15%' }}><RenderCell>CLASS/DIV</RenderCell></th>
                    <th style={{ borderRight: '1px solid #000', width: '25%' }}><RenderCell>CLASS TEACHER</RenderCell></th>
                    <th style={{ borderRight: '1px solid #000', width: '20%' }}><RenderCell>ACADEMIC YEAR</RenderCell></th>
                    <th style={{ borderRight: '1px solid #000', width: '13%' }}><RenderCell>TOTAL</RenderCell></th>
                    <th style={{ borderRight: '1px solid #000', width: '13%' }}><RenderCell>BOYS</RenderCell></th>
                    <th style={{ width: '14%' }}><RenderCell>GIRLS</RenderCell></th>
                </tr>
            </thead>
            <tbody>
                <tr className="bg-white text-black font-black uppercase" style={{ height: '36px' }}>
                    <td style={{ borderRight: '1px solid #000' }}><RenderCell>{selectedClass?.name} - {selectedClass?.section}</RenderCell></td>
                    <td style={{ borderRight: '1px solid #000' }}><RenderCell>{classTeacher?.name}</RenderCell></td>
                    <td style={{ borderRight: '1px solid #000' }}><RenderCell>{summary.academicYear}</RenderCell></td>
                    <td style={{ borderRight: '1px solid #000' }}><RenderCell className="text-[11px]">{summary.total}</RenderCell></td>
                    <td style={{ borderRight: '1px solid #000' }}><RenderCell className="text-[11px]">{summary.boys}</RenderCell></td>
                    <td><RenderCell className="text-[11px]">{summary.girls}</RenderCell></td>
                </tr>
            </tbody>
        </table>
    </div>
);

const CategoryStatsTable = ({ categoryStats }: any) => (
    <div className="mb-6 overflow-hidden">
        <table className="w-full text-[10px] border-collapse" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
                <tr className="text-black font-black uppercase tracking-tight" style={{ backgroundColor: '#ffffff', WebkitPrintColorAdjust: 'exact', height: '32px' }}>
                    <th rowSpan={2} style={{ border: '1.5px solid #000', width: '15%' }}><RenderCell>CATEGORY</RenderCell></th>
                    {['GENERAL', 'OBC', 'SC', 'ST'].map(name => (
                        <th key={name} colSpan={2} style={{ border: '1.5px solid #000' }}><RenderCell>{name}</RenderCell></th>
                    ))}
                    <th colSpan={2} style={{ border: '1.5px solid #000' }}><RenderCell>GRAND TOTAL</RenderCell></th>
                </tr>
                <tr className="text-[9px] font-black uppercase" style={{ height: '24px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <React.Fragment key={i}>
                            <th style={{ border: '1.5px solid #000', width: '8.5%' }}><RenderCell>B</RenderCell></th>
                            <th style={{ border: '1.5px solid #000', width: '8.5%' }}><RenderCell>G</RenderCell></th>
                        </React.Fragment>
                    ))}
                </tr>
            </thead>
            <tbody>
                <tr className="bg-white text-[11px] font-black uppercase" style={{ height: '36px' }}>
                    <td style={{ border: '1.5px solid #000' }}><RenderCell>STUDENTS</RenderCell></td>
                    {['GENERAL', 'OBC', 'SC', 'ST'].map(name => {
                        const cat = categoryStats.find((c: any) => c.name.toUpperCase() === name);
                        return (
                            <React.Fragment key={name}>
                                <td style={{ border: '1.5px solid #000' }}><RenderCell className="font-black text-sm">{cat?.boys || 0}</RenderCell></td>
                                <td style={{ border: '1.5px solid #000' }}><RenderCell className="font-black text-sm">{cat?.girls || 0}</RenderCell></td>
                            </React.Fragment>
                        );
                    })}
                    <td style={{ border: '1.5px solid #000' }}><RenderCell className="font-black text-sm">{categoryStats.reduce((a: number, c: any) => a + c.boys, 0)}</RenderCell></td>
                    <td style={{ border: '1.5px solid #000' }}><RenderCell className="font-black text-sm">{categoryStats.reduce((a: number, c: any) => a + c.girls, 0)}</RenderCell></td>
                </tr>
            </tbody>
        </table>
    </div>
);

const ReportPageContent = ({ title, selectedExam, selectedClass, state, classTeacher, academicYear, children }: any) => (
    <div className="report-content-wrapper font-serif">
        {/* Header Section */}
        <div className="school-header text-center mb-6 py-4">
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#000', lineHeight: '1.1', marginBottom: '4px' }}>
                {state.schoolDetails?.name || 'SMART SCHOOL'}
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 900, color: '#000', textTransform: 'uppercase', letterSpacing: '0.4em', fontStyle: 'italic', marginBottom: '24px' }}>
                {state.schoolDetails?.place || 'CHENNAI'}
            </p>
            {title && (
                <div className="flex justify-center">
                    <div style={{ padding: '6px 40px', border: '1px solid #000', color: '#000', fontWeight: 900, fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'inline-block', minWidth: '300px' }}>
                        {selectedExam?.name || 'EXAMINATION'} - {title}
                    </div>
                </div>
            )}
            <div style={{ marginTop: '16px', borderBottom: '1px solid #000', width: '100%' }}></div>
        </div>

        {/* Info Line */}
        <div className="flex justify-between items-center mb-4 text-[8px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-2">
            <div>Class: <span className="text-slate-900 ml-1">{selectedClass?.name} - {selectedClass?.section}</span></div>
            <div>Academic Year: <span className="text-slate-900 ml-1">{academicYear}</span></div>
            <div>Generated On: <span className="text-slate-900 ml-1">{new Date().toLocaleDateString()}</span></div>
        </div>

        {/* Content Area */}
        <div className="report-body overflow-visible">
            {children}
        </div>
    </div>
);

const ConsolidatedSubjectAnalysisTable = ({ subjectAnalysis, grades, examName }: any) => (
    <div className="w-full">
        {/* --- Premium Boxed Header Title --- */}
        <div className="flex justify-center mb-6">
            <div className="border-[2px] border-black p-3 px-16 text-center font-black text-[14px] uppercase tracking-[0.2em] bg-white shadow-[4px_4px_0px_#000]">
                {examName || 'EXAMINATION'} - SUBJECT-WISE GRADE ANALYSIS
            </div>
        </div>

        <div className="overflow-x-visible border-[1.5px] border-black bg-white">
            <table className="text-[10px] border-collapse" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                    <col style={{ width: '30px' }} /> {/* Sl */}
                    <col style={{ width: 'auto' }} /> {/* Subject - Dynamic remaining space */}
                    {grades.map((_: any, i: number) => (
                        <React.Fragment key={i}>
                            <col style={{ width: '22px' }} /> {/* B */}
                            <col style={{ width: '22px' }} /> {/* G */}
                        </React.Fragment>
                    ))}
                    <col style={{ width: '28px' }} /> {/* Total B */}
                    <col style={{ width: '28px' }} /> {/* Total G */}
                </colgroup>
                <thead>
                    <tr style={{ backgroundColor: '#fcfcfc', WebkitPrintColorAdjust: 'exact', color: '#000', height: '42px' }}>
                        <th style={{ borderRight: '1.5px solid #000', borderBottom: '1.5px solid #000' }} rowSpan={2}>
                            <RenderCell className="uppercase font-black text-[9px]">Sl</RenderCell>
                        </th>
                        <th style={{ borderRight: '1.5px solid #000', borderBottom: '1.5px solid #000' }} rowSpan={2}>
                            <RenderCell className="text-left px-3 uppercase font-black tracking-tight text-[10px]">Subject Name</RenderCell>
                        </th>
                        {grades.map((g: string) => (
                            <th key={g} style={{ borderRight: '1.5px solid #000', borderBottom: '1px solid #000' }} colSpan={2}>
                                <RenderCell className="uppercase font-black text-[10px]">{g}</RenderCell>
                            </th>
                        ))}
                        <th style={{ borderBottom: '1px solid #000', backgroundColor: '#f1f5f9' }} colSpan={2}>
                            <RenderCell className="uppercase font-black text-[10px]">Total</RenderCell>
                        </th>
                    </tr>
                    <tr style={{ backgroundColor: '#fcfcfc', WebkitPrintColorAdjust: 'exact', color: '#000', height: '24px' }}>
                        {[...grades, 'T'].map((g: string, i: number) => (
                            <React.Fragment key={i}>
                                <th style={{ borderRight: '1px solid #000', borderBottom: '1.5px solid #000' }}>
                                    <RenderCell className="text-[8px] uppercase font-black">B</RenderCell>
                                </th>
                                <th style={{ borderRight: g === 'T' ? 'none' : '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                                    <RenderCell className="text-[8px] uppercase font-black">G</RenderCell>
                                </th>
                            </React.Fragment>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {subjectAnalysis && subjectAnalysis.length > 0 ? subjectAnalysis.map((sub: any, idx: number) => {
                        const totalBoys = sub.distribution.reduce((a: number, d: any) => a + d.boys, 0);
                        const totalGirls = sub.distribution.reduce((a: number, d: any) => a + d.girls, 0);
                        return (
                            <tr key={sub.id} style={{ height: '45px' }} className="hover:bg-slate-50">
                                <td style={{ borderRight: '1.5px solid #000', borderBottom: '1px solid #000', backgroundColor: '#fafafa' }} className="text-center">
                                    <RenderCell className="font-black">{idx + 1}</RenderCell>
                                </td>
                                <td style={{ borderRight: '1.5px solid #000', borderBottom: '1px solid #000', whiteSpace: 'nowrap' }} className="px-3">
                                    <RenderCell className="font-black uppercase text-[10px] tracking-tighter">
                                        {sub.name}
                                    </RenderCell>
                                </td>
                                {grades.map((g: string) => {
                                    const dist = sub.distribution.find((d: any) => d.grade === g);
                                    const b = dist?.boys || 0;
                                    const gVal = dist?.girls || 0;
                                    return (
                                        <React.Fragment key={g}>
                                            <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000' }} className="text-center">
                                                <RenderCell className="font-bold text-[10px]">
                                                    {b > 0 ? b : <span className="text-slate-300 font-normal">-</span>}
                                                </RenderCell>
                                            </td>
                                            <td style={{ borderRight: '1.5px solid #000', borderBottom: '1px solid #000' }} className="text-center">
                                                <RenderCell className="font-bold text-[10px]">
                                                    {gVal > 0 ? gVal : <span className="text-slate-300 font-normal">-</span>}
                                                </RenderCell>
                                            </td>
                                        </React.Fragment>
                                    );
                                })}
                                <td style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', backgroundColor: '#f1f5f9' }} className="text-center">
                                    <RenderCell className="font-black text-[10px] text-blue-900">
                                        {totalBoys > 0 ? totalBoys : <span className="text-slate-300 font-normal">-</span>}
                                    </RenderCell>
                                </td>
                                <td style={{ borderBottom: '1px solid #000', backgroundColor: '#f1f5f9' }} className="text-center">
                                    <RenderCell className="font-black text-[10px] text-blue-900">
                                        {totalGirls > 0 ? totalGirls : <span className="text-slate-300 font-normal">-</span>}
                                    </RenderCell>
                                </td>
                            </tr>
                        );
                    }) : (
                        <tr><td colSpan={(grades.length * 2) + 4} className="p-16 text-center font-bold text-slate-400 italic bg-white text-[12px]">No data available.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// --- Main Reports Component ---
const Reports: React.FC<ReportsProps> = ({ teacher, state }) => {
    // helper to extract ID from potentially populated object
    const getId = (ref: any) => typeof ref === 'object' && ref ? (ref.id || ref._id) : ref;

    // 1. Get relevant classes and exams
    const myFormClasses = state.classes.filter((c: any) =>
        getId(c.classTeacherId) === teacher.id
    );
    const mySubjectClasses = state.assignments.filter((a: any) => getId(a.teacherId) === teacher.id).map((a: any) => state.classes.find((c: any) => c.id === getId(a.classId))).filter(Boolean);
    // User Request: Only show classes where I am the Class Teacher for Reports
    const myClasses = myFormClasses;

    const primaryClass = myFormClasses[0];

    const [selectedClassId, setSelectedClassId] = useState(primaryClass ? primaryClass.id : '');
    const [selectedExamId, setSelectedExamId] = useState('');
    const [viewMode, setViewMode] = useState<'consolidated' | 'progress_card'>('consolidated');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [paginatedStudents, setPaginatedStudents] = useState<any[][]>([]);
    const measureRef = useRef<HTMLDivElement>(null);

    // New State: Orientation for Consolidated Report
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

    // New State: Display Mode for Consolidated Report
    const [consolidatedDisplayMode, setConsolidatedDisplayMode] = useState<'marks' | 'grade' | 'both'>('both');

    // Report Settings
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('report_settings');
        return saved ? JSON.parse(saved) : {
            showTe: true, showCe: true, showTotal: true, showPercentage: true, showGrade: true
        };
    });

    useEffect(() => {
        localStorage.setItem('report_settings', JSON.stringify(settings));
    }, [settings]);

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
    };

    const examsForClass = state.exams.filter((e: any) => getId(e.classId) === selectedClassId);

    const selectedClass = state.classes.find((c: any) => c.id === selectedClassId);
    const selectedExam = state.exams.find((e: any) => e.id === selectedExamId);

    // Fix: Handle classTeacherId being object or string
    const classTeacherId = typeof selectedClass?.classTeacherId === 'object' ? selectedClass.classTeacherId.id : selectedClass?.classTeacherId;
    const classTeacher = state.users.find((u: any) => u.id === classTeacherId);

    const students = selectedClass ? state.users.filter((u: any) => u.role === UserRole.STUDENT && getId(u.classId) === selectedClass.id) : [];

    // Grade Logic
    const applicableScheme = useMemo(() => {
        if (!selectedClass || !state.gradeSchemes) return null;
        const classGrade = String(selectedClass.gradeLevel).trim().toUpperCase();

        // Try exact match first
        let scheme = state.gradeSchemes.find((s: any) =>
            Array.isArray(s.applicableClasses) &&
            s.applicableClasses.some((ac: any) => String(ac).trim().toUpperCase() === classGrade)
        );

        // Fallback: if no scheme explicitly for this class, use the first available one as a safety net
        // or one that has no classes specified (global scheme)
        if (!scheme && state.gradeSchemes.length > 0) {
            scheme = state.gradeSchemes[0];
        }

        return scheme;
    }, [state.gradeSchemes, selectedClass]);

    const sortedBoundaries = useMemo(() =>
        applicableScheme ? [...applicableScheme.boundaries].sort((a, b) => b.minPercent - a.minPercent) : []
        , [applicableScheme]);

    const getGrade = useCallback((percent: number) => {
        if (isNaN(percent)) return '-';
        if (!applicableScheme || sortedBoundaries.length === 0) return '-';
        const boundary = sortedBoundaries.find((b: any) => percent >= b.minPercent);
        return boundary ? boundary.grade : 'F';
    }, [applicableScheme, sortedBoundaries]);

    // Process Data
    const reportData = useMemo(() => {
        const getIdResilient = (ref: any) => {
            if (!ref) return null;
            if (typeof ref === 'string') return ref;
            return ref.id || ref._id || ref.toString();
        };

        if (!selectedExam || !students.length) return { students: [], summary: null, subjectAnalysis: [] };

        const studentResults = students.map((student: any) => {
            let totalMax = 0;
            let totalObt = 0;
            let subjectResults: any[] = [];
            const attendance = state.attendance.find((a: any) => getIdResilient(a.examId) === selectedExamId && getIdResilient(a.studentId) === student.id)?.percentage;

            selectedExam.subjectConfigs.forEach((config: any) => {
                const configSubjectId = getIdResilient(config.subjectId);
                const subject = state.subjects.find((s: any) => getIdResilient(s) === configSubjectId);
                if (!subject) return;

                const markRecord = state.marks.find((m: any) => getIdResilient(m.examId) === selectedExamId && getIdResilient(m.subjectId) === configSubjectId && getIdResilient(m.studentId) === student.id);
                const teRaw = markRecord?.teMark;
                const ceRaw = markRecord?.ceMark;

                if ((teRaw === undefined || teRaw === '') && (ceRaw === undefined || ceRaw === '')) { return; }

                const parse = (val: any) => {
                    if (val === 'A' || val === '' || val === null || val === undefined) return 0;
                    const n = parseFloat(val);
                    return isNaN(n) ? 0 : n;
                };

                const te = parse(teRaw);
                const ce = parse(ceRaw);
                const subTotal = (settings.showTe ? te : 0) + (settings.showCe ? ce : 0);
                const subMax = (settings.showTe ? config.maxTe : 0) + (settings.showCe ? config.maxCe : 0);

                totalMax += subMax;
                totalObt += subTotal;

                // Granular Mark Distribution (Grouped by Mark Value: 1, 2, 3, 5, 6 etc.)
                const detailedMarks = markRecord?.detailedMarks || [];
                const markSections = config.markSections || [];

                // Pre-initialize standard mark categories to ensure they always show up
                const granularStats: Record<number, { obt: number, max: number }> = {
                    1: { obt: 0, max: 0 },
                    2: { obt: 0, max: 0 },
                    3: { obt: 0, max: 0 },
                    5: { obt: 0, max: 0 },
                    6: { obt: 0, max: 0 }
                };

                markSections.forEach((section: any) => {
                    const dm = detailedMarks.find((d: any) => (d.sectionId === section.id || d._id === section.id || d.sectionId === section._id));
                    const score = dm ? parse(dm.marks) : 0;
                    const max = section.maxMarks || 0;
                    const val = section.markValue || 1;

                    if (!granularStats[val]) {
                        granularStats[val] = { obt: 0, max: 0 };
                    }
                    granularStats[val].obt += score;
                    granularStats[val].max += max;
                });

                // Convert to sorted array for display
                const sectionsList = Object.entries(granularStats)
                    .map(([val, stats]) => ({
                        markValue: parseFloat(val),
                        obt: stats.obt,
                        max: stats.max,
                        percent: stats.max > 0 ? (stats.obt * 100 / stats.max) : 0
                    }))
                    .sort((a, b) => a.markValue - b.markValue);

                subjectResults.push({
                    id: configSubjectId,
                    name: subject.name,
                    shortCode: subject.shortCode,
                    teStr: teRaw === 'A' ? 'A' : (teRaw ?? '-'),
                    ceStr: ceRaw === 'A' ? 'A' : (ceRaw ?? '-'),
                    te, ce,
                    total: isNaN(subTotal) ? 0 : subTotal,
                    max: isNaN(subMax) ? 0 : subMax,
                    percent: subMax > 0 ? (subTotal / subMax) * 100 : 0,
                    grade: getGrade((subTotal / subMax) * 100),
                    aiAnalysis: markRecord?.aiAnalysis || '',
                    aiAdvice: markRecord?.aiAdvice || '',
                    sections: sectionsList
                });
            });

            const percentage = totalMax > 0 ? (totalObt / totalMax) * 100 : 0;
            const safePercentage = isNaN(percentage) ? 0 : percentage;
            const safeTotalObt = isNaN(totalObt) ? 0 : totalObt;
            const safeTotalMax = isNaN(totalMax) ? 0 : totalMax;

            // Collect all subject advices that are not empty
            const allAdvices = subjectResults.map(sr => ({
                subject: sr.name,
                advice: sr.aiAdvice,
                analysis: sr.aiAnalysis,
                sections: sr.sections,
                total: sr.total,
                max: sr.max,
                grade: sr.grade,
                percent: sr.max > 0 ? (sr.total * 100 / sr.max) : 0
            }));

            return {
                student,
                subjects: subjectResults,
                grandTotal: safeTotalObt,
                maxTotal: safeTotalMax,
                percentage: safePercentage,
                grade: getGrade(safePercentage),
                result: safePercentage >= 35 ? 'PASS' : 'FAIL',
                attendance,
                allAdvices
            };
        }).sort((a: any, b: any) => b.grandTotal - a.grandTotal)
            .map((s, idx) => ({ ...s, rank: idx + 1 }));

        // --- Summary Overview Logic ---
        const boys = students.filter(s => s.gender === 'Male');
        const girls = students.filter(s => s.gender === 'Female');
        const passed = studentResults.filter(r => r.result === 'PASS');
        const failed = studentResults.filter(r => r.result === 'FAIL');

        const grades = sortedBoundaries.map(b => b.grade);
        const gradeSummary = grades.map(g => ({
            grade: g,
            count: studentResults.filter(r => r.grade === g).length
        }));

        // Category-wise stats
        const categories = ['General', 'OBC', 'SC', 'ST'];
        const categoryStats = categories.map(cat => ({
            name: cat,
            boys: students.filter(s => s.category === cat && s.gender === 'Male').length,
            girls: students.filter(s => s.category === cat && s.gender === 'Female').length,
            total: students.filter(s => s.category === cat).length
        }));

        // Academic Year
        const currentYear = new Date().getFullYear();
        const academicYear = `${currentYear} -${currentYear + 1} `;

        const summary = {
            total: students.length,
            boys: boys.length,
            girls: girls.length,
            passed: passed.length,
            failed: failed.length,
            gradeSummary,
            categoryStats,
            academicYear
        };

        // --- Subject-Wise Analysis Logic ---
        const subjectAnalysis = selectedExam.subjectConfigs.map((config: any) => {
            const configSubId = getIdResilient(config.subjectId);
            const subject = state.subjects.find((s: any) => getIdResilient(s) === configSubId);
            if (!subject) return null;

            const distribution = grades.map(g => {
                const studentsWithGrade = studentResults.filter(sr => {
                    const subMark = sr.subjects.find(s => s.id === configSubId);
                    return subMark?.grade === g;
                });

                return {
                    grade: g,
                    boys: studentsWithGrade.filter(sr => sr.student.gender === 'Male').length,
                    girls: studentsWithGrade.filter(sr => sr.student.gender === 'Female').length,
                    total: studentsWithGrade.length
                };
            });

            return {
                id: configSubId,
                name: subject.name,
                distribution
            };
        }).filter(Boolean);

        return {
            students: studentResults,
            summary,
            subjectAnalysis
        };
    }, [selectedExam, students, state.marks, settings.showTe, settings.showCe, state.attendance, sortedBoundaries, applicableScheme, selectedExamId, state.subjects, getGrade]);

    // Create a key to detect changes in student data
    const dataKey = useMemo(() => {
        return reportData.students.length + reportData.students.reduce((acc, s) => acc + s.grandTotal, 0);
    }, [reportData.students]);

    // --- Dynamic Pagination Logic ---
    useEffect(() => {
        if (viewMode !== 'consolidated' || !reportData.students.length || !measureRef.current) {
            setPaginatedStudents([]);
            return;
        }

        const runPagination = () => {
            const measureEl = measureRef.current;
            if (!measureEl) return;

            const rows = Array.from(measureEl.querySelectorAll('.rows-measure .student-row')) as HTMLElement[];
            if (rows.length === 0) return;

            const pxPerMm = 3.78;
            const PAGE_HEIGHT_MM = orientation === 'landscape' ? 210 : 297;
            const totalPageHeightPx = PAGE_HEIGHT_MM * pxPerMm;

            // padding: 10mm 15mm 30mm 15mm from @media print CSS
            // Total vertical padding = 40mm
            const pagePaddingVPx = 40 * pxPerMm;
            const usableHeightPx = totalPageHeightPx - pagePaddingVPx;

            const firstPageOverhead = (measureEl.querySelector('.first-page-overhead') as HTMLElement)?.offsetHeight || 0;
            const subsequentPageOverhead = (measureEl.querySelector('.subsequent-page-overhead') as HTMLElement)?.offsetHeight || 0;

            const pages: any[][] = [];
            let currentPage: any[] = [];
            let currentHeight = firstPageOverhead;

            reportData.students.forEach((studentData, index) => {
                const rowHeight = rows[index].offsetHeight;

                if (currentHeight + rowHeight > usableHeightPx) {
                    pages.push(currentPage);
                    currentPage = [studentData];
                    currentHeight = subsequentPageOverhead + rowHeight;
                } else {
                    currentPage.push(studentData);
                    currentHeight += rowHeight;
                }
            });

            if (currentPage.length > 0) {
                pages.push(currentPage);
            }

            setPaginatedStudents(pages);
        };

        const timer = setTimeout(runPagination, 200);
        return () => clearTimeout(timer);
    }, [dataKey, orientation, viewMode, consolidatedDisplayMode, selectedExamId]);

    const pagesList = useMemo(() => {
        if (viewMode !== 'consolidated' || !paginatedStudents.length) return [];

        const generatedPages = [];

        // Page 1: Header + Summary + First Batch
        generatedPages.push(
            <div key="page-0" className="consolidated-page bg-white shadow-2xl relative box-border text-slate-900"
                style={{ width: orientation === 'landscape' ? '297mm' : '210mm', height: orientation === 'landscape' ? '210mm' : '297mm', padding: '15mm 15mm 25mm 15mm' }}>
                <ReportPageContent
                    title="CONSOLIDATED RESULT SHEET"
                    selectedExam={selectedExam} selectedClass={selectedClass} state={state} classTeacher={classTeacher}
                    academicYear={reportData.summary.academicYear}
                >
                    <OverallStatsTable summary={reportData.summary} selectedClass={selectedClass} classTeacher={classTeacher} />
                    <CategoryStatsTable categoryStats={reportData.summary.categoryStats} />
                    <div className="mt-4">
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-100 pb-1 italic">Students Marks Record</h3>
                        <StudentMarksTable
                            students={paginatedStudents[0]}
                            startIndex={0}
                            selectedExam={selectedExam} state={state} orientation={orientation} displayMode={consolidatedDisplayMode}
                        />
                    </div>
                </ReportPageContent>
                <ReportFooter classTeacher={classTeacher} />
            </div>
        );

        // Subsequent Pages
        let studentOffset = paginatedStudents[0].length;
        for (let i = 1; i < paginatedStudents.length; i++) {
            generatedPages.push(
                <div key={`page - ${i} `} className="consolidated-page bg-white shadow-2xl relative box-border text-slate-900"
                    style={{ width: orientation === 'landscape' ? '297mm' : '210mm', height: orientation === 'landscape' ? '210mm' : '297mm', padding: '15mm 15mm 25mm 15mm' }}>
                    <ReportPageContent
                        title="CONSOLIDATED RESULT SHEET"
                        selectedExam={selectedExam} selectedClass={selectedClass} state={state} classTeacher={classTeacher}
                        academicYear={reportData.summary.academicYear}
                    >
                        <StudentMarksTable
                            students={paginatedStudents[i]}
                            startIndex={studentOffset}
                            selectedExam={selectedExam} state={state} orientation={orientation} displayMode={consolidatedDisplayMode}
                        />
                    </ReportPageContent>
                    <ReportFooter classTeacher={classTeacher} />
                </div>
            );
            studentOffset += paginatedStudents[i].length;
        }

        // Analysis Page
        const grades = sortedBoundaries.map(b => b.grade);
        generatedPages.push(
            <div key="analysis-page" className="consolidated-page bg-white shadow-2xl relative box-border text-slate-900"
                style={{ width: orientation === 'landscape' ? '297mm' : '210mm', height: orientation === 'landscape' ? '210mm' : '297mm', padding: '15mm 15mm 25mm 15mm' }}>
                <ReportPageContent
                    title="" // Boxed title is handled inside the component for this specific view
                    selectedExam={selectedExam} selectedClass={selectedClass} state={state} classTeacher={classTeacher}
                    academicYear={reportData.summary.academicYear}
                >
                    <ConsolidatedSubjectAnalysisTable
                        subjectAnalysis={reportData.subjectAnalysis}
                        grades={grades}
                        examName={selectedExam?.name}
                    />
                    <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#ffffff', border: '1px solid #000', fontStyle: 'italic', fontSize: '10px', color: '#000', fontFamily: 'serif', lineHeight: '1.6' }}>
                        <p style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px', textDecoration: 'underline' }}>Note on Grade Distribution:</p>
                        The distribution table above provides a comprehensive breakdown of student performance across all subjects, categorized by gender (Boys/Girls). This analysis helps in identifying subject-specific strengths and areas requiring additional focus.
                    </div>
                </ReportPageContent>
                <ReportFooter classTeacher={classTeacher} />
            </div>
        );

        return generatedPages;
    }, [reportData, orientation, consolidatedDisplayMode, selectedExam, selectedClass, state, classTeacher, sortedBoundaries, paginatedStudents, viewMode]);

    const handlePrint = () => window.print();

    const handleDownloadPdf = async () => {
        if (isGeneratingPdf) return;
        setIsGeneratingPdf(true);

        try {
            // Determine orientation and size
            const pdfOrientation = orientation === 'landscape' ? 'l' : 'p';
            const pdfSize = 'a4';

            const pdf = new jsPDF(pdfOrientation, 'mm', pdfSize);
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const elements = viewMode === 'consolidated'
                ? document.getElementsByClassName('consolidated-page')
                : document.getElementsByClassName('progress-card-item');

            if (elements.length === 0) {
                alert("No content found to export.");
                setIsGeneratingPdf(false);
                return;
            }

            for (let i = 0; i < elements.length; i++) {
                const el = elements[i] as HTMLElement;

                // Use scale 3 for A4 to keep file size reasonable but crisp
                const renderScale = 3;

                const canvas = await html2canvas(el, {
                    scale: renderScale,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    width: el.offsetWidth,
                    height: el.offsetHeight,
                    onclone: (clonedDoc) => {
                        // 1. SURGICAL COLOR REPLACEMENT (Prevent html2canvas crash while keeping styles)
                        const modernColorRegex = /(?:oklch|oklab|color-mix|lab|lch|hwb)\((?:[^()]+|\([^()]*\))*\)/g;
                        const sanitizeColor = (text: string) => {
                            if (!text || (!text.includes('okl') && !text.includes('color-mix'))) return text;
                            return text.replace(modernColorRegex, (m) => {
                                // If it looks like a light color (background), make it white, else black
                                if (m.includes('100%') || m.includes('98%') || m.includes('95%')) return '#ffffff';
                                return '#000000';
                            });
                        };

                        // Sanitize all style tags
                        const styleTags = clonedDoc.getElementsByTagName('style');
                        for (let i = 0; i < styleTags.length; i++) {
                            const st = styleTags[i];
                            if (st.textContent) {
                                st.textContent = sanitizeColor(st.textContent);
                            }
                        }

                        // Sanitize all inline styles
                        const allNodes = clonedDoc.querySelectorAll('*');
                        allNodes.forEach((node: any) => {
                            const styleAttr = node.getAttribute('style');
                            if (styleAttr) {
                                node.setAttribute('style', sanitizeColor(styleAttr));
                            }

                            // Force fix for specific report elements that often glitch in PDF
                            if (node.classList.contains('consolidated-page') || node.classList.contains('report-content-wrapper')) {
                                node.style.backgroundColor = '#ffffff';
                                node.style.color = '#000000';
                            }
                            if (node.tagName === 'TABLE') {
                                node.style.borderCollapse = 'collapse';
                                node.style.backgroundColor = '#ffffff';
                            }
                            if (node.tagName === 'TD' || node.tagName === 'TH') {
                                node.style.backgroundColor = '#ffffff';
                                node.style.color = '#000000';
                                node.style.borderColor = '#000000';
                                node.style.verticalAlign = 'bottom';
                            }
                        });

                        // 2. INJECT FINAL REFINEMENT OVERRIDES
                        const style = clonedDoc.createElement('style');
                        style.textContent = `
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                color-adjust: exact !important;
                                text-decoration: none !important;
                                box-shadow: none !important;
                            }
                            
                            /* Preserve user's Professional Table System */
                            table {
                                border-collapse: collapse !important;
                                width: 100% !important;
                                table-layout: fixed !important;
                                border: 1px solid #000 !important;
                            }
                            td, th {
                                border: 1px solid #000 !important;
                                padding: 0 !important;
                                height: 28px !important;
                                background-color: #ffffff !important;
                                overflow: visible !important;
                            }
                            .cell {
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                height: 100% !important;
                                width: 100% !important;
                                font-size: 11px !important;
                                line-height: 1.2 !important;
                                font-weight: 500 !important;
                                position: relative !important;
                                font-family: 'Inter', sans-serif !important;
                            }
                            .cell.name {
                                justify-content: flex-start !important;
                                padding-left: 6px !important;
                                font-weight: 600 !important;
                            }
                            
                            .no-border-table, .no-border-table * { 
                                border: none !important; 
                                background-color: transparent !important; 
                            }
                            /* Ensure text is solid black */
                            h1, p, span, div, th, td {
                                color: #000000 !important;
                                font-family: 'Inter', sans-serif !important;
                            }
                        `;
                        clonedDoc.head.appendChild(style);
                    }
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.98);

                if (i > 0) {
                    pdf.addPage(pdfSize, pdfOrientation);
                }

                pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
            }

            const filename = viewMode === 'consolidated'
                ? `${selectedClass?.name} -${selectedClass?.section}_${selectedExam?.name} _Consolidated.pdf`
                : (selectedStudentId === 'all'
                    ? `${selectedClass?.name} -${selectedClass?.section}_${selectedExam?.name} _All_Progress_Cards.pdf`
                    : `${selectedClass?.name} -${selectedClass?.section}_${selectedExam?.name} _Progress_Card.pdf`);

            pdf.save(filename);
        } catch (err) {
            console.error("PDF Generation failed", err);
            alert("PDF Generation failed. This is likely due to unsupported CSS features. Reverting to basic rendering...");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (

        <div className="reports-container space-y-8 max-w-[1200px] mx-auto pb-20 print:pb-0 print:max-w-none print:mx-0 print:space-y-0">
            <style>
                {`
/* ================================
PROFESSIONAL TABLE SYSTEM
================================ */

@media print {
  /* ===== TABLE CORE ===== */
table {
  border-collapse: collapse;
  width: 100%;
}

td, th {
  border: 1px solid #000;
  padding: 0;
  height: 28px;
}

/* ===== MAGIC FIX ===== */
td > .cell,
th > .cell {
  display: flex;
  align-items: center;     /* vertical center */
  justify-content: center; /* horizontal center */
  height: 100%;
  width: 100%;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 500;
}

/* Student name left aligned */
.cell.name {
  justify-content: flex-start;
  padding-left: 6px;
  font-weight: 600;
}

/* Header text */
th .cell {
  font-weight: 700;
  text-transform: uppercase;
}

    /* Prevent pdf baseline glitch */
    td *, th * {
        transform: translateY(0.5px);
    }



        `}
            </style>

            {/* Header & Controls */}
            <div className="grid grid-cols-12 gap-4 items-center print:hidden">
                <div className="col-span-10">
                    <h1 className="text-3xl font-black text-slate-900">Reports & Analytics</h1>
                    <p className="text-slate-400 font-bold truncate">Generate consolidated sheets and progress cards</p>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                    <button
                        onClick={handleDownloadPdf}
                        disabled={!selectedExamId || isGeneratingPdf}
                        className={`p-3 text-white font-black rounded-2xl shadow-lg flex items-center justify-center transition-all aspect-square ${isGeneratingPdf ? 'bg-slate-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] shadow-blue-200'}`}
                        title="Download PDF"
                    >
                        {isGeneratingPdf ? <Loader2 size={24} className="animate-spin" /> : <Download size={24} />}
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={!selectedExamId}
                        className="p-3 bg-slate-900 text-white font-black rounded-2xl shadow-lg flex items-center justify-center hover:bg-slate-800 transition-all aspect-square disabled:bg-slate-200 disabled:text-slate-400 group relative"
                        title="Print / Export"
                    >
                        <Printer size={24} />
                        <span className="absolute -bottom-10 right-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Print Preview Area Below</span>
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6 print:hidden no-print controls-area">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Class</label>
                        {primaryClass ? (
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700">
                                {primaryClass.name} - {primaryClass.section} (My Class)
                            </div>
                        ) : (
                            <select
                                value={selectedClassId}
                                onChange={(e) => { setSelectedClassId(e.target.value); setSelectedExamId(''); }}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Choose Class</option>
                                {myClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                            </select>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Exam</label>
                        <select
                            value={selectedExamId}
                            onChange={(e) => setSelectedExamId(e.target.value)}
                            disabled={!selectedClassId}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <option value="">Choose Exam</option>
                            {examsForClass.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Report Type</label>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            <button onClick={() => setViewMode('consolidated')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'consolidated' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Consolidated</button>
                            <button onClick={() => setViewMode('progress_card')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'progress_card' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Progress Card</button>
                        </div>
                    </div>
                </div>
                {viewMode === 'consolidated' ? (
                    <div className="flex gap-2 pt-4 border-t border-slate-50">
                        {['marks', 'grade', 'both'].map((mode) => (
                            <button key={mode} onClick={() => setConsolidatedDisplayMode(mode as any)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase border transition-all ${consolidatedDisplayMode === mode ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>{mode === 'both' ? 'Marks & Grade' : mode + ' Only'}</button>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                        {[{ key: 'showTe', label: 'TE' }, { key: 'showCe', label: 'CE' }, { key: 'showTotal', label: 'Total' }, { key: 'showGrade', label: 'Grade' }].map((opt) => (
                            <button key={opt.key} onClick={() => toggleSetting(opt.key as any)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase border transition-all ${settings[opt.key as keyof typeof settings] ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                                {settings[opt.key as keyof typeof settings] ? <CheckSquare size={16} /> : <Square size={16} />} {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedExamId ? (
                <div className="print-container print:block">
                    {viewMode === 'consolidated' && (
                        <div id="consolidated-report-view" className="flex flex-col items-center py-10 bg-slate-100/30 rounded-3xl print:p-0 print:bg-transparent print:block border-2 border-slate-200 border-dashed relative">
                            {/* Visual Print Indicators */}
                            <div className="print-area-indicator print:hidden absolute -top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-1.5 rounded-t-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 z-10">
                                <Award size={14} className="animate-bounce" />
                                Print Area Start
                            </div>

                            <div className="flex flex-col gap-10 items-center w-full print:gap-0 print:block">
                                {/* Measurement Area (Hidden from Print) */}
                                <div ref={measureRef} className="absolute opacity-0 pointer-events-none -z-50 overflow-hidden print:hidden" style={{ width: orientation === 'landscape' ? '297mm' : '210mm' }}>
                                    {/* First Page Overhead Measure */}
                                    <div className="first-page-overhead">
                                        <ReportPageContent title="CONSOLIDATED RESULT SHEET" selectedExam={selectedExam} selectedClass={selectedClass} state={state} classTeacher={classTeacher} academicYear={reportData.summary.academicYear}>
                                            <OverallStatsTable summary={reportData.summary} selectedClass={selectedClass} classTeacher={classTeacher} />
                                            <CategoryStatsTable categoryStats={reportData.summary.categoryStats} />
                                            <div className="mt-4">
                                                <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-100 pb-1 italic">Students Marks Record</h3>
                                                <StudentMarksTable students={[]} selectedExam={selectedExam} state={state} orientation={orientation} displayMode={consolidatedDisplayMode} />
                                            </div>
                                        </ReportPageContent>
                                    </div>
                                    {/* Subsequent Page Overhead Measure */}
                                    <div className="subsequent-page-overhead">
                                        <ReportPageContent title="CONSOLIDATED RESULT SHEET" selectedExam={selectedExam} selectedClass={selectedClass} state={state} classTeacher={classTeacher} academicYear={reportData.summary.academicYear}>
                                            <div className="mt-4">
                                                <StudentMarksTable students={[]} selectedExam={selectedExam} state={state} orientation={orientation} displayMode={consolidatedDisplayMode} />
                                            </div>
                                        </ReportPageContent>
                                    </div>
                                    {/* Rows Measure */}
                                    <div className="rows-measure">
                                        <StudentMarksTable students={reportData.students} selectedExam={selectedExam} state={state} orientation={orientation} displayMode={consolidatedDisplayMode} />
                                    </div>
                                </div>

                                {/* Consolidated Report Split into A4 Pages */}
                                {pagesList}
                            </div>

                            <div className="print-area-indicator print:hidden bg-red-600 text-white px-6 py-1.5 rounded-b-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 mt-4">
                                <FileText size={14} />
                                Print Area End
                            </div>
                        </div>
                    )}

                    {viewMode === 'progress_card' && (
                        <div className="space-y-6 progress-card-container">
                            <div className="flex justify-end print:hidden no-print">
                                <select
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-sm outline-none"
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                >
                                    <option value="all">Whole Class (Print All)</option>
                                    {reportData.students.map((d: any) => (
                                        <option key={d.student.id} value={d.student.id}>{d.student.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div id="progress-cards-view" className="flex flex-col items-center py-10 bg-slate-100/30 rounded-3xl print:p-0 print:bg-transparent print:block border-2 border-slate-200 border-dashed relative">
                                {/* Visual Print Indicators */}
                                <div className="print-area-indicator print:hidden absolute -top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-1.5 rounded-t-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 z-10">
                                    <Award size={14} className="animate-bounce" />
                                    Print Area Start
                                </div>

                                <div className="flex flex-wrap justify-center gap-8 print:gap-0 print:block w-full">
                                    {selectedStudentId === 'all' ? (
                                        reportData.students.map((data: any) => (
                                            <React.Fragment key={data.student.id}>
                                                <ProgressCardA4 data={data} selectedExam={selectedExam} selectedClass={selectedClass} settings={settings} schoolDetails={state.schoolDetails} classTeacher={classTeacher} />
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        (() => {
                                            const studentData = reportData.students.find((d: any) => d.student.id === selectedStudentId);
                                            if (!studentData) return null;
                                            return (
                                                <React.Fragment>
                                                    <ProgressCardA4 data={studentData} selectedExam={selectedExam} selectedClass={selectedClass} settings={settings} schoolDetails={state.schoolDetails} classTeacher={classTeacher} />
                                                </React.Fragment>
                                            );
                                        })()
                                    )}
                                </div>

                                <div className="print-area-indicator print:hidden bg-red-600 text-white px-6 py-1.5 rounded-b-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 mt-4">
                                    <FileText size={14} />
                                    Print Area End
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white p-24 rounded-[3rem] text-center border-4 border-dashed border-slate-100 flex flex-col items-center justify-center print:hidden">
                    <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-6 text-blue-600 shadow-inner"><Award size={32} /></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Select Class & Exam to Generate Reports.</p>
                </div>
            )}
        </div>
    );
};

export default Reports;
