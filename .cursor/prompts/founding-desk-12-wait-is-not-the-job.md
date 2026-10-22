# FD-12 — In-progress wait copy does not make babysitting the job

**Do not fork CD-13** for unmounting first-week guidance on Working review-detail. **Do not fork RS-05** for findings-not-all-clear. **Do not fork AD-02** for cancel confirm. This file is leftover **wait copy**: `BUYER_REVIEW_DETAIL_IN_PROGRESS_GUIDANCE` still says “Stay on this page until you finalize.” Other in-progress strings may still treat the open tab as a modal job.

## Goal

Working in-progress review-detail never tells the architect to stay on this page. Point at Activity (discrete step), sibling in-flight (FD-04 if landed), and the reviews hub. Guided/eval may keep “stay until finalize” if it matches Guided chrome. Finalize remains the stamp when ready — the copy change is wait-vs-desk, not removing Finalize.

## Why

Casual tools optimize wait-on-this-tab. A livelihood desk runs analysis while the architect triages another package. Copy that forbids leaving is the evaluator spine leaking onto the paying seat.

## Context

- `archlucid-ui/src/lib/first-week-route-guidance.ts` — `Stay on this page until you finalize`
- `resolveFirstWeekRouteGuidanceForShell` — Working vs evalChrome
- Run-detail in-progress banners / Activity empty
- `ReviewWorkspaceStaleBanner` — keep
- CD-13 mount gate — this file is strings that still mount on Working (Activity, sticky, finalize-not-ready)

## What to build

1. Grep `Stay on this page` / `until you finalize` on operator review-detail. Working: replace with desk next-step (Activity, hub in-flight, or sibling queue). Guided may keep the old sentence.
2. Vitest: Working in-progress fixture does not contain “Stay on this page.” Guided eval fixture may.
3. Do not enable Finalize while the scorecard still blocks.

## Acceptance criteria

- Working in-progress cannot screenshot “stay on this page” as the job.
- Analysis-running honesty from RS-05 remains.
- Desktop tabs unchanged.

## Constraints

- Do not auto-switch Guided.
- Do not collapse tabs.
- Do not invent `GET /v1/runs/{runId}/progress`.
