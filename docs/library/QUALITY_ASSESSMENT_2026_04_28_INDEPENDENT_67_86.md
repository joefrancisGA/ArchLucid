> **Scope:** Independent first-principles weighted quality assessment — 2026-04-28 session. Audience: product leadership, investors, pilot sponsors, engineering leads. Not a prior-assessment continuation; all scores and conclusions derived fresh from current codebase and documentation.

# ArchLucid Assessment – Weighted Readiness 67.86%

**Assessment date:** 2026-04-28  
**Methodology:** First-principles, independent. No reference to prior session scores or conclusions. Deferred V1.1/V2 items excluded from scoring per stated rules.  
**Score basis:** Each quality scored 1–100. Weighted deficiency = weight × (100 − score). Readiness = sum(score × weight) / sum(weight × 100) × 100.  
**Total weighted sum:** 6,922 / 10,200 = **67.86%**

---

## Executive Summary

### Overall Readiness

ArchLucid is a technically credible product at 67.86% weighted readiness — meaningfully above bare-minimum viability but not yet at the level where self-serve revenue or confident enterprise expansion is likely. The engineering foundation is solid, the documentation discipline is unusual for a product at this stage, and the governance story is differentiated. The gap is commercial and ecosystem: no validated pilots, no live commerce, no workflow embeddedness in the tools engineers actually use, and no third-party assurance posture beyond a self-assessment.

### Commercial Picture

The commercial materials are well-constructed: ROI model, buyer personas, pricing tiers, packaging tiers, competitive landscape, and a clearly articulated Core Pilot path all exist. The problem is that all PMF validation rows are "Pending." The product has never been proven in the field. The ROI story is model-based, not empirical. No reference customer has been published. Stripe operates in TEST mode. The Azure Marketplace listing is not yet published. The current motion is sales-led, and that motion has nothing behind it except documentation and a staging environment. This is the right place to be at V1 GA — but it is a fragile commercial foundation.

### Enterprise Picture

ArchLucid has done significant enterprise readiness work: 119 typed audit events, an append-only audit store with database-level DENY, segregation of duties, policy packs, governance workflows, a durable explainability trace, and an STRIDE threat model. What will stop enterprise procurement is the absence of SOC 2 Type II, no executed pen test, no ITSM integrations out of the box, and a procurement evidence pack that is explicitly self-asserted and template-only. Security reviewers at regulated organizations will not pass this without independent attestation or a known reference customer at a comparable organization.

### Engineering Picture

The engineering quality is genuinely high in several dimensions: architectural integrity, observability, explainability, Azure fit, and documentation are standout strengths. The weaknesses are clustered in the persistence layer (lowest coverage at ~53%), the trial funnel (TEST mode only, not validated E2E), and real-mode production benchmarks. The dual JSON/relational representation in manifests creates latent correctness risk. The codebase follows strong discipline rules and shows mature patterns (property-based tests, greenfield boot test, Schemathesis fuzzing, data consistency probes) that exceed what most early-stage SaaS products have.

---

## Weighted Quality Assessment

Ordered from most urgent to least urgent by weighted deficiency (weight × gap from 100).

---

### 1. Marketability — Score: 65 | Weight: 8 | Weighted Deficiency: 280

**Justification:** ArchLucid has all the ingredients for marketability — positioning statement, buyer personas, competitive matrix, ROI model, industry vertical briefs — but lacks the one thing that makes marketing work: evidence. The PMF validation tracker has zero validated rows. All five hypotheses (H1–H5) are listed as "Pending." There are no published reference customers (V1.1-deferred). The "AI Architecture Intelligence" category label is self-coined; no analyst has recognized or defined this space. The synthetic Contoso Retail case study exists but is clearly synthetic. Every marketing claim is either model-derived or architecture-based rather than empirical. In a competitive market, this produces credible documentation but weak purchasing conviction.

**Key tradeoffs:** Moving fast to pilot customers creates urgency around real evidence but risks overloading a small team before the product is stable. Waiting for organic evidence takes longer. The "synthetic case study" approach hedges both directions but satisfies neither.

**Improvement recommendations:**
- Execute and publish one real pilot (even with aggressive anonymization) to replace the synthetic case study
- Instrument the demo route (`/demo/explain`) for conversion tracking so the path to a sales conversation is measurable
- Add a "timing" overlay to the Contoso demo that shows simulated time-to-manifest (e.g., 43 minutes vs 3 days baseline) to make the ROI story visually immediate
- Create a short walkthrough video or GIF for the README and `archlucid.net/get-started` — the product is complex and no currently existing external media explains it at a glance

**V1 vs later:** Creating timing evidence, improving demo route, and adding a walkthrough are all V1-actionable. Publishing a named reference customer is V1.1.

---

### 2. Adoption Friction — Score: 60 | Weight: 6 | Weighted Deficiency: 240

**Justification:** The buyer path describes `archlucid.net` as a frictionless SaaS entry with no install required, but that URL depends on live DNS, a published Azure Front Door custom hostname, Container Apps, and the Stripe TEST mode being validated end-to-end. The contributor path (Docker, SQL, .NET, Node, Terraform, CLI) is entirely separate. For prospects who arrive via GitHub and want to explore locally before committing to Azure, there is currently no fast path. The first-run wizard has seven steps. The progressive disclosure system is well designed but the full nav surface is large. Setting up a real pilot with enterprise-grade auth (Entra ID), governance, and Container Apps is materially non-trivial even with the excellent documentation.

**Key tradeoffs:** SaaS-first reduces friction for typical buyers but requires the hosted environment to actually be live and correctly configured. A local Docker Compose evaluator path reduces friction for GitHub-arriving technical buyers but risks positioning confusion ("is this a self-hosted product?").

**Improvement recommendations:**
- Add a Docker Compose "evaluator quickstart" with pre-seeded sample data that lets a prospect run a complete Core Pilot locally in 15 minutes without any Azure subscription
- Validate the trial signup funnel in TEST mode end-to-end (this is a V1 obligation, not deferred)
- Add a "Use sample data" fast path in the first-run wizard that bypasses the 7-step input form for evaluators who just want to see output immediately
- Make `BUYER_FIRST_30_MINUTES.md` reflect real staging URL status (if `archlucid.net` DNS is not live, the doc is misleading)

**V1 vs later:** Docker Compose evaluator path and trial funnel validation are V1-actionable. Live DNS cutover is V1.1.

---

### 3. Time-to-Value — Score: 71 | Weight: 7 | Weighted Deficiency: 203

**Justification:** The simulator mode is excellent — deterministic, zero-cost, and fast. The Core Pilot path is well-defined at four steps. The `archlucid second-run` command with a one-page TOML is smart. The pre-seeded sample data design is correct. The score is not higher because: (a) "time to value" for a buyer arriving at `archlucid.net` is currently gated by whether the hosted environment is live, (b) first impressions depend on the quality of the sample run, which uses synthetic data rather than industry-specific real examples, and (c) the value report DOCX depends on having a baseline hours figure that many first-time users will skip.

**Key tradeoffs:** Optimizing for speed-to-manifest means reducing the richness of inputs — but thin inputs produce thin findings, which reduces perceived value. The current 7-step wizard tries to solve this with progressive detail collection, but this adds time.

**Improvement recommendations:**
- Ship at least 3 fully populated vertical sample runs (financial services, healthcare, SaaS) that show rich, detailed findings rather than generic topology analysis — the first output a buyer sees is the entire demo
- Add a "see a completed run" button on the landing page that goes directly to the read-only Contoso demo without requiring sign-in
- Instrument `archlucid_first_session_completed_total` so the team can measure actual time-to-first-committed-manifest from first login and set a target of < 20 minutes

**V1 vs later:** Sample run enrichment and unauthenticated demo are V1-actionable.

---

### 4. Proof-of-ROI Readiness — Score: 68 | Weight: 5 | Weighted Deficiency: 160

**Justification:** The ROI model is structurally sound: formulas, industry benchmarks, a worked example, and a before/after scorecard framework. The value report DOCX auto-generation is well-engineered. The pilot ROI model gives operators a measurement companion. However, every number in these documents is either a model estimate or a benchmark ("industry typical") rather than a measured outcome. There is no actual before/after timing comparison from a real customer. The value report relies on a self-reported baseline at signup, and many users will skip it or use the model default. The `archlucid_trial_signup_baseline_skipped_total` metric exists — which implies the team anticipates high skip rates.

**Key tradeoffs:** Aggressive synthetic ROI numbers help sales early but damage credibility once examined by a CFO or a skeptical enterprise architect. Conservative model-based numbers are more defensible but less compelling.

**Improvement recommendations:**
- Instrument actual run timing in production (time from `ArchitectureRequests.CreatedUtc` to first `GoldenManifest` commit timestamp) and surface a per-pilot "you saved X hours" calculation based on real pipeline duration vs the user's baseline
- Add a pilot scorecard summary page in the operator UI that shows metrics against the five PMF hypotheses (H1–H5) so pilots have a built-in success dashboard
- Generate a "Pilot week 1 summary" email/notification after 7 days with actual usage and artifact metrics

**V1 vs later:** Instrumented timing is V1-actionable. Named reference customer ROI is V1.1.

---

### 5. Workflow Embeddedness — Score: 48 | Weight: 3 | Weighted Deficiency: 156

**Justification:** This is the sharpest enterprise adoption gap. Architecture work happens in Jira, Confluence, Azure DevOps Boards, ServiceNow, and email chains. ArchLucid sits outside all of these. Azure DevOps has a basic integration but it is described as "basic." Jira, ServiceNow, and Confluence are V1.1. Teams will use ArchLucid in parallel with their existing workflow tools rather than replacing them, but without a native integration, the path from "finding flagged in ArchLucid" to "work item created in Jira/ServiceNow" requires a manual step or a custom webhook configuration. Microsoft Teams notifications exist, which is helpful, but does not close the loop. This gap will show up repeatedly in enterprise pilot feedback.

**Key tradeoffs:** Building ITSM integrations consumes engineering capacity that is currently going toward the core product. The V1.1 sequencing decision (ServiceNow first) is correct given enterprise target segments. CloudEvents webhooks provide a workaround but not a native experience.

**Improvement recommendations:**
- Deepen the Azure DevOps integration to support finding → Azure Boards work item creation with full correlation link-back (this is fully in-scope and uses the existing `ArchLucid.Integrations.AzureDevOps` project)
- Add a "Copy as Jira ticket" / "Copy as GitHub issue" one-click affordance on finding detail in the operator UI that pre-formats a finding as a markdown issue body — no native Jira integration needed, just a copy-paste accelerator
- Clearly document in `INTEGRATION_CATALOG.md` that CloudEvents webhooks can be used with Azure Logic Apps / Power Automate to bridge to Jira/ServiceNow before V1.1

**V1 vs later:** Azure DevOps deepening and copy affordance are V1-actionable. Native Jira/ServiceNow integration is V1.1.

---

### 6. Trustworthiness — Score: 60 | Weight: 3 | Weighted Deficiency: 120

**Justification:** ArchLucid handles the AI trust problem correctly at the messaging level — the exec brief explicitly states that LLM text is decision support, not legal attestation, and manifests are the reviewable evidence for human sign-off. The `ExplainabilityTrace` on every finding is a genuine differentiator. The content safety configuration, append-only audit, and OWASP ZAP CI gates are real. But a buyer who asks "should I trust ArchLucid to make architecture decisions for regulated systems?" is asking about independent validation, not internal documentation. The answer today is: self-asserted SOC 2, a pen test in flight but not published, no named reference customer, no analyst recognition, and no third-party audit of the RLS multi-tenant isolation.

**Key tradeoffs:** Publishing trust indicators early (self-asserted CAIQ, SIG Core pre-fills, owner security assessment) is the right move — it shows transparency and creates evidence for review even without attestation. But a sophisticated procurement team will read "self-asserted" on every row and apply a significant discount.

**Improvement recommendations:**
- Complete and formally publish the CAIQ Lite pre-fill with concrete evidence citations (specific URLs in the repo to OWASP ZAP results, RLS docs, audit matrix, etc.) rather than leaving it as "draft fields"
- Add a "recent assurance activity" timeline to the public Trust Center that shows the pen test SoW submission date, the engagement start, and a target delivery window — showing forward motion is better than a static "in flight" status
- Ensure the `OWNER_SECURITY_ASSESSMENT_REDACTED_FOR_PACK` document is the most comprehensive it can be before the pen test arrives; it is the interim substitute for an independent report

**V1 vs later:** CAIQ completion and trust center timeline update are V1-actionable. SOC 2 Type II and pen test publication are V1.1.

---

### 7. Differentiability — Score: 70 | Weight: 4 | Weighted Deficiency: 120

**Justification:** ArchLucid's differentiation story is genuinely strong on paper — multi-agent analysis + structured explainability + durable governance in a single product is not available from LeanIX, Ardoq, AWS Well-Architected Tool, or Azure Advisor. The competitive matrix is honest and accurate. The three value pillars (AI-native analysis, auditable decision trail, enterprise governance) are well-articulated. The problem is that differentiation claims are only as credible as the evidence behind them. "Our ExplainabilityTrace beats LeanIX's opaque recommendations" requires a comparison a buyer can see in action. The `/demo/explain` route is the right vehicle but requires staging infrastructure to be live.

**Key tradeoffs:** Strong positioning copy in isolation is easy to create and easy to dismiss. Evidence-based differentiation requires either a working demo or real comparison data.

**Improvement recommendations:**
- Create a competitive battle card with a single "show, don't tell" comparison: LeanIX/Ardoq give you a list; ArchLucid gives you a finding with a full evidence chain — make this tangible with a screenshot side-by-side
- Ensure the `/demo/explain` route is reliably accessible on `staging.archlucid.net` for sales engineers to use in live demos
- Add a "why not just use ChatGPT for this?" answer to `NOT_A_FIT.md` and `COMPETITOR_CONTRAST.md` — this is the most common informal objection

**V1 vs later:** Battle card creation, demo stability, and FAQ updates are V1-actionable.

---

### 8. Correctness — Score: 71 | Weight: 4 | Weighted Deficiency: 116

**Justification:** The test strategy is mature: property-based tests with FsCheck, SQL integration tests against real SQL Server, a greenfield boot test, data consistency orphan probes, and agent output quality scoring. The persistence layer test coverage at ~53% is the most significant correctness risk — this is the assembly that does the hardest data integrity work (manifest hydration, relational/JSON dual representation, archival cascades). The dual-representation strategy for manifests (relational rows + JSON fallback) creates a class of correctness risks where the relational path and the JSON path diverge silently. Agent output correctness in real (non-simulator) mode is not continuously validated by CI.

**Key tradeoffs:** High coverage in application and decisioning layers catches most business logic bugs. But persistence-layer bugs are the ones that show up as data corruption or silent data loss in production — exactly the category where test coverage matters most.

**Improvement recommendations:**
- Target 70%+ line coverage on `ArchLucid.Persistence` by writing tests for the uncovered paths identified in `COVERAGE_GAP_ANALYSIS.md` — focus on the relational/JSON merge paths and archival cascade branches
- Add a property-based test for the manifest JSON/relational merge invariant: for any valid `GoldenManifest`, relational-path hydration must produce a result structurally equivalent to JSON-path hydration when both paths are populated
- Validate agent output quality in real mode (Azure OpenAI) on at least one run per release as part of the release smoke test

**V1 vs later:** Coverage improvement and property test are V1-actionable. Real-mode LLM regression in CI is ongoing.

---

### 9. Executive Value Visibility — Score: 72 | Weight: 4 | Weighted Deficiency: 112

**Justification:** The sponsor brief is well-written. The sponsor PDF auto-generation after commit is a thoughtful feature. The value report DOCX is differentiated. The Day N badge for tenure since first commit is a nice retention-anchoring detail. The "most important truth" for sponsors — faster from request to reviewable output, less manual packaging, stronger evidence trail — is clear and non-overclaiming. Score is not higher because the value report depends on: (a) first-commit timestamp being recorded (SQL backfill needed for legacy rows), (b) a baseline review-cycle hours figure the user may have skipped, and (c) the value report DOCX itself being easily accessible in the operator UI without hunting.

**Improvement recommendations:**
- Ensure the "Email this run to your sponsor" banner is prominent on first successful commit and accessible from the Runs list
- Add a "Day N since your first ArchLucid run" counter on the operator home page that links to the value report

**V1 vs later:** Both are V1-actionable.

---

### 10. Usability — Score: 63 | Weight: 3 | Weighted Deficiency: 111

**Justification:** The progressive disclosure approach is conceptually correct and well-implemented. The Core Pilot four-step path is excellent boundary-setting. The sidebar tier system (essential/extended/advanced) prevents overwhelming new users. However: the 7-step first-run wizard is long for a first impression; operator guidance (LayerHeader, page leads, OperateCapabilityHints) adds text overhead on each page; and the "Show more links" disclosure mechanism requires users to understand the tier model to know what they're missing. No user research or usability test results are documented — all usability decisions are product judgment rather than observed behavior.

**Improvement recommendations:**
- Add a "Quick start with sample data" button in the new-run wizard that auto-fills all seven steps with a vertical-appropriate sample and skips to submission — zero input required for first-time value
- Run at least one informal moderated usability session with 3 pilot candidates and document findings

**V1 vs later:** Quick-start button is V1-actionable. Formal usability research is ongoing.

---

### 11. Interoperability — Score: 50 | Weight: 2 | Weighted Deficiency: 100

**Justification:** Azure DevOps integration exists (basic). Microsoft Teams notifications exist. CloudEvents webhooks exist as a general-purpose bridge. REST API is versioned with an OpenAPI spec. Service Bus integration events are wired. But in enterprise architecture contexts, the expected minimum integrations are: Jira (architecture decision tracking), Confluence (documentation publishing), ServiceNow (incident/change management), and at least one SSO provider beyond Entra ID. All of those are V1.1. The practical experience for a V1 enterprise buyer is: "ArchLucid is an island — I need to manually export findings and copy them into the tools my team uses."

**Improvement recommendations:**
- Deepen Azure DevOps to make it the reference V1 integration: findings → work items, run links → commits/PRs, advisory alerts → Azure DevOps notifications
- Document a concrete "Bridge ArchLucid to Jira via CloudEvents + Azure Logic Apps" recipe so V1 buyers have a workaround path with step-by-step instructions
- Add a "Copy as GitHub Issue" / "Copy as Azure DevOps work item" clipboard affordance on finding detail — no integration required, just better copy-paste ergonomics

**V1 vs later:** Azure DevOps deepening, copy affordance, and bridge recipe are all V1-actionable.

---

### 12. Compliance Readiness — Score: 55 | Weight: 2 | Weighted Deficiency: 90

**Justification:** The compliance posture is self-asserted across the board. OWASP ZAP runs in CI (genuine). Schemathesis runs on PRs (genuine). STRIDE threat model exists (genuine). The CAIQ Lite and SIG Core pre-fills are "draft fields" — not populated with specific evidence. The SOC 2 roadmap describes Q2–Q3 2026 for Type I readiness but a CPA opinion is gated on budget. The pen test SoW names "Aeronova Red Team LLC" but no results have been published. Healthcare vertical brief provides PHI guidance but no BAA template is committed. For Financial Services, Healthcare, or Public Sector buyers — the three target segments with the highest compliance requirements — the current posture will trigger security review holds.

**Improvement recommendations:**
- Populate the CAIQ Lite pre-fill with specific evidence URL pointers to in-repo files (e.g., OWASP ZAP run outputs, RLS migration scripts, audit coverage matrix) so procurement reviewers can follow a citation trail rather than taking assertions at face value
- Add a BAA template under `docs/go-to-market/` for Healthcare prospects (consult legal template sources; note it requires owner legal review before use)
- Create a "Compliance evidence checklist" per target vertical (Healthcare/HIPAA, Financial Services/SOC, Federal/FedRAMP) that maps ArchLucid controls to each framework, even partially

**V1 vs later:** CAIQ population and evidence checklist are V1-actionable. BAA requires legal review.

---

### 13. Security — Score: 72 | Weight: 3 | Weighted Deficiency: 84

**Justification:** The security architecture is solid for a V1 SaaS: fail-closed auth defaults, content safety fail-closed in production, DevelopmentBypass blocked in non-dev environments, OWASP ZAP as a merge gate, Schemathesis light on every PR, Gitleaks secret scanning, role-aware rate limiting, SQL RLS, append-only audit with DB-level DENY, STRIDE threat model. The score is not higher because: (a) no executed pen test, (b) generic OIDC for Enterprise is roadmap only, (c) the RLS posture acknowledges that the `ArchLucidApp` role may not be configured in all deployments (mitigation is operator-documented but not enforced), and (d) self-asserted posture is categorically different from independently validated security.

**Key tradeoffs:** Strong internal security engineering vs absence of external validation. This is the right tradeoff at this stage but creates a procurement blocker for regulated industries.

**Improvement recommendations:**
- Ensure the `ArchLucidApp` SQL role setup is documented as a deployment prerequisite (not optional) in PILOT_GUIDE.md and DEPLOYMENT_RUNBOOK.md — the DENY UPDATE/DELETE on AuditEvents does not activate without this role
- Add an automated check in `archlucid doctor` that verifies the `ArchLucidApp` role exists and the DENY is in effect on the target database

**V1 vs later:** Role setup documentation and doctor check are V1-actionable.

---

### 14. Procurement Readiness — Score: 60 | Weight: 2 | Weighted Deficiency: 80

**Justification:** The procurement evidence pack is well-structured (DPA template, subprocessors, MSA outline, SLA summary, CAIQ Lite, SIG Core, Trust Center ZIP endpoint). The structure is right; the content depth is not. MSA and DPA are templates that require legal review. CAIQ Lite and SIG Core are "draft fields." The only security assurance document is an owner-conducted self-assessment. No independent audit, no pen test summary, no SOC 2. A sophisticated enterprise procurement team will read every "self-asserted" label and reduce confidence accordingly.

**Improvement recommendations:**
- Fill in the CAIQ Lite and SIG Core with substantive, specific answers pointing to code/doc evidence
- Add a "Procurement FAQ" one-pager that answers the 5 questions procurement asks first (data residency, sub-processor list, incident SLA, SOC 2 timeline, pen test schedule) in plain language

**V1 vs later:** FAQ and CAIQ completion are V1-actionable. Independent attestation is V1.1.

---

### 15. Decision Velocity — Score: 63 | Weight: 2 | Weighted Deficiency: 74

**Justification:** The quote-request API exists (`POST /v1/marketing/pricing/quote-request`). The ORDER_FORM_TEMPLATE.md provides a paper deal path. The pricing tiers are clearly defined. But: the CRM routing for quote requests is documented as pending in `PENDING_QUESTIONS.md` item 13. There is no documented SDR or sales response playbook. The trial-to-paid path requires live Stripe keys which are V1.1. Multi-stakeholder buying (EA + Security + Procurement) requires each stakeholder to get evidence independently; there is no "send to procurement" package flow. Decision velocity will be slow until the commercial infrastructure catches up.

**Improvement recommendations:**
- Route `Email:PricingQuoteSalesInbox` to a working sales email immediately (this requires owner configuration but should not be pending)
- Add a "send this pack to procurement" button in the operator UI that generates the Trust Center evidence pack download link + a short cover email template

**V1 vs later:** Procurement email template is V1-actionable. CRM routing and live Stripe require owner decisions.

---

### 16. Architectural Integrity — Score: 77 | Weight: 3 | Weighted Deficiency: 69

**Justification:** The architecture is well-bounded and coherent: C4 diagrams, clear container ownership, architecture tests, bounded context map, ADR-documented decisions. The dual-pipeline (Coordinator + Authority) is documented and its supersession archived. The project split (Core, Application, Persistence, AgentRuntime, Api, Host.Composition) is correct. The main integrity concerns are: the persistence split has produced many focused projects that require careful migration coordination; the deprecated API shims (`useEnterpriseMutationCapability`) create a legacy surface that must be maintained; and the relational/JSON dual-representation in manifests is a structural complexity that the architecture tolerates rather than resolves.

**Improvement recommendations:**
- Track the relational/JSON dual-representation as a formal architectural debt item in the ADR log and set a target migration version
- Complete the deprecation of `useEnterpriseMutationCapability` → `useOperateCapability` before V1 GA to reduce legacy surface

**V1 vs later:** Deprecation completion is V1-actionable. Full relational migration is ongoing.

---

### 17. Reliability — Score: 68 | Weight: 2 | Weighted Deficiency: 64

**Justification:** Circuit breakers, LLM fallback client, retry with backoff on durable audit writes, outbox convergence SLO, degraded mode matrix — these show mature reliability thinking. Health probes, geo-failover runbook, SLO targets (99.5%/99.9%) exist. `CHAOS_TESTING.md` exists but there is no evidence of results. The outbox convergence SLO is defined but the worker reliability is only indirectly tested. Pipeline timeout tracking exists (`archlucid_authority_pipeline_timeouts_total`) but no target timeout SLO is documented.

**Improvement recommendations:**
- Document the authority pipeline timeout SLO (e.g., < 0.1% of runs should timeout) alongside the availability SLO in `API_SLOS.md`
- Add one chaos test scenario to CI (e.g., SQL container kill during active run) to catch data integrity issues under failure

**V1 vs later:** Timeout SLO documentation is V1-actionable. Full chaos test suite is longer-term.

---

### 18. Traceability — Score: 79 | Weight: 3 | Weighted Deficiency: 63

**Justification:** Traceability is genuinely a standout strength. 119 typed audit event constants, append-only SQL design with DB-level DENY, OtelTraceId on every run, ExplainabilityTrace on every finding with 5 structured fields, agent execution traces in blob storage, provenance graph, keyset pagination for audit search, CorrelationId on every API response. The CI guard on audit constant count prevents silent audit coverage drift. The one weakness is that some orchestration paths emit only baseline mutation logs (not durable `dbo.AuditEvents` rows), which means some operations are traceable via logs but not via the operator audit UI.

**Improvement recommendations:**
- Audit the baseline-log-only paths and migrate the highest-value ones (run execute, run cancel) to dual-write durable rows — even if errors are swallowed, the operation should appear in `dbo.AuditEvents`

**V1 vs later:** Targeted dual-write upgrade is V1-actionable.

---

### 19. Data Consistency — Score: 74 | Weight: 2 | Weighted Deficiency: 52

**Justification:** The orphan probe, alert thresholds, quarantine mode, and metrics for data consistency detection are mature. The idempotency repository contract test (parallel same-key TryInsert) shows correctness awareness. The append-only audit DENY at DB level is strong. The main risk is the relational/JSON dual-representation for manifests — when relational rows and JSON payloads diverge (migration error, partial write), the hydration merge logic must resolve correctly. Property-based tests cover some of this but the coverage is incomplete.

**Improvement recommendations:**
- Add an invariant assertion in `DataConsistencyOrphanProbeHostedService` that validates manifest JSON/relational consistency (not just foreign key orphans) — detect when a manifest has relational rows but the JSON is outdated or missing

**V1 vs later:** Probe enhancement is V1-actionable.

---

### 20. Maintainability — Score: 70 | Weight: 2 | Weighted Deficiency: 60

**Justification:** The coding style rules (12 Cursor rules enforcing C# 12 patterns, early return, guard clauses, primary constructors) are strong. Each class in its own file. Concept vocabulary CI enforcement. `NEXT_REFACTORINGS.md` tracks known debt. The persistence project split creates many small assemblies which is good for maintainability of individual pieces but increases migration coordination cost. The deprecated `useEnterpriseMutationCapability` shim is a known maintainability risk. `COMMERCIAL_ENFORCEMENT_DEBT.md` notes follow-on work on the packaging enforcement model.

**Improvement recommendations:**
- Complete the deprecation of the `useEnterpriseMutationCapability` → `useOperateCapability` migration in the UI before adding new features that use the old hook
- Add a CI check that fails when `useEnterpriseMutationCapability` is referenced in any new file (it should already exist under deprecation rules but make it explicit)

**V1 vs later:** Deprecation completion is V1-actionable.

---

### 21. AI/Agent Readiness — Score: 73 | Weight: 2 | Weighted Deficiency: 54

**Justification:** The multi-agent pipeline is well-implemented with 4 specialized agents, 10 finding engine types, structural completeness scoring, semantic quality scoring, a configurable quality gate, prompt injection defense in CI, and a deterministic simulator for testing. The circuit breaker and fallback LLM client provide resilience. Content safety is wired and fail-closed in production. The quality gate with structural + semantic scoring is genuinely advanced. Weaknesses: the MCP server (inbound agent ecosystem) is V1.1; the quality gate is disabled in development (`appsettings.Development.json`), which means the team gets no continuous feedback on real LLM output quality during development cycles; no production LLM output regression benchmark.

**Improvement recommendations:**
- Enable the quality gate in Development mode at a lower threshold (e.g., `warned` only, not `rejected`) so development runs surface semantic quality signals without blocking
- Add a "quality gate weekly summary" metric or dashboard panel showing the distribution of `accepted/warned/rejected` outcomes per agent type over the last 7 days

**V1 vs later:** Quality gate threshold config and dashboard panel are V1-actionable.

---

### 22. Azure Compatibility and SaaS Deployment Readiness — Score: 74 | Weight: 2 | Weighted Deficiency: 52

**Justification:** Container Apps, Azure SQL, Azure OpenAI, Front Door, Key Vault, Service Bus, Entra ID, Managed Identity, Managed Grafana — full Azure-native stack, all wired in Terraform. Managed identity for SQL/Blob. Content Safety. The secondary region option is available. The Marketplace SaaS offer is wired but not published (V1.1). ACR push is not in CI (manual build step). The DNS cutover for `archlucid.net` / `signup.archlucid.net` is V1.1. For a V1 pilot, the deployment is sound — `infra/apply-saas.ps1` exists.

**Improvement recommendations:**
- Add the Container Apps image push to a pre-provisioned ACR as a CI job so production builds are in the registry without a manual step
- Document the exact sequence for first-time deployment from a clean Azure subscription to a running pilot in a single runbook (not spread across DEPLOYMENT_RUNBOOK, REFERENCE_SAAS_STACK_ORDER, and LANDING_ZONE_PROVISIONING)

**V1 vs later:** ACR CI job and consolidated runbook are V1-actionable.

---

### 23–46: Remaining Qualities (ordered by weighted deficiency)

| Quality | Score | Weight | W.Deficiency | Summary |
|---------|-------|--------|-------------|---------|
| **Compliance Readiness** | 55 | 2 | 90 | See §12 above |
| **Security** | 72 | 3 | 84 | See §13 above |
| **Procurement Readiness** | 60 | 2 | 80 | See §14 above |
| **Decision Velocity** | 63 | 2 | 74 | See §15 above |
| **Architectural Integrity** | 77 | 3 | 69 | See §16 above |
| **Reliability** | 68 | 2 | 64 | See §17 above |
| **Commercial Packaging Readiness** | 69 | 2 | 62 | Tiers and enforcement well-structured; live commerce V1.1. |
| **Maintainability** | 70 | 2 | 60 | Strong style rules; deprecated UI hook and persistence fragmentation are known risks. |
| **Policy and Governance Alignment** | 72 | 2 | 56 | Approval workflows, SoD, dry-run, policy packs are strong. Generic OIDC roadmap. |
| **AI/Agent Readiness** | 73 | 2 | 54 | See §21 above |
| **Data Consistency** | 74 | 2 | 52 | See §19 above |
| **Azure Compatibility** | 74 | 2 | 52 | See §22 above |
| **Explainability** | 76 | 2 | 48 | ExplainabilityTrace, citation chips, faithfulness checking are strengths. |
| **Auditability** | 78 | 2 | 44 | Standout strength; 119 audit events, append-only, DB-level DENY. |
| **Cognitive Load** | 62 | 1 | 38 | Progressive disclosure helps; contributor path is complex (30+ projects, 193 docs). |
| **Template and Accelerator Richness** | 63 | 1 | 37 | 6 vertical briefs; policy packs; SECOND_RUN.toml. No public template gallery. |
| **Accessibility** | 65 | 1 | 35 | WCAG 2.1 AA target, axe gates, ARIA live regions. No manual audit evidence. |
| **Cost-Effectiveness** | 66 | 1 | 34 | LLM cost accounting per-tenant. No per-run cost benchmarks in production. |
| **Stickiness** | 67 | 1 | 33 | Advisory scheduling, alerts, comparison/replay create return visits. |
| **Performance** | 67 | 1 | 33 | Pilot path Stopwatch gates; real-mode production benchmarks not validated in CI. |
| **Deployability** | 67 | 1 | 33 | Release scripts, DbUp, greenfield boot test. ACR push manual. |
| **Availability** | 68 | 1 | 32 | 99.9% target documented; geo-failover runbook. No contractual SLA yet. |
| **Scalability** | 68 | 1 | 32 | Single-DB path well documented; per-tenant DB option deferred by design. |
| **Manageability** | 68 | 1 | 32 | Feature flags, config hierarchy, tier management. Admin UI coverage unclear. |
| **Extensibility** | 71 | 1 | 29 | Finding engine plugins, policy packs, LLM provider abstraction are good. |
| **Supportability** | 72 | 1 | 28 | archlucid doctor, support-bundle, correlation IDs, TROUBLESHOOTING.md. |
| **Testability** | 72 | 1 | 28 | Multi-tier testing (FsCheck, Playwright, Vitest, Schemathesis) is strong. |
| **Change Impact Clarity** | 72 | 1 | 28 | Comparison/replay, governance preview, dry-run are strong. |
| **Evolvability** | 72 | 1 | 28 | ADR discipline, version roadmap, schema versioning are correct. |
| **Modularity** | 73 | 1 | 27 | 30+ focused projects, interface-first, class-per-file. |
| **Observability** | 75 | 1 | 25 | 40+ custom OTel metrics, business KPI instruments, Grafana integration. |
| **Traceability** | 79 | 3 | 63 | See §18 above |
| **Azure Ecosystem Fit** | 78 | 1 | 22 | Full Azure-native; ADR 0020 makes it permanent. |
| **Documentation** | 79 | 1 | 21 | 193+ library docs; C4, ADRs, concept vocabulary CI enforcement. |

---

## Top 10 Most Important Weaknesses

1. **Zero validated PMF hypotheses.** The PMF tracker has five hypotheses and zero "Validated" rows. Every evidence row is "Pending." The product has never been proven with a paying or committed customer. All ROI claims are model-derived. This is the defining commercial risk.

2. **No workflow embeddedness in engineering tools.** Findings stay inside ArchLucid. Engineers work in Jira, Confluence, Azure Boards, ServiceNow, and Slack. There is no native integration to close that loop in V1. The product is an island in the current toolchain for most enterprise teams.

3. **Trial funnel not end-to-end validated in TEST mode.** The Stripe TEST mode signup flow, tenant provisioning, sample run auto-execution, and guided tour are designed but not proven. This is an explicit V1 obligation (V1_DEFERRED.md §6b) and represents a risk that the primary self-serve acquisition path fails silently.

4. **No independent security attestation.** SOC 2 is self-asserted. The pen test is "in flight" with no published results. PGP disclosure key is V1.1. For any regulated-industry buyer (Financial Services, Healthcare, Public Sector), this is a hard procurement hold.

5. **Persistence layer coverage at ~53%.** The assembly responsible for manifest hydration, data archival, and the relational/JSON dual-representation merge has the lowest test coverage in the solution. This is where silent data integrity issues are most likely to originate.

6. **No public reference customer.** Social proof in enterprise B2B is not optional. "Self-coined category + no named customer + synthetic case study" is a difficult starting position for a vendor qualification conversation.

7. **Adoption friction for the buyer who arrives at GitHub.** The `BUYER_FIRST_30_MINUTES.md` describes a SaaS path at `archlucid.net`. That URL requires live DNS, Front Door, and Stripe TEST mode. A prospect who wants to evaluate locally has no fast path documented that matches the "contributor" and "buyer" split the product aspires to.

8. **Interoperability gap creates workflow friction.** Only Azure DevOps and Microsoft Teams are natively supported. This limits "embeddedness" and creates workflow overhead for most enterprise teams before V1.1 connectors ship.

9. **Commercial enforcement at tier boundaries is well-engineered but untested by real customers.** The `[RequiresCommercialTenantTier]` filter, packaging metadata regression tests, and commercial boundary hardening sequence are solid in code. But no real tenant has hit a tier boundary naturally, which means edge cases in the commercial model are undiscovered.

10. **Product learning "planning bridge" intentionally deferred.** The theme-derivation and plan-draft builder are deferred. Without this, ArchLucid's advisory and recommendation learning surface produces observations but no actionable roadmap — reducing stickiness in the Operate layer.

---

## Top 5 Monetization Blockers

1. **No live commerce path.** Stripe is in TEST mode. The Azure Marketplace listing is not published. The only paid-customer path is a paper ORDER_FORM_TEMPLATE.md. Self-serve revenue cannot start until V1.1 un-hold.

2. **No validated ROI data for the sales conversation.** Every ROI figure is a model estimate. Sophisticated buyers ask "show me a customer who saved X hours." The answer today is: "here is our model." This significantly extends sales cycles and reduces close rates.

3. **Multi-stakeholder buying with no independent assurance.** Enterprise architecture software requires EA + Security + Procurement sign-off. Security reviewers will request SOC 2 or a pen test. Neither is available in V1. This adds 4–8 weeks to deal cycles as procurement waits for assurance evidence.

4. **No public reference customer.** Enterprises buy from vendors with reference customers in their industry. Without one, every prospect is first. That is a hard conversation with enterprise procurement.

5. **Trial-to-paid conversion requires owner action (quota allocation, Stripe flip).** Even if a self-serve trial user is convinced, converting them to paid requires the owner to flip Stripe live keys (V1.1). There is no automatic conversion path in V1.

---

## Top 5 Enterprise Adoption Blockers

1. **SOC 2 Type II attestation is absent.** No SOC 2 = no InfoSec approval at most enterprise and regulated-industry accounts. The self-assessment is a good placeholder but will not clear a formal security review.

2. **No ITSM integrations.** Architecture teams at enterprise scale work in Jira, ServiceNow, or Azure Boards. Requiring teams to manually export ArchLucid findings and copy them into their ITSM system kills adoption velocity and makes ArchLucid "extra work" rather than a workflow improvement.

3. **Executed pen test not published.** Security reviewers routinely ask for a pen test summary as part of vendor questionnaires. "In flight" with no published summary is treated as "no pen test" by procurement teams.

4. **Generic OIDC for Enterprise tier is roadmap only.** Enterprise tenants with non-Microsoft identity providers (Okta, Ping, Auth0) cannot use the JwtBearer mode without Entra ID. This limits the addressable enterprise segment to Microsoft-first organizations in V1.

5. **Procurement evidence pack is self-asserted and template-heavy.** The DPA, MSA, and legal docs are clearly templates that need legal review and customer-specific negotiation. For enterprise customers with existing vendor management processes, these need to be completed documents, not templates.

---

## Top 5 Engineering Risks

1. **Persistence layer at ~53% coverage for the assembly doing the hardest data work.** The relational/JSON dual-representation for manifests is a correctness risk that is only partially covered by tests. Silent data divergence between relational and JSON paths could cause subtle manifest hydration bugs that are hard to detect in production.

2. **Trial funnel E2E not validated.** If the trial signup → tenant provisioning → first run → guided tour chain has any breakage, prospects will silently drop out. There is currently no documented evidence that this flow works end-to-end in TEST mode.

3. **LLM output quality gate disabled in development.** The quality gate (`ArchLucid:AgentOutput:QualityGate:Enabled`) is off in `appsettings.Development.json`. This means developers get no signal on output quality degradation during prompt or model changes until it hits production or the CI eval script.

4. **ACR push not in CI.** The Container Apps deployment depends on images being in ACR. If the image push is manual, a production deployment could be made from a locally-built image that differs from the CI-tested artifact. This is a deployment integrity risk.

5. **Real-mode LLM output regression not in CI.** Simulator mode is deterministic but does not validate actual LLM output quality. A prompt regression, model version change, or API behavior change can cause finding quality to degrade without any CI signal until a pilot reports poor findings.

---

## Most Important Truth

ArchLucid is a technically sophisticated product built with unusual engineering discipline for its stage — but it is a product that no enterprise has yet purchased, validated, or publicly endorsed. The gap between what the product can do and what the market has confirmed it is worth is the only gap that matters right now. Documentation, architecture, and governance features cannot substitute for a single committed pilot with published results. Everything else is preparation for a conversation that has not yet happened.

---

## Top Improvement Opportunities

### Improvement 1: Validate the Trial Signup Funnel End-to-End in TEST Mode

**Why it matters:** This is an explicit V1 obligation (V1_DEFERRED.md §6b — "The trial funnel TEST-mode end-to-end work (Improvement 2) stays a live V1 obligation"). If the signup → tenant provisioning → first run → guided tour → Stripe TEST checkout flow has any breakage, the primary self-serve acquisition path fails silently. The cost of not doing this is discovering the funnel is broken during a live demo or a sales-led pilot.

**Expected impact:** Directly reduces Adoption Friction risk, validates Decision Velocity infrastructure, and ensures the commercial motion can begin as designed at V1 GA.

**Affected qualities:** Adoption Friction, Decision Velocity, Commercial Packaging Readiness, Time-to-Value.

**Status:** Fully actionable now.

**Cursor Prompt:**

```
Validate and repair the ArchLucid trial signup funnel end-to-end in Stripe TEST mode.

SCOPE: The trial funnel is: Marketing landing page → POST /v1/register (signup form) → Entra External ID or email/password auth → tenant provisioning (POST /v1/tenants/provision or equivalent) → first-run wizard with sample preset → auto-execute simulator run → guided tour → trial expiry → Stripe TEST mode checkout.

TASKS:
1. Trace the full signup API path from `RegistrationController.RegisterAsync` through tenant provisioning, role assignment, and sample data seeding. Document every step in `docs/runbooks/TRIAL_FUNNEL.md` (create or update).
2. Write an integration test `TrialSignupFunnelIntegrationTests` in `ArchLucid.Api.Tests` that exercises: POST /v1/register → GET /api/auth/me (verify Admin role) → POST /v1/architecture/request (verify sample preset accepted) → GET /v1/architecture/run/{runId} (poll for ReadyToCommit) → POST /v1/architecture/run/{runId}/commit → GET /v1/artifacts/manifests/{manifestId} (verify artifacts present). Use WebApplicationFactory with InMemory storage and Simulator mode. Tag with [Trait("Suite", "Core"), Trait("Category", "Integration")].
3. Verify that `archlucid_first_session_completed_total` increments on first commit in the test.
4. Verify that `archlucid_trial_signup_baseline_skipped_total` increments when the baseline field is omitted from POST /v1/register.
5. In `archlucid-ui/src/`, verify the signup form at `(marketing)/get-started` or equivalent renders without errors and submits to the correct endpoint. Fix any 404 or misconfigured API route.
6. Document any breakages found as `TRIAL_FUNNEL_ISSUES.md` in `docs/runbooks/`.

CONSTRAINTS:
- Do not modify production Stripe keys or billing webhooks.
- Do not change the existing RegistrationController signature.
- Tests must use `[ArchLucidAuth:Mode]=DevelopmentBypass` and `[AgentExecution:Mode]=Simulator` — no live LLM calls.
- Acceptance criteria: all new integration tests pass in CI. `docs/runbooks/TRIAL_FUNNEL.md` exists and describes the happy path end-to-end.
```

**Impact:** Directly reduces Adoption Friction risk (+6–8 pts risk reduction), Decision Velocity (+3–4 pts), Commercial Packaging Readiness (+2–3 pts). Weighted readiness impact: +0.3–0.5%.

---

### Improvement 2: Add Docker Compose Evaluator Quickstart

**Why it matters:** The `BUYER_FIRST_30_MINUTES.md` describes a SaaS path at `archlucid.net`. Prospects who arrive at GitHub and want to evaluate locally before committing to Azure have no fast path. The contributor path (Docker, SQL, .NET, Terraform, CLI) is complex. A purpose-built evaluator Docker Compose with pre-seeded sample data and zero configuration reduces the "evaluate before you trust" barrier significantly.

**Expected impact:** Directly reduces Adoption Friction for GitHub-arriving prospects. Provides a demo environment that sales engineers can run locally.

**Affected qualities:** Adoption Friction, Time-to-Value, Marketability.

**Status:** Fully actionable now.

**Cursor Prompt:**

```
Create a Docker Compose "evaluator quickstart" that lets a prospect run a complete ArchLucid Core Pilot locally in under 15 minutes with zero Azure subscription or .NET development environment required.

SCOPE: A new `docker-compose.evaluator.yml` at the repo root, a `docs/EVALUATOR_QUICKSTART.md` doc, and a seed script.

TASKS:
1. Create `docker-compose.evaluator.yml` with services:
   - `archlucid-api`: uses the existing `ArchLucid.Api` Dockerfile; sets `ArchLucidAuth__Mode=DevelopmentBypass`, `AgentExecution__Mode=Simulator`, `ConnectionStrings__ArchLucid=<localdb>`, `ASPNETCORE_ENVIRONMENT=Development`.
   - `archlucid-ui`: uses the existing `archlucid-ui` Dockerfile; sets `NEXT_PUBLIC_API_URL=http://localhost:5000`.
   - `archlucid-db`: uses `mcr.microsoft.com/mssql/server:2022-latest`; exposes 1433 on localhost.
   - `archlucid-seed`: a one-shot container that runs `archlucid-cli seed-demo` or equivalent to seed the Contoso Retail sample run.
2. In the seed step, use `POST /v1/architecture/run/{runId}/seed-fake-results` followed by `POST /v1/architecture/run/{runId}/commit` to produce a complete committed run with artifacts before the user opens the UI.
3. Create `docs/EVALUATOR_QUICKSTART.md` with:
   - Pre-requisites: Docker Desktop only.
   - Three commands: `docker compose -f docker-compose.evaluator.yml up`, open `http://localhost:3000`, sign in as admin.
   - The Core Pilot four steps (pointing to the pre-seeded Contoso run as the starting point).
   - Scope header: `> **Scope:** Zero-dependency local evaluator path for buyers — Docker only; no Azure, no .NET SDK, no SQL Server install.`
4. Add a link to `EVALUATOR_QUICKSTART.md` from `BUYER_FIRST_30_MINUTES.md` under "No local install" as a "prefer not to wait for archlucid.net?" option.
5. Ensure all containers are healthy-check wired so the seed step waits for the API to be ready before seeding.

CONSTRAINTS:
- The evaluator compose file must not require any Azure credentials, Stripe keys, or Entra ID configuration.
- Do not modify the existing `docker-compose.yml` (contributor path).
- DevelopmentBypass mode is acceptable; add a prominent disclaimer in the doc that this mode is for evaluation only, not production.
- Acceptance criteria: `docker compose -f docker-compose.evaluator.yml up` starts, seed completes, UI accessible at :3000, and a pre-committed run with artifacts is visible without any manual API calls.
```

**Impact:** Directly improves Adoption Friction (+6–8 pts), Time-to-Value (+4–5 pts), Marketability (+2–3 pts). Weighted readiness impact: +0.5–0.8%.

---

### Improvement 3: Complete CAIQ Lite and SIG Core Procurement Pre-fills with Evidence Citations

**Why it matters:** The CAIQ Lite and SIG Core questionnaires are "draft fields." Enterprise security reviewers use these as the primary evidence artifact in vendor qualification. Completing them with specific, citation-backed answers pointing to in-repo evidence (OWASP ZAP, RLS, audit matrix, STRIDE, etc.) converts "self-asserted draft" into "self-asserted with citation trail" — a materially better procurement posture.

**Expected impact:** Directly improves Procurement Readiness and Compliance Readiness. Reduces hold time in security review.

**Affected qualities:** Procurement Readiness, Compliance Readiness, Trustworthiness.

**Status:** Fully actionable now.

**Cursor Prompt:**

```
Complete the CAIQ Lite and SIG Core procurement questionnaire pre-fills with specific, citation-backed answers pointing to in-repo evidence.

FILES TO UPDATE:
- `docs/security/CAIQ_LITE_2026.md`
- `docs/security/SIG_CORE_2026.md`

TASKS:
1. For each CAIQ Lite question domain (Access Control, Audit, Change Management, Configuration Management, Data Security, Encryption, Governance, Incident Response, Physical, Risk, Security Assessment, Supply Chain), provide:
   - A concrete answer (Yes/No/Partial) with the specific implementation evidence.
   - A citation URL pointing to the specific section of a specific in-repo file (e.g., `[AUDIT_COVERAGE_MATRIX.md §Operations → durable audit](../library/AUDIT_COVERAGE_MATRIX.md)`, `[SECURITY.md §OWASP ZAP](../library/SECURITY.md)`, `[MULTI_TENANT_RLS.md](../security/MULTI_TENANT_RLS.md)`).
   - Where a control is genuinely not in place, state "No — planned for V1.1" rather than leaving a blank.

2. Key evidence sources to cite (read each file before completing):
   - Access control: `docs/library/SECURITY.md` §RBAC, §DevelopmentBypass production guard
   - Audit: `docs/library/AUDIT_COVERAGE_MATRIX.md` (119 event constants, append-only design, DB-level DENY)
   - Encryption: `docs/security/MANAGED_IDENTITY_SQL_BLOB.md`, Azure SQL TDE, Key Vault
   - Incident response: `docs/go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md`
   - Risk/Threat model: `docs/security/SYSTEM_THREAT_MODEL.md`
   - Penetration testing: `docs/security/pen-test-summaries/2026-Q2-SOW.md` (SoW submitted; engagement in flight)
   - Vulnerability scanning: CI OWASP ZAP + Schemathesis (cite `.github/workflows/ci.yml` job names)
   - Data residency: `docs/go-to-market/TENANT_ISOLATION.md`
   - SOC 2: `docs/security/SOC2_SELF_ASSESSMENT_2026.md` (self-assessment; Type II V1.1)

3. For SIG Core, focus on the highest-priority domains for the target buyer segments (Healthcare, Financial Services): IA (Identity and Access), HR (Incident Response), TVM (Threat/Vulnerability Management), DSP (Data Security and Privacy), GRM (Governance, Risk, Compliance).

4. Update the Trust Center ZIP endpoint index (`docs/trust-center.md`) to note that CAIQ Lite and SIG Core pre-fills are now "substantively populated (self-asserted)" rather than draft.

CONSTRAINTS:
- Do not fabricate controls that don't exist — mark gaps honestly as V1.1 or "manual process."
- Do not state SOC 2 Type II attestation is complete.
- Preserve the existing file format and scope header.
- Acceptance criteria: every CAIQ Lite control domain has at least one specific evidence citation; no domain has blank fields.
```

**Impact:** Directly improves Procurement Readiness (+8–12 pts), Compliance Readiness (+5–8 pts), Trustworthiness (+3–4 pts). Weighted readiness impact: +0.4–0.6%.

---

### Improvement 4: Deepen Azure DevOps Integration — Findings to Work Items

**Why it matters:** Azure DevOps is the one ITSM integration V1 ships. It is currently described as "basic." Deepening it to support finding → Azure Boards work item creation with correlation link-back gives enterprise teams a real workflow bridge before Jira and ServiceNow arrive in V1.1. This is the single highest-leverage integration improvement that doesn't require a new vendor agreement.

**Expected impact:** Materially improves Workflow Embeddedness for Azure DevOps-using enterprise teams.

**Affected qualities:** Workflow Embeddedness, Interoperability, Stickiness.

**Status:** Fully actionable now.

**Cursor Prompt:**

```
Deepen the Azure DevOps integration in `ArchLucid.Integrations.AzureDevOps` to support creating Azure Boards work items from ArchLucid findings, with a correlation link back to the ArchLucid run.

SCOPE: New `IFindingWorkItemSyncService` interface, a `AzureDevOpsWorkItemCreator` implementation, a new API endpoint `POST /v1/integrations/azure-devops/work-items` (Standard tier), and a UI affordance on finding detail.

TASKS:
1. Add an interface `IFindingWorkItemSyncService` in `ArchLucid.Integrations.AzureDevOps`:
   - `Task<WorkItemSyncResult> CreateWorkItemFromFindingAsync(Guid tenantId, Guid runId, Guid findingId, CancellationToken ct)`
   - `WorkItemSyncResult` contains `{ WorkItemId, WorkItemUrl, FindingId, RunId, CreatedUtc }`.

2. Implement `AzureDevOpsWorkItemCreator` using the existing Azure DevOps REST API pattern (HTTPS POST to `https://dev.azure.com/{org}/{project}/_apis/wit/workitems/$Task?api-version=7.1`). The work item should:
   - Set `System.Title` = "ArchLucid Finding: {Finding.Category} – {Finding.Title}"
   - Set `System.Description` = finding ExplainabilityTrace summary + a "ArchLucid Run Link: {runDetailUrl}/{runId}" back-link
   - Set `System.Tags` = "archlucid; {Finding.Severity}"
   - Use the PAT or OAuth token stored in the tenant's Azure DevOps integration config (existing `AzureDevOpsIntegrationConfig` schema or equivalent).

3. Add a new API controller `AzureDevOpsFindingWorkItemsController` at `POST /v1/integrations/azure-devops/work-items`:
   - Accept `{ RunId, FindingId }` JSON body.
   - Decorate with `[RequiresCommercialTenantTier(TenantTier.Standard)]`.
   - Emit a durable audit event `AuditEventTypes.AzureDevOpsFindingWorkItemCreated` (add the constant to `AuditEventTypes.cs` and update `AUDIT_COVERAGE_MATRIX.md`).
   - Return `WorkItemSyncResult` on success, 404 if finding not found, 409 if a work item already exists for this finding (store the mapping in `dbo.FindingWorkItemMappings` — add a migration).

4. In `archlucid-ui`, add a "Create Azure DevOps work item" button on the finding detail panel that calls the new endpoint and shows the resulting work item URL as a clickable link. Only show if the tenant has Azure DevOps integration configured (check via `GET /api/integrations/azure-devops/status` or equivalent).

5. Write unit tests in `ArchLucid.Integrations.AzureDevOps.Tests`:
   - `AzureDevOpsWorkItemCreator_creates_work_item_with_correct_fields` (mock HTTP client)
   - `AzureDevOpsFindingWorkItemController_returns_409_on_duplicate` (WebApplicationFactory with InMemory)

CONSTRAINTS:
- Do not change existing Azure DevOps pipeline/PR integration code.
- The new endpoint must follow the existing auth, scope, and commercial tier patterns.
- Acceptance criteria: unit tests pass; `/v1/integrations/azure-devops/work-items` returns 200 with WorkItemSyncResult on first call and 409 on duplicate; audit event is emitted and appears in dbo.AuditEvents.
```

**Impact:** Directly improves Workflow Embeddedness (+8–12 pts), Interoperability (+4–6 pts), Stickiness (+3–4 pts). Weighted readiness impact: +0.4–0.6%.

---

### Improvement 5: Improve ArchLucid.Persistence Test Coverage from ~53% to ≥70%

**Why it matters:** The persistence assembly does the hardest data integrity work: manifest hydration with relational/JSON merge, run archival cascades, data consistency orphan detection, and the append-only audit store. At ~53% coverage, silent data integrity issues are the most likely production failure mode. This is the lowest-coverage assembly in the solution and the one where bugs cause the most damage.

**Expected impact:** Directly improves Correctness. Reduces production data integrity risk.

**Affected qualities:** Correctness, Data Consistency, Reliability.

**Status:** Fully actionable now.

**Cursor Prompt:**

```
Improve test coverage in `ArchLucid.Persistence` (and related persistence sub-projects) from ~53% to at least 70% line coverage by targeting the highest-risk uncovered paths identified in the coverage gap analysis.

CONTEXT: Read `docs/library/COVERAGE_GAP_ANALYSIS_RECENT.md` and `docs/COVERAGE_GAP_ANALYSIS.md` to identify specific uncovered branches. The highest-risk areas based on code complexity are:
1. Relational/JSON merge fallback paths in `GoldenManifestRepository` hydration
2. Run archival cascade branches (`SqlRunRepository.ArchiveAsync`)
3. `DataConsistencyOrphanProbeHostedService` edge cases
4. `AuditRepository.AppendAsync` under failure conditions (retry exhaustion)

TASKS:
1. Run `dotnet test ArchLucid.Persistence.Tests --collect:"XPlat Code Coverage" -c Release` and review the resulting `coverage.cobertura.xml` to identify the top 10 uncovered methods by line count.

2. For each uncovered path, write a targeted test using the naming pattern `{ClassName}{Scenario}DirectSqlIntegrationTests` or `{ClassName}{Scenario}Tests`:
   a. **GoldenManifest partial relational hydration when `ComplianceJson` is valid JSON but `DecisionsJson` is empty:** assert that `HydrateAsync` returns an empty `Decisions` list (not null, not an exception).
   b. **Run archival cascade when `ArtifactBundles` table has no rows for the run:** assert that `ArchiveRunAsync` completes successfully without a cascade error (empty cascade is valid).
   c. **`DataConsistencyOrphanProbeHostedService` when `DataConsistency:Enforcement:Mode` is `Quarantine`:** assert that a detected orphan in `dbo.GoldenManifests` produces a row in `dbo.DataConsistencyQuarantine` and increments `archlucid_data_consistency_orphans_quarantined_total`.
   d. **`AuditRepository.AppendAsync` when the database is temporarily unreachable:** assert that `DurableAuditLogRetry` exhausts retries and logs an error without throwing, so the calling orchestration path continues.
   e. **Idempotency repository `TryInsertAsync` when called with a key that already exists:** assert that the second call returns `false` without throwing a primary key exception (this SQL integration test should exist; verify it is in the Core suite and add it if missing).

3. Tag all new tests with `[Trait("Suite", "Core"), Trait("Category", "Integration")]` where they require a real SQL Server, or `[Trait("Suite", "Core")]` for in-memory variants.

4. Re-run coverage after adding tests and confirm the Persistence assembly is at or above 70%.

5. Update `docs/library/COVERAGE_GAP_ANALYSIS_RECENT.md` with a new dated entry for this improvement.

CONSTRAINTS:
- Use the existing SQL integration test infrastructure (`TestDbConnection`, `SqlServerContainerFixture` or equivalent).
- Do not reduce test isolation: each test must be independent and not rely on side effects from other tests.
- Do not skip or suppress existing failing tests — fix them if found.
- Acceptance criteria: `ArchLucid.Persistence` line coverage ≥ 70% as reported by ReportGenerator; all new tests pass in CI.
```

**Impact:** Directly improves Correctness (+5–7 pts), Data Consistency (+3–4 pts), Reliability (+2–3 pts). Weighted readiness impact: +0.4–0.6%.

---

### Improvement 6: Add "Quick Start with Sample Data" Fast Path to First-Run Wizard

**Why it matters:** The 7-step wizard is the first experience for every new user. For an evaluator who wants to see output before investing time in inputs, it is a barrier. A single "Start with sample data" button that skips all wizard inputs and submits a pre-filled vertical-appropriate request takes a 10-minute first experience and makes it 60 seconds. This is the fastest available improvement to Time-to-Value and first-impression quality.

**Expected impact:** Directly improves Adoption Friction and Time-to-Value for the first session.

**Affected qualities:** Adoption Friction, Time-to-Value, Usability, Cognitive Load.

**Status:** Fully actionable now.

**Cursor Prompt:**

```
Add a "Start with sample data" fast path to the first-run wizard in `archlucid-ui` that bypasses all 7 wizard steps and submits a pre-filled architecture request using a vertical-appropriate sample preset.

CONTEXT: The first-run wizard is at `src/app/(operator)/new-run/` (or equivalent). The wizard currently requires 7 steps before submission. The goal is to add a zero-input path for evaluators.

TASKS:
1. On the first wizard step (step 1 of 7, system identity), add a prominently placed "Start with Contoso sample →" button (or equivalent sample label from the demo data). This button should:
   - Be visually distinct from "Continue" (secondary button style, positioned above the form)
   - Show a tooltip/hint: "Skip setup and see a completed analysis immediately — you can run with your own inputs after"

2. When clicked, the button submits `POST /v1/architecture/request` with the Contoso Retail Modernization sample preset payload (the same data used for `POST /v1/architecture/run/{runId}/seed-fake-results`). Use the existing sample preset data from `ArchLucid.AgentSimulator` or `ArchLucid.Api.Tests`. The request should include a recognizable `Description` like "Contoso Retail Modernization (sample)".

3. After submission, navigate directly to the run tracking page (`/runs/{runId}`) without showing the remaining 6 wizard steps.

4. Update the onboarding checklist / guided tour (if implemented in the UI) to mark "Run with sample data" as a completed step when this path is used.

5. Add a Vitest test `QuickStartButton.test.tsx` that:
   - Renders the first wizard step
   - Asserts the "Start with sample" button is present
   - Asserts clicking it calls `POST /v1/architecture/request` with a payload that includes the expected `Description` field
   - Asserts the user is redirected to `/runs/{runId}` on success

6. Ensure the "Start with sample" button is only shown on the first run (i.e., when the tenant has zero prior runs). Use `GET /v1/architecture/runs?limit=1` or the existing run list hook to check. Remove it from subsequent runs.

CONSTRAINTS:
- Do not modify the existing 7-step wizard flow for users who continue through it normally.
- The quick-start path must use the same `POST /v1/architecture/request` endpoint as the normal wizard.
- Do not add any new API endpoint.
- Acceptance criteria: new Vitest test passes; "Start with sample" button visible on first login; clicking it results in a committed run visible in the Runs list within seconds (simulator mode); button is absent after first run exists.
```

**Impact:** Directly improves Adoption Friction (+5–7 pts), Time-to-Value (+4–6 pts), Usability (+3–5 pts). Weighted readiness impact: +0.4–0.6%.

---

### Improvement 7: Synthetic Pilot Evidence — Add Timing Instrumentation and Before/After Report

**Why it matters:** Every ROI claim in ArchLucid is model-derived. The product can instrument actual pipeline timing from the first commit and display a "You went from request to committed manifest in X minutes vs your Y-hour baseline" message. Even with simulator-mode runs, this produces a real timing measurement (the actual wall-clock time from request creation to commit). For evaluators, seeing "your first ArchLucid run completed in 2 minutes vs your 40-hour baseline" is a more compelling data point than any spreadsheet model.

**Expected impact:** Directly improves Proof-of-ROI Readiness and Marketability by producing empirical evidence from each user's own session rather than model estimates.

**Affected qualities:** Proof-of-ROI Readiness, Marketability, Executive Value Visibility, Stickiness.

**Status:** Fully actionable now.

**Cursor Prompt:**

```
Add timing instrumentation to the authority pipeline and display a "first run timing" comparison in the operator UI after a successful first commit.

TASKS:
1. In `ArchLucid.Application` or `ArchLucid.Persistence`, ensure `dbo.Runs` records both `CreatedUtc` (already present) and `CommittedUtc` (add a column via migration if not present, or use the existing `GoldenManifests.CreatedUtc` as the commit timestamp proxy).

2. After a successful `POST /v1/architecture/run/{runId}/commit`, the commit response (`ArchLucidCommitRunResponse` or equivalent) should include:
   - `runDurationMinutes` (integer): wall-clock minutes from `Runs.CreatedUtc` to commit time.
   - This field is purely informational and does not affect any business logic.

3. In `archlucid-ui`, on the run detail page after a successful commit, display a "First run timing" banner:
   - "Your first ArchLucid run completed in N minutes. Compare this to your baseline review time."
   - If `baselineReviewCycleHours` is set on the tenant (from signup), show: "You ran ArchLucid analysis in N minutes vs your self-reported {baseline} hour baseline — that's a {delta}x speedup on time-to-manifest."
   - If baseline is not set (model default), show: "Your analysis completed in N minutes. A typical manual review takes 30–60 hours."
   - The banner should be dismissible and should only appear once (store `hasSeenTimingBanner` in localStorage).

4. Add the `runDurationMinutes` to the first-value Markdown report generated by `ValueReportReviewCycleSectionFormatter` so the sponsor PDF shows actual timing, not just model estimates.

5. Write a unit test `CommitResponseIncludesRunDurationTests` that verifies `runDurationMinutes` is populated and is a positive integer in the commit response.

CONSTRAINTS:
- `runDurationMinutes` is advisory only — it must not affect commit semantics or error handling.
- If `CommittedUtc` - `CreatedUtc` < 1 minute, set `runDurationMinutes = 1` (avoid displaying "0 minutes").
- The banner must be screen-reader accessible (announce completion with `aria-live="polite"`).
- Acceptance criteria: unit test passes; commit response includes `runDurationMinutes`; UI banner shows after first commit and is dismissible; first-value report Markdown includes actual timing.
```

**Impact:** Directly improves Proof-of-ROI Readiness (+5–8 pts), Marketability (+3–4 pts), Executive Value Visibility (+2–3 pts). Weighted readiness impact: +0.4–0.6%.

---

### Improvement 8: Add "Copy as Work Item" Clipboard Affordance on Finding Detail

**Why it matters:** Jira, ServiceNow, and GitHub Issues integrations are V1.1. But engineers reviewing findings in ArchLucid need to get those findings into their task management system today. A "Copy as Jira ticket" / "Copy as GitHub Issue" / "Copy as work item" button that pre-formats the finding as a properly structured markdown issue body takes zero integration effort and eliminates the most common workflow complaint: "I have to manually retype this finding into our tracking system."

**Expected impact:** Improves Workflow Embeddedness immediately without any backend integration work.

**Affected qualities:** Workflow Embeddedness, Usability, Adoption Friction, Stickiness.

**Status:** Fully actionable now.

**Cursor Prompt:**

```
Add a "Copy as work item" clipboard button to the finding detail view in `archlucid-ui` that pre-formats the finding as a structured markdown work item body.

CONTEXT: Findings are displayed on the run detail page. Users who want to track a finding in Jira, GitHub Issues, or Azure DevOps must currently manually copy content. This task adds a one-click copy button.

TASKS:
1. In the finding detail panel (likely `src/components/FindingDetail.tsx` or equivalent), add a "Copy as work item" button (secondary button, icon: clipboard). The button should be positioned near the finding title.

2. When clicked, the button copies the following markdown to the clipboard:

```
## Finding: {Finding.Category} — {Finding.Title}

**Severity:** {Finding.Severity}
**Run:** {runId}
**ArchLucid Finding ID:** {findingId}

### What was flagged
{Finding.Description}

### Why it matters
{ExplainabilityTrace.Rationale or first populated field}

### Evidence
{ExplainabilityTrace.EvidenceCited or ExplainabilityTrace.SourcesExamined}

### Recommended actions
{Finding.RecommendedActions joined with newlines}

### Links
- ArchLucid run: {window.location.origin}/runs/{runId}
- Finding detail: {window.location.origin}/runs/{runId}/findings/{findingId}
```

3. After clicking, show a brief "Copied!" confirmation toast (use the existing toast component; auto-dismiss after 2 seconds). Change the button icon from clipboard to checkmark while the toast is visible.

4. Add a second variant: a dropdown next to the copy button with options "Copy for Jira", "Copy for GitHub Issues", "Copy for Azure DevOps". Each variant adjusts the format slightly (Jira uses `h2.` prefix, GitHub uses `###`, Azure DevOps uses plain markdown). Default format is generic markdown.

5. Write a Vitest test `FindingDetail.copy.test.tsx` that:
   - Renders a `FindingDetail` component with a mock finding
   - Mocks `navigator.clipboard.writeText`
   - Asserts clicking "Copy as work item" calls `clipboard.writeText` with a string containing the finding title and run ID
   - Asserts the "Copied!" toast appears

6. Ensure the button is accessible: add `aria-label="Copy finding as work item to clipboard"` and keyboard-activatable.

CONSTRAINTS:
- No backend API changes required.
- The copy format must degrade gracefully when `ExplainabilityTrace` fields are null (show "Not available" for empty fields rather than blank lines).
- Do not add a new dependency for clipboard handling — use `navigator.clipboard.writeText` with a fallback to `document.execCommand('copy')` for older browsers.
- Acceptance criteria: Vitest test passes; button copies correctly formatted markdown; "Copied!" toast visible; accessible via keyboard.
```

**Impact:** Directly improves Workflow Embeddedness (+4–6 pts), Usability (+2–3 pts), Stickiness (+2–3 pts). Weighted readiness impact: +0.2–0.4%.

---

## Deferred Scope Uncertainty

The following items were referenced as deferred but the markdown confirming the deferral was located:
- Commerce un-hold (Stripe live keys + Marketplace publish): confirmed deferred in `V1_DEFERRED.md §6b`
- Public reference customer: confirmed deferred in `V1_DEFERRED.md §6b`
- Pen test execution + summary: confirmed deferred in `V1_DEFERRED.md §6c`
- PGP key drop: confirmed deferred in `V1_DEFERRED.md §6c`
- ITSM connectors (Jira, ServiceNow, Confluence): confirmed V1.1 in `V1_DEFERRED.md §6`
- MCP server: confirmed V1.1 in `V1_DEFERRED.md §6d`
- Slack connector: confirmed V2 in `V1_DEFERRED.md §6a`

No deferred items were found that lacked markdown evidence.

---

## Pending Questions for Later

### Improvement 1 (Trial Funnel Validation)
- Is `staging.archlucid.net` currently accessible and does it have Entra External ID (CIAM) configured for trial auth?
- Has the tenant provisioning flow (`POST /v1/register`) been tested against a real Entra External ID token, or only in DevelopmentBypass mode?

### Improvement 2 (Docker Compose Evaluator)
- Is there a pre-built base Docker image in a public registry, or should the evaluator compose build from source (which requires .NET SDK)?
- Should the seed step use the Contoso Retail demo data or a different sample?

### Improvement 4 (Azure DevOps Integration)
- Does an existing Azure DevOps integration config schema exist in the database (PAT storage, org URL, project name)?
- What is the current state of `ArchLucid.Integrations.AzureDevOps` — is there a working PAT auth client, or does that need to be built from scratch?

### Improvement 7 (Timing Instrumentation)
- Does `dbo.Runs` already have a `CommittedUtc` column or is that a new migration?
- Is `baselineReviewCycleHours` stored at the tenant level after signup capture, or is it only in-flight during registration?

### General Questions
- Is `archlucid.net` DNS live today, or is the buyer-facing SaaS still only at `staging.archlucid.net`?
- Has any real (non-demo) architecture request ever been submitted through the production or staging environment by a real user?
- Is the quote-request sales inbox (`Email:PricingQuoteSalesInbox`) configured to a real email address in staging/production?
