# ArchLucid Strategic Release and Market Readiness Assessment (v3)

**Rescore (2026-07-05):** **TB-619** closed (Adoption Friction P2, general-backlog Step 4 pick — TB-617/TB-618, the P1 rows ahead of it, were blocked this pass by a concurrent uncommitted edit to their target files and remain open). `QuickDecisionSummary` — the Review Package detail page's actual per-finding rendering — now surfaces an explicit "Evidence gap" `StatusTag` when a finding has zero evidence refs/snippets/policy-rule citation (previously such a finding rendered no signal at all, silently presenting unevidenced and well-evidenced findings identically), plus owner/review-status rows and a bolded "Recommended action" label; `FindingEvidenceLinkChip` restyled from a bordered chip (read as a noninteractive badge) to genuine underlined-link styling. **Correctness & Evidence Integrity** moves 83→84 (this closes a "the UI presented unevidenced and evidenced findings identically" correctness-signal gap, the same defect class as the TB-623/624 authority-vs-nav gaps already tracked in this category, just on the evidence axis rather than the authority axis). Headline moves **72.64% → 72.76%**. TB-617/618/620/621 (the rest of the same principal-architect Review Package hierarchy-audit cluster) remain open and unblocked for a future pass.

**Pass date:** 2026-07-05. **Prompt:** [`ASSESSMENT_PROMPT_V3.MD`](ASSESSMENT_PROMPT_V3.MD). **Reasoning engine:** Claude (Sonnet), simulator-aware; no live Azure OpenAI call made during this pass. **Source materials inspected:** `V1_SCOPE.md`, `V1_DEFERRED.md` (via `V1_SCOPE.md` cross-references), `TRUST_CENTER.md`/SOC posture carried from prior-pass verification (unchanged this cycle), `TECH_BACKLOG.md` (summary table TB-560–TB-624, including today's TB-622–TB-624 nav-authority-gating closures), `GTM_BACKLOG.md` (M-series / G-REAL-series status rows), `REPO_DIGEST.md`. Code spot-checked for the three new closures: `Tier2ConnectionController.cs`, `AwsTier2ConnectionController.cs`, `GcpTier2ConnectionController.cs`, `AwsConnectionSection.tsx`, `GcpConnectionSection.tsx`, `Tier2ConnectionWizard.tsx`, `ItsmProductIntegrationPageClient.tsx`, `FirstThirtyDaysGovernancePage`, `GovernanceInteractiveQuickstartCard.tsx`. No new engineering P0/P1 backlog rows or Tier 1/2 assessment engineering gates were open at pass start (verified against `TECH_BACKLOG.md` and the prior `LATEST_GPT55.md` §17 before drafting this one).

---

## 0. Tasks For Human

Sourced from open `GTM_BACKLOG.md` rows (M-series / G-REAL-series), ranked by criticality then dependency. Excludes GTM V1.1-backlog items #2/#3/#5/#6 (M-90/M-44/M-91/M-92) per standing exclusion rule. **One row opened this session (2026-07-05, owner-directed):** **M-93** — see table below. Not a re-scored pass; scorecard in §2 unchanged.

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
| 10 | **M-93** (new) — Run a real ArchLucid-on-ArchLucid dogfood pilot and publish it as a citable sample-report, closing the M-06 audit's C4 "seed-backed, not live" gap on Workspace B (`EngineType` = `SecurityBaselineSeed`/`AiGovernanceSeed`, workspace-level not per-finding evidence citations) | Owner-directed 2026-07-05; independent of #1–#9, can start immediately | Partial — an agent can draft the seed/wiring plan (**TB-640**) but the live pipeline run itself needs a real deployed environment + owner redaction sign-off | **Sonnet/Composer** — plan + wiring; owner for the actual run and redaction pass |

---

## 1. Title & Headline

`ArchLucid Assessment – (A) Headline Readiness: 72.76%`. Readiness excludes deferred (V1.1/V2) items per the governing scope docs. Base pass (72.64%) computed fresh from the Weighted Quality Model in §2 — no score or delta carried forward from any prior assessment file; the ~0.2-point move from the pass before that reflected three newly-closed nav-authority-hygiene backlog rows (TB-622–TB-624). This rescore's +0.12 reflects one additional closure since the base pass: **TB-619** (see the Rescore line above the pass-date header).

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|-----------------------:|----------------------------:|
| 1 | Decision-Changing Insight Density | 64 | 13 | 8.32 | 468 |
| 2 | Differentiability / Defensibility vs Frontier AI | 70 | 13 | 9.10 | 390 |
| 3 | Governed Review Integrity | 79 | 13 | 10.27 | 273 |
| 4 | Correctness & Evidence Integrity | 84 | 12 | 10.08 | 192 |
| 5 | AI / Agent Readiness | 66 | 10 | 6.60 | 340 |
| 6 | Time-to-Value | 68 | 10 | 6.80 | 320 |
| 7 | Proof-of-ROI Readiness | 67 | 9 | 6.03 | 297 |
| 8 | Executive / Operator Comprehension | 78 | 8 | 6.24 | 176 |
| 9 | Runtime & First-Review Reliability | 81 | 7 | 5.67 | 133 |
| 10 | Adoption Friction | 73 | 5 | 3.65 | 135 |
| | **(A) Headline readiness** | | **100** | **72.76** | |

## 3. Diagnostic Scores (non-headline)

* **Decision Advantage Score:** 60/100 — unchanged this pass; policy-pack-mapped findings and audit traceability give ArchLucid a real edge over "Claude + pasted standards," but the edge is more about *repeatability and auditability* than about finding things a skilled architect+frontier-AI session would miss outright.
* **Frontier-AI Survival Probability (12-month):** 55–70%, moderate confidence. Reference class: vertical AI-wrapper tools without proprietary data/workflow moats have a poor 12-month survival rate against frontier-model feature absorption; ArchLucid's governance/audit/policy-pack layer is the kind of enterprise-workflow surface area that historically survives longer than generic-analysis wrappers.
* **30-Day Voluntary Usage Probability:** 35–50%, low-moderate confidence — no live pilot cohort exists yet (G-REAL-06 not started), so this is extrapolated from product shape, not measured usage.
* **Executive Purchase Probability:** 25–40%, low confidence — sales-led motion with TEST-mode trial exists but zero completed real-mode pilots to cite as proof.
* **Reconciliation with headline:** the 72.76% headline reflects built infrastructure quality, not market validation — the wide, low-confidence ranges on usage/purchase are expected and should not be read as contradicting the headline. Nothing in this cycle's closures (nav-authority gating, findings evidence-gap surfacing) touches usage/purchase evidence.

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

**(A) Overall headline readiness — 72.76%.** ArchLucid ships a materially non-commodity governed-review core: versioned policy packs drive findings and the pre-commit gate; findings trace evidence → policy → recommendation → decision → audit record; and the golden-manifest/authority-chain model gives a defensible run-of-record. First-party connectors for Jira, ServiceNow, Confluence, Slack, and Microsoft Teams are V1 GA with automated conformance tests, scripted live-validation preflight for all five, buyer-copy alignment in `INTEGRATION_CATALOG.md`, and a complete OAuth stack including operator **Connect with Atlassian** auth-code consent. Multi-cloud target analysis (Azure/AWS/GCP) is V1 GA with Cost-agent structured retail-price grounding across all three clouds. RAG-V2 pull-forward items that materially affect buyer-facing honesty are closed: bounded multi-hop Graph-RAG, single-pass query expansion relabel, offline per-flag ablation, Graph-RAG production posture marker, and upsert-time tenant validation on vector writes. This cycle's engineering closures (TB-622, TB-623, TB-624) are small but real hygiene fixes surfaced by a left-nav business-purpose review: a stale triple-naming inconsistency on the governance setup guide page, a Reader-authority gap that let the cloud-connections list endpoints be enumerated below the nav-gate's intended authority floor, and a missing operator-capability check on the shared ITSM settings save button. None of these change the headline materially (weight-5 Adoption Friction category), but they are the kind of "does the UI actually enforce what the nav model implies" defect class worth tracking because it recurs (TB-612 through TB-616 closed the same class of gap in prior cycles). This rescore adds one further closure, **TB-619**: the Review Package detail page's findings list now surfaces an explicit "Evidence gap" signal for findings that had zero evidence refs/snippets/policy-rule citation (previously silent), plus owner/review-status rows — a small but real Correctness & Evidence Integrity gain (83→84) from a principal-architect page-hierarchy audit; the P1 rows in the same audit cluster (TB-617/618, header/CTA consolidation) remain blocked by a concurrent uncommitted edit. The gap to a higher score remains concentrated in market proof (zero completed real-mode pilots) and residual AI-depth debt: promoted fine-tuned models are registered but not yet routed into agent completion paths (TB-594 follow-up, held pending pilot signal per owner decision).

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

**Correctness & Evidence Integrity — score 84 (+1 from this file's own base pass via TB-623/624; +1 further this rescore via TB-619), weight 12, deficiency 192.** Citation contract enforced; no hallucinated policy/evidence claims found in reviewed paths. New this cycle: **TB-623** removes a `ReadAuthority` override that had let the Azure/AWS/GCP cloud-connection list endpoints be called at a lower authority tier than the nav gate implied (Readers could enumerate configured connections via direct API call even though the nav item is intentionally hidden from them) and adds `useOperateCapability()` gating to all three connector sections' mutation buttons; **TB-624** closes a matching gap on the shared ITSM settings save button. These are least-privilege/authority-consistency fixes, not evidence-fabrication fixes, but they land in this category because they close a "the UI/API says one thing, the enforced authority says another" correctness gap. This rescore adds **TB-619**: `QuickDecisionSummary` (the Review Package detail page's actual per-finding rendering) previously rendered zero visual distinction between a finding backed by evidence refs/snippets/a policy-rule citation and one with none at all — an "evidence claim vs. displayed signal disagree" gap on the evidence axis, the same defect family as TB-623/624 on the authority axis. Now an explicit "Evidence gap" `StatusTag` fires via `findingHasNoSourceEvidence`. Affects: correctness, trustworthiness, least-privilege posture, evidence-signal honesty.

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

**Not worth doing before V1:** (1) community-summarization Graph-RAG *implementation* before pilot feedback (see §17 Tier 3 for a bounded decision-only exception — an options record, not the feature); (2) iterative retrieve-critique-retry loop before G-REAL-06 signal; (3) further integration-catalog copy polish. **Diminishing returns:** RAG-V2 depth beyond shipped scope, nav/IA polish without user feedback — though see §17 Tier 3 for one bounded exception (an automated regression guard, not more manual polish). **Founder behaviors that delay validation:** more engineering before G-REAL-06; over-indexing on SOC 2 CPA (out of `(A)`). **Feels enterprise-important but may not move adoption:** fine-tuning completion routing before a pilot proves buyers want it.

## 17. Top Improvement Opportunities

**Verify-before-listing gate applied.** All six ship gates PASS; summary-table P0/P1 engineering rows through TB-624 are **Done**. §17 leads with market validation per v3 prescription. Shipped this cycle (acknowledged in one line, no tier entries): three nav-authority/label-consistency hygiene fixes found during a left-nav business-purpose review (TB-622 governance-setup-guide naming, TB-623 cloud-connections Reader-enumeration + mutation gating, TB-624 ITSM settings save-button gating). Shipped this rescore (2026-07-05, general-backlog Step 4 pick, not a §17-sourced item): **TB-619** — Review Package detail page findings now surface an explicit evidence-gap signal plus owner/review-status rows, found during a principal-architect Review Package hierarchy audit that also opened TB-617/618/620/621 (P1/P2/P3, still open — TB-617/618 blocked this pass by a concurrent uncommitted edit to their target files). Shipped last cycle (still current, not re-litigated): V1 GA connector promotion tightening (TB-599–TB-602, TB-600 OAuth including Atlassian consent UI), RAG-V2 doc-accuracy and depth items (TB-595–TB-598), multi-cloud Cost grounding (TB-603), retrieval tenant validation (TB-604), Graph-RAG posture (TB-596), nav/help/governance UX batch (TB-605–TB-616), CodeQL hardening (TB-609–TB-611).

### Closed this session (doc-drift found and fixed during V1.1/V2 backlog review)

_Added 2026-07-05, post-pass — not a re-run of the full assessment pass._

**TB-399 (buyer-facing route aliases, "manifest" → "signed-records" in URLs)** was listed in `V1_DEFERRED.md` §4 as "V1.1 backlog, not started" — but `TECH_BACKLOG.md` (the canonical source of truth) already marked TB-399 **Done (2026-06-27)**; `V1_DEFERRED.md` was simply stale. Code inspection during this review found TB-399's own "Done" status was itself slightly overstated: item 4 of its scope ("internal link migration") was incomplete — `retrieval-hit-display.ts`'s `manifestHref()` still hardcoded `/manifests/${id}` instead of the canonical `signed-records-paths.ts` helper, and two live-API E2E selectors (`live-api-trial-signup.spec.ts`, `live-api-trial-end-to-end.spec.ts`) still asserted the legacy `/manifests/` prefix. All three were fixed and verified this session (39/39 Vitest tests passing); `TECH_BACKLOG.md`, `V1_DEFERRED.md`, and `UI_ARCHITECTURE_V1_1.md` §9 updated accordingly. This is the same class of doc/reality drift the assessment flags elsewhere (§6q AWS/GCP RAG remainder corrections) — worth a systematic sweep given this is now the second instance found in one week, and this one shows drift can hide even under an already-"Done" backlog row, not just under "not started."

### Promoted to V1 this session (owner decision)

_Added 2026-07-05, post-pass, during a V1.1/V2 backlog review — owner promoted this item from V1.1 to V1 engineering scope; not a re-run of the full assessment pass._

| Title | Why it matters | Expected impact | Classification |
|-------|----------------|-----------------|----------------|
| **Next.js major upgrade (`15.5.x` → `16.x`)** | Previously V1.1 per `UI_ARCHITECTURE_V1_1.md` §8; owner promoted to V1 during backlog review — closes a two-major-version framework gap (security/bugfix currency) and removes a Windows-only webpack-build-worker workaround this repo carries | Full-stack bundler consistency (Turbopack for both dev and build), unblocks React 19 patch-floating, removes hand-rolled `next-font-manifest.json` race workaround if Turbopack build resolves it by construction | **V1 engineering — promoted from V1.1, active** |

#### Detail — Next.js major upgrade (`15.5.x` → `16.x`)

* **Affected qualities:** Runtime & First-Review Reliability (build/deploy pipeline health), Adoption Friction (dev velocity).
* **Evidence (verified in code this pass):** `archlucid-ui/package.json` pins `"next": "^15.5.18"`, `"eslint-config-next": "^15.5.18"`, and `"lint": "next lint"`. `archlucid-ui/next.config.ts` carries three bespoke touchpoints a major bump interacts with: (1) a hand-rolled `Content-Security-Policy` header block, (2) `output: "standalone"` with a documented Windows `ENOENT` trace-copy issue (`ARCHLUCID_SKIP_STANDALONE_OUTPUT` escape hatch), and (3) `disableWebpackBuildWorkerOnWindows` — a workaround for a `next-font-manifest.json` race condition that only reproduces on Windows. `UI_ARCHITECTURE_V1_1.md` §8 confirms Dependabot branches already exist under `dependabot/npm_and_yarn/archlucid-ui/next-16.2.*`, so the actual upgrade diff is available to test today, not speculative.
* **Actionability:** Yes — self-contained dependency/config PR, no feature coupling, codemod-assisted (`npx @next/codemod@latest upgrade`).
* **Design Uncertainty Reduced:** 2/10 (mechanical upgrade, not a design question). **Market Uncertainty Reduced:** 0/10 (invisible to buyers; purely engineering/operational currency).
* **Classification:** V1 engineering — promoted from V1.1 (`UI_ARCHITECTURE_V1_1.md` §8) to active V1 scope by owner decision this session, ahead of the validation-first default ordering. Low market-uncertainty-reduction score is expected and accepted for this item; owner judged framework-currency/security risk as reason enough to promote regardless of pilot signal.

**Cursor prompt:**

> **Current problem:** `archlucid-ui` is pinned to `next@^15.5.18` / `eslint-config-next@^15.5.18` with React 19 and Turbopack in dev only (`next dev --turbopack`); production builds still use webpack. Next 16 removes the built-in `next lint` command, and enforces (not just deprecates) fully-async `params`/`searchParams`/`cookies()`/`headers()` access. `next.config.ts` has custom CSP headers, `output: "standalone"`, and a Windows-only `disableWebpackBuildWorkerOnWindows` workaround for a `next-font-manifest.json` race.
>
> **Desired behavior:** Land the upgrade as a standalone PR: bump `next` and `eslint-config-next` to the current 16.2.x line (reuse the existing `dependabot/npm_and_yarn/archlucid-ui/next-16.2.*` branch as a starting diff if still available); run `npx @next/codemod@latest upgrade` and fix flagged deprecations, especially any synchronous `params`/`searchParams`/`cookies()`/`headers()` access in App Router pages, layouts, middleware, and the `/api/proxy` BFF route; replace the `"lint": "next lint"` script with a direct ESLint invocation (`eslint .` or equivalent) using the existing `eslint-config-next` flat config; re-verify the hand-rolled CSP header block and `output: "standalone"` still behave as intended (no silent header-order or trace-copy regressions); re-evaluate whether `disableWebpackBuildWorkerOnWindows` is still needed once Turbopack is the default build bundler, and remove it if the underlying race no longer reproduces on Windows. Let React 19 float to the latest patch on the same PR or immediately after.
>
> **Scope boundaries:** Dependency/config/codemod changes only — no feature work, no route/IA changes bundled into this PR. Do **not** change CSP policy intent (only adapt syntax if the codemod requires it), do **not** remove `ARCHLUCID_SKIP_STANDALONE_OUTPUT` without confirming the underlying Windows trace-copy bug is actually fixed upstream.
> * **Non-goals:** any App Router IA/navigation restructuring; any change to `/api/proxy` BFF business logic beyond async-API compliance; Tailwind or design-system changes.
>
> **Acceptance criteria:**
> - `npm run lint`, `npm run typecheck`, `npm run test` (Vitest) all pass.
> - Playwright **mock**, **operator-shell**, **visual**, and **accessibility** projects pass with no new baseline diffs (screenshot baselines re-approved only if the diff is an intentional/cosmetic Next-version artifact, not a regression).
> - `npm run build` (standalone output path, `ARCHLUCID_SKIP_STANDALONE_OUTPUT` unset) completes successfully in CI (Linux) **and** is manually verified once on a Windows dev machine given the existing Windows-specific workaround history.
> - Dev overlay no longer flags the stack as outdated relative to npm latest.
>
> **Tests to add/update:** no new test files required beyond fixing any tests broken by the async-API enforcement; update `UI_ARCHITECTURE_V1_1.md` §8 and `V1_DEFERRED.md` §4 to record the V1 promotion and closure once merged.

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
| **Automated nav-authority/label-consistency guard** (new candidate, not yet a TB row — full Cursor prompt below) | Nine instances of "sidebar label / page title / enforced authority disagree" have now been found and closed manually across two cycles (TB-612–TB-616, TB-622–TB-624) with no regression guard preventing a tenth | Would prevent recurrence of a defect class averaging ~4–5 instances per left-nav review cycle; low implementation cost (static analysis over existing typed nav-config + controller metadata) | V1 engineering — hold per validation-first ordering; revisit after G-REAL-06 or a tenth instance |
| **RAG-V2 live-model Graph-RAG ablation signal** (new candidate, not yet a TB row — full Cursor prompt below) | TB-595's ablation study is 100% hand-authored fixtures (`cases.json` + `ablation-attribution.v1.json`); the existing Phase B live-model faithfulness signal scores real exemplars but has no per-flag breakdown, so there is no live-model evidence that Graph-RAG's bounded multi-hop expansion helps | Would close half of the "offline fixtures, not live-model" gap named in §7 Decision-Changing Insight Density for Graph-RAG specifically (HyDE/query-rewrite and all live-buyer evidence remain open — see prompt Non-goals) | V1 engineering — hold per validation-first ordering; revisit after G-REAL-06 |
| **TB-398 full enterprise ITSM connector** | OAuth/field-mapping/bidirectional sync wizard | Large V2 scope | V2 — owner promotion required |
| **Community summarization Graph-RAG (RAG-V2-001) scope decision** (new candidate, added 2026-07-05 post-pass at owner request, not yet a TB row — full Cursor prompt below) | `V1_DEFERRED.md` §6q defers community summarization as V1.1/V2 remainder with no options record behind that call, unlike the bounded-multi-hop depth question TB-597 already resolved with an explicit decision; §16 lists full implementation as "not worth doing before pilot feedback" | Produces an owner-decidable options doc (implement now / defer / ablation-spike-first) without spending engineering time on the feature itself; unblocks a future TB row only if the owner explicitly pulls it forward | V1.1/V2 scope — hold; decision-only spike, not implementation |
| **Policy-pack attribution signal** (new candidate, not yet a TB row — full Cursor prompt below) | Differentiability/Defensibility (§7) is asserted narratively ("policy packs demonstrably change findings") with no measured artifact; committed exemplars carry no field distinguishing a policy-pack-sourced finding from a generic-reasoning one | Turns a narrative differentiability claim into a measured per-scenario percentage; complements (does not duplicate) the existing gate-outcome-flip demo in `POLICY_PACK_DELTA_DEMO_SCRIPT.md` | V1 engineering — hold per validation-first ordering; revisit after G-REAL-06 |
| **Policy-pack compounding-evidence ledger** (new candidate, not yet a TB row — full Cursor prompt below) | `IPolicyPackChangeLogRepository` already records append-only rule-version history per pack/tenant, but nothing joins it against historical run findings to show whether a pack's newer version would have caught something an older version missed | Would give the "gets more valuable over time" moat claim in §13 an empirical basis instead of a narrative one | V1 engineering — hold per validation-first ordering; revisit after G-REAL-06 |
| **Surface the tamper-evident manifest-verify endpoint in buyer-facing material** (new candidate, not yet a TB row — full Cursor prompt below) | `GET /v1/artifacts/runs/{runId}/export/verify` (TB-307) already recomputes the export-manifest hash against the `ManifestGenerated` audit anchor, but no demo script, pitch doc, or proof packet tells a technical evaluator they can call it themselves | Converts an already-shipped tamper-evidence capability into a buyer-verifiable differentiability claim at ~zero engineering cost (docs/demo-script only) | V1 engineering (docs) — hold per validation-first ordering; low cost enough to consider before G-REAL-06 if the owner wants it in the pilot packet |

_No Tier 1 or Tier 2 in-contract engineering gates remain open._

#### Tier 3 detail — Wire promoted fine-tuned deployments into agent completion routing (TB-594 follow-up)

_Added 2026-07-05, post-pass, at owner request — code-verified against the same source tree the pass inspected; not a new assessment pass._

* **Affected qualities:** AI/Agent Readiness, Decision-Changing Insight Density.
* **Evidence (verified in code):** `IFineTunedModelRegistry.TryGetActiveAsync(Guid tenantId, CancellationToken)` (`ArchLucid.Retrieval/FineTuning/Registry/IFineTunedModelRegistry.cs`) returns a `FineTunedModelRegistryEntry` with a non-null `PromotedUtc` once `GoldenCohortFineTuningPromotionGate` approves a manifest-fine-tuned model, but nothing outside `ArchLucid.Retrieval/FineTuning/*` consults it. `AzureOpenAiCompletionClient` / `AzureOpenAiCompletionClientCache` (`ArchLucid.AgentRuntime`) resolve their Azure OpenAI deployment name independently of the registry — every agent completion uses the statically configured base deployment even for a tenant with an active, promoted fine-tune.
* **Actionability:** Yes — additive routing seam behind the existing `FineTuning.ManifestConsent` tenant flag (default disabled) and the existing promotion gate; inert for any tenant that has not opted in.
* **Design Uncertainty Reduced:** 3/10 (the plumbing itself is well-understood; the open question is whether buyers want manifest-tuned completions at all). **Market Uncertainty Reduced:** 0/10.
* **Classification:** V1 engineering, held to Tier 3 — per §16, this "feels enterprise-important but may not move adoption" before a pilot proves buyers want fine-tuned completions. The fail-open design means shipping the plumbing now carries low regression risk if the owner chooses to unhold it ahead of G-REAL-06.

**Cursor prompt:**

> **Current problem:** `IFineTunedModelRegistry.TryGetActiveAsync` (`ArchLucid.Retrieval/FineTuning/Registry/IFineTunedModelRegistry.cs`) returns the tenant's promoted fine-tuned deployment once `GoldenCohortFineTuningPromotionGate` approves a manifest-fine-tuned model, but nothing in `ArchLucid.AgentRuntime` (`AzureOpenAiCompletionClient`, `AzureOpenAiCompletionClientCache`, `IAgentCompletionClient`) ever reads it — agent completions always use the statically configured base deployment name, even for a tenant with an active, promoted fine-tune.
>
> **Desired behavior:** Add a routing seam — e.g. `IAgentCompletionDeploymentResolver` — that `AzureOpenAiCompletionClientCache` consults before building/caching a client for a tenant: if `FineTuningOptions.Enabled` is true, the tenant's `FineTuning.ManifestConsent` is granted, and `IFineTunedModelRegistry.TryGetActiveAsync` returns a promoted entry, use that entry's Azure OpenAI deployment name; otherwise fall back to the existing default deployment. Fail-open on any resolver error (log + fall back to default), matching the existing heuristic-fallback pattern in `AgenticRetrievalCompletionClient`. Invalidate any cached client for a tenant when `IFineTunedModelRegistry.RollbackActiveAsync` fires.
>
> **Scope boundaries:** Routing plumbing only. Do **not** change `GoldenCohortFineTuningPromotionGate`'s promotion criteria, do **not** change the default-disabled posture of `FineTuning.ManifestConsent`, do **not** add a new UI surface. Behavior must be byte-for-byte identical to today for every tenant that has not opted into fine-tuning consent.
> * **Non-goals:** live pilot validation of fine-tuned completion quality (requires G-REAL-06 signal per §16); UI for selecting/previewing a fine-tuned model; changes to `AzureOpenAiFineTuningJobOrchestrator`.
>
> **Acceptance criteria:**
> - A tenant with `FineTuning.ManifestConsent` enabled and a promoted registry entry gets agent completions routed to that entry's deployment name; a tenant without consent or without a promoted entry is unaffected.
> - Resolver failure (registry unavailable, malformed entry) falls back to the default deployment and logs a warning — never throws into the completion path.
> - `RollbackActiveAsync` immediately stops routing to the rolled-back deployment for new completions (cache invalidation, not just TTL expiry).
>
> **Tests to add/update:** new resolver unit tests mirroring `OnlineFineTuningOrchestrationServiceTests` / `FineTuningTestFixtures`; `AzureOpenAiCompletionClientCache` tests for opted-in, opted-out, and rollback paths; update `TECH_BACKLOG.md` TB-594's row and `V1_DEFERRED.md` §6q RAG-V2-003 remainder column to reflect closure.

#### Tier 3 detail — Automated nav-authority/label-consistency guard

* **Affected qualities:** Adoption Friction, Correctness & Evidence Integrity.
* **Evidence:** `TECH_BACKLOG.md` TB-612, TB-613, TB-614, TB-615, TB-616, TB-622, TB-623, TB-624 — all closed via manual left-nav business-purpose review, all the same defect shape (nav-declared authority/label vs. actual enforced authority/page copy disagree). `archlucid-ui/src/lib/nav-authority.ts`'s own doc comment states the UI-side tests (`authority-seam-regression.test.ts`, `authority-execute-floor-regression.test.ts`, `nav-config.structure.test.ts`) check *internal* nav-config consistency only — none of them cross-check a `NavLinkItem.requiredAuthority` against the actual `[Authorize(Policy=...)]` (or authority-gate attribute) on the ASP.NET controller the link routes to, which is exactly the class of gap TB-623 found.
* **Actionability:** Yes — additive test/lint, no product-behavior change.
* **Design Uncertainty Reduced:** 4/10. **Market Uncertainty Reduced:** 0/10.
* **Classification:** V1 engineering, held to Tier 3 — does not move any of the five ranked outcomes as directly as G-REAL-06; fix-on-discovery cost has been consistently low (all nine prior instances closed same-day as found).

**Cursor prompt:**

> **Current problem:** `archlucid-ui/src/lib/nav-config.ts` declares a `requiredAuthority` (`ReadAuthority`/`ExecuteAuthority`/`AdminAuthority`) per `NavLinkItem`, and the ASP.NET controller behind that route declares its own authority independently via `[Authorize(Policy=...)]` (or a class-level default). Nothing cross-checks the two. Separately, a page's own `<h1>`/`OperatorPageHeader` title and any inline links pointing at it are hand-typed independently of the sidebar label for the same href. Both drift classes have shipped to production nine times (TB-612–616, TB-622–624), caught only by ad hoc manual review.
>
> **Desired behavior:** Two additive CI-enforced checks, not a new authorization engine:
> 1. A build-time or test-time check that, for every `NavLinkItem` with an `href` matching a known controller route, the link's `requiredAuthority` is `>=` the authority implied by that controller's `[Authorize]` policy for its primary (usually `GET`) action — flagging when the nav gate is *looser* than the enforced backend authority (the TB-623 shape) or unexpectedly stricter without a documented reason.
> 2. A snapshot-style test that, for a curated set of top-level operator pages, asserts the page's own heading/title text matches (or is an approved alias of) its `nav-config` sidebar label — reusing the pattern already established by `operator-nav-labels.test.ts` / `pilot-nav-group-builder.test.ts`, extended to cover pages beyond the ones TB-606/TB-612/TB-622 already fixed.
>
> **Scope boundaries:** Test/CI-layer additions only (TypeScript test files under `archlucid-ui/src/lib/`, optionally a small Python/PowerShell script under `scripts/ci/` if cross-repo — C# controller + TS nav-config — comparison is easier outside Vitest). Do **not** change any controller's actual `[Authorize]` policy, do **not** change any existing nav label or page title as part of this task (that is a separate, TB-numbered fix if the new check finds a live drift), and do **not** build a general-purpose authorization framework — this is a drift *detector*, the API remains the authoritative enforcement point per `nav-authority.ts`'s existing documented boundary.
> * **Non-goals:** replacing or duplicating server-side `[Authorize]` enforcement; catching every possible copy inconsistency (only sidebar-label-vs-page-title, and nav-authority-vs-controller-authority); redesigning `nav-config.ts`'s shape.
>
> **Acceptance criteria:**
> - New check fails CI if a `NavLinkItem`'s `requiredAuthority` is looser than its target controller's enforced authority (reproduces the TB-623 shape as a red test when reverted).
> - New check fails CI if a covered page's rendered heading text diverges from its `nav-config` sidebar label without an explicit allow-listed alias (reproduces the TB-606/TB-612/TB-622 shape as a red test when reverted).
> - Existing `authority-seam-regression.test.ts`, `authority-execute-floor-regression.test.ts`, and `nav-config.structure.test.ts` continue to pass unmodified.
> - False-positive rate on the current (already-fixed) nav-config is zero — the new check passes cleanly on `master` as of TB-624.
>
> **Tests to add/update:** new `archlucid-ui/src/lib/nav-authority-controller-parity.test.ts` (or equivalent); extend `operator-nav-labels.test.ts` coverage list; if a cross-language (TS↔C#) comparison is needed, add a small `scripts/ci/check_nav_authority_controller_parity.py` invoked from the existing UI lint/test CI job rather than a new pipeline stage.

#### Tier 3 detail — RAG-V2 live-model Graph-RAG ablation signal

* **Affected qualities:** Decision-Changing Insight Density, AI/Agent Readiness.
* **Evidence (verified in code this pass):** `GraphRagNeighborExpander.cs` already stamps Graph-RAG-added hits with `SourceType = "KnowledgeGraphNodeNeighbor"` — a genuine runtime attribution marker distinguishing graph-expansion hits from base-index hits (`PlatformDoc`, `Manifest`, `PolicyPackRule`, etc.). However, the committed `tests/eval-corpus/agent-results/*.real.json` exemplars that feed the existing Phase B live-model faithfulness signal (verified: `corpus-real-mode-smoke.real.json`) carry only `claims`/`findings`/`citations`/`semanticScore` — **no retrieval-hit-level data at all today** — so this is a genuine capture-schema gap, not a "just read existing data" task. By contrast, HyDE and query-rewrite (`AgenticRetrievalQueryExpander.cs`) each produce a single modified `EmbedText` used for **one** vector search — there is no separate, additively-tagged hit subset the way Graph-RAG has, so those two flags cannot be ablated from already-captured single-pass data; a genuine live ablation for them would require re-invoking live Azure OpenAI once per flag combination per scenario, which is materially more expensive and is explicitly out of scope for this item.
* **Actionability:** Yes, for the Graph-RAG slice only — schema + capture-wiring + script change, no retrieval-algorithm change.
* **Design Uncertainty Reduced:** 6/10 (tells us whether bounded multi-hop Graph-RAG demonstrably helps on real model output, not just hand-authored fixtures). **Market Uncertainty Reduced:** 1/10 (does not touch live-buyer evidence).
* **Classification:** V1 engineering, held to Tier 3 per validation-first ordering.

**Cursor prompt:**

> **Current problem:** TB-595's retrieval ablation study (`scripts/ci/retrieval_ablation_profiles.py`, `tests/eval-datasets/faithfulness-golden/cases.json`, `ablation-attribution.v1.json`) computes "positive-readiness Δ vs. all-on" entirely from hand-written fixture text and a hand-maintained hit-to-feature attribution map — zero model calls occur anywhere in that harness. Separately, `scripts/ci/run_rag_live_model_faithfulness_signal.py` (Phase B) scores genuinely captured real-mode exemplars for base faithfulness (currently PASS, p50 0.72 vs. 0.65 floor) but does not break that score down per advanced-retrieval flag, because the exemplar JSON shape carries no retrieval-hit data.
>
> **Desired behavior:** Extend the real-mode exemplar capture (wherever `tests/eval-corpus/agent-results/*.real.json` files are produced/curated) to optionally include a `retrievalHits` array per exemplar (`chunkId`, `sourceType`, `corpusKind`, `score` — mirroring the existing `RetrievalHit` shape), then extend the Phase B live-model script to: (a) compute the existing base faithfulness score as today, and (b) additionally recompute it with any hit whose `sourceType == "KnowledgeGraphNodeNeighbor"` filtered out, reporting a Graph-RAG-specific "Δ vs. all-on" alongside the existing p50/floor numbers in `rag-live-model-faithfulness-summary.md`.
>
> **Scope boundaries:** Graph-RAG (`EnableGraphRag`) ablation only. Do **not** attempt HyDE or query-rewrite ablation in this task — flag them explicitly as a separate, larger follow-up requiring repeated live-model invocation per scenario (see Non-goals). Do **not** change `GraphRagNeighborExpander`'s actual expansion behavior. Do **not** require every existing `*.real.json` exemplar to gain hit data immediately — a subset (even a handful) is enough to produce a first live-model signal; missing-hit-data exemplars should be skipped with a clear log line, not treated as a failure.
> * **Non-goals:** HyDE ablation, query-rewrite ablation, any new live Azure OpenAI invocation as part of this task (this only changes what gets *captured/exported* the next time a real-mode exemplar is authored, plus the offline scoring script), live-buyer validation of any kind.
>
> **Acceptance criteria:**
> - `rag-live-model-faithfulness-summary.md`/`.json` gains a Graph-RAG ablation row (or a clearly-labeled "insufficient data" state when zero exemplars carry `retrievalHits`) without breaking the existing p50/floor/adversarial-ceiling reporting.
> - At least one committed `*.real.json` exemplar is updated to carry a realistic `retrievalHits` array (including at least one `KnowledgeGraphNodeNeighbor`-sourced hit) as a worked example / fixture for the new code path.
> - `run_rag_live_model_faithfulness_signal.py` and `eval_agent_corpus.py` unit/contract tests continue to pass unmodified for exemplars without `retrievalHits`.
>
> **Tests to add/update:** extend whatever test module already covers `run_rag_live_model_faithfulness_signal.py` (add a case with and without `retrievalHits`); update `docs/quality/faithfulness-report.md`/`rag-live-model-faithfulness-summary.md` generation tests if a golden-file assertion exists on their exact contents; note the new capability in `docs/go-to-market/DEEPER_RAG_QUALITY_PROGRAM.md` Phase B row.

#### Tier 3 detail — Community summarization Graph-RAG (RAG-V2-001) scope decision

_Added 2026-07-05, post-pass, at owner request — a decision-only spike, deliberately not the feature itself; §16 keeps full implementation on the Stop Doing List._

* **Affected qualities:** AI/Agent Readiness, Decision-Changing Insight Density, Differentiability.
* **Evidence:** `V1_DEFERRED.md` §6q (RAG-V2-001 row) lists community summarization as V1.1/V2 remainder, deferred at the same time TB-597 pulled bounded multi-hop traversal into V1 (2026-07-03) — but unlike that traversal-depth question, no ADR-style options record exists comparing implement-now vs. defer vs. ablation-spike-first for community summarization specifically. `GraphRagProductionLikeConfigurationLint.cs`'s own "unproven without a production vector index" verdict applies to the same graph a community-summarization layer would sit on, so any options doc must weigh that risk explicitly.
* **Actionability:** Yes, for the decision record only — no feature code.
* **Design Uncertainty Reduced:** 2/10 (clarifies scope; does not itself improve retrieval quality). **Market Uncertainty Reduced:** 0/10.
* **Classification:** V1.1/V2 scope, held per §16 Stop Doing List — this row stays a decision-only spike. Do **not** schedule feature implementation from this Tier 3 row without a separate, explicit owner scope-pull-forward decision (mirroring how TB-597 was decided).

**Cursor prompt:**

> **Current problem:** `V1_DEFERRED.md` §6q defers community summarization for Graph-RAG (RAG-V2-001) to V1.1/V2 with no options analysis behind that call, unlike the bounded-multi-hop depth question, which TB-597 resolved with an explicit owner decision record. `GraphRagProductionLikeConfigurationLint.cs` already flags the shipped bounded-multi-hop feature as "unproven without a production vector index"; a community-summarization layer sits on the same graph and would inherit that same unproven-quality risk, plus added indexing/LLM-summarization cost.
>
> **Desired behavior:** Produce a short ADR-style options document (new file under `docs/architecture/adrs/` or an addendum to ADR 0036) comparing: **(a)** implement community detection (e.g. Leiden/Louvain over the existing provenance graph) plus hierarchical LLM summarization now and pull it into V1 scope; **(b)** keep it deferred to V1.1/V2 as currently scoped; **(c)** run a small ablation-only spike (mirroring TB-595's methodology) to estimate quality lift before committing to full implementation. Each option must state cost (indexing pipeline changes, incremental Azure OpenAI summarization spend, freshness/invalidation burden as the graph changes), the "unproven without a production vector index" risk already carried by the shipped bounded-multi-hop feature, and expected impact on §3 AI/Agent Readiness and §13 differentiability — with explicit trade-offs and constraints, not general best-practice statements.
>
> **Scope boundaries:** Decision document only. Do **not** implement community detection, summarization, or any new indexing pipeline as part of this task. Do **not** change `GraphRagNeighborExpander`, `GraphRagBoundedNeighborCollector`, or any DI wiring.
> * **Non-goals:** any code change to Graph-RAG retrieval behavior; a production vector-index upgrade (a separate, larger prerequisite implied by the existing config lint); live pilot validation.
>
> **Acceptance criteria:**
> - New/updated ADR document exists with the three options above, each with an explicit recommendation and reasoning (trade-offs, constraints, expected impact).
> - `V1_DEFERRED.md` §6q RAG-V2-001 row and `TECH_BACKLOG.md` gain a cross-reference to the new decision record.
> - If the owner picks option (a), the ADR's "next steps" section is concrete enough to seed a new, separately-scoped TB row (mirroring TB-597's own follow-up) — but authoring that follow-up TB row is explicitly out of scope for this task.
>
> **Tests to add/update:** none (documentation-only task); update `docs/library/V1_SCOPE.md` §2.20 cross-reference if the ADR changes the RAG-V2-001 scope description.

#### Tier 3 detail — Policy-pack attribution signal

_Added 2026-07-05, post-pass, at owner request._

* **Affected qualities:** Differentiability/Defensibility, Decision-Changing Insight Density.
* **Evidence (verified in code):** `ExplainabilityTrace.RulesApplied` (`ArchLucid.Contracts/Findings/ExplainabilityTrace.cs`) is populated per finding today — e.g. `ComplianceFindingEngine.cs` sets `RulesApplied = [violation.RuleId]` — but nothing distinguishes whether a given rule id traces back to a **tenant-assigned, versioned policy-pack rule** (`PolicyPackVersion`) vs. a built-in/generic finding-engine rule. §13's differentiability claim ("policy packs demonstrably change findings") is asserted narratively and demonstrated only as a **gate-outcome flip** (`POLICY_PACK_DELTA_DEMO_SCRIPT.md` Phase B) — no script or committed exemplar computes "what percentage of this scenario's findings trace to a policy-pack rule" as a measured number.
* **Actionability:** Yes — additive read-side aggregation over already-populated data (`RulesApplied` + `PolicyPackVersion` rule sets); no finding-engine or policy-evaluation change required.
* **Design Uncertainty Reduced:** 3/10 (turns a narrative claim into a measured one; does not change what the product does). **Market Uncertainty Reduced:** 0/10.
* **Classification:** V1 engineering, held to Tier 3 per validation-first ordering; revisit after G-REAL-06.

**Cursor prompt:**

> **Current problem:** `ExplainabilityTrace.RulesApplied` is populated per finding (e.g. `ComplianceFindingEngine.cs`, `PolicyCoverageFindingEngine.cs`, `PolicyApplicabilityFindingEngine`), but no code path classifies a given `RulesApplied` entry as "sourced from a tenant-assigned policy-pack rule" vs. "generic finding-engine reasoning." The differentiability claim in §13 of this assessment ("policy packs demonstrably change findings") is currently proven only via the gate-outcome-flip demo (`POLICY_PACK_DELTA_DEMO_SCRIPT.md` Phase B), not via a measured per-scenario attribution percentage.
>
> **Desired behavior:** Add a read-side aggregation (e.g. `PolicyPackAttributionSignalCalculator`) that, given a run's findings snapshot and the tenant's currently resolved `PolicyPackVersion` rule set (reuse `IPolicyPackChangeLogRepository` / existing policy-pack resolution services for the rule-id lookup), computes: total findings, count whose `RulesApplied` contains at least one rule id present in an assigned policy pack's rule set, and the resulting percentage. Emit this as a new field on the existing scenario/eval reporting surface (mirror how `TB-595`'s `retrieval_ablation_profiles.py` reports a measured percentage rather than a narrative claim) and/or a new `scripts/ci/policy_pack_attribution_signal.py` producing a markdown + JSON summary across the eval corpus.
>
> **Scope boundaries:** Read-side aggregation only. Do **not** change `RulesApplied` population logic in any finding engine, do **not** change policy-pack resolution/evaluation behavior, do **not** touch `POLICY_PACK_DELTA_DEMO_SCRIPT.md`'s existing gate-outcome-flip demo (this is a complementary, not replacement, signal).
> * **Non-goals:** live-buyer validation of whether attribution percentage matters to purchase decisions; changing which rules exist in bundled or tenant policy packs.
>
> **Acceptance criteria:**
> - New calculator/script reports, for at least the existing golden/eval corpus scenarios, a measured "% of findings attributable to a policy-pack rule" number (not narrative prose).
> - Zero policy-pack-rule findings in a scenario reports `0%` explicitly rather than omitting the scenario.
> - Output does not require live Azure OpenAI calls (pure aggregation over already-captured `RulesApplied` + policy-pack rule-set data).
>
> **Tests to add/update:** new unit tests for the calculator covering zero-attribution, partial-attribution, and full-attribution findings sets; if a script is added, a CI contract test mirroring the pattern used for `retrieval_ablation_profiles.py`.

#### Tier 3 detail — Policy-pack compounding-evidence ledger

_Added 2026-07-05, post-pass, at owner request._

* **Affected qualities:** Differentiability/Defensibility, Governed Review Integrity.
* **Evidence (verified in code):** `IPolicyPackChangeLogRepository` (`ArchLucid.Core/Persistence/Ports/IPolicyPackChangeLogRepository.cs`) already exposes `GetByPolicyPackIdAsync`, `GetByTenantAsync`, and `GetByTenantInRangeAsync` over an append-only `PolicyPackChangeLogEntry` history — real, persisted rule-version history exists (`DapperPolicyPackChangeLogRepository`, `InMemoryPolicyPackChangeLogRepository`, both with contract tests). Nothing joins that version history against historical run findings snapshots to show whether a **newer** pack version would have caught something an **older** version missed — the "gets more valuable over time" moat claim in §13 is currently narrative, not empirical.
* **Actionability:** Yes — additive read-side replay/diff over existing data (change log + historical findings snapshots + the existing policy-evaluation engine used for dry-runs); no schema or write-path change.
* **Design Uncertainty Reduced:** 3/10 (turns a moat narrative into an empirical ledger; does not change enforcement behavior). **Market Uncertainty Reduced:** 0/10.
* **Classification:** V1 engineering, held to Tier 3 per validation-first ordering; revisit after G-REAL-06.

**Cursor prompt:**

> **Current problem:** `IPolicyPackChangeLogRepository` records append-only rule-version history per pack/tenant, but no code path replays an **older** policy-pack version against a **historical** run's findings snapshot and diffs it against the **newer** version's rule set to show incremental catches. The "compounds in value over time" differentiability claim (§13) has no empirical ledger backing it, unlike the gate-outcome-flip demo which does have one (`POLICY_PACK_DELTA_DEMO_SCRIPT.md`).
>
> **Desired behavior:** Reuse the existing dry-run policy evaluation path (`POST /v1/governance/policy-packs/{policyPackId}/dry-run`, already used by `POLICY_PACK_DELTA_DEMO_SCRIPT.md` Phase C) to evaluate two versions of the same policy pack (an older version pulled from `IPolicyPackChangeLogRepository`'s history, and the current version) against the **same** historical run id, and diff the resulting findings/gate outcomes. Produce a "compounding-evidence ledger" entry (JSON + Markdown) per pack/tenant showing: rule-set delta between versions, findings the newer version catches that the older version did not, and any gate-outcome change on that historical run. A `scripts/ci/policy_pack_compounding_evidence_ledger.py` (or `.ps1`, matching `demo-policy-pack-delta.ps1`'s pattern) can drive this via the existing dry-run endpoint.
>
> **Scope boundaries:** Read-side replay/diff only, reusing the existing dry-run evaluation path. Do **not** add a new policy-evaluation engine, do **not** mutate any policy-pack assignment or version data, do **not** require re-running the original agent/finding pipeline — replay is against the **already-captured** historical findings snapshot's underlying evidence, via dry-run re-evaluation.
> * **Non-goals:** live-buyer validation that this ledger changes purchase decisions; automatic scheduling/cron of ledger generation (a manual/CI-triggered script is sufficient for this task).
>
> **Acceptance criteria:**
> - For at least one pack with 2+ recorded versions in the change log and one historical run, the ledger reports a concrete delta (even if the delta is "no incremental findings caught" — that is a valid, honestly-reported result, not a failure).
> - Ledger output cites specific finding ids and rule ids, not just aggregate counts, so a sponsor/architect can verify the claim.
> - No mutation of any persisted policy-pack, assignment, or findings-snapshot data occurs during ledger generation.
>
> **Tests to add/update:** new tests for the ledger-generation logic covering a pack with no version delta (empty ledger, not an error) and a pack with a rule added between versions (non-empty ledger); extend `PolicyPackChangeLogRepositoryContractTests` fixtures if a new query method is added to `IPolicyPackChangeLogRepository`.

#### Tier 3 detail — Surface the tamper-evident manifest-verify endpoint in buyer-facing material

_Added 2026-07-05, post-pass, at owner request._

* **Affected qualities:** Differentiability/Defensibility, Correctness & Evidence Integrity.
* **Evidence (verified in code and docs):** `GET /v1/artifacts/runs/{runId}/export/verify` (`ArtifactExportController.cs` line 347, `IRunExportLineageVerifier`, TB-307, ADR 0040) is shipped and returns `Match` / `Mismatch` / `NotAttested` by recomputing the export-manifest hash against the `ManifestGenerated` audit anchor. It is already referenced once in `docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md` (operator/internal runbook, line 330) — but not in any buyer-facing demo script, pitch document, or proof-packet section that tells a technical evaluator they can call the endpoint themselves during a live evaluation, unlike the policy-pack gate-outcome-flip demo which has a dedicated buyer-facing script (`POLICY_PACK_DELTA_DEMO_SCRIPT.md`).
* **Actionability:** Yes, at ~zero engineering cost — docs/demo-script only, no code change; the endpoint already works.
* **Design Uncertainty Reduced:** 1/10 (pure surfacing of an already-shipped capability). **Market Uncertainty Reduced:** 1/10 (only matters if a technical evaluator asks a tamper-evidence question during a real evaluation).
* **Classification:** V1 engineering (docs) — hold per validation-first ordering; low cost enough to consider before G-REAL-06 if the owner wants it in the pilot packet, consistent with the "manifest-verify docs item" already flagged as pilot-packet-ready in §18/§20.

**Cursor prompt:**

> **Current problem:** `GET /v1/artifacts/runs/{runId}/export/verify` (TB-307, ADR 0040) already recomputes the export-manifest hash against the committed `ManifestGenerated` audit anchor and returns a `Match` / `Mismatch` / `NotAttested` verdict, but the only existing reference to it is one line in the internal `FIRST_PILOT_EVIDENCE_BUNDLE.md` operator runbook. No buyer-facing demo script, pitch deck talking point, or proof-packet section shows a technical evaluator the literal HTTP call they can make themselves to verify a sponsor packet's integrity.
>
> **Desired behavior:** Add a short, self-contained demo section (either a new `docs/go-to-market/TAMPER_EVIDENT_EXPORT_VERIFY_DEMO.md` mirroring the structure of `POLICY_PACK_DELTA_DEMO_SCRIPT.md`, or a new "Phase F — Tamper-evident verify" section appended to an existing buyer-facing doc if more appropriate) showing: (1) the exact `GET /v1/artifacts/runs/{runId}/export/verify` request/response shape (reuse `RunExportLineageVerificationResponse`'s actual fields), (2) a one-line talk track ("you don't have to trust our export — recompute the hash yourself against the committed audit anchor"), and (3) a pointer from `FIRST_PILOT_EVIDENCE_BUNDLE.md`'s existing line 330 reference to the new buyer-facing doc. If low-cost, also add the verify-call result into `collect-first-pilot-proof.ps1`'s sponsor packet output so it appears without an extra manual step (only if this does not require new pipeline plumbing beyond calling an endpoint that's already part of the committed-run evidence bundle flow).
>
> **Scope boundaries:** Documentation and (optionally) proof-pipeline wiring to an **existing** endpoint only. Do **not** change `IRunExportLineageVerifier`, `ArtifactExportController`, or the export-manifest hash format. Do **not** claim WORM/immutable-storage guarantees — ADR 0040 explicitly scopes this as application-layer hash lineage, not storage-tier immutability; demo copy must preserve that distinction.
> * **Non-goals:** any new verification capability; changes to `EVIDENCE_IMMUTABILITY.md`'s existing scope statements beyond adding a cross-reference.
>
> **Acceptance criteria:**
> - New (or extended) buyer-facing doc shows a runnable `GET .../export/verify` example with real field names from `RunExportLineageVerificationResponse` (`status`, `runId`, `manifestId`, `committedManifestHash`, `recomputedManifestHash`, `detail`).
> - Demo copy explicitly states the "application-layer hash lineage, not WORM/immutable storage" distinction from ADR 0040 — no over-claiming.
> - `FIRST_PILOT_EVIDENCE_BUNDLE.md` cross-references the new buyer-facing doc from its existing line-330 mention.
>
> **Tests to add/update:** none required for a docs-only change; if proof-pipeline wiring is added, extend whatever test already covers `collect-first-pilot-proof.ps1`'s committed-run evidence bundle contents.

## 18. Prompt Batching Guidance

**First batch (human-only):** G-REAL-06 pilots, M-07 screenshots, M-09 deploy, M-16 video. **Second batch (human-led):** M-19 demos, M-20 objection log. **Third batch (engineering, hold):** TB-594 fine-tuning routing, the nav-authority/label-consistency guard, the RAG-V2 live-model Graph-RAG ablation signal, the policy-pack attribution signal, the policy-pack compounding-evidence ledger, and the manifest-verify docs surfacing — only after pilot signal, except the manifest-verify docs item, which is low-cost enough to fold into the G-REAL-06 pilot packet directly if the owner wants it sooner. **Exception (no pilot dependency):** the community-summarization Graph-RAG scope-decision spike is documentation-only and can run whenever the owner wants the V1 vs. V1.1/V2 question resolved.

## 19. Model Usage Guidance

**Composer-safe:** M-17 list formatting, M-09 deploy checklist, G-REAL-07 script verification, a first draft of the nav-authority/label-consistency lint if picked up, the manifest-verify docs surfacing (docs-only). **Sonnet-safe:** outreach personalization drafts, the policy-pack attribution signal and compounding-evidence ledger scripts (bounded, well-specified data-aggregation tasks), the fine-tuned-deployment completion-routing seam (bounded, well-specified plumbing task), the community-summarization Graph-RAG scope-decision options doc (bounded research/writing task). **Opus-recommended:** M-20 objection synthesis into strategic positioning.

## 20. Pending Questions For Later

* **Blocks V1 (owner):** none newly identified — in-contract engineering gates closed.
* **Requires customer validation:** whether buyers probe retrieval depth vs governance value (G-REAL-06).
* **Requires founder decision:** whether to pick up TB-594 fine-tuning routing before or after first pilot; whether the nav-authority/label-consistency guard is worth a dedicated TB row now or only after a tenth instance; whether the policy-pack attribution signal, compounding-evidence ledger, and manifest-verify docs surfacing are worth dedicated TB rows now (all three are new candidates this pass, none yet promoted) — the manifest-verify docs item in particular is low-cost enough that the owner may want it ahead of the other Tier 3 items regardless of pilot timing; whether to greenlight the fine-tuned-deployment completion-routing seam ahead of G-REAL-06 given its fail-open, opt-in-only design; whether to run the community-summarization Graph-RAG scope-decision spike now (no pilot dependency) or leave community summarization deferred as-is.

---

# Appendix A — Author Signal (qualitative, non-headline)

Real principal-architect judgment shows in: policy-pack-driven pre-commit gate, disposition-aware ROI that does not falsely sum per-system rows, honest `groundingMissing` when retail-price lookup misses, complete OAuth consent for enterprise ITSM without overstating connector maturity beyond shipped conformance tests, and — this cycle — closing a real least-privilege gap (TB-623) the moment a review surfaced it rather than deferring it. The recurring nature of the nav-authority/label-consistency defect class (nine instances, two cycles) is itself informative: each instance is closed cheaply and correctly, which speaks well of execution discipline, but the absence of a standing automated guard for a well-understood, mechanically-checkable defect class is a process gap worth naming honestly rather than quietly re-fixing forever.

---

Central question: **Does ArchLucid turn frontier AI into a governed, policy-aware, audit-ready enterprise architecture review system that changes decisions and earns repeat use?** Yes for governed/repeatable/audit-trail — with strong engineering evidence. Not yet proven for decision-changing insight in live buyer settings; G-REAL-06 is the fastest path to answer that.
