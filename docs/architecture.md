# Architecture

## Runtime

UIX provides server-rendered views, reactive components, and frontend/backend
module boundaries. DATEX provides endpoint calls and shared persistent state.
The full app uses the custom Deno for UIX runtime; plain Deno runs isolated
business-logic tests without starting the framework.

## Polls

`backend/data.ts` creates surveys and coordinates recurring follow-up rounds.
Each survey has a public identifier and a separate administration capability.
Participants use `/:surveyId`; editors use `/edit/:surveyId?token=...`.
Keep administration URLs private.

`common/surveys/surveys.ts` stores configurations and votes and exposes the
authorized editing and participation operations. Survey definitions register
their own editor, participant view, defaults, and model.

The schedule-poll module implements weighted voting, deadline handling,
per-slot comments, and recurrence. Follow-up generation clones vote options
and slots, shifts dates, and links adjacent rounds.

## Accounts

Accounts are optional. Passwords are salted with PBKDF2 through Web Crypto.
Successful login issues an expiring server-side session token; a user ID
stored in the browser alone does not authorize account operations. Linking
a poll to an account also requires that poll's administration capability.

The browser stores session state locally. Logout revokes the token. Runtime
restart invalidates in-memory sessions and requires another login, while
DATEX persists the actual account and poll data.

## Calendar and Presentation

Calendar import examines event start/end ranges locally to highlight busy
slots. It is a limited importer, not a complete recurring-calendar engine.
The original parser supports basic UTC and floating timestamps; arbitrary
time-zone and recurrence expansion are not implemented.

Shared components provide language and theme controls. The layout and
accessibility behavior of the integrated app are preserved.
