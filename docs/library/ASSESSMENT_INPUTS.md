> **Scope:** Evaluator — Minimal read list for LLM-driven weighted readiness / first-principles assessments; audience is coding agents and the owner; not a customer or operator deliverable. Expand beyond this list only when the user asks a scoped question (for example UI-only or billing-only).

# Assessment inputs (canonical read list)

## Canonical assessment prompt

The canonical clean-slate weighted readiness prompt is **[`../assessments/ASSESSMENT_PROMPT_SERIES.md`](../assessments/ASSESSMENT_PROMPT_SERIES.md)** §Strategic release and market readiness (v3) (path-stable stub: [`ASSESSMENT_PROMPT_V3.MD`](../assessments/ASSESSMENT_PROMPT_V3.MD)). It supersedes [`ASSESSMENT_PROMPT_V2.md`](../assessments/ASSESSMENT_PROMPT_SERIES.md) (archived 2026-07-20). For v3 passes it **supersedes** the standalone [`ASSESSMENT_QUALITY_MODEL.md`](ASSESSMENT_QUALITY_MODEL.md) below (which remains canonical only for legacy / non-v3 passes). Read this file's table for orientation evidence, then execute the v3 section of `ASSESSMENT_PROMPT_SERIES.md`.

**Broader exposure readiness** (controlled beta / public self-service gates) uses **[`../assessments/ASSESSMENT_PROMPT_SERIES.md`](../assessments/ASSESSMENT_PROMPT_SERIES.md)** §Broader exposure readiness (v4) (path-stable stub: [`assessment_prompt_v4.md`](../assessments/assessment_prompt_v4.md)) → rolling output **[`../assessments/LATEST_EXPOSURE.md`](../assessments/LATEST_EXPOSURE.md)**.

## One workflow (current score vs history)

Use this sequence so **headline readiness** never mixes with **historical narrative**:

1. **Inputs** — This file’s table is the **evaluation contract** (what evidence counts before broad repo scans).
2. **Boundary** — **`(A)` headline V1 readiness** vs **`(B)` procurement realism** follows **`Assessment-Scope-V1_1.mdc`** (**`@Assessment-Scope-V1_1`**) and the standing boundary bullets in the **rolling weighted pass** under **`docs/assessments/`** (see **Outputs** below).
3. **Score** — **One current weighted outcome:** that **rolling pass file** only (sponsor summary + dimensions). Do not cite archived snapshots as today’s number.
4. **Backlog** — Action queue and improvement IDs live **in the same rolling pass file** alongside that score.
5. **History** — Prior passes, dated scores, and narrative-only artifacts live under **`docs/archive/assessments/`** — archive-only: trend and forensic context, **not** canonical readiness.

**Execution prompts** for shipped improvements are **not** a second scorecard; align closure notes back into the **rolling assessment file** when the pass completes.

Read these **before** grepping broadly or opening large code regions. For scoring rules and out-of-scope procurement items, load **`Assessment-Scope-V1_1.mdc`** explicitly (**`@Assessment-Scope-V1_1`** in Cursor — it is not always injected).

| Order | Document | Role |
|------:|----------|------|
| 0 | [`ASSESSMENT_QUALITY_MODEL.md`](ASSESSMENT_QUALITY_MODEL.md) | Canonical quality names, weights, definitions, and weighted scoring formula |
| 1 | [`REPO_DIGEST.md`](REPO_DIGEST.md) *(regenerate via `python scripts/repo_digest/build_repo_digest.py`)* | Skim surface: project inventory, invariant pointer, doc anchors — **not** a substitute for V1 docs |
| 2 | [`V1_SCOPE.md`](V1_SCOPE.md) | In-contract V1 / V1.1 engineering and product boundaries |
| 3 | [`V1_DEFERRED.md`](V1_DEFERRED.md) | Explicit deferrals (what is **not** a headline gate) |
| 4 | [`../go-to-market/trust-center.md`](../go-to-market/trust-center.md) | Trust / buyer-facing commitments |
| 5 | [`../security/SOC2_SELF_ASSESSMENT_2026.md`](../security/SOC2_SELF_ASSESSMENT_2026.md) | SOC 2 self-assessment posture (narrate CPA gap under `(B)` only) |
| 6 | [`../go-to-market/ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap`](../go-to-market/ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap) | SOC 2 roadmap narrative |
| 7 | [`ARCHITECTURE_COMPONENTS.md`](ARCHITECTURE_COMPONENTS.md) | Component map |
| 8 | [`SYSTEM_MAP.md`](SYSTEM_MAP.md) | System flows |
| 9 | [`API_CONTRACTS.md`](API_CONTRACTS.md) | HTTP / OpenAPI contract of record |
|10 | [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md) | Operator configuration surface |
|11 | [`../go-to-market/PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md) | Commercial motion and design-partner context (for `(B)` when asked) |
|12 | [`ARCHITECTURE_INVARIANTS.md`](ARCHITECTURE_INVARIANTS.md) | INV-* catalog pointer |
|13 | [`../START_HERE.md`](../START_HERE.md) | Evaluator spine and doc routing |

**Outputs:** Write the latest pass to the rolling file under **`docs/assessments/`** (**today:** overwrite **[`docs/assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md)** in place — if that filename changes, update this sentence only). **Do not** add new dated multi-thousand-line assessment files under `docs/library/` unless the team explicitly opts back in — archive prior snapshots under **`docs/archive/assessments/`** instead.

**Historical assessments and archived quality prompts:** **Not** canonical for today’s headline score; indexed out of default agent context via **`.cursorignore`** where applicable — open **only** when comparing scores over time or tracing narrative history.

**`V1` assessment hygiene — third-party pen test:** Owner **2026-05-15** (rolling assessment note **P8** under **`docs/assessments/`**): **omit** recurring vendor/budget pen-test questionnaire prompts during **`(A)` V1** planning / execution; external pen test stays **`V2`** (`V1_DEFERRED.md` §6c). Procurement friction without a published assessor summary remains **`(B)` informational** only.
