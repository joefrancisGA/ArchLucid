> **Scope:** Product-strategy and UX-architecture assessment — whether operator first-run onboarding has drifted from the multi-source **architecture review and governance platform** mission toward an **Azure assessment tool** narrative. Audience: product, engineering, and GTM contributors; not buyer-facing.
> **Reviewed:** 2026-07-22
>
> **Assessment date:** 2026-06-15  
> **Engineering backlog:** [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) — **TB-337–344** (evidence-first onboarding realignment cluster)

# Product drift — onboarding narrative vs. platform mission

## Executive summary

**Verdict: the concern is valid, but it is narrower and more fixable than “the product became an Azure tool.”**

ArchLucid’s **positioning** (brand category “Architecture Proof Engine,” `/welcome`, `/why`, `/get-started`, buyer docs, quick-review brief-first wizard) remains aligned with a **multi-source architecture review and governance platform**. The **default operator first-run spine** has drifted: the highest-visibility empty state and Core Pilot checklist both lead with Azure ingestion as step one, and a first-run component is literally named `OperatorHomeAzureExtractorEmptyState`.

| Layer | Dominant framing today |
| --- | --- |
| Marketing / buyer docs | Governed architecture review; evidence-linked review package |
| Buyer-polished operator shell | Review package / executive demo; de-emphasizes Azure upload |
| Default operator shell (full) | Azure-assessment onboarding in empty state + Core Pilot step 1 |
| New-review wizard (default tab) | Brief-first — **correct mental model**, but schema pins `cloudProvider` to Azure |
| Cloud settings | “Cloud providers” (plural) with **Connect Azure** only |

**Severity:** moderate — not a category emergency, but enough to mis-sort first-time architects, governance buyers, and non-Azure prospects on screen one.

**Urgency:** address before non-Azure design-partner or AWS-shop demos; P0 copy/rename work is days, not weeks.

**Correction principle:** teach **“provide architecture evidence”** with Azure as the **accelerated** (fastest-to-production-faithful) path — not mandatory, not merely optional, and not “preferred” in a way that makes other paths second-class.

---

## 1. Product vision (reference)

ArchLucid was designed as a broad **architecture review, governance, evidence, risk, and decision-management platform**. Long-term capability spans:

- Architecture review, governance, evidence management, findings, decision records, risk analysis, compliance assessment, architecture intelligence

**Azure tenant analysis is one evidence source**, not the product. The platform should ultimately review architecture descriptions, requirements, ADRs, design documents, diagrams, policy definitions, Azure/AWS environments, Terraform, infrastructure exports, governance artifacts, review requests, and other architecture evidence.

**Canonical outward narrative:**

- Category: **Architecture Proof Engine** — [`brand-category.ts`](../../archlucid-ui/src/lib/brand-category.ts), [`EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md)
- Positioning: evidence-linked review package, not cloud SKU scanning — [`POSITIONING.md`](../go-to-market/POSITIONING.md)

**V1 shipped reality (honest boundary):**

- Azure-hosted product and Azure-first automated ingest are **in scope for V1 GA** — [`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.16, §2.19; [`ADR 0020`](adrs/0020-azure-primary-platform-permanent.md)
- Multi-cloud target analysis, AWS/GCP inventory ZIPs, generic non-extractor JSON ingest, Structurizr/Terraform/ArchiMate import connectors are **V1.1+** — [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6n, **TB-214**, [`MULTI_CLOUD_ANALYSIS_V1_1.md`](../library/MULTI_CLOUD_ANALYSIS_V1_1.md)

**Critical distinction (permanent):**

| Statement | Meaning |
| --- | --- |
| “We run on Azure” | Product platform / hosting (ADR 0020) — true and permanent |
| “You must bring Azure” | Onboarding entry condition — **should not be true** for the platform mission |

Today the operator first-run spine **conflates** these two facts.

---

## 2. Product drift assessment

### 2.1 Observation (confirmed in code)

The default operator home empty state (zero reviews) renders a three-step strip:

```12:24:archlucid-ui/src/components/operator-home/OperatorHomeAzureExtractorEmptyState.tsx
const FIRST_RUN_STEPS: { label: string; description: string }[] = [
  {
    label: "Upload your Azure environment",
    description: "Run the Tier 1 PowerShell extractor in your subscription (no credentials leave your tenant) and upload the generated ZIP.",
  },
  {
    label: "Select analysis scope",
    description: "Choose which policy pack to apply — Azure CIS, custom governance rules, or the default starter pack.",
  },
  {
    label: "View your first finding",
    description: "ArchLucid maps dependencies, runs multi-agent analysis, and delivers a signed review package with a full evidence trail.",
  },
];
```

Core Pilot checklist step 1 reinforces the same frame:

```20:27:archlucid-ui/src/lib/core-pilot-steps.ts
  {
    title: "Upload Azure architecture context",
    shortBody: "Run the read-only extractor script locally, then upload the ZIP for production-faithful reviews.",
    ...
    primaryLabel: "Upload Azure package",
    primaryHref: EXTRACT_UPLOAD_SETTINGS_PATH,
  },
```

### 2.2 Product positioning — what a first-time user likely concludes

After the **default operator first-run spine**, a user is more likely to describe the product as:

**B. Azure assessment platform** — not **A. Architecture review platform**

**Why:**

1. Step 1 names Azure as the action (“Upload your Azure environment”), not evidence as the action.
2. Step 2’s primary example is Azure CIS — compliance scanning vocabulary.
3. The component and checklist are **named and ordered** around Azure extraction before “create a review request.”
4. “Connect Azure” appears as a prominent connector CTA on home surfaces.

A user who enters via **marketing** (`/welcome`, `/get-started`) or the **quick-review wizard** (paste brief first) may still land on **A** — which is why this is **onboarding-spine drift**, not full product repositioning.

### 2.3 Plausible mechanism (implementation detail → product story)

The following sequence is supported by docs and code:

1. **Azure export exists** and is the only turnkey, high-fidelity automated evidence connector in V1 (`POST /v1/azure-extractor/upload`).
2. **Azure export is easy to demonstrate** — canonical pilot runbooks (`FIRST_PILOT_OPERATOR_PATH.md` Phase B) and Core Pilot lead with it.
3. **The demonstrable path became the teaching path** — UI mirrored runbooks and checklist ordering.
4. **The teaching path leaked into the product opening frame** — empty state copy, step order, and the component name `OperatorHomeAzureExtractorEmptyState`.

The drift **stopped short of marketing**: `/welcome`, `/why`, and buyer-polish copy still say “review package” and “evidence trail.” The seam is between **buyer narrative** and **operator first-run**.

### 2.4 Architectural encoding of drift

The new-review wizard schema hard-codes cloud identity at intake:

- `archlucid-ui/src/lib/wizard-schema.ts` — `cloudProvider: z.literal("Azure")`
- API types already allow `"Azure" | "Aws" | "Gcp"` — UI pins Azure even when intake is brief/docs-only

This is the moment an **evidence source** became **the environment** in the primary intake contract. Fixing copy without addressing optionality leaves a structural mismatch for pre-deployment and paper-architecture reviews.

---

## 3. Mental model analysis

### 3.1 What the UI currently teaches

> *“ArchLucid is a thing you point at your Azure subscription. You extract your environment, apply policy packs, and get findings about your Azure estate.”*

This is the **scanner mental model** (Azure Advisor, WAT, Defender posture tools). Evidence is a side effect of having a cloud account.

### 3.2 What the UI should teach

> *“ArchLucid is where an architecture gets reviewed and governed. You bring architecture evidence — brief, ADR, diagram, IaC, design doc, and/or cloud export — and receive a defensible, signed review package with findings, decisions, and an audit trail.”*

This is the **review / tribunal mental model**. Cloud export is the richest-but-optional **accelerator**, not the entry condition.

### 3.3 Where the correct model already exists

The **quick-review wizard** default path (“Paste your architecture brief”) already teaches the right model. The gap is that the **empty state and checklist** — higher attention, earlier in the session — teach the scanner model first.

Marketing already uses the spine: **Capture → Evidence → Review → Findings → Decisions → Report** (`welcome-marketing-copy.ts`). Operator first-run should obey the same spine.

---

## 4. Risks of continuing Azure-first onboarding

| Audience / scenario | Risk |
| --- | --- |
| **AWS-primary / GCP-primary shops** | Step 1 is impossible; hard bounce before brief-based path |
| **Platform / enterprise architects** | Product reads as ops/cloud-governance tool, not architecture authority |
| **Governance / ARB professionals** | Implies reviews require a deployed environment |
| **Pre-deployment / greenfield** | Highest-value “review before build” moment is invisible |
| **No-cloud reviews** (on-prem, vendor eval, paper architecture) | Appear unsupported |
| **Competitive framing** | Invites comparison on Azure scanning depth (losing fight) vs. governed cross-source review (differentiated) |
| **TAM / procurement** | Reinforces “Azure-only product” extrapolation from onboarding, not from scope docs |

**Net:** onboarding filters **out** personas the platform vision serves (architects, governance, pre-deployment) and filters **in** the persona where cloud-native assessment tools are strongest.

---

## 5. Recommended narrative

### 5.1 Universal intake verb

Adopt **“Provide architecture evidence”** as the standard first-run verb.

**Canonical onboarding sentence:**

> *“Start an architecture review by providing evidence — a brief, design docs, ADRs, diagrams, IaC, or a cloud export. Connected to Azure? Use the extractor for the fastest path to production-faithful evidence.”*

### 5.2 How to position Azure

| Posture | Verdict |
| --- | --- |
| Mandatory | Reject — contradicts vision; excludes most personas |
| Optional | Reject — undersells the one real automated connector |
| Preferred | Reject — re-centers Azure as the norm |
| **Accelerated** | **Adopt** — honest for V1; inclusive for other paths; ages correctly when V1.1 connectors ship as additional accelerators |

Evidence is a **plural noun**. Azure is an **adjective on speed** (“fastest path”), not the **subject** of the sentence.

---

## 6. Recommended UI changes

Surgical changes that **preserve** Azure onboarding strength:

| Surface | Current | Target |
| --- | --- | --- |
| First-run empty state step 1 | “Upload your Azure environment” | “Provide architecture evidence” (+ Azure as fastest path inside step) |
| Component name | `OperatorHomeAzureExtractorEmptyState` | `OperatorHomeFirstReviewEmptyState` |
| Core Pilot step 1 | “Upload Azure architecture context” | “Provide architecture evidence” / “Add evidence” |
| Wizard evidence step | Implicit “Azure ZIP or demo” | Explicit picker: Brief · Documents · Diagrams · IaC · Azure export (fastest) · Demo |
| Unshipped sources | Hidden or implied | Disabled with honest **V1.1** badges (no overclaim per POSITIONING §7) |
| `cloudProvider` at intake | `z.literal("Azure")` | Optional / `NotApplicable` when no cloud environment (owner confirm — PQ-DRIFT-01) |
| Cloud connections page | “cloud providers” + Azure only | Azure today + disabled V1.1 rows, or explicit “Azure (more in V1.1)” |
| Secondary onboarding copy | Azure-upload lead phrasing | Evidence verb; “Connect Azure” only as named connector |

**Do not remove:** extractor walkthrough, Tier 1/Tier 2 Azure paths, Azure CIS as a policy-pack example, or “Connect Azure” as a tertiary/accelerator CTA.

---

## 7. V1 corrections (engineering backlog)

Tracked as **TB-337–344** in [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md):

| ID | Title | Priority |
| --- | --- | --- |
| **TB-337** | Evidence-first first-run empty-state copy | P0 |
| **TB-338** | Rename `OperatorHomeAzureExtractorEmptyState` → `OperatorHomeFirstReviewEmptyState` | P0 |
| **TB-339** | Evidence-first Core Pilot step 1 reframe | P0 |
| **TB-340** | Make `cloudProvider` optional at intake | P1 — **blocked on PQ-DRIFT-01** (owner) |
| **TB-341** | Multi-source evidence picker with honest V1.1 badges | P1 |
| **TB-342** | Onboarding secondary-surface copy sweep | P1 |
| **TB-343** | Reconcile cloud-connections “providers” plural | P2 |
| **TB-344** | Onboarding narrative-spine drift guard (CI contract) | P2 |

**Recommended batch order:** TB-337 → TB-338 → TB-339 (same PR if possible) → TB-342 → TB-341 → TB-343 → TB-344. TB-340 after owner resolves PQ-DRIFT-01 against `V1_SCOPE.md` §2.19.

**Explicitly out of scope for this cluster:** building AWS/GCP/Terraform/Structurizr ingest (**TB-214**, V1.1 multi-cloud analysis). This cluster is **framing, labeling, optionality, and regression guards** using what V1 already ships.

**Acceptance test for “done”:** an AWS-shop architect, an ARB reviewer with a paper design, and an Azure-ops user all see a first screen whose step 1 they can immediately act on. Today only the third can.

---

## 8. Long-term product positioning

1. **Hold the category:** Architecture Proof Engine — differentiation is the governed, signed, evidence-linked **review package**, not any single connector.
2. **Evidence is the platform’s plural input layer** — Azure, AWS, GCP, Terraform, ADRs, diagrams, and policy artifacts are **evidence adapters** into one review/governance core. Design intake IA as if all adapters exist; badge unshipped ones honestly until V1.1.
3. **Separate hosting from entry condition forever** — ADR 0020 (“Azure-primary platform”) must not be read as “Azure-required review.”
4. **Endgame test:** Terraform-only, AWS-only, and paper-only first reviews feel unsurprising. When that is true in UX (not only in vision docs), narrative and mission have re-converged.

---

## 9. Key evidence files (operator UI)

| Role | Path |
| --- | --- |
| First-run empty state | `archlucid-ui/src/components/operator-home/OperatorHomeAzureExtractorEmptyState.tsx` |
| Core Pilot steps | `archlucid-ui/src/lib/core-pilot-steps.ts` |
| Quick review (brief-first) | `archlucid-ui/src/app/(operator)/reviews/new/QuickReviewWizard.tsx` |
| Full wizard + Azure ZIP step | `archlucid-ui/src/app/(operator)/reviews/new/NewRunWizardClient.tsx` |
| Wizard schema (Azure literal) | `archlucid-ui/src/lib/wizard-schema.ts` |
| Buyer-polish home copy | `archlucid-ui/src/lib/buyer-polish-copy.ts` |
| Marketing spine | `archlucid-ui/src/components/marketing/welcome-marketing-copy.ts` |
| Cloud connections | `archlucid-ui/src/app/(operator)/settings/cloud-connections/_sections/CloudConnectionsPageClient.tsx` |

---

## 10. Related documents

| Document | Relevance |
| --- | --- |
| [`EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) | Canonical buyer narrative |
| [`POSITIONING.md`](../go-to-market/POSITIONING.md) | Messaging don’ts (no false multi-cloud) |
| [`V1_SCOPE.md`](../library/V1_SCOPE.md) | Azure-first ingest + Azure-only analysis contract |
| [`CORE_PILOT.md`](../library/CORE_PILOT.md) | Intended four-step review outcome |
| [`COMPETITIVE_LANDSCAPE.md`](../go-to-market/COMPETITIVE_LANDSCAPE.md) | Cloud assessment tools vs. proof engine row |
| [`ADR 0020`](adrs/0020-azure-primary-platform-permanent.md) | Azure as hosting platform |
| [`UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md) | Enterprise copy and component standards |
| [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) | TB-337–344 implementation specs |

---

## 11. Assessment conclusion (candid)

The product has **not** fully drifted into an “Azure assessment tool” — marketing, brand category, and large parts of the review/governance Operate layer still describe the correct platform. The **default operator onboarding spine** has drifted far enough that a reasonable first-time user will mis-file the category unless they entered through marketing or the brief-first wizard.

The fix is **mostly copy, step order, component naming, and one schema honesty decision** — not a re-architecture. The named component `OperatorHomeAzureExtractorEmptyState` is the clearest signal that implementation convenience became product story. Correct that spine before the next non-Azure evaluation; track durable prevention via **TB-344** (narrative-spine drift guard).
