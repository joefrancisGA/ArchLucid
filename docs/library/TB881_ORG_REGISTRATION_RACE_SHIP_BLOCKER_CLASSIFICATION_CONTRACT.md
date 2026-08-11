> **Scope:** Engineering source of truth — TB-881 org-registration race ship-blocker classification (**TB-1371**). Not a buyer assurance attestation.

# TB-881 org-registration race — ship-blocker classification (TB-1371)

> **Audience:** Contributors, release/readiness reviewers, and coding agents classifying RC12 registration findings.  
> **Buyer / PA handout:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#tb881-org-registration-race-ship-blocker-m-250) (GTM **M-249** / **M-250**).  
> **Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (TB-881 ship-blocker class row).  
> **Closed engineering work:** [`TECH_BACKLOG.md`](TECH_BACKLOG.md) (`## TB-881`).

---

## Decision in one line

Done **TB-881** is a **CI/test isolation** defect (parallel xUnit + process-wide SQL catalog env pins), **not** a V1 controlled-pilot ship gate. Founder-led pilots use sequential single-catalog org provision. Residual concurrent same-name TOCTOU under multi-tenant self-serve signup is **signup-stress only** — do not reopen Done **TB-881** for pilots.

---

## Classification table

| Class | What it is | Blocks pilots? | Status / owner |
| --- | --- | --- | --- |
| **CI / test** (Done **TB-881**) | Parallel xUnit collections + `IntegrationTestSqlCatalogEnvironment` process-env pins caused a second `/v1/register` to hit a different ephemeral catalog than the duplicate lookup | **No** | **Done** 2026-07-21 |
| **Pilot path** | Guided / founder-led sequential org provision on one catalog | **No** (not the TB-881 race class) | GTM pilot readiness — sequential provision |
| **Signup stress** (residual) | Concurrent same-name TOCTOU under multi-tenant self-serve signup | **Not a V1 pilot gate** | App-level name check; `UQ_Tenants_Slug` exists; no unique Name index — out of scope for **TB-881** reopen |

---

## Engineering enforcement (Done TB-881)

| Guard | Path |
| --- | --- |
| Disable parallel test collections | `ArchLucid.Api.Tests/xunit.runner.json` — `parallelizeTestCollections: false`, `maxParallelThreads: 1` |
| Assembly belt-and-suspenders | `ArchLucid.Api.Tests/AssemblyAttributes.cs` — `[assembly: CollectionBehavior(DisableTestParallelization = true)]` |
| Regression tests | `ArchLucid.Api.Tests/RegistrationDuplicateOrganizationRegressionTests.cs` |
| Integration duplicate path | `RegistrationControllerTests.Register_creates_tenant_then_returns_conflict_for_same_organization` → **409 Conflict** |

---

## Reviewer checklist

1. Classify the concern: CI flakiness vs pilot registration vs concurrent self-serve signup.
2. Confirm OPEN inventories do **not** list TB-881 as an open RC12 pilot blocker.
3. Do **not** reopen Done **TB-881** “for pilots.”
4. Treat “org registration broken in production” backed **only** by the RC12 parallel-test race as a review finding.

---

## Claim boundary (do not promise)

| Do not say | Say instead |
| --- | --- |
| TB-881 blocks pilots / is an open V1 ship gate | TB-881 = CI/test isolation (**Done**) |
| RC12 parallel-test env-pin race = production pilot registration failure | Pilots = sequential single-catalog provision |
| Reopen Done **TB-881** for V1 | Residual same-name TOCTOU = signup-stress class only |

---

## Out of scope

- Unique tenant **Name** index / distributed signup locks (separate signup-stress hardening if pursued).
- Reopening Done **TB-881** engineering closure.
- CPA SOC 2 or third-party pen-test publication claims.

---

## Related backlog / GTM

| ID | Role |
| --- | --- |
| **TB-881** | Closed CI/test isolation fix |
| **TB-1371** | This classification contract |
| **TB-1372** | Anti–“TB-881 blocks pilots” honesty CI + OPEN hygiene |
| **M-249** / **M-250** | GTM classification / procurement handout |
