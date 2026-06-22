# Dev Authentication Bypass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow local development to enter TVC Tool as a fixed fake user without weakening Microsoft authentication in production.

**Architecture:** `AUTH_MODE` is injected into both server runtime and the Vite client. The Express middleware bypasses token verification only for the exact combination `AUTH_MODE=dev` and `NODE_ENV!==production`; the React login gate/API helper mirrors dev mode and the shell displays an explicit warning banner.

**Tech Stack:** Existing TypeScript, Express, React, Vite, MSAL, and Node test runner; no new dependencies.

---

### Task 1: Backend protection with TDD

**Files:** `server/auth.test.ts`, `server/auth.ts`

- [x] Add a test that invokes `createAuthMiddleware` with `{ AUTH_MODE: 'dev', NODE_ENV: 'development' }` and asserts `next()` receives the fixed dev user without a bearer token.
- [x] Add a test that invokes it with `{ AUTH_MODE: 'dev', NODE_ENV: 'production' }` and asserts a missing token returns HTTP 401 without calling `next()`.
- [x] Run `npm test` and confirm RED because local dev mode currently returns 401.
- [x] Add the exact non-production dev guard at the start of the middleware; leave Microsoft verification below it unchanged.
- [x] Run `npm test` and confirm GREEN.

### Task 2: Frontend dev mode

**Files:** `vite.config.ts`, `src/vite-env.d.ts`, `src/auth/config.ts`, `src/auth/AuthProvider.tsx`, `src/auth/useAuth.ts`, `src/shell/AppShell.tsx`

- [x] Inject and type `__AUTH_MODE__`, defaulting to `microsoft`, then export `isDevAuth`.
- [x] Render authenticated children immediately in dev mode.
- [x] Return an empty token and call plain `fetch` without `Authorization` in dev mode; preserve the MSAL path for Microsoft mode.
- [x] Render the yellow text `Chế độ DEV — đang bỏ qua đăng nhập` in the shared shell only in dev mode.

### Task 3: Documentation and runtime matrix

**Files:** `.env.example`, `AGENTS.md`, `docs/DEVLOG.md`, `docs/TASK_REGISTRY.md`

- [x] Document `AUTH_MODE=dev` for local use and state that production always uses Microsoft verification.
- [x] Run `npm test`, `npm run check`, and `npm run build`.
- [x] Run local dev with `AUTH_MODE=dev`; verify the app endpoint returns 200 and `/api/me` returns the fixed fake user.
- [x] Run the server with Microsoft/default auth and verify `/api/me` without a token returns 401.
- [x] Run the server with `AUTH_MODE=dev` plus `NODE_ENV=production` and verify `/api/me` without a token still returns 401.
- [x] Add a DEVLOG entry and mark T-0002 `Done` only after all gates pass.
