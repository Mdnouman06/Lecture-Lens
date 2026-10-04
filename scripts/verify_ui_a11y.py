#!/usr/bin/env python3
"""
Verification Script: UI/UX Accessibility, Keyboard Navigation & Responsive Matrix
Validates WCAG 2.1 AA keyboard accessibility, Apple HIG focus rings, ARIA semantics,
and multi-viewport responsive design across LectureLens.
"""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def check_file_contains(filepath: Path, needles: list[str], label: str) -> bool:
    if not filepath.exists():
        print(f"[FAIL] Missing file: {filepath.relative_to(ROOT)}")
        return False
    
    content = filepath.read_text(encoding="utf-8")
    missing = [n for n in needles if n not in content]
    if missing:
        print(f"[FAIL] {label} in {filepath.name}: Missing patterns: {missing}")
        return False
    
    print(f"[PASS] {label} in {filepath.name}")
    return True

def verify_accessibility() -> bool:
    print("=" * 65)
    print("  LectureLens UI/UX Accessibility & Responsive Matrix Audit")
    print("=" * 65)
    
    all_passed = True

    # 1. SkipLink Component & Mount
    all_passed &= check_file_contains(
        ROOT / "src/components/common/SkipLink.tsx",
        ["export const SkipLink", "href={`#${targetId}`}", "skip-link"],
        "SkipLink landmark component"
    )

    all_passed &= check_file_contains(
        ROOT / "src/components/layout/Shell.tsx",
        ["SkipLink", 'id="main-content"', "tabIndex={-1}"],
        "SkipLink mounting & main-content target in Shell"
    )

    # 2. Apple HIG Focus-Visible Outline System
    all_passed &= check_file_contains(
        ROOT / "src/styles/global.css",
        [
            ".skip-link",
            ":focus-visible",
            "outline: 2px solid var(--color-primary-container)",
            ":focus:not(:focus-visible)",
        ],
        "Apple HIG :focus-visible system and mouse outline suppression"
    )

    # 3. Modal Dialogs: Escape key, role="dialog", aria-modal="true"
    modals = [
        ("src/components/auth/AuthModal.tsx", "AuthModal"),
        ("src/components/common/LocalAiModal.tsx", "LocalAiModal"),
        ("src/components/ingestion/UploadLectureModal.tsx", "UploadLectureModal"),
    ]
    for rel_path, name in modals:
        all_passed &= check_file_contains(
            ROOT / rel_path,
            ['role="dialog"', 'aria-modal="true"', "Escape"],
            f"{name} dialog semantics and Escape key dismiss"
        )

    # 4. Tab Semantics: role="tablist", role="tab", aria-selected
    all_passed &= check_file_contains(
        ROOT / "src/views/ActiveRecallStudioView.tsx",
        ['role="tablist"', 'role="tab"', "aria-selected="],
        "ActiveRecallStudioView tablist semantics"
    )

    all_passed &= check_file_contains(
        ROOT / "src/components/planner/StudyCalendarGrid.tsx",
        ['role="tablist"', 'role="tab"', "aria-selected="],
        "StudyCalendarGrid view switcher tablist semantics"
    )

    all_passed &= check_file_contains(
        ROOT / "src/components/workspace/SmartNotesWorkspace.tsx",
        ['role="tablist"', 'role="tab"', "aria-selected="],
        "SmartNotesWorkspace tablist semantics"
    )

    # 5. Landmarks & ARIA Regions
    all_passed &= check_file_contains(
        ROOT / "src/components/layout/Sidebar.tsx",
        ['aria-label="Primary Navigation"', 'aria-current='],
        "Sidebar accessible navigation landmarks"
    )

    all_passed &= check_file_contains(
        ROOT / "src/components/layout/Header.tsx",
        ["aria-expanded=", 'aria-controls="mobile-nav-drawer"'],
        "Header mobile drawer expansion semantics"
    )

    all_passed &= check_file_contains(
        ROOT / "src/components/workspace/AudioScrubDeck.tsx",
        ['role="region"', 'aria-label="Audio Playback and Scrubbing Controls"'],
        "AudioScrubDeck accessible region"
    )

    all_passed &= check_file_contains(
        ROOT / "src/components/workspace/SmartNotesWorkspace.tsx",
        ['role="region"', 'aria-label="Smart Notes Editor"'],
        "SmartNotesWorkspace accessible region"
    )

    # 6. Responsive Matrix Hardening (375px, 768px, 1024px, 1440px)
    all_passed &= check_file_contains(
        ROOT / "src/styles/layout.css",
        [
            "min-height: 44px",
            "min-width: 44px",
            "env(safe-area-inset-bottom)",
            "@media (max-width: 768px)",
            "@media (max-width: 480px)",
        ],
        "Layout mobile 44px touch targets and safe area insets"
    )

    all_passed &= check_file_contains(
        ROOT / "src/styles/workspace.css",
        [
            "@media (max-width: 1024px)",
            "workspace-dual-grid",
            "transcript-panel",
            "audio-scrub-deck",
        ],
        "Workspace split-pane 1024px responsive stacking"
    )

    all_passed &= check_file_contains(
        ROOT / "src/styles/recall.css",
        [
            "@media (max-width: 1024px)",
            "recall-deck-split-grid",
            "recall-split-main",
            "recall-split-side",
        ],
        "Recall Studio 1024px responsive stacking"
    )

    all_passed &= check_file_contains(
        ROOT / "src/styles/advanced.css",
        [
            "@media (max-width: 1024px)",
            "planner-main-split-grid",
            "-webkit-overflow-scrolling: touch",
        ],
        "Planner 1024px responsive stacking and momentum scrolling"
    )

    print("=" * 65)
    if all_passed:
        print("[SUCCESS] ALL 17 ACCESSIBILITY & RESPONSIVE AUDIT CHECKS PASSED!")
    else:
        print("[FAILURE] SOME AUDIT CHECKS FAILED. Review output above.")
    print("=" * 65)
    return all_passed

if __name__ == "__main__":
    success = verify_accessibility()
    sys.exit(0 if success else 1)
