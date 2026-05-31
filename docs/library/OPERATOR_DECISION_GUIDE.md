> **Scope:** Customer-facing — ArchLucid Operator Decision Guide - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid Operator Decision Guide

**Audience:** pilot operators, architecture reviewers, governance operators, and customer teams who need to know which ArchLucid layer to use next without relying on founder-level interpretation.

**Status:** Practical V1 usage guidance. This document explains **when to stay on the Core Pilot path, when to expand into Operate (analysis workloads), and when Operate (governance and trust) are worth using**.

**Canonical buyer narrative:** [EXECUTIVE_SPONSOR_BRIEF.md](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md). **Measurement companion:** [PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md). This document is usage guidance, not a second buyer narrative and not a second ROI brief.

**Canonical maps:** [ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md) · [OPERATOR_ATLAS.md](OPERATOR_ATLAS.md)

**Related:** [CORE_PILOT.md](../CORE_PILOT.md) · [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) (§3 *Code seams*, *Four UI shaping surfaces*, *Contributor drift guard* — **UI shaping only**; keep **`nav-config`** → **`nav-shell-visibility`** (**tier → authority**) → **`LayerHeader`** / inline cues / mutation soft-disable and **API** `[Authorize]` policies aligned when a route moves between layers; Vitest **`archlucid-ui/src/lib/authority-seam-regression.test.ts`** locks tier-before-rank and Enterprise nav monotonicity; **`archlucid-ui/src/lib/authority-execute-floor-regression.test.ts`** locks **Execute** nav visibility **≡** mutation boolean; **`archlucid-ui/src/lib/authority-shaped-ui-regression.test.ts`** locks every catalog **`ExecuteAuthority`** link at Read vs Execute rank; **`archlucid-ui/src/app/(operator)/authority-shaped-layout-regression.test.tsx`** locks inspect-first Enterprise layout when mutation is off) · [PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md) · [operator-shell.md](operator-shell.md)

---

## 1. The default rule

Start with **Core Pilot** — it is the shortest path to one **architecture review package** (finalized manifest + artifacts).

Do **not** move into Operate (analysis workloads) or Operate (governance and trust) just because those features exist. Move only when a real question appears that the Core Pilot path does not answer well enough.

That keeps the product easier to operate, keeps the first-value story clearer, and makes pilot value easier to judge.

---

## 1a. Fast-path deployment presets (hosted vs self-hosted)

Use this table when you need a working configuration without reading the full [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md). Keys are illustrative — confirm values in that reference before production apply.

| Pattern | Auth mode | Storage topology | Execution mode | Retrieval provider |
| --- | --- | --- | --- | --- |
| **Hosted SaaS (standard)** | `JwtBearer` (Entra ID) | `SystemWithPerTenantCatalogs` | `real` (platform AOAI) | `AzureSearch` |
| **Self-hosted enterprise** | `JwtBearer` (OIDC or SAML) | `SystemWithPerTenantCatalogs` | `real` (BYO AOAI endpoint) | `AzureSearch` |
| **CI / developer local** | `DevBypass` | `SingleCatalog` | `simulator` | `InMemory` |

### Which pattern should I use?

1. **Production or hosted pilot?** → **Hosted SaaS (standard)** row.
2. **Your own Azure subscription with Entra/OIDC/SAML?** → **Self-hosted enterprise** row.
3. **Local compile/CI only?** → **CI / developer local** row (not tenant isolation for hosted workloads).

`SingleCatalog` is for local and CI convenience only — do not treat it as substitute for per-tenant catalog isolation on hosted SaaS ([`V1_SCOPE.md`](V1_SCOPE.md) §2.4).

Pilot onboarding spine: [`customer-facing/PILOT_GUIDE.md`](../customer-facing/PILOT_GUIDE.md).

---

## 2. Which layer should I use?

| Situation | Stay in Core Pilot | Move to Operate (analysis workloads) | Move to Operate (governance and trust) |
|---|---|---|---|
| You need a reviewable architecture package from a request | Yes | No | No |
| You need to compare two architecture outputs | No | Yes | No |
| You need to explain what changed between reviews | No | Yes | No |
| You need a provenance or architecture graph | No | Yes | No |
| You need approval workflow, policy control, or audit evidence | No | No | Yes |
| You need alert routing, governance dashboard, or audit log export | No | No | Yes |
| You are still proving basic pilot value | Yes | Only if needed | Usually no |
| A sponsor is asking whether the product saved time or reduced manual effort | Yes | Optional | Optional |

---

## 3. Core Pilot — use this unless you have a reason not to

Use **Core Pilot** when the question is:

> Can we go from architecture request to committed manifest and reviewable artifacts faster, with less manual assembly and better evidence?

### Use Core Pilot when you need to:

- create a review,
- execute a review,
- commit a manifest,
- review artifacts,
- export a package,
- judge whether the first pilot created value.

### Ignore these for now unless you need them:

- Compare
- Replay
- Graph
- Ask
- Advisory
- Pilot feedback
- Governance dashboard
- Policy packs
- Audit log
- Alert routing and tuning

If you are still trying to prove the first pilot, staying in Core Pilot is usually the right choice.

The **Home** checklist, optional **navigation preset** (`operator-nav-preset`; UI-only reordering via the sidebar preset dialog), **onboarding** entry text, and **sidebar defaults** are biased the same way: Operate (analysis workloads) and Operate (governance and trust) appear for discovery but are labeled **not first-pilot requirements** so time-to-value does not drift.

---

## 4. Operate (analysis workloads) — use this when the next question is analytical

Use **Operate (analysis workloads)** when the question is:

> What changed, why did it change, or what does the architecture/provenance picture look like in more detail?

### Move to Operate (analysis workloads) when you need to:

- compare two reviews,
- replay a review or comparison,
- inspect provenance or architecture graph views,
- ask follow-up questions against architecture context,
- collect richer product-learning signals.

### Do not move here just because it looks interesting

Operate (analysis workloads) is useful when there is a real architectural investigation, debugging, or architecture-learning question.

If your real goal is still simply to prove that ArchLucid speeds up architecture packaging and review, you can usually ignore this layer for the first pass.

---

## 5. Operate (governance and trust) — use this when the next question is governance or trust

Use **Operate (governance and trust)** when the question is:

> How do we govern, audit, approve, monitor, and operationalize architecture decisions at scale?

### Move to Operate (governance and trust) when you need to:

- require approvals,
- enforce policy packs,
- use a pre-commit governance gate,
- export audit events,
- review compliance drift,
- configure alert rules, routing, or simulation,
- support governance, audit, or security stakeholders directly.

### Do not move here too early

Operate (governance and trust) are valuable, but they are not required to prove the first Core Pilot result.

If you have not yet shown that ArchLucid improves speed, packaging effort, or evidence quality, start there first.

The operator shell adds **short in-product lines** on Enterprise entry points (nav, governance dashboard, alerts, audit, and operator-heavy alert tooling) so “optional vs Core Pilot” stays visible without replacing this document. **LayerHeader** carries the layer question; page leads stay to one or two sentences that order **inspect before configure** where both exist on the same route.

---

## 6. What to do next after a successful Core Pilot

Use this order unless you have a strong reason to change it:

1. **Core Pilot** — prove the product can produce a reviewable package and save effort.
2. **Operate (analysis workloads)** — answer change, replay, or graph questions if they become relevant.
3. **Operate (governance and trust)** — add governance, audit, and compliance features when the organization is ready to operationalize the workflow.

This is the safest path for most pilots.

Do not treat this as a feature-tour sequence. Stay in **Core Pilot** until a real analytical or governance question justifies leaving it.

---

## 7. Fast decision rules

### Stay in Core Pilot if:

- the pilot is still proving basic value,
- the team mainly needs a reviewable output,
- the sponsor mainly cares about speed, evidence, and reduced manual effort.

### Use Operate (analysis workloads) if:

- reviewers are asking what changed,
- architecture teams need replay or graph visibility,
- you are comparing alternatives or tracking evolution.

### Use Operate (governance and trust) if:

- governance teams are now involved,
- audit evidence matters,
- approvals or policy enforcement are becoming part of the real workflow,
- security or compliance stakeholders need product-level support.

---

## 8. What still requires judgment

This guide reduces ambiguity, but it does not remove all judgment.

You still need to decide:

- which use case is the best pilot candidate,
- when a sponsor question is important enough to justify moving beyond Core Pilot,
- and when governance depth is truly needed versus merely interesting.

The goal is not to eliminate judgment. The goal is to make the default path obvious enough that expert interpretation is no longer required for routine decisions.
