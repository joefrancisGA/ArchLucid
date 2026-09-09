# LP-19 — Resume in-flight livelihood mutations after 401

Do not queue dispositions while offline as a second draft-offline product unless reuse is obvious. Do not store Bearer in JS.

## Goal

When access token / BFF session expires **during** a Working mutation (disposition POST, draft PATCH already has offline queue, record correction, restatement LP-15), the client:

1. Completes re-auth via existing `/auth/session-expired?returnUrl=`.
2. **Retries once** with idempotency / row version already on the request — no duplicate current-pointer advance (ADR 0076).
3. Restores idle form snapshot (WS-18) into the form if the POST never left.

Draft offline queue may stay draft-only. This prompt is **authenticated retry**, not a new sync engine.

## Why

Long reviews outlive token TTL. Losing a disposition click after confirm is livelihood-risk; draft autosave already tried.

## Context

- `SessionExpiredClient.tsx`, livelihood idle snapshots
- `FindingDispositionConflictPanel` — 409 after retry is success-path honesty
- LP-12 keepalive reduces frequency; this prompt is the miss path

## What to build

1. Shared mutation retry helper used by disposition + one other livelihood POST.
2. Vitest: 401 → sign-in → single replay with same idempotency key / row version.
3. Do not retry non-idempotent deletes.

## Acceptance criteria

- Finding Accept that 401s can succeed after re-auth without double current events.
- User sees conflict panel if someone else won during the gap.

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
