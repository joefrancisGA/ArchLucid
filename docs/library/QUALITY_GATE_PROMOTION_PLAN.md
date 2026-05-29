> **Scope:** Contributor-reference — warning-only CI and proof gates that may promote to merge-blocking.

# Quality gate promotion plan (V1 engineering)

**Last reviewed:** 2026-05-28

Documents warning-only CI and proof gates that may promote to **merge-blocking** when criteria are met. **Deferred commercial/procurement checks must not become V1 merge blockers.**

| Gate | Current mode | Promotion criteria | Owner | Notes |
| --- | --- | --- | --- | --- |
| Agent eval baseline (main) | WARN in local dev; blocking in CI when configured | 5 consecutive green `main` runs on eval job; false-positive budget < 2/quarter | AI platform | See `docs/library/AGENT_OUTPUT_EVALUATION.md` |
| Retrieval IR harness | WARN in first-pilot proof; optional CI | Promote to blocking only after corpus change policy + stable green main | Retrieval | `scripts/ci/eval_retrieval_ir.py` |
| Route/tier/policy/nav parity | BLOCK on sponsor/production-like proof | Already blocking for commercial handoff surfaces | Platform | `scripts/ci/assert_route_tier_policy_nav.py` |
| Mutating route audit matrix | WARN in proof; blocking in CI | Already blocking in CI via `check_audit_matrix.py` | Platform | `docs/library/AUDIT_COVERAGE_MATRIX.md` |
| Reference customer check | INFORMATIONAL / deferred | **Never** merge-blocking for V1 | GTM owner | `(B)` procurement |
| SOC 2 CPA / pen test | INFORMATIONAL / deferred | **Never** merge-blocking for V1 | Security owner | `(B)` procurement |
| Live marketplace checkout | OWNER_REQUIRED | **Never** merge-blocking for V1 | Finance owner | sales-led V1 |

Proof pipeline emits `quality-gate-promotion-status.json` summarizing current modes for operator handoff.
