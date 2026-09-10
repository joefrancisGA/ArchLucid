# PL-03 — Catalog shuffle (playground + assignment honesty)

**Do not** duplicate `nav-config`. **Do not** split git branches per product. **Do not** hide desktop review tabs behind **More**. **Do not** move recycle bin to `both` (it restores architecture projects; exact href beats nested `/administration/workspace-settings`).

## Goal

Shuffling destinations between Architecture and Security stays a **catalog edit** (plus optional localStorage overlay), not a nav rewrite.

1. Keep `PRODUCT_LINE_NAV_ASSIGNMENTS` in `archlucid-ui/src/lib/product-line/product-line-catalog.ts` as the committed source of truth.
2. `/internal/product-line` playground remains the browser overlay; Reset restores catalog defaults.
3. Nested prefixes stay documented: `/governance/infrastructure` covers `/governance/infrastructure/resources/:id`. Unlisted hrefs default to **architecture**.
4. After a shuffle, add/adjust Vitest in `product-line-catalog.test.ts` for the moved hrefs (exact + nested).

## Why

The owner will move features between the two UIs a lot after seeing both windows. The cheap path must stay “edit the catalog / use the playground,” not “fork the app.”

## Context

- `archlucid-ui/src/lib/product-line/product-line-catalog.ts`
- `archlucid-ui/src/lib/product-line/product-line-path-access.ts`
- `archlucid-ui/src/app/(operator)/internal/product-line/page.tsx`
- `archlucid-ui/src/components/product-line/ProductLinePlaygroundClient.tsx`
- `archlucid-ui/docs/NAV_CONFIG_CONTRACT.md` product-line section
- Security spine today: `operate-infrastructure`, OpSec factory pages still under Approval (`/governance/remediation-factory`, `remediation-patterns`, `audit-evidence`), Integrations, shared Administration, Internal diagnostics (not GTM trial/pricing/replay/learning)

## What to build

Only what the owner named in **this** session (specific hrefs). If they did not name hrefs, polish playground copy and the catalog comment block so a two-year engineer can shuffle without reading the whole nav file. Do not invent a large reshuffle.

1. Catalog comments: `both` vs default architecture vs exact-match override.
2. Playground: show current env product, cookie, overlay vs catalog; warn that `-OpenPath` architecture routes 404/bounce on :3001.
3. Tests for any href you actually move.

## Acceptance criteria

- A shuffle is one catalog map (or overlay) + tests. No second `nav-config`.
- Recycle bin remains Architecture-only unless the owner explicitly says otherwise in that session.
- Help, account, auth, `/403`, `/why-archlucid`, `/internal/product-line` stay reachable in both shells.

## Constraints

- Do not change finding engines, INV-006, or API hosts.
- Do not add GTM **M-90 / M-44 / M-91 / M-92**.
- Commit on the named product-line branch. Stage catalog + playground + tests only.
