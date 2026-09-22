# OP-07 — Hold: second HTTP host (compile check only, after OP-01–06)

**Tech backlog:** **TB-2400** — [`docs/library/TECH_BACKLOG_TB2400_INDEX.md`](../../docs/library/TECH_BACKLOG_TB2400_INDEX.md). Pick up **TB-2400** when the owner directs that row; do not implement from this prompt unless the session explicitly names **TB-2400**.

**This prompt is a hold.** Implement **nothing** unless the owner’s message in **this same session** explicitly says to pick up **TB-2400** (or reopen a second composition root) **and** quotes that OP-01–06 are done (map, ratchet, signal, 403 gate, registrars, Worker inventory). Implied “we should split the API” is **not** a reopen.

## Goal

Keep Architecture and SecureNow as **two UI shells (and later, maybe two deploys of the same binary)** on **one** `ArchLucid.Api`.

Do **not**:

- Add `SecureNow.Api`, `ArchLucid.Host.Security`, or a second `Program.cs`
- Split SQL migrations or catalogs (that is **OP-08**, a separate reopen)
- Change INV-006 to allow DI in random projects
- Create long-lived git branches `architecture` vs `security`
- Fork finding engines, collectors, or coverage-shaped engines
- Add a second Next.js app
- Start SOC 2 CPA or third-party pen-test programs (**TB-135** / **TB-136** stay Done on tech)

If asked to “make SecureNow its own backend” before OP-01–06, answer with this hold **and** [`.cursor/prompts/option-preserving-api-00-index.md`](option-preserving-api-00-index.md). Point at PL-01 dual local start (one API, two websites) plus the OP sequence.

## Why

A second host that still references `ArchLucid.Application` + `ArchLucid.Persistence` + `AddArchLucidApplicationServices` is a clone, not an extract. The option is preserved by the module graph, not by a second Kestrel port. Two hosts on one catalog also double auth/health/OpenAPI while the SPOF (SQL + Worker) stays shared — worse isolation, more ops.

When (and only when) OP-01–06 are real, a second web project is allowed as a **compile check**: it must fail to reference Authority modules. That session must still keep one catalog (**OP-08**) unless the owner reopens that too.

## Context

- [`.cursor/prompts/product-line-05-one-api-hold.md`](product-line-05-one-api-hold.md) (PL-05 — UI-era hold; this file is the backend-era hold)
- `docs/architecture/OPTION_PRESERVING_API_SPLIT_COMPOSER_PROMPTS.md`
- `.cursor/rules/Tenant-Isolation-Defense-In-Depth.mdc`

## What to build

Nothing. If the owner explicitly reopens a second host in this session, **stop and confirm** before writing code:

1. Quote OP-01–06 completion (map coverage green, ratchet green, 403 gate exists, four registrars exist, Worker map exists).
2. Named branch.
3. The new project references **only** platform + infra-evidence + governance facades — compile must **fail** if it takes `AddAuthorityCapability` or `Application.Runs`.
4. Migration story is still **one DDL file per database** (OP-08 not reopened).
5. Who runs DbUp (exactly one migrator process).
6. Worker remains one process unless a **named** Worker split is also reopened.

Do not begin that work from this file alone.

## Acceptance criteria

- Session ends with no second-host / INV-006 / migration diff unless the owner’s explicit reopen is quoted in the summary.
- Dual-start remains one API.

## Constraints

- Do not collapse desktop review tabs as a consolation prize.
- Do not add GTM **M-90 / M-44 / M-91 / M-92**.
- Same-binary two Container Apps with `ProductLine:Deployment=security` is **not** this hold’s violation — that is configuration of the existing host (OP-03/OP-04). Do not implement that deploy in a hold session either unless the owner names it.
