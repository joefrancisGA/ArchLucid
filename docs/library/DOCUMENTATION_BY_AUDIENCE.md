> **Scope:** Canonical guide for **routing documentation by audience** (customer / evaluator vs contributor / internal) — merges TB-013 role hints with a folder compass; not a duplicate of onboarding narrative in [`START_HERE_DEPTH.md`](START_HERE_DEPTH.md).

# Documentation by audience

## Two planes (reduce browse noise)

ArchLucid docs intentionally separate:

| Plane | Typical reader | Goal |
| --- | --- | --- |
| **Customer / evaluator** | Buyers, pilots, sponsors, procurement — often **without cloning** | Time-to-value, trust, pilot steps, compliance posture |
| **Contributor / internal** | Engineers, tenant admins, SRE — **with repo + toolchain** | Build, CI, runbooks, infra, migrations |

**Rule of thumb:** hosted-SaaS pilots use the product UI and Trust Center paths; engineers live under `engineering/`, `runbooks/`, and `library/` references. If a change touches HTTP JSON or operator-visible behavior, refresh **customer-facing** summaries only when behavior is customer-visible; otherwise prefer **operator** or **contributor** libraries.

**Persona copy vs doc audience:** The **Operator / tenant admin** row names a legitimate **internal** documentation reader (runbooks, diagnostics, tenancy ops). When writing **customer-visible** UI strings, help, or GTM, do **not** default to "operator" voice — use persona terms from [`CONCEPT_VOCABULARY.md#persona-terms`](CONCEPT_VOCABULARY.md#persona-terms) (**Architect**, **Sponsor**, **Admin**, **Reviewer**, **Approver**, **Governance lead**, **Sponsor**). Reserve **Operator** for internal-only surfaces and contributor docs unless you are explicitly documenting diagnostics or the `(operator)` implementation shell.

## Quick route by role (TB-013)

Use this table when you need a **starting doc**, not a folder tour:

| Audience | Intent | Start here |
| --- | --- | --- |
| **Buyer / pilot / sponsor** | Time-to-value, trust, procurement | [`docs/START_HERE.md`](../START_HERE.md), [`docs/CORE_PILOT.md`](../CORE_PILOT.md), [`docs/go-to-market/trust-center.md`](../go-to-market/trust-center.md) |
| **Operator / tenant admin** | Day-2 configuration, runbooks, **internal** shell/diagnostics docs — **not** customer-facing UI voice | [`docs/library/customer-facing/OPERATOR_QUICKSTART.md`](customer-facing/OPERATOR_QUICKSTART.md), [`docs/library/API_CONTRACTS.md`](API_CONTRACTS.md), [`docs/OPERATIONS_ADMIN.md`](OPERATIONS_ADMIN.md)) |
| **Contributor / platform engineer** | Repo layout, invariants, CI, migrations | [`.cursor/rules/Architecture-Invariants.mdc`](ARCHITECTURE_INVARIANTS.md), [`docs/library/TECH_BACKLOG.md`](TECH_BACKLOG.md), [`docs/library/CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md) |

When in doubt on **new** markdown, add a one-line **`Audience:`** note next to the scope header (see `.cursor/rules/Doc-Scope-Header.mdc`); CI validates scope lines.

## Objective

Cut **browse noise** inside `docs/`: pilots and procurement should rarely land in **`runbooks/`** Terraform drill pages; engineers should rarely misread **`go-to-market/`** as their install spine.

## Assumptions

- Hosted-SaaS default: buyers use the site and tenant UI **without cloning** the repo; contributors clone and run Docker / .NET tooling.
- This page is **heuristic**. A few canonical docs deliberately serve **multiple** audiences (**`CORE_PILOT.md`**, **`ARCHITECTURE_ON_ONE_PAGE.md`**).

## Constraints

- **Historical** markdown under **`docs/archive/`** is intentionally **mixed** audience — treat as receipts, not current UX.
- **ADRs** under **`docs/architecture/adrs/`** are primarily **engineering** decision memory.
- Repo policy still caps stray files at **`docs/`** root; see [`START_HERE.md`](../START_HERE.md) rationale.

## Architecture overview

Two **documentation planes** coexist: **outward-facing product + trust narration** versus **engineering + tenancy operations for the vendor/org that ships ArchLucid.**

## Folder compass (defaults)

| Area | Predominant audience | Notes |
| --- | --- | --- |
| [`docs/go-to-market/trust-center.md`](../go-to-market/trust-center.md), [`docs/compliance/`](../compliance/), much of [`docs/go-to-market/`](../go-to-market/) | **Customers / procurement / sponsors** | Trust, pricing ideas, integrations catalog, objections; still useful reading for founders. |
| [`docs/runbooks/`](../runbooks/), [`docs/onboarding/day-one-sre.md`](../onboarding/day-one-sre.md), many [`docs/deployment/`](../deployment/) pages | **Vendor internal / reliability / infra** | Incident, failover, Stripe GA, infra setup. |
| [`docs/engineering/`](../engineering/) | **Contributors / platform engineers** | Install order, first commit loop, IaC ergonomics adjacent to BUILD. |
| [`docs/security/`](../security/) (long-form) | **Security reviewers + architects** mixed | VPAT/threat-model depth — skim [`trust-center.md`](../go-to-market/trust-center.md) first when buying. |
| [`docs/library/`](./) | **Mixed** — use this page and [`START_HERE.md`](../START_HERE.md) | Hundreds of refs: [`BUILD.md`](../engineering/BUILD.md), [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md), assessments, connectors. |

## Component breakdown — canonical hubs

### Customer-evaluator-operator (typically no toolchain)

1. **[`BUYER_FIRST_30_MINUTES.md`](../BUYER_FIRST_30_MINUTES.md)** — five evaluator steps without install (mirrors `/get-started` intent).
2. **[`EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md)** — sponsorship narrative + procurement-safe language.
3. **[`CORE_PILOT.md`](../CORE_PILOT.md)** — serious pilot in the architect workspace.

### Contributor-vendor-internal (toolchain + CI)

1. **`engineering/INSTALL_ORDER.md`** (see [`../engineering/INSTALL_ORDER.md`](../engineering/INSTALL_ORDER.md)) — Docker / .NET / Node order.
2. **[`../onboarding/day-one-developer.md`](../onboarding/day-one-developer.md)** + **[`CONTRIBUTOR_CODE_MAP.md`](CONTRIBUTOR_CODE_MAP.md)** ([#change-impact-checklist](CONTRIBUTOR_CODE_MAP.md#change-impact-checklist); `CHANGE_IMPACT_CHECKLIST.md` alias) — where to edit safely and what follow-through to check.
3. **[`BUILD.md`](../engineering/BUILD.md)**, **[`TEST_STRUCTURE.md`](TEST_STRUCTURE.md)** — local correctness loop.

Deep narrative for both columns together — **[`START_HERE_DEPTH.md`](START_HERE_DEPTH.md)**.

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

Default **depth-first** material belongs under **`docs/library/`** or a topic subtree, not `docs/` root — see `.cursor/rules/Docs-Root-Markdown-Budget.mdc`.

## Related

- [`docs/architecture/INFORMATION_ARCHITECTURE.md`](../architecture/INFORMATION_ARCHITECTURE.md) — five-category in-app and public-surface content taxonomy (`contentKind` on `/help` registry)
- [`CONCEPT_VOCABULARY.md#ui-glossary-v1`](CONCEPT_VOCABULARY.md#ui-glossary-v1) — persona terms for customer-visible copy
- [`docs/library/customer-facing/PILOT_GUIDE.md`](customer-facing/PILOT_GUIDE.md)
- [`docs/CONTRIBUTOR_ON_ONE_PAGE.md`](../CONTRIBUTOR_ON_ONE_PAGE.md)
