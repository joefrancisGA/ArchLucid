# Public marketing site topology (apex `archlucid.net`)

## Objective

Document how **modest marketing** pages share **the same apex domain and operational edge** as the ArchLucid API and authenticated operator UI, without a second codebase or orphaned DNS/cert sprawl until scale clearly warrants a split deployment.

## Assumptions

- Marketing content is authored in-repo as **Next.js App Router pages** grouped under **`app/(marketing)/`** in **`archlucid-ui`**.
- Hosted production uses **`NEXT_PUBLIC_ARCHLUCID_SITE_URL`** aligned with **`ArchLucid.Core.Configuration.PublicSiteOptions.BaseUrl`** (default **`https://archlucid.net`** for deep links elsewhere in the backend).
- **Azure Front Door (Standard)** and WAF are the TLS terminator when **`infra/terraform-edge`** is enabled; path rules separate **marketing origin** vs **API origin**.
- Canonical **public homepage** route is **`/welcome`** — **`/`** is occupied by **`app/(operator)/page.tsx`** (operator home shell).

## Constraints

- **Single hostname** avoids duplicate CSP/DNS/cert operations for a small funnel; subdomain split (for example **`www`** vs **`app`**) stays optional operator policy.
- **Robots semantics:** **`Disallow: /`** in `robots.txt` is forbidden for this topology — RFC-style prefix rules would block **`/welcome`** and the rest of marketing. Prefer **explicit `disallow` prefixes** for operator and API routes (implemented in **`archlucid-ui/src/lib/marketing/public-marketing-seo-paths.ts`** + **`app/robots.ts`**).
- **Front Door parity:** **`marketing_site_route_patterns`** (**`infra/terraform-edge/variables.tf`**) must list every HTML path (and **`/_next/*`**) routed to the marketing Container App origin. When shipping new anonymous marketing URLs, extend both **Front Door defaults** (or `.tfvars`) **and** **`MARKETING_SITEMAP_PATHNAMES`** when the route should surface in **`/sitemap.xml`**.

## Architecture Overview

Preferred operating mode today (**Option A**): **one** Next.js build (standalone container) serves **`(marketing)`**, **`(operator)`**, **`(executive)`**, **`app/api`**. **Azure Front Door** routes **`marketing_site_route_patterns`** (for example **`/welcome`**, **`/pricing`**, **`/robots.txt`**, **`/sitemap.xml`**, **`/_next/*`**) to the marketing origin hostname and **`api_route_patterns_when_marketing_enabled`** (for example **`/v1/*`**, **`/health/*`**, **`/metrics`**) to the primary API origin (`backend_hostname`).

**Option B** (no app fork): Deploy the **same image** twice (marketing-only scale-out vs operator) and set **`marketing_backend_hostname`** to the marketing Container App; Terraform already models the second origin (`frontdoor-marketing-routes.tf`).

Static-only marketing export (**Option C**) is **explicitly deferred** — funnel and demo routes require server runtime.

See also: **`infra/terraform-edge/README.md`**, **`infra/terraform-edge/frontdoor-marketing-routes.tf`**, **`archlucid-ui/src/app/(marketing)/layout.tsx`**.

## Component Breakdown

| Concern | Location / artifact |
|---------|---------------------|
| Public marketing chrome + nav | `archlucid-ui/src/app/(marketing)/layout.tsx` |
| Operator shell chrome | `archlucid-ui/src/app/(operator)/layout.tsx` (+ `AppShellClient`) |
| Global HTML shell + OG defaults | `archlucid-ui/src/app/layout.tsx` (**`metadataBase`** from `NEXT_PUBLIC_ARCHLUCID_SITE_URL`) |
| Crawler **`robots.txt`** | `archlucid-ui/src/app/robots.ts` |
| Indexable **`sitemap.xml`** | `archlucid-ui/src/app/sitemap.ts` |
| Canonical path list + crawler deny prefixes | `archlucid-ui/src/lib/marketing/public-marketing-seo-paths.ts` |
| Edge path routing knobs | **`infra/terraform-edge/variables.tf`** (`marketing_*`, `api_route_patterns_when_marketing_enabled`) |
| Backend deep-link base (`https://archlucid.net`) | `PublicSiteOptions.BaseUrl` → **`appsettings`** `ArchLucid:PublicSite:BaseUrl` |

## Data Flow

1. **Browser** navigates **`https://archlucid.net/welcome`** (or another marketing pathname on **`MARKETING_SITEMAP_PATHNAMES`**).
2. **Front Door** matches **`patterns_to_match`** on the **`marketing_public`** route → HTTPS to **marketing Container App** origin (**`marketing_backend_hostname`**).
3. **Next.js** serves **`(marketing)`** layout + page SSR/CSR; **`connect-src`** in CSP still allows **`https:`** for optional client calls gated by helpers under **`src/lib/marketing`**.
4. **Authenticated users** traverse **`/`** or **`/reviews/*`** — Front Door forwards those patterns to **`main`** route’s origin group (**API / API-via-gateway** semantics per environment **`tfvars`**), while Next resolves operator routes locally when the apex points at Container Apps hosting the unified app (operator patterns must remain in Front Door **`api_*` allowances or main route **`patterns`** as deployed).

Marketing pages intentionally **avoid** **`/v1/*`** coupling; signup flows use **`/signup`** handlers and **`/auth/*`** redirects.

## Security Model

- **WAF** applies to the apex endpoint (**`infra/terraform-edge/frontdoor.tf`** `azurerm_cdn_frontdoor_firewall_policy` — Default Ruleset + Bot Manager, Prevention).
- **`robots.ts`** denies crawl of **`/auth/*`**, **`/v1*`**, **`/metrics`**, and operator shells — **security-through-obscurity is weak**; real enforcement remains **authentication**, **authorization**, and **tenant scope** (`OperatorHomeGate` + API policies).
- **HSTS**: configured at Front Door (**`README.md`** in terraform-edge warns against duplicating blindly in **`next.config.ts`** baseline headers alone).

## Operational Considerations

1. **`NEXT_PUBLIC_ARCHLUCID_SITE_URL`** — must mirror production apex in staging when validating OG URLs and **`sitemap.xml`** hrefs (`getSiteMetadataBaseUrl()` fallback is localhost).
2. **New marketing pathname** playbook:
   - Add page under **`(marketing)`**
   - Optional: page-level **`metadata.robots`** (see existing **`live-demo`** `noindex` pattern)
   - If indexable → append to **`MARKETING_SITEMAP_PATHNAMES`**
   - Append pattern to **`marketing_site_route_patterns`** (or `.tfvars` override)
   - Re-run infra plan for **`terraform-edge`**
3. **Operator home indexing** (`/`) remains **eligible** unless `robots` / page **`metadata`** change — prioritize **`metadata.title`** uniqueness if duplicate-brand SERP becomes an issue; canonical tag work is backlog-level cosmetic SEO.
4. **Health probes** — marketing origin health probe **`HEAD `/`** (**`frontdoor-marketing-routes.tf`**) differs from **`/health/ready`** on API origins; don’t unify without updating Terraform.
5. **Paid/organic attribution** — UTM capture through anonymous signup into durable reporting + coarse OTel conversions is **`TECH_BACKLOG`** **TB-019** (**not** wired by default yet); **`TB-020`** covers JSON-LD + consent-gated third-party replay.
