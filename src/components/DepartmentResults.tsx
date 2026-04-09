import { useState } from 'react';
import { FileText, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DepartmentResultsProps {
  results: Record<string, any[]>;
  curriculum: Record<string, Record<string, string>>;
  searchQuery?: string;
}

export function DepartmentResults({ results, curriculum, searchQuery = '' }: DepartmentResultsProps) {
  const [activeTab, setActiveTab] = useState<string>(Object.keys(results)[0] || '');

  // If no results, show the empty state
  if (!results || Object.keys(results).length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-slate-900">Generated Results</h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No Results Generated Yet
          </h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Upload a student result Excel file to generate department-wise result sheets and analytics.
          </p>
        </div>
      </div>
    );
  }

  const downloadSheet = (branchName: string) => {
    const data = results[branchName];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, branchName);
    XLSX.writeFile(workbook, `${branchName}_Result_Sheet.xlsx`);
  };

  const currentDataRaw = results[activeTab] || [];

  // Filter data based on search query
  const currentData = currentDataRaw.filter(student => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = student['Name']?.toString().toLowerCase() || '';
    const regNo = student['Reg No']?.toString().toLowerCase() || '';
    return name.includes(query) || regNo.includes(query);
  });

  const currentSubjects = curriculum[activeTab] ? Object.values(curriculum[activeTab]) : [];

  // Department-level summary totals
  const deptTotalPass = currentData.reduce((sum, s) => sum + (s['Pass Count'] || 0), 0);
  const deptTotalFail = currentData.reduce((sum, s) => sum + (s['Fail Count'] || 0), 0);
  const deptTotalNotCompleted = currentData.reduce((sum, s) => sum + (s['Not Completed'] || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Generated Department Reports</h2>
        <div className="flex gap-2 flex-wrap">
          {Object.keys(results).map(branch => (
            <button
              key={branch}
              onClick={() => setActiveTab(branch)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === branch ? 'bg-teal-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              {branch}
            </button>
          ))}
        </div>
      </div>

      {/* Department-level summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Total Pass</p>
            <p className="text-2xl font-bold text-emerald-700">{deptTotalPass}</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-red-600 font-semibold uppercase tracking-wide">Total Fail</p>
            <p className="text-2xl font-bold text-red-700">{deptTotalFail}</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Not Completed</p>
            <p className="text-2xl font-bold text-slate-700">{deptTotalNotCompleted}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{activeTab} Department</h3>
            <p className="text-slate-500 text-sm">{currentData.length} Students Processed</p>
          </div>
          <button
            onClick={() => downloadSheet(activeTab)}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm border border-teal-200 bg-teal-50 px-3 py-2 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap min-w-[120px]">Reg No</th>
                <th className="px-6 py-4 whitespace-nowrap min-w-[200px]">Student Name</th>
                {currentSubjects.map(subCode => (
                  <th key={subCode} className="px-4 py-4 text-center whitespace-nowrap">
                    {subCode}
                  </th>
                ))}
                {/* Summary columns - sticky-style with special background */}
                <th className="px-4 py-4 text-center whitespace-nowrap bg-emerald-50 text-emerald-700 border-l-2 border-emerald-200">
                  ✅ Pass
                </th>
                <th className="px-4 py-4 text-center whitespace-nowrap bg-red-50 text-red-700">
                  ❌ Fail
                </th>
                <th className="px-4 py-4 text-center whitespace-nowrap bg-slate-100 text-slate-600 border-r border-slate-200">
                  ⏳ Not Done
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.map((student, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 font-mono font-medium text-slate-900">
                    {student['Reg No']}
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-800">
                    {student['Name']}
                  </td>
                  {currentSubjects.map(subCode => {
                    const status = student[subCode];
                    let statusColor = 'text-slate-400';
                    let icon = null;

                    if (status === 'PASS') {
                      statusColor = 'text-emerald-600 bg-emerald-50';
                      icon = <CheckCircle className="w-3.5 h-3.5" />;
                    } else if (status === 'FAIL') {
                      statusColor = 'text-red-600 bg-red-50';
                      icon = <XCircle className="w-3.5 h-3.5" />;
                    } else if (status === 'Absent') {
                      statusColor = 'text-amber-600 bg-amber-50';
                      icon = <AlertCircle className="w-3.5 h-3.5" />;
                    } else if (status === 'Not Completed') {
                      statusColor = 'text-slate-500 bg-slate-100';
                      icon = <AlertCircle className="w-3.5 h-3.5" />;
                    }

                    return (
                      <td key={subCode} className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                          {icon}
                          {status}
                        </span>
                      </td>
                    );
                  })}
                  {/* Per-student summary cells */}
                  <td className="px-4 py-3 text-center bg-emerald-50 border-l-2 border-emerald-200">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                      {student['Pass Count'] ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center bg-red-50">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold text-sm">
                      {student['Fail Count'] ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center bg-slate-50">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-sm">
                      {student['Not Completed'] ?? 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {currentData.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              {currentDataRaw.length > 0 ? (
                <>
                  <p className="font-medium text-slate-900">No matching students found</p>
                  <p className="mt-1">Try adjusting your search terms</p>
                </>
              ) : (
                "No students found for this department."
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}