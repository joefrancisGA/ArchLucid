# ArchLucid Assessment – (A) Headline Readiness: 80.67%

This score is the **`(A)` headline readiness per `Assessment-Scope-V1_1.mdc`**, excluding items explicitly deferred to V1.1, V1.x, V2, owner-only commercial action, or `(B)` procurement / market-motion realism. This is a clean-slate, first-principles assessment from currently available repository materials only.

**Scoring formula:** total weight = 119. Weighted readiness = `sum(score * weight) / 119`. Weighted deficiency signal = `(100 - score) * weight`.

**Deferred scope uncertainty:** none identified. The relevant boundary documents were located: `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, `docs/go-to-market/TRUST_CENTER.md`, `docs/security/SOC2_SELF_ASSESSMENT_2026.md`, and `docs/go-to-market/SOC2_ROADMAP.md`.

## 2. Executive Summary

### `(A)` Overall Headline Readiness

ArchLucid is materially beyond prototype quality. The current solution has a coherent Pilot path, real API/UI/CLI surfaces, SQL-backed persistence, audit trails, governance workflows, retrieval infrastructure, quality gates, release smoke discipline, and a strong Azure-native deployment posture. The weighted score is held down mainly by the highest-weight qualities: correctness of AI-driven outputs, cutting-edge AI depth, agent readiness under real LLM evidence, adoption friction, and market clarity. The product is credible for controlled pilots and early commercial evaluation, but not yet frictionless or self-proving enough to sell itself.

### `(B)` Procurement / Market-Motion Realism

The procurement story is honest but still high-friction. SOC 2 CPA attestation, a third-party pen-test report, public reference customers, marketplace publication, and design-partner closure are explicitly outside the `(A)` score where deferred. They still matter commercially: security reviewers and enterprise procurement teams will treat self-assessment, CAIQ/SIG, owner-led testing, and roadmap evidence as interim assurance, not equivalent to formal third-party validation.

### Commercial Picture

The commercial model is unusually developed for this stage: pricing philosophy, packages, quote flow, ROI model, sponsor packet, trial posture, and service-led packaging exist. The weak point is proof conversion. The product can explain why it should matter, but it still needs tighter buyer-job proof, more concrete real-tenant ROI examples, clearer “send this to your sponsor” evidence discipline, and less dependence on expert-guided interpretation.

### Enterprise Picture

Enterprise foundations are strong: tenant isolation, OIDC/SAML, SCIM, RBAC, audit events, governance workflows, policy packs, trust center, DPA/subprocessor material, and procurement-pack generation are present. The enterprise gap is not that controls are absent; it is that buyers will still need help mapping these controls to their own review process and accepting interim assurance where formal attestations are deferred.

### Engineering Picture

The engineering architecture is modular, Azure-aligned, Dapper/SQL-oriented, heavily documented, and increasingly guarded by OpenAPI snapshots, coverage gates, retrieval evals, release smoke, data consistency probes, and quality gates. The biggest engineering risk is correctness under real-world AI variability: deterministic scaffolding is strong, but output truth, retrieval relevance, and operator trust require continuous evidence, not only structural contracts.

## 3. Weighted Quality Assessment

| Urgency | Quality | Score | Weight | Readiness contribution | Weighted deficiency signal | Justification | Tradeoffs | Improvement recommendations | Fit |
|---:|---|---:|---:|---:|---:|---|---|---|---|
| 1 | Cutting-Edge AI Technology | 77 | 8 | 5.17 | 184 | Modern retrieval, schema validation, staged critic, faithfulness scoring, LLM judge, Azure OpenAI, and RAG work exist, but the approach remains mostly bounded single-hop RAG plus deterministic heuristics. | Conservative design improves enterprise control but limits perceived AI leap versus advanced agent/retrieval products. | Strengthen real-mode eval evidence, retrieval reranking evidence, agent output baselines, and adversarial prompt/citation evaluation. | Fixable in v1 quality work; advanced graph-RAG/agentic retrieval belongs v2. |
| 2 | Correctness | 82 | 8 | 5.51 | 144 | Strong contracts, tests, schemas, data consistency probes, and quality gates exist; correctness still depends on AI output faithfulness, retrieval relevance, and cost/ROI evidence labeling. | Strict gates can block poor outputs but may add operational friction. | Make real-mode correctness evidence routine and enforce artifact/citation completeness for sponsor handoff. | Fixable in v1. |
| 3 | Adoption Friction | 77 | 6 | 3.88 | 138 | Core Pilot is documented, but setup spans SQL, auth, LLM mode, evidence upload, quality gates, procurement evidence, and operator interpretation. | Enterprise-grade control adds setup burden; simulator eases demos but weakens buyer proof. | Collapse first-pilot readiness into fewer guided checks and clearer go/no-go outputs. | Fixable in v1. |
| 4 | AI/Agent Readiness | 82 | 8 | 5.51 | 144 | Agent orchestration, simulator/real separation, schema enforcement, quality gates, faithfulness metrics, budgets, and observability are present. Some evidence remains warn-only or manual at release boundaries. | Manual re-run on quality rejection is safer than automatic retry, but slower. | Promote the highest-confidence eval and real-mode gates from advisory to operational release evidence. | Fixable in v1; auto-retry can wait for v1.1. |
| 5 | Stickiness | 72 | 6 | 3.63 | 168 | Prior manifests, comparison, replay, governance, audit, policy packs, and ROI rollups can create repeat use. Stickiness is less proven until teams embed it into recurring architecture workflows. | Pilot focus keeps first value narrow but delays habit formation. | Turn repeat-review workflows and renewal signals into first-class operator and sponsor outputs. | Fixable in v1. |
| 6 | Marketability | 86 | 8 | 5.78 | 112 | The category, sponsor narrative, trust center, pricing, buyer jobs, and accelerators are strong. Marketability is constrained by proof credibility and buyer skepticism about AI architecture quality. | Blunt honesty improves trust but reduces hype. | Sharpen buyer-job landing pages around concrete proof artifacts and before/after outcomes. | Fixable in v1. |
| 7 | Proof-of-ROI Readiness | 84 | 5 | 3.53 | 80 | ROI model, pilot deltas, first-value reports, executive summary, and value-report DOCX exist. Several measures remain estimate-based or operator-filled. | Avoiding overclaim protects trust but weakens sales urgency. | Require baseline capture and ROI evidence completeness in sponsor packets. | Fixable in v1. |
| 8 | Time-to-Value | 87 | 7 | 5.12 | 91 | The Core Pilot path is well-defined: create, execute, commit, review package. Release smoke and first-pilot runbooks reinforce it. | Narrow Pilot reduces cognitive load but leaves some enterprise proof outside first hour. | Make the operator path more “one button to proof bundle” and remove duplicate decision points. | Fixable in v1. |
| 9 | Differentiability | 75 | 4 | 2.52 | 100 | AI architecture proof, evidence-linked manifests, governance, and policy packs differentiate the product. The market will still compare it to consultants, docs tools, governance platforms, and AI copilots. | Broad capability improves differentiation but can blur the category. | Publish a tighter “why this is not chat, docs, or consulting” proof page. | Fixable in v1. |
| 10 | Workflow Embeddedness | 73 | 3 | 1.84 | 81 | REST, CLI, UI, SCIM, Azure DevOps/GitHub surfaces exist. Several buyer-desired connectors are explicitly V1.1 and excluded from `(A)`, but the current workflow still needs translation into customer systems. | Deferring connectors protects focus; it leaves more manual handoff. | Strengthen REST/CLI handoff recipes and GitHub/Azure DevOps review package flows. | Partly v1; first-party connectors are v1.1. |
| 11 | Executive Value Visibility | 83 | 4 | 2.79 | 68 | Sponsor brief, value reports, ROI summary, first-value PDF, and dashboards exist. The risk is that outputs still need careful interpretation. | Evidence labels reduce overclaiming but make summaries less punchy. | Add a sponsor-ready readiness verdict with evidence completeness and next action. | Fixable in v1. |
| 12 | Trustworthiness | 83 | 3 | 2.09 | 51 | Traceability, auditability, quality gates, trust docs, and self-assessments support trust. AI output correctness and formal assurance gaps remain buyer concerns, with formal assurance handled under `(B)`. | Conservative disclosures reduce legal risk but highlight immaturity. | Improve “why this output can be relied on” evidence labels and rejection paths. | Fixable in v1; formal attestation deferred. |
| 13 | Usability | 80 | 3 | 2.02 | 60 | Progressive disclosure, operator guides, route-tier policy maps, and first-pilot docs help. The surface remains broad and can overwhelm new users. | Feature richness increases cognitive cost. | Tighten the default operator flow around one canonical proof path. | Fixable in v1. |
| 14 | Decision Velocity | 74 | 2 | 1.24 | 52 | Pricing and quote flow exist, but buyer decision still depends on trust, ROI proof, security review, and sales assistance. | Enterprise credibility slows pure self-serve speed. | Create a buyer “48-hour pilot-to-decision packet” with clear accept/reject criteria. | Fixable in v1. |
| 15 | Procurement Readiness | 75 | 2 | 1.26 | 50 | Trust center, DPA, subprocessors, CAIQ/SIG, SLOs, procurement pack, and objection playbooks exist. Formal SOC 2 and third-party pen-test are `(B)` only but still create friction. | Honest interim posture is better than false claims. | Make procurement pack strictness and freshness more visible to operators. | Partly v1; attestations deferred. |
| 16 | Security | 84 | 3 | 2.12 | 48 | Default-deny posture, RBAC, OIDC/SAML, API keys, rate limiting, private endpoint story, RLS, Key Vault, redaction, ZAP/Schemathesis evidence, and threat model exist. | Security control richness adds setup complexity. | Strengthen production-like config lint and evidence exports for handoff. | Fixable in v1. |
| 17 | Compliance Readiness | 72 | 2 | 1.21 | 56 | Self-assessment, CAIQ/SIG, DPA, compliance matrix, audit catalog, and roadmap are present. Formal certification is out of `(A)` but affects enterprise trust. | Compliance honesty avoids misrepresentation. | Improve control-to-product evidence trace for top buyer frameworks. | Fixable in v1 for self-assessment; CPA deferred. |
| 18 | Interoperability | 76 | 2 | 1.28 | 48 | REST, OpenAPI, CLI, SCIM, Azure extractor, webhooks/events, GitHub/Azure DevOps paths exist. V1.1 connectors are out of scope. | Versioned APIs are stable but less turnkey than native connectors. | Add more operator-tested bridge recipes for V1 surfaces. | v1 for recipes; v1.1 for first-party connectors. |
| 19 | Commercial Packaging Readiness | 77 | 2 | 1.29 | 46 | Pricing tiers, trial, quote, order-form, marketplace alignment, and safety rules exist. Live commerce un-hold is deferred and excluded, but packaging still needs operational simplification. | Sales-led motion is realistic but slower. | Improve quote-to-proof and packaging-to-entitlement clarity. | v1 for sales-led packaging; owner-only live commerce deferred. |
| 20 | Architectural Integrity | 82 | 3 | 2.07 | 54 | Containers, components, ADRs, invariants, layering tests, DDL discipline, outbox patterns, and authority convergence show coherence. | Some legacy naming and compatibility bridges remain intentionally scheduled. | Continue retiring compatibility shims only when scope allows. | Fixable in v1 hygiene; rename cleanup deferred. |
| 21 | Maintainability | 82 | 2 | 1.38 | 36 | Modular projects, docs, tests, API snapshots, component maps, and architecture constraints are strong. The repo is large and heavily documented, increasing maintenance overhead. | Comprehensive docs prevent drift but add review burden. | Add doc freshness and claim-drift strictness where high-risk. | Fixable in v1. |
| 22 | Traceability | 86 | 3 | 2.17 | 42 | Provenance graph, manifest, decision traces, audit, retrieval grounding traces, correlation IDs, and evidence chains are a product strength. | Trace volume may overwhelm without summarization. | Add top-finding trace walkthroughs in sponsor packets. | Fixable in v1. |
| 23 | Reliability | 82 | 2 | 1.38 | 36 | Health checks, release smoke, retry/backoff, outboxes, data consistency probes, cache rules, and rollback checks exist. Gaps remain around production evidence and failover proof. | Single-region baseline is intentional and not penalized. | Turn readiness and data-consistency collectors into mandatory handoff artifacts. | Fixable in v1; multi-region active/active deferred. |
| 24 | Explainability | 86 | 2 | 1.45 | 28 | Explanation endpoints, provenance, evidence-basis labels, aggregate summaries, and citation contracts exist. LLM prose still must be treated as decision support. | More caveats reduce executive simplicity. | Add “explain why to trust / why to reject” output blocks. | Fixable in v1. |
| 25 | Azure Compatibility and SaaS Deployment Readiness | 83 | 2 | 1.39 | 34 | Azure-first ADR, Container Apps, SQL, Key Vault, Front Door/WAF, Terraform modules, private endpoints, Azure OpenAI, and Azure extractor are aligned. Some infra validation remains warn-only. | Azure-native focus narrows portability but improves coherence. | Promote Terraform validation and hosted probe evidence where stable. | Fixable in v1; multi-cloud analysis v1.1. |
| 26 | Policy and Governance Alignment | 82 | 2 | 1.38 | 36 | Approval workflow, segregation of duties, pre-commit gates, policy packs, governance dashboard, and bundled packs exist. | Deep governance can distract from first value. | Keep governance optional in Pilot but strengthen Operate activation guidance. | Fixable in v1. |
| 27 | Data Consistency | 88 | 2 | 1.48 | 24 | Transactional writes, outbox indexing, data consistency matrix, orphan probes, archival cascades, and readiness collector are strong. | Some consistency remains eventual by design. | Make consistency proof non-optional for customer handoff. | Fixable in v1. |
| 28 | Auditability | 87 | 2 | 1.46 | 26 | Append-only audit, typed event catalog, CSV export, correlation IDs, SIEM export, and durable audit coverage are strong. | More audit data requires filtering and retention clarity. | Add buyer-facing audit walkthrough examples. | Fixable in v1. |
| 29 | Customer Self-Sufficiency | 74 | 1 | 0.62 | 26 | Docs and runbooks are extensive, but the product still assumes an operator who can follow technical setup, evidence collection, and proof interpretation. | Expert-guided pilots may close better early but limit scale. | Add a guided “diagnose my first pilot blocker” flow and fewer competing docs. | Fixable in v1. |
| 30 | Cognitive Load | 76 | 1 | 0.64 | 24 | The product is broad: Pilot, Operate analysis, Operate governance, many docs, auth modes, quality gates, and evidence paths. Progressive disclosure helps but cannot erase complexity. | Full enterprise capability raises cognitive load. | Reduce first-run choices and make next action explicit everywhere. | Fixable in v1. |
| 31 | Performance | 75 | 1 | 0.63 | 25 | Rate limits, caching, hot-path cache, retrieval token budgeting, and benchmark projects exist. Performance proof is less central than correctness and reliability. | Avoiding premature optimization is reasonable. | Add high-value named query and first-pilot latency budgets. | Fixable in v1. |
| 32 | Scalability | 77 | 1 | 0.65 | 23 | SQL, workers, outboxes, optional Redis, budgets, and Azure-native scale are credible. V1 does not require distributed graph cache or mandatory Redis. | Single-region and optional cache are right-sized for V1. | Document capacity envelopes and scale trigger thresholds more concretely. | Fixable in v1; distributed cache hardening v2. |
| 33 | Availability | 74 | 1 | 0.62 | 26 | SLO targets, health checks, probes, deployment validation, and rollback exist. No contractual multi-region active/active guarantee in `(A)`. | Staging probes are not production SLA proof. | Produce a production-readiness availability evidence bundle when environment exists. | Partly v1; multi-region active/active deferred. |
| 34 | Extensibility | 80 | 1 | 0.67 | 20 | Custom handler docs and out-of-process handler patterns exist; public plugin SDK/marketplace are explicitly out of scope. | Controlled extensibility protects core integrity. | Improve a concrete custom handler example and compatibility tests. | Fixable in v1 docs/code sample. |
| 35 | Cost-Effectiveness | 80 | 1 | 0.67 | 20 | LLM budgets, token accounting, cache posture, pricing basis, and cost estimators exist. Real hosted COGS evidence remains limited. | Hard caps protect margins but may interrupt runs. | Add cost-per-successful-review dashboard and pilot evidence line. | Fixable in v1. |
| 36 | Manageability | 82 | 1 | 0.69 | 18 | Config catalog, admin config summaries, lint routes, diagnostics, runbooks, and operational profiles exist. | Rich config surface can overwhelm operators. | Create role-based operator checklists by environment. | Fixable in v1. |
| 37 | Deployability | 83 | 1 | 0.70 | 17 | Docker, release smoke, health, Terraform, Azure deployment docs, and CD validation are present. Some live infra validation is advisory. | Avoiding forced live applies in CI is sensible. | Promote no-credential Terraform validation once stable. | Fixable in v1. |
| 38 | Testability | 81 | 1 | 0.68 | 19 | Large test surface, OpenAPI snapshots, coverage gates, eval harnesses, architecture tests, and live/mock E2E distinctions are strong. | Full CI cost and complexity are high. | Keep coverage and eval gates focused on high-risk paths. | Fixable in v1. |
| 39 | Documentation | 82 | 1 | 0.69 | 18 | Documentation is extensive, role-routed, and often tied to CI. Its size creates drift risk. | More docs help enterprise review but burden maintenance. | Tighten stale-doc and buyer-claim drift controls on high-stakes docs. | Fixable in v1. |
| 40 | Template and Accelerator Richness | 82 | 1 | 0.69 | 18 | Azure SaaS, AI governance, healthcare claims, policy packs, and walkthroughs exist. Depth beyond first accelerators can wait. | Too many templates could dilute the Core Pilot. | Add acceptance criteria and proof examples to top accelerators. | Fixable in v1. |
| 41 | Supportability | 87 | 1 | 0.73 | 13 | Support bundles, config lint, diagnostics, correlation IDs, troubleshooting, runbooks, and procurement pack generation are strong. | Support power depends on operators capturing evidence. | Make evidence collection default in first-pilot proof. | Fixable in v1. |

## 4. Top 12 Most Important Weaknesses

1. **Real-output truth is still the hardest risk.** Structural schemas, citations, and quality gates help, but they do not fully prove that AI-generated recommendations are right in messy enterprise contexts.
2. **Adoption requires too much expert orchestration.** The first-pilot path is documented, but the operator must still coordinate environment, evidence, auth, LLM mode, quality gates, exports, and sponsor framing.
3. **The proof-to-purchase bridge is not automatic enough.** ROI and sponsor artifacts exist, but they need stronger go/no-go language and evidence completeness gates.
4. **Cutting-edge AI perception lags the product ambition.** The product is sophisticated but conservative; buyers may expect richer autonomous reasoning, graph-RAG, reranking, or live real-mode proof.
5. **Workflow embeddedness is good enough for pilots, not effortless for enterprises.** REST/CLI/UI are real, but many native enterprise workflow channels are V1.1 or customer-operated.
6. **Procurement confidence depends on interim assurance.** Self-assessment, CAIQ/SIG, and owner-led testing are useful but not equal to formal third-party evidence in enterprise buying.
7. **Commercial packaging is coherent but still sales-led.** Pricing and quote flow are strong; live self-serve conversion and external proof are outside the current `(A)` gate.
8. **Documentation breadth creates cognitive load.** The repo is well documented, but new users can encounter multiple “start here” surfaces unless the canonical path is aggressively enforced.
9. **Sponsor outputs still need stronger “why this is trustworthy” language.** Evidence labels exist, but the verdict should be more explicit and harder to misuse.
10. **Enterprise operations need more attachable evidence bundles.** Probes and scripts exist, but operators need standardized outputs they can hand directly to buyers.
11. **Cost and ROI claims require careful evidence basis.** The product correctly avoids overclaiming, but that lowers sales urgency when baseline data is missing.
12. **Some CI/doc checks remain advisory.** That is reasonable for low-risk items, but high-stakes buyer claims and infra validation should become stricter as they stabilize.

## 5. Top 6 Monetization Blockers

1. **Insufficient buyer-proof density:** buyers need a short, concrete packet proving time saved, artifact quality, evidence completeness, and next action.
2. **AI trust gap:** buyers may like the concept but hesitate if they cannot tell which findings are strongly supported versus plausible AI narrative.
3. **Sales-led conversion dependence:** quote flow is credible, but purchase still requires human follow-up and trust-building.
4. **Procurement interim-assurance friction:** formal SOC 2 and third-party pen-test evidence are out of `(A)`, but absence will slow larger deals.
5. **Weak recurring-use trigger:** the product needs clearer repeat-review / governance habit loops to justify expansion.
6. **ROI proof depends on baseline capture:** without customer baseline data, ArchLucid’s value story becomes illustrative rather than account-specific.

## 6. Top 6 Enterprise Adoption Blockers

1. **Security review needs interpretation:** the evidence exists, but teams still need help mapping it to their questionnaires and risk thresholds.
2. **Identity and deployment setup are nontrivial:** OIDC/SAML, SQL, LLM configuration, Key Vault, networking, and quality gates are enterprise-grade but demanding.
3. **Native workflow integrations are not all current-scope:** V1.1 connectors should not reduce `(A)`, but enterprise operators will still ask for them.
4. **Output trust must be operationalized:** reviewers need repeatable evidence that findings are grounded, current, and not hallucinated.
5. **Operational ownership must be clear:** support, config lint, readiness, data consistency, and evidence collection need a single handoff ritual.
6. **Formal assurance gaps slow procurement:** SOC 2 CPA and third-party pen-test gaps are `(B)` friction even when not `(A)` defects.

## 7. Top 6 Engineering Risks

1. **AI correctness drift:** model, prompt, retrieval, or chunking changes can degrade recommendation quality unless eval evidence stays current and enforced.
2. **Retrieval leakage or irrelevance:** tenant filters and corpus boundaries are critical because RAG errors can become trust failures.
3. **Quality gates becoming noisy or bypassed:** gates must be strict enough to protect sponsors but explainable enough not to block good runs unnecessarily.
4. **Data consistency across authority, artifacts, traces, and retrieval:** probes exist, but orphaned or stale rows can undermine trust if handoff evidence misses them.
5. **Configuration misfires in production-like pilots:** auth bypass, telemetry export, content safety, LLM budgets, and billing safety must fail loudly.
6. **Documentation/code drift:** the product has many buyer-visible claims, routes, policies, and tier gates; drift can become a commercial and security risk.

## 8. Most Important Truth

ArchLucid is ready to prove value in controlled, evidence-driven pilots, but it is not yet self-evidently trustworthy or frictionless enough for broad enterprise purchase without strong proof packaging and guided adoption.

## 9. Top Improvement Opportunities

### COMPLETED: Make Sponsor Proof Bundle a Hard First-Pilot Gate

**Actionable:** Completed — `collect-first-pilot-proof.ps1` emits `sponsorPacketDisposition`, command center, and quote-to-proof index; HOLD blocks sponsor send unless owner override.

**Why it matters:** Revenue depends on turning a completed review into a sponsor-ready decision artifact.

**Expected impact:** Directly improves Proof-of-ROI Readiness (+8-10 pts), Executive Value Visibility (+5-7 pts), Decision Velocity (+4-6 pts). Weighted readiness impact: +0.6-0.9%.

**Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility, Decision Velocity, Marketability, Trustworthiness.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Implement a first-pilot sponsor proof bundle gate.

Scope:
- Start from docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md, docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md, docs/library/PILOT_ROI_MODEL.md, docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md, and existing first-value report / sponsor PDF APIs.
- Add or update the smallest existing script/runbook surface that already collects first-pilot proof so it emits a single sponsor-proof status: PASS, WARN, or HOLD.
- Include checks for committed manifest, artifact descriptors, first-value Markdown/PDF availability, ROI evidence completeness, top finding evidence chain, audit row count or lower-bound disclosure, LLM call count, data-consistency proof status, and demo-data warning.
- Treat HOLD as blocking sponsor send by default; allow only an explicit owner override note in the generated artifact.
- Treat `artifacts/first-pilot-proof/` as the canonical customer-shareable proof bundle working directory unless a later owner decision changes it.
- Add tests for the status reducer and markdown output.

Acceptance criteria:
- A generated markdown artifact clearly states whether the sponsor packet is sendable.
- HOLD is emitted when manifest/artifacts are missing, data consistency is HOLD, or ROI evidence is materially incomplete without disclosure.
- WARN is emitted for estimate-heavy ROI or simulator/demo labeling that is still safe to review.
- PASS is emitted only when the evidence chain is complete enough for sponsor handoff.
- Documentation tells operators not to hand-edit missing proof into the packet.

Constraints:
- Do not change public API routes unless an existing endpoint must expose already-computed fields.
- Do not remove existing first-value report behavior.
- Do not claim formal attestation or guaranteed ROI.
- Keep all SQL DDL in the existing database DDL/migration pattern if schema changes become necessary, but prefer no schema change for this task.
```

### COMPLETED: Strengthen Real-Mode AI Quality Evidence

**Actionable:** Completed — `scripts/ci/validate_committed_real_llm_fixtures.py` validates committed `*.real.json` fixtures; proof collector emits `committed-real-llm-fixture-validation.md`.

**Why it matters:** The highest-weight risk is whether real LLM outputs are correct and grounded.

**Expected impact:** Directly improves Correctness (+5-8 pts), AI/Agent Readiness (+4-6 pts), Cutting-Edge AI Technology (+3-5 pts). Weighted readiness impact: +0.9-1.3%.

**Affected qualities:** Correctness, AI/Agent Readiness, Cutting-Edge AI Technology, Trustworthiness.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Improve real-mode AI quality evidence without requiring live Azure OpenAI in normal PR CI.

Scope:
- Review docs/library/AGENT_OUTPUT_EVALUATION.md, docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md, scripts/ci/eval_agent_corpus.py, and any existing real-LLM evidence summarizer.
- Add a repo-local fixture format or validator for captured real-mode AgentResult evidence that can be checked in only when sanitized.
- Extend the markdown report to show simulator baseline, captured real-mode evidence availability, quality gate outcome, faithfulness support ratio, and whether evidence is stale or missing.
- Treat `gpt-4o` as the canonical Azure OpenAI deployment for release evidence unless a later owner decision changes it.
- Treat the release-reference real-mode scenario set as one sanitized captured AgentResult for each core agent slice: Topology, Cost, Compliance, and Critic.
- Add tests for the validator/report logic.

Acceptance criteria:
- The report distinguishes simulator evidence from real-mode evidence in plain language.
- Missing real-mode evidence is not a PR failure by default, but the generated report says exactly what is missing for RC or sponsor handoff.
- Invalid or incomplete committed real-mode evidence fails the validator.
- No secrets, prompts, customer data, API keys, or raw chain-of-thought are accepted in committed fixtures.

Constraints:
- Do not call Azure OpenAI from normal CI.
- Do not weaken existing quality gates.
- Do not add a new external dependency unless already present in the repo.
```

### COMPLETED: Add Evidence-Basis Verdicts to Sponsor Outputs

**Actionable:** Completed — `SponsorEvidenceBasisVerdictMarkdownFormatter` and shared `SponsorEvidenceBasisLabelResolver` on first-value exports; proof collector requires `## Evidence basis`.

**Why it matters:** Buyers need to know whether a finding is evidence-backed, estimated, demo-derived, low-support, or manual-review-required.

**Expected impact:** Directly improves Trustworthiness (+5-7 pts), Explainability (+4-6 pts), Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Trustworthiness, Explainability, Executive Value Visibility, Proof-of-ROI Readiness.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Add evidence-basis verdicts to sponsor-facing first-value outputs.

Scope:
- Use the existing evidence-basis label vocabulary in docs/library/AGENT_OUTPUT_EVALUATION.md.
- Update first-value Markdown/PDF generation and related DTO/model code so each sponsor-facing report has a concise Evidence Basis section.
- Include at least: Evidence-backed, Estimate, Low support, Demo-derived, Manual review required, Deferred scope.
- Base labels on existing fields where possible: ROI evidence completeness, demo tenant detection, faithfulness/quality gate results, citation/evidence-chain presence, and deferred-scope markers.
- Add unit tests for label selection.

Acceptance criteria:
- Sponsor output includes a short verdict explaining how much confidence to place in the report.
- Demo-derived and estimate-heavy reports are unmistakably labeled.
- Low-support AI output cannot appear as fully evidence-backed.
- Existing report APIs remain backward compatible except additive content.

Constraints:
- Do not represent evidence labels as legal/compliance attestations.
- Do not change pricing or procurement claims.
- Do not expose raw prompts or sensitive trace data.
```

### COMPLETED: Simplify the First-Pilot Operator Path

**Actionable:** Completed — canonical checklist dominance, inputs/outputs/stop conditions, output artifact table, and “do not start here” notes on depth/troubleshooting docs.

**Why it matters:** Adoption friction is one of the largest weighted deficiencies.

**Expected impact:** Directly improves Adoption Friction (+6-8 pts), Time-to-Value (+3-5 pts), Cognitive Load (+6-8 pts). Weighted readiness impact: +0.5-0.8%.

**Affected qualities:** Adoption Friction, Time-to-Value, Customer Self-Sufficiency, Cognitive Load, Usability.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Reduce first-pilot operator ambiguity by consolidating the canonical path.

Scope:
- Review docs/START_HERE.md, docs/CORE_PILOT.md, docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md, docs/onboarding/EVALUATION_GUIDE.md, and docs/runbooks/FIRST_PILOT_TROUBLESHOOTING.md.
- Make FIRST_PILOT_OPERATOR_PATH.md the clearly dominant operational checklist.
- Ensure CORE_PILOT.md stays a short narrative and does not duplicate checklist details.
- Add a concise "Do not start here" note to secondary/depth docs where they might be mistaken as alternate checklists.
- Add a first-pilot "inputs / outputs / stop conditions" block near the top of the canonical checklist.

Acceptance criteria:
- A new operator can identify one starting checklist in under one minute.
- The canonical checklist states the exact output artifact set for a successful first pilot.
- Duplicate or competing checklist language is removed or explicitly demoted.
- Links remain valid.

Constraints:
- Do not delete deep reference docs.
- Do not change product scope boundaries.
- Do not add new V1.1 commitments.
```

### COMPLETED: Make ROI Baseline Capture Harder to Skip

**Actionable:** Completed — sponsor-handoff BLOCK and self-serve WARN for unsafe ROI basis; baseline source disclosed in sponsor ROI sections.

**Why it matters:** ROI proof becomes weak when customer baseline cycle time and manual effort are missing.

**Expected impact:** Directly improves Proof-of-ROI Readiness (+6-9 pts), Commercial Packaging Readiness (+3-4 pts), Decision Velocity (+2-4 pts). Weighted readiness impact: +0.4-0.7%.

**Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility, Commercial Packaging Readiness.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Improve baseline capture and disclosure for pilot ROI.

Scope:
- Review docs/library/PILOT_ROI_MODEL.md and existing tenant trial / first-value report code that handles baselineReviewCycleHours and baselineReviewCycleSource.
- Add or improve validation and copy so missing baselines are surfaced as Low confidence rather than silently using defaults.
- Treat missing baseline data as WARN for self-serve/free exploration and HOLD for guided paid pilots before sponsor handoff.
- Use these minimum baseline fields for kickoff: current architecture-request-to-reviewable-package cycle time, source/confidence for that estimate, manual preparation effort, and one qualitative governance/review friction note.
- Update sponsor output and operator docs so baseline source is explicit: customer-provided, operator-estimated, or conservative default.
- Add tests for missing, customer-provided, and default baseline paths.

Acceptance criteria:
- Sponsor-facing ROI sections disclose the baseline source.
- Missing customer baseline does not block the pilot, but lowers evidence confidence.
- Operator guidance includes the exact two or three questions to ask before the pilot starts.
- No inflated savings claim is generated from default data without a visible caveat.

Constraints:
- Do not require a long survey before first value.
- Do not invent customer savings.
- Do not change locked pricing.
```

### COMPLETED: Create a “Why Trust This Finding?” Block

**Actionable:** Completed — `FindingTrustEvidenceCardMarkdownFormatter` includes evidence-basis labels and persisted pointer table for the top finding.

**Why it matters:** Findings are the unit buyers will scrutinize.

**Expected impact:** Directly improves Trustworthiness (+5-7 pts), Correctness (+3-5 pts), Explainability (+4-6 pts). Weighted readiness impact: +0.4-0.7%.

**Affected qualities:** Trustworthiness, Explainability, Correctness, Usability.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Add a concise "Why trust this finding?" block to finding detail or exported finding summaries.

Scope:
- Locate the finding detail/export model and renderer used by first-value/sponsor artifacts.
- For each top finding, render: evidence references present, source artifact or manifest id, confidence/quality-gate status if available, evidence-basis label, and manual-review caveat when support is weak.
- Use existing evidence-chain and provenance services rather than creating parallel logic.
- Add tests for a fully supported finding, an estimate-only finding, and a low-support finding.

Acceptance criteria:
- Top findings in sponsor outputs include a short trust rationale.
- Low-support findings do not look equivalent to evidence-backed findings.
- The block references stable ids or citations, not raw hidden internals.

Constraints:
- Do not expose secrets, raw prompts, or customer-sensitive trace text.
- Do not claim formal verification.
- Do not change finding severity scoring unless existing code requires it.
```

### COMPLETED: Tighten Buyer-Facing Claim Drift Controls

**Actionable:** Completed — `check_buyer_claim_drift.py` is merge-blocking in CI with source-of-truth hints; `--advisory` for local warn-only.

**Why it matters:** Overstated claims are a procurement and trust risk.

**Expected impact:** Directly improves Documentation (+4-6 pts), Trustworthiness (+3-5 pts), Procurement Readiness (+2-4 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Documentation, Trustworthiness, Procurement Readiness, Marketability.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Move high-risk buyer-facing claim drift checks from broad advisory to targeted strict checks.

Scope:
- Review scripts/ci/check_buyer_claim_drift.py, scripts/ci/check_procurement_doc_freshness.py, scripts/Scan-BuyerDocClaims.ps1, and .github/workflows/ci.yml.
- Identify a narrow set of high-risk claims to enforce strictly: SOC 2 status, third-party pen-test status, live checkout/marketplace status, data residency, AI output caveats, and deferred-scope connector claims.
- Add or update tests for those claim patterns.
- Keep broad stale-doc scanning warn-only if it is noisy.

Acceptance criteria:
- CI fails when a high-risk buyer doc claims issued SOC 2, completed third-party pen test, live checkout, or non-deferred connector status without the expected source evidence.
- Advisory low-risk doc freshness checks remain non-blocking.
- The check output tells the contributor which source-of-truth doc to update.

Constraints:
- Do not make all markdown link or stale-doc warnings merge-blocking.
- Do not reference prior assessments.
- Do not alter product scope.
```

### COMPLETED: Improve Procurement Pack Sendability

**Actionable:** Completed — `procurement-pack-quality.md` retitled as sendability summary with SOC 2 / pen-test / cover-letter caveats (strict mode unchanged).

**Why it matters:** Enterprise deals stall when field teams cannot assemble buyer-safe evidence quickly.

**Expected impact:** Directly improves Procurement Readiness (+5-7 pts), Customer Self-Sufficiency (+4-6 pts), Decision Velocity (+2-4 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Procurement Readiness, Trustworthiness, Customer Self-Sufficiency, Supportability.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Add a procurement-pack sendability report.

Scope:
- Review scripts/build_procurement_pack.py, docs/go-to-market/TRUST_CENTER.md, docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md, and procurement pack manifest/redaction behavior.
- Add a markdown summary emitted with the pack that states: included files, omitted/redacted items, last-reviewed freshness status, formal assurance caveats, and buyer-safe sending instructions.
- State that any buyer-specific cover letter requires owner approval by you before it leaves the repo boundary.
- Treat buyer-specific placeholders as strict blockers in strict mode: unresolved customer names, legal entity placeholders, buyer contact placeholders, signed-date placeholders, `TODO`, `TBD`, `FIXME`, `REPLACE_ME`, `example.com`, fake domains, and bracketed fill-ins such as `[Customer]` in files marked sendable.
- Add strict mode test coverage for unsafe placeholder or stub tokens in included buyer-facing files.

Acceptance criteria:
- Building the procurement pack produces a human-readable sendability summary.
- The summary clearly states SOC 2 is self-assessment / roadmap, not CPA attestation.
- The summary clearly states third-party pen-test status according to deferred scope.
- Missing required files fail loud.

Constraints:
- Do not include customer-specific cover letters in committed output.
- Do not weaken redaction.
- Do not add formal assurance claims.
```

### 9. Add Repeat-Review Stickiness Metrics

**Why it matters:** Expansion depends on repeat use, not only first-pilot success.

**Expected impact:** Directly improves Stickiness (+5-7 pts), Executive Value Visibility (+2-4 pts), Workflow Embeddedness (+2-4 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Stickiness, Executive Value Visibility, Proof-of-ROI Readiness.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Add repeat-review adoption metrics to existing pilot or tenant value reporting.

Scope:
- Review existing pilot deltas, executive ROI summary, tenant value report, and comparison/replay APIs.
- Add a lightweight repeat-use summary: number of committed reviews in the window, systems with multiple reviews, comparison/replay usage, and top repeated finding categories.
- Render the summary in an existing dashboard/report rather than creating a new product area.
- Add tests for zero, one, and multiple committed review scenarios.

Acceptance criteria:
- Sponsors can see whether ArchLucid was used again after first value.
- The summary avoids implying enterprise-wide adoption from a single tenant.
- The logic deduplicates repeated finding identities where existing services already define stable ids.

Constraints:
- Do not create cross-tenant analytics.
- Do not change pricing entitlements.
- Do not require V1.1 connectors.
```

### COMPLETED: Make Data Consistency Proof Mandatory for Handoff

**Actionable:** Completed — `NOT_RUN` and `HOLD` map to sponsor-handoff `BLOCK` via `Resolve-DataConsistencyProofFinding`.

**Why it matters:** A corrupted or stale evidence chain destroys trust.

**Expected impact:** Directly improves Data Consistency (+5-7 pts), Reliability (+3-5 pts), Trustworthiness (+2-4 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Data Consistency, Reliability, Trustworthiness, Supportability.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Require data consistency proof in the first-pilot handoff artifact.

Scope:
- Review docs/runbooks/DATA_CONSISTENCY_READINESS.md, docs/library/DATA_CONSISTENCY_MATRIX.md, scripts/collect-data-consistency-readiness.ps1, and scripts/collect-first-pilot-proof.ps1.
- Ensure collect-first-pilot-proof includes the data consistency result by default when BaseUrl is provided.
- Map dataConsistencyStatus HOLD to sponsor handoff BLOCK/HOLD in the final markdown.
- Add tests for PASS, WARN, HOLD, and NOT_RUN reducer behavior if a test harness exists for the script/report logic.

Acceptance criteria:
- A sponsor handoff report cannot look green when data consistency is HOLD.
- NOT_RUN is explicit and not disguised as PASS.
- Docs tell operators how to remediate or escalate.

Constraints:
- Do not perform destructive remediation from collector scripts.
- Do not require SQL secrets in committed artifacts.
- Do not remove dry-run safety.
```

### COMPLETED: Harden Production-Like Configuration Lint

**Actionable:** Completed — `production-like-hosted-pilot` profile lint artifacts and sponsor-handoff BLOCK rows already enforced in first-pilot proof collection.

**Why it matters:** Misconfiguration is the most likely early enterprise pilot failure.

**Expected impact:** Directly improves Security (+3-5 pts), Deployability (+3-5 pts), Manageability (+3-5 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Security, Manageability, Deployability, Reliability.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Improve production-like configuration lint for sponsor handoff.

Scope:
- Review docs/library/CONFIGURATION_REFERENCE.md, config lint CLI/API code, and production-like-hosted-pilot profile behavior.
- Add blocking checks or clearer HOLD output for auth bypass, missing telemetry export when required, content safety misconfiguration, missing PilotStrict faithfulness floor, missing SQL connection posture, unsafe CORS, unsafe billing live-key posture, and missing LLM budget configuration where real mode is enabled.
- Add unit tests for each new blocking/advisory row.

Acceptance criteria:
- production-like-hosted-pilot profile produces a clear PASS/HOLD summary.
- Unsafe production-like settings fail loud with actionable messages.
- Secrets are never printed.

Constraints:
- Do not require live Azure access.
- Do not change development defaults except diagnostics text.
- Do not weaken existing production startup guards.
```

### COMPLETED: Add Capacity Envelope for First-Pilot and Early Production

**Actionable:** Completed — `docs/library/V1_CAPACITY_ENVELOPE.md` documents East US envelope and scale triggers; linked from capacity playbook.

**Why it matters:** Buyers and operators need to know the practical scale boundary before procurement.

**Expected impact:** Directly improves Scalability (+4-6 pts), Performance (+3-5 pts), Cost-Effectiveness (+2-4 pts). Weighted readiness impact: +0.1-0.3%.

**Affected qualities:** Scalability, Performance, Cost-Effectiveness, Procurement Readiness.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Create a practical V1 capacity envelope document and link it from packaging/procurement docs.

Scope:
- Review docs/library/CAPACITY_AND_COST_PLAYBOOK.md, docs/library/CONFIGURATION_REFERENCE.md, docs/go-to-market/TRUST_CENTER.md, and relevant release smoke / SLO docs.
- Add a concise table for first-pilot and early-production assumptions: expected tenants, reviews per month, concurrent operators, LLM budget bands, SQL/worker expectations, cache assumptions, and known triggers to scale.
- Treat **East US** as the canonical initial hosted SaaS region assumption unless a later owner decision changes it.
- Use this conservative initial hosted SaaS envelope unless later evidence supersedes it: up to 5 active pilot tenants, up to 25 committed reviews per tenant per month, up to 10 concurrent operators total, one API replica plus one worker replica as the starting point, SQL-backed storage, optional memory cache for single-replica pilots, and LLM budget defaults from the current configuration reference.
- Clearly distinguish tested evidence, documented target, and estimate.

Acceptance criteria:
- Operators can answer "how much can this handle for a pilot?" without inventing numbers.
- The document avoids contractual SLA claims.
- It links to SLO and deployment docs.

Constraints:
- Do not introduce new infrastructure requirements.
- Do not claim multi-region active/active.
- Do not require Redis for V1 single-replica pilots.
```

### 13. Make Accelerator Acceptance Criteria Concrete

**Why it matters:** Buyer-job accelerators sell better when they have crisp success criteria.

**Expected impact:** Directly improves Template and Accelerator Richness (+5-7 pts), Marketability (+2-4 pts), Time-to-Value (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Template and Accelerator Richness, Marketability, Proof-of-ROI Readiness.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Add concrete acceptance criteria to the top V1 accelerator walkthroughs.

Scope:
- Review docs/library/walkthroughs/README.md, AZURE_SAAS_READINESS_REVIEW.md, AI_GOVERNANCE_REVIEW.md, POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md, and docs/library/walkthroughs/ACCELERATOR_ACCEPTANCE_CRITERIA.md.
- For each top accelerator, add a short "done means" checklist: required input evidence, expected output artifact, minimum evidence labels, sponsor question answered, and what is explicitly out of scope.
- Keep the Core Pilot path as the shared prerequisite.

Acceptance criteria:
- Each accelerator has buyer-recognizable acceptance criteria.
- Deferred V1.1 connector expectations are not implied.
- Demo-only examples are clearly labeled.

Constraints:
- Do not create new product promises.
- Do not duplicate the full Core Pilot checklist.
- Do not include regulated compliance certification claims.
```

### COMPLETED: Add Operator “Next Action” Everywhere Proof Can Fail

**Actionable:** Completed — BLOCK/WARN findings include `supportNextStep`; triage cards map HOLD categories to one remediation path.

**Why it matters:** Customer self-sufficiency depends on actionable failure states.

**Expected impact:** Directly improves Customer Self-Sufficiency (+5-7 pts), Supportability (+3-5 pts), Adoption Friction (+2-4 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Customer Self-Sufficiency, Supportability, Adoption Friction, Usability.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Improve proof collection and first-pilot failure outputs with consistent NEXT ACTION text.

Scope:
- Review scripts and docs that emit READY/WARN/HOLD/DEFERRED/NEXT ACTION statuses, especially first-pilot proof, release smoke, data consistency readiness, config lint, and AI readiness gates.
- Standardize failure output so every HOLD includes one concrete next action and one supporting doc link.
- Add tests for status rendering where script tests exist.

Acceptance criteria:
- No HOLD state in first-pilot proof lacks a next action.
- Output uses consistent vocabulary.
- Operator docs include a short troubleshooting path from each major HOLD category.

Constraints:
- Do not hide failure details.
- Do not make scripts destructive.
- Do not add external services.
```

### COMPLETED: Add Commercial Conversion Checklist to Sponsor Packet

**Actionable:** Completed — generated `quote-to-proof-packet.md` links `COMMERCIAL_CONVERSION_CHECKLIST.md` and lists post-PASS commercial next steps.

**Why it matters:** Monetization requires a clear path from proof to quote or expansion.

**Expected impact:** Directly improves Commercial Packaging Readiness (+4-6 pts), Decision Velocity (+4-6 pts), Marketability (+2-4 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Commercial Packaging Readiness, Decision Velocity, Marketability.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Add a commercial conversion checklist to the post-pilot handoff docs.

Scope:
- Review docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md, QUOTE_TO_PROOF_PACKET.md, QUOTE_TO_PILOT_PACK.md, ORDER_FORM_TEMPLATE.md, and sponsor brief.
- Update the sponsor/operator handoff flow so after PASS proof it points to the next commercial action: request quote, guided pilot conversion, Professional/Enterprise evaluation, or procurement pack request.
- Keep language sales-led and honest about live checkout / marketplace deferred scope.

Acceptance criteria:
- Operators know what to do commercially after a successful proof bundle.
- The checklist does not imply Stripe live checkout or marketplace publication if not enabled.
- It links to order form and quote paths.

Constraints:
- Do not change prices.
- Do not remove deferred commerce boundaries.
- Do not create customer-specific legal terms.
```

### COMPLETED: Create a Short “AI Is Decision Support” Buyer Page

**Actionable:** Completed — `docs/go-to-market/AI_OUTPUT_DECISION_SUPPORT.md` linked from Trust Center.

**Why it matters:** It reduces legal/procurement anxiety and prevents overclaiming.

**Expected impact:** Directly improves Trustworthiness (+3-5 pts), Marketability (+2-4 pts), Explainability (+2-4 pts). Weighted readiness impact: +0.2-0.3%.

**Affected qualities:** Trustworthiness, Explainability, Marketability, Compliance Readiness.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Create or tighten a buyer-facing page explaining ArchLucid AI output limits.

Scope:
- Use docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md section "Limits of AI explanations" and docs/library/AGENT_OUTPUT_EVALUATION.md evidence-basis labels.
- Add a concise buyer page or section linked from the Trust Center and sponsor brief.
- Explain: AI text is decision support; manifests/findings/traces/governance records are reviewable evidence; humans approve final decisions; low-support/demo/estimate labels matter.

Acceptance criteria:
- The page is short, non-technical, and suitable for procurement/security reviewers.
- It avoids defensive wording while preventing overclaim.
- It links to deeper technical evidence for evaluators.

Constraints:
- Do not claim formal verification.
- Do not add legal advice.
- Do not introduce new product capabilities.
```

### 17. Add High-Level Product “One Screen” for Buyers

**Why it matters:** The product is deep; buyers need one screen that distinguishes Pilot, Operate, trust, and proof.

**Expected impact:** Directly improves Cognitive Load (+5-7 pts), Marketability (+2-4 pts), Time-to-Value (+2-3 pts). Weighted readiness impact: +0.2-0.3%.

**Affected qualities:** Cognitive Load, Marketability, Adoption Friction, Usability.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Create a one-screen buyer orientation artifact.

Scope:
- Use docs/START_HERE.md, docs/CORE_PILOT.md, docs/library/PRODUCT_PACKAGING.md, docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md, and docs/go-to-market/TRUST_CENTER.md.
- Add a concise buyer-facing "What to do first / what proof you get / what to defer" page or section.
- Include the two layers: Pilot and Operate.
- Include the first-pilot output set and trust/procurement links.

Acceptance criteria:
- A buyer can understand the first value path without reading architecture docs.
- The page does not duplicate detailed checklists.
- Deferred V1.1/V2 items are not presented as current requirements.

Constraints:
- Do not add new capabilities.
- Do not alter pricing.
- Do not reference historical assessments.
```

### COMPLETED: Add Audit Walkthrough for Security Reviewers

**Actionable:** Completed — `docs/go-to-market/SECURITY_AUDIT_WALKTHROUGH.md` traces one committed review for security reviewers.

**Why it matters:** Auditability is strong but needs a concrete reviewer path.

**Expected impact:** Directly improves Auditability (+3-5 pts), Procurement Readiness (+2-4 pts), Trustworthiness (+2-4 pts). Weighted readiness impact: +0.1-0.3%.

**Affected qualities:** Auditability, Procurement Readiness, Trustworthiness, Supportability.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Create a security-reviewer audit walkthrough.

Scope:
- Review docs/library/AUDIT_COVERAGE_MATRIX.md, docs/go-to-market/TRUST_CENTER.md, docs/library/API_CONTRACTS.md audit routes, and SIEM export docs.
- Add a short walkthrough showing how a reviewer traces one architecture review from run/review id to manifest, audit rows, correlation id, artifact, and export.
- Include limitations and retention notes.

Acceptance criteria:
- A security reviewer can follow one example path without understanding the whole repo.
- The walkthrough uses existing routes and artifacts.
- It clearly distinguishes audit evidence from formal SOC 2 attestation.

Constraints:
- Do not include customer data.
- Do not alter audit event taxonomy unless a gap is found.
- Do not claim third-party validation.
```

### COMPLETED: Add REST/CLI Integration Handoff Recipes

**Actionable:** Completed — `docs/library/V1_REST_CLI_INTEGRATION_RECIPES.md` linked from integration catalog.

**Why it matters:** V1 workflow embeddedness must rely on REST/CLI until V1.1 first-party connectors are fully in scope.

**Expected impact:** Directly improves Workflow Embeddedness (+4-6 pts), Interoperability (+3-5 pts), Adoption Friction (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Workflow Embeddedness, Interoperability, Adoption Friction.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Add practical V1 REST/CLI handoff recipes for common enterprise workflows.

Scope:
- Review docs/library/API_CONTRACTS.md, docs/library/CLI_USAGE.md, docs/go-to-market/INTEGRATION_CATALOG.md, and existing runbooks for GitHub/Azure DevOps handoff.
- Add recipes for: create review from CI, poll status, commit or detect committed manifest, download sponsor artifacts, post a link/comment back to GitHub or Azure DevOps, and export procurement-safe evidence.
- Use only V1-supported REST/CLI/operator surfaces.

Acceptance criteria:
- Recipes are copyable and scoped.
- They do not imply V1.1 Jira/ServiceNow/Slack/Teams commitments.
- They include auth, correlation id, and failure behavior notes.

Constraints:
- Do not add new connector code.
- Do not use customer secrets in examples.
- Do not widen the public API.
```

### COMPLETED: Add Cost-per-Successful-Review Evidence

**Actionable:** Completed — `report_llm_cost_envelope.py` adds estimated LLM USD and calls per committed review in `llm-cost-envelope.md`.

**Why it matters:** Hosted SaaS margins and buyer ROI both depend on understanding cost shape.

**Expected impact:** Directly improves Cost-Effectiveness (+4-6 pts), Proof-of-ROI Readiness (+2-4 pts), Commercial Packaging Readiness (+2-3 pts). Weighted readiness impact: +0.1-0.3%.

**Affected qualities:** Cost-Effectiveness, Proof-of-ROI Readiness, Commercial Packaging Readiness.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Add cost-per-successful-review reporting using existing LLM accounting and pilot deltas.

Scope:
- Review LLM accounting, tenant budget, pilot deltas, value report, and ROI summary services.
- Add a conservative internal/operator-facing metric: estimated LLM USD per committed review, LLM calls per review, and whether the run used simulator/real mode.
- Render it in an existing operator/admin report or proof artifact as internal/operator context, not invoice truth.
- Add tests for simulator exclusion, real-mode estimate, and missing cost data.

Acceptance criteria:
- Operators can see estimated LLM cost shape for a committed review.
- Reports clearly state estimates are not invoices.
- Simulator runs are labeled and do not imply hosted COGS.

Constraints:
- Do not change pricing.
- Do not expose provider secrets.
- Do not make Azure Cost Management calls for this task.
```

### COMPLETED: Make Terraform Validation Less Advisory Where Safe

**Actionable:** Completed — `saas-terraform-roots-validate` CI job is merge-blocking; `SAAS_INFRA_VALIDATION.md` updated.

**Why it matters:** Azure deployment readiness depends on IaC confidence.

**Expected impact:** Directly improves Azure Compatibility and SaaS Deployment Readiness (+3-5 pts), Deployability (+3-5 pts), Reliability (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

**Affected qualities:** Azure Compatibility and SaaS Deployment Readiness, Deployability, Reliability.

**Actionable:** Fully actionable now for no-credential validation.

**Cursor prompt:**

```text
Promote all no-credential Terraform root validation to merge-blocking.

Scope:
- Review .github/workflows/ci.yml saas-terraform-roots-validate and docs/engineering/SAAS_INFRA_VALIDATION.md.
- Treat all Terraform roots/modules as stable enough to run init -backend=false and validate without Azure credentials.
- Make every no-credential Terraform root validation merge-blocking.
- Keep only genuinely credential-dependent apply/plan behavior out of CI.
- Update docs to explain that all Terraform roots are strict for no-credential validation.

Acceptance criteria:
- No-credential Terraform validation fails CI on real syntax/provider errors for every root.
- There is no advisory-only Terraform root left for init -backend=false / validate coverage.
- No Azure credentials are required.

Constraints:
- Do not run terraform apply.
- Do not require live Azure access.
- Do not change infrastructure topology.
```

### COMPLETED: Add Custom Handler Example

**Actionable:** Completed — `SampleRiskReviewHandler` fixture and `SampleRiskReviewHandlerTests` documented in custom handler guide.

**Why it matters:** Extensibility exists in docs, but an example makes it believable.

**Expected impact:** Directly improves Extensibility (+4-6 pts), Documentation (+2-3 pts), Adoption Friction (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

**Affected qualities:** Extensibility, Documentation, Adoption Friction.

**Actionable:** Fully actionable now.

**Cursor prompt:**

```text
Add a minimal custom agent handler example aligned to current V1 boundaries.

Scope:
- Review docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md, docs/library/CUSTOM_AGENT_HANDLERS.md, and host composition registration patterns.
- Add a small example under an existing samples/templates area showing an in-repo handler registration or out-of-process HTTPS handler shape, whichever the docs prefer.
- Include tests or compile guards if code is added.

Acceptance criteria:
- Advanced integrators can see the minimal files and registration steps.
- The example includes safety/authority posture and non-goals.
- It does not imply a public plugin marketplace or third-party SDK.

Constraints:
- Keep each class in its own file if adding C# code.
- Do not add MCP or marketplace scope.
- Do not introduce new dependencies.
```

### 23. DEFERRED Published Reference Customer Evidence

**Reason it is deferred:** A real published reference requires customer permission, logo/case-study approval, and commercial/legal coordination. The repository can enforce and document the status, but it cannot create the customer evidence.

**Specific information needed later:** Customer name or anonymized approved reference, approval status, permitted logo/case-study language, measurable ROI delta if approved, and whether the reference discount applies.

**Expected impact:** Improves Marketability, Differentiability, Proof-of-ROI Readiness, Decision Velocity. Weighted readiness impact is `(B)` / commercial realism unless explicitly promoted into the scoring boundary.

### 24. DEFERRED SOC 2 CPA / External Assurance Plan

**Reason it is deferred:** The CPA attestation path requires budget, auditor/readiness consultant selection, observation window decisions, and management process evidence outside code changes.

**Specific information needed later:** Budget ceiling, readiness consultant shortlist, desired Type I / Type II timeline, observation window length, system boundary, region scope, and owner-approved evidence-room plan.

**Expected impact:** Improves Procurement Readiness, Compliance Readiness, Trustworthiness, Decision Velocity. It remains `(B)` procurement realism and must not reduce `(A)` until scope changes.

### 25. DEFERRED ServiceNow / Atlassian Validation Inputs

**Reason it is deferred:** V1.1 first-party connector validation depends on external tenant/application credentials and owner sequencing decisions.

**Specific information needed later:** ServiceNow developer instance URL and credentials, Jira/Confluence tenant details, project/space keys, auth mode, allowed test objects, and whether any buyer requires OAuth rather than API token/basic auth for MVP validation.

**Expected impact:** Improves Workflow Embeddedness, Interoperability, Enterprise Adoption, Adoption Friction. It is V1.1 scope and excluded from the current `(A)` score unless the scoring boundary changes.

## 10. Prompt Batching Guidance

**Batch A — Sponsor Proof and ROI:** Improvements 1, 3, 5, 6, and 15 belong together. They touch sponsor artifacts, proof bundle status, ROI evidence, and commercial next action. This is the highest-leverage batch for monetization.

**Batch B — AI Trust and Retrieval Evidence:** Improvements 2, 6, 10, and 20 can share context around agent evaluation, evidence labels, data consistency, and cost-per-review evidence. Keep code changes scoped to avoid mixing too many report renderers at once.

**Batch C — First-Pilot Usability:** Improvements 4, 14, and 17 are mostly documentation and operator flow. They are cost-effective and reduce cognitive load without destabilizing product code.

**Batch D — Procurement and Trust:** Improvements 7, 8, 16, and 18 should be batched because they share Trust Center, procurement pack, and buyer-safe claim language. Avoid combining with AI code changes.

**Batch E — Enterprise Operations:** Improvements 11, 12, 19, and 21 share deployment, configuration, integration, and operations evidence. This is a good infrastructure/platform batch.

**Batch F — Extensibility:** Improvement 22 should be isolated unless the implementation is docs-only. If it adds sample C# code, keep it separate to avoid compile/test churn.

**Deferred Batch:** Improvements 23, 24, and 25 should not be executed until owner/customer inputs exist. Do not generate prompts for them until the requested information is supplied.

## 11. Pending Questions for Later

### DEFERRED Published Reference Customer Evidence

- Which customer, if any, has approved a public reference row?
- What exact logo/case-study language is approved?
- Is measured ROI allowed to be published, quoted anonymously, or kept internal only?
- Does the reference discount apply to this account?

### DEFERRED SOC 2 CPA / External Assurance Plan

- What budget ceiling is approved for readiness consultant and CPA work?
- Is the target Type I, Type II, or readiness-only?
- What observation window length is acceptable?
- What system boundary and Azure regions should appear in the auditor-facing description?
- Who owns evidence-room maintenance?

### DEFERRED ServiceNow / Atlassian Validation Inputs

- What ServiceNow developer instance should be used for V1.1 validation?
- What Jira project and Confluence space are safe for connector test objects?
- Which auth mode is acceptable for MVP validation?
- Are OAuth requirements buyer-driven or follow-on only?

