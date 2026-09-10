# SH-04 — Assigned-to-me findings `/governance/findings/assigned-to-me`

**Do not** fold this into the tenant findings queue article. Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

Depends on **SH-03** prefix note: `/governance/findings` currently matches this child via `startsWith`.

## Goal

Security (and Architecture, if the lane exists there) Category-1 on `/governance/findings/assigned-to-me` describes the **personal assigned findings queue**: continue oldest finding, owners, empty-state fetch-basis honesty. Learn more should be a job-matched article (dedicated slug or findings article section `#assigned-to-me`), not approval or first-review. Prefer a dedicated Security-aware drawer even if Architecture keeps similar copy — the live page is not the tenant register.

## Why

No dedicated contextual-help row. Resolver picks `/governance/findings` (SH-03’s architecture-risk copy) or, if that is missing, `/governance` Approval copy. Home recommended-first dest in SecureNow is this lane (`SECURENOW_SECURITY_HOME_ROWS`). Page copy: skip to assigned findings queue, fetch-basis empty states, continue-oldest strip. Job is “work my assignments”, not “browse the tenant register” and not “approve architecture reviews”.

## Context

- `archlucid-ui/src/lib/governance/governance-assigned-to-me-page-copy.ts`
- `archlucid-ui/src/lib/governance/governance-assigned-to-me-empty-state.tsx`
- `archlucid-ui/src/lib/governance/governance-assigned-to-me-fetch-basis.ts`
- `archlucid-ui/src/components/usability/AssignedToMeContinueOldestFindingStrip.tsx`
- `archlucid-ui/src/lib/product-line/securenow-security-home-copy.ts` — summary “Open findings assigned to you…”
- `archlucid-ui/src/lib/contextual-help/findings-rows.ts` — parent prefix
- `archlucid-ui/src/lib/usability/page-help-topic-rows-operator-governance.ts` — `/governance/findings` Learn more

## What to build

1. New `PageContextualHelpRow` with prefix **exactly** `/governance/findings/assigned-to-me` (longer than `/governance/findings`). Copy: personal queue of findings assigned to the signed-in operator; next = open oldest/continue strip or a row; empty = nothing assigned (use fetch-basis language already on the page — do not invent “reviews not finalized”); configure = tenant findings queue / policy packs if assignment is empty because packs never ran.
2. Learn more: either omit, or `/help/findings#assigned-to-me` if SH-03 adds that section, or a new slug `assigned-to-me-findings` if the findings article cannot honestly lead with this job. Do not use `governance-approval`.
3. Optional: Security-only dedicated short article only if the findings article cannot lead with assigned work without lying to Architecture. Prefer a section over a new slug unless the jobs cannot share a page.
4. Vitest: pathname `/governance/findings/assigned-to-me` does not return Approval or “architecture risks from accepted findings” as `whatIsThisPage`.

## Acceptance criteria

- F1 on assigned-to-me does not mention approval queue, sealed review records, or “create architecture”.
- Empty-state help matches the page’s fetch-basis empty copy.
- Tenant `/governance/findings` still has its own row (SH-03).

## Constraints

- One class/module per file. Reuse assigned-to-me page copy strings where they already fit Category-1.
- Do not implement remediation factory (SH-07).
- Stage assigned-to-me contextual row + topic map + tests.
