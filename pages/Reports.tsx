import React, { useState, useMemo, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { Printer, Award, CheckSquare, Square, Download, Loader2, FileText, Smartphone } from 'lucide-react';
import { RenderCell } from "../src/utils/RenderCell";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReportsProps {
    teacher: User;
    state: any;
}

// --- Helper Functions ---
const getAcademicYear = () => {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const year = now.getFullYear();

    // Jan (0) to May (4) -> (Year-1) - (Year)
    // June (5) to Dec (11) -> (Year) - (Year+1)
    if (month >= 0 && month <= 4) {
        return `${year - 1}-${year}`;
    } else {
        return `${year}-${year + 1}`;
    }
};

const ProgressCardA4: React.FC<{ data: any, selectedExam: any, selectedClass: any, settings: any, schoolDetails: any, classTeacher: any }> = ({
    data, selectedExam, selectedClass, settings, schoolDetails, classTeacher
}) => {
    const academicYear = getAcademicYear();
    return (
        <div className="progress-card-item bg-white mx-auto print:mx-0 mb-8 print:mb-0 relative box-border text-black"
            style={{ width: '210mm', minHeight: '297mm', padding: '8mm', display: 'flex', flexDirection: 'column' }}>

            <div className="flex flex-col flex-1 font-sans" style={{ lineHeight: '1.2' }}>
                {/* Header Section - Compact */}
                <div className="text-center w-full mb-2">
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#000', margin: '0 0 1px 0', lineHeight: '1' }}>
                        {schoolDetails?.name || 'SMART SCHOOL'}
                    </h1>
                    <h2 style={{ fontSize: '11px', fontWeight: 700, color: '#444', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                        {schoolDetails?.place || 'CHENNAI'}
                    </h2>

                    <div className="flex items-center justify-center w-full mb-2">
                        <div className="flex-1 h-[2px] bg-black"></div>
                        <span className="px-4 text-[14px] font-black italic text-black uppercase tracking-widest border-2 border-black py-0.5 mx-4 bg-white z-10">
                            PROGRESS REPORT
                        </span>
                        <div className="flex-1 h-[2px] bg-black"></div>
                    </div>

                    <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        Academic Year {academicYear} &bull; {selectedExam?.name || 'ANNUAL EXAMINATION'}
                    </div>
                </div>

                {/* Student Info Table - Compact */}
                <div className="w-full mb-3">
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', fontSize: '11px', tableLayout: 'fixed' }}>
                        <tbody>
                            <tr style={{ height: '28px' }}>
                                <td style={{ width: '18%', padding: '2px 6px', fontWeight: 800, border: '1px solid #000', backgroundColor: '#f1f5f9', verticalAlign: 'middle', fontSize: '10px' }}>STUDENT NAME</td>
                                <td style={{ width: '32%', padding: '2px 6px', fontWeight: 800, border: '1px solid #000', textTransform: 'uppercase', verticalAlign: 'middle', fontSize: '12px' }}>{data.student.name}</td>
                                <td style={{ width: '18%', padding: '2px 6px', fontWeight: 800, border: '1px solid #000', backgroundColor: '#f1f5f9', verticalAlign: 'middle', fontSize: '10px' }}>ADMISSION NO</td>
                                <td style={{ width: '32%', padding: '2px 6px', fontWeight: 800, border: '1px solid #000', verticalAlign: 'middle', fontSize: '12px' }}>{data.student.admissionNo}</td>
                            </tr>
                            <tr style={{ height: '28px' }}>
                                <td style={{ padding: '2px 6px', fontWeight: 800, border: '1px solid #000', backgroundColor: '#f1f5f9', verticalAlign: 'middle', fontSize: '10px' }}>CLASS & DIV</td>
                                <td style={{ padding: '2px 6px', fontWeight: 800, border: '1px solid #000', verticalAlign: 'middle', fontSize: '12px' }}>{selectedClass?.gradeLevel} - {selectedClass?.section}</td>
                                <td style={{ padding: '2px 6px', fontWeight: 800, border: '1px solid #000', backgroundColor: '#f1f5f9', verticalAlign: 'middle', fontSize: '10px' }}>DATE OF BIRTH</td>
                                <td style={{ padding: '2px 6px', fontWeight: 800, border: '1px solid #000', verticalAlign: 'middle', fontSize: '12px' }}>{data.student.dob ? new Date(data.student.dob).toLocaleDateString() : '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Main Marks Table - Compact */}
                <div className="w-full mb-3">
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', border: '2px solid #000' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #000', height: '30px' }}>
                                <th style={{ borderRight: '1.5px solid #000', width: '35%', textAlign: 'left', padding: '0 8px', fontWeight: 900, fontSize: '10px', verticalAlign: 'middle' }}>SUBJECT</th>
                                {settings.showTe && <th style={{ borderRight: '1.5px solid #000', width: '12%', textAlign: 'center', fontWeight: 900, fontSize: '10px', verticalAlign: 'middle' }}>T.E</th>}
                                {settings.showCe && <th style={{ borderRight: '1.5px solid #000', width: '12%', textAlign: 'center', fontWeight: 900, fontSize: '10px', verticalAlign: 'middle' }}>C.E</th>}
                                {settings.showTotal && <th style={{ borderRight: '1.5px solid #000', width: '18%', textAlign: 'center', fontWeight: 900, fontSize: '10px', verticalAlign: 'middle' }}>TOTAL</th>}
                                {settings.showPercentage && <th style={{ borderRight: '1.5px solid #000', width: '10%', textAlign: 'center', fontWeight: 900, fontSize: '10px', verticalAlign: 'middle' }}>%</th>}
                                {settings.showGrade && <th style={{ width: '13%', textAlign: 'center', fontWeight: 900, fontSize: '10px', verticalAlign: 'middle' }}>GRADE</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {data.subjects.map((sub: any) => (
                                <tr key={sub.id} style={{ borderBottom: '1px solid #000', height: '22px' }}>
                                    <td style={{ borderRight: '1.5px solid #000', padding: '0 6px', fontWeight: 700, fontSize: '9px', verticalAlign: 'middle', textTransform: 'uppercase' }}>
                                        {sub.name}
                                    </td>
                                    {settings.showTe && <td style={{ borderRight: '1.5px solid #000', textAlign: 'center', fontWeight: 600, fontSize: '9px', verticalAlign: 'middle' }}>
                                        {sub.teStr !== '-' ? sub.teStr : '0'}
                                    </td>}
                                    {settings.showCe && <td style={{ borderRight: '1.5px solid #000', textAlign: 'center', fontWeight: 600, fontSize: '9px', verticalAlign: 'middle' }}>
                                        {sub.ceStr !== '-' ? sub.ceStr : '0'}
                                    </td>}
                                    {settings.showTotal && <td style={{ borderRight: '1.5px solid #000', textAlign: 'center', fontWeight: 700, fontSize: '9px', verticalAlign: 'middle' }}>
                                        {sub.teStr === 'A' ? 'A' : `${sub.total || 0} / ${sub.max || 0}`}
                                    </td>}
                                    {settings.showPercentage && <td style={{ borderRight: '1.5px solid #000', textAlign: 'center', fontWeight: 600, fontSize: '9px', verticalAlign: 'middle' }}>
                                        {sub.teStr === 'A' ? '-' : `${Math.round(sub.percent || 0)}%`}
                                    </td>}
                                    {settings.showGrade && <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '10px', verticalAlign: 'middle' }}>
                                        {sub.teStr === 'A' ? 'A' : (sub.total > 0 ? sub.grade : '-')}
                                    </td>}
                                </tr>
                            ))}
                            {/* Consolidated Performance Row */}
                            <tr style={{ backgroundColor: '#f8fafc', height: '26px', borderTop: '2px solid #000' }}>
                                <td style={{ borderRight: '1.5px solid #000', textAlign: 'right', paddingRight: '8px', fontWeight: 900, fontSize: '9px', verticalAlign: 'middle' }}>
                                    OVERALL PERFORMANCE
                                </td>
                                <td style={{ borderRight: '1.5px solid #000' }} colSpan={(settings.showTe ? 1 : 0) + (settings.showCe ? 1 : 0)}></td>
                                <td style={{ borderRight: '1.5px solid #000', textAlign: 'center', fontWeight: 900, fontSize: '9px', verticalAlign: 'middle' }}>
                                    {data.grandTotal > 0 ? `${data.grandTotal} / ${data.maxTotal}` : '-'}
                                </td>
                                <td style={{ borderRight: '1.5px solid #000' }}></td>
                                <td style={{ textAlign: 'center', fontWeight: 900, fontSize: '11px', verticalAlign: 'middle' }}>
                                    {data.grandTotal > 0 ? data.grade : '-'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Results Summary */}
                <div className="flex justify-between items-center w-full px-3 mb-3 py-1.5 border-y-2 border-black bg-slate-50">
                    <div className="flex gap-4 text-[9px] font-black uppercase tracking-wide text-slate-900">
                        {data.grandTotal > 0 ? (
                            <>
                                <span>RESULT: <span className={data.result === 'PASS' ? 'text-green-700' : 'text-red-600'}>{data.result}</span></span>
                                <span>PERCENTAGE: {data.percentage.toFixed(2)}%</span>
                                <span>CLASS RANK: #{data.rank}</span>
                            </>
                        ) : (
                            <span className="italic opacity-50">Results pending</span>
                        )}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-wide text-slate-900">
                        Attendance: {data.attendance ? `${data.attendance}%` : 'N/A'}
                    </div>
                </div>

                {/* Performance Analysis - Compact */}
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg mb-2 flex-1">
                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
                        <Award size={12} className="text-black" />
                        <h3 className="text-[10px] font-black uppercase tracking-wider text-black">Performance Analysis & Advice</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {(data.allAdvices || []).map((adv: any, idx: number) => (
                            <div key={idx} className="border-b border-dashed border-slate-300 last:border-0 pb-2 last:pb-0 break-inside-avoid">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="font-bold text-[10px] uppercase text-black w-32 shrink-0">{adv.subject}</div>
                                    <div className="text-[9px] font-bold text-slate-700">
                                        Score: {adv.total}/{adv.max}
                                    </div>
                                </div>

                                {/* Granular Marks Table */}
                                <div className="mb-1">
                                    <table className="w-full text-center border-collapse border border-black text-[8px]">
                                        <thead>
                                            <tr className="bg-slate-100">
                                                {adv.sections.map((s: any, sIdx: number) => (
                                                    <th key={sIdx} className="border border-black py-0.5 font-bold">{s.markValue} Mark</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                {adv.sections.map((s: any, sIdx: number) => (
                                                    <td key={sIdx} className="border border-black py-0.5">
                                                        {s.obt} / {s.max}
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Advice Text */}
                                <div className="text-slate-800 italic text-[9px] leading-tight bg-white p-1.5 border border-slate-100 rounded">
                                    <span className="font-bold not-italic text-[8px] uppercase tracking-wide text-slate-400 mr-2">Progress Note:</span>
                                    "{adv.advice || adv.analysis || "Consistently follow practice activities to improve scores."}"
                                </div>
                            </div>
                        ))}
                        {data.allAdvices?.length === 0 && <div className="text-[9px] italic text-slate-400">No specific advice recorded.</div>}
                    </div>
                </div>

                {/* Signature Block - Bottom of Page with reduced padding */}
                <div className="mt-auto pt-4">
                    <div className="flex justify-between items-end w-full">
                        <div className="flex flex-col items-center w-28">
                            <div className="text-[9px] font-bold mb-1">{classTeacher?.name}</div>
                            <div className="w-full border-t border-black pt-1 text-[8px] font-black uppercase text-center">Class Teacher</div>
                        </div>
                        <div className="flex flex-col items-center w-28">
                            <div className="h-[15px]"></div>
                            <div className="w-full border-t border-black pt-1 text-[8px] font-black uppercase text-center">Parent</div>
                        </div>
                        <div className="flex flex-col items-center w-28">
                            <div className="h-[15px]"></div>
                            <div className="w-full border-t border-black pt-1 text-[8px] font-black uppercase text-center">Headmaster</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};


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
                    <th style={{ border: '1px solid #000', width: '150px' }}><RenderCell className="name">STUDENT NAME</RenderCell></th>
                    {selectedExam.subjectConfigs.map((config: any) => {
                        const configSubId = getIdResilient(config.subjectId);
                        const sub = state.subjects.find((s: any) => (s.id || s._id) === configSubId);
                        const label = sub?.shortCode || sub?.name?.substring(0, 3).toUpperCase() || 'SUB';
                        return (
                            <th key={configSubId} style={{ border: '1px solid #000', width: 'auto' }}>
                                <RenderCell className="font-black text-[9px]">{label}</RenderCell>
                            </th>
                        );
                    })}
                    {state.consolidatedSettings?.showTotal && <th style={{ border: '1px solid #000', width: '40px' }}><RenderCell>TOTAL</RenderCell></th>}
                    {state.consolidatedSettings?.showGrade && <th style={{ border: '1px solid #000', width: '30px' }}><RenderCell>GRADE</RenderCell></th>}
                    {state.consolidatedSettings?.showPercentage && <th style={{ border: '1px solid #000', width: '35px' }}><RenderCell>%</RenderCell></th>}
                    {state.consolidatedSettings?.showRank && <th style={{ border: '1px solid #000', width: '30px' }}><RenderCell>RANK</RenderCell></th>}
                </tr>
            </thead>
            <tbody>
                {students.map((data: any, idx: number) => (
                    <tr key={`${data.student.id}-${idx}`} className="student-row" style={{ height: '36px' }}>
                        <td style={{ border: '1px solid #000' }}>
                            <RenderCell className="font-bold">{startIndex + idx + 1}</RenderCell>
                        </td>
                        <td style={{ border: '1px solid #000' }}>
                            <RenderCell className="name font-black text-[10px] uppercase truncate" style={{ width: '150px' }}>{data.student.name}</RenderCell>
                        </td>
                        {selectedExam.subjectConfigs.map((config: any) => {
                            const configSubId = getIdResilient(config.subjectId);
                            const subResult = data.subjects.find((s: any) => s.id === configSubId);
                            return (
                                <td key={configSubId} style={{ border: '1px solid #000' }}>
                                    <RenderCell>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1px' }}>
                                            {(displayMode === 'marks' || displayMode === 'both') && (
                                                <div style={{ fontWeight: 900, fontSize: '10px', color: '#000', lineHeight: '1' }}>
                                                    {subResult?.teStr === 'A' ? 'A' : (subResult?.total !== undefined && !isNaN(subResult.total) ? subResult.total : '-')}
                                                </div>
                                            )}
                                            {(displayMode === 'grade' || displayMode === 'both') && (
                                                <div style={{ fontSize: '8px', color: '#000', fontWeight: '900', lineHeight: '1' }}>
                                                    {subResult?.teStr === 'A' ? 'A' : (subResult?.total > 0 ? subResult.grade : '-')}
                                                </div>
                                            )}
                                        </div>
                                    </RenderCell>
                                </td>
                            );
                        })}
                        {state.consolidatedSettings?.showTotal && (
                            <td style={{ border: '1px solid #000' }}>
                                <RenderCell className="font-black text-[10px]">{data.grandTotal > 0 ? data.grandTotal : '-'}</RenderCell>
                            </td>
                        )}
                        {state.consolidatedSettings?.showGrade && (
                            <td style={{ border: '1px solid #000' }}>
                                <RenderCell className="font-black text-[10px]">{data.grandTotal > 0 ? data.grade : '-'}</RenderCell>
                            </td>
                        )}
                        {state.consolidatedSettings?.showPercentage && (
                            <td style={{ border: '1px solid #000' }}>
                                <RenderCell className="font-bold">{data.grandTotal > 0 && !isNaN(data.percentage) ? `${data.percentage.toFixed(0)}%` : '-'}</RenderCell>
                            </td>
                        )}
                        {state.consolidatedSettings?.showRank && (
                            <td style={{ border: '1px solid #000' }}>
                                <RenderCell className="font-bold">{data.grandTotal > 0 ? data.rank : '-'}</RenderCell>
                            </td>
                        )}
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
                    {['GENERAL', 'OBC', 'SC', 'ST', 'OEC'].map(name => (
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
                    {['GENERAL', 'OBC', 'SC', 'ST', 'OEC'].map(name => {
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
    <div className="report-content-wrapper font-sans text-black h-full flex flex-col" style={{ fontFamily: '"Noto Sans", sans-serif' }}>
        {/* Premium Header Section */}
        <div className="school-header text-center mb-6 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
            <div className="pt-6 pb-2">
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', color: '#000', lineHeight: '1', marginBottom: '8px', fontFamily: '"Noto Serif", serif' }}>
                    {state.schoolDetails?.name || 'SMART SCHOOL'}
                </h1>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '20px', fontFamily: '"Noto Sans", sans-serif' }}>
                    {state.schoolDetails?.place || 'KERALA, INDIA'}
                </p>
            </div>

            {title && (
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 transform translate-x-1 translate-y-1 bg-black"></div>
                        <div style={{ padding: '8px 48px', border: '2px solid #000', backgroundColor: '#fff', color: '#000', fontWeight: 800, fontSize: '14px', letterSpacing: '0.15em', textTransform: 'uppercase', position: 'relative', minWidth: '320px', fontFamily: '"Noto Sans", sans-serif' }}>
                            {selectedExam?.name || 'EXAMINATION'} - {title}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Info Line - Grid Layout */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-[11px] font-bold uppercase tracking-wider text-black border-y-2 border-black py-2 bg-slate-50">
            <div className="text-left pl-2">Class: <span className="text-black font-black text-sm ml-1">{selectedClass?.name} - {selectedClass?.section}</span></div>
            <div className="text-center">Academic Year: <span className="font-black text-sm ml-1">{academicYear}</span></div>
            <div className="text-right pr-2">Date: <span className="font-black ml-1">{new Date().toLocaleDateString()}</span></div>
        </div>

        {/* Content Area */}
        <div className="report-body overflow-visible flex-1">
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
            <table className="text-[10px] border-collapse" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%', fontFamily: '"Noto Sans", sans-serif' }}>
                <colgroup>
                    <col style={{ width: '40px' }} />
                    <col style={{ width: 'auto' }} />
                    {grades.map((_: any, i: number) => (
                        <React.Fragment key={i}>
                            <col style={{ width: '25px' }} />
                            <col style={{ width: '25px' }} />
                        </React.Fragment>
                    ))}
                    <col style={{ width: '30px' }} />
                    <col style={{ width: '30px' }} />
                </colgroup>
                <thead>
                    <tr style={{ backgroundColor: '#fcfcfc', WebkitPrintColorAdjust: 'exact', color: '#000', height: '42px' }}>
                        <th style={{ border: '1.5px solid #000', padding: '0px' }} rowSpan={2}>
                            <RenderCell className="uppercase font-black text-[10px]">Sl</RenderCell>
                        </th>
                        <th style={{ border: '1.5px solid #000', padding: '0px' }} rowSpan={2}>
                            <RenderCell className="text-left px-3 uppercase font-black tracking-tight text-[11px]">Subject Name</RenderCell>
                        </th>
                        {grades.map((g: string) => (
                            <th key={g} style={{ border: '1.5px solid #000', borderBottom: '1px solid #000', padding: '0px' }} colSpan={2}>
                                <RenderCell className="uppercase font-black text-[10px]">{g}</RenderCell>
                            </th>
                        ))}
                        <th style={{ border: '1.5px solid #000', borderBottom: '1px solid #000', backgroundColor: '#f1f5f9', padding: '0px' }} colSpan={2}>
                            <RenderCell className="uppercase font-black text-[10px]">Total</RenderCell>
                        </th>
                    </tr>
                    <tr style={{ backgroundColor: '#fcfcfc', WebkitPrintColorAdjust: 'exact', color: '#000', height: '28px' }}>
                        {[...grades, 'T'].map((g: string, i: number) => (
                            <React.Fragment key={i}>
                                <th style={{ border: '1px solid #000', borderTop: '0px', padding: '0px' }}>
                                    <RenderCell className="text-[8px] uppercase font-black">B</RenderCell>
                                </th>
                                <th style={{ border: '1px solid #000', borderTop: '0px', padding: '0px' }}>
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
    // User Request: Show all classes I teach (Form Class OR Subject Class)
    const allClasses = [...myFormClasses, ...mySubjectClasses];
    // Remove duplicates based on ID
    const myClasses = Array.from(new Map(allClasses.map(c => [c.id, c])).values());

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

    // Consolidated Report Settings
    const [consolidatedSettings, setConsolidatedSettings] = useState(() => {
        const saved = localStorage.getItem('consolidated_report_settings');
        return saved ? JSON.parse(saved) : {
            showTotal: true, showPercentage: true, showGrade: true, showRank: true
        };
    });

    // Progress Card Settings
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('report_settings');
        return saved ? JSON.parse(saved) : {
            showTe: true, showCe: true, showTotal: true, showPercentage: true, showGrade: true
        };
    });

    useEffect(() => {
        localStorage.setItem('consolidated_report_settings', JSON.stringify(consolidatedSettings));
    }, [consolidatedSettings]);

    useEffect(() => {
        localStorage.setItem('report_settings', JSON.stringify(settings));
    }, [settings]);

    const toggleConsolidatedSetting = (key: keyof typeof consolidatedSettings) => {
        setConsolidatedSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
    };

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

        // Hardcoded Logic for Class 5-8 and 9-10
        let level = 0;
        if (selectedClass && selectedClass.gradeLevel) {
            // Extract number from grade string (e.g. "8", "Class 8", "VIII")
            // Simple parsing to get the first number
            const match = String(selectedClass.gradeLevel).match(/\d+/);
            if (match) {
                level = parseInt(match[0], 10);
            }
        }

        // Scheme for 9 and 10
        // A+: 90-100, A: 80-89, B+: 70-79, B: 60-69, C+: 50-59, C: 40-49, D+: 30-39, D: 20-29, E: <20
        if (level === 9 || level === 10) {
            if (percent >= 90) return 'A+';
            if (percent >= 80) return 'A';
            if (percent >= 70) return 'B+';
            if (percent >= 60) return 'B';
            if (percent >= 50) return 'C+';
            if (percent >= 40) return 'C';
            if (percent >= 30) return 'D+';
            if (percent >= 20) return 'D';
            return 'E';
        }

        // Scheme for 5 to 8
        // A: >=80, B: 60-79, C: 40-59, D: 30-39, E: <30
        if (level >= 5 && level <= 8) {
            if (percent >= 80) return 'A';
            if (percent >= 60) return 'B';
            if (percent >= 40) return 'C';
            if (percent >= 30) return 'D';
            return 'E';
        }

        // Fallback to existing logic
        if (!applicableScheme || sortedBoundaries.length === 0) return '-';
        const boundary = sortedBoundaries.find((b: any) => percent >= b.minPercent);
        return boundary ? boundary.grade : 'F';
    }, [applicableScheme, sortedBoundaries, selectedClass]);

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
                    4: { obt: 0, max: 0 },
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
        const categories = ['General', 'OBC', 'OEC', 'SC', 'ST'];
        const categoryStats = categories.map(cat => ({
            name: cat,
            boys: students.filter(s => s.category === cat && s.gender === 'Male').length,
            girls: students.filter(s => s.category === cat && s.gender === 'Female').length,
            total: students.filter(s => s.category === cat).length
        }));

        // Academic Year
        const academicYear = getAcademicYear();

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

            // padding: 15mm 15mm 25mm 15mm from JSX
            const pagePaddingVPx = (15 + 25) * pxPerMm;
            const usableHeightPx = totalPageHeightPx - pagePaddingVPx;

            const firstPageOverhead = (measureEl.querySelector('.first-page-overhead') as HTMLElement)?.offsetHeight || 0;
            const subsequentPageOverhead = (measureEl.querySelector('.subsequent-page-overhead') as HTMLElement)?.offsetHeight || 0;

            const pages: any[][] = [];
            let currentPage: any[] = [];
            let currentHeight = firstPageOverhead;

            reportData.students.forEach((studentData, index) => {
                const rowHeight = rows[index] ? rows[index].offsetHeight : 40;

                if (currentHeight + rowHeight > usableHeightPx - 50) { // 50px buffer for safety
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

        const timer = setTimeout(runPagination, 300);
        return () => clearTimeout(timer);
    }, [dataKey, orientation, viewMode, consolidatedDisplayMode, selectedExamId, consolidatedSettings]);

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
                            selectedExam={selectedExam} state={{ ...state, consolidatedSettings }} orientation={orientation} displayMode={consolidatedDisplayMode}
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
                            selectedExam={selectedExam} state={{ ...state, consolidatedSettings }} orientation={orientation} displayMode={consolidatedDisplayMode}
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

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        if (!selectedExamId) return;
        setIsGeneratingPdf(true);

        // tiny delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const elementId = viewMode === 'consolidated' ? 'consolidated-report-view' : 'progress-cards-view';
            const element = document.getElementById(elementId);

            if (!element) {
                throw new Error("Report element not found");
            }

            // Determine orientation and format
            const isLandscape = orientation === 'landscape' && viewMode === 'consolidated';
            const pdf = new jsPDF({
                orientation: isLandscape ? 'l' : 'p',
                unit: 'mm',
                format: 'a4'
            });

            const pageSelector = viewMode === 'consolidated' ? '.consolidated-page' : '.progress-card-item';
            const pages = element.querySelectorAll(pageSelector);

            if (!pages || pages.length === 0) {
                throw new Error("No pages found to process");
            }

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i] as HTMLElement;

                // TEMP FIX: Remove or replace unsupported modern CSS that breaks html2canvas
                // Specifically 'oklch' which is used by some modern libraries or Tailwind plugins.
                // We'll traverse the clone (internal to html2canvas ideally, but we can't easily hook that).
                // Instead, we trust html2canvas options "ignoreElements" or we pre-process styling? 
                // Hard to pre-process efficiently.
                // BETTER: We will wrap the PDF generation in a style override that forces simplified colors.
                // But since that requires DOM manipulation, let's just try to be safe.

                const canvas = await html2canvas(page, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowWidth: page.offsetWidth, // Use offsetWidth for accurate sizing
                    windowHeight: page.offsetHeight,
                    onclone: (clonedDoc) => {
                        // Patch for oklch error: Find elements with oklch and replace? 
                        // It's usually in computed styles. 
                        // Easiest fix: Override global styles in the clone to use standard colors if possible.
                        // Actually, the error might be coming from specific elements.
                        // Let's force a basic style cleanup on the clone.
                        const allElements = clonedDoc.querySelectorAll('*');
                        allElements.forEach((el: any) => {
                            if (el.style) {
                                // If any legacy or modern color function is problematic, we could reset it.
                                // However, the error 'unsupported color function oklch' is specific.
                                // Ideally, we just ensure our CSS doesn't use it.
                            }
                        });
                    }
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                if (i > 0) {
                    pdf.addPage();
                }

                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }

            pdf.save(`${state.schoolDetails?.name || 'School'}_Report_${new Date().getTime()}.pdf`);

        } catch (error) {
            console.error("PDF Generation failed:", error);
            alert("PDF Generation encounted a style error. Opening Print Dialog instead (Use 'Save as PDF' option).");
            window.print();
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className={`reports-container space-y-6 max-w-[1200px] mx-auto pb-20 print:pb-0 print:max-w-none print:mx-0 print:space-y-0 px-4 sm:px-0 ${isGeneratingPdf ? 'generating-pdf' : ''}`}>
            <style>
                {`
                /* PDF Gen Overrides */
                .generating-pdf .consolidated-page,
                .generating-pdf .progress-card-item {
                    box-shadow: none !important;
                    border: none !important;
                    margin: 0 !important; /* Reset margins for PDF capture */
                }
                
                @media print {
                    @page {
                        size: A4;
                        margin: ${viewMode === 'progress_card' ? '15mm' : '0'};
                    }
                    
                    /* Reset Body */
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* 
                       CRITICAL: Ensure the application root and layout wrappers 
                       are VISIBLE and allow content to flow. 
                       Do NOT hide #root or body children globally.
                    */
                    body, #root, main, .reports-container {
                        visibility: visible !important;
                        height: auto !important;
                        min-height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                        display: block !important;
                    }

                    /* Hide specific sibling elements in reports-container that might interfere */
                    .reports-container > div:not(.print-container) {
                        display: none !important;
                    }

                    /* Show the Print Container */
                    .print-container {
                        display: block !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        z-index: 9999;
                    }

                    /* Reset internal scroll containers to strictly show content */
                    #consolidated-report-view,
                    #progress-cards-view,
                    .overflow-x-auto,
                    .overflow-y-auto {
                        overflow: visible !important;
                        height: auto !important;
                        border: none !important;
                        display: block !important;
                        position: static !important; /* Let flow naturally */
                    }

                    /* Consolidated Page Styling - STRICT Dimensions */
                    .consolidated-page {
                        width: 210mm;
                        height: 297mm;
                        page-break-after: always;
                        padding: 10mm !important;
                        margin: 0 auto;
                        box-shadow: none !important;
                        border: none !important;
                        position: relative;
                        background: white !important;
                        /* display: block !important; implied */
                    }

                    /* Landscape Override */
                    .consolidated-page[style*="width: 297mm"] {
                        width: 297mm !important;
                        height: 210mm !important;
                    }

                    /* Progress Card Styling with Named Page */
                    .progress-card-item {
                        /* page: progress-card-page; -- REMOVED */
                        width: 100% !important; /* Fit within margin */
                        min-height: auto !important; 
                        height: auto !important;
                        page-break-after: always;
                        padding: 0 !important; /* Handled by @page margin */
                        margin: 0 !important;
                        box-shadow: none !important;
                        background: white !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }

                    /* Typography */
                    * { 
                        font-family: 'Noto Sans', sans-serif !important;
                    }

                    /* Table Fixes */
                    table { border-collapse: collapse !important; width: 100% !important; border: 2px solid #000 !important; }
                    td, th { border: 1px solid #000 !important; padding: 2px !important; }

                    /* Hide UI Markers & Footer overlap prevention */
                    .print-area-tag, .print-area-indicator, .no-print { display: none !important; }
                    
                    /* Footer Positioning */
                    .report-footer {
                        position: absolute !important;
                        bottom: 12mm !important;
                        left: 10mm !important;
                        right: 10mm !important;
                    }
                }
`}
            </style>

            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <div className="px-2">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Academic Analysis</p>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownloadPdf}
                        disabled={!selectedExamId || isGeneratingPdf}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 text-white font-black rounded-xl shadow-xl transition-all ${isGeneratingPdf ? 'bg-slate-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-100'}`}
                    >
                        {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        <span className="text-xs uppercase tracking-widest">{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={!selectedExamId}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-black rounded-xl shadow-xl hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Printer size={16} />
                        <span className="text-xs uppercase tracking-widest">Print</span>
                    </button>
                </div>
            </div>

            <div className="native-card !p-4 space-y-4 print:hidden no-print">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Class</label>
                        {primaryClass ? (
                            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-xs text-slate-700">
                                {primaryClass.name} - {primaryClass.section}
                            </div>
                        ) : (
                            <select
                                value={selectedClassId}
                                onChange={(e) => { setSelectedClassId(e.target.value); setSelectedExamId(''); }}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="">Choose Class</option>
                                {myClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                            </select>
                        )}
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Exam</label>
                        <select
                            value={selectedExamId}
                            onChange={(e) => setSelectedExamId(e.target.value)}
                            disabled={!selectedClassId}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 appearance-none disabled:opacity-50"
                        >
                            <option value="">Choose Exam</option>
                            {examsForClass.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Report Type</label>
                        <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-100">
                            <button onClick={() => setViewMode('consolidated')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'consolidated' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Mark Sheet</button>
                            <button onClick={() => setViewMode('progress_card')} className={`flex-1 py-2 px-4 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'progress_card' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Progress Card</button>
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-50">
                    <div className="flex flex-wrap gap-2">
                        {viewMode === 'consolidated' ? (
                            <>
                                <div className="flex flex-wrap gap-2 items-center mr-4">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-2">Display:</span>
                                    {['marks', 'grade', 'both'].map((mode) => (
                                        <button key={mode} onClick={() => setConsolidatedDisplayMode(mode as any)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${consolidatedDisplayMode === mode ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white border-slate-100 text-slate-400'}`}>{mode === 'both' ? 'Marks & Grade' : mode}</button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-2">Columns:</span>
                                    {[{ key: 'showTotal', label: 'Total' }, { key: 'showPercentage', label: '%' }, { key: 'showGrade', label: 'Grade' }, { key: 'showRank', label: 'Rank' }].map((opt) => (
                                        <button key={opt.key} onClick={() => toggleConsolidatedSetting(opt.key as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${consolidatedSettings[opt.key as keyof typeof consolidatedSettings] ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-white border-slate-100 text-slate-400'}`}>
                                            {consolidatedSettings[opt.key as keyof typeof consolidatedSettings] ? <CheckSquare size={12} /> : <Square size={12} />} {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            [{ key: 'showTe', label: 'TE' }, { key: 'showCe', label: 'CE' }, { key: 'showTotal', label: 'Total' }, { key: 'showGrade', label: 'Grade' }].map((opt) => (
                                <button key={opt.key} onClick={() => toggleSetting(opt.key as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${settings[opt.key as keyof typeof settings] ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white border-slate-100 text-slate-400'}`}>
                                    {settings[opt.key as keyof typeof settings] ? <CheckSquare size={12} /> : <Square size={12} />} {opt.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {selectedExamId ? (
                <div className="print-container print:block">
                    {viewMode === 'consolidated' && (
                        <div id="consolidated-report-view" className="flex flex-col items-center py-10 bg-slate-50/50 rounded-3xl print:p-0 print:bg-white print:block border-2 border-slate-200 border-dashed relative print:border-0">
                            <div className="print-area-indicator print:hidden absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 z-10 transition-transform active:scale-95">
                                <Award size={12} className="animate-bounce" />
                                MARK SHEET PREVIEW
                            </div>

                            <div className="print-area-tag mb-4 bg-slate-900 border-2 border-slate-900 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 no-print">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                PRINT AREA START
                            </div>

                            <div ref={measureRef} className="fixed pointer-events-none -z-50" style={{ width: orientation === 'landscape' ? '297mm' : '210mm', top: '-10000px', left: '-10000px', visibility: 'hidden' }}>
                                <div className="first-page-overhead">
                                    <ReportPageContent title="CONSOLIDATED RESULT SHEET" selectedExam={selectedExam} selectedClass={selectedClass} state={state} classTeacher={classTeacher} academicYear={reportData.summary.academicYear}>
                                        <OverallStatsTable summary={reportData.summary} selectedClass={selectedClass} classTeacher={classTeacher} />
                                        <CategoryStatsTable categoryStats={reportData.summary.categoryStats} />
                                        <h3 className="text-[10px] font-black uppercase text-slate-400 mb-2 border-b">STUDENT RECORDS</h3>
                                    </ReportPageContent>
                                </div>
                                <div className="subsequent-page-overhead">
                                    <ReportPageContent title="CONSOLIDATED RESULT SHEET" selectedExam={selectedExam} selectedClass={selectedClass} state={state} classTeacher={classTeacher} academicYear={reportData.summary.academicYear} />
                                </div>
                                <div className="rows-measure">
                                    <StudentMarksTable
                                        students={reportData.students}
                                        startIndex={0}
                                        selectedExam={selectedExam} state={{ ...state, consolidatedSettings }} orientation={orientation} displayMode={consolidatedDisplayMode}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-10 items-center w-full print:gap-0 print:block overflow-x-auto custom-scrollbar">
                                <div className="min-w-max sm:min-w-0 flex flex-col items-center w-full">
                                    {pagesList}
                                </div>
                            </div>

                            <div className="print-area-tag mt-10 bg-slate-900 border-2 border-slate-900 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 no-print">
                                <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                                PRINT AREA END
                            </div>
                        </div>
                    )}

                    {viewMode === 'progress_card' && (
                        <div className="space-y-6 progress-card-container">
                            <div className="flex justify-end print:hidden no-print px-2">
                                <div className="space-y-1 w-full sm:w-64">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Student</label>
                                    <select
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-xs outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none"
                                        value={selectedStudentId}
                                        onChange={(e) => setSelectedStudentId(e.target.value)}
                                    >
                                        <option value="all">Whole Class (Print All)</option>
                                        {reportData.students.map((d: any) => (
                                            <option key={d.student.id} value={d.student.id}>{d.student.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div id="progress-cards-view" className="flex flex-col items-center py-10 bg-slate-50/50 rounded-3xl print:p-0 print:bg-white print:block border-2 border-slate-200 border-dashed relative print:border-0">
                                <div className="print-area-indicator print:hidden absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 z-10 transition-transform active:scale-95">
                                    <Award size={12} className="animate-bounce" />
                                    PROGRESS CARD PREVIEW
                                </div>

                                <div className="print-area-tag mb-8 bg-slate-900 border-2 border-slate-900 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 no-print">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                    PRINT AREA START
                                </div>

                                <div className="flex flex-wrap justify-center gap-8 print:gap-0 print:block w-full px-4 sm:px-0">
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

                                <div className="print-area-tag mt-10 bg-slate-900 border-2 border-slate-900 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 no-print">
                                    <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                                    PRINT AREA END
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            ) : (
                <div className="py-20 text-center animate-fade-scale">
                    <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-blue-600 border border-blue-100">
                        <Award size={28} />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Awaiting Selection</p>
                    <p className="text-slate-500 font-bold text-sm mt-1">Select class and exam to generate reports</p>
                </div>
            )
            }
        </div >
    );
};

export default Reports;
