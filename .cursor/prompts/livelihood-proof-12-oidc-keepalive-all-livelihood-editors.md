# LP-12 — OIDC keepalive on all livelihood edit surfaces

Do not store Bearer in JS (LK-06). Do not fork BFF CSRF (LK-07).

## Goal

`useOidcSessionKeepalive` and `OidcTokenExpiryWarningGuard` must run on **every surface in the livelihood document-guard inventory** (after LP-11), not only `/print`, presenter, or `ArchitectureDraftWorkspace`.

`isMeetingSafeSessionSurface` may keep **copy** differences; token refresh + 2-minute warning must not be gated to meeting-safe routes alone.

## Why

All-day review inspect and disposition forms expire mid-edit while print/presenter stay alive. That is a livelihood data-loss bug, not a meeting feature.

## Context

- `OidcTokenExpiryWarningGuard.tsx`
- `use-oidc-session-keepalive.ts`
- `SessionIdleTimeoutGuard` — 4h Working idle stays; this prompt is **access-token** TTL, not idle
- LP-19 owns 401 resume of in-flight POSTs

## What to build

1. Mount keepalive/warning from a shell-level provider when dirty livelihood snapshot is registered, or on all authenticated operator routes except marketing.
2. Vitest: finding inspect + policy pack editors trigger refresh pulse (mock).
3. Do not auto-redirect to IdP (session-expired returnUrl stays).

## Acceptance criteria

- Token expiry warning appears on finding inspect, not only print.
- BFF HttpOnly session unchanged.

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
