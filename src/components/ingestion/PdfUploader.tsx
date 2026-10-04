import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import type { Lecture } from '../../types/lecture';
import { uploadPdf } from '../../services/api';

interface PdfUploaderProps {
  onSuccess: (lecture: Lecture) => void;
  defaultCourseCode?: string;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  onSuccess,
  defaultCourseCode = 'General',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [courseCode, setCourseCode] = useState(defaultCourseCode);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProgress(10);
    try {
      const lecture = await uploadPdf(selectedFile, courseCode, (p) => setProgress(p));
      onSuccess(lecture);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Course Selection Dropdown */}
      <div className="course-select-row">
        <label style={{ fontSize: 'var(--text-label)', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>
          Assign Course Code:
        </label>
        <select
          className="course-dropdown"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
        >
          <option value="General">General / Elective</option>
          <option value="CS 106B">CS 106B — Programming Abstractions</option>
          <option value="PHYS 402">PHYS 402 — Quantum Mechanics II</option>
          <option value="ECON 201">ECON 201 — Macroeconomic Policy</option>
          <option value="NEURO 301">NEURO 301 — Cellular Neuroscience</option>
        </select>
      </div>

      {/* Drag & Drop Well */}
      <div
        className={`uploader-dropzone-well ${isDragging ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="dropzone-giant-icon">
          <UploadCloud size={32} />
        </div>

        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-on-surface)' }}>
            {selectedFile ? selectedFile.name : 'Drop PDF lecture slides or handouts here'}
          </h3>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
            {selectedFile
              ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for text extraction`
              : 'Extracts full slide text, table data, and speaker notes • Up to 100MB'}
          </p>
        </div>

        {!selectedFile && (
          <button
            type="button"
            className="browse-files-btn"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Browse PDF File
          </button>
        )}
      </div>

      {/* Progress & Process Action */}
      {selectedFile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {isProcessing && (
            <div className="progress-card-box" style={{ margin: '0 auto' }}>
              <div className="progress-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 size={14} className="animate-spin" />
                  Extracting Slide Text & Chunking ({progress}%)
                </span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="progress-track-bar">
                <div className="progress-track-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
            <button
              className="btn-secondary-action"
              onClick={() => setSelectedFile(null)}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              className="btn-primary-cta"
              onClick={handleProcess}
              disabled={isProcessing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText size={16} />
                  Process & Index Slides
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfUploader;
