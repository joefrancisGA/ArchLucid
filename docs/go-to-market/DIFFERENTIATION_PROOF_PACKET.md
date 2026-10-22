> **Reviewed:** 2026-08-03

> **Scope:** Buyer-safe differentiation proof — manual review vs generic AI vs ArchLucid V1 outputs — plus the model-seats counter-positioning message test (formerly `MODEL_SEATS_COUNTER_POSITIONING_TEST.md`) and the generic-AI / frontier bakeoff protocol (formerly the body of `GENERIC_AI_BAKEOFF_PROTOCOL.md`; that filename remains a path-stable alias).

# Differentiation proof packet

**Audience:** Evaluators, sponsor sponsors, and sales engineers answering "why not generic AI or a consultant checklist?"

**Last reviewed:** 2026-07-27

**Bakeoff protocol:** [`#generic-ai-bakeoff-protocol`](#generic-ai-bakeoff-protocol) (`GENERIC_AI_BAKEOFF_PROTOCOL.md` alias).

---

## What ArchLucid produces that generic AI does not

| Capability | Manual review / checklist | Generic AI assistant | ArchLucid V1 |
| --- | --- | --- | --- |
| Finalized architecture package | Sometimes informal | No durable package | **Yes** — SQL-backed package/manifest id + audit trail |
| Repeatable export package | Ad hoc slides/docs | Chat transcript | **Sponsor packet** + first-value report + proof ZIP |
| Governance gate before finalize | Process-dependent | None | **Policy packs** + dry-run + optional BlockCommitOnCritical |
| Evidence refs per finding | Often missing | Hallucination risk | **Evidence refs** + retrieval grounding traces |
| Provenance / explain | Variable | Opaque | **Explainability trace** + evidence-chain view |
| ROI basis labels | Anecdotal | Unsupported savings claims | **Buyer-provided / Defaulted / Demo-derived / Not collected** |
| Audit trail | Email / tickets | None | **`AuditEvents`** + correlation ids |
| Procurement posture | Custom each time | None | **Trust Center** + procurement pack (self-assessment; not CPA attestation) |

Evidence links: [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) · [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) · [`trust-center.md`](trust-center.md)

---

## Objection: "Proof of what, exactly?" {#objection-proof-of-what}

**The objection (verbatim, from skeptical principal architects and design authorities):** *"In my world, proof means the system behaved correctly under load, in an audit, or in an incident. A signature on a manifest proves the review happened, not that the architecture is sound."*

**Response — two parts, in order:**

1. **Concede the scope, precisely.** Quote the canonical proof-scope statement from [POSITIONING.md §5 "What proof means here"](POSITIONING.md#what-proof-means-here): ArchLucid proves that a rigorous, evidence-linked architecture review happened — who reviewed what, against which policy packs, with which findings, confidence limits, and explicit non-conclusions where evidence was missing. It does not prove the architecture will perform under load, in an audit, or in an incident. It proves the decision can be defended with evidence.
2. **Reframe against the real alternative.** The comparison is not ArchLucid vs. runtime validation — it is **proof of diligence vs. no record**. Today's manual review proves nothing at all: decisions live in meetings and email, and when a regulator asks "who reviewed this design and what did they find?", the honest answer is often "we are not sure." ArchLucid's claim is narrow and checkable, and the status quo cannot make it.

**Skeptic vocabulary (use verbatim, per [POSITIONING.md §2](POSITIONING.md#2-three-value-pillars)):** the two shipped proof points are the **audit chain** (evidence → finding → decision → manifest linkage; replayable reasoning trail, not a cryptographic ledger claim) and the **signed architecture package** (hash-verified and tamper-evident at the manifest level — never imply a PKI certificate). Do not blend them into one claim or restate them loosely.

**Boundary:** never counter this objection by widening the proof claim toward soundness, production readiness, or security posture of the reviewed system — see [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#proof-scope-boundary`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#proof-scope-boundary) (CI-enforced).

---

## Evidence-linked comparison

| Capability | ArchLucid evidence | Generic AI review narrative |
| --- | --- | --- |
| Committed-run provenance | `provenance-references.json` and audit IDs in the sponsor packet | Often ad hoc screenshots |
| ROI scope labels | Server-authoritative, disposition-aware savings labels | Unlabeled estimates |
| Claim boundary | [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) and real-mode evidence gate | Implicit or overstated |
| Retrieval grounding | Committed-run `retrieval-grounding.json` traces | Opaque citations |
| Release evidence | `release-evidence-bundle-manifest.json` profiles | Manual checklists |
| Tenant isolation | Database-per-tenant catalogs, classification matrix, and architecture tests | Varies / not evidenced |

Evidence links: `archlucid sponsor-packet <runId>` · `scripts/Emit-ReleaseReadinessEvidence.ps1` · [`trust-center.md`](trust-center.md) · [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md).

## Comparison matrix (evidence-linked)

| Question | Where to verify in V1 |
| --- | --- |
| Did the review commit to a durable artifact? | Review detail manifest id · `POST .../commit` |
| Can a sponsor receive a bounded export? | Sponsor packet export · [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) Phase D |
| Are AI outputs gated before handoff? | [`AGENT_QUALITY_STRICT_MODE_PILOT.md`](../runbooks/AGENT_QUALITY_STRICT_MODE_PILOT.md) · `first-pilot-command-center.md` quality rows |
| Is ROI honest about evidence source? | `go-no-go-summary.json` · `roiBasisStatus` · [`PILOT_SUCCESS_SCORECARD.md`](PILOT_SUCCESS_SCORECARD.md) §2.1.1 |
| Is procurement scope honest about deferrals? | [`PROCUREMENT_PACK_INDEX.md#deal-ready-one-pager`](PROCUREMENT_PACK_INDEX.md#deal-ready-one-pager) |

---

## Deal-cycle heuristic matrix

Use this matrix in sales conversations and sponsor briefings. Each row ties a buyer heuristic to **authoritative repo artifacts** — not marketing adjectives alone.

| Buyer question | ArchLucid differentiator | Evidence anchor | What we do **not** claim |
| --- | --- | --- | --- |
| "Is this just another diagram + LLM chat?" | **Finalized architecture package** with findings engines and durable audit trail | `GET /v1/runs/{runId}/manifest`, `docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md`, `docs/library/AUDIT_COVERAGE_MATRIX.md` | Autonomous production remediation or unsupervised agent autonomy |
| "Can we prove governance before deploy?" | **Governance disposition + recurrence** wired to runs and audit | `GovernanceStickinessController`, `docs/library/V1_SCOPE.md` §4, pilot proof packet `governance-outcome-summary.json` | SOC 2 CPA report or third-party pen-test publication (V1.1 backlog) |
| "Will procurement catch over-claims?" | **Claim gates + honest trust center** | `scripts/ci/check_buyer_claim_drift.py`, [`trust-center.md`](trust-center.md), [`ASSURANCE_STATUS_CANONICAL.md`](ASSURANCE_STATUS_CANONICAL.md) | Zero buyer friction on strict enterprise legal review |
| "How is AI bounded?" | **Deterministic + PilotStrict paths** with quality gates and budget enforcement | `docs/runbooks/LLM_COST_ESTIMATION.md`, `docs/library/AGENT_OUTPUT_EVALUATION.md`, operator LLM budget shell UX | Frontier-model showcase or unconstrained tool use |
| "Can executives see ROI without reading logs?" | **First-value report + sponsor packet** from committed runs | `archlucid pilot proof-packet <runId>`, `sponsor-proof-packet-index.md`, [`PMF buyer-safe evidence row`](../archive/gtm-internal/PMF_VALIDATION_TRACKER.md#21a-buyer-safe-evidence-row-template) | Guaranteed dollar ROI without customer baseline inputs |
| "Does UI match backend truth?" | **Live UI ↔ SQL parity** release profile | `scripts/release-smoke-rc.ps1`, CI `ui-e2e-live`, `docs/library/RELEASE_SMOKE.md#release-smoke-ui-sql-parity` | Mock Playwright alone proves SQL-backed UI |
| "Why not status-quo architecture review?" | **Explainability trace + typed findings** across security, cost, compliance pillars | `docs/library/EXPLAINABILITY_TRACE_COVERAGE.md`, ten finding engines in [`POSITIONING.md`](POSITIONING.md) | Replacement for human architecture judgment |

### How to use in a deal cycle

1. Pick **two rows** that match the buyer's stated pain (governance vs AI risk vs ROI proof).
2. Attach the cited artifact from a **committed pilot run** (`pilot proof-packet`) or staging evidence bundle.
3. Pair with **`limitations.md`** from the proof packet so sponsors see honest non-claims.

---

## Walkthrough shape (demo or first finalized review)

1. **Create** architecture review (Core Pilot four-step narrative — [`CORE_PILOT.md`](../CORE_PILOT.md)).
2. **Execute** agents on uploaded Azure evidence or accepted demo workspace.
3. **Commit** manifest — note manifest id and run id.
4. **Collect proof** with `-RunId` — open **`first-pilot-command-center.md`** for SEND/HOLD/DEFERRED_SCOPE.
5. **Attach decision-change addendum** when sponsor handoff includes material decision delta — [`QUOTE_TO_PROOF_PACKET.md#decision-change-addendum`](QUOTE_TO_PROOF_PACKET.md#decision-change-addendum).
6. **Compare** to a generic copilot session: ArchLucid adds manifest, audit, governance, labeled ROI, and repeatable sponsor export.

**Policy-pack moat demo (same run, different gate):** [`POLICY_PACK_DELTA_DEMO_SCRIPT.md`](POLICY_PACK_DELTA_DEMO_SCRIPT.md) · automation: `scripts/demo-policy-pack-delta.ps1` · in-app help: `/help/policy-pack-delta-demo`.

Static demo proof shape (before setup): [`docs/library/walkthroughs/README.md#buyer-jobs-specialty-index`](../library/walkthroughs/README.md#buyer-jobs-specialty-index) (`buyer-jobs/README.md` alias)

---

## Generic-AI comparison exercise (validation guidance)

Use this when an evaluator asks: *"Why not Claude/GPT/Gemini with a good prompt?"*

This is **validation guidance**, not a claim that ArchLucid always beats frontier AI. Do not publish benchmark superiority without data. See [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise).

### Model-seats counter-positioning message test {#model-seats-counter-positioning-message-test}

Founder-led sponsor message test — three concise scripts answering "Why ArchLucid instead of more Claude/GPT/Gemini seats?" Market validation only; no product changes. Execution: **GTM M-42**.

**Grounding rule:** Every claim in the scripts below maps to shipped V1 capability or an honest limitation. Do **not** claim ArchLucid always beats frontier AI on speed, novelty, or cost per query.

**Artifact root:** `artifacts/model-seats/<cohort-label>/` · fixtures: [`fixtures/model-seats-counter-positioning/`](../../fixtures/model-seats-counter-positioning/)

#### When to run (message test)

| Trigger | Action |
| --- | --- |
| Before scaling sponsor outreach | Run full 3-session message test |
| After a sponsor says "we already have Copilot seats" | Log session; compare to prior cohort |
| After bakeoff scoreboard shows L1/L3/L7 loss modes | Re-test Script C with honest loss acknowledgment |

**Cohort minimum:** **3** sponsor conversations (different accounts or roles). **External claim gate:** do not publish "beats ChatGPT" language until synthesis passes.

#### Three sponsor scripts (≤90 seconds each)

Use **one script per conversation** in the test cohort. Rotate A → B → C across sessions.

##### Script A — Accountability and governance

> "You already pay for frontier models — and your architects should keep using them for exploration. ArchLucid is not a replacement for a $20-a-month chat seat.
>
> ArchLucid is for when a design has to survive architecture review, audit, or procurement: a **finalized architecture package**, **evidence-linked findings** with explainability traces, **append-only audit events**, and optional **governance gates** before handoff. Chat transcripts do not give you that durable proof package.
>
> The pilot question is not 'can AI answer architecture questions?' — it is 'can we produce a **defensible architecture package** faster, with a trail someone can reconstruct six months later?' That is what [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) and this differentiation packet describe as shipped today."

**Evidence anchors:** architecture package · `ExplainabilityTrace` · typed audit · pre-finalize governance ([`POSITIONING.md`](POSITIONING.md) §4 table).

##### Script B — Repeatable proof package vs ephemeral chat

> "More model seats help individuals draft faster. ArchLucid helps the **organization** repeat architecture proof: same structured pipeline — topology, cost, compliance, critic — to a **versioned manifest**, sponsor export, and **two-review compare** when the design changes.
>
> Generic AI gives strong first drafts; [`COMPETITIVE_LANDSCAPE.md`](COMPETITIVE_LANDSCAPE.md) §4.4 is explicit that ad-hoc tools win on zero setup and breadth. ArchLucid wins when you need **repeatability, drift comparison, and labeled ROI basis** — not when someone only wants a one-off brainstorm.
>
> Pilot success is measured on time to finalized architecture package and traceability — not on beating ChatGPT prose in a single session."

**Evidence anchors:** multi-agent pipeline · two-review compare · sponsor first-value report · ROI basis labels (this packet).

##### Script C — Decision system vs chat (honest counterfactual)

> "If your only need is exploratory Q&A, buy more seats — ArchLucid is the wrong tool.
>
> If your bottleneck is **review preparation, decision traceability, and governance evidence**, seats alone leave you reconstructing conclusions from email and chat history. ArchLucid packages evidence, findings, and exports in one review workflow — and we run **honest bakeoffs** against manual frontier-AI review on the same evidence, tracking decision-change count and repeat-use intent without claiming we always win on first-draft speed.
>
> The buy decision is: do you need a **chat assistant** or a **proof engine** your ARB can sign off on?"

**Evidence anchors:** bakeoff protocol · scoreboard L1–L7 loss modes · [`#generic-ai-bakeoff-protocol`](#generic-ai-bakeoff-protocol).

#### Disqualifying objections (do not counter-sell)

Stop or pivot when the sponsor's need matches these — **model seats are the right answer**.

| Objection | Why it disqualifies ArchLucid (for now) | Pivot |
| --- | --- | --- |
| "We only need faster first drafts" | L1 loss mode territory; ArchLucid is not optimized for ad-hoc speed | Acknowledge; offer bakeoff only if they also have formal review pain |
| "We won't run a finalized review" | Value is in the defensible architecture package, not chat ([§ When ArchLucid is not a fit yet](#when-archlucid-is-not-a-fit-yet)) | Qualify out or propose service-led single review deliverable |
| "Azure-native hosting is a hard blocker" | [`BUYER_PERSONAS.md#when-archlucid-is-not-a-fit`](BUYER_PERSONAS.md#when-archlucid-is-not-a-fit) · [`COMPETITIVE_POSITIONING.md`](COMPETITIVE_POSITIONING.md) | Resolve platform fit before pilot |
| "We need CPA SOC 2 / external pen test before any pilot" | V1.1 backlog; self-assessment only ([`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise)) | Trust Center + defer; GTM **G-REAL-05** / **G-ASSURANCE-02** remain owner work |
| "Copilot is $20/mo unlimited — prove cheaper TCO" | [`COMPETITIVE_LANDSCAPE.md`](COMPETITIVE_LANDSCAPE.md) §4.4 — cost per interaction favors chat | Reframe to risk-of-undocumented-decisions, not seat price |
| "We need native Jira/ServiceNow/Slack day one" | V1.1 connectors per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) | REST/CLI/export handoff only |

**Hard fail for external use:** sponsor still believes ArchLucid replaces all frontier-AI usage after Script A — messaging failed; do not scale outreach.

#### Recommended next-question flow

After delivering a script, use this sequence. Stop when disqualified.

```
1. "Where does architecture review slow down today — preparation, alignment, or audit reconstruction?"
   → If only "faster drafting" → disqualify or Script C pivot

2. "Do you need a durable artifact after review — manifest, audit trail, sponsor export?"
   → No → disqualify (chat suffices)

3. "Would a second review need to compare against the first package with structured deltas?"
   → Yes → Script B proof points; mention two-review compare

4. "Who signs off — ARB, security, procurement — and what evidence do they require?"
   → Governance / audit → Script A; offer Trust Center index

5. "Are you open to a controlled pilot with labeled ROI basis — not guaranteed savings?"
   → Yes → CORE_PILOT path; No → hold

6. "Would you run the same redacted evidence through your preferred frontier AI for a bakeoff row?"
   → Yes → schedule bakeoff; append scoreboard (M-40)
   → No → pilot on proof-package value only; no superiority claims
```

Record answers in the session template. Tag **primary script**, **disqualifier hit (Y/N)**, and **recommended pilot motion**.

#### Message test protocol (3 sessions)

```powershell
$cohort = "cohort-2026-06"
$root = "artifacts/model-seats/$cohort"
New-Item -ItemType Directory -Force -Path "$root/sessions" | Out-Null
Copy-Item fixtures/model-seats-counter-positioning/message-test-session.template.md "$root/sessions/session-01.md"
Copy-Item fixtures/model-seats-counter-positioning/message-test-session.template.md "$root/sessions/session-02.md"
Copy-Item fixtures/model-seats-counter-positioning/message-test-session.template.md "$root/sessions/session-03.md"
Copy-Item fixtures/model-seats-counter-positioning/cohort-synthesis.template.md "$root/cohort-synthesis.md"
```

| Step | Owner | Done when |
| --- | --- | --- |
| Recruit 3 sponsor sponsors or budget holders | Founder | Distinct accounts or roles |
| Assign script rotation A / B / C | Founder | One primary script per session |
| Run next-question flow | Founder | Template § Flow complete |
| Score pass/fail per session | Founder | Template § Scoring complete |
| Synthesize cohort | Founder | `cohort-synthesis.md` within 7 days of session 3 |

| Criterion | Pass |
| --- | --- |
| Sponsor distinguishes chat assistant vs proof engine | Yes — can restate in their words |
| No over-claim correction needed | Founder did not walk back a false superiority claim |
| Disqualifier handled honestly | Pivot or qualify-out when triggered |
| Next step named | Pilot, bakeoff, hold, or disqualify |

**Cohort pass:** ≥2 of 3 sessions pass **and** at least one names a concrete pilot or bakeoff next step.  
**Cohort hold:** 0–1 passes — rewrite scripts using `cohort-synthesis.md` loss notes; re-run before claim expansion.

#### Cohort synthesis outputs

| Output | Use |
| --- | --- |
| Best-performing script (A/B/C) | Default for next 5 sponsor calls |
| Top disqualifying objection | Update [`BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-objection-playbook`](BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-objection-playbook) private notes |
| Phrases that resonated (verbatim) | Feed [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md#12-one-email-sponsor--procurement-kit) — no repo commit of buyer quotes without clearance |
| Phrases that failed | Remove from outreach |
| Recommended external claim posture | Conservative / pilot-only / hold |

### Rubric (score each dimension: **Better / Same / Worse / NOT_RUN**)

| Dimension | ArchLucid proof packet | Manual frontier-AI review (same input evidence) |
| --- | --- | --- |
| Non-obvious, decision-changing finding | | |
| Evidence traceability (refs, manifest, audit) | | |
| Repeatability (same run → same export) | | |
| Governance / audit / commit gate | | |
| ROI basis labels (buyer-provided vs demo-derived) | | |
| Sponsor usability (one packet, explicit HOLD/SEND) | | |

**NOT_RUN** when comparison was not performed — never record as zero or PASS.

### How to run the exercise

1. Pick one committed run with a complete proof packet (`archlucid pilot proof-packet <runId>` or `collect-first-pilot-proof.ps1 -RunId …`).
2. Give the **same redacted input evidence** to a principal architect using their preferred frontier AI tool (no automated calls from ArchLucid).
3. Record rubric scores in pilot notes or [`evidence-packet-buyer.template.md`](templates/evidence-packet-buyer.template.md) § Comparison.
4. Keep conservative claims: ArchLucid wins on **repeatability, evidence packaging, governance, and labeled ROI** — not necessarily prose quality on day one.

Optional template hook: [`templates/evidence-packet-buyer.template.md`](templates/evidence-packet-buyer.template.md)

---

## Generic-AI bakeoff protocol {#generic-ai-bakeoff-protocol}

Former standalone body: `docs/go-to-market/GENERIC_AI_BAKEOFF_PROTOCOL.md` → this section (filename kept as a path-stable alias).

**Audience:** Founder-led demos, pilot debriefs, and differentiation conversations. Not a competitive benchmark claim.

**End-to-end runbook (five steps):** [`../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md`](../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md)  
**Session folder template:** [`fixtures/bakeoff/session-template/README.md`](../../fixtures/bakeoff/session-template/README.md)  
**Rolling scoreboard:** [`FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md`](FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md)

### What this compares

The realistic alternative is **not** only LeanIX or Ardoq. It is a **competent principal architect using frontier AI manually** (Claude Opus, GPT-5 / ChatGPT, Gemini Pro, or Cursor with a strong model) on the same architecture packet.

ArchLucid does **not** always reason better than frontier AI. This protocol documents **where each wins honestly**.

### Setup

| Input | Requirement |
| --- | --- |
| Architecture packet | Same sanitized packet for both paths |
| ArchLucid path | Committed review with labeled execution mode |
| Manual AI path | Principal-architect prompt; save transcript + findings list |
| Time box | 60–90 minutes total prep; record wall-clock where measured |

### Comparison rubric

| Dimension | ArchLucid | Manual frontier AI | Notes |
| --- | --- | --- | --- |
| Time to first sponsor-ready packet | Measured or estimated | Measured or estimated | Label unmeasured times **illustrative** |
| Evidence traceability | Manifest, audit, citations | Usually absent unless manually pasted | ArchLucid advantage when buyer asks "prove it" |
| Repeatability | Same inputs → structured re-run | Depends on prompt/session | ArchLucid advantage for regulated buyers |
| Governance / audit readiness | Labels, ROI basis, export bundle | Ad hoc | ArchLucid advantage |
| Finding breadth / flexibility | Pipeline-bound | Often broader ad hoc | Manual AI may win on exploratory breadth |
| Setup friction | Pilot config, tenant, proof collection | Near zero | Manual AI wins first session |
| Sponsor packet polish | First-value report, PDF/DOCX | Manual assembly | ArchLucid wins packaging time |
| Cost of wrong finding | Evidence trail + rollback narrative | Reputation risk | Tie — both need human review |

### Where manual frontier AI wins

- Zero platform setup for a one-off review
- Broad domain questions outside finalized architecture package scope
- Rapid what-if brainstorming without governance overhead
- Custom narrative tone without export templates

### Where ArchLucid wins (V1_SCOPE capabilities)

- Durable architecture package + finalized review lifecycle
- Audit trail and correlation IDs
- Provenance graph and evidence-linked findings
- Repeatable proof packet for procurement
- Policy-consistent exports with execution-mode labels
- ROI basis discipline and sponsor-safe fallbacks

### Demo script (15-minute sponsor slice)

1. Show manual AI findings list — 2 minutes.
2. Show ArchLucid sponsor packet with **execution mode** and **evidence-basis** labels — 5 minutes.
3. Open audit / evidence trail for one finding — 3 minutes.
4. State honestly: "Manual AI may find issues faster on day one; ArchLucid packages defensible evidence faster on day two and every review after." — 2 minutes.
5. Q&A — defer CPA SOC 2 / pen test / marketplace to deferred-scope slide.

### Anti-patterns (do not claim)

- "ArchLucid is smarter than GPT-5" (unprovable, fragile)
- Invented benchmark percentages without measured sessions
- Simulator output presented as live customer proof
- Competitor product slurs (LeanIX/Ardoq are different category)

### Evidence that should update positioning

| Signal | Action |
| --- | --- |
| ArchLucid N-rate ≥25% in insight validation | Strengthen "non-obvious findings" narrative |
| Manual AI consistently faster to first draft | Lead with packaging / audit / repeatability |
| Faithfulness failures on real packet | Narrow AI claims; engineering priority |

### Evidence pack checklist {#evidence-pack-checklist}

| # | Item | Status |
| --- | --- | --- |
| 1 | Sanitized architecture packet (same for both arms) | ☐ |
| 2 | ArchLucid committed run id + execution mode label | ☐ |
| 3 | ArchLucid sponsor export (first-value Markdown or proof ZIP) | ☐ |
| 4 | Manual AI findings list (not raw chat dump) | ☐ |
| 5 | Manual AI prompt saved | ☐ |
| 6 | Wall-clock times recorded or labeled **unknown** | ☐ |
| 7 | Session notes (honest wins/losses) | ☐ |
| 8 | Anti-claim review (no "smarter than GPT" language) | ☐ |
| 9 | Generated summary JSON + Markdown | ☐ |

### Manual frontier-AI prompt (copy/adapt)

Use the same packet as ArchLucid. Save the prompt with the session.

```text
You are a principal cloud architect reviewing an architecture packet for a regulated enterprise buyer.

Inputs:
- Architecture packet: [attach sanitized brief + manifest excerpt]
- Buyer context: [industry, compliance drivers — no PII]

Tasks:
1. List the top 10 material architecture findings (severity + one-line rationale each).
2. For each finding, cite which packet section or artifact supports it.
3. Recommend three decision changes the ARB should consider before approval.
4. Draft a 150-word sponsor summary suitable for a CIO — label any estimate as an estimate.

Constraints:
- Do not invent infrastructure not present in the packet.
- Flag uncertainty explicitly.
- Output a numbered findings list only (no marketing language).
```

**Baseline prompt file:** [`fixtures/blind-validation/regulated-scenario/manual-ai-baseline-prompt.txt`](../../fixtures/blind-validation/regulated-scenario/manual-ai-baseline-prompt.txt)

### Blind comparison of findings

After manual and ArchLucid arms complete, run blind scoring so reviewers do not know which arm is which.

**Protocol:** [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#blind-insight-validation`](FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#blind-insight-validation) (alias: [`Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md#blind-insight-validation))

```powershell
# Demo / internal dry-run on regulated fixture
.\scripts\Run-BlindInsightValidation.ps1 -SessionLabel <label> -NonInteractiveScore -AutoSummarize

# Live session — see runbook Step 3 for fixture layout under artifacts/bakeoff/<label>/
python scripts/assemble_blind_validation_packet.py assemble `
  --fixture artifacts/bakeoff/<label> `
  --output artifacts/bakeoff/<label>/blind `
  --session-id <label>
```

**Facilitator only:** `source-key.json` — do not share until scoring completes.

### Decision-delta scoring

Within 7 days, complete [`QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots`](QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots) and save to `artifacts/bakeoff/<label>/decision-delta.md` (template: [`fixtures/bakeoff/session-template/decision-delta.template.md`](../../fixtures/bakeoff/session-template/decision-delta.template.md)).

| Outcome | Criteria |
| --- | --- |
| **PASS** | ≥1 documented decision change from an ArchLucid finding not in the manual AI pass |
| **WARN** | Confirmatory only — packaging/audit value |
| **FAIL** | Participant would not run review #2 |

### Generate summary artifacts

From repository root after packet folder is prepared:

```powershell
python scripts/ci/build_generic_ai_bakeoff_summary.py `
  --archlucid-packet-dir artifacts/bakeoff/<session>/archlucid `
  --manual-ai-findings artifacts/bakeoff/<session>/manual-findings.md `
  --archlucid-minutes 42 `
  --manual-minutes 35 `
  --session-notes "Manual timing self-reported; ArchLucid includes commit + export." `
  --json-out artifacts/bakeoff/<session>/bakeoff-summary.json `
  --markdown-out artifacts/bakeoff/<session>/bakeoff-summary.md
```

**Required `archlucid/packet-metadata.json` fields:**

```json
{
  "runId": "<guid>",
  "executionMode": "Real"
}
```

Omit `--archlucid-minutes` / `--manual-minutes` when not measured — summary will label **unknown / not measured**.

### Summary template (facilitator rollup)

```markdown
# Bakeoff session summary — <label>

**Date (UTC):**  
**Packet:**  
**ArchLucid execution mode:**  
**Evidence basis:**  

## Timing (honest)

| Path | Minutes | Basis |
| --- | --- | --- |
| ArchLucid | | measured / unknown |
| Manual frontier AI | | measured / unknown |

## Dimension notes

- Time to sponsor packet:  
- Evidence traceability:  
- Repeatability:  
- Governance readiness:  
- Finding usefulness:  
- Sponsor packet quality:  

## Where manual frontier AI won

- 

## Where ArchLucid won

- 

## Anti-claims confirmed

- [ ] Did not claim ArchLucid is smarter than frontier AI
- [ ] Did not present simulator as live proof
- [ ] Did not invent benchmark percentages

## Decision

- [ ] Strengthen repeatability / evidence narrative  
- [ ] Narrow AI reasoning claims  
- [ ] Engineering follow-up for faithfulness gap  
```

### Bakeoff related

- [`../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md`](../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md) — end-to-end five-step bakeoff runbook
- [`FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md`](FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md) — rolling scoreboard (**Done 2026-06-17**)
- [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#blind-insight-validation`](FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#blind-insight-validation) — blind packet assembly + cohort checklist (alias: [`Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md#blind-insight-validation))
- [`QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots`](QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots) — post-bakeoff decision scoring
- [`FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#dismissal-interview-script-head-to-head`](FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#dismissal-interview-script-head-to-head) — randomized two-arm dismissal interview (30-day reuse + pay-to-avoid)
- [`COMPETITIVE_LANDSCAPE.md`](COMPETITIVE_LANDSCAPE.md)
- [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md)
- [`V1_SCOPE.md`](../library/V1_SCOPE.md)

---

## When ArchLucid is not a fit yet

- Buyer requires **CPA-issued SOC 2 Type I/II** before any pilot — see **(B)** deferrals in [`trust-center.md`](trust-center.md); self-assessment and roadmap only today.
- Buyer mandates **first-party Jira/ServiceNow/Confluence/Slack/Teams** connectors as day-one — V1.1 per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md); V1 offers REST/CLI + GitHub/Azure DevOps handoff comments.
- Buyer expects **live Marketplace transactability** or self-serve Stripe checkout — deferred; sales-led order form path only.
- Team will not run a **finalized review** — ArchLucid value is in the defensible architecture package, not chat-only assistance.

---

## Related

- Buyer one screen: [`BUYER_ORIENTATION_ONE_SCREEN.md`](BUYER_ORIENTATION_ONE_SCREEN.md)
- Hub entry: [`START_HERE.md`](../START_HERE.md)
- Pricing (canonical numbers): [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md)
- Bakeoff protocol: [`#generic-ai-bakeoff-protocol`](#generic-ai-bakeoff-protocol) · [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md) (alias)
