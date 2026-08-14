> **Scope:** Contributor-reference — Writer-facing canonical-vs-rejected vocabulary for docs and copy, plus the buyer UI glossary and persona terms (formerly `docs/go-to-market/UI_GLOSSARY_V1.md`). Not the five-minute mental model (`customer-facing/CONCEPTS_IN_5_MINUTES.md`); not term definitions (`GLOSSARY.md`).

> **Reviewed:** 2026-07-27


# Concept vocabulary (canonical forms)

**Relationship:**

- **[`GLOSSARY.md`](GLOSSARY.md)** — *"What does X mean?"*
- **[`customer-facing/CONCEPTS_IN_5_MINUTES.md`](customer-facing/CONCEPTS_IN_5_MINUTES.md)** — quick mental model for new readers
- **This file** — *"If two phrasings exist, which is canonical in our docs?"* — and the [UI glossary](#ui-glossary-v1) for buyer ↔ technical artifact/persona nouns

> **CI guard.** [`scripts/ci/check_concept_vocabulary.py`](../../scripts/ci/check_concept_vocabulary.py) enforces the rules in **§ 1.1** only. This file may quote rejected forms in rationale text and is excluded from the scan.

---

## 1 Canonical vocabulary

### 1.1 CI-enforced rules

| # | Use this (canonical) | Don't use (rejected) | Rationale | First introduced |
|---|----------------------|----------------------|-----------|------------------|
| 1 | **Microsoft Entra ID** | "Azure Active Directory" or "Azure AD" | Microsoft renamed the service in 2023. Continued use of the legacy name confuses customers reading security docs and contradicts [`SECURITY.md`](contributor-reference/SECURITY.md). Rejected forms remain valid under **`docs/archive/**`** (CI excludes that tree). | 2026-04-20 |

### 1.2 Reviewer-enforced rules (not yet automated)

Promote a row to § 1.1 only after ripgrep on `docs/` (excluding `docs/archive/`) shows manageable fix volume in the same PR.

| # | Use this (canonical) | Don't use (rejected) | Rationale |
|---|----------------------|----------------------|-----------|
| 1 | **review** (noun — the product session) | "run" when used as the product noun for a governed architecture review session (e.g. "create a run", "the run's findings", "run ID") | ArchLucid's primary product concept is an architecture *review*, not a pipeline *run*. Buyer-facing copy, docs, and UI labels must use **review**. Legitimate uses of "run" (CI run, test run, script run, dry run, **run** the pipeline as a verb, API paths **`/run/...`**, **`runId`**) are **not** rejected — only uses where "run" names the ArchLucid review session itself in **buyer** prose. |
| 2 | **Persona nouns per surface** (see [`#persona-terms`](#persona-terms)) | **Operator** as a **public** persona noun; "operator shell", "operator path", "pilot operator", "tenant operator", "canonical guide", "canonical operator", "lane runbook" in customer-visible UI, help, nav, empty states, or GTM | **Operator** names an internal implementation shell and contributor doc audience — not the buyer-facing role. Map copy by surface: **architect-facing** → **Architect** + task language (**Review**, **Finalize**); **setup/config** → **Admin** / **platform administrator**; **governance workflow** → **Reviewer** / **Approver** / **Governance lead**; **reporting** → **Sponsor** / **Sponsor**; **internal-only diagnostics** (Admin/Diagnostics routes, runbooks, env flags) → **Operator** may remain. Does not override the **review** vs **run** rule in row 1 or artifact terms in the [UI glossary](#ui-glossary-v1) (**Finalize**, **Snapshot**). |
| 3 | **Sealed review record** (package locked at finalize) | **Signed review record**, **signed decision record**, **governance decision record**, or calling the **architecture package** a decision record | The **sealed review record** is the finalized package artifact (findings, evidence trail, decisions, exports). **Signed** implied PKI endorsement; V1 is write-lock + hash lineage. A **decision** is a disposition row in the Decision register — not the package itself. **ADR** remains **Architecture Decision Record** for ADR export wording. |

**2026-05-18 note:** Spine docs in `docs/` onboarding, `go-to-market/`, and `onboarding/` favor **review**; tightening **CI** rejection for remaining `run`-as-product-noun phrases is a separate change to **`scripts/ci/check_concept_vocabulary.py`** when the repo is ready.

---

## UI Glossary V1 {#ui-glossary-v1}

Former standalone: `docs/go-to-market/UI_GLOSSARY_V1.md` → this section.

**Audience:** Architect workspace, product UI, and go-to-market collateral writers. This section does **not** rename HTTP contracts, CLI verbs, or audit journal identifiers.

**Also linked from:** [`operator-shell.md`](operator-shell.md) · [`DOCUMENTATION_BY_AUDIENCE.md`](DOCUMENTATION_BY_AUDIENCE.md)

### Glossary table (verbatim — owner Q&A 2026-05-15)

| Buyer-facing UI | Technical / unchanged |
|----------------|----------------------|
| **Review** | API `/v1/architecture/review/...` and `/v1/architecture/reviews`; route param often still named `runId` (Review ID value); types `ArchitectureRun` |
| **Architecture package** | Findings, evidence trail, sealed review record, decisions, and exports for one architecture review |
| **Sealed review record** | API `signed-review-record` / `signed-records`; type `GoldenManifest` may still appear in code |
| **Decision** | Disposition row in the Decision register — not the package itself |
| **Finalize review** / **Finalize** | `POST .../finalize` (former `.../commit`) |
| **Architecture snapshot** / **Snapshot** | Point-in-time slice inside a package |
| **Evidence graph** | Canonical `/v1/evidence-graph/...` (alias `/v1/graph/...`) |

### Persona terms (role nouns in UI copy) {#persona-terms}

Use the **Use** column for any new user-facing string that names a **person** or **role** (nav labels, headings, tooltips, empty states, help, banners, GTM). The **Review / Finalize / Architecture package** rows above still govern **workflow artifacts** — persona terms govern **who** the reader is, not what the review object is called.

**Do not use Operator as a public persona noun** outside Admin/Diagnostics internal surfaces. Code identifiers (`(operator)` route group, `runId`, `NEXT_PUBLIC_OPERATOR_EXPERIENCE`, hook names) stay unchanged.

| Use (buyer-facing persona) | Avoid (rejected in public copy) | When to use |
|----------------------------|-----------------------------------|-------------|
| **Architect** | **Operator**, "operator path", "operator shell", "pilot operator", "canonical operator" | Primary signed-in workspace: review intake, findings, graph/compare, home, help aimed at day-to-day architecture work. Prefer **Architect workspace** over legacy "operator shell" in labels. |
| **Sponsor** | **Operator** | Sponsor route group, sponsor reading mode, ROI/value summaries, cross-shell handoff from review detail. |
| **Sponsor** | **Operator** | Procurement-safe exports, email-to-sponsor flows, sponsor briefs — when the reader is the budget holder, not the practitioner. |
| **Admin** / **platform administrator** | **Operator**, "tenant operator" | Settings, integrations, extract upload, tenant configuration, platform-admin sidebar — authority and setup, not review execution. |
| **Reviewer** | **Operator**, "operators pick/submit/approve/run" | Someone inspecting findings, evidence, or an architecture package before a gate passes. |
| **Approver** | **Operator** | Explicit approval/disposition actions (approve, reject, waive) on governance gates. |
| **Governance lead** | **Operator**, "operator follow-up" | Policy violations, drift alerts, escalation copy — coordination across reviewers and approvers. |
| **Operator** (retain) | — (do not promote to marketing/home/nav) | **Internal-only:** Admin/Diagnostics routes, runbooks, env flags, contributor docs audience label, and diagnostics health signals. Not for customer-visible home, help, nav, or empty states. |

**Legacy phrase bans** (use architect/task vocabulary instead): "canonical guide" → **first-review guide**; "lane runbook" → **first-review guide** or in-product help link; "operator shell" / "operator path" → **architect workspace** / **complete review workflow**.

**Decision rule (quick):** architect-facing surface → **Architect** + task language (**Review**, **Finalize**); setup/config → **Admin**; governance workflow → **Reviewer** / **Approver** / **Governance lead**; reporting → **Sponsor** / **Sponsor**; diagnostics-only → **Operator** retained.

**Enforcement:** `archlucid-ui/src/lib/review-terminology-surfaces.ts` and `review-terminology-guard.test.ts` scan high-traffic UI modules for banned operator-persona phrases.

### Workflow copy (target wizard, review detail, exports)

**Capture system → Add evidence → Review → Resolve findings → Record decisions → Generate report**

Use **Architecture review** in headings and tooltips where **Review** alone would be ambiguous.

### Constraints (change only with ADR)

- HTTP paths (`/v1/...`), OpenAPI titles, `openapi-v1.contract.snapshot.json`, CLI command names, durable audit `AuditEventTypes` names, and correlation-id documentation — **buyer-noun path renames landed in [ADR 0064](../architecture/adrs/0064-buyer-vocabulary-api-and-schema-alignment.md)**.
- React route paths remain unchanged unless a redirect is required (prefer label-only changes in the UI).

---

## 2 Promoting a new rule

1. Add a row to **§ 1.2** with rationale.
2. After one release cycle without review noise, promote to **§ 1.1** and add a matching entry to `RULES` in `scripts/ci/check_concept_vocabulary.py`.
3. Fix existing occurrences in `docs/` in the same PR as the new CI rule.

---

## 3 Related

- [`#ui-glossary-v1`](#ui-glossary-v1) — buyer-facing persona and artifact vocabulary
- [`VOCABULARY_ROSETTA.md`](VOCABULARY_ROSETTA.md) — internal/API ↔ buyer mapping table, end-state rule, and leak inventory (dual-vocabulary cleanup)
- [`GLOSSARY.md`](GLOSSARY.md)
- [`customer-facing/CONCEPTS_IN_5_MINUTES.md`](customer-facing/CONCEPTS_IN_5_MINUTES.md)
- [`scripts/ci/check_concept_vocabulary.py`](../../scripts/ci/check_concept_vocabulary.py)
