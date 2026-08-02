> **Scope:** Engineering contract for marketing static vs anonymous-live vs signed-in tenant boundaries. Audience: contributors + GTM. Not a buyer-facing page.

# Marketing static vs anonymous-live vs tenant boundary

**Status:** Shipped for **TB-1028** (2026-08-02). Honesty CI follow-on: **TB-1029**.  
**GTM:** **M-107** (Option A), **M-134**, **M-178**/**M-179**.  
**Buyer one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#marketing-static-vs-live-demo-boundary-m-179`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#marketing-static-vs-live-demo-boundary-m-179) · alias [`MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_PA_ONE_PAGER.md`](../go-to-market/MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_PA_ONE_PAGER.md).  
**Related:** ADR 0027 · [`LIVE_DEMO_SEE_IT_LADDER_HONESTY.md`](LIVE_DEMO_SEE_IT_LADDER_HONESTY.md) · sample matrix in `DEMO_QUICKSTART.md` / `SAMPLE_PACKAGE_FUNNEL_ID_MATRIX.md`.

## Decision (PA Q21 minimum)

Welcome → `/see-it` → primary CTA uses **Option A (Claims-static)**:

- Page chrome is Healthcare Claims / showcase-framed.
- Live Contoso or unknown `GET /v1/demo/preview` payloads fail closed to the checked-in Claims snapshot (`preferClaimsStaticSnapshot`).
- Primary and secondary proof CTAs deep-link `/showcase/claims-intake-modernization` — **not** Contoso `/demo/preview`.
- Contoso `/demo/preview` remains a **secondary Product Tour** route elsewhere; it must not appear under Claims `/see-it` chrome.

Option **B** (Contoso-labeled live end-to-end) is an acceptable alternate minimum bar but is **not** the shipped funnel. Option **C** (mixed universes without fail-closed) is forbidden on the primary funnel.

Northwind stays off the primary funnel.

## Four layers

| Layer | Surfaces / payloads | Allowed | Forbidden |
| --- | --- | --- | --- |
| **Static marketing pitch** | Welcome / why / SEO CTAs | Scenario name + disclosure | Live tenant outcomes; silent Contoso swap |
| **Static-first sample package** | `/showcase/{slug}`, Claims pins | Fixed Claims IDs/counts/labels | Contoso payload under Claims chrome |
| **Anonymous live demo seed** | `GET /v1/demo/preview`, `/demo/preview` | Contoso (or matching) seed **with matching labels** | Claims chrome over Contoso; “tenant-accurate” anonymous preview |
| **Signed-in tenant** | Authenticated `ScopeContext` | Customer data only | Contoso/Claims presented as “your” package |

## Fail-closed rules

1. If live payload universe ≠ page universe → serve matching Claims snapshot (Option A) or explicit mismatch disclosure — never silent mix.
2. Banner / `data-see-it-universe` / review title follow `resolveSeeItDemoUniverse` (TB-1279) — never Claims title on Contoso/unknown.
3. Claims `/see-it` must not deep-link Contoso `/demo/preview` (TB-1028 Option A CTA purity).
4. Anonymous preview is never tenant-accurate.

## Enforcement anchors

| Concern | Location |
| --- | --- |
| Option A loader | `archlucid-ui/src/app/(marketing)/see-it/load-see-it-demo-preview.ts` (`preferClaimsStaticSnapshot`) |
| Universe banner / title | `SeeItMarketingBody.tsx`, `see-it-demo-universe.ts`, `demo-sample-universe.ts` |
| Canonical proof href | `CANONICAL_ANONYMOUS_PROOF_HREF` in `showcase-static-demo.ts` |
| Vitest | `archlucid-ui/src/app/(marketing)/see-it/see-it.test.tsx` |
| Playwright | `archlucid-ui/e2e/marketing-demo-preview.spec.ts` (no Contoso CTA from `/see-it`) |
| Honesty CI (phrase / copy) | **TB-1029** (open) |

## Out of scope

- Contoso SQL GUID rename / Option D flip (**TB-981**)
- Full trial / Product Tour ID matrix remainder (**M-134** leftovers)
- Northwind archive purge
- Deleting `/demo/preview` as a route
