> **Scope:** Next.js architect workspace experience flags (`NEXT_PUBLIC_*`) — documents buyer-default vs full architect workspace only, not API auth or backend behavior.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Architect workspace experience modes

**Audience:** Deployers wiring `archlucid-ui` for pilots or production.

**Legacy filename / env:** doc path and `NEXT_PUBLIC_OPERATOR_EXPERIENCE` keep the historical `operator` identifier; product language is **architect workspace**.

## Production default: Working desk (TB-643 history)

**Production identity (2026-09):** authenticated **Working** seats on env-unset builds use **dense architect-workspace chrome** via `resolveProductionDeskChrome()` / `useProductionDeskChrome()`. Demo, static showcase, frictionless trial, and **Guided** mode use eval/teaching chrome via `resolveProductionEvalChrome()`.

`isBuyerPolishedOperatorShellEnv()` is **false** on production Working builds (PT-01). It remains **true** only for demo, static-showcase, and frictionless trial — not for Guided mode (Guided uses workspace mode via the production desk resolver).

**TB-643 history:** deploy docs previously described buyer-oriented chrome as the production default before Working desk landed. Vocabulary (TB-645) stays buyer-polished on all customer surfaces regardless of density.

## Buyer-default shell (omitted `NEXT_PUBLIC_OPERATOR_EXPERIENCE`)

When **`NEXT_PUBLIC_OPERATOR_EXPERIENCE`** is **unset** or not equal to `operator`, production **Working** seats get architect-workspace density (shortcut chips, nav metadata, identifiers behind disclosures) without setting this flag. **Guided** mode and demo/trial/static builds keep eval/teaching chrome.

**Does not change:** API authorization, RBAC, or progressive disclosure toggles in the sidebar footer (`Show analysis & investigation tools`, `Show governance, audit & admin controls`). Those still gate Operate-layer links per [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md).

## Full architect workspace (`NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`)

Set to **`operator`** (case-insensitive) for **internal** or **power-user** deployments that opt into **engineering chrome**: dense nav metadata, shortcut hints, technical identifiers, COGS/telemetry surfaces, and LLM budget admin widgets. **Buyer-polished vocabulary remains the default** even with this flag — it does not revert labels to raw run/manifest jargon (see **TB-645** for the vocabulary pass).

Local `next dev` sets this in **`archlucid-ui/.env.development`** so engineers keep the historical full-workspace layout.

## Demo / static showcase builds

**`NEXT_PUBLIC_DEMO_MODE`** and **`NEXT_PUBLIC_DEMO_STATIC_OPERATOR`** still force **buyer-polished** chrome and curated static payloads where documented. They are independent of `NEXT_PUBLIC_OPERATOR_EXPERIENCE`: demo builds stay buyer-safe, and production operator builds no longer need demo flags for buyer-default language (TB-643).

## Working-mode architect chrome (production default)

**Working** workspace mode unlocks dense architect-workspace chrome on production builds without setting `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`: shortcut chips, denser nav metadata, and technical identifiers behind existing disclosures. Guided mode and all demo / trial / static-showcase flags keep buyer-polished chrome.

Implementation: `resolveArchitectWorkspaceChrome()` / `useArchitectWorkspaceChrome()` in `archlucid-ui/src/lib/architect-workspace-chrome.ts`.

## Guided vs Working workspace mode

Personal preference stored in `dbo.UserSettings` (`WorkspaceMode`). **Missing/null server values default to Working** (repeat-professional default).

| Mode | Behavior |
|------|----------|
| **Working** (default) | Teaching chrome off — Overview leads with the work queue; full authorized nav unlocks even before first commit; dense architect chrome on production builds; Getting started demoted from main nav. |
| **Guided** | Teaching chrome on — tours, first-finding strips, shortcut coaches, Where to go next strips, sample reviews on Overview when enabled. Live architecture packages only. |

Users switch modes in **Account → Preferences → Workspace mode**. After the user's first sealed review, Working-mode users may see a dismissible offer to switch to Guided for teaching chrome — never an auto-switch.

API: `GET /v1/user/preferences` returns `workspaceMode` and `workspaceModeGraduationOffer`; `PUT /v1/user/preferences/workspace-mode` and `PUT /v1/user/preferences/workspace-mode-graduation-offer` persist changes.

Frontend: `WorkspaceModeProvider` in `archlucid-ui/src/app/layout.tsx`; `useTeachingChromeVisible()` gates teaching surfaces.

## Related

- [operator-shell.md](operator-shell.md) — workflow and nav behavior
- [DEMO_FLAGS_AND_UNIT_TESTS.md](../../archlucid-ui/docs/DEMO_FLAGS_AND_UNIT_TESTS.md) — Vitest and demo env pitfalls
- [nav-shell-visibility.ts](../../archlucid-ui/src/lib/nav-shell-visibility.ts) — thin nav surface for **public demo** builds only (not buyer-default production)
