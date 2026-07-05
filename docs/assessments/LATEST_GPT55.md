# ArchLucid Strategic Release and Market Readiness Assessment (v3)

**Pass date:** 2026-07-05. **Prompt:** [`ASSESSMENT_PROMPT_V3.MD`](ASSESSMENT_PROMPT_V3.MD). **Reasoning engine:** Claude (Sonnet), simulator-aware; no live Azure OpenAI call made during this pass. **Source materials inspected:** `V1_SCOPE.md`, `V1_DEFERRED.md` (via `V1_SCOPE.md` cross-references), `TRUST_CENTER.md`/SOC posture carried from prior-pass verification (unchanged this cycle), `TECH_BACKLOG.md` (summary table TB-560–TB-624, including today's TB-622–TB-624 nav-authority-gating closures), `GTM_BACKLOG.md` (M-series / G-REAL-series status rows), `REPO_DIGEST.md`. Code spot-checked for the three new closures: `Tier2ConnectionController.cs`, `AwsTier2ConnectionController.cs`, `GcpTier2ConnectionController.cs`, `AwsConnectionSection.tsx`, `GcpConnectionSection.tsx`, `Tier2ConnectionWizard.tsx`, `ItsmProductIntegrationPageClient.tsx`, `FirstThirtyDaysGovernancePage`, `GovernanceInteractiveQuickstartCard.tsx`. No new engineering P0/P1 backlog rows or Tier 1/2 assessment engineering gates were open at pass start (verified against `TECH_BACKLOG.md` and the prior `LATEST_GPT55.md` §17 before drafting this one).

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows (M-series / G-REAL-series), ranked by criticality then dependency. Excludes GTM V1.1-backlog items #2/#3/#5/#6 (M-90/M-44/M-91/M-92) per standing exclusion rule. Unchanged from the prior pass — no GTM row closed or opened this cycle.

**Completed (owner sign-off prior cycle):**

| Task | Sign-off |
|------|----------|
| **M-04/G-REAL-02** — Playwright smoke sign-off, Workspace A self-demo | **Done — owner 2026-07-03** |
| **M-05/G-REAL-03** — Playwright smoke sign-off, Workspace B regulated scenario | **Done — owner 2026-07-03** |

**Agent work complete — owner sign-off pending:**

| Task | Status |
|------|--------|
| **M-06/G-REAL-04** — Workspace B sample report vs landing-page claims | Agent mechanical review **Done 2026-07-03** — see [`M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md`](../go-to-market/M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md). **Owner:** final sign-off (optional live DOCX visual check). |
| **M-08** — Align `POSITIONING.md` "audit chain / signed manifest" language with the one-minute pitch and demo script | Agent copy alignment **Done 2026-07-03**. **Owner:** optional read-through before next outreach copy freeze — not a blocking gate. |
| **M-18** — Send 20 outreach messages offering a 10-minute demo | Agent message drafting **Done 2026-07-03** — see [`M18_OUTREACH_MESSAGE_TEMPLATE.md`](../go-to-market/M18_OUTREACH_MESSAGE_TEMPLATE.md). **Owner:** personalize and send once M-09/M-16/M-17 clear. |

| # | Task | Why ranked here | Engine-assistable? | Recommended engine |
|---|------|------------------|---------------------|---------------------|
| 1 | **M-07** — Capture 6–8 polished screenshots across the operator workflow | Feeds M-09 (landing page) and M-16 (demo video); both workspace smokes green | No — requires a human-operated browser session for polish/framing | N/A — human only |
| 2 | **M-09** — Finish landing page (owner sign-off, deploy) | Blocks all outreach (M-17/M-18); remaining work is owner sign-off + deploy | Partial — deploy checklist and open TODO scan | **Composer** — mechanical checklist pass |
| 3 | **M-16** — Record short demo video (Workspace A self-demo flow) | Depends on #1 (screenshots); feeds M-18 outreach | No — requires a human-narrated recording | N/A — human only |
| 4 | **M-17** — Build outreach list of 20 architects/CTOs/security leaders | Can run in parallel with #1–#3; M-18 template ready | Partial — list formatting/dedup only | **Composer** — low-stakes formatting |
| 5 | **M-19** — Run 5–10 live demos against Workspace A/B | Depends on outreach replies from #2–#4 | No — live human-led demo calls | N/A — human only |
| 6 | **M-20** — Track objections from demos; refine positioning and demo script | Depends on #5 producing real objections | Partial — synthesize notes into objection log | **Opus** — strategic copy synthesis |
| 7 | **M-39** — Apply `PROOF_PACKET_RUN_LOG_OPERATING_CHECKLIST.md` on every real pilot; reach ≥3 qualifying G4 rows | Depends on G-REAL-06 pilots | No — live pilot execution | N/A — human only |
| 8 | **G-REAL-06** — Execute three committed real-mode pilot runs | Stage 1 exit gate; both workspace smokes signed off 2026-07-03 | No — real customer-facing pilot execution | N/A — human only |
| 9 | **G-REAL-07** — Collect proof packets per pilot run (`collect-first-pilot-proof.ps1`) | Directly depends on #8 | Partial — pre-validate script flags/output shape | **Composer** — mechanical verification |

---

## 1. Title & Headline

`ArchLucid Assessment – (A) Headline Readiness: 72.64%`. Readiness excludes deferred (V1.1/V2) items per the governing scope docs. Computed fresh this pass from the Weighted Quality Model in §2 — no score or delta carried forward from any prior assessment file; the ~0.2-point move from the last pass reflects three newly-closed nav-authority-hygiene backlog rows (TB-622–TB-624), not a ratchet.

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|-----------------------:|----------------------------:|
| 1 | Decision-Changing Insight Density | 64 | 13 | 8.32 | 468 |
| 2 | Differentiability / Defensibility vs Frontier AI | 70 | 13 | 9.10 | 390 |
| 3 | Governed Review Integrity | 79 | 13 | 10.27 | 273 |
| 4 | Correctness & Evidence Integrity | 83 | 12 | 9.96 | 204 |
| 5 | AI / Agent Readiness | 66 | 10 | 6.60 | 340 |
| 6 | Time-to-Value | 68 | 10 | 6.80 | 320 |
| 7 | Proof-of-ROI Readiness | 67 | 9 | 6.03 | 297 |
| 8 | Executive / Operator Comprehension | 78 | 8 | 6.24 | 176 |
| 9 | Runtime & First-Review Reliability | 81 | 7 | 5.67 | 133 |
| 10 | Adoption Friction | 73 | 5 | 3.65 | 135 |
| | **(A) Headline readiness** | | **100** | **72.64** | |

## 3. Diagnostic Scores (non-headline)

* **Decision Advantage Score:** 60/100 — unchanged this pass; policy-pack-mapped findings and audit traceability give ArchLucid a real edge over "Claude + pasted standards," but the edge is more about *repeatability and auditability* than about finding things a skilled architect+frontier-AI session would miss outright.
* **Frontier-AI Survival Probability (12-month):** 55–70%, moderate confidence. Reference class: vertical AI-wrapper tools without proprietary data/workflow moats have a poor 12-month survival rate against frontier-model feature absorption; ArchLucid's governance/audit/policy-pack layer is the kind of enterprise-workflow surface area that historically survives longer than generic-analysis wrappers.
* **30-Day Voluntary Usage Probability:** 35–50%, low-moderate confidence — no live pilot cohort exists yet (G-REAL-06 not started), so this is extrapolated from product shape, not measured usage.
* **Executive Purchase Probability:** 25–40%, low confidence — sales-led motion with TEST-mode trial exists but zero completed real-mode pilots to cite as proof.
* **Reconciliation with headline:** the 72.64% headline reflects built infrastructure quality, not market validation — the wide, low-confidence ranges on usage/purchase are expected and should not be read as contradicting the headline. Nothing in this cycle's closures (nav-authority gating) touches usage/purchase evidence.

## 4. V1 Ship Gate

| # | Gate | Verdict | Evidence |
|---|------|---------|----------|
| 1 | First review completes end to end | **PASS** | `AuthorityRunOrchestrator` + golden-manifest finalization; `AuthorityDrivenArchitectureRunCommitOrchestratorIntegrityTests` |
| 2 | No hallucinated/uncited citations | **PASS** | Citation contract on cost/savings lines; faithfulness eval harness (RAG-V1-000–011, TB-021 closed) |
| 3 | ROI output coherent, not misleading | **PASS** | `GET /v1/roi/executive-summary` disposition-aware basis with per-system-vs-headline labeling |
| 4 | Export/package generation works | **PASS** | Ship-gate Gate 4 export matrix (Markdown/DOCX/ZIP) |
| 5 | Operator UI does not break on first-review path | **PASS** | First-review UI route smoke (ship-gate Gate 5) |
| 6 | Auth + tenant isolation correct on pilot path | **PASS** | Live tenant-isolation deny-matrix (Gate 6); query-time tenant/policy scoping on retrieval paths; today's TB-623 closes a residual Reader-enumeration gap on cloud-connection list endpoints (defense-in-depth, not a gate regression — the endpoints already required authentication and tenant scoping, only the authority *tier* was looser than the nav gate implied) |

All six PASS. No FAIL caps the headline this pass.

## 5. Executive Summary

**(A) Overall headline readiness — 72.64%.** ArchLucid ships a materially non-commodity governed-review core: versioned policy packs drive findings and the pre-commit gate; findings trace evidence → policy → recommendation → decision → audit record; and the golden-manifest/authority-chain model gives a defensible run-of-record. First-party connectors for Jira, ServiceNow, Confluence, Slack, and Microsoft Teams are V1 GA with automated conformance tests, scripted live-validation preflight for all five, buyer-copy alignment in `INTEGRATION_CATALOG.md`, and a complete OAuth stack including operator **Connect with Atlassian** auth-code consent. Multi-cloud target analysis (Azure/AWS/GCP) is V1 GA with Cost-agent structured retail-price grounding across all three clouds. RAG-V2 pull-forward items that materially affect buyer-facing honesty are closed: bounded multi-hop Graph-RAG, single-pass query expansion relabel, offline per-flag ablation, Graph-RAG production posture marker, and upsert-time tenant validation on vector writes. This cycle's engineering closures (TB-622, TB-623, TB-624) are small but real hygiene fixes surfaced by a left-nav business-purpose review: a stale triple-naming inconsistency on the governance setup guide page, a Reader-authority gap that let the cloud-connections list endpoints be enumerated below the nav-gate's intended authority floor, and a missing operator-capability check on the shared ITSM settings save button. None of these change the headline materially (weight-5 Adoption Friction category), but they are the kind of "does the UI actually enforce what the nav model implies" defect class worth tracking because it recurs (TB-612 through TB-616 closed the same class of gap in prior cycles). The gap to a higher score remains concentrated in market proof (zero completed real-mode pilots) and residual AI-depth debt: promoted fine-tuned models are registered but not yet routed into agent completion paths (TB-594 follow-up, held pending pilot signal per owner decision).

**(B) Procurement / market realism (weight 0).** SOC 2 posture is self-assessment + roadmap (CPA attestation V1.1-backlog TB-135; external pen-test V2 TB-136) — correct V1 posture, unchanged this cycle. Connector scope docs remain internally consistent after the V1 GA promotion sweep.

**Commercial picture:** sales-led motion (pricing page, order form, TEST-mode trial) is compelling; real-world usage is unproven — G-REAL-06 not started.

**Enterprise picture:** trust posture is honest; the product has not yet been through a live buyer's security review.

**Engineering picture:** robust on core review/governance/audit (ship gate all-PASS); RAG-V2 and multi-cloud-cost surfaces are functional with documented depth caveats; a small, recurring class of nav-authority/label-consistency defects continues to surface and close quickly when a business-purpose review runs, suggesting the review cadence itself (not the fix cost) is the limiting factor.

**Frontier-AI picture:** ArchLucid becomes more valuable as base models improve — better reasoning improves finding quality and retrieval depth at near-zero ArchLucid engineering cost — but the moat is policy-pack/evidence/audit workflow, not raw critique eloquence.

## 6. Deferred Scope Uncertainty

* **V1.1 (no `(A)` penalty):** CloudEvents outbound webhooks and customer-operated recipe bridges; MCP read-only agent-tool membrane; multi-region active/active; commerce un-hold. First-party Jira/ServiceNow/Confluence/Slack/Teams are **V1 GA**, not V1.1.
* **V2:** third-party pen-test (TB-136); SOC 2 CPA (TB-135); automated tenant-erasure; Redis-as-default; DTF/Container Apps Jobs; full enterprise ITSM connector (TB-398).
* Seam for deferred CloudEvents/recipe path: Logic Apps/Power Automate bridge documented today against the same webhook contract V1.1 will formalize.

## 7. Weighted Quality Assessment (detail, ordered by weighted deficiency signal)

**Decision-Changing Insight Density — score 64, weight 13, deficiency 468.** Policy-pack-mapped findings with evidence citations are harder to reproduce via ad-hoc prompting than generic critique. Offline golden-cohort ablation (`faithfulness-ablation-summary.json`) quantifies per-flag retrieval contribution on fixtures; HyDE shows measurable impact when disabled. Remaining gap: offline fixtures, not live-model or live-buyer validation. Unchanged this cycle. Affects: decision advantage, differentiability.

**Differentiability / Defensibility — score 70, weight 13, deficiency 390.** High on Governed-Review-Integrity (policy packs demonstrably change findings/gate outcomes/audit trail). RAG-V2 labeling matches shipped depth (bounded multi-hop Graph-RAG; single-pass query expansion). Unchanged this cycle. Affects: differentiability, decision advantage, frontier-AI survival.

**AI / Agent Readiness — score 66, weight 10, deficiency 340.** Real-Azure-OpenAI vs simulator separation is clean; orchestration lives in `ArchLucid.Application`. Graph-RAG bounded multi-hop and honest single-pass query-expansion labeling ship. Remaining deductions: community summarization deferred; fine-tuned model registry exists but promoted deployments are not wired into agent completion routing (code-verified gap, held pending pilot signal). Unchanged this cycle. Affects: decision-changing insight, differentiability.

**Time-to-Value — score 68, weight 10, deficiency 320.** First-review path is reliable (ship gate all-PASS). `Integrations:Itsm:NativeEnabled` defaults `true`; OAuth consent UI closes enterprise ITSM credential friction for Atlassian tenants. Unchanged this cycle. Affects: time-to-value, adoption friction.

**Proof-of-ROI Readiness — score 67, weight 9, deficiency 297.** `GET /v1/roi/executive-summary` and board-pack export are disposition-aware. AWS/GCP Cost-agent grounding cites structured retail-price rows when matched. Remaining gap: live GCP catalog requires API key; heuristic fallback when probe misses. Unchanged this cycle. Affects: proof-of-ROI, correctness.

**Governed Review Integrity — score 79, weight 13, deficiency 273.** Strongest category: changing a policy pack provably changes findings, pre-commit gate outcome, and audit reconstruction. Unchanged this cycle — today's closures are nav/authority hygiene, not policy-engine behavior. Affects: governed repeatability, decision advantage.

**Correctness & Evidence Integrity — score 83 (+1 from prior pass), weight 12, deficiency 204.** Citation contract enforced; no hallucinated policy/evidence claims found in reviewed paths. New this cycle: **TB-623** removes a `ReadAuthority` override that had let the Azure/AWS/GCP cloud-connection list endpoints be called at a lower authority tier than the nav gate implied (Readers could enumerate configured connections via direct API call even though the nav item is intentionally hidden from them) and adds `useOperateCapability()` gating to all three connector sections' mutation buttons; **TB-624** closes a matching gap on the shared ITSM settings save button. These are least-privilege/authority-consistency fixes, not evidence-fabrication fixes, but they land in this category because they close a "the UI/API says one thing, the enforced authority says another" correctness gap. Affects: correctness, trustworthiness, least-privilege posture.

**Executive / Operator Comprehension — score 78, weight 8, deficiency 176.** Multiple copy/terminology and nav passes improved buyer-facing surfaces; help layout and inline help standardized. New this cycle: **TB-622** finishes a naming-consistency fix TB-520 had left half-done — the governance setup guide page's own `<h1>`/tab title and an inline quickstart-card link previously used two other names ("First 30 days — governance operating preset" / "First 30 days — governance rhythm") than the sidebar label ("Governance setup guide"); all three now match. This is exactly the kind of "three names, one destination" defect class the comprehension category already tracks (TB-606, TB-612, TB-615). Score held at 78 rather than raised — a single-page naming fix does not move a category this broad on its own; it is folded into the qualitative record for the next pass to reference if the pattern keeps recurring. Affects: adoption, executive comprehension.

**Adoption Friction — score 73 (+1 from prior pass), weight 5, deficiency 135.** Scripted live-validation parity for all five promoted connectors; value-report tab gating; governance-mode sidebar label parity; complete OAuth stack with in-product Atlassian consent. New this cycle: TB-622–TB-624 close three more instances of the same "nav model and enforced authority/labeling disagree" defect class that TB-612–TB-616 closed last cycle — cumulatively this is now nine such gaps found and closed via the same left-nav business-purpose review technique, which is itself a positive signal about review cadence quality even though each individual fix is small. Remaining friction is credential configuration and pilot onboarding, not hidden feature flags or stale scope copy. Affects: adoption friction, time-to-value.

**Runtime & First-Review Reliability — score 81, weight 7, deficiency 133.** All six ship-gate items PASS; most mature category. Unchanged this cycle. Affects: runtime reliability.

## 8. Top 10 Weaknesses (ranked)

1. **No live pilot cohort yet** — market uncertainty; single biggest gap in diagnostic scores; fastest path is G-REAL-06.
2. **Decision-changing insight unproven in live settings** — offline ablation exists; no buyer evidence that findings change decisions frontier AI alone would not.
3. **Fine-tuned model routing gap** — registry/orchestration ships; promoted deployments do not yet affect agent completions (TB-594 follow-up, held pending pilot signal).
4. **GCP live retail catalog optional** — heuristic fallback when `GcpBillingCatalogOptions.ApiKey` absent.
5. **Community summarization deferred** — Graph-RAG depth claim stops at bounded multi-hop.
6. **Zero completed real-mode pilot case studies** — blocks executive purchase probability calibration.
7. **Iterative retrieve-critique-retry loop deferred** — correctly relabeled; technical buyers may still ask (G-REAL-06 signal needed).
8. **Landing page / outreach not deployed** — M-09/M-18 block commercial motion, not product correctness.
9. **A recurring "nav model vs enforced authority/labeling" defect class** — nine instances closed across two cycles (TB-612–TB-616, TB-622–TB-624) via manual left-nav review; no automated guard yet catches this class before a targeted review finds it.
10. **SOC 2 CPA absent** — `(B)` procurement friction only; correctly out of `(A)`.

## 9. Frontier-AI Analysis

**Commodity vs. durable:**

| Capability | 12-month trajectory | Reason |
|---|---|---|
| Generic architecture critique | Commodity | Frontier models with a good prompt already do this reasonably well |
| Policy-pack-driven findings + pre-commit gate | Durable | Requires persistent customer-specific policy state |
| Evidence → policy → decision → audit traceability | Durable | Structural/workflow property |
| Graph-RAG / single-pass query expansion quality | Gets more valuable as models improve | Better base-model reasoning improves rerank/rewrite at ~zero eng cost |
| First-party ITSM/chat connectors | Durable (workflow) | Per-tenant credential + correlation state, not intelligence |

**Hard to reproduce via prompting:** persistent policy-pack state, audit reconstruction, per-tenant credential/correlation storage, golden-manifest run-of-record.

**Leverage/upside:** as base models improve, finding quality and retrieval depth rise for free while the policy-pack mapping layer compounds audit value.

**Displacement timeline:** single-pass generic critique is already mostly commodity; governed-workflow layer is not threatened by one model release.

**Survival probability:** see §3 (55–70%, 12-month).

**Final verdict:** ArchLucid is becoming more valuable faster than frontier AI is becoming capable on the governed-workflow axis — but this verdict rests on architecture, not live pilot proof.

## 10. Policy-Aware Governance Test

1. Policy packs are first-class and content-driving — pre-commit gate blocks on pack-derived severity thresholds.
2. Major findings trace input → evidence → policy → recommendation → decision → audit on the core review path.
3. A skilled architect + frontier AI alone would not reproduce repeatability and auditability across operators without ArchLucid.
4. Finding text is AI-generated; policy mapping, gate outcome, and audit record are governed infrastructure.
5. Change a pack, rerun, observe different findings/gate outcome — demonstrable today.
6. Fastest validation: buyer-run pilot with pack edit (no engineering needed).
7. Demo moat moment: live policy-pack edit → re-run → different findings in the same session.

## 11. Principal Architect Dismissal Test

"I need this" moment: pre-commit gate blocks a commit based on a policy pack they configured, with full evidence trail. Dismissal if retrieval depth claims are probed and contradict shipped behavior — risk is now lower after bounded multi-hop Graph-RAG, honest single-pass query-expansion labeling, and per-flag ablation on fixtures. **Most likely dismissal trigger:** 10–20% in a technical demo probing retrieval depth (community summarization, fine-tuning not routed). **Materially better than "Claude + pasted standards"?** Yes for governed/repeatable/audit-trail use case; not for one-off critique.

## 12. Founder Delusion Check

Strongest assumption, weakest evidence: buyers care about retrieval sophistication before governance value in a pilot. Strongest likely moat: golden-manifest/audit-catalog/policy-pack plumbing. Biggest time sink risk: more RAG-V2 depth before G-REAL-06 — or, newly worth naming, continuing to spend engineering cycles on nav-authority hygiene sweeps (TB-612–TB-616, TB-622–TB-624) instead of building the one automated guard that would catch the whole defect class at once. If features froze six months: run pilots and synthesize objections (M-20). Most dangerous distraction: iterative retrieve-critique-retry before pilot signal. Most boring real moat: per-tenant credential/correlation + audit reconstruction.

## 13. Competitive Reality Check & Moat Assessment

ArchLucid does policy-mapping, gate-blocking, and audit-trail faster and more consistently than manual frontier-AI sessions; it does not beat a well-prompted session on raw critique quality. Commodity within 12 months: critique text. Gets more valuable as AI improves: retrieval quality. Requires enterprise workflow: policy packs, connector credentials, audit export. Most durable moat: policy-pack-driven pre-commit gating. Probably-illusory: depth claims that survive only because buyers do not ask. Boring-but-durable: `ItsmFindingCorrelations` + audit catalog.

## 14. Adoption & Monetization

**30-Day Voluntary Usage:** strongest positive — pre-commit gate forcing function; strongest negative — zero real-mode pilots. **Executive Purchase:** strongest driver — audit/governance for regulated buyers; strongest blocker — no pilot proof. **Why buy over more frontier-AI licenses:** governance, policy packs, evidence traceability, audit trail, operator repeatability. **Top monetization blockers:** (1) no pilot proof — validation; (2) no case study — market; (3) SOC 2 CPA for hard-gate buyers — V1.1; (4) landing/outreach not live — GTM; (5) fine-tuning routing not proven — engineering hold. **Top enterprise adoption blockers:** (1) no pilot case study; (2) credential setup for connectors; (3) technical due diligence on retrieval depth — mitigated by honest labeling + ablation; (4) procurement timing; (5) change-management fit for governance workflow.

## 15. Most Important Truth

ArchLucid's governed-review infrastructure is real and durable, and the team keeps finding and closing small nav-authority/labeling gaps fast when it looks — but the product still has zero completed real-mode pilots to validate any of this against an actual buyer, and no automated guard yet exists to catch the recurring "nav says one thing, enforced authority says another" defect class before a manual review finds it.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

---

## 16. Stop Doing List

**Not worth doing before V1:** (1) community-summarization Graph-RAG before pilot feedback; (2) iterative retrieve-critique-retry loop before G-REAL-06 signal; (3) further integration-catalog copy polish. **Diminishing returns:** RAG-V2 depth beyond shipped scope, nav/IA polish without user feedback — though see §17 Tier 3 for one bounded exception (an automated regression guard, not more manual polish). **Founder behaviors that delay validation:** more engineering before G-REAL-06; over-indexing on SOC 2 CPA (out of `(A)`). **Feels enterprise-important but may not move adoption:** fine-tuning completion routing before a pilot proves buyers want it.

## 17. Top Improvement Opportunities

**Verify-before-listing gate applied.** All six ship gates PASS; summary-table P0/P1 engineering rows through TB-624 are **Done**. §17 leads with market validation per v3 prescription. Shipped this cycle (acknowledged in one line, no tier entries): three nav-authority/label-consistency hygiene fixes found during a left-nav business-purpose review (TB-622 governance-setup-guide naming, TB-623 cloud-connections Reader-enumeration + mutation gating, TB-624 ITSM settings save-button gating). Shipped last cycle (still current, not re-litigated): V1 GA connector promotion tightening (TB-599–TB-602, TB-600 OAuth including Atlassian consent UI), RAG-V2 doc-accuracy and depth items (TB-595–TB-598), multi-cloud Cost grounding (TB-603), retrieval tenant validation (TB-604), Graph-RAG posture (TB-596), nav/help/governance UX batch (TB-605–TB-616), CodeQL hardening (TB-609–TB-611).

### Tier 1 — Must Fix (validation first)

| Title | Why it matters | Expected impact | Classification |
|-------|----------------|-----------------|----------------|
| **G-REAL-06 — Execute three committed real-mode pilot runs** | Zero live pilots is the dominant weighted deficiency driver across §3 diagnostic scores and §8 weakness #1 | Moves 30-Day Voluntary Usage and Executive Purchase from extrapolation to measurement | validation first / blocked on owner execution |
| **M-07 + M-09 + M-16 — Screenshots, landing deploy, demo video** | Commercial motion blocked without visual proof assets | Unblocks M-17/M-18 outreach sequence | validation first / GTM |

### Tier 2 — High Leverage (validation)

| Title | Why it matters | Expected impact | Classification |
|-------|----------------|-----------------|----------------|
| **M-19/M-20 — Live demos + objection synthesis** | Only path to calibrate dismissal triggers and positioning | Informs whether retrieval depth or governance is the buyer hook | validation first |
| **M-39 + G-REAL-07 — Proof packets per pilot** | Converts pilots into citeable evidence | Feeds procurement and case-study motion | validation first |

### Tier 3 — Hold For Reassessment (engineering)

| Title | Why it matters | Expected impact | Classification |
|-------|----------------|-----------------|----------------|
| **Wire promoted fine-tuned deployments into agent completion routing** (TB-594 follow-up) | `IFineTunedModelRegistry` has no consumer outside fine-tuning orchestration — still true this pass | Would close AI/Agent readiness gap only if pilots want manifest-tuned models | V1 engineering — hold until G-REAL-06 signal |
| **Automated nav-authority/label-consistency guard** (new candidate, not yet a TB row) | Nine instances of "sidebar label / page title / enforced authority disagree" have now been found and closed manually across two cycles (TB-612–TB-616, TB-622–TB-624) with no regression guard preventing a tenth; a lint-style check comparing nav-config authority tiers against controller-level `[Authorize(Policy=...)]` attributes, plus a page-title/sidebar-label snapshot test, would catch the whole class at commit time instead of at the next manual review | Would prevent recurrence of a defect class averaging ~4–5 instances per left-nav review cycle; low implementation cost (static analysis over existing nav-config + controller metadata, both already typed) | V1 engineering — genuinely actionable, but explicitly held to Tier 3 this pass per the validation-first ordering rule: it does not move any of the five ranked outcomes (decision-changing insight, governed repeatability, 30-day usage, executive purchase, frontier-AI survivability) as directly as G-REAL-06, and the fix-on-discovery cost has been consistently low (all nine instances closed same-day). Revisit if a tenth instance surfaces, or after G-REAL-06 frees engineering capacity. |
| **TB-398 full enterprise ITSM connector** | OAuth/field-mapping/bidirectional sync wizard | Large V2 scope | V2 — owner promotion required |

_No Tier 1 or Tier 2 in-contract engineering gates remain open._

## 18. Prompt Batching Guidance

**First batch (human-only):** G-REAL-06 pilots, M-07 screenshots, M-09 deploy, M-16 video. **Second batch (human-led):** M-19 demos, M-20 objection log. **Third batch (engineering, hold):** TB-594 fine-tuning routing and the nav-authority/label-consistency guard — only after pilot signal or if a tenth instance of the defect class surfaces first.

## 19. Model Usage Guidance

**Composer-safe:** M-17 list formatting, M-09 deploy checklist, G-REAL-07 script verification, a first draft of the nav-authority/label-consistency lint if picked up. **Sonnet-safe:** outreach personalization drafts. **Opus-recommended:** M-20 objection synthesis into strategic positioning.

## 20. Pending Questions For Later

* **Blocks V1 (owner):** none newly identified — in-contract engineering gates closed.
* **Requires customer validation:** whether buyers probe retrieval depth vs governance value (G-REAL-06).
* **Requires founder decision:** whether to pick up TB-594 fine-tuning routing before or after first pilot; whether the nav-authority/label-consistency guard is worth a dedicated TB row now or only after a tenth instance.

---

# Appendix A — Author Signal (qualitative, non-headline)

Real principal-architect judgment shows in: policy-pack-driven pre-commit gate, disposition-aware ROI that does not falsely sum per-system rows, honest `groundingMissing` when retail-price lookup misses, complete OAuth consent for enterprise ITSM without overstating connector maturity beyond shipped conformance tests, and — this cycle — closing a real least-privilege gap (TB-623) the moment a review surfaced it rather than deferring it. The recurring nature of the nav-authority/label-consistency defect class (nine instances, two cycles) is itself informative: each instance is closed cheaply and correctly, which speaks well of execution discipline, but the absence of a standing automated guard for a well-understood, mechanically-checkable defect class is a process gap worth naming honestly rather than quietly re-fixing forever.

---

Central question: **Does ArchLucid turn frontier AI into a governed, policy-aware, audit-ready enterprise architecture review system that changes decisions and earns repeat use?** Yes for governed/repeatable/audit-trail — with strong engineering evidence. Not yet proven for decision-changing insight in live buyer settings; G-REAL-06 is the fastest path to answer that.
