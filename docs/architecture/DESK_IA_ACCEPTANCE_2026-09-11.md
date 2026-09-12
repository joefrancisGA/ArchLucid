> **Scope:** Contributor-reference — wave 28 (DI-001–DI-024) close-audit evidence for **Governance sealed-record home** and desk IA leftovers.

# Desk-IA wave close audit (DI-024)

> **Date:** 2026-09-12 (wave 28 — DI-001–DI-024)  
> **Owner decision:** Sealed review records inventory lives under **Governance** (`/governance/sealed-records`). Architecture desk remains Monday-morning home. Desktop review tabs stay a full strip.  
> **Spine:** [ADR 0095](adrs/0095-sealed-record-governance-home.md) · [`.cursor/prompts/desk-ia-00-index.md`](../../.cursor/prompts/desk-ia-00-index.md) · [DESK_IA_COMPOSER_PROMPTS.md](DESK_IA_COMPOSER_PROMPTS.md)

## Verdict

**Shipped** on this branch for Working production seats, subject to residuals below. Sealed list is not 404. Governance nav includes the ledger. Desktop tabs are not behind **More**. ADR **0095** remains **Proposed** (formal owner acceptance is a separate step).

This audit does **not** claim G-REAL-06, CPA SOC 2 (**G-REAL-05**), third-party pen-test publication (**G-ASSURANCE-02**), or live GTM cohorts (**M-90 / M-44 / M-91 / M-92**).

## Done tests (owner checklist)

| # | Done test | Shipped? | Evidence |
|---|-----------|----------|----------|
| 1 | Sealed list is not 404 | **Yes** | `governance/sealed-records/page.tsx`; `bookmark-permanent-redirects.ts` |
| 2 | Governance nav includes ledger | **Yes** | `operate-governance-nav-group-builder.ts`; `desk-ia-governance-nav-sealed-records.test.ts` |
| 3 | Desktop tabs not behind More | **Yes** | `desk-ia-no-collapse-tabs-ratchet.test.ts` |
| 4 | Decision register ↔ sealed cross-link | **Yes** | `decision-register-evidence-copy.ts`; `signed-record-evidence-copy.ts` |
| 5 | Help: package vs register | **Yes** | `HelpSealedVsDecisionRegisterGuideView`; `desk-ia-help-sealed-vs-decision-register-route.test.ts` |

## Cluster evidence

| Cluster | Prompts | Shipped? | Primary evidence | Residual |
|---------|---------|----------|------------------|----------|
| Kernel ADR + inventory | DI-001–002 | **Yes** | ADR 0095; `DESK_IA_404_ORPHANS_INVENTORY.md`; `desk-ia-adr-guard.test.ts` | ADR 0095 **Proposed** |
| IA + nav + help | DI-003–023 | **Yes** | Sealed list page; Governance nav; help topic | Approval parent detail (DI-017) |
| Skips / close | DI-019–024 | **Yes** | `desk-ia-prompt-inventory.test.ts`; this file | Six sponsor routes not merged |

## Residuals

| Item | Tracking | Notes |
|------|----------|-------|
| ADR **0095** formal **Accepted** | DI-001 | Proposed in this wave |
| Merge six sponsor routes | DI-021 skip | Explicit out-of-wave |
| System-wide breadcrumbs | DI-022 skip | TB-2090 |
| Approval request parent detail | DI-017 | Lineage exists; parent page residual |

## Verification commands

```bash
cd archlucid-ui
npm run test -- --run \
  src/lib/desk-ia-prompt-inventory.test.ts \
  src/lib/desk-ia-adr-guard.test.ts \
  src/lib/desk-ia-governance-nav-sealed-records.test.ts \
  src/lib/desk-ia-no-collapse-tabs-ratchet.test.ts \
  src/lib/desk-ia-help-sealed-vs-decision-register-route.test.ts \
  src/lib/desk-ia-close-audit.test.ts
```
