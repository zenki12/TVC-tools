# TVC Tool Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one production-ready Node project with a React application, Microsoft Entra ID authentication, a shared shell, and the existing birthday-card module.

**Architecture:** Vite builds the React client while Express owns `/api` and serves `dist` in production. MSAL obtains API-scoped access tokens in the browser; Express verifies their Microsoft JWKS signature, tenant, audience, and issuer before exposing identity data. The birthday-card feature remains client-only and keeps IndexedDB/canvas behavior isolated under its route.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Express, MSAL React/browser, jose, tsx, Node test runner.

---

### Task 1: Project metadata and configuration

**Files:** `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `.env.example`, `.gitignore`, `AGENTS.md`

- [x] Define a single package with `dev`, `dev:client`, `dev:server`, `build`, `start`, `check`, and `test` scripts.
- [x] Configure Vite/Tailwind, strict browser/server TypeScript projects, `/api` dev proxy, and production output.
- [x] Document environment variables and project commands without real tenant data or secrets.

### Task 2: Authentication backend using test-first behavior

**Files:** `server/auth.test.ts`, `server/auth.ts`, `server/app.test.ts`, `server/app.ts`, `server/index.ts`

- [x] Write tests that require malformed/missing authorization to return 401 and valid normalized claims to produce an authenticated user.
- [x] Run `npm test` and confirm RED because auth/app implementations do not exist.
- [x] Implement bearer parsing and `jose` remote-JWKS verification with required `TENANT_ID`, `CLIENT_ID`, `tid`, `aud`, and Microsoft issuer checks.
- [x] Expose protected `GET /api/me`, centralized JSON errors, SPA static serving, and a dedicated listen entry point.
- [x] Run `npm test` and confirm GREEN.

### Task 3: MSAL client, login gate, API client, routing, and shell

**Files:** `src/auth/config.ts`, `src/auth/AuthProvider.tsx`, `src/auth/useAuth.ts`, `src/auth/apiClient.ts`, `src/shell/AppShell.tsx`, `src/modules/meeting-minutes/MeetingMinutesPage.tsx`, `src/router.tsx`, `src/App.tsx`, `src/main.tsx`, `src/index.css`

- [x] Configure single-tenant MSAL from `TENANT_ID` and `CLIENT_ID`, requesting the app access-token scope.
- [x] Implement login/error/loading gates, popup login/logout, silent token acquisition with popup fallback, and bearer attachment for API calls.
- [x] Add authenticated shell navigation for both modules, user identity, logout, route redirect, and Phase 2 placeholder.
- [x] Run `npm run check` and resolve all client/server type failures.

### Task 4: Port Birthday Card module

**Files:** `src/modules/birthday-card/BirthdayCardPage.tsx`, `src/modules/birthday-card/types.ts`, `src/modules/birthday-card/components/*`, `src/modules/birthday-card/utils/*`

- [x] Copy the source module into its route boundary while preserving editor, canvas, background library, admin, IndexedDB, and PNG export behavior.
- [x] Adjust only relative imports/component name and shell-height integration required by its new location.
- [x] Confirm `rg '@google/genai'` returns no application/package references.

### Task 5: Verification and records

**Files:** `docs/DEVLOG.md`, `docs/TASK_REGISTRY.md`

- [x] Run a clean dependency install and inspect peer-dependency output.
- [x] Run `npm test`, `npm run check`, and `npm run build` with zero failures.
- [x] Start production server and verify unauthenticated `GET /api/me` returns 401 JSON.
- [x] Start dev app and verify its HTTP/HMR endpoint; document the unavailable browser/tenant limitation and real-tenant manual flow.
- [x] Record the architecture/configuration/port changes in `DEVLOG.md`, then mark T-0001 `Done` only after every verification gate above passes.
