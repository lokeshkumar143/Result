
import { Users, Building2, BookOpen, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatsProps {
  totalDepartments: number;
  totalCourses: number;
  totalStudents: number;
  reportsCount: number;
}

export function StatsCards({ totalDepartments, totalCourses, totalStudents, reportsCount }: StatsProps) {
  const stats = [
    {
      label: 'Curriculum Courses',
      value: totalCourses.toString(),
      icon: BookOpen,
      color: 'blue',
      trend: 'Stored in Database'
    },
    {
      label: 'Departments',
      value: totalDepartments.toString(),
      icon: Building2,
      color: 'teal',
      trend: 'Active Departments'
    },
    {
      label: 'Students Processed',
      value: totalStudents.toLocaleString(),
      icon: Users,
      color: 'green',
      trend: 'Waiting for upload'
    },
    {
      label: 'Reports Generated',
      value: reportsCount.toString(),
      icon: FileCheck,
      color: 'purple',
      trend: 'In this session'
    }];

  const container = {
    hidden: {
      opacity: 0
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const item = {
    hidden: {
      y: 20,
      opacity: 0
    },
    show: {
      y: 0,
      opacity: 1
    }
  };
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 text-blue-600 border-l-4 border-blue-500';
      case 'teal':
        return 'bg-teal-50 text-teal-600 border-l-4 border-teal-500';
      case 'green':
        return 'bg-emerald-50 text-emerald-600 border-l-4 border-emerald-500';
      case 'purple':
        return 'bg-purple-50 text-purple-600 border-l-4 border-purple-500';
      default:
        return 'bg-slate-50 text-slate-600 border-l-4 border-slate-500';
    }
  };
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

      {stats.map((stat, index) =>
        <motion.div
          key={index}
          variants={item}
          className={`bg-white rounded-xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow ${getColorClasses(stat.color).split(' ').pop()}`}>

          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">
                {stat.label}
              </p>
              <h3 className="text-2xl font-bold text-slate-900">
                {stat.value}
              </h3>
            </div>
            <div
              className={`p-3 rounded-lg ${getColorClasses(stat.color).split(' ').slice(0, 2).join(' ')}`}>

              <stat.icon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <span
              className={`font-medium ${stat.color === 'green' || stat.color === 'blue' ? 'text-emerald-600' : 'text-slate-500'}`}>

              {stat.trend}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>);

}