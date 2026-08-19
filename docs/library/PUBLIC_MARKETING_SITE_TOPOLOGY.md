> **Scope:** Buyer — Engineers and operators designing apex-domain routing (Front Door, Next.js) for public marketing alongside API and architect workspace, plus organic SEO and disciplined web-paid acquisition (formerly the body of `docs/go-to-market/SEO_AND_PAID_ACQUISITION.md`; that filename remains a path-stable alias). Not a standalone CMS strategy doc or subdomain-only deployment guide.

# Public marketing site topology (apex `archlucid.net`)

## Objective

Document how **modest marketing** pages share **the same apex domain and operational edge** as the ArchLucid API and authenticated architect workspace, without a second codebase or orphaned DNS/cert sprawl until scale clearly warrants a split deployment.

## Assumptions

- Marketing content is authored in-repo as **Next.js App Router pages** grouped under **`app/(marketing)/`** in **`archlucid-ui`**.
- Hosted production uses **`NEXT_PUBLIC_ARCHLUCID_SITE_URL`** aligned with **`ArchLucid.Core.Configuration.PublicSiteOptions.BaseUrl`** (default **`https://archlucid.net`** for deep links elsewhere in the backend).
- **Azure Front Door (Standard)** and WAF are the TLS terminator when **`infra/terraform-edge`** is enabled; path rules separate **marketing origin** vs **API origin**.
- Canonical **public homepage** route is **`/welcome`** — **`/`** is occupied by **`app/(operator)/page.tsx`** (operator home shell).

## Constraints

- **Hostname split (Option D):** marketing on apex/`www`, operator on **`app.`** — preferred when avoiding Front Door cost. Single-hostname Option A remains valid for small pilots.
- **Robots semantics:** **`Disallow: /`** in `robots.txt` is forbidden for the marketing host — RFC-style prefix rules would block **`/welcome`**. Prefer **explicit `disallow` prefixes** for operator and API routes (implemented in **`archlucid-ui/src/lib/marketing/public-marketing-seo-paths.ts`** + **`app/robots.ts`**). Serve `robots.ts` / `sitemap.ts` from the marketing hostname.
- **Front Door (optional only):** when **`infra/terraform-edge`** is enabled, **`marketing_site_route_patterns`** must list every HTML path (and **`/_next/*`**) routed to the marketing origin. Option D does **not** require Front Door — bind custom domains on each Container App instead.
- **New marketing pathname playbook:** add page under **`(marketing)`** → sitemap when indexable → ensure marketing CA env / DNS still covers the path (same image serves all routes; host middleware gating is **TB-2019**).

## Architecture Overview

**Preferred operating mode (owner 2026-07-31 — Option D, no Front Door):** deploy the **same** `archlucid-ui` image twice:

| Role | Container App | Custom hostname |
|------|---------------|-----------------|
| Marketing | `marketing_ui_container_app_name` (`archlucid-ui-marketing`) | apex / `www` → `marketing_ui_custom_domain_name` |
| Operator | `ui_container_app_name` (`archlucid-ui`) | `app.<domain>` → `ui_custom_domain_name` |

TLS via Container Apps managed certificates + DNS CNAME (see `infra/terraform-container-apps/README.md`). CD rolls both apps from one digest (`CONTAINER_APP_UI_NAME` + `CONTAINER_APP_MARKETING_UI_NAME`). Cross-host links: `archlucid-ui/src/lib/site-urls.ts`. API CORS must allow both origins. Backlog **TB-2016 – TB-2020**.

**Cutover automation:** [`docs/runbooks/MARKETING_OPERATOR_HOST_CUTOVER.md`](../runbooks/MARKETING_OPERATOR_HOST_CUTOVER.md) + [`scripts/ops/Invoke-MarketingOperatorHostCutover.ps1`](../../scripts/ops/Invoke-MarketingOperatorHostCutover.ps1) (dry-run by default; `-Apply` to mutate).

**Option A** (legacy single-app): one Next.js build serves marketing + operator + sponsor on one hostname; optional Front Door path rules. Still valid for pilots that omit a second UI app (`enable_marketing_ui_container_app = false`).

**Option B** (Front Door dual origin): same image twice with **`marketing_backend_hostname`** + `frontdoor-marketing-routes.tf`. Available if WAF/CDN is later required — not the default cost path.

Static-only marketing export (**Option C**) remains **deferred** — funnel/demo routes need Next SSR/proxy even when business logic is API REST.

See also: **`infra/terraform-container-apps/marketing_ui.tf`**, **`infra/terraform-edge/README.md`** (optional), **`archlucid-ui/src/app/(marketing)/layout.tsx`**.

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
- **`robots.ts`** denies crawl of **`/auth/*`**, **`/v1*`**, **`/metrics`**, and architect workspace routes — **security-through-obscurity is weak**; real enforcement remains **authentication**, **authorization**, and **tenant scope** (`OperatorHomeGate` + API policies).
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
5. **Paid/organic attribution** — UTM capture through anonymous signup into durable reporting + coarse OTel conversions is **`TECH_BACKLOG`** **TB-019** (**not** wired by default yet); **`TB-020`** covers JSON-LD + consent-gated third-party replay. Full SEO + paid channel playbook: [`#seo-and-paid-web-acquisition`](#seo-and-paid-web-acquisition).

---

## SEO and paid web acquisition {#seo-and-paid-web-acquisition}

Former standalone body: `docs/go-to-market/SEO_AND_PAID_ACQUISITION.md` → this section (filename kept as a path-stable alias). Aligns with [`BUYER_PERSONAS.md` (ICP)](../go-to-market/BUYER_PERSONAS.md#ideal-customer-profile-icp) and [`POSITIONING.md`](../go-to-market/POSITIONING.md). Not procurement legal advice.

**Audience:** Founder, marketing, and product — deciding where to spend time vs money before measurable conversion exists.  
**Path-stable alias:** [`../go-to-market/SEO_AND_PAID_ACQUISITION.md`](../go-to-market/SEO_AND_PAID_ACQUISITION.md).

### SEO / paid objective

Increase **qualified trial signups** (and eventual paid pilots) from people who fit the ICP by stacking **technical crawlability**, **problem-aware content**, **honest trust pages**, and **small, measurable paid experiments** — without fragmenting infra or drifting claims beyond **`POSITIONING.md`** and **`V1_SCOPE.md`**.

### SEO / paid assumptions

- Canonical public origin **`https://archlucid.net`** (`PublicSiteOptions`, `NEXT_PUBLIC_ARCHLUCID_SITE_URL`) aligns email deep links with the apex.
- Marketing stays in the **`archlucid-ui`** App Router **`(marketing)`** group; edge routing for apex + Front Door paths is this topology document.
- The **commercial category headline** shipped as **`Architecture Proof Engine`** (`archlucid-ui/src/lib/brand-category.ts`) has **near-zero naive search volume** vs generic phrases; keywords must chase **pain and outcome**, not the coined category alone early on.
- Self-serve signup is the dominant conversion path ([`TRIAL_AND_SIGNUP.md`](../go-to-market/TRIAL_AND_SIGNUP.md)). Ads and landing pages should optimize toward **successful tenant provision + first session**, not vanity engagement.
- Lack of SOC 2 Type I/II CPA attestation does **not** block V1.1 headline product work; procurement friction still requires **explicit** trust narratives — [`trust-center.md`](../go-to-market/trust-center.md), [`ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap`](../go-to-market/ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap), `/compliance-journey`, `/trust`, `/security-trust` on the apex.

### SEO / paid constraints

- **Claims:** Messaging must reconcile with **`POSITIONING.md`**, **`COMPETITIVE_LANDSCAPE.md`**, and shipped scope — no multi-cloud posture, SOC 2 attestation, or integrations that **`V1_SCOPE.md`** denies.
- **Robots correctness:** Apex **`robots.txt`** must **never** emit **`Disallow: /`** (see Constraints above).
- **Front Door parity:** Any new anonymous marketing pathname must appear in **`marketing_site_route_patterns`** plus **`MARKETING_SITEMAP_PATHNAMES`** when indexable.
- **Signup latency:** Burst paid traffic amplifies provisioning p95 — warm-catalog work is **`TECH_BACKLOG.md`** **TB-018**.
- **Budget:** Modest pilot spend favors **LinkedIn + Bing + narrow Google Search** before display, programmatic, or broad awareness.

### Acquisition architecture overview

Three cooperating layers:

1. **Crawl + index hygiene (technical SEO)** — sitemap, robots, per-page metadata, apex routing (sections above).
2. **Content + internal linking** — problem-aware topics → proof pages → signup.
3. **Paid amplification** — LinkedIn/Microsoft Ads → proof + trust → trial.

Downstream instrumentation (conversion tags, funnel dashboards) belongs in engineering backlog when prioritized — this section records **intent and channel strategy**.

### Technical SEO checklist

| Artifact | Repo path / module | Responsibility |
|---------|---------------------|----------------|
| Marketing route group chrome | `archlucid-ui/src/app/(marketing)/layout.tsx` | Nav, trust links, signup CTA |
| Canonical metadata defaults | `archlucid-ui/src/app/layout.tsx` | OG/twitter defaults |
| `robots.txt` / `sitemap.xml` | `robots.ts` / `sitemap.ts` | Crawl + index |
| Path + deny lists | `public-marketing-seo-paths.ts` | Drift prevention |
| Edge path routing | `infra/terraform-edge` | Apex → marketing UI vs API |

Operational checklist:

1. Submit `https://archlucid.net/sitemap.xml` in Google Search Console + Bing Webmaster Tools.
2. Enforce single canonical apex (apex vs `www`): one 301 in Front Door.
3. Extend `marketing_site_route_patterns` when exposing new anonymous HTML routes.
4. PageSpeed / Web Vitals on `/welcome`, `/pricing`, `/why` — fix regressions before scaling paid traffic.

### Content SEO (discovery layer)

Goal: rank for **pain and evaluation intent**, not the category string alone initially.

| Intent stage | Example themes | Prefer landing surfaces |
|---|---|---|
| Problem-aware | architecture review bottleneck, undocumented decisions | Long-form (future `/blog`), linking to `/why`, `/see-it` |
| Solution-aware | evidence-linked findings, governance + architecture | `/why`, `/showcase/{slug}` |
| Vendor-aware | ArchLucid pricing, SOC 2, vs EA tools | `/pricing`, `/compliance-journey`, `/trust`, `/security-trust` |
| Skeptical | accuracy, hallucination stance, PHI/residency honesty | `/privacy`, trust center docs, `/compliance-journey` |

Off-page realism for a modest team: one high-quality quarterly technical article with `rel="canonical"` to `archlucid.net`; targeted podcasts/newsletters; credibility listings when applicable.

### Paid acquisition

Channel ordering by expected ICP ROI:

| Priority | Channel | Why | First experiment |
|:---:|:---|:---|:---|
| 1 | **LinkedIn Ads** | Title + vertical fit | Single proof creative → `/showcase/claims-intake-modernization` (**M-107** Option A canonical) OR `/why` — not Contoso `/demo/preview` as primary |
| 2 | **Microsoft Advertising (Bing)** | Lower CPC, enterprise browser defaults | Exact/phrase branded + tightly scoped problem phrases |
| 3 | **Google Search** | High intent | Phrase/exact only — comparison + competitor-adjacent; avoid generic broad-match |
| 4 | **Reddit Ads** | Cheap tests for technical audiences | Sponsor one substantive article pointer |
| Defer | YouTube display, programmatic, mass GDN | Thin budget + immature tagging | — |

Budget shape (starting point — reallocate monthly on data):

| Line | Months 1–2 learn | Months 3+ |
|:---|---:|---:|
| LinkedIn | $1500–2000/mo | scale winners |
| Microsoft Ads | $400–600/mo | trim negatives |
| Google Search | ≤ $500/mo | kill broad drift |
| Experiments buffer | optional Reddit $300 | discretionary |

CAC guardrail: reconcile against [`PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md) pilot economics — halt channels absent conversion proof.

### Tracking and attribution

Tracked as engineering backlog: **TB-019** (UTM → provision success) plus **TB-020** (JSON-LD + consent-gated third-party replay / CSP) in [`TECH_BACKLOG.md`](TECH_BACKLOG.md).

Targets until shipped:

1. Stable UTM ingestion on signup.
2. Server-side conversion on `TenantProvisioningService` success.
3. Front Door logs for marketing path hits.
4. Weekly human review: spend → provisional signup attribution → funnel stage.

Until **TB-019** lands, defer non-essential client pixels.

### Privacy + CSP (paid pixels)

- Pixels widen CSP (`archlucid-ui/next.config.ts`) — consolidate allowed hosts per vendor and document in [`PRIVACY_POLICY.md`](../go-to-market/PRIVACY_POLICY.md) when live.
- Avoid architect-workspace analytics leakage — session replay must not run on authenticated operator/sponsor surfaces until DPIA-aligned.
- Cookie consent before non-essential marketing pixels under EU-facing traffic projections.
- Trust honesty: keep SOC 2 / trust pages synchronized with factual posture (self-assessment + roadmap ≠ CPA attestation).

### SEO / paid operational cadence

1. Monthly review: Search Console crawl errors → sitemap deltas → broken links on top marketing URLs.
2. New landing page playbook: page → metadata → sitemap (if indexed) → Front Door tfvars → SERP snippet QA.
3. Creative refresh when LinkedIn frequency fatigues; keep one evergreen proof angle + one trust angle.
4. Organic compounding: two excellent long-form pillars beat ten thin pages.
5. Pair **TB-018** / **TB-019**: watch signup p95 and attributable conversions when paid experiments start.
