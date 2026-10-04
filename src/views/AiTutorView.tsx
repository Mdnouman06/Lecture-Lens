import React, { useState } from 'react';
import {
  Brain,
  Search,
  RotateCcw,
  Download,
  Check,
  FileText,
  Play,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import type {
  KnowledgeScope,
  TutorMessage,
  SearchResult,
} from '../types/lecture';
import type { ActiveView } from '../types/navigation';
import { KnowledgeScopeFilter } from '../components/tutor/KnowledgeScopeFilter';
import { RecentQueriesList } from '../components/tutor/RecentQueriesList';
import { VectorCorpusStatus } from '../components/tutor/VectorCorpusStatus';
import { TutorDialogueStream } from '../components/tutor/TutorDialogueStream';
import { TutorInputDeck } from '../components/tutor/TutorInputDeck';
import { askAiTutor, searchLectureCorpus } from '../services/api';
import '../styles/tutor.css';

interface AiTutorViewProps {
  onNavigateToLecture?: (lectureId: string, seekSeconds?: number) => void;
  onNavigate?: (view: ActiveView) => void;
}

export const AiTutorView: React.FC<AiTutorViewProps> = ({
  onNavigateToLecture,
  onNavigate,
}) => {
  const [activeMode, setActiveMode] = useState<'tutor' | 'search'>('tutor');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Scope filter state
  const [scope, setScope] = useState<KnowledgeScope>({
    enrolledCourses: true,
    neuro301Transcripts: true,
    phys402Formulas: true,
    pastExamRubrics: true,
  });

  // Flagship default conversation thread matching Stitch screen 94b81da265c04d268fbca4274f1ce534
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: 'msg-01',
      sender: 'user',
      text: 'Can you explain the exact mechanism of why NMDA receptors act as molecular coincidence detectors, and link me to where Prof. Henderson explained this?',
      timestamp: '10:42 AM',
    },
    {
      id: 'msg-02',
      sender: 'assistant',
      text: 'The **N-methyl-D-aspartate (NMDA) receptor** functions as a biological *coincidence detector* because its channel pore cannot conduct Ca²⁺ ions unless two independent, physiological prerequisites occur simultaneously:\n\nWithout simultaneous depolarization, glutamate binds in vain because extracellular magnesium remains plugged deep inside the channel pore. This strict dual-gate requirement forms the biophysical foundation of **Hebb\'s Postulate** ("cells that fire together, wire together").',
      timestamp: '10:42 AM',
      topicBadge: 'Cellular Neurobiology',
      latencyMs: 1400,
      sequenceSteps: [
        {
          stepNumber: 1,
          title: '1. Presynaptic',
          description:
            'Action potential triggers **glutamate release** across the synaptic cleft, binding to the receptor\'s GluN2 subunit.',
          iconType: 'presynaptic',
        },
        {
          stepNumber: 2,
          title: '2. Postsynaptic',
          description:
            'AMPA receptor activation depolarizes the post-synaptic dendritic spine to roughly **-30 mV**.',
          iconType: 'postsynaptic',
        },
        {
          stepNumber: 3,
          title: '3. Coincidence',
          description:
            'Depolarization electrostatically expels the **Mg²⁺ block** from the channel pore, permitting massive Ca²⁺ influx.',
          iconType: 'coincidence',
        },
      ],
      citations: [
        {
          id: 'cit-01',
          sourceType: 'audio',
          sourceTitle: 'NEURO 301 • Lec 14',
          timeStart: 252,
          timeEnd: 298,
          timecodeDisplay: '04:12 - 04:58',
          quote:
            '...remember, the magnesium doesn\'t leave just because glutamate is there. You need that back-propagating spine depolarization...',
          relevanceScore: 0.98,
        },
        {
          id: 'cit-02',
          sourceType: 'pdf',
          sourceTitle: 'Principles of Neural Science (6th Ed.)',
          pageNumber: 'Ch. 67 • p. 1422',
          quote:
            'Figure 67-4: Current-voltage (I-V) relationship illustrating unblocking of NMDA channel pores at positive membrane potentials.',
          relevanceScore: 0.98,
        },
      ],
      examAlert: {
        title: 'High-Yield Past Exam Alert (PYQ)',
        description:
          'This exact molecular mechanism appeared in Question 3B of the 2023 Midterm ("Explain how Mg²⁺ block removal facilitates LTP"). Average cohort score was only 68% due to students missing the simultaneous membrane depolarization step.',
        passRate: '68%',
      },
      followUps: [
        'Generate 3 Flashcards on this',
        'Test me with a hard MCQ',
        'Add to Midterm Review Sheet',
      ],
    },
  ]);

  const handleSendPrompt = async (userPrompt: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: TutorMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userPrompt,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      const response = await askAiTutor({
        question: userPrompt,
        scope,
      });

      const aiMsg: TutorMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: timeStr,
        topicBadge: response.topicBadge,
        latencyMs: response.latencyMs,
        sequenceSteps: response.sequenceSteps,
        citations: response.citations,
        examAlert: response.examAlert,
        followUps: response.followUps,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg = err?.message || 'Local engine is offline. Switched to offline lecture intelligence cache.';
      const isTimeout = errMsg.toLowerCase().includes('timed out') || errMsg.toLowerCase().includes('timeout');
      const text = isTimeout
        ? 'Tutor request timed out after 5 minutes (300 seconds). Local Ollama may be busy or generating slowly.'
        : errMsg.toLowerCase().includes('offline') || errMsg.toLowerCase().includes('cannot reach')
        ? 'Local engine is offline. Switched to offline lecture intelligence cache.'
        : errMsg;
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text,
          timestamp: timeStr,
          topicBadge: isTimeout ? 'Request Timed Out' : 'Diagnostic Alert',
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunSearch = async (queryText: string) => {
    setSearchQuery(queryText);
    setIsSearching(true);
    try {
      const results = await searchLectureCorpus(queryText, scope);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectRecentQuery = (queryText: string) => {
    if (activeMode === 'search') {
      handleRunSearch(queryText);
    } else {
      handleSendPrompt(queryText);
    }
  };

  const handleCitationSeek = (seconds: number) => {
    if (onNavigateToLecture) {
      onNavigateToLecture('lec-1', seconds);
    } else if (onNavigate) {
      onNavigate('workspace');
    }
  };

  const handleExportConversation = () => {
    const dialogueText = messages
      .map((m) => `[${m.sender.toUpperCase()} - ${m.timestamp}]\n${m.text}\n`)
      .join('\n---\n\n');

    const blob = new Blob([dialogueText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecturelens-tutor-session-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    setExportNotice('Session exported!');
    setTimeout(() => setExportNotice(null), 2500);
  };

  return (
    <div className="ai-tutor-page-container">
      {/* 1. Header Banner & Mode Switcher */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '24px',
          flexWrap: 'wrap',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '800px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--color-primary-container, #4F46E5)',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-on-surface-variant)',
              }}
            >
              Neural Retrieval Engine • Active Vault
            </span>
          </div>

          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: 'var(--color-on-surface)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            AI Tutor & Cross-Semester Semantic Search
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--color-on-surface-variant)',
                padding: '2px 8px',
                background: 'var(--color-surface-container-high)',
                borderRadius: '6px',
              }}
            >
              ⌘K
            </span>
          </h1>

          <p style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)', margin: 0 }}>
            Contextual multimodal intelligence referencing audio transcripts, textbook PDFs, slides, and past exams across your study vault.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div
          style={{
            background: 'var(--color-surface-container-high, #E8E7F1)',
            padding: '4px',
            borderRadius: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveMode('tutor')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeMode === 'tutor' ? '#FFFFFF' : 'transparent',
              color: activeMode === 'tutor' ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
              boxShadow: activeMode === 'tutor' ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Brain
              size={16}
              style={{ color: activeMode === 'tutor' ? 'var(--color-primary)' : 'inherit' }}
            />
            <span>Tutor Dialogue Mode</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('search');
              if (searchResults.length === 0) {
                handleRunSearch('NMDA receptor calcium conductance');
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeMode === 'search' ? '#FFFFFF' : 'transparent',
              color: activeMode === 'search' ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
              boxShadow: activeMode === 'search' ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Search
              size={16}
              style={{ color: activeMode === 'search' ? 'var(--color-primary)' : 'inherit' }}
            />
            <span>Deep Semantic Search</span>
          </button>
        </div>
      </div>

      {/* 2. 12-Column Responsive Layout */}
      <div className="ai-tutor-main-grid">
        {/* Left Column: Scope, Queries, Corpus */}
        <div className="ai-tutor-sidebar-col">
          <KnowledgeScopeFilter scope={scope} onChangeScope={setScope} />
          <RecentQueriesList onSelectQuery={handleSelectRecentQuery} />
          <VectorCorpusStatus />
        </div>

        {/* Right Column: Main Intelligence Panel */}
        <div className="ai-tutor-content-col">
          {activeMode === 'tutor' ? (
            /* Dialogue Mode Panel */
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
                border: '1px solid rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Dialogue Header */}
              <div
                style={{
                  padding: '16px 22px',
                  borderBottom: '1px solid var(--color-surface-container-high)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src="/leclens.jpg"
                    alt="LectureLens Intelligence"
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      objectFit: 'contain',
                      boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                        LectureLens Intelligence
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(79, 70, 229, 0.1)',
                          color: 'var(--color-primary)',
                        }}
                      >
                        v2.5 High Reasoning
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}>
                      Active ground truth: Henderson Audio + Kandel Neuro 6e
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    className="icon-action-btn"
                    onClick={() => setMessages([])}
                    title="Clear session"
                  >
                    <RotateCcw size={16} />
                  </button>

                  <button
                    type="button"
                    className="icon-action-btn"
                    onClick={handleExportConversation}
                    title="Export session"
                  >
                    {exportNotice ? <Check size={16} color="#10b981" /> : <Download size={16} />}
                  </button>
                </div>
              </div>

              {/* Dialogue Scroll Stream */}
              <div style={{ padding: '20px 22px', minHeight: '380px' }}>
                <TutorDialogueStream
                  messages={messages}
                  isGenerating={isGenerating}
                  onSeekAudio={handleCitationSeek}
                  onOpenTranscript={handleCitationSeek}
                  onFollowUpClick={handleSendPrompt}
                />
              </div>

              {/* Sticky Floating Input Deck */}
              <TutorInputDeck onSend={handleSendPrompt} isGenerating={isGenerating} />
            </div>
          ) : (
            /* Deep Semantic Search Mode Panel */
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
                border: '1px solid rgba(0, 0, 0, 0.04)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* Search Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--color-surface-container-low, #F4F2FD)',
                    borderRadius: '14px',
                    padding: '8px 16px',
                    border: '1px solid rgba(79, 70, 229, 0.15)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <Search size={18} style={{ color: 'var(--color-primary)', marginRight: '10px' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRunSearch(searchQuery);
                    }}
                    placeholder="Search across indexed audio transcripts, equations, and past exam rubrics..."
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                      color: 'var(--color-on-surface)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRunSearch(searchQuery)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: 'var(--color-primary, #3525CD)',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Search
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>
                    {isSearching
                      ? 'Vectorizing query across 2,410 pages...'
                      : `Found ${searchResults.length} verified semantic passages`}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--color-primary)' }}>
                    HNSW Cosine Similarity &gt; 0.88
                  </span>
                </div>
              </div>

              {/* Search Results List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    style={{
                      background: 'var(--color-surface-container-low, #F4F2FD)',
                      borderRadius: '14px',
                      padding: '16px',
                      border: '1px solid rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleCitationSeek(252)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background:
                              result.sourceType === 'pyq'
                                ? 'var(--color-primary-fixed)'
                                : 'var(--color-surface-container-high)',
                            color:
                              result.sourceType === 'pyq'
                                ? 'var(--color-primary)'
                                : 'var(--color-on-surface-variant)',
                          }}
                        >
                          {result.courseCode} • {result.sourceType.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                          {result.title}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-tertiary, #005338)',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>{Math.round(result.relevance * 100)}% match</span>
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--color-on-surface-variant)', margin: 0 }}>
                      "{result.snippet}"
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '11px',
                          color: 'var(--color-on-surface-variant)',
                        }}
                      >
                        {result.timecode}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {result.sourceType === 'audio' ? (
                          <button
                            type="button"
                            className="listen-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCitationSeek(252);
                            }}
                          >
                            <Play size={12} fill="currentColor" />
                            <span>Listen to clip</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="listen-btn"
                            style={{ background: 'var(--color-surface-container-high)', color: 'var(--color-on-surface)' }}
                          >
                            <FileText size={12} />
                            <span>View Source</span>
                          </button>
                        )}
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--color-primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          Open Lecture <ExternalLink size={12} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiTutorView;
