# LP-17 — ITSM HumanReviewStatus follows ADR 0076 current pointer

Do not drop append-only `FindingReviewEvents`. Do not invent live Jira sync UX.

## Goal

Inbound ITSM `HumanReviewStatus` **must not** last-writer-wins against a Working disposition current pointer in a way that two systems disagree without 409/honesty.

Minimum viable:

1. When a current pointer exists (ADR 0076), inbound HumanReviewStatus updates that **fail CAS** surface 409 / logged conflict and **do not** silently overwrite the inspect “current” disposition.
2. Mapped disposition (TB-396) appends a trail event **and** attempts the same current-pointer CAS as the UI.
3. Caption already in TB-987 stays; add fail-closed on Working when trail and HumanReviewStatus diverge past a named threshold (banner + export honesty).

Full bidirectional workflow mapping stays **TB-398** / V2 — do not build it here.

## Why

Two architects plus ServiceNow can each believe they won. ADR 0076 fixed the UI race; ITSM snapshot UPDATE is still last-writer (`FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`).

## Context

- `docs/library/FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`
- ADR 0076, TB-390 / TB-396 / TB-986–988
- `SqlItsmFindingCorrelationRepository*` tests

## What to build

1. Inbound path: optional expected row version or “if pointer exists, append+CAS else last-writer with honesty flag.”
2. Working inspect: conflict panel if HumanReviewStatus ≠ current disposition kind.
3. Integration test: concurrent ITSM update vs human Accept → one current, loser visible.
4. Update the conflict contract “Today” vs Working target honestly.

## Acceptance criteria

- Silent last-writer cannot become Working inspect current while a CAS pointer exists.
- History remains append-only.

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
