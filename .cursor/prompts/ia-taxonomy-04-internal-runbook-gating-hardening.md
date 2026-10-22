# IA taxonomy 04 — Harden internal-runbook gating on `/help/{slug}` (highest priority)

> **Not yet executed.** Base branch: `master`. Depends on `ia-taxonomy-01`. Do not run
> concurrently with `ia-taxonomy-03` — both touch `help-center-catalog.ts`. Full categorization:
> `.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md` § "Pages/behaviors flagged for hiding from
> buyers".

## Why this phase is flagged highest priority

Every other phase in this set is an information-architecture/UX improvement. This one is closer to
a content-exposure gap: `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`,
`docs/runbooks/FIRST_VALUE_20_MINUTES.md`, and `docs/runbooks/CI_GOVERNANCE_GATE.md` (§ Minimal CI starters) are
vendor-internal runbooks that are reachable at `/help/{slug}` today, gated only by an `isAdmin`
prop passed into `listHelpCenterTopics({ showAdvanced, isAdmin })` in
`archlucid-ui/src/lib/help-center-catalog.ts` — i.e., **client-side nav visibility**, not a
server/loader-level access check. Anyone who knows or guesses the slug and can reach
`/help/[...topic]` while authenticated as a non-admin tenant user may be able to load the markdown
directly, depending on whether `archlucid-ui/src/lib/load-product-documentation.ts` itself checks
role before returning content.

## Goal

Verify whether the loader enforces role at fetch time; if it does not, add that enforcement so
internal-tier runbook content is not fetchable by a non-admin session regardless of nav-visibility
state, and reassess whether these three runbooks belong in the customer-facing registry at all.

## Context

- `archlucid-ui/src/app/(operator)/help/[...topic]/page.tsx` — the route handler for
  `/help/{slug}`; read this first to see whether it receives/checks role before calling the loader.
- `archlucid-ui/src/lib/load-product-documentation.ts` — the markdown loader; read to see whether
  it takes a role/authority parameter or unconditionally loads any registered slug's file.
- `archlucid-ui/src/lib/help-center-catalog.ts` — `listHelpCenterTopics({ showAdvanced, isAdmin })`
  controls **nav/search visibility only** based on the explore audit; confirm this by reading the
  function body, since the fix approach differs depending on whether this is truly UI-only.
- `archlucid-ui/src/lib/product-documentation-registry.ts` — after phase 01, these three slugs
  carry `contentKind: 'internal-runbook'`; this phase is the first consumer of that field for an
  actual access-control decision, not just a display label.

## What to build

### 1. Confirm the actual exposure (do this before writing any fix)

- Trace the full call path from `/help/[...topic]/page.tsx` → any role/authority check → the
  loader → the returned markdown, for one of the three flagged slugs. Document in the PR
  description exactly where (if anywhere) role is checked today.
- If the trace shows the content is already unreachable for non-admin sessions server-side (e.g.
  the page component itself 404s/403s before calling the loader for `internal`-tier slugs), this
  phase becomes a hardening/defense-in-depth pass rather than a true fix — still worth doing, but
  say so plainly in the PR.

### 2. Fix (if the loader is unconditional)

- Add a role/authority check at the loader or route-handler level (whichever the existing
  `OperatorRoleGate` / `AdminAuthority` pattern in the codebase makes idiomatic — reuse the same
  mechanism `/admin/*` routes already use per `admin/layout.tsx`) so `contentKind: 'internal-runbook'`
  slugs 404 or 403 for any session without admin authority, independent of what the nav/search UI
  shows.
- Keep the existing nav/search hiding behavior (`isAdmin` gating in `help-center-catalog.ts`) as a
  UX nicety on top of the new enforcement — do not remove it.

### 3. Reassess registry membership

- For each of the three slugs, decide (and record the decision + reasoning in the PR description,
  per this repo's "include reasoning/trade-offs" convention) whether it should:
  a. Stay in the in-app registry, now properly access-controlled for admin sessions only, or
  b. Be removed from the in-app registry entirely and remain repo-only documentation
     (`docs/runbooks/*.md`, read via the repo, not the product), since a runbook a contributor
     reads locally arguably never needed an in-app route.
- Default recommendation (override if investigation finds a real admin-in-product use case):
  option (b) for `pre-commit-ci-gate` (contributor-only, no plausible in-product admin reader) and
  option (a) for `first-pilot-operator-runbook` / `first-value-20-minutes` (plausible tenant-admin
  runbook use during a live pilot).

## Tests

- Add an integration/unit test asserting a non-admin session receives 403/404 (matching whatever
  the app's existing convention is for `/admin/*`) when requesting `/help/first-pilot-operator-runbook`,
  `/help/first-value-20-minutes`, and (if kept) any other internal-runbook slug.
- Add a regression test that an admin session can still load the content.
- If any slug is removed from the registry (option b), add a test asserting `/help/{slug}` now
  cleanly 404s and is absent from search results, rather than leaving a dangling route.

## Acceptance criteria

- Internal-tier runbook content cannot be fetched by a non-admin authenticated session, verified by
  a loader/route-level check, not only by nav/search hiding.
- The PR description states plainly, with evidence, whether this was a real gap or a
  defense-in-depth hardening (per "Do not implement code unless intent is clear" — the
  investigation in step 1 must happen before the fix is written).
- No regression to legitimate admin access to any runbook kept in the registry.

## Non-goals

- Do not change the Guides/Documentation UI split (phase 03) in this same change set if it can be
  avoided — this phase is deliberately scoped to gating, not presentation, to keep the security-
  relevant diff small and reviewable.
- Do not weaken `AdminAuthority` or `OperatorRoleGate` semantics elsewhere while reusing them here.

## References

- `.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md`
- `.cursor/prompts/ia-taxonomy-01-foundation-doc-and-registry-metadata.md`
- `archlucid-ui/src/components/OperatorRoleGate.tsx`
- `archlucid-ui/src/app/(operator)/admin/layout.tsx` (existing `AdminAuthority` gating pattern)
- `archlucid-ui/src/lib/help-center-catalog.ts`, `load-product-documentation.ts`

## Commit / PR

- Do not commit or open a PR from this prompt without the user naming a target branch at
  execution time (base is `master`). Given the security-adjacent nature of this phase, flag it
  for review rather than folding it silently into a larger IA PR.
