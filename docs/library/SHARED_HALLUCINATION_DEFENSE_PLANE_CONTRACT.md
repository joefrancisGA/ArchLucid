> **Scope:** Contributor-reference — shared post-execute hallucination defense plane vs mode-specific cost/config forks (**TB-1230**); not a buyer assurance claim.

# Shared hallucination defense plane (anti mode-fork) contract (TB-1230)

> **Audience:** Contributors, principal architects, and GTM reviewers stress-testing Simulator vs Real vs fine-tuned completion paths.  
> **Not** a buyer claim that Simulator PilotStrict green equals Real live-model sponsor proof (**M-166**).

**Buyer / PA one-pager:** GTM **M-211** / **M-212** (claim honesty).  
**Real-variance isolation:** [`AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_CONTRACT.md`](AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_CONTRACT.md) (**TB-1196**).  
**Finding provenance:** [`DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md`](DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md) (**TB-1221**).  
**Evaluation lanes:** **TB-1228** (Lane A structural / Lane B–C async).  
**Honesty CI:** **TB-1231** (open). **PilotStrict floors:** Done **TB-684**.

---

## Decision in one line

**One shared post-execute defense plane** serves Simulator, base Real, and fine-tuned Real — schema parse, heuristics, faithfulness checker semantics, Critic/insight-density post-processors, and `AgentOutputQualityGate` disposition. **Mode may vary cost/config only** (deployment selection, `SkipWhenSimulator` LLM judges, content safety on live completions, threshold profiles). **Never** fork Validator/Gate class trees per execution mode or treat Simulator quality pass as Real-safe without INV-002 disclosure.

---

## Owned by the shared plane (must not fork)

| Surface | Role | Code anchors |
| --- | --- | --- |
| Schema / `AgentResultParser` | Structural admission before persistence | `AgentResultParser`, payload validators |
| Heuristic + semantic evaluators | Post-execute quality signals | `AgentOutputTraceQualityEvaluator` |
| `AgentResultEvidenceFaithfulnessChecker` | Deterministic faithfulness semantics | Same checker for all modes |
| Critic / insight-density post-processors | Post-process hints, not decide chokepoint | Critic pipeline stages |
| `AgentOutputQualityGate` disposition | WarnOnly / Enforce / Block outcomes | Quality gate host config |
| INV-002 mode labeling | Every result/run labeled | `StructuralExecutionMode`, run aggregates |
| Planned provenance fail-closed | **TB-1221** / validate-before-overlay (**TB-1196**) | Follow-on ship |

---

## Executor / mode may vary (config and cost only)

| Variation | Allowed | Must disclose |
| --- | --- | --- |
| AOAI vs fixture vs FT deployment | `FineTunedAgentCompletionDeploymentResolver` after promotion gate | Tenant opt-in; not a second defense stack |
| `SkipWhenSimulator` on expensive LLM judges | Cost control | Simulator skipped judge ≠ Real proof |
| Content safety on live completions | `ContentSafetyEnforcingAgentCompletionClient` | Real-only wrap; not injection-proof |
| Host threshold profiles | WarnOnly vs PilotStrict Enforce/Block | **M-166** — PilotStrict ≠ Real sponsor proof |
| FT promotion cohort ratios | `GoldenCohortFineTuningPromotionGate` | Promotion ≠ per-run defense replacement |

---

## Never (fork / overclaim matrix)

| Pattern | Why forbidden |
| --- | --- |
| Separate Validator/Gate class trees per execution mode | Invites divergent Simulator vs Real behavior |
| Skip schema/heuristic plane for Simulator | Same commit path; mode label ≠ skip defenses |
| Promote Simulator → Real without INV-002 | Mode mislabeling corrupts buyer proof |
| Simulator PilotStrict green = Real-safe | **M-166** / **M-211** |
| FT promotion ratios as per-run defense | Cohort gate ≠ runtime hallucination closure |

---

## Relationship to TB-1228 lanes

| Lane | Position |
| --- | --- |
| **Lane A** (structural / light heuristic) | Implemented in shared plane |
| **Lane B / C** (async / promotion) | Stay async; do not fork Lane A per mode |

---

## Allow / forbid (GTM-safe)

| Claim | Status |
| --- | --- |
| One defense plane; mode labels and thresholds, not forked stacks | **Allow** |
| `SkipWhenSimulator` + content safety named as cost/Real-only config | **Allow** |
| Simulator quality pass with **M-166** disclosure | **Allow** |
| Simulator PilotStrict green = Real live-model sponsor safety | **Forbid** |
| Parallel Simulator vs Real defense stacks by design | **Forbid** |
| Injection-proof / model cannot influence findings (absolute) | **Forbid** — see **TB-997**/**TB-998** |

---

## TB-1231 CI anchors (named, not implemented here)

| Anchor | Purpose |
| --- | --- |
| `SHARED_HALLUCINATION_DEFENSE_PLANE_CONTRACT.md` | Drift guard (this file) |
| Buyer/proof stub guards | Fail Simulator=Real-safe / forked-stack claims |
| Code presence | `AgentOutputTraceQualityEvaluator`, `SkipWhenSimulator`, `ContentSafetyEnforcingAgentCompletionClient`, `FineTunedAgentCompletionDeploymentResolver`, `GoldenCohortFineTuningPromotionGate` |

---

## Explicit non-claims

- Does not implement validate-before-overlay (**TB-1196** follow-on) or provenance validators (**TB-1221**).
- Does not change FT activation (**TB-690**) or reopen Done **TB-684**.
- Does not close honesty CI (**TB-1231**).

---

## Related

- [`AGENT_OUTPUT_EVALUATION.md`](AGENT_OUTPUT_EVALUATION.md)
- [`INV002_EXECUTION_MODE_AGGREGATION_CONTRACT.md`](INV002_EXECUTION_MODE_AGGREGATION_CONTRACT.md)
- [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (**M-166** / **M-211**)
