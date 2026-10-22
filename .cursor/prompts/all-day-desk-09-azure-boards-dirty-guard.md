# AD-09 — Azure Boards connection form leaves the dirty-guard deferral list

**Do not fork LD-12 or RS-07.** The inventory already documents `integrations/azure-boards-connection` on `LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES`. This file **closes that deferral**: wire `useLivelihoodDocumentGuards` like Teams/ServiceNow/SAML, then remove the deferred id (or replace it with an empty list).

## Goal

The Azure Boards connection / credentials form cannot silently lose typed work via sidebar or Alt+R. After save, the guard is off. Add the surface to `LIVELIHOOD_DOCUMENT_GUARD_SURFACES` and drop it from `LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES`.

## Why

Professionals paste a connection string, get a Slack ping, and click Reviews. LD-12 named this leftover so the inventory would not silently grow. It is still deferred. An all-day desk does not keep a known hole.

## Context

- `archlucid-ui/src/lib/livelihood-document-guard-inventory.ts` — deferred list
- Grep `azure-boards` under `archlucid-ui/src/app/(operator)/integrations`
- `use-livelihood-document-guards.tsx`
- Teams / ServiceNow clients — copy the dirty predicate style, do not invent a second dialog

## What to build

1. Find the mutating Azure Boards form. Wire the helper + dialog when dirty.
2. Move the id from deferred → guarded. Update `livelihood-document-guard-guard.test.ts`.
3. Do not guard URL-only filter query params on that page.
4. Vitest: dirty Boards form opens the guard; deferred list no longer contains `integrations/azure-boards-connection`.

## Acceptance criteria

- Azure Boards is not a documented exception anymore.
- RS-07 still fails CI when a **new** dirty document omits the helper.
- No `window.confirm`.

## Constraints

- Do not persist connection secrets in localStorage.
- Do not add a second guard library.
- Do not implement finding inspect here (AD-01).
