> **Scope:** Organic search optimization and disciplined web-paid acquisition for `archlucid.net` — aligns with **`IDEAL_CUSTOMER_PROFILE.md`** and **`POSITIONING.md`**. Not procurement legal advice.

# SEO and paid web acquisition playbook

**Audience:** Founder, marketing, and product — deciding where to spend time vs money before measurable conversion exists.

**Last reviewed:** 2026-05-10

---

## 1. Objective

Increase **qualified trial signups** (and eventual paid pilots) from people who fit the ICP (**`IDEAL_CUSTOMER_PROFILE.md`**) by stacking **technical crawlability**, **problem-aware content**, **honest trust pages**, and **small, measurable paid experiments** — without fragmenting infra or drifting claims beyond **`POSITIONING.md`** and **`docs/library/V1_SCOPE.md`**.

---

## 2. Assumptions

- Canonical public origin **`https://archlucid.net`** ( **`ArchLucid.Core.Configuration.PublicSiteOptions`**, **`NEXT_PUBLIC_ARCHLUCID_SITE_URL`** in **`archlucid-ui`**) aligns email deep links with the apex.
- Marketing stays in the **`archlucid-ui`** App Router **`(marketing)`** group; edge routing for apex + Front Door paths is **`docs/library/PUBLIC_MARKETING_SITE_TOPOLOGY.md`**.
- The **commercial category headline** shipped in code as **`Architecture Proof Engine`** (**`archlucid-ui/src/lib/brand-category.ts`**) — **near-zero naive search volume** vs generic phrases; keywords must chase **pain and outcome**, not the coined category alone early on.
- Self-serve signup is the dominant conversion path (**`docs/go-to-market/TRIAL_AND_SIGNUP.md`**). Ads and landing pages should optimize toward **successful tenant provision + first session**, not vanity engagement.
- **Headline readiness vs procurement realism:** lack of SOC 2 Type I/II CPA attestation does **not** block V1.1 headline product work; procurement friction still requires **explicit** trust narratives — **`docs/go-to-market/TRUST_CENTER.md`**, **`docs/go-to-market/SOC2_ROADMAP.md`**, **`/compliance-journey`**, **`/trust`**, **`/security-trust`** on the apex.

---

## 3. Constraints

- **Claims:** Messaging must reconcile with **`POSITIONING.md`**, **`docs/go-to-market/COMPETITIVE_LANDSCAPE.md`**, and shipped scope — no multi-cloud posture, SOC 2 attestation, or integrations that **`V1_SCOPE.md`** denies.
- **Robots correctness:** Apex **`robots.txt`** must **never** emit **`Disallow: /`** (RFC-style prefix semantics block **`/welcome`** and all marketing); see disallow-prefix pattern in **`archlucid-ui/src/lib/marketing/public-marketing-seo-paths.ts`** + **`archlucid-ui/src/app/robots.ts`**.
- **Front Door parity:** Any new anonymous marketing pathname must appear in **`marketing_site_route_patterns`** (**`infra/terraform-edge/variables.tf`**) plus **`MARKETING_SITEMAP_PATHNAMES`** when indexable — same playbook as **`PUBLIC_MARKETING_SITE_TOPOLOGY.md`**.
- **Signup latency:** Burst paid traffic amplifies provisioning p95 — warm-catalog work is tracked as **`TECH_BACKLOG.md`** **TB-018** (elastic pool standby).
- **Budget:** Modest pilot spend favors **linkedin + Bing + narrow Google Search** before display, programmatic, or broad awareness.

---

## 4. Architecture overview

Three cooperating layers stack like any modern B2B SaaS apex:

```
┌─────────────────────────────────────────────────────────────┐
│ Crawl + index hygiene (technical SEO)                         │
│  sitemap.xml, robots.txt, per-page metadata, apex routing     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ Content + internal linking                                   │
│  problem-aware topics → proof pages → signup                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ Paid amplification (narrow ICP targeting)                     │
│  LinkedIn/Microsoft Ads → proof + trust → trial              │
└─────────────────────────────────────────────────────────────┘
```

Downstream instrumentation (conversion tags, funnel dashboards) belongs in **`docs/engineering`** or **`TECH_BACKLOG`** when prioritized — this document records **intent and channel strategy** regardless.

---

## 5. Component breakdown

### 5.1 Technical SEO

| Artifact | Repo path / module | Responsibility |
|---------|---------------------|----------------|
| Marketing route group chrome | **`archlucid-ui/src/app/(marketing)/layout.tsx`** | Nav, trust links, signup CTA |
| Canonical metadata defaults | **`archlucid-ui/src/app/layout.tsx`** (**`metadataBase`** from **`getSiteMetadataBaseUrl()`**) | OG/twitter defaults |
| **`robots.txt`** | **`archlucid-ui/src/app/robots.ts`** | Prefix-based disallow + `sitemap` + `host` |
| **`sitemap.xml`** | **`archlucid-ui/src/app/sitemap.ts`** | Curated indexable URLs only |
| Path + deny lists | **`archlucid-ui/src/lib/marketing/public-marketing-seo-paths.ts`** (+ tests alongside) | Drift prevention |
| Edge path routing knobs | **`infra/terraform-edge/frontdoor-marketing-routes.tf`**, **`variables.tf`** (`marketing_*`, `api_*` patterns) | Apex → marketing UI vs API |
| Apex topology rationale | **`docs/library/PUBLIC_MARKETING_SITE_TOPOLOGY.md`** | Option A/B split, certs, pitfalls |

Operational checklist for technical SEO changes:

1. Submit **`https://…/sitemap.xml`** in **Google Search Console** + **Bing Webmaster Tools** (Bing still matters for corp default browsers).
2. Enforce single canonical apex (apex vs **`www`**): one 301 in Front Door; document which is primary in **`PUBLIC_MARKETING_SITE_TOPOLOGY.md`**.
3. Extend **`marketing_site_route_patterns`** when exposing new anonymous HTML routes.
4. PageSpeed / Web Vitals on **`/welcome`**, **`/pricing`**, **`/why`** — fix regressions before scaling paid traffic.

### 5.2 Content SEO (discovery layer)

Goal: rank for **pain and evaluation intent**, not the category string alone initially.

Map query intent to shipped pages (extend with articles when staffed):

| Intent stage | Example themes | Prefer landing surfaces |
|---|---|---|
| Problem-aware | architecture review bottleneck, undocumented decisions | Long-form (**future `/blog`** or expandable marketing trees), linking to **`/why`**, **`/see-it`** |
| Solution-aware | evidence-linked findings, governance + architecture | **`/why`**, **`/showcase/…`** (curated slug in **`SHOWCASE_STATIC_DEMO_RUN_ID`**) |
| Vendor-aware | ArchLucid pricing, SOC 2, vs EA tools | **`/pricing`**, **`/compliance-journey`**, **`/trust`**, **`/security-trust`**; **`/why`** **PDF pack** (**`POSITIONING.md`**, anonymous demo-backed) |
| Skeptical | accuracy, hallucination stance, PHI/residency honesty | **`/privacy`**, trust center docs, **`/compliance-journey`** (no invented certifications) |

Off-page realism for a modest team:

- One **high-quality quarterly** technical article republication with **`rel="canonical"`** pointing at `archlucid.net`.
- Targeted podcasts or newsletters in **architecture / platform engineering**.
- Credibility listings (example: G2 baseline; Microsoft marketplace when applicable).

### 5.3 Paid acquisition

Channel ordering by **expected ICP ROI** (`IDEAL_CUSTOMER_PROFILE.md`)

| Priority | Channel | Why | First experiment |
|:---:|:---|:---|:---|
| 1 | **LinkedIn Ads** | Title + vertical fit (EA, VP Platform, regulated industries) | Single proof creative → **`/showcase/`** curated slug OR **`/why`** |
| 2 | **Microsoft Advertising (Bing)** | Lower CPC, enterprise browser defaults, aligns with Azure ICP tail | Exact/phrase branded + tightly scoped problem phrases |
| 3 | **Google Search** | High intent | **Phrase/exact only** — comparison + competitor-adjacent; avoid generic broad-match |
| 4 | **Reddit Ads** | Cheap tests for technical audiences | Sponsor **one** substantive article pointer, not naked product slam |
| Defer | YouTube display, programmatic, mass GDN until creative + measurement maturity | Thin budget + immature tagging | — |

Structural campaign sketch (mirror in ad platform UI):

- **Awareness cohort A** — Enterprise Architect personas, **`/why`**
- **Awareness cohort B** — VP/Director Platform Engineering, **`/showcase/{static_demo}`**
- **Skeptic cohort C** — Regulated CTO, **`why-archlucid-pack`** or **`/trust`**

Budget shape (starting point — reallocate monthly on data):

| Line | Months 1–2 learn | Months 3+ |
|:---|---:|---:|
| LinkedIn | $1500–2000/mo | scale winners |
| Microsoft Ads | $400–600/mo | trim negatives |
| Google Search | ≤ $500/mo | kill broad drift |
| Experiments buffer | optional Reddit $300 experiment | discretionary |

CAC guardrail: reconcile against **`docs/go-to-market/PRICING_PHILOSOPHY.md`** pilot economics — halt channels absent conversion proof.

---

## 6. Data flow (tracking and attribution)

Tracked as engineering backlog: **TB-019** (**UTM → provision success → telemetry/SQL**) plus **TB-020** (**JSON-LD + consent-gated third-party replay / CSP**) in [`docs/library/TECH_BACKLOG.md`](TECH_BACKLOG.md).

Targets until shipped:

1. **Stable UTM ingestion** cookies or first-party persistence on signup (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`).
2. **Server-side conversion** anchored on **`TenantProvisioningService`** success — counts **trial workspace created**, not impressions (low-cardinality OTel labels + raw detail in SQL per **TB-019**).
3. **Front Door logs** correlate marketing path hits (**`/signup`**, **`/welcome`**, **`/pricing`**) with origin health.
4. **Weekly human review**: spend → provisional signup attribution → funnel stage.

Until **TB-019** lands, defer non-essential client pixels and rely on Front Door logs + provisional SQL where operator joins exist (**`/metrics`** + manual correlation).

---

## 7. Security model (privacy + CSP)

- **Pixels widen CSP** (**`archlucid-ui/next.config.ts`** `Content-Security-Policy`) — consolidate allowed hosts per vendor in one change set and document in **`docs/go-to-market/PRIVACY_POLICY.md`** when live.
- **Avoid operator shell analytics** leakage — session replay must **not** run on authenticated `(operator)`/`(executive)` surfaces until DPIA-aligned.
- **Cookie consent** becomes mandatory wherever cross-site trackers fire — ship consent UI **before** non-essential marketing pixels under EU-facing traffic projections.
- **Trust honesty:** paid traffic increases scrutiny — keep **`SOC2_STATUS_PROCUREMENT.md`**, **`TRUST_CENTER.md`**, **`/compliance-journey`** synchronized with factual posture (self-assessment + roadmap ≠ CPA attestation).

---

## 8. Operational considerations

1. **Operational owner** rotates monthly review: Search Console crawl errors → sitemap deltas → Broken links on top 10 marketing URLs.
2. **New landing page playbook:** page → **`metadata`** → **`MARKETING_SITEMAP_PATHNAMES`** (if indexed) → Front Door **`tfvars`** apply → SERP snippet QA.
3. **Creative refresh cadence** (paid): revise LinkedIn creatives when frequency fatigues; keep one evergreen proof angle (**showcase**) + one trust angle (**compliance pathway / PDF pack**).
4. **Organic compounding beats spray:** two excellent long-form pillars beat ten thin GPT pages (long-term penalization risk).
5. **TB-018** / **TB-019** pairing: watch signup p95 (**warm pool**) and attributable conversions (**server-side**) when paid experiments start — infra lag masquerading as messaging failure wastes media budget.

---

## 9. Related documents

| Doc | Use |
|-----|-----|
| [`POSITIONING.md`](POSITIONING.md) | Headline narratives, pillars, elevator pitches |
| [`IDEAL_CUSTOMER_PROFILE.md`](IDEAL_CUSTOMER_PROFILE.md) | Firmographics, scoring, disqualifiers |
| [`BUYER_PERSONAS.md`](BUYER_PERSONAS.md) | Person-level hooks for creative variants |
| [`COMPETITIVE_LANDSCAPE.md`](COMPETITIVE_LANDSCAPE.md) | Honest differentiation for comparison content |
| [`TRIAL_AND_SIGNUP.md`](TRIAL_AND_SIGNUP.md) | Funnel truths and infra cadence |
| [`TRUST_CENTER.md`](TRUST_CENTER.md), [`SOC2_ROADMAP.md`](SOC2_ROADMAP.md), [`SOC2_STATUS_PROCUREMENT.md`](SOC2_STATUS_PROCUREMENT.md) | Trust + SOC narrative alignment |
| [`../library/PUBLIC_MARKETING_SITE_TOPOLOGY.md`](../library/PUBLIC_MARKETING_SITE_TOPOLOGY.md) | Apex topology, Front Door, DNS |
| [`../library/TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) | **TB-018** warm catalogs (**signup SLA**); **TB-019** marketing attribution (**paid ROI honesty**); **TB-020** JSON-LD + gated analytics (**CSP/consent**) |
