> **Scope:** Product-design and UX-architecture assessment — whether implementation details (platform mechanics, operational telemetry, engineering vocabulary) are leaking into the operator experience and distorting the product narrative. Audience: product, engineering, and GTM contributors; not buyer-facing.
> **Reviewed:** 2026-07-22
>
> **Assessment date:** 2026-06-15  
> **Related:** [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) (TB-337–344; former onboarding narrative assessment) (Azure-first onboarding drift); [`UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md) (visual standard); [`archlucid-ui/AGENTS.md`](../../archlucid-ui/AGENTS.md) (canonical product language)

# UX audit — implementation leakage into the product experience

## Executive summary

ArchLucid is **two products wearing one skin**.

There is a **buyer-polished / demo persona** that is genuinely clean: it hides the AI-budget pill, runs a vocabulary pass that rewrites `run → review`, `manifest → signed package`, `commit → finalize`, and renames "Start a review." And there is the **real authenticated operator shell** — what an actual paying Enterprise Architect logs into — which still exposes engineering chrome and raw vocabulary, because the cleanup is gated behind demo/CTO flags rather than being the default.

The single most important finding is therefore not the AI-budget pill itself. It is **the polish is conditional on selling, not on using.** The product looks most enterprise-grade exactly when a prospect is watching, and most like an internal engineering console once they've signed and logged in. That is backwards for broad enterprise adoption.

Concretely:

- The header pill `AI budget: 100% left` is shown to every user at `ExecuteAuthority` or above (not just admins), reads from an **admin** endpoint, and has **no glossary entry** explaining it.
- Navigation and tooltips leak platform internals: *Service Bus posture*, *RAG health — per-corpus index freshness and embedding dimension*, *Fleet LLM COGS*, *Integration DLQ*, *Key Vault reference*, *execution pipeline is initializing*.
- Onboarding is **Azure-first by construction**: the intake wizard's evidence step is literally "Azure extractor ZIP" / "Ingest Azure context — Packager command," and `cloudProvider` defaults to `"Azure"`.

**Maturity verdict: B with a thin coat of A.** The visual system (Carbon-based tokens, `StatusTag`, `EnterpriseTable`) is genuinely polished-A. The *information architecture and language* are B — a platform exposing its own implementation. The good news: the team already built the machinery to fix this (vocabulary pass, buyer-polished shell, terminology guard tests). It is wired to the wrong default.

---

## Product narrative analysis

### The story the UI tells today

To a first-time architect in the real shell, the implied narrative is:

> "ArchLucid is an AI-powered pipeline platform. You ingest Azure context, it runs analysis runs that produce manifests you commit, and you monitor its budget, connectors, queues, and index health so it keeps running."

The nav groups read as an operations console: `Review work`, `Analysis`, `Governance`, `Admin tools` — with `Admin tools` containing *Fleet LLM COGS*, *RAG health*, *Integration DLQ*, *Trial funnel*, *Tenant cost*, *Cost reporting*. The header advertises remaining AI budget. The intake flow asks for an "extractor ZIP" and a "Packager command."

The user learns **how ArchLucid is built** before they learn **what it does for them**.

### The story it should tell

> "ArchLucid is where your organization reviews architecture, captures the decisions and evidence behind them, and produces signed, auditable governance outcomes leadership can trust."

The narrative spine should be **Review → Evidence → Decision → Governance outcome → Audit trail** — nouns that already exist in canonical vocabulary (`review package`, `finding`, `evidence trail`, `signed decision record`, `governance approval`, `audit trail`). The platform mechanics that *deliver* that outcome (budgets, queues, RAG indexes, Service Bus) are how, not what, and belong off the primary path.

---

## User goals vs. what the UI emphasizes

| User | Primary goal | Does the UI lead with it? |
| --- | --- | --- |
| **Enterprise Architect** | Get an architecture reviewed; understand risks and recommendations | Partly — but the entry action is labeled **"Evidence intake,"** which describes the *mechanism* (ingestion) not the *goal* (start a review). |
| **Principal Engineer** | Trace decisions and evidence; compare options | Yes for `Compare` / `Evidence trail`, but tooltips leak "re-validate stored pipeline output." |
| **Security Architect** | Policy conformance, residual risk, exceptions | Strong — `Policy packs`, `Risk register`, `Risk exceptions`, `Governance resolution` are well-named. |
| **Governance Reviewer** | Approvals, decision register, audit | Strong — this is the best-modeled persona. |
| **CIO / CTO / Exec** | "Is our architecture sound? What's the ROI / risk?" | Mixed — `Portfolio overview`, `Value report`, `ROI report` are good; but execs should never see `AI budget`, `Fleet LLM COGS`, `RAG health`. |

The UI emphasizes **platform mechanics** for the two most senior personas and **outcomes** for the governance personas. The leakage is concentrated exactly where it does the most positioning damage: the daily-driver architect entry point and anything an executive might glance at.

---

## Implementation leakage inventory (ranked)

### Severe — likely to confuse users or distort product positioning

#### 1. `AI budget: X% left` in the primary header

`LlmBudgetStatusPill` renders `AI budget: {n}% left` / `— paused`, shown to all `ExecuteAuthority`+ users, sourced from `/v1/admin/llm-monthly-dollar-budget-status`, with no in-product glossary definition.

**Code anchor:** `archlucid-ui/src/components/llm/LlmBudgetStatusPill.tsx` — `buildPillLabel()`.

**Why severe:** a first-time architect reads this as "is the product running out of AI / will I be cut off?" It teaches a cost-control concept before any value concept.

#### 2. Polish is gated on demo/selling, not on using

The pill and vocabulary cleanup only apply in buyer-polished / CTO-demo mode. In the real shell, `showDevOperatorChrome = !buyerPolished` *shows* dev chrome (`OperatorShellTopBar.tsx`). The run→review / manifest→signed-package rewriting is off unless `isCtoDemoVocabularyPassEnv()` is active (`buyer-demo-vocabulary.ts`).

**Why severe:** prospects see the clean product; customers see the engineering console. This is the root cause behind most other items.

#### 3. Azure-first onboarding baked into the core flow

The intake wizard's evidence step is implementation-shaped, and the cloud provider defaults to Azure:

- `NewRunWizardClient.tsx`: steps "Evidence (optional) — Azure extractor ZIP or demo data" and "Ingest Azure context — Packager command (optional)."
- `QuickReviewWizard.tsx`: `cloudProvider: "Azure"` default; placeholder presumes Azure App Service / Azure SQL.

**Why severe:** it tells every prospect "this is an Azure tool," narrowing the addressable market and implying you must run a "packager command" to get value. "Extractor ZIP" and "Packager command" are pure implementation.

#### 4. `Service Bus` / Azure infrastructure surfaced in operator-facing copy

`SERVICE_BUS_HEALTH_LABELS` in `i18n.ts`: "Azure Service Bus messaging is degraded" with body referencing "Review worker logs" and "azure_service_bus readiness check."

**Why severe:** an SRE message shown to architects. It distorts the product into infrastructure they must babysit.

### Moderate — adds noise or cognitive load

#### 5. "Evidence intake" as the label for "start a review"

The primary creation action is named after the ingestion mechanism, with the tooltip "Evidence intake — start a new architecture review." Better labels already exist: `OPERATOR_START_REVIEW_QUICK_ACTION_LABEL = "Start review"` and `BUYER_NEW_REVIEW_NAV_LABEL = "New review"` (`operator-nav-labels.ts`). The mechanism word is the default; the outcome word is the exception.

#### 6. Pipeline / manifest / commit vocabulary in status and tooltips

`PIPELINE_STATUS_LABELS` → "In pipeline," "Ready to seal," "In flight"; tooltips "the execution pipeline is initializing," "re-validate stored pipeline output." `DOMAIN_TERMS` exposes "Golden Manifest," "Decision Trace." These are engineering lifecycle terms; users think in "Reviewing," "Ready to finalize," "Finalized."

#### 7. Operational telemetry in primary `Analysis` nav

`System health — API liveness, readiness, and critical dependencies`, `Connector operations — readiness, smoke signals, and Service Bus posture` sit in the same group an architect uses for `Compare` / `Ask`. "Smoke signals," "liveness/readiness" are SRE concepts.

#### 8. `Admin tools` is an engineering cost/ops dashboard

`Fleet LLM COGS`, `RAG health — per-corpus index freshness and embedding dimension`, `Integration DLQ`, `Tenant cost`, `Cost reporting — estimated LLM token usage`, `Trial funnel — … first-review COGS`. Several of these are *vendor/business* metrics (COGS, trial funnel) that arguably should not ship to customer tenants at all, let alone read as architecture-platform features.

#### 9. `Cloud connections — Tier 2 continuous ingestion`

Exposes internal tiering model and "ingestion" as the user's mental model for connecting a system.

### Minor — technically unnecessary but relatively harmless

#### 10. `Key Vault reference for incoming webhook fan-out` (Teams notifications tooltip)

Accurate, but "fan-out" and "Key Vault reference" are implementation detail in a feature tooltip.

#### 11. `Replay a review — re-validate stored pipeline output`

"Replay" + "pipeline output" leak the mechanism.

#### 12. `RAG health`, `Integration DLQ` as bare acronyms

Even for admins, prefer "Knowledge index health," "Failed integration messages."

#### 13. Internal IDs surfaced (`Review ID` / `runId` bridging)

Already handled thoughtfully via the vocabulary guard; low risk.

---

## AI budget assessment

### Current behavior

- Pill labeled `AI budget: X% left`, tone-colored (ready / needs-attention / blocked).
- Gated to `callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority`.
- Hidden in buyer-polished mode.
- Links to `/settings/cost-reporting` ("Manage budget").
- Data from `/v1/admin/llm-monthly-dollar-budget-status`.
- No glossary entry defines "AI budget."

### Questions and recommendations

| Question | Recommendation |
| --- | --- |
| Does it belong in the primary header? | **No.** The header is prime real estate for identity, search, and outcomes. A consumption meter is the least outcome-oriented thing you could put there. |
| Does it belong elsewhere? | **Yes** — in cost/usage settings (`/settings/cost-reporting`) and surfaced *contextually* only when it matters: a non-blocking inline notice at the moment of starting a review if the tenant is genuinely near a hard cap. |
| Should most users see it? | **No.** A read/execute architect cannot act on a tenant budget; showing it only creates anxiety. |
| Should only administrators see it? | **Mostly yes** — it reads an admin endpoint and represents a tenant-level spend control. Scope to `AdminAuthority` (billing/owner), not `ExecuteAuthority`. Exception: a *just-in-time, action-relevant* warning when an action will be blocked. |
| Better presentation model? | See below. |

### Better presentation model

1. **Default:** nothing in the header.
2. **Admins:** a "Usage & limits" card under cost settings, where "AI budget" is fine because the context explains it.
3. **Everyone, only when blocked/near-blocked:** a one-line inline banner on the Start-review screen, phrased as an outcome, e.g. *"New reviews are paused for this workspace until next month's allowance — ask your ArchLucid administrator."* Lean on `LlmBudgetApproachingLimitBanner` / `LlmMonthlyBudgetExceededBanner` instead of the persistent pill.
4. If any always-on indicator remains for admins, **rename** it. "AI budget" sounds like the product is rationing intelligence. "Monthly analysis allowance" or "Usage this month" is clearer and less alarming.

---

## First-time enterprise architect experience

### What they would correctly understand

This is for architecture **reviews**, **findings/risk**, **governance approvals**, and **audit** — those nouns are well-modeled and well-named.

### What they would likely misunderstand or stumble on

- **"AI budget: 100% left"** → "Is this metered? Will it stop working? Is this my quota?" Anxiety before value.
- **"Evidence intake"** → "Where do I just… start a review?" The outcome verb is buried.
- **"Azure extractor ZIP" / "Packager command"** → "Do I need to run a CLI and be on Azure to use this?" Many will assume yes, and bounce if they're AWS/GCP/on-prem.
- **"In pipeline," "Ready to seal," "manifest," "commit"** → maps to CI/CD mental models, not architecture governance.
- **"System health / Connector operations / RAG health"** in the nav → "Am I responsible for operating this platform?"

### Net conclusion

*"This is a powerful but engineering-heavy, Azure-centric AI pipeline I'll have to operate,"* rather than *"This is where my organization governs architecture decisions."*

---

## Product maturity review

**Answer: B — a polished platform that still exposes internal implementation concerns — with a genuine A-grade visual layer on top.**

### A-grade evidence

- Carbon design tokens, `StatusTag` / `SeverityTag`, `EnterpriseTable`, compact enterprise spacing.
- Explicit `UI-Enterprise-Design-Standard` rule.
- `review-terminology-guard` test enforcing "review package" language on buyer surfaces.

### B-grade reality

- The discipline is applied to *demo/buyer-polished* surfaces, while the default authenticated shell ships budget pills, Azure/Service Bus messaging, COGS/DLQ/RAG admin tooling, and pipeline/manifest vocabulary.
- The product is implementation-aware, not implementation-hidden, by default.

The gap between A and B is almost entirely **defaults and scoping**, not missing capability.

---

## Recommended corrections (ranked by impact)

1. **Flip the default to polished.** Make buyer-polished vocabulary + chrome-hiding the **default authenticated experience**; make "show dev chrome / engineering vocabulary" an opt-in for internal/admin debugging.
2. **Remove the AI-budget pill from the header**; rescope to admins + just-in-time banners; rename to "analysis allowance / usage."
3. **Rename the creation action to the outcome:** make "Start review" / "New review" the default nav label for `/reviews/new`, not "Evidence intake."
4. **De-Azure the intake flow.** Make cloud provider a neutral, non-defaulted choice; replace "Azure extractor ZIP" / "Ingest Azure context / Packager command" with provider-agnostic "Add your architecture (upload, describe, or connect a source)."
5. **Rewrite ops/infra copy as outcomes.** "Azure Service Bus messaging is degraded / review worker logs / azure_service_bus readiness check" → "Some background processing is delayed; results may take longer than usual." Hide the dependency name behind a disclosure for admins.
6. **Move operational telemetry out of architect nav.** `System health`, `Connector operations`, `RAG health`, `Integration DLQ`, `Fleet LLM COGS`, `Cost reporting` belong in an **admin/operations** area only, never in `Analysis`. Reconsider whether vendor metrics (COGS, trial funnel) ship to customer tenants at all.
7. **Normalize lifecycle vocabulary** product-wide: pipeline→review/analysis, manifest→signed package/record, commit→finalize, "Ready to seal"→"Ready to finalize." Extend `review-terminology-guard` to cover the *default* shell, not just buyer-surface files.
8. **Demote acronyms/mechanism words** in remaining admin tooltips (RAG, DLQ, fan-out, Key Vault, smoke signals).

---

## V1 corrections (before broader customer exposure)

Must-fix subset for broad enterprise adoption:

| # | Correction |
| --- | --- |
| 1 | Flip polished-by-default (or, minimum, force buyer-polished for all non-internal tenants). |
| 2 | AI-budget pill out of the header; admin-scoped + JIT banner. |
| 3 | "Start review" as the default creation label. |
| 4 | Remove Azure assumptions from the intake wizard defaults/placeholders/step names. |
| 5 | Rewrite the Service Bus/infra degradation banner as a user-facing outcome. |
| 7 (partial) | Replace the most visible engineering words on default surfaces: "In pipeline," "Ready to seal," "manifest," "commit." |

Everything else (admin nav reorganization, acronym cleanup, vendor-metric scoping) can follow V1 but should be tracked.

---

## Final verdict

### Keep visible (user outcomes or legitimately actionable)

- Review lifecycle status in *user* language: Draft → In review → Ready to finalize → Finalized.
- Findings / risk register / residual risk / risk exceptions.
- Governance: approvals, decision register, policy packs, governance resolution.
- Evidence trail, audit trail, signed decision records, value/ROI reports.
- For **admins only**, in a clearly operational area: usage/allowance, integration status, knowledge-index status, identity/SSO, billing.

### Make disappear from the default experience

- "AI budget" pill in the header for non-admins; the word "budget" as a persistent header concept.
- Azure-as-default: "extractor ZIP," "Packager command," `cloudProvider: "Azure"`, Azure-shaped placeholders.
- Infrastructure names in user copy: "Service Bus," "worker logs," "Key Vault," "readiness/liveness check," "DLQ," "fan-out," "RAG/embedding dimension."
- Engineering lifecycle vocabulary: "pipeline," "manifest," "commit," "seal," "in flight," "smoke signals."
- Vendor/business telemetry in customer tenants: "Fleet LLM COGS," "trial funnel," "first-review COGS."

### Candid bottom line

This is not primarily a design problem; it is a **defaults and disclosure** problem. The team already built the mechanisms to tell the right story (vocabulary pass, buyer-polished shell, terminology guards) — but wired them to fire only when selling. Make the polished, outcome-first experience the **default for everyone who logs in**, push platform mechanics behind an admin/operations boundary, and ArchLucid reads as a serious architecture-governance platform rather than an Azure AI pipeline console with a nice theme.

---

## Code anchors (evidence)

| Surface | Path |
| --- | --- |
| Header AI-budget pill (dev chrome gate) | `archlucid-ui/src/components/shell/OperatorShellTopBar.tsx` |
| AI-budget pill label + authority gate | `archlucid-ui/src/components/llm/LlmBudgetStatusPill.tsx` |
| Buyer vocabulary pass (demo-gated) | `archlucid-ui/src/lib/vocabulary/buyer-demo-vocabulary.ts` |
| Nav labels / Service Bus banner copy | `archlucid-ui/src/lib/i18n.ts` |
| Pilot nav — "Evidence intake" | `archlucid-ui/src/lib/pilot-nav-group-builder.ts` |
| Start-review label overrides | `archlucid-ui/src/lib/operator/operator-nav-labels.ts` |
| Admin ops nav (COGS, RAG, DLQ) | `archlucid-ui/src/lib/operator/operator-admin-nav-group-builder.ts` |
| Analysis nav (system health, connectors) | `archlucid-ui/src/lib/operate-analysis-nav-group-builder.ts` |
| Terminology guard tests | `archlucid-ui/src/lib/review-terminology-guard.test.ts` |
| Intake wizard Azure steps | `archlucid-ui/src/app/(operator)/reviews/new/NewRunWizardClient.tsx` |
| Quick review Azure default | `archlucid-ui/src/app/(operator)/reviews/new/QuickReviewWizard.tsx` |
