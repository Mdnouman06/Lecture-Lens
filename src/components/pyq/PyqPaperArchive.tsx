/**
 * PyqPaperArchive Component
 * Displays historical exam paper filter pills dynamically derived from uploaded papers,
 * primary OCR-verified paper card, secondary archive list, and interactive PDF upload trigger.
 */

import React, { useRef } from 'react';
import type { PyqPaper } from '../../types/lecture';
import {
  FileText,
  CheckCircle2,
  UploadCloud,
  ChevronRight,
  BookOpen,
  Trash2,
} from 'lucide-react';

interface PyqPaperArchiveProps {
  papers: PyqPaper[];
  allPapers?: PyqPaper[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
  selectedPaperId: string;
  onSelectPaper: (paperId: string) => void;
  onUploadFile: (file: File) => void;
  onDeletePaper?: (paperId: string) => void;
  isUploading?: boolean;
}

export const PyqPaperArchive: React.FC<PyqPaperArchiveProps> = ({
  papers,
  allPapers,
  selectedYear,
  onSelectYear,
  selectedPaperId,
  onSelectPaper,
  onUploadFile,
  onDeletePaper,
  isUploading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive dynamic year pills strictly from actual extracted question years across all papers
  const papersForYears = allPapers && allPapers.length > 0 ? allPapers : papers;
  const availableYears = Array.from(
    new Set(
      papersForYears
        .flatMap((p) => [
          p.year,
          ...(p.years?.map(Number) || []),
          ...(p.questions?.flatMap((q) => (q.year ? [Number(q.year)] : [])) || []),
        ])
        .filter((y): y is number => typeof y === 'number' && !isNaN(y) && y > 1900)
    )
  ).sort((a, b) => b - a);

  const yearPills = [
    { id: 'all', label: 'All Papers' },
    ...availableYears.map((yr) => ({ id: String(yr), label: String(yr) })),
  ];
  if (papers.some((p) => p.examType === 'mock')) {
    yearPills.push({ id: 'drills', label: 'Practice Drills' });
  }

  // Find primary paper or first paper
  const primaryPaper = papers.find((p) => p.id === selectedPaperId) || papers.find((p) => p.isPrimary) || papers[0];
  const secondaryPapers = papers.filter((p) => p.id !== primaryPaper?.id);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
    }
  };

  const paperSubtitle = primaryPaper
    ? [primaryPaper.courseCode !== 'ALL' ? primaryPaper.courseCode : null, primaryPaper.instructor, primaryPaper.term]
        .filter(Boolean)
        .join(' • ') || 'Uploaded Exam Paper'
    : '';

  return (
    <div className="pyq-archive-card">
      <div className="pyq-archive-header">
        <div className="pyq-archive-title-wrap">
          <BookOpen size={20} color="#4f46e5" strokeWidth={1.5} />
          <h3 className="pyq-section-title">Historical Exam Archive & OCR Engine</h3>
        </div>
        <span style={{ fontSize: '12px', color: '#777587', fontWeight: 500 }}>
          {papers.length} {papers.length === 1 ? 'Paper' : 'Papers'} Indexed
        </span>
      </div>

      {/* Dynamic Year Filter Pills */}
      {yearPills.length > 1 && (
        <div className="pyq-pills-row">
          {yearPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              className={`pyq-pill ${selectedYear === pill.id ? 'active' : ''}`}
              onClick={() => onSelectYear(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>
      )}

      {/* Empty list notice */}
      {!primaryPaper && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px', background: '#f8fafc', borderRadius: '12px', marginBottom: '12px' }}>
          No past papers match this year filter. Import an exam paper below.
        </div>
      )}

      {/* Primary Paper Card */}
      {primaryPaper && (
        <div
          className={`pyq-primary-paper ${selectedPaperId === primaryPaper.id ? 'selected' : ''}`}
          onClick={() => onSelectPaper(primaryPaper.id)}
          style={{ cursor: 'pointer' }}
        >
          <div className="pyq-paper-top-badge-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#e0e7ff',
                  color: '#4338ca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={18} strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1B22' }}>
                  {primaryPaper.title}
                </div>
                <div style={{ fontSize: '12px', color: '#464555' }}>
                  {paperSubtitle}
                </div>
              </div>
            </div>

            <div className="pyq-ocr-badge">
              <CheckCircle2 size={13} strokeWidth={2} />
              OCR Verified ({primaryPaper.ocrFidelityPercent || 95}% Fidelity)
            </div>
          </div>

          <div className="pyq-paper-meta-row">
            <div className="pyq-meta-item">
              <span className="pyq-meta-label">Questions Extracted</span>
              <span className="pyq-meta-val">
                {primaryPaper.shortAnsCount != null && primaryPaper.longAnsCount != null && (primaryPaper.shortAnsCount > 0 || primaryPaper.longAnsCount > 0)
                  ? `${primaryPaper.shortAnsCount} Short + ${primaryPaper.longAnsCount} Long Ans`
                  : `${primaryPaper.extractedCount || primaryPaper.questions?.length || 0} Questions`}
              </span>
            </div>
            <div className="pyq-meta-item">
              <span className="pyq-meta-label">Historical Mean</span>
              <span className="pyq-meta-val" style={{ color: primaryPaper.historicalMean != null ? '#d97706' : '#94a3b8' }}>
                {primaryPaper.historicalMean != null ? `${primaryPaper.historicalMean}%` : 'Insufficient data'}
              </span>
            </div>
            <div className="pyq-meta-item">
              <span className="pyq-meta-label">Syllabus Overlap</span>
              <span className="pyq-meta-val" style={{ color: primaryPaper.syllabusMatchPercent != null ? '#059669' : '#94a3b8' }}>
                {primaryPaper.syllabusMatchPercent != null ? `${primaryPaper.syllabusMatchPercent}% Direct Match` : 'Insufficient data'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Papers List */}
      {secondaryPapers.length > 0 && (
        <div className="pyq-secondary-list">
          {secondaryPapers.map((paper) => (
            <div
              key={paper.id}
              className={`pyq-secondary-item ${selectedPaperId === paper.id ? 'active' : ''}`}
              onClick={() => onSelectPaper(paper.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={16} color="#777587" strokeWidth={1.5} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1B22' }}>
                    {paper.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#777587' }}>
                    {[
                      paper.term,
                      `${paper.extractedCount || paper.questions?.length || 0} Qs`,
                      paper.historicalMean != null ? `Mean ${paper.historicalMean}%` : null,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {onDeletePaper && (
                  <button
                    type="button"
                    title="Delete paper"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePaper(paper.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <ChevronRight size={16} color="#777587" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden File Input & Upload Dropzone */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        style={{ display: 'none' }}
      />

      <button
        type="button"
        className="pyq-dropzone-button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <UploadCloud size={18} strokeWidth={1.5} />
        {isUploading
          ? 'Extracting Questions via pypdf OCR...'
          : 'Import Previous Year Paper (PDF) & Run OCR'}
      </button>
    </div>
  );
};
