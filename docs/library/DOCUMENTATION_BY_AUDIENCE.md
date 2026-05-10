> **Scope:** Map of predominant **documentation audiences** (customer-evaluator-operator vs contributor-vendor-internal) — not a duplicate of onboarding narrative in [`START_HERE_DEPTH.md`](START_HERE_DEPTH.md) or the task rows in [`NAVIGATOR.md`](../NAVIGATOR.md).

# Documentation by audience

## Objective

Cut **browse noise** inside `docs/`: pilots and procurement should rarely land in **`runbooks/`** Terraform drill pages; engineers should rarely misread **`go-to-market/`** as their install spine.

## Assumptions

- Hosted-SaaS default: buyers use the site and tenant UI **without cloning** the repo; contributors clone and run Docker / .NET tooling.
- This page is **heuristic**. A few canonical docs deliberately serve **multiple** audiences (**`CORE_PILOT.md`**, **`ARCHITECTURE_ON_ONE_PAGE.md`**).

## Constraints

- **Historical** markdown under **`docs/archive/`** is intentionally **mixed** audience — treat as receipts, not current UX.
- **ADRs** under **`docs/adr/`** are primarily **engineering** decision memory.
- Repo policy still caps stray files at **`docs/`** root; see [`FIRST_5_DOCS.md`](../FIRST_5_DOCS.md) rationale.

## Architecture overview

Two **documentation planes** coexist: **outward-facing product + trust narration** versus **engineering + tenancy operations for the vendor/org that ships ArchLucid.**

## Folder compass (defaults)

| Area | Predominant audience | Notes |
| --- | --- | --- |
| [`docs/trust-center.md`](../trust-center.md), [`docs/compliance/`](../compliance/), much of [`docs/go-to-market/`](../go-to-market/) | **Customers / procurement / sponsors** | Trust, pricing ideas, integrations catalog, objections; still useful reading for founders. |
| [`docs/runbooks/`](../runbooks/), [`docs/onboarding/day-one-sre.md`](../onboarding/day-one-sre.md), many [`docs/deployment/`](../deployment/) pages | **Vendor internal / reliability / infra** | Incident, failover, Stripe GA, infra setup. |
| [`docs/engineering/`](../engineering/) | **Contributors / platform engineers** | Install order, first commit loop, IaC ergonomics adjacent to BUILD. |
| [`docs/security/`](../security/) (long-form) | **Security reviewers + architects** mixed | VPAT/threat-model depth — skim [`trust-center.md`](../trust-center.md) first when buying. |
| [`docs/library/`](./) | **Mixed** — default to [`NAVIGATOR.md`](../NAVIGATOR.md) rows | Hundreds of refs: [`BUILD.md`](BUILD.md), [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md), assessments, connectors. |

## Component breakdown — canonical hubs

### Customer-evaluator-operator (typically no toolchain)

1. **[`BUYER_FIRST_30_MINUTES.md`](../BUYER_FIRST_30_MINUTES.md)** — five evaluator steps without install (mirrors `/get-started` intent).
2. **[`EXECUTIVE_SPONSOR_BRIEF.md`](../EXECUTIVE_SPONSOR_BRIEF.md)** — sponsorship narrative + procurement-safe language.
3. **[`CORE_PILOT.md`](../CORE_PILOT.md)** — serious pilot in the operator UI.

### Contributor-vendor-internal (toolchain + CI)

1. **`engineering/INSTALL_ORDER.md`** (see [`../engineering/INSTALL_ORDER.md`](../engineering/INSTALL_ORDER.md)) — Docker / .NET / Node order.
2. **[`CONTRIBUTOR_QUICK_START.md`](CONTRIBUTOR_QUICK_START.md)** + **[`CONTRIBUTOR_CODE_MAP.md`](CONTRIBUTOR_CODE_MAP.md)** — where to edit safely.
3. **[`BUILD.md`](BUILD.md)**, **[`TEST_STRUCTURE.md`](TEST_STRUCTURE.md)** — local correctness loop.

Deep narrative for both columns together — **[`START_HERE_DEPTH.md`](START_HERE_DEPTH.md)**.

Task lookup with **explicit customer-vs-internal tables** — **[`NAVIGATOR.md`](../NAVIGATOR.md)**.

## Data flow (how audiences should traverse docs)

```
START_HERE → pick column (buyer vs contributor)
     │                    │
     v                    v
BUYER_FIRST_30_*    engineering/INSTALL_ORDER
EXECUTIVE_SPONSOR_*  CONTRIBUTOR_*
CORE_PILOT (shared*)  NAVIGATOR (engineering tasks branch)
trust-center.*       runbooks/deployment/security depth
---
* Operators on hosted SaaS use CORE_PILOT without cloning; contributors clone first.
```

## Security model

- **Customer-plane** narratives avoid asking for SMB (port **445**) or raw SQL shells; infra runbooks encode **least privilege** assumptions for **operators of the fleet**, not pilots.
- **Sensitive** rollout steps stay in **runbooks** + Key Vault narratives — reviewers should skim **trust center** policies before crawling **infra** prose.

## Operational considerations

When **adding markdown**, place it under the subtree that matches the **primary** reader (`go-to-market` vs `engineering` vs `runbooks`). If a doc truly serves equal audiences (rare), add a single-line **Audience:** note under the Scope block and link **both** entry hubs.
