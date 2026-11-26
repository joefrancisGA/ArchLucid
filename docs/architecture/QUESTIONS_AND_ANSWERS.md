# ArchLucid / SecureNow — Architecture Questions and Answers

Living architectural examination and decision-development record. Initial compilation: 2026-11-25.

## Maintenance contract

For every completed ArchLucid / SecureNow architecture examination question, append a uniquely numbered entry to this document before moving on to the next examination question. Record the question, owner's answer (verbatim when available), assessment and level transition, architectural refinements, governing invariant, and related backlog IDs/PRs or explicitly outstanding work. Include unanswered or missed questions and the corrective lecture. Repeated prompts are not new entries. Preserve prior entries; do not silently rewrite the owner's answers. Clearly distinguish proposed design, verified implementation evidence, and backlog-only work. Record newly authorized backlog updates as follow-up annotations. Use the current repository revision and existing open documentation PR where appropriate; preserve the owner's merge authority. This is a documentation workflow, not authorization to implement or execute customer changes.

The questions and answers in the main log are taken from the available conversation; formatting and punctuation may be normalized. The earlier-topic appendix is reconstructed from summarized context, not an exact transcript. Scores are examination assessments, not product assurance or code-verification results.

## Completed examination log

### AQ-001 — Unsupported Azure resource types and analytical coverage

**Question (level 7):** Suppose Microsoft introduces a new Azure resource type with security characteristics that none of SecureNow's existing analytical engines understand. The resource is successfully discovered during inventory collection, but the security engines silently ignore it because they lack the necessary analytical capabilities. Consequently, the customer receives an apparently favorable security assessment despite a significant gap in coverage. How would you design a reusable architectural framework that automatically detects gaps between discovered infrastructure capabilities and available analytical capabilities, communicates those gaps honestly, and facilitates the systematic expansion of security coverage?

**Owner answer:**

> Well, I mean, I don't really have enough information to actually fix it. So, if we're lacking information on this, what I need to do is get human in the loop. There are limitations to AI technology, and it's not really here for making novel decisions. Having said that, I think I should make sure if I understand the network connections, put as much information out there as possible, and, you know, show the limitations in various Secure Now categories, represent that it's an unknown node type, show it in the diagrams, but, you know, just show it as an unknown, and make sure that it's notifying the Secure Now team as soon as possible, so we can develop a strategy to remediate this.

**Assessment:** 90%; level 7 → 8. Preserve discovered facts, known relationships and explicit limitations; involve engineering rather than inventing unsupported security conclusions.

**Refinement:** Shared versioned analytical capability registry; compare resource/property/security dimensions with engine support; distinguish evaluated, partial, unsupported, failed and not applicable. Show unknown resources in diagrams; report scope and coverage; deduplicated engineering escalation and governed coverage expansion.

**Invariant:** Unsupported is never implicitly secure.

**Backlog:** FND-103–106, [PR #8159](https://github.com/joefrancisGA/ArchLucid/pull/8159); builds on FND-003/017/038/077.

### AQ-002 — Historical impact of a defective analytical component

**Question (level 8):** Suppose a defect is discovered in a widely reused architectural component responsible for evaluating Azure identity permissions. Hundreds of previously issued security assessments may have been affected, but you do not know which conclusions were incorrect. How would you design an architectural framework that automatically identifies potentially affected historical findings, prioritizes their revalidation, and notifies affected customers without unnecessarily invalidating reliable assessments?

**Owner answer:**

> Well, if we have already implemented something that records intermediate results and reprocesses things for that component and upstream components, then we can automatically find those problems, and we should. But unless the outcome and the recommendations change, we have no reason to notify a client.

**Assessment:** 90%; level 8 → 9. Reuse historical intermediate results, dependency tracking and materiality-based notification.

**Refinement:** Reverse index component/version to affected assessments; reuse unaffected upstream stages and recompute defective stage plus affected downstream stages. Compare findings, severity, recommendations, confidence and coverage. Append corrections without rewriting original sealed results. Material loss of substantiation and contractual/regulatory duties can warrant notice even when recommendations do not change.

**Invariant:** A defect initiates scoped impact investigation, not indiscriminate invalidation.

**Backlog:** FND-107–111, [PR #8163](https://github.com/joefrancisGA/ArchLucid/pull/8163); FND-075/076/083/084/094–097 and TB-972–974 quality-gate migration.

### AQ-003 — Contradictory authoritative evidence

**Question (level 9):** Suppose two authoritative Azure evidence sources provide contradictory information about a customer's security configuration. One indicates that a storage account permits public access; the other indicates that public access is prohibited. Both sources are authenticated, and neither can immediately be dismissed as unreliable. The discrepancy could result from collection timing, configuration inheritance, eventual consistency or differing interpretations of the same security property. How would you design a reusable architectural framework that resolves contradictory evidence, establishes which assertions deserve greater authority, and prevents uncertain conclusions from being presented as established facts?

**Owner answer:**

> Well, if I have an LLM that's dislices some of the data, I can't rely on that as deterministic. So I would have to rely on a deterministic assessment. If the deterministic assessment cannot be done with the existing code base, then that's going to have to result in human in the loop. The assertions, if they are conflicting, the assertion that is the most severe and has the most drawbacks to the organization should be emphasized. But it should also be emphasized as inconclusive and offer more honest information to the stakeholder.

**Assessment:** 90%; level 9 → 10. Distinguish factual certainty from investigative urgency; deterministic evidence first; human adjudication for consequential unresolved conflicts.

**Refinement:** Property-specific source authority, scope, provenance, freshness, effective versus desired configuration, policy inheritance and bounded read-only reconciliation. Report competing assertions, potential consequences and verification steps; LLM suggestions cannot establish factual authority.

**Invariant:** Severity determines investigative priority, not factual authority.

**Backlog:** FND-112–116, [PR #8166](https://github.com/joefrancisGA/ArchLucid/pull/8166); FND-064/067/069–072/079/080.

### AQ-004 — Operational consequences of security remediation

**Question (level 10):** Suppose SecureNow correctly identifies a critical security vulnerability and recommends a remediation. However, implementing that remediation could interrupt a customer's mission-critical production application because of an operational dependency that SecureNow has not discovered. How would you architect a reusable framework that evaluates the potential operational consequences of security recommendations before presenting them to customers, particularly when dependency information is incomplete?

**Owner answer:**

> We already identified several parts of an integer algorithm that would help to determine appropriate courses of action. I think this is really just an extensible part of that. But I think we want to have certain default rules and allow the customers to adjust them. But we also, if the dependency information is complete, simply state that the dependency information is complete and allow the customer to drill down and get more information on it.

**Assessment:** 85%; level 10 retained. Extend existing mixed-integer portfolio optimization; customer defaults and adjustments; evidence drill-down. Missing: explicit response to incomplete dependencies.

**Refinement:** Operational dependency graph, scoped completeness assessment, counterfactual blast radius, governed hard constraints and customer preferences, uncertainty-aware optimization, lower-disruption alternatives, preflight/rollback and human review. Completeness must be qualified by actual discovery scope.

**Invariant:** Unknown operational risk is not zero risk; security improvement must not create unacceptable or insufficiently understood operational risk.

**Backlog:** FND-117–123, [PR #8166](https://github.com/joefrancisGA/ArchLucid/pull/8166); [portfolio optimization](REMEDIATION_PORTFOLIO_OPTIMIZATION.md), FND-087–093.

### AQ-005 — Cumulative security deterioration

**Question (level 10):** Suppose SecureNow discovers that a customer's security posture has gradually deteriorated over six months. No individual configuration change was sufficiently significant to trigger a critical alert. However, the cumulative effect of dozens of minor changes has created a substantial attack surface that did not previously exist. How would you design a reusable architectural framework that detects cumulative security deterioration, distinguishes meaningful trends from ordinary infrastructure fluctuations, and alerts customers before the accumulated risk becomes unacceptable?

**Owner answer:**

> Well, we have to determine cumulative, and it's about timing. So what I would actually want to do is have an event sync, call it Event Hub, whatever, Big Red. But what that would do is it sees changes to infrastructure, audits them against the potentially applicable attack paths, and reassesses only those parts that have an intermediary data that is affecting this path. If there is no material change in security, there's really nothing to say other than to log the action.

**Assessment:** 85%; level 10 retained. Event-driven changes, affected path mapping, selective recomputation and materiality-based alerting. Missing: longitudinal measurement.

**Refinement:** Reliable change ingestion and periodic reconciliation, versioned comparable baselines, deduplicated exposure history, rolling-window net deterioration, absolute/rate/persistence thresholds and hysteresis. Distinguish noise, estate growth and model/coverage changes. Event Hubs is an adapter candidate, not required new infrastructure.

**Invariant:** Individually immaterial changes can collectively constitute material security deterioration.

**Backlog:** FND-124–129, [PR #8170](https://github.com/joefrancisGA/ArchLucid/pull/8170); IE-06, SA-13, FND-083–086.

### AQ-006 — Temporal consistency of distributed evidence

**Question (level 10):** Suppose SecureNow collects security evidence from thousands of Azure resources. Different portions of the inventory are collected at different times, during which the customer's infrastructure continues changing. Consequently, the resulting architecture graph may describe a combination of configurations that never actually existed simultaneously. How would you design a reusable architectural framework that detects temporal inconsistencies, establishes the reliability of collected snapshots, and prevents attack-path conclusions based on incompatible observations?

**Owner answer:**

> Well, because it's continuing to evolve, we have to catch the evolutions. We already described an event-based mechanism. The event-based mechanism captures a snapshot of a combination of configurations at a point in time. Now, it is, of course, theoretically possible that things are changing so fast on a particular route, like, say, during a deployment, that we don't care. Okay. In fact, we may even want to have a facility for maintenance windows. Having said that, we know that things will stabilize eventually, and as a result, we simply work on what we know at the time through an event-based or time-based snapshot collections. And if we have incompatible observations based on temporal inconsistencies, well, simply we can't really say what the incompatible observations are, but if we cannot resolve them with an LLM, then we have to resort to deterministic means or be honest about what we cannot conclude successfully.

**Assessment:** 85%; level 10 retained. Reuse event/time collection, maintenance windows, and transparent limitations. Event collection does not guarantee atomic snapshots or eventual stabilization; deterministic reconciliation precedes LLM hypotheses.

**Refinement:** Observation times versus validity intervals, resource versions, event completeness, coherence classification, joint temporal compatibility of path predicates, bounded targeted recollection, maintenance-aware alert handling, downstream uncertainty propagation. Model sequential attack paths separately when their order and persistence prerequisites are supported. Never suppress actual critical exposure solely due to maintenance.

**Invariant:** Do not establish an attack path from unsupported or incompatible temporal observations.

**Backlog:** FND-130–135, [PR #8170](https://github.com/joefrancisGA/ArchLucid/pull/8170); FND-019/064/114/124–125.

### AQ-007 — Conditional risk acceptance and reconsideration

**Question (level 10):** Suppose a customer formally accepts the risk associated with a particular security vulnerability. Six months later, the vulnerability still exists, but changes elsewhere in the infrastructure have significantly increased its potential impact. The original risk acceptance remains active, causing the vulnerability to receive insufficient attention. How would you architect a reusable framework that automatically determines when previously accepted security risks require reconsideration, without unnecessarily reopening every historical risk acceptance decision?

**Owner answer:**

> Well, I'm monitoring changes in the architecture anyway, and I have the intermediate results. Okay, so that's helpful. But then what I want to do is recalculate from the intermediate result that this particular component has affected. And I'm not necessarily going to calculate it all the way to the end. What I really want to do is find out. I just want to calculate it to the point where I get intermediate results that differ from previous intermediate results. If the overall upstream previous intermediate results do not change, I drop it. If the previous intermediate results do change, I continue to calculate all the way to the end, or at least until the point where previous intermediate results converge.

**Assessment:** 85%; level 10 retained. Correct incremental computation and safe semantic convergence approach. Missing: governed risk acceptance lifecycle.

**Refinement:** Capture approved scope, baseline severity, reachability, asset criticality, compensating-control predicates, rationale and expiry. Revalidate affected conditions, including independent expiry/policy triggers; reopen for material change or insufficient substantiation, not blanket invalidation. Preserve original decision and require authorized fresh approval for renewal. Existing RiskExceptionRecord and TB-2193 expiry reminders are reuse anchors.

**Invariant:** Risk acceptance is conditional upon the continued validity of its supporting assumptions and approval.

**Backlog:** FND-136–140, [PR #8170](https://github.com/joefrancisGA/ArchLucid/pull/8170); TB-059/TB-2193, FND-083–086.

### AQ-008 — Systemic root causes and durable remediation

**Question (level 10):** Suppose SecureNow identifies 500 security vulnerabilities across a customer's infrastructure. Subsequent analysis reveals that 350 of them originate from a small number of defective shared Terraform modules. Remediating individual resources would be expensive, inefficient and potentially temporary, because subsequent deployments could recreate the vulnerabilities. How would you architect a reusable framework that identifies common systemic root causes, distinguishes them from individual resource defects, and recommends durable corrections at the appropriate architectural layer?

**Owner answer:**

> The point here is to understand really that an attack path consists of nodes and communications between the nodes. It's a graph algorithm, or a graph. So what we are looking at are problems with either the resource node or the communications between two resource nodes. So what we are going to do is we keep track of both the nodes and the connections, and as we compile our entire list of security remediation problems, we'll note some commonalities, and those are the nodes or communication paths that we actually want to remediate for the durable correction.

**Assessment:** 85%; level 10 retained. Identify common node/edge remediation opportunities. Distinguish shared exposure points from upstream causes.

**Refinement:** Extend graph with deployed-by, configured-by, governed-by and derived-from relations to versioned IaC modules, resolved inputs, pipelines and policy. Verify causal attribution independently; compare safe source-level and resource-level options, deduplicate benefit, and separately verify source correction, deployment, runtime effectiveness and recurrence prevention.

**Invariant:** Correct at the highest verified causal layer providing durable benefit without unacceptable operational consequences.

**Backlog:** FND-141–145, [PR #8182](https://github.com/joefrancisGA/ArchLucid/pull/8182); FND-088, SA-12, existing Terraform import and workbench. PR was open at compilation.

### AQ-009 — Second-order security and resilience risk

**Question (level 10):** Suppose SecureNow recommends a security control that successfully eliminates several known attack paths. However, the control itself introduces a new dependency upon a centralized identity service. That dependency creates a new concentration of risk and a potential single point of failure. How would you design a reusable architectural framework that detects second-order security and resilience risks introduced by otherwise beneficial security remediation recommendations?

**Owner answer:**

> I really have no idea.

**Assessment:** Level 10 → 9; no numeric score was recorded. Corrective lecture:

Treat every proposed remediation as a graph transformation in an isolated, pinned counterfactual state. Reassess eliminated and newly introduced attack paths; reassess shared failure domains, dependency concentration, redundancy and cascading failures; simulate unavailability and compromise of newly introduced services; compare alternatives with the existing constrained portfolio optimizer. Articulation points, dominators and minimum cuts may assist where the graph correctly represents directed dependency and failure semantics. A beneficial control can introduce identity-service compromise blast radius or a shared availability dependency; do not equate graph centrality with a demonstrated single point of failure.

**Invariant:** Every proposed security remediation should itself undergo security and resilience assessment.

**Backlog:** FND-146–150, [PR #8182](https://github.com/joefrancisGA/ArchLucid/pull/8182), added as Critical QA/stabilization following this question. FND-146 extends evidence-bound shared trust and failure-domain graph modeling; FND-147 covers counterfactual security/resilience deltas; FND-148 covers deterministic concentration and N-1/selective N-2 contingency evaluation; FND-149 integrates introduced risks into existing portfolio selection and safety gates; FND-150 covers independent regression and post-remediation assurance. Reuse foundations FND-045/088–093/117–123, TB-2412–2415 and SN-QA-04 rather than create parallel infrastructure. Backlog requirements only; no implementation or test execution is claimed.

### AQ-010 — Stateful logical feasibility of complete attack paths

**Question (level 9):** Suppose SecureNow identifies an attack path consisting of five individually verified graph edges. However, exploiting the first edge requires one identity, exploiting the second requires a different identity, and subsequent edges require permissions that neither identity possesses. Every individual edge is technically valid, but the complete attack path may be impossible to execute. How would you architect a reusable framework that verifies the logical feasibility of an entire attack path rather than merely establishing the validity of its individual nodes and edges?

**Owner answer:**

> Well, the attack path is not going to be feasible if it is executed with different identities. So we'll actually have to determine the identities and account for them when validating the attack path.

**Assessment:** 85%; level 9 retained. Correctly identified identity and permission continuity as essential to path feasibility. The same identity is not required throughout when an independently substantiated identity transition is achievable from the preceding state.

**Refinement:** Extend existing graph traversal with explicit security state: current identity, effective permissions and acquired capabilities, scoped resources, transition prerequisites, authorization/deny constraints, and temporal compatibility. Validate each transition against the preceding state and propagate only capabilities demonstrably acquired by that transition. Treat role assumption, managed identity access and other identity transitions as evidence-bound possibilities, not automatic identity substitution. Distinguish verified feasible, infeasible within tested scope, and inconclusive paths; retain evidence and bounded-search limitations. Use state-aware reachability with safe equivalence/pruning rather than independent edge validation; preserve relevant state differences to avoid false paths or missed feasible alternatives. No customer mutation.

**Invariant:** Every step in an attack path must be achievable from the security state established by preceding steps.

**Backlog:** FND-151–156, [PR #8188](https://github.com/joefrancisGA/ArchLucid/pull/8188), added as Critical QA/stabilization. FND-151 defines evidence-bound security state and transition contracts; FND-152 validates identity continuity and effective authorization; FND-153 checks whole-path feasibility; FND-154 covers bounded state-aware traversal, sound pruning and incremental reuse; FND-155 enforces path authority and evidence-linked reporting; FND-156 supplies independent reference-oracle regression assurance. Reuse existing SA-03/05/06/07/13, SecurityEvidencePath/hop, synthetic Azure worlds and FND-069/071/077/083/086/112–116/130–135. The documented SA-06 shared-identity/resource join and weakest-hop confidence are not by themselves proof of logical feasibility; current runtime coverage requires verification. Backlog requirements only, not implementation or test results.

### AQ-011 — Value-of-information-driven adaptive analysis and computational budgets

**Question (level 9):** Suppose SecureNow has identified a critical security exposure, but collecting enough additional evidence to establish its precise severity would require substantial computational resources, expensive AI processing and extensive Azure API calls. Meanwhile, hundreds of other potentially serious findings also require investigation. How would you architect a reusable framework that dynamically allocates analytical resources according to the expected value of obtaining additional information, while preventing computational budget constraints from concealing potentially critical security risks?

**Owner answer:**

> I think the real secret here is going to be combining the concepts of a zero trust model along with having some type of budget cap, the budget cap that you can tolerate most effectively. The budget cap could be discretionary. Where I suggest a zero trust model is that if you have something that seems suspicious, and you cannot establish that it is not suspicious, then you must continue to assign it the highest potential severity, but also assign a probability to it, or simply suggest that it is inconclusive. It is important to understand that some problems are intractable. That is, they are NP-complete. So you have to recognize NP-completeness and understand that, you know, it's okay to get it close on occasion. You don't need perfect security; you just need better security than the people that are attacking you.

**Assessment:** 85%; level 9 retained. Correctly identified governed discretionary budgets, conservative handling of unverified potential exposure, explicit inconclusive outcomes and practical bounded/approximate computation. The missing element is an explicit value-of-information scheduling method. Maximum plausible severity is an investigative priority bound, not confirmed severity; numerical probabilities require defensible calibration. NP-completeness is a worst-case complexity property, not proof that every instance is practically intractable. Risk adequacy is determined by customer objectives, obligations and residual exposure, not a claim of being more secure than attackers.

**Refinement:** Reuse existing adaptive analysis, verification, dependency, caching and budget infrastructure. Rank candidate read-only evidence acquisitions by estimated marginal decision value (e.g., reduction in uncertainty or avoidable decision loss) relative to cost; a simple priority heuristic is P_i = V_i / C_i for positive costs. Treat this as a heuristic rather than proof of optimal allocation. Where probability/utility calibration is unavailable, use explicit ordinal estimates, bounds or scenario-based priorities; do not invent probabilities. Account for dependent evidence, reusable results, diminishing returns, API quotas, compute/token/time limits, and tenant-scoped budget authorization. Reserve capacity and enforce mandatory investigation/escalation for materially plausible critical exposures, avoid starvation, and use cheap deterministic checks before expensive model calls where justified. Reprioritize as evidence arrives. Distinguish confirmed severity, plausible severity range, coverage, uncertainty, budget exhaustion and incomplete search; preserve unresolved exposure with evidence-linked next steps and human escalation, not a secure conclusion. Bounded search, heuristics and approximation must disclose limits and be independently validated. No customer mutation.

**Invariant:** Computational budget exhaustion must never convert an unresolved security exposure into an apparently secure condition.

**Backlog:** Related foundations FND-043/069–074/077/079/083–086/103–105/115–116/154 and TB-2411 (adaptive analysis depth/compute budgets), TB-2414 (information-gain investigation order). Dedicated value-of-information requirements and implementation coverage have not yet been checked for this question; no new backlog items are claimed.

## Earlier architecture exam topics — reconstructed appendix

These entries preserve accessible earlier context from the examination sequence. Exact wording and complete scores were not available for all entries; no quotations or invented scores are supplied. The questions are reconstructed summaries, not verbatim transcripts. They are ordered by topic/available sequence, not asserted exact timestamps. Backlog references are related requirements, not proof of implementation.

| ID | Reconstructed question | Owner response summary | Assessment/refinement and related work |
| --- | --- | --- | --- |
| AQ-R01 | How should tenant authorization be centralized and enforced across shared services? | Central authorization component with mandatory enforcement through interfaces/facades. | Authenticate and authorize before resource/cache/evidence access; explicit scope and fail-closed boundary. FND-061/068. |
| AQ-R02 | How should SQL tenant isolation be enforced? | Establish tenant context and enforce tenant filters; fail closed. | Verify every query path, pooled connection context and cross-tenant negative controls. FND-068. |
| AQ-R03 | How should common outbound transient failures be handled? | Bounded retries, backoff and circuit breaking. | Shared resilience with budgets, idempotency and failure visibility. FND-065/074. |
| AQ-R04 | How should findings from multiple engines be deduplicated? | Deterministic and semantic deduplication, with human adjudication. | Normalize identities, preserve provenance, distinguish uncertain matches and conflicting severity/remediation. FND-062/066/067. |
| AQ-R05 | How should centralized Azure acquisition and caching serve different tenants and freshness needs? | Tenant-separated cache; authenticate/authorize before any access; support no-cache and variable lifetimes. | 95%, level 5 → 6 (retrieved earlier assessment). Add request coalescing, explicit fresh bypass and timestamps. FND-061/063/064. |
| AQ-R06 | How should AI-generated security conclusions receive independent verification? | Owner did not know. | Corrective lecture: independent deterministic checks, bounded model challenge/human review, provider quality circuit breaker. FND-069–073. |
| AQ-R07 | How should partial analytical failures and recovery be handled? | Bounded retries, completion flag and durable checkpoints; dependency versions. | Distinguish partial success from complete assessment; resume affected stages, report coverage honestly. FND-074–077. |
| AQ-R08 | How should competing analysis engine versions be evaluated? | LLM judge for triage only; cheapest deterministic proof/disproof of disagreement; human engineering adjudication. | Pinned paired baselines, sample agreement checks, golden corpus and severity-weighted promotion gate. FND-078–082. |
| AQ-R09 | How should intermediate results support selective recomputation? | Dependency DAG, invalidate affected results, serialize intermediates where cost-effective. | Track negative dependencies, semantic early stop and full/incremental equivalence. FND-083–086. |
| AQ-R10 | How should remediation portfolios be mathematically optimized? | Proposed differential equations, adjustable weights, dependencies and explainability. | 80%, level 8 retained. Discrete action selection favors constrained mixed-integer/constraint optimization; clarify risk proxy, Pareto tradeoffs and independent verification. FND-087–093; [design](REMEDIATION_PORTFOLIO_OPTIMIZATION.md). |
| AQ-R11 | How can historical analysis be reproduced when a model or provider is retired? | Owner did not know. | Level 8 → 7. Separate sealed reconstruction, recorded-input deterministic replay and independent revalidation; preserve approved artifacts and retention constraints. FND-094–097; [design](HISTORICAL_ANALYTICAL_REPRODUCIBILITY.md). |

## Related records and limitations

- [Active technical backlog](../ACTIVE_TECHNICAL_BACKLOG.md) is authoritative for tracked work and priority.
- PR links identify the documentation changes that recorded the associated requirements; current merge/implementation status must be independently checked. No implementation or test-success claim is implied.
- The overlapping portfolio optimization prompt that the owner identified as a repeat was not counted as a separate completed question.
- Earlier exchanges not present in the available transcript or recovered summaries may need to be appended later if original material becomes available.
