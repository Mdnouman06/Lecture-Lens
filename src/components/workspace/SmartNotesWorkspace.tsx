import React, { useState, useEffect } from 'react';
import {
  Edit3,
  Check,
  PlusCircle,
  Save,
} from 'lucide-react';
import type { Lecture, StudyNotes } from '../../types/lecture';
import { ExecutiveNotesTab } from './ExecutiveNotesTab';
import { StructuredNotesTab } from './StructuredNotesTab';
import { KeyConceptsTab } from './KeyConceptsTab';
import { SlideArtifactsTab } from './SlideArtifactsTab';

interface SmartNotesWorkspaceProps {
  notes: StudyNotes;
  lecture?: Lecture;
  onSeek: (seconds: number) => void;
  onSaveNotes?: (updatedNotes: StudyNotes, marginNotes: string) => void;
  saveStatus?: 'idle' | 'saving' | 'saved';
  isSaving?: boolean;
}

type TabType = 'executive' | 'derivations' | 'takeaways' | 'artifacts';

export const SmartNotesWorkspace: React.FC<SmartNotesWorkspaceProps> = ({
  notes,
  lecture,
  onSeek,
  onSaveNotes,
  saveStatus = 'idle',
  isSaving = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('executive');
  const [isEditing, setIsEditing] = useState(false);
  const [editableMarkdown, setEditableMarkdown] = useState(notes.markdown);
  const [marginNotes, setMarginNotes] = useState(notes.marginNotes || '');
  const [activeHighlightColor, setActiveHighlightColor] = useState<string>('#006591');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Synchronize internal editor state whenever parent notes object updates
  useEffect(() => {
    setEditableMarkdown(notes.markdown);
  }, [notes.markdown]);

  useEffect(() => {
    setMarginNotes(notes.marginNotes || '');
  }, [notes.marginNotes]);

  const handleSaveEdit = () => {
    setIsEditing(false);
    const updated: StudyNotes = {
      ...notes,
      markdown: editableMarkdown,
      marginNotes,
    };
    if (onSaveNotes) {
      onSaveNotes(updated, marginNotes);
    }
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleMarginNotesBlur = () => {
    if (marginNotes !== (notes.marginNotes || '')) {
      const updated: StudyNotes = {
        ...notes,
        markdown: editableMarkdown,
        marginNotes,
      };
      if (onSaveNotes) {
        onSaveNotes(updated, marginNotes);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  return (
    <div className="smart-notes-card" role="region" aria-label="Smart Notes Editor">
      {/* Header Ribbon: Tab Switcher + Highlight Palette + Inline Edit Toggle */}
      <div className="notes-tab-ribbon">
        {/* Segmented Tab Navigation */}
        <div className="notes-segmented-tabs" role="tablist">
          <button
            className={`notes-tab-btn ${activeTab === 'executive' ? 'active' : ''}`}
            onClick={() => setActiveTab('executive')}
            role="tab"
            aria-selected={activeTab === 'executive'}
          >
            Executive Notes
          </button>
          <button
            className={`notes-tab-btn ${activeTab === 'derivations' ? 'active' : ''}`}
            onClick={() => setActiveTab('derivations')}
            role="tab"
            aria-selected={activeTab === 'derivations'}
          >
            Derivations
          </button>
          <button
            className={`notes-tab-btn ${activeTab === 'takeaways' ? 'active' : ''}`}
            onClick={() => setActiveTab('takeaways')}
            role="tab"
            aria-selected={activeTab === 'takeaways'}
          >
            Takeaways ({notes.keyConcepts.length})
          </button>
          <button
            className={`notes-tab-btn ${activeTab === 'artifacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('artifacts')}
            role="tab"
            aria-selected={activeTab === 'artifacts'}
          >
            Artifacts
          </button>
        </div>

        {/* Tools Cluster: Save Pill, Highlighter Dots & Edit Toggle */}
        <div className="notes-tools-cluster">
          {/* Cloud Save Status Indicator */}
          {saveStatus === 'saving' && (
            <span className="notes-save-pill saving" title="Saving changes to cloud">
              <span className="status-dot connected" style={{ width: '6px', height: '6px' }} />
              <span>Saving...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="notes-save-pill saved" title="Notes safely synced to Supabase">
              <Check size={12} />
              <span>Saved</span>
            </span>
          )}

          {/* Highlight Palette */}
          <div className="highlight-palette-pill" title="Highlight color palette">
            <span
              className="palette-dot"
              style={{
                background: '#006591',
                transform: activeHighlightColor === '#006591' ? 'scale(1.25)' : 'scale(1)',
                border: activeHighlightColor === '#006591' ? '2px solid #ffffff' : 'none',
              }}
              onClick={() => setActiveHighlightColor('#006591')}
              title="Highlight Teal"
            />
            <span
              className="palette-dot"
              style={{
                background: '#c3c0ff',
                transform: activeHighlightColor === '#c3c0ff' ? 'scale(1.25)' : 'scale(1)',
                border: activeHighlightColor === '#c3c0ff' ? '2px solid #ffffff' : 'none',
              }}
              onClick={() => setActiveHighlightColor('#c3c0ff')}
              title="Highlight Lavender"
            />
            <span
              className="palette-dot"
              style={{
                background: '#4edea3',
                transform: activeHighlightColor === '#4edea3' ? 'scale(1.25)' : 'scale(1)',
                border: activeHighlightColor === '#4edea3' ? '2px solid #ffffff' : 'none',
              }}
              onClick={() => setActiveHighlightColor('#4edea3')}
              title="Highlight Mint"
            />
          </div>

          {/* Inline Edit Toggle */}
          <button
            className="btn-secondary-action"
            onClick={isEditing ? handleSaveEdit : () => setIsEditing(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '12px' }}
            title={isEditing ? 'Save Markdown edits (Ctrl+S)' : 'Edit raw study notes in Markdown'}
            disabled={isSaving}
          >
            {isEditing ? (
              <>
                <Save size={13} color="var(--color-primary-container)" />
                <span>{isSaving ? 'Saving...' : 'Save Notes'}</span>
              </>
            ) : isSavedNotice || saveStatus === 'saved' ? (
              <>
                <Check size={13} color="#10b981" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Edit3 size={13} />
                <span>Edit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content OR Markdown Editor */}
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>
            <span>Editing Lecture Notes in Markdown format</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>Ctrl+S / ⌘S to save • Markdown & equations</span>
          </div>

          <textarea
            className="notes-markdown-textarea"
            value={editableMarkdown}
            onChange={(e) => setEditableMarkdown(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write or edit lecture notes in Markdown..."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
            <button
              className="btn-secondary-action"
              onClick={() => {
                setEditableMarkdown(notes.markdown);
                setIsEditing(false);
              }}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button className="btn-primary-cta" onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save & Render'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'executive' && (
            <ExecutiveNotesTab notes={notes} onSeek={onSeek} />
          )}
          {activeTab === 'derivations' && (
            <StructuredNotesTab notes={notes} onSeek={onSeek} />
          )}
          {activeTab === 'takeaways' && (
            <KeyConceptsTab concepts={notes.keyConcepts} onSeek={onSeek} />
          )}
          {activeTab === 'artifacts' && (
            <SlideArtifactsTab lecture={lecture} notes={notes} />
          )}
        </>
      )}

      {/* Student Personal Margin Notes Section */}
      <div
        style={{
          marginTop: 'var(--space-md)',
          paddingTop: 'var(--space-md)',
          borderTop: '1px dashed var(--color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)' }}>
            <PlusCircle size={15} color="var(--color-primary-container)" />
            <span>Personal Margin Notes & Audio Memos</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-outline)', background: 'var(--color-surface-container)', padding: '2px 6px', borderRadius: '4px' }}>
            Auto-saves to cloud on blur
          </span>
        </div>

        <textarea
          value={marginNotes}
          onChange={(e) => setMarginNotes(e.target.value)}
          onBlur={handleMarginNotesBlur}
          placeholder="Type quick thoughts, questions for office hours, or memory hooks for this lecture..."
          style={{
            width: '100%',
            minHeight: '68px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface-container-low)',
            border: '1px solid var(--color-outline-variant)',
            fontSize: 'var(--text-label)',
            color: 'var(--color-on-surface)',
            resize: 'vertical',
            fontFamily: 'var(--font-body)',
          }}
        />
      </div>
    </div>
  );
};

export default SmartNotesWorkspace;
