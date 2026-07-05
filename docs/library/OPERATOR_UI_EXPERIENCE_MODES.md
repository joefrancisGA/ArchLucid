> **Scope:** Next.js operator shell experience flags (`NEXT_PUBLIC_*`) — documents buyer-default vs full-operator UI only, not API auth or backend behavior.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Operator UI experience modes

**Audience:** Deployers wiring `archlucid-ui` for pilots or production.

## Buyer-default shell (default for all authenticated builds — TB-643)

**`isBuyerPolishedOperatorShellEnv()`** is **true** for production operator deploys, demos, and frictionless trial — independent of **`NEXT_PUBLIC_OPERATOR_EXPERIENCE`**. Buyer-friendly labels, hidden dev chrome, and audience-tier API problem details are the default customer experience.

**Does not change:** API authorization, RBAC, or progressive disclosure toggles in the sidebar footer (`Show analysis & investigation tools`, `Show governance, audit & admin controls`). Those still gate Operate-layer links per [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md). Dense **System Administration** nav remains behind **`NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV`** / internal-operator flags.

## Full operator shell (`NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator`)

Set to **`operator`** (case-insensitive) for **internal** engineer builds that opt into dense dev chrome, technical identifiers, engineering budget banners, and shortcut hints — **without** disabling buyer-polished vocabulary.

## Demo / static showcase builds

**`NEXT_PUBLIC_DEMO_MODE`** and **`NEXT_PUBLIC_DEMO_STATIC_OPERATOR`** still force **buyer-polished** chrome and curated static payloads where documented. They are independent of `NEXT_PUBLIC_OPERATOR_EXPERIENCE` for labeling purposes: demo builds stay buyer-safe regardless of the operator-experience flag.

## Related

- [operator-shell.md](operator-shell.md) — workflow and nav behavior
- [DEMO_FLAGS_AND_UNIT_TESTS.md](../../archlucid-ui/docs/DEMO_FLAGS_AND_UNIT_TESTS.md) — Vitest and demo env pitfalls
- [nav-shell-visibility.ts](../../archlucid-ui/src/lib/nav-shell-visibility.ts) — thin nav surface for **public demo** builds only (not buyer-default production)
