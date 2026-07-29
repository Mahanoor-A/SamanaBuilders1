import React, { useState, useRef } from 'react';
import { Upload, X, File } from 'lucide-react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024;

export default function FileUpload({ onFilesChange, multiple = false, maxFiles = 1 }) {
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) return false;
      if (f.size > MAX_SIZE) return false;
      return true;
    });
    const updated = multiple ? [...files, ...valid].slice(0, maxFiles) : [valid[0]].filter(Boolean);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const isImage = (file) => file.type.startsWith('image/');

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-primary/3'
        }`}
      >
        <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-muted">Drop files here or click to browse</p>
        <p className="text-xs text-text-muted/60 mt-1">JPG, PNG, WEBP, PDF up to 5MB</p>
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)} className="hidden" />
      </div>
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-bg rounded-lg border border-border">
              {isImage(file) ? (
                <img src={URL.createObjectURL(file)} alt="" className="w-10 h-10 rounded object-cover" />
              ) : (
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                  <File className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-main truncate">{file.name}</p>
                <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => removeFile(i)} className="p-1 hover:bg-border rounded-lg transition-colors">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
