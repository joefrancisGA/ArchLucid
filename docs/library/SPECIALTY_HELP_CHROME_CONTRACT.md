> **Scope:** Contributor-reference — shared specialty help chrome for buyer/product `/help/*` routes scoring ≤~50 (TB-1414); not a buyer-facing trust attestation.

# Specialty help chrome contract

**Status:** Active (V1)  
**Backlog:** **TB-1414** (this contract) · **TB-1415** (anti-bare-markdown / ungated-technical-doc honesty CI — Done)  
**Audience:** Help specialty implementers, UX reviewers, coding agents  
**GTM:** [M-251](https://github.com/joefrancisGA/ArchLucid/blob/master/docs/go-to-market/GTM_BACKLOG.md) (claim honesty) · [M-252](https://github.com/joefrancisGA/ArchLucid/blob/master/docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#owner-screenshot-below-50-specialty-help-chrome-m-252) (PA scoreboard)  
**Related:** Done **TB-735** (Admin technical-help gating) · [`PRODUCT_DOCUMENTATION_PRESENTATION.md`](./PRODUCT_DOCUMENTATION_PRESENTATION.md) · [`UI_DESIGN_SYSTEM.md`](./UI_DESIGN_SYSTEM.md) · [`archlucid-ui/src/lib/specialty-help-chrome-below-50-inventory.ts`](../archlucid-ui/src/lib/specialty-help-chrome-below-50-inventory.ts)

---

## 1. Purpose

Eight recent help routes still score **≤~50/100** for the **same** presentation debt: generic `HelpTopicMarkdownView` dumps contributor markdown with Print/PDF, no specialty companion chrome, no primary in-app CTA, tier/`contentKind` honesty gaps, and residual engineering leakage.

Fix specialty chrome **once**, then apply per slug via existing TB clusters. Do **not** invent a second presentation system per help route.

---

## 2. Required chrome (buyer/product help)

| Slot | Required | Not enough |
| --- | --- | --- |
| First-viewport hero | Specialty companion framing (`OperatorPageHeader` or equivalent) | Print/PDF-only dump |
| Primary CTA | **One** in-app product route | Multiple competing CTAs / none |
| Tier / `contentKind` | Product-help vs Admin-gated `technical-documentation` / internal-runbook | Ungated eng docs in product search |
| Leak strip | No `.md` / CLI / TB / repo paths in primary body | Contributor markdown as buyer body |
| Related density | ≤ **3** secondary in-app guides | Help-center dump of five+ hubs |

Bare `HelpTopicMarkdownView` over contributor markdown is **not** specialty-guided help.

---

## 3. Tier and gate rules

| `contentKind` / tier | Presentation | Discovery |
| --- | --- | --- |
| Product help (`product-help`, buyer operator guides) | Specialty companion + one primary CTA | Help Center product tier |
| `technical-documentation` / internal runbook | Admin gate + de-index from product search | Admin-only until gated (**TB-735** does not claim all slugs) |

Generic markdown remains fallback **only** for true internal docs **after** gate.

---

## 4. ≤~50 inventory (ranked)

Machine-readable copy: [`archlucid-ui/src/lib/specialty-help-chrome-below-50-inventory.ts`](../archlucid-ui/src/lib/specialty-help-chrome-below-50-inventory.ts).

| Score (approx) | Route | Owning cluster | Status |
| --- | --- | --- | --- |
| ~32 | `/help/developer-troubleshooting` | **TB-1246**–**TB-1250** | Open |
| ~33 | `/help/api-contracts` | **TB-1384**–**TB-1388** | Open |
| ~39 | `/help/configuration-reference` | **TB-1326**–**TB-1330** | Open |
| ~40 | `/help/repeat-review-loop` | **TB-1394**–**TB-1398** | **Done** |
| ~42 | `/help/evaluator-workbook` | **TB-1345**–**TB-1349** | Open |
| ~42 | `/help/sponsor-summary` (pilot ROI depth) | **TB-1389**–**TB-1393** | **Done** |
| ~46 | `/help/first-hour-operator-path` | **TB-1374**–**TB-1378** | Open |
| ~49 | `/help/procurement` | **TB-1253**–**TB-1257** | Open |

Do not open duplicate presentation TB rows — implement against the mapped cluster.

---

## 5. Reuse exemplars (do not reinvent)

| Exemplar | What to copy |
| --- | --- |
| `HelpCorePilotGuideView` | Workflow steps + one primary Start CTA + disclosure |
| `HelpConnectAzureSecurelyGuideView` | Integration specialty + verify/configure CTA |
| `HelpReviewPackagesGuideView` | Open product route CTA + Related cap + export next steps |
| `HelpRepeatReviewLoopGuideView` | Loop-step deep links + Related density |

Dispatch specialty roots from [`archlucid-ui/src/app/(operator)/help/[...topic]/page.tsx`](../archlucid-ui/src/app/(operator)/help/[...topic]/page.tsx); do not add parallel routers.

---

## 6. Claim boundary (GTM M-251)

Do **not** claim:

- Product help is specialty-guided / Start-CTA ready while ≤~50 inventory rows still fall through bare `HelpTopicMarkdownView`.
- **TB-735** gates all technical help while `contentKind: technical-documentation` remains ungated in search.
- A new per-slug presentation system is required instead of this contract.

**Say instead:** shared specialty chrome (hero + one in-app CTA + tier/gate + leak strip); per-route TB clusters implement the contract.

---

## 7. Verification

| Layer | Owner |
| --- | --- |
| This contract + inventory table | **TB-1414** (Done) |
| CI honesty guards for buyer copy | **TB-1415** (Done — `check_specialty_help_chrome_honesty.py` + Vitest) |
| Per-slug specialty shipping | Mapped clusters above |

Vitest inventory drift guard: `archlucid-ui/src/lib/specialty-help-chrome-contract.test.ts`.
