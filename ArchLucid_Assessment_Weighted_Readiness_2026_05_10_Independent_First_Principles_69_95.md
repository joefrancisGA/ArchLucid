# ArchLucid Assessment – Weighted Readiness 69.95%

**Date:** 2026-05-10
**Method:** Independent first-principles assessment from repository materials only
**Scoring basis:** 47 qualities, 112 total weight points, scores 1–100 per quality
**Deferred-scope policy:** Items explicitly deferred to V1.1/V2 per `V1_SCOPE.md` and `V1_DEFERRED.md` are not penalized

**Product boundary (this assessment revision):** Customer delivery is **hosted SaaS only**. **Self-hosted** installs and an **open-source contributor** community are **not in scope** here. Local Docker / .NET tooling in the repo refers to **engineering** build and test workflows, not to a parallel buyer motion.

**Buyer-perception policy (this assessment):** **Single-vendor risk** (concern that the product comes from one company or a small engineering team) is **not** treated as a defect against headline readiness **`(A)`** and was **not** used to lower any quality score. Organizational scale optics belong only in optional **`(B)`** procurement-realism narrative, with **zero weight** on **`(A)`**, when explicitly labeled.

---

## 1. Executive Summary

### Overall Readiness

ArchLucid is a serious, architecturally coherent product with genuine technical depth. The core pipeline (request → execute → commit → manifest → artifacts) works, the domain model is well-decomposed across ~30 .NET projects, the operator UI is progressive and accessibility-aware, and the documentation corpus is extraordinarily thorough. The 69.95% weighted readiness reflects a product that is **engineering-strong and commercially early** — the machinery works, but the connective tissue that turns a working system into a revenue-generating product (customer workflow integration, proof of real-world value, buyer self-sufficiency) has meaningful gaps.

### Commercial Picture

The product has clear positioning (AI-assisted architecture workflow) and a differentiated angle (manifest-first, governance-grade evidence). Pricing philosophy, ROI model, and procurement pack exist in detail. However, no customer has used it in production, the trial funnel is in TEST mode only, ITSM connectors (Jira, ServiceNow, Confluence) are committed but still being built, and the self-serve commercial path (Stripe live, Marketplace published) is explicitly V1.1. The commercial picture is *prepared* but *unproven*.

### Enterprise Picture

Enterprise trust infrastructure is unusually mature for a pre-revenue product: CAIQ/SIG pre-fills, DPA template, SOC 2 self-assessment, STRIDE threat model, 78 typed audit events, RBAC with four roles, RLS, SCIM 2.0. The gaps are in real-world workflow integration — no customer has threaded ArchLucid into their actual architecture review cadence, ITSM ticket creation is shipping but bidirectional sync is in-flight. **Hosted SaaS operators** do not stand up ArchLucid’s backing services; sophistication is about interpreting outputs, aligning workforce identity, and navigating Operate-layer capabilities. Operational deployment and platform hardening are **vendor** responsibilities on this motion.

### Engineering Picture

Engineering quality is the strongest pillar. The solution has 30+ projects with clean dependency boundaries, Dapper-over-EF persistence, DbUp migrations, FsCheck property-based tests, OWASP ZAP and Schemathesis in CI, OpenAPI contract snapshot testing, Stryker mutation testing, golden cohort LLM evaluation, architecture fitness tests, and 114 Terraform files across 15+ modules. Agent runtime includes circuit breakers, token budgets, content safety guards, caching, cost estimation, and quality gates with LLM semantic judges. The primary engineering risks are: correctness of AI-generated outputs in novel real-world scenarios (inherent to the domain), incomplete ITSM connector implementation, and the gap between simulator-mode testing and real LLM production behavior.

---

## 2. Weighted Quality Assessment

Qualities ordered by **weighted deficiency** (weight × (100 − score)), most urgent first.

### 2.1 Correctness
- **Score:** 72 | **Weight:** 8 | **Weighted deficiency:** 224
- **Justification:** The core pipeline produces structured manifests, findings, and artifacts. Schema validation, decision traces, typed findings, and property-based tests (FsCheck) provide structural correctness. Agent output quality gates with heuristic and LLM semantic judges catch low-quality completions. Golden cohort evidence exists. However, "correctness" for an AI architecture advisor means the *recommendations are actually right* — and there is no production customer evidence, no independent validation of finding accuracy against real enterprise architectures, and simulator mode (which most tests use) produces deterministic fake outputs that cannot validate real-world correctness. The gap between simulator and real-LLM correctness is the single largest uncertainty in the product.
- **Tradeoffs:** Simulator-first testing enables fast CI but masks real LLM failure modes (hallucination, context window drift, prompt sensitivity). Golden cohort attempts to bridge this but is still operator-triggered and evidence is sparse.
- **Improvements:** Run golden cohort against diverse real architecture briefs; establish a correctness benchmark with expert-reviewed outputs; add drift detection between simulator and real-LLM outputs for the same inputs.

### 2.2 AI/Agent Readiness
- **Score:** 75 | **Weight:** 8 | **Weighted deficiency:** 200
- **Justification:** The agent runtime is well-structured: `RealAgentExecutor`, `AgentResultParser`, schema validation, circuit breakers (`CircuitBreakingAgentCompletionClient`), caching (`CachingLlmCompletionClient`), fallback providers, token quota trackers (daily and monthly), content safety guards, prompt redaction, cost estimation, staged critic agents, model tier routing, and agent output evaluation (heuristic + LLM judge + reference case catalog). The pipeline supports both simulator and real Azure OpenAI modes. The quality gate architecture (`AgentOutputQualityGate`) with configurable floors and modes is mature. The gap is that most test evidence runs in simulator mode, real-LLM golden cohort evidence is thin, and the agent pipeline has not been validated at scale with diverse, adversarial, or edge-case architecture briefs.
- **Tradeoffs:** The simulator-first design is correct for CI speed but creates a coverage gap for agent behavior under real conditions. Content safety is fail-closed in production, which is correct but means production deployment requires Azure Content Safety provisioning.
- **Improvements:** Expand golden cohort to 20+ diverse scenarios; add agent output regression suites comparing real-LLM vs simulator; track prompt version → output quality correlation.

### 2.3 Marketability
- **Score:** 68 | **Weight:** 8 | **Weighted deficiency:** 256
- **Justification:** The product has a clear value proposition (architecture request → defensible manifest), differentiated positioning, an executive sponsor brief, a pricing philosophy, a procurement pack, demo scripts, and marketing UI pages. However, there is no public reference customer, no case study with measured outcomes, no analyst coverage, no independent review, and the marketing site (`archlucid.net`) is staging-only with Stripe in TEST mode. The product is *messageable* but not yet *market-proven*.
- **Tradeoffs:** Deep procurement documentation (CAIQ, SIG, DPA, trust center) is unusual for this stage and creates trust credibility, but lacks the customer evidence that validates the message.
- **Improvements:** Produce a synthetic but data-grounded case study with realistic numbers; complete the trial funnel end-to-end; prepare a 3-minute demo video.

### 2.4 Time-to-Value
- **Score:** 72 | **Weight:** 7 | **Weighted deficiency:** 196
- **Justification:** For **hosted SaaS customers**, the commercial path is browser-based: signup / trial, workforce identity (JWT / Entra External ID where used), and progressing from first login to a first committed manifest (`docs/START_HERE.md`). Time-to-value is gated by trial and onboarding quality, IdP alignment, domain fluency (how to phrase a good architecture brief and read findings), not by customers provisioning compute or databases. **Internal engineering** builds and validates the product with local tooling and CI; that is unrelated to customer time-to-value. The gap between "first session" and "they believe it saved meaningful architecture-review effort" remains significant until product and process fluency catch up.
- **Tradeoffs:** The two-layer model (Pilot → Operate) correctly defers complexity, but even Pilot requires domain understanding that the product cannot shortcut.
- **Improvements:** Shorten hosted SaaS time-to-first-value (signup → first meaningful committed review): polish trial onboarding, seeded sample architecture review tour, obvious next steps on home; optionally add guided "sample architecture review" with bundled inputs — without conflating that with infra, which buyers do not provision on the SaaS path.

### 2.5 Adoption Friction
- **Score:** 65 | **Weight:** 6 | **Weighted deficiency:** 210
- **Justification:** For **hosted SaaS**, buyers do not install .NET, Docker, SQL Server, or provision Azure OpenAI for the vendor stack. Adoption friction comes from trial and signup UX, interpreting a broad operator surface when Operate layers are disclosed, enterprise IdP / SCIM and governance conversations, and the trial funnel still not being on **live** commerce rails in the current window. Severity is **medium**: product depth and onboarding/commerce maturity, not customer-run infrastructure.
- **Tradeoffs:** The product's depth creates inherent surface area. The progressive disclosure model (Pilot → Operate) mitigates but doesn't eliminate this.
- **Improvements:** Ship and harden the hosted trial funnel end-to-end (Stripe TEST → production equivalents per release window); keep first-session onboarding focused on **hosted SaaS** buyers; reduce in-product configuration and concept load on the default Pilot path where possible.

### 2.6 Workflow Embeddedness
- **Score:** 55 | **Weight:** 3 | **Weighted deficiency:** 135
- **Justification:** ITSM connectors (Jira, ServiceNow) are committed for V1 GA and partially implemented — outbound issue creation exists with persistence and correlation, vendor HTTP conformance tests exist, but bidirectional status sync is in-flight. Confluence publish is committed. Slack outbound delivery channels exist. Integration events (Service Bus, webhooks) provide an event bus. Azure DevOps integration exists. However, no ITSM connector has been tested against a real customer instance, the Confluence connector is minimal (single space, API token auth), and the product does not yet slot into an architect's daily workflow tools (no IDE integration, no calendar/meeting integration, no automated trigger from repo events).
- **Tradeoffs:** The webhook + CloudEvents + recipe approach provides flexibility but pushes integration burden to the customer. First-party connectors are the right call but shipping is incomplete.
- **Improvements:** Complete Jira and ServiceNow outbound creation with at least one real-instance smoke test; ship Confluence publish to staging; document a "day in the life" workflow showing how ArchLucid fits into existing architecture review cadences.

### 2.7 Proof-of-ROI Readiness
- **Score:** 58 | **Weight:** 5 | **Weighted deficiency:** 210
- **Justification:** A detailed ROI model exists with industry benchmarks, formulas, and a worked example. Pilot ROI telemetry (`RunRoiTelemetryRow`, value report pages, ROI bulletin templates) is built into the product. However, every number is hypothetical — no customer has measured time savings, no customer has compared before/after architecture review costs, and the ROI model's assumptions (30-60 hours per review, $15K-$75K per remediation) have not been validated against any real engagement. The product *can* measure ROI but *hasn't*.
- **Tradeoffs:** Building the measurement infrastructure before having customers is correct forward planning, but it means the ROI story is entirely theoretical.
- **Improvements:** Run the ROI model against the product's own development (use ArchLucid to review ArchLucid's architecture, measure time, compare to manual); prepare a "pilot success criteria" template that ties to specific measurable outcomes.

### 2.8 Security
- **Score:** 76 | **Weight:** 3 | **Weighted deficiency:** 72
- **Justification:** Security posture is strong for the product stage: fail-closed auth defaults, production guard against DevelopmentBypass, OWASP ZAP in CI (merge-blocking), Schemathesis API fuzzing, RBAC with four roles, RLS with SESSION_CONTEXT, content safety guards (fail-closed in production), log injection mitigation (LogSanitizer), STRIDE threat model, prompt redaction, Key Vault for secrets, private endpoint Terraform modules, rate limiting (role-aware), SCIM 2.0, and security headers. Gaps: no third-party pen test (V2 per scope), no CPA SOC 2 (post-V1.1 per scope — not penalized), PGP key not yet dropped (V1.1 per scope — not penalized), and owner-conducted pen test evidence is still in-progress.
- **Tradeoffs:** The security-in-depth approach is correct but increases operational complexity (Azure Content Safety, Key Vault, RLS, SCIM all need configuration). The fail-closed production defaults are excellent.
- **Improvements:** Complete the owner-conducted pen test and document findings; verify that all admin-only endpoints are covered by AdminAuthority policy; add a security self-test command to the CLI.

### 2.9 Architectural Integrity
- **Score:** 80 | **Weight:** 3 | **Weighted deficiency:** 60
- **Justification:** The solution demonstrates genuine architectural discipline: ~30 projects with clear responsibilities (Core → Contracts → AgentRuntime → ContextIngestion → KnowledgeGraph → Decisioning → ArtifactSynthesis → Provenance → Application → Persistence → Api → Worker → Cli), dependency constraint tests (`DependencyConstraintTests`), ADR catalog (35+ records), C4-level architecture documentation, clean separation between coordinator and authority pipelines, convergence tracked via ADRs (0002 → 0012 → 0021), and a navigation rule system for the UI. The architecture is internally coherent and well-documented.
- **Tradeoffs:** The large number of projects creates cognitive overhead for **engineers** joining the codebase, but the clean dependency graph justifies it. The coordinator-to-authority migration (ADR 0021 strangler plan) adds temporary complexity.
- **Improvements:** Complete the coordinator pipeline strangler; ensure all INV-* invariants from the architecture invariant catalog are enforced by tests.

### 2.10 Trustworthiness
- **Score:** 72 | **Weight:** 3 | **Weighted deficiency:** 84
- **Justification:** The trust infrastructure is unusually mature: trust center with 20+ documents, CAIQ/SIG pre-fills, DPA template, subprocessors register, incident communications policy, SIEM export, backup/DR documentation, SLA targets, data residency documentation, SOC 2 self-assessment, VPAT draft, procurement objection playbook, and a CLI-buildable procurement pack. The gap is that trustworthiness for an AI-powered architecture tool ultimately depends on *output quality* — whether a buyer can rely on the findings and recommendations — and that has no real-world validation.
- **Tradeoffs:** Documentation-heavy trust is the right move pre-revenue, but it substitutes process evidence for outcome evidence.
- **Improvements:** Create a "trust evidence page" in the product that shows per-run quality metrics (faithfulness, grounding, citation coverage); make the finding inspector more prominent in the default Pilot flow.

### 2.11 Traceability
- **Score:** 78 | **Weight:** 3 | **Weighted deficiency:** 66
- **Justification:** Strong: 78 typed audit events in append-only SQL, correlation IDs across the pipeline, decision traces, agent execution traces, provenance graph, finding inspector with evidence chains, audit log search with keyset pagination, CSV export, SIEM-compatible CEF line writer, and durable audit for governance workflows. The finding inspector shows typed payload, decision rule, evidence nodes, and audit row ID. The gap is that some mutating flows do not yet emit durable audit events (acknowledged in AUDIT_COVERAGE_MATRIX known gaps).
- **Tradeoffs:** Append-only audit with DPA-aware retention (purge excludes AuditEvents) is the right trade.
- **Improvements:** Close remaining audit coverage gaps documented in AUDIT_COVERAGE_MATRIX.

### 2.12 Usability
- **Score:** 64 | **Weight:** 3 | **Weighted deficiency:** 108
- **Justification:** The operator UI has 527+ TSX files with progressive disclosure, a core pilot checklist, an onboarding tour, command palette, keyboard shortcuts, breadcrumbs, getting-started steps, and welcome banner. The two-layer model (Pilot → Operate) reduces initial surface area. However, the product surface is large, the domain is complex, the configuration space is vast, and the UI has not been validated with real users. axe-core accessibility tests exist but there is no user research, no usability testing, and no feedback from actual architects using the tool.
- **Tradeoffs:** The progressive disclosure approach is correct but the Operate layer surface is still overwhelming when fully disclosed.
- **Improvements:** Conduct usability testing with 3-5 enterprise architects; simplify the default Pilot UI to focus on the 4-step core path; add inline contextual help for the most common confusion points.

### 2.13 Executive Value Visibility
- **Score:** 66 | **Weight:** 4 | **Weighted deficiency:** 136
- **Justification:** Executive sponsor brief exists, ROI model is detailed, pilot value report and sponsor one-pager exports are built in, ROI telemetry is tracked per run, and a steering decision memo template exists. The gap is that there is no dashboard or summary view purpose-built for an executive who wants to see "what did we get from ArchLucid this quarter" without diving into operator-level detail. The sponsor proof readiness classification and first-value evidence completeness tracking are promising but untested.
- **Tradeoffs:** Building executive surfaces before having real executive users risks building the wrong thing.
- **Improvements:** Create a lightweight "executive scorecard" page that summarizes: runs completed, findings generated, estimated hours saved, compliance coverage trend — all derivable from existing data.

### 2.14 Differentiability
- **Score:** 74 | **Weight:** 4 | **Weighted deficiency:** 104
- **Justification:** ArchLucid has a genuinely differentiated angle: manifest-first architecture output (not just diagrams or discussions), governance-grade evidence trail, typed findings with decision traces, comparison/replay capabilities, and a structured request-to-commit workflow. No mainstream competitor offers this specific combination. The positioning document and executive brief articulate this clearly. The gap is that differentiation is theoretical until a customer confirms it matters to them.
- **Tradeoffs:** The specificity of the value proposition (architecture review workflow automation) is both a differentiator and a market-size constraint.
- **Improvements:** Articulate the competitive landscape explicitly in the procurement pack; prepare a "why not just use [Confluence/SharePoint/manual review]" comparison for buyers.

### 2.15 Compliance Readiness
- **Score:** 68 | **Weight:** 2 | **Weighted deficiency:** 64
- **Justification:** COMPLIANCE_MATRIX.md maps control themes to evidence paths. SOC 2 self-assessment with gap register exists. CAIQ Lite and SIG Core pre-fills are prepared. VPAT draft (WCAG 2.1 AA) exists with axe-core evidence. DSAR process documented. However, there is no CPA SOC 2 (post-V1.1 — not penalized), no third-party pen test (V2 — not penalized), and compliance drift tracking is built but untested with real compliance data.
- **Tradeoffs:** Self-attestation is the correct posture pre-$250K ARR per the SOC 2 roadmap.
- **Improvements:** Ensure compliance drift chart works with realistic sample data; validate that CAIQ/SIG pre-fills are complete enough for a real buyer questionnaire round.

### 2.16 Procurement Readiness
- **Score:** 65 | **Weight:** 2 | **Weighted deficiency:** 70
- **Justification:** Procurement pack is CLI-buildable with manifest, SHA-256 checksums, redaction report, and canonical file list enforced in CI. Cover letter template exists. Procurement FAQ exists. Objection playbook exists. DPA template, subprocessors, SLA summary, backup/DR are all documented. The gap: no customer has actually gone through procurement with these materials, and some materials may still have draft markers or placeholders that a real procurement team would flag.
- **Tradeoffs:** Over-preparing procurement materials before having a buyer is a reasonable investment given enterprise sales cycles.
- **Improvements:** Do a dry run of the procurement pack against a realistic enterprise security questionnaire; verify no placeholder or draft markers remain in the pack.

### 2.17 Interoperability
- **Score:** 58 | **Weight:** 2 | **Weighted deficiency:** 84
- **Justification:** OpenAPI contract with snapshot testing and generated .NET client. AsyncAPI for webhooks. Bruno collection for manual testing. Integration events via Service Bus. SCIM 2.0 for identity provisioning. Azure DevOps integration. Customer-controlled Azure extractor (PowerShell + ZIP). However, ITSM connectors are still building, Confluence publish is early, there is no MCP (V1.1 — not penalized), no IDE integration, no Terraform Cloud integration, and the API client is .NET-only (TypeScript types are generated but no published npm package).
- **Tradeoffs:** REST-first with webhook fan-out is the right starting point, but enterprise interoperability requires meeting customers where they are (Jira, ServiceNow, Slack, Teams — all in progress).
- **Improvements:** Ship the first ITSM outbound create to a real staging environment; publish TypeScript types as an npm package; add a Python API client example.

### 2.18 Decision Velocity
- **Score:** 62 | **Weight:** 2 | **Weighted deficiency:** 76
- **Justification:** The product is designed to accelerate architecture decisions (request → manifest in one session, comparison between runs, advisory scans). The core pilot path is streamlined. However, the actual decision velocity depends on how quickly an organization can: complete tenant onboarding and identity alignment (hosted SaaS), submit a meaningful architecture brief, interpret findings, and act on recommendations. The product does not yet automate the "act on findings" step beyond creating ITSM tickets.
- **Tradeoffs:** Decision velocity is partly a product property and partly an organizational property; ArchLucid correctly focuses on the structured-output side.
- **Improvements:** Add a "quick decision summary" that extracts the top 3 actionable items from a run without requiring full manifest review.

### 2.19 Commercial Packaging Readiness
- **Score:** 70 | **Weight:** 2 | **Weighted deficiency:** 60
- **Justification:** Two-layer model (Pilot → Operate) is clean. Pricing philosophy with seat-based pricing and run overage exists. Order form template exists. Stripe integration is wired (BillingStripeWebhookController, BillingCheckoutController, BillingProductionSafetyRules). Marketplace SaaS alignment doc exists. Tier enforcement ([RequiresCommercialTenantTier] returning 402) is implemented. Trial tenant accounting exists. However, commerce is in TEST mode only, no live pricing page, and the packaging boundary between Pilot and Operate is soft (UI shaping, not hard entitlement gates).
- **Tradeoffs:** Soft UI shaping before having customers is pragmatic; hard entitlement gates can be added when pricing is validated by market response.
- **Improvements:** Validate the pricing page renders correctly with current tier data; test the full trial → checkout → provision → use flow in staging.

### 2.20 Reliability
- **Score:** 73 | **Weight:** 2 | **Weighted deficiency:** 54
- **Justification:** Circuit breakers on LLM calls, retry policies (AzureOpenAiTooManyRequestsRetry), fallback agent completion client, health probes (live/ready/full), optimistic concurrency with ROWVERSION, data consistency orphan probes, hot-path cache with invalidation, chaos exercise calendar (staging-only, quarterly), and SLA targets (99.9% monthly). Database failover Terraform module exists. However, no production chaos testing, no real-world failure data, and the reliability targets are engineering aspirations, not measured outcomes.
- **Tradeoffs:** Staging-only chaos per owner decision (2026-04-22) is the right call before production customers exist.
- **Improvements:** Complete the first quarterly chaos exercise on staging and document results; verify failover group switchover actually works.

### 2.21 Data Consistency
- **Score:** 77 | **Weight:** 2 | **Weighted deficiency:** 46
- **Justification:** Explicit data consistency matrix documenting strong consistency, eventual consistency, and best-effort paths. Transactional boundaries are well-defined. Optimistic concurrency with ROWVERSION. Idempotency keys on run creation. Orphan golden manifest quarantine probe. Archival cascade with transactional child cleanup. Read-replica staleness expectations documented. Hot-path cache with documented invalidation paths and residual risk. This is unusually well-documented for the product stage.
- **Tradeoffs:** The consistency model is honest about its limitations (cache TTL staleness, read-replica lag), which is correct.
- **Improvements:** Add a data consistency smoke test to release-smoke that verifies round-trip consistency for the core path.

### 2.22 Maintainability
- **Score:** 74 | **Weight:** 2 | **Weighted deficiency:** 52
- **Justification:** Clean project structure with dependency constraints enforced by tests. Roslyn analyzers (DirectHttpClientConstructionAnalyzer and others). EditorConfig. Directory.Packages.props for central package management. Engineering onboarding / install spine in `docs/`. Architecture fitness tests. Code coverage enforcement. However, ~291 files in Core alone, ~225 in Contracts, ~116 in AgentRuntime — the codebase is large and growing, and the documentation-to-code ratio is very high (682 markdown files in docs/), which itself becomes a maintenance burden.
- **Tradeoffs:** Extensive documentation is a strength but creates a second codebase that must stay aligned. The doc scope header CI check and canonical JSON enforcement help.
- **Improvements:** Add a "stale doc" detector that flags markdown files not updated in 90+ days that reference code paths; consider archiving assessment/quality docs older than one quarter.

### 2.23 Explainability
- **Score:** 73 | **Weight:** 2 | **Weighted deficiency:** 54
- **Justification:** Finding inspector provides typed payload, decision rule, evidence nodes, and audit row linkage — all without exposing raw LLM prompts. Citation rendering rules documented. Trace completeness analysis exists (with FsCheck property tests). Per-run explainability JSON endpoint. Deterministic explanation service. LLM audit endpoint (separate, redacted). The "Why?" link from findings to inspector is the right UX pattern. The gap is that explainability for an AI system also means the user understands *why* the AI recommended what it did, not just *what data it used* — and that deeper "reasoning trace" is not yet surfaced.
- **Tradeoffs:** Not exposing raw LLM prompts at the API edge is correct for security; the finding inspector is a good proxy.
- **Improvements:** Add a "reasoning summary" field to finding inspection that provides a human-readable 2-3 sentence explanation of why the finding was generated.

### 2.24 Azure Compatibility and SaaS Deployment Readiness
- **Score:** 78 | **Weight:** 2 | **Weighted deficiency:** 44
- **Justification:** 114 Terraform files across 15+ modules (container-apps, SQL failover, edge/Front Door, Key Vault, monitoring, OpenAI, service bus, storage, private networking, Entra, OTEL collector, pilot). Container Apps deployment with jobs. Docker compose profiles. Managed identity support. Private endpoints. Consumption budgets. Application Insights. Prometheus SLO rules. Grafana dashboards. The infrastructure-as-code posture is production-grade. The gap is that some Terraform state still has legacy naming, and the full SaaS stack has not been deployed to production (staging only).
- **Tradeoffs:** Having this much IaC before a production customer is unusual and positive; the Phase 7 rename is correctly deferred.
- **Improvements:** Verify `infra/apply-saas.ps1` works end-to-end on a clean subscription; document the minimum Azure permissions needed for deployment.

### 2.25 Stickiness
- **Score:** 71 | **Weight:** 1 | **Weighted deficiency:** 29
- **Justification:** Stickiness mechanisms: accumulated runs and manifests create a versioned history, committed golden manifests become reference artifacts, governance approval chains and policy packs create organizational investment, audit trail becomes compliance evidence, comparison/replay create a longitudinal architecture record. These are genuine switching costs. However, stickiness requires actual use — no customer has accumulated enough runs to feel locked in.
- **Tradeoffs:** Building stickiness into the data model from day one is correct.
- **Improvements:** Ensure export formats (ZIP, DOCX, CSV) are complete enough that customers don't feel trapped — stickiness should come from value, not data hostage.

### 2.26 Template and Accelerator Richness
- **Score:** 60 | **Weight:** 1 | **Weighted deficiency:** 40
- **Justification:** Project scaffolding via `archlucid new`, demo seed with Contoso trusted baseline, sample architecture request JSON, offline demo pack, and the finding engine template (`templates/archlucid-finding-engine/`). However, there are no industry-specific templates (healthcare, financial services, retail), no pre-built policy packs for common compliance frameworks, and no library of reference architecture patterns that the product could evaluate against.
- **Tradeoffs:** Templates are most valuable when shaped by real customer needs; building them speculatively is risky.
- **Improvements:** Create 2-3 policy pack templates for common scenarios (SOC 2 compliance, cost optimization, cloud migration readiness).

### 2.27 Auditability
- **Score:** 76 | **Weight:** 2 | **Weighted deficiency:** 48
- **Justification:** 78 typed audit events, append-only SQL store, correlation IDs, CSV export, SIEM-compatible export (CEF), audit search with keyset pagination, filter by event type/actor/run/correlation/time window, governance dual-write to durable audit, and DPA-aware retention (audit excluded from purge). Strong.
- **Tradeoffs:** Some flows still lack durable audit (documented as known gaps). Cosmos DB audit path is optional/future.
- **Improvements:** Close the remaining known gaps in AUDIT_COVERAGE_MATRIX; add audit event count to the admin health dashboard.

### 2.28 Policy and Governance Alignment
- **Score:** 74 | **Weight:** 2 | **Weighted deficiency:** 52
- **Justification:** Policy packs with scope assignments and effective governance resolution. Pre-commit governance gate. Approval workflow with segregation of duties and SLA tracking. Governance dashboard. Compliance drift trend tracking. Policy pack dry run. Environment activation. The governance model is well-designed. The gap is that no real customer policy pack exists — all policy content is authored by the product team.
- **Tradeoffs:** Governance infrastructure without customer-authored policies is a framework; it becomes valuable when customers create their own rules.
- **Improvements:** Create a sample "enterprise architecture governance" policy pack that demonstrates real-world rules.

### 2.29 Accessibility
- **Score:** 62 | **Weight:** 1 | **Weighted deficiency:** 38
- **Justification:** jest-axe tests in Vitest, Playwright axe integration, VPAT 2.4 draft (WCAG 2.1 AA), accessibility mailbox, marketing `/accessibility` route, dedicated accessibility test files (operator-governance-axe, marketing-pages-axe, interactive-primitives-axe). Review cadence documented. However, VPAT is draft with manual conformance gaps acknowledged, no assistive technology user testing (not penalized per scope rules), and some criteria are marked "Not Evaluated."
- **Tradeoffs:** Automated axe-core provides a baseline; manual WCAG conformance work remains. The annual review cadence is appropriate.
- **Improvements:** Complete evaluation of "Not Evaluated" VPAT criteria; ensure all interactive components have proper ARIA labels.

### 2.30 Customer Self-Sufficiency
- **Score:** 57 | **Weight:** 1 | **Weighted deficiency:** 43
- **Justification:** For **hosted SaaS**, buyers lean on Trust Center links, procurement pack, `/health` and versioning for support escalations, and in-product workflows. Repo docs and tooling (`doctor`, `support-bundle`) are primarily **engineering / vendor-operator** aids. Buyers still face domain load (architecture review methodology) and a large surface once Operate is revealed. No in-product help search or chat companion is described as first-class today.
- **Tradeoffs:** Documentation-heavy self-service is appropriate for an operator-focused product, but the volume of documentation itself becomes a navigation challenge.
- **Improvements:** Add a searchable help index in the operator UI; create a "common tasks" quick reference card; consider in-product contextual help tooltips.

### 2.31 Change Impact Clarity
- **Score:** 70 | **Weight:** 1 | **Weighted deficiency:** 30
- **Justification:** BREAKING_CHANGES.md, CHANGELOG.md, comparison/replay for architecture changes, manifest diffing, golden manifest delta for Azure DevOps PRs, and explicit deprecation policy with Sunset headers. The change trail for the product itself is documented. For customer-facing changes, the comparison and replay surfaces show what changed and when.
- **Tradeoffs:** Change clarity for the product is good; change clarity for the customer's architecture is the product's core value.
- **Improvements:** Add a "what changed since your last review" summary to the run detail page.

### 2.32 Performance
- **Score:** 66 | **Weight:** 1 | **Weighted deficiency:** 34
- **Justification:** Performance baseline tests exist (CorePilotFlowPerformanceTests with Stopwatch gates, simulator + in-memory). BenchmarkDotNet microbenchmarks (AgentDispatchMicroBenchmarks). k6 load tests (per-tenant burst, soak). Rate limiting. Hot-path cache. Read replica routing. However, baseline tests run against simulator/in-memory (not real SQL + real LLM), no published performance numbers, and the soak/load tests are scheduled but evidence of results is not visible.
- **Tradeoffs:** Performance with real LLM calls is dominated by Azure OpenAI latency, which the product cannot control. In-process performance is less critical.
- **Improvements:** Run load test baseline against staging with SQL; publish performance characteristics (request latency, throughput) in operator documentation.

### 2.33 Scalability
- **Score:** 67 | **Weight:** 1 | **Weighted deficiency:** 33
- **Justification:** Database-per-tenant isolation model. Hot-path cache with auto Redis selection at replica count > 1. Container Apps with autoscaling. Read replica routing. Token quota trackers (daily/monthly). LLM budget management. However, the product has not been tested at scale (multiple tenants, concurrent runs, large manifests), Redis is optional in V1, and the graph projection cache is in-memory only.
- **Tradeoffs:** The architectural choices (database-per-tenant, cache auto-selection, read replicas) are correctly positioned for future scale. The deferred Redis elevation to V2 is appropriate.
- **Improvements:** Run a simulated multi-tenant burst test; document scaling limits for single-replica deployments.

### 2.34 Availability
- **Score:** 70 | **Weight:** 1 | **Weighted deficiency:** 30
- **Justification:** 99.9% monthly availability target (pre-contractual). SQL failover group Terraform module. Health probes (live/ready/full). Hosted SaaS probe workflow. Geo-failover drill runbook. However, targets are aspirational — no production availability data exists, and the failover mechanisms have not been exercised in a real outage.
- **Tradeoffs:** Availability infrastructure before production customers is forward investment. Staging probes are correctly disclaimed as not production evidence.
- **Improvements:** Complete the first geo-failover drill on staging; establish an availability measurement baseline.

### 2.35 Supportability
- **Score:** 75 | **Weight:** 1 | **Weighted deficiency:** 25
- **Justification:** CLI `doctor` and `support-bundle --zip`, correlation IDs on all requests, `/version` endpoint, troubleshooting guide, runbooks (15+ covering database failover, incident investigation, advisory scan failures, load test rate limits, secret rotation, trial lifecycle, etc.). Support bundle has sensitive pattern redaction. Incident communications policy documented.
- **Tradeoffs:** Support infrastructure is mature; support team does not exist yet.
- **Improvements:** Test support bundle generation against a real deployment; verify redaction removes all sensitive patterns.

### 2.36 Manageability
- **Score:** 72 | **Weight:** 1 | **Weighted deficiency:** 28
- **Justification:** ConfigurationKeyCatalog provides a typed registry of all configuration keys. Configuration summary endpoints. Admin health page. Operations admin guide. LLM quota management. Production profile fail-fast for misconfigurations. However, the configuration space is very large (hundreds of keys), and there is no configuration management UI — all configuration is via appsettings JSON, environment variables, or Key Vault.
- **Tradeoffs:** Configuration-file management is standard for infrastructure-grade software but creates operator burden.
- **Improvements:** Add a read-only "effective configuration" view to the admin panel showing non-secret configuration state.

### 2.37 Deployability
- **Score:** 71 | **Weight:** 1 | **Weighted deficiency:** 29
- **Justification:** Docker images with compose profiles. Container Apps Terraform. CD pipelines (cd-staging-on-merge, cd-saas-greenfield, cd). Package-release scripts. release-smoke validation. apply-saas.ps1. DbUp migrations on startup. However, the full SaaS stack deployment has not been validated end-to-end to production, and the deploy scripts have several environment-specific assumptions.
- **Tradeoffs:** Automated deployment with staged validation (staging → production) is the right model.
- **Improvements:** Document the complete production deployment runbook as a step-by-step checklist.

### 2.38 Observability
- **Score:** 74 | **Weight:** 1 | **Weighted deficiency:** 26
- **Justification:** OpenTelemetry instrumentation (ArchLucidInstrumentation). Application Insights integration. Prometheus metrics and SLO rules. Grafana dashboards (Terraform-deployed). Circuit breaker gate metrics. First-tenant funnel event tracking. Agent prompt activity tags. RLS bypass Prometheus counter. Structured logging with Serilog. However, no production observability data exists, and the observability stack has not been exercised under real load.
- **Tradeoffs:** Having OTel + Prometheus + Grafana + App Insights is comprehensive for the product stage.
- **Improvements:** Verify dashboard queries return meaningful data against staging; add a "system health" summary to the operator home page.

### 2.39 Testability
- **Score:** 79 | **Weight:** 1 | **Weighted deficiency:** 21
- **Justification:** Multi-tier test structure (Core, Fast Core, Integration, Slow, Full Regression, Performance, OpenAPI Contract). Property-based tests (FsCheck). Architecture fitness tests. Mutation testing (Stryker). Golden cohort evaluations. Agent eval corpus. Schemathesis API fuzzing. OWASP ZAP security scanning. Live E2E with Playwright against real API + SQL. Golden corpus record tests. Reference case catalog for agent output evaluation. CodeQL. SonarQube. 15+ test projects. Coverage enforcement with Coverlet. This is a very well-tested codebase.
- **Tradeoffs:** The test infrastructure is comprehensive but the test execution time and maintenance cost are non-trivial for a single developer.
- **Improvements:** Ensure Stryker mutation score is tracked and improving over time; add mutation test coverage to the most critical paths (commit, governance gate).

### 2.40 Modularity
- **Score:** 81 | **Weight:** 1 | **Weighted deficiency:** 19
- **Justification:** 30+ projects with explicit dependency boundaries. Core → Contracts → domain libraries → Application → Persistence → Api layering. Dependency constraint tests enforce the graph. Host.Composition wires DI. Host.Core provides shared startup. Finding engine template demonstrates extensibility. Each class in its own file. Interface-first design throughout. The modularity is genuine and enforced.
- **Tradeoffs:** High modularity increases the number of projects and can slow compilation, but the boundaries are meaningful.
- **Improvements:** Verify that the finding engine template can actually be used by a third party to create a custom finding engine.

### 2.41 Extensibility
- **Score:** 68 | **Weight:** 1 | **Weighted deficiency:** 32
- **Justification:** Finding engine template exists. Webhook + CloudEvents provide event extensibility. Integration event catalog. Policy pack framework allows custom governance rules. The agent handler pattern (ComplianceAgentHandler, etc.) is extensible. However, there is no public plugin SDK, no extension API, no marketplace (all correctly out of scope per V1_SCOPE.md — not penalized), and the finding engine template has not been tested by anyone outside the project.
- **Tradeoffs:** Extension infrastructure before having users who want to extend is risky; the template approach is a reasonable middle ground.
- **Improvements:** Validate the finding engine template end-to-end; document how a customer would add a custom agent handler.

### 2.42 Evolvability
- **Score:** 72 | **Weight:** 1 | **Weighted deficiency:** 28
- **Justification:** API versioning with deprecation headers and sunset policy. ADR catalog tracking architectural decisions. Explicit deferred scope (V1_DEFERRED.md). Strangler pattern for coordinator-to-authority migration (ADR 0021). Breaking change trail. The product is designed to evolve. The evolution path assumes deepening product and customer use over time.
- **Tradeoffs:** Building evolution infrastructure early creates documentation and maintenance overhead; the trade is paid for by safer API and schema change discipline.
- **Improvements:** Ensure the V1 → V1.1 migration path is documented for existing trial tenants.

### 2.43 Documentation
- **Score:** 82 | **Weight:** 1 | **Weighted deficiency:** 18
- **Justification:** 682 markdown files in docs/. Five-document onboarding spine for **buyers and operators**, plus deeper **engineering** and **security/GRC** material. CI-enforced doc scope headers. Architecture poster (C4). Operator atlas. Configuration reference. 15+ runbooks. CHANGELOG. BREAKING_CHANGES. ADR catalog. API contracts. Data model. This is *extraordinarily* thorough documentation.
- **Tradeoffs:** The documentation volume is itself a usability challenge — finding the right doc requires navigation skill. The NAVIGATOR.md and START_HERE.md help but the depth is intimidating.
- **Improvements:** Add a doc search feature to the operator UI; consider a documentation site generator (Docusaurus/VitePress) for the buyer-facing subset.

### 2.44 Azure Ecosystem Fit
- **Score:** 77 | **Weight:** 1 | **Weighted deficiency:** 23
- **Justification:** Azure-native throughout: Entra ID, Azure SQL, Azure OpenAI, Azure Content Safety, Azure Service Bus, Azure Key Vault, Azure Blob Storage, Azure Container Apps, Azure Front Door, Azure API Management, Application Insights, Azure Monitor. Private endpoints. Managed identity. The product is built for Azure.
- **Tradeoffs:** Azure-native is a strength for Azure customers and a limitation for non-Azure customers.
- **Improvements:** In Trust Center / buyer docs, summarize which **Microsoft Azure capabilities** underpin the hosted service (transparent subprocessors posture) **without implying customers operate** Container Apps/SQL/OpenAI tenancy for ArchLucid.

### 2.45 Cognitive Load
- **Score:** 61 | **Weight:** 1 | **Weighted deficiency:** 39
- **Justification:** The product imposes significant cognitive load: architecture review domain concepts, multi-layer UI, a large configurable surface (much of which is **vendor-hosted** implementation detail surfaced to admins), governance/policy/alert model, and documentation depth. Progressive disclosure helps but the full surface is complex. The naming is occasionally confusing (run vs architecture review, coordinator vs authority, tier vs layer vs rank).
- **Tradeoffs:** Domain complexity is inherent; the product could do more to manage it.
- **Improvements:** Standardize terminology in the UI (architecture review consistently, not mixed with "run"); add a glossary link in the operator shell; reduce the default visible surface further.

### 2.46 Cost-Effectiveness
- **Score:** 64 | **Weight:** 1 | **Weighted deficiency:** 36
- **Justification:** LLM cost estimation (LlmCostEstimator, LlmCostEstimationOptions with USD rates per deployment). Token budget management (daily, monthly). Consumption budgets in Terraform. Per-tenant cost model documentation. Pilot profile with cost projections. Caching to reduce LLM calls. However, actual per-run costs are not publicly documented, the cost model has not been validated against real usage, and there's no in-product cost dashboard showing current spend.
- **Tradeoffs:** Cost management infrastructure is correct; cost *data* requires real usage.
- **Improvements:** Add a per-run cost estimate to the run detail page; publish expected cost ranges in the pricing documentation.

---

## 3. Weighted Readiness Calculation

| Category | Weight Sum | Weighted Score Sum | Max Possible |
|----------|-----------|-------------------|-------------|
| Commercial | 40 | 2,683 | 4,000 |
| Enterprise | 25 | 1,678 | 2,500 |
| Engineering | 47 | 3,473 | 4,700 |
| **Total** | **112** | **7,834** | **11,200** |

**Weighted Readiness: 7,834 / 11,200 = 69.95%**

---

## 4. Top 12 Most Important Weaknesses

Ranked by weighted deficiency × strategic criticality:

1. **No real-world validation of AI output correctness.** The core value proposition — that ArchLucid produces *correct* architecture findings and recommendations — has never been validated against a real enterprise architecture. Simulator mode dominates testing. This is the existential uncertainty.

2. **No production customer exists.** Every commercial, trust, and workflow claim is theoretical. ROI model numbers are benchmarks, not measurements. Procurement materials are untested. The product works in the lab; it has not survived contact with a real buyer.

3. **ITSM connectors are committed but incomplete.** Jira, ServiceNow, and Confluence are in V1 scope but still being built. Without these, the product cannot embed into existing architecture review workflows where tickets are tracked.

4. **Self-serve commercial path is not live.** Trial funnel in TEST mode, Stripe not live, Marketplace not published. Buyers cannot self-evaluate without seller involvement. This is V1.1-deferred (not penalized in score) but is a practical commercial gap.

5. **Hosted SaaS trial and onboarding friction.** Buyers are not asked to provision the platform stack, yet the hosted path from signup to first credible committed review still needs tightening, and commerce is not on live rails in this window — so meaningful self-serve trial remains incomplete until those pieces land.

6. **No user research or usability testing.** 527+ UI components, progressive disclosure, accessibility tests — but no human has validated the UX. Architecture review is a domain where workflow fit matters enormously.

7. **Configuration complexity.** Hundreds of configuration keys, multiple auth modes, multiple SQL topology modes, optional Redis, optional Service Bus, multiple Terraform modules. The operational and admin surface is large relative to the default Pilot path (**scored as configuration / operability load, not as vendor team-size commentary**).

8. **Proof-of-ROI is theoretical.** The ROI model is detailed but entirely hypothetical. No customer has measured hours saved, compliance gaps prevented, or inconsistency incidents avoided.

9. **Documentation volume is itself a UX problem.** 682 markdown files is extraordinary but creates a "where do I start?" problem. The five-doc spine helps but the depth behind it is overwhelming.

10. **Gap between simulator and real-LLM behavior is unquantified.** Golden cohort evidence exists but is thin. The product cannot state with confidence how its outputs differ when using real Azure OpenAI vs the deterministic simulator.

11. **Incomplete executive visibility surfaces.** Executive sponsors need a dashboard showing value delivered over time. The ROI telemetry infrastructure exists but no executive-optimized view is built.

12. **Production support and incident narrative (unvalidated at scale).** Runbooks, correlation IDs, incident communications policy, and staging observability exist, but there is limited **customer-visible** production history of incident handling, published support tiers vs contractual response times, and multi-tenant escalation stories. Buyers may still ask operational due-diligence questions; **that friction is optional `(B)` procurement realism only — not used to deduct `(A)` headline readiness here.**

---

## 5. Top 6 Monetization Blockers

1. **No live commercial path.** Stripe TEST mode and unpublished Marketplace mean no money can flow. (V1.1-deferred — not scored against, but practically blocking revenue.)

2. **No customer has validated the value proposition.** Without at least one customer confirming "this saves us time/money on architecture reviews," the pricing is theoretical.

3. **ITSM connector gap prevents workflow replacement.** Buyers won't pay for a tool that doesn't integrate with their ticket system. Jira/ServiceNow outbound must ship.

4. **No self-service evaluation path on live commercial rails.** On **SaaS**, buyers are not asked to run SQL or Docker; the gap is an end-to-end, low-friction hosted trial (signup → tenant → first review) with commerce and operations ready for scale, not “install the stack.” The trial funnel still needs to be fully production-equivalent where the business requires it.

5. **ROI is unproven.** The ROI model cites $288K+ annual savings for a 200-person org, but no customer has measured this. Pricing must be defensible against "we could just use Confluence and manual reviews."

6. **No reference customer or case study.** Enterprise buyers want peer validation. The reference customer table exists but has no `Published` rows. (V1.1 — not scored against, but a practical blocker for pipeline expansion.)

---

## 6. Top 6 Enterprise Adoption Blockers

1. **No third-party security attestation.** Owner-conducted pen test and SOC 2 self-assessment are correct for the stage, but enterprise security teams may require CPA SOC 2 or independent pen test before procurement can proceed. (Correctly scoped to V2/post-V1.1 — not penalized, but a real friction point.)

2. **Incomplete ITSM integration.** Enterprise architecture teams track findings in Jira or ServiceNow. Without bidirectional sync, findings accumulate in ArchLucid without flowing into existing remediation workflows.

3. **No production SLA.** 99.9% is a target, not a commitment. Enterprise procurement may require a contractual SLA with credit terms before signing.

4. **Enterprise integration and assurance work.** Customers still spend cycles on workforce identity (Entra External ID vs workforce OIDC maps), SCIM, network allowlists if used, SSO questionnaires, DPAs/subprocessors reviews, and (where required) aligning internal ITSM workflows with ArchLucid — even though **ArchLucid’s hosting footprint is vendor-operated**.

5. **AI / LLM addenda and subprocessor scrutiny.** Enterprises often run legal and security reviews on Azure OpenAI (and related Microsoft DPAs), model use, retention, and acceptable-use language. Delays here are procurement friction, **not** a statement about vendor headcount — and **single-vendor or small-team optics are explicitly excluded from `(A)` scoring** per the header policy.

6. **No multi-tenant administrative surface.** Enterprise customers with multiple teams/projects need administrative visibility. While database-per-tenant isolation exists, the admin experience for managing multiple tenants is limited to API calls and configuration.

---

## 7. Top 6 Engineering Risks

1. **Real-LLM output quality is unvalidated at scale.** The agent pipeline works in simulator mode, but real Azure OpenAI responses may contain hallucinations, inconsistencies, or missing findings that the quality gate doesn't catch. The gap between golden cohort evidence and production-scale diverse inputs is the primary technical risk.

2. **Database migration ordering under concurrent deployment.** DbUp runs on startup, which means multiple replicas racing to apply migrations. MigrationCatalogMutexScope exists, but concurrent startup of Container Apps replicas during deployment could create race conditions.

3. **LLM prompt drift.** Agent prompts are not version-controlled in a way that ties prompt changes to output quality changes. A prompt edit that improves topology findings might degrade compliance findings. No regression gate catches this.

4. **Single-catalog escape hatch risk.** `SingleCatalog` SQL topology mode exists for developer ergonomics but could be accidentally deployed to production, eliminating tenant isolation. Production guards exist (`ProductionDangerousMisconfigurationLint`) but the footgun remains.

5. **Key Vault secret rotation during operation.** Configuration references Key Vault secrets, but there is no documented graceful rotation path that avoids brief downtime or stale credentials during the rotation window.

6. **Coordinator-to-authority migration (ADR 0021) is incomplete.** The strangler pattern means both code paths may coexist for some operations. Inconsistencies between coordinator and authority behavior for edge cases could produce subtle bugs.

---

## 8. Most Important Truth

**ArchLucid is a technically impressive product that has never been used by anyone other than its creator.** The engineering is legitimate — the architecture is sound, the test infrastructure is serious, the security posture is thoughtful, and the documentation is world-class for a pre-revenue product. But all of that is necessary and not sufficient. The product's core promise — that it produces *correct, trustworthy* architecture findings — is entirely unvalidated by external use. Until a real customer runs a real architecture review and confirms the output is worth paying for, the product is an extremely well-documented hypothesis.

---

## 9. Top Improvement Opportunities

### Improvement 1: Complete Jira + ServiceNow Outbound Issue Creation End-to-End

**Why it matters:** ITSM integration is the single most important workflow embeddedness gap. Enterprise architects track findings in Jira or ServiceNow. Without this, ArchLucid findings sit in their own system.

**Expected impact:** Directly improves Workflow Embeddedness (+10-15 pts), Interoperability (+5-8 pts), Adoption Friction (+3-5 pts), Monetization readiness. Weighted readiness impact: +0.6-1.0%.

**Affected qualities:** Workflow Embeddedness, Interoperability, Adoption Friction, Time-to-Value, Stickiness

**Status:** Actionable now (code path exists, tests exist, needs completion and staging validation)

**Cursor Prompt:**
```
Complete the Jira and ServiceNow outbound issue creation path to a staging-testable state.

Context:
- ItsmOutboundIssueCreationService.cs exists in ArchLucid.Application/Integrations/Itsm/Outbound/
- Vendor HTTP conformance tests exist in ArchLucid.Application.Tests/Integrations/Itsm/Outbound/
- ItsmOutboundIssuesController.cs exists in ArchLucid.Api/Controllers/Integrations/
- TenantItsmOutboundSettings persistence exists (SQL and in-memory)
- Configuration options exist in IntegrationsItsmOutboundOptions.cs

Tasks:
1. Verify ItsmOutboundIssueCreationService handles both Jira and ServiceNow providers
2. Verify the API endpoint POST /v1/integrations/itsm/outbound/issues returns correct responses for success, auth failure, and provider error cases
3. Verify ItsmFindingCorrelations are persisted on successful creation
4. Verify audit events (Integration.JiraIssueCreateSucceeded, Integration.ServiceNowIncidentCreateSucceeded, and failure variants) are emitted
5. Add an integration test that exercises the full controller → service → HTTP client path with a mock HTTP handler
6. Verify the JiraAdfDescriptionBuilder produces valid Atlassian Document Format
7. Ensure error handling produces Problem+JSON with meaningful detail for: invalid provider, missing configuration, HTTP timeout, auth rejection

Acceptance criteria:
- All existing ITSM tests pass
- New integration test covers controller → audit emission
- Problem+JSON errors include provider name and correlation ID
- No changes to ArchLucid.Core or ArchLucid.Contracts (outbound-only)

Constraints:
- Do not implement inbound webhook sync in this change
- Do not add new NuGet dependencies
- Follow existing test patterns in the Itsm/Outbound test folder
```

### Improvement 2: Expand Golden Cohort Real-LLM Evaluation Evidence

**Why it matters:** The gap between simulator-mode testing and real-LLM production behavior is the largest uncertainty in the product. Expanding golden cohort evidence directly addresses the correctness and trustworthiness gap.

**Expected impact:** Directly improves Correctness (+5-8 pts), AI/Agent Readiness (+3-5 pts), Trustworthiness (+3-5 pts). Weighted readiness impact: +0.5-0.8%.

**Affected qualities:** Correctness, AI/Agent Readiness, Trustworthiness, Proof-of-ROI Readiness

**Status:** DEFERRED

**Reason:** Requires Azure OpenAI credentials and operator access to run real-LLM evaluations. The golden cohort infrastructure exists but execution requires live model access.

**Information needed:** Azure OpenAI endpoint, deployment name, and API key for a model suitable for architecture analysis. Alternatively, confirm whether a shared staging Azure OpenAI deployment is available.

### Improvement 3: Ship Trial Funnel Staging End-to-End Validation

**Why it matters:** The trial funnel is the first touchpoint for self-serve evaluators. Testing it end-to-end in staging validates the critical path from "interested buyer" to "first architecture review." The live E2E spec exists but staging deployment validation is separate from CI.

**Expected impact:** Directly improves Time-to-Value (+3-5 pts), Adoption Friction (+3-5 pts), Commercial Packaging (+2-3 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Time-to-Value, Adoption Friction, Commercial Packaging Readiness, Decision Velocity

**Status:** DEFERRED

**Reason:** Requires access to staging environment (staging.archlucid.net) and Stripe TEST-mode configuration to validate the full funnel. The spec and runbook exist but execution needs hosted infrastructure access.

**Information needed:** Confirmation that staging.archlucid.net is accessible and Stripe TEST-mode keys are configured. Or: provide the Stripe TEST-mode publishable key and the staging API base URL.

### Improvement 4: Add Executive Scorecard Summary Page

**Why it matters:** Executive sponsors need to see value delivered without diving into operator-level detail. A lightweight scorecard using existing data (run count, finding count, estimated hours saved, compliance coverage) directly addresses Executive Value Visibility.

**Expected impact:** Directly improves Executive Value Visibility (+8-10 pts), Proof-of-ROI Readiness (+3-5 pts), Stickiness (+2-3 pts). Weighted readiness impact: +0.4-0.6%.

**Affected qualities:** Executive Value Visibility, Proof-of-ROI Readiness, Stickiness, Marketability

**Status:** Actionable now

**Cursor Prompt:**
```
Create an executive scorecard summary page in the operator UI that displays key value metrics derived from existing data.

Context:
- archlucid-ui/src/app/(executive)/ directory already exists with executive review routes
- ROI telemetry data is available via existing API endpoints (RunRoiTelemetryRow)
- The value-report/roi page exists at archlucid-ui/src/app/(operator)/value-report/roi/page.tsx
- RoiTelemetryCard component exists

Tasks:
1. Create archlucid-ui/src/app/(executive)/scorecard/page.tsx
2. Display four summary cards:
   - Total architecture reviews completed (count of committed runs)
   - Total findings generated (sum of findings across committed runs)
   - Estimated hours saved (from ROI telemetry if available, or formula: runs × average_hours_per_manual_review)
   - Compliance coverage trend (from compliance drift data if available)
3. Add a time-range selector (last 30 days, last quarter, all time)
4. Use existing UI components (card.tsx, CollapsibleSection) for consistent styling
5. Add axe accessibility test for the new page
6. Gate behind ReadAuthority (same as other read surfaces)

Acceptance criteria:
- Page renders with placeholder data when no runs exist (empty state)
- Page renders with real data when runs exist
- Time-range selector filters displayed data
- axe-core test passes
- Vitest snapshot test exists
- No new API endpoints required — use existing run list, ROI telemetry, and compliance drift endpoints

Constraints:
- Do not add new API endpoints
- Do not modify existing components
- Follow the existing (executive) layout pattern
- Use TypeScript strict mode
- Keep the page simple — 4 cards maximum
```

### Improvement 5: Reduce Cognitive Load — Terminology Consistency Pass

**Why it matters:** The product uses "run" (API/database), "architecture review" (buyer language), "review" (UI), and "pilot" (first-time flow) interchangeably. This creates confusion for new users. The explicit hybrid vocabulary decision (2026-05-01) needs to be fully applied.

**Expected impact:** Directly improves Cognitive Load (+5-8 pts), Usability (+3-5 pts), Time-to-Value (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Cognitive Load, Usability, Time-to-Value, Adoption Friction

**Status:** Actionable now (partially — UI copy changes only; API paths unchanged per scope)

**Cursor Prompt:**
```
Apply the explicit hybrid vocabulary decision consistently across operator UI hero headings and primary CTAs.

Context:
- Owner decision (2026-05-01): "architecture review" is the dominant buyer-facing phrase
- API paths, DTO fields, and database entities must NOT be renamed
- "Run ID" should appear in metadata/secondary text, not as the only hero label
- Bridge copy should explain that each architecture review is tracked as one run

Tasks:
1. In archlucid-ui/src/app/(operator)/reviews/ pages:
   - Ensure page titles use "Architecture Review" not "Run"
   - Ensure the new-review wizard CTA says "Start Architecture Review" not "Start Run"
   - Ensure list page heading says "Architecture Reviews" not "Runs"
2. In archlucid-ui/src/components/CorePilotChecklist.tsx:
   - Ensure step labels use "architecture review" language
3. In archlucid-ui/src/components/ShellNav.tsx:
   - Verify nav labels use "Reviews" (not "Runs") for the Pilot tier
4. Add bridge copy to the reviews list page empty state:
   "Each architecture review is tracked as a run in the system. Your Run ID appears in metadata for support and diagnostics."
5. Do NOT rename: URL paths, API calls, TypeScript type names, or anything in src/lib/

Acceptance criteria:
- All hero headings and primary CTAs use "Architecture Review" or "Reviews"
- "Run" / "Run ID" appears only in metadata, secondary text, or technical contexts
- Bridge copy appears in at least the reviews list empty state
- No TypeScript type renames
- No API path changes
- Existing Vitest tests pass (update snapshots if heading text changed)

Constraints:
- Copy changes only — no component restructuring
- Do not touch files outside archlucid-ui/src/app/(operator)/ and archlucid-ui/src/components/
- Do not rename any CSS classes, component names, or exported functions
```

### Improvement 6: Close Top Audit Coverage Gaps

**Why it matters:** The audit trail is a key trust differentiator. Known gaps in AUDIT_COVERAGE_MATRIX reduce the credibility of the audit claim. Closing the top gaps strengthens Auditability, Traceability, and Compliance Readiness.

**Expected impact:** Directly improves Auditability (+3-5 pts), Traceability (+2-3 pts), Compliance Readiness (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Auditability, Traceability, Compliance Readiness, Trustworthiness

**Status:** DEFERRED

**Reason:** Need to read the current AUDIT_COVERAGE_MATRIX.md "Known gaps" section to identify which specific flows lack durable audit. The document states "zero open durable-audit omissions" as of 2026-04-23 for previously listed areas, but new routes and flows may have been added since.

**Information needed:** Confirm whether there are any current known gaps in AUDIT_COVERAGE_MATRIX.md, or point me to the specific flows you want audited.

### Improvement 7: Add In-Product Configuration Summary View

**Why it matters:** The product has hundreds of configuration keys. Operators cannot easily verify their effective configuration without reading appsettings files. A read-only configuration summary reduces operational errors and supports troubleshooting.

**Expected impact:** Directly improves Manageability (+5-8 pts), Supportability (+3-5 pts), Customer Self-Sufficiency (+3-5 pts). Weighted readiness impact: +0.15-0.3%.

**Affected qualities:** Manageability, Supportability, Customer Self-Sufficiency, Cognitive Load

**Status:** Actionable now (ConfigurationEffectiveValueResolver and ConfigSummaryDtos already exist in Core)

**Cursor Prompt:**
```
Expose the existing configuration summary infrastructure as a read-only admin page in the operator UI.

Context:
- ConfigurationEffectiveValueResolver exists in ArchLucid.Core/Configuration/Summary/
- ConfigSummaryDtos exists in the same location
- ConfigurationKeyCatalog provides the typed registry of all configuration keys
- AdminAuthority policy gates admin-only surfaces

Tasks:
1. If not already present, add a GET /v1/admin/configuration/summary endpoint in the admin controller area
   - Gate with AdminAuthority policy
   - Return ConfigSummaryDtos data from ConfigurationEffectiveValueResolver
   - Redact any key whose catalog entry indicates it is secret (mask with "***")
   - Include the key name, effective value (or masked), source (appsettings, env, Key Vault), and catalog description
2. Create archlucid-ui/src/app/(operator)/admin/configuration/page.tsx
   - Display configuration keys in a searchable, filterable table
   - Group by catalog category if available
   - Show masked values for secrets
   - Gate behind AdminAuthority in the nav config
3. Add axe accessibility test

Acceptance criteria:
- Secret values are never exposed in the API response or UI
- AdminAuthority is enforced (non-admin gets 403)
- Search filters by key name
- Page works in empty/error states
- Existing tests pass

Constraints:
- Read-only — no configuration mutation from the UI
- Do not modify ConfigurationKeyCatalog or ConfigurationEffectiveValueResolver
- Do not expose connection strings, API keys, or Key Vault URIs
- Follow existing admin page patterns (e.g., admin/health)
```

### Improvement 8: DEFERRED — Hosted SaaS trial funnel and tenant lifecycle

**Title:** DEFERRED — Lock hosted SaaS trial experience (signup → tenant → first value) and operational policies

**Reason:** On SaaS, buyers never provision ArchLucid infrastructure; the open work is **vendor-side** host configuration and product policy: which environment hosts trials, Stripe mode, DNS/Front Door, tenant isolation, trial duration, and data lifecycle. Those are owner decisions, not “buyer avoids infra.”

**Information needed:** Should trial evaluators use the existing staging.archlucid.net, or should there be a separate trial-only deployment? What is the desired trial tenant lifecycle (duration, auto-expire, data purge)?

### Improvement 9: Add Per-Run Cost Estimate to Run Detail

**Why it matters:** Cost transparency directly addresses Cost-Effectiveness and builds trust. Showing estimated LLM cost per run helps buyers understand unit economics.

**Expected impact:** Directly improves Cost-Effectiveness (+5-8 pts), Executive Value Visibility (+2-3 pts). Weighted readiness impact: +0.1-0.2%.

**Affected qualities:** Cost-Effectiveness, Executive Value Visibility, Trustworthiness

**Status:** Actionable now (LlmCostEstimator exists)

**Cursor Prompt:**
```
Surface the per-run LLM cost estimate in the run detail view.

Context:
- LlmCostEstimator exists in ArchLucid.AgentRuntime/LlmCostEstimator.cs
- LlmCostEstimationOptions with USD rates exists in ArchLucid.Core/Configuration/
- AgentExecutionTraces contain token usage data
- Run detail page exists at archlucid-ui/src/app/(operator)/reviews/[runId]/

Tasks:
1. If not already present, add an endpoint or extend the run detail response to include estimated LLM cost
   - Sum token usage from AgentExecutionTraces for the run
   - Apply rates from LlmCostEstimationOptions
   - Return as { estimatedCostUsd: number, tokenCounts: { prompt: number, completion: number }, model: string }
2. In the run detail UI, add a small "Estimated cost" badge or card showing:
   - Total estimated USD cost
   - Token breakdown (prompt / completion)
   - Model used
3. Show "Cost estimate unavailable" when no trace data exists (simulator mode without real tokens)

Acceptance criteria:
- Cost displays correctly for runs with agent execution traces
- Cost shows "unavailable" gracefully for simulator-only runs
- USD formatting is locale-aware
- No new configuration keys required
- Existing tests pass

Constraints:
- Use existing LlmCostEstimator — do not create a new cost calculation
- Do not modify LlmCostEstimationOptions
- This is a read-only display — no cost limits or gates
```

### Improvement 10: DEFERRED — Usability Testing with Enterprise Architects

**Title:** DEFERRED — Conduct usability testing with 3-5 enterprise architects

**Reason:** Requires recruiting external participants, preparing test scenarios, and conducting sessions. Cannot be done by AI agents.

**Information needed:** Do you have access to enterprise architects willing to participate in a 30-minute usability session? If so, I can prepare a test script, task list, and observation template.

---

## 10. Pending Questions for Later

### Improvement 2 (Golden Cohort)
- Is a shared Azure OpenAI staging deployment available for golden cohort evaluation?
- What architecture brief diversity is most important to test? (Cloud migration, greenfield, compliance-heavy, cost optimization?)

### Improvement 3 (Trial Funnel)
- Is staging.archlucid.net currently accessible and configured with Stripe TEST keys?
- What is the desired trial tenant duration before auto-expiration?

### Improvement 6 (Audit Gaps)
- Are there any current known gaps in the audit coverage matrix beyond what was documented as of 2026-04-23?
- Are there new flows added since the last audit matrix review that need coverage?

### Improvement 8 (Hosted Trial)
- Should trial evaluators share a staging environment or get isolated per-tenant provisioning?
- What Azure region should the trial environment target?

### Improvement 10 (Usability Testing)
- Do you have access to enterprise architects outside your organization for testing?
- Would remote sessions (video call + screen share) be acceptable?

### General
- What is the expected timeline for first customer engagement? This affects prioritization of ITSM connectors vs trial funnel vs executive surfaces.
- Is there a target for the first paid pilot, and does it have specific integration requirements (e.g., "must integrate with Jira")?

---

## Deferred Scope Uncertainty

All deferred items referenced in this assessment (MCP/V1.1, SOC 2 CPA/post-V1.1, third-party pen test/V2, commerce un-hold/V1.1, design partner/V1.1, PGP key/V1.1, Redis elevation/V2, Container Apps Jobs + DTF/V2) were located in `V1_SCOPE.md` §3, `V1_DEFERRED.md` §6a-6g, and `TRUST_CENTER.md`. No deferred items were scored against in (A) headline readiness. No scope uncertainty exists for the items referenced.

---

**(B) Procurement / market-motion realism (informational, not weighted into headline score):**

Enterprise procurement teams at $500K+ ACV will likely require: (1) CPA SOC 2 Type II — the self-assessment and roadmap are credible but the absence of an independent report will be flagged in ~60% of enterprise RFPs; (2) independent pen test summary — owner-conducted is honest but procurement teams often require a third-party attestor; (3) reference customer or case study — enterprise buyers want peer evidence before committing; (4) contractual SLA with credits — the 99.9% target needs a signed commitment. These are correctly scoped to V1.1/V2/post-V1.1 and do not affect the (A) headline score, but they represent real friction in enterprise pipeline conversion. The procurement pack, CAIQ, SIG, and DPA are excellent preparation — better than most pre-revenue products — and will handle initial procurement cycles well. The SOC 2 trigger ($250K ARR) is pragmatic. **Single-vendor concentration or “small vendor” optics are buyer psychology in some RFPs; they are explicitly not used to reduce `(A)` in this assessment** — cite only under `(B)` if the reader wants GTM realism, with zero weight on the headline composite.
