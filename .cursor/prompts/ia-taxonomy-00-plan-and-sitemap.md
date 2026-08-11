# IA taxonomy 00 — Plan, categorization, and revised sitemap (help / docs / marketing / trust)

> **This file is a plan and reference, not an execution prompt.** Do not implement from this
> file directly. It exists so `ia-taxonomy-01` through `ia-taxonomy-06` (each an independently
> executable Composer prompt) share one source of truth for the categorization and target
> sitemap. **Base branch for all six phases: `master`.** None of these six files have been run.
>
> **Backlog:** **TB-732 – TB-737** — in
> [`docs/library/TECH_BACKLOG.md`](../../docs/library/TECH_BACKLOG.md) (see `## TB-732` there).

## Why this exists

ArchLucid's product surface currently mixes five different kinds of content behind one
`(operator)` shell and one `/help` renderer: short contextual help, buyer-safe task guides,
developer/admin technical reference, internal runbooks, and procurement/trust material. This
plan sorts the ~126 `page.tsx` routes and the `/help` registry's 47 topics into the five-category
taxonomy below, then hands off six scoped, sequential Composer prompts to fix the mixing without
one large risky change.

Audit basis: `docs/architecture/ui_routes.md`, `archlucid-ui/src/lib/product-documentation-registry.ts`,
`archlucid-ui/src/lib/help-center-catalog.ts`, `archlucid-ui/src/app/sitemap.ts`,
`archlucid-ui/src/lib/marketing/public-marketing-seo-paths.ts`, `docs/library/DOCUMENTATION_BY_AUDIENCE.md`.

## Taxonomy definitions (do not blur these in any phase)

| # | Category | Reader | Length | Must never contain |
|---|----------|--------|--------|---------------------|
| 1 | Context-sensitive help | Any signed-in user, on the page they're viewing | ≤ ~120 words, 4 answers max (what is this / what next / why empty / where to configure) | Internal routes, API paths, implementation detail, roadmap labels |
| 2 | Product help | Architects, pilot teams, buyers | Task-length guide | Implementation detail, internal-only runbook links |
| 3 | Technical documentation | Admins, integrators, developers | Reference-length, PDF-exportable | — (may include implementation detail; internal-only docs must be role-gated) |
| 4 | Marketing content | Public, unauthenticated | Fast, polished, conversion-focused | Internal routes, implementation terms, roadmap labels |
| 5 | Security & trust materials | Buyers, procurement, security reviewers | Buyer-safe, procurement-safe | Internal implementation detail beyond what a customer's security team should see |

## Category 1 — Context-sensitive help (no dedicated routes)

This category is a **UI pattern**, not a set of pages. It lives in-line on every operator/executive
page via:

- `archlucid-ui/src/components/ContextualHelp.tsx`, `FieldHelpTooltip.tsx`, `GlossaryTooltip.tsx`,
  `InfoTooltip.tsx`, `ToolbarHelpTooltip.tsx`, `ui/help-tooltip.tsx`, `ui/help-button.tsx`,
  `ui/help-tooltip-trigger.tsx`
- `archlucid-ui/src/components/usability/PageContextualHelpButton.tsx` +
  `archlucid-ui/src/lib/usability/page-help-topic-map.ts` (today this maps a page straight to a
  full `/help/{slug}` article — that is the core problem this taxonomy fixes; see phase 02)
- `archlucid-ui/src/lib/contextual-help-content.ts` (today a small, inconsistent set)

**Target state (phase 02):** a dedicated, page-scoped, short-form registry
(`contextual-help-registry.ts`) answering only the four required questions, with a link at the
bottom to the matching Category 2 or 3 page for anyone who needs more. `page-help-topic-map.ts`
stops being the primary contextual-help source; it becomes the "learn more" link target only.

## Category 2 — Product help (buyer-safe guides, under `/help`)

Current `/help` registry slugs (`product-documentation-registry.ts`) that are already buyer-safe
task guidance and should stay tagged **product / guide**:

| Slug | Source doc | Notes |
|------|------------|-------|
| `getting-started` | `docs/library/customer-facing/CONCEPTS_IN_5_MINUTES.md` | Keep |
| `review-guide`, `first-pilot-path`, `pilot-guide` | `docs/library/customer-facing/*.md` | Keep — first review guide |
| `cloud-connections`, `cloud-connections-azure`, `cloud-connections-aws`, `cloud-connections-gcp` | `docs/library/customer-facing/CLOUD_CONNECTIONS*.md` | Keep as **guide** entry point; deep technical steps move under Category 3 (phase 03) |
| `value-report` guide topic(s) | `docs/library/customer-facing/*.md` | Keep — value report guide |
| Advisory scans guide topic(s) | `docs/library/customer-facing/*.md` | Keep — advisory scans guide |
| `enterprise-onboarding` | `docs/library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md` | Keep, buyer-safe checklist |
| `procurement` | `docs/go-to-market/PROCUREMENT_FAQ.md` | Keep, but de-dupe against `/faq` (phase 05) |
| `how-it-works` | `docs/library/customer-facing/HOW_IT_WORKS.md` | Keep |

**Route:** stays `/help` and `/help/{slug}` on the existing registry/loader plumbing
(`archlucid-ui/src/app/(operator)/help/[...topic]/page.tsx`), but visually separated from
Category 3 as a "Guides" tab (phase 03).

## Category 3 — Technical documentation (deeper, may be PDF, may be role-gated)

Reclassify these existing `/help` registry slugs from "guide" to **documentation**:

| Slug | Source doc | Audience | Gate? |
|------|------------|----------|-------|
| `configuration-reference` | `docs/library/CONFIGURATION_REFERENCE.md` | Developer/admin | Documentation tab |
| `operator-auth-roles` | `docs/library/contributor-reference/SECURITY.md` | Developer | Documentation tab |
| `cli-usage` | `docs/library/CLI_USAGE.md` | Developer | Documentation tab |
| `api-contracts` | `docs/library/API_CONTRACTS.md` | Developer | Documentation tab |
| `admin-diagnostics` | `docs/library/customer-facing/OPERATOR_ADMIN_DIAGNOSTICS.md` | Admin | Documentation tab, admin-role gated |
| `developer-troubleshooting` | `docs/runbooks/TROUBLESHOOTING.md`, `COMMON_ERRORS.md` | Developer | Documentation tab |

Plus in-app settings pages that already host technical setup and should be clearly labeled
**documentation-adjacent** (link out to a documentation page instead of embedding full technical
prose inline):

- `/settings/identity/sso-wizard`, `/settings/identity-providers` — SSO configuration
- `/settings/api-keys` (+ `ApiKeysSettingsTechnicalDetails.tsx`) — API keys
- `/settings/cloud-connections/{azure,aws,gcp}` — Azure/AWS/GCP connector technical setup
- `/settings/developer` — developer doc links hub

Not yet in `/help` but referenced as technical setup material in `docs/integrations/` — candidates
to surface as documentation topics or PDFs: `SSO_OKTA_CONFIGURATION.md`, `SSO_AUTH0_CONFIGURATION.md`,
`SCIM_PROVISIONING.md`, `CICD_INTEGRATION.md`.

**Internal-only within this category (must be role-gated, not just guide-labeled — see phase 04):**

| Slug | Source doc | Why internal |
|------|------------|---------------|
| `first-pilot-operator-runbook` | `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md` | Vendor-internal operator runbook, not customer content |
| `first-value-20-minutes` | `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md` (§ First value in 20 minutes) | Vendor-internal |
| `pre-commit-ci-gate` | `docs/runbooks/CI_GOVERNANCE_GATE.md` (§ Minimal CI starters) | Contributor-only, not even admin/customer |

## Category 4 — Marketing content (public, `(marketing)` route group)

All under `archlucid-ui/src/app/(marketing)/`; already unauthenticated and outside the operator
shell — the main work is hygiene (phase 05), not relocation:

| URL | Keep as-is | Consolidate / review |
|-----|------------|------------------------|
| `/welcome` | Overview | — |
| `/pricing` | Pricing | — |
| `/signup` | Start evaluation | — |
| `/signup/verify` | — | — |
| `/faq` | Product FAQ | De-dupe against `/help/procurement` (phase 05) |
| `/why`, `/see-it`, `/try`, `/quick-scan` | — | **Review for overlap/consolidation** (phase 05) |
| `/get-started`, `/quick-start` | — | **Consolidate into one marketing CTA** (phase 05); both currently compete with `/onboarding` and `/help/getting-started` as "first run" entry points |
| `/trust` | Trust Center (public) | Overlaps `/security-trust` — resolve in phase 06 |
| `/security-trust` | Security overview | Overlaps `/trust` — resolve in phase 06 |
| `/compliance-journey` | — | Category 5 content, kept as marketing-surfaced page |
| `/privacy` | Privacy policy | — |
| `/accessibility` | — | — |
| `/example-roi-bulletin`, `/showcase/[runId]`, `/demo/preview`, `/live-demo` | Public demo/example surfaces | Confirm `noindex` + not linked to `/why-archlucid` or `/demo/explain` (phase 05) |

**Request demo** is currently a CTA inside `/pricing` (`MarketingPricingQuotePanel.tsx`), not a
standalone route — leave as-is unless phase 05 finds a reason to split it out.

## Category 5 — Security & trust materials

| Surface | URL / path | Public or signed-in |
|---------|-----------|----------------------|
| Public trust hub | `/trust` (`trust/page.tsx`) | Public |
| Public security overview | `/security-trust` (`security-trust/page.tsx`) | Public |
| Compliance journey | `/compliance-journey` | Public |
| Privacy policy | `/privacy` | Public |
| Signed-in procurement/tenant-isolation hub | `/settings/security-trust` → `workspace/security-trust/page.tsx` | Authenticated |
| Trust Center narrative (source markdown, **4 duplicate copies**) | `docs/trust-center.md`, `docs/go-to-market/trust-center.md`, `docs/go-to-market/trust-center.md`, `docs/security/trust-center.md` | — |
| Tenant isolation | `docs/go-to-market/TENANT_ISOLATION.md`, `docs/security/TENANT_TABLE_ISOLATION_CLASSIFICATION.md`, `docs/security/MULTI_TENANT_RLS.md` | — |
| Subprocessors | `docs/go-to-market/SUBPROCESSORS.md` (in-app slug `subprocessors`) | — |
| AI provider handling / data handling | `docs/library/customer-facing/HOW_IT_WORKS.md`, `docs/go-to-market/AI_READINESS_POSTURE.md` | — |
| Audit trail | `docs/library/AUDIT_COVERAGE_MATRIX.md`; UI `/governance/audit` (app-only, not public) | — |
| Security posture / assurance packet | `docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`, `docs/security/SOC2_SELF_ASSESSMENT_2026.md`, `docs/compliance/CAIQ_LITE.md`, `docs/security/SIG_CORE_2026.md`, `docs/security/pen-test-summaries/` | — |

## Pages/behaviors flagged for hiding from buyers (Category boundary violations today)

- `/admin/*` — already role-gated by `AdminAuthority`; `/admin/pricing-quote-aging`,
  `/admin/trial-funnel`, `/admin/fleet-llm-cogs`, `/admin/tenant-health` are also
  `route-readiness: hidden`. **No change needed**, just confirm in phase 04.
- `/demo/explain` — internal demo explanation, already demo-blocked. Confirm never linked from
  marketing (phase 05).
- `/why-archlucid` — internal live instrumentation inside the architect workspace. Confirm never linked
  from marketing (phase 05).
- `/help/first-pilot-operator-runbook`, `/help/first-value-20-minutes`, `/help/pre-commit-ci-gate` —
  currently gated **client-side only** (`isAdmin` prop in `help-center-catalog.ts`). **Must** become
  loader/route-level gated or removed from the in-app registry entirely (phase 04) — this is the
  single highest-priority fix in the whole plan, since it is a real internal-content-exposure risk,
  not just a UX nit.

## Pages/behaviors flagged for PDF export

Category 3 (technical documentation) and Category 5 (security/trust) are the only categories the
user's spec allows to be PDF-exportable:

- Technical docs tab topics (`configuration-reference`, `cli-usage`, `api-contracts`,
  SSO/SCIM/CI-CD integration guides).
- Security assurance packet (`BUYER_SECURITY_PROCUREMENT_PACKET.md`, `CAIQ_LITE.md`,
  `SOC2_SELF_ASSESSMENT_2026.md`, pen-test summaries) — buyer/procurement-safe, should be
  downloadable without an account.

## Pages/behaviors flagged to become context-sensitive-help-only

Any operator page today relying on `page-help-topic-map.ts` deep-linking straight to a full
`/help` article for basic orientation, instead of a short in-line answer. Starting set for phase 02
(extend as discovered): `/reviews` (empty state), `/governance/findings`, `/digests`,
`/planning`, `/advisory`, `/value-report`.

## Revised sitemap (target state)

```
Public (unauthenticated) — Marketing (Category 4)
├── /welcome                     Overview
├── /pricing                     Pricing (+ request-demo CTA)
├── /signup, /signup/verify      Start evaluation
├── /faq                         Product FAQ
├── /get-started                 Consolidated first-run marketing CTA (retires /quick-start overlap)
├── /why, /see-it, /try, /quick-scan   Reviewed for overlap — see phase 05
├── /trust                       Public Trust Center (Category 5, marketing-surfaced)
├── /security-trust              Public security overview (Category 5, marketing-surfaced)
├── /compliance-journey          Category 5, marketing-surfaced
├── /privacy, /accessibility
└── /example-roi-bulletin, /showcase/[runId], /demo/preview, /live-demo   Public demo/example (noindex)

Authenticated app shell (operator + executive route groups — not a "content" category, consumes Category 1)
├── /  (home), /onboarding, /reviews/*, /dashboard, /graph, /ask, /search, /compare, /replay,
│   /scorecard, /governance/*, /advisory*, /planning*, /value-report*, /digests*, /patterns*,
│   /settings/*, /integrations/*, /executive/*   — all app-only authenticated, unchanged by this plan
└── /admin/*                     App-only, AdminAuthority-gated, buyer-hidden — unchanged, confirmed in phase 04

In-app Help (authenticated) — split into two visibly distinct tabs
├── /help  →  "Guides" tab        Category 2 — product help (buyer-safe task guidance)
└── /help  →  "Documentation" tab Category 3 — technical documentation (PDF-exportable where applicable)
    (internal-only runbook slugs removed from this surface entirely — phase 04)

Context-sensitive help (Category 1)
└── No routes — inline popovers on operator/executive pages, sourced from a new
    contextual-help-registry.ts, replacing today's deep-link-to-full-article pattern
```

## Phase index

| Phase | File | Risk | Depends on |
|-------|------|------|------------|
| 01 | `ia-taxonomy-01-foundation-doc-and-registry-metadata.md` | Low (docs + metadata only) | — |
| 02 | `ia-taxonomy-02-context-sensitive-help-extraction.md` | Medium (new content model + UI) | 01 |
| 03 | `ia-taxonomy-03-product-help-vs-technical-docs-split.md` | Medium (UI restructure of `/help`) | 01 |
| 04 | `ia-taxonomy-04-internal-runbook-gating-hardening.md` | **High priority, security-adjacent** | 01 |
| 05 | `ia-taxonomy-05-marketing-surface-hygiene.md` | Medium (content audit + possible route retirement) | 01 |
| 06 | `ia-taxonomy-06-security-trust-consolidation.md` | Medium (content de-dupe + route decision) | 01 |

Phases 02–06 can run in parallel once 01 lands, except that 03 and 04 both touch
`help-center-catalog.ts` and should not run concurrently against the same working tree.

## Non-goals (all phases)

- Do not change API contracts, auth policies, or database schema.
- Do not remove or rename any existing public URL without a redirect (SEO + bookmarks).
- Do not touch `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md` policy (customer help via
  `/help`, not GitHub blob URLs) — this plan works within that policy.
- Do not add or resurface GTM-parked assessment items (`.cursor/rules/GTM-V1_1-assessment-exclusions.mdc`).
- No phase in this set should be treated as approved for implementation until the owner explicitly
  assigns it a `TB-` backlog number and directs work to begin.
