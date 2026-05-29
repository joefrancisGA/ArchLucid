> **Scope:** Buyer-safe differentiation proof — manual review vs generic AI vs ArchLucid V1 outputs.

# Differentiation proof packet

**Audience:** Evaluators, executive sponsors, and sales engineers answering "why not generic AI or a consultant checklist?"

**Last reviewed:** 2026-05-29

---

## What ArchLucid produces that generic AI does not

| Capability | Manual review / checklist | Generic AI assistant | ArchLucid V1 |
| --- | --- | --- | --- |
| Committed golden manifest | Sometimes informal | No durable manifest | **Yes** — SQL-backed manifest id + audit trail |
| Repeatable export package | Ad hoc slides/docs | Chat transcript | **Sponsor packet** + first-value report + proof ZIP |
| Governance gate before commit | Process-dependent | None | **Policy packs** + dry-run + optional BlockCommitOnCritical |
| Evidence refs per finding | Often missing | Hallucination risk | **Evidence refs** + retrieval grounding traces |
| Provenance / explain | Variable | Opaque | **Explainability trace** + evidence-chain view |
| ROI basis labels | Anecdotal | Unsupported savings claims | **Buyer-provided / Defaulted / Demo-derived / Not collected** |
| Audit trail | Email / tickets | None | **`AuditEvents`** + correlation ids |
| Procurement posture | Custom each time | None | **Trust Center** + procurement pack (self-assessment; not CPA attestation) |

Evidence links: [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) · [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) · [`TRUST_CENTER.md`](TRUST_CENTER.md)

---

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
5. **Compare** to a generic copilot session: ArchLucid adds manifest, audit, governance, labeled ROI, and repeatable sponsor export.

Static demo proof shape (before setup): [`demo-proof-packets/README.md`](demo-proof-packets/README.md)

---

## When ArchLucid is not a fit yet

- Buyer requires **CPA-issued SOC 2 Type I/II** before any pilot — see **(B)** deferrals in [`TRUST_CENTER.md`](TRUST_CENTER.md); self-assessment and roadmap only today.
- Buyer mandates **first-party Jira/ServiceNow/Confluence/Slack/Teams** connectors as day-one — V1.1 per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md); V1 offers REST/CLI + GitHub/Azure DevOps handoff comments.
- Buyer expects **live Marketplace transactability** or self-serve Stripe checkout — deferred; sales-led order form path only.
- Team will not run a **committed review** — ArchLucid value is in the defensible review package, not chat-only assistance.

---

## Related

- Buyer one screen: [`BUYER_ORIENTATION_ONE_SCREEN.md`](BUYER_ORIENTATION_ONE_SCREEN.md)
- Hub entry: [`START_HERE.md`](../START_HERE.md)
- Pricing (canonical numbers): [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md)
