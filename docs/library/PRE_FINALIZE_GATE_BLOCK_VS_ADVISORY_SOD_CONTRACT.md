> **Scope:** Contributor-reference — pre-finalize gate block vs advisory and SoD ownership (TB-1022); not a buyer-facing trust claim.

# Pre-finalize gate — block vs advisory + SoD ownership contract

**Status:** Active (V1)  
**Backlog:** **TB-1022** (this contract) · **TB-1023** (honesty CI — Done 2026-08-12)  
**Audience:** Principal architects, governance reviewers, coding agents  
**Related:** [PRE_COMMIT_GOVERNANCE_GATE.md](./PRE_COMMIT_GOVERNANCE_GATE.md) (deep dive) · ADR [0034](../architecture/adrs/0034-segregation-of-duties-entra-oid-actor-keys.md) · [PUBLIC_CLAIM_BOUNDARY_GUIDE.md](./PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (**M-172**) · [BUYER_SECURITY_PROCUREMENT_PACKET.md § M-173](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#pre-finalize-gate-sod-m-173) · PA alias [PRE_FINALIZE_GATE_BLOCK_VS_ADVISORY_SOD_PA_ONE_PAGER.md](../go-to-market/PRE_FINALIZE_GATE_BLOCK_VS_ADVISORY_SOD_PA_ONE_PAGER.md) · Done **TB-184** · pack evaluation hybrid **TB-1324** / **M-236** (architecture split — not this matrix)

---

## 1. Purpose

Name what **blocks finalize/commit**, what is **advisory / non-blocking**, and **who owns SoD** — so procurement never hears “every pack blocks,” “packs are certifications,” or “SoD means a different committer.”

Buyer-facing name: **pre-finalize**. API/config keys remain **pre-commit** (`PreCommitGateEnabled`, `PreCommitGovernanceGate`).

---

## 2. Non-claims (say first)

| Do **not** claim | Why |
|------------------|-----|
| “The pre-finalize gate is always on in production.” | Default `PreCommitGateEnabled` = **false** — gate is optional. |
| “Every policy pack blocks finalize.” | Only **enforcing** assignments (block flags) when the gate is on. |
| “`priorityFloor` / advisoryDefaults are commit gates.” | Rule-surface priority only — not `PreCommitGateEvaluator` block logic. |
| “Packs equal HIPAA/PCI/SOC certification.” | Content + optional gate ≠ third-party certification (`PUBLIC_CLAIM_BOUNDARY_GUIDE`). |
| “SoD requires a different committer.” | Platform SoD is **approval submitter ≠ approver** (ADR 0034), not commit actor. |
| “Advisory findings block commit.” | `PreCommitGateEvaluator` **skips** `FindingEnforcementTier.Advisory`. |

---

## 3. Blocks commit (gate on)

Requires **`ArchLucid:Governance:PreCommitGateEnabled` = true**, then:

| Control | When it blocks | Outcome |
|---------|----------------|---------|
| Enabled assignment with `BlockCommitOnCritical` and/or `BlockCommitMinimumSeverity` | Non-Advisory findings at/above effective minimum severity | **409** `#governance-pre-commit-blocked` + `GovernancePreCommitBlocked` |
| Optional global `PreCommitGateThreshold` | When **no** enforcing assignment supplies a threshold | Same block path using parsed global minimum |
| Schema / ReadyForCommit hard fails | Separate from this gate | Cite run-state / **TB-937** cluster — do not re-implement here |

Severity ladder: `Info=0`, `Warning=1`, `Error=2`, `Critical=3` (see `PRE_COMMIT_GOVERNANCE_GATE.md`).

---

## 4. Advisory / non-blocking

| Control | Behavior |
|---------|----------|
| Gate off (`PreCommitGateEnabled` false — **default**) | Gate not evaluated on commit path |
| Assignment enabled but **no** block flags | Assignment is not enforcing; commit may still block via global `PreCommitGateThreshold` when set (see §3) |
| No enforcing assignment **and** no global threshold | Commit proceeds (gate evaluated, nothing to block on) |
| `FindingEnforcementTier.Advisory` | Excluded from blocking set |
| Severity in `WarnOnlySeverities` | `GovernancePreCommitWarned`; **commit proceeds** |
| `priorityFloor` / most `advisoryDefaults` | Rule ranking / UI surface — **not** commit block |
| Dry-run / simulate | Observation only |
| Approval SLA breach | Escalation webhook / audit — **not** a commit block |
| Pack presence alone | Not a certification; not a default block |

---

## 5. SoD ownership

| Layer | Owns | Mechanism |
|-------|------|-----------|
| **Platform** | Approval submitter ≠ approver | `GovernanceSegregationRules` + ADR 0034 JWT actor keys on `GovernanceApprovalRequest`; audit `GovernanceSelfApprovalBlocked` |
| **Customer org** | Who may submit vs approve | Role assignment / process; residual same-human dual-account risk |
| **Not SoD** | Who calls commit | Committer need not differ from approver unless org policy adds it |
| **Not SoD** | Finding disposition races | Append-only last-by-time (**TB-986** / **M-141**) ≠ approval-request CAS |

---

## 6. Lifecycle order

1. Resolve / warn via optional pre-finalize gate  
2. **Commit** (sealed package)  
3. Submit governance **approval** request  
4. **Other** actor approves (SoD)  
5. Promote / activate per product rules  

Do not collapse “gate blocked” with “approval rejected,” or “commit succeeded” with “approved.”

---

## 7. CI anchors for **TB-1023**

| Forbidden implication | Anchor direction |
|-----------------------|------------------|
| Every pack / gate always blocks finalize | Require optional `PreCommitGateEnabled` + enforcing assignment |
| `priorityFloor` is a commit gate | Point at §4 non-blocking |
| Packs = certification | Claim-boundary / WHAT_NOT_TO_PROMISE |
| SoD = different committer | ADR 0034 approval actor keys only |
| Advisory findings block commit | `EnforcementTier.Advisory` exclusion / `WarnOnlySeverities` |

Mechanical gate: `scripts/ci/check_pre_finalize_gate_sod_honesty.py`.

---

## 8. Security · Scalability · Reliability · Cost

| Concern | Stance |
|---------|--------|
| **Security** | Optional preventive control + platform SoD on approvals; org roles remain customer-owned. |
| **Scalability** | Gate off by default avoids loading findings/assignments on every commit until enabled. |
| **Reliability** | Warn-only mode phases enforcement without silent fail-open on Required audit elsewhere. |
| **Cost** | No forced always-on gate TCO; customers opt into blocking when ready. |

---

## 9. One-line buyer answer

**Pre-finalize is an optional gate: enforcing assignments can block commit; Advisory/warn-only and `priorityFloor` do not; SoD is approval submitter≠approver — not a different-committer rule — and packs are not certifications.**
