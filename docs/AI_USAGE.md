# AI Usage Report

## Tools

- **Claude Code** (Anthropic), used as a coding assistant in the editor and terminal.

## How it was used

AI scaffolded the project at the start: a minimal React + Express + WebSocket + SQLite app running in Docker. After that I used it throughout as a pair programmer to build on that base, one step at a time:

1. Plan the implementation against the brief, and agree the order of work.
2. Set up Prisma, the schema and the seed data.
3. Build the REST API, the WebSocket broadcast, the frontend blotter and the tests.
4. Review the result against the brief and cut anything beyond the requirements.

I reviewed every step and ran it before moving on. At the end I kept the code small enough to explain line by line.

## Prompting approach

The most useful prompts were specific, gave the AI its constraints, and asked for one step at a time:

- **State the goal and the constraints.** For example: "Use React, Express, TypeScript, native `ws` and SQLite. Avoid Socket.IO, ORMs and state libraries unless justified."
- **Ask for a plan before code.** For example: "Plan the implementation in phases. Don't write code yet."
- **Work in small, verifiable steps.** For example: "Implement phase 2 only, and show me how to check it works."
- **Ask the AI to review its own output.** For example: "Compare the code to the brief and list anything that goes beyond the requirements."

## Key decisions influenced by AI

- **REST for reads and writes, WebSocket only for broadcasting changes.** This keeps HTTP status codes and a plain refresh, with live updates on top.
- **Native `ws` instead of Socket.IO.** A broadcast is all the app needs.
- **One container.** Express serves the API, the WebSocket and the built frontend on one port.
- **Shared validation in `shared/trade.ts`.** The form and the API use the same validation function.

## Accepted and rejected suggestions

**Accepted**

- The initial scaffold and Docker setup.
- Running migrations and seeding automatically on container start.
- The audit trail (`TradeEvent`), kept as the one bonus feature.

**Rejected or changed**

- **Database access:** I replaced the AI's raw SQLite layer with Prisma, because I wanted typed queries and migrations.
- **Extra features:** I removed several the AI added that the brief doesn't ask for: optimistic locking, reconnect resync, a heartbeat, health checks, extra validation rules and UI polish.
- **UI components:** I decided against shadcn/ui. It would have added dependencies and files for a UI that is one table, one form and a dialog.
- **Validation library:** I didn't use zod, which the AI suggested, because `shared/` has no installed packages of its own. The validator is plain TypeScript instead.

# Prompt Log

These are representative examples, summarised and tidied.

**Prompt:** "Scaffold a minimal real-time app using React, Express, TypeScript, native WebSockets (`ws`), SQLite and Docker Compose. Keep dependencies to a minimum."
**Outcome:** Used it as the base project. Kept the single-container setup and the reconnecting WebSocket hook.

**Prompt:** "Set up Prisma with SQLite, a Trade model with an audit-event relation, and seed realistic random trades when the database is empty."
**Outcome:** Accepted. Pinned Prisma to the stable 7.x release rather than the 8.0 release candidate.

**Prompt:** "Implement create, amend and cancel endpoints with validation, and broadcast each change over the WebSocket."
**Outcome:** Accepted. Moved validation into `shared/` so the form and the API use the same rules.

**Prompt:** "Review the project against the brief and list anything that exceeds the requirements."
**Outcome:** Removed about half the code the AI had added beyond the brief, keeping only the required features plus the audit trail.
