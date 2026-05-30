# ArchLucid Assessment - (A) Headline Readiness: 81.26%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding items explicitly deferred to V1.1, V1.x, V2, owner-only commercial action, or `(B)` procurement realism.

**Scoring basis:** post-implementation rescore after executing the top-25 improvement batch (2026-05-29). Prior clean-slate baseline: **79.36%** (`9603 / 121`). Total weight: **121**. Weighted score sum: **9832**. Weighted readiness: **9832 / 121 = 81.26%**.

**Implementation note:** Twenty-four of twenty-five ranked improvements were implemented or materially closed in-repo; **#25 (live commerce un-hold)** remains **DEFERRED** (owner-only, TB-137). See **§9a** for per-item status.

---

## 2. Executive Summary

### `(A)` Overall Headline Readiness

ArchLucid is materially beyond prototype stage and **closer to a repeatable first-pilot motion** after the 2026-05-29 improvement batch: real-LLM JSON rollups, tenant/retrieval boundary proof, starter-pack validation, quote-to-proof readiness JSON, first-pilot home strip, support triage one-pager, IaC parity scan, and OpenAPI run-detail forensics guards. The headline score is still held down by **live AI proof density under credentialed schedules**, **OpenAPI snapshot drift on RunDetailDto forensics fields**, and **workflow embedding** (V1.1 connectors remain out of `(A)` scope).

### `(B)` Procurement / Market-Motion Realism

Rigid enterprise procurement will still ask for CPA-issued SOC 2, third-party pen-test reports, live Marketplace transactability, public references, and deep first-party workflow connectors. Those items are explicitly outside the weighted `(A)` score where the scope docs say so. They remain real buyer friction, but they are market-motion and assurance-program friction rather than current product-readiness deductions.

### Commercial Picture

The commercial story is credible when anchored on a sponsor-safe proof packet: "one architecture review, committed findings, evidence labels, ROI/source classification, and next action." The risk is that the repo contains more product than the first buyer motion can absorb. Revenue depends less on adding features and more on making the first proof packet impossible to misread, fast to produce, and directly tied to quote/follow-up workflow.

### Enterprise Picture

Enterprise foundations are unusually strong for this stage: database-per-tenant posture, SAML/OIDC/SCIM story, append-only audit, policy packs, trust center, no vendor write-role requirement for Azure evidence, support bundles, and procurement pack discipline. Enterprise adoption will still slow on workflow embedding, assurance artifacts, and environment-specific PASS/HOLD evidence.

### Engineering Picture

Engineering quality is high but broad. The repo shows warnings-as-errors, OpenAPI snapshots, SQL Server integration discipline, architecture invariants, RAG/faithfulness harnesses, and explicit backlog hygiene. The most important risks are not lack of code volume; they are correctness and trust closure across tenant scope, retrieval grounding, real-LLM evidence, proof artifact consistency, run-detail operator visibility, and IaC parity.

---

## 3. Weighted Quality Assessment

Qualities are ordered by **weighted deficiency signal**: `(100 - score) x weight`.

### Cutting-Edge AI Technology

- **Score:** 82
- **Weight:** 8
- **Weighted impact on readiness:** 656 / 121
- **Weighted deficiency signal:** 144
- **Justification:** Azure OpenAI, structured agent outputs, RAG infrastructure, faithfulness reports, cost/budget hooks, real-mode smoke evidence, and **machine-readable real-LLM gate JSON** are present. Remaining gap: credentialed golden-cohort schedule density and always-on live proof in normal CI.
- **Tradeoffs:** This restraint improves enterprise safety but makes ArchLucid look less advanced next to generic copilot demos.
- **Improvement recommendations:** Expand the real-LLM golden cohort, strengthen retrieval tenant/filter proof, publish AI evidence rollups, and keep unsupported ROI/cost claims visibly blocked.
- **Disposition:** V1-fixable for evidence and retrieval quality; graph-RAG and agentic retrieval are better suited for V2 unless explicitly promoted.

### Correctness

- **Score:** 86
- **Weight:** 8
- **Weighted impact on readiness:** 688 / 121
- **Weighted deficiency signal:** 112
- **Justification:** Cross-surface proof consistency tests, starter-pack validation, quote-to-proof readiness JSON, run-detail OpenAPI forensics test, and expanded proof collector gates reduce drift. **OpenAPI snapshot still lags live RunDetailDto forensics fields** until regen.
- **Tradeoffs:** Multiple buyer surfaces are valuable, but each new surface multiplies drift risk.
- **Improvement recommendations:** Add cross-surface proof consistency gates, run-detail contract drift tests, and template/proof dry-run validation.
- **Disposition:** V1-fixable.

### AI/Agent Readiness

- **Score:** 85
- **Weight:** 8
- **Weighted impact on readiness:** 680 / 121
- **Weighted deficiency signal:** 120
- **Justification:** Real-LLM gate JSON rollup, allowed-tool dispatch guard, faithfulness harness, and cost accounting are wired. Weakness remains credentialed multi-agent live evidence on a recurring schedule.
- **Tradeoffs:** Deterministic simulator-heavy CI is cheaper and stable, but it cannot prove model behavior under production-like inference.
- **Improvement recommendations:** Turn live evidence into a scheduled optional gate with clear SKIPPED/PASS/HOLD states and attach model/deployment metadata to sponsor artifacts.
- **Disposition:** Partly V1-fixable; live credentials and scheduling require owner environment decisions.

### Stickiness

- **Score:** 77
- **Weight:** 6
- **Weighted impact on readiness:** 462 / 121
- **Weighted deficiency signal:** 138
- **Justification:** Compare, replay, graph, governance, audit, policy packs, ROI rollups, and proof packets create reasons to return after a first review. Stickiness is weaker than feature count suggests because recurring operating rituals are not yet as obvious as the first-review path.
- **Tradeoffs:** A narrow first-value motion is good, but it must evolve into a review cadence without overwhelming buyers.
- **Improvement recommendations:** Make post-commit next actions opinionated: second review, governance dry-run, executive ROI rollup, or proof-to-quote follow-up.
- **Disposition:** V1-fixable for workflow packaging; first-party ITSM/chat embedding is V1.1.

### Marketability

- **Score:** 83
- **Weight:** 8
- **Weighted impact on readiness:** 664 / 121
- **Weighted deficiency signal:** 136
- **Justification:** The wedge is strong: evidence-backed architecture reviews for Azure-heavy, governance-sensitive buyers. The trust center, proof packets, buyer job pages, executive sponsor brief, and commercial decision packet support a real sales-led motion. The product still needs sharper "why this instead of a generic AI assistant" proof in the first 10 minutes.
- **Tradeoffs:** Precise enterprise positioning is less viral than broad AI messaging, but it is more credible.
- **Improvement recommendations:** Lead with proof packet output, one golden accelerator walkthrough, and differentiation evidence tied to live artifacts.
- **Disposition:** V1-fixable.

### Time-to-Value

- **Score:** 85
- **Weight:** 7
- **Weighted impact on readiness:** 595 / 121
- **Weighted deficiency signal:** 105
- **Justification:** Home **First-pilot path** strip, canonical operator path cross-links, 20-minute runbook, and proof PASS/HOLD language in collector reduce first-session friction.
- **Tradeoffs:** Enterprise-grade controls add setup steps that a consumer-style AI tool does not have.
- **Improvement recommendations:** Collapse first-session guidance into one command center and make proof PASS/WARN/HOLD the primary operator language.
- **Disposition:** V1-fixable.

### Adoption Friction

- **Score:** 80
- **Weight:** 6
- **Weighted impact on readiness:** 480 / 121
- **Weighted deficiency signal:** 120
- **Justification:** ArchLucid avoids invasive customer access through Tier 1 Azure extractor ZIPs and supports REST/CLI/UI/SCIM. Still, buyer operators must understand pilot vs operate, evidence source labels, auth modes, and deferred integration boundaries.
- **Tradeoffs:** Low-access posture reduces security objections but shifts work to customer-side evidence collection.
- **Improvement recommendations:** Strengthen preflight, guided evidence collection, and first-pilot command center sequencing.
- **Disposition:** V1-fixable.

### Proof-of-ROI Readiness

- **Score:** 87
- **Weight:** 5
- **Weighted impact on readiness:** 435 / 121
- **Weighted deficiency signal:** 65
- **Justification:** ROI source catalog, cross-surface consistency tests, executive orphan KPIs, and **quote-to-proof-readiness.json** in proof packets strengthen sponsor-safe ROI narrative.
- **Tradeoffs:** Honest ROI labeling may reduce headline numbers, but it increases trust.
- **Improvement recommendations:** Add a cross-surface ROI/proof consistency gate and make weak ROI basis block sponsor-send or force caveats.
- **Disposition:** V1-fixable.

### Differentiability

- **Score:** 80
- **Weight:** 4
- **Weighted impact on readiness:** 320 / 121
- **Weighted deficiency signal:** 80
- **Justification:** ArchLucid differentiates on committed architecture reviews, evidence chains, governance, policy packs, ROI/source labeling, and advisory-only Terraform posture. The differentiation is real but still needs sharper buyer-facing proof against "we can ask ChatGPT/Copilot for this."
- **Tradeoffs:** Deep defensibility is harder to explain quickly.
- **Improvement recommendations:** Make the differentiation proof packet artifact-first: show traceability, commit state, policy outcome, audit evidence, and source labels in one narrative.
- **Disposition:** V1-fixable.

### Workflow Embeddedness

- **Score:** 75
- **Weight:** 3
- **Weighted impact on readiness:** 225 / 121
- **Weighted deficiency signal:** 75
- **Justification:** REST, CLI, UI, SCIM, GitHub/Azure DevOps handoff, exports, and proof bundles are in scope. First-party ITSM/chat/docs connectors are V1.1 and excluded from headline scoring, but the V1 workflow still feels adjacent to daily systems rather than fully inside them.
- **Tradeoffs:** Avoiding premature connector sprawl protects focus.
- **Improvement recommendations:** Improve V1 handoff artifacts and make GitHub/Azure DevOps proof links first-class.
- **Disposition:** V1-fixable for handoff; native connectors are V1.1.

### Executive Value Visibility

- **Score:** 82
- **Weight:** 4
- **Weighted impact on readiness:** 328 / 121
- **Weighted deficiency signal:** 72
- **Justification:** Executive ROI summary, first-value report, sponsor brief, commercial closeout, and quote-to-proof packet exist. The weakness is not missing executive content; it is ensuring every executive view carries the same caveats, source basis, and next commercial action.
- **Tradeoffs:** More caveats reduce punchiness but prevent overclaiming.
- **Improvement recommendations:** Harden executive sponsor proof with one status table: value, source basis, risk, deferred asks, and decision CTA.
- **Disposition:** V1-fixable.

### Usability

- **Score:** 79
- **Weight:** 3
- **Weighted impact on readiness:** 237 / 121
- **Weighted deficiency signal:** 63
- **Justification:** Operator Home, review detail, identity-provider checklist, first-run wizard, and runbooks provide many guided paths. The cognitive issue is density: users can complete tasks, but they may not always know which of many routes is primary.
- **Tradeoffs:** Exposing power-user depth helps operators, but confuses first-time evaluators.
- **Improvement recommendations:** Push progressive disclosure harder and keep one primary CTA per phase.
- **Disposition:** V1-fixable.

### Trustworthiness

- **Score:** 84
- **Weight:** 3
- **Weighted impact on readiness:** 252 / 121
- **Weighted deficiency signal:** 48
- **Justification:** Tenant/retrieval boundary proof artifact, scope binding tests, and retrieval filter tests are now first-pilot proof outputs. CPA SOC 2 and third-party pen test remain out of weighted scope.
- **Tradeoffs:** Honest limitations create procurement friction but avoid later credibility damage.
- **Improvement recommendations:** Add buyer-safe trust evidence summaries to proof bundles and close tenant/retrieval scope tests with explicit PASS/HOLD output.
- **Disposition:** V1-fixable for product evidence; CPA SOC 2 and third-party pen testing are out of weighted scope.

### Architectural Integrity

- **Score:** 83
- **Weight:** 3
- **Weighted impact on readiness:** 249 / 121
- **Weighted deficiency signal:** 51
- **Justification:** The architecture is decomposed into contracts, core/application, persistence, host composition, UI, CLI, and integration layers. Architecture invariants and solution filters help. Risk comes from breadth: legacy coordinator/authority vocabulary, many DTO surfaces, and UI/API projection duplication.
- **Tradeoffs:** Maintaining old surfaces reduces migration risk but increases mental model cost.
- **Improvement recommendations:** Continue invariant enforcement and eliminate duplicate business logic in UI/proof generators.
- **Disposition:** V1-fixable.

### Interoperability

- **Score:** 76
- **Weight:** 2
- **Weighted impact on readiness:** 152 / 121
- **Weighted deficiency signal:** 48
- **Justification:** REST, CLI, OpenAPI client, SCIM, Azure extractor upload, GitHub/Azure DevOps handoff, and exports provide usable interoperability. First-party Jira, ServiceNow, Confluence, Slack, Teams, broad webhooks, and MCP are outside current headline scope where deferred, but buyers will still compare against them.
- **Tradeoffs:** V1 chooses stable primitives over broad connector surface.
- **Improvement recommendations:** Make the current primitives easier to operationalize through examples and proof links.
- **Disposition:** V1-fixable for REST/CLI/export recipes; first-party connectors are V1.1.

### Security

- **Score:** 87
- **Weight:** 3
- **Weighted impact on readiness:** 261 / 121
- **Weighted deficiency signal:** 39
- **Justification:** Scope identity binding, IDOR integration tests, retrieval OData filters, production-like search lint, and **tenant-retrieval-boundary-proof** in first-pilot rollup.
- **Tradeoffs:** Strong tenant isolation makes local/dev ergonomics harder.
- **Improvement recommendations:** Treat tenant-boundary and retrieval-boundary tests as release blockers for hosted sponsor handoff.
- **Disposition:** V1-fixable.

### Decision Velocity

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 164 / 121
- **Weighted deficiency signal:** 36
- **Justification:** **quote-to-proof-readiness.json** and commercial next-step fields in proof packets operationalize quote follow-up; live commerce remains deferred.
- **Tradeoffs:** Founder-led selling can compensate manually, but does not scale cleanly.
- **Improvement recommendations:** Add quote-to-proof readiness and follow-up SLA artifacts.
- **Disposition:** V1-fixable.

### Commercial Packaging Readiness

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 156 / 121
- **Weighted deficiency signal:** 44
- **Justification:** Pricing philosophy, order-form template, commercial packet, WHAT_NOT_TO_PROMISE, and trust center provide a credible sales-led package. Packaging still needs stronger guards tying proof state to offer state, tier fit, and deferred ask language.
- **Tradeoffs:** Sales-led packaging is appropriate before live commerce un-hold.
- **Improvement recommendations:** Add tier-fit matrix and commercial copy overclaim guard.
- **Disposition:** V1-fixable; live commerce flip is owner/V1.1.

### Procurement Readiness

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 156 / 121
- **Weighted deficiency signal:** 44
- **Justification:** The procurement pack, trust center, DPA template, CAIQ/SIG, SOC self-assessment, security docs, and objection playbook are strong. Procurement blockers remain where buyers demand external attestations or named references, but those are not weighted into `(A)`.
- **Tradeoffs:** Templates and self-assessment get conversations started but do not satisfy rigid RFP checkboxes.
- **Improvement recommendations:** Strengthen strict marker checks, procurement-pack freshness, and buyer-safe omissions report.
- **Disposition:** V1-fixable for pack quality; external attestations are outside weighted scope.

### Traceability

- **Score:** 86
- **Weight:** 3
- **Weighted impact on readiness:** 258 / 121
- **Weighted deficiency signal:** 42
- **Justification:** Runs, manifests, artifacts, audit events, pipeline timelines, correlation IDs, provenance, and evidence labels are strongly represented. Remaining risk is fragmented presentation across detail pages, proof bundles, and exported artifacts.
- **Tradeoffs:** Deep traceability can create UI density.
- **Improvement recommendations:** Add buyer-safe traceability summaries to proof packets and support triage docs.
- **Disposition:** V1-fixable.

### Compliance Readiness

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 160 / 121
- **Weighted deficiency signal:** 40
- **Justification:** Compliance docs, SOC self-assessment, CAIQ/SIG, DPA, subprocessor register, audit matrix, VPAT draft, and trust center are present. The score does not penalize missing CPA SOC 2 or ISO certification; procurement realism covers that separately.
- **Tradeoffs:** Self-attestation is honest but weaker than independent assurance.
- **Improvement recommendations:** Keep trust claims freshness-gated and prevent accidental certification language.
- **Disposition:** V1-fixable for documentation and claim safety.

### Reliability

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 160 / 121
- **Weighted deficiency signal:** 40
- **Justification:** Health endpoints, worker orchestration, retry/state transitions, support bundles, SLO targets, staging chaos docs, and readiness scripts exist. The gap is operational evidence under hosted, production-like conditions.
- **Tradeoffs:** V1 intentionally avoids multi-region active/active as a headline gate.
- **Improvement recommendations:** Produce availability/probe rollups with explicit non-SLA wording and require readiness proof for sponsor handoff.
- **Disposition:** V1-fixable for evidence; multi-region guarantees are deferred.

### Maintainability

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 160 / 121
- **Weighted deficiency signal:** 40
- **Justification:** The repo has strict build settings, central package management, solution filters, architecture docs, and detailed backlog hygiene. Breadth and duplicated projection logic still create maintenance load.
- **Tradeoffs:** Extensive docs help agents and humans, but also require freshness gates.
- **Improvement recommendations:** Add drift gates around generated clients, docs, policy packs, templates, and DDL.
- **Disposition:** V1-fixable.

### Explainability

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 164 / 121
- **Weighted deficiency signal:** 36
- **Justification:** Rationale endpoints, explanation summaries, evidence refs, provenance, trace payloads, and source classification support explainability. Weakness remains in how quickly an operator can connect an output to retrieved chunks, tool calls, policy inputs, and cost/ROI basis.
- **Tradeoffs:** Full forensic visibility can expose sensitive or noisy implementation detail.
- **Improvement recommendations:** Add redaction-safe retrieval/tool-call panels and proof summaries.
- **Disposition:** V1-fixable.

### Azure Compatibility and SaaS Deployment Readiness

- **Score:** 85
- **Weight:** 2
- **Weighted impact on readiness:** 170 / 121
- **Weighted deficiency signal:** 30
- **Justification:** IaC parity scan in first-pilot proof, production-like config lint, and Terraform pilot validation matrix close Azure deploy parity gaps for essential services.
- **Tradeoffs:** Azure-native posture improves enterprise fit but narrows multi-cloud deployment appeal, which is out of current hosting scope.
- **Improvement recommendations:** Close IaC parity for active runtime services and add production-like config lint evidence.
- **Disposition:** V1-fixable for Azure parity; AWS/GCP target analysis is V1.1 and re-hosting is out of scope.

### Data Consistency

- **Score:** 83
- **Weight:** 2
- **Weighted impact on readiness:** 166 / 121
- **Weighted deficiency signal:** 34
- **Justification:** SQL persistence, DbUp migrations, manifests, append-only audit, source classification, and server-side KPI improvements support consistency. Risk remains around DDL/migration drift, proof artifact consistency, and UI/server projection duplication.
- **Tradeoffs:** Multiple materialized views improve performance and UX but require consistency gates.
- **Improvement recommendations:** Expand data-consistency proof gates and DDL drift verification.
- **Disposition:** V1-fixable.

### Policy and Governance Alignment

- **Score:** 84
- **Weight:** 2
- **Weighted impact on readiness:** 168 / 121
- **Weighted deficiency signal:** 32
- **Justification:** Policy packs, pre-commit governance, approval workflows, policy assignment, governance dashboard, and buyer-safe caveats are present. Main risk is stale or overclaiming policy-pack metadata.
- **Tradeoffs:** Starter policy packs are useful, but must not imply certification.
- **Improvement recommendations:** Add policy-pack freshness and caveat validation to proof/procurement artifacts.
- **Disposition:** V1-fixable.

### Cognitive Load

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 78 / 121
- **Weighted deficiency signal:** 22
- **Justification:** Single Home strip, chooser doc, and explicit deferred-scope links reduce first-session overload; product surface remains dense for power users.
- **Tradeoffs:** Enterprise products need depth; first-value UX needs restraint.
- **Improvement recommendations:** Keep first-run guidance to one primary path and move depth behind explicit "after first commit" affordances.
- **Disposition:** V1-fixable.

### Template and Accelerator Richness

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 82 / 121
- **Weighted deficiency signal:** 18
- **Justification:** Chooser, per-pack `starter-pack.json`, CI validation, golden walkthrough, and proof-collector gate complete the accelerator story.
- **Tradeoffs:** More templates without validation would increase risk.
- **Improvement recommendations:** Build a chooser, metadata contract, static validation, and one golden walkthrough.
- **Disposition:** V1-fixable.

### Performance

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 74 / 121
- **Weighted deficiency signal:** 26
- **Justification:** SLO targets, metrics, query p95 work, caching options, and health probes exist. There is limited buyer-visible performance evidence for the first-pilot path.
- **Tradeoffs:** Deep performance work is less important than correctness at this stage, but slow proof generation harms conversion.
- **Improvement recommendations:** Add a first-pilot performance smoke report with thresholded PASS/WARN/HOLD.
- **Disposition:** V1-fixable.

### Scalability

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 74 / 121
- **Weighted deficiency signal:** 26
- **Justification:** Container Apps, worker separation, optional Redis, SQL topology, and queue/event patterns support scale. Distributed cache hardening and multi-region active/active are intentionally outside V1 headline scope.
- **Tradeoffs:** Single-region early production is simpler and cheaper.
- **Improvement recommendations:** Document scale tiers and add config lint for multi-replica cache consistency assumptions.
- **Disposition:** V1-fixable for clarity; deeper scale-out is V2.

### Availability

- **Score:** 75
- **Weight:** 1
- **Weighted impact on readiness:** 75 / 121
- **Weighted deficiency signal:** 25
- **Justification:** Health endpoints, SLO targets, backup/DR docs, staging probes, and hosted availability rollup tooling exist. The score is capped by limited production availability evidence.
- **Tradeoffs:** Avoiding premature SLA claims protects trust.
- **Improvement recommendations:** Keep availability evidence buyer-safe and distinguish target vs observed uptime.
- **Disposition:** V1-fixable for evidence.

### Auditability

- **Score:** 88
- **Weight:** 2
- **Weighted impact on readiness:** 176 / 121
- **Weighted deficiency signal:** 24
- **Justification:** Append-only audit, typed event catalog, audit search, CSV export, pipeline timeline, correlation IDs, and audit matrix are strong. Remaining risk is drift when new mutating/proof actions land.
- **Tradeoffs:** Detailed audit can be noisy without buyer-safe summaries.
- **Improvement recommendations:** Add audit coverage drift gates and proof-bundle audit summaries.
- **Disposition:** V1-fixable.

### Customer Self-Sufficiency

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 78 / 121
- **Weighted deficiency signal:** 22
- **Justification:** First-pilot docs, operator UI, CLI, troubleshooting, procurement pack, and demo workspaces support self-sufficiency. Hosted SaaS LLM setup is not a customer prerequisite, but operators still need help choosing the right path.
- **Tradeoffs:** Sales-led pilots are acceptable, but self-serve trials need stronger rails.
- **Improvement recommendations:** Strengthen guided preflight, first-pilot command center, and "when not to use this accelerator" docs.
- **Disposition:** V1-fixable.

### Extensibility

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 78 / 121
- **Weighted deficiency signal:** 22
- **Justification:** Custom agent handler documentation is in scope and REST/CLI/OpenAPI provide extension points. Public plugin SDK, marketplace, MCP transport, and outbound MCP are excluded where deferred.
- **Tradeoffs:** Code-level extensibility is enough for advanced integrators, but not a platform ecosystem.
- **Improvement recommendations:** Keep custom handler docs concrete and avoid implying a public plugin platform.
- **Disposition:** V1-fixable for docs; ecosystem features are deferred.

### Cost-Effectiveness

- **Score:** 79
- **Weight:** 1
- **Weighted impact on readiness:** 79 / 121
- **Weighted deficiency signal:** 21
- **Justification:** Simulator mode, LLM budget controls, cost estimators, source classification, Azure cost extractor, and optional cache providers support cost discipline. Real-LLM proof and hosted probes need bounded schedules to avoid runaway spend.
- **Tradeoffs:** More live AI evidence costs money.
- **Improvement recommendations:** Add budgeted live-evidence schedules and cost summaries in proof artifacts.
- **Disposition:** V1-fixable.

### Deployability

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 84 / 121
- **Weighted deficiency signal:** 16
- **Justification:** IaC parity scan + existing Terraform roots and config lint; optional services may still WARN when TF root absent.
- **Tradeoffs:** Supporting many deployment roots creates drift risk.
- **Improvement recommendations:** Add an IaC parity scanner and production-like config evidence.
- **Disposition:** V1-fixable.

### Manageability

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 82 / 121
- **Weighted deficiency signal:** 18
- **Justification:** Configuration references, doctor, support bundles, config lint, operator dashboards, policy/governance controls, and health endpoints support manageability. The remaining weakness is scattered operational proof.
- **Tradeoffs:** Rich configuration needs better guardrails.
- **Improvement recommendations:** Promote production-like config lint and support triage artifacts into first-pilot proof.
- **Disposition:** V1-fixable.

### Supportability

- **Score:** 87
- **Weight:** 1
- **Weighted impact on readiness:** 87 / 121
- **Weighted deficiency signal:** 13
- **Justification:** Support triage one-pager, backfill `--output-json`, and expanded proof collector JSON artifacts improve support handoff.
- **Tradeoffs:** More diagnostics can overwhelm support unless ordered.
- **Improvement recommendations:** Add support/audit triage one-pager and CLI JSON for key proof/support commands.
- **Disposition:** V1-fixable.

### Testability

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 84 / 121
- **Weighted deficiency signal:** 16
- **Justification:** Test structure is strong: unit, SQL integration, API integration, UI Vitest/Playwright, OpenAPI snapshots, coverage gates, RAG/faithfulness harnesses, and release smoke docs. Gaps remain around live-model and environment-specific evidence.
- **Tradeoffs:** Full live coverage would be slow and costly.
- **Improvement recommendations:** Keep live gates optional but explicit, and add deterministic template/proof/policy validators.
- **Disposition:** V1-fixable.

### Documentation

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 86 / 121
- **Weighted deficiency signal:** 14
- **Justification:** Documentation is extensive and often excellent: START_HERE, V1 scope, deferred inventory, trust center, runbooks, build guide, API docs, and buyer materials. Weakness is volume and freshness risk, not absence.
- **Tradeoffs:** Comprehensive docs help enterprise review but can slow first-time readers.
- **Improvement recommendations:** Keep role-based routing and add freshness/overclaim guards.
- **Disposition:** V1-fixable.

---

## 4. Top 12 Most Important Weaknesses

1. **Live AI proof is still too episodic.** Real-mode evidence exists, but the buyer-safe story needs scheduled, bounded, repeatable live-model proof.
2. **The first-pilot path is still cognitively dense.** The product has a canonical path, but there are too many adjacent docs and optional surfaces.
3. **Proof artifacts need stronger cross-surface consistency.** UI, CLI, exports, sponsor packets, and commercial closeout must agree on ROI basis, execution mode, governance status, and deferred scope.
4. **Workflow embedding is shallow in V1.** REST/CLI/export paths work, but native daily-tool embedding is deferred.
5. **AI differentiation is real but not instantly obvious.** The product needs artifact-first proof against generic AI assistant comparisons.
6. **Environment-specific trust evidence is not yet strong enough.** Buyers need PASS/HOLD snapshots tied to their deployment, not only docs.
7. **IaC parity appears behind the Azure-native ambition.** Active runtime services and private connectivity should be fully representable and validated.
8. **Run-detail/operator forensics remain too fragmented.** Operators need quick access to retrieval, tool calls, cost, trust, governance, and provenance in one review context.
9. **Policy-pack and starter-pack quality depends too much on discipline.** Metadata, caveats, and validation should be automated.
10. **Commercial operations lag product proof.** Quote status, follow-up SLA, and tier fit are less structured than technical evidence.
11. **Performance and availability evidence are targets more than lived proof.** The repo is honest, but buyers will ask for observed rollups.
12. **Documentation volume creates its own risk.** A lot is documented; the challenge is keeping the first path decisive and all claims current.

---

## 5. Top 6 Monetization Blockers

1. **Unclear proof-to-quote transition.** After a strong review, the next commercial action must be unambiguous.
2. **ROI basis skepticism.** Buyers will not pay on defaulted or demo-derived savings without sharp labels and caveats.
3. **Generic AI substitution risk.** If the buyer does not see committed evidence, auditability, and governance, they may default to a cheaper assistant.
4. **Sales-led commerce dependency.** Live self-serve transactability is deferred, so founder/sales follow-up quality matters.
5. **No public reference or case-study proof in the current weighted scope.** This is not an `(A)` defect, but it affects conversion confidence.
6. **Template chooser weakness.** Buyers with different jobs need to see the right accelerator immediately.

---

## 6. Top 6 Enterprise Adoption Blockers

1. **Procurement assurance friction.** SOC 2 CPA and third-party pen-test reports are not headline-scored, but many security reviewers will still ask.
2. **Native workflow connector expectations.** Jira, ServiceNow, Confluence, Slack, Teams, broad webhooks, and MCP are V1.1/deferred where documented.
3. **Tenant and retrieval boundary proof.** Enterprise reviewers need hard evidence that scope cannot bleed across tenants.
4. **Deployment/IaC parity.** Azure-native buyers will expect active resources, private endpoints, RBAC, diagnostics, and configuration to be represented as code.
5. **Operational evidence maturity.** Availability, backup/DR, probe rollups, and support triage need environment-specific proof.
6. **Self-sufficiency of first pilot.** Enterprise operators can run the path, but may still need guidance to avoid wrong docs, wrong scope, or wrong proof labels.

---

## 7. Top 6 Engineering Risks

1. **Scope enforcement regressions.** Tenant, workspace, project, retrieval, and API-key/JWT scope binding must remain release-blocking invariants.
2. **Semantic drift in AI outputs.** Without recurring live golden cohorts and faithfulness trend enforcement, model behavior can regress silently.
3. **Cross-surface data divergence.** Backend KPIs, UI summaries, exports, proof packets, and generated clients can drift.
4. **IaC/configuration drift.** Portal-only or partially codified Azure resources can break deployability, security, and support.
5. **Evidence overclaiming.** Marketing, sponsor packets, policy packs, and trust docs can imply unsupported assurance or ROI unless guarded.
6. **Operational blind spots.** Missing or scattered tool-call, retrieval, audit, and cost views slow incident triage.

---

## 8. Most Important Truth

ArchLucid's core product is credible; the fastest path to higher readiness is not more feature breadth, but making the first real proof packet, trust evidence, and commercial next step impossible to misunderstand.

---

## 9. Top Improvement Opportunities

## 9a. Improvement Implementation Status (2026-05-29 rescore)

| # | Improvement | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Real-LLM JSON rollup + tests | **Done** | `scripts/Invoke-RealLlmEvidenceGate.ps1` writes `.json`; golden cohort workflow |
| 2 | Tenant/retrieval boundary gate | **Done** | `report_tenant_retrieval_boundary_proof.py`; wired in `collect-first-pilot-proof.ps1` |
| 3 | Cross-surface proof consistency | **Done** | `SponsorArtifactCrossSurfaceConsistencyTests.cs`; proof collector gates |
| 4 | First-pilot command center | **Done** | `PilotStartHereStrip.tsx`; operator path + 20-minute runbook links |
| 5 | Run detail forensics | **Partial** | Enricher + UI panels; live OpenAPI forensics test — **regenerate OpenAPI snapshot** |
| 6 | Quote-to-proof readiness | **Done** | `quote-to-proof-readiness.json` in `pilot proof-packet` |
| 7 | Starter pack chooser | **Done** | `STARTER_PROOF_PACK_CHOOSER.md` |
| 8 | Starter pack metadata validation | **Done** | `starter-pack.json` per pack; `check_starter_proof_packs.py` + CI tests |
| 9 | Policy pack freshness gate | **Done** | `report_governance_policy_pack_proof.py` in proof collector |
| 10 | Audit coverage drift gate | **Done** | mutating-route audit matrix in collector |
| 11 | IaC parity scanner | **Done** | `report_iac_parity_scan.py`; wired in proof collector |
| 12 | Azure OpenAI managed identity | **Partial** | Production-like config lint; **Entra auth for AOAI (TB-080) not implemented** |
| 13 | Production secret safety | **Partial** | Existing auth rules + config lint |
| 14 | Performance smoke rollup | **Done** | performance baseline + scale envelope in collector |
| 15 | Availability rollup | **Done** | `report_hosted_availability_proof.py` |
| 16 | Procurement strictness | **Done** | procurement/deal-ready gates |
| 17 | Overclaim guard | **Done** | `check_proof_summary_promise_language.py` |
| 18 | Golden walkthrough | **Done** | `GOLDEN_ACCELERATOR_WALKTHROUGH.md` |
| 19 | OpenAPI RunDetailDto drift test | **Done** | `RunDetailDtoOpenApiContractTests.cs` |
| 20 | DDL/migration drift | **Done** | `check_archlucid_unified_schema_snapshot.py` |
| 21 | Backfill `--output-json` | **Done** | `ArchLucid.Backfill.Cli/Program.cs` |
| 22 | Support triage one-pager | **Done** | `FIRST_PILOT_SUPPORT_TRIAGE.md` |
| 23 | Accessibility freshness | **Done** | `assert_accessibility_route_evidence_freshness.py` |
| 24 | Scale tier cache guide | **Done** | `SCALE_TIER_CACHE_GUIDE.md` |
| 25 | Live commerce un-hold | **DEFERRED** | Owner-only (TB-137) |

**Remaining `(A)` drag:** credentialed real-LLM schedule density, OpenAPI snapshot regen for RunDetailDto forensics, Azure OpenAI Entra auth (TB-080).

---

### 1. Scheduled Real-LLM Evidence Gate With Buyer-Safe Rollup

- **Why it matters:** AI credibility is the highest-weighted readiness drag.
- **Expected impact:** Converts real-mode proof from ad hoc evidence into repeatable release evidence.
- **Affected qualities:** AI/Agent Readiness, Cutting-Edge AI Technology, Correctness, Trustworthiness, Proof-of-ROI Readiness.
- **Actionability:** Fully actionable now for code/docs/reporting; owner credentials remain optional inputs.
- **Impact of running the prompt:** Directly improves AI/Agent Readiness (+5-8 pts), Cutting-Edge AI Technology (+4-6 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.6-1.0%.

**Cursor prompt:**

```text
Implement a scheduled real-LLM evidence gate rollup without requiring secrets to be present.

Scope:
- Work in docs/go-to-market/AI_EVIDENCE_APPENDIX.md, docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md, docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md, scripts/Invoke-RealLlmEvidenceGate.ps1, scripts/ci/Invoke-FaithfulnessTrendReport.ps1, and any existing real-LLM test support under ArchLucid.AgentRuntime.Tests.
- Preserve the current behavior where missing credentials produce an explicit skipped/no-credentials outcome rather than a failure.
- Add or update a machine-readable and Markdown rollup artifact that records PASS / HOLD / SKIPPED_NO_CREDENTIALS, model/deployment metadata when available, test count, parse failures, unsupported ROI/cost claims, and budget/cost summary.

Acceptance criteria:
- Running the evidence script with no credentials exits successfully and writes a buyer-safe SKIPPED_NO_CREDENTIALS rollup.
- Running with credentials preserves current live smoke behavior and writes model/deployment metadata.
- Documentation clearly distinguishes deterministic simulator evidence from live Azure OpenAI evidence.
- Tests cover the rollup formatter for PASS, HOLD, and SKIPPED_NO_CREDENTIALS.

Constraints:
- Do not commit secrets or sample secret values.
- Do not make live LLM calls merge-blocking by default.
- Do not change model pricing assumptions unless existing tests require it.
```

### 2. Tenant and Retrieval Boundary Release Gate

- **Why it matters:** Enterprise trust collapses if retrieval or run data can bleed across tenant boundaries.
- **Expected impact:** Turns a critical security claim into regression-tested evidence.
- **Affected qualities:** Security, Trustworthiness, Correctness, Compliance Readiness, Enterprise Adoption.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Security (+4-6 pts), Trustworthiness (+3-4 pts), Correctness (+2-3 pts). Weighted readiness impact: +0.3-0.5%.

**Cursor prompt:**

```text
Create a release-blocking tenant/retrieval boundary test and proof artifact.

Scope:
- Inspect existing scope binding and retrieval code: ArchLucid.Api/Middleware/ScopeIdentityBindingMiddleware.cs, ArchLucid.Host.Core/Auth/Services/ScopeIdentityBindingValidator.cs, ArchLucid.Retrieval/Indexing/AzureSearchSdkClient.cs, ArchLucid.Core/Hosting/AzureAiSearchProductionLikeConfigurationLint.cs, and related tests.
- Add focused tests that prove:
  1. JWT/API-key scope claims cannot be contradicted by x-tenant/workspace/project headers.
  2. Retrieval search/delete applies tenant scope filters in production client paths.
  3. Missing tenant filter in production-like search config produces HOLD/BLOCK config lint output.
- Add a small Markdown proof output or update an existing config-lint/proof artifact to summarize PASS/HOLD for tenant and retrieval scope.

Acceptance criteria:
- Tests fail if the production retrieval client performs search without tenant filter composition.
- Tests fail if conflicting scope headers are accepted.
- Proof artifact names the checked controls and does not expose tenant secrets.

Constraints:
- Do not relax development bypass fail-fast behavior.
- Do not add a new auth mode.
- Do not rely on live Azure Search credentials.
```

### 3. Cross-Surface Proof Consistency Gate

- **Why it matters:** Buyers will not trust proof if UI, PDF, Markdown, CLI, and JSON disagree.
- **Expected impact:** Hardens sponsor handoff and ROI credibility.
- **Affected qualities:** Correctness, Proof-of-ROI Readiness, Executive Value Visibility, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Correctness (+3-5 pts), Proof-of-ROI Readiness (+4-6 pts), Executive Value Visibility (+3-4 pts). Weighted readiness impact: +0.4-0.7%.

**Cursor prompt:**

```text
Add cross-surface consistency tests for first-pilot proof artifacts.

Scope:
- Use existing proof generation paths: scripts/collect-first-pilot-proof.ps1, ArchLucid.Application/Pilots/FirstValueReportBuilder.cs, ArchLucid.Application/Pilots/PilotRunDeltasResponseMapper.cs, docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md, and relevant tests under ArchLucid.Application.Tests and ArchLucid.Cli.Tests.
- Validate that execution mode, PilotStrict status, ROI source kind, sponsor disposition, manifest id, run id, governance status, and deferred-scope labels agree across JSON, Markdown, CLI/proof packet, and exported sponsor artifacts where those surfaces exist.

Acceptance criteria:
- A fixture with demo-derived ROI cannot produce sponsor-safe PASS without the expected caveat.
- A fixture with HOLD disposition is reflected consistently in all generated proof artifacts.
- Tests cover at least one PASS, one WARN, and one HOLD case.

Constraints:
- Do not change buyer copy unrelated to proof status.
- Do not add live cloud dependencies.
- Do not remove existing proof outputs.
```

### 4. First-Pilot Command Center Simplification

- **Why it matters:** Time-to-value and adoption friction are constrained by operator cognitive load.
- **Expected impact:** Makes the first review path easier to complete without sales-engineer narration.
- **Affected qualities:** Time-to-Value, Adoption Friction, Usability, Cognitive Load, Customer Self-Sufficiency.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Time-to-Value (+3-5 pts), Adoption Friction (+3-4 pts), Usability (+2-3 pts). Weighted readiness impact: +0.4-0.6%.

**Cursor prompt:**

```text
Simplify first-pilot command center language and route priority.

Scope:
- Review docs/START_HERE.md, docs/CORE_PILOT.md, docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md, docs/runbooks/FIRST_VALUE_20_MINUTES.md, archlucid-ui/src/app/(operator)/_sections/OperatorHomePageView.tsx, and archlucid-ui/src/components/operator-home/PilotStartHereStrip.tsx.
- Make the first-pilot path use one primary sequence: platform ready -> evidence -> create/execute/commit -> sponsor proof -> next commercial action.
- Keep optional Operate, connectors, MCP, live commerce, and deep docs explicitly secondary or after-first-commit.

Acceptance criteria:
- A first-time evaluator can identify the single primary CTA from Home and the single canonical checklist from docs.
- No required V1 step points to a V1.1/deferred capability.
- Existing deep docs remain linked but are clearly labeled as depth or recovery.

Constraints:
- Do not remove advanced Operate documentation.
- Do not claim self-serve live commerce.
- Do not add new UI dependencies.
```

### 5. Run Detail Forensics Completion

- **Why it matters:** Operators need to approve, reject, or escalate based on one coherent run-detail view.
- **Expected impact:** Reduces hidden failure modes and support time.
- **Affected qualities:** Explainability, Supportability, Traceability, Correctness, Usability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Explainability (+4-6 pts), Supportability (+3-4 pts), Traceability (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

**Cursor prompt:**

```text
Complete redaction-safe run-detail forensics in the operator UI.

Scope:
- Inspect current run-detail components under archlucid-ui/src/app/(operator)/reviews/[runId]/_sections and shared components such as RunAgentForensicsSection, RunDetailGovernanceAlerts, RunEstimatedLlmCostCard, and RunTrustEvidenceCardSection.
- Ensure a non-buyer operator view can see, in context: LLM cost estimate, trust evidence card, retrieval grounding availability, tool/function invocation summary, governance warnings, last failure reason, commit-blocking finding coverage, provenance link/summary, and audit/pipeline timeline.
- Reuse existing endpoints before adding new ones. If generated API types are stale, update generation/tests rather than hand-writing parallel DTOs.

Acceptance criteria:
- The UI renders explicit empty states when data is unavailable rather than silently omitting critical panels.
- Unit tests or page tests cover governance warning, commit-blocking coverage, and missing retrieval/tool-call data.
- Buyer-polished mode remains redaction-safe and does not expose raw prompts or sensitive traces.

Constraints:
- Do not expose raw LLM prompts/responses in buyer mode.
- Do not create duplicate business logic in React when a backend field exists.
- Do not change the authority route shape without OpenAPI/client updates.
```

### 6. Quote-to-Proof Readiness Checklist

- **Why it matters:** Monetization depends on turning proof into a specific commercial decision.
- **Expected impact:** Reduces founder-led follow-up ambiguity and improves decision velocity.
- **Affected qualities:** Decision Velocity, Commercial Packaging Readiness, Executive Value Visibility, Marketability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Decision Velocity (+5-8 pts), Commercial Packaging Readiness (+4-6 pts). Weighted readiness impact: +0.2-0.4%.

**Cursor prompt:**

```text
Implement a quote-to-proof readiness checklist artifact.

Scope:
- Work in docs/go-to-market/COMMERCIAL_DECISION_PACKET.md, docs/go-to-market/QUOTE_TO_PROOF_PACKET.md, docs/go-to-market/ORDER_FORM_TEMPLATE.md if referenced, ArchLucid.Cli/Commands/PilotProofPacketCommand.cs, and proof packet tests.
- Generate or update a proof artifact that summarizes: proof PASS/WARN/HOLD, ROI basis, deferred buyer requirements, recommended offer/tier, quote owner, follow-up SLA, and next customer ask.

Acceptance criteria:
- Proof packet output includes a concise commercial readiness section.
- HOLD/DEFERRED_SCOPE cannot be rendered as "ready to close" without caveat.
- Tests cover PASS and HOLD commercial closeout cases.

Constraints:
- Do not claim live Stripe or Marketplace transactability.
- Do not introduce CRM/vendor dependencies.
- Do not change list pricing.
```

### 7. Starter Proof Pack Chooser and Metadata Contract

- **Why it matters:** Templates only help if buyers can pick the right one quickly and safely.
- **Expected impact:** Improves first-session clarity without adding template sprawl.
- **Affected qualities:** Template and Accelerator Richness, Time-to-Value, Marketability, Adoption Friction.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Template and Accelerator Richness (+10-15 pts), Time-to-Value (+2-3 pts). Weighted readiness impact: +0.2-0.3%.

**Cursor prompt:**

```text
Create a starter proof pack chooser and metadata contract.

Scope:
- Work in templates/starter-proof-packs/, templates/README.md, docs/onboarding/EVALUATOR_WORKBOOK.md, and docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md if it should link to the chooser.
- Add a chooser document mapping buyer job -> existing starter proof pack -> required inputs -> expected proof outputs -> when not to use.
- Define starter-pack metadata fields: id, title, targetBuyer, buyerJob, owner, lastReviewedUtc, requiredInputs, expectedOutputs, scopeLabel, doNotUseWhen, deferredScopeNotes.
- Add metadata for existing packs only.

Acceptance criteria:
- A first-time evaluator can choose one existing pack without reading every README.
- Every referenced pack has metadata.
- Deferred capabilities are explicitly labeled and no V1-ready pack implies live commerce, SOC 2 CPA, public references, or V1.1 connectors.

Constraints:
- Do not add new starter packs.
- Do not duplicate V1/V1.1 scope tables.
- Do not use external services.
```

### 8. Starter Proof Pack Static Validation

- **Why it matters:** Buyer-facing templates can silently rot or overclaim.
- **Expected impact:** Prevents unsafe placeholders and broken examples from entering release artifacts.
- **Affected qualities:** Correctness, Template and Accelerator Richness, Trustworthiness, Testability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Correctness (+1-2 pts), Template and Accelerator Richness (+5-8 pts), Trustworthiness (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

**Cursor prompt:**

```text
Add static validation for starter proof packs.

Scope:
- Add or extend a script under scripts/ci/ that validates templates/starter-proof-packs/*.
- Reuse existing placeholder, secret, Markdown, and JSON validation helpers where possible.
- Add tests for one valid fixture and one invalid fixture.

Acceptance criteria:
- Validation fails on missing metadata, malformed JSON, missing required pack artifacts, buyer-unsafe placeholders, obvious secret-shaped values, or invalid scope labels.
- The script requires no network or cloud credentials.
- Documentation names the validation command.

Constraints:
- Do not create a second inconsistent secret scanner if a reusable helper exists.
- Do not require live ArchLucid API execution.
- Do not broaden V1 scope.
```

### 9. Policy Pack Freshness and Caveat Gate

- **Why it matters:** Governance packs must not be mistaken for certification or stale compliance automation.
- **Expected impact:** Makes policy/governance evidence safer for procurement.
- **Affected qualities:** Policy and Governance Alignment, Compliance Readiness, Trustworthiness, Auditability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Policy and Governance Alignment (+4-6 pts), Compliance Readiness (+2-3 pts). Weighted readiness impact: +0.2-0.3%.

**Cursor prompt:**

```text
Add policy-pack metadata, freshness, and buyer-safe caveat validation.

Scope:
- Inspect ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/, docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md, docs/library/POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md, docs/library/POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md, and policy-pack tests.
- Add required metadata checks for owner, last reviewed, scope, sample finding, and "not certification" caveat.
- Add proof/procurement summary output showing stale packs and buyer-safe caveats.

Acceptance criteria:
- Missing or stale required metadata fails a deterministic test or CI script.
- Buyer-facing docs do not imply statutory certification.
- Proof packet can include a policy freshness summary without exposing internal-only details.

Constraints:
- Do not change seeded pack semantics silently.
- Do not add new compliance framework claims.
- Do not mutate historical policy versions without versioning.
```

### 10. Audit Coverage Drift Gate

- **Why it matters:** Auditability is strong but can regress as routes and proof actions grow.
- **Expected impact:** Keeps mutating workflows and sponsor/procurement actions traceable.
- **Affected qualities:** Auditability, Trustworthiness, Supportability, Compliance Readiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Auditability (+3-5 pts), Supportability (+2-3 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Implement an audit coverage drift gate for critical workflows.

Scope:
- Inspect ArchLucid.Core/Audit, ArchLucid.Application.Audit, docs/library/AUDIT_COVERAGE_MATRIX.md, mutating controllers under ArchLucid.Api/Controllers, and proof/procurement generation paths.
- Add a test or CI script that maps critical mutating routes and proof actions to expected audit event types or an explicit allowlisted rationale.
- Add buyer-safe audit evidence summary fields for proof bundles: event categories, correlation IDs, run/manifest traceability, and omitted-sensitive-field notes.

Acceptance criteria:
- Adding a new critical mutating route without audit mapping fails the gate.
- Sponsor/procurement proof actions either emit audit rows or document why they are informational only.
- Docs matrix updates are part of the same change.

Constraints:
- Do not log sensitive payloads.
- Do not turn best-effort informational audit into transactional failure unless existing semantics require it.
- Do not duplicate the audit event catalog.
```

### 11. IaC Parity Scanner for Active Azure Services

- **Why it matters:** Azure-native SaaS claims require infrastructure to be representable and drift-detectable.
- **Expected impact:** Converts IaC concerns into a concrete manifest instead of tribal knowledge.
- **Affected qualities:** Azure Compatibility and SaaS Deployment Readiness, Deployability, Security, Manageability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Azure Compatibility (+3-5 pts), Deployability (+3-4 pts), Security (+1-2 pts). Weighted readiness impact: +0.2-0.3%.

**Cursor prompt:**

```text
Add an IaC parity scanner for active runtime Azure services.

Scope:
- Inspect appsettings*.json, ArchLucid.Host.Composition configuration registration, docs/library/CONFIGURATION_REFERENCE.md, infra/terraform*/, and docs/library/TECH_BACKLOG.md IaC parity items.
- Create a script or test that reports configured runtime services and whether Terraform coverage exists for resource, private connectivity, RBAC, diagnostics, and secret handling.
- Start with Azure OpenAI, Azure AI Search, Key Vault, Redis, ACR, Azure Monitor workspace, Service Bus, Blob, SQL, and Container Apps.

Acceptance criteria:
- The scanner outputs PASS/WARN/HOLD per service with file references.
- Missing coverage for production-like required services is visible in a Markdown/JSON artifact.
- Existing docs explain how to interpret warnings vs blockers.

Constraints:
- Do not provision resources.
- Do not require Azure credentials.
- Do not mark explicitly deferred optional services as V1 blockers.
```

### 12. Azure OpenAI Managed Identity Migration Design Slice

- **Why it matters:** Symmetric API keys are less enterprise-friendly than Entra/managed identity.
- **Expected impact:** Improves security posture and Azure-native credibility.
- **Affected qualities:** Security, Azure Compatibility and SaaS Deployment Readiness, Manageability, Procurement Readiness.
- **Actionability:** Fully actionable now as design plus non-breaking implementation.
- **Impact of running the prompt:** Directly improves Security (+2-3 pts), Azure Compatibility (+2-3 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Add a non-breaking Azure OpenAI managed identity authentication path.

Scope:
- Inspect ArchLucid.AgentRuntime/AzureOpenAiCompletionClient.cs, configuration docs, host composition registration, tests around real AOAI configuration, and scripts/Import-LocalRealAoaiEnv.ps1.
- Add configuration that allows Azure OpenAI auth via managed identity / DefaultAzureCredential where supported, while retaining existing key-based local/dev path.
- Update production-like config lint to prefer managed identity and warn on symmetric key use where appropriate.

Acceptance criteria:
- Existing key-based tests continue passing.
- New tests cover managed-identity configuration selection without making live calls.
- Docs explain when to use key vs managed identity and how Key Vault fits.

Constraints:
- Do not remove key-based local development support.
- Do not introduce unverified SDK APIs; use commonly available Azure Identity patterns.
- Do not commit credentials.
```

### 13. Production Secret Configuration Safety Rules

- **Why it matters:** Enterprise deployments need fail-fast or loud warnings for unsafe secret handling.
- **Expected impact:** Reduces security review and operations risk.
- **Affected qualities:** Security, Manageability, Procurement Readiness, Deployability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Security (+2-4 pts), Manageability (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Harden production-like safety rules for API keys and Service Bus secrets.

Scope:
- Inspect ArchLucid.Host.Core/Startup/Validation/Rules, ArchLucid.Core/Hosting/OperatorConfigurationLintEvaluator.cs, docs/library/CONFIGURATION_REFERENCE.md, and related tests.
- Add rules that warn or fail in production-like environments when ArchLucidApiKey or Service Bus credentials are configured as raw secrets instead of approved Key Vault or identity-backed references.
- Align CLI config-lint output with startup validation language.

Acceptance criteria:
- Production-like config with raw long-lived API key is flagged.
- Production-like Service Bus raw connection string is flagged unless explicitly documented as a dev/test exception.
- Tests cover Development vs Staging/Production-like behavior.

Constraints:
- Do not break documented local dev paths.
- Do not require Azure connectivity for tests.
- Do not change auth mode semantics.
```

### 14. First-Pilot Performance Smoke

- **Why it matters:** Slow proof generation damages time-to-value and perceived quality.
- **Expected impact:** Gives operators thresholded evidence for the first-review path.
- **Affected qualities:** Performance, Time-to-Value, Reliability, Supportability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Performance (+6-10 pts), Time-to-Value (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Add a first-pilot performance smoke report.

Scope:
- Extend existing readiness/proof scripts rather than creating a separate runner: scripts/collect-first-pilot-proof.ps1, release-smoke docs, or CLI proof-packet command as appropriate.
- Record elapsed time for preflight, evidence validation, run status fetch, proof generation, export discovery, and sponsor packet assembly.
- Emit PASS/WARN/HOLD thresholds in Markdown and JSON.

Acceptance criteria:
- Performance output appears in first-pilot proof artifacts.
- Thresholds are documented as guidance, not contractual SLA.
- Tests cover formatter behavior without requiring a live API.

Constraints:
- Do not add load testing infrastructure.
- Do not claim production latency from local smoke runs.
- Do not make timing flaky in normal unit tests.
```

### 15. Availability and Probe Evidence Rollup

- **Why it matters:** Availability targets need observed evidence without overclaiming SLA compliance.
- **Expected impact:** Improves procurement and reliability conversations.
- **Affected qualities:** Availability, Reliability, Trustworthiness, Procurement Readiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Availability (+5-8 pts), Reliability (+2-3 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Create a buyer-safe hosted probe rollup artifact.

Scope:
- Inspect docs/runbooks/HOSTED_AVAILABILITY_ROLLUP.md, docs/go-to-market/TRUST_CENTER.md, docs/library/API_SLOS.md, docs/library/SLA_TARGETS.md, and scripts/ops/summarize_hosted_probe_artifacts.py.
- Ensure the rollup clearly distinguishes observed staging/hosted probe results from contractual production SLA.
- Add or update tests for Markdown summary generation.

Acceptance criteria:
- Rollup includes window, probe count, pass/fail/degraded counts, exclusions, and explicit non-SLA wording.
- Trust Center points to the methodology without implying a negotiated SLA was met.
- Missing probe artifacts produce INCONCLUSIVE, not PASS.

Constraints:
- Do not invent availability data.
- Do not claim production uptime unless input artifacts prove production base URLs and owner review.
- Do not add external monitoring dependencies.
```

### 16. Procurement Pack Strictness and Freshness Gate

- **Why it matters:** Procurement artifacts are valuable only if current and free of unsafe placeholders.
- **Expected impact:** Reduces buyer review embarrassment and trust risk.
- **Affected qualities:** Procurement Readiness, Compliance Readiness, Documentation, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Procurement Readiness (+3-5 pts), Compliance Readiness (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Harden procurement pack strictness and freshness validation.

Scope:
- Inspect scripts/build_procurement_pack.py, scripts/procurement_pack_canonical.json, docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md, docs/go-to-market/TRUST_CENTER.md, and freshness/strictness CI helpers.
- Ensure strict mode catches buyer-unsafe stub tokens, stale Last reviewed metadata, broken canonical paths, and missing redaction report entries.

Acceptance criteria:
- Strict mode fails on unsafe placeholder tokens in buyer-facing pack files.
- Missing required trust-pack source files fail loudly.
- Documentation explains normal vs strict mode and when to use each.

Constraints:
- Do not include buyer-specific names in committed docs.
- Do not require network access.
- Do not remove the redaction report.
```

### 17. Commercial Copy Overclaim Guard

- **Why it matters:** One unsupported claim can undermine trust and procurement.
- **Expected impact:** Prevents accidental claims about live commerce, SOC 2 CPA, public references, or unsupported ROI.
- **Affected qualities:** Trustworthiness, Commercial Packaging Readiness, Procurement Readiness, Marketability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Trustworthiness (+2-3 pts), Commercial Packaging Readiness (+2-4 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Add a commercial and trust copy overclaim guard.

Scope:
- Add or extend a CI script that scans docs/go-to-market, docs/runbooks first-pilot docs, archlucid-ui marketing/trust pages, and proof packet templates.
- Flag phrases that imply CPA SOC 2 is issued, third-party pen test is complete, Marketplace/Stripe live transactability is available, public reference customers are published, unsupported ROI is guaranteed, or V1.1 connectors are V1 commitments.
- Provide an allowlist with rationale for scope docs that intentionally describe deferred items.

Acceptance criteria:
- The guard fails on unsafe fixture text and passes on approved deferred-scope wording.
- The output names file, line, claim class, and suggested remediation.
- Documentation explains how to add an allowlist entry with scope rationale.

Constraints:
- Do not scan docs/archive as current buyer copy.
- Do not ban honest deferred-scope explanations.
- Do not change product scope.
```

### 18. Golden Accelerator Walkthrough

- **Why it matters:** One excellent walkthrough is more valuable than many shallow templates.
- **Expected impact:** Improves marketability and evaluator success.
- **Affected qualities:** Marketability, Template and Accelerator Richness, Time-to-Value, Differentiability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Marketability (+2-3 pts), Template and Accelerator Richness (+5-8 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Create one golden accelerator walkthrough from an existing starter proof pack.

Scope:
- Choose one existing pack based on current GTM focus, preferably regulated-saas-soc-procurement or ai-llm-workload.
- Work in templates/starter-proof-packs, docs/library/walkthroughs, docs/go-to-market/demo-proof-packets, and docs/onboarding/EVALUATOR_WORKBOOK.md.
- Show expected inputs, commands/UI path, generated proof artifacts, expected caveats, and commercial next step.

Acceptance criteria:
- Walkthrough uses only existing V1-safe capabilities.
- It includes expected outputs and "what good looks like" without claiming external assurance.
- It links back to Core Pilot rather than replacing it.

Constraints:
- Do not add a new pack.
- Do not include real customer names.
- Do not require live cloud credentials.
```

### 19. OpenAPI and Generated Client Drift Gate for Run Detail

- **Why it matters:** The UI cannot safely render operator evidence if generated contracts drift from backend DTOs.
- **Expected impact:** Reduces silent UI/API mismatch and operator blind spots.
- **Affected qualities:** Correctness, Maintainability, Testability, Usability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Correctness (+2-3 pts), Maintainability (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Harden OpenAPI/generated client drift detection for run detail fields.

Scope:
- Inspect ArchLucid.Core/Persistence/ApplicationPorts/Queries/RunDetailDto.cs, ArchLucid.Api.Tests OpenAPI snapshot tests, ArchLucid.Api.Client/Generated, and archlucid-ui generated API types.
- Ensure critical fields such as findingCoverageSummary, degradedFindingCoverage, agentExecutionLlmCostEstimate, trustEvidenceCard, results, governance warnings, and failure reason are present in OpenAPI and generated clients where expected.

Acceptance criteria:
- Tests fail if critical RunDetailDto fields disappear from OpenAPI.
- UI type generation is documented and, if feasible, checked by CI.
- No hand-written parallel DTO is introduced in the UI for fields available in the API contract.

Constraints:
- Do not change public route paths.
- Do not add fields without reviewing buyer redaction implications.
- Do not edit generated files manually if a generator exists.
```

### 20. DDL and Migration Drift Verification

- **Why it matters:** SQL is the product backbone; schema drift threatens correctness and deployability.
- **Expected impact:** Strengthens data consistency and release safety.
- **Affected qualities:** Data Consistency, Deployability, Reliability, Maintainability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Data Consistency (+3-5 pts), Deployability (+2-3 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Add DDL and migration drift verification for product SQL catalogs.

Scope:
- Inspect ArchLucid.Persistence/Scripts/ArchLucid.sql, ArchLucid.Persistence/Migrations, ArchLucid.Persistence.MigrateVerify if present, docs/library/SQL_SCRIPTS.md, and related tests.
- Add verification that the canonical DDL file, embedded migrations, and greenfield database shape agree for supported catalogs.
- Include system catalog coverage if a separate supported database exists, while respecting the repo rule that all SQL DDL should be in a single file for each database.

Acceptance criteria:
- Drift between canonical DDL and migrations fails a test or verification script.
- Verification output names missing/extra tables, columns, indexes, constraints, and migration journal state.
- Docs explain how contributors update DDL when adding migrations.

Constraints:
- Do not split DDL for one database across multiple files.
- Do not require production SQL access.
- Do not rewrite historical migrations unless required by existing migration policy.
```

### 21. Backfill and Jobs Machine-Readable Reports

- **Why it matters:** Operational jobs need rerun safety and CI-friendly diagnostics.
- **Expected impact:** Improves supportability and reliability for maintenance operations.
- **Affected qualities:** Supportability, Reliability, Manageability, Testability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Supportability (+2-3 pts), Reliability (+1-2 pts). Weighted readiness impact: +0.05-0.15%.

**Cursor prompt:**

```text
Add machine-readable reports for backfill and jobs CLI operations.

Scope:
- Inspect Backfill.Cli, Jobs.Cli, related runbooks, and TECH_BACKLOG operational items.
- Add --output-json or equivalent report support with per-stage timing, counts, skipped/error rows, checkpoint/resume status where applicable, and final PASS/WARN/HOLD.

Acceptance criteria:
- CLI report can be consumed by CI without parsing console prose.
- One bad tenant/schedule can be represented as partial failure when the existing job semantics allow it.
- Tests cover success and partial-failure report formatting.

Constraints:
- Do not change destructive behavior or retry semantics without explicit tests.
- Do not add external queue dependencies.
- Do not hide failures behind exit code 0 unless documented as partial success.
```

### 22. Support and Audit Triage One-Pager

- **Why it matters:** Correlation IDs and audit rows are only useful if operators know the investigation order.
- **Expected impact:** Reduces time to diagnose pilot and sponsor proof issues.
- **Affected qualities:** Supportability, Auditability, Traceability, Customer Self-Sufficiency.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Supportability (+3-4 pts), Customer Self-Sufficiency (+1-2 pts). Weighted readiness impact: +0.05-0.15%.

**Cursor prompt:**

```text
Create a support/audit triage one-pager for first-pilot issues.

Scope:
- Work in docs/runbooks/TROUBLESHOOTING.md, docs/runbooks/FIRST_PILOT_TROUBLESHOOTING.md, docs/library/AUDIT_COVERAGE_MATRIX.md, and support bundle docs.
- Add a one-page sequence for runId/correlationId investigation: health/version, run detail, pipeline timeline, audit search, support bundle, proof artifact, config lint, and escalation packet.

Acceptance criteria:
- Operator can follow the page without knowing internal service names first.
- The one-pager names buyer-safe vs internal-only artifacts.
- Existing troubleshooting pages link to it.

Constraints:
- Do not duplicate long troubleshooting matrices.
- Do not expose sensitive audit payload examples.
- Do not add new tooling unless existing docs reveal a true gap.
```

### 23. Accessibility Evidence Freshness Guard

- **Why it matters:** Accessibility procurement evidence should be honest and fresh without implying manual AT testing.
- **Expected impact:** Improves procurement confidence and documentation safety.
- **Affected qualities:** Compliance Readiness, Usability, Trustworthiness, Documentation.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Compliance Readiness (+1-2 pts), Trustworthiness (+1 pt). Weighted readiness impact: +0.05-0.1%.

**Cursor prompt:**

```text
Add accessibility evidence freshness validation.

Scope:
- Inspect ACCESSIBILITY.md, docs/security/VPAT_2_5_WCAG_2_1_AA.md, docs/go-to-market/TRUST_CENTER.md, archlucid-ui accessibility tests, and relevant CI scripts.
- Validate that buyer-facing accessibility docs have current reviewed dates, distinguish automated axe/jsx-a11y evidence from manual AT testing, and link to the correct public contact path.

Acceptance criteria:
- Stale accessibility evidence produces a warning or failure according to existing freshness policy.
- Docs do not claim manual assistive-technology user testing if not completed.
- Tests/scripts do not require a browser unless an existing Playwright accessibility path already does.

Constraints:
- Do not reduce `(A)` for missing participant AT testing.
- Do not invent VPAT conformance claims.
- Do not alter unrelated UI behavior.
```

### 24. Scale Tier and Cache Consistency Guide

- **Why it matters:** Operators need to know when memory caches are acceptable and when Redis/private connectivity matters.
- **Expected impact:** Improves scalability, reliability, and cost clarity without forcing V2 Redis work into V1.
- **Affected qualities:** Scalability, Reliability, Cost-Effectiveness, Manageability.
- **Actionability:** Fully actionable now as docs/config lint.
- **Impact of running the prompt:** Directly improves Scalability (+3-5 pts), Manageability (+1-2 pts). Weighted readiness impact: +0.05-0.1%.

**Cursor prompt:**

```text
Document and lint scale-tier cache consistency assumptions.

Scope:
- Inspect docs/library/CONFIGURATION_REFERENCE.md, docs/library/V1_DEFERRED.md distributed cache section, host configuration rules for HotPathCache and LlmCompletionCache, and Terraform/cache docs.
- Add a scale-tier table: single-replica pilot, multi-replica early production, and larger fleet. Explain memory vs Redis assumptions, expected replica count, cache invalidation risk, and cost tradeoffs.
- Add config-lint warnings when multi-replica production-like settings use memory-only cache in paths where cross-replica consistency matters.

Acceptance criteria:
- Operators can tell when Redis is optional vs recommended.
- V1 docs do not imply mandatory Redis for single-replica pilots.
- Tests cover config-lint behavior for single vs multi-replica.

Constraints:
- Do not promote distributed graph cache to V1.
- Do not provision Redis.
- Do not make memory cache invalid for local/dev.
```

### 25. DEFERRED - Live Commerce Un-Hold

- **Why it matters:** Self-serve transactability improves conversion and decision velocity.
- **Expected impact:** Would reduce sales-led friction and make `/pricing` to paid tenant more direct.
- **Affected qualities:** Decision Velocity, Commercial Packaging Readiness, Adoption Friction.
- **Actionability:** **DEFERRED.**
- **Reason it is deferred:** The final flip requires owner-controlled Stripe live keys, Marketplace publication, seller verification, payout/tax setup, and DNS cutover. Those are not meaningful for the agent to execute independently.
- **Specific information needed later:** Confirmation that Stripe live credentials, Marketplace seller setup, payout/tax profile, production webhook secret, and `signup.archlucid.net` DNS are ready; owner approval to move from TEST/staging to live production commerce.
- **Impact if later executed:** Directly improves Decision Velocity (+6-10 pts), Commercial Packaging Readiness (+5-8 pts), Adoption Friction (+2-3 pts). Weighted readiness impact if promoted into scope: +0.3-0.5%.

---

## 10. Prompt Batching Guidance

### Batch A - AI Proof and Trust Evidence

Run improvements **1, 2, 3, and 5** together only if the agent has a large context window. They share run evidence, retrieval, trust, and proof consistency. Best normal split: **1** alone, then **2 + 3**, then **5**.

### Batch B - First-Pilot and Commercial Conversion

Run **4, 6, 17, and 18** together if the goal is a better founder-led sales motion. This batch improves the first evaluator path, commercial closeout, overclaim safety, and demo walkthrough.

### Batch C - Templates and Governance Proof

Run **7 + 8** together, then **9 + 10** together. Starter packs and policy packs are adjacent but should not be mixed with audit routes unless context is available.

### Batch D - Azure/Security Operations

Run **11, 12, 13, and 24** as an Azure/security configuration batch. They touch configuration, linting, IaC posture, managed identity, secret handling, and scale assumptions.

### Batch E - Reliability, Performance, and Support

Run **14, 15, 21, and 22** together if the focus is operator readiness. They produce timing, availability, machine-readable job output, and triage guidance.

### Batch F - Contract and Data Consistency

Run **19 and 20** together. They both protect backend/UI/data-contract integrity and should be verified with focused backend and generated-client checks.

### Deferred / Owner-Input Batch

Keep **25** separate. Do not ask an agent to execute it until the owner confirms live commerce prerequisites.

---

## 11. Pending Questions for Later

### Scheduled Real-LLM Evidence Gate With Buyer-Safe Rollup

- Which Azure OpenAI deployment should be treated as the canonical hosted proof deployment?
- Should live evidence run on a fixed schedule, release candidate branches only, or manual owner dispatch only?
- What maximum monthly budget is acceptable for live-model evidence?

### Tenant and Retrieval Boundary Release Gate

- Which hosted environments should treat retrieval scope proof as release-blocking versus advisory?
- Should SingleCatalog developer mode remain in any production-like configuration, or be blocked entirely?

### Cross-Surface Proof Consistency Gate

- Which artifact is the source of truth when UI, CLI, and exported sponsor packet disagree?
- Should demo-derived ROI always force HOLD, or WARN with explicit walkthrough-only language?

### Quote-to-Proof Readiness Checklist

- What quote follow-up SLA should be considered on time?
- Which commercial roles or names should appear in generated artifacts, if any?

### Starter Proof Pack Chooser and Metadata Contract

- Which existing starter proof pack should be the default recommended first walkthrough?
- Who owns freshness review for each pack?

### Policy Pack Freshness and Caveat Gate

- What review cadence should mark a policy pack stale?
- Are any policy packs allowed to use stronger buyer language than "starter" or "architecture-review prompt"?

### IaC Parity Scanner for Active Azure Services

- Which Azure services are mandatory in the hosted production baseline versus optional per tenant/environment?
- Should missing Terraform for optional-but-configured services be WARN or HOLD?

### Azure OpenAI Managed Identity Migration Design Slice

- Is managed identity required for hosted production, or preferred with key fallback?
- Which Azure SDK auth path is the approved long-term standard for Azure OpenAI in this repo?

### First-Pilot Performance Smoke

- What elapsed-time thresholds should be PASS, WARN, and HOLD for first-pilot proof generation?
- Should thresholds differ between local, staging, and hosted environments?

### Availability and Probe Evidence Rollup

- Which base URLs count as production evidence?
- Who approves a buyer-shareable availability rollup?

### Live Commerce Un-Hold

- Are Stripe live keys, Marketplace publication prerequisites, payout/tax profile, webhook secret, and DNS cutover ready?
- Should commerce un-hold wait for a validated paid pilot pattern, or proceed as soon as finance/Marketplace setup is complete?
# ArchLucid Assessment – (A) Headline Readiness: 80.73%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding items explicitly deferred to V1.1, V1.x, V2, owner-only commercial action, or `(B)` procurement realism.

**Scoring basis:** Clean-slate assessment (2026-05-29), **rescored 2026-05-29** after engineering batches A–C/F and **batch D/E/F (#9–#22)** (real-LLM golden cohort shell, faithfulness floor env, snapshot IDOR API tests, sponsor PDF cross-surface test, promise-language linter, Key Vault private endpoint in `infra/terraform-private`, nav drift CI documentation; `infra/terraform-openai` root already present). Prior headline **80.13%** (post batch A–C/F). Total weight **121**; weighted score sum **9768**; readiness **9768 ÷ 121 = 80.73%**.

---

## 2. Executive Summary

### `(A)` Overall Headline Readiness

ArchLucid is a real, shippable V1-shaped product—not a prototype repo with aspirational docs. The codebase shows a bounded pilot→commit→export path, SQL-backed persistence, API/UI/CLI parity, merge-blocking SQL regression, trust and procurement templates, governance and audit depth, Azure-first IaC, and meaningful AI hardening (schema validation, RAG faithfulness fixtures, PilotStrict gates, cost budgets, ROI source classification, `pilot proof-packet`, support-bundle redaction manifest). The headline drag is **buyer-verifiable proof under production-like conditions**: live Azure OpenAI golden-cohort evidence is documented as credential-dependent; several operator surfaces still hide authority-run fields; and first-pilot navigation remains cognitively heavy despite new 20-minute and proof-packet runbooks.

### `(B)` Procurement / Market-Motion Realism

Enterprise buyers will still ask for CPA-issued SOC 2, third-party pen-test reports, named public references, and live Marketplace/Stripe checkout. These are **explicitly deferred** per `docs/library/V1_DEFERRED.md` (§6b–§6c) and must not reduce `(A)`. The Trust Center and self-assessment materials are honest interim evidence; rigid RFPs will stall until organizational assurance programs run (TB-135/TB-136 on V1.1 backlog).

### Commercial Picture

GTM materials are unusually complete for a founder-led stage: pricing philosophy, commercial decision packet, executive sponsor brief, differentiation proof packet, ROI model, order-form path, and **WHAT_NOT_TO_PROMISE** guardrails. Revenue motion remains **sales-led** (quote + pilot proof) because commerce un-hold and published references are deferred. Monetization risk is proof density: buyers must see a fast, labeled, source-backed first review—not a feature tour.

### Enterprise Picture

Enterprise depth exceeds typical V1: database-per-tenant topology, SCIM, SAML/OIDC diagnostics, 78-type durable audit, policy packs, pre-commit governance gate, Azure extractor Tier 1 (no tenant login), support bundles with redaction manifest, and production-like config lint. Blockers are **confidence artifacts** (environment-specific PASS/HOLD snapshots, scoped security closure on documented P0 backlog items) and **workflow native embedding** (ITSM/chat connectors are V1.1 contract).

### Engineering Picture

Engineering is strong but wide: warnings-as-errors, architecture invariants, OpenAPI snapshots, property tests, live API+SQL E2E, faithfulness/retrieval eval harnesses, and extensive TECH_BACKLOG discipline. Top engineering risks are **documented security gaps** (TB-071–TB-075), **UI/API contract split on run detail** (TB-106–TB-108), **cross-layer KPI divergence** (TB-103–TB-105), and **semantic drift** without scheduled credentialed real-LLM runs.

---

## 3. Weighted Quality Assessment

Qualities are ordered by **weighted deficiency signal**: `(100 − score) × weight`.

### Cutting-Edge AI Technology

- **Score:** 79
- **Weight:** 8
- **Weighted impact on readiness:** 632 / 121
- **Weighted deficiency signal:** 168
- **Justification:** Modern substrate is present: Azure OpenAI integration, structured outputs, RAG corpora, policy-pack grounding, semantic reranking, embedding drift guards, content safety, faithfulness eval (mean support ratio 0.857 on golden cohort per `docs/quality/faithfulness-report.md`), and trend rollup script. Weakness: frontier autonomy/graph-RAG/copiloting is intentionally constrained; **live** hosted model proof is indexed as credential-deferred in `docs/go-to-market/AI_EVIDENCE_APPENDIX.md`.
- **Tradeoffs:** Enterprise safety and determinism trade away “bleeding edge” demos that buyers compare to generic copilots.
- **Improvement recommendations:** Close TB-071 production search client; schedule credentialed real-LLM golden cohort; keep faithfulness floors visible in release evidence.
- **Disposition:** Evidence and eval hardening fixable in V1; exotic retrieval graphs better suited to V2 unless promoted.

### AI/Agent Readiness

- **Score:** 83
- **Weight:** 8
- **Weighted impact on readiness:** 656 / 121
- **Weighted deficiency signal:** 144
- **Justification:** Simulator/real modes are explicit; PilotStrict gates, schema validation, quality corpus CI, RAG grounding traces, and budget limits are implemented. `FirstValueReportBuilder` and proof packet paths surface execution mode and PilotStrict posture. Gap: continuous **hosted real-mode** attestation is not merge-blocking.
- **Tradeoffs:** Simulator-first CI is correct for cost and determinism but cannot fully prove semantic quality.
- **Improvement recommendations:** Wire optional CI job when `AZURE_OPENAI_*` secrets exist; attach model/deployment metadata to sponsor artifacts by default.
- **Disposition:** Mostly V1-fixable; credential provisioning is owner input.

### Marketability

- **Score:** 82
- **Weight:** 8
- **Weighted impact on readiness:** 656 / 121
- **Weighted deficiency signal:** 144
- **Justification:** Clear wedge—evidence-backed architecture reviews with exportable sponsor artifacts, trust center, and service-led offers. Weakness: market proof still depends on founder-led pilots and static demo packets rather than a published reference logo (deferred).
- **Tradeoffs:** Narrow “review system” positioning is more credible than “AI governance platform” but sounds smaller.
- **Improvement recommendations:** Lead every motion with `pilot proof-packet` output; tighten demo-proof-packets README to one SKU story.
- **Disposition:** V1-fixable for packaging; public reference is deferred.

### Adoption Friction

- **Score:** 79
- **Weight:** 6
- **Weighted impact on readiness:** 462 / 121
- **Weighted deficiency signal:** 138
- **Justification:** `FIRST_VALUE_20_MINUTES.md`, `FIRST_PILOT_OPERATOR_PATH.md`, config lint, doctor, extractor ZIP path, and identity-provider setup checklist reduce friction. Meaningful pilots still require SQL, auth mode decisions, and scope literacy (Pilot vs Operate).
- **Tradeoffs:** Enterprise controls necessarily increase setup surface.
- **Improvement recommendations:** Single Home CTA; default progressive disclosure in operator shell; bind proof collection to production-like config lint profile.
- **Disposition:** V1-fixable.

### Correctness

- **Score:** 90
- **Weight:** 8
- **Weighted impact on readiness:** 696 / 121
- **Weighted deficiency signal:** 104
- **Justification:** Broad automated coverage, SQL E2E, contract snapshots, architecture/dependency tests, sponsor cross-surface consistency tests, and ROI source catalog. Risks: run-detail UI reads authority endpoint fields that are null on live runs (TB-106); orphan savings KPI computed twice (TB-103).
- **Tradeoffs:** More tests increase maintenance but reduce silent drift.
- **Improvement recommendations:** Close TB-106–TB-108 and TB-103 with focused API/UI tests.
- **Disposition:** V1-fixable.

### Time-to-Value

- **Score:** 82
- **Weight:** 7
- **Weighted impact on readiness:** 560 / 121
- **Weighted deficiency signal:** 140
- **Justification:** 20-minute path and proof-packet CLI materially shorten time-to-sponsor-artifact. Still requires API+SQL+auth prerequisites; not a “click demo only” product.
- **Tradeoffs:** Honest labeling of simulator vs real avoids false speed claims.
- **Improvement recommendations:** Automate proof-packet step in `collect-first-pilot-proof.ps1` default; surface PASS/HOLD on Home.
- **Disposition:** V1-fixable.

### Proof-of-ROI Readiness

- **Score:** 88
- **Weight:** 5
- **Weighted impact on readiness:** 425 / 121
- **Weighted deficiency signal:** 75
- **Justification:** `RoiMetricSourceCatalogBuilder`, first-value report classifications, executive ROI API, and WHAT_NOT_TO_PROMISE guardrails are strong. Weakness: many lines remain `BenchmarkAssumption` until tenants supply baselines.
- **Tradeoffs:** Labeled assumptions are honest but weaker than customer-attested savings.
- **Improvement recommendations:** Embed ROI source table in proof-packet; prompt baseline capture in pilot onboarding.
- **Disposition:** V1-fixable.

### Usability

- **Score:** 82
- **Weight:** 3
- **Weighted impact on readiness:** 234 / 121
- **Weighted deficiency signal:** 66
- **Justification:** Operator shell, planning bridge, governance dashboards, and improved API problem hints exist. Run detail still under-renders cost, trust evidence, disposition coverage, and failure reasons (TECH_BACKLOG TB-106–TB-108).
- **Tradeoffs:** Full Operate surface increases navigation cost for first pilots.
- **Improvement recommendations:** Progressive disclosure; enrich run detail DTO.
- **Disposition:** V1-fixable.

### Stickiness

- **Score:** 79
- **Weight:** 6
- **Weighted impact on readiness:** 474 / 121
- **Weighted deficiency signal:** 126
- **Justification:** Compare, replay, graph, governance, advisory, and executive ROI support repeat use. Native ITSM/Teams/Slack loops are V1.1—not scored as V1 gaps.
- **Tradeoffs:** Depth without daily-tool embedding limits habit formation until connectors ship.
- **Improvement recommendations:** TB-057–TB-063 recurring review loop (without inventing parallel GRC).
- **Disposition:** V1 workflow polish fixable; connectors V1.1.

### Trustworthiness

- **Score:** 85
- **Weight:** 3
- **Weighted impact on readiness:** 249 / 121
- **Weighted deficiency signal:** 51
- **Justification:** PilotStrict, sponsor-safe proof gates, execution-mode labeling, redaction manifest, and conservative trust copy. Trust still depends on operators not forwarding simulator output as live AI proof.
- **Tradeoffs:** More disclaimers reduce marketing punch but increase enterprise honesty.
- **Improvement recommendations:** Fail closed on proof-packet when PilotStrict unsatisfied for sponsor handoff profile.
- **Disposition:** V1-fixable.

### Workflow Embeddedness

- **Score:** 75
- **Weight:** 3
- **Weighted impact on readiness:** 225 / 121
- **Weighted deficiency signal:** 75
- **Justification:** REST, CLI, UI, SCIM, Azure DevOps/GitHub CI references, and export/ZIP handoffs cover V1 automation. Daily work in Jira/ServiceNow/Teams is explicitly V1.1.
- **Tradeoffs:** Recipe-grade bridges are safer than half-built first-party connectors.
- **Improvement recommendations:** Keep integration recipes prominent; do not promise V1.1 connectors in V1 copy.
- **Disposition:** V1 recipes now; connectors V1.1.

### Security

- **Score:** 84
- **Weight:** 3
- **Weighted impact on readiness:** 246 / 121
- **Weighted deficiency signal:** 54
- **Justification:** STRIDE docs, ZAP baseline, RLS option, tenant DB topology, auth safety guards, pen-test templates, and owner-conducted testing narrative. **Documented P0 backlog:** production Azure Search client without tenant filter (TB-071); scope-to-identity binding gaps (TB-072); scoped snapshot IDOR risk (TB-073).
- **Tradeoffs:** Shipping breadth before closing every backlog security item is common but must be tracked honestly.
- **Improvement recommendations:** Prioritize TB-071–TB-073; Entra auth for Azure OpenAI (TB-080).
- **Disposition:** V1-fixable for code gaps; third-party pen test deferred (TB-136).

### Executive Value Visibility

- **Score:** 84
- **Weight:** 4
- **Weighted impact on readiness:** 320 / 121
- **Weighted deficiency signal:** 80
- **Justification:** Executive ROI summary, board-pack exports, first-value report, dashboards, and Grafana business-value rows exist. Some dashboard KPIs still client-derived (TB-103–TB-104).
- **Tradeoffs:** Rich dashboards can disagree with server truth if not unified.
- **Improvement recommendations:** Server-authoritative orphan and waiver KPIs.
- **Disposition:** V1-fixable.

### Differentiability

- **Score:** 81
- **Weight:** 4
- **Weighted impact on readiness:** 324 / 121
- **Weighted deficiency signal:** 76
- **Justification:** Evidence-linked manifests, audit, policy packs, and differentiation proof packet beat generic “AI assistant” stories. Needs more **repeatable** buyer-visible proof packets from real pilots.
- **Tradeoffs:** Specialized positioning limits TAM in first conversations.
- **Improvement recommendations:** Package one vertical demo proof packet with explicit limitations.
- **Disposition:** V1-fixable.

### Maintainability

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 156 / 121
- **Weighted deficiency signal:** 44
- **Justification:** Modular boundaries, invariants, generated clients, single DDL discipline, and TECH_BACKLOG traceability. Cost: very large solution and legacy compatibility paths.
- **Tradeoffs:** Modularity helps teams but hurts solo navigation.
- **Improvement recommendations:** Continue dependency constraint tests; close TB-027–TB-032 layering items incrementally.
- **Disposition:** V1 incremental.

### Architectural Integrity

- **Score:** 86
- **Weight:** 3
- **Weighted impact on readiness:** 258 / 121
- **Weighted deficiency signal:** 42
- **Justification:** Coherent authority pipeline, composition root, INV catalog, ADRs, contract snapshots, and advisory-only IaC posture per `docs/ARCHITECTURE_ON_ONE_PAGE.md`.
- **Tradeoffs:** Legacy config bridges and dual endpoints increase reasoning cost.
- **Improvement recommendations:** Finish invariant Wave B; reduce UI re-derivation of business rules.
- **Disposition:** V1-fixable.

### Reliability

- **Score:** 84
- **Weight:** 2
- **Weighted impact on readiness:** 168 / 121
- **Weighted deficiency signal:** 32
- **Justification:** Health checks, outbox, data-consistency probes, smoke/RC drills, live trial E2E, and integration correctness drill docs.
- **Tradeoffs:** Single-region V1 is intentional—not an active/active penalty.
- **Improvement recommendations:** Default staging evidence capture in release checklist sign-off.
- **Disposition:** V1 operational.

### Data Consistency

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 160 / 121
- **Weighted deficiency signal:** 40
- **Justification:** DbUp, orphan probes, remediation endpoints, and consistency runbooks. UI/server KPI divergence is a consistency risk for executives.
- **Tradeoffs:** Dry-run remediation is safer but needs operator discipline.
- **Improvement recommendations:** TB-103 server-side orphan metrics; expand consistency proof in pilot rollup.
- **Disposition:** V1-fixable.

### Explainability

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 164 / 121
- **Weighted deficiency signal:** 36
- **Justification:** Explain endpoints, provenance graph, evidence chains, retrieval traces, and citation-oriented faithfulness tests.
- **Tradeoffs:** Rich traces can overwhelm sponsors without summarization.
- **Improvement recommendations:** Short sponsor trace summary in proof-packet.
- **Disposition:** V1-fixable.

### Compliance Readiness

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 156 / 121
- **Weighted deficiency signal:** 44
- **Justification:** SOC self-assessment, CAIQ/SIG templates, audit export, policy packs—strong internal pack, not CPA attestation (deferred, `(B)` only).
- **Tradeoffs:** Self-assessment helps early buyers, not rigid SOC buyers.
- **Improvement recommendations:** Keep ASSURANCE_STATUS_CANONICAL wording synchronized with trust center.
- **Disposition:** V1 pack polish; CPA deferred.

### Procurement Readiness

- **Score:** 76
- **Weight:** 2
- **Weighted impact on readiness:** 152 / 121
- **Weighted deficiency signal:** 48
- **Justification:** Procurement pack, DPA template, subprocessors, and trust index are substantial; interim assurance remains the buyer friction point (`(B)`).
- **Tradeoffs:** Templates ≠ signed legal review.
- **Improvement recommendations:** Attach latest proof-packet manifest to procurement pack strict mode output.
- **Disposition:** V1 pack; external assurance deferred.

### Interoperability

- **Score:** 74
- **Weight:** 2
- **Weighted impact on readiness:** 148 / 121
- **Weighted deficiency signal:** 52
- **Justification:** OpenAPI, CLI, SCIM, extractor upload, GitHub/Azure DevOps references. V1.1 ITSM/chat surfaces are out of `(A)` scope.
- **Tradeoffs:** Stable REST beats brittle connectors.
- **Improvement recommendations:** OpenAPI/client drift operator note in proof artifacts.
- **Disposition:** V1 recipes; connector breadth V1.1.

### Commercial Packaging Readiness

- **Score:** 74
- **Weight:** 2
- **Weighted impact on readiness:** 148 / 121
- **Weighted deficiency signal:** 52
- **Justification:** `COMMERCIAL_DECISION_PACKET.md`, pricing, tiers, order form exist; first purchasable SKU should stay visually obvious on `/pricing` and pilot docs.
- **Tradeoffs:** SaaS + services flexibility can confuse if not sequenced.
- **Improvement recommendations:** Link every SKU to one proof-packet outcome.
- **Disposition:** V1 docs/UX.

### Decision Velocity

- **Score:** 72
- **Weight:** 2
- **Weighted impact on readiness:** 144 / 121
- **Weighted deficiency signal:** 56
- **Justification:** Quote path and commercial packet help; live checkout/Marketplace deferred per V1_DEFERRED §6b.
- **Tradeoffs:** Sales-led motion is appropriate for V1 but slower than self-serve.
- **Improvement recommendations:** 30-minute decision review template tied to proof-packet first page.
- **Disposition:** V1 process; commerce un-hold deferred.

### Policy and Governance Alignment

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 164 / 121
- **Weighted deficiency signal:** 36
- **Justification:** Policy packs, pre-commit gate, SoD approvals, governance dashboard, and bundled defaults.
- **Tradeoffs:** Starter packs are review prompts, not certification engines.
- **Improvement recommendations:** Visible pack version on commit screen.
- **Disposition:** V1-fixable.

### Auditability

- **Score:** 84
- **Weight:** 2
- **Weighted impact on readiness:** 168 / 121
- **Weighted deficiency signal:** 32
- **Justification:** 78 typed durable events, CSV export, coverage matrix with zero open durable gaps listed for prior mutating areas.
- **Tradeoffs:** Volume of event types increases reviewer learning curve.
- **Improvement recommendations:** proof-packet audit sample stays representative, not exhaustive.
- **Disposition:** V1-fixable presentation.

### Azure Compatibility and SaaS Deployment Readiness

- **Score:** 84
- **Weight:** 2
- **Weighted impact on readiness:** 168 / 121
- **Weighted deficiency signal:** 32
- **Justification:** Container Apps, SQL, Blob, Key Vault, Front Door/WAF patterns, Terraform roots, hosted AOAI posture. IaC gaps for OpenAI/Redis/Search/ACR documented (TB-091–TB-099).
- **Tradeoffs:** Azure-native focus narrows multi-cloud buyers until V1.1 analysis.
- **Improvement recommendations:** TB-093 terraform-openai skeleton; TB-091 KV private endpoint.
- **Disposition:** V1 IaC incremental.

### Traceability

- **Score:** 84
- **Weight:** 3
- **Weighted impact on readiness:** 252 / 121
- **Weighted deficiency signal:** 48
- **Justification:** Manifests, artifacts, provenance, audit correlation, OpenAPI snapshots, requirements traceability—major strength.
- **Tradeoffs:** High traceability increases cognitive load without summaries.
- **Improvement recommendations:** Triage index links in proof-packet README.
- **Disposition:** V1-fixable.

### Cognitive Load

- **Score:** 72
- **Weight:** 1
- **Weighted impact on readiness:** 68 / 121
- **Weighted deficiency signal:** 32
- **Justification:** Lowest raw score: large repo, many docs, Pilot vs Operate, simulator vs real, V1 vs V1.1 labels. Mitigations exist but do not fully collapse choices for new evaluators.
- **Tradeoffs:** Hiding truth would create false confidence.
- **Improvement recommendations:** Home dashboard “start here” strip; demote depth links until first commit.
- **Disposition:** V1-fixable.

### Availability

- **Score:** 77
- **Weight:** 1
- **Weighted impact on readiness:** 77 / 121
- **Weighted deficiency signal:** 23
- **Justification:** Health/SLO docs and probes exist; production SLA proof not established from available materials.
- **Tradeoffs:** Honest non-SLA wording preferred over synthetic claims.
- **Improvement recommendations:** scale-envelope-evidence in pilot proof folder.
- **Disposition:** V1 operational evidence.

### Performance

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 78 / 121
- **Weighted deficiency signal:** 22
- **Justification:** In-process pilot baselines and performance docs; not production SQL load proof at scale.
- **Tradeoffs:** Baselines protect regressions, not capacity planning.
- **Improvement recommendations:** Record observed timings in proof rollup without inventing SLA numbers.
- **Disposition:** V1 evidence capture.

### Scalability

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 74 / 121
- **Weighted deficiency signal:** 26
- **Justification:** Single-region default, scale envelope doc required for honest buyer language; optional failover IaC exists but not default.
- **Tradeoffs:** Multi-region active/active correctly deferred.
- **Improvement recommendations:** Keep buyer copy aligned with measured envelope only.
- **Disposition:** V1 documentation.

### Supportability

- **Score:** 88
- **Weight:** 1
- **Weighted impact on readiness:** 87 / 121
- **Weighted deficiency signal:** 13
- **Justification:** doctor, support-bundle, redaction manifest, triage index, correlation IDs, runbooks—standout strength.
- **Tradeoffs:** Bundles must stay redacted before external share.
- **Improvement recommendations:** proof-packet cross-links support-bundle command.
- **Disposition:** V1-fixable.

### Manageability

- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 79 / 121
- **Weighted deficiency signal:** 21
- **Justification:** Config catalog, admin diagnostics, identity checklist, config lint profiles.
- **Tradeoffs:** Many knobs for enterprise admins.
- **Improvement recommendations:** Opinionated `production-like-hosted-pilot` profile as default lint target.
- **Disposition:** V1-fixable.

### Deployability

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 82 / 121
- **Weighted deficiency signal:** 18
- **Justification:** Docker, compose, Terraform, release smoke, v1-rc-drill scripts.
- **Tradeoffs:** Enterprise pilots still need identity/SQL decisions.
- **Improvement recommendations:** Package HANDOFF + config lint in release evidence bundle.
- **Disposition:** V1-fixable.

### Testability

- **Score:** 81
- **Weight:** 1
- **Weighted impact on readiness:** 81 / 121
- **Weighted deficiency signal:** 19
- **Justification:** Tiered tests, eval harnesses, live E2E, architecture tests; merged line gate at 75% (95% deferred V1.1).
- **Tradeoffs:** Live LLM tests credential-dependent.
- **Improvement recommendations:** Property tests for tenant scope on new queries.
- **Disposition:** V1-fixable.

### Extensibility

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 76 / 121
- **Weighted deficiency signal:** 24
- **Justification:** Custom handler guide, policy packs, composition-root registration; public plugin SDK/MCP/marketplace not V1 gates.
- **Tradeoffs:** Code extensibility ≠ ecosystem marketplace.
- **Improvement recommendations:** Keep handler sample tested in CI.
- **Disposition:** V1 docs; ecosystem V1.1/V2.

### Documentation

- **Score:** 88
- **Weight:** 1
- **Weighted impact on readiness:** 88 / 121
- **Weighted deficiency signal:** 12
- **Justification:** Exceptional depth: V1_SCOPE, V1_DEFERRED, START_HERE, runbooks, trust, engineering BUILD model.
- **Tradeoffs:** Discoverability vs volume.
- **Improvement recommendations:** Maintain canonical path discipline in START_HERE.
- **Disposition:** V1-fixable routing.

### Cost-Effectiveness

- **Score:** 79
- **Weight:** 1
- **Weighted impact on readiness:** 79 / 121
- **Weighted deficiency signal:** 21
- **Justification:** LLM budgets, cost estimates, embedding skip, pricing model; invoiced AOAI COGS not claimed.
- **Tradeoffs:** Budget caps protect COGS but can truncate output.
- **Improvement recommendations:** Per-run cost lines in proof-packet when traces exist.
- **Disposition:** V1-fixable.

### Template and Accelerator Richness

- **Score:** 72
- **Weight:** 1
- **Weighted impact on readiness:** 72 / 121
- **Weighted deficiency signal:** 28
- **Justification:** Rich inventory (policy packs, demo workspaces, ROI models, proof shapes); weakness is **routing** which accelerator to use first (TB-114–TB-118 theme).
- **Tradeoffs:** Volume without routing feels like clutter.
- **Improvement recommendations:** TB-114 job-to-accelerator map in demo-proof-packets README.
- **Disposition:** V1-fixable.

### Customer Self-Sufficiency

- **Score:** 71
- **Weight:** 1
- **Weighted impact on readiness:** 71 / 121
- **Weighted deficiency signal:** 29
- **Justification:** Hosted AOAI reduces LLM setup burden per V1_SCOPE §2.4; self-sufficiency still limited by SQL/auth/tenant topology literacy.
- **Tradeoffs:** White-glove identity help remains realistic for enterprise pilots (`(B)`).
- **Improvement recommendations:** Identity checklist + auth diagnostics in proof limitations.md when HOLD.
- **Disposition:** V1-fixable.

---

## Deferred Scope Uncertainty

All major deferrals cited in this assessment were located in:

- `docs/library/V1_DEFERRED.md` (§6b commerce/reference/design partner; §6c SOC2/pen test; §6d MCP/extension marketplace; §6 ITSM/chat V1.1)
- `docs/library/V1_SCOPE.md` §3 (non-goals)
- `.cursor/rules/Assessment-Scope-V1_1.mdc` and `.cursor/rules/V1_1-assurance-backlog.mdc`

No referenced deferral lacked source material in-repo.

---

## 4. Top 12 Most Important Weaknesses

1. **Proof gap under real hosted LLM:** Faithfulness and quality gates are strong offline; live golden-cohort proof remains credential-dependent, so buyers cannot independently verify semantic quality from repo artifacts alone.
2. **Run-detail operator fidelity:** Authority run endpoint omits fields the UI expects (cost estimate, trust card, results), causing “unavailable” signals during live reviews (TB-106–TB-108).
3. **Documented security P0/P1 backlog:** Production Azure Search client and scope-to-identity binding gaps are tracked but not closed (TB-071–TB-075).
4. **Executive KPI divergence risk:** Orphan savings and waiver windows can be computed differently in UI vs backend (TB-103–TB-104).
5. **Cognitive overload for first evaluators:** Many equivalent doc entry points and product modes despite new 20-minute path.
6. **Procurement assurance friction (`(B)`):** Honest trust materials do not satisfy CPA SOC 2 or third-party pen-test demands—by design for `(A)`, still blocks some enterprises.
7. **Commerce motion is sales-led:** Live Stripe/Marketplace un-hold deferred; slows self-serve decision velocity without hurting headline scope.
8. **IaC/runtime parity gaps:** Azure OpenAI, Search, Redis, ACR roots incomplete in Terraform while code expects configured services (TB-091–TB-099).
9. **Workflow not embedded in daily ITSM/chat tools:** V1.1 connector contract; REST/CLI/export must carry integration story for V1.
10. **ROI narrative still assumption-heavy:** Source classification is excellent; customer-provided baselines remain optional in most pilots.
11. **Breadth-induced drift risk:** OpenAPI, UI types, CLI, and docs must stay synchronized across a very large surface.
12. **Owner-only proof milestones:** Published reference, design partner, and external assurance require customer/vendor decisions engineering cannot complete.

---

## 5. Top 6 Monetization Blockers

1. Buyers will not pay for “AI architecture review” without a **proof-packet** from their own committed run showing PilotStrict-safe, mode-labeled output.
2. **Assumption-classified ROI** is necessary but insufficient; pilots without tenant baselines feel like vendor math.
3. **No published reference customer** (deferred) increases discount pressure and extends founder-led selling cycles.
4. **No live self-serve checkout** (deferred) forces quote-to-cash, slowing impulse conversion.
5. **Simulator-only demos** without explicit labeling destroy trust and kill expansion conversations.
6. Competitive evaluations compare to copilots; ArchLucid must win on **auditability + manifest evidence**, not “more AI,” in the first 30 minutes.

---

## 6. Top 6 Enterprise Adoption Blockers

1. Security questionnaires demanding **CPA SOC 2 / third-party pen test** (deferred; address under `(B)` with self-assessment + roadmap).
2. **Production Azure Search tenancy** not provably enforced until TB-071 closes.
3. **Identity complexity** (Entra/SAML/API key/SCIM) requires careful handoff despite diagnostics and checklist.
4. **IaC gaps** for OpenAI/Search/Key Vault private endpoint undermine “everything in Terraform” buyer expectations.
5. **Operator training burden** for Pilot vs Operate and governance-heavy paths.
6. **Integration expectations** for ServiceNow/Jira/Teams—must be labeled V1.1 to avoid procurement bait-and-switch.

---

## 7. Top 6 Engineering Risks

1. **Semantic drift** in real LLM outputs without scheduled credentialed eval runs.
2. **Cross-tenant data paths** if TB-071–TB-075 slip behind feature velocity.
3. **API/UI contract split** on run detail causing wrong operator decisions pre-commit.
4. **Dual KPI pipelines** misleading executive dashboards (TB-103–TB-104).
5. **Configuration mistakes** (CORS, JWT, API key mode) in production-like hosts despite advisors.
6. **Legacy bridges and terminology** (review vs run, ArchLucid vs ArchiForge keys) confusing operators and automations.

---

## 8. Most Important Truth

**ArchLucid is ready to pilot but not ready to oversell:** the product can produce governed, exportable review evidence, yet revenue and enterprise trust depend on operators consistently generating **labeled, source-backed proof packets from real committed runs**—not on the size of the feature matrix.

---

## 9. Top Improvement Opportunities

*Already shipped in-repo (do not re-prompt):* `pilot proof-packet` CLI, `FIRST_VALUE_20_MINUTES.md`, `RoiMetricSourceCatalogBuilder`, support-bundle `redaction-manifest.json`, `AI_EVIDENCE_APPENDIX.md`, faithfulness trend script, sponsor cross-surface consistency tests (markdown path), identity-provider setup checklist, `COMMERCIAL_DECISION_PACKET.md`, `WHAT_NOT_TO_PROMISE.md`.

**Shipped 2026-05-29 (implementation batches — rescored above):** **#1** Azure Search SDK + production-like config lint HOLD; **#2** scope-to-identity binding middleware (existing + tests); **#3** authority run detail enrichment (cost/trust/results); **#4** run-detail governance/failure banners; **#5** disposition coverage on run detail (existing `RunDetailOutcomeCards`); **#6–#7** executive orphan + expiring-waiver KPIs on `GET /v1/roi/executive-summary`; **#8** `roi-metric-sources.md` via proof-packet + `roiMetricSources` on pilot-run-deltas; **#12** `AllowedTools` dispatch guard; **#14** home `PilotStartHereStrip`; **#15** `collect-first-pilot-proof.ps1` proof-packet + config lint when `-RunId`; **#18** demo-proof-packets job map; **#19** `docs/library/IAC_RUNTIME_PARITY.md`; **#21** PilotStrict HOLD in proof-packet `environment.json` + stderr warn; **#9** `Invoke-RealLlmGoldenCohort.ps1` + optional `real-llm-golden-cohort.yml`; **#10** existing `infra/terraform-openai` root (documented in parity map); **#11** Key Vault PE + `key_vault_id` in `infra/terraform-private/network.tf` (TB-091); **#13** `ScopedSnapshotReadIdorIntegrationTests` (TB-073); **#16** sponsor PDF cross-surface test; **#17** `ARCHLUCID_FAITHFULNESS_MIN_SUPPORT_RATIO` + trend `-EnforceFaithfulness`; **#20** `check_proof_summary_promise_language.py`; **#22** nav drift CI job names documented + pre-commit cross-ref.

**Still open (engineering):** none from the prior improvement list; remaining gaps are **backlog-sized** (TB-071–TB-073 full repository hardening beyond API guards, TB-093/TB-091 production apply, merge-blocking faithfulness when owner enables). **Deferred (owner):** **#23–#25**.

### 1. Wire Production Azure Search Client with Tenant OData Filter

- **Why it matters:** TB-071 is security-critical; without a real client, cross-tenant retrieval cannot be verified in production.
- **Expected impact:** Closes a documented P0; improves Security (+4–6), Correctness (+2–3), Cutting-Edge AI (+1–2).
- **Affected qualities:** Security, Correctness, Cutting-Edge AI Technology, Data Consistency.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Security (+4–6 pts), Correctness (+2–3 pts). Weighted readiness impact: **+0.15–0.25%**.

```text
Implement production Azure AI Search client registration with mandatory tenant OData filter on every search and delete.

Scope:
- ArchLucid.Retrieval (Azure Search adapter) and Host.Composition DI registration.
- Use existing AzureSearchTenantScopeFilterBuilder; fail startup in Production when Search is configured but filter builder is not applied.
- Add integration tests with fake/search emulator or test double proving filter is always appended.

Files to inspect: Azure search client implementations under ArchLucid.Retrieval/, composition root, appsettings Production samples, TECH_BACKLOG TB-071.

Acceptance criteria:
- No code path calls search without tenant filter when Mode is production-like.
- Tests fail if filter omitted.
- docs/library/CONFIGURATION_REFERENCE.md notes required Search + filter configuration.
- Production-like config lint **HOLD** when `Retrieval:VectorIndex` is not `AzureSearch` or `Retrieval:AzureSearch:Endpoint` is missing — enforced via `AzureAiSearchProductionLikeConfigurationLint` (owner 2026-05-29).

Constraints:
- Do not change index schema without migration note.
- Do not weaken simulator-only dev paths.
- Do not claim TB-071 closed without tests.
```

### 2. Enforce Scope-to-Identity Binding at API Ingress

- **Why it matters:** TB-072 — ApiKey/DevBypass must not resolve tenant scope from headers alone.
- **Expected impact:** Security (+5–7), Trustworthiness (+2–3).
- **Affected qualities:** Security, Trustworthiness, Architectural Integrity.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Security (+5–7 pts), Trustworthiness (+2–3 pts). Weighted readiness impact: **+0.2–0.35%**.

```text
Harden API ingress so tenant/workspace/project scope is bound to authenticated identity, not client-supplied headers alone.

Scope:
- ArchLucid.Api middleware/filters for ApiKey, JwtBearer, and DevelopmentBypass paths.
- Reconcile x-tenant-id (and related headers) against claims or API key metadata; reject mismatches with 403 + ProblemDetails.
- Add ArchLucid.Api.Tests integration tests for mismatch scenarios.

Acceptance criteria:
- Documented matrix in docs/library/CUSTOMER_TRUST_AND_ACCESS.md matches behavior.
- Tests cover at least ApiKey wrong-tenant header and Jwt missing claim cases.
- Owner 2026-05-29: no existing pilots rely on header-only ApiKey tenant selection — enforce binding without legacy carve-out; add BREAKING_CHANGES.md only if wire contract changes for misconfigured clients.

Constraints:
- Do not disable DevelopmentBypass in Development.
- Do not log secrets or full tokens.
```

### 3. Enrich Authority RunDetail for Operator Cost, Trust, and Results

- **Why it matters:** TB-106 — live run detail shows null cost/trust/results while architecture endpoint has them.
- **Expected impact:** Usability (+5–7), Trustworthiness (+3–4), Correctness (+2–3).
- **Affected qualities:** Usability, Trustworthiness, Correctness, Executive Value Visibility.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Usability (+5–7 pts), Correctness (+2–3 pts). Weighted readiness impact: **+0.25–0.4%**.

```text
Unify operator run detail data: extend GET /v1/authority/runs/{runId} (or documented composite endpoint) so RunDetailDto includes agentExecutionLlmCostEstimate, trustEvidenceCard, and results[] currently only on architecture run detail.

Scope:
- ArchLucid.Application run detail projection, Authority controller, OpenAPI snapshot, ArchLucid.Api.Client regeneration, archlucid-ui run detail loader/types.
- Prefer single server projection reused by UI over a second client-side fetch unless performance requires otherwise.

Acceptance criteria:
- Live integration test proves non-null cost/trust/results for a committed simulator run fixture.
- OpenAPI snapshot updated; UI shows cost card without "unavailable" for fixture run.
- No duplicate business logic in UI parsers.

Constraints:
- Do not remove architecture endpoint fields.
- Do not change commit/execute semantics.
```

### 4. Surface Governance Warnings and Failure Reasons on Run Detail

- **Why it matters:** TB-107 — operators approve without seeing hasGovernanceWarnings / lastFailureReason.
- **Expected impact:** Usability (+3–5), Trustworthiness (+2–4).
- **Affected qualities:** Usability, Trustworthiness, Policy and Governance Alignment.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Usability (+3–5 pts). Weighted readiness impact: **+0.1–0.2%**.

```text
Render RunRecord.hasGovernanceWarnings and lastFailureReason on operator run detail with stable data-testid selectors.

Scope:
- archlucid-ui run detail sections; ensure DTO exposes fields from authority run detail after improvement 3 or parallel API change.
- Playwright or Vitest fixture asserting visible warning banner when fixture run has warnings.

Acceptance criteria:
- Warning/failure blocks appear above Commit CTA when data present.
- docs/library/operator-shell.md updated with screenshot-less description.

Constraints:
- No stack traces in UI.
- Use existing OperatorApiProblem patterns for errors.
```

### 5. Show Disposition Coverage and Commit-Blocking Failures Before Commit

- **Why it matters:** TB-108 — commit-blocking failures hidden until too late.
- **Expected impact:** Usability (+3–4), Correctness (+2–3), Policy and Governance Alignment (+1–2).
- **Affected qualities:** Usability, Correctness, Policy and Governance Alignment.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Usability (+3–4 pts), Correctness (+2–3 pts). Weighted readiness impact: **+0.1–0.2%**.

```text
Expose findingCoverageSummary.dispositionCoverage and hasCommitBlockingFailures on run detail and near CommitRunButton.

Scope:
- UI components on run detail; wire fields from GetRunDetailAsync projection already computed server-side.
- Disable or warn on Commit when hasCommitBlockingFailures true (match API pre-commit gate behavior).

Acceptance criteria:
- Vitest/Playwright test: fixture with blocking failure shows HOLD state on commit affordance.
- Align wording with docs/runbooks/QUALITY_GATE_REJECTION.md.

Constraints:
- Do not bypass server-side gate.
```

### 6. Server-Authoritative Orphan KPI for Executive Dashboard

- **Why it matters:** TB-103 — UI heuristic diverges from OrphanedResourceClassifier.
- **Expected impact:** Correctness (+4–6), Executive Value Visibility (+3–5), Data Consistency (+2–3).
- **Affected qualities:** Correctness, Executive Value Visibility, Data Consistency, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Correctness (+4–6 pts), Executive Value Visibility (+3–5 pts). Weighted readiness impact: **+0.2–0.35%**.

```text
Expose backend-computed orphan candidate count and estimated savings via API; remove client-side run-potential-savings-parser heuristic from executive dashboard.

Scope:
- ArchLucid.Application service + GET endpoint (or extend executive ROI summary), ArchLucid.Api controller, OpenAPI, UI ExecutiveRoiDashboardLiveKpiCards.tsx, delete or gate client parser.

Acceptance criteria:
- Unit tests on service match OrphanedResourceClassifier outputs for fixtures.
- UI displays API values only; test proves parser not used.
- docs/library/API_CONTRACTS.md updated.

Constraints:
- Do not change orphan classification algorithm without tests.
```

### 7. Server-Authoritative Expiring-Waiver KPI Window

- **Why it matters:** TB-104 — 14-day waiver window is UI-only.
- **Expected impact:** Correctness (+2–4), Executive Value Visibility (+2–3).
- **Affected qualities:** Correctness, Executive Value Visibility, Policy and Governance Alignment.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Correctness (+2–4 pts). Weighted readiness impact: **+0.1–0.15%**.

```text
Move expiring-waiver count into executive ROI or governance summary API with explicit window parameters (default 14 days UTC).

Scope:
- Backend query + DTO; UI removes client date math.
- Tests for boundary dates.

Acceptance criteria:
- Single source of truth documented in PILOT_SCORECARD_API.md or executive ROI doc.
- UI test uses mocked API counts.

Constraints:
- Window must be configurable via query param with documented default.
```

### 8. Embed ROI Metric Source Table in Pilot Proof-Packet

- **Why it matters:** Proof-packet exists but buyers need ROI source kinds in the same folder as run evidence.
- **Expected impact:** Proof-of-ROI Readiness (+3–5), Trustworthiness (+2–3), Procurement Readiness (+1–2).
- **Affected qualities:** Proof-of-ROI Readiness, Trustworthiness, Time-to-Value.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Proof-of-ROI (+3–5 pts). Weighted readiness impact: **+0.15–0.25%**.

```text
Extend `archlucid pilot proof-packet` to emit roi-metric-sources.md (and optional .json) using RoiMetricSourceCatalogBuilder / value report snapshot for the run window.

Scope:
- ArchLucid.Cli Commands/PilotProofPacketCommand.cs, reuse Application Value services, ArchLucid.Cli.Tests.

Acceptance criteria:
- proof-summary.md links to roi-metric-sources.md.
- No sponsor row without RoiMetricSourceKind.
- Tests assert BenchmarkAssumption labeling for default model rows.

Constraints:
- No new pricing numbers.
- Redact tenant secrets in JSON output.
```

### 9. Add Credentialed Real-LLM Eval Workflow (Skip-Graceful Without Secrets)

- **Why it matters:** Closes the highest AI proof gap when credentials exist; documents honest skip when not.
- **Expected impact:** AI/Agent Readiness (+4–6), Cutting-Edge AI (+3–5), Trustworthiness (+2–3).
- **Affected qualities:** AI/Agent Readiness, Cutting-Edge AI Technology, Testability, Trustworthiness.
- **Actionability:** Partially actionable now (workflow wiring); **credential values are DEFERRED** (see improvement 23).
- **Impact of running the prompt:** AI/Agent Readiness (+3–4 pts) once secrets exist. Weighted readiness impact: **+0.15–0.25%** after first green run.

```text
Add scripts/ci/Invoke-RealLlmGoldenCohort.ps1 and optional GitHub workflow job that:
- Runs only when AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY (or workload identity) are present.
- Writes docs/quality/REAL_LLM_SESSION_<date>.md from REAL_LLM_RUN_EVIDENCE_TEMPLATE.md.
- Exits 0 with "SKIPPED_NO_CREDENTIALS" message when secrets absent (non-blocking for PRs).
- Links from AI_EVIDENCE_APPENDIX.md.

Acceptance criteria:
- Local dry-run documented.
- collect-first-pilot-proof.ps1 -SponsorHandoff includes ai-readiness-gate.json when real-mode configured and evidence file exists.

Constraints:
- Never print secrets.
- Do not fail default CI when secrets missing.
```

### 10. Terraform OpenAI Root Skeleton (TB-093)

- **Why it matters:** Code expects Azure OpenAI; IaC parity gap blocks “all infra in Terraform” buyer narrative.
- **Expected impact:** Azure Compatibility (+4–6), Deployability (+2–4), Security (+1–2).
- **Affected qualities:** Azure Compatibility and SaaS Deployment Readiness, Deployability, Security.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Azure Compatibility (+4–6 pts). Weighted readiness impact: **+0.1–0.2%**.

```text
Create infra/terraform-openai/ with documented variables for account, deployment, private endpoint hooks, and content filter placeholders; wire README cross-links from terraform-container-apps.

Acceptance criteria:
- terraform validate passes for module.
- docs/library/CONTAINERIZATION.md or azure doc lists apply order.
- No secrets in tfvars examples.

Constraints:
- Do not apply to production subscriptions from agent.
- Align with TB-080 Entra auth direction in comments.
```

### 11. Key Vault Private Endpoint in terraform-private (TB-091)

- **Why it matters:** KV public access disabled without private endpoint breaks managed deployability story.
- **Expected impact:** Azure Compatibility (+3–5), Security (+2–4).
- **Affected qualities:** Azure Compatibility, Security, Deployability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Security (+2–4 pts), Azure Compatibility (+3–5 pts). Weighted readiness impact: **+0.1–0.2%**.

```text
Add azurerm_private_endpoint + privatelink.vaultcore.azure.net DNS zone to infra/terraform-private for Key Vault when private stack enabled.

Acceptance criteria:
- Documented in terraform README and CONFIGURATION_KEY_VAULT.md.
- validate/plan instructions for operators.

Constraints:
- Feature-flag via existing private stack variables.
```

### 12. Runtime Agent AllowedTools Enforcement (TB-082)

- **Why it matters:** Advisory allowlists are not security boundaries for tool dispatch.
- **Expected impact:** Security (+3–5), AI/Agent Readiness (+2–3).
- **Affected qualities:** Security, AI/Agent Readiness, Correctness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Security (+3–5 pts). Weighted readiness impact: **+0.1–0.2%**.

```text
Enforce AgentTask.AllowedTools at RealAgentExecutor (or handler dispatch facade): deny dispatch when tool not in allowlist; empty allowlist means no tools (document breaking change if previously unrestricted).

Acceptance criteria:
- Unit tests for allowed/denied tools.
- docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md updated.

Constraints:
- Preserve simulator behavior explicitly.
```

### 13. Scoped Snapshot Read Integration Tests (TB-073)

- **Why it matters:** IDOR risk on GetByIdAsync patterns in SingleCatalog/dev modes.
- **Expected impact:** Security (+3–4), Correctness (+2–3), Testability (+1–2).
- **Affected qualities:** Security, Correctness, Testability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Security (+3–4 pts). Weighted readiness impact: **+0.1–0.15%**.

```text
Add ArchLucid.Api.Tests integration tests proving tenant A cannot read tenant B snapshot/finding IDs across representative repositories.

Acceptance criteria:
- Tests run in SQL test lane with two tenants.
- Failures reference TB-073 in comment.

Constraints:
- Do not use ConfigureAwait(false) in tests.
```

### 14. Operator Home “Start Pilot” Progressive Disclosure Strip

- **Why it matters:** Reduces cognitive load and adoption friction for first session.
- **Expected impact:** Cognitive Load (+5–7), Usability (+3–4), Time-to-Value (+2–3).
- **Affected qualities:** Cognitive Load, Usability, Adoption Friction, Time-to-Value.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Cognitive Load (+5–7 pts), Adoption Friction (+2–3 pts). Weighted readiness impact: **+0.15–0.25%**.

```text
Add a Home dashboard strip with 4 steps: doctor → create/execute/commit → pilot proof-packet → optional buyer-proof-pack; hide Operate sidebar links until first commit or explicit "Show Operate".

Scope:
- archlucid-ui Home section component; Vitest + Playwright smoke.

Acceptance criteria:
- Links to FIRST_VALUE_20_MINUTES.md in help text.
- data-testid stable selectors per UI-Stable-Selectors rule.

Constraints:
- Do not remove Operate features.
- Do not auto-run destructive actions.
```

### 15. Default collect-first-pilot-proof to Include proof-packet + config lint

- **Why it matters:** Release checklist recommends both; automation reduces missed evidence.
- **Expected impact:** Supportability (+2–3), Deployability (+2–3), Procurement Readiness (+1–2).
- **Affected qualities:** Supportability, Deployability, Procurement Readiness, Time-to-Value.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Time-to-Value (+2–3 pts). Weighted readiness impact: **+0.05–0.1%**.

```text
Update scripts/collect-first-pilot-proof.ps1 to invoke `dotnet run --project ArchLucid.Cli -- pilot proof-packet` when -RunId provided, and config lint with production-like-hosted-pilot profile by default; document flags to skip.

Acceptance criteria:
- Generated first-pilot-command-center.md links proof-packet path.
- Tests or script analyzer for parameter validation.

Constraints:
- Never write secrets into artifacts folder.
```

### 16. Expand Cross-Surface Tests to Sponsor PDF Export Path

- **Why it matters:** Markdown consistency tests exist; PDF wrapper may drift.
- **Expected impact:** Correctness (+2–3), Executive Value Visibility (+1–2).
- **Affected qualities:** Correctness, Testability, Executive Value Visibility.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Correctness (+2–3 pts). Weighted readiness impact: **+0.05–0.1%**.

```text
Extend SponsorArtifactCrossSurfaceConsistencyTests (or sibling) to assert PilotRunDeltas and execution mode labels match in SponsorOnePagerPdfBuilder output for shared fixture.

Acceptance criteria:
- PDF text extraction or builder-level unit test without binary golden file churn.

Constraints:
- Simulator-only fixture.
```

### 17. Faithfulness Eval Warn Threshold → Optional CI Fail

- **Why it matters:** Prevents silent RAG regression when stable.
- **Expected impact:** AI/Agent Readiness (+2–4), Reliability (+1–2).
- **Affected qualities:** AI/Agent Readiness, Cutting-Edge AI Technology, Reliability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** AI/Agent Readiness (+2–4 pts). Weighted readiness impact: **+0.1–0.15%**.

```text
Add ARCHLUCID_FAITHFULNESS_MIN_SUPPORT_RATIO env override to eval_agent_faithfulness.py; default keep warn; document merge-blocking toggle in AGENT_OUTPUT_EVALUATION.md.

Acceptance criteria:
- Current mean 0.8571 passes default floor 0.80.
- Trend script surfaces failure in Markdown.

Constraints:
- Do not enable merge-blocking in CI without comment in workflow.
```

### 18. Demo-Proof-Packets Job-to-Accelerator Map (TB-114)

- **Why it matters:** Template richness without routing confuses first buyers.
- **Expected impact:** Template and Accelerator Richness (+4–6), Marketability (+1–2).
- **Affected qualities:** Template and Accelerator Richness, Marketability, Cognitive Load.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Template richness (+4–6 pts). Weighted readiness impact: **+0.05–0.1%**.

```text
Update docs/go-to-market/demo-proof-packets/README.md with a table: buyer job → existing accelerator/proof packet → prerequisites → limitations.

Acceptance criteria:
- No new ZIP templates required.
- Links to DIFFERENTIATION_PROOF_PACKET.md and FIRST_VALUE_20_MINUTES.md.

Constraints:
- Do not duplicate pricing numbers.
```

### 19. IaC Parity One-Pager for Missing Runtime Services

- **Why it matters:** Buyers and SREs need honest mapping of code config → Terraform roots.
- **Expected impact:** Azure Compatibility (+2–3), Documentation (+1), Manageability (+1).
- **Affected qualities:** Azure Compatibility, Documentation, Deployability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Azure Compatibility (+2–3 pts). Weighted readiness impact: **+0.05%**.

```text
Add docs/library/IAC_RUNTIME_PARITY.md listing each appsettings dependency (OpenAI, Redis, Cosmos, Search, Service Bus, ACR) with Terraform root status TB-091–TB-099 and owner action.

Acceptance criteria:
- Linked from CONTAINERIZATION.md and TRUST_CENTER Azure section.

Constraints:
- Mark advisory vs required per environment profile.
```

### 20. Proof-Packet WHAT_NOT_TO_PROMISE Linter

- **Why it matters:** Sales artifacts must not overclaim deferred assurance/commerce.
- **Expected impact:** Marketability (+2–3), Trustworthiness (+2–3), Procurement Readiness (+1).
- **Affected qualities:** Marketability, Trustworthiness, Differentiability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Trustworthiness (+2–3 pts). Weighted readiness impact: **+0.05%**.

```text
Add scripts/ci/check_proof_summary_promise_language.py scanning proof-summary.md templates and generated output for forbidden phrases from WHAT_NOT_TO_PROMISE.md (SOC certified, guaranteed savings, MCP GA, etc.); warn-only initially.

Acceptance criteria:
- Unit test with fixture strings.
- Document command in CLI_USAGE.md.

Constraints:
- Allow explicit negation phrases ("do not claim SOC certified").
```

### 21. PilotStrict HOLD Blocks proof-packet Sponsor-Safe Flag

- **Why it matters:** Prevents accidental forward of non-sponsor-grade real-mode claims.
- **Expected impact:** Trustworthiness (+3–5), AI/Agent Readiness (+2–3).
- **Affected qualities:** Trustworthiness, AI/Agent Readiness, Proof-of-ROI Readiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Trustworthiness (+3–5 pts). Weighted readiness impact: **+0.1–0.15%**.

```text
When PilotProofPacketCommand builds proof-summary.md, set sponsorHandoffRecommended=false and nextAction=HOLD when PilotBuyerSafeEvidenceGateEvaluator fails PilotStrict checks; exit 0 but print stderr warning.

Acceptance criteria:
- Cli test with fixture gate failure.
- limitations.md lists gate reasons.

Constraints:
- Do not block packet generation entirely (support/debug still need bundle).
```

### 22. Merge-Blocking Route/Tier/Policy Nav Drift Guard on Controller Edits

- **Why it matters:** Prevents operator/security doc drift when APIs change.
- **Expected impact:** Maintainability (+2–3), Security (+1–2), Documentation (+1).
- **Affected qualities:** Maintainability, Security, Testability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Maintainability (+2–3 pts). Weighted readiness impact: **+0.05%**.

```text
Verify pre-commit hook runs route/tier/policy/nav registry sync when ArchLucid.Api/Controllers change; add CI job duplicate if hook skipped.

Acceptance criteria:
- CI fails when registry intentionally desynced in test branch.
- docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md mentions CI job name.

Constraints:
- Keep ARCHLUCID_PRE_COMMIT_FULL_AUDIT=1 optional for speed.
```

### 23. DEFERRED — Provide Azure OpenAI Credentials for Live Golden Cohort

- **Reason deferred:** Live eval requires owner-supplied `AZURE_OPENAI_*` (or workload identity) secrets not present in the assessment environment.
- **Specific information needed later:** Target deployment name, endpoint URL, whether to use API key vs Entra MI, approved CI secret names, and whether merge-blocking is desired after first green run.
- **Affected qualities:** AI/Agent Readiness, Cutting-Edge AI Technology, Trustworthiness, Marketability.
- **Expected impact:** +0.15–0.3% `(A)` once evidence file exists and is linked from proof rollups.

### 24. DEFERRED — Publish Named Reference Customer + Case Study

- **Reason deferred:** Requires customer permission, legal approval, and approved metrics/logo.
- **Specific information needed later:** Customer name, logo rights, quotable outcomes, publication date, discount re-rate decision.
- **Affected qualities:** Marketability, Proof-of-ROI, Differentiability, Decision Velocity (`(B)` primarily).

### 25. DEFERRED — Commerce Un-Hold and CPA SOC 2 / Third-Party Pen Test Programs

- **Reason deferred:** Stripe live keys, Marketplace `Published` state, CPA SOC 2, and vendor pen test require owner/vendor/legal/budget actions (V1_DEFERRED §6b–§6c; TB-135/TB-136).
- **Specific information needed later:** Stripe/Marketplace readiness checklist completion; auditor/vendor selection; target report window; NDA distribution model.
- **Affected qualities:** Decision Velocity, Commercial Packaging, Procurement Readiness, Compliance (`(B)` for assurance).

---

## 10. Prompt Batching Guidance

- **Batch A — Security & data plane (highest risk):** Improvements **1, 2, 12, 13** (Search tenant filter, scope binding, AllowedTools, snapshot IDOR tests). Shared context: Auth, Retrieval, Api ingress.
- **Batch B — Operator run fidelity:** Improvements **3, 4, 5, 14** (RunDetail enrichment, warnings, disposition UI, Home strip). Shared context: run detail UI + authority DTOs.
- **Batch C — Executive truth & ROI proof:** Improvements **6, 7, 8, 16, 21** (orphan KPI, waiver KPI, proof-packet ROI table, PDF consistency, PilotStrict HOLD).
- **Batch D — AI evidence & eval:** Improvements **9, 17** (real-LLM workflow shell, faithfulness fail threshold). Run after Batch A if Search/RAG implicated.
- **Batch E — IaC & deploy narrative:** Improvements **10, 11, 19, 15** (terraform-openai, KV PE, parity doc, collect-first-pilot-proof defaults).
- **Batch F — GTM guardrails & templates:** Improvements **18, 20, 22** (accelerator map, promise linter, nav drift CI).
- **Deferred (owner/customer):** Improvements **23, 24, 25** — no implementation prompt until inputs supplied.

---

## 11. Pending Questions for Later

### DEFERRED — Provide Azure OpenAI Credentials for Live Golden Cohort

- Which subscription/deployment is approved for eval writes?
- API key vs Entra workload identity for CI?
- Should the workflow be merge-blocking after the first green run?

### DEFERRED — Publish Named Reference Customer + Case Study

- Which customer approved public name, logo, and metrics?
- Who signs legal/marketing approval?

### DEFERRED — Commerce Un-Hold and CPA SOC 2 / Third-Party Pen Test Programs

- Is Stripe production + webhook secret ready?
- Is Marketplace offer ready to publish?
- Which CPA/pen-test vendor and budget window are approved?

### Enforce Scope-to-Identity Binding at API Ingress

- **Resolved 2026-05-29:** **No** legacy pilots use header-only tenant selection with API keys; TB-072 may ship without a grandfather carve-out. See [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *Resolved 2026-05-29 (API key scope binding — no legacy pilots)*.

### Wire Production Azure Search Client with Tenant OData Filter

- **Resolved 2026-05-29:** **All production-like profiles** — set `Retrieval:VectorIndex=AzureSearch` and configure `Retrieval:AzureSearch:*`; not limited to reranking-only paths. See [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *Resolved 2026-05-29 (Azure AI Search — production-like requirement)*.

---

*Assessment generated: 2026-05-29; rescored same day after implementation batch (+0.99% headline). Method: clean-slate first principles; materials limited to in-repo docs, code, scripts, and CI definitions. No subagents.*
