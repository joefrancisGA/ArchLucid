# LP-13 — Expert intake is the Working seat default (not localStorage)

Do not delete Socratic. Do not auto-switch stored Guided users to Working. Do not fork WS-11 start href.

## Goal

On **Working**, expert/brief-first intake is the **default** (server or workspace preference persisted with the principal/tenant), not `localStorage` `archlucid.expert-intake-posture.v1.enabled` defaulting false.

Socratic one-at-a-time remains available as an explicit control for a requester in the room (R4 / R13). Guided keeps wizard-first teaching.

## Why

R13’s seatholder is a qualified SME. A browser-local opt-in means Monday morning is still naive until someone finds a checkbox. WS-11 shipped start **href**; posture storage is the leftover.

## Context

- `archlucid-ui/src/lib/expert-intake-posture.ts`
- `ExpertIntakePostureToggle.tsx`
- `resolveWorkingStartHref` — do not change architecture locator
- Prefer existing workspace/user preference API if one exists; do not invent a second settings product

## What to build

1. Working default: expert intake true without localStorage.
2. Persist preference server-side if a user-settings patch already exists; otherwise workspace-mode is enough (Working ⇒ expert).
3. Toggle still lets a Working user open Socratic for the room.
4. Vitest: Working new-architecture does not require the localStorage key.

## Acceptance criteria

- Clean Working profile lands on brief-first / expert editor, not Socratic-as-only-path.
- Guided two-door teaching unchanged.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067–0081 bodies except Related pointers. This wave **adds ADR 0082** and **ADR 0083**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No G-REAL-06.
- **Do not** re-run WS-01–24, SY, FC, DR, DX, PC, LK except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.
