# LS-018 — Vitest and Playwright first-login matrix

**Wave:** live-seat (**LS**). **Cluster:** ratchet. **Depends on:** LS-005–LS-014.

Do not implement from the wave index. Implement only *What to build*.

## Goal

A matrix test file covering the four join paths × Training choice, plus returning-user skip. Prefer Vitest with mocked bootstrap; add Playwright only where an existing live-api invite spec can assert scope without a new @release-gate surface.

## Why

Unit tests on isolated helpers will not catch “Record + demo Home after invite accept.”

## Context

- `PostAuthBootstrapClient.test.tsx`
- `operator-scope-bootstrap.test.ts`
- `live-api-invite-flow.spec.ts` / private-beta access
- Do not require ui-e2e-live for this prompt unless you extend an existing founder-tagged spec

## What to build

1. Vitest matrix table (document in test names):
   - invite accept + live purpose → dedicated scope, no NOT LIVE DATA
   - invite accept + training → sample visit allowed, honesty visible
   - create workspace + live purpose → empty live Home work CTA
   - returning explicit live + persisted demo storage → dedicated restored
   - select workspace two memberships
2. Playwright: only if an existing spec already signs in; assert workspace label ≠ Customer Intake Demo for live purpose.
3. Do not add a new full trial-signup e2e in this prompt.

## Acceptance criteria

Matrix file is green from `archlucid-ui/` focused Vitest. Failures name which join path leaked sample scope.

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
- **Do not** rename stored tokens `"career"` / `"rehearsal"`. **Do not** use **Working**, **Production**, **Real**, **Live**, **Standard**, or **Normal** as a Record/Practice door label. **Live tenant workspace** is scope language, not a review-type chip.
- **Do not** merge Training with Practice. **Do not** delete Guided. **Do not** hide **NOT LIVE DATA** honesty on a sample/demo workspace.
- **Do not** rewrite ADR 0086, 0091, 0094, or 0097 bodies. This wave adds first-login scope + training choice; Record/Practice honesty stays.
- Leftover owner: `PostAuthBootstrapClient.test.tsx`. **Do not re-implement that file.** Implement only *What to build*.
