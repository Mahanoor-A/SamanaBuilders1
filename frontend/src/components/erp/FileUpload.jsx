import React, { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function FileUpload({
  file,
  onChange,
  accept = '.pdf,.doc,.docx,.txt,.rtf,.csv,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z',
  label = 'Upload Document',
  helperText = 'PDF, DOC, DOCX, XLS, XLSX, PPT, TXT, ZIP and more',
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    if (f && f.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }
    onChange(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  if (file) {
    return (
      <div className="flex items-center gap-3 p-3 bg-primary/5 border border-border rounded-xl">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-main truncate">{file.name}</p>
          <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-muted hover:text-red-500 transition-colors shrink-0"
          title="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
        dragOver
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-primary/5'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
      />
      <Upload className={`w-8 h-8 mb-2 ${dragOver ? 'text-primary' : 'text-text-muted/50'}`} />
      <p className="text-sm font-medium text-text-main">{label}</p>
      <p className="text-xs text-text-muted mt-1">{helperText}</p>
    </div>
  );
}
