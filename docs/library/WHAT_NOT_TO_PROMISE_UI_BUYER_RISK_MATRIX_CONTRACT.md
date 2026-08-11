> **Scope:** Engineering contract mapping GTM do-not-promise rows to buyer-facing UI surfaces, residual risk, and open backlog owners. Audience: contributors, PA reviewers, GTM (**M-239** / **M-240**). Not a buyer-facing page.

# WNTP → UI buyer-risk matrix contract (TB-1343)

**Status:** Shipped **2026-08-11** (**TB-1343**). Honesty CI follow-on: **TB-1344**.  
**GTM:** **M-239** (matrix), **M-240** (PA one-pager).  
**Canon table:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) (formerly `WHAT_NOT_TO_PROMISE.md`).  
**PA handout (path-stable alias):** [`../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#wntp-ui-buyer-risk-matrix-m-240`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#wntp-ui-buyer-risk-matrix-m-240) · [`../go-to-market/WHAT_NOT_TO_PROMISE_UI_BUYER_RISK_MATRIX_PA_ONE_PAGER.md`](../go-to-market/WHAT_NOT_TO_PROMISE_UI_BUYER_RISK_MATRIX_PA_ONE_PAGER.md).  
**Related:** Done **TB-134** · open **TB-1112** / **TB-1144** / **TB-1166** / **TB-1279** / **TB-1294** · **TB-1367** · **TB-1463** / **TB-1464**.

## Decision

Doc-only phrase scanners (**TB-134**, `check_commercial_overclaim_guard.py`, warn-only `check_proof_summary_promise_language.py`) do **not** prove buyer UI is safe. GTM and PA must rank in-app/marketing surfaces against the nine core WNTP rows below and cite named engineering owners — without reopening Done **TB-135** / **TB-136** (CPA SOC 2 = **G-REAL-05**; third-party pen test = **G-ASSURANCE-02**).

## Highest buyer-risk surfaces (ranked)

| Rank | Surface cluster | Primary WNTP rows | Residual UI owners |
| ---: | --- | --- | --- |
| 1 | Trust / assurance — `/trust`, `/administration/settings/security-trust`, `/help/procurement`, `/help/soc2-self-assessment` | SOC 2 CPA · Third-party pen test · Pilot trust without CPA/3P (**M-191**) | **TB-1112** · **TB-1144** · **TB-1166** · **M-196** / **M-197** |
| 2 | Commerce — `/pricing`, `/administration/settings/billing`, `billing-help-guide-content.ts` | Live Marketplace / Stripe · Named reference customer | **TB-1166** · **TB-1169**–**TB-1170** · **G-COMMERCE-*** |
| 3 | Demo funnel — `/welcome`, `/see-it`, `/why`, `/live-demo`, `/demo/explain` | Simulator ROI · `/see-it` static vs live · Showcase naming | **TB-1279** · **TB-1280**–**TB-1282** · **TB-1294**–**TB-1296** · **TB-1028** · **M-178** / **M-179** |
| 4 | Cost / AI usage — `/administration/settings/ai-usage`, fleet COGS copy | Invoiced Azure OpenAI cost | **TB-1216**–**TB-1219** · pricing/help honesty rows |
| 5 | Connectors — integration pages, `/help/integration-readiness`, run detail deferred-scope notices | Native connectors GA everywhere · stale “not in V1” deferrals | **TB-599** · **TB-1420** · page P0 integration cluster · **TB-1367** (elevator pitch) |

## Core WNTP row → UI surface matrix (nine rows)

| WNTP row | Do not promise (UI) | Highest-risk UI surfaces | Open owner rows |
| --- | --- | --- | --- |
| SOC 2 CPA attestation | “SOC 2 certified” / CPA report available | Trust center, Security & trust settings, `/help/procurement`, `/help/soc2-self-assessment` | **TB-1112** · **TB-1144** · **M-196** — tech **TB-135** Done; owner **G-REAL-05** |
| Third-party pen test | Published independent pen-test report | Same assurance cluster + procurement FAQ | **TB-1144** · **M-197** — tech **TB-136** Done; owner **G-ASSURANCE-02** |
| Live Marketplace / Stripe checkout | “Buy today” / always-on self-serve checkout | `/pricing`, billing settings, billing help CTAs | **TB-1166** · **TB-1169**–**TB-1170** · **TB-1344** (CI) |
| Named reference customer | “Customer X saved Y%” without approval | Marketing proof pages, executive ROI widgets, welcome/see-it quant copy | **TB-1294** · **TB-1367** · **TB-1463** drift inventory |
| MCP / plugin marketplace | “MCP marketplace GA” | Marketing integration copy, help technical references | **TB-1367** · docs guards — low in-app surface today |
| Native connectors (Jira, ServiceNow, Teams) | “Zero setup everywhere” / “Connectors not in V1” | Integration hub pages, Azure Boards/Jira/Teams/ServiceNow settings, `RunDetailDeferredScopeNotice` | **TB-599** · **TB-1420** · integration P0 cluster |
| Multi-region active/active | Active/active multi-region SLA | Trust/scalability FAQ, procurement help | **TB-1112** · trust-center honesty |
| Realized ROI USD | “Guaranteed $ savings” | Executive dashboard ROI cards, `/insights/roi-summary`, welcome/see-it | **M-138** · **TB-1294** · **TB-1367** |
| Invoiced Azure OpenAI cost | “Invoice-accurate COGS” | AI usage admin, billing meter copy, executive cost widgets | **TB-1216**–**TB-1219** · fleet COGS honesty |

## Coverage rule

| Control | Covers | Does not cover |
| --- | --- | --- |
| **TB-134** doc scanners | GTM markdown / docs corpus | React UI strings, pricing pages, help specialty views |
| **This contract (TB-1343)** | Ranked surface × WNTP row × owner map for PA triage | Rewriting every page body |
| **TB-1344** (open) | Fail dishonest WNTP phrases / checkout theater on named buyer UI paths | Implementing Stripe / CPA programs |

## CI anchors for TB-1344

Extend or sibling-scan these paths against [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise):

| Path class | Examples |
| --- | --- |
| Marketing proof funnel | `archlucid-ui/src/app/(marketing)/see-it/**`, `welcome/**`, `live-demo/**`, `why/**` |
| Trust / procurement | `trust-center` copy modules, `OperatorSecurityTrustPageView`, `procurement-help-*`, `soc2-self-assessment` help |
| Billing / pricing | `billing-help-guide-content.ts`, `/pricing` page copy, billing settings CTAs |
| Connector honesty | `RunDetailDeferredScopeNotice`, integration empty-state copy, `V1_SCOPE`-stale deferral strings |
| Executive ROI | `executive-dashboard` KPI/evidence copy modules tied to quantified savings |

Forbidden without negation or execution-mode label: `SOC 2 certified`, `pen test complete`, `guaranteed savings`, `invoice-accurate`, `Buy on Marketplace today`, stale `Connectors not in V1`.

## Out of scope

- CPA SOC 2 program execution (**G-REAL-05**) or third-party pen test (**G-ASSURANCE-02**)
- Stripe live-key flip or Marketplace listing
- Rewriting every marketing/help page in **TB-1343** (matrix only)
- Enterprise onboarding specialty cluster (**TB-1338**–**TB-1342**)
