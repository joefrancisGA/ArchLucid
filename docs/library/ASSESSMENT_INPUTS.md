> **Scope:** Evaluator — Minimal read list for LLM-driven weighted readiness / first-principles assessments; audience is coding agents and the owner; not a customer or operator deliverable. Expand beyond this list only when the user asks a scoped question (for example UI-only or billing-only).

# Assessment inputs (canonical read list)

## One workflow (current score vs history)

Use this sequence so **headline readiness** never mixes with **historical narrative**:

1. **Inputs** — This file’s table is the **evaluation contract** (what evidence counts before broad repo scans).
2. **Boundary** — **`(A)` headline V1 readiness** vs **`(B)` procurement realism** follows **`Assessment-Scope-V1_1.mdc`** (**`@Assessment-Scope-V1_1`**) and the standing boundary bullets in the **rolling weighted pass** under **`docs/assessments/`** (see **Outputs** below).
3. **Score** — **One current weighted outcome:** that **rolling pass file** only (executive summary + dimensions). Do not cite archived snapshots as today’s number.
4. **Backlog** — Action queue and improvement IDs live **in the same rolling pass file** alongside that score.
5. **History** — Prior passes, dated scores, and narrative-only artifacts (**e.g.** **`docs/archive/assessments/`**, **`docs/archive/quality/`**) are **archive-only**: trend and forensic context, **not** canonical readiness.

**Execution prompts** (e.g. **`docs/archive/agent-prompts/CURSOR_PROMPTS_GA_TASK*.md`**) are **task sequences** for shipping improvements — they are **not** a second scorecard; still align closure notes back into the **rolling assessment file** when the pass completes.

Read these **before** grepping broadly or opening large code regions. For scoring rules and out-of-scope procurement items, load **`Assessment-Scope-V1_1.mdc`** explicitly (**`@Assessment-Scope-V1_1`** in Cursor — it is not always injected).

| Order | Document | Role |
|------:|----------|------|
| 0 | [`ASSESSMENT_QUALITY_MODEL.md`](ASSESSMENT_QUALITY_MODEL.md) | Canonical quality names, weights, definitions, and weighted scoring formula |
| 1 | [`REPO_DIGEST.md`](REPO_DIGEST.md) *(regenerate via `python scripts/repo_digest/build_repo_digest.py`)* | Skim surface: project inventory, invariant pointer, doc anchors — **not** a substitute for V1 docs |
| 2 | [`V1_SCOPE.md`](V1_SCOPE.md) | In-contract V1 / V1.1 engineering and product boundaries |
| 3 | [`V1_DEFERRED.md`](V1_DEFERRED.md) | Explicit deferrals (what is **not** a headline gate) |
| 4 | [`../go-to-market/TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md) | Trust / buyer-facing commitments |
| 5 | [`../security/SOC2_SELF_ASSESSMENT_2026.md`](../security/SOC2_SELF_ASSESSMENT_2026.md) | SOC 2 self-assessment posture (narrate CPA gap under `(B)` only) |
| 6 | [`../go-to-market/SOC2_ROADMAP.md`](../go-to-market/SOC2_ROADMAP.md) | SOC 2 roadmap narrative |
| 7 | [`ARCHITECTURE_COMPONENTS.md`](ARCHITECTURE_COMPONENTS.md) | Component map |
| 8 | [`SYSTEM_MAP.md`](SYSTEM_MAP.md) | System flows |
| 9 | [`API_CONTRACTS.md`](API_CONTRACTS.md) | HTTP / OpenAPI contract of record |
|10 | [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md) | Operator configuration surface |
|11 | [`../go-to-market/PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md) | Commercial motion and design-partner context (for `(B)` when asked) |
|12 | [`../../.cursor/rules/Architecture-Invariants.mdc`](../../.cursor/rules/Architecture-Invariants.mdc) | INV-* catalog pointer |
|13 | [`../START_HERE.md`](../START_HERE.md) | Evaluator spine and doc routing |

**Outputs:** Write the latest pass to the rolling file under **`docs/assessments/`** (**today:** overwrite **[`docs/assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md)** in place — if that filename changes, update this sentence only). **Do not** add new dated multi-thousand-line assessment files under `docs/library/` unless the team explicitly opts back in — archive prior snapshots under **`docs/archive/assessments/`** instead.

**Historical assessments and archived quality prompts:** **Not** canonical for today’s headline score; indexed out of default agent context via **`.cursorignore`** where applicable — open **only** when comparing scores over time or tracing narrative history.

**`V1` assessment hygiene — third-party pen test:** Owner **2026-05-15** (rolling assessment note **P8** under **`docs/assessments/`**): **omit** recurring vendor/budget pen-test questionnaire prompts during **`(A)` V1** planning / execution; external pen test stays **`V2`** (`V1_DEFERRED.md` §6c). Procurement friction without a published assessor summary remains **`(B)` informational** only.
