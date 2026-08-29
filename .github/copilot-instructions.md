# GitHub Copilot instructions for ArchLucid

> **Audience:** GitHub Copilot for PR reviews, chat, and code completion.
>
> **Last reviewed:** 2026-08-29

## Product context

**ArchLucid** is an Azure-native architecture-governance platform. The product is mid-rename from **ArchiForge → ArchLucid**; do **not** flag legacy literals that are explicitly allowed in `docs/library/V1_DEFERRED.md` §3, `docs/BREAKING_CHANGES.md`, or `.gitleaks.toml`.

Read these first when you need deeper context:

1. `docs/START_HERE.md`
2. `docs/library/SYSTEM_MAP.md`
3. `docs/library/ARCHITECTURE_COMPONENTS.md`
4. `docs/library/API_CONTRACTS.md`
5. `docs/library/V1_DEFERRED.md`

## Review priorities

Review in this order:

1. Security regressions
2. Architectural drift
3. Operational risk and missing runbook updates
4. Missing tests for new branches, errors, or public APIs
5. Style

Use **critique mode**: lead with concrete weaknesses, skip generic praise.

## Security non-negotiables

Block changes that:

- Expose SMB / port `445` publicly
- Leave Azure Storage public instead of using private endpoints
- Add local users, checked-in secrets, or auth that bypasses Entra ID
- Grant overly broad IAM (`Owner`, `Contributor`, wildcard actions, `--allow-all`) without explicit justification
- Add HTTP-only endpoints or TLS lower than 1.2
- Log, emit, or return secrets
- Introduce credential-shaped literals without an intentional test-safe placeholder or documented gitleaks allowlist entry

## Architecture guardrails

- Keep business logic out of controllers
- Keep SQL / Dapper access inside `ArchLucid.Persistence*`
- Route run-lifecycle changes through `AuthorityRunOrchestrator` and pipeline stages
- Reuse existing seams before adding new helpers or managers
- Represent infrastructure in Terraform under `infra/terraform-*`
- Do not introduce new `archiforge` literals in `infra/**/*.tf`
- Put schema changes in `ArchLucid.sql` plus a new numbered migration
- Never edit historical migrations `001` through `028`
- Do not restore silent `ArchiForge*` config fallbacks; warnings for legacy presence are acceptable

## C# / test conventions

- One class per file unless a tiny private record is naturally co-located
- Prefer concrete types over `var`, except for anonymous or unspeakable LINQ projection types
- Guard public method boundaries against nulls
- Prefer concise guard clauses and braceless single-statement control flow when readable
- Leave a blank line before `if` / `foreach` unless it is the first statement in the method
- Prefer Dapper over heavier ORM patterns unless the PR clearly justifies otherwise
- Do **not** use `ConfigureAwait(false)` in tests
- Target near-100% line and branch coverage for new behavior
- Add comments only when the code would be non-obvious to an experienced developer

## Docs and PR descriptions

For non-trivial changes, expect the PR description to cover **what**, **why**, and **security / scalability / reliability / cost** impact. Ops-relevant changes should update `docs/` and the appropriate `docs/runbooks/` entry.

## When uncertain

Do not invent behavior, APIs, or Azure features. Ask for clarification or point reviewers to the canonical docs above.
