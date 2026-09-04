# AD-06 — Collab strip stays honest and shows as-of freshness

**Do not fork RS-11 or TB-2248.** Concurrent 409 recovery is RS-11. The strip already refuses live viewers (`COLLAB_RECENT_ACTOR_PRESENCE_HONESTY_NOTE`). This file is the leftover **stale desk**: inspect can sit open while another architect disposes; the strip still says “no recent other actors” until a full reload, with timestamps that may be raw UTC.

## Goal

On finding inspect (and list conflict cue if RS-14 already surfaces conflict), show **as of {local time}** and a **Refresh** control that reloads disposition history. Keep the honesty note. Do **not** add occupancy, cursors, or WebSocket presence. Actor labels should be display names when the parent already has them; do not show raw user ids if a display label is on the event.

## Why

Livelihoods depend on who last recorded a disposition. Casual tools fake “3 people here.” ArchLucid correctly refuses that lie. The remaining failure is a quiet, stale strip that looks like a live collab product.

## Context

- `archlucid-ui/src/components/CollabRecentActorPresenceStrip.tsx`
- `archlucid-ui/src/lib/collab-recent-actor-presence.ts`
- Finding inspect parent that passes `recentActors` / disposition history
- RS-11 conflict recovery — do not duplicate 409 UI; link Refresh to the same query invalidation
- TB-2012 local datetime honesty if showing clock times

## What to build

1. Record `asOfUtc` when the history payload is received. Render local “As of …” plus **Refresh** that refetches disposition history (existing query).
2. Prefer human `whenLabel` (relative or local datetime) — not raw ISO in the body if a formatter already exists nearby.
3. Keep `data-has-recent-actors` and the honesty note. Empty body stays “others may still be working — refresh if stale.”
4. Vitest: strip exposes as-of text; Refresh is a button not a fake live badge; no “viewing now” copy.

## Acceptance criteria

- An architect can update the recent-actor trail without leaving inspect.
- Copy never claims live presence.
- 409 conflict UI remains RS-11 (refresh-to-server on lost write).

## Constraints

- Do not add SignalR / SSE occupancy.
- Do not invent display names from email scraping if the API only has user id — keep id but do not call it a person’s full name.
- Do not collapse review tabs.
