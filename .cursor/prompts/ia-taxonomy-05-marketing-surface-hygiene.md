# IA taxonomy 05 — Marketing surface hygiene and first-run entry-point consolidation

> **Not yet executed.** Base branch: `master`. Depends on `ia-taxonomy-01`. Full categorization:
> `.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md` § "Category 4".

## Goal

Ensure public marketing pages (`(marketing)` route group) never leak internal routes,
implementation terms, or roadmap labels, and collapse the four competing "first run" entry points
(`/get-started`, `/quick-start`, `/onboarding`, `/help/getting-started`) into one marketing CTA
that hands off to one in-app onboarding flow. This is the acceptance criterion "Public marketing
pages do not feel like internal app screens" from the parent taxonomy request.

## Context

- All public pages live under `archlucid-ui/src/app/(marketing)/`. Sitemap:
  `archlucid-ui/src/app/sitemap.ts` ← `archlucid-ui/src/lib/marketing/public-marketing-seo-paths.ts`
  (`MARKETING_SITEMAP_PATHNAMES`, `MARKETING_ROBOTS_DISALLOW_PREFIXES`).
- Redundant/overlapping "first run" routes today: `/get-started` (marketing, "first-30-min guided
  path"), `/quick-start` (marketing), `/onboarding` + `/onboarding/start` (authenticated app, plus
  legacy redirect pages `/onboard`, `/getting-started`), and `/help/getting-started` (in-app help
  registry slug). Four different surfaces answer "how do I start" today.
- Other pages flagged for overlap review (not pre-decided — audit and recommend in the PR, since
  a marketing/product owner may have intentional reasons for some of these): `/why`, `/see-it`,
  `/try`, `/quick-scan`.
- `/faq` (marketing) vs `/help/procurement` (in-app, `docs/go-to-market/PROCUREMENT_FAQ.md`) —
  overlapping buyer Q&A; check `archlucid-ui/src/lib/marketing-faq.ts` against
  `PROCUREMENT_FAQ.md` for actual content duplication before deciding whether to merge or just
  cross-link.
- Pages that must **never** be linked from any marketing surface: `/why-archlucid` (internal live
  instrumentation, lives in the authenticated architect workspace) and `/demo/explain` (internal demo
  explanation, already demo-blocked). This phase should add a regression check, not just confirm
  by eye.
- `docs/library/DOCUMENTATION_BY_AUDIENCE.md` already flags a related voice issue: customer-visible
  copy should use persona terms from `docs/go-to-market/UI_GLOSSARY_V1.md` (Architect, Executive,
  Admin, Reviewer, Approver, Governance lead, Sponsor), not "Operator" — apply that same check to
  every marketing page while auditing for internal terms.

## What to build

### 1. First-run consolidation

- Designate `/get-started` as the single marketing-facing "how do I start" CTA. Retire
  `/quick-start` as a distinct page: either 301-redirect it to `/get-started` (preferred — no dead
  bookmarks) or, if product/marketing wants to keep it as an A/B variant, document that decision
  explicitly in the PR rather than silently keeping two pages.
- Ensure `/get-started`'s CTA hands off to `/onboarding` (the authenticated in-app flow) rather than
  to `/help/getting-started` (a help article) — the help article becomes the "learn more" link
  from within `/onboarding`, not the primary path.
- Keep the legacy redirect pages (`/onboard`, `/getting-started` → `/onboarding`) as-is; they're
  already handling old bookmarks correctly per the explore audit.

### 2. Internal-leak audit

- Grep every file under `archlucid-ui/src/app/(marketing)/` and its dedicated components (e.g.
  anything under a `marketing/` component folder) for: internal route prefixes (`/admin`,
  `/governance/`, `/settings/`, `/operate/`), `TB-` roadmap labels, and "Operator" persona voice
  per the glossary rule above. Fix any hits found; if a hit is a legitimate cross-link (e.g. a
  buyer-facing CTA that correctly deep-links into `/signup` or `/trust`), leave it and note why in
  a code comment only if the exception is non-obvious.
- Add a regression test (simple string-match test over the marketing route source files, or a
  Playwright link-crawl if one already exists for marketing pages) asserting no marketing page
  contains a rendered link to `/why-archlucid` or `/demo/explain`.

### 3. FAQ de-duplication

- Compare `archlucid-ui/src/lib/marketing-faq.ts` against `docs/go-to-market/PROCUREMENT_FAQ.md`
  (surfaced in-app as `/help/procurement`). Where the same question is answered in both, keep the
  fuller/technical answer in the Category 2/5 help entry and shorten the marketing FAQ entry to a
  buyer-friendly summary with a link to the fuller answer — do not just delete one copy without
  checking whether the marketing page needs a self-contained answer for SEO/conversion reasons.

### 4. Overlap review (recommend, don't auto-merge)

- For `/why`, `/see-it`, `/try`, `/quick-scan`: read each page's current copy and purpose, and
  produce a short recommendation table (keep / merge into X / retire with redirect) in the PR
  description. Only act on merges/retirements that are unambiguous; flag ambiguous ones for owner
  sign-off rather than deciding unilaterally, consistent with this repo's practice of pausing on
  ambiguous marketing/GTM calls.

## Tests

- Redirect test for `/quick-start` → `/get-started` (if retired).
- Link-crawl/regression test asserting `/why-archlucid` and `/demo/explain` are unreachable from
  any marketing page's rendered output.
- Update `archlucid-ui/src/lib/marketing/public-marketing-seo-paths.ts` sitemap/robots lists if any
  route is retired, and add/extend a test that the sitemap has no dead entries.

## Acceptance criteria

- Exactly one marketing-facing "how do I start" CTA remains (or two, with an explicit, documented
  reason for keeping both).
- No marketing page links to `/why-archlucid` or `/demo/explain`, enforced by a test.
- No marketing page contains an internal route prefix, `TB-` label, or "Operator" persona voice,
  enforced by a test or explicitly reviewed and justified per hit.
- `/faq` and `/help/procurement` no longer duplicate full answers verbatim.

## Non-goals

- Do not redesign visual styling of marketing pages — this phase is content/routing hygiene only.
- Do not change `/pricing`'s request-demo CTA mechanics.
- Do not retire `/why`, `/see-it`, `/try`, or `/quick-scan` without an explicit recommendation and
  sign-off path (see § 4).

## References

- `.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md`
- `.cursor/prompts/ia-taxonomy-01-foundation-doc-and-registry-metadata.md`
- `docs/library/DOCUMENTATION_BY_AUDIENCE.md`
- `docs/go-to-market/UI_GLOSSARY_V1.md`
- `archlucid-ui/src/lib/marketing/public-marketing-seo-paths.ts`
- `archlucid-ui/src/app/sitemap.ts`

## Commit / PR

- Do not commit or open a PR from this prompt without the user naming a target branch at
  execution time (base is `master`).
