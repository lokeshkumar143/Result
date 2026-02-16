import React, { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { StatsCards } from '../components/StatsCards';
import { FileUpload } from '../components/FileUpload';
import { ProgressBar } from '../components/ProgressBar';
import { DepartmentResults } from '../components/DepartmentResults';
import { CurriculumTable } from '../components/CurriculumTable';
import { Sparkles, FileSpreadsheet, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
              });
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