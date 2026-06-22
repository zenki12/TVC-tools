# Meeting Minutes DOCX Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export reviewed `MeetingMinutes` JSON as a valid company-formatted DOCX while preserving every original header, footer, relationship, style, theme, and logo part.

**Architecture:** A reproducible template derivation script copies the original archive and changes only `word/document.xml`, retaining formatted metadata tables and fixed headings while inserting seven raw-XML placeholders. `server/docx.ts` validates input, escapes every user string, builds WordprocessingML paragraphs/lists/arbitrary-column tables, and renders the template through docxtemplater/PizZip. The authenticated API streams the buffer; the existing draft editor downloads it as a blob.

**Tech Stack:** Existing TypeScript/Express/React stack plus only `docxtemplater` and `pizzip`; Python standard-library OOXML derivation tool; Node test runner.

---

### Task 1: Structural DOCX test first

**Files:** `server/docx.test.ts`, `server/docx.ts`, `server/templates/bien-ban-template.docx`

- [x] Write a failing test with paragraph, bullets, escaped metacharacters, a 3-column subsection table and a 5-column action table.
- [x] Assert the result is a readable ZIP, dynamic text is present, the two tables have 3/5 `w:gridCol` nodes, and all `word/header*`, `word/footer*`, `word/media/*` bytes equal the template/original.
- [x] Run `npm test` and confirm RED because renderer/template/dependencies are absent.

### Task 2: Derive the template without rebuilding branding

**Files:** `tools/create_minutes_template.py`, `server/templates/bien-ban-template.docx`

- [x] Copy every ZIP entry from `TVC_Biên bản mẫu.docx`; parse only `word/document.xml` with ElementTree.
- [x] Preserve the original title/metadata/participant table node formatting, replace cell content with scalar/nested-loop tags, clone exact `u1`/`u2` heading paragraphs, and insert sole-paragraph raw tags.
- [x] Preserve original `w:sectPr`; write only the modified document part and assert all other entry hashes remain identical.

### Task 3: Render escaped raw OOXML

**Files:** `server/docx.ts`, `package.json`, `package-lock.json`

- [x] Install only `docxtemplater` and `pizzip`.
- [x] Implement XML escaping for `& < > " '` and Times New Roman 13pt paragraphs using existing `oancuaDanhsach`/`u2` and numbering IDs.
- [x] Implement `LiBang` tables with explicit `tblW`, `tblGrid`, matching `tcW`, bold repeated header row, cell margins and arbitrary column counts.
- [x] Render scalar/nested participant tags and all seven raw XML sections; return a Node Buffer.
- [x] Run the structural test GREEN.

### Task 4: Authenticated API and frontend download

**Files:** `server/export.test.ts`, `server/app.ts`, `src/modules/meeting-minutes/DraftEditor.tsx`

- [x] Add RED API tests for unauthenticated 401, invalid content 400, and successful MIME/disposition/body response.
- [x] Add authenticated `POST /api/minutes/export`, validation, sanitized title/date filename, and 500 logging.
- [x] Replace disabled button with loading/error state, `apiFetch`, blob URL download, and cleanup.

### Task 5: Verification and records

**Files:** `AGENTS.md`, `docs/DEVLOG.md`, `docs/TASK_REGISTRY.md`

- [x] Run install, tests, check, build, and runtime export in dev auth mode.
- [x] Render the generated DOCX to PNG and inspect every page; if LibreOffice is unavailable, perform structural/package checks and disclose the missing visual gate.
- [x] Confirm no Gemini key leakage, history implementation, or unrelated birthday-card changes.
- [x] Document derivation/raw XML/styles/filename behavior and mark T-0004 Done only after all available gates pass.
