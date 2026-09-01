# GitHub Copilot instructions for ArchLucid

> This file is auto-loaded for Copilot reviews and chat. Keep it short; link out for detail.
>
> Last reviewed: 2026-08-31

## Product context

ArchLucid is an Azure-native architecture-governance platform. The product is mid-rename from **ArchiForge → ArchLucid**; do not flag approved legacy literals documented in `docs/library/V1_DEFERRED.md` §3 and `docs/BREAKING_CHANGES.md`.

Start here when you need more context:

1. `docs/START_HERE.md`
2. `docs/engineering/AGENTS.md`
3. `archlucid-ui/AGENTS.md`
4. `docs/library/API_CONTRACTS.md`

## Review priorities

1. Security regressions
2. Architectural drift
3. Operational risk
4. Missing tests for new behavior
5. Style nits only after the above

Use critique mode: weaknesses first, no generic praise.

## Security non-negotiables

Block changes that:

- expose SMB / port 445 publicly
- allow public storage access instead of private endpoints
- add local users, checked-in secrets, or auth that bypasses Entra ID
- grant broad wildcard IAM or allow-all access without explicit justification
- add HTTP-only or TLS < 1.2 endpoints
- log, return, or otherwise leak secrets

Also avoid Stripe-shaped `sk_test_` / `sk_live_` literals in tests or samples.

## Architecture rules

- Keep business logic out of controllers.
- Keep SQL / Dapper access in persistence seams.
- Reuse existing seams before introducing new helpers or managers.
- Infrastructure changes must be representable in `infra/terraform-*`.
- New SQL DDL belongs in the master `ArchLucid.sql` plus a new migration; do not edit historical migrations `001`-`028`.
- Do not reintroduce silent `ArchiForge*` config fallbacks or new `ArchiForge` literals in `.cs`, `.ts`, `.tsx`, or greenfield Terraform.

## C# / test conventions

- One class per file unless a tiny private type is tightly co-located.
- Prefer concrete types over `var` except for obvious anonymous or unspeakable types.
- Check nulls at public boundaries.
- Do not add `ConfigureAwait(false)` in tests.
- New public methods, branches, and error paths should have targeted tests.

## Docs and uncertainty

- Ops-relevant or architectural changes should update `docs/` and `docs/runbooks/` when applicable.
- If unsure whether an API, library, or Azure feature exists or behaves as assumed, say so instead of inventing.
