
import { motion } from 'framer-motion';
import { BookOpen, Layers, Database } from 'lucide-react';
import { CURRICULUM } from '../data/curriculum';

const DEPT_NAMES: Record<string, string> = {
  CSE: 'Computer Science & Engineering',
  ECE: 'Electronics & Communication',
  EEE: 'Electrical & Electronics Engineering',
  ENEE: 'Electrical & Electronics (ENEE)',
  MECH: 'Mechanical Engineering',
  CIVIL: 'Civil Engineering',
  AUTO: 'Automobile Engineering',
  BME: 'Biomedical Engineering',
  BT: 'Biotechnology',
  BI: 'Bioinformatics',
  AGRI: 'Agricultural Engineering',
  IT: 'Information Technology',
  AIDS: 'Artificial Intelligence & Data Science',
  AIML: 'AI & Machine Learning',
};

const deptColors: Record<string, string> = {
  CSE: 'bg-blue-50 text-blue-600',
  ECE: 'bg-teal-50 text-teal-600',
  EEE: 'bg-amber-50 text-amber-600',
  ENEE: 'bg-yellow-50 text-yellow-600',
  MECH: 'bg-orange-50 text-orange-600',
  CIVIL: 'bg-emerald-50 text-emerald-600',
  AUTO: 'bg-red-50 text-red-600',
  BME: 'bg-pink-50 text-pink-600',
  BT: 'bg-lime-50 text-lime-600',
  BI: 'bg-green-50 text-green-600',
  AGRI: 'bg-green-100 text-green-800',
  IT: 'bg-purple-50 text-purple-600',
  AIDS: 'bg-indigo-50 text-indigo-600',
  AIML: 'bg-violet-50 text-violet-600',
};

export function CurriculumTable() {
  // Transform CURRICULUM into the format needed for display
  const curriculumData = Object.entries(CURRICULUM).map(([shortName, coursesMap]) => ({
    department: DEPT_NAMES[shortName] || shortName,
    shortName,
    courses: Object.values(coursesMap).map(code => ({
      code,
      name: `Course ${code}` // We don't have names in the provided data
    }))
  }));

  const totalCourses = curriculumData.reduce(
    (sum, d) => sum + d.courses.length,
    0
  );

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      className="space-y-6">

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Stored Curriculum
              </h2>
              <p className="text-slate-500 text-sm">
                Permanent course list by department
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <Database className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600">
              {curriculumData.length} Departments
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-slate-600">{totalCourses} Courses</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {curriculumData.map((dept, idx) =>
            <motion.div
              key={dept.shortName}
              initial={{
                opacity: 0,
                y: 20
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              transition={{
                delay: idx * 0.05
              }}
              className="border border-slate-200 rounded-lg overflow-hidden flex flex-col max-h-[400px]">

              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2 shrink-0">
                <Layers className="w-4 h-4 text-slate-500" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm truncate" title={dept.department}>
                    {dept.department}
                  </h3>
                </div>
                <span className="text-xs font-medium bg-white px-2 py-1 rounded border border-slate-200 text-slate-500 shrink-0">
                  {dept.courses.length}
                </span>
              </div>
              <div className="divide-y divide-slate-100 overflow-y-auto">
                {dept.courses.map((course, i) =>
                  <div
                    key={`${dept.shortName}-${course.code}-${i}`}
                    className="px-4 py-3 flex items-center gap-3">

                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${deptColors[dept.shortName] || 'bg-slate-50 text-slate-600'}`}>

                      {dept.shortName}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {course.code}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>);
}