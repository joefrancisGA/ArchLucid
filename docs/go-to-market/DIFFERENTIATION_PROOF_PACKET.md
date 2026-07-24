> **Scope:** Buyer-safe differentiation proof — manual review vs generic AI vs ArchLucid V1 outputs.

# Differentiation proof packet

**Audience:** Evaluators, executive sponsors, and sales engineers answering "why not generic AI or a consultant checklist?"

**Last reviewed:** 2026-07-24

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
| Is procurement scope honest about deferrals? | [`PROCUREMENT_DEAL_READY_ONE_PAGER.md`](PROCUREMENT_DEAL_READY_ONE_PAGER.md) |

---

## Walkthrough shape (demo or first committed review)

1. **Create** architecture review (Core Pilot four-step narrative — [`CORE_PILOT.md`](../CORE_PILOT.md)).
2. **Execute** agents on uploaded Azure evidence or accepted demo workspace.
3. **Commit** manifest — note manifest id and run id.
4. **Collect proof** with `-RunId` — open **`first-pilot-command-center.md`** for SEND/HOLD/DEFERRED_SCOPE.
5. **Attach decision-change addendum** when sponsor handoff includes material decision delta — [`validation/DECISION_CHANGE_ADDENDUM.md`](validation/DECISION_CHANGE_ADDENDUM.md).
6. **Compare** to a generic copilot session: ArchLucid adds manifest, audit, governance, labeled ROI, and repeatable sponsor export.

**Policy-pack moat demo (same run, different gate):** [`POLICY_PACK_DELTA_DEMO_SCRIPT.md`](POLICY_PACK_DELTA_DEMO_SCRIPT.md) · automation: `scripts/demo-policy-pack-delta.ps1` · in-app help: `/help/policy-pack-delta-demo`.

Static demo proof shape (before setup): [`demo-proof-packets/README.md`](demo-proof-packets/README.md)

---

## Generic-AI comparison exercise (validation guidance)

Use this when an evaluator asks: *"Why not Claude/GPT/Gemini with a good prompt?"*

**Message test (3 sponsor conversations):** [`MODEL_SEATS_COUNTER_POSITIONING_TEST.md`](MODEL_SEATS_COUNTER_POSITIONING_TEST.md) — three concise scripts, disqualifying objections, next-question flow; fixtures: [`fixtures/model-seats-counter-positioning/`](../../fixtures/model-seats-counter-positioning/). Execution: **GTM M-42**.

This is **validation guidance**, not a claim that ArchLucid always beats frontier AI. Do not publish benchmark superiority without data. See [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md).

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
