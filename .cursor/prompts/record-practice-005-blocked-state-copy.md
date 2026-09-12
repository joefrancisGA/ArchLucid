# RP-005 — Blocked-state copy: capability, not Career blocked

**Wave:** record-practice (livelihood UX wave 31) (**RP**). **Cluster:** copy. **Depends on:** RP-003.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Reframe every blocked-state string so it describes what the **host cannot do**, not that the operator’s Career is blocked. Follow the glossary.

## Why

These strings fire when something is already wrong. **Career blocked** and **Career door blocked** are the threatening peak.

## Context

- `working-career-door-gate-copy.ts`
- `working-career-door-gate.ts` (`WORKING_CAREER_BLOCKED_SIMULATOR_HOST_REASON`)
- `WorkingCareerDoorBlockedDialog`
- Run status / progress strings that say `Career blocked` (coordinate with RP-006 if shared)

## What to build

1. Dialog title: `This host cannot produce a sealed record` (not Career door blocked).
2. Simulator detail: `This host is pinned to rule-based analysis, so it cannot execute a Record review here.`
3. Live-AI-not-ready: `A Record review needs a ready live AI connection. Rule-based analysis is not a sealed record.`
4. Loading: `Checking whether this host can run a Record review…`
5. Switch CTA: `Switch to Practice`.
6. Host reason: Record requires Real execution or an explicit Practice type — Simulator host mode cannot run as Record.
7. Tests that asserted the old titles. No stored-token change.

## Acceptance criteria

No user-visible string in the blocked dialog contains the word Career. Switch to Practice still works.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).
- **Do not** rename stored tokens `"career"` / `"rehearsal"`, API/DTO field names, SQL columns, webhook JSON keys, localStorage keys, or test ids that encode those tokens. User-facing copy only.
- **Do not** use **Working**, **Production**, **Real**, **Live**, **Standard**, or **Normal** as a door label. **Working** is workspace mode; **Dev** is the environment chip; Real/Simulator/Fallback is host Mode.
- **Do not** rewrite ADR 0086 or 0091 bodies. ADR 0097 supersedes **user-facing labels only**. Honesty gates stay.
- Leftover owner: AS-078 gate copy / working-career-door-gate-copy.ts. **Do not re-implement that file.** Implement only *What to build*.
