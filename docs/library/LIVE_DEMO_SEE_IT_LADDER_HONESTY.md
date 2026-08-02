> **Scope:** Marketing claim-honesty contract for the public proof ladder (`/see-it` → `/live-demo` → evaluation). Audience: engineering + GTM. Not buyer-facing.

# `/live-demo` vs `/see-it` — safe ladder + claim honesty

**Status:** Contract draft for **TB-1427** (engineering) / **M-259**/**M-260** (GTM).  
**Date:** 2026-07-26.

## Verdict (today)

**Net hurting claim honesty.** Keep the page as rung 2 of a see-it ladder only after renaming off “Live” and pinning universe/mode honesty.

| Helps | Hurts |
|---|---|
| Fabricated-data disclosure present | H1 / metadata / Resources still say **Live demo** |
| Eyebrow “Sample walkthrough”; `robots: noindex` | Often serves curated **offline** Claims showcase when `/v1/public/demo/sample-run` missing/fails — still labeled Live |
| Claims scenario labels on disclosure | Contoso-shaped API payload can sit under Claims chrome (**TB-1028** class) |
| Guided product-spine teaching (exec → signed → evidence → governance → audit) | “Review integrity” overclaims sponsor/governance readiness on sample data |
| | Welcome/header push `/see-it`; Resources offers parallel **Live demo** with no rung labels |

## Safe see-it ladder

| Rung | Route | Honest job | Forbidden |
|---|---|---|---|
| **1** | `/see-it` | ~30s universe-honest proof (prefer Claims-static Option A per **TB-1028**) | Contoso payload under Claims chrome; “live tenant” |
| **2** | `/live-demo` | Guided **fabricated sample walkthrough** (rename off “Live”) | “Live demo/product”; imply Real execute / customer record |
| **3** | Eval / enterprise CTA | Authenticated trial or sales-led demo | Presenting rungs 1–2 as the evaluation |

### Mode honesty (rung 2)

Show a chip/status:

- `Offline curated sample` — when using showcase static / offline fallback
- `Anonymous public sample API` — when `/v1/public/demo/sample-run` succeeds

Never silent fallback that still says Live.

### Universe pin

Same sample-definition as `/see-it` after **M-107** / **TB-1028** Option A/B; fail closed on mismatch.

### Copy soften

Demote “Review integrity” / sponsor-governance readiness language to sample-illustrative claims; keep fabricated disclosure.

## Orchestration (do not duplicate bodies)

| Concern | Owner |
|---|---|
| Rename off “Live demo” | **TB-1265** |
| Hero budget | **TB-1266** |
| Ladder UI (live-demo ↔ see-it) | **TB-1267**, **TB-1282** |
| Stepper / continuous density | **TB-1268**, **TB-1269** |
| See-it universe / time / CTA | **TB-1279**–**TB-1283** |
| Static vs live boundary | **TB-1028** (Done), **TB-1029**, **M-178**/**M-179** |
| Funnel IA owner decision | **M-107** |
| Fused PA contract + honesty CI | **TB-1427**, **TB-1428** |
| GTM claim honesty + one-pager | **M-259**, **M-260** |

## Forbidden marketing claims

- `/live-demo` is a live / Real / tenant product demo
- Offline curated fallback is a live API session
- Ladder is “done” while H1/Resources still say Live demo or Contoso≠Claims fail-closed is open
- Sample “Review integrity” language as customer attestation / certification
