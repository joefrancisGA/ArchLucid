> **Scope:** Contributor-reference — policy-pack / rule-set evaluation hybrid (versioned data plane + compiled interpreter) (**TB-1324**); not legal certification guidance.

# Policy-pack evaluation — compiled vs data-plane hybrid contract (TB-1324)

> **Audience:** Contributors, principal architects, pack authors, and GTM reviewers explaining how framework packs scale without engine forks.  
> **Not** a buyer claim that packs equal HIPAA/PCI/SOC certification or that every pack blocks finalize (**TB-1022** / **M-172**).

**Buyer / PA one-pager:** GTM **M-235** / **M-236** — [`POLICY_PACK_EVALUATION_COMPILED_VS_DATA_PLANE_PA_ONE_PAGER.md`](../go-to-market/POLICY_PACK_EVALUATION_COMPILED_VS_DATA_PLANE_PA_ONE_PAGER.md).  
**Gate / SoD (separate concern):** [`PRE_FINALIZE_GATE_BLOCK_VS_ADVISORY_SOD_CONTRACT.md`](PRE_FINALIZE_GATE_BLOCK_VS_ADVISORY_SOD_CONTRACT.md) (**TB-1022**).  
**Real-variance isolation:** [`AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_CONTRACT.md`](AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_CONTRACT.md) (**TB-1196**).  
**Priority tiers:** [`POLICY_PACK_RULE_PRIORITY_MODEL.md`](POLICY_PACK_RULE_PRIORITY_MODEL.md).  
**Honesty CI:** **TB-1325** Done (`scripts/ci/check_policy_pack_evaluation_hybrid_honesty.py`).

---

## Decision in one line

**New framework content scales on the versioned data plane** (`PolicyPack` versions, curated rules, effective merge, `RuleSetHash` pins) interpreted by a **stable compiled interpreter** (`IDecisionRuleProvider` → `DecisionRuleSet` → `RuleBasedDecisionEngine` / `DecisionRuleCriteriaEvaluator` + typed `IFindingEngine`s). **Do not** compile each CIS/HIPAA/etc. pack into a new C# engine. **Do not** invent a Turing-complete pack DSL.

---

## Shipped hybrid matrix

| Layer | Owns | Code / data anchors |
| --- | --- | --- |
| **Versioned data plane** | Pack versions, curated `pack.curatedRules.v1` JSON, tenant merge, effective governance at commit | `PolicyPack`, `TenantCuratedComplianceRulePackMerger`, ADR [0007](../architecture/adrs/0007-effective-governance-merge.md), `EffectiveGovernanceAtCommit`, `RuleSetHash` |
| **Compiled interpreter** | Stable criteria evaluation, finding actions, severity/priority floors, commit-time governance capture | `IDecisionRuleProvider`, `DecisionRuleSet`, `RuleBasedDecisionEngine`, `DecisionRuleCriteriaEvaluator`, typed `IFindingEngine`s |
| **Content velocity (not engine forks)** | Framework narratives, rule keys, LLM generator → critic → SME | **G-CONTENT-01**, [`POLICY_PACK_CONTENT_BACKLOG.md`](POLICY_PACK_CONTENT_BACKLOG.md) |
| **Elicitation coupling (pack-owned questions)** | Rule keys seed question selection where ADR 0051 applies | ADR [0051](../architecture/adrs/0051-question-selection-engine.md) |

---

## Scale rule as packs multiply

| Do | Do not |
| --- | --- |
| Add CIS / HIPAA / industry **content** as new pack versions + curated rules on the data plane | Ship a new `IFindingEngine` / decision path per framework pack (release-couples content to deploy) |
| Pin evaluated rule surface at commit via `RuleSetHash` / effective governance | Treat pack catalog growth as certification or default-on finalize blocking (**TB-1022**) |
| Extend typed engines only when **semantics** change (new finding type, new action class) | Grow a general-purpose scripting / policy language inside pack JSON |
| Deepen corpora under **G-CONTENT-01** without platform releases | Fork evaluation per tenant in ad-hoc C# without data-plane versioning |

---

## Testability cost table

| Approach | Testability cost | When it is wrong |
| --- | --- | --- |
| **Compiled-per-pack engine** | N× engine suites; every content pack needs a deploy; high regression coupling | Default path for framework content — use data plane instead |
| **Pure data plane + shared interpreter** | Pack fixture goldens + interpreter property tests + version/hash pin tests; cheap per pack once engine suite exists | Never skip interpreter tests — data alone does not prove semantics |
| **Turing-complete pack DSL** | Full language test matrix; security review of arbitrary expressions; operational surprise | Any time pack JSON becomes a general scripting runtime |
| **Hybrid (shipped)** | One interpreter suite + per-pack golden fixtures + ADR 0007 merge tests | — |

---

## Relationship to gate / certification honesty

| Topic | Owner |
| --- | --- |
| Pack content ≠ HIPAA/PCI/SOC **certification** | **TB-1022** / **M-172**; [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) |
| `priorityFloor` narrows **evaluation surface**, not commit gate | **TB-1022** §4; [`POLICY_PACK_RULE_PRIORITY_MODEL.md`](POLICY_PACK_RULE_PRIORITY_MODEL.md) |
| Customer rule sandbox / pin / blast radius | **TB-1624** Done |

Pack evaluation architecture (**this contract**) is **orthogonal** to pre-finalize block vs advisory (**TB-1022**).

---

## CI anchors for **TB-1325**

| Anchor | Purpose |
| --- | --- |
| `POLICY_PACK_EVALUATION_COMPILED_VS_DATA_PLANE_CONTRACT.md` | Drift guard (this file) |
| `scripts/ci/check_policy_pack_evaluation_hybrid_honesty.py` | Fail compile-per-pack / pack-DSL / pack-equals-cert claims |
| Code presence | `RuleBasedDecisionEngine`, `TenantCuratedComplianceRulePackMerger`, `IDecisionRuleProvider`, ADR 0007, `POLICY_PACK_RULE_PRIORITY_MODEL.md` |

---

## Explicit non-claims

- Does not implement a new pack DSL or per-framework engine forks.
- Does not change default `PreCommitGateEnabled` (**TB-1022**).
- Does not reopen Done multi-cloud pack content **TB-701**–**TB-719**.
- Honesty CI shipped: **TB-1325** (`check_policy_pack_evaluation_hybrid_honesty.py`).

---

## Security · Scalability · Reliability · Cost

| Concern | Stance |
| --- | --- |
| **Security** | Data-plane rules stay declarative; no arbitrary code execution from pack JSON; blast radius stays assignment-scoped (**TB-1624**). |
| **Scalability** | Framework multiplication adds data + fixtures, not N deploy-coupled engines. |
| **Reliability** | `RuleSetHash` pins make commit-time evaluation reproducible; interpreter regressions are fleet-wide — keep one strong suite. |
| **Cost** | Content velocity via **G-CONTENT-01** avoids release-train tax of compile-per-pack. |

---

## Related

- GTM **M-235** / **M-236** / **M-298** / **M-299**
- [`architecture_quality_policy_engine_assessment.md`](../architecture/architecture_quality_policy_engine_assessment.md)
- Done **TB-1022** · Open **TB-1325** · **TB-1196**
