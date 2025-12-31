
import React, { useRef } from 'react';

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
    <tr className={`hover:bg-slate-50 transition-colors border-b border-slate-100 ${isRowInvalid ? 'bg-red-50/30' : ''}`}>
      <td className="px-6 py-4 align-top">
        <div className="flex items-center mt-2">
          <div className="text-sm font-bold text-slate-900">{student.name}</div>
          <div className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-tighter">#{student.admissionNo}</div>
          {isLocked && (
            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded uppercase">Locked</span>
          )}
        </div>
      </td>

      <td className="px-6 py-3 align-top text-center">
        <div className="relative inline-block">
          <input
            type="text"
            name="att"
            maxLength={3}
            value={attendance ?? ''}
            onChange={(e) => handleInputChange(e, 'att')}
            disabled={isLocked}
            className="w-16 px-2 py-2.5 border border-slate-200 bg-purple-50/50 text-purple-700 rounded-xl text-center font-bold outline-none focus:ring-2 focus:ring-purple-200 transition-all shadow-sm disabled:opacity-50"
            placeholder="%"
          />
        </div>
      </td>

      {teEnabled && (
        <td className="px-6 py-3 align-top text-center">
          <div className="relative inline-block">
            <input
              ref={teRef}
              name="te"
              type="text"
              maxLength={4}
              value={teMark ?? ''}
              onChange={(e) => handleInputChange(e, 'te')}
              disabled={isLocked && !hasMarkSections} // Allow clicking if has sections? No, let's keep it disabled if locked.
              className={`w-24 px-3 py-2.5 border ${isTeInvalid ? 'border-red-500 bg-red-50 text-red-600 focus:ring-red-200' : getInputStyle(teMark, maxTeMarks)} rounded-xl text-center font-black outline-none transition-all shadow-sm disabled:opacity-50`}
              placeholder={`Max ${maxTeMarks}`}
            />
          </div>
        </td>
      )}

      {ceEnabled && (
        <td className="px-6 py-3 align-top text-center">
          <div className="relative inline-block">
            <input
              ref={ceRef}
              name="ce"
              type="text"
              maxLength={4}
              value={ceMark ?? ''}
              onChange={(e) => handleInputChange(e, 'ce')}
              disabled={isLocked}
              className={`w-24 px-3 py-2.5 border ${isCeInvalid ? 'border-red-500 bg-red-50 text-red-600 focus:ring-red-200' : getInputStyle(ceMark, maxCeMarks)} rounded-xl text-center font-black outline-none transition-all shadow-sm disabled:opacity-50`}
              placeholder={`Max ${maxCeMarks}`}
            />
          </div>
        </td>
      )}

      <td className="px-6 py-4 text-right align-top">
        <div className="flex flex-col items-end gap-2">
          {maxTotal > 0 ? (
            <span className={`inline-block px-4 py-1 mt-1 rounded-lg font-black text-sm ${total >= (maxTotal) * 0.35 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
              {total} <span className="text-[9px] text-slate-400 font-normal">/ {maxTotal}</span>
            </span>
          ) : (
            <span className="text-slate-300">-</span>
          )}

          {hasMarkSections && (
            <button
              onClick={() => onDetailedEntry(student.id)}
              className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
            >
              Detailed
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

export default MarkInputRow;
