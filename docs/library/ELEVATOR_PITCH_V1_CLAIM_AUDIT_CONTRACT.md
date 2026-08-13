> **Scope:** Contributor-reference — cut / hedge / prove-with-committed-run rules for verbal elevator pitches and M-18 outreach templates (**TB-1367**). Complements sponsor brief §4 and GTM **M-245** / **M-246**.

# Elevator pitch vs shipped V1 claim audit (TB-1367)

> **Audience:** Founder, SE, principal architects stress-testing pitch claims before outreach.  
> **Not** an assurance attestation — this contract governs buyer-safe language only.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#elevator-pitch-v1-claim-audit-m-246) (GTM **M-246**).  
**Path-stable alias:** [`ELEVATOR_PITCH_V1_CLAIM_AUDIT_PA_ONE_PAGER.md`](../go-to-market/ELEVATOR_PITCH_V1_CLAIM_AUDIT_PA_ONE_PAGER.md).  
**Pitch SoT:** [`EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) §4 ([`ELEVATOR_PITCH.md`](../go-to-market/ELEVATOR_PITCH.md) path alias).  
**Claim boundary spine:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) · [`V1_SCOPE.md`](V1_SCOPE.md) · [`WHAT_NOT_TO_PROMISE_UI_BUYER_RISK_MATRIX_CONTRACT.md`](WHAT_NOT_TO_PROMISE_UI_BUYER_RISK_MATRIX_CONTRACT.md).  
**Anti-overclaim CI:** **TB-1368** **Done** — `scripts/ci/check_elevator_pitch_v1_claim_honesty.py`.

---

## Decision in one line

Pitch only what a **committed run** can demonstrate. Cut absolute time-savings and universal-trace / always-on gate claims; hedge mode and connector maturity language; prove with architecture package artifacts on a named golden manifest.

---

## Cut (do not say)

| Overclaim | Why cut | Correct posture |
| --- | --- | --- |
| “Reviews that took two weeks now take two hours” (or any unlabeled week→hour compression) | No measured pilot baseline; GTM **M-90** cohort is owner-led, not a product telemetry claim | Problem framing (“reviews take weeks”) is OK; quantified savings require labeled pilot evidence |
| Guaranteed calendar, ROI, or $ savings without source class | Violates **M-138** / **TB-1294** sponsor-export honesty | Service-led motion + labeled ROI only |
| “Every finding always has an explainability trace” | **TB-1221** / decision-grade provenance residuals | “Evidence-cited findings **where gates enforce**” |
| “Replayable” as **absolute** architecture stability | **M-174** / **TB-1024** compare-replay honesty | “Replay/compare **against committed manifests**” |
| Pre-commit / pre-finalize gates “always on” or default-on | **M-173** — Advisory does not block | “Optional gate **where configured**” |
| Stale “connectors not in V1” deferral | **V1_SCOPE** §2.13–§2.15 promotes Jira, ServiceNow, Teams, Slack, Confluence to V1 GA | Cite GA with maturity / credential caveats (**TB-1420**) |
| “Replaces ad hoc review docs” as universal replacement | Overstates adoption without pilot proof | “Helps teams move **toward** structured, defensible packages” |

---

## Hedge (say with caveats)

| Phrase | Hedge |
| --- | --- |
| “Reviews take weeks” | Problem framing — OK without quantified ArchLucid delta |
| “Evidence-cited findings” | Add “where gates enforce” or “sponsor-facing explainability when present” when trace depth matters |
| “Auditable” / “replayable” | Pair with “committed manifest”, “compare/replay”, or “audit chain” — not immutable architecture |
| “Fraction of the calendar delay” / “fraction of the time” | OK as directional service-led language — not a guaranteed multiplier |
| “Pre-commit governance gate” | “Optional pre-finalize gate where configured”; Advisory is non-blocking per **M-173** |
| Native connectors (Jira, ServiceNow, Teams, Slack, Confluence) | V1 GA per **V1_SCOPE** §2.13–§2.15 — honest empty-state / credential / manual-vendor caveats (**TB-1420**) |
| “Multi-agent topology / cost / compliance / design quality” | Prove on committed run; do not imply Real-mode parity on every residual (**M-159**, **M-248**) |

---

## Prove (committed-run artifact only)

Demonstrate on a **named committed golden manifest** (GTM **M-155**) in live demo or sample export:

| Prove line | Artifact / surface |
| --- | --- |
| Architecture package | Finalized review record + findings register + stated limits |
| Signed review + audit chain | Signed review UI + append-only audit pointers |
| Multi-agent roles | Topology / Cost / Compliance / Critic (or design-quality) outputs on the same run |
| Evidence-cited findings | Finding inspect with citations / provenance where gated |
| Sponsor export | DOCX/PDF (+ whitelabel per service offers) with mode labels |
| Service-led motion | [`QUOTE_TO_PROOF_PACKET.md`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#productized-service-offers) — not self-serve checkout |

---

## Pitch reconciliation checklist (PA review)

1. Open [`EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) §4 and mark each absolute as **cut**, **hedge**, or **prove**.
2. Confirm pitch and brief §4 agree on gates, connectors, and trace language.
3. Confirm a live committed run backs every **prove** line.
4. Treat universal time-savings or always-on controls as a review finding — **TB-1368** CI enforces the worst offenders.

---

## Related GTM / engineering rows

| ID | Role |
| --- | --- |
| **M-245** / **M-246** | GTM elevator pitch honesty + PA one-pager |
| **M-02** | One-minute pitch canon (**Done**) |
| **M-138** / **M-154** / **M-174** / **M-243** / **M-239** | ROI, replay, differentiation companions |
| **TB-1343** / **TB-1420** | WNTP connector row + integration empty-state honesty (peer — does not replace this contract) |
| **TB-1368** | Language guard CI (**Done**) |

---

## CI anchors for **TB-1368**

| Anchor | Role |
| --- | --- |
| `scripts/ci/check_elevator_pitch_v1_claim_honesty.py` | Fail two-weeks→two-hours / every-finding-trace / gate-always-on / bare replayable overclaims |
| This contract (`ELEVATOR_PITCH_V1_CLAIM_AUDIT_CONTRACT.md`) | Engineering cut / hedge / prove canon (**TB-1367**) |
| [`BUYER_SECURITY_PROCUREMENT_PACKET.md#elevator-pitch-v1-claim-audit-m-246`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#elevator-pitch-v1-claim-audit-m-246) | Buyer-facing cut / hedge / prove table |
| `ELEVATOR_PITCH.md`, `EXECUTIVE_SPONSOR_BRIEF.md` §4 | Pitch + M-18 template scan targets |
