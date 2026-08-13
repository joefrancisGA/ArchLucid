> **Scope:** Contributor-reference — owner-directed assessment of marketing vs product app separation; not a buyer or operator document.
> **Decision date:** 2026-07-10 (initial). **Owner override:** 2026-07-31 — dual Container App hostname split, same image, **no Front Door**.
> **Audience:** engineers and AI coding agents evaluating hosting/deployment changes to `archlucid-ui`.
> **Depends on:** [`PUBLIC_MARKETING_SITE_TOPOLOGY.md`](PUBLIC_MARKETING_SITE_TOPOLOGY.md), `archlucid-ui/src/components/operator/OperatorRoleGate.tsx` / `OperatorHomeGate.tsx`, `infra/terraform-container-apps` (operator + marketing UI apps).
> **Still out of scope:** new Azure Front Door investment (owner cost constraint unchanged).
> **Backlog:** interim autoscaling/gates/metrics **TB-729 – TB-731** (Done). Dual-CA split **TB-2016 – TB-2020**.

# Should ArchLucid separate marketing from the product app?

## Bottom line

**Owner override (2026-07-31): yes — separate marketing and operator onto two Container Apps, same Next.js image / same CD deploy, no Front Door.**

| Host | App | Image |
|------|-----|-------|
| `archlucid.net` / `www` | `archlucid-ui-marketing` | `archlucid-ui` (same digest) |
| `app.archlucid.net` | `archlucid-ui` | same digest |
| API host | `archlucid-api` | unchanged |

Cross-host CTAs use `archlucid-ui/src/lib/site-urls.ts` (`ARCHLUCID_PUBLIC_SITE_URL` / `ARCHLUCID_APP_SITE_URL`). Funnel REST still hits the API (via Next `/api/proxy` or SSR fetch) — Next remains on the marketing app for ISR/SSR; a pure static export is still rejected.

**Historical note (2026-07-10):** the original recommendation was “do not split yet” and ship **TB-729–TB-731** instead. Those remain Done and still useful. The 2026-07-31 decision adds hard traffic isolation via a second UI Container App + custom domains, without paying for Front Door (topology **Option D**).

---

## 1. What already exists today (this changes the question)

This is not a green-field decision — evaluate against the current state, not a blank slate:

- **Route-group separation already done.** `archlucid-ui/src/app/(marketing)/` (public: `/welcome`, `/pricing`, `/faq`, `/signup`, `/security-trust`, `/trust`, `/see-it`, `/try`, `/get-started`, `/live-demo`, `/privacy`, `/accessibility`) vs `archlucid-ui/src/app/(operator)/` (~103 authenticated pages: reviews, graph, governance, reports, integrations, settings/admin) vs `(executive)/`. Each group has its own layout and nav chrome (`MarketingPublicHeader` vs `AppShellClient`/`SidebarNav`) — they do not share nav today.
- **Marketing pages are already mostly static** — server components, TS copy modules, build-time JSON (`/pricing.json`, doc index) — with a small number of anonymous, unauthenticated API calls (`/v1/register`, `/v1/marketing/pricing/quote-request`, `/v1/marketing/early-access`, `/v1/architecture/quick-scan`) through the same `/api/proxy`. This is why a pure static export (Azure Static Web App or similar) was already evaluated and rejected: `PUBLIC_MARKETING_SITE_TOPOLOGY.md` — "Static-only marketing export (Option C) is explicitly deferred — funnel and demo routes require server runtime."
- **Caching/CDN already in place for marketing, without a second app**: TB-567 added ISR (`revalidate = 300`) on `/welcome`, `/pricing`, `/trust`; Azure Front Door + WAF already sits in front of the whole app.
- **Analytics is already split**: Microsoft Clarity (consent-gated) on marketing only; Azure Application Insights on the architect workspace only.
- **Help/docs is already static, in-app**, sourced from repo markdown (`(operator)/help`), not a CMS.
- **Domain is `archlucid.net`, not `.com`.** `archlucid.com` appears only in legacy/archive docs and is explicitly flagged in [`PRODUCTION_DEPLOYMENT.md`](../runbooks/PRODUCTION_DEPLOYMENT.md) (staging pre-deploy domain alignment) as something that should not appear in active source. `app.archlucid.net` appears only in test fixtures. `docs.archlucid.net` / `trust.archlucid.net` do not exist anywhere in the active repo.
- **Terraform simplification is already an open, tracked concern**: `docs/library/TECH_BACKLOG.md` **TB-655** (P2, XL) — consolidate 15+ Terraform roots. Adding a new deployment topology now (new resource type, new DNS, new pipeline) works against that already-identified simplification effort.

---

## 2. Benefits of separating — which are already achieved vs. would need a real split

- **Faster public pages** — already achieved via ISR (TB-567) + Front Door edge caching.
- **Lower operational risk / reduced load on product app** — partially achieved today (Front Door already terminates TLS/WAF for everything); fully achieved by adding Container App autoscaling headroom on the existing single UI app (§4), not by a second codebase or a second Front Door origin.
- **Easier caching/CDN** — already achieved.
- **Cleaner SEO** — already achieved: dedicated `robots.ts` / `sitemap.ts`, JSON-LD, canonical path list.
- **Cleaner marketing design system** — already achieved: `components/marketing/` is already separate from the Carbon-based operator design tokens.
- **No accidental exposure of admin UI to public buyers** — **partially true, and this is the one real gap** (see §3). It is not fixed by a domain/repo split, because the risk lives in the operator app's own auth-timing boundary, not in marketing's presence alongside it.
- **Easier public content updates / founder velocity** — a split would make this *worse* for a solo founder, not better: marketing content ships in the same PR/CI cycle as everything else today.
- **Safer LinkedIn/public traffic bursts** — the one benefit that needs *something*. Addressed in §4 without a Front Door change.

## 3. The real gap: soft, client-side auth boundary

There is no server-side auth wall for most operator routes. `OperatorRoleGate` (`archlucid-ui/src/components/operator/OperatorRoleGate.tsx`) and `OperatorHomeGate` redirect **client-side, after hydration** — an anonymous or unauthorized visitor deep-linking to an operator route can see shell chrome (`AppShellClient`, `SidebarNav`) render briefly before the redirect fires. This is independent of the marketing/product coupling question: splitting marketing into its own site would not fix it, because the boundary that leaks is inside the operator app itself. This is addressed directly in the backlog (TB-730), and is a higher-leverage fix for "buyers don't see admin UI" than any domain split would be.

## 4. Traffic isolation without Front Door

The original strongest argument for a deployment split was "a marketing traffic spike could degrade the authenticated app." The topology doc already modeled a fix for this ("Option B": deploy the same image a second time as a dedicated marketing Container App, with Front Door routing to the second origin) — but that requires new Front Door origin/route configuration, which is explicitly out of scope for this strategy per owner direction.

**Recommended alternative: scale the existing single UI Container App instead of splitting origins.**

- Azure Container Apps already supports HTTP-concurrency-based autoscaling (KEDA `http` scale rule) and a `min_replicas`/`max_replicas` range per revision, independent of Front Door. Raising `max_replicas` and tuning the concurrent-request threshold on the existing UI Container App means a marketing traffic burst spins up additional replicas of the *same* app instead of queuing/starving requests from authenticated users — the practical failure mode a split was meant to prevent.
- This is a Terraform/config change inside `infra/terraform-container-apps` only. It touches no DNS, no certificates, no Front Door route rules, and no second origin. It is the direct "no new Front Door investment" equivalent of Option B.
- It does not provide *hard* isolation (a large enough burst can still consume the shared replica pool before scaling catches up, and both marketing and operator traffic share the same compute budget) — but for a solo-founder, pre-self-service-scale product, this trades a small amount of isolation for a large reduction in operational surface, which is the right trade for this stage.
- **If this later proves insufficient** (see the trigger in §6), the already-modeled Front Door "Option B" remains available as the next lever — deliberately deferred, not abandoned.

## 5. Routing and domains — unchanged recommendation

- Do not use `archlucid.com` — legacy/archive only.
- Keep `archlucid.net` as the single apex for marketing + product (current `PUBLIC_MARKETING_SITE_TOPOLOGY.md` Option A).
- Do not stand up `docs.archlucid.net` or `trust.archlucid.net` — `/trust` and `/help` are already in-app, ISR-cached, and content-linked to the product they describe.
- `app.archlucid.net` remains a conceptual placeholder for a *future* real split, not something to build now.

## 6. Launch recommendation and re-split trigger

- **Do not split before controlled beta, and do not split by default before public self-service either.** Split only when a concrete, measured trigger fires — not on a calendar date.
- **Minimum safe version (recommended now, no Front Door change):**
  1. Add Container App autoscaling headroom for the UI app (TB-729) — directly addresses "public pages can receive traffic without stressing the product app."
  2. Harden `OperatorRoleGate` / `OperatorHomeGate` so unauthenticated/unauthorized visitors never render architect workspace chrome pre-redirect (TB-730) — directly addresses "public buyers do not see product-admin UI artifacts," which a domain split would not have fixed anyway.
  3. Instrument one concrete re-split trigger metric — sustained Container App CPU/replica saturation during a traffic burst, or self-serve signup volume crossing a threshold where a marketing-caused incident would risk paying-customer access (TB-731). Revisit Front Door "Option B" or a real subdomain split only when that trigger fires.

### Concrete thresholds (TB-731, shipped 2026-07-17)

These values are provisioned in `infra/terraform-monitoring` (Azure Monitor metric alerts + Prometheus rule group) and mirrored in `infra/prometheus/archlucid-alerts.yml` for self-hosted scrape. **Any one row firing** is sufficient to schedule an owner review of Option B — not an automatic split.

| Signal | Metric / source | Threshold | Window | Terraform variable / alert name |
| --- | --- | --- | --- | --- |
| UI traffic pressure — CPU | Container App `CpuPercentage` (average) | **> 70%** | **15m** sustained | `ui_container_cpu_percent_threshold` → `*-ui-cpu-high` |
| UI traffic pressure — replicas | Container App `Replicas` (average) | **≥ 5** replicas | **15m** sustained | `ui_replica_saturation_threshold` (expects `ui_max_replicas` = 6 per TB-729) → `*-ui-replicas-saturated` |
| Self-serve signup volume — daily | `archlucid_first_tenant_funnel_events_total{event="signup"}` | **≥ 25** signups | rolling **24h** | `marketing_product_resplit_signup_daily_threshold` → `ArchLucidMarketingProductResplitSignupDaily*` |
| Self-serve signup volume — burst | same counter | **≥ 10** signups | rolling **1h** | `marketing_product_resplit_signup_hourly_threshold` → `ArchLucidMarketingProductResplitSignupHourlyBurst*` |

**Visibility (no new analytics vendor):** set `ui_container_app_resource_id` to enable the CPU/replica alerts; enable `enable_prometheus_slo_rule_group` for signup PromQL alerts; optionally set `enable_first_tenant_funnel_workbook = true` to deploy the existing first-tenant funnel Azure Monitor workbook (`infra/modules/first-tenant-funnel-dashboard`). Signup events are already emitted from `SignupForm.tsx` via `recordFirstTenantFunnelEvent("signup")`.

**Runbook:** when an alert fires, review whether marketing traffic is degrading operator UX or signup volume justifies a dedicated marketing origin — then decide whether to pick up Front Door Option B (`PUBLIC_MARKETING_SITE_TOPOLOGY.md`). Do **not** split on calendar alone.

## 7. Security, scalability, reliability, cost

- **Security:** the actual security-relevant finding from this assessment is the soft client-side operator gate (§3), not the marketing/product coupling — fixing it (TB-730) is a direct, scoped improvement. Front Door WAF coverage is unchanged either way since Front Door itself is not being modified.
- **Scalability:** Container App HTTP-concurrency autoscaling (§4) scales the shared compute pool elastically per burst without adding a second origin to operate; it is a strictly smaller change than a second Container App + Front Door route.
- **Reliability:** no new deployment pipeline, no new DNS/cert surface, no new failure mode beyond "the existing app needs more replicas," which Container Apps already handles natively.
- **Cost:** near zero incremental cost until a burst actually occurs (autoscaling headroom costs nothing at rest beyond `min_replicas`); a real split would add a second Container App's baseline cost plus Front Door origin/route configuration cost, which the owner has directed to avoid right now.

## 8. Acceptance criteria mapping

- "Public pages can receive traffic without stressing the product app" → satisfied by Container App autoscaling headroom (TB-729), not a new site or new Front Door origin.
- "Public buyers do not see product-admin UI artifacts" → satisfied by hardening `OperatorRoleGate`/`OperatorHomeGate` (TB-730) — a domain split would not fix this on its own.
- "Authenticated app remains focused" → already true; `(operator)` route group and nav contain no marketing concerns today.
- "The founder can still move quickly" → strongest argument against splitting now: one repo, one PR, one CI pipeline, one design system, and (per this revision) no new Front Door configuration to maintain.
- "Recommendation is pragmatic for a solo founder" → yes: two scoped app-level changes plus one metric to watch, versus a new repo/pipeline/domain/Front Door origin.

---

## Cross-references

- Current routing/hosting decision (unchanged by this assessment): [`PUBLIC_MARKETING_SITE_TOPOLOGY.md`](PUBLIC_MARKETING_SITE_TOPOLOGY.md)
- Terraform simplification already tracked: **TB-655** in [`TECH_BACKLOG.md`](TECH_BACKLOG.md)
- Backlog for this strategy: [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-729 – TB-731**
