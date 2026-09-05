# AD-05 — Last-visit “new” markers are honest about this-browser vs account

**Do not fork WA-14 or CD-11.** WA-14 owns remaining **seat prefs** (hide-generic / density). CD-11 owns Overview **last-open package** resume. This file is the leftover **“updated since last visit”** watermarks: `last-visited-watermark.ts` prefixes `localStorage` (`archlucid:last-visited:v1:`). Another device, another browser, or cleared storage shows everything as new — or nothing as new — without saying so.

## Goal

Wherever `NewSinceLastVisitMarker` / review-tab watermarks / governance queue “new” dots appear, the desk either (a) uses an **account-scoped** last-seen timestamp if a prefs API already exists from WA-14 / RS-10, or (b) labels the marker as **this browser** in helper copy. Do not imply cross-device continuity that localStorage cannot provide.

## Why

Professionals rotate laptop and desktop. Casual SPAs treat localStorage as the user. A livelihood desk must not train architects to trust a green dot that only means “this Chrome profile.”

## Context

- `archlucid-ui/src/lib/usability/last-visited-watermark.ts`
- `archlucid-ui/src/components/usability/NewSinceLastVisitMarker.tsx`
- `archlucid-ui/src/hooks/use-review-detail-last-visited.ts`
- `archlucid-ui/src/components/governance/findings/GovernanceFindingsList.tsx`
- Account prefs storage from WA-14 / RS-10 — reuse, do not invent a third prefs stack
- Do not persist tokens

## What to build

1. Inventory call sites of `markLastVisitedNow` / `isNewSinceLastVisit`.
2. If an account preference API is already available for workspace prefs, store last-seen per (user, surface key) there and read it on load. If not, add one helper line near the marker: “New since last visit in this browser.”
3. Do not show “new” for sample / showcase ids on live Working lists (LD-02 never-sample).
4. Vitest: helper copy or account-backed read is present; clearing mock localStorage without an account pref does not claim account-wide “caught up.”

## Acceptance criteria

- Working users are not told a finding is unseen on machine B when they already opened it on machine A **unless** the copy admits this-browser — or the account pref actually synced.
- Guided may keep the same honesty (continuity is not density).

## Constraints

- Do not use localStorage as the only SoT **and** call it account-scoped.
- Do not add a presence product.
- Do not collapse review tabs.
- Do not implement CD-11 Home resume here.
