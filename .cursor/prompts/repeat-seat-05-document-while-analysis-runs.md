# RS-05 — The open architecture stays a document while analysis runs

**Do not fork LI-08, WD-06, or LD-11.** LD-11 owns hub/sample mixing. In-flight desk already lists packages on Overview and the reviews hub. This file is the leftover: **the open review’s Findings can still look all-clear while analysis runs**.

## Goal

While analysis is in flight, Working-mode review-detail remains a **document**: Architecture (read), Evidence already attached, Activity with honest discrete `state` / `stepLabel`, and a way to continue **other** desk work without babysitting a spinner tab. Do not invent `GET /v1/runs/{runId}/progress`. Do not fake percent. Copy: analysis is running; do not imply the package is ready to seal.

## Why

Livelihood throughput is blocked by waiting. LI-08 put the queue on Overview/hub. The open review can still feel like a modal job: findings empty, architecture locked, no signal except a spinner. A daily driver works *while* it runs — they prepare actors (RS-02), read attached evidence, or switch to another in-flight row. `ReviewWorkspaceStaleBanner` already exists; keep it. Architecture-tab edits during in-flight must not silently fork the draft (RS-05 owns spawn lock) — if the architecture is frozen for this run, say so and point at Activity / in-flight desk instead of a blank findings all-clear.

## Context

- `docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md` (TB-2072)
- `archlucid-ui/src/hooks/use-shell-in-flight-operations.ts`
- `archlucid-ui/src/components/reviews/ReviewWorkspaceStaleBanner.tsx`
- Review-detail tabs: Architecture, Findings, Activity
- LI-08 `ReviewsHubInFlightAnalysisDesk` — reuse; do not poll a second way

## What to build

1. Working review-detail while operation in-flight: Findings does not look like “no issues.” Honest empty: analysis still running + Activity link (`?reviewTab=` **default landing only**).
2. Architecture tab: if frozen for this run, one sentence why + link to the in-flight desk / Activity. If still the pre-spawn draft, RS-05 applies — do not re-open parallel edit.
3. Keep stale banner. If the user is on another route, do not toast-spam; Overview in-flight list is the signal (already shipped).
4. Copy: analysis is running; Finalize stays disabled (existing scorecard) — no implied seal.
5. Vitest: in-flight findings empty is not an all-clear; no new progress endpoint; no fake `%`.

## Acceptance criteria

- Working user with analysis running does not read Findings as a clean review.
- They can leave the tab and resume from Overview/hub without losing the queue (LI-08 stays).
- No call to a non-existent run progress URL.
- Desktop tabs stay fully visible in stable order.

## Constraints

- Do not start a long-lived dev server or `gh pr checks --watch`.
- Do not implement GTM **M-90**.
- Do not collapse tabs to “make the queue simpler.”
- Do not invent progress percentages.
