import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
interface ProgressBarProps {
  progress: number;
  isProcessing: boolean;
  statusText: string;
}
export function ProgressBar({
  progress,
  isProcessing,
  statusText
}: ProgressBarProps) {
  if (!isProcessing) return null;
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
      exit={{
        opacity: 0,
        y: -20
      }}
      className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-teal-100 p-6 mb-8">

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-teal-400 rounded-full animate-ping opacity-20"></div>
            <Loader2 className="w-5 h-5 text-teal-600 animate-spin relative z-10" />
          </div>
          <span className="font-medium text-slate-700">{statusText}</span>
        </div>
        <span className="font-bold text-teal-600">{progress}%</span>
      </div>

      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"
          initial={{
            width: 0
          }}
          animate={{
            width: `${progress}%`
          }}
          transition={{
            ease: 'easeInOut'
          }} />

      </div>

      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>Initializing</span>
        <span>Analyzing Data</span>
        <span>Generating Reports</span>
      </div>
    </motion.div>);

}