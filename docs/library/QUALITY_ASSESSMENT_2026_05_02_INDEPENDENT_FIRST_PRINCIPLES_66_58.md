> **Scope:** Independent first-principles quality assessment of ArchLucid — weighted readiness model across 46 qualities in commercial, enterprise, and engineering dimensions. Not a prior-session continuation.

# ArchLucid Assessment — Weighted Readiness 66.58%

**Date:** 2026-05-02
**Method:** Independent first-principles assessment from codebase, documentation, infrastructure, and UI source materials.
**Total weight:** 100 across 46 qualities.

---

## 1. Executive Summary

### Overall Readiness

ArchLucid scores **66.58%** weighted readiness. The product has genuinely strong engineering foundations — well-modularized C# backend, deep audit/traceability infrastructure, extensive CI pipeline with tiered testing, and thorough documentation. However, the commercial envelope around these engineering assets remains dangerously thin. The product has zero paying customers, zero reference logos, no third-party security attestation, and limited evidence that the workflow actually embeds into how enterprise architecture teams work day-to-day. The gap between "technically impressive" and "commercially viable" is the defining risk.

### Commercial Picture

The commercial layer is the weakest dimension. Adoption friction is high — despite a Docker demo quickstart, the actual value proposition requires enterprise architects to fundamentally change how they work, and the product does not yet prove that architects will do so. There are no real reference customers, no published case studies, no marketplace transaction history, and no proven conversion funnel from trial to paid. Pricing exists on paper but has never been validated by a buyer. The ROI model is well-constructed but entirely theoretical. Marketability is constrained by the absence of any external proof points.

### Enterprise Picture

Enterprise infrastructure is more mature than commercial execution. Traceability (82) and auditability (83) are genuine strengths — append-only SQL audit with 78+ typed events, governance segregation of duties, and provenance chains. Procurement readiness (68) is above average for a pre-revenue startup: DPA template, CAIQ/SIG pre-fills, trust center with CI-validated freshness. The gap is in workflow embeddedness (48) — ArchLucid describes an architecture review workflow but has no evidence that any real team has adopted it as their standard operating procedure.

### Engineering Picture

Engineering is the strongest dimension. The codebase demonstrates genuine architectural discipline: 49 projects with clean separation of concerns, Dapper over EF for explicit SQL control, primary constructors, pattern matching, LINQ pipelines, and well-structured DI. CI is comprehensive — secret scanning, OWASP ZAP, Schemathesis fuzzing, Trivy image/config scanning, tiered .NET tests, Vitest, Playwright, k6 load tests, property-based testing with FsCheck, and OpenAPI contract snapshots. The main engineering risks are in data consistency (the `ComparisonRecords` FK gap documented in TB-006), the absence of third-party penetration testing, and the fact that the agent/LLM execution path is primarily tested through simulators rather than real model outputs.

---

## 2. Weighted Quality Assessment

Qualities ordered from most urgent (highest weighted deficiency) to least urgent.

### Adoption Friction — Score: 55 | Weight: 6 | Weighted Impact: 3.30 | Deficiency: 2.70

**Justification:** The product requires enterprise architects to learn a new conceptual vocabulary (runs, golden manifests, finding engines, authority pipeline), adopt a multi-step workflow (request → execute → commit → export), and integrate with existing practices through webhook recipes rather than native connectors. The seven-step new-run wizard is a lot of surface for a first impression. No Jira, ServiceNow, or Confluence connectors exist in V1 — all deferred to V1.1. The only integration today is CloudEvents webhooks and REST API, requiring customer-side development.

**Tradeoffs:** Deferring native ITSM connectors keeps V1 scope manageable but forces early adopters to build bridges. The vocabulary overhead reflects genuine domain complexity but creates learning-curve risk.

**Recommendations:** Build a "zero-config first run" path that auto-executes a sample architecture review on signup without requiring wizard completion. Prioritize the ServiceNow connector (V1.1) as the single highest-impact integration for enterprise adoption. Consider renaming user-facing concepts to align with existing architecture review vocabulary.

---

### Marketability — Score: 62 | Weight: 8 | Weighted Impact: 4.96 | Deficiency: 3.04

**Justification:** The product has a clear value proposition (AI-assisted architecture review with governance), good documentation, and thoughtful buyer persona work. The trust center and procurement pack are above-average for a pre-revenue product. However: zero published reference customers, zero marketplace transaction history, no third-party security attestation, no published case studies with real customer names, no logo wall. The marketing site exists but points to a product with no proven adoption. The "See It" and demo preview pages exist but are simulator-driven, not showcasing real customer outcomes.

**Tradeoffs:** Building the product deeply before going to market means the demo is more convincing when it works, but the absence of social proof is a hard ceiling on marketability.

**Recommendations:** Close a design-partner pilot immediately — even one named reference customer transforms the entire commercial narrative. Build a "before/after" artifact that shows an architecture review done manually vs. with ArchLucid using the same inputs. Publish the Contoso synthetic case study as an explicitly-labeled "product walkthrough" rather than waiting for a real reference.

---

### Time-to-Value — Score: 68 | Weight: 7 | Weighted Impact: 4.76 | Deficiency: 2.24

**Justification:** The Docker demo quickstart works in one command. The `archlucid try` CLI command exists. The first-run wizard pre-loads sample presets. But time-to-*real* value — using the product on the buyer's own architecture — requires understanding the input format, configuring scope headers, and completing a multi-step pipeline. The 48-hour champion kit exists but has never been validated with an external user. Real-mode E2E benchmark shows the pipeline works, but the "aha moment" comes after commit + artifact review, which is multiple steps deep.

**Tradeoffs:** The demo path is polished, but there's a cliff between "see it work on demo data" and "see it work on my data." This is the critical conversion gap.

**Recommendations:** Create a "bring your own brief" wizard step that accepts a plain-English architecture description and auto-maps it to the structured input format. Reduce the number of required wizard steps for the first run. Add a "what you'll get" preview before pipeline execution starts.

---

### Workflow Embeddedness — Score: 48 | Weight: 3 | Weighted Impact: 1.44 | Deficiency: 1.56

**Justification:** ArchLucid defines a complete architecture review workflow (request → execute → commit → export → governance), but there is no evidence that any real architecture team has adopted this workflow. The product does not plug into existing architecture review processes — it replaces them. No native Jira/ServiceNow/Confluence integration means findings don't flow into existing ticketing. No ArchiMate/Structurizr import means architects can't start from their existing models. The governance approval workflow exists but competes with whatever approval process teams already use.

**Tradeoffs:** Building a complete replacement workflow gives ArchLucid more control over the experience but creates a "rip and replace" adoption barrier that enterprises resist.

**Recommendations:** Build lightweight "output-only" integration points — a one-click "export findings to CSV" that maps directly to Jira bulk import format. Create a "shadow mode" where ArchLucid reviews an architecture in parallel with the existing process, producing a comparison artifact rather than demanding workflow replacement.

---

### Proof-of-ROI Readiness — Score: 58 | Weight: 5 | Weighted Impact: 2.90 | Deficiency: 2.10

**Justification:** The ROI model document is well-structured — it quantifies manual review cost, remediation cost, and inconsistency cost with reasonable industry benchmarks. Pricing philosophy explicitly anchors to value-based pricing. The tenant-level value report and measured ROI controller exist in the API. But every number is theoretical. No customer has validated the "40-hour manual review → 2-hour ArchLucid review" claim. The baseline review-cycle capture on trial signup is a good design but unvalidated. There's no "before/after" comparison from a real customer deployment.

**Tradeoffs:** The ROI model is defensible on paper but lacks the single most important input: a real customer saying "we saved X hours."

**Recommendations:** Instrument the product to capture actual time-to-committed-manifest and compare to the baseline hours captured at signup. Build an auto-generated "pilot ROI summary" that the champion can forward to their sponsor with real data from their pilot. This is the highest-leverage monetization enablement work.

---

### Trustworthiness — Score: 64 | Weight: 3 | Weighted Impact: 1.92 | Deficiency: 1.08

**Justification:** The system provides structured explainability traces, provenance graphs, and citation-bound rendering. Findings include evidence references and confidence scores. The faithfulness checker compares LLM narrative against finding traces. But: the agent outputs are primarily validated through simulator mode (deterministic fake responses), not real LLM completions. The agent output quality gate exists but defaults to off. There's no published evaluation of finding accuracy against human expert review. An enterprise buyer must trust that the 10 finding engines produce correct, actionable findings — and there's no external validation of that claim.

**Tradeoffs:** Simulator-first testing gives deterministic CI but doesn't validate real model output quality. The quality gate infrastructure exists but needs real-world calibration data.

**Recommendations:** Run a blind evaluation: have 2-3 architects review the same architecture, then compare ArchLucid's findings against the human findings. Publish the results (even if imperfect) as a technical paper or blog post. Enable the agent output quality gate by default and publish the threshold calibration methodology.

---

### Interoperability — Score: 45 | Weight: 2 | Weighted Impact: 0.90 | Deficiency: 1.10

**Justification:** V1 interoperability is REST API + CloudEvents webhooks + optional Service Bus. No native connectors for Jira, ServiceNow, Confluence, Structurizr, ArchiMate, or Terraform state import. SCIM provisioning is implemented, which is a bright spot. The ADO integration exists in `ArchLucid.Integrations.AzureDevOps` but is a Logic Apps recipe, not a first-party connector. The AsyncAPI contract exists for event consumers. But for a product targeting enterprise architecture teams who live in Jira, Confluence, and modeling tools, the integration surface is thin.

**Tradeoffs:** Keeping V1 integration-light reduces engineering burden but forces early adopters to build bridges. The V1.1 ITSM commitment (ServiceNow first, then Jira/Confluence) is the right priority order.

**Recommendations:** Ship the ServiceNow first-party connector as the V1.1 gate item. Build a Structurizr DSL import connector — enterprise architects who use modeling tools are the primary buyer persona, and "import your existing model" is a powerful adoption accelerant.

---

### Decision Velocity — Score: 52 | Weight: 2 | Weighted Impact: 1.04 | Deficiency: 0.96

**Justification:** The product supports the architecture review decision itself well (findings → governance gate → commit), but the *purchase* decision velocity for the buyer is slow. There's no self-serve checkout that actually provisions a paid tenant. Stripe integration exists as code but the checkout flow requires configuration. Azure Marketplace SaaS offer is documented as a checklist but not transactable. The pricing page exists with a quote-request form that writes to SQL, but the actual conversion path from trial to paid requires manual sales intervention. No published customer has ever completed this path.

**Tradeoffs:** Building checkout infrastructure before having customers risks wasted work; but the absence of self-serve conversion means every sale requires founder effort.

**Recommendations:** Complete the Stripe checkout → paid tenant conversion path end-to-end. Verify it works with a test purchase. This is the gate between "interesting demo" and "revenue."

---

### Usability — Score: 61 | Weight: 3 | Weighted Impact: 1.83 | Deficiency: 1.17

**Justification:** The operator UI is built with Next.js 15, React 19, Radix UI, and Tailwind — modern stack with good accessibility foundations (WCAG 2.1 AA target, axe-core gating, skip-to-content, ARIA landmarks). The shell has a clear layout with sidebar navigation, run list, run detail, and finding inspect views. But the UI surface is very broad (170+ page components, multiple route groups for operator/marketing/executive), and there's no evidence of user testing with actual architects. The seven-step wizard for new runs is complex. The sidebar has "Show more links" and "Show advanced" progressive disclosure, which suggests even the team recognizes the surface is large. The product-learning feedback controls are being added (in the current diff) but are new and untested.

**Tradeoffs:** The broad UI surface means features are *available* but the cognitive cost of navigating them is high. Progressive disclosure helps but adds indirection.

**Recommendations:** Run 3-5 usability sessions with target-persona architects. Identify the top 3 confusion points and address them before pilot. Reduce the new-run wizard to 3-4 steps for the common case.

---

### Correctness — Score: 74 | Weight: 4 | Weighted Impact: 2.96 | Deficiency: 1.04

**Justification:** Strong test infrastructure: tiered CI with fast core, full regression, SQL integration, greenfield boot, property-based tests (FsCheck), OpenAPI contract snapshots, and golden corpus evaluation tests. The data consistency orphan probe actively detects FK violations. The authority pipeline produces findings through 10 typed engines with structured schemas. But: correctness of agent *outputs* (the most important thing the product produces) is validated primarily through simulator stubs, not real LLM responses. The `GoldenAgentResultJsonEvaluationTests` exist but test structural completeness, not semantic accuracy. The quality gate infrastructure counts expected JSON keys, not whether findings are *correct*.

**Tradeoffs:** Simulator-first testing enables deterministic CI but creates a correctness validation gap at the most critical layer — the AI-generated findings that buyers pay for.

**Recommendations:** Build a golden-cohort evaluation suite that runs against real (cached) LLM responses and compares finding outputs against expert-annotated reference answers. This is the single most important correctness investment.

---

### Commercial Packaging Readiness — Score: 64 | Weight: 2 | Weighted Impact: 1.28 | Deficiency: 0.72

**Justification:** Three tiers defined (Team/Professional/Enterprise) with clear feature gates, seat pricing, and run allowances. Tier enforcement exists in code (`CommercialTenantTierFilter`). Billing provider abstraction supports Stripe and Azure Marketplace. But: no tier has ever been sold. The discount stack (reference, design-partner, early-adopter) is defined but untested. Azure Marketplace offer is a checklist, not a live listing. The free trial exists as infrastructure but the conversion funnel is theoretical.

**Tradeoffs:** Detailed packaging design before first sale means the commercial model is ready to execute, but it's entirely hypothetical until a customer validates willingness to pay at these price points.

**Recommendations:** Validate the Team tier price point ($436/mo for 3 seats) against 5 target-persona prospects via lightweight price testing before investing more in packaging infrastructure.

---

### Compliance Readiness — Score: 63 | Weight: 2 | Weighted Impact: 1.26 | Deficiency: 0.74

**Justification:** SOC 2 self-assessment narrative exists with CC mapping. CAIQ Lite and SIG Core pre-fills are maintained. Trust center has CI-validated freshness. But: no SOC 2 Type II attestation (explicitly stated as not issued). No third-party penetration test (V2-deferred). Owner-conducted pen testing is in progress but is not the same as a third-party assessment. For enterprise buyers, the absence of SOC 2 Type II is a procurement blocker that the self-assessment and pre-fills mitigate but don't eliminate.

**Tradeoffs:** Self-assessment with honest labeling ("not a CPA audit opinion") is the right V1 posture. SOC 2 Type II before revenue is expensive and premature. The trust center explicitly calls out what is and isn't attested.

**Recommendations:** V1 posture is appropriate — do not inflate. Focus on completing the owner-conducted pen test and publishing results. Budget for SOC 2 readiness assessment (not full Type II) when first paying customer is signed.

---

### Executive Value Visibility — Score: 65 | Weight: 4 | Weighted Impact: 2.60 | Deficiency: 1.40

**Justification:** Executive sponsor brief exists. Pilot board pack controller exists. Value report API exists. Executive digest email subscription exists. The ROI model provides a framework for executive justification. But: the executive surfaces are populated with theoretical or demo data. No executive at a customer organization has ever seen these artifacts with their own data. The aggregate ROI bulletin is synthetic. The first-value report PDF generation exists but hasn't been validated in a real sponsor conversation.

**Tradeoffs:** The infrastructure for executive communication exists; it needs a real customer to validate that executives find it compelling.

**Recommendations:** Test the executive sponsor brief and first-value report with 2-3 actual CTO/VP Engineering personas. Validate whether the artifact format, density, and framing match how they actually make buy decisions.

---

### Customer Self-Sufficiency — Score: 52 | Weight: 1 | Weighted Impact: 0.52 | Deficiency: 0.48

**Justification:** Documentation is extensive but internally-focused. The help docs controller serves in-app help. The troubleshooting guide exists. The CLI has `doctor` and `support-bundle` commands. But: there's no in-product guided onboarding beyond the first-run wizard. No interactive tutorials, no contextual help tooltips, no "what's this?" affordances on complex UI elements. The product assumes the user understands architecture review concepts.

**Tradeoffs:** Documentation depth over interactive guidance is a reasonable V1 choice for a product targeting experienced architects.

**Recommendations:** Add contextual help tooltips to the 5 most complex UI surfaces (wizard steps, finding detail, governance workflow, comparison view, alert configuration).

---

### Cognitive Load — Score: 56 | Weight: 1 | Weighted Impact: 0.56 | Deficiency: 0.44

**Justification:** The product vocabulary is large: runs, golden manifests, finding engines, authority pipeline, coordinator pipeline, context snapshots, graph snapshots, findings snapshots, evidence bundles, decision traces, comparison replay, governance resolution, policy packs, advisory schedules, recommendation learning, product learning. The sidebar navigation has progressive disclosure but still exposes many top-level concepts. The CONCEPTS.md document itself has 6 vocabulary rules, which suggests internal recognition that terminology is confusing.

**Tradeoffs:** Domain complexity is real — architecture governance genuinely involves many concepts. But the product adds its own vocabulary on top of existing domain vocabulary.

**Recommendations:** Create a "simplified operator view" that hides advanced features (governance, advisory, learning, alerts) until the user explicitly opts in. Rename user-facing concepts to use plain English: "review" instead of "run," "report" instead of "golden manifest."

---

### Differentiability — Score: 72 | Weight: 4 | Weighted Impact: 2.88 | Deficiency: 1.12

**Justification:** The product has genuine differentiation: structured multi-agent architecture review with typed finding engines, governance workflows, golden manifests, and provenance chains. The combination of AI-assisted analysis + governance + audit trail is genuinely novel in the architecture tooling space. The 10 finding engines (topology, cost, compliance, etc.) running in parallel produce structured outputs that manual review can't match at scale. But: the differentiation is hard to communicate in a sentence. "AI-assisted architecture review" sounds like every AI-wrapper startup. The structured governance and audit trail story is the real differentiator but requires education.

**Tradeoffs:** Deep differentiation requires explanation; shallow differentiation is easier to communicate but less defensible.

**Recommendations:** Lead messaging with the audit/governance story ("every architecture decision traceable, every review reproducible") rather than the AI story ("AI reviews your architecture"). The audit trail is the unique value; the AI is the mechanism.

---

### Procurement Readiness — Score: 68 | Weight: 2 | Weighted Impact: 1.36 | Deficiency: 0.64

**Justification:** Above-average for pre-revenue: DPA template, subprocessors register, CAIQ Lite and SIG Core pre-fills, trust center with CI freshness checks, procurement response accelerator with 50 SIG-style questions mapped to evidence, evidence pack ZIP download from API. The procurement fast-lane document exists. But: no SOC 2 Type II, no third-party pen test, no insurance certificate, no reference customer for procurement to call. The procurement objection playbook exists, which shows awareness of the gap.

**Tradeoffs:** The procurement documentation is better than most pre-revenue startups produce. The honest labeling ("self-asserted, not attestation") builds trust. The gaps are real but acknowledged.

**Recommendations:** Maintain current honesty posture. Add an insurance certificate placeholder and document the path to obtaining E&O/cyber insurance. This is a frequently-requested procurement artifact.

---

### Stickiness — Score: 60 | Weight: 1 | Weighted Impact: 0.60 | Deficiency: 0.40

**Justification:** Data lock-in exists — golden manifests, comparison history, audit trail, and governance decisions accumulate value over time. The product learning feedback loop captures pilot signals. The recommendation learning controller exists. But: stickiness requires actual usage over time, and no customer has used the product long enough to accumulate switching costs. The export capabilities (Markdown, DOCX, ZIP, JSON) are good for data portability but also mean data can leave easily.

**Tradeoffs:** Good export capabilities reduce lock-in but increase trust. For a pre-revenue product, trust > lock-in.

**Recommendations:** Build a "pilot health score" that shows the champion how much institutional knowledge has accumulated in ArchLucid over the pilot period, creating visible switching costs.

---

### Template and Accelerator Richness — Score: 56 | Weight: 1 | Weighted Impact: 0.56 | Deficiency: 0.44

**Justification:** The `dotnet new archlucid-finding-engine` template exists for extending finding engines. The sample preset for the wizard exists. The Contoso Retail demo data provides a walkthrough scenario. But: there are limited pre-built architecture review templates for common scenarios (cloud migration, microservices, security review, compliance audit). The product asks users to describe their architecture from scratch rather than starting from a template.

**Tradeoffs:** Templates risk being too generic to be useful. But "start from a template" dramatically reduces time-to-value for common scenarios.

**Recommendations:** Create 3-5 architecture review templates for the most common enterprise scenarios: cloud migration assessment, microservices architecture review, security posture review, compliance gap analysis, and cost optimization review. Each template should pre-populate the wizard with relevant context and pre-select appropriate finding engines.

---

### Traceability — Score: 82 | Weight: 3 | Weighted Impact: 2.46 | Deficiency: 0.54

**Justification:** Genuine strength. 78+ typed audit events in append-only SQL. Decision traces link findings to rules and evidence. Provenance graph connects evidence bundles to agent outputs to manifest entries. Every finding has an `ExplainabilityTrace` with 5 fields. Run-level W3C `OtelTraceId` enables cross-system correlation. The audit coverage matrix documents every mutating path and its durable audit status. Governance approval requests store `RequestedByActorKey` and `ReviewedByActorKey` for segregation enforcement.

**Tradeoffs:** The traceability infrastructure is more mature than typical for a pre-revenue product. This is a genuine competitive advantage for enterprise buyers.

**Recommendations:** Maintain and extend. Consider adding a "trace explorer" UI that lets auditors follow the full chain from finding → evidence → agent output → decision trace → manifest entry in a single view.

---

### Auditability — Score: 83 | Weight: 2 | Weighted Impact: 1.66 | Deficiency: 0.34

**Justification:** The strongest quality. Append-only durable audit with `IAuditService`, governance dual-writes, baseline mutation audit service, data consistency orphan probes, and CI-validated audit coverage matrix. The async audit write paths are hardened to best-effort (TB-001 completed). The audit search supports keyset pagination. CSV/JSON export exists for Enterprise tier. The approach is mature and deliberately designed.

**Tradeoffs:** Deep auditability adds storage and performance cost. The append-only design means audit data grows indefinitely — retention policy exists but configurable.

**Recommendations:** No urgent changes needed. Consider building an "audit attestation report" artifact that summarizes audit completeness for a time period, suitable for SOC 2 evidence collection.

---

### Architectural Integrity — Score: 79 | Weight: 3 | Weighted Impact: 2.37 | Deficiency: 0.63

**Justification:** Clean project structure: 49 `.csproj` files with clear separation (Api, Application, Core, Contracts, Persistence, AgentRuntime, Decisioning, KnowledgeGraph, ContextIngestion, ArtifactSynthesis, etc.). Dual-pipeline architecture (coordinator/authority) is documented in ADRs. DI composition is centralized in `Host.Composition`. Dapper for data access with explicit SQL. Primary constructors. The architecture tests project exists for cross-cutting invariants. ADR process is maintained with 30+ decisions.

**Tradeoffs:** The dual-pipeline architecture adds complexity but provides clear separation between legacy coordinator and new authority paths. The migration from coordinator to authority is well-documented.

**Recommendations:** Complete the `ComparisonRecords` FK migration (TB-006) to eliminate the last known referential integrity gap.

---

### Testability — Score: 80 | Weight: 1 | Weighted Impact: 0.80 | Deficiency: 0.20

**Justification:** Comprehensive: tiered CI (Tier 0 through 3b), fast core suite, full regression, SQL integration with containers, greenfield boot tests, property-based testing (FsCheck), OpenAPI contract snapshot assertions, k6 load tests, Schemathesis API fuzzing, OWASP ZAP scanning, Playwright e2e, Vitest unit tests, axe accessibility tests. Code coverage reports are generated per test job. The test support project provides shared test infrastructure.

**Tradeoffs:** The breadth of testing is excellent. The gap is in semantic validation of LLM outputs, which is inherently harder to test deterministically.

**Recommendations:** Add a golden-cohort evaluation test that validates real (cached) LLM outputs against expert-annotated reference answers.

---

### Security — Score: 72 | Weight: 3 | Weighted Impact: 2.16 | Deficiency: 0.84

**Justification:** Multi-layered: OWASP ZAP baseline (merge-blocking), Schemathesis fuzzing, gitleaks secret scanning, Trivy image and config scanning, RLS with `SESSION_CONTEXT`, fail-closed auth defaults, production guard against `DevelopmentBypass`, rate limiting, CORS configuration, security headers, STRIDE threat model, LLM prompt redaction. The auth model supports JWT (Entra), API keys, and trial auth with proper role mapping. But: no third-party pen test (V2-deferred), owner-conducted pen test in progress, no WAF documented (though Azure Front Door is in Terraform), and the prompt redaction is deny-list based rather than allow-list.

**Tradeoffs:** The security posture is solid for self-hosted pre-revenue. The honest acknowledgment of no third-party pen test is appropriate. The biggest gap is the V2 deferral of third-party testing.

**Recommendations:** Complete the owner-conducted pen test. Document the Azure Front Door WAF rules in use. Consider adding an allow-list approach to LLM prompt content in addition to the deny-list.

---

### Modularity — Score: 81 | Weight: 1 | Weighted Impact: 0.81 | Deficiency: 0.19

**Justification:** Excellent. 49 projects with clean boundaries. Finding engines are pluggable via DI. `dotnet new archlucid-finding-engine` template. Persistence is split across 6 projects (core, coordination, runtime, integration, alerts, advisory). Billing provider abstraction supports Stripe and Azure Marketplace. Auth mode is configurable. Storage provider supports InMemory and SQL. Hosting role supports API, Worker, and Combined modes.

**Tradeoffs:** High modularity adds project count and cross-project dependency management overhead, but the boundaries are well-chosen.

**Recommendations:** No changes needed. This is a genuine strength.

---

### Documentation — Score: 82 | Weight: 1 | Weighted Impact: 0.82 | Deficiency: 0.18

**Justification:** Exceptionally thorough. 600+ markdown files (some excessive, but comprehensive). Doc scope headers enforced by CI. Navigator with time estimates. Concept vocabulary with CI enforcement. Five-document onboarding spine. ADR process with 30+ decisions. Runbooks for operational procedures. The documentation is more extensive than most production enterprise products.

**Tradeoffs:** Documentation volume may itself be a cognitive load issue — there's so much documentation that finding the right document requires navigation skills. The 32-file docs root budget is a good constraint.

**Recommendations:** No urgent changes. Consider building a documentation search feature in the operator UI to surface relevant docs contextually.

---

### Observability — Score: 78 | Weight: 1 | Weighted Impact: 0.78 | Deficiency: 0.22

**Justification:** Rich instrumentation: OTel meters with ~30 named instruments, pipeline stage duration histograms, agent output quality metrics, circuit breaker counters, LLM token usage, data consistency probes, startup config warning counters. Multiple export paths (Application Insights, OTLP, Prometheus, Console). Grafana dashboard committed as JSON. Correlation IDs flow through requests. `OtelTraceId` persisted on runs for post-hoc lookup.

**Tradeoffs:** The observability infrastructure is mature for a pre-revenue product. The gap is that no production environment has been monitored yet, so alert thresholds are theoretical.

**Recommendations:** Deploy to staging and validate alert thresholds against realistic traffic patterns before production launch.

---

### Maintainability — Score: 77 | Weight: 2 | Weighted Impact: 1.54 | Deficiency: 0.46

**Justification:** Clean code style enforced by `.editorconfig`, Roslyn analyzers, and house style rules. Primary constructors, pattern matching, expression-bodied members, and LINQ pipelines used consistently. Each class in its own file. The formatting scripts exist. The tech backlog is maintained with clear priorities. Breaking changes are tracked.

**Tradeoffs:** The large number of cursor rules (20+) and house style constraints create onboarding overhead for new contributors, but they ensure consistency.

**Recommendations:** No urgent changes. The codebase is well-maintained.

---

### Policy and Governance Alignment — Score: 76 | Weight: 2 | Weighted Impact: 1.52 | Deficiency: 0.48

**Justification:** Governance workflow with approval requests, segregation of duties, pre-commit gate, policy packs with versioned content documents, effective governance resolution with scope precedence (project → workspace → tenant). Dry-run mode for validation without side effects. Governance preview for manifest diff questions. The governance model is well-designed and implemented.

**Tradeoffs:** The governance model is more mature than most buyers will need for V1 pilots. This is future-proofing that adds complexity but positions well for enterprise adoption.

**Recommendations:** No urgent changes. Document the minimum governance configuration for a pilot to reduce adoption friction.

---

### Extensibility — Score: 76 | Weight: 1 | Weighted Impact: 0.76 | Deficiency: 0.24

**Justification:** Finding engines are pluggable via DI + template. Webhook/CloudEvents for outbound integration. AsyncAPI contract. Policy packs are configurable. Auth modes are extensible. Billing provider abstraction. The architecture supports extension without core modification.

**Tradeoffs:** Extensibility infrastructure is ready but untested by third-party developers.

**Recommendations:** No urgent changes.

---

### Explainability — Score: 73 | Weight: 2 | Weighted Impact: 1.46 | Deficiency: 0.54

**Justification:** Structured explanation schema with reasoning, evidence refs, confidence, alternatives, and caveats. Faithfulness checker validates LLM narrative against finding traces. Citation-bound rendering in UI. Aggregate run explanation with executive rollups. Fallback behavior when LLM returns non-JSON. Schema versioning strategy documented.

**Tradeoffs:** The explainability infrastructure is well-designed. The gap is that faithfulness checking is heuristic (token overlap) rather than semantic.

**Recommendations:** Consider upgrading the faithfulness checker to use embedding similarity rather than token overlap for more accurate validation.

---

### Data Consistency — Score: 75 | Weight: 2 | Weighted Impact: 1.50 | Deficiency: 0.50

**Justification:** FK enforcement on authority chain tables. Data consistency orphan probe as hosted service with OTel counters. Quarantine mode for detected orphans. Hot-path query shape sentinels. The known gap is `dbo.ComparisonRecords` run ID columns are `NVARCHAR` not `UNIQUEIDENTIFIER` with FK (TB-006, documented, 4-8h fix).

**Tradeoffs:** The orphan detection is a smart mitigation for the FK gap. The fix is straightforward but needs a migration.

**Recommendations:** Execute TB-006 — migrate `ComparisonRecords` run ID columns to `UNIQUEIDENTIFIER` with FK to `dbo.Runs`.

---

### Azure Compatibility and SaaS Deployment Readiness — Score: 71 | Weight: 2 | Weighted Impact: 1.42 | Deficiency: 0.58

**Justification:** 114 Terraform files across 15+ roots (container apps, SQL failover, monitoring, service bus, storage, OpenAI, edge, pilot, entra, etc.). Docker compose profiles for local dev. Container Apps configuration with secondary region. Consumption budget alerts. Managed identity for SQL and blob. GitHub Actions CD pipeline documented. Hosted SaaS probe badge on README. But: no evidence of a production deployment. The infrastructure is defined but never exercised at scale.

**Tradeoffs:** The IaC investment is substantial for a pre-revenue product. This positions well for production but is untested.

**Recommendations:** Deploy to staging using the Terraform roots and validate the full stack before any customer-facing pilot.

---

### Azure Ecosystem Fit — Score: 75 | Weight: 1 | Weighted Impact: 0.75 | Deficiency: 0.25

**Justification:** Strong Azure alignment: Entra ID for auth, Azure SQL for persistence, Azure OpenAI for models, Service Bus for events, Container Apps for hosting, Key Vault for secrets, Application Insights for telemetry, Front Door for edge, Logic Apps for integration recipes, Blob Storage for artifacts. Azure Marketplace SaaS offer documented.

**Tradeoffs:** Deep Azure dependency limits multi-cloud flexibility but aligns with the target buyer (enterprise Microsoft shops).

**Recommendations:** No changes needed for V1. Azure-first is the right strategy.

---

### Reliability — Score: 70 | Weight: 2 | Weighted Impact: 1.40 | Deficiency: 0.60

**Justification:** Circuit breaker pattern implemented with OTel counters. Retry policies for LLM calls. Idempotency-Key support on run creation. Health endpoints (live, ready, full). RTO/RPO targets documented by tier. Database failover runbook exists. But: no chaos testing results beyond the Simmy CI tier (which exists but is post-regression). No production uptime data. No customer-facing SLA (SLO targets only for Team/Professional; custom SLA for Enterprise).

**Tradeoffs:** Reliability infrastructure exists but is unproven in production. The circuit breaker and retry patterns are appropriate.

**Recommendations:** Run a game day exercise against the staging environment using the documented chaos scenarios. Document results and refine RTO claims.

---

### AI/Agent Readiness — Score: 65 | Weight: 2 | Weighted Impact: 1.30 | Deficiency: 0.70

**Justification:** Multi-agent architecture with 10 typed finding engines. Agent output structural completeness metrics. Agent trace blob storage with fallback. Prompt redaction for PII/secrets. Agent execution cost preview. But: agents are primarily tested via simulator (deterministic fake outputs). The quality gate defaults to off. There's no published evaluation of real LLM output quality. Agent output semantic scoring exists as a histogram but the scoring methodology is not externally validated.

**Tradeoffs:** Simulator-first testing is pragmatic for CI determinism. The gap is in real-world output quality validation.

**Recommendations:** Build a golden-cohort real-LLM evaluation suite. Enable the quality gate by default. Publish quality thresholds.

---

### Supportability — Score: 74 | Weight: 1 | Weighted Impact: 0.74 | Deficiency: 0.26

**Justification:** CLI `doctor` and `support-bundle` commands. Troubleshooting guide. Correlation IDs on all responses. Version endpoint. Scope debug endpoint. Internal diagnostics controller. Agent trace forensics doc. The support infrastructure is thoughtful.

**Tradeoffs:** Good support tooling for a team of one. May need customer-facing support portal for scale.

**Recommendations:** No urgent changes.

---

### Evolvability — Score: 74 | Weight: 1 | Weighted Impact: 0.74 | Deficiency: 0.26

**Justification:** ADR process with 30+ decisions. Breaking changes tracked. V1 scope contract with explicit deferred items. V1.1 commitments named (ITSM connectors). Tech backlog with prioritized items. The codebase is designed for evolution with clean abstractions.

**Tradeoffs:** The extensive documentation and process suggest a codebase that can evolve systematically.

**Recommendations:** No urgent changes.

---

### Deployability — Score: 72 | Weight: 1 | Weighted Impact: 0.72 | Deficiency: 0.28

**Justification:** Docker compose profiles. Container images. Terraform roots. DbUp migrations with idempotent guards. Health-checked deployments. CD pipeline documented. Hosting role configuration. But: no evidence of a successful production deployment. The deployment runbook exists but is theoretical.

**Tradeoffs:** The deployment infrastructure is complete on paper. Needs a real deployment to validate.

**Recommendations:** Execute a full deployment to staging and document any gaps discovered.

---

### Manageability — Score: 70 | Weight: 1 | Weighted Impact: 0.70 | Deficiency: 0.30

**Justification:** Configuration through appsettings hierarchy. Azure App Configuration future adoption documented. Feature flags via configuration. Admin controllers for tenant management, SCIM tokens, metering, demo data, jobs. Startup config validation with advisory counters.

**Tradeoffs:** Configuration surface is large but well-documented. The startup validation is a good safety net.

**Recommendations:** No urgent changes.

---

### Change Impact Clarity — Score: 70 | Weight: 1 | Weighted Impact: 0.70 | Deficiency: 0.30

**Justification:** Changelog maintained. Breaking changes tracked. ADR process for architectural decisions. Governance preview for manifest diffs. Comparison replay for drift detection. The system communicates changes well at the technical level.

**Tradeoffs:** Good for operators and contributors. Less visible to buyers who want to know "what changed this release?"

**Recommendations:** Build a buyer-facing changelog that translates technical changes into value-relevant language.

---

### Performance — Score: 69 | Weight: 1 | Weighted Impact: 0.69 | Deficiency: 0.31

**Justification:** In-process performance baselines documented (E2E < 10s for simulator + in-memory). Named-query allowlist with CI gate. k6 load tests in CI. Hot-path SQL query shape sentinels. But: all measurements are against in-memory or local SQL, not production Azure SQL. No production performance data exists.

**Tradeoffs:** The performance testing infrastructure is good. The gap is that performance under production conditions is unknown.

**Recommendations:** Run k6 tests against the staging Azure SQL deployment and document realistic latency expectations.

---

### Availability — Score: 68 | Weight: 1 | Weighted Impact: 0.68 | Deficiency: 0.32

**Justification:** Health endpoints. RTO/RPO targets by tier. Database failover runbook. Container Apps with secondary region in Terraform. Auto-failover group configuration documented. But: no production uptime data. No customer-facing SLA. Hosted SaaS probe exists but is a basic health check.

**Tradeoffs:** HA infrastructure is designed but unproven.

**Recommendations:** Run the hosted SaaS probe for 30+ days and publish uptime statistics before customer pilots.

---

### Accessibility — Score: 66 | Weight: 1 | Weighted Impact: 0.66 | Deficiency: 0.34

**Justification:** WCAG 2.1 AA target. axe-core Playwright gating on 35 URL patterns. eslint-plugin-jsx-a11y. Skip-to-content link. ARIA landmarks. Focus management in modals. Live regions for pipeline progress. But: 35 scanned routes out of 170+ page components means coverage is partial. No VPAT/ACR published.

**Tradeoffs:** The accessibility foundation is solid. The gap is in coverage breadth and formal conformance documentation.

**Recommendations:** Expand axe scanning to cover all operator route groups. Create a VPAT/ACR document for procurement teams that require it.

---

### AI/Agent Readiness — (already scored above)

---

### Scalability — Score: 62 | Weight: 1 | Weighted Impact: 0.62 | Deficiency: 0.38

**Justification:** Single-region contract for V1 (documented). Azure SQL scaling levers documented. Container Apps scaling documented. Buyer scalability FAQ exists. But: no load testing against production-like infrastructure. The capacity and cost playbook exists but is theoretical. Multi-region is Terraform-ready but not deployed.

**Tradeoffs:** V1 single-region is the right constraint. Documented scaling levers provide a credible evolution story.

**Recommendations:** No urgent changes for V1. Validate scaling assumptions with k6 against staging before first Enterprise customer.

---

### Cost-Effectiveness — Score: 63 | Weight: 1 | Weighted Impact: 0.63 | Deficiency: 0.37

**Justification:** Consumption budget alerts in Terraform. Agent execution cost preview endpoint. LLM token usage counters. Capacity and cost playbook exists. But: actual hosting costs are unknown (no production deployment). The agent execution cost preview is a good feature but LLM costs are highly variable and unvalidated.

**Tradeoffs:** Cost modeling exists on paper. Real costs depend on actual LLM usage patterns which are unknown.

**Recommendations:** Deploy staging and measure actual Azure costs for a realistic workload before setting pricing margins.

---

## 3. Top 10 Most Important Weaknesses

**Ranked from most serious to least serious:**

1. **Zero paying customers and zero validated revenue path.** Every commercial assertion — pricing, packaging, ROI, conversion — is theoretical. The Stripe/Marketplace checkout infrastructure exists but has never processed a real transaction. This is existential.

2. **No real-world validation of AI output quality.** The most important thing the product produces — architecture findings from LLM-powered agents — is tested almost exclusively through simulator stubs. No external evaluation of finding accuracy against human expert review exists.

3. **High adoption barrier requiring workflow replacement.** The product asks architects to abandon their current review process and adopt an entirely new vocabulary and workflow. No native integration with tools architects already use (Jira, Confluence, modeling tools) in V1.

4. **No reference customer or external social proof.** All reference customer table entries are placeholders. No logo, no case study, no testimonial. Enterprise buyers require peer validation before purchase.

5. **Untested production deployment.** 114 Terraform files, Docker compose profiles, CD pipeline documentation — all untested in production. No staging environment has been validated with realistic traffic. The gap between IaC definition and operational reality is unknown.

6. **Theoretical ROI claims.** The ROI model is well-structured but every number is hypothetical. No customer has confirmed time savings, cost avoidance, or compliance improvement. The "40-hour manual review → ArchLucid review" claim is unvalidated.

7. **Broad UI surface with no user testing.** 170+ page components, seven-step wizard, progressive disclosure patterns — all designed without external user feedback. The product may be solving the right problems in ways that don't match how architects actually work.

8. **No third-party security attestation.** Self-assessed SOC 2, owner-conducted pen test, no third-party pen test until V2. For enterprise security reviewers, this is a significant gap mitigated but not closed by the procurement pack.

9. **Agent output quality gate defaults to off.** The infrastructure to gate agent output quality exists but is disabled by default. This means the product may serve low-quality findings without warning. The quality threshold needs calibration data that doesn't exist.

10. **Large vocabulary and concept surface.** Golden manifests, authority pipelines, finding engines, context snapshots, governance resolution, policy packs, decision traces — the product imposes significant domain vocabulary on top of already-complex architecture review terminology.

---

## 4. Top 5 Monetization Blockers

1. **No completed purchase path.** The Stripe checkout and Azure Marketplace webhook infrastructure exist in code but have never been end-to-end tested with a real payment. There is no evidence that a prospect can go from trial → paid without manual founder intervention.

2. **No reference customer for credibility.** Enterprise buyers need to hear "Company X uses this" before committing budget. Zero published references means every sale starts from zero trust. The design-partner discount (-50%) is ready but no partner is signed.

3. **Unvalidated price points.** $436/mo for Team (3 seats) and $2,331/mo for Professional (8 seats) have never been tested against buyer willingness to pay. The ROI model supports these prices theoretically but no prospect has agreed to pay them.

4. **No automated trial-to-paid conversion funnel.** The trial signup infrastructure exists. The billing checkout controller exists. But the complete funnel — signup → onboarding → aha moment → conversion prompt → checkout → paid provisioning — has never been operated end-to-end with a real user.

5. **No proof of time-to-value for real architectures.** The benchmark shows the pipeline works in simulator mode. But no prospect has used ArchLucid on their own architecture and confirmed it produced valuable findings faster than their current process.

---

## 5. Top 5 Enterprise Adoption Blockers

1. **No SOC 2 Type II attestation.** Self-assessment exists. The trust center is honest about the gap. But many enterprise procurement processes require a SOC 2 report or equivalent third-party attestation as a hard gate. The mitigation path (self-assessment + CAIQ/SIG pre-fills + procurement response accelerator) is above-average but doesn't eliminate the blocker.

2. **No native ITSM integration in V1.** Findings need to flow into Jira, ServiceNow, or Azure DevOps for architects to act on them. V1 offers only webhooks and REST API, requiring customer-side development. V1.1 promises ServiceNow, but that's a future commitment, not a shipped feature.

3. **No ArchiMate/Structurizr/Terraform state import.** Enterprise architects use modeling tools. ArchLucid requires describing architecture from scratch rather than importing existing models. This is a significant adoption friction point for the primary buyer persona.

4. **Single-region V1 deployment.** For global enterprises, single-region hosting may violate data residency requirements or create unacceptable latency. The Terraform includes secondary region configuration but it's not deployed.

5. **No customer-operated deployment option.** ArchLucid is SaaS-only. Some enterprise security policies require on-premises or customer-VNet deployment. The documentation explicitly states "customers never deploy ArchLucid," which eliminates this market segment.

---

## 6. Top 5 Engineering Risks

1. **Simulator-tested agent outputs masking real LLM quality issues.** The entire finding engine pipeline is tested through deterministic simulator stubs. If real LLM outputs produce structurally valid but semantically wrong findings, the test suite will not catch it. This is the highest-probability failure mode for customer-facing quality.

2. **ComparisonRecords FK gap (TB-006).** `dbo.ComparisonRecords` run ID columns are `NVARCHAR` without FK to `dbo.Runs`. The orphan detection probe mitigates but doesn't prevent referential integrity violations. A bad comparison record could link to a non-existent run and cause confusing UI errors or incorrect comparison results.

3. **Untested production infrastructure.** 114 Terraform files defining a complex multi-service Azure deployment have never been applied to a real environment under load. Database failover, Container Apps scaling, Service Bus throughput, and Front Door routing are all theoretical until validated.

4. **LLM prompt injection / extraction risk.** The prompt redaction is deny-list based. Architecture briefs submitted by users are passed to LLM prompts. A malicious or careless user could inject instructions that cause the model to reveal system prompts, produce manipulated findings, or exfiltrate tenant context. The ASK/RAG threat model exists but the mitigations are documented rather than comprehensively tested.

5. **Agent trace blob storage failure cascade.** If Azure Blob Storage is unavailable during agent execution, the inline fallback writes full prompts to SQL (`Full*Inline` columns). A sustained blob outage could cause SQL storage to grow rapidly with large text payloads, degrading database performance for all tenants.

---

## 7. Most Important Truth

ArchLucid is an exceptionally well-engineered product with no customers. The engineering discipline — 49 modular projects, comprehensive CI, deep audit infrastructure, Terraform-ready deployment — is genuinely impressive and unusual for a solo founder. But none of this matters until one real customer uses the product on their own architecture, confirms the findings are valuable, and pays for it. Every hour spent on engineering refinement before that validation event has diminishing returns. The product needs to shift from "build more" to "sell one."

---

## 8. Top Improvement Opportunities

### Improvement 1: DEFERRED — Close First Design-Partner Pilot

**Title:** DEFERRED — Close and onboard first design-partner customer
**Reason deferred:** Requires founder outreach to real prospects, negotiation, and agreement execution. No Cursor prompt can substitute for commercial relationship building.
**What I need from you:** Identity of 2-3 target design-partner prospects, their current architecture review process, and whether any have expressed interest. Also: whether the hosted staging environment at `archlucid.net` is operational and ready for external users.

---

### Improvement 2: DEFERRED — Validate Pricing with Prospect Interviews

**Title:** DEFERRED — Validate Team tier price point ($436/mo) with 5 target prospects
**Reason deferred:** Requires conversations with real prospects. Price sensitivity data cannot be synthesized from code.
**What I need from you:** Whether you have access to 5 prospects in the target persona (enterprise architect, CTO/VP Eng at 200-500 person orgs) who would participate in a 15-minute pricing conversation.

---

### Improvement 3: Build Golden-Cohort Real-LLM Evaluation Suite

**Title:** Build golden-cohort real-LLM evaluation test suite for finding engine accuracy
**Why it matters:** The most critical trust gap — AI output quality is untested against real model completions. Every buyer must trust findings are correct, and there is zero external validation.
**Expected impact:** Directly improves Correctness (+6-8 pts), Trustworthiness (+5-7 pts), AI/Agent Readiness (+5-7 pts). Weighted readiness impact: +0.7-1.1%.
**Affected qualities:** Correctness, Trustworthiness, AI/Agent Readiness, Explainability
**Status:** Fully actionable now

**Cursor Prompt:**
```
Build a golden-cohort real-LLM evaluation test suite that validates finding engine outputs against expert-annotated reference answers.

## What to build
1. Create `ArchLucid.AgentRuntime.Tests/GoldenCohort/` directory with a `RealLlmFindingAccuracyTests.cs` test class.
2. Create `tests/golden-cohort/` directory with 3 JSON fixture files, each containing:
   - A representative architecture brief (use variants of the Contoso Retail scenario but with different architectural patterns: monolith, microservices, serverless)
   - For each brief, an `expected_findings` array with human-annotated expected finding types, severities, and key phrases that should appear in finding descriptions
3. The test should:
   - Load each fixture
   - Run the full authority pipeline (context ingestion → graph → findings → decisioning) against the fixture brief
   - Compare produced findings against expected findings using:
     a. Finding type match rate (did we find the same categories?)
     b. Severity alignment (within 1 severity level?)
     c. Key phrase coverage (do finding descriptions mention the expected concerns?)
   - Report a composite accuracy score per fixture
   - Assert composite accuracy > 0.6 (initial conservative threshold)
4. Mark tests with `[Trait("Category", "GoldenCorpusRecord")]` and `[Trait("Suite", "Core")]`
5. Tests should work with both simulator mode (for CI) and real LLM mode (for manual validation)
6. When `AgentExecution:Mode=Simulator`, the test should still run but log a warning that accuracy scores reflect simulator outputs, not real model quality
7. Add a `tests/golden-cohort/README.md` explaining the methodology, how to update fixtures, and how to run with real LLM

## Files to create
- `ArchLucid.AgentRuntime.Tests/GoldenCohort/RealLlmFindingAccuracyTests.cs`
- `tests/golden-cohort/contoso-monolith.json`
- `tests/golden-cohort/contoso-microservices.json`
- `tests/golden-cohort/contoso-serverless.json`
- `tests/golden-cohort/README.md`

## Files to modify
- None — this is additive

## Constraints
- Do not modify existing test infrastructure
- Do not change simulator behavior
- Use existing `WebApplicationFactory` patterns from `ArchLucid.Api.Tests`
- Follow house style: primary constructors, pattern matching, no braces on single-statement if, same-line guards
- Expert-annotated fixtures should be realistic but conservative — only assert findings that a competent architect would unanimously identify

## Acceptance criteria
- All 3 fixture tests pass in simulator mode
- Each fixture has at least 5 expected findings
- README documents the accuracy methodology
- Tests are discoverable via `--filter "Category=GoldenCorpusRecord"`
```

---

### Improvement 4: Complete Stripe End-to-End Checkout Validation

**Title:** Validate Stripe checkout → paid tenant conversion end-to-end with test mode
**Why it matters:** Without a working purchase path, there is no revenue. The code exists but has never been exercised. This is the single highest-leverage monetization fix.
**Expected impact:** Directly improves Decision Velocity (+10-15 pts), Commercial Packaging (+5-8 pts), Marketability (+3-5 pts). Weighted readiness impact: +0.5-0.8%.
**Affected qualities:** Decision Velocity, Commercial Packaging Readiness, Marketability, Time-to-Value
**Status:** Fully actionable now

**Cursor Prompt:**
```
Create an end-to-end integration test that validates the complete Stripe checkout → paid tenant conversion flow using Stripe test mode.

## What to build
1. Create `ArchLucid.Api.Tests/Billing/StripeCheckoutEndToEndTests.cs`
2. The test should exercise the full flow:
   a. Create a trial tenant via `POST /v1/registration` (existing registration controller)
   b. Authenticate as that tenant's admin
   c. Call `POST /v1/tenant/billing/checkout` with `TargetTier=Standard`, test ReturnUrl/CancelUrl
   d. Assert the response contains a valid Stripe checkout session URL (or mock equivalent)
   e. Simulate a successful Stripe webhook callback (`checkout.session.completed`)
   f. Assert the tenant's `dbo.BillingSubscriptions` row shows `Status=Active` and correct `Tier`
   g. Assert the tenant's `dbo.Tenants.Tier` is updated to `Standard`
   h. Assert a durable audit event was written for the conversion
3. Use `IBillingProviderRegistry` and `IStripeClientFactory` mocks for CI (no real Stripe calls)
4. Add a companion test that validates the same flow with `Billing:Provider=AzureMarketplace` using the marketplace webhook stub

## Files to create
- `ArchLucid.Api.Tests/Billing/StripeCheckoutEndToEndTests.cs`

## Files to modify
- None expected — use existing test infrastructure

## Constraints
- Do not call real Stripe APIs in CI
- Mock `IStripeClientFactory` to return deterministic test responses
- Follow existing `WebApplicationFactory` test patterns
- Use `[Trait("Suite", "Core")]` and `[Trait("Category", "Integration")]`
- Do not modify the billing checkout controller or webhook controller

## Acceptance criteria
- Test passes in CI without Stripe credentials
- Full flow from registration → checkout → webhook → paid tenant is validated
- Audit events are asserted
- Test documents the exact webhook payload format expected
```

---

### Improvement 5: Build "Bring Your Own Brief" Simplified Wizard Path

**Title:** Add a simplified "paste your architecture brief" wizard path that reduces steps from 7 to 3
**Why it matters:** The seven-step wizard is the first interaction for new users and creates significant adoption friction. A simplified path accelerates time-to-value and reduces the "what do I need to type?" barrier.
**Expected impact:** Directly improves Adoption Friction (+6-8 pts), Time-to-Value (+4-6 pts), Usability (+3-5 pts), Cognitive Load (+4-6 pts). Weighted readiness impact: +0.8-1.2%.
**Affected qualities:** Adoption Friction, Time-to-Value, Usability, Cognitive Load, Customer Self-Sufficiency
**Status:** Fully actionable now

**Cursor Prompt:**
```
Add a simplified "Quick Review" wizard path alongside the existing 7-step wizard that reduces new run creation to 3 steps.

## What to build
1. In `archlucid-ui/src/app/(operator)/reviews/new/`, add a `QuickReviewWizard.tsx` component
2. The 3 steps are:
   Step 1: "Paste your architecture brief" — a single large textarea (min 100 chars) with a placeholder showing an example brief. Include a "Use sample brief" button that populates the Contoso Retail brief.
   Step 2: "Review scope" — auto-populated tenant/workspace/project from current scope, with an optional one-line title field
   Step 3: "Confirm and run" — summary of what will happen, with a "Start review" button
3. On submit, call the same `POST /v1/architecture/request` endpoint but construct the `ArchitectureRequest` from the free-text brief using a `briefText` field (the API already accepts description text)
4. Add a toggle at the top of the `/reviews/new` page: "Quick review" | "Detailed wizard" — default to "Quick review" for new tenants
5. After submission, redirect to the run detail page with the `RunProgressTracker` showing pipeline progress

## Files to create
- `archlucid-ui/src/app/(operator)/reviews/new/QuickReviewWizard.tsx`
- `archlucid-ui/src/app/(operator)/reviews/new/QuickReviewWizard.test.tsx`

## Files to modify
- `archlucid-ui/src/app/(operator)/reviews/new/page.tsx` — add the toggle between Quick and Detailed wizards

## Constraints
- Do not modify the existing `NewRunWizardClient.tsx` or `QuickStartWizard.tsx` — keep both paths available
- Do not modify the API — use existing request schema
- Use existing UI components (Card, Button, Textarea from components/ui/)
- Follow existing test patterns (Vitest + Testing Library)
- Ensure accessibility: proper labels, ARIA, keyboard navigation
- Do not add new npm dependencies

## Acceptance criteria
- Quick Review wizard renders and submits successfully
- Toggle between Quick and Detailed works
- Vitest test covers the 3-step flow
- Accessibility: all form inputs have labels, textarea has description
- Sample brief button works
- Redirect to run detail after submission
```

---

### Improvement 6: Execute ComparisonRecords FK Migration (TB-006)

**Title:** Migrate `dbo.ComparisonRecords` run ID columns to `UNIQUEIDENTIFIER` with FK to `dbo.Runs`
**Why it matters:** This is the last known referential integrity gap in the database schema. Orphaned comparison records can cause confusing UI errors and incorrect comparison results. The fix is documented, sized (4-8h), and has clear acceptance criteria.
**Expected impact:** Directly improves Data Consistency (+8-10 pts), Reliability (+3-5 pts), Correctness (+2-3 pts). Weighted readiness impact: +0.4-0.6%.
**Affected qualities:** Data Consistency, Reliability, Correctness, Architectural Integrity
**Status:** Fully actionable now

**Cursor Prompt:**
```
Execute TB-006: migrate dbo.ComparisonRecords run ID columns from NVARCHAR to UNIQUEIDENTIFIER with foreign key to dbo.Runs.

## What to build
1. Create a new DbUp migration script in `ArchLucid.Persistence/Migrations/` (next sequential number after the highest existing migration)
2. The migration should:
   a. Add new UNIQUEIDENTIFIER columns `LeftRunIdGuid` and `RightRunIdGuid` (nullable initially)
   b. Backfill from existing NVARCHAR columns using TRY_CONVERT(UNIQUEIDENTIFIER, LeftRunId)
   c. Log/skip rows where conversion fails (these are the orphans the probe already detects)
   d. Add FK constraints: `FK_ComparisonRecords_Runs_LeftRunIdGuid` and `FK_ComparisonRecords_Runs_RightRunIdGuid` with NO ACTION
   e. Once backfill is verified, drop the old NVARCHAR columns and rename the GUID columns
   f. Use IF NOT EXISTS guards for idempotency (standard pattern in this codebase)
3. Update `ArchLucid.Persistence/Scripts/ArchLucid.sql` master DDL to reflect the new column types
4. Update the Dapper repository code in `ArchLucid.Persistence` that reads/writes ComparisonRecords to use UNIQUEIDENTIFIER parameters
5. Update the data consistency orphan probe to remove ComparisonRecords from its detection scope (since FK now enforces integrity)

## Files to create
- `ArchLucid.Persistence/Migrations/NNN_MigrateComparisonRecordsRunIdToGuid.sql` (use next sequential number)

## Files to modify
- `ArchLucid.Persistence/Scripts/ArchLucid.sql` — update ComparisonRecords DDL
- Dapper repository files that reference ComparisonRecords LeftRunId/RightRunId columns (search for `LeftRunId` and `RightRunId` in ArchLucid.Persistence/)
- `ArchLucid.Core/Diagnostics/` or hosted service that runs the orphan probe — remove ComparisonRecords from probe scope
- `docs/library/TECH_BACKLOG.md` — mark TB-006 as Done

## Constraints
- Migration must be idempotent (IF NOT EXISTS guards)
- Do not modify historical migration files (001-028 or any other existing migration)
- Handle rows where TRY_CONVERT returns NULL (log them, don't fail the migration)
- Test with the greenfield SQL boot to verify fresh catalog works
- Follow existing migration naming pattern

## Acceptance criteria
- Migration runs successfully on fresh database (greenfield boot test passes)
- Migration runs successfully on database with existing ComparisonRecords data
- FK constraints are enforced (insert with non-existent RunId fails)
- Orphan probe no longer reports ComparisonRecords false positives
- Existing comparison replay tests pass
- TB-006 marked Done in TECH_BACKLOG.md
```

---

### Improvement 7: Create Architecture Review Templates for Common Scenarios

**Title:** Create 5 pre-built architecture review templates for the wizard
**Why it matters:** Templates reduce time-to-value by eliminating the "blank page" problem. Enterprise architects doing their first review need guidance on what to include in the architecture brief. Templates also demonstrate product capabilities by showing what kinds of reviews ArchLucid excels at.
**Expected impact:** Directly improves Template/Accelerator Richness (+15-20 pts), Time-to-Value (+3-5 pts), Adoption Friction (+3-5 pts). Weighted readiness impact: +0.3-0.5%.
**Affected qualities:** Template and Accelerator Richness, Time-to-Value, Adoption Friction, Usability
**Status:** Fully actionable now

**Cursor Prompt:**
```
Create 5 pre-built architecture review templates that populate the new-run wizard with structured context for common enterprise scenarios.

## What to build
1. Create `archlucid-ui/src/data/review-templates.ts` with 5 template objects, each containing:
   - `id`: slug identifier
   - `name`: display name
   - `description`: 1-2 sentence description
   - `briefText`: pre-populated architecture brief (200-400 words, realistic enterprise scenario)
   - `suggestedTitle`: default run title
   - `category`: one of "migration", "greenfield", "security", "compliance", "optimization"

2. The 5 templates:
   a. **Cloud Migration Assessment** — on-premises .NET monolith moving to Azure (App Service + Azure SQL + managed identity)
   b. **Microservices Architecture Review** — event-driven microservices with Azure Service Bus, Container Apps, and shared SQL
   c. **Security Posture Review** — existing web application with Entra ID auth, API gateway, and private endpoints
   d. **Compliance Gap Analysis** — healthcare-adjacent platform needing HIPAA-aligned controls review
   e. **Cost Optimization Review** — over-provisioned Azure infrastructure with multiple App Service plans, premium SQL tiers, and underutilized resources

3. In the existing `QuickStartWizard.tsx` (or the new QuickReviewWizard if Improvement 5 is merged), add a "Start from a template" section that shows template cards. Clicking a card populates the brief textarea with the template's `briefText`.

4. Add a test that validates all 5 templates produce valid `ArchitectureRequest` payloads when submitted.

## Files to create
- `archlucid-ui/src/data/review-templates.ts`
- `archlucid-ui/src/data/review-templates.test.ts`

## Files to modify
- `archlucid-ui/src/app/(operator)/reviews/new/QuickStartWizard.tsx` — add template selection UI

## Constraints
- Templates must use realistic enterprise scenarios, not toy examples
- Brief text should be specific enough that finding engines produce meaningful results
- Do not reference real company names — use generic "Organization" language
- Do not add new npm dependencies
- Follow existing Vitest test patterns

## Acceptance criteria
- 5 templates render in the wizard
- Clicking a template populates the brief
- Each template produces a valid API request when submitted
- Templates cover the 5 most common enterprise architecture review scenarios
- Test validates template structure and non-empty fields
```

---

### Improvement 8: Enable Agent Output Quality Gate by Default

**Title:** Enable agent output quality gate by default and set conservative thresholds
**Why it matters:** The quality gate infrastructure exists (`ArchLucid:AgentOutput:QualityGate:Enabled`) but defaults to off. This means the product can serve low-quality findings without any automated check. Enabling it with conservative thresholds provides a safety net against the most egregious AI output failures.
**Expected impact:** Directly improves Correctness (+3-5 pts), Trustworthiness (+4-6 pts), AI/Agent Readiness (+3-5 pts). Weighted readiness impact: +0.4-0.6%.
**Affected qualities:** Correctness, Trustworthiness, AI/Agent Readiness, Reliability
**Status:** Fully actionable now

**Cursor Prompt:**
```
Enable the agent output quality gate by default with conservative thresholds that catch structurally invalid outputs without blocking valid ones.

## What to change
1. In `ArchLucid.Api/appsettings.json`, set `ArchLucid:AgentOutput:QualityGate:Enabled` to `true` (currently `false` or absent)
2. In the quality gate configuration section (find via `AgentOutput:QualityGate` in appsettings or options classes), set:
   - `MinimumStructuralCompleteness`: 0.3 (reject outputs missing >70% of expected JSON keys — very conservative)
   - `MinimumSemanticScore`: 0.2 (reject outputs with near-zero semantic quality — catches empty/garbage responses only)
   - `Action`: "Warn" (log warning + increment counter, don't reject the output — ship to UI with a quality warning flag)
3. In `appsettings.Development.json`, keep `Enabled: true` (same as production — developers should see quality warnings during development)
4. Update `AgentOutputEvaluationRecorder` or equivalent to add a `qualityWarning` field to the agent result when the quality gate triggers at "Warn" level
5. Ensure the `archlucid_agent_output_quality_gate_total` counter increments correctly for `warned` outcomes

## Files to modify
- `ArchLucid.Api/appsettings.json` — enable quality gate
- `ArchLucid.Api/appsettings.Development.json` — enable quality gate
- Options class for `AgentOutput:QualityGate` (search for `QualityGate` in ArchLucid.Core or ArchLucid.AgentRuntime)
- `AgentOutputEvaluationRecorder` or equivalent — add warning field propagation
- `docs/library/OBSERVABILITY.md` — update quality gate documentation to reflect new defaults

## Constraints
- Do not change thresholds to values that would reject simulator outputs (test this)
- Do not change the quality gate action to "Reject" — use "Warn" only for V1
- Do not modify existing agent execution flow — quality gate is post-evaluation only
- Ensure all existing tests pass with the gate enabled

## Acceptance criteria
- Quality gate is enabled in both production and development appsettings
- Simulator outputs pass the quality gate (thresholds are conservative enough)
- Counter increments for `warned` outcomes when outputs fall below thresholds
- All existing tests pass (including golden corpus evaluation)
- OBSERVABILITY.md reflects the new default behavior
```

---

### Improvement 9: Deploy and Validate Staging Environment

**Title:** Deploy full stack to Azure staging and validate infrastructure
**Why it matters:** 114 Terraform files and comprehensive deployment documentation have never been exercised. Every claim about availability, reliability, performance, and scalability is theoretical until a real Azure deployment runs under load. This is prerequisite for any customer-facing pilot.
**Expected impact:** Directly improves Azure Compat/SaaS Deployment (+8-10 pts), Reliability (+5-7 pts), Availability (+5-8 pts), Deployability (+5-8 pts). Weighted readiness impact: +0.5-0.8%.
**Affected qualities:** Azure Compatibility and SaaS Deployment Readiness, Reliability, Availability, Deployability, Performance, Scalability
**Status:** Fully actionable now

**Cursor Prompt:**
```
Create a staging deployment validation checklist and smoke test script that verifies the full ArchLucid stack is operational after Terraform apply + container deployment.

## What to build
1. Create `docs/runbooks/STAGING_DEPLOYMENT_VALIDATION.md` with a step-by-step checklist:
   - Terraform apply for each root (order: sql-failover → storage → keyvault → entra → openai → servicebus → container-apps → monitoring → edge)
   - Container image build and push to ACR
   - API container app deployment
   - Worker container app deployment (if separate)
   - UI deployment (if separate from API)
   - DbUp migration verification
   - Health endpoint checks
   - End-to-end smoke: create run → execute → commit → retrieve manifest
   - Observability: verify metrics flow to Application Insights
   - Alert: verify at least one alert rule fires on test threshold

2. Create `scripts/staging-smoke.sh` (and `.ps1` equivalent) that:
   - Accepts `ARCHLUCID_BASE_URL` environment variable
   - Checks `/health/live`, `/health/ready`, `/health`
   - Checks `/version` and prints build info
   - Creates a test run via API (with API key auth)
   - Waits for execution to complete (poll status)
   - Commits the run
   - Retrieves the manifest
   - Prints timing for each step
   - Exits 0 on success, 1 on any failure
   - Writes results to `staging-smoke-results.json`

3. Create `scripts/staging-smoke.ps1` as the PowerShell equivalent

## Files to create
- `docs/runbooks/STAGING_DEPLOYMENT_VALIDATION.md`
- `scripts/staging-smoke.sh`
- `scripts/staging-smoke.ps1`

## Constraints
- Do not modify Terraform files
- Do not modify application code
- Scripts should be idempotent and safe to run multiple times
- Scripts should clean up test data (delete the test run if API supports it, or use a test tenant)
- Follow existing script patterns in the repository

## Acceptance criteria
- Validation checklist covers all Terraform roots in correct order
- Smoke script tests the full happy path (create → execute → commit → retrieve)
- Script prints clear pass/fail output with timing
- Script exits with correct status code
- PowerShell and Bash versions are equivalent
```

---

### Improvement 10: Expand Axe Accessibility Coverage to All Operator Routes

**Title:** Expand axe-core accessibility scanning from 35 to all operator route patterns
**Why it matters:** Current accessibility testing covers 35 of 170+ page components. Gaps in coverage mean accessibility violations can ship undetected in less-tested routes. Enterprise procurement increasingly requires VPAT/ACR documentation.
**Expected impact:** Directly improves Accessibility (+8-10 pts), Usability (+2-3 pts), Procurement Readiness (+2-3 pts). Weighted readiness impact: +0.2-0.3%.
**Affected qualities:** Accessibility, Usability, Procurement Readiness, Compliance Readiness
**Status:** Fully actionable now

**Cursor Prompt:**
```
Expand the Playwright axe-core accessibility test to cover all operator route groups, not just the current 35 URL patterns.

## What to change
1. In `archlucid-ui/e2e/live-api-accessibility.spec.ts`, expand the `PAGES` array to include all operator routes that are missing. Specifically add:
   - All `/reviews/[runId]/findings/[findingId]/*` routes (finding detail, inspect)
   - All `/governance/*` routes (findings queue, policy packs management)
   - All `/settings/*` routes (baseline, tenant, exec-digest)
   - All `/planning/*` routes (plans list, plan detail)
   - `/product-learning` and its sub-routes
   - `/advisory-scheduling`
   - `/recommendation-learning`
   - `/evolution-review`
   - `/scorecard`
   - All `/manifests/*` routes
   - `/replay` routes
   - `/onboarding/start`
   - Executive routes under `(executive)/`

2. For routes that require dynamic IDs (runId, findingId, manifestId, planId), use the fixture IDs from `e2e/fixtures/ids.ts` — extend the fixtures file if needed with additional seeded IDs.

3. If a route cannot be tested because it requires specific state (e.g., active governance approval), add it to a `PAGES_DEFERRED` array with a comment explaining why, so the gap is visible.

## Files to modify
- `archlucid-ui/e2e/live-api-accessibility.spec.ts` — expand PAGES array
- `archlucid-ui/e2e/fixtures/ids.ts` — add any missing fixture IDs

## Constraints
- Do not reduce the severity threshold — keep critical/serious as gating
- Do not remove any existing PAGES entries
- Do not modify the axe configuration or rules
- Routes that genuinely cannot be tested should be documented in PAGES_DEFERRED, not silently omitted

## Acceptance criteria
- PAGES array covers at least 60 URL patterns (up from 35)
- All new routes pass the existing axe scan configuration
- Any routes with known violations are documented with issue tracking
- PAGES_DEFERRED array exists with explanations for any untestable routes
- Test run completes within CI timeout constraints
```

---

## 9. Deferred Scope Uncertainty

All items explicitly identified as deferred to V1.1 or V2 in `docs/library/V1_DEFERRED.md` and `docs/library/V1_SCOPE.md` were located and reviewed. The following V1.1/V2 deferrals were confirmed and not penalized:

- Jira, ServiceNow, Confluence first-party connectors (V1.1)
- SOC 2 Type II attestation (V1.1 readiness, V2 completion)
- Third-party penetration testing (V2)
- PGP coordinated-disclosure key (V1.1)
- Cross-tenant analytics (deferred indefinitely)
- Product learning "brains" — deterministic theme derivation and plan-draft builder (deferred)
- ArchiMate, Structurizr, Terraform state import connectors (Planned, no version commitment)
- Generic OIDC provider support (roadmap)

No deferred scope items were identified that could not be located in the markdown source materials.

---

## 10. Pending Questions for Later

### Improvement 1 (First Design-Partner Pilot)
- Do you have any prospects who have seen a demo and expressed interest in a pilot?
- Is the hosted environment at `archlucid.net` currently operational and ready for external access?
- What is the current state of the trial registration flow — can a new user actually sign up and get a working tenant?

### Improvement 2 (Pricing Validation)
- Have you had any informal pricing conversations with prospects?
- Is the $436/mo Team tier within the discretionary budget range for your target buyer, or have you received pushback signals?
- Would you consider a lower "Starter" tier below Team for individual architects or very small teams?

### Improvement 3 (Golden-Cohort Evaluation)
- Do you have cached real LLM responses from any prior test runs that could seed the golden-cohort fixtures?
- What Azure OpenAI model and version are you targeting for production? This affects expected output quality.

### Improvement 5 (Simplified Wizard)
- Is the existing `QuickStartWizard.tsx` the primary wizard component, or has it been superseded by `NewRunWizardClient.tsx`?
- What is the minimum viable information needed to create a meaningful run — just a free-text brief, or do structured fields (technology stack, constraints) materially improve finding quality?

### General
- What is the current monthly Azure spend on the staging/production environment?
- Is there a timeline or external commitment driving V1 launch readiness?
- Are there any active conversations with potential design partners or early adopters?
