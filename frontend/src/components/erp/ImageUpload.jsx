import React, { useRef, useState } from 'react';
import { Image, X } from 'lucide-react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/x-icon'];

export default function ImageUpload({
  file,
  preview,
  onChange,
  label = 'Customer Image',
  helperText = 'JPG, PNG, WEBP, GIF, SVG',
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(heic|HEIC)$/i)) {
      alert('Please select a valid image file');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
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

  const displayPreview = file ? URL.createObjectURL(file) : preview;

  if (displayPreview) {
    return (
      <div className="relative group">
        <img
          src={displayPreview}
          alt="Customer preview"
          className="w-full h-48 object-cover rounded-xl border border-border"
        />
        <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            className="px-3 py-2 text-xs font-medium text-white bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="px-3 py-2 text-xs font-medium text-white bg-red-500/80 backdrop-blur-sm rounded-lg hover:bg-red-500 transition-colors"
          >
            Remove
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files[0])}
          className="hidden"
        />
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
        accept="image/*"
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
      />
      <Image className={`w-8 h-8 mb-2 ${dragOver ? 'text-primary' : 'text-text-muted/50'}`} />
      <p className="text-sm font-medium text-text-main">{label}</p>
      <p className="text-xs text-text-muted mt-1">{helperText}</p>
    </div>
  );
}
