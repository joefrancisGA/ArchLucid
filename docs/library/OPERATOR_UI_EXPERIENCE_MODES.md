> **Scope:** Next.js architect workspace experience flags (`NEXT_PUBLIC_*`) — documents buyer-default vs full architect workspace only, not API auth or backend behavior.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Architect workspace experience modes

**Audience:** Deployers wiring `archlucid-ui` for pilots or production.

**Legacy filename / env:** doc path and `NEXT_PUBLIC_OPERATOR_EXPERIENCE` keep the historical `operator` identifier; product language is **architect workspace**.

## Buyer-default shell (omitted `NEXT_PUBLIC_OPERATOR_EXPERIENCE`)

When **`NEXT_PUBLIC_OPERATOR_EXPERIENCE`** is **unset** or not equal to `operator`, the UI uses the **buyer-oriented** architect workspace: friendlier labels, fewer shortcut chips, and deliverables-first copy on review detail. This is the **default for all authenticated production deploys** (TB-643) — not only demo or trial builds.

**Does not change:** API authorization, RBAC, or progressive disclosure toggles in the sidebar footer (`Show analysis & investigation tools`, `Show governance, audit & admin controls`). Those still gate Operate-layer links per [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md).

## Full architect workspace (`NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`)

Set to **`operator`** (case-insensitive) for **internal** or **power-user** deployments that opt into **engineering chrome**: dense nav metadata, shortcut hints, technical identifiers, COGS/telemetry surfaces, and LLM budget admin widgets. **Buyer-polished vocabulary remains the default** even with this flag — it does not revert labels to raw run/manifest jargon (see **TB-645** for the vocabulary pass).

Local `next dev` sets this in **`archlucid-ui/.env.development`** so engineers keep the historical full-workspace layout.

## Demo / static showcase builds

**`NEXT_PUBLIC_DEMO_MODE`** and **`NEXT_PUBLIC_DEMO_STATIC_OPERATOR`** still force **buyer-polished** chrome and curated static payloads where documented. They are independent of `NEXT_PUBLIC_OPERATOR_EXPERIENCE`: demo builds stay buyer-safe, and production operator builds no longer need demo flags for buyer-default language (TB-643).

## Related

- [operator-shell.md](operator-shell.md) — workflow and nav behavior
- [DEMO_FLAGS_AND_UNIT_TESTS.md](../../archlucid-ui/docs/DEMO_FLAGS_AND_UNIT_TESTS.md) — Vitest and demo env pitfalls
- [nav-shell-visibility.ts](../../archlucid-ui/src/lib/nav-shell-visibility.ts) — thin nav surface for **public demo** builds only (not buyer-default production)
