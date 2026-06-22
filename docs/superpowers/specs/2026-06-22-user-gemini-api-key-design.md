# User-owned Gemini API key design

## Goal

Allow each authenticated user to generate meeting-minutes drafts with their own
Gemini API key. The application must retain the key only for the current browser
session and must explain how to obtain, use, protect, and revoke it.

## Scope

- Applies only to the Meeting Minutes module.
- Replaces the server-wide `GEMINI_API_KEY` requirement for minutes generation.
- Does not add account-level key storage, cross-device sync, usage history, or a
  fallback system key.

## User experience

The Meeting Minutes page includes a "Gemini API configuration" section before
the generate action. It contains:

- A password input with show/hide control.
- A save-for-this-session action.
- A clear-key action.
- A connection check action.
- Statuses for not configured, checking, valid, invalid/unauthorized, quota or
  rate limit exceeded, and network/service failure.

The key is stored in `sessionStorage`. It survives page navigation and reloads in
the same tab session but is not persisted as application data. Signing out must
explicitly remove it; closing the browser session relies on browser session
storage semantics. The UI must not prefill a key from any server response.

Generation is disabled until a non-empty key is present. Existing meeting input
and generated content behavior remains unchanged.

## Guidance and warning content

The configuration section links to `https://aistudio.google.com/apikey` and gives
these steps:

1. Sign in to Google AI Studio with the Google account that will own usage.
2. Open the API Keys page and create a Gemini API key in the intended project.
3. Apply available project restrictions, quota, and billing controls.
4. Paste the key into this application and select "Check connection".
5. Revoke and replace the key in Google AI Studio if it may have been exposed.

The warning states that the key belongs to the user, Gemini usage is subject to
Google quota and possible charges, and the key must not be shared through chat or
email. Users should avoid entering it on shared computers and should sign out or
clear it when finished. The application sends the key through its backend for
the current Gemini request but does not intentionally retain it.

## Architecture and data flow

The frontend owns a small session-key adapter responsible only for reading,
writing, and clearing the key. The key is kept out of URLs, persistent browser
storage, analytics, and error messages.

For connection checks and minutes generation, the frontend sends the key over
HTTPS in an `X-Gemini-API-Key` request header. The existing bearer access token
continues to authenticate the application user independently.

The authenticated Express endpoints validate that the Gemini header is present,
pass it as an explicit argument to the Gemini adapter, and discard the reference
after the request. The Gemini adapter must no longer read `process.env` for the
minutes flow. The header and key must never be logged, returned in a response, or
included in an error cause exposed to the client.

A dedicated authenticated connection-check endpoint performs the smallest
practical Gemini operation supported by the current SDK. It returns only a
normalized status and does not generate or retain meeting content.

## Error handling

The backend maps provider failures to stable application errors without echoing
provider request details that could contain credentials:

- Missing key: 400.
- Invalid or unauthorized key: 401.
- Quota/rate limit exceeded: 429.
- Provider unavailable or network failure: 502/503.
- Invalid meeting input remains 400.

The frontend renders Vietnamese guidance for each class. An invalid-key response
does not automatically erase the stored value so the user can inspect or replace
it; the user can always clear it explicitly.

## Security requirements

- Never place the key in query strings, route state, console output, telemetry,
  server logs, generated DOCX files, or API response bodies.
- Do not use `localStorage`, IndexedDB, cookies, databases, or server-side session
  storage for the key.
- Clear the session key during the application's sign-out flow.
- Keep the existing auth middleware on both Gemini endpoints.
- Do not fall back to a server-owned key.
- Document that browser-only storage reduces persistence but cannot protect the
  key from malicious scripts executing in the same origin; existing XSS defenses
  and dependency hygiene remain required.

## Verification

Backend tests cover authentication, missing header, explicit key forwarding,
normalized provider errors, and ensure failures never contain the supplied key.
Frontend tests cover session save/read/clear, sign-out clearing, disabled generate
state, header attachment, connection-check states, and warning/help rendering.

Manual verification covers obtaining a test key from Google AI Studio, checking
the connection, generating a draft, reloading within the session, signing out,
and confirming that the key is no longer present afterward.
