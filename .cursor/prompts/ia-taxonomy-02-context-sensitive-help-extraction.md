# IA taxonomy 02 — Extract short, page-scoped context-sensitive help

> **Not yet executed.** Base branch: `master`. Depends on `ia-taxonomy-01` (uses its
> `contentKind` groundwork as a reference, not a hard blocker on files). Full categorization:
> `.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md` § "Category 1".

## Goal

Replace today's pattern — a page-level help button that deep-links straight into a full `/help`
article — with a short, in-line, page-scoped answer to exactly four questions (what is this page /
what should I do next / why is this state empty / where do I configure the prerequisite), so
long-form documentation is no longer the first thing a confused user sees.

## Context

- Today: `archlucid-ui/src/components/usability/PageContextualHelpButton.tsx` +
  `archlucid-ui/src/lib/usability/page-help-topic-map.ts` map a route straight to `/help/{slug}` —
  a full article, not a short answer. This conflates Category 1 (context help) with Category 2/3
  (product help / technical docs).
- Existing short-form building blocks already exist and should be reused, not replaced:
  `archlucid-ui/src/components/ContextualHelp.tsx`, `FieldHelpTooltip.tsx`, `GlossaryTooltip.tsx`,
  `InfoTooltip.tsx`, `ToolbarHelpTooltip.tsx`, `archlucid-ui/src/components/ui/help-tooltip.tsx`,
  `help-button.tsx`, `help-tooltip-trigger.tsx`, and the base `archlucid-ui/src/components/ui/tooltip.tsx`.
- `archlucid-ui/src/lib/contextual-help-content.ts` already holds a small set of field-local help
  strings — this is the closest existing analog to the new registry; look here first for naming
  conventions before adding a new file.
- `archlucid-ui/src/lib/layer-guidance.ts` (per-route orientation copy) may already contain some of
  the "what is this page" answers in a different shape — check for reuse before writing new copy
  (repo convention: be aggressive about reuse).
- Starting page list (extend if more empty-state-heavy pages are found during implementation):
  `/reviews` (empty state), `/governance/findings`, `/digests`, `/planning`, `/advisory`,
  `/value-report`.

## What to build

### 1. Content model

- Add `archlucid-ui/src/lib/contextual-help-registry.ts` keyed by a page identifier (reuse whatever
  key scheme `page-help-topic-map.ts` already uses for routes, for consistency). Each entry has up
  to four short string/JSX fields: `whatIsThisPage`, `whatToDoNext`, `whyEmpty` (optional — only
  pages with a real empty state need it), `whereToConfigurePrerequisite` (optional — only pages
  with a real prerequisite need it).
- Enforce the length/content constraint from the taxonomy (`ia-taxonomy-00...md` § Category 1) in
  a lint/test, not just a code comment: no field may contain a `/` followed by a known internal
  route prefix (`/admin`, `/api/`, `/governance/`, etc.), no raw API path strings, no `TB-` roadmap
  labels. A simple regex-based Vitest assertion over the registry file is sufficient — do not build
  a new CI script for this alone.

### 2. UI

- Add a lightweight popover component (or extend `ContextualHelp.tsx` if its existing shape fits)
  that renders the up-to-four answers inline, with a single "Learn more" link at the bottom that
  points to the matching Category 2/3 page (source that link from `page-help-topic-map.ts` — that
  map's job going forward is "learn more" targets, not primary contextual help).
- Wire `PageContextualHelpButton.tsx` to prefer `contextual-help-registry.ts` when an entry exists
  for the current page; fall back to today's direct `/help` deep link only for pages not yet
  migrated, so this can land incrementally without breaking pages not on the starting list.

### 3. Content for the starting page list

- Write the four-question copy for `/reviews`, `/governance/findings`, `/digests`, `/planning`,
  `/advisory`, `/value-report`, grounded in what those pages actually show today (read each page's
  current empty-state copy before writing — reuse existing wording where it already fits the
  4-question shape instead of rewriting from scratch).

## Tests

- Unit test for `contextual-help-registry.ts` content constraints (no internal routes/API
  paths/roadmap labels — see above).
- Component test for the new popover: renders available fields, omits absent optional fields,
  renders the "Learn more" link only when a `page-help-topic-map.ts` entry exists.
- Update or add a test asserting `PageContextualHelpButton` prefers the registry entry over the
  direct `/help` link when both exist.

## Acceptance criteria

- The six starting pages show short, in-line answers instead of (or in addition to, during
  migration) a raw jump to a full `/help` article.
- No page's contextual help exceeds ~120 words total across all four fields.
- No contextual help field contains an internal route, API path, implementation detail, or
  roadmap/TB label (enforced by the test in "What to build" § 1).
- Pages not yet migrated keep working exactly as before (fallback path).

## Non-goals

- Do not migrate every operator page in this phase — six pages is the starting scope; broader
  rollout is a follow-up once this pattern is validated.
- Do not remove `page-help-topic-map.ts` or the full `/help` articles — they remain the "learn
  more" destination and the Category 2/3 content itself.
- Do not change `/help` routing or the registry/catalog structure (that's phase 03).

## References

- `.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md`
- `.cursor/prompts/ia-taxonomy-01-foundation-doc-and-registry-metadata.md`
- `archlucid-ui/src/lib/usability/page-help-topic-map.ts`
- `archlucid-ui/src/components/usability/PageContextualHelpButton.tsx`
- `archlucid-ui/src/lib/contextual-help-content.ts`
- `archlucid-ui/src/lib/layer-guidance.ts`

## Commit / PR

- Do not commit or open a PR from this prompt without the user naming a target branch at
  execution time (base is `master`).
