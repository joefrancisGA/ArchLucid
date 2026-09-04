# WA-19 — Global search defaults to the open package in Working

**Do not fork** a new search product. This file is **scope**: when a Working user is on a review, `/` search and global search default to **this package** (findings, evidence, architecture text), with an explicit control to search the workspace. Empty tenant stays honest (WA-05).

## Goal

Working-mode review-detail: search placeholder and results are package-scoped first. A visible chip/toggle “This review / Workspace” (sentence case) expands scope. Guided may keep workspace-first if that is today’s behavior — document it. Do not search showcase data on live tenants.

## Why

Eight-hour use is inside one package. Tenant-wide search is how you lose the meeting. Casual tools search everything. Livelihood tools search the document.

## Context

- `use-global-search-mode.ts` / global search command
- `/` shortcut / `isEditableTarget`
- Review-detail route param `reviewId`
- Live never-sample (LD-02)

## What to build

1. If `reviewId` is on the route, default search scope to that package. Toggle to workspace.
2. Copy: “Search this review” vs “Search workspace.”
3. Vitest: on review-detail, default scope is package; live results never include showcase ids.

## Acceptance criteria

- Working `/` on an open package does not dump tenant-wide hits first.
- User can expand to workspace without leaving the review.
- Demo/static sample search stays labeled sample.

## Constraints

- Do not build a new search backend if the existing API accepts a run filter — use it.
- Do not collapse review tabs.
- Do not send live failures to Claims Intake.
