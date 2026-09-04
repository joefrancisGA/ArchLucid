# WA-20 — What-if this invariant from the open review (R12), not empty Compare

**Do not fork RS-08** for Compare href prefill. This file is **ceteris-paribus entry**: from a sealed (or committed) Working review, start a what-if that reuses Compare — override one invariant, execute, compare to base — without a blank two-GUID form.

## Goal

Working-mode review-detail offers **What-if** (palette + visible control) that: (1) uses this review as base, (2) collects **one** override (reuse existing compare/branch UI if any), (3) explains it is a billable full run if that is still true, (4) lands on Compare with base prefilled when the branch exists. Do not diff mutable drafts (R12). Do not invent a second compare engine.

## Why

R12 is the envelope: at 3s vs 5s. Today what-if is “leave and type two ids.” Casual tools hide trade-offs. Livelihoods run them from the document. Cost must stay visible (R12 constraint 2) — do not hide GPU/run cost if the product still bills per run.

## Context

- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R12
- `buildCompareTwoReviewsHref({ baseRunId })`
- Authority compare / any existing branch or re-run APIs — grep re-run / compare
- WA-05 empty Compare; WA-09 assumption delta
- Do not call missing `GET /v1/runs/{runId}/progress`

## What to build

1. Inventory existing re-run / clone-run / compare APIs. Prefer wiring an existing execute+compare over a new orchestrator.
2. Working review-detail: What-if control disabled until the package is comparable (committed golden record). TB-2005.
3. If V1 cannot spawn a branch cheaply, ship the **honest** subset: “Compare this review” (already RS-08) plus copy that a true ceteris-paribus branch is a new review from snapshot (WA-10) with one field changed — do not fake an in-place slider that does not execute.
4. Vitest: control hidden/disabled on in-flight; href/API uses this run as base. Scoped compile if C# is required.

## Acceptance criteria

- Working architect does not start what-if at an empty Compare form when they already have a base package.
- Draft-only packages cannot compare (R12 gate).
- No fake percent. No draft-diff engine.

## Constraints

- Do not add unbounded branch fan-out.
- Do not collapse review tabs.
- Do not change `typed-engine-protected`.
