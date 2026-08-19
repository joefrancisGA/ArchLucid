> **Scope:** Canonical five-category information architecture for in-app `/help`, contextual help, marketing, and trust surfaces. Audience: product, engineering, and design contributors; not buyer-facing procurement text.

# Information architecture — content taxonomy

ArchLucid ships five distinct kinds of product content. They must not be blurred in copy, navigation, or PDF export policy. This document is the **in-app and public-surface** taxonomy. For **repo markdown** routing by reader (customer vs contributor vs internal), see [`docs/library/DOCUMENTATION_BY_AUDIENCE.md`](../library/DOCUMENTATION_BY_AUDIENCE.md). The two documents are complementary: audience routing picks which `docs/` file to edit; content kind picks how that material appears in the product.

**Backlog:** **TB-732** (this doc + registry metadata). Follow-on: **TB-733**–**TB-737** (contextual help extraction, Guides/Documentation split, internal-runbook gating, marketing hygiene, trust consolidation). Plan: [`.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md`](../../.cursor/prompts/ia-taxonomy-00-plan-and-sitemap.md).

## Five-category taxonomy

| # | Category | Reader | Length | Must never contain |
|---|----------|--------|--------|---------------------|
| 1 | Context-sensitive help | Any signed-in user on the page they are viewing | ≤ ~120 words; up to four answers (what is this / what next / why empty / where to configure) | Internal routes, API paths, implementation detail, roadmap labels |
| 2 | Product help | Architects, pilot teams, buyers | Task-length guide | Implementation detail, internal-only runbook links |
| 3 | Technical documentation | Admins, integrators, developers | Reference-length; may be PDF-exportable | Internal-only docs must be role-gated, not merely nav-hidden |
| 4 | Marketing content | Public, unauthenticated | Fast, polished, conversion-focused | Internal routes, implementation terms, roadmap labels |
| 5 | Security & Trust materials | Buyers, procurement, security reviewers | Buyer-safe, procurement-safe | Internal implementation detail beyond what a customer's security team should see |

## Route groups vs categories

Next.js route groups map **authentication shell**, not content kind alone:

| Route group | Typical URLs | Primary categories |
|-------------|--------------|-------------------|
| `(marketing)` | `/welcome`, `/pricing`, `/signup`, `/trust`, `/faq` | **4** Marketing; **5** Security & Trust on `/trust`, `/security-trust`, `/compliance-journey` |
| `(operator)` | `/reviews`, `/governance/**`, `/help/**`, `/administration/settings/**` | **1** Contextual help on feature pages; **2** and **3** under `/help/{slug}`; settings pages may link to **3** |
| `(sponsor)` | Sponsor scorecard and value surfaces | **1** Contextual help; links to **2** guides |

**Decision record:** Marketing and trust pages stay **public and outside** the architect workspace so evaluators and procurement reviewers never need a tenant login to read buyer-safe posture material. Architect (`(operator)`) and sponsor groups require authentication because they expose tenant-scoped data and configuration. Category **1** intentionally has **no dedicated routes** — it is an in-page UI pattern (`ContextualHelp`, `PageContextualHelpButton`, future `contextual-help-registry.ts`), not a browsable help tree.

Canonical route inventory: [`docs/architecture/ui_routes.md`](ui_routes.md).

## `/help` registry — `contentKind` metadata (TB-732)

Every topic in `archlucid-ui/src/lib/product-documentation-registry.ts` carries additive metadata:

| `contentKind` | Maps to category | Notes |
|---------------|------------------|-------|
| `product-help` | **2** Product help | Default for buyer-safe task guides |
| `technical-documentation` | **3** Technical documentation | Reference, admin, developer material |
| `internal-runbook` | **3** (gated) | Vendor-internal; must be server-gated in **TB-735** |

Canonical slug → kind map: `archlucid-ui/src/lib/product-documentation-content-kinds.ts`. Rendering and nav still use existing `help-center-catalog.ts` **tier** until **TB-733**–**TB-735**.

### Internal-runbook slugs (must stay gated)

- `first-pilot-operator-runbook`
- `first-value-20-minutes`

`pre-commit-ci-gate` remains **repo-only** (`docs/runbooks/CI_GOVERNANCE_GATE.md#minimal-ci-starters`) — removed from the in-app registry in **TB-735**.

### Technical-documentation slugs (initial set)

- `configuration-reference`, `operator-auth-roles`, `cli-usage`, `api-contracts`
- `admin-diagnostics`, `developer-troubleshooting`
- `workload-identity-federation`, `azure-permissions`, `observability`, `projection-cache-replicas`

All other registry slugs are tagged `product-help` unless promoted to technical documentation in a later IA phase.

## Relationship to `DOCUMENTATION_BY_AUDIENCE.md`

| Concern | `DOCUMENTATION_BY_AUDIENCE.md` | This document |
|---------|-------------------------------|---------------|
| Scope | `docs/` markdown in the monorepo | In-app `/help`, contextual help, marketing URLs, trust surfaces |
| Primary axis | Reader role (customer, evaluator, contributor) | Content kind (guide vs reference vs marketing vs trust) |
| Enforcement | Editorial routing and folder conventions | Registry metadata, future nav/PDF/gating (TB-733–737) |

When adding customer-facing prose, use **audience** doc to pick the source file and **information architecture** to pick how it surfaces in the app.

## Related

- [`docs/library/DOCUMENTATION_BY_AUDIENCE.md`](../library/DOCUMENTATION_BY_AUDIENCE.md) — repo markdown audience routing
- [`docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`](../library/PRODUCT_DOCUMENTATION_PRESENTATION.md) — in-app help presentation rules
- [`docs/architecture/ui_routes.md`](ui_routes.md) — route inventory
- [`archlucid-ui/src/lib/product-documentation-registry.ts`](../../archlucid-ui/src/lib/product-documentation-registry.ts) — `/help` topic registry
- [`archlucid-ui/src/lib/help/help-center-catalog.ts`](../../archlucid-ui/src/lib/help/help-center-catalog.ts) — help center tiers (unchanged in TB-732)
