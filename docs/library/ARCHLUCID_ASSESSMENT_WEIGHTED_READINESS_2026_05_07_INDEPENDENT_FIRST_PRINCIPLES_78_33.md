> **Scope:** Product quality snapshot — independent weighted-readiness assessment for leadership and planning; not the V1 scope contract (`V1_SCOPE.md`), not CI gates, and not a procurement attestation. Canonical copy also at repo root `ArchLucid_Assessment_Weighted_Readiness_2026_05_07_Independent_First_Principles_78_33.md`.

# ArchLucid Assessment – Weighted Readiness 78.33%

Independent, first-principles assessment from repository materials only (2026-05-07). Deferred V1.1/V2 scope per `docs/library/V1_SCOPE.md` and `docs/library/V1_DEFERRED.md` was not used to reduce headline readiness. No prior assessment scores were referenced.

## Executive Summary

### Overall readiness

`(A) V1 headline readiness: 78.33%`. ArchLucid is materially beyond prototype: it has a coherent V1 scope contract, working product layers, SQL-backed authority persistence, strong test architecture, trust documentation, Terraform coverage, and a clear pilot path. The remaining gaps are not mostly “missing code”; they are concentration risks around buyer proof, onboarding simplicity, release evidence, operational sharpness, and real-world trust conversion.

`(B) Procurement / market-motion realism: informational only, not weighted into the score.` SOC 2 CPA attestation, ISO certification, third-party pen-test publication, signed design partner, published public reference, live Stripe key flip, and Marketplace publication are explicitly deferred or not headline-scored, so headline readiness was not reduced for them. They still create enterprise buying friction.

### Commercial picture

The commercial story is credible but still founder-led and proof-hungry. The strongest claim is narrow and believable: faster movement from architecture request to reviewable package. The weaker areas are buyer immediacy, quantified proof, packaging simplicity, and expansion mechanics.

### Enterprise picture

Enterprise posture is unusually strong for this stage: trust center, auditability, tenant isolation, Entra/JWT posture, private endpoint posture, DPA/CAIQ/SIG material, and procurement pack mechanics are present. The issue is not honesty; it is that large buyers will still ask for operational evidence, assurance artifacts, and implementation clarity beyond repo documentation.

### Engineering picture

Engineering depth is strong: modular .NET projects, Dapper/DbUp SQL, real SQL tests, UI tests, live E2E paths, k6 smoke, OpenAPI snapshots, ZAP/Schemathesis, Terraform roots, and explicit deferral docs. Main risks are cognitive load, broad surface area, operational readiness evidence, and places where docs are ahead of validated release state.

## Weighted Quality Assessment

Ordered by weighted deficiency signal (higher = more urgent).

| Quality | Score | Weight | Weighted readiness impact | Deficiency signal | Assessment |
| --- | ---: | ---: | ---: | ---: | --- |
| Marketability | 78 | 8 | 6.12% | 176 | Clear V1 narrative, but the buyer story still requires a guided explanation and proof packaging. Improve with sharper before/after proof and simpler buyer-first pages. |
| Adoption Friction | 72 | 6 | 4.24% | 168 | Core Pilot is well defined, but the repo/product surface is large and mentally heavy. Improve default onboarding and hide nonessential complexity harder. |
| Time-to-Value | 82 | 7 | 5.63% | 126 | Strong four-step pilot path and sample review, but real customer setup still depends on environment/auth/data readiness. Improve second-run and hosted trial proof. |
| Proof-of-ROI Readiness | 75 | 5 | 3.68% | 125 | ROI model and first-value reports exist, but some metrics remain operator-filled and customer-specific. Improve automatic evidence completeness and baseline capture. |
| Differentiability | 74 | 4 | 2.90% | 104 | Differentiation is plausible: authority chain, manifests, replay, governance evidence. It needs sharper competitive proof and fewer generic “AI architecture” claims. |
| Usability | 73 | 3 | 2.15% | 81 | UI guidance is thoughtful, but the product still exposes many concepts: run, manifest, authority, graph, replay, governance, policy packs. Reduce first-session choices. |
| Correctness | 80 | 4 | 3.14% | 80 | Strong schema, OpenAPI, simulator, SQL and integration tests. Risk remains around real LLM output quality and full end-to-end release evidence. |
| Workflow Embeddedness | 76 | 3 | 2.24% | 72 | REST/CLI/UI/webhooks/ITSM connectors help, but adoption into daily architecture governance still requires customer process mapping. Improve templates and handoff flows. |
| Trustworthiness | 78 | 3 | 2.29% | 66 | Honest trust posture, audit trails, self-assessments, redaction, tenant isolation. Trust still depends on evidence clarity and buyer review discipline. |
| Executive Value Visibility | 84 | 4 | 3.29% | 64 | Sponsor brief and first-value reports are strong. Improve executive dashboards that show concrete cycle-time and evidence completeness deltas. |
| Decision Velocity | 70 | 2 | 1.37% | 60 | The product can accelerate review, but commercial decision flow still depends on seller-led explanation. Improve buyer-safe trial-to-sponsor conversion. |
| Architectural Integrity | 82 | 3 | 2.41% | 54 | Architecture is bounded and documented: API/UI/Worker/SQL, Authority path, Terraform. Main concern is breadth and some legacy/renaming seams. |
| Security | 82 | 3 | 2.41% | 54 | Good defaults: fail-closed API key config, Entra/JWT path, private endpoint posture, ZAP/Schemathesis, no public SMB. Improve assurance evidence and config clarity. |
| Procurement Readiness | 74 | 2 | 1.45% | 52 | Procurement pack and trust center are real. Informational friction remains around CPA SOC 2, third-party pen test, and enterprise questionnaires. |
| Commercial Packaging Readiness | 76 | 2 | 1.49% | 48 | Pilot/Operate layering is clear, but packaging is still more product-management-heavy than buyer-simple. Sharpen plan boundaries and sales-led quote path. |
| AI/Agent Readiness | 76 | 2 | 1.49% | 48 | Simulator-first, LLM budgets, traces, redaction, quality gates exist. Need more real-LLM evidence and golden corpus clarity for buyer confidence. |
| Maintainability | 77 | 2 | 1.51% | 46 | Modular projects and tests help, but docs and surface area are large. Improve code maps, ownership indexes, and stale-doc detection. |
| Reliability | 78 | 2 | 1.53% | 44 | Health checks, release smoke, retries, outbox, staging chaos planning exist. Need more captured release evidence and drill outcomes. |
| Traceability | 86 | 3 | 2.53% | 42 | Strong: manifests, traces, audit rows, evidence chains, run IDs, correlation IDs. Keep improving user-facing trace explanations. |
| Compliance Readiness | 79 | 2 | 1.55% | 42 | Strong self-assessment and templates. Not penalized for deferred CPA SOC 2/ISO; still needs smoother buyer-facing control mapping. |
| Data Consistency | 80 | 2 | 1.57% | 40 | Relational-first authority reads, FK work, reconciliation settings, SQL tests are solid. Risk remains in broad migration/history complexity. |
| Interoperability | 82 | 2 | 1.61% | 36 | REST, CLI, OpenAPI, Service Bus, webhooks, ITSM, Confluence, Azure extractor, Terraform export are strong. MCP is deferred and not penalized. |
| Explainability | 83 | 2 | 1.63% | 34 | Evidence chains and citation-aware reports are strong. Improve “why trust this output?” explanations for nontechnical sponsors. |
| Policy and Governance Alignment | 84 | 2 | 1.65% | 32 | Approval workflow, policy packs, pre-commit gate, audit, RBAC alignment are strong. Improve operator setup recipes. |
| Cognitive Load | 68 | 1 | 0.67% | 32 | The largest low-weight but real usability risk. Too many docs, terms, paths, and controls can overwhelm first-time buyers. |
| Stickiness | 70 | 1 | 0.69% | 30 | Operate surfaces can create stickiness, but repeat-use habit depends on workflow embedding and customer proof. |
| Auditability | 87 | 2 | 1.71% | 26 | Durable typed audit catalog and CSV/search are strong. Continue keeping new mutation routes audit-matrix-aligned. |
| Documentation | 74 | 1 | 0.73% | 26 | Documentation is rich but too abundant. Strength is depth; weakness is navigation and stale/conflicting copy risk. |
| Customer Self-Sufficiency | 75 | 1 | 0.74% | 25 | Quickstarts, support bundles, runbooks help. Still likely needs seller/support help for first serious enterprise run. |
| Availability | 75 | 1 | 0.74% | 25 | SLO docs and probes exist. Real production availability evidence appears thinner than the target narrative. |
| Scalability | 75 | 1 | 0.74% | 25 | Horizontal paths, optional Redis, SQL topology, k6 smoke exist. Multi-region active/active and deeper cache hardening are deferred. |
| Performance | 76 | 1 | 0.75% | 24 | k6 smoke and performance baselines exist. More real hosted latency evidence would improve confidence. |
| Cost-Effectiveness | 76 | 1 | 0.75% | 24 | LLM budget/cost tracking and Azure cost profile exist. Need clearer per-pilot unit economics from real runs. |
| Deployability | 77 | 1 | 0.75% | 23 | Terraform, compose, release scripts, config lint, smoke scripts exist. Multi-root IaC and environment choices remain operationally complex. |
| Manageability | 78 | 1 | 0.76% | 22 | Config, health, support bundle, governance controls exist. Improve admin “known good” profiles. |
| Modularity | 78 | 1 | 0.76% | 22 | Project structure is modular. Some broad feature seams still increase navigation effort. |
| Evolvability | 78 | 1 | 0.76% | 22 | ADRs, deferral docs, tests, modularity support evolution. Main risk is documentation and migration drag. |
| Observability | 79 | 1 | 0.77% | 21 | OTel, trace IDs, metrics, health, support bundle are good. Per-source trace sampling has known limits. |
| Accessibility | 80 | 1 | 0.78% | 20 | Accessibility route, axe testing, WCAG target, keyboard notes exist. Needs ongoing proof on live top routes. |
| Supportability | 80 | 1 | 0.78% | 20 | Correlation IDs, support bundle, troubleshooting, version endpoints are strong. Improve incident drill evidence. |
| Extensibility | 80 | 1 | 0.78% | 20 | Connectors and interface seams support extension. Avoid widening integration scope without owner decision. |
| Testability | 82 | 1 | 0.80% | 18 | Excellent test architecture. Some coverage docs still show historical gap context; use CI artifacts as truth. |
| Change Impact Clarity | 82 | 1 | 0.80% | 18 | Compare/replay/manifest deltas are strong. Improve sponsor-friendly change summaries. |
| Azure Compatibility and SaaS Deployment Readiness | 82 | 2 | 1.61% | 36 | Azure-native IaC, Entra, SQL, Key Vault, Front Door/WAF, Container Apps are present. Simplify canonical production path. |
| Template and Accelerator Richness | 78 | 1 | 0.76% | 22 | Starter packs and templates exist. Need more buyer-role-specific accelerators. |
| Azure Ecosystem Fit | 85 | 1 | 0.83% | 15 | Strong Azure alignment: Entra, SQL, Key Vault, Service Bus, Container Apps, Front Door, Terraform. |

**Scoring note:** Each quality scored 1–100. Weighted readiness = sum(score × weight) / sum(weights). Total weight 100; weighted sum 78.33.

## Deferred scope uncertainty

None. Deferred items (MCP, Redis as mandatory fleet default, DTF/Container Apps Jobs, commerce un-hold, CPA SOC 2 as headline gate, third-party pen test as V1 gap, design partner as V1 gate, public reference customer as V1 gate, PGP key as V1 gate, etc.) were located in `docs/library/V1_SCOPE.md` §3 and `docs/library/V1_DEFERRED.md`.

## Top 12 Most Important Weaknesses

1. Buyer proof is still weaker than the product’s technical maturity.
2. First-session cognitive load remains high despite the Core Pilot boundary.
3. ROI evidence depends partly on customer/operator-supplied baselines.
4. The product surface is broad enough to dilute the default value story.
5. Real hosted release evidence is less visible than the release machinery.
6. Enterprise trust is honest but not yet procurement-complete.
7. Documentation depth creates stale-copy and contradiction risk.
8. AI output trust depends on evidence discipline and real-LLM validation.
9. Commercial packaging still feels sales-engineer-led.
10. Operational readiness has many checks but needs more captured outcomes.
11. Multi-root Azure deployment choices can confuse adopters.
12. Repeat-use stickiness is plausible but not yet proven by customer habit.

## Top 6 Monetization Blockers

1. Buyers may understand the product only after a guided demo.
2. ROI proof is credible but not yet automatic enough.
3. Pricing and packaging require sales-led explanation.
4. First serious customer setup may need founder/support involvement.
5. Differentiation against generic AI architecture assistants needs sharper proof.
6. Expansion from Pilot to Operate is logical but not yet habit-forming.

## Top 6 Enterprise Adoption Blockers

1. Procurement will still ask for CPA SOC 2, ISO, and third-party pen-test artifacts, even though they are out of scope for headline scoring.
2. Security reviewers need concise evidence packs, not just deep repo docs.
3. Operators may struggle to identify the exact supported production profile.
4. First deployment has many valid Azure roots and configuration choices.
5. Trust depends on clear tenant isolation and access explanations during review.
6. Implementation teams need stronger “day one to first value” runbooks.

## Top 6 Engineering Risks

1. Breadth and documentation volume increase drift risk.
2. Real-LLM behavior needs continued golden corpus and release evidence.
3. SQL migration/history complexity can create upgrade risk.
4. Operational evidence may lag behind target SLO/SLA language.
5. UI/API authorization seams are well tested but easy to regress if copied ad hoc.
6. Trace sampling limitations may hide high-value spans unless collector policies are configured.

## Most Important Truth

ArchLucid is technically credible enough for V1 pilots, but revenue will depend on making the first buyer proof path simpler, faster, and more automatically defensible.

## Top Improvement Opportunities

### 1. Build a Buyer-Safe First-Value Evidence Gate

**Why it matters:** Converts technical output into sponsor-safe proof.

**Expected impact:** Directly improves Proof-of-ROI Readiness (+8–10 pts), Marketability (+3–5), Executive Value Visibility (+3–4). Weighted readiness impact: +0.7–1.0%.

**Affected qualities:** Proof-of-ROI Readiness, Marketability, Executive Value Visibility, Trustworthiness.

**Status:** Fully actionable now.

**Cursor prompt:**

```text
Implement a buyer-safe first-value evidence gate for committed runs.

Scope:
- Inspect existing first-value report code under ArchLucid.Application/Pilots, ArchLucid.Api pilot endpoints, and related tests.
- Add or extend a service that evaluates whether a run’s sponsor package is “Sendable”, “Needs operator note”, or “Incomplete”.
- Inputs should include committed manifest presence, artifact descriptors, time-to-commit, findings by severity, top finding evidence chain, audit row count/lower-bound, LLM call count, ROI evidence confidence, and demo-data warning.
- Surface the status in the existing first-value Markdown/PDF response model or adjacent DTO without breaking existing API routes.

Acceptance criteria:
- Unit tests cover all three statuses.
- Demo runs always surface a warning.
- Missing critical proof fields cannot silently render as confident sponsor proof.
- Existing endpoints remain backward-compatible.

Constraints:
- Do not change deferred SOC/design-partner/reference-customer scope.
- Do not add new external dependencies.
- Do not weaken existing pilot report tests.
```

### 2. Compress Core Pilot Onboarding to One Executable Path

**Why it matters:** Reduces adoption friction and cognitive load.

**Expected impact:** Adoption Friction (+6–8), Time-to-Value (+3–4), Usability (+4–6). Weighted readiness impact: +0.6–0.9%.

**Affected qualities:** Adoption Friction, Time-to-Value, Usability, Cognitive Load.

**Status:** Fully actionable now.

**Cursor prompt:**

```text
Create a single “Core Pilot shortest path” implementation pass.

Scope:
- Review docs/START_HERE.md, docs/CORE_PILOT.md, archlucid-ui Home/Core Pilot checklist, and CLI try/second-run docs.
- Align the default first-user path around exactly one sequence: sample review -> user input -> execute -> finalize/commit -> review package.
- Add or update tests that lock the buyer-facing copy and link targets.
- Remove or demote optional Operate concepts from first-session copy where they appear before the first package is complete.

Acceptance criteria:
- A new evaluator can identify the next action from START_HERE and Home without choosing among advanced docs.
- Existing Operate docs remain reachable but not presented as first-pilot requirements.
- Tests cover the locked first-session wording.

Constraints:
- Do not remove advanced features.
- Do not change API behavior.
- Do not reference previous assessments.
```

### 3. Add Release Evidence Summary Automation

**Why it matters:** Turns release readiness from checklist intent into reviewable evidence.

**Expected impact:** Reliability (+4–6), Deployability (+4–5), Trustworthiness (+2–3), Procurement Readiness (+2–3). Weighted readiness impact: +0.4–0.7%.

**Affected qualities:** Reliability, Deployability, Trustworthiness, Procurement Readiness.

**Status:** Fully actionable now.

**Cursor prompt:**

```text
Add or harden an automated release evidence summary.

Scope:
- Inspect docs/library/V1_RELEASE_CHECKLIST.md, RELEASE_SMOKE.md, existing scripts named release/readiness/evidence, and CI workflow outputs.
- Implement a read-only collector script that produces a markdown evidence summary from available artifacts: build status inputs, smoke results, OpenAPI snapshot status, coverage artifact references, health/version checks, and known skipped checks.
- The script should fail only on malformed inputs; it should mark missing evidence explicitly as “Not captured”.
- Add documentation showing when release owners run it and where the generated artifact belongs.

Acceptance criteria:
- Script has tests or a dry-run fixture.
- Output distinguishes “passed”, “failed”, “skipped”, and “not captured”.
- No generated evidence file is committed by default.
- V1 release checklist links to the command.

Constraints:
- Do not lower CI gates.
- Do not invent pass status when evidence is missing.
- Do not write secrets into the summary.
```

### 4. Create a Stale Claim / Scope Drift Check for Buyer Docs

**Why it matters:** Reduces contradiction risk across a large documentation surface.

**Expected impact:** Documentation (+8–10), Trustworthiness (+2–3), Marketability (+2–3). Weighted readiness impact: +0.3–0.5%.

**Affected qualities:** Documentation, Trustworthiness, Marketability, Cognitive Load.

**Status:** Fully actionable now.

**Cursor prompt:**

```text
Create a lightweight stale-claim drift check for buyer-facing docs.

Scope:
- Target README.md, docs/START_HERE.md, docs/CORE_PILOT.md, docs/EXECUTIVE_SPONSOR_BRIEF.md, docs/go-to-market/TRUST_CENTER.md, docs/library/V1_SCOPE.md, and docs/library/V1_DEFERRED.md.
- Add a script that scans for configured high-risk phrases and validates they align with canonical scope phrases.
- Include rules for auth default wording, SOC 2 status, design partner status, third-party pen-test status, live commerce status, MCP status, and first-pilot required path.
- Add a small config file for phrase rules.

Acceptance criteria:
- Script reports file, phrase, canonical reference, and suggested action.
- CI can run it in warning mode first.
- Existing docs are not rewritten wholesale.

Constraints:
- Do not reference previous assessments.
- Do not penalize explicitly deferred scope.
- Keep false positives manageable by making rules explicit.
```

### 5. Harden Real-LLM Evidence Capture

**Why it matters:** Correctness and trust depend on output quality beyond simulator runs.

**Expected impact:** Correctness (+3–5), AI/Agent Readiness (+5–7), Trustworthiness (+2–3). Weighted readiness impact: +0.4–0.6%.

**Affected qualities:** Correctness, AI/Agent Readiness, Explainability, Trustworthiness.

**Status:** Fully actionable now.

**Cursor prompt:**

```text
Harden the real-LLM evidence capture workflow without making live LLMs mandatory for simulator-only releases.

Scope:
- Inspect docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md, agent execution tracing, golden corpus tests, and release checklist references.
- Add a small application or CLI command that summarizes one real-LLM run’s prompt redaction status, model/deployment metadata, token/cost totals, quality-gate outcome, generated findings count, evidence-chain availability, and report path.
- Add tests around the summarizer using fixture traces.

Acceptance criteria:
- Simulator-only releases can explicitly mark real-LLM evidence as skipped.
- Real-LLM evidence cannot be marked complete without trace/cost/quality data.
- Output is safe to share internally and excludes raw secrets/prompts when redaction is enabled.

Constraints:
- Do not call Azure OpenAI in tests.
- Do not add new cloud dependencies.
- Do not change deferred MCP scope.
```

### 6. Publish a Single Supported Azure Production Profile

**Why it matters:** Enterprise implementation teams need one default path.

**Expected impact:** Azure Compatibility and SaaS Deployment Readiness (+4–6), Deployability (+4–5), Manageability (+3–4). Weighted readiness impact: +0.4–0.6%.

**Affected qualities:** Azure Compatibility and SaaS Deployment Readiness, Deployability, Manageability, Customer Self-Sufficiency.

**Status:** Fully actionable now.

**Cursor prompt:**

```text
Define and validate one canonical Azure production profile.

Scope:
- Review infra/terraform-pilot, infra/terraform-container-apps, infra/terraform-private, infra/terraform-keyvault, infra/terraform-sql-failover, infra/terraform-edge, and docs/library/REFERENCE_SAAS_STACK_ORDER.md.
- Create or update a concise production profile doc that names the default roots, required variables, private endpoint posture, identity model, and what is optional.
- Add Terraform validation checks or documentation tests where existing tooling supports them.

Acceptance criteria:
- A platform engineer can distinguish default production path from advanced multi-root options.
- No public SMB/445 exposure is introduced.
- Private endpoints and least privilege are explicit.
- The doc states which roots are optional and why.

Constraints:
- Do not deploy or apply Terraform.
- Do not hard-code subscription IDs.
- Do not replace existing advanced docs; summarize and link.
```

### 7. Add Customer-Ready Connector Smoke Recipes

**Why it matters:** Workflow embeddedness depends on practical integration confidence.

**Expected impact:** Workflow Embeddedness (+4–6), Interoperability (+3–4), Adoption Friction (+2–3). Weighted readiness impact: +0.3–0.5%.

**Affected qualities:** Workflow Embeddedness, Interoperability, Customer Self-Sufficiency.

**Status:** Fully actionable now.

**Cursor prompt:**

```text
Create customer-ready smoke recipes for first-party connectors.

Scope:
- Inspect ITSM outbound/inbound, Confluence publishing, Slack delivery, and Azure extractor docs/tests.
- Add concise smoke recipe docs for Jira, ServiceNow, Confluence, Slack, and Azure extractor upload.
- Each recipe should include prerequisites, minimal config, one happy-path command/API call, expected audit event, expected persisted correlation/package row, and troubleshooting hints.
- Add links from the relevant integration catalog or operator docs.

Acceptance criteria:
- Each recipe is executable without reading source code.
- Each recipe identifies secrets and where they should live.
- Each recipe names audit events or database evidence for verification.
- Existing customer-operated Logic Apps recipes remain intact.

Constraints:
- Do not add new connector scope.
- Do not include real credentials.
- Do not require Marketplace/App Directory publication.
```

### 8. Improve Operator Support Bundle Redaction Verification

**Why it matters:** Supportability improves only if bundles are safe and complete.

**Expected impact:** Supportability (+4–5), Security (+2–3), Customer Self-Sufficiency (+2–3). Weighted readiness impact: +0.2–0.4%.

**Affected qualities:** Supportability, Security, Trustworthiness.

**Status:** Fully actionable now.

**Cursor prompt:**

```text
Strengthen support bundle redaction verification.

Scope:
- Inspect ArchLucid.Cli support-bundle implementation, docs/TROUBLESHOOTING.md, docs/library/PILOT_GUIDE.md, and related tests.
- Add tests or scanner rules that verify generated support bundles do not include configured API keys, connection strings, bearer tokens, Key Vault references with secret values, or raw prompt bodies when redaction is enabled.
- Add a manifest section listing included files and redaction rules applied.

Acceptance criteria:
- Tests cover safe fields, redacted fields, and false-positive avoidance.
- Bundle manifest is deterministic.
- Documentation tells operators to review bundles before sharing.

Constraints:
- Do not remove useful diagnostic metadata like version, correlation ID, or health state.
- Do not weaken existing support-bundle behavior.
```

### 9. Add “Why This Finding Is Trustworthy” Output Cards

**Why it matters:** The product’s value depends on explainable findings, not just generated findings.

**Expected impact:** Explainability (+4–6), Trustworthiness (+3–5), Correctness (+2–3). Weighted readiness impact: +0.3–0.5%.

**Affected qualities:** Explainability, Trustworthiness, Correctness, Executive Value Visibility.

**Status:** Fully actionable now.

**Cursor prompt:**

```text
Add compact trust evidence cards for top findings.

Scope:
- Inspect finding evidence chain services, first-value reports, run detail UI, and manifest/finding DTOs.
- For each top-severity finding, render a compact card with: finding id, severity, source snapshot/manifest ids, supporting evidence chain, confidence/quality gate status if available, and human review caveat.
- Add Markdown rendering first; add UI rendering only where the run detail already displays findings.

Acceptance criteria:
- Cards never imply legal attestation or formal verification.
- Missing evidence is explicit.
- Tests cover complete and incomplete evidence chains.
- Existing report formats remain backward-compatible.

Constraints:
- Do not change finding generation logic.
- Do not fabricate evidence.
- Do not add LLM calls for card rendering.
```

### 10. Create a Minimal Buyer Proof Pack From One Real Run

**Why it matters:** Marketability improves when a buyer sees exactly what they get.

**Expected impact:** Marketability (+4–6), Decision Velocity (+4–5), Commercial Packaging Readiness (+3–4). Weighted readiness impact: +0.4–0.6%.

**Affected qualities:** Marketability, Decision Velocity, Commercial Packaging Readiness, Executive Value Visibility.

**Status:** Fully actionable now.

**Cursor prompt:**

```text
Create a minimal buyer proof pack generator for one committed run.

Scope:
- Reuse existing first-value report, sponsor one-pager, artifact bundle, procurement-safe warnings, and run metadata.
- Add a CLI or API-backed command that assembles a zip containing: sponsor summary, first-value report, artifact list, evidence completeness summary, trust-center pointer, and redaction/demo warning if applicable.
- Include manifest.json with file names, SHA-256, generated UTC, run id, and version.

Acceptance criteria:
- Pack generation fails or marks incomplete when the run is not committed.
- Demo data is visibly marked.
- SHA-256 manifest is deterministic.
- Tests cover committed, uncommitted, and demo-run cases.

Constraints:
- Do not include secrets or raw internal logs.
- Do not require live Stripe, Marketplace publication, public reference customer, or design partner.
- Do not duplicate procurement-pack builder logic if reusable components exist.
```

## Pending Questions for Later

None of the 10 actionable improvements above require blocking input.

### Recorded decisions

- **Azure production profile (2026-05-07):** First real production target is **multi-tenant production SaaS** (not single-tenant pilot or shared staging SaaS as the first production cut).
- **Primary enterprise demo connector (2026-05-07):** **Azure extractor** (customer-run package + `POST /v1/azure-extractor/upload` path) is the primary enterprise demo path, ahead of ServiceNow, Jira, Confluence, and Slack for that purpose.
- **ROI evidence baselines (2026-05-07, owner accepted):** **Signup (optional, minimal):** retain existing `baselineReviewCycleHours` on registration; add optional **team size** for a typical review (dropdown: 1, 2–3, 4–6, 7+). **Do not** collect salaries, dollar budgets, or tool costs at signup. **Sales discovery (operator-entered):** prep hours per review, governance evidence readiness (1–5), architecture reviews per quarter, optional blended hourly cost (default when skipped), one-line primary pain. Aligns with `docs/library/PILOT_ROI_MODEL.md` measurement model.
- **Buyer proof pack / canonical sales attachment (2026-05-07, owner accepted):** One **email-sized ZIP** after a committed pilot run — **(1)** first-value PDF, **(2)** first-value Markdown, **(3)** compact artifact/manifest summary (names, types, count — not full raw payloads), **(4)** sponsor brief (from `docs/EXECUTIVE_SPONSOR_BRIEF.md`), **(5)** one-page **trust posture** pointer (not full procurement pack), **(6)** blank pilot scorecard from `docs/library/PILOT_ROI_MODEL.md` §6, **(7)** `pack-manifest.json` (file list, SHA-256, UTC, run id, version, `demoDataWarning`). Exclude full procurement pack, raw large payloads, pricing/order form, internal QA artifacts; consulting DOCX as follow-up only. Suggested CLI: `archlucid buyer-proof-pack <runId> --out <path>` (or API equivalent).

### Open (decision-shaping)

None as of 2026-05-07 — prior items moved to **Recorded decisions** above.
