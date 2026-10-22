> **Scope:** External-skeptic question series ("top 20 questions to ask Grok about ArchLucid") — questions, detailed grounded answers, and resulting backlog dispositions. Internal strategy/assessment document; not buyer-facing.

> **Spine doc:** [`../START_HERE.md`](../START_HERE.md).

# Grok top-20 external-skeptic Q&A — answers and backlog (2026-07-27)

**Audience:** Owner and GTM/engineering contributors preparing adversarial validation sessions with an external frontier model (Grok or equivalent), and anyone triaging the resulting gaps.

**Method:** Each question is answered from repo-grounded evidence (`V1_SCOPE.md`, `POSITIONING.md`, `COMPETITIVE_POSITIONING.md`, `CORE_PILOT.md`, trust-center, and backlog history), written the way a well-informed external skeptic would answer it — steelman first, then the honest counter. Each question closes with a **Backlog disposition**: existing rows that already cover the gap, plus any **new proposed items (GQ-01…GQ-08)** listed in §22.

**Backlog handling note (working-tree safety):** `docs/library/TECH_BACKLOG_OPEN.md` and `docs/go-to-market/GTM_BACKLOG.md` carry unstaged owner edits as of this session's baseline, so no rows were added to those files. Proposed items use interim **GQ-** IDs; the owner should assign canonical **TB-** / **M-** IDs when transcribing (next free IDs were **TB-1559** / **M-288** at time of writing — verify before assigning).

**Scope guards honored (do not re-open):**
- **M-44 / M-90 / M-91 / M-92** (live cohorts, dry-runs, procurement rehearsal, ITSM pilot-readiness) stay on the **GTM V1.1 backlog** — referenced below where relevant, never proposed as engineering work.
- **SOC 2 CPA / third-party pen test:** tech rows **TB-135** / **TB-136** are Done (tracking closed); owner execution remains **G-REAL-05** / **G-ASSURANCE-02**. No new assurance-program items are proposed.

---

## Part A — Differentiation and the "why not just Claude?" problem

### 1. Steelman "ArchLucid adds nothing over Claude + pasted standards" — then the strongest counter

**Steelman.** A principal architect with Claude/GPT and a prompt library gets 80% of the analytical content: findings, risks, cost commentary, compliance observations. The chat is faster to start, costs ~$30/month, requires no procurement, and the architect trusts their own judgment as the quality gate. Every individual ArchLucid output — a finding, a cost note, a diagram critique — can be approximated in a chat session. If the deliverable is "smart observations about my architecture," raw frontier AI is sufficient and ArchLucid is overhead.

**The strongest counter.** The chat session produces *analysis*; it cannot produce a *defensible record*. What ArchLucid ships that a chat structurally cannot: (a) a **finalized, signed architecture package** (golden manifest) with a stable identity that can be compared across reviews with structured deltas; (b) an **append-only typed audit trail** binding evidence → finding → manifest → export, so six months later "why did we approve this?" has a queryable answer; (c) **segregation-of-duties approvals and pre-finalize gates** that a solo chat cannot enforce on itself; (d) **replay/compare across model versions** so the decision record survives model retirement. The honest framing (per `POSITIONING.md` §0): the buyer hires ArchLucid for the **architecture package**, not the prose. Where the counter is weak: teams that never face audit, governance, or "prove what changed" questions genuinely don't need it — and that's a qualification criterion, not an objection to argue with.

**Backlog disposition:** Covered — **M-243/M-244 + TB-1365/TB-1366** (why-not-ChatGPT/Copilot talk track with live evidence anchors), **M-42** (beats-ChatGPT synthesis gate), **M-245/M-246** (elevator pitch vs shipped V1). New: **GQ-01** (pipeline-vs-single-model ablation, §22) supplies the missing *quantitative* leg of this answer.

### 2. What proof would make a skeptic believe it beats "frontier model + good prompt"?

**Answer.** Four proofs, in ascending strength:
1. **Blind output comparison** — same architecture brief through ArchLucid and through a strong single-model prompt; independent architects score finding quality, evidence traceability, and actionability without knowing the source. (Cohort-based versions of this are GTM V1.1 — see scope guard.)
2. **Ablation evidence** — the multi-agent pipeline (Topology, Cost, Compliance, Critic) versus one strong model with the same context, measured on the golden corpus. If the pipeline doesn't measurably lift finding precision or coverage, the differentiation claim must retreat to governance/audit only — which is defensible but must be claimed honestly.
3. **A record the chat can't fake** — show a two-review compare with structured deltas, a blocked self-approval, and an audit export answering "who approved what on which evidence." A skeptic can verify these in minutes and cannot reproduce them in a chat.
4. **Survival proof** — same review replayed after a model version change with the committed manifest intact (AOAI retirement claim-map territory, **M-273/M-274**).

The skeptic's bar is *"show me something I can verify, not something you assert"* — proofs 3 and 4 are shippable today; proofs 1–2 need instrumentation.

**Backlog disposition:** Proofs 3–4 covered by **M-273/M-274**, **M-174/M-175** (comparison/replay immutable snapshot), **G-REAL-06/G-REAL-07** (committed real-mode runs + proof packets). Proof 2 is new: **GQ-01**. Proof 1 stays GTM V1.1 (**M-44/M-90**) — not pulled forward.

### 3. Rank the differentiators by defensibility against frontier-model commoditization (18 months)

**Answer — most to least defensible:**
1. **Append-only typed audit trail bound to committed manifests.** Commoditization-proof: it's a data/governance property, not an intelligence property. A smarter model doesn't erase the need for a tamper-evident decision ledger; if anything it increases it.
2. **Versioned review comparison (two-review compare, structured deltas, replay).** Requires stable artifact identity over time — a stateless chat can't accrete this, and the moat compounds with each committed review a customer runs.
3. **Segregation-of-duties approvals + pre-finalize gates + policy packs.** Durable as workflow, but adjacent vendors (GRC suites, ServiceNow) could bolt equivalent gates onto their own AI. Defensibility rests on being architecture-artifact-native rather than ticket-native.
4. **Exportable proof packages for exec/procurement audiences.** Moderately defensible — the packaging discipline matters, but frontier models are rapidly improving at document assembly. The durable part is that exports cite the sealed evidence chain, not that they're well-formatted.
5. **Evidence-linked findings from the multi-agent pipeline.** *Least* defensible as raw capability — single-model quality is the fastest-moving commodity. Defensible only in its fail-closed provenance discipline (**M-207/M-208**): findings that refuse to assert without evidence anchors, which is a product policy, not model IQ.

Strategic implication: messaging weight should keep shifting from "our analysis is smarter" to "our record is defensible" — which `POSITIONING.md` §0 (evidence-package-first) already codifies.

**Backlog disposition:** Covered — **M-160/M-161** (append-only/sealed evidence), **M-174/M-175**, **M-207/M-208**, **M-154/M-155** (evidence→finding→manifest→artifact→audit chain honesty). New: **GQ-03** (commoditization watch ledger, §22) makes this ranking a maintained artifact instead of a one-shot judgment.

### 4. If a frontier vendor ships a native "architecture review mode" tomorrow — what survives?

**Answer.** **Survives:** the governed system of record. A frontier vendor's review mode would be a *better chat*, not a *decision ledger* — it would still lack tenant-scoped SoD approvals, committed manifest identity, cross-review deltas, append-only audit export, policy-pack gating, and the customer-run Azure extractor posture (no vendor tenant access, per trust-center). Enterprise procurement also moves slower than model releases; a vendor-operated governed service with a trust packet retains a lane. **Becomes worthless (or near-):** any residual "our findings are smarter than raw AI" claim; per-finding analytical quality as a headline; possibly the Critic agent's value-add if the base model self-critiques as well. **At risk in between:** the multi-agent pipeline's *architecture* — it survives only if the ablation evidence (GQ-01) shows measurable lift, or if it's honestly repositioned as a provenance/explainability mechanism (each agent's trace is an evidence anchor) rather than an intelligence multiplier. The correct pre-positioning is already in the repo's direction of travel: sell the package, the gates, and the ledger; treat model quality as a replaceable component (which replay/re-lock, **M-273**, already assumes).

**Backlog disposition:** Covered by the evidence-package-first vocabulary rule (`POSITIONING.md` §0, Done TB-738–TB-747) and **M-243/M-245**. New: **GQ-03** institutionalizes the quarterly re-check.

---

## Part B — Buyer skepticism and dismissal triggers

### 5. First thing in a 15-minute demo that makes a skeptical principal architect close the tab

**Answer.** Ranked by likelihood:
1. **Generic findings on the sample review.** If the first finding shown could have come from any LLM ("consider multi-region for availability"), the architect concludes "wrapper around GPT" and leaves. The first-15-minutes surface must lead with something chat can't do: the evidence link on a finding, the compare delta, or a blocked approval.
2. **Governance chrome before value.** Gates, approvals, and policy-pack config shown before a single insightful finding reads as governance theater (their pre-existing suspicion — see `ASSESSMENT_PROMPT_SERIES.md` persona: "skeptical of governance theater").
3. **Over-claiming.** Any hint of "AI approves your architecture" or Simulator-derived numbers presented as customer outcomes triggers instant distrust (`WHAT_NOT_TO_PROMISE` territory, **M-239/M-240**, **M-138/M-139**).
4. **Empty/confusing first surface.** Dead ends, zero-state theater, engineering vocabulary leaking into buyer surfaces — the large P0 UX cluster in `TECH_BACKLOG_OPEN.md` exists precisely because owner screenshot reviews kept scoring buyer surfaces ~40–60/100.

**Backlog disposition:** Covered — **M-180/M-181 + TB-1030/TB-1031** (first-15 decision signal, narration-free package spine), **M-239/M-240 + TB-1343/TB-1344** (over-promise matrix), the open P0 surface-quality clusters, and **M-259/M-260** (`/live-demo` see-it ladder). Live dismissal-cohort validation is **M-44** — **GTM V1.1, owner-directed only; intentionally not proposed here.** No new items.

### 6. What distinguishes governance theater from governance that reduces risk?

**Answer.** Theater is governance whose outputs nobody consumes and whose gates never bind. Distinguishing tests a buyer can apply:
- **Can the gate actually block?** ArchLucid's pre-finalize gates and SoD (self-approval blocked) are enforced in the finalize path, not advisory decoration — and the block-vs-advisory semantics per gate are a claim-honesty item (**M-172/M-173**).
- **Is the evidence chain load-bearing?** Real: findings that fail closed when provenance is missing (**M-207**). Theater: confidence scores rendered as UI ornaments with no behavioral consequence.
- **Does the record survive adversarial questions?** Real: append-only audit with ordering/causality guarantees (**M-284/M-285**), offline-verifiable exports (**M-267**). Theater: an "audit log" that's a mutable app table.
- **Does anyone return to the artifact?** The honest structural test: if no downstream decision ever cites the package, the governance was ceremonial regardless of product quality. This is a pilot-design question — the Core Pilot scorecard should capture "package cited in a real decision" as a success signal.

ArchLucid's exposure: the *mechanisms* are real, but every place UI copy implies more bindingness than shipped behavior is a theater accusation waiting to happen — hence the honesty-CI pattern across the M-series.

**Backlog disposition:** Covered — **M-172/M-173 + TB-1022/TB-1023**, **M-207/M-208**, **M-284/M-285**, **M-267/M-268**. New: **GQ-02** adds the one missing consumable: gate-outcome evidence (how often gates actually blocked/were waived) in pilot-facing exports.

### 7. Why do EA tools fail to earn voluntary senior-architect return visits — and does ArchLucid escape?

**Answer.** Historical EA failure modes: (a) **the tool serves the org chart, not the architect** — data entry benefits a central EA team while the architect gets nothing back; (b) **stale-by-default repositories** — value depends on continuous curation nobody funds; (c) **output nobody asks for** — catalogs and heat maps that don't feed a real decision; (d) **process tax** — the tool adds steps to a workflow that already worked. Architects return voluntarily to tools that give *them* leverage in *their next meeting*.

ArchLucid's escape hatches: it's **transaction-shaped, not repository-shaped** (a review is a bounded job with an output, not a catalog to maintain), and the output is the architect's own weapon — a sponsor-ready evidence package for the meeting where they defend their design. It inherits the risk anyway if: the first review takes too long to reach a genuinely useful finding; repeat use isn't materially easier than first use (the repeat-review loop and compare must carry the return visit — **TB-1394–TB-1398**, **M-241/M-242**); or exports need manual rework before an exec can see them. The honest metric is **unforced second review started**, which the Core Pilot happy-path work already targets.

**Backlog disposition:** Covered — **M-241/M-242 + TB-1355–TB-1359** (Core Pilot happy path / stickiness), repeat-review-loop and compare help clusters. No new items.

### 8. What objections will a CISO and procurement raise about a vendor-operated service ingesting architecture diagrams?

**Answer.** CISO objections, roughly in order: (1) **data sensitivity** — architecture diagrams and cost exports are a target map of the enterprise; where is it stored, encrypted, tenant-isolated, and who at the vendor can read it; (2) **LLM data handling** — does customer evidence train models, what does Azure OpenAI retain, is there a data-processing addendum; (3) **tenant isolation depth** — logical filters vs structural isolation (the repo's own DiD claim-map series, **M-213/M-255**, exists because this question has teeth); (4) **vendor access posture** — answered comparatively well by the extractor design: customer-run PowerShell packaging + upload, no tenant-wide reader granted to ArchLucid (Tier 1); (5) **assurance artifacts** — SOC 2, pen test, incident response. Procurement adds: solo-vendor viability, contract terms, data return/deletion on exit, subprocessor list, insurance.

The honest posture (per **M-190/M-191** minimum trust packet and **M-196/M-197** assurance talk track): lead with what's structurally true — self-assessment, owner pen test, append-only evidence, extractor posture, subprocessor transparency — and never imply CPA attestation or third-party pen-test publication that doesn't exist. Buyer friction from absent artifacts is a `(B)` procurement-realism topic, tracked as owner execution (**G-REAL-05**, **G-ASSURANCE-02**).

**Backlog disposition:** Covered — **M-190/M-191 + TB-1112/TB-1113**, **M-196/M-197 + TB-1144/TB-1145**, **M-213/M-214**, **M-255/M-256**, trust-center. New: **GQ-04** (vendor-viability/continuity objection pack) covers the one procurement objection with no dedicated row: solo-vendor continuity, data return, and offboarding guarantees.

---

## Part C — Competitive landscape

### 9. Map the 2026 field — where is the unoccupied ground?

**Answer.** Four occupied quadrants: **EA repositories** (LeanIX, Ardoq) own portfolio inventory and rationalization — object model is applications and surveys, not finalized decision packages. **Developer portals** (Backstage) own the service catalog — org-wide adoption but no architecture-decision artifact. **Modeling tools** (Structurizr, C4 tooling) own diagram-as-code — version history is repo-shaped, no governance or evidence semantics. **Raw LLMs + internal prompt libraries** own ad-hoc analysis — fast, cheap, no record. **GRC/ITSM suites** own generic approval workflow — tickets, not architecture artifacts.

The unoccupied ground ArchLucid claims: **the governed decision-proof loop** — structured request → evidence-linked findings → finalized, comparable, auditable architecture package → export/ITSM handoff. No incumbent's object model natively produces "here is the signed proof of what we decided, on what evidence, and what changed since last review." The two-sided risk: EA vendors can add AI findings to their inventory (they're closer to the data), and LLM vendors can add persistence (they're closer to the intelligence). The defensible center is the **artifact contract** — which is why manifest identity, compare semantics, and audit export deserve the engineering weight they're getting.

**Backlog disposition:** Covered — `COMPETITIVE_POSITIONING.md` / `COMPETITIVE_LANDSCAPE.md`, **M-186/M-187 + TB-1055/TB-1056** (deal-loss heuristic). New: **GQ-03** keeps the map refreshed.

### 10. Is "system of insight feeding the EA system of record" durable, or a euphemism for "not important enough"?

**Answer.** It's durable *if and only if* the insight artifact is load-bearing in a decision the system of record merely files. The dismissive reading ("nice-to-have sidecar") wins when ArchLucid outputs are informational; the durable reading wins when the architecture package is the thing an ARB, an auditor, or a sponsor actually requires before proceeding — at which point "system of record" for *inventory* and "system of proof" for *decisions* are different jobs and the positioning is honest, not modest. Precedent: observability tools never became the CMDB and never needed to. The bake-off framing already codifies this (`BAKEOFF_15MIN_LOSER_SEQUENCE.md` beats 12–14: explicit non-claim — EA/portfolio is SoR, ArchLucid is the system of insight that feeds it), which takes EA suites out of the bake-off rather than fighting them. Watch item: if pilots show packages being produced but never *required* by any downstream gate, the euphemism reading is empirically true and positioning must change — that's the same "package cited in a real decision" signal from Q6.

**Backlog disposition:** Covered — **M-261/M-262 + TB-1456/TB-1457** (bake-off loser sequence), `BAKEOFF_15MIN_LOSER_SEQUENCE.md`. No new items.

### 11. What's the realistic pricing ceiling when the alternative is a $30/month AI subscription?

**Answer.** Wrong denominator: the alternative isn't the subscription, it's **subscription + the architect-hours to assemble a defensible package manually + the risk cost of an undefended decision**. A senior architect spending 1–3 days per review packaging evidence at $150–250/hr loaded cost puts $1,200–$6,000 of labor behind every manually produced package — the value anchor is there, not at $30. Realistic bands: per-package or per-review pricing in the low hundreds sustains against the labor anchor; platform pricing in the low-thousands/month sustains only where governance is *mandatory* (regulated industries, formal ARB processes) because compliance-driven purchases price against audit risk, not convenience. Hard ceiling: whatever a buyer would pay a consultancy for the same proof pack, discounted for self-service. The current known pricing incoherence — Team bundle undercutting the Recommended Professional tier on every per-unit axis — is already an owner decision row (**M-200**) with the implementing engineering row (**TB-1166**). One caution the skeptic would add: any tier that prices *analysis* rather than *proof* will be arbitraged against raw AI within a year.

**Backlog disposition:** Covered — **M-200** (owner repricing decision) + **TB-1166–TB-1170**, `PRICING_PHILOSOPHY.md`. No new items.

---

## Part D — Technical claims

### 12. Multi-agent pipeline vs one strong model + structured prompt — when does the pipeline earn its complexity?

**Answer.** Known multi-agent failure modes: error cascade (one agent's hallucination becomes downstream ground truth), latency/cost multiplication, inter-agent contract drift, and debugging opacity. A single strong model with a structured prompt avoids all four and — on raw analytical quality — closes the gap a little more with each model generation. The pipeline earns its complexity in exactly three circumstances: (1) **provenance decomposition** — separate agents produce separately attributable evidence traces (Topology's claims vs Cost's claims), which is what makes fail-closed, per-finding provenance (**M-207**) tractable; (2) **independent adversarial pass** — a Critic with a genuinely different objective function catches what self-critique inside one context window doesn't; (3) **enforceable per-domain contracts** — schema-validated outputs per agent give the decisioning layer something to gate on. Note all three are *governance* justifications, not *intelligence* justifications. The honest engineering posture: keep the pipeline where it feeds provenance and gating; be ready to collapse stages that show no measured lift — and today that measurement doesn't exist, which is the gap.

**Backlog disposition:** Partially covered — **M-203/M-204 + TB-1196/TB-1197** (agent→decisioning variance isolation), **M-211/M-212** (shared hallucination defense plane), **M-247/M-248** (AgentTask leak seams). New: **GQ-01** — golden-corpus ablation benchmark (pipeline vs single-model baseline) so "the pipeline earns its cost" is a measured claim.

### 13. How much should a buyer trust AI-generated compliance findings? What validation would a skeptic demand?

**Answer.** Trust should be **calibrated, bounded, and advertised as such**. Plausible error profile: false positives from over-literal rule matching (flagging compensating-control situations), false negatives from evidence gaps (can't flag what wasn't uploaded — the dominant risk, since absence of evidence reads as absence of problems), and framework-mapping errors (real issue, wrong control citation). A skeptic demands four things: (1) **published precision numbers per policy pack** against a labeled corpus — the golden corpus (30+ decisioning cases) is the right instrument, but its pass rates aren't currently surfaced as a buyer-consumable calibration statement; (2) **fail-closed provenance** — no finding without an evidence anchor (**M-207**, in flight); (3) **explicit evidence-coverage disclosure** — the package must state what evidence was *not* available, so false-negative risk is visible; (4) **human accountability preserved** — which ArchLucid already claims correctly (`COMPETITIVE_POSITIONING.md`: evidence and structured outputs, human approval remains). The product's honest ceiling: findings are decision-*support* with a documented error profile, never delegated sign-off — and every pack description implying "certification" is a claim-honesty violation (**M-235** already guards pack-as-certification).

**Backlog disposition:** Covered — **M-207/M-208**, **M-209/M-210 + TB-1228/TB-1229** (faithfulness/support-ratio lane), **M-235/M-236** (policy-pack evaluation + no pack-as-certification), nightly faithfulness gate (**G-FAITH-01**). New: **GQ-02** — buyer-safe finding-quality calibration report from golden-corpus results (precision/coverage per pack + evidence-coverage disclosure in exports).

### 14. What must an evidence trail provide to survive an audit — and can an AI product produce it or only decorate it?

**Answer.** Audit survival requires five properties: **completeness** (every input that influenced the decision is captured), **immutability** (tamper-evident after finalization), **attribution** (who/what asserted each element, human vs model), **temporal integrity** (ordering and causality reconstructable — "was the approval before or after the evidence changed?"), and **independent verifiability** (checkable outside the vendor's own UI). ArchLucid produces — not merely decorates — four of the five by construction: append-only typed events with SQL-level enforcement, sealed evidence on finalize, typed attribution, and the offline-verifiable export path (**M-267**). The two honest caveats: (a) **completeness is bounded by intake** — the trail proves what the system saw, not that the system saw everything; an auditor probes exactly there, so evidence-coverage disclosure (Q13) is part of audit survival, not a nice-to-have; (b) **ordering/causality guarantees must be exactly as strong as claimed** — which is why the ordering-and-causality claim map (**M-284/M-285**, opened this week) exists. "Decoration" is the right accusation for products whose audit log is an afterthought table; it's the wrong accusation here, provided the claim language never outruns the enforcement.

**Backlog disposition:** Covered — **M-160/M-161 + TB-1009/TB-1010**, **M-284/M-285 + TB-1550/TB-1551**, **M-267/M-268 + TB-1488/TB-1489**, **M-269/M-270** (backup/restore vs append-only). No new items.

### 15. Terraform generation without apply/destroy — feature or admission the output can't be trusted?

**Answer.** Both readings contain truth, and the feature reading wins only if stated precisely. **Feature:** never executing against customer environments is a genuine security and blast-radius boundary — no standing credentials, no vendor-caused outage class, clean procurement story; it aligns with the extractor's no-tenant-access posture and is a deliberate scope constraint, not a missing feature (`V1_SCOPE.md` IaC constraints). **Admission:** "advisory" also hedges output quality — generated Terraform may not be apply-ready, and pretending otherwise would be an over-claim. The skeptic's trap is a demo where emitted Terraform doesn't even `terraform validate`: at that point "advisory" reads as "decorative." The defensible position: (1) label honestly — *advisory, reviewed-by-your-team, never executed by us* (already the shipped constraint); (2) hold emitted samples to a mechanical floor — syntactic validity and plan-ability against an empty state in CI — so advisory means "you own the apply decision," not "we don't stand behind the output." The parallel drift-authority work (**M-233/M-234**) covers ArchLucid's *own* infrastructure Terraform; the emitted-artifact quality floor is the uncovered half.

**Backlog disposition:** Partially covered — **M-233/M-234 + TB-1317/TB-1318** (own-infra Terraform authority). New: **GQ-05** — CI quality gate (`terraform validate` / empty-state plan) on emitted advisory Terraform samples + label-honesty audit on every surface describing the emit path.

---

## Part E — Market timing and strategy

### 16. Is 2026 early, late, or on time for governed AI architecture review?

**Answer.** **On time, leaning early — and early is the survivable side.** Three conditions had to become true, and their state today: (1) *AI findings good enough that governing them matters* — true as of roughly 2024–25; before that, there was nothing worth auditing. (2) *Enterprises treating AI-assisted decisions as audit-relevant* — becoming true now; EU AI Act enforcement, internal AI-usage policies, and auditor attention to AI-in-the-loop decisions are creating the compliance pull this category needs. (3) *Architecture decisions specifically getting formal AI governance* — not yet universal; this is where "early" bites, and why some sales conversations require category education rather than category selection. Being early costs longer sales cycles; being late would have meant incumbents (EA suites, GRC platforms) already owning the "governed AI review" checkbox. The category-existence condition to watch: if enterprises conclude that ungoverned AI architecture advice is fine (no audit findings, no incidents traced to it), the governance premium collapses. Current regulatory direction points the other way. Timing risk is therefore mostly *pacing* risk — solvable by the pilot-led motion already chosen — not *existence* risk.

**Backlog disposition:** Strategy context — no engineering items warranted. Feeds owner narrative rows (**M-245/M-246**). New: monitored via **GQ-06** leading indicators (§22).

### 17. What kills the deal: missing SOC 2 CPA, no named references, or vendor-viability fear — and cheapest credible mitigations?

**Answer.** For a small vendor selling into regulated enterprises, ranked by kill frequency: (1) **Vendor-viability fear** kills most often and earliest — it's the objection buyers rarely voice; they just go quiet. Cheapest credible mitigation: a continuity pack — contractual data-return/deletion guarantees, documented offboarding with offline-verifiable exports (the **M-267** path is exactly the right primitive), source/data escrow terms on request, and honest single-founder disclosure paired with bus-factor mitigations. (2) **Missing SOC 2 CPA attestation** kills at security review, but is the most *deflectable*: a strong self-assessment, the trust-center posture, the minimum pilot trust packet (**M-190/M-191**), and the honest assurance talk track (**M-196/M-197**) convert many "no SOC 2, no meeting" positions into "acceptable for a bounded pilot." Owner execution of the CPA program remains **G-REAL-05** (GTM, owner calendar) — engineering-side tracking is closed and is not re-opened here. Same shape for third-party pen test (**G-ASSURANCE-02**). (3) **No named references** kills expansion more than pilots — mitigated by buyer-safe evidence rows and proof packets (**G-REAL-07**) until named references exist. Per assessment scope rules, none of these absences reduce `(A)` readiness; they are `(B)` procurement-realism friction.

**Backlog disposition:** Covered — **M-190/M-191**, **M-196/M-197 + TB-1144/TB-1145**, **G-REAL-05 / G-ASSURANCE-02** (owner execution, status unchanged), reference-capture docs. New: **GQ-04** — vendor-viability/continuity objection pack (the one unaddressed leg).

### 18. What should a bounded pilot measure so the result is undeniable?

**Answer.** Undeniable means: **baseline captured before, counterfactual visible, metric owned by the buyer.** The design that achieves it: (1) **Time-to-defensible-package** — hours from evidence intake to a finalized package the sponsor accepts, against the buyer's own stated baseline for manual packaging (captured in writing before the pilot starts, or the comparison will be disputed after). (2) **Finding acceptance rate** — of findings surfaced, how many did the buyer's architects judge material and act on; this separates "impressive output" from "useful output." (3) **Unforced second review** — did the team start another review without vendor prompting (the voluntary-return signal from Q7). (4) **Governance event evidence** — at least one gate or SoD approval exercised on a real decision, exported and shown to the sponsor (proves the governance is used, not toured). (5) **Sponsor citation** — the package appears in a real decision forum. Anti-patterns that make results deniable: metrics defined mid-pilot, Simulator-derived numbers in the readout (**M-138** forbid), and success framed as feature coverage rather than outcome. The existing Core Pilot + `PILOT_SUCCESS_SCORECARD.md` structure carries most of this; live dry-run cohort validation of the 90-minute first-review claim remains **M-90** (GTM V1.1, not pulled forward).

**Backlog disposition:** Covered — `CORE_PILOT.md`, `PILOT_SUCCESS_SCORECARD.md`, **G-REAL-06/G-REAL-07**, **M-241/M-242**. **GQ-02**'s gate-outcome evidence feeds measure (4). No other new items.

---

## Part F — The kill shots

### 19. Three most likely reasons ArchLucid is dead in two years, with leading indicators

**Answer.**
1. **Commoditization outruns the governance premium** (most likely). Frontier vendors ship persistent, project-aware review experiences; buyers decide an informal record is good enough outside regulated niches. *Leading indicator (first to appear):* pilot architects praising findings but not exercising compare/governance/audit — engagement telemetry showing the differentiated surfaces cold while chat-equivalent surfaces are warm. That pattern says the moat isn't being used, 12+ months before it says so in revenue.
2. **Sales-cycle asphyxiation** (close second for a solo vendor). The governed-review sale needs security review + procurement + sponsor alignment; with vendor-viability fear (Q17) stretching each cycle, runway expires before repeatability is proven. *Leading indicator:* pilot-to-paid conversion stalling specifically at procurement (not at product satisfaction), and median deal age growing quarter over quarter.
3. **Trust incident or honesty failure** (lower probability, highest severity). One materially wrong compliance finding relied on in a real decision, one over-claim exposed in diligence, or a tenant-isolation flaw — for a product whose entire premise is defensible evidence, a single credibility break is terminal in a way it isn't for a productivity tool. *Leading indicator:* claim-honesty CI findings trending up rather than down, or any pilot dispute about what the product asserted vs delivered. The repo's unusually heavy claim-honesty machinery is the correct hedge; its output should be watched as a risk metric, not just a task queue.

**Backlog disposition:** Individual hedges exist across the M-series honesty rows. Missing piece is consolidation: **GQ-06** — owner kill-risk register with these leading indicators and a review cadence, so the earliest signals have a designated place to land.

### 20. The strongest honest case *against* buying ArchLucid — and what evidence would change it

**Answer.** **The honest anti-pitch:** "Don't buy this if your organization doesn't yet have a forcing function for defensible architecture decisions. If no auditor, regulator, ARB, or sponsor ever demands proof of what you decided and why, you are paying for governance you won't exercise — use a frontier model for analysis and a wiki for notes, and revisit when the forcing function arrives. Also don't buy if you can't accept Azure-aligned hosting, if you need a CMDB/system-of-record, or if you want slides-only engagement — the product says all of this about itself." That case is strong precisely because it's true, and the repo already commits to it (`COMPETITIVE_POSITIONING.md` "When ArchLucid is not the right tool", `BUYER_PERSONAS.md` not-a-fit anchors). **Evidence that changes the mind:** (1) a real forcing function appearing (audit finding, new regulatory exposure, a deal lost to undefended architecture); (2) measured pilot deltas on time-to-package and finding acceptance against the buyer's own baseline; (3) demonstrated proof-chain in the buyer's context — their evidence, their gate, their export, verified offline. Strategic note: the anti-pitch is a *sales asset* — a vendor that disqualifies honestly earns the trust that the entire evidence-first positioning depends on, and it should be one consolidated, buyer-visible surface rather than scattered qualifier paragraphs.

**Backlog disposition:** Substantially covered — not-a-fit sections + **M-239/M-240** (over-promise matrix). New: **GQ-07** — consolidate the disqualification criteria into one buyer-facing "when not to buy" surface with a drift guard, so the honest anti-pitch is a deliberate artifact.

---

## 22. Consolidated proposed backlog items (GQ-01 … GQ-08)

Interim IDs pending owner transcription into `TECH_BACKLOG.md` / `GTM_BACKLOG.md` (both had unstaged owner edits at session baseline — see handling note at top). Suggested priorities follow existing conventions (P1 unless noted). None re-open Done rows; none pull V1.1 GTM rows (M-44/M-90/M-91/M-92, G-REAL-05, G-ASSURANCE-02) forward.

| GQ ID | Target | Title | Sourced from | Depends on / complements | Est. shape |
|-------|--------|-------|--------------|---------------------------|------------|
| **GQ-01** | TB (eng) | **Pipeline-vs-single-model ablation benchmark** — run golden-corpus decisioning cases through (a) the full Topology/Cost/Compliance/Critic pipeline and (b) a single-model structured-prompt baseline; score finding precision, coverage, and provenance completeness; publish a buyer-safe summary. Retreat differentiation claims to governance-only wherever lift is not shown. | Q1, Q2, Q4, Q12 | Complements **M-243/M-244**, **M-203/M-204**; feeds **M-42** synthesis gate. Simulator-first; one bounded Real-mode run within cohort budget cap. | Medium (harness + scoring + report) |
| **GQ-02** | TB (eng) | **Finding-quality calibration + governance-outcome evidence in exports** — surface per-policy-pack precision/coverage from golden-corpus results as a buyer-consumable calibration statement; add evidence-coverage disclosure ("evidence not available") and gate-outcome counts (blocked/waived) to package exports. | Q6, Q13, Q18 | Complements **M-207/M-208**, **M-209/M-210**, **M-235/M-236**; does not claim semantic faithfulness beyond the scoring lane. | Medium |
| **GQ-03** | M (GTM) | **Commoditization watch ledger** — quarterly re-test of the "frontier model + good prompt" baseline against the differentiator ranking in Q3; record which claims survived, retreated, or died; update **M-243** talk track and positioning accordingly. | Q3, Q4, Q9 | Complements **M-243/M-244**, **M-245/M-246**; consumes **GQ-01** results when available. | Small recurring (~1–2 h/quarter) |
| **GQ-04** | M (GTM) | **Vendor-viability / continuity objection pack** — buyer-safe one-pager: data return/deletion guarantees, offline-verifiable export offboarding path, escrow-on-request terms, honest single-founder disclosure + bus-factor mitigations. No CPA/pen-test implications. | Q8, Q17 | Complements **M-190/M-191**, **M-196/M-197**, **M-267/M-268**; does not touch **G-REAL-05**/**G-ASSURANCE-02** status. | Small (~2–4 h) |
| **GQ-05** | TB (eng) | **Advisory Terraform emit quality gate** — CI floor for emitted advisory Terraform samples: `terraform validate` + plan against empty state; label-honesty audit of every surface describing the emit path (advisory = customer owns apply decision, not "unvetted output"). | Q15 | Complements **M-233/M-234** (own-infra authority — distinct scope); honors V1 no-apply/no-destroy constraint. | Small–medium |
| **GQ-06** | M (GTM, owner) | **Kill-risk register with leading indicators** — the three Q19 risks (commoditization, sales-cycle asphyxiation, trust incident) with their earliest measurable indicators (differentiated-surface engagement, procurement-stage stall rate, honesty-CI trend) and a monthly review cadence. | Q16, Q19 | Consumes existing telemetry/CI outputs; no new engineering unless an indicator lacks a source. | Small (~1–2 h setup, ~30 m/month) |
| **GQ-07** | M (GTM) + small TB | **Consolidated "when not to buy" buyer surface** — merge the not-a-fit qualifiers (`COMPETITIVE_POSITIONING.md`, `BUYER_PERSONAS.md`) into one buyer-visible disqualification checklist; Vitest/honesty drift guard so qualifiers stay in sync with scope. | Q20 | Complements **M-239/M-240**; follows existing honesty-CI pattern. | Small |
| **GQ-08** | — (no new row) | **Explicitly-not-proposed marker** — live cohort comparisons, procurement rehearsals, dry-run cohorts, and ITSM pilot-readiness remain **M-44 / M-90 / M-91 / M-92** on the GTM V1.1 backlog; SOC 2 CPA and third-party pen test remain **G-REAL-05 / G-ASSURANCE-02** owner execution. Recorded so future readers of this Q&A do not re-derive them as gaps. | Q2, Q5, Q17, Q18 | — | — |

---

## Related

- [`../go-to-market/COMPETITIVE_POSITIONING.md`](../go-to-market/COMPETITIVE_POSITIONING.md) — positioning statement and capability matrix grounding Part A/C answers.
- [`../go-to-market/POSITIONING.md`](../go-to-market/POSITIONING.md) — evidence-package-first vocabulary (§0) underpinning Q1/Q3/Q4.
- [`../assessments/ASSESSMENT_PROMPT_SERIES.md`](../assessments/ASSESSMENT_PROMPT_SERIES.md) — the principal-architect skeptic persona these questions mirror; Grok answers can be diffed against prior GPT-based assessment output.
- [`../CORE_PILOT.md`](../CORE_PILOT.md), [`../go-to-market/PILOT_SUCCESS_SCORECARD.md`](../go-to-market/PILOT_SUCCESS_SCORECARD.md) — pilot measurement (Q18).
- [`GROK_Q21_40_QUESTIONS_QA_BACKLOG_2026_07_27.md`](GROK_Q21_40_QUESTIONS_QA_BACKLOG_2026_07_27.md) — second batch (Q21–Q40) + GQ-09–GQ-18.
- `docs/library/TECH_BACKLOG.md` / [`../go-to-market/GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) — canonical destinations for GQ-01…GQ-07 once transcribed.
