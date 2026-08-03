> **Scope:** Field Core Web Vitals triage before the next UI bundle cut (TB-2031). Maps App Insights `WebVitalsMetric` signals to the right engineering backlog cluster. Owner cadence remains GTM **G-QA-06** / **G-QA-07** / **M-112**.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Field Web Vitals triage (TB-2031)

**Audience:** Engineers picking the next UI performance cut; founders running monthly CWV review (**G-QA-06**) or pre-cut triage (**G-QA-07**).

**Do not** start another `dynamic()` / First Load JS wave until this checklist says the bottleneck is JS-bound. Bundle cuts are wasted if p75 LCP is API/SQL-bound or INP is list-bound.

---

## 1. Prerequisites

| Requirement | Notes |
|-------------|--------|
| `NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING` set on the UI | Events only emit when App Insights init succeeds (**TB-692**) |
| Sample rate | `NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE` (default **0.25**). Raise to `1` temporarily for a dense triage window |
| Routes normalized | Dynamic ids collapsed (e.g. `/reviews/[runId]`) — see `telemetry-route-normalizer.ts` |
| Lab vs field | Lab Lighthouse (**TB-693** / [`UI_LIGHTHOUSE_CI.md`](../architecture/UI_LIGHTHOUSE_CI.md)) is complementary; **field p75 wins** when they disagree |

Priority routes (also in [`ui_route_traffic_estimates.template.md`](../architecture/ui_route_traffic_estimates.template.md)):

- `/reviews` (or current hub alias)
- `/reviews/[runId]` (or `/architecture/reviews/[runId]` after renames — use whatever `route` dimension emits)
- `/governance` / `/governance/findings`
- `/welcome` (marketing LCP)

---

## 2. App Insights queries

### 2.1 p75 by metric and route (last 14 days)

```kusto
customEvents
| where timestamp > ago(14d)
| where name == "WebVitalsMetric"
| extend metricName = tostring(customDimensions.metricName)
| extend route = tostring(customDimensions.route)
| extend value = todouble(customDimensions.value)
| extend rating = tostring(customDimensions.rating)
| where metricName in ("LCP", "INP", "CLS", "TTFB", "FCP")
| summarize
    samples = count(),
    p75 = percentile(value, 75),
    p95 = percentile(value, 95),
    poorShare = avg(iff(rating == "poor", 1.0, 0.0))
  by route, metricName
| order by metricName asc, p75 desc
```

### 2.2 LCP vs TTFB on the same route (network vs paint)

```kusto
customEvents
| where timestamp > ago(14d)
| where name == "WebVitalsMetric"
| extend metricName = tostring(customDimensions.metricName)
| extend route = tostring(customDimensions.route)
| extend value = todouble(customDimensions.value)
| where metricName in ("LCP", "TTFB")
| summarize p75 = percentile(value, 75) by route, metricName
| evaluate pivot(metricName, any(p75))
| extend ttfbShareOfLcp = iff(isnotnull(LCP) and LCP > 0 and isnotnull(TTFB), TTFB / LCP, real(null))
| order by LCP desc
```

### 2.3 INP by route (interaction-bound)

```kusto
customEvents
| where timestamp > ago(14d)
| where name == "WebVitalsMetric"
| extend metricName = tostring(customDimensions.metricName)
| extend route = tostring(customDimensions.route)
| extend value = todouble(customDimensions.value)
| where metricName == "INP"
| summarize samples = count(), p75Inp = percentile(value, 75) by route
| where samples >= 20
| order by p75Inp desc
```

### 2.4 Stratify by connection (optional)

```kusto
customEvents
| where timestamp > ago(14d)
| where name == "WebVitalsMetric"
| extend metricName = tostring(customDimensions.metricName)
| extend route = tostring(customDimensions.route)
| extend conn = tostring(customDimensions.effectiveConnectionType)
| extend value = todouble(customDimensions.value)
| where metricName == "LCP"
| summarize p75Lcp = percentile(value, 75), n = count() by route, conn
| order by p75Lcp desc
```

If only `2g`/`3g` looks bad, do **not** prioritize a desktop JS cut.

---

## 3. Interpretation → backlog mapping

Use **p75** (not a single outlier). Prefer routes with **≥20 samples** after sampling.

| Dominant field signal | Likely cause | Prioritize (do this) | Do not start first |
|----------------------|--------------|----------------------|--------------------|
| **TTFB high** and `ttfbShareOfLcp` ≳ **0.4**, or LCP poor while First Load JS CI green | API / SQL / SSR / proxy wait | **TB-2022** (slim first-paint / server path), **TB-2027** (loader/proxy waterfalls), older **TB-929**/**TB-930** peers if still open | Another client `dynamic()` wave |
| **LCP / FCP poor**, TTFB fine, First Load JS over budget or large route chunks | JS-bound / heavy sync shell | **TB-2021** (run-detail sync shell), **TB-934** (hub First Load JS), **TB-2028** (`/welcome` shell) | List virtualization before shell cut |
| **INP poor** on list/inbox/queue routes | Main-thread / large DOM / fan-out on interaction | **TB-935** (list Query + virtualization), **TB-2023** (alerts inbox mount fan-out) | Marketing `next/image` (**TB-2032** waived — no raster LCP today) |
| **CLS poor** | Layout shift (late fonts, unsized media, deferred chrome) | Fix the shifting surface; marketing image LCP → reopen **TB-2032** only when Lighthouse/field show **image-bound** LCP ([waiver](../architecture/tb2032_marketing_lcp_image_waiver.md)) | Bundle cut alone |
| Lab Lighthouse bad, field CWV fine | Lab/mock distortion | Keep Lighthouse warn-only; trust field for cut choice | Merge-blocking LH scores |

### Rough “good enough” bands (field, desktop-ish)

These are triage heuristics, not SLOs:

| Metric | Investigate when p75 exceeds |
|--------|------------------------------|
| LCP | ~2500 ms on operator hubs; ~4000 ms on cold marketing |
| INP | ~200 ms |
| CLS | ~0.1 |
| TTFB | ~800 ms (then confirm with API/SQL traces) |

---

## 4. Pre-cut ritual (**G-QA-07** + engineering)

1. Run §2.1 for the last 14 days (or since last cut).
2. Pick the worst **priority route × metric**.
3. Apply §3 mapping → open/prioritize **one** TB cluster (or confirm the already-open peer).
4. Confirm First Load JS gate still green: `cd archlucid-ui && npm run check:first-load-js` after `npm run build` (**TB-573** / **TB-691**).
5. Only then schedule the bundle/list/network work.
6. Record the choice in the PR description (see PR template checkbox).

Monthly owner pass (**G-QA-06**): same queries; file or bump backlog when field CWV regresses — do not invent new GTM IDs.

---

## 5. Related

| Doc / asset | Role |
|-------------|------|
| [`UI_LIGHTHOUSE_CI.md`](../architecture/UI_LIGHTHOUSE_CI.md) | Lab synthetic Lighthouse |
| [`OBSERVABILITY.md`](../library/OBSERVABILITY.md) | Frontend telemetry + sample rate |
| [`ui_route_traffic_estimates.template.md`](../architecture/ui_route_traffic_estimates.template.md) | Route priority + sample Kusto |
| [`FOUNDER_UI_ACCEPTANCE_ROUTINE.md`](../architecture/FOUNDER_UI_ACCEPTANCE_ROUTINE.md) | Founder acceptance; links here for CWV triage |
| `archlucid-ui/src/lib/telemetry/web-vitals-reporter.ts` | Emitter (**TB-692**) |
| `archlucid-ui/src/lib/telemetry/server-request-timing.ts` | BFF `Server-Timing` + slow proxy logs (UI↔API wait) |
| [`tb2032_marketing_lcp_image_waiver.md`](../architecture/tb2032_marketing_lcp_image_waiver.md) | **TB-2032** waived — no marketing raster LCP |
| GTM **G-QA-06** / **G-QA-07** / **M-112** | Owner cadence (no new GTM IDs) |
