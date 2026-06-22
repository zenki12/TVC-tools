# Meeting Minutes AI Draft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn raw meeting notes into a validated, editable structured minutes draft without export or history features.

**Architecture:** Shared discriminated-union types and runtime validators define the FE/BE contract. A server-only Gemini adapter requests JSON schema output and retries one malformed response; authenticated Express routing maps input/config/upstream failures to 400/503/502. React owns a two-step local state flow with browser-side mammoth extraction and a pragmatic controlled-form draft editor.

**Tech Stack:** Existing React/Express/TypeScript stack plus only `@google/genai` on the server and `mammoth` in the browser.

---

### Task 1: Shared schema and backend API using TDD

**Files:** `src/modules/meeting-minutes/types.ts`, `server/minutes.test.ts`, `server/app.ts`

- [x] Write RED tests proving a complete minutes object validates, malformed blocks fail, empty input returns 400, missing key returns 503, and an injected generator returns `{ content }` behind auth.
- [x] Implement `MinutesMetadata`, participant, block union, section, action table, and `MeetingMinutes` types plus runtime validation without adding a validation dependency.
- [x] Add authenticated `POST /api/minutes/generate`, validate request body, check `GEMINI_API_KEY`, inject the generator for tests, and map generation failure to 502.
- [x] Run `npm test` until all old and new tests pass.

### Task 2: Gemini structured generation

**Files:** `server/gemini.ts`, `.env.example`, `package.json`, `package-lock.json`

- [x] Install only `@google/genai` and `mammoth`; document server-only `GEMINI_API_KEY`.
- [x] Define a Gemini response schema matching every shared type and use `gemini-2.5-flash` with `responseMimeType: application/json`.
- [x] Build a Vietnamese prompt that preserves supplied metadata and converts raw notes into the specified sections.
- [x] Parse and validate the response; retry once with a correction instruction, then throw a clear generation error.

### Task 3: Two-step frontend

**Files:** `src/modules/meeting-minutes/MeetingMinutesPage.tsx`, `src/modules/meeting-minutes/InputStep.tsx`, `src/modules/meeting-minutes/DraftEditor.tsx`

- [x] Build controlled metadata fields and nested organization/person controls with add/remove actions.
- [x] Add raw text input plus `.txt` FileReader and browser `mammoth.extractRawText` for `.docx`.
- [x] Submit with `apiFetch`, show loading, and display friendly server errors without losing input.
- [x] Build controlled editors for title/metadata, string lists, paragraphs, bullets, table headers/cells/rows, subsections, and final action table.
- [x] Add Back and disabled DOCX buttons; do not add export, persistence, or history code.

### Task 4: Verification and records

**Files:** `AGENTS.md`, `docs/DEVLOG.md`, `docs/TASK_REGISTRY.md`

- [x] Run install, tests, type-check, and production build; confirm no dependency beyond the two allowed additions.
- [x] In dev auth mode, verify missing key returns 503 and UI/dev endpoint remains healthy; call real Gemini only if a valid key is already available.
- [x] Record schema/model/key instructions and explicit T-0004/T-0005 exclusions in DEVLOG.
- [x] Mark T-0003 Done only after all available gates pass and document any credential/browser limitation.
