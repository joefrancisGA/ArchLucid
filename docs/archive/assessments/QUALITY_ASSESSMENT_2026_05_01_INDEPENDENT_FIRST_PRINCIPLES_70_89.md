> **Scope:** Independent first-principles quality assessment of current ArchLucid repository state using fixed commercial, enterprise, and engineering weights; excludes explicitly deferred v1.1/v2 scope from readiness penalties.

# ArchLucid Assessment - Weighted Readiness 70.89%

## Executive Summary

Overall readiness is solid but not cleanly enterprise-buyable yet. The core product is technically coherent, heavily instrumented, and unusually well documented for a v1. The weighted drag is concentrated in commercial conversion surfaces (marketability-to-purchase gap), procurement confidence (attestation posture), and avoidable user cognitive load despite strong capability depth.

Commercial picture: the product can prove value in pilots, but deal velocity is constrained by deferred commerce/attestation milestones, mixed “available vs planned” integration reality for common enterprise systems, and a still sales-assisted motion where buyers increasingly expect low-friction self-serve confidence.

Enterprise picture: traceability, auditability, and governance are stronger than typical early-stage SaaS. The limiting factor is not controls design; it is third-party assurance maturity and procurement signal strength (SOC 2 Type II not issued, third-party pen test deferred), which slows security-review throughput.

Engineering picture: architecture integrity, modularity, observability, and test structure are materially strong. The main engineering risk is not code quality collapse; it is reliability/scalability proof at higher operational load and the cognitive complexity tax of a broad surface area.

## Deferred Scope Uncertainty

- One deferred-proof pointer in pricing docs references `docs/security/PEN_TEST_PROGRAM.md`, but that file is not currently present. Deferred intent is still identifiable through `docs/library/V1_DEFERRED.md` and `docs/library/V1_SCOPE.md`, but that specific evidence link remains unresolved.

## Weighted Quality Assessment

Ordered by urgency (weighted deficiency signal = `Weight * (100 - Score)`), highest first.

| Quality | Score | Weight | Weighted impact on readiness | Weighted deficiency signal | Justification | Tradeoffs | Improvement recommendations | Fixability window |
|---|---:|---:|---:|---:|---|---|---|---|
| Marketability | 70 | 8 | 5.49 | 240 | Strong internal narrative and artifacts exist, but external buyer proof is still thin relative to claims. | Honest claims protect trust but reduce headline excitement. | Tighten public proof chain and remove weak claims that cannot be externally verified. | v1 |
| Adoption Friction | 62 | 6 | 3.65 | 228 | Product depth is high; onboarding burden remains non-trivial for new teams. | Rich capability set increases setup and learning load. | Narrow default journeys and add stronger opinionated “first value in one session” rails. | v1 |
| Proof-of-ROI Readiness | 68 | 5 | 3.33 | 160 | ROI model is credible, but baseline collection and customer-verifiable outcomes are inconsistent. | Conservative claims improve integrity but may reduce close speed. | Automate before/after ROI capture and standardize sponsor-ready outputs. | v1 |
| Time-to-Value | 78 | 7 | 5.35 | 154 | Core pilot flow is clear and scripted, but real customer activation still has integration/ops overhead. | Strong safeguards can slow initial activation. | Add stricter “golden path” automation for first-run success and fewer prerequisite branches. | v1 |
| Differentiability | 72 | 4 | 2.82 | 112 | Explainability + governance + audit chain is differentiated, but category confusion with adjacent tools remains. | Broad messaging widens audience but dilutes edge. | Sharpen “evidence-linked architecture review” narrative and proof demos. | v1 |
| Trustworthiness | 64 | 3 | 1.88 | 108 | Internal controls are strong; external assurance signals are still limited. | Honest posture avoids overclaiming but weakens buyer confidence. | Improve trust-center evidence freshness and third-party-ready packet quality. | v1 (full closure extends to v2 for third-party pen test) |
| Executive Value Visibility | 74 | 4 | 2.90 | 104 | Sponsor artifacts exist, but executive outcomes are not yet consistently tied to customer-specific business deltas. | Technical accuracy can under-communicate strategic impact. | Promote one-page executive KPI deltas from live runs. | v1 |
| Correctness | 74 | 4 | 2.90 | 104 | Contract tests, golden fixtures, and quality gates are present; multi-path complexity still creates edge-case risk. | Flexibility across modes/providers introduces correctness variance. | Expand deterministic replay/contract invariants on critical flows. | v1 |
| Workflow Embeddedness | 66 | 3 | 1.94 | 102 | Good API/CLI/webhook foundations; first-party connectors for common enterprise systems are deferred. | Deferring connectors kept v1 focused. | Strengthen production-grade bridge recipes and reference implementations. | v1 |
| Usability | 68 | 3 | 2.00 | 96 | Operator guidance exists, but route/capability depth still imposes cognitive switching costs. | Progressive disclosure avoids overwhelm but can hide discoverability. | Consolidate repetitive surfaces and tighten task-oriented UI paths. | v1 |
| Procurement Readiness | 54 | 2 | 1.06 | 92 | Procurement docs are extensive, but SOC 2 Type II absence is a hard buying friction in many enterprises. | Evidence honesty preserves credibility. | Make procurement pack more “decision-ready” with explicit gap-to-plan mapping and timestamps. | v1 (attestation itself beyond v1) |
| Decision Velocity | 55 | 2 | 1.08 | 90 | Buyer decisions may stall on trust/commercial gating despite good technical substance. | Guardrails and staged rollout reduce operational risk. | Improve quote-to-evaluation workflows and objection-handling proof assets. | v1 |
| Commercial Packaging Readiness | 57 | 2 | 1.12 | 86 | Pricing and tier docs are mature, but checkout/publication realities remain partially deferred. | Sales-led path controls risk. | Harden self-serve funnel and make packaged offer boundaries unambiguous in product/UI. | v1 |
| Compliance Readiness | 58 | 2 | 1.14 | 84 | Compliance mapping is strong internally; external certification maturity limits readiness perception. | Building controls first before attestation is rational. | Improve compliance evidence automation and buyer-facing attestation status clarity. | v1 |
| Security | 72 | 3 | 2.12 | 84 | Threat models, RLS, private endpoint posture, and CI security checks are good; assurance externalization lags. | Conservative architecture may slow some integrations. | Close doc-evidence gaps and harden operational security drills/reporting loops. | v1 |
| Interoperability | 60 | 2 | 1.18 | 80 | API/webhooks/events are solid; integration breadth for buyer-native systems is still limited in first-party form. | Platform neutrality avoided for speed. | Ship executable integration starter kits with testable contracts. | v1 |
| Architectural Integrity | 79 | 3 | 2.32 | 63 | Boundaries, ADRs, and container decomposition are coherent. | Rich domain decomposition raises coordination overhead. | Maintain strict contract and seam tests as change accelerates. | v1 |
| Reliability | 70 | 2 | 1.37 | 60 | Reliability patterns exist, but real-world resilience evidence under broader load profiles is still developing. | Heavy safeguards can add complexity and latency. | Add explicit reliability SLO drill evidence and failure budget tracking. | v1 |
| Traceability | 82 | 3 | 2.41 | 54 | Strong run/evidence/audit lineage and documentation coverage. | High trace detail increases storage and UI complexity. | Improve trace UX summarization for non-technical stakeholders. | v1 |
| Azure Compatibility and SaaS Deployment Readiness | 75 | 2 | 1.47 | 50 | Azure-first posture and Terraform assets are substantial. | Azure bias may limit multi-cloud buyer comfort. | Package clearer “Azure default, others later” deployment patterns. | v1 |
| Data Consistency | 76 | 2 | 1.49 | 48 | Orphan detection/remediation and consistency instrumentation are present. | More checks can increase operational overhead. | Expand auto-safe remediation playbooks and auditable enforcement toggles. | v1 |
| Maintainability | 77 | 2 | 1.51 | 46 | Modular solution structure and style guidance are strong. | Extensive rules/docs can slow contributor throughput. | Add contributor automation to reduce manual policy burden. | v1 |
| AI/Agent Readiness | 78 | 2 | 1.53 | 44 | Agent output evaluation, semantic scoring, and fallback patterns are mature for v1. | Quality gates can reduce throughput under noisy outputs. | Add automated drift triage for prompt/model regressions. | v1 |
| Accessibility | 57 | 1 | 0.56 | 43 | VPAT and evidence map exist, but product maturity still indicates practical accessibility debt risk. | Fast UI iteration can outpace accessibility hardening. | Expand automated accessibility checks on highest-traffic flows. | v1 |
| Stickiness | 60 | 1 | 0.59 | 40 | Strong for governance-heavy teams, less sticky for lightweight one-off use cases. | Broad applicability may reduce deep lock-in patterns. | Build recurring-value loops (alerts/digests/review cadence). | v1 |
| Policy and Governance Alignment | 80 | 2 | 1.57 | 40 | Governance controls and workflow semantics are robust. | Governance depth can increase setup burden. | Improve default policy-pack onboarding and rationale explainers. | v1 |
| Explainability | 80 | 2 | 1.57 | 40 | Explainability traces, citation-bound outputs, and faithfulness checks are meaningful strengths. | Additional checks can increase compute/runtime cost. | Surface explainability confidence in simpler executive language. | v1 |
| Cognitive Load | 63 | 1 | 0.62 | 37 | Documentation is deep but overwhelming; interface has many advanced branches. | Depth supports experts but burdens new operators. | Create stricter role-oriented modes and context-sensitive pruning. | v1 |
| Scalability | 64 | 1 | 0.63 | 36 | Scalability intent is documented, but production-scale proof remains limited. | Conservative scaling claims avoid overpromising. | Extend repeatable load evidence with growth-step playbooks. | v1 |
| Cost-Effectiveness | 65 | 1 | 0.64 | 35 | Cost controls exist (quota/budget), but buyer-facing cost predictability under scale is still maturing. | Strong safeguards may limit aggressive usage. | Publish clearer cost envelopes by workload profile. | v1 |
| Auditability | 83 | 2 | 1.63 | 34 | Typed audit event strategy and append-only controls are strong. | Event breadth can increase operational query complexity. | Improve audit evidence packaging for procurement workflows. | v1 |
| Performance | 66 | 1 | 0.65 | 34 | k6 and performance gates exist, but performance confidence remains scenario-dependent. | Rich validations increase latency in some paths. | Add route-level performance budgets with trend regression alerts. | v1 |
| Availability | 68 | 1 | 0.67 | 32 | Availability targets and probes are defined; contractual maturity is still pre-GA. | Target posture avoids legal over-commitment. | Improve transparent uptime reporting and incident communication rhythm. | v1 |
| Customer Self-Sufficiency | 69 | 1 | 0.68 | 31 | Documentation and scripts are extensive, but still operator-heavy for some buyers. | Self-service simplification may reduce flexibility. | Add narrower guided setup paths and fewer configuration decisions. | v1 |
| Template and Accelerator Richness | 71 | 1 | 0.70 | 29 | Integration and procurement templates are good and improving. | Template breadth can drift without ownership rigor. | Prioritize executable templates over narrative-only examples. | v1 |
| Manageability | 71 | 1 | 0.70 | 29 | Config/ops controls are substantial. | Large configuration surface can induce misconfiguration. | Add config linting and safer defaults for production profiles. | v1 |
| Change Impact Clarity | 72 | 1 | 0.71 | 28 | Changelog and ADR discipline are strong. | High change velocity can still obscure cross-cutting impact. | Add impact summaries tied to domain/service boundaries. | v1 |
| Supportability | 73 | 1 | 0.72 | 27 | Support bundle and correlation patterns are good. | More diagnostics can expose sensitive detail if unmanaged. | Add support triage runbook automation and redaction checks. | v1 |
| Evolvability | 73 | 1 | 0.72 | 27 | Architecture supports iterative evolution with clear seams. | Strict boundary management slows ad-hoc changes. | Keep ADR and contract-test governance tight for extensibility changes. | v1 |
| Extensibility | 74 | 1 | 0.73 | 26 | Extension points exist via API/events/connectors. | Too many extension patterns can fragment quality. | Standardize extension templates with acceptance tests. | v1 |
| Deployability | 76 | 1 | 0.75 | 24 | Deployment scripts/checklists and IaC are mature. | Multiple deployment options can confuse first-time operators. | Deliver one primary deployment track and relegate alternatives. | v1 |
| Testability | 80 | 1 | 0.78 | 20 | Test tiers, contract snapshots, mutation testing, and CI structure are unusually strong. | High test rigor increases maintenance workload. | Keep flaky-test burn-down visible and continuous. | v1 |
| Modularity | 81 | 1 | 0.79 | 19 | Solution decomposition and boundaries are strong. | More modules can increase integration overhead. | Maintain seam ownership maps and dependency constraints. | v1 |
| Observability | 82 | 1 | 0.80 | 18 | Instrumentation depth and runbooks are a standout strength. | Signal volume can create noise without tuning. | Add opinionated SLO dashboards per persona. | v1 |
| Azure Ecosystem Fit | 83 | 1 | 0.81 | 17 | Azure-native alignment is consistent and practical. | Azure-first may reduce non-Azure buyer appeal. | Keep portable abstractions where possible without diluting Azure path. | v1 |
| Documentation | 86 | 1 | 0.84 | 14 | Documentation depth and indexing are exceptional. | Depth itself can become navigational burden. | Curate “must-read” subsets by persona and lifecycle stage. | v1 |

## Top 10 Most Important Weaknesses

1. Commercial proof gap: strong internal artifacts, weaker external buyer-proof conversion surface.
2. Adoption complexity: powerful system, but too many first-session decisions for non-expert teams.
3. Procurement bottleneck: SOC 2 Type II absence remains a recurring enterprise blocker regardless of technical quality.
4. Integration reality mismatch: API/events are good, but first-party connectors for common systems are mostly not yet shipped.
5. Decision-velocity drag from “credible but not frictionless” purchase path.
6. Cognitive load from layered UX + broad capability breadth + deep docs.
7. Trust signal asymmetry: robust internal controls but limited external assurance signals.
8. Scale proof remains less mature than architecture and instrumentation maturity.
9. Performance/availability confidence is directionally good but still depends on careful environment/operator discipline.
10. Cost narrative still needs tighter workload-based predictability framing for buyer confidence.

## Top 5 Monetization Blockers

1. Procurement confidence lag (SOC 2 Type II not yet issued) slows purchase approvals.
2. Conversion flow still relies materially on sales-assisted paths in scenarios where buyers expect frictionless self-serve.
3. Reference-customer proof depth is not yet a strong force multiplier at scale.
4. Integration purchase objections (Jira/ServiceNow/Confluence first-party expectations) still require workaround narratives.
5. Packaging-to-entitlement clarity is documented but not always experienced as simple in-product buyer terms.

## Top 5 Enterprise Adoption Blockers

1. External attestation maturity (SOC 2 Type II, third-party pen-test publication) is below enterprise default procurement thresholds.
2. Operational setup still feels implementation-heavy for teams expecting near-immediate managed onboarding.
3. Interoperability expectations with incumbent ITSM/collab tools exceed current first-party connector reality.
4. Accessibility maturity signal exists but may not yet satisfy strict procurement accessibility gates in all enterprises.
5. Documentation depth can overwhelm implementation teams without tighter role-specific execution tracks.

## Top 5 Engineering Risks

1. Complexity risk: broad feature surface increases regression probability across policy/auth/replay/export seams.
2. Reliability-at-scale risk: resilience architecture is strong, but sustained high-scale empirical evidence is still maturing.
3. Performance drift risk: deep instrumentation and checks can accumulate latency without strict budget governance.
4. Misconfiguration risk: rich configuration and deployment options increase operator error probability.
5. Cognitive maintainability risk: high documentation and rule volume can slow engineering iteration and raise contributor variance.

## Most Important Truth

ArchLucid is already a technically serious system, but commercial and enterprise buying readiness still lags engineering maturity; growth is now constrained more by trust-and-adoption packaging than by core architecture quality.

## Top Improvement Opportunities

The first 8 are fully actionable now (no deferred gating).  

### 1) Build a buyer-proof “single source of truth” evidence path

- Why it matters: closes the marketability/procurement gap between strong internal docs and external buyer confidence.
- Expected impact: faster trust formation, fewer diligence loops, higher conversion confidence.
- Affected qualities: Marketability, Trustworthiness, Procurement Readiness, Decision Velocity.
- Actionability: Fully actionable now.
- Cursor prompt:

```text
Create a single canonical buyer-proof evidence index and enforce it in CI.

Scope:
1) Add/refresh `docs/go-to-market/PROCUREMENT_PACK_INDEX.md` as the authoritative “what exists, what status, where evidence lives” table.
2) Include explicit columns: Evidence Artifact, Evidence Type (Implemented/Self-asserted/In flight/Deferred), Last Reviewed UTC, Source File, Buyer-safe Claim.
3) Update `docs/trust-center.md` and `docs/go-to-market/PROCUREMENT_RESPONSE_ACCELERATOR.md` to reference only this index for status text to avoid drift.
4) Add a CI script under `scripts/ci/` that:
   - validates every entry path in the index exists,
   - validates status token is one of the approved values,
   - fails if Last Reviewed UTC is older than 90 days for Implemented entries.
5) Add workflow wiring in `.github/workflows/ci.yml`.

Acceptance criteria:
- New index exists and is linked from trust-center and procurement accelerator.
- CI fails on missing file links or invalid status labels.
- CI emits actionable error messages naming bad row/path.

Constraints:
- Do not invent attestation claims.
- Keep all statements aligned with current repo artifacts only.
- Do not change product behavior, only docs + CI validation.

Do not change:
- Existing V1/V1.1/v2 deferral decisions.
- Security posture claims beyond current documented evidence.
```

- Impact of running prompt: Directly improves Marketability (+5-7 pts), Trustworthiness (+3-5 pts), Procurement Readiness (+5-7 pts), Decision Velocity (+2-3 pts). Weighted readiness impact: +0.6-0.9%.

### 2) Harden first-session time-to-value with an opinionated “pilot in one sitting” rail

- Why it matters: adoption friction and cognitive load are currently the largest practical onboarding drags.
- Expected impact: higher completion from first login to committed manifest and review artifact.
- Affected qualities: Adoption Friction, Time-to-Value, Usability, Cognitive Load.
- Actionability: Fully actionable now.
- Cursor prompt:

```text
Implement a strict first-session pilot rail that defaults to the shortest successful path.

Scope:
1) In `archlucid-ui`, add a dedicated “First Session” guided flow component that only exposes:
   - create architecture request,
   - execute run,
   - commit,
   - review artifact.
2) Gate advanced/operate links behind an explicit “Show advanced now” step after first artifact review.
3) Add lightweight completion telemetry for each first-session step and store in existing diagnostics pipeline.
4) Update `docs/CORE_PILOT.md`, `docs/library/OPERATOR_DECISION_GUIDE.md`, and `docs/library/V1_RELEASE_CHECKLIST.md` with the exact guided sequence.
5) Add Vitest + Playwright coverage for:
   - successful linear flow,
   - recoverable failure states,
   - no accidental exposure of advanced actions before step completion.

Acceptance criteria:
- New user can complete first-session path without visiting advanced pages.
- Completion telemetry records all four mandatory steps.
- Tests enforce no regressions in guided sequence behavior.

Constraints:
- Keep existing API authorization as the only enforcement boundary.
- Do not remove existing advanced features; only reshape default path.

Do not change:
- Backend policy names/authorization semantics.
- Existing non-first-session operator capabilities.
```

- Impact of running prompt: Directly improves Adoption Friction (+6-9 pts), Time-to-Value (+3-5 pts), Usability (+3-5 pts), Cognitive Load (+4-6 pts). Weighted readiness impact: +0.8-1.2%.

### 3) Turn integration recipes into executable, testable starter kits

- Why it matters: integration expectations are a major blocker even when first-party connectors are deferred.
- Expected impact: reduces interoperability and workflow-embeddedness risk without violating deferred scope.
- Affected qualities: Interoperability, Workflow Embeddedness, Adoption Friction, Marketability.
- Actionability: Fully actionable now.
- Cursor prompt:

```text
Convert current integration recipe docs into runnable starter kits with validation tests.

Scope:
1) For ServiceNow and Jira bridge recipes, add concrete template assets under `templates/integrations/`:
   - sample payload transformers,
   - minimal deployment manifests/scripts,
   - test fixtures using canonical CloudEvents examples.
2) Add contract tests in a new or existing test project to validate:
   - required event fields,
   - idempotency key handling,
   - mapping output schema validity.
3) Add a recipe validation CI step that runs transformer tests and lints recipe examples.
4) Update `docs/integrations/recipes/*.md` and `docs/go-to-market/INTEGRATION_CATALOG.md` with “runnable starter kit” references.

Acceptance criteria:
- Starter kits run locally with documented commands.
- CI validates mappings against fixture payloads.
- Integration catalog clearly distinguishes first-party connectors vs customer-operated kits.

Constraints:
- Do not implement first-party Jira/ServiceNow product connectors.
- Keep all work within V1-supported webhook/API bridge posture.

Do not change:
- Deferred connector roadmap classification.
- Core event schema contract names without ADR.
```

- Impact of running prompt: Directly improves Interoperability (+6-8 pts), Workflow Embeddedness (+4-6 pts), Adoption Friction (+2-4 pts), Marketability (+2-3 pts). Weighted readiness impact: +0.5-0.8%.

### 4) Add continuous trust-center freshness and integrity gates

- Why it matters: trust materials lose value quickly when timestamps/links/status drift.
- Expected impact: higher enterprise trustworthiness and reduced procurement rework.
- Affected qualities: Trustworthiness, Procurement Readiness, Compliance Readiness.
- Actionability: Fully actionable now.
- Cursor prompt:

```text
Implement automated trust-center integrity and freshness validation.

Scope:
1) Add CI scripts to verify:
   - all markdown links in `docs/trust-center.md` resolve,
   - each posture summary row has a valid Last reviewed date,
   - date is not older than a configurable threshold by status class.
2) Add a generated “freshness badge” section to `docs/trust-center.md` based on script output.
3) Add a fail-fast mode for broken links and a warning mode for stale-but-noncritical rows.
4) Document maintenance workflow in a new runbook under `docs/runbooks/`.

Acceptance criteria:
- CI fails on broken trust-center links.
- CI reports stale rows with file/row context.
- Trust-center shows machine-generated freshness status.

Constraints:
- Do not fabricate updated review dates.
- Do not alter legal/compliance claims text beyond evidence-supported status.

Do not change:
- Existing deferred scope boundaries.
- Non-trust-center unrelated docs.
```

- Impact of running prompt: Directly improves Trustworthiness (+4-6 pts), Procurement Readiness (+3-5 pts), Compliance Readiness (+3-4 pts). Weighted readiness impact: +0.4-0.6%.

### 5) Strengthen reliability proof with explicit SLO breach drills and replayable evidence

- Why it matters: reliability architecture is good, but confidence still depends on stronger operational proof loops.
- Expected impact: lowers enterprise operational risk and improves deployment confidence.
- Affected qualities: Reliability, Availability, Supportability, Manageability.
- Actionability: Fully actionable now.
- Cursor prompt:

```text
Create a repeatable reliability drill package tied to existing observability and runbooks.

Scope:
1) Add a scripted reliability drill under `scripts/` that simulates:
   - transient dependency failure,
   - outbox backlog growth,
   - recovery and convergence verification.
2) Capture expected metrics/log signatures and map them in `docs/runbooks/` (new drill runbook).
3) Add post-drill evidence artifact generation (summary markdown + machine-readable JSON).
4) Add optional CI/nightly execution in non-blocking mode with artifact upload.

Acceptance criteria:
- Drill script runs end-to-end and emits deterministic pass/fail summary.
- Runbook includes exact queries/metrics needed to validate recovery.
- Nightly job (or local command) produces retained evidence artifact.

Constraints:
- No destructive data operations in shared environments.
- Respect current alerting and production safety boundaries.

Do not change:
- Core runtime behavior unrelated to drill harness.
- Existing SLO targets unless separately requested.
```

- Impact of running prompt: Directly improves Reliability (+4-6 pts), Availability (+3-4 pts), Supportability (+2-4 pts), Manageability (+2-3 pts). Weighted readiness impact: +0.4-0.7%.

### 6) Reduce cognitive load through role-task presets and contextual pruning

- Why it matters: broad capability is currently paid for with avoidable operator mental overhead.
- Expected impact: better usability and faster task completion for common personas.
- Affected qualities: Cognitive Load, Usability, Customer Self-Sufficiency, Adoption Friction.
- Actionability: Fully actionable now.
- Cursor prompt:

```text
Implement role-task presets in the operator shell to reduce navigation and decision overhead.

Scope:
1) Add preset modes (e.g., Pilot Operator, Governance Reviewer, Analytics Investigator) that pre-shape visible routes and hints.
2) Use existing authority/tier shaping infrastructure; do not invent new authorization logic.
3) Add contextual “why this is hidden” messaging with one-click reveal.
4) Add tests for:
   - preset-to-route mapping,
   - no privilege escalation through presets,
   - reversibility back to full mode.
5) Update `docs/library/operator-shell.md` and `docs/library/PRODUCT_PACKAGING.md` with preset behavior.

Acceptance criteria:
- Presets materially reduce default visible routes for each persona.
- Existing policy enforcement remains unchanged.
- Tests confirm no auth drift.

Constraints:
- UI shaping only; API authorization remains source of truth.
- Keep fallback path to full route visibility for advanced users.

Do not change:
- Backend RBAC/claims policy definitions.
- Existing deferred feature commitments.
```

- Impact of running prompt: Directly improves Cognitive Load (+6-9 pts), Usability (+3-5 pts), Customer Self-Sufficiency (+2-4 pts), Adoption Friction (+2-4 pts). Weighted readiness impact: +0.5-0.8%.

### 7) Make ROI proof operationally verifiable at run and tenant levels

- Why it matters: ROI story exists but needs consistent, low-friction evidence capture to support purchasing decisions.
- Expected impact: stronger proof-of-ROI and executive value visibility.
- Affected qualities: Proof-of-ROI Readiness, Executive Value Visibility, Decision Velocity.
- Actionability: Fully actionable now.
- Cursor prompt:

```text
Operationalize ROI evidence collection and reporting from pilot workflows.

Scope:
1) Standardize baseline capture and provenance fields across registration and pilot reporting endpoints.
2) Add a “ROI evidence completeness” indicator in sponsor-facing report generation paths.
3) Add validation rules and explicit fallback text when baseline inputs are missing or low confidence.
4) Add automated tests for:
   - baseline present vs absent scenarios,
   - consistency between markdown/pdf/docx sponsor outputs,
   - non-misleading wording when data quality is partial.
5) Update `docs/library/PILOT_ROI_MODEL.md` and related sponsor docs with exact evidence rules.

Acceptance criteria:
- Sponsor outputs clearly show data confidence and source.
- No silent assumptions in ROI deltas.
- Tests lock output consistency across formats.

Constraints:
- Do not claim financial outcomes without input data.
- Keep language conservative and evidence-bound.

Do not change:
- Pricing numbers or commercial policy.
- Deferred commercial milestones.
```

- Impact of running prompt: Directly improves Proof-of-ROI Readiness (+5-8 pts), Executive Value Visibility (+3-5 pts), Decision Velocity (+2-3 pts). Weighted readiness impact: +0.5-0.8%.

### 8) Add configuration safety linting for production-like deployments

- Why it matters: rich config surface increases misconfiguration risk and operational instability.
- Expected impact: fewer deployment incidents and better enterprise confidence.
- Affected qualities: Security, Deployability, Manageability, Reliability.
- Actionability: Fully actionable now.
- Cursor prompt:

```text
Create a production-configuration linter and enforce it in CI/release scripts.

Scope:
1) Add a new config-lint command (CLI or script) that validates critical deployment invariants:
   - auth mode safety,
   - required connection settings,
   - private endpoint/security constraints,
   - observability export path presence,
   - dangerous dev defaults in production-like environments.
2) Wire lint into readiness/release scripts and CI pre-release checks.
3) Emit actionable remediation guidance for each failed rule.
4) Document all lint rules in `docs/library/CONFIGURATION_REFERENCE.md` and a dedicated runbook.

Acceptance criteria:
- Lint fails fast on unsafe production-like config.
- Readiness pipeline includes lint gate.
- Rule set is documented and versioned.

Constraints:
- Do not block local developer workflows by default; support environment-aware severity.
- Keep rules deterministic and testable.

Do not change:
- Runtime business logic.
- Existing non-config APIs/contracts.
```

- Impact of running prompt: Directly improves Security (+3-5 pts), Deployability (+3-4 pts), Manageability (+3-5 pts), Reliability (+2-3 pts). Weighted readiness impact: +0.4-0.7%.

## Pending Questions for Later

Grouped by improvement title; only material blockers/decision shapers are listed.

### Build a buyer-proof “single source of truth” evidence path

- Should “staleness threshold” be uniform (e.g., 90 days) or category-specific (security vs product docs)?

### Harden first-session time-to-value with an opinionated “pilot in one sitting” rail

- Which single KPI should be the primary north-star for this rail: completion rate, time-to-commit, or artifact review completion?

### Turn integration recipes into executable, testable starter kits

- Do you want starter kits to target Azure Logic Apps first only, or include Function-based variants in the initial pass?

### Add continuous trust-center freshness and integrity gates

- Should stale trust rows fail CI immediately or only warn until a fixed grace date?

### Strengthen reliability proof with explicit SLO breach drills and replayable evidence

- Which environments are approved for recurring drill execution (local only, staging, or production-safe synthetic mode)?

### Reduce cognitive load through role-task presets and contextual pruning

- What is the default preset for a new operator account in hosted SaaS?

### Make ROI proof operationally verifiable at run and tenant levels

- Which baseline fields are mandatory vs optional for sponsor reports in your sales process?

### Add configuration safety linting for production-like deployments

- Should lint policy be strict-fail in all CI paths or only in release/readiness jobs initially?

