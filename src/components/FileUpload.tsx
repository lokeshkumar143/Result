import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}
export function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (
    files.length > 0 && (
    files[0].name.endsWith('.xlsx') || files[0].name.endsWith('.xls')))
    {
      onFileSelect(files[0]);
    }
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };
  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <AnimatePresence mode="wait">
        {!selectedFile ?
        <motion.div
          key="upload-zone"
          initial={{
            opacity: 0,
            y: 10
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: -10
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
              relative group cursor-pointer
              border-2 border-dashed rounded-xl p-10
              flex flex-col items-center justify-center text-center
              transition-all duration-300 ease-in-out
              ${isDragOver ? 'border-teal-500 bg-teal-50/50 scale-[1.02]' : 'border-slate-300 bg-white hover:border-teal-400 hover:bg-slate-50'}
            `}>

            <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept=".xlsx,.xls"
            className="hidden" />


            <div
            className={`
              p-4 rounded-full mb-4 transition-colors duration-300
              ${isDragOver ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400 group-hover:text-teal-500 group-hover:bg-teal-50'}
            `}>

              <UploadCloud
              className={`w-10 h-10 ${isDragOver ? 'animate-bounce' : ''}`} />

            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Upload Student Results File
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Drag & drop the Excel file containing student marks
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              <span className="font-mono">.xlsx</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="font-mono">.xls</span>
            </div>

            <p className="mt-4 text-xs text-teal-600 font-medium bg-teal-50 px-3 py-1 rounded-full">
              Note: Curriculum is already stored in database
            </p>
          </motion.div> :

        <motion.div
          key="file-selected"
          initial={{
            opacity: 0,
            scale: 0.95
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          exit={{
            opacity: 0,
            scale: 0.95
          }}
          className="bg-white border border-teal-200 rounded-xl p-6 shadow-sm relative overflow-hidden">

            <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-teal-50 p-3 rounded-lg border border-teal-100">
                  <FileSpreadsheet className="w-8 h-8 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 text-lg">
                    {selectedFile.name}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB • Ready for
                    processing
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-teal-600 text-sm font-medium bg-teal-50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified</span>
                </div>
                <button
                onClick={removeFile}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Remove file">

                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}