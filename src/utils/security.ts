/**
 * Client-Side Input Sanitization and XSS Prevention Utilities
 * Phase 14: Data Persistence, Authentication, Security & RLS Hardening (SEC-01, SEC-02)
 */

/**
 * Escapes common HTML special characters to prevent Reflected and Stored XSS.
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strips high-risk executable script tags, iframes, inline event handlers, and javascript: URLs.
 * Preserves safe formatting HTML tags: p, b, i, em, strong, code, pre, ul, ol, li, h1-h6, blockquote, hr, br.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  let cleaned = html;

  // 1. Remove dangerous blocks: <script>...</script>, <style>...</style>, <iframe>...</iframe>, <object>, <embed>, <applet>
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  cleaned = cleaned.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  cleaned = cleaned.replace(/<embed\b[^>]*>/gi, '');
  cleaned = cleaned.replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '');

  // 2. Strip inline event handlers: onclick=, onload=, onerror=, onmouseover=, etc.
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // 3. Neutralize javascript: or data: URIs in href or src attributes
  cleaned = cleaned.replace(/(href|src)\s*=\s*(['"]?)\s*(javascript|vbscript|data):/gi, '$1=$2blocked:');

  return cleaned;
}

/**
 * Sanitizes plain single-line or multi-line text input (e.g. lecture titles, course codes, query strings).
 * Trims whitespace, removes null bytes, normalizes newlines, and bounds length to prevent buffer bloat.
 */
export function sanitizeTextInput(input: string, maxLength: number = 500): string {
  if (!input) return '';

  // Remove null characters and control characters except \n and \t
  let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize Windows/Mac line endings to \n
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Trim whitespace
  cleaned = cleaned.trim();

  // Enforce max character bound
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
}

/**
 * Sanitizes user-edited markdown content (e.g. student study notes, margin annotations).
 * Strips executable script blocks while preserving valid markdown syntax and mathematical formulas.
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return '';
  return sanitizeHtml(markdown);
}
