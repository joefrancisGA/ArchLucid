> **Scope:** Minimal read list for LLM-driven weighted readiness / first-principles assessments; audience is coding agents and the owner; not a customer or operator deliverable. Expand beyond this list only when the user asks a scoped question (for example UI-only or billing-only).

# Assessment inputs (canonical read list)

Read these **before** grepping broadly or opening large code regions. For scoring rules and out-of-scope procurement items, load **`Assessment-Scope-V1_1.mdc`** explicitly (**`@Assessment-Scope-V1_1`** in Cursor — it is not always injected).

| Order | Document | Role |
|------:|----------|------|
| 0 | [`REPO_DIGEST.md`](REPO_DIGEST.md) *(regenerate via `python scripts/repo_digest/build_repo_digest.py`)* | Skim surface: project inventory, invariant pointer, doc anchors — **not** a substitute for V1 docs |
| 1 | [`V1_SCOPE.md`](V1_SCOPE.md) | In-contract V1 / V1.1 engineering and product boundaries |
| 2 | [`V1_DEFERRED.md`](V1_DEFERRED.md) | Explicit deferrals (what is **not** a headline gate) |
| 3 | [`../go-to-market/TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md) | Trust / buyer-facing commitments |
| 4 | [`../security/SOC2_SELF_ASSESSMENT_2026.md`](../security/SOC2_SELF_ASSESSMENT_2026.md) | SOC 2 self-assessment posture (narrate CPA gap under `(B)` only) |
| 5 | [`../go-to-market/SOC2_ROADMAP.md`](../go-to-market/SOC2_ROADMAP.md) | SOC 2 roadmap narrative |
| 6 | [`ARCHITECTURE_COMPONENTS.md`](ARCHITECTURE_COMPONENTS.md) | Component map |
| 7 | [`SYSTEM_MAP.md`](SYSTEM_MAP.md) | System flows |
| 8 | [`API_CONTRACTS.md`](API_CONTRACTS.md) | HTTP / OpenAPI contract of record |
| 9 | [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md) | Operator configuration surface |
|10 | [`../go-to-market/PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md) | Commercial motion and design-partner context (for `(B)` when asked) |
|11 | [`../../.cursor/rules/Architecture-Invariants.mdc`](../../.cursor/rules/Architecture-Invariants.mdc) | INV-* catalog pointer |
|12 | [`../START_HERE.md`](../START_HERE.md) | Evaluator spine and doc routing |

**Outputs:** Write the latest pass to **[`docs/assessments/LATEST.md`](../assessments/LATEST.md)**. **Do not** add new dated multi-thousand-line files under `docs/library/` unless the team explicitly opts back in — archive under `docs/archive/assessments/` instead.

**Historical assessments:** Indexed out of default agent context via `.cursorignore`; open explicitly when comparing scores over time.
