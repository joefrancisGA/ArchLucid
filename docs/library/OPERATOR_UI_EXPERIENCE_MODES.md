> **Scope:** Next.js operator shell experience flags (`NEXT_PUBLIC_*`) — documents buyer-default vs full-operator UI only, not API auth or backend behavior.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Operator UI experience modes

**Audience:** Deployers wiring `archlucid-ui` for pilots or production.

## Buyer-default shell (omitted `NEXT_PUBLIC_OPERATOR_EXPERIENCE`)

When **`NEXT_PUBLIC_OPERATOR_EXPERIENCE`** is **unset** or not equal to `operator`, the UI uses the **buyer-oriented** operator shell: friendlier labels, fewer shortcut chips, and deliverables-first copy on review detail. This is the **default for new tenants** to reduce cognitive load.

**Does not change:** API authorization, RBAC, or progressive disclosure toggles in the sidebar footer (`Show analysis & investigation tools`, `Show governance, audit & admin controls`). Those still gate Operate-layer links per [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md).

## Full operator shell (`NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`)

Set to **`operator`** (case-insensitive) for **internal** or **power-user** deployments that want dense nav metadata, shortcut hints, and technical identifiers surfaced consistently.

Local `next dev` sets this in **`archlucid-ui/.env.development`** so engineers keep the historical operator layout.

## Demo / static showcase builds

**`NEXT_PUBLIC_DEMO_MODE`** and **`NEXT_PUBLIC_DEMO_STATIC_OPERATOR`** still force **buyer-polished** chrome and curated static payloads where documented. They are independent of `NEXT_PUBLIC_OPERATOR_EXPERIENCE` for labeling purposes: demo builds stay buyer-safe regardless of the operator-experience flag.

## Related

- [operator-shell.md](operator-shell.md) — workflow and nav behavior
- [DEMO_FLAGS_AND_UNIT_TESTS.md](../../archlucid-ui/docs/DEMO_FLAGS_AND_UNIT_TESTS.md) — Vitest and demo env pitfalls
- [nav-shell-visibility.ts](../../archlucid-ui/src/lib/nav-shell-visibility.ts) — thin nav surface for **public demo** builds only (not buyer-default production)
