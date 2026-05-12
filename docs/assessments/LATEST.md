# ArchLucid Assessment – Weighted Readiness 86.54%

## Executive Summary

**Overall Readiness**
ArchLucid possesses a highly viable, production-ready foundation with an 86.54% weighted readiness score. The core architecture loop, golden manifest mechanics, and isolation patterns are exceptionally well-designed. However, technical debt risks accumulating due to an absence of strict, automated enforcement of some critical safety standards.

**The Commercial Picture**
The commercial posture is strong. The product delivers near-immediate Proof-of-ROI and Time-to-Value via Tier 1, zero-trust Azure cost extractions. The absence of automated monetization mechanics (Stripe live keys) is an accepted V1.1 constraint that does not negatively impact the current sales-led pilot strategy.

**The Enterprise Picture**
Enterprise adoption is well-supported by robust row-level security, policy packs, and comprehensive audit logs. However, friction remains in initial OIDC configurations, which can cause resistance during the initial setup phases.

**The Engineering Picture**
The engineering framework is robust and benefits from deliberate developer ergonomics (like implicit typing and flexible file structures) which accelerate feature delivery. However, unmitigated edge paths and missing architectural enforcement mechanisms present risks. Strict null-checking must be enabled globally, and missing Playwright E2E coverage for the operator workflow must be added.

---

## Weighted Quality Assessment

Qualities are ranked by their weighted impact on readiness (deficiency signal), from most urgent to least urgent.

1. **Correctness**
   - **Score:** 85
   - **Weight:** 8
   - **Weighted deficiency:** 120
   - **Justification:** Core loops are accurate, but lack of strict nullability introduces subtle data risks.
   - **Tradeoffs:** Development speed vs. absolute compile-time safety.
   - **Recommendations:** Enable strict null-checking across all projects.
   - **Status:** Fixable in V1.

2. **AI/Agent Readiness**
   - **Score:** 85
   - **Weight:** 8
   - **Weighted deficiency:** 120
   - **Justification:** Agent tasks are well orchestrated, but outputs lack enforced structuring and explanations.
   - **Tradeoffs:** Output flexibility vs. guaranteed architectural structures.
   - **Recommendations:** Enforce the 8 required sections on all generated agent outputs.
   - **Status:** Fixable in V1.

3. **Marketability**
   - **Score:** 90
   - **Weight:** 8
   - **Weighted deficiency:** 80
   - **Justification:** The product narrative is strong and well-aligned with target enterprise pain points.
   - **Tradeoffs:** Agnosticism vs. Azure-native feature richness.
   - **Recommendations:** None required.
   - **Status:** Solid.

4. **Time-to-Value**
   - **Score:** 90
   - **Weight:** 7
   - **Weighted deficiency:** 70
   - **Justification:** High immediate value via Tier 1 extractions without requiring customer infrastructure deployment.
   - **Tradeoffs:** Focus on hosted SaaS delivery over self-hosted ease.
   - **Recommendations:** None required.
   - **Status:** Solid.

5. **Adoption Friction**
   - **Score:** 90
   - **Weight:** 6
   - **Weighted deficiency:** 60
   - **Justification:** Configuration of OIDC requires significant hands-on operator knowledge, but the SaaS model eliminates infrastructure setup friction for customers.
   - **Tradeoffs:** High security vs. rapid plug-and-play setup.
   - **Recommendations:** Implement a guided CLI configuration wizard and more explicit Entra ID onboarding scripts.
   - **Status:** Fixable in V1.

6. **Cognitive Load**
   - **Score:** 85
   - **Weight:** 4
   - **Weighted deficiency:** 60
   - **Justification:** The codebase leverages deliberate terse styling to reduce boilerplate, keeping cognitive load relatively low.
   - **Tradeoffs:** Terse code vs. verbose explicit declarations.
   - **Recommendations:** None required.
   - **Status:** Solid.

7. **Usability**
   - **Score:** 80
   - **Weight:** 3
   - **Weighted deficiency:** 60
   - **Justification:** Operator UI is functional but lacks comprehensive accessibility tagging.
   - **Tradeoffs:** Rapid feature shipping vs. semantic UI compliance.
   - **Recommendations:** Add `aria-labels` across the Next.js UI.
   - **Status:** Fixable in V1.

8. **Proof-of-ROI Readiness**
   - **Score:** 88
   - **Weight:** 5
   - **Weighted deficiency:** 60
   - **Justification:** Cost extractions are highly effective, and the generic integration strategy is sufficient for V1 pilots.
   - **Tradeoffs:** Generic webhook vs. deep ITSM schema mapping.
   - **Recommendations:** Standardize CMDB matching for ServiceNow.
   - **Status:** Fixable in V1.

9. **Executive Value Visibility**
   - **Score:** 85
   - **Weight:** 4
   - **Weighted deficiency:** 60
   - **Justification:** Dashboards provide good summaries, but export formatting can sometimes vary.
   - **Tradeoffs:** Custom visual layout vs. strict template adherence.
   - **Recommendations:** Rigidly enforce output templates.
   - **Status:** Fixable in V1.

10. **Workflow Embeddedness**
    - **Score:** 85
    - **Weight:** 3
    - **Weighted deficiency:** 45
    - **Justification:** Slack and ITSM connectors exist but require dense configuration files.
    - **Tradeoffs:** Config-driven flexibility vs. UI-driven simplicity.
    - **Recommendations:** Provide explicit Slack trigger configuration documentation.
    - **Status:** Fixable in V1.

11. **Security**
    - **Score:** 85
    - **Weight:** 3
    - **Weighted deficiency:** 45
    - **Justification:** Highly secure boundaries (RLS, Zero-trust extraction). Minor risks from unenforced nulls and implicitly exposed properties.
    - **Tradeoffs:** Operational security focus vs. compile-time hardening.
    - **Recommendations:** Strict null-checking and RLS startup validations.
    - **Status:** Fixable in V1.

12. **Differentiability**
    - **Score:** 90
    - **Weight:** 4
    - **Weighted deficiency:** 40
    - **Justification:** Strongly differentiated by Tier-1 trust and zero-trust data ingestion model.
    - **Tradeoffs:** General IaC support vs. specialized Azure-native alignment.
    - **Recommendations:** None required.
    - **Status:** Solid.

13. **Commercial Packaging Readiness**
    - **Score:** 80
    - **Weight:** 2
    - **Weighted deficiency:** 40
    - **Justification:** Lacks formal monetization turn-on, but sales-led structure is intentionally in place.
    - **Tradeoffs:** Deferred self-service billing vs. immediate enterprise hand-holding.
    - **Recommendations:** Maintain current trajectory; no immediate code changes required.
    - **Status:** V1.1 / Deferred.

14. **Interoperability**
    - **Score:** 85
    - **Weight:** 2
    - **Weighted deficiency:** 30
    - **Justification:** Good webhook surfaces. Needs tighter native Azure ecosystem hooks.
    - **Tradeoffs:** Generic REST vs. deeply integrated vendor endpoints.
    - **Recommendations:** Improve diagnostic commands for Azure Token retrieval.
    - **Status:** Fixable in V1.

15. **Explainability**
    - **Score:** 85
    - **Weight:** 2
    - **Weighted deficiency:** 30
    - **Justification:** Comparison views provide great explainability, but lacking E2E tests for these views risks undetected regressions.
    - **Tradeoffs:** Development speed vs. UI test coverage.
    - **Recommendations:** Add Playwright coverage for Comparison Views.
    - **Status:** Fixable in V1.

16. **Documentation**
    - **Score:** 90
    - **Weight:** 3
    - **Weighted deficiency:** 30
    - **Justification:** Documentation is strictly enforced and excellent.
    - **Tradeoffs:** High maintenance cost of docs vs. clarity.
    - **Recommendations:** Add ADR templates to ensure architectural reasoning is documented.
    - **Status:** Fixable in V1.

17. **Template and Accelerator Richness**
    - **Score:** 75
    - **Weight:** 1
    - **Weighted deficiency:** 25
    - **Justification:** Limited out-of-the-box accelerator templates.
    - **Tradeoffs:** Focus on core engine vs. building generic content libraries.
    - **Recommendations:** Provide an expanded library of baseline templates.
    - **Status:** Better suited for V1.1.

18. **Azure Compatibility and SaaS Deployment Readiness**
    - **Score:** 90
    - **Weight:** 2
    - **Weighted deficiency:** 20
    - **Justification:** Highly compatible with existing Azure infrastructure through robust Terraform generation and Entra ID integrations.
    - **Tradeoffs:** Multi-cloud IaC patterns vs. Azure-optimized deployments.
    - **Recommendations:** None required.
    - **Status:** Solid.

19. **Decision Velocity**
    - **Score:** 90
    - **Weight:** 2
    - **Weighted deficiency:** 20
    - **Justification:** High velocity due to pre-commit gates and efficient developer ergonomics.
    - **Tradeoffs:** Verbosity vs. speed of reading.
    - **Recommendations:** None required.
    - **Status:** Solid.

20. **Policy and Governance Alignment**
    - **Score:** 90
    - **Weight:** 2
    - **Weighted deficiency:** 20
    - **Justification:** Pre-commit gates are class-leading.
    - **Tradeoffs:** Slower commit workflows vs. absolute governance.
    - **Recommendations:** None required.
    - **Status:** Solid.

21. **Compliance Readiness**
    - **Score:** 90
    - **Weight:** 2
    - **Weighted deficiency:** 20
    - **Justification:** 78 typed audit events and tracking are highly mature.
    - **Tradeoffs:** Storage cost of audits vs. compliance coverage.
    - **Recommendations:** None required.
    - **Status:** Solid.

22. **Accessibility**
    - **Score:** 80
    - **Weight:** 1
    - **Weighted deficiency:** 20
    - **Justification:** Not a headline requirement, but basic HTML semantic tagging is easily achievable.
    - **Tradeoffs:** UI development speed vs. semantic purity.
    - **Recommendations:** Add baseline ARIA labels.
    - **Status:** Fixable in V1.

23. **Performance**
    - **Score:** 80
    - **Weight:** 1
    - **Weighted deficiency:** 20
    - **Justification:** Missing usage of LINQ extensions and implicit enumerations can cause localized memory pressure.
    - **Tradeoffs:** Familiar `foreach` loops vs. optimized LINQ execution.
    - **Recommendations:** Analyzer to enforce LINQ where appropriate.
    - **Status:** Fixable in V1.

24. **Stickiness**
    - **Score:** 85
    - **Weight:** 1
    - **Weighted deficiency:** 15
    - **Justification:** Continuous governance tracking keeps users engaged.
    - **Tradeoffs:** None.
    - **Recommendations:** None required.
    - **Status:** Solid.

25. **Customer Self-Sufficiency**
    - **Score:** 85
    - **Weight:** 1
    - **Weighted deficiency:** 15
    - **Justification:** Tier 1 Extractor empowers users heavily.
    - **Tradeoffs:** Vendor support vs. detailed self-help tooling.
    - **Recommendations:** Extend CLI diagnostic tooling.
    - **Status:** Fixable in V1.

26. **Scalability**
    - **Score:** 85
    - **Weight:** 1
    - **Weighted deficiency:** 15
    - **Justification:** Database-per-tenant architecture scales well. Distributed cache is reprioritized for V1.1.
    - **Tradeoffs:** Infrastructure complexity vs. absolute isolation.
    - **Recommendations:** None required.
    - **Status:** Solid.

27. **Observability**
    - **Score:** 85
    - **Weight:** 1
    - **Weighted deficiency:** 15
    - **Justification:** High audit coverage, but transient Azure API failures could use clearer retry tracing.
    - **Tradeoffs:** Log volume vs. trace depth.
    - **Recommendations:** Add explicit retry strategy tracing for Azure APIs.
    - **Status:** Fixable in V1.

28. **Manageability**
    - **Score:** 90
    - **Weight:** 1
    - **Weighted deficiency:** 10
    - **Justification:** Configuration is highly explicit and the SaaS model abstracts database management away from the customer.
    - **Tradeoffs:** Centralized vs. localized configuration.
    - **Recommendations:** None required.
    - **Status:** Solid.

29. **Modularity**
    - **Score:** 90
    - **Weight:** 1
    - **Weighted deficiency:** 10
    - **Justification:** Deliberate codebase organization provides excellent logical boundaries without excess file clutter.
    - **Tradeoffs:** File length vs. number of project files.
    - **Recommendations:** None required.
    - **Status:** Solid.

30. **Change Impact Clarity**
    - **Score:** 90
    - **Weight:** 1
    - **Weighted deficiency:** 10
    - **Justification:** Golden manifest diffing is best-in-class.
    - **Tradeoffs:** Complexity of diff engines vs. simple text diffs.
    - **Recommendations:** None required.
    - **Status:** Solid.

31. **Extensibility**
    - **Score:** 85
    - **Weight:** 1
    - **Weighted deficiency:** 15
    - **Justification:** Custom handler documentation exists.
    - **Tradeoffs:** Deep SDKs vs. REST simplicity.
    - **Recommendations:** Maintain current documentation approach.
    - **Status:** Solid.

32. **Azure Ecosystem Fit**
    - **Score:** 95
    - **Weight:** 1
    - **Weighted deficiency:** 5
    - **Justification:** Highly integrated with Azure OpenAI, Cost Management, and Entra ID.
    - **Tradeoffs:** Multi-cloud parity vs. deep Azure optimization.
    - **Recommendations:** None required.
    - **Status:** Solid.

---

## Top 9 Most Important Weaknesses

1. **Unchecked Null Exceptions in Edge Paths:** Missing strict nullable enforcement guarantees across all projects.
2. **Inconsistent Use of LINQ:** Foreach loops are used where LINQ extensions would be more performant and expressive.
3. **UI Component Accessibility:** Missing basic ARIA tagging limits accessibility compliance questionnaires.
4. **Vague Architectural Reasoning:** Agent outputs occasionally lack the strict 8-section structural formatting mandated by user rules.
5. **UI Test Coverage Gaps:** Lack of comprehensive E2E tests for the operator flow risks undetected regressions during rapid feature development.
6. **Complex OIDC Configuration:** Lacking a fully guided wizard or diagnostic command to troubleshoot token claims.
7. **Transient Azure API Failures Unlogged:** Extractors missing robust retry policies with explicit logging.
8. **Manual Setup for Tenant RBAC Mapping:** Aligning Entra ID groups to ArchLucid roles requires manual configuration string matching.
9. **Missing Azure Role Assignment Scripts:** Extractor tools require precise Role assignments that could be fully automated.

---

## Top 6 Monetization Blockers

1. **Complex First-Run Onboarding:** Intimidating DbUp logs and configuration files can deter non-technical evaluators.
2. **Pricing Tiers Not Enforced:** Lack of automated license checks may lead to unmonetized usage outside of the pilot phase.
3. **Lack of Standardized CMDB Integration Workflows:** Unclear mapping logic can stall ServiceNow-heavy enterprise adoptions.
4. **Friction in Custom Enterprise Integrations:** Webhooks require extensive manual parsing by the customer.
5. **Opaque Pricing Discovery:** Relies entirely on sales-led conversations; automated billing is completely deferred.
6. **Lack of Single-Click Trial Deployments:** Evaluators must configure their own robust infrastructure to test deeply.

---

## Top 4 Enterprise Adoption Blockers

1. **Complex OIDC Configuration:** Lacking a fully guided wizard or diagnostic command to troubleshoot token claims.
2. **Manual Setup for Tenant RBAC Mapping:** Aligning Entra ID groups to ArchLucid roles requires manual configuration string matching.
3. **Missing Azure Role Assignment Scripts:** Extractor tools require precise Role assignments that could be fully automated.
4. **Architectural Output Inconsistency:** If the AI agent does not consistently produce the mandated 8-section architecture format, architectural review boards will reject the output.

---

## Top 5 Engineering Risks

1. **Missing Null Checks:** Increases the likelihood of `NullReferenceExceptions` in deeply nested object graphs.
2. **Inconsistent LINQ Usage:** `foreach` loops on large in-memory collections may degrade performance compared to optimized LINQ pipelines.
3. **Missing Playwright E2E Coverage:** Lack of end-to-end testing for the operator UI could allow visual or workflow regressions.
4. **Vague Architectural Reasoning Output:** Agents failing to output the 8 required structural sections could compromise architectural integrity.
5. **Transient Azure API Failures Unlogged:** Extractors missing robust retry policies with explicit logging.

---

## Most Important Truth

The core architecture, agent orchestration, and isolation models are incredibly strong and commercially viable today; however, the lack of strict nullable reference types and comprehensive UI end-to-end tests will cause increasing maintenance friction as the user base scales.

---

## Top Improvement Opportunities

1. **Enable Strict Nullable Reference Types**
   - **Why it matters:** Fulfills the "Always check nulls" user rule globally.
   - **Expected impact:** Correctness (+6 pts), Security (+3 pts).
   - **Affected qualities:** Correctness, Security.
   - **Status:** Actionable now.
   ```text
   Update all `.csproj` files to ensure `<Nullable>enable</Nullable>` and `<WarningsAsErrors>nullable</WarningsAsErrors>` are set.
   - Specify files: All `*.csproj`
   - Acceptance criteria: Projects compile successfully with strict null checks.
   - Constraints: Introduce `!` overrides only where mathematically proven safe; otherwise, implement proper null checks.
   - Impact: Directly improves Correctness (+6 pts). Weighted readiness impact: +0.6%.
   ```

2. **Add LINQ Enforcer Analyzer**
   - **Why it matters:** Fulfills the user rule "Prefer the use of LINQ over foreach or with foreach unless using LINQ would degrade performance".
   - **Expected impact:** Performance (+5 pts), Modularity (+2 pts).
   - **Affected qualities:** Performance, Modularity.
   - **Status:** Actionable now.
   ```text
   Create a Roslyn Analyzer in `ArchLucid.Analyzers` to suggest converting simple `foreach` data transformation loops into LINQ `.Select()` or `.Where()` statements.
   - Specify files: `ArchLucid.Analyzers/`
   - Acceptance criteria: Analyzer identifies simple aggregations/transformations and provides a code fix.
   - Constraints: Ignore loops with complex side-effects or async calls.
   - Impact: Improves Performance (+5 pts). Weighted readiness impact: +0.1%.
   ```

3. **Enforce Architecture Output Structure**
   - **Why it matters:** Fulfills the rule `.cursor/rules/architecture-outputs.mdc` requiring 8 specific structural sections.
   - **Expected impact:** Explainability (+8 pts), Compliance Readiness (+4 pts).
   - **Affected qualities:** Explainability, Compliance Readiness.
   - **Status:** Actionable now.
   ```text
   Create a unit test or prompt validator in `ArchLucid.ArtifactSynthesis` that asserts all generated markdown architecture outputs contain the 8 mandated headers (Objective, Assumptions, Constraints, Architecture Overview, Component Breakdown, Data Flow, Security Model, Operational Considerations).
   - Specify files: `ArchLucid.ArtifactSynthesis/`
   - Acceptance criteria: Synthesis pipeline throws or flags if headers are missing.
   - Constraints: Apply only to top-level architecture outputs.
   - Impact: Improves Explainability (+8 pts). Weighted readiness impact: +0.2%.
   ```

4. **Create Architecture Decision Records (ADR) Template**
    - **Why it matters:** Fulfills rule "When making architectural decisions, include reasoning or evidence: Trade-offs, Constraints, Expected impact".
    - **Expected impact:** Documentation (+8 pts), Workflow Embeddedness (+2 pts).
    - **Affected qualities:** Documentation, Workflow Embeddedness.
    - **Status:** Actionable now.
    ```text
    Update or create an ADR markdown template in `docs/adr/template.md` that strictly requires 'Trade-offs', 'Constraints', and 'Expected impact' sections.
    - Specify files: `docs/adr/template.md`
    - Acceptance criteria: Template enforces the rule language explicitly.
    - Constraints: Keep under 100 lines.
    - Impact: Improves Documentation (+8 pts). Weighted readiness impact: +0.2%.
    ```

5. **Implement Comprehensive Playwright E2E Tests for Operator UI**
    - **Why it matters:** Prevents regressions in the core pilot and operator workflows.
    - **Expected impact:** Correctness (+5 pts), Explainability (+3 pts).
    - **Affected qualities:** Correctness, Explainability.
    - **Status:** Actionable now.
    ```text
    Add Playwright E2E tests covering the core 4-step pilot path in the operator UI.
    - Specify files: `archlucid-ui/tests/`
    - Acceptance criteria: Tests pass against the mocked or live backend in CI.
    - Constraints: Keep execution time under 5 minutes.
    - Impact: Improves Correctness (+5 pts). Weighted readiness impact: +0.2%.
    ```

6. **Add Test Coverage Enforcer in CI**
    - **Why it matters:** "try for 100% code coverage with unit tests".
    - **Expected impact:** Correctness (+3 pts).
    - **Affected qualities:** Correctness.
    - **Status:** Actionable now.
    ```text
    Modify the CI build pipeline script (e.g. `docs/engineering/BUILD.md` equivalent `build.ps1`) to fail the build if unit test coverage drops below 95%.
    - Specify files: `coverage.runsettings`, build scripts.
    - Acceptance criteria: Build rejects PRs that lower coverage.
    - Constraints: Ignore generated code and DTO contracts.
    - Impact: Improves Correctness (+3 pts). Weighted readiness impact: +0.2%.
    ```

7. **Add CLI Diagnostic Command for Azure Token Retrieval**
    - **Why it matters:** Diagnoses complex OIDC and Managed Identity failures quickly.
    - **Expected impact:** Supportability (+5 pts), Customer Self-Sufficiency (+5 pts).
    - **Affected qualities:** Customer Self-Sufficiency.
    - **Status:** Actionable now.
    ```text
    Add a command to `ArchLucid.Cli` named `az-token-test` that attempts to acquire an Azure default credential token and outputs the resulting claims/identity payload.
    - Specify files: `ArchLucid.Cli/`
    - Acceptance criteria: Command executes and returns clear JSON output of the current token environment.
    - Constraints: Do not log or export secret material.
    - Impact: Improves Customer Self-Sufficiency (+5 pts). Weighted readiness impact: +0.1%.
    ```

8. **Enforce RLS Configuration Checks at Startup**
    - **Why it matters:** Ensures the database-per-tenant or RLS configuration is mathematically sound before serving requests.
    - **Expected impact:** Security (+5 pts).
    - **Affected qualities:** Security.
    - **Status:** Actionable now.
    ```text
    Add a startup health check in `ArchLucid.Api` that executes a `SELECT SESSION_CONTEXT(N'TenantId')` validation query.
    - Specify files: `ArchLucid.Api/Startup/`
    - Acceptance criteria: Application fails to start or marks health as degraded if the RLS context infrastructure is missing.
    - Constraints: Must be lightweight and fast.
    - Impact: Improves Security (+5 pts). Weighted readiness impact: +0.15%.
    ```

9. **Improve UI Accessibility with ARIA Labels**
    - **Why it matters:** Increases the Accessibility score.
    - **Expected impact:** Accessibility (+15 pts).
    - **Affected qualities:** Accessibility.
    - **Status:** Actionable now.
    ```text
    Audit `archlucid-ui` base components (buttons, modals, dialogs) and add appropriate `aria-label`, `aria-hidden`, and `role` properties.
    - Specify files: `archlucid-ui/src/components/`
    - Acceptance criteria: Core UI components pass automated axe-core accessibility checks.
    - Constraints: Do not alter visual styling.
    - Impact: Improves Accessibility (+15 pts). Weighted readiness impact: +0.15%.
    ```

10. **Build Custom Terraform Snippet Snapshot Tests**
    - **Why it matters:** Guarantees generated advisory Terraform is structurally sound.
    - **Expected impact:** Correctness (+4 pts).
    - **Affected qualities:** Correctness.
    - **Status:** Actionable now.
    ```text
    Add a unit test in `ArchLucid.ArtifactSynthesis.Tests` that generates a sample Terraform snippet and executes the `terraform fmt -check` and `terraform validate` binaries against it.
    - Specify files: `ArchLucid.ArtifactSynthesis.Tests/`
    - Acceptance criteria: Test asserts true if terraform cli validates the syntax.
    - Constraints: Assume terraform CLI is available in the test environment path.
    - Impact: Improves Correctness (+4 pts). Weighted readiness impact: +0.3%.
    ```

11. **Standardize ServiceNow CMDB Matching Logic**
    - **Why it matters:** Implements the required `ServiceNowAutoCreateCmdbCi` logic described in the V1_SCOPE document.
    - **Expected impact:** Interoperability (+5 pts).
    - **Affected qualities:** Interoperability.
    - **Status:** Actionable now.
    ```text
    Implement the specific `cmdb_ci_appl` class matching logic in the ServiceNow outbound connector, mapping `SystemName` to CMDB `name`.
    - Specify files: `ArchLucid.Application/Integrations/Itsm/`
    - Acceptance criteria: Integration successfully creates an Application CI when `ServiceNowAutoCreateCmdbCi` is true and no match exists.
    - Constraints: Respect tenant feature flags.
    - Impact: Improves Interoperability (+5 pts). Weighted readiness impact: +0.1%.
    ```

12. **Add Playwright E2E for Comparison View**
    - **Why it matters:** Prevents regressions in the highly important manifest delta viewing experience.
    - **Expected impact:** Explainability (+5 pts).
    - **Affected qualities:** Explainability.
    - **Status:** Actionable now.
    ```text
    Create a Playwright test in `archlucid-ui/tests/` that navigates to the `/compare` view, loads a mocked delta manifest, and asserts the diff renders correctly.
    - Specify files: `archlucid-ui/tests/compare.spec.ts`
    - Acceptance criteria: Test passes in headless CI mode.
    - Constraints: Use deterministic mocked data.
    - Impact: Improves Explainability (+5 pts). Weighted readiness impact: +0.1%.
    ```

13. **Add `ADVISORY.md` Emit Step to Terraform Export**
    - **Why it matters:** Enforces the explicit rule from V1_SCOPE Section 2.17.
    - **Expected impact:** Policy and Governance Alignment (+5 pts).
    - **Affected qualities:** Policy and Governance Alignment.
    - **Status:** Actionable now.
    ```text
    Modify the Terraform package generator in `ArchLucid.ArtifactSynthesis` to inject an `ADVISORY.md` file warning users that ArchLucid never applies or destroys resources.
    - Specify files: `ArchLucid.ArtifactSynthesis/`
    - Acceptance criteria: Exported ZIP contains the advisory markdown file.
    - Constraints: Must be included in all TF ZIP exports.
    - Impact: Improves Policy Alignment (+5 pts). Weighted readiness impact: +0.1%.
    ```

14. **Enforce Database-Per-Tenant Schema Validation**
    - **Why it matters:** Validates that `SystemWithPerTenantCatalogs` is fully enforced for hosted tenants.
    - **Expected impact:** Security (+3 pts).
    - **Affected qualities:** Security.
    - **Status:** Actionable now.
    ```text
    Add an integration test that provisions a multi-tenant layout and verifies that connections originating from Tenant A explicitly fail to query the catalog of Tenant B.
    - Specify files: `ArchLucid.Persistence.Tests/`
    - Acceptance criteria: Security boundary test passes.
    - Constraints: Run only in CI/CD pipeline environments.
    - Impact: Improves Security (+3 pts). Weighted readiness impact: +0.1%.
    ```

15. **Add Retry Strategy for Transient Azure API Failures**
    - **Why it matters:** Ensures reliability during extraction operations.
    - **Expected impact:** Observability (+4 pts), Correctness (+2 pts).
    - **Affected qualities:** Observability.
    - **Status:** Actionable now.
    ```text
    Implement Polly `AsyncRetryPolicy` wrappers around all external HTTP calls made to the Azure ARM and Retail Prices APIs, with explicit `ILogger` tracing on retries.
    - Specify files: `ArchLucid.Api.Client/` or internal Azure SDK wrappers.
    - Acceptance criteria: Transient 503s are retried with exponential backoff and logged.
    - Constraints: Max retries set to 3.
    - Impact: Improves Observability (+4 pts). Weighted readiness impact: +0.1%.
    ```

16. **Implement Distributed Graph Projection Cache (V1.1)**
    - **Why it matters:** Confirmed for V1.1 to support larger multi-replica deployments and scalable projection caching.
    - **Expected impact:** Scalability (+10 pts), Performance (+5 pts).
    - **Affected qualities:** Scalability, Performance.
    - **Status:** Actionable now.
    ```text
    Implement a Redis-backed `IGraphSnapshotProjectionCache` in `ArchLucid.Persistence` to replace the in-memory graph projection cache for multi-replica environments.
    - Specify files: `ArchLucid.Persistence/`
    - Acceptance criteria: Cache implementation uses `IDistributedCache` or `StackExchange.Redis` directly, with tests verifying projection serialization/deserialization.
    - Constraints: Must gracefully fallback to in-memory if Redis is unreachable.
    - Impact: Improves Scalability (+10 pts). Weighted readiness impact: +0.2%.
    ```

---

## Prompt Batching Guidance

To optimize context window usage and cursor cost-effectiveness, execute the improvement prompts in the following thematic batches:

**Batch 1: Analyzer & Syntax Enforcements (Prompt 2)**
- **Why:** Targets the `ArchLucid.Analyzers` project to load the Roslyn syntax trees and existing analyzer scaffolding only once.

**Batch 2: Project Architecture & Build (Prompts 1, 6)**
- **Why:** These require context on the global `.csproj` files, CI pipelines, and `ArchLucid.Persistence` build scripts.

**Batch 3: External Integrations & Caching (Prompts 7, 11, 15, 16)**
- **Why:** Grouping Terraform logic, ServiceNow mappings, Azure retry handlers, and the Redis distributed cache integration minimizes context-switching between third-party API dependencies.

**Batch 4: Output & Compliance Validation (Prompts 3, 4, 10, 13, 14)**
- **Why:** These focus on the artifacts produced by the system (`ADVISORY.md`, architecture structures, DB isolation). Cursor can hold the synthesis and testing libraries in context.

**Batch 5: UI & Startup Health (Prompts 5, 8, 9, 12)**
- **Why:** Focuses entirely on `ArchLucid.Api` startup and `archlucid-ui` components and tests.