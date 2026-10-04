/**
 * Academic Export Utilities for LectureLens
 * 
 * Provides verified multi-format export generators for:
 * 1. Diarized plain text transcripts (.txt)
 * 2. Academic structured study notes (.md) with YAML frontmatter
 * 3. Anki-compatible flashcard decks (.tsv)
 * 4. Client-side browser download helper
 */

import type { TranscriptSegment, StudyNotes, Flashcard, FlashcardItem } from '../types/lecture';

/**
 * Format raw seconds to MM:SS string
 */
export function formatSecondsToTime(secs: number): string {
  const m = Math.floor(Math.max(0, secs) / 60);
  const s = Math.floor(Math.max(0, secs) % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Generates an academic plain text transcript with header metadata and timestamped turns
 */
export function exportTranscriptAsTxt(
  title: string,
  courseCode: string,
  segments: TranscriptSegment[]
): string {
  const safeTitle = title.trim() || 'Untitled Lecture';
  const safeCourse = courseCode.trim() || 'ACAD';
  const exportDate = new Date().toISOString();
  const totalCount = segments.length;

  const header = [
    '======================================================================',
    `LECTURELENS TRANSCRIPT: ${safeCourse} - ${safeTitle}`,
    `Exported: ${exportDate} | Total Segments: ${totalCount}`,
    '======================================================================',
    '',
  ].join('\n');

  if (segments.length === 0) {
    return header + '\n[No spoken transcript segments recorded for this lecture]\n';
  }

  const body = segments
    .map((seg) => {
      const start = formatSecondsToTime(seg.startSeconds);
      const end = formatSecondsToTime(seg.endSeconds);
      const speaker = seg.speaker || 'Speaker 1';
      const text = seg.text ? seg.text.trim() : '';
      return `[${start} - ${end}] ${speaker}:\n${text}\n`;
    })
    .join('\n');

  return header + body;
}

/**
 * Generates an academic Markdown document with YAML frontmatter, executive summary,
 * key concepts table, formulas/derivations, and actionable exam takeaways.
 */
export function exportNotesAsMarkdown(
  title: string,
  courseCode: string,
  notes: StudyNotes
): string {
  const safeTitle = title.trim() || 'Untitled Lecture';
  const safeCourse = courseCode.trim() || 'ACAD';
  const exportDate = new Date().toISOString().slice(0, 10);
  const tags = [safeCourse.toLowerCase(), 'lecture-notes', 'lecturelens'].join(', ');

  const frontmatter = [
    '---',
    `title: "${safeTitle.replace(/"/g, '\\"')}"`,
    `course: "${safeCourse.replace(/"/g, '\\"')}"`,
    `date: "${exportDate}"`,
    `tags: [${tags}]`,
    `generator: "LectureLens AI"`,
    '---',
    '',
  ].join('\n');

  const sections: string[] = [];

  // Title
  sections.push(`# ${safeTitle}\n`);
  sections.push(`**Course:** ${safeCourse} | **Generated:** ${exportDate}\n`);

  // Executive Summary
  if (notes.summary) {
    sections.push(`## Executive Summary\n\n${notes.summary.trim()}\n`);
  }

  // Key Concepts Table
  if (notes.keyConcepts && notes.keyConcepts.length > 0) {
    const tableHeader = '| Concept | Definition | Importance | Timestamp |\n|---|---|---|---|';
    const rows = notes.keyConcepts.map((kc) => {
      const term = (kc.term || '').replace(/\|/g, '\\|');
      const def = (kc.definition || '').replace(/\|/g, '\\|');
      const imp = kc.importance || 'medium';
      const time = kc.timestamp || '--';
      return `| **${term}** | ${def} | \`${imp}\` | ${time} |`;
    });
    sections.push(`## Key Concepts\n\n${tableHeader}\n${rows.join('\n')}\n`);
  }

  // Markdown Body or Formulas
  if (notes.markdown && notes.markdown.trim()) {
    // If the markdown body has its own headers, append cleanly
    sections.push(`## Lecture Synthesis & Detailed Notes\n\n${notes.markdown.trim()}\n`);
  }

  // Exam Relevance
  if (notes.examRelevance && notes.examRelevance.trim()) {
    sections.push(`## Exam Relevance & High-Yield Takeaways\n\n${notes.examRelevance.trim()}\n`);
  }

  // Margin Notes / Student Annotations
  if (notes.marginNotes && notes.marginNotes.trim()) {
    sections.push(`## Student Annotations\n\n${notes.marginNotes.trim()}\n`);
  }

  return frontmatter + sections.join('\n');
}

/**
 * Generates an Anki-compatible TSV string formatted with official Anki import headers
 * Header specification:
 * #separator:tab
 * #html:true
 * #tags column:3
 */
export function exportFlashcardsAsAnkiTsv(
  title: string,
  courseCode: string,
  cards: Array<Flashcard | FlashcardItem>
): string {
  const safeCourse = (courseCode.trim() || 'General').replace(/\s+/g, '_');
  const safeTitle = (title.trim() || 'Lecture').replace(/\s+/g, '_');
  const tag = `LectureLens::${safeCourse}::${safeTitle}`;

  const headers = [
    '#separator:tab',
    '#html:true',
    '#tags column:3',
  ].join('\n');

  if (!cards || cards.length === 0) {
    return headers + '\n';
  }

  const rows = cards.map((card) => {
    let front = '';
    let back = '';

    if ('question' in card) {
      // FlashcardItem
      const item = card as FlashcardItem;
      front = item.question ? item.question.trim().replace(/\t/g, ' ').replace(/\n/g, '<br>') : '';
      const lead = item.answerLead ? `<strong>${item.answerLead.trim()}</strong>` : '';
      const body = item.answerBody ? `<p>${item.answerBody.trim()}</p>` : '';
      const sub = item.subtopic ? `<small>Topic: ${item.subtopic}</small>` : '';
      back = [lead, body, sub].filter(Boolean).join('<br>').replace(/\t/g, ' ').replace(/\n/g, ' ');
    } else {
      // Flashcard
      const simple = card as Flashcard;
      front = simple.front ? simple.front.trim().replace(/\t/g, ' ').replace(/\n/g, '<br>') : '';
      back = simple.back ? simple.back.trim().replace(/\t/g, ' ').replace(/\n/g, '<br>') : '';
    }

    return `${front}\t${back}\t${tag}`;
  });

  return `${headers}\n${rows.join('\n')}\n`;
}

/**
 * Triggers a client-side browser file download from string content
 */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
