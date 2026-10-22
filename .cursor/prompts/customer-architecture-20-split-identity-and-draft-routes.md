# CA-20 — Split identity desk route from draft editor route

**Do not 404** old `/architecture/architectures/{id}` bookmarks (CA-21). **Do not collapse review tabs.** CA-11 get-by-id should exist.

## Goal

Working URLs tell the truth:

1. **Identity desk:** prefer `/architecture/architectures/{architectureId}` when `{architectureId}` is a real `ArchitectureId` (CA-26 fills the page).
2. **Draft editor:** `/architecture/architectures/{architectureId}/draft/{draftId}` **or** `/architecture/drafts/{draftId}` — pick one and stick. Prefer a **child of the identity** so the desk stays the parent.
3. `/architecture/architectures/new` remains the new-draft bootstrap (CA-24).
4. Update `architecture-routes.ts` helpers: `architectureIdentityPath`, `architectureDraftPath(architectureId, draftId)`. Do not keep `architectureDraftPath(id)` meaning “id is a draft.”

## Why

Today `[architectureId]/page.tsx` mounts `ArchitectureDraftWorkspace` and the param **is a draft id**. Livelihood bugs start with the wrong object.

## Context

- `archlucid-ui/src/lib/architecture/architecture-routes.ts`
- `archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/page.tsx`
- `ArchitectureDraftWorkspace.tsx`
- ADR 0072 spawn-locked handoff remains on the **draft** URL

## What to build

1. Route files + helpers + tests for path builders.
2. Stub identity page if CA-26 is not in this PR — at least “Open draft” / “Reviews” links from get-by-id so the route is not an empty 200.
3. Do not implement the full desk chrome (CA-26–30).

## Acceptance criteria

- `architectureDraftPath("draft-1")` no longer implies draft-1 is an architecture.
- Guided may keep a draft-first URL as teaching if documented; Working uses the split.

## Constraints

- No desktop **More** menu.
- No system-wide breadcrumbs (TB-2090).
