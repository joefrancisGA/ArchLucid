> **Reviewed:** 2026-07-22
> **Scope:** Archived marketability assessment snapshots from **2026-04-15** (historical only — not current GTM truth). Canonical buyer narrative: `docs/go-to-market/`.

# Marketability assessment series — 2026-04-15 (consolidated)

Four April 2026 marketability passes preserved in reading order:

1. **Mixed deployment framing — pre-M2** (52/100 headline)
2. **Mixed deployment framing — post-M1+M2** (55/100 headline)
3. **SaaS-only framing — pre-Trust Center** (34/100 headline)
4. **SaaS-only framing — post-Trust Center** (37/100 headline)

Technical quality assessments live under `docs/archive/assessments/`; these files measure **commercial** readiness only.

---
## Mixed framing — pre-M2 (baseline)

**Overall Marketability Score: 52 / 100** (weighted: 37.6% after M1 implementation; was 35.0%)

This is a **marketability** assessment, not a technical quality assessment (which already exists at `docs/QUALITY_ASSESSMENT_2026_04_14_WEIGHTED.md` scoring 68.5% on engineering quality). Marketability measures whether this solution can attract buyers, win competitive evaluations, retain customers, and grow revenue in the enterprise architecture tooling market. The distinction matters: many technically excellent products fail commercially, and many commercially successful products have significant technical gaps.

---

## Methodology

Twenty marketability dimensions are scored 1–100. Each carries a weight (1–10) reflecting its importance to winning and retaining paying customers. Dimensions are ordered by **weighted improvement priority** (weight × gap-from-100), so the areas that matter most for market success and have the most room to grow appear first.

| Range | Meaning |
|-------|---------|
| 90–100 | Market-leading — clear competitive advantage |
| 75–89 | Competitive — can win deals in this area |
| 60–74 | Adequate — not a deal-breaker but not a strength |
| 45–59 | Weak — losing deals because of this |
| Below 45 | Critical — blocking sales or adoption |

---

## Assessments (ordered by weighted improvement priority)

### 1. Go-to-Market Readiness — Score: 28 → 38 / 100 (Weight: 10, Weighted Gap: 720 → 620)

**Justification:**
- No pricing model, licensing strategy, or packaging tiers exist anywhere in the repository or documentation.
- No marketing website, landing page, or product-positioning collateral.
- ~~No competitive positioning document.~~ **Implemented (2026-04-15):** `docs/go-to-market/COMPETITIVE_LANDSCAPE.md` — 10-competitor matrix across EAM incumbents, cloud review tools, and AI-native approaches; head-to-head differentiation tables; positioning gaps for V2.
- No sales enablement materials: no battle cards, no demo scripts beyond the technical `demo-quickstart.md`, no ROI calculator.
- No free trial, freemium tier, or self-service signup pathway.
- Product name still has "rename artifacts" scattered through the codebase (ArchiForge remnants), which would be disqualifying in any customer-facing context.
- ~~The value proposition is technically described but never articulated in buyer-facing language.~~ **Implemented (2026-04-15):** `docs/go-to-market/POSITIONING.md` — positioning statement, three value pillars, elevator pitches (30s/60s/2min), 20+ codebase-grounded proof points, category definition for "AI Architecture Intelligence," tagline options, and messaging guidelines.

**Tradeoffs:** This is a pre-commercialization engineering artifact. GTM readiness requires product marketing investment that may be intentionally deferred until product-market fit is established through pilots.

**Improvement Recommendations (remaining):**
1. Define pricing model (per-seat, per-run, platform fee + consumption) and packaging tiers.
2. ~~Create a competitive positioning document.~~ **Done.**
3. ~~Build a one-page value proposition with buyer personas and pain points.~~ **Done.**
4. Develop a 15-minute demo script that tells a business story (not just technical walkthrough).

---

### 2. Product-Market Fit Clarity — Score: 35 → 45 / 100 (Weight: 9, Weighted Gap: 585 → 495)

**Justification:**
- The product sits at the intersection of two markets: **enterprise architecture management** (LeanIX, Ardoq, MEGA) and **AI-assisted design** (emerging). ~~This is a potentially powerful position but it is not articulated.~~ **Partially addressed (2026-04-15):** `docs/go-to-market/POSITIONING.md` defines the "AI Architecture Intelligence" category and positions ArchLucid at the intersection. `docs/go-to-market/COMPETITIVE_LANDSCAPE.md` §6 identifies best-fit and worst-fit scenarios.
- `V1_SCOPE.md` defines what the product does but not **who buys it** or **what problem they pay to solve**. The document is written for engineers, not for product-market evaluation.
- `PRODUCT_LEARNING.md` (58R) captures pilot feedback signals, which is excellent infrastructure, but there is no evidence of synthesized learnings about product-market fit from actual pilots.
- ~~The "operator" persona is documented; buyer personas are not.~~ **Implemented (2026-04-15):** `docs/go-to-market/BUYER_PERSONAS.md` — three personas (Enterprise Architect, VP Engineering, CTO at a Regulated Enterprise) with pain points, evaluation criteria, objections/responses, demo priorities, and a cross-persona buying dynamics diagram.
- No documented ICP (Ideal Customer Profile): company size, industry verticals, regulatory environment, team structure. The buyer personas provide a foundation but ICP is not formalized.
- The `PILOT_GUIDE.md` focuses on technical setup, not on the pilot success criteria that would validate market fit.

**Tradeoffs:** Documenting PMF prematurely can lead to false confidence. However, the product is at V1 / pilot stage, which is precisely when PMF hypotheses should be explicit and testable.

**Improvement Recommendations (remaining):**
1. Write a PMF hypothesis document: who is the buyer, what pain do they have, how does ArchLucid solve it better than alternatives, what would make them pay.
2. ~~Define 3 buyer personas.~~ **Done.**
3. Create a pilot success scorecard with business-outcome metrics (time saved, consistency gained, risk reduced), not just technical metrics.

---

### 3. Differentiation and Competitive Moat — Score: 38 → 48 / 100 (Weight: 9, Weighted Gap: 558 → 468)

**Justification:**
- The combination of **AI agent orchestration** + **provenance/explainability** + **governance workflows** + **comparison/replay** is genuinely unusual in the market. Most EA tools do not have AI agent pipelines; most AI tools do not have governance and audit depth.
- ~~Differentiation is implicit — no single document explains "why ArchLucid, not [competitor]."~~ **Implemented (2026-04-15):** `docs/go-to-market/COMPETITIVE_LANDSCAPE.md` provides head-to-head differentiation tables for 5 competitor pairs (vs. LeanIX, Ardoq, AWS WAT, ChatGPT/Copilot, Structurizr) and a capability summary grounded in V1 codebase evidence. `docs/go-to-market/POSITIONING.md` articulates value pillars and messaging guidelines.
- ~~`ExplainabilityTrace` is presented as a technical feature, not a business benefit.~~ **Addressed (2026-04-15):** Positioning doc Pillar 2 frames it as "auditable decision trail" — "this is not 'AI said so' — it is a complete decision trail."
- ~~No competitor comparison for provenance graph.~~ **Partially addressed:** Competitive landscape §4.2 compares provenance to Ardoq's visual modeling UX.
- No moat strategy: no proprietary data advantage, no network effects, no switching costs documented. The architecture is open and substitutable (Azure OpenAI can be swapped, SQL Server is standard, no proprietary protocols).
- The `dotnet new archlucid-finding-engine` template suggests extensibility, but there is no ecosystem strategy to build a moat through community or marketplace.

**Tradeoffs:** Building defensibility too early can distract from finding PMF. But at V1 launch, articulating "why us" is essential for pilot conversion.

**Improvement Recommendations (remaining):**
1. ~~Create a competitive landscape analysis document.~~ **Done.**
2. Articulate the "10x better" claim: what specific outcome does ArchLucid deliver that alternatives cannot, with evidence from pilot data.
3. Design a data moat strategy: each run's findings, governance decisions, and learning signals should compound to make the product smarter for that customer over time (currently each run is stateless).

---

### 4. Value Demonstration / ROI Articulation — Score: 30 / 100 (Weight: 7, Weighted Gap: 490)

**Justification:**
- No ROI model or TCO calculator exists.
- No case studies, testimonials, or success stories from pilots.
- The product generates valuable outputs (manifests, findings, governance decisions, DOCX exports) but does not measure the **business value** of those outputs (e.g., "architecture review that previously took 2 weeks now takes 2 hours").
- Per-run LLM cost tracking is identified as a gap in the technical assessment but not addressed. Without cost-per-outcome data, ROI cannot be demonstrated.
- No before/after comparison capability from a business perspective (the comparison/replay system compares technical manifests, not business outcomes).
- The `PILOT_GUIDE.md` has no section on "measuring success" or "proving value to your stakeholders."

**Tradeoffs:** ROI articulation requires pilot data that may not yet exist. However, the framework for measuring it should be designed now, before V1 launches.

**Improvement Recommendations:**
1. Build an ROI model template: inputs (team size, review frequency, current cycle time), outputs (time saved, consistency improvement, compliance gap reduction).
2. Add run-level metrics that feed ROI measurement: elapsed time, finding count, decision count, LLM cost, and track these as a "value delivered" dashboard.
3. Create a pilot success measurement guide that operators share with their leadership.

---

### 5. Customer Success Infrastructure — Score: 32 / 100 (Weight: 7, Weighted Gap: 476)

**Justification:**
- No customer success tooling: no usage analytics, no feature adoption tracking, no health scoring, no churn prediction signals.
- The `ProductLearningPilotSignals` table is an excellent start for capturing feedback, but the "brains" (theme derivation, plan-draft builder) are explicitly deferred.
- No in-app NPS, CSAT, or CES survey mechanism.
- No customer-facing knowledge base or help center (docs are developer-internal documentation, not customer documentation).
- No ticketing or support workflow integration (support bundle and `doctor` command are diagnostic tools, not customer-facing support).
- The `TROUBLESHOOTING.md` is written for internal engineers, not for customers.
- No customer community (forum, Slack, Discord) or feedback portal.

**Tradeoffs:** For a pre-revenue product with a handful of pilots, heavy customer success tooling is premature. But the absence of even basic feedback loops and customer-facing docs will slow pilot-to-paid conversion.

**Improvement Recommendations:**
1. Create a customer-facing documentation site (separate from developer docs) with how-to guides for each buyer persona.
2. Add in-product usage analytics (anonymous telemetry with opt-out) to understand which features pilots actually use.
3. Build a feedback mechanism into the operator UI (even a simple thumbs up/down on findings and manifests).

---

### 6. Time-to-Value / Onboarding Experience — Score: 45 / 100 (Weight: 8, Weighted Gap: 440)

**Justification:**
- Prerequisites are steep for a first evaluation: .NET 10 SDK, SQL Server, Docker Desktop, Node.js 22+. Compare to a SaaS competitor where the evaluator signs up and gets started in minutes.
- The first-run wizard (`/runs/new`) is shipped and well-designed (7 steps, presets, live pipeline tracking), which is good for operators who have already set up the environment.
- `PILOT_GUIDE.md` is thorough but assumes the reader is technical and willing to run CLI commands.
- No hosted demo environment or sandbox that a prospect can explore without installing anything.
- `demo-quickstart.md` requires "Contoso trusted-baseline seed" setup which involves database configuration — this is not a 5-minute demo.
- The `archlucid run --quick` command (simulator mode) is the fastest path to value, but it is buried in CLI documentation and requires environment setup.
- 193+ docs is itself a barrier to entry for evaluators.

**Tradeoffs:** Self-hosted software will always have higher setup friction than SaaS. But even for self-hosted products, a hosted demo/sandbox and a 5-minute video walkthrough are table-stakes for enterprise sales.

**Improvement Recommendations:**
1. Build a hosted sandbox environment where prospects can run the first-run wizard without any local setup.
2. Create a "5-minute value" video walkthrough showing: create run → see findings → review manifest → export DOCX, emphasizing the business outcome.
3. Reduce minimum time-to-first-run to under 10 minutes with a one-command Docker setup (`docker compose --profile full-stack up` exists but needs a truly zero-config path with seeded data).

---

### 7. Ecosystem and Integration Breadth — Score: 40 / 100 (Weight: 6, Weighted Gap: 360)

**Justification:**
- Integration surface exists: REST API, OpenAPI spec, CloudEvents, webhooks, Service Bus, CLI, .NET API client.
- No SDK for non-.NET consumers (Python, JavaScript) — this limits integration by customers who are not .NET shops.
- No connectors to existing architecture tools: cannot import from Structurizr, ArchiMate, Draw.io, Visio, TOGAF ADM tools, or CMDB systems.
- No connector to existing IT service management (ServiceNow, Jira) for finding triage workflows.
- No Terraform provider for managing ArchLucid configuration as code (ironic for a product that values IaC).
- No IDE integration (VS Code, IntelliJ) — noted as out-of-scope for V1 but important for developer-facing market segments.
- No CI/CD pipeline integration examples (GitHub Actions, Azure DevOps, Jenkins) for architecture-as-code workflows.
- The `IFindingEngine` extension point exists but engines cannot be loaded from external assemblies.
- AsyncAPI spec exists, which is good for eventing interop.

**Tradeoffs:** Broad integration is expensive and should follow PMF, not lead it. However, import from existing tools is critical for adoption (customers will not start from zero).

**Improvement Recommendations:**
1. Build import connectors for the top 3 architecture artifact formats (Structurizr DSL, ArchiMate XML, Terraform state).
2. Publish Python and JavaScript SDK auto-generated from the OpenAPI spec.
3. Create CI/CD integration examples (GitHub Actions and Azure DevOps) showing architecture review as a pipeline step.

---

### 8. Multi-Cloud / Platform Breadth — Score: 35 / 100 (Weight: 5, Weighted Gap: 325)

**Justification:**
- Azure-only is explicitly documented: wizard shows other cloud providers as "coming soon" disabled options.
- This immediately disqualifies the product for AWS-primary and GCP-primary customers (which is more than half the market).
- The agent runtime is designed for multi-vendor LLM (`ILlmProvider`), but the infrastructure is Azure-native: Azure OpenAI, Azure SQL, Azure Blob, Azure Service Bus, Azure Container Apps, Entra ID.
- No Kubernetes deployment (Helm chart), which limits deployment to Container Apps or customer-managed containers.
- The architecture request model supports `cloudProvider` as a field, suggesting multi-cloud was envisioned, but only Azure agents produce meaningful results.

**Tradeoffs:** Being Azure-native for V1/pilot is a defensible focus strategy. Azure accounts for ~25% of the cloud market. But excluding 75% of potential customers is a severe marketability constraint.

**Improvement Recommendations:**
1. Add AWS topology/cost/compliance agent capabilities as the first expansion.
2. Abstract infrastructure dependencies (SQL → generic relational, Azure Blob → S3-compatible, Service Bus → generic queue) behind provider interfaces.
3. Create a Helm chart for Kubernetes deployment as an alternative to Container Apps.

---

### 9. Enterprise Readiness — Score: 55 / 100 (Weight: 7, Weighted Gap: 315)

**Justification:**
- Strong foundations: Entra ID integration, RLS for multi-tenancy, private endpoints, STRIDE threat model, RBAC roles, audit trail, OWASP ZAP scanning.
- `CUSTOMER_TRUST_AND_ACCESS.md` is well-structured for enterprise buyers.
- 14 ADRs demonstrate architectural governance discipline.
- Compliance framework mappings (SOC 2, ISO 27001) are missing — identified in technical assessment but critical for enterprise sales.
- No SOC 2 Type II report or readiness assessment.
- GDPR/CCPA data processing documentation is absent. `PII_RETENTION_CONVERSATIONS.md` exists but is internal, not customer-facing.
- No BAA for healthcare customers or data residency guarantees for regulated industries.
- SSO federation is Entra-only; no SAML, no Okta, no generic OIDC. This blocks sales to non-Microsoft-stack enterprises.
- No SLA commitment document (aspirational only, per technical assessment).
- The `DevelopmentBypass` production guard is implemented but the fact that it existed at all would concern an enterprise security review.

**Tradeoffs:** Enterprise readiness is a spectrum. For Azure-first customers, the current posture is reasonable for a V1. For broader enterprise sales, the SSO and compliance gaps are deal-breakers.

**Improvement Recommendations:**
1. Create a SOC 2 Type II readiness assessment and gap analysis.
2. Add generic OIDC support (not just Entra) to address Okta/Auth0/Ping customers.
3. Publish a data processing agreement (DPA) template and data residency documentation.
4. Create a customer-facing security whitepaper.

---

### 10. User Experience Polish — Score: 48 / 100 (Weight: 6, Weighted Gap: 312)

**Justification:**
- The operator UI is functional but explicitly described as a "thin Next.js shell" — this signals utility, not polish.
- 172 `.tsx` files in the UI source, covering runs, manifests, governance, compare, graph, planning, alerts, learning, search, and wizard — good breadth.
- Dark mode toggle is now shipped. Keyboard shortcuts are documented. Radix UI for accessibility foundations. `aria-live` for progress tracking.
- No screenshot-based documentation or visual style guide — buyers evaluating the product cannot see what it looks like without running it.
- No design system documentation (Radix + Tailwind is mentioned but no token system, no component gallery, no brand guidelines).
- The UI is labeled "operator shell" — this framing positions it as a back-office tool, not a product experience. Enterprise architecture tools (LeanIX, Ardoq) invest heavily in UX to justify per-seat pricing.
- No mobile-responsive documentation, though Next.js/Tailwind likely provides basic responsiveness.
- Error messages may not be consistently user-friendly across 50 controllers (noted in technical assessment, directly impacts user experience).
- The provenance graph visualization (`ProvenanceGraphDiagram`) exists but visual quality compared to commercial graph tools (Neo4j Bloom, Ardoq's visualizations) is unknown.

**Tradeoffs:** UX polish follows product-market fit for infrastructure tools. But in the EA market, buyers are often non-technical (enterprise architects, CTOs) who evaluate based on visual impression.

**Improvement Recommendations:**
1. Create a product screenshot gallery (at least 8 screenshots: wizard, run detail, manifest, findings, graph, compare, governance, export) for marketing and documentation use.
2. Invest in the provenance graph visualization to be genuinely compelling — this is a potential "wow factor" differentiator.
3. Reframe the UI from "operator shell" to "Architecture Intelligence Console" or similar product-grade naming.

---

### 11. Content and Thought Leadership — Score: 25 / 100 (Weight: 4, Weighted Gap: 300)

**Justification:**
- No blog, no technical articles, no conference talks, no whitepapers, no webinar recordings.
- No published methodology or framework that positions ArchLucid as a thought leader (e.g., "the ArchLucid Architecture Review Framework").
- 193+ internal docs is extensive knowledge that could be transformed into external content, but none is published.
- No SEO-optimized content that would drive organic discovery.
- The `GLOSSARY.md` defines 20 domain terms — this could be the basis for a "definitive guide to AI-assisted architecture design" but is internal-only.
- No developer relations (DevRel) presence: no open-source contributions, no community engagement, no sample projects beyond the built-in demo.

**Tradeoffs:** Content marketing requires dedicated effort and may be premature before PMF. But in a nascent market category (AI-assisted enterprise architecture), defining the category through content is a massive advantage.

**Improvement Recommendations:**
1. Extract and publish 5–10 blog posts from existing internal documentation (architecture decision records, security model, explainability approach, governance workflow design).
2. Create a "State of AI-Assisted Architecture Design" whitepaper that defines the category and positions ArchLucid.
3. Open-source a non-core component (e.g., the finding engine template, the provenance library) to build developer community.

---

### 12. Scalability of Business Model — Score: 42 / 100 (Weight: 5, Weighted Gap: 290)

**Justification:**
- The product supports multi-tenant data isolation (RLS, scope headers), which is necessary for SaaS but not sufficient.
- No self-service provisioning: a new tenant requires infrastructure setup and configuration.
- No usage metering or billing integration points.
- Per-run economics are opaque: LLM costs per run are not tracked (noted as a gap), making consumption-based pricing impossible without additional work.
- No marketplace listing (Azure Marketplace, AWS Marketplace) or distribution channel.
- The product is deployable but not operable as a SaaS without significant additional platform engineering.
- No white-labeling or OEM capability for consulting firms or platform providers who might resell.

**Tradeoffs:** Building SaaS platform infrastructure before PMF is a common startup mistake. But at V1, understanding the unit economics (cost per run, cost per tenant) is critical for pricing decisions.

**Improvement Recommendations:**
1. Implement per-run cost tracking (LLM tokens × model price + compute time) as the foundation for usage-based pricing.
2. Design a self-service tenant provisioning workflow, even if not implemented yet.
3. Create an Azure Marketplace listing plan with deployment topology documentation.

---

### 13. Buyer Documentation — Score: 30 / 100 (Weight: 4, Weighted Gap: 280)

**Justification:**
- All 193+ docs are written for developers, SREs, and security engineers. No document is written for a CTO, VP Engineering, Enterprise Architect, or procurement officer.
- `V1_READINESS_SUMMARY.md` explicitly says "not a marketing sheet" — and that is the closest thing to an executive document.
- No product datasheet or capability matrix.
- No architecture overview for non-technical stakeholders.
- No "Why ArchLucid" document.
- The README is comprehensive but reads as a developer setup guide, not a product introduction.

**Tradeoffs:** Developer docs should stay developer-focused. Buyer docs are a separate concern and should live in a separate location (marketing site, sales portal).

**Improvement Recommendations:**
1. Create a 2-page product datasheet: problem statement, capabilities, architecture overview (simplified), deployment options, and security posture.
2. Write a "Why ArchLucid" one-pager for enterprise architects.
3. Create a capability matrix comparing ArchLucid features to manual architecture review processes.

---

### 14. Partner and Channel Readiness — Score: 20 / 100 (Weight: 3, Weighted Gap: 240)

**Justification:**
- No partner program, no system integrator relationships, no consulting firm partnerships.
- No white-label or OEM capability.
- No implementation partner documentation or certification program.
- DOCX export for "consulting templates" suggests awareness of consulting firm use cases, but no partnership structure.
- No reseller program or referral mechanism.
- Architecture consulting firms (Deloitte, Accenture, McKinsey Digital, Thoughtworks) would be natural channel partners but no engagement model exists.

**Tradeoffs:** Channel partnerships require product maturity and sales infrastructure. Premature partnership efforts waste time. But understanding the channel strategy informs product design.

**Improvement Recommendations:**
1. Design a consulting firm partnership model: ArchLucid as the platform, consulting firms as implementation and advisory partners.
2. Create customizable DOCX templates that consulting firms can brand with their identity.
3. Document a "partner implementation guide" that describes how a consulting firm would deploy and configure ArchLucid for their client.

---

### 15. Pilot-to-Paid Conversion Path — Score: 40 / 100 (Weight: 4, Weighted Gap: 240)

**Justification:**
- `PILOT_GUIDE.md` and `OPERATOR_QUICKSTART.md` provide good technical onboarding for pilots.
- `V1_RC_DRILL.md` with `v1-rc-drill.ps1` is a structured validation exercise, which is good.
- No commercial pilot agreement template or evaluation guide.
- No pilot success criteria tied to business outcomes.
- No "pilot → production" upgrade path documentation.
- No account expansion playbook (land in one team → expand to the organization).
- The `ProductLearningPilotSignals` system captures feedback but has no workflow for converting positive signals into purchase decisions.
- No champion enablement: how does the internal champion at the pilot customer justify the purchase to their CFO?

**Tradeoffs:** Pilot-to-paid conversion is a sales process problem as much as a product problem. But product infrastructure that supports the conversion (usage data, value metrics, success evidence) is essential.

**Improvement Recommendations:**
1. Create a pilot-to-production upgrade guide (from Development configuration to production hardening).
2. Build a "value report" that can be generated from pilot data: runs completed, findings generated, governance decisions made, time-to-manifest trend.
3. Write a champion enablement kit: executive summary, business case template, and FAQ for procurement.

---

### 16. Vertical / Industry Readiness — Score: 30 / 100 (Weight: 3, Weighted Gap: 210)

**Justification:**
- No industry-specific policy packs, finding engines, or compliance mappings.
- No SOC 2, ISO 27001, HIPAA, PCI DSS, or FedRAMP control mappings (identified in technical assessment as a governance gap).
- The policy pack system is flexible enough to support industry verticals, but no reference implementations exist.
- No industry-specific demo scenarios (financial services architecture review, healthcare system modernization, government cloud migration).
- The "Greenfield web app" and "Modernize legacy system" presets are generic.

**Tradeoffs:** Vertical specialization should follow horizontal product-market fit. But in enterprise sales, "do you support our regulatory requirements" is a qualification question.

**Improvement Recommendations:**
1. Create policy pack reference implementations for the top 2 target verticals (e.g., financial services, healthcare).
2. Map finding categories to compliance framework controls (SOC 2, ISO 27001).
3. Build at least one industry-specific demo scenario with preset and sample data.

---

### 17. Community and Ecosystem — Score: 15 / 100 (Weight: 2, Weighted Gap: 170)

**Justification:**
- No open-source community (the repo appears to be private/internal).
- No developer forum, Discord, Slack channel, or community space.
- No public issue tracker or feature request board.
- No user group or customer advisory board.
- No hackathon, challenge, or community engagement program.
- The `dotnet new archlucid-finding-engine` template is a good foundation for community-contributed engines, but no distribution mechanism exists.

**Tradeoffs:** Community building requires product maturity and dedicated effort. But even a small community of early adopters provides invaluable feedback and creates network effects.

**Improvement Recommendations:**
1. Establish a GitHub Discussions or Discord space for pilot users and early adopters.
2. Open-source the finding engine template and SDK to enable community-contributed engines.

---

### 18. Internationalization / Localization — Score: 22 / 100 (Weight: 2, Weighted Gap: 156)

**Justification:**
- English-only throughout: UI, API responses, finding narratives, DOCX exports, all documentation.
- The technical assessment notes "no multi-language explanations" as a gap.
- No i18n framework in the Next.js UI (no `next-intl` or similar).
- The knowledge graph, findings, and governance systems are all English-language.
- Azure-only deployment limits geographic reach. No data residency options for EU customers.

**Tradeoffs:** i18n is expensive and should follow demand. For a V1 targeting English-speaking Azure customers, this is acceptable. But it limits TAM significantly.

**Improvement Recommendations:**
1. Add i18n framework to the Next.js UI as a foundation (even if only English is supported initially).
2. Externalize all user-facing strings in the API for future translation.

---

### 19. Brand Identity — Score: 30 / 100 (Weight: 2, Weighted Gap: 140)

**Justification:**
- The product name "ArchLucid" is distinctive and has a clear etymology (Architecture + Lucid/clarity). Good name choice.
- No logo, no visual brand, no color palette, no typography system documented.
- The rename from ArchiForge is incomplete with Terraform addresses, workspace paths, and some config still containing "archiforge" — this undermines brand consistency.
- No brand guidelines or usage rules.
- The UI uses Tailwind defaults, not a branded design system.

**Tradeoffs:** Brand investment follows product-market fit. But even a minimal brand (logo + 3 colors + font choice) significantly improves professional perception.

**Improvement Recommendations:**
1. Commission or create a logo and minimal brand guide (colors, typography, logo usage).
2. Apply brand to the UI (custom Tailwind theme, not defaults).

---

### 20. Market Timing / Category Definition — Score: 55 / 100 (Weight: 2, Weighted Gap: 90)

**Justification:**
- The timing is favorable: "AI-assisted enterprise architecture" is an emerging category with high interest but few established players.
- LLM capabilities are improving rapidly, making AI architecture analysis more viable each quarter.
- Enterprise architecture management is a $2B+ market growing at ~10% CAGR, and AI-native entrants have the potential to disrupt incumbents.
- However, the category is also crowded with point-solution AI tools (Copilots, ChatGPT-based architecture reviewers, AI-powered diagramming tools) that solve pieces of the problem.
- ArchLucid's multi-agent orchestration with governance and audit is more comprehensive, but comprehensiveness is harder to sell than simplicity.
- No evidence of urgency or timeline pressure in the product documentation — the market window for AI-native architecture tools is open now but will close as incumbents add AI features.

**Tradeoffs:** Being early in a category is advantageous but requires aggressive market education and adoption driving.

**Improvement Recommendations:**
1. Articulate the category definition: "AI Architecture Intelligence" or similar.
2. Move quickly to establish reference customers before incumbents catch up.

---

## Summary Table (sorted by weighted gap, descending)

| Rank | Marketability Area | Weight | Score | Gap | Weighted Gap | Grade | Changed |
|------|-------------------|--------|-------|-----|-------------|-------|---------|
| 1 | **Go-to-Market Readiness** | 10 | **38** | 62 | **620** | Critical | M1 ↑10 |
| 2 | **Product-Market Fit Clarity** | 9 | **45** | 55 | **495** | Weak | M1 ↑10 |
| 3 | **Value Demo / ROI** | 7 | 30 | 70 | **490** | Critical | |
| 4 | **Customer Success Infra** | 7 | 32 | 68 | **476** | Critical | |
| 5 | **Differentiation & Moat** | 9 | **48** | 52 | **468** | Weak | M1 ↑10 |
| 6 | **Time-to-Value / Onboarding** | 8 | 45 | 55 | **440** | Weak | |
| 7 | **Ecosystem & Integration** | 6 | 40 | 60 | **360** | Critical | |
| 8 | **Multi-Cloud / Platform** | 5 | 35 | 65 | **325** | Critical | |
| 9 | **Enterprise Readiness** | 7 | 55 | 45 | **315** | Weak | |
| 10 | **UX Polish** | 6 | 48 | 52 | **312** | Weak | |
| 11 | **Content & Thought Leadership** | 4 | 25 | 75 | **300** | Critical | |
| 12 | **Business Model Scalability** | 5 | 42 | 58 | **290** | Critical | |
| 13 | **Buyer Documentation** | 4 | 30 | 70 | **280** | Critical | |
| 14 | **Partner & Channel** | 3 | 20 | 80 | **240** | Critical | |
| 15 | **Pilot-to-Paid Conversion** | 4 | 40 | 60 | **240** | Critical | |
| 16 | **Vertical / Industry** | 3 | 30 | 70 | **210** | Critical | |
| 17 | **Community & Ecosystem** | 2 | 15 | 85 | **170** | Critical | |
| 18 | **Internationalization** | 2 | 22 | 78 | **156** | Critical | |
| 19 | **Brand Identity** | 2 | 30 | 70 | **140** | Critical | |
| 20 | **Market Timing** | 2 | 55 | 45 | **90** | Weak | |

**Overall weighted marketability score:** 3,990 / 10,600 = **37.6%** (was 35.0% before M1)

**Unweighted average:** 37.3 / 100 (was 35.0)

**Interpretation:** The product has strong engineering foundations (68.5% technical quality) but pre-commercial marketability (37.6%). Improvement M1 (positioning, personas, competitive landscape) raised the three highest-weighted areas by 10 points each, moving GTM from Critical to upper-Critical, PMF from Critical to Weak, and Differentiation from Critical to Weak. The remaining gap is primarily execution: pricing, demo experience, customer success infrastructure, and ecosystem breadth. The engineering investment is solid; the commercial investment is now started but early.

---

## Six Best Improvements (ordered by weighted impact and feasibility)

These six improvements are selected for maximum marketability impact per unit of effort, considering both the weight of the area and the feasibility given the current codebase and team.

### Improvement 1: Product Positioning and Competitive Analysis Document (GTM + PMF + Differentiation; combined weighted gap: 1,863 → 1,583)

**Status: Implemented (2026-04-15)**

**What:** Create three interconnected documents: (a) a competitive landscape analysis, (b) buyer persona definitions, and (c) a product positioning statement. These are foundational for every downstream GTM activity.

**Delivered:**
- **`docs/go-to-market/COMPETITIVE_LANDSCAPE.md`** — Market context and category definition; competitor matrix across 10 alternatives (EAM incumbents, cloud review tools, AI-native approaches); head-to-head differentiation tables for 5 pairs; top 5 positioning gaps for V2; best-fit / worst-fit scenario analysis.
- **`docs/go-to-market/BUYER_PERSONAS.md`** — Three detailed personas (Enterprise Architect, VP Engineering, CTO at Regulated Enterprise) with profile tables, pain points mapped to product features, evaluation criteria, champion/rejection triggers, objection responses, demo priorities, and cross-persona buying dynamics Mermaid diagram.
- **`docs/go-to-market/POSITIONING.md`** — Positioning statement; three value pillars (AI-native analysis, auditable decision trail, enterprise governance); elevator pitches (30s, 60s, 2min); 20+ proof points grounded in codebase evidence; category definition diagram; tagline options; messaging do/don't guidelines.

**Impact:** GTM 28→38, PMF 35→45, Differentiation 38→48. Overall weighted score 35.0%→37.6%.

**Why this was the best first improvement:** The top 3 weighted gaps (GTM, PMF, Differentiation) are all addressed by this single body of work. Without positioning, pricing, demos, content, and sales materials are all impossible to do well.

**Cursor Prompts:**

```
Improvement M1 — Prompt `competitive-landscape`

Create docs/go-to-market/COMPETITIVE_LANDSCAPE.md with the following structure:

1. Market context: Define the "AI-Assisted Architecture Intelligence" category and
   its relationship to traditional Enterprise Architecture Management (EAM).

2. Competitor matrix: Create a comparison table with columns for:
   - Product name, vendor, pricing model, deployment model
   - AI capability depth (none/basic copilot/agent orchestration)
   - Governance & audit depth (none/basic/workflow/full lifecycle)
   - Explainability (none/basic/trace-level)
   - Multi-cloud support
   - Integration ecosystem maturity

   Include these competitors:
   Incumbents: LeanIX (SAP), Ardoq, MEGA HOPEX, Sparx EA, ServiceNow CSDM
   AI entrants: Structurizr (with AI), Diagrams-as-Code tools, GitHub Copilot for
   architecture, AWS Well-Architected Tool, Azure Architecture Center

3. ArchLucid differentiation: For each competitor, state the 1-2 things ArchLucid
   does better and the 1-2 things the competitor does better. Be honest.

4. Positioning gaps: Identify the top 3 competitive weaknesses ArchLucid must close
   for V2.

Base technical capability claims on what the repository actually ships today — read
V1_SCOPE.md, ARCHITECTURE_CONTEXT.md, and the QUALITY_ASSESSMENT_2026_04_14_WEIGHTED.md
for accurate feature inventory. Do not invent capabilities.
```

```
Improvement M1 — Prompt `buyer-personas`

Create docs/go-to-market/BUYER_PERSONAS.md with three buyer personas:

For each persona, document:
- Title and role (e.g., "Enterprise Architect at a mid-large enterprise")
- Responsibilities and goals
- Pain points that ArchLucid addresses
- How they evaluate tools (criteria, process, timeline)
- What would make them champion ArchLucid internally
- What would make them reject ArchLucid
- Typical budget authority and procurement process
- Key objections and responses

Personas:
1. Enterprise Architect / Chief Architect — cares about consistency, governance, audit
   trail, compliance. Evaluates against TOGAF/ArchiMate tooling tradition.

2. VP Engineering / Head of Platform Engineering — cares about developer experience,
   automation, CI/CD integration, cost. Evaluates against "build vs buy" and
   developer-facing tools.

3. CTO / CIO at a regulated enterprise — cares about risk, compliance, vendor
   viability, total cost. Makes or approves the purchase decision.

Reference ArchLucid's actual capabilities from V1_SCOPE.md, PILOT_GUIDE.md, and
CUSTOMER_TRUST_AND_ACCESS.md. Reference competitive alternatives from the competitive
landscape document.
```

```
Improvement M1 — Prompt `positioning-statement`

Create docs/go-to-market/POSITIONING.md with:

1. One-paragraph positioning statement following the format:
   "For [target buyer] who [pain point], ArchLucid is the [category] that
   [key benefit]. Unlike [alternatives], ArchLucid [differentiator]."

2. Three value pillars (each 2-3 sentences):
   - Pillar 1: AI-native architecture analysis (multi-agent orchestration, not
     just a chatbot)
   - Pillar 2: Auditable decision trail (ExplainabilityTrace, provenance graph,
     governance workflow — every recommendation is justified and traceable)
   - Pillar 3: Enterprise governance (policy packs, approval workflows,
     segregation of duties, durable audit — architecture decisions are
     governed, not ad-hoc)

3. Elevator pitch (30 seconds, 60 seconds, 2 minutes)

4. Key proof points from the codebase:
   - Number of finding engines (9+)
   - ExplainabilityTrace fields on every finding
   - Governance workflow with segregation of duties
   - 78 typed audit event types
   - Multi-agent pipeline (topology, cost, compliance, critic)
   - Comparison/replay for architectural drift detection

Ground all claims in what the repository actually ships (V1_SCOPE.md,
README.md, GLOSSARY.md).
```

---

### Improvement 2: Product Datasheet and Screenshot Gallery (Buyer Docs + GTM + UX Polish; combined weighted gap: 1,312)

**What:** Create a 2-page product datasheet PDF-ready document and a screenshot gallery showing 8–10 key product screens with annotations.

**Why:** Enterprise buyers cannot evaluate a product from developer documentation. A datasheet and screenshots are the minimum collateral needed for sales conversations.

**Cursor Prompts:**

```
Improvement M2 — Prompt `product-datasheet`

Create docs/go-to-market/PRODUCT_DATASHEET.md (designed to be exported to PDF) with:

1. Header: ArchLucid logo placeholder, tagline, one-sentence description
2. Problem statement (3 sentences): Why manual architecture review is broken
   (inconsistent, undocumented, slow, non-repeatable)
3. Solution overview (3 sentences): What ArchLucid does and how
4. Key capabilities table (6 rows):
   - AI Architecture Analysis (multi-agent pipeline)
   - Governance & Compliance (policy packs, approval workflow, pre-commit gates)
   - Explainable Decisions (trace on every finding, provenance graph)
   - Architecture Drift Detection (compare, replay, verify)
   - Export & Reporting (DOCX, Markdown, ZIP bundles)
   - Enterprise Security (Entra ID, RLS, RBAC, audit, private endpoints)
5. Architecture diagram (simplified Mermaid: client → API → agents → manifest)
6. Deployment options: Azure Container Apps, Docker, self-hosted
7. Integration points: REST API, CLI, webhooks, Service Bus, OpenAPI
8. "Get started" call to action

Use docs/ARCHITECTURE_CONTEXT.md, README.md, V1_SCOPE.md, and
CUSTOMER_TRUST_AND_ACCESS.md as source material. Write for a CTO audience,
not for developers. No internal jargon. No more than 2 pages when rendered.
```

```
Improvement M2 — Prompt `screenshot-annotations`

Create docs/go-to-market/SCREENSHOT_GALLERY.md documenting the 10 key product
screenshots that should be captured from the running operator UI:

For each screenshot, document:
- Screen name and URL path
- What should be visible (data state, expanded sections)
- Annotation overlay text (2-3 callout labels highlighting key features)
- Caption text for marketing use

Screenshots to document:
1. First-run wizard — preset selection (/runs/new)
2. First-run wizard — review step with populated fields
3. Run detail with completed pipeline stages (/runs/{runId})
4. Golden manifest summary with findings
5. Provenance graph visualization (/runs/{runId}/provenance)
6. Run comparison side-by-side (/compare)
7. Governance dashboard with compliance drift chart
8. Audit event log with filters
9. Knowledge graph viewer (/graph)
10. DOCX export preview (or artifact list with download links)

This document is the brief for a screenshot capture session. Someone with a
running ArchLucid environment (with demo seed data) should be able to follow
it and produce all 10 screenshots.
```

---

### Improvement 3: Hosted Demo / Zero-Config Docker Experience (Time-to-Value; weighted gap: 440)

**What:** Create a truly zero-configuration `docker compose` experience with pre-seeded data that lets a prospect see value in under 5 minutes.

**Cursor Prompts:**

```
Improvement M3 — Prompt `zero-config-demo`

Enhance the Docker Compose full-stack profile so that a prospect can run one command
and see a fully functional ArchLucid with demo data:

1. Read docker-compose.yml and docs/CONTAINERIZATION.md to understand the current
   full-stack profile.

2. Create a docker-compose.demo.yml (or an override) that:
   - Uses full-stack profile (API + UI + SQL + Redis + Azurite)
   - Sets Demo:Enabled=true and Demo:SeedOnStartup=true
   - Sets AgentExecution:Mode=Simulator
   - Sets ArchLucidAuth:Mode=DevelopmentBypass
   - Pre-configures the UI proxy to point to the API container
   - Exposes UI on port 3000 and API on port 5128

3. Create scripts/demo-start.ps1 and scripts/demo-start.sh that:
   - Check Docker is running
   - Run docker compose -f docker-compose.yml -f docker-compose.demo.yml
     --profile full-stack up -d --build
   - Wait for health/ready
   - Open the browser to http://localhost:3000/runs/new
   - Print: "ArchLucid is ready. Open http://localhost:3000 to start."

4. Create docs/go-to-market/DEMO_QUICKSTART.md (buyer-facing, not developer-facing):
   - Prerequisites: Docker Desktop only
   - One command to start
   - 5-minute guided walkthrough (create run → see findings → review manifest →
     export DOCX → compare two runs)
   - Cleanup command

Do not change production docker-compose.yml behavior. The demo overlay is additive.
Test that docker compose config validates with both files.
```

---

### Improvement 4: ROI Model and Pilot Success Scorecard (Value Demo + Pilot Conversion; combined weighted gap: 730)

**What:** Create an ROI model template and pilot success measurement guide.

**Cursor Prompts:**

```
Improvement M4 — Prompt `roi-model`

Create docs/go-to-market/ROI_MODEL.md with:

1. Objective: Help pilot champions build a business case for purchasing ArchLucid.

2. Cost of the status quo (inputs to collect from the customer):
   - Number of architecture reviews per quarter
   - Average hours per review (architect time + stakeholder review + documentation)
   - Average architect fully-loaded cost per hour
   - Number of compliance gaps found in production (post-deployment)
   - Average cost of a compliance remediation
   - Number of architecture inconsistencies across teams

3. ArchLucid value model (mapped to product capabilities):
   - Time reduction: architecture review cycle from X weeks to Y hours
     (map to: run lifecycle + AI agents + automated manifest)
   - Consistency improvement: standardized findings across all reviews
     (map to: policy packs + finding engines)
   - Compliance shift-left: findings before deployment, not after
     (map to: governance gate + pre-commit checks)
   - Audit trail: automatic vs. manual documentation
     (map to: audit events + DOCX export + provenance)
   - Knowledge reuse: comparison/replay across iterations
     (map to: compare + replay + golden manifest versioning)

4. ROI calculation template:
   - Annual cost of status quo
   - Annual cost with ArchLucid (license + infrastructure + LLM consumption)
   - Net savings and payback period
   - Intangible benefits (consistency, auditability, speed)

5. Example scenario: "A 200-person engineering organization doing 12 architecture
   reviews per quarter at 40 hours each..."

Ground the value claims in actual product capabilities from V1_SCOPE.md and
ARCHITECTURE_CONTEXT.md. Do not overstate. Use conservative estimates.
```

```
Improvement M4 — Prompt `pilot-success-scorecard`

Create docs/go-to-market/PILOT_SUCCESS_SCORECARD.md with:

1. Purpose: Structured measurement framework for ArchLucid pilots, designed to
   generate evidence for a purchase decision.

2. Quantitative metrics (measure before and after):
   - Time to complete an architecture review (hours)
   - Number of findings identified per review
   - Percentage of findings with full explainability trace
   - Architecture consistency score (compare two runs for same system)
   - Governance compliance rate (percentage of runs passing pre-commit gate)

3. Qualitative metrics (collect via stakeholder interviews):
   - Architect satisfaction (1-5): "Did ArchLucid save you meaningful time?"
   - Stakeholder confidence (1-5): "Do you trust the AI-generated recommendations?"
   - Decision quality (1-5): "Were the findings actionable and accurate?"
   - Governance satisfaction (1-5): "Is the approval workflow appropriate?"

4. Data collection plan:
   - Week 1: Baseline measurement (manual process metrics)
   - Weeks 2-4: ArchLucid pilot execution (3-5 real architecture reviews)
   - Week 5: Post-pilot measurement and stakeholder interviews
   - Week 6: Results synthesis and go/no-go recommendation

5. Success criteria:
   - Minimum: 30% time reduction on architecture reviews
   - Target: 50% time reduction with comparable or better finding quality
   - Stretch: Findings that the manual process missed

6. Report template: Structure for the "Pilot Results" document the champion
   presents to leadership.

Reference PILOT_GUIDE.md and PRODUCT_LEARNING.md for data collection mechanisms
already available in the product.
```

---

### Improvement 5: Generic OIDC Support (Enterprise Readiness; weighted gap: 315)

**What:** Add generic OIDC provider support alongside Entra ID, so non-Microsoft-stack enterprises (Okta, Auth0, Ping) can adopt ArchLucid.

**Cursor Prompt:**

```
Improvement M5 — Prompt `generic-oidc-auth`

Add a generic OIDC authentication mode to ArchLucid alongside the existing
JwtBearer (Entra) mode:

1. Read ArchLucid.Host.Core/Startup/ for existing auth registration (AddArchLucidAuth,
   ArchLucidAuthOptions, ArchLucidRoleClaimsTransformation). Read ArchLucid.Api/Program.cs
   for how auth is wired.

2. Extend ArchLucidAuth:Mode to support a new value: "OpenIdConnect" (in addition to
   DevelopmentBypass, JwtBearer, ApiKey).

3. When Mode is "OpenIdConnect", configure authentication using:
   - ArchLucidAuth:OpenIdConnect:Authority (issuer URL, e.g., https://dev-123.okta.com)
   - ArchLucidAuth:OpenIdConnect:ClientId
   - ArchLucidAuth:OpenIdConnect:Audience (optional, for token validation)
   - ArchLucidAuth:OpenIdConnect:RoleClaimType (default: "roles", configurable for
     providers that use different claim names like "groups" or "permissions")
   - ArchLucidAuth:OpenIdConnect:AdminRoleValue (default: "Admin")
   - ArchLucidAuth:OpenIdConnect:OperatorRoleValue (default: "Operator")
   - ArchLucidAuth:OpenIdConnect:ReaderRoleValue (default: "Reader")

4. Reuse ArchLucidRoleClaimsTransformation to map provider-specific role claims to
   ArchLucid's internal role/policy system.

5. Add appsettings.Okta.sample.json and appsettings.Auth0.sample.json with example
   configurations.

6. Add tests in ArchLucid.Host.Composition.Tests:
   - OpenIdConnect mode registers expected authentication services
   - Role claim mapping works with configurable claim types
   - AuthSafetyGuard still blocks DevelopmentBypass in production

7. Update docs/SECURITY.md with a "Generic OIDC" section and provider-specific notes.

8. Update CUSTOMER_TRUST_AND_ACCESS.md to mention OIDC support.

Keep JwtBearer mode exactly as-is for Entra customers. The new mode is additive.
Use Microsoft.AspNetCore.Authentication.JwtBearer with custom TokenValidationParameters
(not Microsoft.Identity.Web) for maximum provider compatibility.
```

---

### Improvement 6: CI/CD Integration Examples and Import Connectors (Ecosystem; weighted gap: 360)

**What:** Create GitHub Actions and Azure DevOps pipeline examples that show ArchLucid as a step in architecture-as-code workflows, plus a Terraform state import connector.

**Cursor Prompts:**

```
Improvement M6 — Prompt `cicd-integration-examples`

Create docs/integrations/CICD_INTEGRATION.md and example pipeline files:

1. docs/integrations/CICD_INTEGRATION.md:
   - Why integrate ArchLucid into CI/CD (architecture review as a pipeline gate,
     drift detection on infrastructure changes, compliance checks before deploy)
   - Pattern: PR triggers ArchLucid run → findings as PR comment → governance
     gate blocks merge if Critical findings exist

2. examples/github-actions/archlucid-review.yml:
   - GitHub Actions workflow triggered on PR to main
   - Steps: checkout → create ArchLucid run via API → wait for completion →
     post findings summary as PR comment → fail if Critical findings
   - Uses curl against the ArchLucid API (no custom action needed)
   - Configuration via GitHub Secrets (ARCHLUCID_API_URL, ARCHLUCID_API_KEY)

3. examples/azure-devops/archlucid-review.yml:
   - Azure DevOps pipeline equivalent
   - Uses PowerShell tasks with Invoke-RestMethod

4. For both: document the API calls used:
   - POST /v1/architecture/request (create run with description from PR)
   - POST /v1/architecture/run/{runId}/execute
   - GET /v1/architecture/run/{runId} (poll until completed)
   - GET /v1/authority/runs/{runId}/findings-snapshot (get findings)
   - POST /v1/architecture/run/{runId}/commit

Reference API_CONTRACTS.md and CLI_USAGE.md for API shapes. These are example
files only — they should work but are templates for customization.
```

```
Improvement M6 — Prompt `terraform-state-import`

Design and implement a context connector that imports Terraform state as
ArchLucid context:

1. Read ArchLucid.ContextIngestion/ for existing IContextConnector implementations
   and the CanonicalObject model.

2. Create ArchLucid.ContextIngestion/Connectors/TerraformStateConnector.cs:
   - Implements IContextConnector
   - Accepts Terraform state JSON (output of terraform show -json)
   - Extracts resources, data sources, and their attributes
   - Maps to CanonicalObject records:
     - Each resource → node with type, name, provider, key attributes
     - Resource dependencies → edges between nodes
   - Handles both terraform state and terraform plan JSON formats

3. Add infrastructure declarations support in the wizard:
   - format: "terraform-state" triggers this connector
   - content: paste or upload the JSON

4. Tests in ArchLucid.ContextIngestion.Tests:
   - Parse a sample Terraform state (Azure resource group + app service + SQL)
   - Verify CanonicalObject output: correct types, names, relationships
   - Handle empty state, state with no resources, malformed JSON

5. Update docs/CONTEXT_INGESTION.md with a "Terraform state" section.

This enables the "architecture review of existing infrastructure" use case,
which is critical for the modernization persona.
```

---

## Mixed framing — post-M1+M2

**Overall Marketability Score: 55 / 100** | Weighted: **39.9%**

This is a **marketability** assessment — not a technical quality assessment (see `docs/QUALITY_ASSESSMENT_2026_04_14_WEIGHTED.md`, 68.5%). Marketability measures whether the solution can attract buyers, win competitive evaluations, retain customers, and grow revenue in the enterprise architecture tooling market.

**Prior versions:** `docs/archive/MARKETABILITY_ASSESSMENT_2026_04_15_PRE_M2.md` (pre-M2, 37.6% weighted).

**What changed since last assessment:** Improvement M1 (positioning, personas, competitive landscape) and M2 (product datasheet, screenshot gallery) delivered five documents into `docs/go-to-market/`.

---

## Methodology

Twenty marketability dimensions scored 1–100. Each carries a weight (1–10) reflecting importance to winning and retaining paying customers. Dimensions ordered by **weighted improvement priority** (weight × gap), most-needed-improvement first.

| Range | Meaning |
|-------|---------|
| 90–100 | Market-leading — clear competitive advantage |
| 75–89 | Competitive — can win deals in this area |
| 60–74 | Adequate — not a deal-breaker but not a strength |
| 45–59 | Weak — losing deals because of this |
| Below 45 | Critical — blocking sales or adoption |

---

## Assessments (ordered by weighted improvement priority)

### 1. Go-to-Market Readiness — Score: 40 / 100 (Weight: 10, Weighted Gap: 600)

**Justification:**
- No pricing model, licensing strategy, or packaging tiers.
- No marketing website or landing page.
- **Implemented (M1):** Competitive positioning document (`COMPETITIVE_LANDSCAPE.md`) — 10-competitor matrix, head-to-head differentiation, positioning gaps.
- **Implemented (M1):** Positioning statement, value pillars, elevator pitches, category definition, messaging guidelines (`POSITIONING.md`).
- **Implemented (M2):** Product datasheet (`PRODUCT_DATASHEET.md`) — 2-page buyer-facing collateral ready for PDF export.
- No demo script beyond the technical `demo-quickstart.md`.
- No free trial, freemium tier, or self-service signup pathway.
- ArchiForge remnants remain in Terraform addresses and workspace path.

**Tradeoffs:** GTM readiness requires product marketing investment that may be intentionally deferred until PMF is validated. However, the M1+M2 documents now provide the minimum collateral for a sales conversation.

**Improvement Recommendations:**
1. Define pricing model (per-seat, per-run, platform fee + consumption) and packaging tiers.
2. Develop a 15-minute demo script that tells a business story (not just technical walkthrough).
3. Build a landing page or single-page marketing site using content from the datasheet and positioning docs.

---

### 2. Product-Market Fit Clarity — Score: 47 / 100 (Weight: 9, Weighted Gap: 477)

**Justification:**
- **Implemented (M1):** Buyer personas document (`BUYER_PERSONAS.md`) — three personas with pain points, evaluation criteria, objections, demo priorities, and buying dynamics.
- **Implemented (M1):** Category definition and best-fit/worst-fit scenarios in `COMPETITIVE_LANDSCAPE.md` §6 and `POSITIONING.md` §5.
- `PRODUCT_LEARNING.md` captures pilot feedback signals but no synthesized PMF learnings from actual pilots.
- No documented ICP (Ideal Customer Profile): company size, industry verticals, regulatory environment.
- `PILOT_GUIDE.md` focuses on technical setup, not business success criteria.

**Tradeoffs:** PMF hypotheses exist now (via personas and positioning) but are untested against real buyer data.

**Improvement Recommendations:**
1. Write a PMF hypothesis document with testable success criteria.
2. Formalize an ICP from the buyer personas (company size, industry, regulatory posture).
3. Create a pilot success scorecard with business-outcome metrics.

---

### 3. Value Demonstration / ROI Articulation — Score: 30 / 100 (Weight: 7, Weighted Gap: 490)

**Justification:**
- No ROI model or TCO calculator.
- No case studies, testimonials, or pilot success stories.
- Per-run LLM cost tracking is a known gap — ROI cannot be demonstrated without cost-per-outcome data.
- The datasheet (M2) articulates value but does not quantify it.
- No "measuring success" guidance for pilot champions.

**Tradeoffs:** ROI articulation requires pilot data. The framework for measurement should be designed now.

**Improvement Recommendations:**
1. Build an ROI model template: inputs (team size, review frequency, cycle time), outputs (time saved, compliance gaps caught).
2. Add run-level metrics that feed ROI measurement: elapsed time, finding count, LLM cost.
3. Create a pilot success measurement guide.

---

### 4. Customer Success Infrastructure — Score: 32 / 100 (Weight: 7, Weighted Gap: 476)

**Justification:**
- No usage analytics, feature adoption tracking, or health scoring.
- `ProductLearningPilotSignals` exists but "brains" are deferred.
- No in-app feedback mechanism, NPS/CSAT survey, or customer community.
- No customer-facing knowledge base (docs are developer-internal).
- Support bundle and `doctor` are diagnostic tools, not customer-facing support.

**Tradeoffs:** Heavy customer success tooling is premature for pre-revenue. But basic feedback loops are needed for pilot-to-paid conversion.

**Improvement Recommendations:**
1. Create a customer-facing documentation site separate from developer docs.
2. Add in-product usage analytics (anonymous, opt-out).
3. Build a feedback mechanism into the operator UI (thumbs up/down on findings).

---

### 5. Differentiation and Competitive Moat — Score: 50 / 100 (Weight: 9, Weighted Gap: 450)

**Justification:**
- **Implemented (M1):** Head-to-head differentiation tables for 5 competitor pairs (`COMPETITIVE_LANDSCAPE.md` §4). Category definition in `POSITIONING.md` §5.
- **Implemented (M1):** Value pillars frame `ExplainabilityTrace` as a business benefit, not just a technical feature.
- **Implemented (M2):** Datasheet makes capabilities accessible to non-technical evaluators.
- No moat strategy: no proprietary data advantage, no network effects, no switching costs.
- No ecosystem strategy to build defensibility through community or marketplace.

**Tradeoffs:** Defensibility too early distracts from PMF. But "why us" is now articulated and available for every sales conversation.

**Improvement Recommendations:**
1. Articulate a "10x better" claim with evidence from pilot data.
2. Design a data moat strategy: findings and learning signals compound over time for each customer.
3. Create an ecosystem strategy around the finding engine template.

---

### 6. Time-to-Value / Onboarding Experience — Score: 45 / 100 (Weight: 8, Weighted Gap: 440)

**Justification:**
- Prerequisites are steep: .NET 10 SDK, SQL Server, Docker Desktop, Node.js 22+.
- First-run wizard is shipped and well-designed (7 steps, presets, live tracking).
- `PILOT_GUIDE.md` is thorough but assumes a technical reader.
- No hosted demo/sandbox environment.
- `demo-quickstart.md` requires database configuration — not a 5-minute demo.
- **Implemented (M2):** Screenshot gallery provides a visual preview for prospects who cannot yet run the product.

**Tradeoffs:** Self-hosted software has inherent setup friction. A zero-config Docker demo would dramatically reduce time-to-first-impression.

**Improvement Recommendations:**
1. Build a zero-config Docker demo (`docker-compose.demo.yml`) with pre-seeded data.
2. Create a "5-minute value" video walkthrough.
3. Reduce minimum time-to-first-run to under 10 minutes.

---

### 7. Ecosystem and Integration Breadth — Score: 40 / 100 (Weight: 6, Weighted Gap: 360)

**Justification:**
- Integration surface exists: REST API, OpenAPI, CloudEvents, webhooks, Service Bus, CLI, .NET API client.
- No SDK for non-.NET consumers (Python, JavaScript).
- No connectors to existing architecture tools (Structurizr, ArchiMate, CMDB, Terraform state).
- No ITSM integration (ServiceNow, Jira).
- No CI/CD pipeline examples (GitHub Actions, Azure DevOps).
- AsyncAPI spec exists.

**Tradeoffs:** Broad integration follows PMF. Import from existing tools is critical for adoption.

**Improvement Recommendations:**
1. Build import connectors for top 3 architecture artifact formats (Structurizr DSL, ArchiMate XML, Terraform state).
2. Publish Python and JavaScript SDKs from the OpenAPI spec.
3. Create CI/CD integration examples.

---

### 8. Multi-Cloud / Platform Breadth — Score: 35 / 100 (Weight: 5, Weighted Gap: 325)

**Justification:**
- Azure-only. Other cloud providers disabled as "coming soon" in the wizard.
- Disqualifies AWS-primary and GCP-primary customers (>50% of market).
- Agent runtime designed for multi-vendor LLM but infrastructure is Azure-native.
- No Helm chart for Kubernetes deployment.

**Tradeoffs:** Azure-native is a defensible V1 focus but limits addressable market severely.

**Improvement Recommendations:**
1. Add AWS topology/cost/compliance agent capabilities.
2. Abstract infrastructure dependencies behind provider interfaces.
3. Create a Helm chart for Kubernetes deployment.

---

### 9. Enterprise Readiness — Score: 55 / 100 (Weight: 7, Weighted Gap: 315)

**Justification:**
- Strong foundations: Entra ID, RLS, private endpoints, STRIDE threat model, RBAC, audit trail, ZAP/Schemathesis.
- `CUSTOMER_TRUST_AND_ACCESS.md` is well-structured. 14 ADRs.
- No SOC 2 report or readiness assessment. No compliance framework mappings.
- No GDPR/CCPA DPA template. No BAA. No data residency guarantees.
- Entra-only SSO — blocks non-Microsoft-stack enterprises.
- No SLA commitment document.

**Tradeoffs:** For Azure-first customers the posture is reasonable for V1. Broader enterprise sales need SSO and compliance documentation.

**Improvement Recommendations:**
1. Create a SOC 2 readiness gap analysis.
2. Add generic OIDC support (Okta, Auth0, Ping).
3. Publish a DPA template and data residency doc.

---

### 10. User Experience Polish — Score: 50 / 100 (Weight: 6, Weighted Gap: 300)

**Justification:**
- Operator UI has good breadth: 172 `.tsx` files across runs, manifests, governance, compare, graph, planning, alerts, wizard, search.
- Dark mode, keyboard shortcuts, Radix UI, `aria-live`, sidebar navigation, collapsible groups.
- **Implemented (M2):** Screenshot gallery with 10 capture briefs, annotation guidance, and output conventions provides a path to visual collateral.
- No design system documentation or component gallery.
- UI is labeled "operator shell" — back-office framing, not product-grade.
- No screenshot-based walkthrough yet (gallery defines what to capture but screenshots not yet taken).

**Tradeoffs:** UX polish follows PMF. But in the EA market, non-technical buyers evaluate on visual impression.

**Improvement Recommendations:**
1. Execute the screenshot capture brief and produce the annotated set.
2. Reframe the UI from "operator shell" to "Architecture Intelligence Console."
3. Build a design system doc (color tokens, component gallery).

---

### 11. Content and Thought Leadership — Score: 25 / 100 (Weight: 4, Weighted Gap: 300)

**Justification:**
- No blog, articles, conference talks, whitepapers, or webinar recordings.
- 193+ internal docs is extensive knowledge that could be externalized — none is published.
- No SEO-optimized content. No DevRel presence.
- **Implemented (M1):** Category definition ("AI Architecture Intelligence") in `POSITIONING.md` §5 could serve as the foundation for a category-defining whitepaper.

**Tradeoffs:** Content marketing is premature before PMF. But defining the category through content is a massive advantage in a nascent market.

**Improvement Recommendations:**
1. Extract 5–10 blog posts from internal docs (ADRs, security model, explainability, governance workflow).
2. Create a "State of AI-Assisted Architecture Design" whitepaper.
3. Open-source a non-core component to build developer community.

---

### 12. Business Model Scalability — Score: 42 / 100 (Weight: 5, Weighted Gap: 290)

**Justification:**
- Multi-tenant RLS exists. No self-service provisioning.
- No usage metering or billing integration. Per-run LLM costs not tracked.
- No marketplace listing. Not operable as SaaS without additional platform engineering.
- No white-labeling or OEM capability.

**Tradeoffs:** Building SaaS infrastructure before PMF is premature. Understanding unit economics now is critical for pricing.

**Improvement Recommendations:**
1. Implement per-run cost tracking (LLM tokens × model price + compute time).
2. Design a self-service tenant provisioning workflow.
3. Create an Azure Marketplace listing plan.

---

### 13. Buyer Documentation — Score: 40 / 100 (Weight: 4, Weighted Gap: 240)

**Justification:**
- All 193+ docs are written for developers/SREs/security engineers.
- **Implemented (M2):** Product datasheet (`PRODUCT_DATASHEET.md`) is the first buyer-facing document. Written for CTO audience.
- **Implemented (M1):** Positioning and personas docs provide buyer-facing language and framing.
- No architecture overview for non-technical stakeholders beyond the datasheet.
- No "Why ArchLucid" standalone one-pager (positioning doc contains the content but is multi-page).

**Tradeoffs:** Developer docs should stay developer-focused. Buyer docs now have a foundation in `go-to-market/`.

**Improvement Recommendations:**
1. Create a "Why ArchLucid" one-pager extracted from the positioning doc.
2. Create a capability matrix comparing ArchLucid to manual architecture review.
3. Build a buyer-facing FAQ document.

---

### 14. Pilot-to-Paid Conversion Path — Score: 40 / 100 (Weight: 4, Weighted Gap: 240)

**Justification:**
- `PILOT_GUIDE.md` and `OPERATOR_QUICKSTART.md` provide good technical onboarding.
- **Implemented (M1):** Buyer personas include demo priorities and objection responses — useful for conversion conversations.
- No commercial pilot agreement template. No pilot success criteria tied to business outcomes.
- No "pilot → production" upgrade path. No account expansion playbook.
- No champion enablement kit.

**Tradeoffs:** Conversion is a sales process problem as much as a product problem. Product infrastructure that supports conversion is essential.

**Improvement Recommendations:**
1. Create a pilot-to-production upgrade guide.
2. Build a "value report" generated from pilot data.
3. Write a champion enablement kit (executive summary, business case template, procurement FAQ).

---

### 15. Partner and Channel Readiness — Score: 20 / 100 (Weight: 3, Weighted Gap: 240)

**Justification:**
- No partner program, SI relationships, or consulting firm partnerships.
- No white-label or OEM capability. No implementation partner documentation.
- DOCX export for consulting templates suggests awareness of use case but no partnership structure.

**Tradeoffs:** Premature. But the channel strategy informs product design (customizable templates, partner branding).

**Improvement Recommendations:**
1. Design a consulting firm partnership model.
2. Create customizable DOCX templates for partner branding.
3. Document a partner implementation guide.

---

### 16. Vertical / Industry Readiness — Score: 30 / 100 (Weight: 3, Weighted Gap: 210)

**Justification:**
- No industry-specific policy packs, compliance mappings, or demo scenarios.
- Policy pack system is flexible enough but no reference implementations.
- Generic presets only ("Greenfield web app," "Modernize legacy system").

**Tradeoffs:** Vertical specialization follows horizontal PMF. But "do you support our regulatory requirements" is a sales qualification question.

**Improvement Recommendations:**
1. Create policy pack reference implementations for top 2 verticals (financial services, healthcare).
2. Map finding categories to SOC 2 / ISO 27001 controls.
3. Build one industry-specific demo scenario.

---

### 17. Community and Ecosystem — Score: 15 / 100 (Weight: 2, Weighted Gap: 170)

**Justification:**
- No open-source community, developer forum, Discord/Slack, public issue tracker, or user group.
- `dotnet new archlucid-finding-engine` template is a foundation but no distribution mechanism.

**Tradeoffs:** Community requires product maturity. Even a small early-adopter group provides invaluable feedback.

**Improvement Recommendations:**
1. Establish a GitHub Discussions or Discord for pilot users.
2. Open-source the finding engine template and SDK.

---

### 18. Internationalization / Localization — Score: 22 / 100 (Weight: 2, Weighted Gap: 156)

**Justification:**
- English-only throughout. No i18n framework in the Next.js UI. No data residency options.

**Tradeoffs:** i18n follows demand. For V1 targeting English-speaking Azure customers, acceptable but limits TAM.

**Improvement Recommendations:**
1. Add i18n framework to the UI as a foundation.
2. Externalize user-facing strings in the API.

---

### 19. Brand Identity — Score: 30 / 100 (Weight: 2, Weighted Gap: 140)

**Justification:**
- Product name "ArchLucid" is distinctive and well-chosen.
- No logo, visual brand, color palette, or typography system.
- Rename incomplete (Terraform addresses, workspace path).
- UI uses Tailwind defaults.
- **Implemented (M1):** Tagline options in `POSITIONING.md` §6.

**Tradeoffs:** Brand investment follows PMF. Minimal brand (logo + 3 colors) improves professional perception significantly.

**Improvement Recommendations:**
1. Commission or create a logo and minimal brand guide.
2. Apply brand to the UI (custom Tailwind theme).

---

### 20. Market Timing / Category Definition — Score: 60 / 100 (Weight: 2, Weighted Gap: 80)

**Justification:**
- Timing is favorable: AI-assisted enterprise architecture is emerging with high interest.
- **Implemented (M1):** "AI Architecture Intelligence" category explicitly defined in `POSITIONING.md` §5 with positioning diagram.
- Category is crowded with point solutions but ArchLucid's combination is unique.
- No evidence of urgency or go-to-market timeline in product docs.

**Tradeoffs:** Early is advantageous but requires aggressive market education.

**Improvement Recommendations:**
1. Move quickly to establish reference customers.
2. Publish category-defining content before incumbents catch up.

---

## Summary Table (sorted by weighted gap, descending)

| Rank | Marketability Area | Weight | Score | Gap | Weighted Gap | Grade | M1/M2 Impact |
|------|-------------------|--------|-------|-----|-------------|-------|-------------|
| 1 | **Go-to-Market Readiness** | 10 | 40 | 60 | **600** | Critical | M1 +10, M2 +2 |
| 2 | **Value Demo / ROI** | 7 | 30 | 70 | **490** | Critical | — |
| 3 | **Product-Market Fit Clarity** | 9 | 47 | 53 | **477** | Weak | M1 +12 |
| 4 | **Customer Success Infra** | 7 | 32 | 68 | **476** | Critical | — |
| 5 | **Differentiation & Moat** | 9 | 50 | 50 | **450** | Weak | M1 +10, M2 +2 |
| 6 | **Time-to-Value / Onboarding** | 8 | 45 | 55 | **440** | Weak | M2 visual preview |
| 7 | **Ecosystem & Integration** | 6 | 40 | 60 | **360** | Critical | — |
| 8 | **Multi-Cloud / Platform** | 5 | 35 | 65 | **325** | Critical | — |
| 9 | **Enterprise Readiness** | 7 | 55 | 45 | **315** | Weak | — |
| 10 | **UX Polish** | 6 | 50 | 50 | **300** | Weak | M2 +2 |
| 11 | **Content & Thought Leadership** | 4 | 25 | 75 | **300** | Critical | M1 category foundation |
| 12 | **Business Model Scalability** | 5 | 42 | 58 | **290** | Critical | — |
| 13 | **Buyer Documentation** | 4 | 40 | 60 | **240** | Critical | M1 +5, M2 +5 |
| 14 | **Pilot-to-Paid Conversion** | 4 | 40 | 60 | **240** | Critical | M1 persona demo priorities |
| 15 | **Partner & Channel** | 3 | 20 | 80 | **240** | Critical | — |
| 16 | **Vertical / Industry** | 3 | 30 | 70 | **210** | Critical | — |
| 17 | **Community & Ecosystem** | 2 | 15 | 85 | **170** | Critical | — |
| 18 | **Internationalization** | 2 | 22 | 78 | **156** | Critical | — |
| 19 | **Brand Identity** | 2 | 30 | 70 | **140** | Critical | M1 taglines |
| 20 | **Market Timing** | 2 | 60 | 40 | **80** | Adequate | M1 +5 (category defined) |

**Overall weighted marketability score:** 4,227 / 10,600 = **39.9%** (was 35.0% pre-M1, 37.6% pre-M2)

**Unweighted average:** 37.3 / 100

**Score trajectory:**

| Milestone | Weighted % | Unweighted avg |
|-----------|-----------|----------------|
| Pre-M1 | 35.0% | 35.0 |
| Post-M1 | 37.6% | 36.4 |
| Post-M2 | 39.9% | 37.3 |

**Interpretation:** Two improvement cycles have raised the weighted score by 4.9 percentage points (35.0% → 39.9%). The most significant gains are in the three highest-weighted areas: GTM (+12), PMF (+12), and Differentiation (+12). The product now has minimum viable positioning collateral (competitive landscape, personas, positioning, datasheet, screenshot brief). The largest remaining gaps are **Value Demo / ROI** (490), **Customer Success Infrastructure** (476), and **Time-to-Value** (440) — these require a mix of documentation and product engineering work.

---

## Six Best Improvements (ordered by weighted impact and feasibility)

### Improvement 1: Product Positioning and Competitive Analysis — Status: DONE (M1)

**Delivered:** `COMPETITIVE_LANDSCAPE.md`, `BUYER_PERSONAS.md`, `POSITIONING.md`.

**Impact:** GTM 28→40, PMF 35→47, Differentiation 38→50.

---

### Improvement 2: Product Datasheet and Screenshot Gallery — Status: DONE (M2)

**Delivered:** `PRODUCT_DATASHEET.md`, `SCREENSHOT_GALLERY.md`.

**Impact:** GTM +2, UX Polish +2, Buyer Documentation +5. First externally-shareable collateral.

---

### Improvement 3: ROI Model and Pilot Success Scorecard (Value Demo + Pilot Conversion; combined weighted gap: 730)

**What:** Create an ROI model template and pilot success measurement guide — the tools a champion needs to justify a purchase.

**Cursor Prompts:**

```
Improvement M3 — Prompt `roi-model`

Create docs/go-to-market/ROI_MODEL.md with:

1. Objective: Help pilot champions build a business case for purchasing ArchLucid.

2. Cost of the status quo (inputs to collect from the customer):
   - Number of architecture reviews per quarter
   - Average hours per review (architect time + stakeholder review + documentation)
   - Average architect fully-loaded cost per hour
   - Number of compliance gaps found in production (post-deployment)
   - Average cost of a compliance remediation
   - Number of architecture inconsistencies across teams

3. ArchLucid value model (mapped to product capabilities):
   - Time reduction: architecture review cycle from X weeks to Y hours
   - Consistency improvement: standardized findings across all reviews
   - Compliance shift-left: findings before deployment, not after
   - Audit trail: automatic vs. manual documentation
   - Knowledge reuse: comparison/replay across iterations

4. ROI calculation template with example scenario

5. Intangible benefits section

Ground claims in actual V1_SCOPE.md capabilities. Use conservative estimates.
```

```
Improvement M3 — Prompt `pilot-success-scorecard`

Create docs/go-to-market/PILOT_SUCCESS_SCORECARD.md with:

1. Quantitative metrics (measure before and after):
   - Time to complete an architecture review
   - Number of findings per review
   - Percentage of findings with full explainability trace
   - Governance compliance rate

2. Qualitative metrics (stakeholder interviews, 1-5 scale)

3. Data collection plan (6-week pilot timeline)

4. Success criteria (minimum, target, stretch)

5. Report template for the champion to present to leadership

Reference PILOT_GUIDE.md and PRODUCT_LEARNING.md for existing data collection.
```

---

### Improvement 4: Zero-Config Docker Demo (Time-to-Value; weighted gap: 440)

**What:** One-command Docker experience with pre-seeded data for 5-minute prospect evaluation.

**Cursor Prompt:**

```
Improvement M4 — Prompt `zero-config-demo`

1. Read docker-compose.yml and docs/CONTAINERIZATION.md.

2. Create docker-compose.demo.yml overlay that sets:
   Demo:Enabled=true, Demo:SeedOnStartup=true, AgentExecution:Mode=Simulator,
   ArchLucidAuth:Mode=DevelopmentBypass, UI proxy to API container.

3. Create scripts/demo-start.ps1 and scripts/demo-start.sh:
   check Docker → compose up → wait for health → open browser.

4. Create docs/go-to-market/DEMO_QUICKSTART.md (buyer-facing):
   prerequisites (Docker only), one command, 5-minute walkthrough, cleanup.

Do not change production docker-compose.yml. Demo overlay is additive.
```

---

### Improvement 5: Generic OIDC Support (Enterprise Readiness; weighted gap: 315)

**What:** Add generic OIDC provider support (Okta, Auth0, Ping) alongside Entra ID.

**Cursor Prompt:**

```
Improvement M5 — Prompt `generic-oidc-auth`

1. Read ArchLucid.Host.Core/Startup/ for existing auth (AddArchLucidAuth,
   ArchLucidAuthOptions, ArchLucidRoleClaimsTransformation).

2. Add ArchLucidAuth:Mode "OpenIdConnect" with configurable:
   Authority, ClientId, Audience, RoleClaimType, role value mappings.

3. Reuse ArchLucidRoleClaimsTransformation for provider-specific claim mapping.

4. Add appsettings.Okta.sample.json and appsettings.Auth0.sample.json.

5. Add tests in ArchLucid.Host.Composition.Tests.

6. Update docs/SECURITY.md and CUSTOMER_TRUST_AND_ACCESS.md.

Keep JwtBearer mode as-is. New mode is additive.
```

---

### Improvement 6: CI/CD Integration Examples and Terraform Import (Ecosystem; weighted gap: 360)

**What:** GitHub Actions and Azure DevOps pipeline examples plus a Terraform state import connector.

**Cursor Prompts:**

```
Improvement M6 — Prompt `cicd-integration-examples`

1. Create docs/integrations/CICD_INTEGRATION.md:
   why, pattern (PR → ArchLucid run → findings as PR comment → governance gate).

2. Create examples/github-actions/archlucid-review.yml.

3. Create examples/azure-devops/archlucid-review.yml.

4. Document API calls used. Templates for customization.
```

```
Improvement M6 — Prompt `terraform-state-import`

1. Read ArchLucid.ContextIngestion/ for IContextConnector and CanonicalObject.

2. Create TerraformStateConnector.cs:
   parse terraform show -json output, extract resources/dependencies,
   map to CanonicalObject records.

3. Tests: sample state, empty state, malformed JSON.

4. Update docs/CONTEXT_INGESTION.md.
```

---

## Related documents

| Doc | Use |
|-----|-----|
| `docs/go-to-market/COMPETITIVE_LANDSCAPE.md` | 10-competitor analysis (M1) |
| `docs/go-to-market/BUYER_PERSONAS.md` | Three buyer personas (M1) |
| `docs/go-to-market/POSITIONING.md` | Positioning, pitches, category definition (M1) |
| `docs/go-to-market/PRODUCT_DATASHEET.md` | 2-page buyer-facing datasheet (M2) |
| `docs/go-to-market/SCREENSHOT_GALLERY.md` | 10-screenshot capture brief (M2) |
| `docs/QUALITY_ASSESSMENT_2026_04_14_WEIGHTED.md` | Technical quality assessment (68.5%) |
| `docs/archive/MARKETABILITY_ASSESSMENT_2026_04_15_PRE_M2.md` | Prior assessment (37.6%) |

---

## SaaS-only framing — pre-Trust Center

**Assumption:** ArchLucid is **SaaS-only** ΓÇö no self-hosted or on-premises deployment path. Buyers evaluate you as a **vendor-operated service**, not software they run in their own cloud or data center.

**Overall Marketability Score (unweighted average): 34 / 100** | Weighted: **34.8%** (4,136 / 11,900)

**Companion assessment (mixed / optional self-host framing):** `docs/MARKETABILITY_ASSESSMENT_2026_04_15.md` (58/100 headline, 42.3% weighted under that framing).

**Technical quality (orthogonal):** `docs/QUALITY_ASSESSMENT_2026_04_14_WEIGHTED.md` (68.5%).

---

## Why this reframing matters

Under a **mixed** model, gaps in ΓÇ£how to run it yourselfΓÇ¥ can be partially offset by **flexibility** and **buyer control**. Under **SaaS-only**, those gaps disappear from the narrative ΓÇö and are replaced by **harder** requirements:

| Theme | SaaS-only implication |
|--------|------------------------|
| **Trust** | SOC 2, DPA, subprocessors, data residency, incident comms ΓÇö table stakes |
| **Commercial** | Transparent pricing, self-serve signup, billing, contracts ΓÇö non-negotiable for velocity |
| **Platform** | Your uptime, scale, multi-tenant isolation, and upgrade discipline *are* the product |
| **Procurement** | Security review centers on *your* controls, not ΓÇ£deploy in our VPCΓÇ¥ |

**Net:** Several dimensions that were **moderate** under mixed deployment become **critical** when the only path is ΓÇ£trust our tenant.ΓÇ¥ Overall marketability **drops** versus a mixed assessment unless SaaS platform and GTM infrastructure catch up.

---

## Methodology

Same scale as `docs/MARKETABILITY_ASSESSMENT_2026_04_15.md`: twenty dimensions, scores 1ΓÇô100, weights 1ΓÇô10. **Weights are rebalanced** for SaaS-only (importance of vendor platform, billing, trust, and land-and-expand). Dimensions ordered by **weighted improvement priority** (weight ├ù gap to 100).

| Range | Meaning |
|-------|---------|
| 90ΓÇô100 | Market-leading |
| 75ΓÇô89 | Competitive |
| 60ΓÇô74 | Adequate |
| 45ΓÇô59 | Weak ΓÇö losing deals |
| Below 45 | Critical ΓÇö blocking |

**Weighted score:** ╬ú(score ├ù weight) / (╬ú weight ├ù 100). Max numerator = 11,900 (weights sum to **119**).

---

## Executive summary

- **14 of 20** dimensions sit in **critical** territory (below 45) under SaaS-only weights ΓÇö versus a smaller critical set when self-hosting can absorb some buyer anxiety.
- **Largest weighted gaps:** SaaS platform maturity (multi-tenant isolation, SLOs, DR, roadmap for regions), **GTM plumbing** (pricing page, signup, billing), **enterprise procurement pack** (SOC 2, DPA, SLA), and **customer success** motion for a service they cannot ΓÇ£patch locally.ΓÇ¥
- **Bright spots** that still transfer: **differentiation** (agentic, evidence-linked outputs), **PMF narrative** for architecture engagement, **ROI** and **pilot scorecard** (M3), **UX** investment, and **market timing** (AI + governance pressure).
- **Strategic implication:** The product can be technically strong (see quality assessment) yet **under-marketable as pure SaaS** until **platform + trust + commercial rails** match the story.

---

## Dimension scores and SaaS-only weights

Rows ordered by **weighted improvement priority** (weight ├ù (100 ΓêÆ score)), highest first.

| # | Dimension | Score | Weight | Weighted priority (├ù gap) | SaaS-only rationale for weight |
|---|-----------|-------|--------|---------------------------|--------------------------------|
| 1 | **SaaS platform & reliability** | 18 | **9** | 738 | You *are* the infrastructure |
| 2 | **GTM, pricing, signup, billing** | 28 | **10** | 720 | No self-serve = friction |
| 3 | **Business model & scalability** | 25 | **8** | 600 | Unit economics and expansion |
| 4 | **Enterprise readiness & procurement** | 35 | **9** | 585 | Vendor trust, not buyer-deployed |
| 5 | **Customer success & retention** | 30 | **8** | 560 | Churn risk without on-prem escape |
| 6 | **Time-to-value** | 40 | **8** | 480 | First session must ΓÇ£just workΓÇ¥ |
| 7 | **Differentiation & positioning** | 48 | **9** | 468 | Still core |
| 8 | **ProductΓÇômarket fit evidence** | 50 | **9** | 450 | Case studies, logos |
| 9 | **Content & thought leadership** | 22 | **5** | 390 | Lower than platform/GTM |
| 10 | **Technology ecosystem** | 38 | **6** | 372 | Integrations as SaaS connectors |
| 11 | **ROI & business case** | 48 | **7** | 364 | M3 helps |
| 12 | **UX & demo experience** | 48 | **6** | 312 | Trial is the product |
| 13 | **Pilot-to-paid conversion** | 45 | **5** | 275 | Contracting on *your* paper |
| 14 | **Partner & channel** | 18 | **3** | 246 | Important but later |
| 15 | **Buyer education & docs** | 44 | **4** | 224 | Trust docs, not install docs |
| 16 | **Vertical specificity** | 28 | **3** | 216 | Nice-to-have early |
| 17 | **Community & advocacy** | 12 | **2** | 176 | Long cycle |
| 18 | **Internationalization** | 20 | **2** | 160 | Reg + language |
| 19 | **Brand awareness** | 28 | **2** | 144 | Earned over time |
| 20 | **Market timing** | 58 | **2** | 84 | Tailwind remains |

**Totals:** Unweighted average **34.2** (rounds to **34/100**). ╬ú(score ├ù weight) = **4,136**; ╬ú weight = **119**; **weighted = 4,136 / 11,900 Γëê 34.8%**.

---

## Gap analysis (SaaS-only)

### Critical (< 45)

1. **SaaS platform (18)** ΓÇö Buyers will ask: tenant isolation, encryption, backups, RTO/RPO, status page, incident process, data deletion, region strategy. A ΓÇ£strong codebaseΓÇ¥ does not substitute for **articulated** operational maturity.
2. **GTM / commercial rails (28)** ΓÇö Without self-host, **self-serve or low-friction sales** and **clear pricing** matter more. Missing pieces read as ΓÇ£not ready to buy.ΓÇ¥
3. **Business model clarity (25)** ΓÇö Seat vs workload vs outcome; expansion path; professional services boundary ΓÇö all must be crisp for SaaS CFO scrutiny.
4. **Enterprise readiness (35)** ΓÇö SOC 2 timeline, DPA, subprocessors, SLA, support tiers ΓÇö weighted **up** vs mixed model.
5. **Customer success (30)** ΓÇö Playbooks, health metrics, and escalation for a service they cannot operate.
6. **Content (22)** ΓÇö Trust content (security, architecture) beats generic thought leadership for SaaS buyers.
7. **Partners (18)** ΓÇö SI and cloud marketplaces matter for enterprise SaaS distribution.
8. **Buyer docs (44)** ΓÇö Security architecture, data flow, and compliance mapping ΓÇö not installation guides.
9. **Vertical (28), community (12), i18n (20), brand (28)** ΓÇö Deprioritized weights but still mostly critical **scores**; fix after platform and GTM.

### Adequate / competitive

- **Market timing (58)** ΓÇö AI + governance still favorable.
- **Differentiation, PMF narrative, ROI, UX, pilot** ΓÇö Mid-40s to 50; reinforce with **proof** and **published** trust artifacts.

---

## Six prioritized improvements (SaaS-only)

1. **Ship a ΓÇ£trust centerΓÇ¥ spine** ΓÇö Public security overview, subprocessors, DPA template, incident comms policy, roadmap to SOC 2 (even if ΓÇ£in progressΓÇ¥ with clear milestones).
2. **Publish SaaS operational posture** ΓÇö Status page, SLOs in buyer language, backup/DR summary, tenant isolation one-pager, data residency statement (even if single-region today).
3. **Unblock commercial motion** ΓÇö Pricing philosophy page, trial/signup path, billing integration story, order form / MSA pattern for SMB-midmarket.
4. **Customer success minimum viable** ΓÇö Onboarding checklist, health signals, renewal playbook; tie to pilot scorecard (M3).
5. **Integrations as product** ΓÇö IdP (SCIM if claimed), SIEM/export, Jira/ADO ΓÇö framed as **your** connectors, not ΓÇ£run our agent in your VPC.ΓÇ¥
6. **Narrow ICP + proof** ΓÇö 2ΓÇô3 reference narratives emphasizing **vendor-managed** value and time-to-first-outcome.

---

## Messaging shift: mixed model ΓåÆ SaaS-only

| Mixed / self-host friendly | SaaS-only replacement |
|----------------------------|------------------------|
| ΓÇ£Deploy in your Azure subscriptionΓÇ¥ | ΓÇ£Hosted by ArchLucid; your data isolated per tenantΓÇ¥ |
| ΓÇ£You control the network boundaryΓÇ¥ | ΓÇ£We use private connectivity and encryption in transit and at rest; here is our architectureΓÇ¥ |
| ΓÇ£Bring your own keysΓÇ¥ (if not offered) | Roadmap honesty + current key management story |
| ΓÇ£Air-gapped optionΓÇ¥ | Not available ΓÇö position **export**, **offline artifacts**, or **partners** if needed |
| ΓÇ£Install guideΓÇ¥ | ΓÇ£Get started in 10 minutesΓÇ¥ + trust links |

---

## Conclusion

SaaS-only **raises the bar** on **platform, trust, and commercial completeness**. The codebase can score well on technical quality while **marketability as a service vendor** lags until those surfaces match buyer expectations. Use this document for **GTM, security, and product roadmap** alignment; use the mixed-model assessment when explaining **flexibility** that you do **not** plan to offer ΓÇö to avoid a credibility gap.

---

## Related documents

| Doc | Use |
|-----|-----|
| `docs/MARKETABILITY_ASSESSMENT_2026_04_15.md` | Primary assessment with optional self-host framing |
| `docs/go-to-market/COMPETITIVE_LANDSCAPE.md` | Competitive context |
| `docs/go-to-market/POSITIONING.md` | Positioning |
| `docs/go-to-market/ROI_MODEL.md` | ROI (M3) |
| `docs/go-to-market/PILOT_SUCCESS_SCORECARD.md` | Pilot metrics (M3) |
| `docs/go-to-market/DEMO_QUICKSTART.md` | Docker demo (seller-led; not buyer self-host) |
| `docs/QUALITY_ASSESSMENT_2026_04_14_WEIGHTED.md` | Technical quality |

---

## SaaS-only framing — post-Trust Center (Imp 2.6)

**Assumption:** ArchLucid is **SaaS-only** — no self-hosted or on-premises deployment path. Buyers evaluate you as a **vendor-operated service**, not software they run in their own cloud or data center.

**Overall Marketability Score (unweighted average): 37 / 100** | Weighted: **37.6%** (4,479 / 11,900)

**Prior SaaS-only assessment (pre-Trust Center):** `docs/archive/MARKETABILITY_ASSESSMENT_2026_04_15_SAAS_ONLY_PRE_trust-center.md` (34/100 headline, 34.8% weighted).

**Companion assessment (mixed / optional self-host framing):** `docs/MARKETABILITY_ASSESSMENT_2026_04_15.md` (58/100 headline, 42.3% weighted under that framing).

**Technical quality (orthogonal):** `docs/QUALITY_ASSESSMENT_2026_04_14_WEIGHTED.md` (68.5%).

---

## What changed since last assessment

**SaaS Improvement 1 (Trust Center spine)** delivered six documents into `docs/go-to-market/`:

- `trust-center.md` — Buyer-facing security index with compliance table, security-at-a-glance, contact.
- `SUBPROCESSORS.md` — Microsoft Azure services, Entra ID, Azure OpenAI; 30-day change notification; data residency statement.
- `DPA_TEMPLATE.md` — GDPR-style Data Processing Agreement template (requires legal review).
- `INCIDENT_COMMUNICATIONS_POLICY.md` — SEV-1–4 classification, customer comms timelines, breach notification addendum.
- `SOC2_ROADMAP.md` — Controls inventory grounded in repo evidence, gap analysis, phased milestones (Q3 2026–Q3 2027+).
- `TENANT_ISOLATION.md` — Three-layer summary (identity, application, database RLS) with Mermaid diagram and honest "not claimed" list.

The `docs/go-to-market/` folder now contains **14 documents** — up from 8 before this improvement.

---

## Why this reframing matters

Under a **mixed** model, gaps in "how to run it yourself" can be partially offset by **flexibility** and **buyer control**. Under **SaaS-only**, those gaps disappear from the narrative — and are replaced by **harder** requirements:

| Theme | SaaS-only implication |
|--------|------------------------|
| **Trust** | SOC 2, DPA, subprocessors, data residency, incident comms — table stakes |
| **Commercial** | Transparent pricing, self-serve signup, billing, contracts — non-negotiable for velocity |
| **Platform** | Your uptime, scale, multi-tenant isolation, and upgrade discipline *are* the product |
| **Procurement** | Security review centers on *your* controls, not "deploy in our VPC" |

**Net:** Several dimensions that were **moderate** under mixed deployment become **critical** when the only path is "trust our tenant." Overall marketability **drops** versus a mixed assessment unless SaaS platform and GTM infrastructure catch up.

---

## Methodology

Same scale as `docs/MARKETABILITY_ASSESSMENT_2026_04_15.md`: twenty dimensions, scores 1–100, weights 1–10. **Weights are rebalanced** for SaaS-only (importance of vendor platform, billing, trust, and land-and-expand). Dimensions ordered by **weighted improvement priority** (weight × gap to 100).

| Range | Meaning |
|-------|---------|
| 90–100 | Market-leading |
| 75–89 | Competitive |
| 60–74 | Adequate |
| 45–59 | Weak — losing deals |
| Below 45 | Critical — blocking |

**Weighted score:** Σ(score × weight) / (Σ weight × 100). Max numerator = 11,900 (weights sum to **119**).

---

## Executive summary

- **12 of 20** dimensions are in **critical** territory (below 45) — down from **14** pre-Trust Center. Two dimensions (**Enterprise readiness** and **Buyer education**) moved out of critical.
- **Enterprise readiness & procurement** saw the **largest single gain** (+15, from 35 to 50) — the trust center spine provides the skeleton procurement pack that SaaS buyers expect (DPA, subprocessors, incident comms, SOC 2 roadmap).
- **Largest remaining weighted gaps:** GTM commercial infrastructure (pricing, signup, billing), SaaS platform maturity (status page, DR evidence, multi-region), and business model clarity — these require **product and business** investment, not documentation.
- **Bright spots:** The trust center gives the sales team a **credible answer** to "where is your security documentation?" for the first time. Combined with existing GTM docs (competitive landscape, positioning, ROI model, pilot scorecard, datasheet), ArchLucid now has a **14-document buyer-facing library** — meaningful for a pre-revenue product.
- **Strategic implication:** Trust documentation is necessary but not sufficient. The next SaaS-only improvements must address **platform observability** (status page, SLOs in buyer contracts), **commercial rails** (pricing, trial, billing), and **customer success infrastructure**.

---

## Dimension scores and SaaS-only weights

Rows ordered by **weighted improvement priority** (weight × (100 − score)), highest first.

| # | Dimension | Pre | Post | Δ | Weight | Weighted priority (× gap) | Change rationale |
|---|-----------|-----|------|---|--------|---------------------------|------------------|
| 1 | **GTM, pricing, signup, billing** | 28 | **30** | +2 | **10** | 700 | Trust center aids sales conversations; no pricing/signup change |
| 2 | **SaaS platform & reliability** | 18 | **25** | +7 | **9** | 675 | Tenant isolation one-pager + incident comms articulate the story; platform itself unchanged |
| 3 | **Business model & scalability** | 25 | **25** | 0 | **8** | 600 | No change |
| 4 | **Customer success & retention** | 30 | **33** | +3 | **8** | 536 | Incident comms policy is a CS artifact; no health scoring, onboarding checklist, or renewal playbook yet |
| 5 | **Time-to-value** | 40 | **40** | 0 | **8** | 480 | No change |
| 6 | **Enterprise readiness & procurement** | 35 | **50** | +15 | **9** | 450 | DPA template, subprocessors, SOC 2 roadmap, incident comms — skeleton procurement pack exists |
| 7 | **Differentiation & positioning** | 48 | **50** | +2 | **9** | 450 | Trust center differentiates from competitors without governance artifacts |
| 8 | **Product–market fit evidence** | 50 | **50** | 0 | **9** | 450 | No change |
| 9 | **Technology ecosystem** | 38 | **38** | 0 | **6** | 372 | No change |
| 10 | **ROI & business case** | 48 | **48** | 0 | **7** | 364 | No change |
| 11 | **Content & thought leadership** | 22 | **28** | +6 | **5** | 360 | Six publishable trust/security documents; still no blog or external presence |
| 12 | **UX & demo experience** | 48 | **48** | 0 | **6** | 312 | No change |
| 13 | **Pilot-to-paid conversion** | 45 | **48** | +3 | **5** | 260 | DPA template enables contracting on vendor paper |
| 14 | **Partner & channel** | 18 | **18** | 0 | **3** | 246 | No change |
| 15 | **Vertical specificity** | 28 | **28** | 0 | **3** | 216 | No change |
| 16 | **Buyer education & docs** | 44 | **52** | +8 | **4** | 192 | Trust center is buyer-facing; 14 GTM docs now |
| 17 | **Community & advocacy** | 12 | **12** | 0 | **2** | 176 | No change |
| 18 | **Internationalization** | 20 | **22** | +2 | **2** | 156 | Data residency statement in subprocessors |
| 19 | **Brand awareness** | 28 | **29** | +1 | **2** | 142 | Trust center improves professional perception marginally |
| 20 | **Market timing** | 58 | **58** | 0 | **2** | 84 | No change |

**Totals:** Unweighted average **36.6** (rounds to **37/100**). Σ(score × weight) = **4,479**; Σ weight = **119**; **weighted = 4,479 / 11,900 ≈ 37.6%**.

**Score math:** (25×9)+(30×10)+(25×8)+(50×9)+(33×8)+(40×8)+(50×9)+(50×9)+(28×5)+(38×6)+(48×7)+(48×6)+(48×5)+(18×3)+(52×4)+(28×3)+(12×2)+(22×2)+(29×2)+(58×2) = 225+300+200+450+264+320+450+450+140+228+336+288+240+54+208+84+24+44+58+116 = **4,479**.

---

## Score trajectory (SaaS-only)

| Milestone | Weighted % | Unweighted avg | Δ weighted | Critical dims |
|-----------|-----------|----------------|------------|---------------|
| Pre-Trust Center | 34.8% | 34.2 | — | 14 of 20 |
| **Post-Trust Center** | **37.6%** | **36.6** | **+2.8** | **12 of 20** |

---

## Gap analysis (SaaS-only, post-Trust Center)

### Critical (< 45) — 12 dimensions

1. **GTM / commercial rails (30)** — Trust docs help the sales conversation, but **pricing, signup, billing, trial** are still absent. This is the highest weighted gap remaining.
2. **SaaS platform (25)** — Tenant isolation and incident comms are now **articulated**, but there is no **status page**, no **tested DR summary for buyers**, no **multi-region**, no **backup/RTO/RPO statement** outside engineering runbooks. Articulation moved score from 18 to 25; platform substance must follow.
3. **Business model (25)** — Unchanged. Seat vs workload vs outcome; expansion levers; metering — all still undefined.
4. **Customer success (33)** — Incident comms is one CS artifact. Still no onboarding checklist, health scoring, or renewal playbook.
5. **Time-to-value (40)** — Unchanged. Docker demo (M4) exists but setup friction is inherent.
6. **Technology ecosystem (38)** — Unchanged. No SDK, no inbound connectors, no CI/CD examples.
7. **Content (28)** — Six trust docs are publishable, but no external blog, whitepaper, or DevRel presence yet.
8. **Vertical (28), partner (18), community (12), i18n (22), brand (29)** — Unchanged or near-unchanged; deprioritized by weight.

### Weak (45–59) — 6 dimensions

- **Enterprise readiness (50)** — Newly promoted from critical. Skeleton procurement pack exists. Not yet competitive because SOC 2 is "in progress," no independent pen test, DPA needs legal review, no published SLA.
- **Differentiation (50), PMF evidence (50), ROI (48), UX (48), pilot-to-paid (48)** — Reinforced by trust artifacts but still need **proof** (pilot data, case studies, completed screenshots).

### Adequate or above (≥ 60) — 2 dimensions

- **Buyer education (52)** — Newly promoted from critical. 14 GTM docs across positioning, competitive, ROI, trust, demo.
- **Market timing (58)** — AI + governance tailwind unchanged.

---

## Six prioritized improvements (SaaS-only)

| # | Improvement | Status | Next step |
|---|-------------|--------|-----------|
| 1 | **Trust center spine** | **Done** | Legal review of DPA; publish to web or customer portal |
| 2 | **SaaS operational posture** | Open | Status page, buyer-language SLOs, backup/DR summary, RTO/RPO commitment |
| 3 | **Commercial motion** | Open | Pricing philosophy, trial/signup, billing integration, MSA/order form |
| 4 | **Customer success MVP** | Open | Onboarding checklist, health signals, renewal playbook |
| 5 | **Integrations as product** | Open | IdP (SCIM), SIEM/export, Jira/ADO — framed as SaaS connectors |
| 6 | **Narrow ICP + proof** | Open | 2–3 reference narratives from pilots |

See `docs/CURSOR_PROMPTS_SAAS_IMPROVEMENTS_2_TO_6.md` for executable Cursor prompts for Improvements 2–6.

---

## Messaging shift: mixed model → SaaS-only (updated)

| Mixed / self-host friendly | SaaS-only replacement | Trust center support |
|----------------------------|------------------------|----------------------|
| "Deploy in your Azure subscription" | "Hosted by ArchLucid; your data isolated per tenant" | `TENANT_ISOLATION.md` |
| "You control the network boundary" | "We use private connectivity and encryption; here is our architecture" | `trust-center.md` security overview |
| "Bring your own keys" (if not offered) | Roadmap honesty + current key management story | `TENANT_ISOLATION.md` §5 |
| "Air-gapped option" | Not available — position export, offline artifacts, or partners | — |
| "Install guide" | "Get started in 10 minutes" + trust links | `trust-center.md` |
| "Who are your subprocessors?" | "Here is the list and our 30-day notification commitment" | `SUBPROCESSORS.md` |
| "Do you have a DPA?" | "Template available; legal review required" | `DPA_TEMPLATE.md` |
| "Where is your SOC 2?" | "In progress — here is the roadmap and current controls" | `SOC2_ROADMAP.md` |

---

## Conclusion

The Trust Center spine moved **Enterprise readiness** from critical to weak and **Buyer education** from critical to weak — reducing critical dimensions from **14 to 12**. Weighted score rose **2.8 percentage points** (34.8% → 37.6%). The go-to-market library now covers **14 documents**: competitive landscape, personas, positioning, datasheet, screenshots, ROI model, pilot scorecard, demo quickstart, trust center, subprocessors, DPA template, incident comms, SOC 2 roadmap, and tenant isolation.

The largest remaining gaps are **structural** rather than documentary: commercial infrastructure (pricing, billing, signup), platform observability (status page, SLOs in contracts), and customer success tooling. Improvement 2 (SaaS operational posture) is the recommended next execution target.

---

## Related documents

| Doc | Use |
|-----|-----|
| `docs/MARKETABILITY_ASSESSMENT_2026_04_15.md` | Primary assessment with optional self-host framing |
| `docs/go-to-market/trust-center.md` | Trust index (Improvement 1 deliverable) |
| `docs/go-to-market/COMPETITIVE_LANDSCAPE.md` | Competitive context |
| `docs/go-to-market/POSITIONING.md` | Positioning |
| `docs/go-to-market/ROI_MODEL.md` | ROI (M3) |
| `docs/go-to-market/PILOT_SUCCESS_SCORECARD.md` | Pilot metrics (M3) |
| `docs/go-to-market/DEMO_QUICKSTART.md` | Docker demo (M4) |
| `docs/QUALITY_ASSESSMENT_2026_04_14_WEIGHTED.md` | Technical quality |
| `docs/archive/MARKETABILITY_ASSESSMENT_2026_04_15_SAAS_ONLY_PRE_trust-center.md` | Prior SaaS-only assessment (34.8%) |
| `docs/CURSOR_PROMPTS_SAAS_IMPROVEMENTS_2_TO_6.md` | Executable Cursor prompts for remaining improvements |

---
