import { useState, useMemo } from 'react';
import {
  Download,
  User,
  BookOpen,
  Star,
  BookMarked,
  Layers,
  AlertCircle,
  Calendar,
  Hash,
  ChevronRight,
  X,
  Search,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

// ─── Grade → Grade Point ────────────────────────────────────────────────────
const GRADE_POINTS: Record<string, number> = {
  S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0,
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface SubjectRecord {
  code: string;
  grade: string;
  credits: number;
  result: string;
  type: 'CORE' | 'ELECTIVE' | string;
}

export interface CCMStudent {
  regNo: string | number;
  name: string;
  dept: string;
  dob: string;
  subjects: SubjectRecord[];
  cgpa: number;
  maxCredits: number;       // dept standard: CSE=192, others=164
  totalCredits: number;     // sum from file
  earnedCredits: number;
  coreCredits: number;
  electiveCredits: number;
  coreSubjects: number;
  electiveSubjects: number;
  passCount: number;
  failCount: number;
}

interface CCMResultsProps {
  students: CCMStudent[];
  searchQuery: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function cgpaColor(cgpa: number) {
  if (cgpa >= 8.5) return 'text-purple-600';
  if (cgpa >= 7.5) return 'text-teal-600';
  if (cgpa >= 6.5) return 'text-blue-600';
  if (cgpa >= 5)   return 'text-amber-600';
  return 'text-red-600';
}
function cgpaBarColor(cgpa: number) {
  if (cgpa >= 8.5) return 'bg-purple-500';
  if (cgpa >= 7.5) return 'bg-teal-500';
  if (cgpa >= 6.5) return 'bg-blue-500';
  if (cgpa >= 5)   return 'bg-amber-500';
  return 'bg-red-400';
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    S: 'bg-purple-100 text-purple-700 border-purple-300',
    A: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    B: 'bg-teal-100 text-teal-700 border-teal-300',
    C: 'bg-blue-100 text-blue-700 border-blue-300',
    D: 'bg-amber-100 text-amber-700 border-amber-300',
    E: 'bg-orange-100 text-orange-700 border-orange-300',
    F: 'bg-red-100 text-red-700 border-red-300',
  };
  const cls = colors[grade?.toUpperCase()] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${cls}`}>
      {grade || '—'}
    </span>
  );
}

function CGPARing({ cgpa }: { cgpa: number }) {
  const r = 30, circ = 2 * Math.PI * r;
  const offset = circ - (cgpa / 10) * circ;
  const color = cgpa >= 8.5 ? '#9333ea' : cgpa >= 7.5 ? '#0d9488' : cgpa >= 6.5 ? '#3b82f6' : cgpa >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg width="80" height="80" className="-rotate-90 absolute inset-0">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-base font-black" style={{ color }}>{cgpa.toFixed(2)}</span>
        <span className="text-[9px] text-slate-400 font-semibold leading-none">/10</span>
      </div>
    </div>
  );
}

// ─── Student Detail Panel ─────────────────────────────────────────────────────
function StudentDetailPanel({ student, onClose }: { student: CCMStudent; onClose: () => void }) {
  const [subjectSearch, setSubjectSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'core' | 'elective' | 'all'>('all');

  const ccColor = cgpaColor(student.cgpa);

  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.toLowerCase();
    return student.subjects.filter(s => {
      const matchTab = activeTab === 'all' || s.type === activeTab.toUpperCase();
      const matchSearch = !q || s.code.toLowerCase().includes(q) || s.grade.toLowerCase().includes(q) || s.result.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [student.subjects, subjectSearch, activeTab]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Student Details</p>
            <h2 className="text-lg font-bold text-white leading-tight truncate">{student.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap gap-2 text-xs mb-4">
          <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
            <Hash className="w-3 h-3 text-teal-400" />
            <span className="font-mono font-semibold">{student.regNo}</span>
          </span>
          <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
            <Calendar className="w-3 h-3 text-blue-400" />
            DOB: <span className="font-semibold">{student.dob || '—'}</span>
          </span>
          <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
            <User className="w-3 h-3 text-purple-400" />
            <span className="font-semibold">{student.dept}</span>
          </span>
        </div>

        {/* CGPA + stats row */}
        <div className="flex items-center gap-5">
          <CGPARing cgpa={student.cgpa} />
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 flex-1">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Credits Earned</p>
              <p className="text-base font-bold text-white">{student.earnedCredits}
                <span className="text-slate-400 font-normal text-xs ml-1">/ {student.maxCredits}</span>
              </p>
              <div className="mt-1 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 rounded-full" style={{ width: `${Math.min((student.earnedCredits / student.maxCredits) * 100, 100)}%` }} />
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">CGPA</p>
              <p className={`text-base font-bold ${ccColor}`}>{student.cgpa.toFixed(2)} / 10</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Pass / Fail</p>
              <p className="text-base font-bold">
                <span className="text-emerald-400">{student.passCount}</span>
                <span className="text-slate-500 mx-1">/</span>
                <span className="text-red-400">{student.failCount}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-rose-400 uppercase font-semibold">Elective Credits</p>
              <p className="text-base font-bold text-rose-300">{student.electiveCredits}
                <span className="text-rose-500 font-normal text-xs ml-1">({student.electiveSubjects} subj)</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-100 flex flex-col gap-2">
        <div className="flex gap-1">
          {(['all', 'core', 'elective'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab
                  ? tab === 'core' ? 'bg-indigo-100 text-indigo-700'
                    : tab === 'elective' ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {tab === 'all' ? `All (${student.subjects.length})` : tab === 'core' ? `Core (${student.coreSubjects})` : `Elective (${student.electiveSubjects})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            className="flex-1 text-xs bg-transparent outline-none text-slate-700 placeholder-slate-400"
            placeholder="Search subject code, grade, result…"
            value={subjectSearch}
            onChange={e => setSubjectSearch(e.target.value)}
          />
          {subjectSearch && (
            <button onClick={() => setSubjectSearch('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Subject table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-slate-600 font-semibold">Code</th>
              <th className="px-3 py-2 text-center text-slate-600 font-semibold">Type</th>
              <th className="px-3 py-2 text-center text-slate-600 font-semibold">Grade</th>
              <th className="px-3 py-2 text-center text-slate-600 font-semibold">Points</th>
              <th className="px-3 py-2 text-center text-slate-600 font-semibold">Credits</th>
              <th className="px-3 py-2 text-center text-slate-600 font-semibold">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredSubjects.map((s, i) => (
              <tr
                key={i}
                className={`hover:bg-slate-50 transition-colors ${s.type === 'ELECTIVE' ? 'bg-rose-50/30' : s.type === 'CORE' ? 'bg-indigo-50/20' : ''}`}
              >
                <td className="px-4 py-2 font-mono font-bold text-slate-800">{s.code}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    s.type === 'CORE' ? 'bg-indigo-100 text-indigo-700' :
                    s.type === 'ELECTIVE' ? 'bg-rose-100 text-rose-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {s.type || '—'}
                  </span>
                </td>
                <td className="px-3 py-2 text-center"><GradeBadge grade={s.grade} /></td>
                <td className="px-3 py-2 text-center font-semibold text-slate-700">
                  {GRADE_POINTS[s.grade?.toUpperCase()] ?? '—'}
                </td>
                <td className="px-3 py-2 text-center font-semibold text-slate-700">{s.credits}</td>
                <td className="px-3 py-2 text-center">
                  {s.result === 'PASS' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                      <CheckCircle2 className="w-2.5 h-2.5" /> PASS
                    </span>
                  ) : s.result === 'FAIL' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold text-[10px]">
                      <XCircle className="w-2.5 h-2.5" /> FAIL
                    </span>
                  ) : (
                    <span className="text-slate-400">{s.result || '—'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSubjects.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p className="text-xs">No subjects match your filter</p>
          </div>
        )}
      </div>

      {/* Grade scale footer */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-2 items-center">
        <span className="text-[10px] text-slate-400 font-semibold mr-1">GRADE SCALE:</span>
        {Object.entries(GRADE_POINTS).map(([g, p]) => (
          <div key={g} className="flex items-center gap-0.5">
            <GradeBadge grade={g} />
            <span className="text-[10px] text-slate-400">={p}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main CCMResults ──────────────────────────────────────────────────────────
export function CCMResults({ students, searchQuery }: CCMResultsProps) {
  const [selectedStudent, setSelectedStudent] = useState<CCMStudent | null>(null);
  const [sortBy, setSortBy] = useState<'regNo' | 'cgpa' | 'credits'>('regNo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      !q ||
      s.regNo.toString().toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.dept.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'cgpa') cmp = a.cgpa - b.cgpa;
      else if (sortBy === 'credits') cmp = a.earnedCredits - b.earnedCredits;
      else cmp = a.regNo.toString().localeCompare(b.regNo.toString());
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortBy, sortDir]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const avgCGPA = students.length ? students.reduce((s, st) => s + st.cgpa, 0) / students.length : 0;

  const downloadExcel = () => {
    const rows = students.map(s => ({
      'Reg No': s.regNo, 'Name': s.name, 'DOB': s.dob, 'Department': s.dept,
      'CGPA': s.cgpa.toFixed(2), 'Total Credits': s.totalCredits, 'Earned Credits': s.earnedCredits,
      'Core Credits': s.coreCredits, 'Core Subjects': s.coreSubjects,
      'Elective Credits': s.electiveCredits, 'Elective Subjects': s.electiveSubjects,
      'Pass Count': s.passCount, 'Fail Count': s.failCount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CCM Results');
    XLSX.writeFile(wb, 'CCM_CGPA_Results.xlsx');
  };

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No CCM Data Yet</h3>
        <p className="text-slate-500 max-w-sm mx-auto text-sm">
          Upload a CCM Result Excel file to calculate CGPA, credits and subject breakdowns per student.
        </p>
      </div>
    );
  }

  const SortBtn = ({ col, label }: { col: typeof sortBy; label: string }) => (
    <button
      onClick={() => toggleSort(col)}
      className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors whitespace-nowrap"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortBy === col ? 'text-teal-500' : 'text-slate-300'}`} />
      {sortBy === col && <span className="text-teal-500 text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Students', value: students.length, icon: User, ring: 'bg-teal-50 border-teal-100', ic: 'text-teal-600', val: 'text-slate-800' },
          { label: 'Avg CGPA', value: avgCGPA.toFixed(2), icon: Star, ring: 'bg-purple-50 border-purple-100', ic: 'text-purple-600', val: 'text-purple-700' },
          { label: 'Avg Core Cr.', value: students.length ? (students.reduce((s, st) => s + st.coreCredits, 0) / students.length).toFixed(0) : 0, icon: BookMarked, ring: 'bg-indigo-50 border-indigo-100', ic: 'text-indigo-600', val: 'text-indigo-700' },
          { label: 'Avg Elec. Cr.', value: students.length ? (students.reduce((s, st) => s + st.electiveCredits, 0) / students.length).toFixed(0) : 0, icon: Layers, ring: 'bg-rose-50 border-rose-100', ic: 'text-rose-600', val: 'text-rose-700' },
        ].map(({ label, value, icon: Icon, ring, ic, val }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${ring}`}>
              <Icon className={`w-5 h-5 ${ic}`} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{label}</p>
              <p className={`text-xl font-black ${val}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Two-Panel ── */}
      <div className={`grid gap-4 transition-all duration-300 ${selectedStudent ? 'grid-cols-1 lg:grid-cols-[1fr_420px]' : 'grid-cols-1'}`}>

        {/* LEFT: Student list table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Student CGPA List</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {sorted.length} of {students.length} students
                {searchQuery && <span className="text-teal-600 ml-1">· "{searchQuery}"</span>}
              </p>
            </div>
            <button
              onClick={downloadExcel}
              className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-semibold text-xs border border-teal-200 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                <tr>
                  <th className="px-4 py-3">
                    <SortBtn col="regNo" label="Reg No" />
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold">DOB</th>
                  <th className="px-4 py-3 text-xs font-semibold">Dept</th>
                  <th className="px-4 py-3">
                    <SortBtn col="cgpa" label="CGPA" />
                  </th>
                  <th className="px-4 py-3">
                    <SortBtn col="credits" label="Credits" />
                  </th>
                  <th className="px-4 py-3 text-center text-indigo-600 text-xs font-semibold">Core Cr.</th>
                  <th className="px-4 py-3 text-center text-rose-500 text-xs font-semibold">Elec. Cr.</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold">P/F</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sorted.map((student, idx) => {
                  const isSelected = selectedStudent?.regNo === student.regNo;
                  const rowColor = cgpaColor(student.cgpa);
                  const barColor = cgpaBarColor(student.cgpa);
                  return (
                    <tr
                      key={`${student.regNo}-${idx}`}
                      onClick={() => setSelectedStudent(isSelected ? null : student)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-teal-50 border-l-2 border-teal-500' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800 whitespace-nowrap">
                        {student.regNo}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-800 max-w-[180px]">
                        <div className="truncate">{student.name}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{student.dob || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-1.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded text-[10px] font-bold whitespace-nowrap">
                          {student.dept}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-[75px]">
                          <span className={`text-xs font-black ${rowColor}`}>{student.cgpa.toFixed(2)}</span>
                          <div className="mt-1 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`${barColor} h-full rounded-full`} style={{ width: `${(student.cgpa / 10) * 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                        {student.earnedCredits}
                        <span className="text-slate-400 font-normal">/{student.maxCredits}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-indigo-700">
                        {student.coreCredits}
                        <div className="text-[10px] text-slate-400 font-normal">{student.coreSubjects}s</div>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-rose-600">
                        {student.electiveCredits}
                        <div className="text-[10px] text-slate-400 font-normal">{student.electiveSubjects}s</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] font-semibold">
                          <span className="text-emerald-600">{student.passCount}P</span>
                          <span className="text-slate-300 mx-0.5">·</span>
                          <span className="text-red-500">{student.failCount}F</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${isSelected ? 'bg-teal-500' : 'bg-slate-100 hover:bg-teal-100'}`}>
                          <ChevronRight className={`w-3.5 h-3.5 transition-colors ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {sorted.length === 0 && (
              <div className="p-12 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm font-medium text-slate-700">No students found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms</p>
              </div>
            )}
          </div>

          {/* Hint when detail is hidden */}
          {!selectedStudent && students.length > 0 && (
            <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 text-center">
              Click any row to view full student details →
            </div>
          )}
        </div>

        {/* RIGHT: Detail Panel */}
        <AnimatePresence>
          {selectedStudent && (
            <div className="min-h-[500px] lg:min-h-0">
              <StudentDetailPanel
                student={selectedStudent}
                onClose={() => setSelectedStudent(null)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Parse CCM Excel ──────────────────────────────────────────────────────────
export function parseCCMFile(jsonData: any[]): CCMStudent[] {
  const gradePoint = (g: string): number => GRADE_POINTS[g?.toUpperCase()] ?? 0;
  const map = new Map<string, any>();

  const parseDOB = (rawDOB: any): string => {
    if (!rawDOB) return '';
    if (typeof rawDOB === 'number') {
      const d = XLSX.SSF.parse_date_code(rawDOB);
      return `${d.d.toString().padStart(2, '0')}/${d.m.toString().padStart(2, '0')}/${d.y}`;
    }
    if (rawDOB instanceof Date) {
      return `${rawDOB.getDate().toString().padStart(2, '0')}/${(rawDOB.getMonth() + 1).toString().padStart(2, '0')}/${rawDOB.getFullYear()}`;
    }
    return rawDOB.toString();
  };

  jsonData.forEach((row: any) => {
    const regNo = (row['RegNo'] || row['Reg No'] || row['HTNO'] || '').toString().trim();
    if (!regNo || regNo === 'RegNo') return;

    if (!map.has(regNo)) {
      map.set(regNo, {
        regNo,
        name: (row['StudentName'] || row['Name'] || row['Student Name'] || '').toString().trim(),
        dept: (row['dept'] || row['Dept'] || row['Department'] || row['Branch'] || '').toString().trim(),
        dob: parseDOB(row['DOB']),
        subjects: [],
      });
    }

    const entry = map.get(regNo)!;
    if (!entry.dept) entry.dept = (row['dept'] || row['Dept'] || row['Department'] || '').toString().trim();
    if (!entry.dob) entry.dob = parseDOB(row['DOB']);

    const code = (row['Code'] || row['Subject Code'] || '').toString().trim();
    const grade = (row['Grade'] || '').toString().trim().toUpperCase();
    const credits = parseFloat(row['Credits'] ?? row['Credit'] ?? 0) || 0;
    const result = (row['Result'] || '').toString().trim().toUpperCase();
    const type = (row['Helper-3'] || row['Type'] || '').toString().trim().toUpperCase();

    if (code) entry.subjects.push({ code, grade, credits, result, type });
  });

  const students: CCMStudent[] = [];

  map.forEach(entry => {
    const subjects: SubjectRecord[] = entry.subjects;
    let weightedSum = 0, creditSum = 0;
    let totalCredits = 0, earnedCredits = 0;
    let coreCredits = 0, electiveCredits = 0;
    let coreSubjects = 0, electiveSubjects = 0;
    let passCount = 0, failCount = 0;

    subjects.forEach(s => {
      const gp = gradePoint(s.grade);
      const cr = s.credits;
      totalCredits += cr;

      if (s.result === 'PASS' || gp > 0) {
        earnedCredits += cr;
        if (cr > 0) { weightedSum += gp * cr; creditSum += cr; }
      }

      if (s.type === 'CORE') {
        coreSubjects++;
        if (s.result === 'PASS' || gp > 0) coreCredits += cr;
      } else if (s.type === 'ELECTIVE') {
        electiveSubjects++;
        if (s.result === 'PASS' || gp > 0) electiveCredits += cr;
      }

      if (s.result === 'PASS') passCount++;
      else if (s.result === 'FAIL') failCount++;
    });

    const maxCredits = entry.dept === 'CSE' ? 192 : 164;

    students.push({
      regNo: entry.regNo, name: entry.name, dept: entry.dept, dob: entry.dob, subjects,
      cgpa: creditSum > 0 ? weightedSum / creditSum : 0,
      maxCredits, totalCredits, earnedCredits, coreCredits, electiveCredits,
      coreSubjects, electiveSubjects, passCount, failCount,
    });
  });

  return students.sort((a, b) => a.regNo.toString().localeCompare(b.regNo.toString()));
}
