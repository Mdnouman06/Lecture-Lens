/**
 * PyqIntelligenceView
 * Dedicated full-page view for sidebar navigation route 'pyq'.
 * Realizes Google Stitch screen 57fae43921be497dac14f898c05ac626
 * ("Exam Preparation & PYQ Analysis — LectureLens").
 *
 * Truthful & data-driven: displays clean empty state when no papers are analyzed;
 * extracts actual questions, detects multi-year topic recurrence, and hides/shows
 * "Insufficient data" for uncalculated forecast metrics.
 */

import React, { useState, useEffect } from 'react';
import type { PyqPaper, TopicWeight, GroupedQuestionPattern, QuestionOccurrence } from '../types/lecture';
import {
  getPyqPapers,
  uploadPyqPaper,
  getTopicWeightingMatrix,
  deletePyqPaperApi,
  getQuestionPatterns,
} from '../services/api';
import {
  fetchPyqPapers,
  savePyqPaperToDb,
  deletePyqPaperFromDb,
} from '../services/lectures';
import { useAuth } from '../context/AuthContext';
import { PyqBentoBar } from '../components/pyq/PyqBentoBar';
import { PyqPaperArchive } from '../components/pyq/PyqPaperArchive';
import { PyqQuestionPatterns } from '../components/pyq/PyqQuestionPatterns';
import { PyqQuestionInspector } from '../components/pyq/PyqQuestionInspector';
import { PyqTopicWeightMatrix } from '../components/pyq/PyqTopicWeightMatrix';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonCard, SkeletonBlock } from '../components/common/Skeleton';
import {
  Sparkles,
  Upload,
  Calendar,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import '../styles/advanced.css';

interface PyqIntelligenceViewProps {
  onNavigateToLecture?: (lectureId: string, seekSeconds?: number) => void;
}

export const PyqIntelligenceView: React.FC<PyqIntelligenceViewProps> = ({
  onNavigateToLecture,
}) => {
  const { user } = useAuth();
  const [papers, setPapers] = useState<PyqPaper[]>([]);
  const [weights, setWeights] = useState<TopicWeight[]>([]);
  const [patterns, setPatterns] = useState<GroupedQuestionPattern[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        let loadedPapers: PyqPaper[] = [];
        if (user?.id) {
          loadedPapers = await fetchPyqPapers(user.id);
        }

        if (loadedPapers.length > 0) {
          setPapers(loadedPapers);
          setSelectedPaperId(loadedPapers[0].id);
          if (loadedPapers[0].topicWeights && loadedPapers[0].topicWeights.length > 0) {
            setWeights(loadedPapers[0].topicWeights);
          }
          if (loadedPapers[0].questionPatterns && loadedPapers[0].questionPatterns.length > 0) {
            setPatterns(loadedPapers[0].questionPatterns);
          }
        } else {
          // If no papers saved in DB, query API for session papers
          const apiPapers = await getPyqPapers('ALL');
          if (apiPapers && apiPapers.length > 0) {
            setPapers(apiPapers);
            setSelectedPaperId(apiPapers[0].id);
          } else {
            setPapers([]);
            setSelectedPaperId('');
          }
        }

        const weightsData = await getTopicWeightingMatrix('ALL');
        if (weightsData && weightsData.length > 0) {
          setWeights(weightsData);
        } else if (loadedPapers.length === 0) {
          setWeights([]);
        }

        const patternsData = await getQuestionPatterns('ALL');
        if (patternsData && patternsData.length > 0) {
          setPatterns(patternsData);
        } else if (loadedPapers.length > 0 && loadedPapers[0].questionPatterns) {
          setPatterns(loadedPapers[0].questionPatterns);
        } else {
          setPatterns([]);
        }
      } catch (err) {
        console.warn('Error loading PYQ data:', err);
        setPapers([]);
        setWeights([]);
        setPatterns([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user?.id]);

  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const newPaper = await uploadPyqPaper(file, 'General');
      if (user?.id) {
        await savePyqPaperToDb(newPaper, user.id);
      }
      setPapers((prev) => [newPaper, ...prev.filter((p) => p.id !== newPaper.id)]);
      setSelectedPaperId(newPaper.id);
      setSelectedQuestionIndex(0);
      if (newPaper.topicWeights && newPaper.topicWeights.length > 0) {
        setWeights(newPaper.topicWeights);
      } else {
        const refreshedWeights = await getTopicWeightingMatrix('ALL');
        if (refreshedWeights && refreshedWeights.length > 0) {
          setWeights(refreshedWeights);
        }
      }
      if (newPaper.questionPatterns && newPaper.questionPatterns.length > 0) {
        setPatterns(newPaper.questionPatterns);
      } else {
        const refreshedPatterns = await getQuestionPatterns('ALL');
        if (refreshedPatterns && refreshedPatterns.length > 0) {
          setPatterns(refreshedPatterns);
        }
      }
      setUploadSuccess(`Successfully extracted ${newPaper.extractedCount} questions from ${newPaper.title}.`);
    } catch (err: any) {
      console.error('Failed to upload PYQ paper:', err);
      setUploadError(err?.message || 'Failed to parse exam paper PDF. Please ensure the file is a readable PDF.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (user?.id) {
      await deletePyqPaperFromDb(paperId, user.id);
    }
    await deletePyqPaperApi(paperId);
    setPapers((prev) => {
      const remaining = prev.filter((p) => p.id !== paperId);
      if (selectedPaperId === paperId && remaining.length > 0) {
        setSelectedPaperId(remaining[0].id);
        setSelectedQuestionIndex(0);
      }
      return remaining;
    });
    const refreshedWeights = await getTopicWeightingMatrix('ALL');
    setWeights(refreshedWeights);
    const refreshedPatterns = await getQuestionPatterns('ALL');
    setPatterns(refreshedPatterns || []);
  };

  // Filter papers based on selectedYear
  const filteredPapers = papers.filter((paper) => {
    if (selectedYear === 'all') return true;
    if (selectedYear === 'drills') return paper.examType === 'mock';
    const paperYear = String(paper.year || '');
    const paperYears = (paper.years || []).map(String);
    const questionYears = (paper.questions || []).map((q) => String(q.year || ''));
    const recurrenceYears = (paper.questions || []).flatMap((q) => (q.recurrenceYears || []).map(String));
    return (
      paperYear === selectedYear ||
      paperYears.includes(selectedYear) ||
      questionYears.includes(selectedYear) ||
      recurrenceYears.includes(selectedYear)
    );
  });

  // Selected paper
  const currentPaper =
    papers.find((p) => p.id === selectedPaperId) ||
    filteredPapers[0] ||
    papers[0];

  // Derive questions partitioned by selectedYear
  const allPaperQuestions = currentPaper?.questions || [];
  const currentQuestions =
    selectedYear === 'all'
      ? allPaperQuestions
      : allPaperQuestions.filter((q) => String(q.year) === selectedYear);

  const primaryQuestion =
    currentQuestions[selectedQuestionIndex] ||
    currentQuestions[0] ||
    null;

  // Derived recurring question patterns (Level B)
  const activePatterns =
    patterns.length > 0
      ? patterns
      : (currentPaper?.questionPatterns || []);

  const handleSelectOccurrence = (occurrence: QuestionOccurrence) => {
    if (occurrence.paperId && occurrence.paperId !== selectedPaperId) {
      setSelectedPaperId(occurrence.paperId);
    }

    if (selectedYear !== 'all' && occurrence.year && String(occurrence.year) !== selectedYear) {
      setSelectedYear('all');
    }

    const targetPaper = occurrence.paperId
      ? papers.find((p) => p.id === occurrence.paperId) || currentPaper
      : currentPaper;
    const questionsToSearch = targetPaper?.questions || allPaperQuestions;

    const targetIdx = questionsToSearch.findIndex((q) => {
      if (occurrence.questionId && (q.id === occurrence.questionId || (q as any).questionId === occurrence.questionId)) {
        return true;
      }
      if (occurrence.year && q.year && String(q.year) === String(occurrence.year)) {
        if (q.questionNumber === occurrence.questionNumber || q.rawNumber === occurrence.questionNumber) {
          return true;
        }
      }
      return q.questionNumber === occurrence.questionNumber;
    });

    if (targetIdx >= 0) {
      setSelectedQuestionIndex(targetIdx);
    }

    setTimeout(() => {
      const inspectorEl = document.getElementById('pyq-question-inspector');
      if (inspectorEl) {
        inspectorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const totalQuestionsCount = papers.reduce(
    (sum, p) => sum + (p.extractedCount || p.questions?.length || 0),
    0
  );
  const recurringHotspotsCount = weights.filter(
    (w) =>
      (w.recurrenceYears && w.recurrenceYears.length >= 2) ||
      (w.years && w.years.length >= 2) ||
      (w.appearances && w.appearances >= 2) ||
      w.category === 'critical' ||
      w.category === 'recurring'
  ).length;

  const handleRunSimulation = () => {
    setSimulationActive(true);
    setTimeout(() => {
      setSimulationActive(false);
    }, 1800);
  };

  return (
    <div className="pyq-container">
      {/* View Header */}
      <div className="adv-view-header">
        <div className="adv-header-left">
          <div className="adv-breadcrumb">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <img
                src="/leclens.jpg"
                alt="LectureLens"
                style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'contain' }}
              />
              <span style={{ fontWeight: 600 }}>LectureLens</span>
            </span>
            <span>/</span>
            <span>Course Intelligence</span>
            <span>/</span>
            <span>Exam Vault</span>
            <div className="adv-breadcrumb-badge">
              <Calendar size={12} strokeWidth={2} />
              Upcoming Assessment Preparation
            </div>
          </div>
          <h1 className="adv-view-title">Exam Preparation & PYQ Intelligence</h1>
          <p className="adv-view-subtitle">
            Historical examination papers, recurring topic question archetypes, and grading rubrics.
          </p>
        </div>

        <div className="adv-header-actions">
          <button
            type="button"
            className="adv-btn-secondary"
            onClick={handleRunSimulation}
            disabled={simulationActive || papers.length === 0}
          >
            <Sparkles size={16} color="#4f46e5" strokeWidth={1.5} />
            {simulationActive ? 'Simulating Exam Coverage...' : 'Run Predictive Simulation'}
          </button>

          <label
            className="adv-btn-primary"
            style={{ cursor: 'pointer', margin: 0 }}
          >
            <Upload size={16} strokeWidth={1.5} />
            {isUploading ? 'Extracting Questions...' : 'Import PYQ Paper'}
            <input
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              disabled={isUploading}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleUploadFile(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Notifications: Success or Error */}
      {uploadSuccess && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} color="#059669" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} color="#dc2626" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Simulation Feedback Alert */}
      {simulationActive && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)',
            border: '1px solid #c7d2fe',
            color: '#3730a3',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <FileCheck2 size={18} strokeWidth={1.5} color="#4f46e5" />
          <span>
            Exam simulation complete across {papers.length} paper{papers.length === 1 ? '' : 's'}:{' '}
            {weights.length} core topic archetypes analyzed. Top frequency:{' '}
            {weights[0]?.name || 'Core topics'}.
          </span>
        </div>
      )}

      {/* Main Content: Loading Skeletons vs Empty State vs Loaded Papers Dashboard */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SkeletonBlock height="90px" borderRadius="var(--radius-xl)" />
          <div style={{ display: 'grid', gridTemplateColumns: '8fr 4fr', gap: '24px' }}>
            <SkeletonCard height="380px" />
            <SkeletonCard height="380px" />
          </div>
        </div>
      ) : papers.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No PYQ papers analyzed yet"
          description="Upload a previous-year question paper to extract questions, detect recurring topics, and analyze exam patterns."
          badgeText="Exam Intelligence"
        >
          <div style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
            <label className="btn-primary-cta" style={{ cursor: 'pointer', margin: 0 }}>
              <Upload size={16} strokeWidth={1.5} />
              <span>Import PYQ Paper</span>
              <input
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadFile(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        </EmptyState>
      ) : (
        <>
          {/* Bento Metrics Bar: Rendered ONLY when actual papers exist, with truthful metrics */}
          <PyqBentoBar
            predictedScore={undefined} // Insufficient data until practice drills completed
            predictedGrade={undefined}
            confidencePercent={undefined}
            masteredCount={0}
            totalPyqCount={totalQuestionsCount}
            highYieldHotspots={recurringHotspotsCount}
            syllabusAlignmentPercent={currentPaper?.syllabusMatchPercent ?? undefined}
          />

          <div className="pyq-split-grid">
            <div className="pyq-col-left">
              <PyqPaperArchive
                papers={filteredPapers}
                allPapers={papers}
                selectedYear={selectedYear}
                onSelectYear={setSelectedYear}
                selectedPaperId={selectedPaperId}
                onSelectPaper={(id) => {
                  setSelectedPaperId(id);
                  setSelectedQuestionIndex(0);
                }}
                onUploadFile={handleUploadFile}
                onDeletePaper={handleDeletePaper}
                isUploading={isUploading}
              />

              <PyqQuestionPatterns
                patterns={activePatterns}
                onSelectOccurrence={handleSelectOccurrence}
                selectedYear={selectedYear}
              />

              {primaryQuestion && (
                <PyqQuestionInspector
                  question={primaryQuestion}
                  allQuestions={currentQuestions}
                  selectedIndex={selectedQuestionIndex}
                  onSelectIndex={setSelectedQuestionIndex}
                  onJumpToLecture={onNavigateToLecture}
                />
              )}
            </div>

            <div className="pyq-col-right">
              <PyqTopicWeightMatrix
                weights={weights}
                coveragePercent={currentPaper?.syllabusMatchPercent ?? undefined}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
