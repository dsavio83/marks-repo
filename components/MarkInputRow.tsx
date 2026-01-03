
import React, { useRef } from 'react';
import { ClipboardList } from 'lucide-react';

interface MarkInputRowProps {
  student: any;
  teMark?: string | number;
  ceMark?: string | number;
  attendance?: string;
  teEnabled: boolean;
  ceEnabled: boolean;
  maxTeMarks: number;
  maxCeMarks: number;
  onUpdate: (id: string, type: 'te' | 'ce' | 'att', val: string) => void;
  onDetailedEntry: (studentId: string) => void;
  hasMarkSections: boolean;
  isLocked?: boolean;
}

const MarkInputRow: React.FC<MarkInputRowProps> = React.memo(({
  student, teMark, ceMark, attendance, teEnabled, ceEnabled, maxTeMarks, maxCeMarks, onUpdate, onDetailedEntry, hasMarkSections, isLocked
}) => {
  const teRef = useRef<HTMLInputElement>(null);
  const ceRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'te' | 'ce' | 'att') => {
    if (isLocked) return;
    // Uppercase for 'A' (Absent)
    const val = e.target.value.toUpperCase();

    // Allow digits, or 'A' (attendance allows digits only)
    if (type === 'att') {
      if (val !== '' && !/^[0-9]+$/.test(val)) return;
    } else {
      if (val !== '' && !/^[0-9]+$/.test(val) && val !== 'A') return;
    }

    onUpdate(student.id, type, val);

    // Auto-jump logic
    const numVal = parseInt(val, 10);
    const isAtt = type === 'att';

    const shouldJump =
      val === 'A' ||
      (val.length >= 2 && numVal >= 10) || // If 2 digits and >= 10
      (!isNaN(numVal) && numVal > 9) ||
      (!isAtt && maxTeMarks < 10 && val.length >= 1); // For marks with low max

    if (shouldJump) {
      if (type === 'att') {
        const nextSelector = teEnabled ? `input[name="te"]` : (ceEnabled ? `input[name="ce"]` : null);
        if (nextSelector) {
          const row = e.target.closest('tr');
          const nextInput = row?.querySelector(nextSelector) as HTMLInputElement;
          if (nextInput) {
            nextInput.focus();
            setTimeout(() => nextInput.select(), 0);
          }
        }
      } else if (type === 'te' && ceEnabled && ceRef.current) {
        ceRef.current.focus();
        setTimeout(() => ceRef.current?.select(), 0);
      } else {
        const row = e.target.closest('tr');
        const nextRow = row?.nextElementSibling as HTMLElement;
        const nextSelector = teEnabled ? `input[name="te"]` : (ceEnabled ? `input[name="ce"]` : null);

        if (nextSelector) {
          const nextInput = nextRow?.querySelector(nextSelector) as HTMLInputElement;
          if (nextInput) {
            nextInput.focus();
            setTimeout(() => nextInput.select(), 0);
          }
        }
      }
    }
  };

  const parse = (v: string | number | undefined) => {
    if (v === 'A' || v === '' || v === undefined) return 0;
    return typeof v === 'string' ? parseFloat(v) || 0 : v;
  };

  const teVal = parse(teMark);
  const ceVal = parse(ceMark);

  // Total logic: Only sum enabled columns
  const total = (teEnabled ? teVal : 0) + (ceEnabled ? ceVal : 0);
  const maxTotal = (teEnabled ? maxTeMarks : 0) + (ceEnabled ? maxCeMarks : 0);

  const isTeInvalid = teVal > maxTeMarks;
  const isCeInvalid = ceVal > maxCeMarks;
  const isRowInvalid = (teEnabled && isTeInvalid) || (ceEnabled && isCeInvalid);

  const getInputStyle = (val: string | number | undefined, max: number) => {
    if (val === 'A') return 'text-red-600 bg-red-50 border-red-200 font-black';
    if (val === '0' || val === 0) return 'text-slate-600 bg-slate-100 border-slate-200';
    return 'text-slate-700 border-slate-200 focus:border-blue-500';
  };

  return (
    <div className={`native-card !p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${isRowInvalid ? 'bg-red-50/30 border-red-100' : ''}`}>
      <div className="flex items-center space-x-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${student.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
          {student.name.charAt(0)}
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center">
            <p className="font-bold text-slate-800 text-sm truncate">{student.name}</p>
            {isLocked && <span className="ml-2 px-1 py-0.5 bg-amber-100 text-amber-600 text-[7px] font-black rounded uppercase">Locked</span>}
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">#{student.admissionNo} • {student.gender}</p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 flex-1">
        <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
          {/* Attendance */}
          <div className="flex flex-col items-center">
            <span className="text-[7px] font-black text-purple-400 uppercase mb-0.5 tracking-widest">Att %</span>
            <input
              type="text"
              name="att"
              maxLength={3}
              value={attendance ?? ''}
              onChange={(e) => handleInputChange(e, 'att')}
              disabled={isLocked}
              className="w-12 py-2 border border-slate-100 bg-slate-50 text-purple-700 rounded-lg text-center font-bold text-xs outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="%"
            />
          </div>

          <div className="w-px h-6 bg-slate-100 mx-0.5"></div>

          {/* TE Mark */}
          {teEnabled && (
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">TE Mark</span>
              <input
                ref={teRef}
                name="te"
                type="text"
                maxLength={4}
                value={teMark ?? ''}
                onChange={(e) => handleInputChange(e, 'te')}
                disabled={isLocked && !hasMarkSections}
                className={`w-14 py-2 border ${isTeInvalid ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-100 bg-slate-50'} rounded-lg text-center font-black text-xs outline-none focus:ring-2 focus:ring-blue-100`}
                placeholder={`/${maxTeMarks}`}
              />
            </div>
          )}

          {/* CE Mark */}
          {ceEnabled && (
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">CE Mark</span>
              <input
                ref={ceRef}
                name="ce"
                type="text"
                maxLength={4}
                value={ceMark ?? ''}
                onChange={(e) => handleInputChange(e, 'ce')}
                disabled={isLocked}
                className={`w-14 py-2 border ${isCeInvalid ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-100 bg-slate-50'} rounded-lg text-center font-black text-xs outline-none focus:ring-2 focus:ring-blue-100`}
                placeholder={`/${maxCeMarks}`}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col items-end min-w-[50px]">
          <span className="text-[7px] font-black text-slate-400 uppercase mb-1 tracking-widest">Total</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black ${total >= (maxTotal) * 0.35 ? 'text-emerald-600' : 'text-red-600'}`}>
              {total}<span className="text-[10px] text-slate-300 font-normal">/</span>{maxTotal}
            </span>
            {hasMarkSections && (
              <button
                onClick={() => onDetailedEntry(student.id)}
                className="w-7 h-7 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                title="Detailed Entry"
              >
                <ClipboardList size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

});

export default MarkInputRow;
