# IA taxonomy 03 — Split `/help` into "Guides" (product help) and "Documentation" (technical)

> **Not yet executed.** Base branch: `master`. Depends on `ia-taxonomy-01` (`contentKind` field
> must exist on the registry before this phase consumes it). Do not run concurrently with
> `ia-taxonomy-04` — both touch `help-center-catalog.ts`. Full categorization:
> `.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md` §§ "Category 2" / "Category 3".

## Goal

Make `/help` visually and structurally distinguish **product help** (buyer-safe task guidance)
from **technical documentation** (deeper reference, admin/developer-facing, PDF-exportable),
so users can tell "Help" from "Documentation" at a glance — this is the acceptance criterion
"Users can distinguish Help from Documentation" from the parent taxonomy request.

## Context

- `archlucid-ui/src/app/(operator)/help/page.tsx` renders `HelpProductGuide` + `HelpDocsClient`
  tabs today via `HelpTabsShell.tsx` — some tab scaffolding may already exist; read this file
  first and reuse/rename rather than building a third tab system.
- `archlucid-ui/src/lib/help-center-catalog.ts` — has `tier: 'product' | 'admin' | 'internal'`.
  This phase reclassifies the **product**-tier documentation-shaped entries (see table below) into
  a distinct "Documentation" grouping, using the `contentKind` field added in phase 01. It does
  **not** touch the `internal` tier's visibility logic — that is phase 04's job, and both phases
  editing this file concurrently would conflict.
- `archlucid-ui/src/lib/help-topics.ts` (drawer/search index) and `HelpSearchPanel.tsx` /
  `HelpPanel.tsx` / `help/HelpDrawerContent.tsx` also need the same Guides/Documentation grouping
  so the search drawer matches the `/help` page's structure.
- Entries to move from "Guide" styling to "Documentation" styling (per
  `ia-taxonomy-00-plan-and-sitemap.md` § Category 3): `configuration-reference`,
  `operator-auth-roles`, `cli-usage`, `api-contracts`, `admin-diagnostics`,
  `developer-troubleshooting`.
- Entries that stay "Guide": `getting-started`, `review-guide`, `first-pilot-path`, `pilot-guide`,
  `cloud-connections*`, value-report guide topic(s), advisory scans guide topic(s),
  `enterprise-onboarding`, `procurement`, `how-it-works`.
- In-app deep links that currently mix a settings UI with embedded technical prose —
  `/settings/identity/sso-wizard`, `/settings/api-keys` (+ `ApiKeysSettingsTechnicalDetails.tsx`),
  `/settings/cloud-connections/{azure,aws,gcp}` — should link out to the matching Documentation
  entry rather than duplicating its content inline. Check each for a "learn more"/help link today
  and repoint it if it exists; add one if it doesn't.

## What to build

### 1. `/help` page structure

- Rename/restructure the existing tabs (or the two-section layout, whichever `HelpTabsShell.tsx`
  already implements) into explicit **"Guides"** and **"Documentation"** sections, each populated
  by filtering the registry on `contentKind` (from phase 01) rather than `tier`.
- Documentation section gets a visible "Documentation" badge/label per entry (distinct from the
  Guides section's styling) — this is the acceptance-criterion signal that users can tell Help from
  Documentation.
- Documentation entries get a PDF export affordance. If no PDF export mechanism exists yet in the
  codebase, check for a print-stylesheet or existing export utility before building a new one
  (reuse first); a minimal "Print / Save as PDF" browser-native action is an acceptable first
  implementation if no export pipeline exists — do not build a server-side PDF renderer for this
  phase unless one already exists and is easy to reuse.

### 2. Search + drawer parity

- Update `help-topics.ts`, `HelpSearchPanel.tsx` search results, and `help/HelpDrawerContent.tsx`
  to show the same Guides/Documentation distinction (e.g., a small label next to each result) so
  the drawer and the full `/help` page never disagree about an entry's category.

### 3. Settings-page deep links

- Repoint the SSO wizard, API keys, and cloud-connection settings pages' existing help links (or
  add one where missing) to the corresponding Documentation entry, replacing any embedded
  long-form technical prose in the settings UI itself with a short pointer + link, consistent with
  the phase 02 pattern (short in-line + link out to the fuller doc).

## Tests

- Update `product-documentation-registry.test.ts` / `help-center-catalog` tests (per the explore
  audit, tests already exist for these files) to assert the Guides/Documentation split matches the
  table above.
- Add or update a `/help` page test asserting the Documentation section renders a badge and a
  PDF-export affordance, and the Guides section does not.
- Update `HelpTopicEnterpriseOnboarding.test.tsx` (referenced in `tb-720`) if it asserts on tab
  structure.

## Acceptance criteria

- `/help` visually separates Guides from Documentation; a user can tell which section they're in
  without reading the article itself.
- Documentation entries have a working PDF/print export action.
- Search drawer results carry the same Guides/Documentation label as the full page.
- `/settings/identity/sso-wizard`, `/settings/api-keys`, `/settings/cloud-connections/*` link to
  their matching Documentation entry instead of inlining the same depth of technical detail twice.
- No regression to existing `/help/{slug}` URLs — this phase reclassifies existing entries, it does
  not rename or remove any slug.

## Non-goals

- Do not change the `internal` tier's gating (phase 04).
- Do not remove any existing `/help/{slug}` route.
- Do not build a new server-side PDF rendering pipeline if one doesn't already exist — browser
  print-to-PDF is an acceptable v1.

## References

- `.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md`
- `.cursor/prompts/ia-taxonomy-01-foundation-doc-and-registry-metadata.md`
- `.cursor/prompts/tb-720-per-cloud-connection-help-pages.md` (recent, related precedent for
  `/help` registry/slug changes — read it for the current registry conventions before editing)
- `archlucid-ui/src/lib/help-center-catalog.ts`
- `archlucid-ui/src/lib/help-topics.ts`
- `archlucid-ui/src/app/(operator)/help/page.tsx`, `HelpTabsShell.tsx`

## Commit / PR

- Do not commit or open a PR from this prompt without the user naming a target branch at
  execution time (base is `master`).
