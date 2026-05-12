# ArchLucid Assessment – Weighted Readiness 80.45%

## Executive Summary
**Overall Readiness:** ArchLucid possesses a rock-solid, architecturally sound foundation ready for V1.1 deployment. The core pilot path is exceptionally fast (<30 mins to value), but non-trivial adoption friction remains around policy pack authoring, enterprise integration mapping, and internal terminology leaking into the UX.
**Commercial Picture:** Time-to-value and proof-of-ROI are excellent. However, self-serve commercial momentum is artificially constrained by pending owner actions (Stripe/Marketplace un-hold) and the absence of a published reference customer to clear discount hurdles.
**Enterprise Picture:** The trust, traceability, and auditability posture is top-tier. Procurement accelerators and SOC 2 transparency are highly effective. The main enterprise blockers remain manual configuration for generic OIDC and draft-only accessibility compliance (VPAT). **Dry-run governance evaluation** now has **`POST /v1/policy-packs/simulate`** (May 2026); UI/policy-pack explain and config-lint dashboards reduce but do not eliminate “friendly” governance authoring gaps.
**Engineering Picture:** High architectural integrity, modularity, and security defaults. The strict dual-repository pattern and fail-closed LLM schema validations ensure correctness but increase cognitive load for contributors and brittleness against LLM hallucinations.

## Weighted Quality Assessment
*(Ordered from most urgent to least urgent based on Weighted Deficiency = Weight × (100 - Score))*

1. **Adoption Friction** | Score: 65 | Weight: 6 | Def: 210
   - **Justification:** Writing raw JSON for policy packs and manually configuring generic OIDC is tedious and error-prone.
   - **Tradeoffs:** UI complexity vs configuration flexibility.
   - **Recommendations:** Implement visual builders for policy packs and CLI linting tools.
   - **Status:** Fixable in V1.

2. **Correctness** | Score: 80 | Weight: 8 | Def: 160
   - **Justification:** Schema validations are strict and fail-closed, but lack auto-recovery for minor LLM JSON hallucinations, leading to batch failures.
   - **Tradeoffs:** Fail-closed strictness vs robust recovery.
   - **Recommendations:** Implement a secondary "fix JSON" LLM pass before hard failures.
   - **Status:** Fixable in V1.

3. **Marketability** | Score: 80 | Weight: 8 | Def: 160
   - **Justification:** High ROI, but lacks out-of-the-box accelerator templates to demonstrate diverse infrastructure architectures quickly.
   - **Tradeoffs:** Focus on core engine vs content generation.
   - **Recommendations:** Build a quick-start JSON template library for context ingestion.
   - **Status:** Fixable in V1.

4. **AI/Agent Readiness** | Score: 80 | Weight: 8 | Def: 160
   - **Justification:** Excellent architecture, but `StagedCriticEnabled` adds wall-clock latency; pattern-level **custom agent handler** documentation is **committed for V1 GA** ([`V1_SCOPE.md` §2.18](../library/V1_SCOPE.md)) and remains a delivery gap until published.
   - **Tradeoffs:** Execution speed vs thorough critic context.
   - **Recommendations:** Surface agent stage latencies to operators to justify the wait.
   - **Status:** Fixable in V1.

5. **Time-to-Value** | Score: 80 | Weight: 7 | Def: 140
   - **Justification:** Core pilot is fast, but configuring surrounding context slows full realization.
   - **Tradeoffs:** Simple default paths vs deep enterprise integration.
   - **Recommendations:** Add an "Explain this Policy" endpoint to speed up understanding.
   - **Status:** Fixable in V1.

6. **Usability** | Score: 70 | Weight: 3 | Def: 90
   - **Justification:** "Coordinator vs Authority" terminology leaks into the UX.
   - **Tradeoffs:** Accurate domain modeling vs user simplicity.
   - **Recommendations:** Streamline operator shell UI terms to "Review Pipeline".
   - **Status:** Fixable in V1.

7. **Executive Value Visibility** | Score: 80 | Weight: 4 | Def: 80
   - **Justification:** First-value PDF is great, but could better summarize cross-run trend lines.
   - **Tradeoffs:** Report generation cost vs executive appeal.
   - **Recommendations:** Pin ROI metrics directly to the primary operator dashboard.
   - **Status:** Fixable in V1.

8. **Differentiability** | Score: 80 | Weight: 4 | Def: 80
   - **Justification:** Unique approach, but competitors might copy "LLM for architecture".
   - **Tradeoffs:** Developing proprietary IP vs rapid iteration.
   - **Recommendations:** Highlight the deterministic Golden Manifest merge in marketing UI.
   - **Status:** Fixable in V1.

9. **Proof-of-ROI Readiness** | Score: 85 | Weight: 5 | Def: 75
   - **Justification:** `PilotRunDeltasResponse` exists but lacks prominence.
   - **Tradeoffs:** Dashboard clutter vs commercial visibility.
   - **Recommendations:** Surface pilot run deltas proactively in the UI header.
   - **Status:** Fixable in V1.

10. **Workflow Embeddedness** | Score: 75 | Weight: 3 | Def: 75
    - **Justification:** Status-only ITSM sync lacks deep evidence linking.
    - **Tradeoffs:** Implementation speed vs deep integration.
    - **Recommendations:** Enrich outbound payloads with specific trace deep-links.
    - **Status:** Fixable in V1.

11. **Decision Velocity** | Score: 75 | Weight: 2 | Def: 50
    - **Justification:** Blocked by manual sales motions for Team tier.
    - **Tradeoffs:** Hand-holding vs scaling sales.
    - **Recommendations:** Un-hold Stripe/Marketplace rails.
    - **Status:** Blocked on user input.

12. **Commercial Packaging Readiness** | Score: 75 | Weight: 2 | Def: 50
    - **Justification:** Waiting on owner actions for live Stripe keys.
    - **Tradeoffs:** Safety vs revenue velocity.
    - **Recommendations:** Complete Partner Center verification.
    - **Status:** Blocked on user input.

13. **Security** | Score: 85 | Weight: 3 | Def: 45
    - **Justification:** Strong defaults, but Content Safety could fail silently on misconfig.
    - **Tradeoffs:** Fail-closed strictness vs uptime.
    - **Recommendations:** Add a dedicated health probe for Azure Content Safety.
    - **Status:** Fixable in V1.

14. **Trustworthiness** | Score: 85 | Weight: 3 | Def: 45
    - **Justification:** Excellent transparency, but SOC 2 Type I/II and Pen-Tests are pending.
    - **Tradeoffs:** Security rigor vs speed to market.
    - **Recommendations:** Execute the third-party pen test SoW.
    - **Status:** Better suited for V2.

15. **Policy and Governance Alignment** | Score: 80 | Weight: 2 | Def: 40
    - **Justification:** Robust rules, but lacks "Dry Run" capabilities.
    - **Tradeoffs:** Compute cost vs operator safety.
    - **Recommendations:** Add a policy simulation endpoint.
    - **Status:** Fixable in V1.

16. **Compliance Readiness** | Score: 80 | Weight: 2 | Def: 40
    - **Justification:** Strong self-assessment, but needs auto-purge for funnel events.
    - **Tradeoffs:** Data retention vs data minimization.
    - **Recommendations:** Implement auto-purge for `FirstTenantFunnelEvents`.
    - **Status:** Fixable in V1.

17. **Interoperability** | Score: 80 | Weight: 2 | Def: 40
    - **Justification:** Good webhooks, but missing rate limit headers for clients.
    - **Tradeoffs:** Bandwidth vs developer experience.
    - **Recommendations:** Inject `X-Rate-Limit-Remaining` headers.
    - **Status:** Fixable in V1.

18. **Reliability** | Score: 90 | Weight: 2 | Def: 20
    - **Justification:** Resilient processing pipeline with strong failure handling; multi-replica cache coherence is explicitly scoped to V1.1 (see deployment guidance), not a V1 readiness deduction.
    - **Tradeoffs:** V1 deployment simplicity vs horizontal scale-out coherence (deferred).
    - **Recommendations:** For V1.1: Azure Cache for Redis (or equivalent), startup warnings when memory cache is used with replica count > 1, and documented invalidation patterns.
    - **Status:** Better suited for V1.1 (multi-replica coherent caching).

19. **Maintainability** | Score: 80 | Weight: 2 | Def: 40
    - **Justification:** Dual repository patterns increase code duplication.
    - **Tradeoffs:** Abstraction purity vs maintenance cost.
    - **Recommendations:** Unify overlapping interfaces in `ArchLucid.Core`.
    - **Status:** Better suited for V1.1.

20. **Explainability** | Score: 80 | Weight: 2 | Def: 40
    - **Justification:** Excellent graph explanations, but raw JSON policies are opaque.
    - **Tradeoffs:** Determinism vs human readability.
    - **Recommendations:** Add LLM-generated summaries for policy packs.
    - **Status:** Fixable in V1.

21. **Cognitive Load** | Score: 65 | Weight: 1 | Def: 35
    - **Justification:** Complex internal taxonomy for contributors.
    - **Tradeoffs:** Architectural precision vs onboarding speed.
    - **Recommendations:** Simplify namespace mappings and naming conventions.
    - **Status:** Better suited for V1.1.

22. **Accessibility** | Score: 65 | Weight: 1 | Def: 35
    - **Justification:** Draft VPAT lacks manual WCAG evaluations.
    - **Tradeoffs:** Development speed vs compliance.
    - **Recommendations:** Complete manual VPAT evaluations.
    - **Status:** Blocked on user input.

23. **Template and Accelerator Richness** | Score: 65 | Weight: 1 | Def: 35
    - **Justification:** Missing out-of-the-box templates for rapid pilot ingestion.
    - **Tradeoffs:** Product focus vs content library.
    - **Recommendations:** Ship a default templates folder with standard architectures.
    - **Status:** Fixable in V1.

24. **Traceability** | Score: 90 | Weight: 3 | Def: 30
    - **Justification:** State-of-the-art graph and decision traces.
    - **Tradeoffs:** Storage cost vs auditability.
    - **Recommendations:** Passthrough TraceIds to inbound webhooks.
    - **Status:** Fixable in V1.

25. **Architectural Integrity** | Score: 90 | Weight: 3 | Def: 30
    - **Justification:** Highly disciplined strangler pattern and modularity.
    - **Tradeoffs:** Overhead in enforcing invariants.
    - **Recommendations:** Maintain current trajectory.
    - **Status:** Maintain.

26. **Data Consistency** | Score: 85 | Weight: 2 | Def: 30
    - **Justification:** Strong orphan probes, but manual fixes required.
    - **Tradeoffs:** Auto-quarantine risks vs consistency.
    - **Recommendations:** Add bulk-remediation scripts.
    - **Status:** Fixable in V1.1.

27. **Customer Self-Sufficiency** | Score: 75 | Weight: 1 | Def: 25
    - **Justification:** High reliance on documentation rather than in-app guidance.
    - **Tradeoffs:** UX complexity vs capability.
    - **Recommendations:** Enhance UI tooltips and linting dashboards.
    - **Status:** Fixable in V1.

28. **Stickiness** | Score: 75 | Weight: 1 | Def: 25
    - **Justification:** Requires deep integration to become indispensable.
    - **Tradeoffs:** Standalone value vs embedded value.
    - **Recommendations:** Deepen Jira/ServiceNow integrations.
    - **Status:** Fixable in V1.

29. **Extensibility** | Score: 80 | Weight: 1 | Def: 20
    - **Justification:** Handler registration architecture supports extension; **V1 GA** commits to publishing pattern-level custom handler docs per [`V1_SCOPE.md` §2.18](../library/V1_SCOPE.md) (distinct from a public plugin SDK).
    - **Tradeoffs:** Security boundaries vs openness.
    - **Recommendations:** Ship the §2.18 guide and link it from the onboarding spine / [`Navigation.mdc`](../../.cursor/rules/Navigation.mdc).
    - **Status:** Fixable in V1.

30. **Auditability** | Score: 90 | Weight: 2 | Def: 20
    - **Justification:** Comprehensive typed audit events.
    - **Tradeoffs:** Performance vs compliance.
    - **Recommendations:** Maintain current trajectory.
    - **Status:** Maintain.

31. **Procurement Readiness** | Score: 90 | Weight: 2 | Def: 20
    - **Justification:** CLI procurement pack is world-class.
    - **Tradeoffs:** Maintenance of templates vs buyer trust.
    - **Recommendations:** None required.
    - **Status:** Maintain.

32. **Azure Compatibility and SaaS Deployment** | Score: 90 | Weight: 2 | Def: 20
    - **Justification:** Native fit for Azure Container Apps and SQL.
    - **Tradeoffs:** Vendor lock-in vs depth of integration.
    - **Recommendations:** Add Terraform format checking to advisory outputs.
    - **Status:** Fixable in V1.

33. **Change Impact Clarity** | Score: 80 | Weight: 1 | Def: 20
    - **Justification:** Drift analysis is good, but lacks predictive "what-if" models.
    - **Tradeoffs:** Compute overhead vs operator confidence.
    - **Recommendations:** Implement policy simulation endpoint.
    - **Status:** Fixable in V1.

34. **Availability** | Score: 80 | Weight: 1 | Def: 20
    - **Justification:** 99.9% target is solid, but depends on Azure regional stability.
    - **Tradeoffs:** Multi-region cost vs uptime.
    - **Recommendations:** None required.
    - **Status:** Maintain.

35. **Performance** | Score: 80 | Weight: 1 | Def: 20
    - **Justification:** Staged critic adds wall-clock latency.
    - **Tradeoffs:** Speed vs output quality.
    - **Recommendations:** Optimize agent parallelization where possible.
    - **Status:** Fixable in V1.

36. **Scalability** | Score: 80 | Weight: 1 | Def: 20
    - **Justification:** 52MB limit on Extractor uploads blocks large enterprises.
    - **Tradeoffs:** DOS protection vs scale.
    - **Recommendations:** Implement chunked uploads.
    - **Status:** Fixable in V1.

37. **Manageability** | Score: 80 | Weight: 1 | Def: 20
    - **Justification:** Configuration is exhaustive but lacks UI visibility.
    - **Tradeoffs:** CLI focus vs UI ease.
    - **Recommendations:** Implement Config Linting Dashboard.
    - **Status:** Fixable in V1.

38. **Cost-Effectiveness** | Score: 80 | Weight: 1 | Def: 20
    - **Justification:** Daily budgets and cost estimation are functional.
    - **Tradeoffs:** Over-budgeting vs service interruption.
    - **Recommendations:** Maintain current trajectory.
    - **Status:** Maintain.

39. **Supportability** | Score: 85 | Weight: 1 | Def: 15
    - **Justification:** Correlation IDs are well-implemented.
    - **Tradeoffs:** Log volume vs debuggability.
    - **Recommendations:** Push TraceIds to inbound webhooks.
    - **Status:** Fixable in V1.

40. **Deployability** | Score: 85 | Weight: 1 | Def: 15
    - **Justification:** Docker and Terraform are solid.
    - **Tradeoffs:** Infrastructure complexity.
    - **Recommendations:** Maintain current trajectory.
    - **Status:** Maintain.

41. **Observability** | Score: 85 | Weight: 1 | Def: 15
    - **Justification:** OTLP and Prometheus integrations are strong.
    - **Tradeoffs:** Metric cardinality vs visibility.
    - **Recommendations:** Surface agent stage latencies in UI.
    - **Status:** Fixable in V1.

42. **Modularity** | Score: 85 | Weight: 1 | Def: 15
    - **Justification:** Namespaces and layers are strictly separated.
    - **Tradeoffs:** Boilerplate vs clean architecture.
    - **Recommendations:** Maintain current trajectory.
    - **Status:** Maintain.

43. **Evolvability** | Score: 85 | Weight: 1 | Def: 15
    - **Justification:** API versioning is robust.
    - **Tradeoffs:** Backward compatibility vs rapid iteration.
    - **Recommendations:** Maintain current trajectory.
    - **Status:** Maintain.

44. **Testability** | Score: 90 | Weight: 1 | Def: 10
    - **Justification:** Excellent contract testing and in-memory repositories.
    - **Tradeoffs:** Maintenance of test doubles.
    - **Recommendations:** Maintain current trajectory.
    - **Status:** Maintain.

45. **Documentation** | Score: 90 | Weight: 1 | Def: 10
    - **Justification:** Exhaustive markdown spine and runbooks.
    - **Tradeoffs:** Documentation drift vs comprehensiveness.
    - **Recommendations:** Publish the **V1 GA** custom agent handler guide ([`V1_SCOPE.md` §2.18](../library/V1_SCOPE.md)); otherwise maintain current trajectory.
    - **Status:** Maintain.

46. **Azure Ecosystem Fit** | Score: 90 | Weight: 1 | Def: 10
    - **Justification:** Perfect alignment with Azure services.
    - **Tradeoffs:** Vendor lock-in.
    - **Recommendations:** Maintain current trajectory.
    - **Status:** Maintain.

## Top 11 Most Important Weaknesses
*(Cross-cutting weaknesses ranked from most serious to least serious; multi-replica coherent caching is V1.1 scope and omitted here. Items **2, 5,** and **8** have engineering mitigations since this list was drafted—see §Top 25 **✅ COMPLETED** entries.)*
1. Lack of self-serve GUI for authoring complex JSON configurations (policy packs, infrastructure declarations).
2. "Fail-closed" brittleness in LLM schema validations without auto-recovery or fallback loops. **→ Mitigated:** schema-completion remediation loop (not a substitute for UX/guardrail review).
3. Complex domain nomenclature ("Coordinator", "Authority", "Golden Manifest") leaking into operator UX.
4. Blocked commercial self-service due to deferred Stripe/Marketplace activation.
5. Missing out-of-the-box template libraries for quick-start context ingestion. **→ Mitigated:** `templates/context-ingestion/` + `archlucid templates list` (still not a visual builder).
6. Shallow ITSM integration (status-only) that fails to leverage deep reasoning trace data.
7. Cognitive load on contributors due to dual repository patterns (Decisioning vs Persistence).
8. Lack of "Dry Run" capabilities for evaluating the impact of policy changes on past architectures. **→ Mitigated:** `POST /v1/policy-packs/simulate` (governance dry-run parity).
9. Absence of a **published** custom agent handler guide — **in V1 GA documentation scope** ([`V1_SCOPE.md` §2.18](../library/V1_SCOPE.md)); advanced integrators still rely on reading source until it ships.
10. Manual accessibility compliance checks (VPAT drafts) creating enterprise procurement friction.
11. Hard limits on Azure Extractor ingestion (52MB) without chunked upload support for large environments.

## Top 5 Monetization Blockers
1. Stripe live keys and Azure Marketplace offer publication deferred (owner gate).
2. Absence of a named, published reference customer to unlock the 15% reference discount hurdle.
3. Limited template accelerators, making it harder for prospects to quickly test complex architectures.
4. Adoption friction in policy pack creation, delaying full enterprise rollout.
5. High cognitive load for buyers translating ArchLucid's internal terminology into their own value streams.

## Top 6 Enterprise Adoption Blockers
1. Missing SOC 2 Type I/II CPA attestation (despite strong self-assessment), adding InfoSec friction.
2. Lack of a user-friendly UI for defining and testing Governance Policy Packs. **→ Partial:** explain + simulate + CLI validate shrink risk; authoring remains JSON-first.
3. Manual configuration required for generic OIDC integration, slowing down SSO onboarding.
4. Accessibility compliance (VPAT) is draft-only and relies on manual evaluations.
5. No "What-If" impact analysis for deploying new governance rules across existing architecture runs. **→ Partial:** `POST /v1/policy-packs/simulate` covers proposed pack content vs a run under scope; broader portfolio “what-if” may still be out of scope.
6. Status-only Jira/ServiceNow sync means developers must context-switch into ArchLucid to read findings.

## Top 6 Engineering Risks
1. Strict schema parsing for Agent Results fails the entire batch if the LLM hallucinates JSON. **→ Mitigated** by remediation / secondary completion attempts (`LlmAgentSchemaCompletion`); batch failure risk is reduced, not eliminated.
2. Multi-replica deployments with in-memory hot-path caching require Redis (or equivalent) for coherence—tracked for V1.1, not treated as a V1 engineering gap for readiness scoring.
3. The 52MB file size limit on Azure Extractor ZIP uploads is a cliff for very large Azure subscriptions.
4. Dual data access interfaces (Decisioning vs Persistence) risk drift and implementation errors.
5. `StagedCriticEnabled` sequentially blocks the final critic agent, increasing wall-clock latency.
6. The absence of automated `terraform fmt` checking for advisory snippets could lead to un-apply-able recommendations.

## Most Important Truth
ArchLucid is architecturally pristine and technically ready for early adopters, but its commercial velocity is artificially constrained by pending owner actions (Stripe/Marketplace un-hold) and a steep configuration learning curve that trades user-friendly onboarding for enterprise flexibility.

## Top 25 Improvement Opportunities
*(Ranked in order of highest leverage)*

**Engineering status (May 2026):** Items **2, 3, 5, 7, 17,** and **18** are **completed in-repo** (see bullets below). Remaining numbered items below are still actionable unless marked **DEFERRED** or **V1.1**.

1. **DEFERRED Un-hold Commerce Rails (Stripe & Marketplace)**
   - **Why it matters:** Blocks self-serve revenue.
   - **Expected impact:** Direct path to revenue.
   - **Affected qualities:** Commercial Packaging Readiness, Decision Velocity.
   - **DEFERRED:** Requires owner to activate live keys and publish in Partner Center.

2. **Add Policy Pack JSON Validation CLI Command** — **✅ COMPLETED**
   - **Why it matters:** Reduces adoption friction by catching errors before upload.
   - **Expected impact:** Smoother policy iteration. Directly improves Adoption Friction (+3-5 pts) and Usability (+2-4 pts). Weighted readiness impact: +0.2%.
   - **Affected qualities:** Adoption Friction, Usability.
   - **Shipped:** `archlucid policy-pack validate <file.json>` in `ArchLucid.Cli` (deserialize + FluentValidation + exit codes). Tests: `ArchLucid.Cli.Tests/PolicyValidateCommandTests.cs`.

3. **Implement Auto-Recovery for LLM JSON Parse Failures** — **✅ COMPLETED**
   - **Why it matters:** Prevents run failure due to minor LLM JSON hallucinations.
   - **Expected impact:** Higher resilience. Directly improves Correctness (+5-8 pts), Reliability (+4-6 pts). Weighted readiness impact: +0.6-0.8%.
   - **Affected qualities:** Correctness, AI/Agent Readiness.
   - **Shipped:** Orchestrated remediation / retry coverage in `LlmAgentSchemaCompletion` for schema violations, validation failures, and retryable parse-related failures (`ArchLucid.AgentRuntime`); options documented on `AgentSchemaRemediationOptions`. Tests: `ArchLucid.AgentRuntime.Tests/LlmAgentSchemaCompletionTests.cs`. *(Original sketch named `AzureOpenAiCompletionClient` only; recovery spans the completion + schema-completion path.)*

4. **DEFERRED Attest SOC 2 Type I/II**
   - **Why it matters:** Hard blocker for strict enterprise procurement.
   - **Expected impact:** Faster InfoSec reviews.
   - **Affected qualities:** Trustworthiness, Procurement Readiness.
   - **DEFERRED:** Requires external CPA engagement and budget sign-off.

5. **Create Template Library for Context Ingestion** — **✅ COMPLETED**
   - **Why it matters:** Accelerates trial users.
   - **Expected impact:** Lower time-to-value. Directly improves Template Richness (+10-15 pts), Time-to-Value (+5-7 pts). Weighted readiness impact: +0.4-0.6%.
   - **Affected qualities:** Template and Accelerator Richness, Time-to-Value.
   - **Shipped:** `templates/context-ingestion/` (README + sample JSON payloads) and `archlucid templates list` (`TemplatesListCommand`). Cross-link from `templates/architecture-requests/README.md`.

6. **Enrich ITSM Outbound Webhooks with Trace Deep-Links**
   - **Why it matters:** Developers need context, not just statuses.
   - **Expected impact:** Higher embeddedness. Directly improves Workflow Embeddedness (+8-12 pts). Weighted readiness impact: +0.2-0.3%.
   - **Affected qualities:** Workflow Embeddedness.
   - **Actionable:** Update `ItsmOutboundService` to include a UI deep-link to the specific finding/trace node in the Jira/ServiceNow description using `ArchLucid:PublicSite:BaseUrl`.

7. **Add "Dry Run" Endpoint for Policy Pack Assignments** — **✅ COMPLETED**
   - **Why it matters:** Operators need to safely test governance changes.
   - **Expected impact:** Safer governance iteration. Directly improves Change Impact Clarity (+6-10 pts), Usability (+4-6 pts). Weighted readiness impact: +0.3-0.5%.
   - **Affected qualities:** Policy and Governance Alignment, Change Impact Clarity.
   - **Shipped:** `POST /v1/policy-packs/simulate` (`PolicyPackSimulateRequest` + FluentValidation); evaluates via `IPolicyPackGovernanceDryRunService` and returns `PolicyPackGovernanceDryRunResult` (parity with `POST /v1/governance/policy-packs/dry-run`). Documented in `docs/library/API_CONTRACTS.md`. *(Original draft said `PolicySimulationResult`; wire type is the governance dry-run result DTO.)*

8. **Add Chunked Uploads to Azure Extractor Ingest**
   - **Why it matters:** The 52MB limit blocks massive Azure accounts.
   - **Expected impact:** Enterprise scalability. Directly improves Scalability (+5-10 pts), Interoperability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
   - **Affected qualities:** Scalability, Customer Self-Sufficiency.
   - **Actionable:** Update `AzureExtractorController` to accept chunked uploads to bypass `RequestSizeLimit`. Store chunks in a temporary Blob path, assemble on completion, then parse `manifest.json`.

9. **DEFERRED Secure First Public Reference Customer**
   - **Why it matters:** Clears the 15% discount hurdle.
   - **Expected impact:** Increased list price defensibility.
   - **Affected qualities:** Differentiability, Proof-of-ROI Readiness.
   - **DEFERRED:** Requires product marketing to sign and publish a customer case study.

10. **Unify Decisioning and Persistence Repository Interfaces**
    - **Why it matters:** Dual interfaces increase cognitive load.
    - **Expected impact:** Faster contributor onboarding. Directly improves Cognitive Load (+15-20 pts), Maintainability (+5-8 pts). Weighted readiness impact: +0.3-0.4%.
    - **Affected qualities:** Cognitive Load, Maintainability.
    - **Actionable:** Refactor `IGoldenManifestRepository` to a single unified interface in `ArchLucid.Core`. Eliminate duplicate namespace declarations and map Dapper implementations to satisfy both patterns.

11. **Publish Custom Agent Handler Documentation (V1 GA)**
    - **Why it matters:** Advanced customers need an explicit pattern for handler registration and safety boundaries without spelunking the codebase.
    - **Expected impact:** Extensibility (+10-15 pts), Documentation (+3-5 pts). Weighted readiness impact: ~+0.15%.
    - **Affected qualities:** Extensibility, Documentation.
    - **Actionable:** Author `docs/library/` guide per [`V1_SCOPE.md` §2.18](../library/V1_SCOPE.md): prerequisites, orchestration alignment, DI registration expectations, authority/safety posture, versioning; reference in-repo handlers as examples; link from [`FIRST_5_DOCS.md`](../FIRST_5_DOCS.md) spine or [`Navigation.mdc`](../../.cursor/rules/Navigation.mdc). **Out of scope for this deliverable:** plugin marketplace, new public HTTP contracts — see **speculative ecosystem** row in [`V1_SCOPE.md` §3](../library/V1_SCOPE.md).

12. **Pin ROI Metrics on the Operator Dashboard**
    - **Why it matters:** Keeps the value proposition visible.
    - **Expected impact:** Higher executive value visibility. Directly improves Proof-of-ROI Readiness (+5-8 pts), Executive Value Visibility (+5-8 pts). Weighted readiness impact: +0.6-0.8%.
    - **Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility.
    - **Actionable:** Update the `archlucid-ui` `/runs` dashboard header to display `timeToCommittedManifestTotalSeconds` and LLM call counts prominently, fetched from `PilotRunDeltasResponse`.

13. **Implement Auto-Purge for `FirstTenantFunnelEvents`**
    - **Why it matters:** Data minimization hygiene.
    - **Expected impact:** Compliance. Directly improves Compliance Readiness (+4-6 pts), Manageability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Compliance Readiness, Manageability.
    - **Actionable:** Create a background job `FirstTenantFunnelPurgeJob` in `ArchLucid.Worker` that hard deletes rows in `dbo.FirstTenantFunnelEvents` older than `ArchLucid:Retention:FunnelEventsDays`.

14. **Add Terraform Format Checking to Advisory Emissions**
    - **Why it matters:** Prevents invalid Terraform code from being suggested.
    - **Expected impact:** Reliability of outputs. Directly improves Correctness (+3-5 pts), Azure Ecosystem Fit (+2-4 pts). Weighted readiness impact: +0.3-0.5%.
    - **Affected qualities:** Correctness, Azure Compatibility.
    - **Actionable:** Integrate a lightweight local `terraform fmt` shell call in `ArchLucid.ArtifactSynthesis` when emitting Terraform advisory snippets. If the format fails, wrap the output in a generic comment.

15. **Add `X-Rate-Limit-Remaining` Headers**
    - **Why it matters:** Improves API developer experience.
    - **Expected impact:** Better integrability. Directly improves Interoperability (+5-8 pts), Usability (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
    - **Affected qualities:** Interoperability, Usability.
    - **Actionable:** Configure the ASP.NET Core RateLimiting middleware in `ArchLucid.Api/Startup` to inject `X-Rate-Limit-Remaining` and `X-Rate-Limit-Reset` headers on all restricted routes.

16. **DEFERRED Complete VPAT 2.4 WCAG 2.1 AA Manual Evaluations**
    - **Why it matters:** Blocked enterprise sales.
    - **Expected impact:** Procurement unblocking.
    - **Affected qualities:** Accessibility.
    - **DEFERRED:** Requires human accessibility auditor to perform manual UI testing.

17. **Implement Config Linting Dashboard in Operator UI** — **✅ COMPLETED**
   - **Why it matters:** Surface misconfigurations to admins visually.
   - **Expected impact:** Faster troubleshooting. Directly improves Manageability (+8-12 pts), Supportability (+5-8 pts). Weighted readiness impact: +0.2-0.3%.
   - **Affected qualities:** Manageability, Supportability.
   - **Shipped:** `GET /v1/admin/config-lint` (blocking + advisory via `OperatorConfigurationLintEvaluator`; `includeAdvisory` query flag). Operator UI: **Environment health (config lint)** card on `/admin/configuration`. CLI parity: shared evaluator with `archlucid config lint`. See `docs/library/API_CONTRACTS.md` and `CONFIGURATION_REFERENCE.md`.

18. **Add Explanatory Summaries to Policy Packs via LLM** — **✅ COMPLETED**
   - **Why it matters:** JSON policies are hard to read.
   - **Expected impact:** Lower adoption friction. Directly improves Usability (+6-10 pts), Explainability (+4-6 pts). Weighted readiness impact: +0.3-0.5%.
   - **Affected qualities:** Usability, Explainability.
   - **Shipped:** `GET /v1/policy-packs/{policyPackId}/explain` returns Markdown (`PolicyPackMarkdownExplainService`). Tests: `PolicyPackExplainEndpointTests`.

19. **Rename "Coordinator" to "Pipeline" in UI**
    - **Why it matters:** Internal architecture terms confuse users.
    - **Expected impact:** Lower cognitive load for operators. Directly improves Usability (+5-8 pts), Cognitive Load (+10-15 pts). Weighted readiness impact: +0.2-0.4%.
    - **Affected qualities:** Cognitive Load, Usability.
    - **Actionable:** Search `archlucid-ui` for instances of "Coordinator" and "Authority" visible in the DOM. Replace with "Review Pipeline" and "Commit Engine". Do not change API endpoints or code variables.

20. **Add Health Probe for Azure Content Safety**
    - **Why it matters:** Fails fast on misconfiguration.
    - **Expected impact:** Better reliability. Directly improves Reliability (+3-5 pts), Security (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Reliability, Security.
    - **Actionable:** Add an `IHealthCheck` implementation for `ArchLucid:ContentSafety`. It should ping the endpoint using the API key on startup to verify access and register in the `HealthChecks` builder.

21. **V1.1 — Multi-Replica Cache Coherence (Redis + Invalidation)**
    - **Why it matters:** Horizontal scale-out needs a shared cache or explicit invalidation; V1 targets supported topologies without scoring penalty for future multi-replica breadth.
    - **Expected impact:** Safe scale-out. Directly improves Scalability (+5-8 pts), Reliability (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Scalability, Reliability.
    - **Actionable (V1.1):** Introduce Azure Cache for Redis (or equivalent) for hot-path caching when replica count > 1; optionally log a startup warning if `HotPathCache:Provider=Memory` and replicas > 1 until Redis is configured. Document supported V1 vs V1.1 deployment models.

22. **DEFERRED Third-Party Pen Test Execution**
    - **Why it matters:** Enterprise trust.
    - **Expected impact:** Clears trust discounts.
    - **Affected qualities:** Trustworthiness.
    - **DEFERRED:** Requires engaging a vendor and completing the SoW.

23. **Add TraceId Passthrough to Inbound ITSM Webhooks**
    - **Why it matters:** End-to-end debugging.
    - **Expected impact:** Supportability. Directly improves Supportability (+4-6 pts), Observability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Supportability, Observability.
    - **Actionable:** Update `JiraWebhookController` and `ServiceNowWebhookController` to read `X-Correlation-ID` from the incoming request and push it into the ambient `TraceContext` or Serilog `LogContext`.

24. **Streamline Generic OIDC Configuration in UI**
    - **Why it matters:** Currently requires raw JSON/env config.
    - **Expected impact:** Enterprise adoption. Directly improves Manageability (+5-8 pts), Adoption Friction (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
    - **Affected qualities:** Adoption Friction, Manageability.
    - **Actionable:** Add an "Identity Providers" settings page in `archlucid-ui` that visualizes the current `ArchLucidAuth:Authority` and `ArchLucidAuth:Audience` settings. (Read-only initially).

25. **Surface Agent Stage Latencies in UI**
    - **Why it matters:** Explains pipeline delays to users.
    - **Expected impact:** User trust and patience. Directly improves Usability (+4-6 pts), Observability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Observability, Usability.
    - **Actionable:** Update the `archlucid-ui` Pipeline timeline component to display the wall-clock execution time for each agent stage based on the task start/end timestamps from the API.

## Prompt Batching Guidance
- **Batch 1 (Quick UI & Feedback wins):** 12, 15, ~~18~~ ✅, 19, 24, 25. *(18 shipped—remove from batch when replanning.)*
- **Batch 2 (API Resilience & Scaling):** ~~3~~ ✅, 6, 8, 14. (**Opportunity 21** is V1.1 multi-replica caching—schedule with scale-out milestone.)
- **Batch 3 (Governance & Tooling):** ~~2, 5, 7~~ ✅, ~~17~~ ✅, 11, 13, 20, 23. *(2/5/7/17 shipped—remaining: §2.18 guide, purge job, health probe, webhook trace passthrough.)*

## Pending Questions for Later
- **DEFERRED Un-hold Commerce Rails:** Have the Stripe Partner Center verification, tax profile, and payout accounts been finalized to un-block this?
- **DEFERRED Attest SOC 2 Type I/II:** What is the approved budget ceiling for the CPA firm, and what is the preferred 45 vs 90 day observation window?
- **DEFERRED Secure First Public Reference Customer:** Is there a specific design partner ready to sign the public reference agreement this quarter?
- **DEFERRED Complete VPAT 2.4 WCAG 2.1 AA Manual Evaluations:** Who is assigned as the manual accessibility auditor for the remaining Not Evaluated criteria?
- **DEFERRED Third-Party Pen Test Execution:** Which vendor is selected for the 2026 Q2 SoW?
