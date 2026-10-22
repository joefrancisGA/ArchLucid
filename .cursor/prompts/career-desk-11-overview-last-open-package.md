# CD-11 — Overview restores the last-open review package

**Do not fork WA-15** for review-detail workbench column / filters / scroll / `findingId` URL. Drafts already have continue-last (`ArchitectureDraftContinueLastRow`). This file is **Overview / Alt+H**: a Working architect who left a package mid-triage and returns to Home should see that package as resume, not only a first-session hero.

## Goal

Working Home shows a resume row for the last-open **architecture package** (run id) when one exists in this account or URL/session — same honesty as drafts (this-browser vs account: prefer account pref if WA-14-style prefs exist; else session is OK if labeled). Clicking it opens that review, not `/architecture/reviews/new`. Guided may keep first-session next-best-action.

## Why

Professionals refresh and bounce to Overview. Casual SPAs restart the funnel. Drafts learned this; packages did not.

## Context

- `archlucid-ui/src/components/architecture/ArchitectureDraftContinueLastRow.tsx` — pattern to reuse
- `composeOperatorHomeSections` / in-flight desk (LI/LD — keep)
- `REVIEW_DETAIL_FINDING_PARAM` — keep; this is Home, not finding restore
- Account prefs from WA-14 / RS-10 — reuse storage style, do not invent a third prefs stack
- Do not persist tokens or evidence blobs

## What to build

1. Record last-open run id when Working review-detail mounts (existing shell audit run id may already exist — reuse if tenant-safe).
2. Home Working: continue-last package row when id is still accessible; hide when 404/forbidden.
3. Vitest: Home with a stored run id renders resume href to that review; empty tenant does not invent a showcase id.

## Acceptance criteria

- Working Overview can return the architect to yesterday’s package in one click.
- Guided first-session cards remain legal.
- No sample run id on live Working resume.

## Constraints

- Do not use localStorage as the only SoT across devices if an account pref API already exists.
- Do not collapse review tabs.
- Do not implement **M-90**.
