# Marketing static vs anonymous-live vs tenant boundary

**Status:** Shipped for **TB-1028** (2026-08-02). Honesty CI shipped **TB-1029** (2026-08-12).  
**GTM:** **M-107** (Option A, updated post-**TB-981**), **M-134**, **M-178**/**M-179**.  
**Buyer one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#marketing-static-vs-live-demo-boundary-m-179`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#marketing-static-vs-live-demo-boundary-m-179) · alias [`MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_PA_ONE_PAGER.md`](../go-to-market/MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_PA_ONE_PAGER.md).  
**Related:** ADR 0027 · [`LIVE_DEMO_SEE_IT_LADDER_HONESTY.md`](LIVE_DEMO_SEE_IT_LADDER_HONESTY.md) · sample matrix in `DEMO_QUICKSTART.md` / `SAMPLE_PACKAGE_FUNNEL_ID_MATRIX.md`.

## Decision (PA Q21 minimum, post-TB-981)

Welcome → `/see-it` → primary CTA uses **showcase-static fail-closed** with **Enterprise Customer Intake** as the primary anonymous marketing universe:

- Page chrome and hero rail match the primary customer-intake showcase (`CANONICAL_ANONYMOUS_PROOF_HREF`).
- Live Contoso or unknown `GET /v1/demo/preview` payloads fail closed to the checked-in primary showcase snapshot (`preferShowcaseStaticSnapshot`).
- Primary and secondary proof CTAs deep-link `/showcase/customer-intake-modernization` — **not** Contoso `/demo/preview`.
- Healthcare Claims remains a **regulated-depth secondary** deep link (`SECONDARY_CLAIMS_PROOF_HREF`); banner chrome may say “Healthcare claims” only when the resolved scenario slug is `claims-intake`.
- Contoso `/demo/preview` remains a **secondary Product Tour** route elsewhere; it must not appear under primary `/see-it` chrome.

Option **B** (Contoso-labeled live end-to-end) is an acceptable alternate minimum bar but is **not** the shipped funnel. Option **C** (mixed universes without fail-closed) is forbidden on the primary funnel.

Northwind stays off the primary funnel. Trial SQL Contoso remains a documented co-primary per **M-134** / `sample-scenario-surface-alignment.ts` — not silently swapped into `/see-it`.

## Four layers

| Layer | Surfaces / payloads | Allowed | Forbidden |
| --- | --- | --- | --- |
| **Static marketing pitch** | Welcome / why / SEO CTAs | Scenario name + disclosure | Live tenant outcomes; silent Contoso swap |
| **Static-first sample package** | `/showcase/{slug}`, customer-intake pins | Fixed primary IDs/counts/labels | Contoso payload under customer-intake chrome; Claims chrome over Contoso body |
| **Anonymous live demo seed** | `GET /v1/demo/preview`, `/demo/preview` | Contoso (or matching) seed **with matching labels** | Claims/customer-intake chrome over Contoso; “tenant-accurate” anonymous preview |
| **Signed-in tenant** | Authenticated `ScopeContext` | Customer data only | Contoso/Claims presented as “your” package |

## Fail-closed rules

1. If live payload universe ≠ page universe → serve matching primary showcase snapshot or explicit mismatch disclosure — never silent mix.
2. Banner / `data-see-it-universe` / review title follow `seeItUniverseBannerTitleForPayload` (TB-1279 / TB-1029) — never Healthcare Claims title on customer-intake or Contoso/unknown payloads.
3. Primary `/see-it` must not deep-link Contoso `/demo/preview` (TB-1028 / TB-1029 CTA purity).
4. Anonymous preview is never tenant-accurate.
5. Do not claim Contoso SQL rename / Option D is required before the minimum welcome→`/see-it` funnel bar.

## Enforcement anchors

| Concern | Location |
| --- | --- |
| Showcase-static loader | `archlucid-ui/src/app/(marketing)/see-it/load-see-it-demo-preview.ts` (`preferShowcaseStaticSnapshot`) |
| Universe banner / title | `SeeItMarketingBody.tsx`, `see-it-demo-universe.ts`, `demo-sample-universe.ts` |
| Canonical proof href | `CANONICAL_ANONYMOUS_PROOF_HREF` in `showcase-static-demo.ts` |
| Surface alignment table | `archlucid-ui/src/lib/samples/sample-scenario-surface-alignment.ts` (**TB-981**) |
| Vitest | `archlucid-ui/src/app/(marketing)/see-it/see-it.test.tsx` |
| Playwright | `archlucid-ui/e2e/marketing-demo-preview.spec.ts` (no Contoso CTA from `/see-it`) |
| Honesty CI (phrase / copy) | `scripts/ci/check_see_it_universe_honesty.py` (**TB-1029**) |
| Vitest honesty guard | `archlucid-ui/src/app/(marketing)/see-it/see-it-universe-honesty.test.ts` (**TB-1029**) |

## Out of scope

- Full trial / Product Tour ID matrix remainder beyond **M-134** documented co-primary row
- Northwind archive purge
- Deleting `/demo/preview` as a route
