> **Scope:** Independent weighted readiness assessment 2026-05-06 ? scoring, improvements, and recommendations only; not a scope contract or roadmap.

# ArchLucid Assessment ? Weighted Readiness 78.86%

**Assessment date:** 2026-05-06  
**Assessment type:** Independent, first-principles ? no prior assessments referenced  
**Deferred scope:** Items explicitly deferred to V1.1 or V2 in `V1_SCOPE.md` and `V1_DEFERRED.md` are not scored against V1 readiness.

---

## Deferred Scope Uncertainty

None. `docs/library/V1_SCOPE.md` and `docs/library/V1_DEFERRED.md` are present and detailed. Confirmed deferred items not scored: SOC 2 CPA attestation, third-party pen test publication, signed design partner, commerce un-hold (live Stripe keys / Marketplace publish), PGP coordinated-disclosure key, VPAT formal publication, and MCP server surface.

---

## 2. Executive Summary

**Overall readiness:** ArchLucid is a real, unusually well-instrumented V1 product with a strong pilot wedge, serious audit/security posture, and broad enterprise design intent. The score is held down by buyer-proof gaps, integration breadth risk, residual tenant-isolation complexity, and the gap between documented readiness and repeatedly exercised production evidence.

**Commercial picture:** The core story is credible ? faster path from architecture request to reviewable package. The main commercial risk is not "can it do something useful"; it is whether a buyer can quickly see value, trust the proof, and move from pilot interest to purchase without bespoke founder mediation.

**Enterprise picture:** The solution is much stronger than a typical early product on audit, scope docs, Trust Center materials, RLS, CI, and procurement artifacts. Enterprise adoption is still exposed to self-attested assurance, residual RLS gaps, early connector hardening, and limited measured hosted-operating history.

**Engineering picture:** Architecture is modular, Dapper/SQL-first, Azure-aligned, and heavily tested. The highest engineering risks are correctness of AI outputs, live UI/API/SQL parity, uncovered SQL child tables, data consistency remediation, and operational complexity from a very wide surface area.

---

## 3. Weighted Quality Assessment

Ordered from most urgent (highest weighted deficiency) to least urgent. Deficiency signal = weight ? (100 ? score) / 100.

---

### COMMERCIAL

| Quality | Score | Weight | Weighted deficiency | Justification | Tradeoffs | Improvement | When |
|---------|-------|--------|---------------------|---------------|-----------|-------------|------|
| **Marketability** | 82 | 8 | **1.44** | Strong buyer story, Trust Center, ROI model, and pilot clarity. Proof is product-shaped rather than market-proven. Demo runs are cautiously bounded. | Narrow Pilot story helps focus but hides breadth from evaluators. | Buyer-safe first-value proof gate; sharper sponsor demo to real-input conversion path. | V1 |
| **Time-to-Value** | 84 | 7 | **1.12** | Four-step Core Pilot, sample review, second-run path all exist. Risk is proving value with real customer context, not demo context. | Early demo friction vs confidence-building. | Improve real-input first-run and buyer-safe report gate enforcement. | V1 |
| **Adoption Friction** | 77 | 6 | **1.38** | Core Pilot is well bounded. Product surface is heavy; connector setup adds implementation burden. | Enterprise configurability vs quick-start simplicity. | Guided in-product onboarding, connector readiness checks, first-session cognitive load reduction. | V1 |
| **Proof-of-ROI Readiness** | 78 | 5 | **1.10** | ROI model and computed deltas exist. Several high-value proof fields remain operator-filled. ROI confidence section is present. | Honest measurement vs fake automation. | Improve baseline capture and first-value completeness scoring. | V1 |
| **Executive Value Visibility** | 80 | 4 | **0.80** | Sponsor brief and ROI model are good. Board-level "what changed, what saved, what risk reduced" is not fully automated. | Manual input keeps proof honest; automation risks false precision. | First-value report and executive one-pager improvement. | V1 |
| **Differentiability** | 79 | 4 | **0.84** | Differentiation is real in manifest/evidence/governance packaging. Story can blur into "AI architecture docs" without sharper proof. | Deep capability vs simple first-impression story. | Comparison against manual review workflow in first-value proof. | V1 |
| **Decision Velocity** | 72 | 2 | **0.56** | Pricing and quote paths exist but owner-led follow-up dominates. Commerce un-hold is V1.1-deferred and not scored as V1 defect. | Manual close vs premature automation overhead. | Improve quote SLA visibility; keep existing commerce scaffolding. | V1/owner |
| **Commercial Packaging Readiness** | 76 | 2 | **0.48** | Tier docs, 402/404 tier filter, trial limits all exist. Live transactability is explicitly V1.1. | Scaffold must work; flip is owner-held. | Validate staging funnel end-to-end; document live-flip runbook completeness. | V1 scaffolding; V1.1 flip |
| **Stickiness** | 73 | 1 | **0.27** | Operate layer, audit history, compare/replay create stickiness. Repeat usage depends on real workflow embedding. | Deep product vs fragile first-run. | Improve trial-to-repeat-run experience. | V1/V1.1 |
| **Template and Accelerator Richness** | 82 | 1 | **0.18** | Recipes, templates, procurement packs are broad. | Volume vs discoverability. | Improve "choose this template" buyer guidance. | V1 |

---

### ENTERPRISE

| Quality | Score | Weight | Weighted deficiency | Justification | Tradeoffs | Improvement | When |
|---------|-------|--------|---------------------|---------------|-----------|-------------|------|
| **Workflow Embeddedness** | 70 | 3 | **0.90** | API/CLI/webhooks are solid. First-party ServiceNow/Jira/Confluence/Slack are in V1 scope but appear early and uneven in maturity. | Broad V1 enterprise appeal vs integration hardening load. | Connector health model, sync observability, and recipe-to-product parity. | V1 |
| **Usability** | 75 | 3 | **0.75** | Progressive disclosure helps. Cognitive surface is still large. First session exposes Operate features before Pilot is done. | Power vs simplicity. | "One job per screen" first-run UX; hide advanced detail until needed. | V1 |
| **Trustworthiness** | 74 | 3 | **0.78** | Strong audit/security intent. Residual RLS gaps, self-attestation posture, and AI correctness uncertainty limit enterprise reliance. | Honest maturity posture vs overstating controls. | Tenant isolation hardening; real-model evidence tightening. | V1/V1.1 |
| **Traceability** | 86 | 3 | **0.42** | One of the strongest qualities: manifests, artifacts, audit rows, correlation IDs, OpenAPI snapshots, evidence chain. | Strong posture; make it easier for buyers to consume the evidence. | Evidence chain UI improvements. | V1 |
| **Auditability** | 86 | 2 | **0.28** | Very strong durable audit matrix, append-only posture, CI guard, known-gap catalog. | Minor catalog-only gaps remain. | Keep matrix updated as connectors ship. | V1 |
| **Policy and Governance Alignment** | 83 | 2 | **0.34** | Strong governance workflows and SoD posture. Residual actor-key/org-policy limitations remain. | Accepted residual risk per ADR 0034. | SoD improvements for multi-principal edge cases. | V1/V1.1 |
| **Compliance Readiness** | 78 | 2 | **0.44** | Good self-assessment and control mapping. SOC 2 CPA is not scored; enterprise reviewers will still ask. | Self-attestation is honest but friction-generating. | Keep roadmap visible; trigger SOC 2 engagement at $250K ARR per decision. | V1/V1.1 |
| **Procurement Readiness** | 75 | 2 | **0.50** | Procurement pack, Trust Center, DPA, CAIQ/SIG are strong. SOC 2 CPA and third-party pen test are deferred and not scored, but still buyer-friction. | Rich materials but self-attested. | Improve cover-letter automation and proof-of-life evidence. | V1 |
| **Interoperability** | 74 | 2 | **0.52** | API, CLI, OpenAPI, webhooks, Service Bus are strong. First-party connector maturity is the weak point. | Broad interface vs selective depth. | Connector readiness matrix and health checks. | V1 |
| **Accessibility** | 78 | 1 | **0.22** | WCAG self-attestation and axe coverage exist. VPAT is explicitly not current scope. | VPAT has a defined re-evaluation trigger. | Keep axe-core CI and annual cadence. | Ongoing |
| **Customer Self-Sufficiency** | 72 | 1 | **0.28** | Docs are rich; customers may still need founder/operator help. | Rich docs vs discoverability. | In-product diagnostics; guided failure recovery. | V1 |
| **Change Impact Clarity** | 80 | 1 | **0.20** | Compare/replay/graph help. Executive-level change summaries not fully automated. | Good tooling; improve readability of output. | Executive change summary improvements. | V1 |

---

### ENGINEERING

| Quality | Score | Weight | Weighted deficiency | Justification | Tradeoffs | Improvement | When |
|---------|-------|--------|---------------------|---------------|-----------|-------------|------|
| **Correctness** | 78 | 4 | **0.88** | Strong schemas, snapshots, tests, and quality metrics. AI output thresholds are mostly warn-oriented; simulator paths dominate first-run confidence. | Avoid blocking useful runs vs reject bad outputs. | Real-run evaluation path and stronger quality gates. | V1/V1.1 |
| **Architectural Integrity** | 85 | 3 | **0.45** | Clear bounded projects. Coordinator/authority strangler is fully retired (PRs A0?A4 + PR B all merged by 2026-05-05; ADR 0030). CI guards (`DualPipelineRegistrationDisciplineTests`, `MvcControllerCoordinatorRepositoryFamilyGuardTests`) prevent regression. Remaining complexity is V1 surface breadth. | Active seam retirement reduces risk; main risk is breadth as connectors ship. | Evidence chain UI hardening; connector seam reuse guidance. | V1 |
| **Security** | 83 | 3 | **0.51** | Strong posture: Entra/JWT, API keys, private endpoints, secret redaction, ZAP/Schemathesis. Production deployment confirmed `SystemWithPerTenantCatalogs` (2026-05-06) ? each tenant has their own database, eliminating cross-tenant lateral movement as the primary isolation concern. RLS is defense-in-depth within a tenant for workspace/project isolation. Remaining risks: `SingleCatalog` default not locked to dev-only in Terraform/deployment config, workspace/project isolation within a tenant still application-layer only, credential-heavy connectors. | Per-tenant DB eliminates the CRITICAL cross-tenant RLS gap; workspace/project isolation within a tenant remains app-enforced. | Lock `SingleCatalog` to dev-only in deployment config; `FindingReviewEvents` and `ImportedArchitectureRequests` still need one ALTER SECURITY POLICY statement each; connector credential safety review. | V1 |
| **Reliability** | 76 | 2 | **0.48** | Health checks, smoke, rollback, retries, chaos tests exist. Weakness is lack of long measured hosted reliability history. | CI reliability vs production history. | Production evidence rollup. | V1 |
| **Data Consistency** | 74 | 2 | **0.52** | Orphan probes and quarantine exist. Consistency is partly after-the-fact; preventive constraints are partial. | Detection vs prevention cost. | Preventive constraint addition for highest-risk orphan relationships. | V1 |
| **Maintainability** | 80 | 2 | **0.40** | Modular but large. Route/policy/nav matrix automation is partial. | Growth vs seam discipline. | Route/policy/tier/nav drift automation. | V1 |
| **Explainability** | 78 | 2 | **0.44** | Trace, graph, citations, faithfulness fallback exist. Needs clearer reviewer-facing evidence chains. | Faithfulness fallback is an honest mechanism; expose it. | Evidence chain UI improvements. | V1 |
| **AI/Agent Readiness** | 76 | 2 | **0.48** | Good trace/eval/cost instrumentation. Real-model correctness and reference-case scoring need stronger release evidence. | Simulator-first is correct; real-model evidence must exist. | Real-model quality evidence path and release evidence documentation. | V1/V1.1 |
| **Azure Compatibility and SaaS Deployment Readiness** | 80 | 2 | **0.40** | Azure SQL, Container Apps, Front Door/WAF, Key Vault, private endpoints aligned. Needs more repeatable production evidence. | Strong posture; evidence needs accumulation. | Production deployment validation and rollup. | V1/V1.1 |
| **Availability** | 72 | 1 | **0.28** | 99.9% target exists, but measured hosted rollup is not yet proof. | Target vs history gap is common for new products. | Monthly probe rollup. | V1/V1.1 |
| **Performance** | 73 | 1 | **0.27** | k6 smoke and query p95 instrumentation exist. Large graph/AI paths need sustained load evidence. | Good gate; needs longer baseline. | Extend k6 scope to Operate paths. | V1/V1.1 |
| **Scalability** | 75 | 1 | **0.25** | Good SaaS primitives. Multi-region active/active is explicitly out of scope. | No penalty for that deferral. | Incremental horizontal scale validation. | V1.1/V2 |
| **Cost-Effectiveness** | 76 | 1 | **0.24** | Simulator-first, LLM budget options, cost model docs, and lean Azure target help. Budget is documented; hard default controls for real-agent mode are not universally enforced. | Flexibility vs guardrails. | Startup validation warning when real-agent mode is enabled but budget warnings are disabled. | V1 |
| **Manageability** | 77 | 1 | **0.23** | Many configuration paths and runbooks exist. Configuration complexity itself is the risk. | Rich configuration vs operator cognitive load. | Config validation improvements. | V1 |
| **Deployability** | 80 | 1 | **0.20** | Docker, scripts, CI/CD, Terraform all exist. Production cutover remains process-heavy. | Good tooling; operator experience must be smooth. | Deployment validation improvements. | V1/V1.1 |
| **Observability** | 82 | 1 | **0.18** | Strong metrics/traces/logs. Production sampling and exporter setup must be exercised. | Good instrumentation; needs production usage. | Exporter setup documentation hardening. | V1 |
| **Testability** | 84 | 1 | **0.16** | Unusually broad CI: full regression, live UI/API/SQL, auth parity, k6, chaos, OpenAPI snapshot. Maintain gate speed and signal quality. | Broad gates vs speed. | Keep tier structure clean as connectors are added. | Ongoing |
| **Modularity** | 84 | 1 | **0.16** | Strong project decomposition. Watch legacy coordinator/authority overlap. | Good separation; strangler required. | Enforce strangler gating. | V1 |
| **Extensibility** | 82 | 1 | **0.18** | Good seams and connectors. Risk is too many partially hardened extension points. | Broad extension vs focused hardening. | Connector seam reuse guidance. | V1 |
| **Evolvability** | 81 | 1 | **0.19** | ADRs and modular projects help. Avoid expanding V1 commitments faster than seams harden. | Good posture; breadth risk. | ADR gate for new integration surfaces. | Ongoing |
| **Documentation** | 86 | 1 | **0.14** | Extremely complete, possibly too complete. | Volume vs navigation. | Archive superseded docs; improve buyer navigation. | V1 |
| **Azure Ecosystem Fit** | 84 | 1 | **0.16** | Strong Azure-native posture. Private endpoints, Key Vault, WAF, Entra all aligned. | Good alignment; maintain in Terraform. | Ongoing |
| **Cognitive Load** | 70 | 1 | **0.30** | Product is powerful but mentally heavy for a first evaluator. | Power vs approachability. | First-run path reduction; hide advanced details behind progressive disclosure. | V1 |
| **Supportability** | 82 | 1 | **0.18** | Correlation IDs, support bundles, triage blocks, health checks are strong. | Good posture. | Simplify customer-facing runbooks. | V1 |

---

## Weighted Readiness Calculation

Total weighted deficiency: ~21.14 pp  
**Weighted readiness: 100 - 21.14 = 78.86%**

---

## 4. Top 12 Most Important Weaknesses

1. Buyer proof is not yet as automated and undeniable as the product capability.
2. V1 connector scope is commercially useful but operationally risky; bidirectional sync is new and lightly exercised.
3. Live UI/API/SQL confidence exists in CI, but release smoke documentation still warns about parity gaps.
4. Production topology is confirmed per-tenant database (`SystemWithPerTenantCatalogs`), eliminating cross-tenant RLS gaps. Residual: `SingleCatalog` is still the code default and not locked to dev-only in Terraform/deployment config; workspace/project isolation within a tenant remains application-layer only.
5. AI correctness gates are not yet strict enough for high-stakes enterprise reliance; warn-only defaults dominate.
6. Product breadth creates cognitive load during first evaluation; the four-step Pilot path competes with a large option surface.
7. Data consistency controls still lean partly on detection/quarantine rather than prevention.
8. Enterprise assurance is honest but self-attested; buyer friction from absent CPA SOC 2 and third-party pen test is real even though neither is scored.
9. Hosted availability is target-based rather than history-based; no 30-day measured rollup has been published.
10. Commercial conversion still depends heavily on owner-led follow-up.
11. Coordinator/authority strangler convergence is planned but active; new coordinator-only routes remain a risk.
12. Documentation volume can bury the buyer's shortest path to value.

---

## 5. Top 6 Monetization Blockers

1. Buyer-safe proof package must become the default sales artifact ? currently partially automated; still operator-mediated.
2. Quote-to-close depends on manual owner action; no CRM routing or lead-routing automation until V2.
3. Live commerce un-hold is explicitly V1.1/owner-held; self-serve transactability is not live.
4. Lack of public reference customer is V1.1-deferred, but conversion psychology is affected now.
5. Trial-to-first-real-value needs less operator mediation for independent evaluators.
6. Pricing/package boundaries are documented, but the "why upgrade from Pilot to Operate" story needs sharper proof evidence.

---

## 6. Top 6 Enterprise Adoption Blockers

1. SOC 2 CPA report absence is not scored as a V1 defect, but enterprise procurement will still require a response posture.
2. Third-party pen test publication is V2; security reviewers at large enterprises routinely require one.
3. Production is per-tenant database, so cross-tenant RLS gaps are eliminated. Remaining ask for security reviewers: `SingleCatalog` must be explicitly locked to dev-only in Terraform; workspace/project isolation within a tenant is application-enforced, not policy-enforced.
4. Connector credential/security posture must be easy to review ? Key Vault patterns help but are not uniformly enforced.
5. No long achieved-availability rollup; buyers cannot verify the 99.9% target against measured data.
6. Customer self-sufficiency depends on dense docs; self-serve support discipline must be tight before customer success scales.

---

## 7. Top 6 Engineering Risks

1. AI output correctness and evidence faithfulness under real model variance ? quality gate thresholds are warn-only by default.
2. Tenant isolation mistakes in uncovered SQL child tables that depend on join discipline rather than policy enforcement.
3. Connector bidirectional sync edge cases causing incorrect finding state ? `ItsmInboundWebhookSyncService` maps status strings without exhaustive validation.
4. Data consistency drift detected after persistence rather than prevented upfront; quarantine requires operator action.
5. Release confidence split across multiple gate types with different truths (mock Playwright vs live Playwright vs API smoke).
6. Operational complexity from many configuration modes, optional features, and partial flag coverage creates production misconfiguration risk.

---

## 8. Most Important Truth

ArchLucid is past "prototype," but the next readiness jump depends less on adding features and more on making the first real buyer proof, tenant isolation, connector behavior, and hosted evidence boringly repeatable.

---

## 9. Top Improvement Opportunities

---

### Improvement 1 ? Buyer-Safe First-Value Proof Gate

**Why it matters:** Revenue depends on a sponsor trusting the first output. The proof package completeness model exists but is not uniformly enforced as a send/no-send gate.

**Expected impact:** Improves Proof-of-ROI Readiness (+8?10 pts), Marketability (+3?5 pts), Trustworthiness (+2?4 pts).

**Affected qualities:** Marketability, Proof-of-ROI Readiness, Executive Value Visibility, Trustworthiness.

**Status:** Fully actionable now.

**Cursor prompt:**
```
Implement a buyer-safe first-value proof gate for ArchLucid.

Scope:
- Inspect existing first-value report, sponsor one-pager, ROI evidence completeness,
  and proof package code in ArchLucid.Application/Pilots, ArchLucid.Api, and related tests.
- Add or extend a deterministic "proof package completeness" model that evaluates whether
  a run has: real/non-demo warning state, committed manifest, artifact descriptor count,
  time-to-commit, findings by severity, top finding evidence-chain pointer, audit row count
  or lower-bound, LLM call count, ROI confidence label, and buyer-safe redaction profile.
- Surface the completeness result in the Markdown/PDF first-value report and any existing
  API response used by the operator UI, without changing core run semantics.
- Add focused unit tests for complete, partial, demo, and missing-evidence cases.

Acceptance criteria:
- Demo runs render a non-negotiable warning that prevents external sharing of raw numbers.
- The sponsor one-pager PDF (SponsorOnePagerPdfBuilder) renders a full-width "ILLUSTRATION ONLY ?
  not a commitment" header on every page when IsDemoTenant is true, not only a banner in the body
  of page 1. Use QuestPDF page.Header() so the stamp persists across any page overflow and
  survives screenshot cropping.
- ResolveTier uses two separate lists: hardGaps and softGaps. hardGaps.Count > 0 || demoTenant
  returns DemoOnly / NotSendable. softGaps.Count > 0 (with no hard gaps) returns Partial /
  SendableWithCaveats. Zero gaps in both lists returns Complete / Sendable.
- Hard blocks (NotSendable, same tier as DemoOnly):
    - manifest is null OR run.Status != Committed
    - AuditRowCount == 0
- Soft warnings (SendableWithCaveats):
    - RealModeFellBackToSimulator
    - TopFindingId is not null AND TopFindingEvidenceChain is null
    - ROI baseline is NoMeasurementYet or DefaultedFromRoiModelOptions
- Missing proof fields render as incomplete, not invented.
- Existing first-value report tests still pass or are updated intentionally.
- Unit tests cover: DemoOnly (demo tenant), NotSendable from hard-block manifest gap,
  NotSendable from hard-block zero-audit gap, SendableWithCaveats from simulator fallback,
  SendableWithCaveats from missing evidence chain, SendableWithCaveats from defaulted ROI,
  Complete / Sendable (all clear).
- No new external dependencies.
- Do not add a second PDF template (that is V1.1 scope).
- Do not change pricing, customer reference docs, or deferred V1.1 reference-customer status.
- Do not rename REST paths, DTO field names, or database entities.
```

**Impact of running this prompt:** Directly improves Proof-of-ROI Readiness (+8?10 pts), Marketability (+3?5 pts), Trustworthiness (+2?4 pts). Weighted readiness impact: **+0.8?1.1%**.

---

### Improvement 2 ? Local Live UI/API/SQL Smoke Equivalence Flag

**Why it matters:** CI already proves full live UI ? API ? SQL parity on every PR via three merge-blocking `ui-e2e-live` jobs (26 `live-api-*.spec.ts` specs, real SQL 2022 container, three auth modes). The gap is **local only**: `release-smoke.ps1 -RunPlaywright` runs mock Playwright (fixture loopback), not the live suite. A developer or release operator validating locally gets a materially weaker signal than CI without realising it. The documentation (`RELEASE_SMOKE.md`) accurately describes this limitation ? which means the weakness is real but it is in the **local tooling**, not in CI coverage or code correctness.

**Expected impact:** Operators running local release validation get the same signal as CI. Reduces the risk of a false-confidence local pass before a release.

**Affected qualities:** Reliability, Deployability, Testability, Trustworthiness (release confidence).

**Status:** Fully actionable now.

**Cursor prompt:**
```
Add a -LivePlaywright flag to release-smoke.ps1 that mirrors the CI ui-e2e-live job locally.

Context:
- CI job ui-e2e-live (ci.yml) is already a merge-blocking gate: real SQL Server, real
  ArchLucid.Api (Release), real Next.js standalone build, all live-api-*.spec.ts specs.
- release-smoke.ps1 -RunPlaywright currently runs npm run test:e2e (mock/fixture loopback,
  playwright.mock.config.ts) ? it does NOT call the live API started in steps 5-6.
- docs/library/LIVE_E2E_HAPPY_PATH.md documents the manual steps for live parity locally.
- The gap: no single local flag mirrors what CI does.

Scope:
- Add a -LivePlaywright switch to release-smoke.ps1 (and document in RELEASE_SMOKE.md).
- When -LivePlaywright is set and the E2E API is already running (steps 5-6 of the smoke),
  run npx playwright test using playwright.config.ts (the live config, matching
  testMatch: ["live-api-*.spec.ts"]) instead of playwright.mock.config.ts.
- Set LIVE_API_URL to match the smoke API base URL (-ApiBaseUrl, default http://localhost:5128)
  so the live specs target the same API instance.
- Set AgentExecution__Mode=Simulator on the API process (already the smoke default) so
  live specs do not require Azure OpenAI.
- Update the parity table in RELEASE_SMOKE.md to add a -LivePlaywright row that says "Yes".
- Add a note that -LivePlaywright requires ASPNETCORE_ENVIRONMENT=Development (already set
  by release-smoke for the child API process) and that LIVE_API_KEY / LIVE_JWT_TOKEN are
  optional (auth subset specs skip when not set, matching CI behavior).

Acceptance criteria:
- release-smoke.ps1 -LivePlaywright produces the same live-api-*.spec.ts run as CI's
  ui-e2e-live job against the smoke API instance.
- The existing -RunPlaywright behavior (mock Playwright) is unchanged.
- The parity table in RELEASE_SMOKE.md correctly marks -LivePlaywright as proving
  live UI ? SQL parity.
- -LivePlaywright is skipped gracefully (with a warning) if -SkipE2E was also passed
  (no API to test against).
- No CI workflow files are modified.
- No test specs are added, removed, or modified.
```

**Impact of running this prompt:** Improves Deployability (+4?6 pts), Reliability (local validation signal), operator release-confidence UX. Weighted readiness impact: **+0.2?0.3%** (narrow scope ? CI is already strong).

---

### Improvement 3 — Per-Tenant Topology Lock and Residual RLS Tidy

**Why it matters:** Production is confirmed `SystemWithPerTenantCatalogs`, which eliminates cross-tenant lateral movement as the primary isolation risk. The remaining risk is narrower but concrete: (a) the code default is `SingleCatalog` and nothing in Terraform or deployment config prevents a production deployment from accidentally using it, (b) `FindingReviewEvents` and `ImportedArchitectureRequests` have all three scope columns but were omitted from migration 129's `ALTER SECURITY POLICY` sweep — one statement each, and (c) workspace/project isolation within a tenant relies on application-layer `WHERE` clauses with no database-layer backstop.

**Expected impact:** Closes the misconfiguration-to-SingleCatalog risk, completes the RLS policy for two in-scope tables, and documents the workspace/project isolation posture clearly for security reviewers.

**Affected qualities:** Security, Deployability, Trustworthiness, Compliance Readiness.

**Status:** Fully actionable now.

**Cursor prompt:**
```
Lock per-tenant topology as the production default and complete residual RLS policy coverage.

Context:
- Production topology is SystemWithPerTenantCatalogs (confirmed). Cross-tenant isolation is
  achieved by the database boundary. RLS is defense-in-depth within a tenant's database.
- SqlTopologyOptions.Mode defaults to SingleCatalog in code. No Terraform or deployment
  config currently prevents a production environment from using SingleCatalog.
- FindingReviewEvents (migration 121) has TenantId/WorkspaceId/ProjectId NOT NULL but was
  not added to rls.ArchLucidTenantScope in migration 129.
- ImportedArchitectureRequests (migration 122) has the same situation.

Scope:
1. Lock SingleCatalog to dev-only:
   - Add a startup validation rule in ArchLucid.Host.Core/Startup/Validation/ that
     emits a startup error (not warning) when Mode=SingleCatalog and
     ASPNETCORE_ENVIRONMENT is not Development or Test.
   - Document in TENANT_DATABASE_TOPOLOGY.md that SingleCatalog is dev/test only.
   - Add a Terraform variable guard comment (or tfvar default) in the infra module that
     makes SystemWithPerTenantCatalogs explicit for non-dev environments.

2. Complete FindingReviewEvents and ImportedArchitectureRequests RLS coverage:
   - Add a forward-only DbUp migration that applies FILTER + BLOCK predicates
     (archlucid_scope_predicate on TenantId, WorkspaceId, ProjectId) to both tables,
     guarded by IF NOT EXISTS to be idempotent.
   - Update ArchLucid.Persistence/Scripts/ArchLucid.sql for greenfield parity.
   - Update MULTI_TENANT_RLS.md section 9 to remove both from the uncovered list.

3. Document workspace/project isolation posture:
   - Add a brief section to MULTI_TENANT_RLS.md section 9 explicitly stating that
     workspace/project isolation within a tenant relies on application-layer WHERE
     clauses; RLS covers tenant-level isolation in per-tenant topology;
     workspace/project RLS is deferred.

Acceptance criteria:
- Starting the API with Mode=SingleCatalog in a non-dev/test environment fails at startup
  with a clear error message.
- FindingReviewEvents and ImportedArchitectureRequests appear in the RLS policy after
  the migration runs.
- Existing per-tenant integration tests continue to pass.
- No historical migrations are edited.
- No public SMB/445 exposure or non-Terraform infrastructure changes.
- The documentation clearly distinguishes cross-tenant isolation (DB boundary) from
  workspace/project isolation (application layer).
```

**Impact of running this prompt:** Improves Security (+2–3 pts on residual), Deployability (+2 pts misconfiguration prevention), Trustworthiness (+2 pts for security reviewers). Weighted readiness impact: **+0.1–0.2%** (major cross-tenant risk already eliminated by per-tenant topology).

---
### Improvement 4 ? Connector Readiness and Health Matrix

**Why it matters:** V1 commits to ServiceNow, Jira, Confluence, and Slack. Operators need deterministic readiness feedback rather than bespoke debugging when a connector is misconfigured or silent.

**Expected impact:** Reduces implementation friction and increases operator confidence for enterprise setups.

**Affected qualities:** Workflow Embeddedness, Interoperability, Adoption Friction, Supportability.

**Status:** Fully actionable now.

**Cursor prompt:**
```
Add a connector readiness and health model for V1 first-party integrations.
All V1 connectors must expose operator-visible health in the operator UI ? not only in
diagnostics docs or API responses.

Scope:
- Inventory current ServiceNow, Jira, Confluence, Slack, Teams, webhook, and
  integration-event code paths in ArchLucid.Application/Integrations,
  ArchLucid.Decisioning, and related configuration models.
- Add a shared readiness model with: enabled/disabled state, required config present,
  secret reference present (never the value), last test result timestamp when available,
  and supported directionality (outbound, inbound, bidirectional).
- Wire every V1 connector through this shared model ? no connector is exempt.
- Expose the model in the operator UI (a dedicated Integrations health surface or
  equivalent operator settings page) so operators do not need to read docs or API logs
  to confirm a connector is live and correctly configured.
- Expose the same data through an existing admin/operator API endpoint for tooling access.
- Update docs/go-to-market/INTEGRATION_CATALOG.md and related runbooks.
- Add unit tests for readiness classification without calling real external services.

Acceptance criteria:
- Every V1 connector (ServiceNow, Jira, Confluence, Slack, Teams, webhook,
  integration-event) renders a health/readiness state in the operator UI.
- Missing, disabled, or misconfigured connectors are visually distinguished from
  healthy connectors in the UI ? not hidden or absent.
- No real Jira/ServiceNow/Confluence/Slack HTTP calls in unit tests.
- Secrets are never logged, returned, or exposed in the readiness model output.
- V1 directionality is explicit: create, publish, outbound notify, inbound status sync.
- Missing inbound webhook secret renders as "misconfigured" (not "disabled") because
  the feature may be partially configured and silently failing.
- Deferred OAuth/Marketplace/App Directory items remain marked out of current scope.
- Readiness model does not replace API-level 401/403 posture for callers.
```

**Impact of running this prompt:** Improves Workflow Embeddedness (+8?10 pts), Interoperability (+5?7 pts), Adoption Friction (+3?5 pts). Weighted readiness impact: **+0.5?0.8%**.

---

### Improvement 5 ? Agent Output Quality Evidence Tightening

**Why it matters:** Correctness is the core product risk. Metrics and schemas exist; buyers need a reproducible quality evidence path for real model outputs, not just simulator confidence.

**Expected impact:** Stronger enterprise reliance posture and honest release evidence.

**Affected qualities:** Correctness, AI/Agent Readiness, Explainability, Trustworthiness.

**Status:** Fully actionable now.

**Cursor prompt:**
```
Tighten agent output quality evidence without making real-model execution brittle.

Scope:
- Review ArchLucid.AgentRuntime/Evaluation/ReferenceCases/, AgentOutputReferenceCaseCatalog.cs,
  AgentOutputReferenceCaseRunEvaluator.cs, AgentOutputReferenceCaseDefinition.cs,
  scripts/ci/eval_agent_corpus.py, scripts/ci/agent-reference-baselines.json,
  ArchLucid.AgentRuntime.Tests/Fixtures/GoldenAgentResults/, and
  docs/library/AGENT_OUTPUT_EVALUATION.md.
- Author the reference cases JSON file at the path expected by
  AgentExecution:ReferenceEvaluation:ReferenceCasesPath. Include exactly these 8 cases:

  1. topology-microservices-healthy   AgentType=Topology   MinStructural=0.80  MinSemantic=0.65  MinFindings=1  ExpectedCategories=["topology"]
  2. topology-coupling-problem        AgentType=Topology   MinStructural=0.80  MinSemantic=0.70  MinFindings=2  ExpectedCategories=["coupling","scalability"]
  3. cost-premium-stack               AgentType=Cost       MinStructural=0.75  MinSemantic=0.60  MinFindings=1  ExpectedCategories=["cost"]
  4. cost-orphaned-resources          AgentType=Cost       MinStructural=0.75  MinSemantic=0.65  MinFindings=1  ExpectedCategories=["cost","optimization"]
  5. compliance-public-no-waf         AgentType=Compliance MinStructural=0.80  MinSemantic=0.70  MinFindings=1  ExpectedCategories=["security","network"]
  6. compliance-no-managed-identity   AgentType=Compliance MinStructural=0.80  MinSemantic=0.70  MinFindings=1  ExpectedCategories=["identity","access-control"]
  7. critic-single-point-of-failure   AgentType=Critic     MinStructural=0.75  MinSemantic=0.65  MinFindings=1  ExpectedCategories=["reliability","resilience"]
  8. critic-cost-overconfidence        AgentType=Critic     MinStructural=0.75  MinSemantic=0.65  MinFindings=1  ExpectedCategories=["assumptions","uncertainty"]

- Author 8 corresponding simulator-compatible AgentResult JSON fixtures under
  ArchLucid.AgentRuntime.Tests/Fixtures/GoldenAgentResults/ (one per case). Each fixture must
  have: non-empty claims with evidenceRefs or evidence strings, findings with non-empty severity
  + description (>10 chars) + recommendation (>5 chars), and the expected finding categories
  listed above.
- Add each fixture to scripts/ci/agent-reference-baselines.json per the existing pattern.
- Add a structured release-evidence capture path that records for a representative run:
  structural score distribution, semantic score distribution, parse failure count, schema
  violation count, quality gate outcomes, and faithfulness fallback count.
- Format the evidence consistently with the existing Invoke-ReleaseEvidenceSummary.ps1 output.
- Add tests that each reference case passes against its paired fixture and fails when findings
  are emptied or categories are removed.

Acceptance criteria:
- All 8 reference cases pass against their paired fixtures in CI.
- Each case fails deterministically when the paired fixture is degraded (empty findings or
  missing evidence refs).
- Real-model quality evidence can be collected and attached to release evidence without
  requiring a production environment.
- Real-model quality scores (structural completeness and semantic score) against the 8 reference
  cases must be surfaced as a named gate in release sign-off output ? not silently appended to
  the evidence bundle. Any case where the actual score falls below the floor must render as a
  named FAIL that requires an explicit acknowledgement or formal waiver comment before a release
  can be marked complete. The gate output must list: CaseId, AgentType, expected floor, actual
  score, and PASS/FAIL status per case.
- Simulator-only runs are exempt from the named gate (simulator results are not real-model
  evidence); clearly label simulator-sourced scores as SIMULATOR ? NOT RELEASE EVIDENCE.
- Warn-only defaults remain unchanged and clearly labeled as such.
- No fake pass/fail claims from simulator-only runs.
- No new model or cloud provider dependency introduced.
- Evidence output redacts API keys and prompts.
- Do not modify or delete existing golden fixtures or the harness topology/compliance pair.
```

**Impact of running this prompt:** Improves Correctness (+5?7 pts), AI/Agent Readiness (+5?7 pts), Explainability (+3?4 pts). Weighted readiness impact: **+0.4?0.6%**.

---

### Improvement 6 ? First-Run Cognitive Load Reduction

**Why it matters:** The product is rich enough to confuse evaluators. The first session must feel smaller to convert interest into a committed pilot.

**Expected impact:** Faster time-to-value, better first-impression conversion.

**Affected qualities:** Adoption Friction, Usability, Cognitive Load, Time-to-Value.

**Status:** Fully actionable now.

**Cursor prompt:**
```
Reduce first-run cognitive load in the operator UI.

Scope:
- Review docs/CORE_PILOT.md, archlucid-ui home/onboarding/new-run/run-detail surfaces,
  nav disclosure code, and LayerHeader guidance.
- Identify where first-time users encounter Operate/governance/advanced concepts before
  completing the four-step Core Pilot (create, execute, commit, review).
- Apply copy and layout changes that keep the first-session path focused and treat all
  Operate layers as clearly optional follow-on.
- Preserve progressive disclosure, API authorization semantics, and all authority seams.

Acceptance criteria:
- First-run pages do not imply Compare/Replay/Graph/Governance are required for pilot success.
- Existing nav authority, disclosure, and seam regression tests remain passing.
- No REST route, DTO field name, database entity, or policy name is renamed.
- UI changes are limited to copy, layout order, and disclosure defaults.
- Add or update focused Vitest tests where first-session guidance behavior changes.
```

**Impact of running this prompt:** Improves Adoption Friction (+4?6 pts), Usability (+5?7 pts), Cognitive Load (+8?10 pts). Weighted readiness impact: **+0.4?0.6%**.

---

### Improvement 7 ? Preventive Data Consistency Constraint Pass

**Why it matters:** Detection is good; prevention is better. One preventive constraint reduces the ongoing operational burden of orphan reconciliation.

**Expected impact:** Reduces data consistency risk and operator remediation load.

**Affected qualities:** Data Consistency, Reliability, Correctness, Supportability.

**Status:** Fully actionable now.

**Cursor prompt:**
```
Add a preventive data consistency constraint for the highest-risk orphan-prone relationship.

Scope:
- Review docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md, orphan probe code,
  DbUp migrations, and repository writes for GoldenManifests, FindingsSnapshots,
  ContextSnapshots, and GraphSnapshots.
- Choose one relationship currently monitored for orphan drift where a foreign key,
  transactional write ordering, or repository invariant can safely prevent new orphans.
- Implement the smallest forward-only migration or code-level invariant enforcement.
- Add regression tests proving invalid parent references cannot be created through
  the repository or service layer.

Acceptance criteria:
- No historical migrations are edited.
- Existing quarantine and probe behavior remains for legacy data.
- Tests cover valid parent, missing parent, and cross-tenant cases.
- Do not delete or auto-repair existing production-like data without explicit operator action.
- No new external service dependency.
```

**Impact of running this prompt:** Improves Data Consistency (+6?8 pts), Reliability (+3?5 pts), Correctness (+2?4 pts). Weighted readiness impact: **+0.3?0.5%**.

---

### Improvement 8 ? Production Evidence Rollup

**Why it matters:** Enterprise buyers distinguish targets from measured service history. The 99.9% target is documented; no achieved rollup exists yet.

**Expected impact:** Closes the "target vs history" credibility gap for procurement conversations.

**Affected qualities:** Availability, Reliability, Procurement Readiness, Trustworthiness.

**Status:** Fully actionable now.

**Cursor prompt:**
```
Create an internal hosted availability evidence rollup process.

Scope:
- Review docs/library/SLA_TARGETS.md, hosted probe workflows in
  .github/workflows/hosted-saas-probe.yml and api-synthetic-probe.yml,
  and docs/runbooks/HOSTED_AVAILABILITY_ROLLUP.md.
- Implement or document a lightweight weekly rollup process that produces two
  separate summaries per run: one for staging, one for production. Each summary
  covers the prior 7-day probe window for its environment and must include:
  total probe minutes, downtime windows (non-200 for 5+ consecutive minutes),
  exclusions applied, and any windows with no data.
- Staging and production summaries must never be aggregated into a single number.
  Staging instability must not appear in or affect the production summary.
- Mark every output explicitly as internal and pre-contractual. The rollup must
  not be shared externally until a first paid customer is signed; until then,
  procurement conversations receive the 99.9% target and trust center posture only.
- Add a header stamp to the output: "INTERNAL ? pre-GA probe data, not a
  contractual SLA. Do not share externally before first paid customer."
- Add validation that the rollup does not claim an achieved SLA when evidence
  is incomplete or missing.

Acceptance criteria:
- Two separate output files or sections are produced per run: staging and production.
- Each rollup clearly separates target (99.9%) from measured availability.
- Missing probe windows are surfaced as gaps, not interpolated as up.
- The internal-only stamp is present and cannot be removed without editing the script.
- No contractual SLA language is introduced.
- No production secrets, customer data, or PII are included.
- Output is consistent with existing Trust Center prose.
```

**Impact of running this prompt:** Improves Availability (+8?10 pts), Procurement Readiness (+3?5 pts), Trustworthiness (+2?4 pts). Weighted readiness impact: **+0.2?0.4%**.

---

### Improvement 9 ? Evidence Chain Reviewer UI Hardening

**Why it matters:** The evidence chain (manifest version, findings snapshot, context snapshot, graph snapshot, decision trace, agent execution traces) exists in the API and is exposed via `GET .../run/{runId}/findings/{id}/evidence-chain`. Buyers and enterprise reviewers need to consume this chain without opening the API directly. The current UI surfaces the chain partially; a reviewer landing on a finding should be able to trace every artefact link without leaving the product.

**Expected impact:** Higher enterprise trust, better explainability story for first-value reviews, and stronger proof-of-correctness for governance sign-off conversations.

**Affected qualities:** Explainability, Traceability, Trustworthiness, Executive Value Visibility, Procurement Readiness.

**Status:** Fully actionable now.

**Cursor prompt:**
```
Harden the evidence chain section on the finding inspect and detail pages.

Scope:
- Review archlucid-ui/src/components/FindingExplainPanel.tsx (already fetches
  getFindingEvidenceChain and renders a partial evidence chain),
  archlucid-ui/src/app/(operator)/reviews/[runId]/findings/[findingId]/inspect/page.tsx
  (the dedicated traceability page ? currently has NO evidence chain),
  archlucid-ui/src/app/(operator)/reviews/[runId]/findings/[findingId]/page.tsx
  (has FindingExplainPanel in a collapsed section),
  archlucid-ui/src/types/explanation.ts (FindingEvidenceChain type),
  and archlucid-ui/src/lib/api.ts (getFindingEvidenceChain already defined).

Three gaps to close:

1. Add evidence chain to the inspect page.
   In inspect/page.tsx, call getFindingEvidenceChain(runId, decodedFindingId) server-side
   alongside the existing getFindingInspect call. Pass the result to FindingInspectView and
   render a new "Evidence chain" section in FindingInspectFindingBody (variant="inspect").
   Treat a thrown error from getFindingEvidenceChain as a null chain (same pattern as
   other optional fetches on that page).

2. Extend the evidence chain rendering to include the two missing fields.
   FindingExplainPanel currently renders manifestVersion, findingsSnapshotId, decisionTraceId,
   goldenManifestId, relatedGraphNodeIds, and agentExecutionTraceIds ? but NOT contextSnapshotId
   or graphSnapshotId which are present in FindingEvidenceChain.
   Add both to the rendered dl on both the panel and the new inspect section.

3. Add a computed completeness indicator.
   Define the optional IDs that must be present for a chain to be considered complete:
   findingsSnapshotId, contextSnapshotId, graphSnapshotId, decisionTraceId, goldenManifestId.
   Render:
   - "Evidence chain complete" (green/teal indicator) when all are non-null/non-empty.
   - "Partial chain ? missing: X, Y" (amber indicator) when one or more are absent, using
     human-readable field names (e.g. "context snapshot", "graph snapshot").
   Do not invent explanatory reasons for absence; label the missing field by name only.

Acceptance criteria:
- The inspect page (/inspect) shows the evidence chain server-side with all six optional IDs
  and the completeness indicator.
- The finding detail page (/findings/{id}) shows contextSnapshotId and graphSnapshotId in
  FindingExplainPanel alongside the existing fields.
- Missing IDs render as a named gap in the completeness indicator, not a bare "?" only.
- Complete chains render a "Evidence chain complete" badge/label.
- getFindingEvidenceChain is not called a second time on the inspect page if it is already
  fetched server-side (avoid duplicate client-side fetches).
- No REST route, DTO field, database entity, or existing test is renamed or deleted.
- No new external dependencies.
- Add Vitest tests for complete, partial (one missing), and null-chain states on the
  new completeness indicator logic.
- Existing finding-inspect and FindingExplainPanel tests remain passing or are
  intentionally updated with a clear comment.
```

**Impact of running this prompt:** Improves Explainability (+6?8 pts), Traceability (+4?6 pts), Trustworthiness (+3?4 pts), Procurement Readiness (+2?3 pts). Weighted readiness impact: **+0.4?0.6%**.

---

### Improvement 10 ? Route/Policy/Nav Drift Automation

**Why it matters:** A broad surface area makes entitlement, authority, and UI drift a durable risk. New routes frequently need aligned tier filter, API policy, and nav entry ? manual coordination fails at scale.

**Expected impact:** Reduces entitlement and authority drift as connectors and governance surfaces ship.

**Affected qualities:** Maintainability, Security, Commercial Packaging Readiness, Usability.

**Status:** Fully actionable now.

**Cursor prompt:**
```
Strengthen route, policy, tier, and nav drift automation.

Scope:
- Review docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md,
  docs/library/PRODUCT_PACKAGING.md, API controller policies,
  CommercialTenantTierFilter, and archlucid-ui/src/lib/nav-config.ts.
- Add or extend a test or CI script that detects mismatches between the
  documented route policy/tier expectations and implemented controller or
  nav metadata where this can be done deterministically.
- Prefer checking a curated matrix over full reflection; the matrix already exists
  in ROUTE_TIER_POLICY_NAV_MATRIX.md.
- Update the matrix and test for any discovered drift.

Acceptance criteria:
- A new protected operator route that is missing from the policy/tier/nav matrix
  causes the test to fail, not just warn.
- API returns 401/403/404 correctly regardless of nav state ? the test does not
  substitute nav shaping for authorization.
- No commercial pricing or deferred commerce cutover scope is changed.
- Existing authority seam regression tests remain passing.
- Does not require runtime HTTP calls in the policy/tier matrix check.
```

**Impact of running this prompt:** Improves Maintainability (+4?6 pts), Security (+2?4 pts), Commercial Packaging Readiness (+3?5 pts). Weighted readiness impact: **+0.3?0.5%**.

---

## 10. Pending Questions for Later

**Improvement 1 ? Buyer-Safe First-Value Proof Gate:**
- ~~Which proof fields are mandatory (block send) vs advisory-only (warn but allow)?~~ **RESOLVED (2026-05-06):** Hard blocks (upgrade to `NotSendable` alongside `DemoOnly`): missing committed manifest (`manifest is null || status != Committed`), and zero audit rows (`AuditRowCount == 0`). Soft warnings (remain `SendableWithCaveats`): simulator fallback (`RealModeFellBackToSimulator`), missing top-finding evidence chain, and defaulted/no-measurement ROI baseline. `ResolveTier` must use a separate `hardGaps` list so that `hardGaps.Count > 0 || demoTenant` returns `DemoOnly`.
- **Field sales demo banner ? elaborated (open, needs owner decision):**

  **What the code currently does:**
  `PilotBuyerSafeEvidenceGateEvaluator` produces `DemoOnly` ? `NotSendable`. The Markdown formatter renders
  "Not sendable externally" plus the gap text "Seeded/demo tenant ? replace before external sponsor
  screenshots or purchase narratives." The PDF builder (`SponsorOnePagerPdfBuilder`) renders a single
  yellow/red banner box inline in the content area of page 1. The `NotSendable` posture is advisory ?
  it does not prevent the PDF from being generated, opened, or attached to an email.

  **The field sales risk:**
  An AE or SE sharing this PDF with a prospect during a live demo is likely to use the seeded Contoso
  Retail numbers (audit rows, findings, LLM call counts, time-to-commit) as a reference point. The
  prospect receives the PDF and may quote those figures in their internal business case. When the real
  ArchLucid run produces different numbers, the delta is a credibility problem, not just an expectation
  mismatch.

  A single colored box in the body of page 1 is easy for a busy prospect to miss. It does not survive
  a screenshot crop. It does not appear on page 2 or subsequent pages if content overflows.

  **The three implementation options:**

  | Option | What it does | Engineering cost | Field sales UX |
  |--------|-------------|-----------------|---------------|
  | **A ? Page-level header stamp** | Add "ILLUSTRATION ONLY ? not a commitment" as a bold full-width header on every page in the QuestPDF template when `IsDemoTenant`. One call to `page.Header()` per page. | ~30 min | Survives screenshotting; prospect cannot miss it |
  | **B ? Separate "illustrative" PDF template** | Replace computed numbers with labelled ranges ("3?15 findings, illustrative") and add a distinct visual treatment throughout. | ~2?3 days | Explicitly safe for a polished field demo but requires two maintained templates |
  | **C ? Keep current banner; enforce no-export** | Block PDF generation when tier is `DemoOnly`; force operator to use the live UI for demos only. | ~1 hour | No sendable artifact; demo must be screen-based |

  **Recommendation (pending owner confirmation):**
  Option A is the right default for V1 ? it is a one-line QuestPDF change, survives any export/screenshot
  path, and does not require a second template to maintain. If field sales needs a polished "illustrative
  deck" style artifact for prospect leave-behinds, that is Option B and belongs in V1.1.
  Option C actively reduces demo value and is not recommended unless there is evidence of actual
  misuse.

  **RESOLVED:** Option A (per-page header stamp) for V1. Option B (illustrative template) for V1.1.

**Improvement 4 ? Connector Readiness and Health Matrix:**
- ~~Which connectors must expose operator-visible health in the V1 operator UI versus diagnostics/docs only?~~ **RESOLVED:** All connectors must expose operator-visible health in the UI.
- ~~Should inbound webhook secret absence render as "disabled" or "misconfigured"?~~ **RESOLVED:** "misconfigured" ? a missing secret means the feature may be partially configured and silently failing.

**Improvement 5 ? Agent Output Quality Evidence Tightening:**
- **Canonical reference case set ? recommendation (open, needs owner sign-off on scenario text):**

  **What the infrastructure already supports:**
  `AgentOutputReferenceCaseCatalog` loads cases from a JSON file at `AgentExecution:ReferenceEvaluation:ReferenceCasesPath`.
  Each case is an `AgentOutputReferenceCaseDefinition` with: `CaseId`, `AgentType`, `MinimumStructuralCompleteness`,
  `MinimumSemanticScore`, `MinimumFindingCount`, `ExpectedFindingCategories`, and `RequiredJsonKeys`.
  The evaluator scores structural completeness (key presence ratio) and semantic quality (claims-with-evidence ?0.4 +
  findings-completeness ?0.6). The existing golden fixtures (`harness-agent-result-topology.json`,
  `harness-agent-result-compliance.json`, etc.) are minimal shape guards, not quality evidence.

  **What makes a reference case canonical (vs just a fixture):**
  1. The scenario is representative of a real buyer query ? what ArchLucid would actually run for the Contoso Retail
     analogue or an Azure-native enterprise.
  2. The expected output dimensions are tight enough that a weak agent response fails (not every non-empty JSON passes).
  3. The input context is derivable from existing demo data so the case runs against the simulator without Azure OpenAI
     credentials.
  4. Both the structural and semantic evaluator dimensions are exercised simultaneously.

  **Recommended set ? 2 cases per AgentType (8 total):**

  | CaseId | AgentType | Scenario | MinStructural | MinSemantic | MinFindings | ExpectedCategories |
  |--------|-----------|----------|---------------|-------------|-------------|-------------------|
  | `topology-microservices-healthy` | Topology | 5-service cloud-native app (API, auth, DB, cache, worker) with no obvious anti-patterns; agent should describe topology and emit at least one informational observation | 0.80 | 0.65 | 1 | `["topology"]` |
  | `topology-coupling-problem` | Topology | Monolith or tightly coupled service pair with shared database; agent should propose decomposition and emit coupling and scalability findings | 0.80 | 0.70 | 2 | `["coupling", "scalability"]` |
  | `cost-premium-stack` | Cost | Azure-native topology using premium-tier services (Cosmos DB, Premium App Service, Azure Front Door with WAF); agent should surface cost findings | 0.75 | 0.60 | 1 | `["cost"]` |
  | `cost-orphaned-resources` | Cost | Topology containing underused or orphaned services; agent should flag cost optimization opportunities | 0.75 | 0.65 | 1 | `["cost", "optimization"]` |
  | `compliance-public-no-waf` | Compliance | Public-facing API with no WAF or private endpoint; agent should flag network exposure and security posture | 0.80 | 0.70 | 1 | `["security", "network"]` |
  | `compliance-no-managed-identity` | Compliance | System using credential-based auth rather than managed identity; agent should flag identity and access control gaps | 0.80 | 0.70 | 1 | `["identity", "access-control"]` |
  | `critic-single-point-of-failure` | Critic | Topology with a single-instance data store and no redundancy; Critic should challenge the lack of HA and emit reliability findings | 0.75 | 0.65 | 1 | `["reliability", "resilience"]` |
  | `critic-cost-overconfidence` | Critic | A Cost agent output with aggressive assumptions and narrow error bars; Critic should challenge the assumptions and flag confidence gaps | 0.75 | 0.65 | 1 | `["assumptions", "uncertainty"]` |

  **Grounding constraint:** All 8 input scenarios should be representable as lightweight JSON context documents
  derivable from the existing Contoso Retail demo seed data or a simple Azure-native analogue, so CI can run
  them against the simulator without real Azure OpenAI credentials.

  **RESOLVED:** All 8 scenarios confirmed as the canonical reference case set. The evaluator infrastructure
  and CI script (`scripts/ci/eval_agent_corpus.py`) are already in place; the only work is authoring the
  8 input JSON fixtures and the reference cases JSON file.

- ~~Should structural/semantic score floors for real-model runs be surfaced in release sign-off or remain advisory?~~ **RESOLVED (2026-05-06):** Named gate. Structural and semantic score floors against the 8 canonical reference cases must appear as a named, documented gate in release sign-off. A failure must be explicitly acknowledged or formally waived before a release proceeds ? not silently recorded in the evidence bundle.

**Improvement 8 ? Production Evidence Rollup:**
- ~~Should achieved availability remain internal only until first paid customer, or become NDA-shareable on request from procurement?~~ **RESOLVED (2026-05-06):** Internal only until first paid customer. Procurement conversations before that point receive the 99.9% target and trust center posture only ? not measured probe numbers. The rollup output must be stamped accordingly.
- ~~Is a monthly rollup cadence sufficient or should weekly summaries be produced for staging and production separately?~~ **RESOLVED (2026-05-06):** Weekly summaries, staging and production separately. Each summary covers the prior 7-day probe window for its environment. Staging instability must not be aggregated with production numbers.

**Improvement 9 ? Evidence Chain Reviewer UI Hardening:**
- ~~Which finding-inspect UI surfaces already partially render the evidence chain, so they can be extended in-place rather than built from scratch?~~ **RESOLVED (code read 2026-05-06):** See full analysis below.

  **What already exists:**
  `FindingExplainPanel` (client component, `src/components/FindingExplainPanel.tsx`) already calls
  `getFindingEvidenceChain` and renders a violet "Evidence chain (persisted pointers)" section showing:
  manifest version, findings snapshot ID, decision trace ID, golden manifest ID, related graph node IDs,
  agent execution trace IDs.

  **Where it appears:**
  - **Finding Detail page** (`/reviews/{runId}/findings/{findingId}`) ? present, but buried in a collapsible
    "Technical audit trail" section that is collapsed by default. A reviewer has to know to expand it.
  - **Technical Inspection page** (`/reviews/{runId}/findings/{findingId}/inspect`) ? **completely absent**.
    The inspect page is the dedicated traceability surface but has no evidence chain at all.

  **Three concrete gaps remaining:**
  1. `contextSnapshotId` and `graphSnapshotId` are in `FindingEvidenceChain` but are NOT rendered
     anywhere ? only manifestVersion, findingsSnapshotId, decisionTraceId, goldenManifestId are shown.
  2. Missing IDs render as a bare "?" with no named gap reason. A reviewer cannot tell whether the
     absence is expected (e.g. "finding raised before graph commit") or a data problem.
  3. No "complete / partial chain" status indicator exists ? a reviewer must scan all fields manually
     to determine completeness.

  **What the improvement needs to do:**
  - Add the evidence chain section to the **inspect page** (server-side fetch alongside the existing
    `getFindingInspect` call in `inspect/page.tsx`).
  - Extend `FindingExplainPanel` (or the new inspect-page section) to render `contextSnapshotId` and
    `graphSnapshotId`.
  - Add a computed "complete / partial chain" label with named gap reasons for any absent optional ID.
  - No new API endpoint needed; `getFindingEvidenceChain` already exists in `api.ts`.
