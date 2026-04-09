import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { StatsCards } from '../components/StatsCards';
import { FileUpload } from '../components/FileUpload';
import { ProgressBar } from '../components/ProgressBar';
import { DepartmentResults } from '../components/DepartmentResults';
import { CurriculumTable } from '../components/CurriculumTable';
import { CCMResults, CCMStudent, parseCCMFile } from '../components/CCMResults';
import { Sparkles, FileSpreadsheet, Clock, CheckCircle2, UploadCloud, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

import { CURRICULUM } from '../data/curriculum';

export function Dashboard() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing...');
  const [showResults, setShowResults] = useState(false);
  // State to hold the generated data for display
  const [generatedResults, setGeneratedResults] = useState<Record<string, any[]>>({});
  const [curriculumData, setCurriculumData] = useState<any>(null);

  // CCM state
  const [ccmFile, setCcmFile] = useState<File | null>(null);
  const [ccmStudents, setCcmStudents] = useState<CCMStudent[]>([]);
  const [ccmProcessing, setCcmProcessing] = useState(false);
  const [ccmDone, setCcmDone] = useState(false);
  const [ccmDetailsSearch, setCcmDetailsSearch] = useState('');

  const getHeaderInfo = () => {
    switch (activeNav) {
      case 'dashboard':
        return {
          title: 'Dashboard',
          subtitle: 'Overview of academic performance'
        };
      case 'curriculum':
        return {
          title: 'Curriculum Database',
          subtitle: 'Permanent course records'
        };
      case 'upload':
        return {
          title: 'Upload & Generate',
          subtitle:
            'Upload student results and generate department-wise sheets'
        };
      case 'reports':
        return {
          title: 'Generated Reports',
          subtitle: 'View and download past department reports'
        };
      case 'ccm':
        return {
          title: 'CCM Upload',
          subtitle: 'Upload CCM file to calculate CGPA, credits and subject breakdown'
        };
      case 'ccm-details':
        return {
          title: 'CCM Details',
          subtitle: 'Search and view per-student CGPA, credits and subject breakdown'
        };
      case 'settings':
        return {
          title: 'Settings',
          subtitle: 'System configuration'
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: 'Welcome back'
        };
    }
  };
  const { title, subtitle } = getHeaderInfo();

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDepartments: 0,
    totalCourses: 0,
    totalStudents: 0,
    reportsCount: 0
  });

  // Calculate initial stats from Curriculum on mount
  useEffect(() => {
    setCurriculumData(CURRICULUM);
    const deptCount = Object.keys(CURRICULUM).length;
    // Calculate unique courses
    const allCodes = new Set<string>();
    Object.values(CURRICULUM).forEach((subjects: any) => {
      Object.values(subjects).forEach((code: any) => allCodes.add(code));
    });

    setStats(prev => ({
      ...prev,
      totalDepartments: deptCount,
      totalCourses: allCodes.size
    }));
  }, []);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const handleGenerate = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setShowResults(false);
    setProgress(0);

    try {
      // Dynamically import xlsx
      const XLSX = await import('xlsx');

      // We already have CURRICULUM imported

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        console.log('Raw Input Data:', jsonData);

        // Transform Data: Group by Student (RegNo)
        // Input format: { RegNo, StudentName, Code, Grade, Result, ... }
        const studentsMap = new Map<string, any>();

        const knownBranches = Object.keys(CURRICULUM);

        jsonData.forEach((row: any) => {
          const regNo = row['RegNo'] || row['Reg No'] || row['HTNO'];
          if (!regNo) return;

          // Find Department
          let department = row['Department'] || row['Dept'] || row['Branch'];

          if (department && typeof department === 'string') {
            department = department.trim();
          } else {
            // Check against known branches if header is missing or different
            for (const val of Object.values(row)) {
              if (typeof val === 'string' && knownBranches.includes(val.trim())) {
                department = val.trim();
                break;
              }
            }
          }

          if (!studentsMap.has(regNo)) {
            studentsMap.set(regNo, {
              'Reg No': regNo,
              'Name': row['StudentName'] || row['Name'] || row['Student Name'],
              // Store all subjects in a flat structure for easy checking later
              subjects: {},
              department: department
            });
          } else if (department && !studentsMap.get(regNo).department) {
            // If we found a department later for this student, update it
            studentsMap.get(regNo).department = department;
          }

          const student = studentsMap.get(regNo);
          const subjectCode = row['Code'] || row['Subject Code'];
          const grade = row['Grade'];
          const result = row['Result'];

          if (subjectCode) {
            // Store the result/grade for this subject
            // Priority: Result (PASS/FAIL) > Grade > existing
            student.subjects[subjectCode] = result || grade;
          }
        });

        // Convert map to array of student objects
        const allStudents = Array.from(studentsMap.values());
        console.log('Processed Students:', allStudents);

        // We need to generate a new Workbook and also store data for UI
        const newWorkbook = XLSX.utils.book_new();
        let hasData = false;
        const resultsForState: Record<string, any[]> = {};
        let processedStudentsCount = 0;

        // Iterate through each branch defined in our curriculum
        Object.entries(CURRICULUM).forEach(([branchName, subjects]) => {
          // Filter students belonging to this branch
          // Heuristic: Check if the student has data for at least 3 subjects unique to this branch
          // Or just check overlap with branch subjects

          const branchStudents = allStudents.filter((student: any) => {
            return student.department === branchName;
          });

          if (branchStudents.length > 0) {
            hasData = true;
            processedStudentsCount += branchStudents.length;

            // Prepare the data for this branch's sheet
            const branchSheetData = branchStudents.map((student: any) => {
              const row: any = {
                'Reg No': student['Reg No'],
                'Name': student['Name'],
              };

              let passCount = 0;
              let failCount = 0;
              let notCompletedCount = 0;

              // For each subject in the curriculum, determine PASS/FAIL
              Object.values(subjects).forEach((subjectCode) => {
                const statusRaw = student.subjects[subjectCode];
                let status = 'Not Completed'; // Default if no record found

                if (statusRaw) {
                  const strStatus = statusRaw.toString().toUpperCase();
                  if (strStatus === 'PASS' || strStatus === 'P') status = 'PASS';
                  else if (strStatus === 'FAIL' || strStatus === 'F') status = 'FAIL';
                  else if (strStatus === 'AB') status = 'Absent';
                  else status = strStatus; // Keep original grade if not generic pass/fail
                }
                row[subjectCode] = status;

                // Tally summary counts
                if (status === 'PASS') passCount++;
                else if (status === 'FAIL') failCount++;
                else notCompletedCount++;
              });

              // Append summary columns at the end
              row['Pass Count'] = passCount;
              row['Fail Count'] = failCount;
              row['Not Completed'] = notCompletedCount;

              return row;
            });

            // Store for UI
            resultsForState[branchName] = branchSheetData;

            // Create a worksheet for this branch
            const worksheet = XLSX.utils.json_to_sheet(branchSheetData);
            XLSX.utils.book_append_sheet(newWorkbook, worksheet, branchName);
          }
        });

        if (hasData) {
          // Write the file and trigger download
          XLSX.writeFile(newWorkbook, 'Generated_Result_Sheets.xlsx');

          // Update state to show results in UI
          setGeneratedResults(resultsForState);

          // Update Stats
          setStats(prev => ({
            ...prev,
            totalStudents: processedStudentsCount,
            reportsCount: Object.keys(resultsForState).length
          }));

          // Add Activity
          const newActivity = {
            action: `Generated reports for ${processedStudentsCount} students across ${Object.keys(resultsForState).length} departments`,
            time: 'Just now',
            type: 'success'
          };
          setRecentActivity(prev => [newActivity, ...prev]);

          // Don't auto-show results in this tab per user request "only in generated report page"
          // But we can trigger a notification or similar if we had one.
          // We just ensure progress completes.
        } else {
          alert('No matching student data found for the defined curriculum branches. Please check your Excel file structure.');
        }
      };

      reader.readAsBinaryString(selectedFile);

    } catch (error) {
      console.error("Error processing file:", error);
      alert("Error processing file. See console for details.");
    }

    // Simulate progress for UI feedback
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        if (prev < 15) setStatusText('Loading curriculum from database...'); else
          if (prev < 30) setStatusText('Parsing student results file...'); else
            if (prev < 50) setStatusText('Grouping students by department...'); else
              if (prev < 70) setStatusText('Matching courses — CSE, ECE, ME...'); else
                if (prev < 85) setStatusText('Matching courses — CE, EE, IT...'); else
                  if (prev < 95)
                    setStatusText('Generating department-wise Excel sheets...'); else
                    setStatusText('Finalizing department reports...');
        return prev + 5;
      });
    }, 60);
  };
  useEffect(() => {
    if (progress === 100) {
      setTimeout(() => {
        setIsProcessing(false);
        // We do NOT automatically set showResults=true here anymore because 
        // user wants reports displayed only in the Reports tab.
        // But we might want to alert the user it's done.

        // If we want to strictly follow "in the generated report only it have to show",
        // we leave this logic out or redirects.
        // Let's just reset UI state.
        setShowResults(true); // Keeping this true so we CAN see it if we navigate there, but we won't show it in 'upload' view anymore
      }, 500);
    }
  }, [progress]);

  // CCM process handler
  const handleCCMProcess = async () => {
    if (!ccmFile) return;
    setCcmProcessing(true);
    setCcmDone(false);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false });
        const parsed = parseCCMFile(jsonData);
        setCcmStudents(parsed);
        setCcmProcessing(false);
        setCcmDone(true);
      };
      reader.readAsBinaryString(ccmFile);
    } catch (err) {
      console.error('CCM parse error:', err);
      setCcmProcessing(false);
      alert('Error processing CCM file.');
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-900">
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen} />


      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header
          onMenuClick={() => setIsMobileOpen(true)}
          title={title}
          subtitle={subtitle}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery} // Pass setSearchQuery to update state
        />


        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* DASHBOARD VIEW */}
            {activeNav === 'dashboard' &&
              <>
                <StatsCards
                  totalDepartments={stats.totalDepartments}
                  totalCourses={stats.totalCourses}
                  totalStudents={stats.totalStudents}
                  reportsCount={stats.reportsCount}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Activity */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-400" />
                        Recent Activity
                      </h3>
                      <span className="text-xs text-slate-400">
                        {recentActivity.length} events
                      </span>
                    </div>
                    <div className="space-y-3">
                      {recentActivity.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">
                          No recent activity
                        </div>
                      ) : (
                        recentActivity.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 text-sm py-2 border-b border-slate-50 last:border-0">

                            <div
                              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-700 truncate">
                                {item.action}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {item.time}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* System Status + Quick Actions */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 rounded-xl shadow-lg text-white">
                      <h3 className="font-bold text-lg mb-2">System Ready</h3>
                      <p className="text-teal-100 text-sm mb-1">
                        Curriculum database:{' '}
                        <strong>{stats.totalDepartments} departments, {stats.totalCourses} courses</strong>
                      </p>
                      <p className="text-teal-100 text-sm mb-4">
                        All departments loaded and ready for result processing.
                      </p>
                      <button
                        onClick={() => setActiveNav('upload')}
                        className="bg-white text-teal-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-50 transition-colors">

                        Process New Results →
                      </button>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                      <h3 className="font-bold text-sm text-slate-900 mb-4">
                        Quick Actions
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setActiveNav('upload')}
                          className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition-colors">

                          <FileSpreadsheet className="w-4 h-4 text-teal-500" />
                          Upload Results
                        </button>
                        <button
                          onClick={() => setActiveNav('curriculum')}
                          className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 transition-colors">

                          <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          View Curriculum
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            }

            {/* CURRICULUM VIEW */}
            {activeNav === 'curriculum' && <CurriculumTable />}

            {/* UPLOAD & GENERATE VIEW */}
            {(activeNav === 'upload' || activeNav === 'reports') &&
              <section className="relative">
                <div className="flex flex-col items-center justify-center space-y-6">
                  {activeNav === 'upload' && !showResults &&
                    <div className="w-full">
                      {/* Only show Upload in Upload tab */}
                      <FileUpload
                        onFileSelect={(file) => {
                          setSelectedFile(file);
                          setShowResults(false);
                          setProgress(0);
                        }}
                        selectedFile={selectedFile} />

                    </div>
                  }

                  {/* In Upload Tab, show button/progress but NOT result table */}
                  {activeNav === 'upload' &&
                    <>
                      {!isProcessing && !showResults && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleGenerate}
                          disabled={!selectedFile}
                          className={`
                            group relative overflow-hidden rounded-lg px-8 py-4
                            flex items-center gap-3 font-bold text-white shadow-xl
                            transition-all duration-300
                            ${!selectedFile ? 'bg-slate-300 cursor-not-allowed opacity-70 shadow-none' : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-teal-500/25'}
                          `}>

                          <Sparkles
                            className={`w-5 h-5 ${selectedFile ? 'animate-pulse' : ''}`} />

                          <span className="text-lg">
                            Generate Department Sheets
                          </span>
                          {selectedFile &&
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                          }
                        </motion.button>
                      )}

                      <ProgressBar
                        progress={progress}
                        isProcessing={isProcessing}
                        statusText={statusText} />

                      {showResults && (
                        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                          <h3 className="text-xl font-bold text-emerald-800 mb-2">Processing Complete!</h3>
                          <p className="text-emerald-600 mb-6">Generated reports for {stats.totalStudents} students.</p>
                          <button
                            onClick={() => setActiveNav('reports')}
                            className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-emerald-700 transition"
                          >
                            View Generated Reports →
                          </button>
                        </div>
                      )}
                    </>
                  }


                  {/* REPORTS TAB ONLY */}
                  {activeNav === 'reports' &&
                    <div className="w-full">
                      <DepartmentResults results={generatedResults} curriculum={curriculumData} searchQuery={searchQuery} />
                    </div>
                  }
                </div>
              </section>
            }

            {/* CCM UPLOAD VIEW */}
            {activeNav === 'ccm' && (
              <section className="space-y-6">
                {/* Upload Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">Upload CCM Result File</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Format: RegNo, StudentName, Code, Grade, Credits, DOB, Result, dept, Helper-3</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <AnimatePresence mode="wait">
                      {!ccmFile ? (
                        <motion.label
                          key="ccm-upload"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          htmlFor="ccm-file-input"
                          className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-10 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300 group"
                        >
                          <div className="p-4 rounded-full mb-4 bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500 transition-colors">
                            <UploadCloud className="w-10 h-10" />
                          </div>
                          <h4 className="text-base font-semibold text-slate-800 mb-1">Upload CCM Excel File</h4>
                          <p className="text-sm text-slate-500 mb-4">Drag & drop or click to browse</p>
                          <div className="flex flex-wrap gap-4 text-xs text-slate-400 justify-center mb-3">
                            <span className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-semibold">CSE → 192 credits</span>
                            <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1 rounded-full font-semibold">Others → 164 credits</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                            <span className="font-mono">.xlsx</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="font-mono">.xls</span>
                          </div>
                          <input
                            id="ccm-file-input"
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setCcmFile(e.target.files[0]);
                                setCcmDone(false);
                                setCcmStudents([]);
                              }
                            }}
                          />
                        </motion.label>
                      ) : (
                        <motion.div
                          key="ccm-file-selected"
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.97 }}
                          className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-white p-3 rounded-lg border border-indigo-100">
                              <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{ccmFile.name}</p>
                              <p className="text-xs text-slate-500">{(ccmFile.size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                          <button
                            onClick={() => { setCcmFile(null); setCcmDone(false); setCcmStudents([]); }}
                            className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                          >✕</button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {ccmFile && !ccmDone && (
                      <div className="mt-4 flex justify-center">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCCMProcess}
                          disabled={ccmProcessing}
                          className={`
                            flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white shadow-lg
                            transition-all duration-300
                            ${ccmProcessing
                              ? 'bg-slate-300 cursor-wait'
                              : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-500/25'}
                          `}
                        >
                          {ccmProcessing ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          ) : (
                            <Calculator className="w-5 h-5" />
                          )}
                          {ccmProcessing ? 'Calculating...' : 'Calculate CGPA & Credits'}
                        </motion.button>
                      </div>
                    )}

                    {ccmDone && (
                      <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <p className="text-sm text-emerald-700 font-semibold">
                            Processed {ccmStudents.length} students successfully!
                          </p>
                          <button
                            onClick={() => { setCcmFile(null); setCcmDone(false); setCcmStudents([]); }}
                            className="ml-auto text-xs text-slate-500 hover:text-slate-700 underline"
                          >Upload new</button>
                        </div>
                        {/* Quick stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          {[
                            { label: 'Students', value: ccmStudents.length, color: 'text-slate-800' },
                            { label: 'Avg CGPA', value: ccmStudents.length ? (ccmStudents.reduce((s,st) => s+st.cgpa,0)/ccmStudents.length).toFixed(2) : '—', color: 'text-purple-700' },
                            { label: 'CSE (192 cr)', value: ccmStudents.filter(s => s.dept === 'CSE').length, color: 'text-indigo-700' },
                            { label: 'Others (164 cr)', value: ccmStudents.filter(s => s.dept !== 'CSE').length, color: 'text-teal-700' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="bg-white rounded-lg border border-slate-200 p-3 text-center">
                              <p className="text-[10px] text-slate-400 uppercase font-semibold">{label}</p>
                              <p className={`text-xl font-black ${color}`}>{value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-center">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveNav('ccm-details')}
                            className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:from-indigo-600 hover:to-indigo-700 transition flex items-center gap-2"
                          >
                            View CCM Details →
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* CCM DETAILS VIEW */}
            {activeNav === 'ccm-details' && (
              <section className="space-y-4">
                {/* Top bar: search + back button */}
                <div className="flex items-center gap-3 flex-wrap">
                  {ccmStudents.length === 0 ? (
                    <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                      <p className="text-amber-700 font-semibold text-sm">No data loaded yet.</p>
                      <p className="text-amber-600 text-xs mt-1 mb-3">Please upload and process a CCM file first.</p>
                      <button
                        onClick={() => setActiveNav('ccm')}
                        className="bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-indigo-600 transition"
                      >← Go to CCM Upload</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-2.5 min-w-[200px]">
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search by Reg No, Name or Department…"
                          value={ccmDetailsSearch}
                          onChange={(e) => setCcmDetailsSearch(e.target.value)}
                          className="flex-1 text-sm text-slate-700 bg-transparent outline-none placeholder-slate-400"
                        />
                        {ccmDetailsSearch && (
                          <button onClick={() => setCcmDetailsSearch('')} className="text-slate-400 hover:text-slate-600 text-xs">✕ Clear</button>
                        )}
                      </div>
                      <button
                        onClick={() => setActiveNav('ccm')}
                        className="text-xs text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 bg-white px-3 py-2.5 rounded-xl transition font-medium shrink-0"
                      >← CCM Upload</button>
                    </>
                  )}
                </div>

                {/* Two-panel Results */}
                {ccmStudents.length > 0 && (
                  <CCMResults students={ccmStudents} searchQuery={ccmDetailsSearch} />
                )}
              </section>
            )}

            {/* SETTINGS VIEW */}
            {activeNav === 'settings' &&
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
                <p className="font-medium text-slate-700">Settings</p>
                <p className="text-sm mt-1">
                  System configuration panel — coming soon.
                </p>
              </div>
            }
          </div>
        </main>
      </div>
    </div>);

}