import { useCallback, useState, useRef } from 'react';
import { Upload, Film, X, FileVideo } from 'lucide-react';

export default function VideoUpload({ onVideoSelect, selectedVideo }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('video/')) {
        onVideoSelect(file);
      }
    },
    [onVideoSelect]
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onVideoSelect(file);
    }
  };

  const handleRemove = () => {
    onVideoSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Film size={18} className="text-[var(--color-accent-primary)]" />
        <h2 className="text-base font-semibold text-white">Upload Video</h2>
      </div>

      {!selectedVideo ? (
        <div
          id="drop-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 min-h-[240px] rounded-2xl border-2 border-dashed cursor-pointer
            flex flex-col items-center justify-center gap-4 transition-all duration-300
            ${
              isDragging
                ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 scale-[1.02]'
                : 'border-[var(--color-dark-400)] bg-[var(--color-dark-700)]/40 hover:border-[var(--color-accent-primary)]/50 hover:bg-[var(--color-dark-700)]/60'
            }`}
        >
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
            ${
              isDragging
                ? 'bg-[var(--color-accent-primary)]/20 animate-float'
                : 'bg-[var(--color-dark-600)]'
            }`}
          >
            <Upload
              size={28}
              className={`transition-colors ${
                isDragging ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-muted)]'
              }`}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {isDragging ? 'Drop your video here' : 'Drag & drop your video'}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              or click to browse • MP4, AVI, MOV
            </p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-[var(--color-accent-primary)]/10 border border-[var(--color-accent-primary)]/20">
            <span className="text-xs font-medium text-[var(--color-accent-hover)]">
              Max file size: 500MB
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
            id="video-file-input"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 animate-fade-in-up">
          {/* Video Preview */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-black/40 border border-white/[0.06]">
            <video
              id="input-video-preview"
              src={URL.createObjectURL(selectedVideo)}
              controls
              className="w-full h-full object-contain"
            />
            <button
              id="remove-video-btn"
              onClick={handleRemove}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 hover:bg-red-500/80 transition-colors backdrop-blur-sm"
            >
              <X size={14} className="text-white" />
            </button>
          </div>

          {/* File info */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-dark-700)]/60 border border-white/[0.06]">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-primary)]/15 flex items-center justify-center flex-shrink-0">
              <FileVideo size={18} className="text-[var(--color-accent-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{selectedVideo.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
