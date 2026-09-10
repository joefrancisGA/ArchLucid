# SH-18 — Cloud connections hub and `/help/cloud-connections`

**Do not** re-enable AWS/GCP in SecureNow. Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

SN-02 covered wizard/preflight brand. This prompt is **job match**: remaining hub/help body still teaches multi-cloud + evidence-only **architecture reviews**.

## Goal

Security cloud-connections hub Category-1 (fields beyond `whatIsThisPage`, which is already Azure-only via `cloudConnectionsHubContextualLeadForProductLine`), `/help/cloud-connections` article constants that still mention AWS/GCP or architecture reviews, and the help-page drawer that still says “optional Azure, AWS, and GCP connectors”. Nav label is **Azure connections**. Exclude AWS/GCP help topics already happens for slugs — the hub article body must match.

## Why

`cloud-connections-integration-rows.ts` hub `whatToDoNext` / `whyEmpty` / `taskSteps` still: “Choose platforms to show”, “start an evidence-only review”, “Open a provider card”. Security has one provider.

`/help/cloud-connections` drawer: “optional Azure, AWS, and GCP connectors”.

`cloud-connections-help-guide-content.ts`: default subtitle constant still lists AWS/GCP (function is product-line-aware); intro “inventory in a review”; claim discipline “evidence tier for architecture reviews”; Start here card “evidence-only review”; Tier 1 “New architecture review wizard” / ArchLucid distribution. `cloudConnectionsHelpTier2` is already Security-aware.

## Context

- `archlucid-ui/src/lib/contextual-help/cloud-connections-integration-rows.ts`
- `archlucid-ui/src/lib/cloud-connections-help-guide-content.ts`
- `archlucid-ui/src/lib/product-line/securenow-cloud-platform-policy.ts`
- `archlucid-ui/src/lib/help/help-center-catalog-security.ts` — summary already Azure-only
- Live hub: `archlucid-ui/src/app/(operator)/integrations/cloud-connections/`

## What to build

1. Security hub Category-1: what stays Azure-only lead; next = open Azure, run preflight/wizard, or skip to extract-upload ZIP; empty = Not connected until Tier 2; no “choose platforms” / no start-review. Actions: Azure wizard, extract-upload, resource explorer.
2. Security `/help/cloud-connections`: intro, orientation, claim discipline, start-here card, Tier 1 useWhen — Azure ZIP / extract-upload, not New architecture review. Do not render AWS/GCP choose-platform cards (already excluded topics — verify the page does not still list them).
3. Help drawer for `/help/cloud-connections` product-line-aware (Azure-only).
4. Vitest: Security fixtures contain no AWS/GCP and no `/architecture/reviews`. Architecture hub still lists three clouds + evidence-only reviews.

## Acceptance criteria

- Security F1 and help article match Azure-only nav.
- No evidence-only **architecture review** CTA from Security help.
- Architecture hub unchanged (three clouds).

## Constraints

- Do not rename Entra object IDs. Do not add AWS/GCP back.
- Stage cloud-connections help + hub rows + tests.
