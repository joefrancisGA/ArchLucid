# SH-23 — `/help/enterprise-onboarding`

Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

## Goal

Security enterprise-onboarding help is an Admin checklist for **SSO, roles, audit export, optional Azure connector** (hub Security summary already says this). Remove “first architecture review before procurement” as a required step and the CTA to `core-pilot` / `first-architecture-review`. Architecture keeps the eight-step checklist that ends in a first architecture review.

## Why

`enterprise-onboarding-help-copy.ts`: subtitle “cloud attachment, and the first architecture review”; hero “validate the first architecture review”; primary actions include “Your first architecture review” → `inAppHelpHref("core-pilot")`.

Hub Security override summary is job-matched; the page body is not.

## Context

- `archlucid-ui/src/lib/enterprise-onboarding-help-copy.ts`
- `archlucid-ui/src/lib/contextual-help/enterprise-onboarding-rows.ts`
- `archlucid-ui/src/lib/help/help-center-catalog-security.ts`
- Checklist markdown / hub steps (read live `/help/enterprise-onboarding` sections)

## What to build

1. Product-line-aware subtitle, hero, primary actions. Security validate step = Azure connection or extract-upload + pack assignment + a findings/lineage spot-check — not core-pilot.
2. Drawer on the help page and on SSO/IdP admin routes: Security next steps stay SSO/roles/Azure — not first architecture review.
3. Vitest both lines.

## Acceptance criteria

- Security onboarding help has no CTA to Architecture-only first-review guides.
- Architecture checklist still includes first architecture review.
- SSO wizard still maps to this article (slug can stay).

## Constraints

- Do not change SAML/OIDC protocol names.
- Stage enterprise-onboarding copy + tests.
