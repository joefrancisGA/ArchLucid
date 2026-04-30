> **Scope:** Independent quality assessment (D-series, 2026-04-30) — weighted readiness model across 46 qualities with improvement prompts; not a certification or audit.

# ArchLucid Assessment – Weighted Readiness 65.32%

**Date:** 2026-04-30  
**Assessor:** Independent first-principles review (D-series)  
**Basis:** Repository contents as of 2026-04-30 14:15 EDT — code, docs, tests, infra, CI, go-to-market materials  
**Method:** 46 qualities scored 1–100, weighted per supplied model, ranked by weighted deficiency  

---

## 1. Executive Summary

### Overall Readiness

ArchLucid is a **technically ambitious, architecturally sound V1** that has invested disproportionately in engineering integrity and documentation while leaving critical commercial and integration gaps. At 65.32% weighted readiness, the product is credible for a sales-led pilot with a willing champion but is **not ready for self-serve adoption or competitive enterprise evaluations**. The largest drags on readiness are adoption friction, workflow embeddedness, interoperability, and time-to-value — all of which are commercial-facing and high-weight.

### Commercial Picture

The product has a **strong differentiator** (AI architecture analysis + governance + explainability — no incumbent combines all three) but **no revenue engine running**. Stripe live keys are not flipped, the Azure Marketplace offer is not published, and the signup funnel is TEST-mode only. Pricing is documented but untested with real buyers. The sales-led motion depends on a champion who can tolerate a product that requires infrastructure setup, SQL Server provisioning, and significant onboarding effort. **Time-to-value is the most damaging commercial weakness**: getting from "interested" to "committed manifest" takes days of configuration, not minutes.

### Enterprise Picture

Governance, audit, and security are **unusually mature for a V1** — 117 typed audit events, RLS, RBAC, pre-commit gates, policy packs, segregation of duties, STRIDE threat model, ZAP/Schemathesis/CodeQL in CI. However, **workflow embeddedness is critically weak**: no Jira, ServiceNow, Slack, or CMDB connectors ship in V1 (all deferred to V1.1/V2). Enterprise buyers will hit this wall during evaluation. SOC 2 Type II is in-flight but not attestable. SCIM is shipped, which is positive. Interoperability is the single weakest enterprise quality.

### Engineering Picture

The codebase is **well-structured, heavily tested (563+ test files), modular, and observable** (30+ custom OTel metrics, 8 activity sources, Grafana dashboards). Architectural integrity is strong — clean layering, explicit DI composition, persistence abstraction (SQL + in-memory parity), rate limiting, circuit breakers. The main engineering risks are: (1) the dual-pipeline legacy (coordinator vs authority) adds complexity until the strangler fig completes, (2) Persistence assembly coverage at ~53% is the lowest, and (3) the LLM agent pipeline produces outputs that are difficult to validate for correctness without real-world calibration data.

---

## 2. Weighted Quality Assessment

Qualities ordered from most urgent (highest weighted deficiency) to least urgent.

**Weighted deficiency** = Weight × (100 − Score). Higher = more urgent.

### 2.1 Adoption Friction — Score: 48 | Weight: 6 | Deficiency: 312

**Justification:** Getting from "I want to try ArchLucid" to "I have a committed manifest" requires: provisioning SQL Server, configuring auth (Entra or API key), understanding the run pipeline mental model, learning the seven-step wizard, and interpreting findings. The self-serve trial funnel exists in code but is not live. Docker Compose helps locally but is not a customer deliverable. No "click here, paste your architecture description, see results" path exists.

**Tradeoffs:** The team chose infrastructure completeness (Terraform, RLS, private endpoints) over onboarding simplicity. This is defensible for enterprise sales but devastating for self-serve growth or competitive demos.

**Recommendations:** (1) Ship a hosted demo environment where a prospect can create a run without provisioning anything. (2) Reduce the wizard to a minimal-viable 2-step path (paste context → see findings). (3) Flip the trial funnel live with a free tier that auto-provisions a sandbox tenant.

**Fixability:** Partially V1 (hosted demo exists as scaffolding); full resolution is V1.1.

---

### 2.2 Time-to-Value — Score: 58 | Weight: 7 | Deficiency: 294

**Justification:** Even for a guided pilot, meaningful value (a committed manifest with actionable findings) requires: environment setup (hours to days), learning the domain model (runs, manifests, authority pipeline, golden corpus), running the first request through the wizard, understanding what the findings mean, and exporting something a sponsor can read. The PILOT_GUIDE and CORE_PILOT docs reduce this but cannot eliminate the inherent complexity. The "Concepts in 5 Minutes" doc exists but assumes the reader already has the product running.

**Tradeoffs:** The depth of the governance/audit/provenance model is the product's moat — but that depth is front-loaded onto the onboarding experience rather than progressively revealed.

**Recommendations:** (1) Build a "zero-config quick start" that runs the API in simulator mode with pre-loaded demo data and produces a committed manifest in under 60 seconds. (2) Add a guided first-run experience in the UI that auto-creates a sample run. (3) Time-box pilot onboarding: if an operator cannot reach a committed manifest in under 2 hours from first contact, the onboarding is too slow.

**Fixability:** V1 (simulator mode + demo seed infrastructure already exist).

---

### 2.3 Workflow Embeddedness — Score: 35 | Weight: 3 | Deficiency: 195

**Justification:** V1 ships with no Jira, ServiceNow, Confluence, or Slack connectors. Microsoft Teams is the only first-party chat-ops surface. There are no inbound data connectors (cannot import from Terraform state, ArchiMate, CMDB, or cloud provider APIs). Findings stay inside ArchLucid unless the customer builds a webhook consumer. The product is an island that requires manual bridging to existing workflows.

**Tradeoffs:** Building a stable core pipeline first, then integrating, is sound engineering. But enterprise buyers evaluate whether the tool fits into their existing workflow — not whether the tool works in isolation.

**Recommendations:** (1) Ship ServiceNow incident creation from findings (V1.1 priority per PENDING_QUESTIONS). (2) Add a Terraform state file import connector so prospects can start from existing infrastructure. (3) Build a finding → Jira issue webhook template that customers can deploy in under 30 minutes.

**Fixability:** V1.1 (explicitly deferred and planned).

---

### 2.4 Marketability — Score: 62 | Weight: 8 | Deficiency: 304

**Justification:** The product datasheet, competitive landscape, buyer personas, and positioning docs are thorough. The "AI Architecture Intelligence" category definition is compelling. But: (1) no live demo URL exists for a prospect to try without sales engagement, (2) no reference customers or case studies exist, (3) the website/marketing pages are functional but the "thin UI" admission in the competitive landscape doc is accurate, (4) the pricing page exists but checkout is not live, (5) no video demos or interactive walkthroughs are available.

**Tradeoffs:** Documentation depth is a strength — every claim is grounded in code. But documentation is not marketing. A prospect who visits the site sees pricing and technical docs, not a compelling "see it in action" experience.

**Recommendations:** (1) Record a 3-minute demo video showing the full pilot path (request → findings → manifest → export). (2) Ship a live public demo environment with pre-loaded showcase runs. (3) Create an interactive "Try it now" flow on the marketing site that shows real output without requiring signup.

**Fixability:** V1 (demo infrastructure exists; video recording and public showcase are execution tasks).

---

### 2.5 Interoperability — Score: 30 | Weight: 2 | Deficiency: 140

**Justification:** The product has a REST API, webhooks (CloudEvents), CLI, and a nascent API client package — but no inbound connectors, no standard architecture exchange formats (ArchiMate, TOGAF), no CMDB integration, no cloud provider API connectors, no MCP server (V1.1), and no data import beyond manual input and API calls. The competitive landscape doc openly acknowledges this as the #1 positioning gap.

**Tradeoffs:** Building proprietary integrations is expensive and creates maintenance burden. The webhook + API approach is flexible but shifts integration cost to the customer.

**Recommendations:** (1) Ship a Terraform `tfstate` importer as the first inbound connector (highest overlap with target buyer infrastructure). (2) Publish the OpenAPI spec as a first-class downloadable artifact with SDK generation guidance. (3) Add ArchiMate XML import support for the context ingestion pipeline.

**Fixability:** Terraform importer is V1-feasible (context ingestion pipeline already has `TerraformShowJsonInfrastructureDeclarationParser`). ArchiMate and CMDB are V1.1+.

---

### 2.6 Usability — Score: 52 | Weight: 3 | Deficiency: 144

**Justification:** The operator UI has 52+ pages across operator, marketing, and executive routes. Progressive disclosure (Show more links) is implemented. Role-aware shaping exists. But: (1) the UI is self-described as a "thin shell" and loses visual comparison against LeanIX/Ardoq, (2) the seven-step wizard is long and requires architecture domain knowledge, (3) cognitive load is high — the user must understand runs, manifests, findings, provenance, governance, policy packs, and comparisons, (4) error states reference correlation IDs rather than actionable remediation, (5) no in-app contextual help or tooltips exist beyond page-level LayerHeader guidance.

**Tradeoffs:** Building a thin shell that delegates to the API is architecturally sound and keeps the team small. But the UI is the product's face to non-technical evaluators.

**Recommendations:** (1) Add contextual help tooltips on key concepts (manifest, finding severity, governance gate). (2) Simplify the New Run wizard to 3 steps for the default case. (3) Add loading skeletons and progress indicators for long-running operations.

**Fixability:** V1 (UI changes, no architectural work required).

---

### 2.7 Proof-of-ROI Readiness — Score: 55 | Weight: 5 | Deficiency: 225

**Justification:** The PILOT_ROI_MODEL.md is well-written and practical — it defines what to measure, how to capture baselines, and what success looks like. But: (1) no automated ROI dashboard or report exists in the product, (2) the value report builder exists in code but requires manual interpretation, (3) no benchmark data from real pilots exists to anchor the model, (4) the "294K annual savings" claim is modeled, not proven.

**Tradeoffs:** Honest ROI modeling without inflated claims is the right approach for a V1. But buyers need to see their own numbers, not just a template.

**Recommendations:** (1) Build an in-product "Pilot Value Report" that auto-generates ROI metrics from the pilot's actual run data (time savings, findings count, governance coverage). (2) Add a baseline capture form in the UI that records pre-pilot metrics for comparison. (3) Ship the value report as a downloadable PDF alongside the sponsor one-pager.

**Fixability:** V1 (value report builder and sponsor one-pager infrastructure exist).

---

### 2.8 Decision Velocity — Score: 52 | Weight: 2 | Deficiency: 96

**Justification:** The product helps architects make better decisions but does not accelerate the decision-making process itself. Findings are presented as a list; there is no prioritized "do this first" action queue. The governance workflow adds process (approvals, SLA tracking) but also adds latency. No automated triage or recommended next action exists.

**Tradeoffs:** Adding AI-driven triage risks reducing trust if recommendations are wrong. Manual review is slower but safer for V1.

**Recommendations:** (1) Add a "Top 3 Actions" summary at the top of every committed manifest. (2) Implement finding severity-based auto-triage that surfaces critical findings first with recommended remediation. (3) Add a "decision log" view that tracks what was decided and when.

**Fixability:** V1 (finding severity and recommendations already exist; presentation change only).

---

### 2.9 Procurement Readiness — Score: 55 | Weight: 2 | Deficiency: 90

**Justification:** The procurement pack is surprisingly complete for a V1: DPA template, subprocessors register, CAIQ Lite, SIG Core, compliance matrix, SOC 2 self-assessment, order form template, and tenant isolation doc. But: (1) no SOC 2 Type II attestation exists (in-flight), (2) no executed pen test (SoW template only), (3) no formal SLA document (target only), (4) no VPAT/ACR for accessibility compliance, (5) the self-assessment is explicitly "non-attestation" evidence.

**Tradeoffs:** Honest disclosure of non-attestation status is correct. But enterprise procurement teams will flag missing SOC 2 Type II as a blocker.

**Recommendations:** (1) Accelerate SOC 2 Type I scoping (target 2026-06-15 per docs). (2) Execute the pen test (SoW exists). (3) Create a VPAT/ACR from the existing Axe accessibility testing results.

**Fixability:** V1.1 (SOC 2 and pen test are owner-gated; VPAT is V1-feasible).

---

### 2.10 Cognitive Load — Score: 50 | Weight: 1 | Deficiency: 50

**Justification:** The product imposes significant mental effort: 117 audit event types, 10 finding engines, 4 agent types, governance workflows with approval/promotion/activation, policy packs with versioning and scope resolution, comparison replay modes (artifact/regenerate/verify), and a dual-pipeline architecture legacy. The progressive disclosure in the UI helps but does not eliminate the underlying complexity. Documentation is extensive but distributed across 557+ markdown files.

**Tradeoffs:** Complexity is inherent in the domain (enterprise architecture governance). The question is whether the product absorbs that complexity or passes it to the user.

**Recommendations:** (1) Create a "Concepts in 60 Seconds" interactive walkthrough in the UI. (2) Reduce visible terminology to under 15 concepts for the Pilot layer. (3) Add a glossary tooltip system in the UI that defines terms on hover.

**Fixability:** V1 (UI and documentation changes).

---

### 2.11 Template and Accelerator Richness — Score: 38 | Weight: 1 | Deficiency: 62

**Justification:** The product ships with a finding engine plugin template (`templates/archlucid-finding-engine/`) and sample architecture requests for the wizard. But: (1) no pre-built architecture review templates for common patterns (microservices, event-driven, monolith migration), (2) no industry-specific templates (healthcare, financial services, government), (3) no policy pack templates beyond what the demo seeds, (4) no export templates beyond the built-in DOCX format.

**Tradeoffs:** Templates are marketing and sales enablement, not core product. But they dramatically accelerate time-to-value for pilots.

**Recommendations:** (1) Create 3-5 architecture request templates for common patterns. (2) Create a healthcare-specific policy pack template (aligns with target vertical). (3) Create a "migration readiness review" template that showcases the comparison/drift capability.

**Fixability:** V1 (content creation, no code changes).

---

### 2.12 Correctness — Score: 72 | Weight: 4 | Deficiency: 112

**Justification:** The pipeline produces structured findings with explainability traces, confidence ratings, and provenance links. 10 finding engines run in parallel with typed payloads. Golden corpus tests validate agent output structure. Property-based tests (FsCheck) cover governance transitions and manifest versioning. But: (1) correctness of LLM-derived findings depends on prompt quality and model behavior — no ground-truth validation dataset exists beyond the golden corpus, (2) the `ExplainabilityTraceCompletenessAnalyzer` measures trace structure completeness but not factual accuracy, (3) the `ExplanationFaithfulnessChecker` is a heuristic token-overlap measure, not a semantic correctness check.

**Tradeoffs:** Perfect correctness for AI-generated architecture findings is an unsolved problem. The product's approach (structured traces, confidence ratings, provenance) is the right mitigation — but buyers need to understand the confidence boundary.

**Recommendations:** (1) Build a calibration dataset of 50+ architecture reviews with known-correct findings for regression testing. (2) Add a "confidence calibration" metric that tracks how often high-confidence findings are confirmed by human reviewers. (3) Implement a finding feedback loop where operators can mark findings as correct/incorrect to improve future runs.

**Fixability:** Calibration dataset is V1; confidence calibration is V1.1.

---

### 2.13 Customer Self-Sufficiency — Score: 48 | Weight: 1 | Deficiency: 52

**Justification:** The CLI has `doctor` and `support-bundle` commands. Health endpoints exist. Troubleshooting docs reference correlation IDs. But: (1) no in-app diagnostics dashboard for operators, (2) no self-service tenant configuration UI beyond basic settings, (3) no guided troubleshooting flow ("my run failed — what do I check?"), (4) support depends on correlation IDs and log analysis rather than self-service resolution.

**Tradeoffs:** Keeping the support surface small reduces maintenance. But customers who cannot self-diagnose will create support tickets.

**Recommendations:** (1) Add an operator-facing diagnostics page showing recent pipeline failures with plain-language explanations. (2) Create a "Run Health" view that shows why a run is stuck or failed.

**Fixability:** V1 (UI page + existing diagnostics data).

---

### 2.14 Executive Value Visibility — Score: 64 | Weight: 4 | Deficiency: 144

**Justification:** The EXECUTIVE_SPONSOR_BRIEF exists and is well-written. The sponsor one-pager PDF builder exists in code. The executive review route (`/reviews/[runId]`) exists. But: (1) the executive summary is a separate export, not an in-product dashboard, (2) no executive-level KPI dashboard shows adoption metrics across runs/teams/findings, (3) the value report requires manual baseline input, (4) the pricing quote request exists but no CRM integration flows.

**Tradeoffs:** Building executive dashboards before having customers is premature. But executive visibility is what gets budget renewed.

**Recommendations:** (1) Build a tenant-level "Architecture Health Scorecard" dashboard showing trends across runs. (2) Make the sponsor one-pager available as a one-click export from any committed run. (3) Add a "Pilot Summary" page that executives can view without operator-level detail.

**Fixability:** V1 (scorecard page exists; enhancement needed).

---

### 2.15 Compliance Readiness — Score: 62 | Weight: 2 | Deficiency: 76

**Justification:** SOC 2 self-assessment completed. CAIQ Lite and SIG Core pre-fills done. Compliance matrix exists. DSAR process documented. GDPR subprocessors register maintained. But: (1) no SOC 2 Type I or Type II attestation, (2) no executed pen test, (3) no HIPAA BAA template (healthcare is a stated target vertical), (4) no FedRAMP pathway documented (government is a stated target scenario).

**Tradeoffs:** Compliance attestations are expensive and require organizational commitment beyond engineering.

**Recommendations:** (1) Create a HIPAA BAA template if healthcare is a serious target vertical. (2) Document the FedRAMP pathway or explicitly exclude government from V1 positioning. (3) Execute the pen test per the existing SoW.

**Fixability:** HIPAA BAA template is V1; attestations are V1.1 (owner-gated).

---

### 2.16 Trustworthiness — Score: 68 | Weight: 3 | Deficiency: 96

**Justification:** The product's trust architecture is strong: RLS, RBAC, append-only audit, explainability traces, provenance graphs, deterministic testing via simulator mode. The trust center page exists. But: (1) no independent validation (pen test, SOC 2 attestation) exists to back the claims, (2) the AI agent outputs have no formal accuracy guarantee — trust depends on the explainability traces being sufficient for human review, (3) no customer testimonials or reference accounts exist.

**Tradeoffs:** Trust is built over time with customers. V1 can only lay the foundation; actual trust requires operational track record.

**Recommendations:** (1) Execute the pen test and publish redacted results. (2) Add a "Trust Dashboard" in the product showing security posture metrics. (3) Develop a reference customer program with the first 3 pilots.

**Fixability:** V1.1 (pen test is owner-gated; reference program requires customers).

---

### 2.17 Commercial Packaging Readiness — Score: 60 | Weight: 2 | Deficiency: 80

**Justification:** Three tiers defined (Team $199/mo, Professional $899/mo, Enterprise custom). Pricing philosophy documented. Order form template exists. Feature matrix per tier specified. Marketplace alignment enforced by CI. But: (1) checkout is not live (Stripe TEST mode, Marketplace not published), (2) no metering infrastructure validates run counts against tier allowances in production, (3) the `[RequiresCommercialTenantTier]` filter exists but has not been exercised with real paid customers.

**Tradeoffs:** Not flipping commerce live until the product is proven in pilots is prudent. But it means the commercial machinery is untested.

**Recommendations:** (1) Run an end-to-end checkout flow in staging with Stripe TEST keys and verify the full lifecycle. (2) Implement run-count metering and overage alerting per tier. (3) Prepare for the V1.1 commerce un-hold with a checklist of owner-gated steps.

**Fixability:** V1 (staging checkout test); V1.1 (live commerce).

---

### 2.18 Stickiness — Score: 65 | Weight: 1 | Deficiency: 35

**Justification:** Governance workflows, audit trails, policy packs, and comparison/drift detection create switching costs once adopted. The durable manifest history becomes an organizational asset. But: (1) stickiness only matters after adoption — adoption friction is the bottleneck, (2) no data export or portability story exists for customers who want to leave, (3) no API-level integration locks customers in beyond the UI.

**Tradeoffs:** Building sticky features before proving adoption is premature optimization. But the governance model is genuinely sticky if adopted.

**Recommendations:** (1) Document a data portability/export path (builds trust, paradoxically increases stickiness). (2) Focus stickiness investment on the governance workflow, which creates organizational process dependency.

**Fixability:** V1 (documentation); V1.1 (enhanced portability).

---

### 2.19 Differentiability — Score: 78 | Weight: 4 | Deficiency: 88

**Justification:** The competitive landscape analysis is honest and well-grounded. "AI architecture analysis + governance + explainability" is a genuine three-way differentiator that no incumbent matches. 10 finding engines with typed payloads and explainability traces are technically unique. The provenance graph and comparison replay are novel. But: (1) the differentiator is hard to demonstrate in under 5 minutes, (2) "AI Architecture Intelligence" is a new category that buyers do not search for, (3) the thin UI undermines the differentiation story in visual evaluations.

**Tradeoffs:** Creating a new category is high-risk/high-reward. It requires market education, not just product capability.

**Recommendations:** (1) Create a 90-second "differentiation demo" that shows the explainability trace on a real finding. (2) Position against specific pain points ("your architecture reviews take 40 hours and produce no audit trail") rather than category creation.

**Fixability:** V1 (marketing execution).

---

### 2.20 Architectural Integrity — Score: 78 | Weight: 3 | Deficiency: 66

**Justification:** Clean C4 architecture documented and enforced. Explicit DI composition in `ArchLucid.Host.Composition` with partial classes by concern. Persistence abstraction (SQL + in-memory parity). Rate limiting, circuit breakers, and resilience patterns throughout. Architecture decision records (34+ ADRs). But: (1) the dual-pipeline legacy (coordinator vs authority) per ADR 0021 adds complexity and confusion, (2) the `ArchLucid.Persistence` assembly has two namespaces serving different purposes (workflow data access vs authority persistence) which is a documented compromise, (3) 108 controllers is a large API surface for a V1.

**Tradeoffs:** The strangler fig approach (ADR 0021) is the right way to migrate incrementally. But it means V1 ships with architectural debt that is visible to anyone reading the code.

**Recommendations:** (1) Accelerate the strangler fig to reduce the coordinator surface before V1.1. (2) Consider splitting the persistence assembly into two projects aligned with the namespace boundary.

**Fixability:** V1.1 (strangler fig completion is planned).

---

### 2.21 Security — Score: 76 | Weight: 3 | Deficiency: 72

**Justification:** Comprehensive security posture: STRIDE threat model, ZAP baseline (merge-blocking), Schemathesis fuzzing, CodeQL (merge-blocking), Trivy container scanning, Gitleaks secret scanning, RLS with SESSION_CONTEXT, fail-closed auth defaults, production configuration safety rules, DevelopmentBypass production guard, LLM prompt redaction. But: (1) no executed pen test, (2) no SAST beyond CodeQL, (3) API key auth allows Admin+Reader only (no Auditor via API key), (4) PGP key for coordinated disclosure not yet deployed.

**Tradeoffs:** The automated security testing pipeline is strong. The gap is in independent validation (pen test).

**Recommendations:** (1) Execute the pen test per the existing SoW template. (2) Add Auditor role to API key auth or document the limitation explicitly. (3) Deploy the PGP key once the domain is acquired.

**Fixability:** V1.1 (pen test is owner-gated).

---

### 2.22 Policy and Governance Alignment — Score: 76 | Weight: 2 | Deficiency: 48

**Justification:** Policy packs with versioning and scope assignments. Pre-commit governance gate with configurable severity thresholds. Approval workflows with segregation of duties. SLA tracking with escalation webhooks. Compliance drift trending. But: (1) policy packs require manual creation — no pre-built packs for common frameworks (NIST, ISO 27001), (2) governance workflows do not integrate with external approval systems, (3) compliance drift trending exists but has no alerting threshold.

**Tradeoffs:** Building governance primitives first, then adding framework-specific templates, is correct sequencing.

**Recommendations:** (1) Create a NIST CSF policy pack template. (2) Add compliance drift alerting when drift exceeds a configurable threshold. (3) Document how to map existing compliance frameworks to policy packs.

**Fixability:** V1 (policy pack template creation); V1.1 (compliance drift alerting).

---

### 2.23 Reliability — Score: 68 | Weight: 2 | Deficiency: 64

**Justification:** Circuit breakers, retry policies (Polly), health checks (live/ready), data archival health monitoring, integration event outbox with retry calculator, leader election for background jobs. But: (1) no chaos engineering in production (Simmy scheduled tests exist but are CI-only), (2) RTO/RPO targets documented but not validated with drills in production, (3) SQL failover group exists in Terraform but geo-failover drill is documented, not regularly executed, (4) no automated incident response playbook.

**Tradeoffs:** Building reliability infrastructure before having production load is reasonable. But untested failover is not failover.

**Recommendations:** (1) Execute the geo-failover drill per the existing runbook. (2) Establish a quarterly chaos engineering drill schedule. (3) Create automated alerting for circuit breaker state transitions.

**Fixability:** V1 (drills are documentation + execution); V1.1 (automated chaos).

---

### 2.24 Data Consistency — Score: 70 | Weight: 2 | Deficiency: 60

**Justification:** Transactional writes with Dapper, idempotency keys for architecture requests, outbox pattern for integration events, manifest version increment rules with property-based tests, run status transition guards. But: (1) the dual-pipeline means some data flows through coordinator repos and some through authority repos — consistency across the boundary is maintained by convention, not by a single transaction, (2) the `CachingRunRepository` invalidation is tested but cache coherence in multi-instance deployments relies on short TTLs, (3) the orphan probe SQL exists but is not a continuous reconciliation.

**Tradeoffs:** The outbox pattern and idempotency keys are the right consistency primitives. The dual-pipeline is the main risk.

**Recommendations:** (1) Add a continuous data consistency check job that runs the orphan probe SQL on a schedule. (2) Document the cache coherence model for multi-instance deployments. (3) Add a data consistency health check endpoint.

**Fixability:** V1 (scheduled job + health check).

---

### 2.25 Maintainability — Score: 72 | Weight: 2 | Deficiency: 56

**Justification:** One class per file rule enforced. Modular project structure (20+ projects). CI enforces doc scope headers, pricing single source, audit event count, pagination guards, and more. ADR practice (34+ records). But: (1) 557+ markdown docs create a maintenance burden, (2) the `ArchLucid.Persistence` assembly has dual responsibilities, (3) 108 controllers means high surface area for API changes.

**Tradeoffs:** Extensive documentation is a maintenance asset AND liability. The CI guards are the right mitigation.

**Recommendations:** (1) Audit and archive stale docs (the `docs/archive/` pattern exists). (2) Add a doc freshness check that flags docs not updated in 90+ days.

**Fixability:** V1 (tooling change).

---

### 2.26 Explainability — Score: 80 | Weight: 2 | Deficiency: 40

**Justification:** `ExplainabilityTrace` with 5 structured fields per finding. `ExplainabilityTraceCompletenessAnalyzer` with OTel metric. `ExplanationFaithfulnessChecker` with heuristic overlap scoring. `FindingExplainabilityNarrativeBuilder` for human-readable narratives. `ProvenanceBuilder` with full decision→evidence→artifact lineage. This is among the product's strongest technical differentiators.

**Tradeoffs:** Explainability is expensive (trace storage, narrative generation, provenance graph maintenance) but is the core trust mechanism.

**Recommendations:** (1) Add a "Why this finding?" button in the UI that surfaces the explainability trace inline. (2) Improve the faithfulness checker beyond token overlap to semantic similarity.

**Fixability:** V1 (UI enhancement); V1.1 (semantic similarity).

---

### 2.27 AI/Agent Readiness — Score: 70 | Weight: 2 | Deficiency: 60

**Justification:** Four agent types (Topology, Cost, Compliance, Critic) with structured orchestration. Multi-vendor LLM via `ILlmProvider` with fallback chain. Simulator mode for deterministic testing. Agent prompt regression tests. LLM token quota tracking. Chaos testing (Simmy). But: (1) no MCP server in V1 (deferred to V1.1), (2) agent outputs are structured but accuracy depends on prompt engineering, not fine-tuning, (3) no agent self-evaluation or quality scoring beyond structural completeness, (4) no support for customer-provided models or agents.

**Tradeoffs:** The orchestrated-agent approach (vs autonomous) is correct for a governance-focused product. But the MCP deferral limits integration with the emerging agent ecosystem.

**Recommendations:** (1) Add agent output quality scoring beyond structural completeness. (2) Ship the MCP membrane per V1.1 plan. (3) Implement agent output caching to reduce LLM costs for repeated similar requests.

**Fixability:** V1 (quality scoring); V1.1 (MCP).

---

### 2.28 Azure Compatibility and SaaS Deployment Readiness — Score: 82 | Weight: 2 | Deficiency: 36

**Justification:** 14 Terraform roots covering Container Apps, SQL, storage, networking, monitoring, Entra, Key Vault, Service Bus, Logic Apps, edge, OpenAI. Consumption budgets with Cost Management notifications. FinOps tags. Managed identity support. Private endpoints. CD workflows for staging and greenfield SaaS. This is among the most complete Azure IaC footprints for a V1.

**Tradeoffs:** Azure-only deployment limits the addressable market to Azure-native organizations.

**Recommendations:** (1) Validate the full Terraform apply in a clean subscription (not just plan). (2) Add Terraform module versioning for customer-facing roots.

**Fixability:** V1 (validation execution).

---

### 2.29 Traceability — Score: 80 | Weight: 3 | Deficiency: 60

**Justification:** V1_REQUIREMENTS_TEST_TRACEABILITY.md maps scope items to tests. 117 audit events with CI guard. Provenance graph links evidence to decisions to artifacts. Decision traces stored per run. Finding → evidence chain endpoints exist. But: (1) traceability is doc-based, not enforced by tooling beyond the CI script, (2) no requirements management tool integration.

**Tradeoffs:** Doc-based traceability is appropriate for a small team. Tool-based traceability is a V1.1 concern.

**Recommendations:** (1) Strengthen the CI traceability assertion to cover new features automatically.

**Fixability:** V1 (CI enhancement).

---

### 2.30 Auditability — Score: 82 | Weight: 2 | Deficiency: 36

**Justification:** 117 typed audit events in append-only SQL. DENY UPDATE/DELETE enforced at database level. Paginated search with keyset cursor. JSON/CSV export. Tiered retention. CI guard on event count. Governance workflow dual-writes to durable audit. This is enterprise-grade auditability.

**Tradeoffs:** Some mutating flows do not yet emit durable audit events (documented as known gaps, but tracked to zero open omissions).

**Recommendations:** (1) Add audit event coverage for any remaining gaps per AUDIT_COVERAGE_MATRIX.

**Fixability:** V1 (incremental audit event additions).

---

### 2.31 Availability — Score: 65 | Weight: 1 | Deficiency: 35

**Justification:** Health checks (live/ready), Container Apps with scaling, SQL failover group in Terraform, secondary region option, SLA target of 99.9% documented. But: (1) no demonstrated uptime history, (2) failover has not been drilled in production, (3) no automated failover validation.

**Tradeoffs:** Availability targets are appropriate; operational validation is the gap.

**Recommendations:** (1) Execute the geo-failover drill. (2) Establish uptime monitoring with public status page.

**Fixability:** V1 (execution tasks).

---

### 2.32 Performance — Score: 60 | Weight: 1 | Deficiency: 40

**Justification:** k6 load test baseline exists (p95 773ms at 5 VUs). Merge-blocking k6 smoke. Weekly per-tenant burst tests. BenchmarkDotNet micro-benchmarks. Cold start docs. But: (1) only one formal baseline run recorded, (2) p95 at 773ms is acceptable but not fast, (3) no performance regression tracking over time, (4) LLM completion latency dominates total run time but is not measured independently.

**Tradeoffs:** Performance optimization before product-market fit is premature. The baseline infrastructure is the right investment.

**Recommendations:** (1) Record a second baseline after recent changes. (2) Add LLM completion latency as a separate tracked metric in the load test.

**Fixability:** V1 (measurement execution).

---

### 2.33 Scalability — Score: 62 | Weight: 1 | Deficiency: 38

**Justification:** Horizontal scaling of stateless API/worker. Read replica factory for read-heavy paths. Caching with `CachingRunRepository`. Outbox pattern for async processing. Scaling path doc describes evolution from single DB to per-tenant DB. But: (1) read replica routing is partial (not all repositories use it), (2) no demonstrated multi-tenant load testing, (3) per-tenant DB is described but not implemented.

**Tradeoffs:** Scaling infrastructure before load is premature. The documented path is credible.

**Recommendations:** (1) Run a multi-tenant burst test with 10+ simulated tenants. (2) Expand read replica usage to remaining high-read repositories.

**Fixability:** V1 (testing); V1.1 (read replica expansion).

---

### 2.34 Supportability — Score: 72 | Weight: 1 | Deficiency: 28

**Justification:** CLI `doctor` and `support-bundle`. Correlation IDs in all responses. Troubleshooting runbook. Tier 1 support runbook. Version endpoint. But: (1) no in-product diagnostic tools for operators, (2) support depends on log analysis.

**Recommendations:** (1) Add an operator diagnostics page.

**Fixability:** V1.

---

### 2.35 Manageability — Score: 68 | Weight: 1 | Deficiency: 32

**Justification:** Extensive configuration surface (appsettings, Key Vault, env vars). Feature gates. FinOps tags. Consumption budgets. But: (1) no centralized configuration UI, (2) configuration changes require appsettings/env var changes and restarts, (3) Azure App Configuration deferred (ADR 0017).

**Recommendations:** (1) Document the minimal operator configuration surface for V1 pilots.

**Fixability:** V1 (documentation).

---

### 2.36 Deployability — Score: 70 | Weight: 1 | Deficiency: 30

**Justification:** Docker Compose profiles. Terraform modules. CI/CD workflows (ci.yml, cd.yml, cd-staging-on-merge.yml, cd-saas-greenfield.yml). Container images built in CI. But: (1) no ACR push in CI (documented as infrastructure follow-up), (2) deployment requires Terraform expertise, (3) no one-click deployment option.

**Recommendations:** (1) Add ACR push to CI. (2) Create a deployment quickstart for the most common configuration.

**Fixability:** V1 (CI enhancement).

---

### 2.37 Observability — Score: 80 | Weight: 1 | Deficiency: 20

**Justification:** 30+ custom OTel metrics. 8 activity sources. Grafana dashboards committed in repo. Application Insights in Terraform. Prometheus SLO rules. Business KPI metrics. Excellent instrumentation for a V1.

**Recommendations:** (1) Validate Grafana dashboards against actual metric names in a running instance.

**Fixability:** V1.

---

### 2.38 Testability — Score: 78 | Weight: 1 | Deficiency: 22

**Justification:** 563+ test files. Property-based testing (FsCheck). Golden corpus tests. Contract tests (Dapper vs in-memory). Mutation testing (Stryker). Architecture guard tests. k6 load tests. Playwright E2E (25 live-api specs). Schemathesis fuzzing. But: (1) Persistence assembly at ~53% coverage, (2) no formal coverage target enforced in CI.

**Recommendations:** (1) Add a CI coverage gate for new code (e.g., 80% on diff). (2) Target Persistence assembly for coverage improvement.

**Fixability:** V1.

---

### 2.39 Modularity — Score: 76 | Weight: 1 | Deficiency: 24

**Justification:** 20+ .NET projects with clear boundaries. DI composition in a dedicated host project. Interface-first design throughout. Finding engine plugin discovery with template. But: (1) persistence dual-namespace is a modularity compromise, (2) 108 controllers could benefit from area-based organization (partially done with subfolder structure).

**Recommendations:** Minor; architecture is sound.

**Fixability:** N/A.

---

### 2.40 Extensibility — Score: 72 | Weight: 1 | Deficiency: 28

**Justification:** Finding engine plugin discovery and template. Policy pack extensibility. Webhook/CloudEvents for external integration. But: (1) no plugin marketplace or registry, (2) no custom agent support, (3) extension points are engineering-focused, not operator-accessible.

**Recommendations:** (1) Document the finding engine plugin development workflow.

**Fixability:** V1 (documentation).

---

### 2.41 Evolvability — Score: 70 | Weight: 1 | Deficiency: 30

**Justification:** ADR practice (34+ records). Strangler fig plan (ADR 0021). Breaking changes documented. Version-stamped API. Migration-based schema evolution. But: (1) the dual-pipeline is the main evolvability risk, (2) 557+ docs may become stale.

**Recommendations:** (1) Complete the strangler fig. (2) Archive stale docs.

**Fixability:** V1.1.

---

### 2.42 Documentation — Score: 82 | Weight: 1 | Deficiency: 18

**Justification:** 557+ markdown files. Structured sections per doc (objective, assumptions, constraints, architecture overview, component breakdown, data flow, security model, operational considerations). CI-enforced scope headers. Five-document onboarding spine. Doc inventory. Glossary. This is among the most thoroughly documented V1s I have assessed.

**Tradeoffs:** Documentation depth creates discoverability and maintenance challenges.

**Recommendations:** (1) Add a doc search capability. (2) Prune stale docs quarterly.

**Fixability:** V1.

---

### 2.43 Azure Ecosystem Fit — Score: 80 | Weight: 1 | Deficiency: 20

**Justification:** Entra ID, Azure SQL, Container Apps, Front Door, Key Vault, Service Bus, Logic Apps, Application Insights, Managed Grafana — all represented in Terraform with proper IAM. This is a native Azure product.

**Recommendations:** No urgent recommendations.

**Fixability:** N/A.

---

### 2.44 Change Impact Clarity — Score: 70 | Weight: 1 | Deficiency: 30

**Justification:** ADRs document decisions. Breaking changes tracked. CHANGELOG exists. Comparison/drift detection shows architectural change. But: (1) no automated impact analysis for configuration changes, (2) breaking changes are documented retroactively, not proactively flagged.

**Recommendations:** (1) Add a configuration change impact preview.

**Fixability:** V1.1.

---

### 2.45 Accessibility — Score: 65 | Weight: 1 | Deficiency: 35

**Justification:** WCAG 2.1 AA target. Axe Playwright gates. jest-axe on components. Radix UI primitives (proper focus management, alert dialogs). aria-live regions for pipeline progress. But: (1) no VPAT/ACR published, (2) keyboard navigation not comprehensively tested beyond Axe, (3) screen reader testing not documented.

**Recommendations:** (1) Generate a VPAT/ACR from existing Axe results. (2) Add keyboard-only navigation E2E tests.

**Fixability:** V1 (VPAT generation).

---

### 2.46 Cost-Effectiveness — Score: 55 | Weight: 1 | Deficiency: 45

**Justification:** LLM cost tracking metrics exist. Consumption budgets in Terraform. Cost estimate endpoint for tenants. But: (1) no cost optimization for LLM calls (no caching of similar requests, no prompt optimization), (2) infrastructure cost for a single-tenant pilot is significant (Azure SQL + Container Apps + optional APIM/Front Door), (3) the platform fee + seat pricing has not been validated against actual cost-to-serve.

**Recommendations:** (1) Implement LLM completion caching for identical or near-identical requests. (2) Document the minimum Azure cost for a pilot deployment. (3) Validate pricing against actual LLM token costs for a typical run.

**Fixability:** V1 (caching + documentation).

---

## 3. Top 10 Most Important Weaknesses

1. **No live self-serve path from interest to value.** The trial funnel is TEST-mode only. A prospect cannot try the product without sales engagement, infrastructure provisioning, and significant configuration. This is the single biggest barrier to growth.

2. **Zero first-party workflow integrations.** No Jira, ServiceNow, Confluence, Slack, or CMDB connectors. Findings stay trapped inside ArchLucid unless the customer builds webhook consumers. Enterprise buyers evaluate workflow fit, not standalone capability.

3. **Onboarding requires infrastructure expertise.** Setting up SQL Server, configuring auth, understanding Terraform modules, and provisioning Azure resources is a multi-day effort. There is no "zero-infrastructure" evaluation path.

4. **No independent security validation.** No executed pen test, no SOC 2 attestation. The security architecture is strong but unvalidated by a third party. Enterprise security reviewers will flag this.

5. **LLM output correctness is structurally validated but not empirically calibrated.** The explainability traces verify that findings have the right shape, but no ground-truth dataset validates whether the findings are actually correct. Buyers in regulated industries will ask "how accurate are the findings?"

6. **Thin UI loses competitive evaluations.** The operator shell is functional but visually inferior to LeanIX, Ardoq, and modern SaaS products. Non-technical evaluators (procurement, executives) will compare screens.

7. **Time from signup to first valuable output is too long.** Even with documentation, the path from "I want to try this" to "I have a manifest I can show my CTO" takes hours, not minutes. Competing tools (ChatGPT, Copilot) deliver instant value with zero setup.

8. **Commerce is wired but not live.** Stripe, Marketplace, pricing page, order form — all exist in code but none process real money. The gap between "commerce is built" and "commerce works" is operational, not technical, but it is still a gap.

9. **Dual-pipeline architectural debt.** The coordinator-vs-authority pipeline split (ADR 0021 strangler fig) adds complexity to the codebase, documentation, and mental model. New contributors must understand which pipeline a given endpoint uses.

10. **No reference customers or case studies.** Every claim is grounded in code, but none is grounded in customer evidence. "We built it" is not "customers use it."

---

## 4. Top 5 Monetization Blockers

1. **Commerce is not live.** Stripe keys are TEST-mode. Azure Marketplace offer is not published. Signup DNS is not cut over. No money can flow until the owner completes Partner Center verification, tax profile, and payout account. This is the hardest blocker because it is 100% owner-gated.

2. **No self-serve trial with automatic sandbox provisioning.** The trial funnel code exists but is not live. Without a "try for free" button that works end-to-end, customer acquisition depends entirely on sales outreach. Sales-led works at enterprise but does not generate inbound pipeline.

3. **No proof of customer willingness to pay.** Pricing is modeled against manual review costs ($294K savings) but no customer has validated the price points. The $199/mo Team tier and $899/mo Professional tier are reasonable but untested. The first 3 customers will determine whether pricing survives contact with reality.

4. **No inbound data connectors reduce the addressable market.** Buyers who already have architecture artifacts in Terraform, ArchiMate, or CMDBs cannot bring them into ArchLucid without manual re-entry. This makes the first run harder than it should be, which reduces conversion.

5. **Azure-only deployment disqualifies 50%+ of the market.** AWS-primary and GCP-primary organizations cannot use ArchLucid without Azure infrastructure. This is a conscious positioning choice but a real revenue ceiling.

---

## 5. Top 5 Enterprise Adoption Blockers

1. **No SOC 2 attestation.** Self-assessment is "non-attestation evidence." Enterprise procurement teams at regulated organizations (financial services, healthcare, government) will require Type I minimum. The 2026-06-15 scoping target for SOC 2 Type I is the critical path.

2. **No executed penetration test.** The SoW and template exist, but no test has run. Security reviewers will ask for the report. The Aeronova engagement is funded but not scheduled.

3. **No ITSM integration.** ServiceNow and Jira are the standard workflow tools for enterprise architecture teams. Without first-party connectors, findings require manual triage and re-entry. This is the top enterprise evaluation objection after compliance.

4. **Entra-only SSO.** Organizations on Okta, Auth0, or Ping cannot use SSO. The competitive landscape doc lists this as the #5 positioning gap. SCIM is available but only for Entra-provisioned identities.

5. **No HIPAA BAA or FedRAMP pathway.** Healthcare and government are listed as target verticals, but no HIPAA Business Associate Agreement template exists and no FedRAMP authorization pathway is documented. These are table-stakes for those segments.

---

## 6. Top 5 Engineering Risks

1. **LLM provider dependency.** The multi-vendor LLM fallback chain mitigates single-provider outages, but all finding quality depends on LLM output quality. A model regression (provider update, fine-tuning drift) could degrade all findings globally. No canary or A/B testing framework exists for model changes.

2. **Dual-pipeline complexity.** The coordinator-authority strangler fig (ADR 0021) means two code paths for similar operations. A bug in one pipeline that does not exist in the other creates inconsistent behavior. The unified read facade mitigates this for new callers, but existing callers may still hit the old path.

3. **Persistence assembly coverage gap.** At ~53% line coverage, `ArchLucid.Persistence` is the least-tested assembly. This is the layer that handles SQL writes, RLS, caching, and data consistency — the highest-consequence failure domain.

4. **Cache coherence in multi-instance deployments.** `CachingRunRepository` uses short TTLs but no distributed invalidation. In a multi-instance Container Apps deployment, one instance may serve stale data after another instance writes. The window is short (TTL-bounded) but could cause visible inconsistency during concurrent operations.

5. **SQL migration ordering and legacy object names.** 119+ migrations with historical `ArchiForge` identifiers in early files. The "never modify historical migrations" constraint is correct but means the database carries naming debt. A failed migration mid-sequence could leave the database in a partially-migrated state (DbUp's transaction-per-script mitigates but does not eliminate this risk).

---

## 7. Most Important Truth

**ArchLucid is an engineering achievement that has not yet survived contact with a paying customer.** The architecture is sound, the security posture is strong, the test coverage is extensive, the documentation is remarkable, and the differentiator is real. But none of that matters until a real buyer can go from "show me" to "I'll pay for this" without requiring the founder to personally provision their infrastructure and walk them through a seven-step wizard. The product is 80% built and 20% sellable. The 20% that is missing — live commerce, self-serve onboarding, workflow integration, and independent security validation — is entirely solvable but requires execution focus on commercial readiness rather than further engineering depth.

---

## 8. Top Improvement Opportunities

### Improvement 1: DEFERRED — Flip Commerce Live (Stripe + Marketplace)

**Why deferred:** Requires owner completion of Partner Center seller verification, tax profile, payout account, and Stripe live key activation. Cannot be executed by the assistant.

**Specific input needed:** Owner confirmation that Partner Center verification is complete, tax profile is filed, payout account is configured, and Stripe live API keys are ready to be rotated into production configuration.

---

### Improvement 2: Build a Zero-Config Quick-Start Demo Experience

**Why it matters:** The single highest-leverage action to reduce adoption friction and improve time-to-value. A prospect or evaluator should be able to see ArchLucid produce a real committed manifest in under 60 seconds, with zero infrastructure setup.

**Expected impact:** Directly improves Adoption Friction (+12-15 pts), Time-to-Value (+10-12 pts), Marketability (+5-8 pts), Customer Self-Sufficiency (+5 pts). Weighted readiness impact: +1.2-1.8%.

**Affected qualities:** Adoption Friction, Time-to-Value, Marketability, Usability, Customer Self-Sufficiency, Executive Value Visibility

**Cursor prompt:**

```
In ArchLucid.Api, create a new endpoint `POST /v1/demo/quickstart` that:

1. Accepts a minimal JSON body: `{ "description": "string", "presetId": "string?" }` where presetId is optional and selects from pre-defined architecture request templates.

2. When called:
   a. Creates an architecture request using the description (or preset) with sensible defaults for all required fields (scope = "quickstart-demo", workspace = "demo", project = "quickstart").
   b. Immediately executes the run in simulator mode (force simulator regardless of configuration).
   c. Commits the manifest.
   d. Returns a response containing: runId, manifestId, a summary of top 3 findings with titles and severities, and a direct URL to the run detail page.

3. Rate limit: use the "expensive" rate limiter policy. No auth required (use the existing anonymous demo surface pattern from DemoController).

4. Add 3 preset templates in a new file `ArchLucid.Api/Demo/QuickStartPresets.cs`:
   - "microservices" — a typical microservices architecture
   - "monolith-migration" — a monolith-to-microservices migration
   - "event-driven" — an event-driven architecture

5. Add a corresponding UI page at `archlucid-ui/src/app/(marketing)/quick-start/page.tsx` that:
   - Shows a textarea for architecture description and 3 preset buttons
   - On submit, calls the quickstart endpoint
   - Shows a loading spinner with pipeline stage progress
   - On completion, shows the top 3 findings and a "View Full Results" link to the run detail page
   - Keep the UI minimal and clean — this is a conversion page

Files to create:
- `ArchLucid.Api/Controllers/Demo/QuickStartController.cs`
- `ArchLucid.Api/Demo/QuickStartPresets.cs`
- `ArchLucid.Api/Demo/QuickStartService.cs` (orchestrates create→execute→commit)
- `archlucid-ui/src/app/(marketing)/quick-start/page.tsx`

Files to modify:
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions*.cs` (register QuickStartService)

Constraints:
- Must use simulator mode only (no real LLM calls)
- Must respect existing rate limiting and CORS
- Must emit audit events for the run lifecycle
- Do NOT modify any existing controllers or services
- Do NOT add new dependencies
- The quick-start run should complete in under 10 seconds in simulator mode

Acceptance criteria:
- `POST /v1/demo/quickstart` with `{"description":"Three-tier web application"}` returns 200 with runId, manifestId, and findings within 10 seconds
- The marketing page renders at `/quick-start` and produces visible results
- Rate limiting prevents more than 5 calls per minute per IP
- Existing tests pass unchanged
```

---

### Improvement 3: Create Pre-Built Architecture Request Templates

**Why it matters:** Templates reduce the cognitive load of the first run from "describe your entire architecture from scratch" to "pick the closest template and customize." This directly improves time-to-value and proof-of-ROI readiness.

**Expected impact:** Directly improves Template and Accelerator Richness (+25-30 pts), Time-to-Value (+5-8 pts), Adoption Friction (+3-5 pts). Weighted readiness impact: +0.5-0.8%.

**Affected qualities:** Template and Accelerator Richness, Time-to-Value, Adoption Friction, Usability

**Cursor prompt:**

```
Create a set of 5 architecture request templates that operators can select in the New Run wizard.

1. Create a new file `ArchLucid.Application/Templates/ArchitectureRequestTemplates.cs` containing a static class with 5 template methods, each returning a pre-populated `ArchitectureRequestDto` (or the appropriate request type used by `POST /v1/architecture/request`):

   a. `MicroservicesWebPlatform()` — 4 services (API gateway, user service, order service, notification service), PostgreSQL and Redis, Kubernetes deployment, HTTPS between services.

   b. `MonolithMigrationAssessment()` — Legacy .NET Framework monolith with SQL Server, considering decomposition into services, current pain points (scaling, deployment coupling, team autonomy).

   c. `EventDrivenProcessingPipeline()` — Event hub/Kafka ingestion, stream processing, multiple consumers, exactly-once delivery concerns, dead letter handling.

   d. `CloudNativeMigration()` — On-premises VM-based workload moving to Azure (App Service + Azure SQL + Blob Storage), current architecture and target architecture, security and compliance constraints.

   e. `RegulatedHealthcareSystem()` — Patient data processing system with HIPAA constraints, audit requirements, encryption at rest and in transit, access control, data residency.

2. Each template should include:
   - A descriptive title
   - 3-5 evidence items (text descriptions of architecture components)
   - Reasonable default scope (workspace, project)
   - A `templateId` field for tracking which template was used

3. Create a new endpoint `GET /v1/architecture/templates` in a new controller `ArchLucid.Api/Controllers/Authority/TemplatesController.cs` that returns the list of templates with their ids, titles, and short descriptions.

4. Add unit tests in `ArchLucid.Application.Tests/Templates/ArchitectureRequestTemplatesTests.cs` verifying:
   - Each template produces a valid request (non-null required fields)
   - Each template has at least 3 evidence items
   - Template IDs are unique
   - Templates can be serialized/deserialized without loss

Files to create:
- `ArchLucid.Application/Templates/ArchitectureRequestTemplates.cs`
- `ArchLucid.Api/Controllers/Authority/TemplatesController.cs`
- `ArchLucid.Application.Tests/Templates/ArchitectureRequestTemplatesTests.cs`

Constraints:
- Do NOT modify existing request handling or validation
- Templates must be valid inputs for the existing `POST /v1/architecture/request` endpoint
- Use the `[EnableRateLimiting("fixed")]` on the controller
- Use `[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]` (templates are read-only)

Acceptance criteria:
- `GET /v1/architecture/templates` returns 5 templates
- Each template, when submitted to `POST /v1/architecture/request`, creates a valid run
- All tests pass
```

---

### Improvement 4: Implement LLM Completion Response Caching

**Why it matters:** Identical or near-identical architecture requests (common in demos, evaluations, and template-based workflows) currently make full LLM round-trips every time. Caching reduces latency, LLM token costs, and improves determinism for repeated requests.

**Expected impact:** Directly improves Cost-Effectiveness (+10-15 pts), Performance (+5-8 pts), Time-to-Value (+3-5 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Cost-Effectiveness, Performance, Time-to-Value, Reliability

**Cursor prompt:**

```
Implement LLM completion response caching in the agent runtime.

1. In `ArchLucid.AgentRuntime`, the `LlmCompletionCacheKey` class already exists. Extend the caching infrastructure:

   a. Create `ArchLucid.AgentRuntime/Caching/LlmCompletionResponseCache.cs` implementing a new `ILlmCompletionResponseCache` interface with:
      - `Task<LlmCompletionResult?> TryGetAsync(LlmCompletionCacheKey key, CancellationToken ct)`
      - `Task SetAsync(LlmCompletionCacheKey key, LlmCompletionResult result, CancellationToken ct)`
      - Use `IMemoryCache` as the backing store with configurable TTL via `LlmCompletionCacheOptions` (section `AgentRuntime:CompletionCache`, default TTL = 30 minutes, max entries = 1000).

   b. Create a caching decorator `CachingLlmCompletionClient` that wraps the existing `ILlmCompletionClient` (or equivalent LLM call interface):
      - Before calling the underlying client, check the cache
      - On cache hit, return cached result and increment `archlucid_llm_cache_hits_total` counter
      - On cache miss, call the underlying client, cache the result, and increment `archlucid_llm_cache_misses_total` counter
      - Cache key should be based on: agent type, model name, prompt hash (SHA256 of the full prompt text)

   c. Register the caching decorator in DI in `ArchLucid.Host.Composition` when `AgentRuntime:CompletionCache:Enabled` is true (default: true in Development, false in Production).

2. Add OTel metrics:
   - `archlucid_llm_cache_hits_total` (counter, labels: `agent_type`)
   - `archlucid_llm_cache_misses_total` (counter, labels: `agent_type`)
   - `archlucid_llm_cache_hit_ratio` (observable gauge derived from hits/(hits+misses))

3. Add tests in `ArchLucid.AgentRuntime.Tests/Caching/`:
   - `LlmCompletionResponseCacheTests.cs` — TTL expiry, max entries eviction, concurrent access
   - `CachingLlmCompletionClientTests.cs` — hit path, miss path, metrics emission, disabled mode

Files to create:
- `ArchLucid.AgentRuntime/Caching/ILlmCompletionResponseCache.cs`
- `ArchLucid.AgentRuntime/Caching/LlmCompletionResponseCache.cs`
- `ArchLucid.AgentRuntime/Caching/LlmCompletionCacheOptions.cs`
- `ArchLucid.AgentRuntime/Caching/CachingLlmCompletionClient.cs`
- `ArchLucid.AgentRuntime.Tests/Caching/LlmCompletionResponseCacheTests.cs`
- `ArchLucid.AgentRuntime.Tests/Caching/CachingLlmCompletionClientTests.cs`

Files to modify:
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions*.cs` (register cache + decorator)
- `ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs` (add cache metric names)

Constraints:
- Do NOT modify existing LLM client implementations
- Cache must be per-process (IMemoryCache), not distributed (no Redis dependency)
- Cache must respect simulator mode (cache simulator results separately from real LLM results, keyed by a `simulator` flag)
- Do NOT cache error responses
- Use the decorator pattern — existing callers should not need to change

Acceptance criteria:
- Two identical agent calls within TTL produce identical results, second call does not invoke the LLM provider
- Cache hit/miss metrics are emitted and visible in Prometheus
- Cache is disabled in Production by default
- All existing agent tests pass unchanged
```

---

### Improvement 5: Add In-Product Pilot Value Report

**Why it matters:** Sponsors and executives need a tangible output from the pilot that justifies further investment. An automated value report that shows "what ArchLucid found, how long it took, and how that compares to your baseline" is the strongest proof-of-ROI artifact the product can generate.

**Expected impact:** Directly improves Proof-of-ROI Readiness (+12-15 pts), Executive Value Visibility (+8-10 pts), Stickiness (+3-5 pts). Weighted readiness impact: +0.8-1.2%.

**Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility, Stickiness, Marketability

**Cursor prompt:**

```
Enhance the existing value report infrastructure to produce a one-click "Pilot Value Report" from the operator UI.

1. In `ArchLucid.Application/Value/`, the `ValueReportBuilder` already exists. Create a new `PilotValueReportService` in `ArchLucid.Application/Pilots/PilotValueReportService.cs` that:

   a. Accepts a tenant ID and optional date range
   b. Queries all committed runs for the tenant in the range
   c. Computes:
      - Total runs committed
      - Total findings generated (by severity: Critical, High, Medium, Low, Info)
      - Total recommendations produced
      - Average pipeline completion time (from request to commit)
      - Governance actions taken (approvals, rejections, policy pack assignments)
      - Comparison/drift detections performed
      - Unique agent types used
   d. Returns a `PilotValueReport` record with all computed metrics

2. Create a new endpoint `GET /v1/tenant/pilot-value-report` in `ArchLucid.Api/Controllers/Tenancy/TenantPilotValueReportController.cs`:
   - Query params: `fromUtc` (optional, defaults to tenant creation), `toUtc` (optional, defaults to now)
   - Returns the `PilotValueReport` as JSON
   - Also supports `Accept: text/markdown` for a formatted markdown version
   - Requires `ReadAuthority` policy

3. Create a new operator UI page at `archlucid-ui/src/app/(operator)/value-report/pilot/page.tsx` that:
   - Fetches the pilot value report
   - Displays metrics in a clean dashboard layout with:
     - Summary cards (total runs, total findings, avg completion time)
     - Severity distribution chart (horizontal bar)
     - Timeline of runs
   - Includes a "Download as Markdown" button
   - Includes a "Email to Sponsor" button (uses the existing email infrastructure if available, or copies to clipboard)

4. Add tests:
   - `ArchLucid.Application.Tests/Pilots/PilotValueReportServiceTests.cs` — metrics computation, empty tenant, date range filtering
   - `ArchLucid.Api.Tests/TenantPilotValueReportControllerTests.cs` — endpoint returns correct shape, markdown content negotiation

Files to create:
- `ArchLucid.Application/Pilots/PilotValueReportService.cs`
- `ArchLucid.Application/Pilots/PilotValueReport.cs` (record type)
- `ArchLucid.Api/Controllers/Tenancy/TenantPilotValueReportController.cs`
- `archlucid-ui/src/app/(operator)/value-report/pilot/page.tsx`
- `ArchLucid.Application.Tests/Pilots/PilotValueReportServiceTests.cs`
- `ArchLucid.Api.Tests/TenantPilotValueReportControllerTests.cs`

Files to modify:
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions*.cs` (register PilotValueReportService)
- `archlucid-ui/src/lib/nav-config.ts` (add nav link under operate-analysis)

Constraints:
- Use existing repository interfaces only — do NOT create new SQL queries
- Reuse the existing `IRunDetailQueryService`, `IAuditService`, and governance query services
- Do NOT add new npm dependencies for charts — use CSS-based bars or existing chart library if one is already in the project
- Do NOT modify existing value report infrastructure

Acceptance criteria:
- `GET /v1/tenant/pilot-value-report` returns metrics for the tenant
- Markdown response includes formatted tables and summary
- UI page renders with metric cards
- Tests verify computation logic for edge cases (zero runs, single run, large range)
```

---

### Improvement 6: Generate VPAT/ACR from Existing Accessibility Testing

**Why it matters:** Enterprise procurement teams (especially government and healthcare) require a Voluntary Product Accessibility Template (VPAT) or Accessibility Conformance Report (ACR). ArchLucid already runs Axe testing in CI and Playwright; generating the formal document from existing evidence is low-effort, high-impact for procurement readiness.

**Expected impact:** Directly improves Accessibility (+10-12 pts), Procurement Readiness (+5-8 pts), Compliance Readiness (+3-5 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Accessibility, Procurement Readiness, Compliance Readiness

**Cursor prompt:**

```
Create a VPAT 2.5 (WCAG 2.1 Level AA) Accessibility Conformance Report for ArchLucid based on existing Axe testing evidence.

1. Create `docs/security/VPAT_2_5_WCAG_2_1_AA.md` following the ITI VPAT 2.5 template structure:

   Section 1: Product Information
   - Product name: ArchLucid
   - Version: V1
   - Product description: AI Architecture Intelligence platform — web-based operator console, REST API, CLI
   - Contact: (placeholder for product owner)
   - Evaluation methods: Automated (Axe-core via Playwright and jest-axe), keyboard navigation testing, screen reader spot-checks

   Section 2: WCAG 2.1 Level A and AA Success Criteria
   For each criterion, assess based on the existing testing evidence:

   - For criteria covered by Axe rules that pass in CI: mark as "Supports" with note "Verified by automated Axe-core testing in CI (merge-blocking)"
   - For criteria that Axe cannot fully test (e.g., 1.1.1 Non-text Content for complex images, 1.2.x Time-based Media): mark as "Partially Supports" or "Not Applicable" with honest notes
   - For keyboard navigation (2.1.x): note Radix UI primitives provide keyboard support, mark "Supports" with caveat about comprehensive manual testing
   - For aria-live (4.1.3): note RunProgressTracker uses aria-live="polite", mark "Supports" for that component

   Be honest about gaps:
   - If screen reader testing has not been comprehensively performed, say so
   - If complex data visualizations (knowledge graph, provenance graph) lack text alternatives, note it
   - If color contrast has been checked by Axe but not manually verified for all custom components, note it

2. Create `docs/security/VPAT_EVIDENCE_MAP.md` that maps each WCAG criterion to the specific test files or CI jobs that verify it:
   - `archlucid-ui/e2e/live-api-accessibility.spec.ts` → which criteria
   - `archlucid-ui/e2e/live-api-accessibility-focus.spec.ts` → which criteria
   - jest-axe component tests → which criteria
   - Radix UI primitives → which criteria they inherently satisfy

3. Add a link to the VPAT from `docs/go-to-market/CURRENT_ASSURANCE_POSTURE.md` in the compliance section.

Files to create:
- `docs/security/VPAT_2_5_WCAG_2_1_AA.md`
- `docs/security/VPAT_EVIDENCE_MAP.md`

Files to modify:
- `docs/go-to-market/CURRENT_ASSURANCE_POSTURE.md` (add VPAT row to compliance table)

Constraints:
- Use the official ITI VPAT 2.5 template structure (available at https://www.itic.org/policy/accessibility/vpat)
- Do NOT overclaim — mark criteria as "Does Not Support" or "Not Evaluated" where evidence is insufficient
- Do NOT modify any code or tests
- Both files must start with the `> **Scope:**` header per the Doc-Scope-Header rule

Acceptance criteria:
- VPAT covers all WCAG 2.1 Level A and AA criteria (50 criteria)
- Each criterion has an honest conformance level and notes
- Evidence map links to actual test files in the repo
- `python scripts/ci/check_doc_scope_header.py` passes for both new files
```

---

### Improvement 7: Scheduled Data Consistency Reconciliation Job

**Why it matters:** The orphan probe SQL and data consistency checks exist but are not run continuously. In a multi-tenant SaaS, silent data inconsistencies (orphaned manifests, dangling references, cache/DB divergence) erode trust. A scheduled reconciliation job catches these before customers do.

**Expected impact:** Directly improves Data Consistency (+8-10 pts), Reliability (+3-5 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Data Consistency, Reliability, Trustworthiness, Supportability

**Cursor prompt:**

```
Create a scheduled data consistency reconciliation job that runs the existing orphan probe SQL and related integrity checks.

1. Create `ArchLucid.Application/DataConsistency/DataConsistencyReconciliationService.cs`:

   a. Implement `IDataConsistencyReconciliationService` with a single method:
      `Task<DataConsistencyReport> RunReconciliationAsync(CancellationToken ct)`

   b. The method should run these checks (using existing repository interfaces or `IDbConnectionFactory` for raw SQL):
      - Orphan probe: runs with no associated architecture request
      - Orphan probe: golden manifests with no associated run
      - Orphan probe: findings snapshots with no associated run
      - Orphan probe: artifact bundles with no associated run
      - Stale pending runs: runs in "Pending" or "Executing" status for more than 1 hour
      - Cache/DB divergence: sample 10 recent runs from cache and verify against DB (use existing `CachingRunRepository` and underlying repo)

   c. Return a `DataConsistencyReport` record with:
      - `DateTime CheckedAtUtc`
      - `List<DataConsistencyFinding> Findings` (each with: `CheckName`, `Severity` (Info/Warning/Critical), `Description`, `AffectedEntityIds`)
      - `bool IsHealthy` (true if no Critical or Warning findings)

2. Create a hosted service `ArchLucid.Application/DataConsistency/DataConsistencyReconciliationHostedService.cs`:
   - Runs every 6 hours (configurable via `DataConsistency:ReconciliationIntervalMinutes`, default 360)
   - Logs findings at appropriate severity levels
   - Emits OTel metrics:
     - `archlucid_data_consistency_check_duration_ms` (histogram)
     - `archlucid_data_consistency_findings_total` (counter, labels: `severity`, `check_name`)
   - Publishes an integration event `com.archlucid.system.data-consistency-check.completed.v1` with the report

3. Create a health check `DataConsistencyHealthCheck` that reports:
   - Healthy: last reconciliation passed with no Warning/Critical findings
   - Degraded: last reconciliation found Warning findings
   - Unhealthy: last reconciliation found Critical findings or has never run

4. Add tests in `ArchLucid.Application.Tests/DataConsistency/`:
   - `DataConsistencyReconciliationServiceTests.cs` — each check type with mock data
   - `DataConsistencyReconciliationHostedServiceTests.cs` — scheduling, error handling

Files to create:
- `ArchLucid.Application/DataConsistency/IDataConsistencyReconciliationService.cs`
- `ArchLucid.Application/DataConsistency/DataConsistencyReconciliationService.cs`
- `ArchLucid.Application/DataConsistency/DataConsistencyReport.cs`
- `ArchLucid.Application/DataConsistency/DataConsistencyFinding.cs`
- `ArchLucid.Application/DataConsistency/DataConsistencyReconciliationHostedService.cs`
- `ArchLucid.Application/DataConsistency/DataConsistencyHealthCheck.cs`
- `ArchLucid.Application.Tests/DataConsistency/DataConsistencyReconciliationServiceTests.cs`
- `ArchLucid.Application.Tests/DataConsistency/DataConsistencyReconciliationHostedServiceTests.cs`

Files to modify:
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions*.cs` (register service, hosted service, health check)
- `ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs` (add metric names)

Constraints:
- Use existing `IDbConnectionFactory` for SQL queries — do NOT create new Dapper repositories
- Reuse the existing orphan probe SQL patterns from `DataConsistencyOrphanProbeSql` if it exists
- The hosted service must use leader election if `HostLeaderElection` is available (avoid running on all instances)
- Do NOT modify existing health check registrations — add alongside them
- Keep SQL queries read-only; this job detects but does not repair

Acceptance criteria:
- Reconciliation runs on schedule and logs findings
- Health check endpoint includes `data_consistency` check
- OTel metrics are emitted per check
- Tests cover all check types including empty/clean database
```

---

### Improvement 8: Simplify the New Run Wizard to 3 Steps for Default Case

**Why it matters:** The current seven-step wizard is the primary onboarding bottleneck. Most first-time operators do not have detailed architecture evidence ready — they want to describe their system and see what ArchLucid finds. A simplified 3-step path (describe → configure → submit) with sensible defaults reduces cognitive load and time-to-first-value.

**Expected impact:** Directly improves Usability (+8-10 pts), Adoption Friction (+5-8 pts), Time-to-Value (+5-8 pts), Cognitive Load (+5-8 pts). Weighted readiness impact: +0.8-1.2%.

**Affected qualities:** Usability, Adoption Friction, Time-to-Value, Cognitive Load

**Cursor prompt:**

```
Add a "Quick Mode" to the New Run wizard that reduces the flow to 3 steps while preserving the full wizard as "Advanced Mode."

1. In `archlucid-ui/src/app/(operator)/runs/new/page.tsx` (or the wizard component it renders), add a mode toggle at the top of the wizard:
   - Default: "Quick Mode" (3 steps)
   - Toggle: "Switch to Advanced Mode" (existing 7 steps)
   - Persist the user's mode preference in localStorage

2. Quick Mode steps:

   Step 1 — "Describe Your Architecture"
   - Large textarea (min 3 lines): "Describe the system you want ArchLucid to review"
   - Optional: select a template from the templates endpoint (if Improvement 3 is implemented) or show 3 inline example descriptions as clickable chips
   - Optional: file upload for existing architecture documents (use existing import infrastructure if available)

   Step 2 — "Review Scope"
   - Auto-populated from description: suggested title, workspace (default), project (default)
   - All other fields use sensible defaults:
     - Evidence: the description text becomes the primary evidence item
     - Execution mode: use the environment's default (simulator in dev, real in production)
   - Show a "Customize" expander for each field that reveals the full form

   Step 3 — "Submit & Run"
   - Summary card showing what will be created
   - "Create & Execute" button that creates the run AND starts execution (combine the two steps)
   - Progress indicator showing pipeline stages as they complete (reuse RunProgressTracker if available)

3. When "Create & Execute" is clicked:
   - Call `POST /v1/architecture/request` with the constructed request
   - If auto-execute is supported, immediately call the execute endpoint
   - Show the RunProgressTracker inline
   - On completion, show a success state with "View Results" button linking to the run detail page

4. The existing 7-step wizard must remain fully functional — Quick Mode is an alternative path, not a replacement.

Files to modify:
- `archlucid-ui/src/app/(operator)/runs/new/page.tsx` (add mode toggle and Quick Mode flow)
- Any wizard step components that need conditional rendering

Files to create:
- `archlucid-ui/src/components/QuickRunWizard.tsx` (if the wizard is better as a separate component)
- `archlucid-ui/src/components/QuickRunWizard.test.tsx` (Vitest unit tests)

Constraints:
- Do NOT remove or modify the existing Advanced Mode wizard behavior
- Do NOT add new npm dependencies
- Quick Mode must produce a valid architecture request that the existing API accepts
- Quick Mode must work with the existing auth modes (including DevelopmentBypass)
- Preserve all existing accessibility attributes (aria labels, focus management)
- The mode toggle must be keyboard-accessible

Acceptance criteria:
- Quick Mode completes in 3 visible steps
- Default values produce a valid run that commits successfully
- Switching to Advanced Mode preserves any data entered in Quick Mode
- Existing E2E tests pass unchanged
- New Vitest tests cover Quick Mode step transitions and default value population
```

---

### Improvement 9: DEFERRED — Execute Penetration Test

**Why deferred:** Requires owner scheduling of the Aeronova engagement, funding confirmation, and SoW execution. The SoW template exists at `docs/security/pen-test-summaries/2026-Q2-SOW.md` but no test has been scheduled.

**Specific input needed:** Owner confirmation that the Aeronova engagement is funded and scheduled, target date for test execution, and scope confirmation (API surface, auth surfaces, RAG query surface per the existing SoW template).

---

### Improvement 10: DEFERRED — Accelerate SOC 2 Type I Scoping

**Why deferred:** Requires owner engagement with a CPA/assessor firm, funding confirmation, and organizational readiness decisions. The self-assessment exists at `docs/security/SOC2_SELF_ASSESSMENT_2026.md` with a target of 2026-06-15 for readiness consultant engagement.

**Specific input needed:** Owner confirmation of CPA/assessor firm selection, budget allocation, and whether the 2026-06-15 target is still achievable.

---

## 9. Deferred Scope Uncertainty

Items explicitly identified as deferred to V1.1 or V2 in `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, and related docs were located and verified:

- **V1.1:** Jira connector, ServiceNow connector, Confluence connector, Commerce un-hold (Stripe live + Marketplace publish), Pen test publication, PGP key drop, MCP server
- **V2:** Slack connector

All deferred items were found in the source markdown with explicit scope boundaries and owner-decision anchors. **No deferred scope uncertainty exists.**

---

## 10. Pending Questions for Later

### Improvement 1 (Commerce Flip)
- Has Partner Center seller verification been completed?
- Is the Stripe live API key ready for production rotation?
- What is the target date for the commerce un-hold?

### Improvement 9 (Pen Test)
- Has the Aeronova engagement been scheduled?
- What is the target date for test execution?
- Should the RAG/Ask threat surface be included in the pen test scope?

### Improvement 10 (SOC 2)
- Has a CPA/assessor firm been selected?
- Is the 2026-06-15 target for readiness consultant engagement still on track?
- Should SOC 2 Type I scope include the CLI surface or only API + UI?

### General
- Is there a target date for the first paid customer?
- Has the sales pipeline produced any active prospects who have seen the product?
- Is there a budget for UI/UX design investment (the "thin shell" competitive weakness)?
- What is the decision on HIPAA BAA — is healthcare a V1 target vertical or V1.1?

---

## Appendix: Score Table

| Quality | Category | Score | Weight | Weighted | Deficiency |
|---------|----------|-------|--------|----------|------------|
| Adoption Friction | Commercial | 48 | 6 | 288 | 312 |
| Marketability | Commercial | 62 | 8 | 496 | 304 |
| Time-to-Value | Commercial | 58 | 7 | 406 | 294 |
| Proof-of-ROI Readiness | Commercial | 55 | 5 | 275 | 225 |
| Workflow Embeddedness | Enterprise | 35 | 3 | 105 | 195 |
| Executive Value Visibility | Commercial | 64 | 4 | 256 | 144 |
| Usability | Enterprise | 52 | 3 | 156 | 144 |
| Interoperability | Enterprise | 30 | 2 | 60 | 140 |
| Correctness | Engineering | 72 | 4 | 288 | 112 |
| Decision Velocity | Commercial | 52 | 2 | 104 | 96 |
| Trustworthiness | Enterprise | 68 | 3 | 204 | 96 |
| Procurement Readiness | Enterprise | 55 | 2 | 110 | 90 |
| Differentiability | Commercial | 78 | 4 | 312 | 88 |
| Commercial Packaging Readiness | Commercial | 60 | 2 | 120 | 80 |
| Compliance Readiness | Enterprise | 62 | 2 | 124 | 76 |
| Security | Engineering | 76 | 3 | 228 | 72 |
| Architectural Integrity | Engineering | 78 | 3 | 234 | 66 |
| Reliability | Engineering | 68 | 2 | 136 | 64 |
| Template and Accelerator Richness | Commercial | 38 | 1 | 38 | 62 |
| Traceability | Enterprise | 80 | 3 | 240 | 60 |
| Data Consistency | Engineering | 70 | 2 | 140 | 60 |
| AI/Agent Readiness | Engineering | 70 | 2 | 140 | 60 |
| Maintainability | Engineering | 72 | 2 | 144 | 56 |
| Customer Self-Sufficiency | Enterprise | 48 | 1 | 48 | 52 |
| Cognitive Load | Engineering | 50 | 1 | 50 | 50 |
| Policy and Governance Alignment | Enterprise | 76 | 2 | 152 | 48 |
| Cost-Effectiveness | Engineering | 55 | 1 | 55 | 45 |
| Explainability | Engineering | 80 | 2 | 160 | 40 |
| Performance | Engineering | 60 | 1 | 60 | 40 |
| Scalability | Engineering | 62 | 1 | 62 | 38 |
| Azure Compatibility and SaaS Deployment Readiness | Engineering | 82 | 2 | 164 | 36 |
| Auditability | Enterprise | 82 | 2 | 164 | 36 |
| Accessibility | Enterprise | 65 | 1 | 65 | 35 |
| Stickiness | Commercial | 65 | 1 | 65 | 35 |
| Availability | Engineering | 65 | 1 | 65 | 35 |
| Manageability | Engineering | 68 | 1 | 68 | 32 |
| Deployability | Engineering | 70 | 1 | 70 | 30 |
| Change Impact Clarity | Enterprise | 70 | 1 | 70 | 30 |
| Evolvability | Engineering | 70 | 1 | 70 | 30 |
| Supportability | Engineering | 72 | 1 | 72 | 28 |
| Extensibility | Engineering | 72 | 1 | 72 | 28 |
| Modularity | Engineering | 76 | 1 | 76 | 24 |
| Testability | Engineering | 78 | 1 | 78 | 22 |
| Observability | Engineering | 80 | 1 | 80 | 20 |
| Azure Ecosystem Fit | Engineering | 80 | 1 | 80 | 20 |
| Documentation | Engineering | 82 | 1 | 82 | 18 |

**Total weighted score:** 6532 / 10000 = **65.32%**
