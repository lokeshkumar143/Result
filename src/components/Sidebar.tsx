import React from 'react';
import {
  LayoutDashboard,
  Upload,
  FileSpreadsheet,
  Settings,
  GraduationCap,
  X,
  BookOpen } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}
export function Sidebar({
  activeNav,
  setActiveNav,
  isMobileOpen,
  setIsMobileOpen
}: SidebarProps) {
  const navItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    id: 'curriculum',
    label: 'Curriculum',
    icon: BookOpen
  },
  {
    id: 'upload',
    label: 'Upload Results',
    icon: Upload
  },
  {
    id: 'reports',
    label: 'Generated Reports',
    icon: FileSpreadsheet
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings
  }];

  const SidebarContent = () =>
  <div className="flex flex-col h-full bg-[#0f172a] text-slate-300 w-64 border-r border-slate-800">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-teal-600 p-2 rounded-lg">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-xl tracking-tight">SRSG</h1>
          <p className="text-xs text-slate-400">Academic System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
        const isActive = activeNav === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveNav(item.id);
              setIsMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive ? 'bg-teal-600/10 text-teal-400 border-l-2 border-teal-500' : 'hover:bg-slate-800 hover:text-white border-l-2 border-transparent'}`}>

              <item.icon
              className={`w-5 h-5 transition-colors ${isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-white'}`} />

              <span className="font-medium">{item.label}</span>
            </button>);

      })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-2">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">
              Online v2.5.0
            </span>
          </div>
        </div>
      </div>
    </div>;

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen &&
        <>
            <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" />

            <motion.div
            initial={{
              x: '-100%'
            }}
            animate={{
              x: 0
            }}
            exit={{
              x: '-100%'
            }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 200
            }}
            className="fixed inset-y-0 left-0 z-50 md:hidden">

              <div className="relative h-full">
                <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-[-3rem] p-2 bg-white rounded-full shadow-lg text-slate-900">

                  <X className="w-5 h-5" />
                </button>
                <SidebarContent />
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>
    </>);

}