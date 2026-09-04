# WA-06 — Authority rank names are not customer copy

**Do not fork LD-10** for Redis/Service Bus banners. This file is **internal rank identifiers** (`AdminAuthority`, `ExecuteAuthority`, `ReadAuthority`) still rendered on customer forbidden-state messages, settings, and help.

## Goal

Customer-visible UI uses role language already in the product (Administrator, can execute reviews, read-only) — never the enum token. Logs, OpenAPI, and tests may keep the identifier. Forbidden states stay honest about *what the user cannot do*, not the policy type name.

## Why

IA assessment: rank names leak into customer surfaces. A professional being denied export should not see `ExecuteAuthority`. That is eval/engineering residue. Casual internal tools leak type names; livelihood tools speak the job.

## Context

- Grep `AdminAuthority` / `ExecuteAuthority` under `archlucid-ui/src` excluding e2e helpers and `AUTHORITY_RANK` comparisons
- `archlucid-ui/src/lib/model-governance-band.test.ts` — already guards one surface (TB-1926); extend the pattern
- `ArchitectureDraftDeleteControl.tsx` — rank **comparison** may stay; visible string must not
- `auth-domains-page-copy.ts` — `authDomainsAdminAuthorityPresentation` is a function name; check rendered copy
- Help topics that mention the enum

## What to build

1. Inventory customer-visible strings matching `/AdminAuthority|ExecuteAuthority|ReadAuthority/`.
2. Replace with existing buyer-safe role copy. Reuse a single helper if one exists; do not invent a second rank glossary.
3. Vitest guard like TB-1926: named operator forbidden-state fixtures do not match the enum tokens.
4. Do not rename API policy names or OpenAPI `requiredAuthority` in nav config (those are engineer contracts).

## Acceptance criteria

- A non-admin Working user who hits a forbidden export/settings state does not see `*Authority` tokens.
- Nav `requiredAuthority: "ReadAuthority"` in config files may remain (not rendered).
- Guided/demo same copy (vocabulary is not density).

## Constraints

- Do not change API authorization.
- Do not weaken tenant isolation.
- Do not collapse review tabs.
