> **Scope:** Contributor-reference — fused PA challenge contract for the public proof ladder (`/see-it` → `/live-demo` → evaluation). Not a buyer assurance attestation.

# `/live-demo` vs `/see-it` — safe ladder + claim honesty (TB-1427)

> **Audience:** Contributors, principal architects, SE facilitators, and marketing reviewers of public proof CTAs.  
> **Not** a buyer assurance claim — rungs 1–2 are fabricated/anonymous sample surfaces, not authenticated live product demos.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#live-demo-see-it-ladder-m-260) (GTM **M-260**).  
**Path-stable alias:** [`LIVE_DEMO_SEE_IT_LADDER_PA_ONE_PAGER.md`](../go-to-market/LIVE_DEMO_SEE_IT_LADDER_PA_ONE_PAGER.md) (GTM **M-259**).  
**Claim honesty index:** [`PA_CLAIM_HONESTY_INDEX.md`](../go-to-market/PA_CLAIM_HONESTY_INDEX.md) (GTM **M-253**).  
**Static vs live boundary:** [`MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_CONTRACT.md`](MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_CONTRACT.md) (**TB-1028** / GTM **M-178**/**M-179**).  
**Demo/anonymous read plane:** [`DEMO_ANONYMOUS_READ_PLANE_CONTRACT.md`](DEMO_ANONYMOUS_READ_PLANE_CONTRACT.md) (**TB-1251** / GTM **M-218**).

**Slice contracts (do not re-author here):**

| Slice | Engineering contract |
| --- | --- |
| `/see-it` universe fail-closed | **TB-1279** (Done) — Claims chrome ≠ Contoso payload |
| Marketing static vs anonymous-live | **TB-1028** (Done) — Option A fail-closed on `/see-it` |
| `/live-demo` title honesty | **TB-1265** (Done) — rename off “Live demo” in H1/metadata |
| `/see-it` title honesty | **TB-1280** (Done) — honest sample-review title |
| Funnel IA owner decision | **M-107** (Done) — welcome/header `/see-it` push |

---

## Decision in one line

**`/live-demo` title honesty is shipped** (**TB-1265** Done — H1/metadata/Resources use “Guided sample walkthrough”), but the page remains **conditionally hurting** when mode chip is absent, offline fallback is narrated as a live API session, ladder UI between `/see-it` and `/live-demo` is missing (**TB-1267** / **TB-1282**), or Contoso-shaped payload sits under Claims chrome. Keep it as **rung 2** of a labeled see-it ladder with universe/mode pins and sample-illustrative governance copy only.

---

## PA verdict (helping vs hurting — one paragraph)

`/live-demo` **helps** when it teaches the product spine on fabricated data with disclosure, `robots: noindex`, honest title (**TB-1265** Done — “Guided sample walkthrough”), and a visible mode chip (`Offline curated sample` vs `Anonymous public sample API`). It **hurts** when offline fallback is narrated as a live API session; when Contoso-shaped payloads sit under Claims chrome; when “Review integrity” sells sponsor/governance readiness on sample data; or when `/see-it` and `/live-demo` compete without rung labels (**TB-1267** / **TB-1282**). **Safe posture:** rung 1 (`/see-it`) for universe-honest quick proof → rung 2 (`/live-demo`) for guided fabricated sample walkthrough → rung 3 (eval/enterprise CTA). Treat “ladder done” while **TB-1267** / **TB-1282** / **TB-1029** remain open as a **review finding**.

---

## Safe see-it ladder (3 rungs)

| Rung | Route | Honest job | Forbidden |
| --- | --- | --- | --- |
| **1** | `/see-it` | ~30s universe-honest proof (prefer Claims-static Option A per **TB-1028**) | Contoso payload under Claims chrome; “live tenant” |
| **2** | `/live-demo` | Guided **fabricated sample walkthrough** (H1: “Guided sample walkthrough” per **TB-1265**) | “Live demo/product”; imply Real execute / customer record |
| **3** | Eval / enterprise CTA | Authenticated trial or sales-led demo | Presenting rungs 1–2 as the evaluation |

### Mode honesty (rung 2)

Show a chip/status — never silent fallback that still says Live:

| Mode | When | Buyer-safe label |
| --- | --- | --- |
| Offline curated sample | Showcase static / offline fallback when `/v1/public/demo/sample-run` missing or fails | `Offline curated sample` |
| Anonymous public sample API | `/v1/public/demo/sample-run` succeeds | `Anonymous public sample API` |

### Universe pin

Same sample-definition as `/see-it` after **M-107** / **TB-1028** Option A/B; **fail closed** on Contoso ≠ Claims mismatch (**TB-1279** class).

### Copy soften (rung 2)

Demote “Review integrity” / sponsor-governance readiness language to **sample-illustrative** claims; keep fabricated disclosure prominent.

---

## Explicit non-claims

- Do **not** sell `/live-demo` as a live / Real / tenant product demo or authenticated evaluation.
- Do **not** narrate offline curated fallback as a live API session.
- Do **not** claim the see-it ladder is **done** while **TB-1267** / **TB-1282** remain open, mode chip is absent, or Contoso-under-Claims fail-closed is unresolved (**TB-1029**).
- Do **not** use sample “Review integrity” language as customer attestation, certification, or sponsor-governance readiness proof.
- Does **not** reopen Done **M-107**, **TB-1028**, **TB-1279**, or **TB-1265**/**TB-1280**/**TB-1283** title-honesty rows.
- Does **not** imply CPA SOC 2 attestation or a published third-party penetration test.

---

## Delivery status (owner contracts)

| ID | Title (short) | Status | Ship-order hint |
| --- | --- | --- | --- |
| **TB-1028** | Marketing static vs anonymous-live boundary | **Done** | Foundation — Option A fail-closed |
| **TB-1279** | `/see-it` universe fail-closed banner | **Done** | Universe pin for rung 1 |
| **TB-1265** | `/live-demo` honest sample-walkthrough title | **Done** | Rung 2 rename off Live |
| **TB-1280** | `/see-it` honest sample-review title | **Done** | Rung 1 title honesty |
| **TB-1283** | `/see-it` marketing PDF download label honesty | **Done** | Rung 1 collateral honesty |
| **TB-1427** | This fused ladder + claim-honesty contract | **Done** | Orchestration — you are here |
| **TB-1266** | `/live-demo` first-viewport hero budget | **Open** | With **TB-1265** |
| **TB-1267** | `/live-demo` journey vs `/see-it` ladder UI | **Open** | Pairs **TB-1282** |
| **TB-1268** | `/live-demo` compact stepper + early CTA | **Open** | With **TB-1266** |
| **TB-1269** | `/live-demo` continuous-mode density | **Open** | With **TB-1268** |
| **TB-1281** | `/see-it` first-viewport hero budget | **Open** | With **TB-1279** |
| **TB-1282** | `/see-it` single CTA path + ladder + jargon purge | **Open** | Pairs **TB-1267** |
| **TB-1029** | Anti-Claims-banner-Contoso-payload honesty CI | **Open** | After **TB-1028**; pairs **M-178** |
| **TB-1428** | Anti-live-demo-as-live / ladder-closed honesty CI | **Open** | After **TB-1427**; GTM **M-259** |

**Recommended next engineering passes among open rows:** **TB-1267** + **TB-1282** (ladder UI), then **TB-1428** (language guard CI).

---

## PA review script

1. Ask which rung the buyer will open and whether ladder UI labels the `/see-it` ↔ `/live-demo` relationship (**TB-1267** / **TB-1282**).
2. Confirm offline curated fallback is **not** narrated as a live API session — mode chip must match reality.
3. Confirm Contoso payload is **not** under Claims chrome (universe fail-closed).
4. Confirm “Review integrity” / sponsor-governance language is sample-illustrative only.
5. Treat “ladder done” while **TB-1267** / **TB-1282** / **TB-1029** remain open as a **review finding**.

---

## Related

- GTM **M-259** / **M-260** · [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise)
- Open honesty CI follow-on: **TB-1428**
- Does **not** implement title/ladder UI, hero budgets, or stepper density — those remain in **TB-1266**–**TB-1269** / **TB-1281**–**TB-1282**
