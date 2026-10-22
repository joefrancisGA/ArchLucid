# IA taxonomy 01 — Foundation doc + content-kind metadata (docs-only, low risk)

> **Not yet executed.** Base branch: `master`. Depends on nothing; unblocks phases 02–06.
> Full categorization and target sitemap: `.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md`.

## Goal

Establish one canonical, written definition of ArchLucid's five-part content taxonomy
(context-sensitive help / product help / technical documentation / marketing / security & trust),
and tag every existing `/help` registry entry with an explicit `contentKind` so later phases
(02–06) have a single source of truth to move, split, or gate content against — without changing
any user-visible behavior in this phase.

## Context

- No such taxonomy doc exists today. The closest analog, `docs/library/DOCUMENTATION_BY_AUDIENCE.md`,
  covers **repo** documentation audience routing (customer/evaluator vs contributor/internal) — it
  is about `docs/` markdown, not the in-app `/help` surface or the marketing/trust route split.
- `archlucid-ui/src/lib/product-documentation-registry.ts` — 47 topics, no `contentKind` field today.
- `archlucid-ui/src/lib/help-center-catalog.ts` — has a `tier: 'product' | 'admin' | 'internal'`
  field already; this phase does **not** remove or rename `tier` (phase 04 depends on it staying
  intact for the internal-gating fix) — it adds `contentKind` alongside it.
- `archlucid-ui/src/lib/usability/page-help-topic-map.ts` — route → `/help/{slug}` map, currently
  the only "contextual help" mechanism; phase 02 will add a parallel short-form registry, this
  phase just documents the intent so phase 02 isn't inventing the taxonomy from scratch.

## What to build

### 1. Foundation doc

Add `docs/architecture/INFORMATION_ARCHITECTURE.md` with:

- The five-category taxonomy table from `ia-taxonomy-00-plan-and-sitemap.md` § "Taxonomy definitions".
- A short "decision record" style note: why `(marketing)`, `(operator)`, `(executive)` route groups
  map to "app-only authenticated" vs "public marketing" (Category 4), and why Category 1
  (context-sensitive help) intentionally has no dedicated routes.
- A pointer to `docs/library/DOCUMENTATION_BY_AUDIENCE.md` clarifying the relationship: that doc
  routes **repo markdown** by reader; this doc routes **in-app and public product surfaces** by
  content kind. They are complementary, not duplicates.
- Add the required `Audience:` scope line per `.cursor/rules/Doc-Scope-Header.mdc` if that rule
  applies to new docs under `docs/architecture/`.

### 2. `contentKind` metadata

- Add a `contentKind: 'product-help' | 'technical-documentation' | 'internal-runbook'` field to
  each entry in `product-documentation-registry.ts`, seeded per the tables in
  `ia-taxonomy-00-plan-and-sitemap.md` §§ "Category 2" / "Category 3" (including the three
  internal-runbook slugs: `first-pilot-operator-runbook`, `first-value-20-minutes`,
  `pre-commit-ci-gate`).
- Keep the field additive and unused by rendering logic in this phase — no UI change yet. This is
  metadata-only groundwork; phase 03 consumes it for the Guides/Documentation tab split and phase 04
  consumes it for the internal-runbook gating fix.
- Add a type-level exhaustiveness check (discriminated union, `never` default case) anywhere this
  new union is switched on, per the repo's TypeScript exhaustive-switch convention.

### 3. Registry content-quality guard

- If a content-quality CI script already validates `product-documentation-registry.ts` (check
  `scripts/ci/` for an existing registry/documentation lint), extend it to assert every entry has a
  non-empty `contentKind`. If no such script exists, add a small Vitest unit test
  (`product-documentation-registry.test.ts` already exists per the explore audit — extend it)
  asserting the same, rather than creating a new CI script for this alone.

## Tests

- Extend `product-documentation-registry.test.ts` to assert every topic has a `contentKind` and
  that the three internal-runbook slugs are tagged `internal-runbook`.
- No snapshot or visual test changes expected (no rendering change in this phase).

## Acceptance criteria

- `docs/architecture/INFORMATION_ARCHITECTURE.md` exists, is linked from
  `docs/library/DOCUMENTATION_BY_AUDIENCE.md` § Related, and is linked from
  `docs/architecture/ui_routes.md` if that file has a "see also" section.
- Every entry in `product-documentation-registry.ts` has a `contentKind`.
- No change to any rendered `/help` page, nav item, or route. `git diff` against `master` should
  touch only: the new doc, the registry file (additive field), and its test file.

## Non-goals

- Do not change `help-center-catalog.ts` tiers or visibility logic (that's phase 03/04).
- Do not add new routes.
- Do not touch marketing or trust pages (phases 05/06).

## References

- `.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md`
- `docs/library/DOCUMENTATION_BY_AUDIENCE.md`
- `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`
- `archlucid-ui/src/lib/product-documentation-registry.ts`
- `archlucid-ui/src/lib/help-center-catalog.ts`

## Commit / PR

- Do not commit or open a PR from this prompt without the user naming a target branch at
  execution time (base is `master`, but the working branch must still be named explicitly per
  repo policy).
