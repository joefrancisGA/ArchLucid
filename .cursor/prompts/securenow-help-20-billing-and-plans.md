# SH-20 — `/help/billing-and-plans` in the Security shell

Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

`/administration/billing` is **Architecture-only** (`PRODUCT_LINE_NAV_ASSIGNMENTS`). Do not add a billing settings page to SecureNow in this prompt.

## Goal

Stop featuring and deep-linking Billing and plans as if SecureNow operators can open workspace billing. Either (preferred) **exclude** slug `billing-and-plans` from Security help hub featured + advanced and Help search, or rewrite the Security article to an honest “billing is not administered in this SecureNow workspace — contact your Architecture/tenant billing admin” **without** a primary CTA to `/administration/settings/billing`. Architecture help unchanged.

## Why

`HELP_CENTER_SECURITY_FEATURED_SLUGS` includes `billing-and-plans` with summary “Manage your SecureNow subscription…”. Article (`billing-help-guide-content.ts`) primary action `SETTINGS_BILLING_PATH`. Security users following help hit a product-line gate or a missing nav dest.

## Context

- `archlucid-ui/src/lib/help/help-center-catalog-security.ts`
- `archlucid-ui/src/lib/billing-help-guide-content.ts`
- `archlucid-ui/src/lib/product-line/securenow-cloud-platform-policy.ts` — extend exclusion lists (AWS/GCP pattern)
- `archlucid-ui/src/lib/help/help-search-panel-catalog-topics.ts`
- `archlucid-ui/src/lib/product-line/product-line-catalog.ts` — billing assignment
- `archlucid-ui/src/lib/contextual-help/workspace-administration-rows.ts` — billing help prefix

## What to build

1. Prefer `SECURENOW_EXCLUDED_HELP_TOPIC_SLUGS` (or sibling) add `billing-and-plans` and matching search topic ids. Remove from `HELP_CENTER_SECURITY_FEATURED_SLUGS`.
2. If the article remains reachable via bookmark: Security presentation must not primary-CTA the Architecture billing route. Optional honest paragraph + contact-support. Do not invent SecureNow Inc. billing.
3. Help search / empty-state must not recommend billing for Security.
4. Vitest: Security help center featured list does not include billing; Architecture still does (Architecture featured list, not Security).

## Acceptance criteria

- Security help hub grid has no Billing and plans card.
- No Security Learn more / search hit sends the operator to Architecture-only billing settings as the page job.
- Architecture billing help unchanged.

## Constraints

- Do not implement a new billing product. Do not imply CPA/attestation.
- Stage catalog/exclusion + tests. Article rewrite only if bookmarks stay live.
