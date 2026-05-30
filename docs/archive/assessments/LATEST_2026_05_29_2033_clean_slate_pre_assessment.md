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
