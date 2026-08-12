> **Scope:** Contributor-reference — append-only vs commit-sealed evidence surfaces (TB-1009); not a buyer-facing trust claim.

# Append-only and sealed evidence contract

**Status:** Active (V1)  
**Backlog:** **TB-1009** (this contract) · **TB-1010** (honesty CI anchors — **Done** 2026-08-12)  
**Audience:** Security / compliance engineers, principal architects, procurement reviewers, coding agents  
**Related:** [EVIDENCE_IMMUTABILITY.md](./EVIDENCE_IMMUTABILITY.md) (deep dive) · [ARCHITECTURE_INVARIANTS.md](./ARCHITECTURE_INVARIANTS.md) **INV-011** · [PUBLIC_CLAIM_BOUNDARY_GUIDE.md](./PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (**M-160**) · [BUYER_SECURITY_PROCUREMENT_PACKET.md § M-161](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#append-only-sealed-evidence-m-161) · [GDPR_ERASURE_VS_APPEND_ONLY_MAP.md](./GDPR_ERASURE_VS_APPEND_ONLY_MAP.md) (**TB-1470** / **M-265**) · [EVIDENCE_BACKUP_RESTORE_INVARIANT_MAP.md](./EVIDENCE_BACKUP_RESTORE_INVARIANT_MAP.md) (**TB-1490** / **M-270**) · [PROJECT_SOFT_DELETE_SEALED_EVIDENCE_MAP.md](./PROJECT_SOFT_DELETE_SEALED_EVIDENCE_MAP.md) (**TB-1497** / **M-272**) · Done **TB-303** / **TB-307** / **TB-310** / **TB-311** · ADR [0039](../architecture/adrs/0039-commit-sealed-evidence-immutability.md) · ADR [0040](../architecture/adrs/0040-tamper-evident-lineage-without-worm-storage.md) · PA alias [APPEND_ONLY_SEALED_EVIDENCE_PA_ONE_PAGER.md](../go-to-market/APPEND_ONLY_SEALED_EVIDENCE_PA_ONE_PAGER.md)

---

## 1. Purpose

Name which ArchLucid surfaces are **append-only or commit-sealed** versus **legitimately mutable**, and what a silent `UPDATE` / overwrite **destroys** for forensics, procurement language, and export verification.

This contract does **not** claim platform-operated WORM / legal hold. Customer-owned storage immutability policies remain out of ArchLucid product scope (ADR 0040).

---

## 2. Non-claims (say first)

| Do **not** claim | Why |
|------------------|-----|
| “ArchLucid is an append-only / WORM platform end-to-end.” | Many operator and run-lifecycle tables are intentionally mutable. |
| “Every SQL row is immutable after insert.” | False — see §4. |
| “Platform ledger / SQL Ledger / immutable storage is included.” | Deferred; customer cold-tier WORM is the supported path (ADR 0040). |
| “Audit stream cannot be bypassed by an admin with DB write.” | Repository + GRANT defense-in-depth; DB owner can still violate. Say **application-enforced append-only**, not absolute physical immutability. |
| “Findings / reviews never change.” | Finding **bodies** and review **queues** may mutate; **FindingReviewEvents** is an **app-layer** append trail (not SQL DENY–sealed today). |

---

## 3. Append-only / sealed inventory

Enforcement is **not uniform**. Prefer the tier column when mapping controls.

| Surface | Shape | Enforcement tier | Primary refs |
|---------|-------|------------------|--------------|
| **Tenant `AuditEvents`** | Insert + query only | **SQL DENY** + registry + startup probe + repository shape (**INV-011**) | **TB-303**, `SealedEvidenceTableRegistry`, `SqlAuditRepository` |
| **`dbo.PlatformAuditEvents`** | Append-only platform stream | **SQL DENY** + repository shape | Platform audit hosts / mig DENY |
| **Commit-sealed evidence tables** (manifests, snapshots, agent results/packages, decision traces, artifact bundles, …) | Insert-only after commit for `[ArchLucidApp]` | **SQL DENY** via `SealedEvidenceTableRegistry` + startup probe | **TB-303**, ADR 0039, `EVIDENCE_IMMUTABILITY.md` |
| **Committed run-header evidence anchors** | Anchor columns immutable post-commit; lifecycle columns stay mutable | Trigger + app guard (`TR_Runs_SealCommittedHeader`) | **TB-310**, ADR 0045 |
| **Committed package + `ManifestHash`** | Commit creates sealed artifact; hash pins export | Commit path + export verify (app-layer lineage, not WORM) | **TB-303**, **TB-307**, **TB-1003**, ADR 0040 |
| **Committed run-header FK repoint** | Detection-only (not a seal rewrite path) | Background probe / admin counts | **TB-311**, ADR 0046 |
| **`FindingReviewEvents`** | Append-only event log in app APIs | **Repository-shape only** today (insert + read; **not** in sealed registry / no mig DENY) | Findings review trail / **TB-986** |
| **Outbox publish records** (where applicable) | Append / mark-processed patterns | **INV-011** repository shape; mark-processed ≠ payload rewrite | Outbox contracts |

**Buyer shorthand:** when procurement asks “is evidence append-only?”, answer with **this inventory and its tiers**, not “the whole product” and not “every listed row has SQL DENY.”

---

## 4. Legitimate mutable inventory

| Surface | Why mutation is allowed | What must **not** be sold as sealed |
|---------|-------------------------|-------------------------------------|
| **`AgentResultEnrichments`** | Operator / pipeline enrichment of agent outputs | Not forensic seal; do not cite as WORM |
| **Socratic / coaching drafts** | Iterative operator drafts before publish | Draft ≠ sealed evidence |
| **Run lifecycle columns** (`status`, timestamps, soft state) | Orchestration progress | Lifecycle ≠ audit event |
| **ITSM `HumanReviewStatus` (and similar queues)** | Human triage workflow | Queue state ≠ append-only audit |
| **Pre-commit drafts / working manifests** | Mutable until commit | Pre-commit ≠ committed package (**TB-1003**) |
| **Finding current state / disposition fields** | Live triage | Current row ≠ review-event history |
| **Operator UI preferences / workspace config** | Product settings | Never claim as evidence |

---

## 5. What a silent `UPDATE` destroys (destruction matrix)

| If you silently overwrite… | You destroy… | Buyer / engineering consequence |
|----------------------------|--------------|--------------------------------|
| A row in **`AuditEvents` / `PlatformAuditEvents`** | Forensic timeline integrity; “who did what when” for investigations | Breaks **INV-011** / DENY story and procurement (**M-160** / **M-161**) |
| A **commit-sealed evidence table** row (registry inventory) in place | Evidence identity continuity for the committed package inputs | Undermines **TB-303** / ADR 0039 DENY + probe |
| **Committed run-header evidence anchors** after commit | Anchor continuity for finalized run identity | Undermines **TB-310** / ADR 0045 |
| **Committed package bytes** or **`ManifestHash`** after commit | Export verify / hash-pin story; replay identity | Undermines **TB-303** / **TB-307** / **TB-1003** |
| **`FindingReviewEvents`** history via update/delete | Race / disposition audit trail | Reviewers cannot reconstruct prior decisions (app-layer residual vs DENY tier) |
| DSAR / “correct the record” by editing old audit rows | Regulatory expectation of **correction via new event** | Prefer append correction events; do not mutate history |

**Allowed mutations** (from §4) destroy **only** non-sealed working state. That is intentional — do not extend those UPDATE paths onto SQL DENY–sealed §3 surfaces.


---

## 6. Correction and DSAR pattern

When a prior sealed statement was wrong:

1. **Append** a correcting audit / review event (or new sealed package version if product supports re-commit of a new run).
2. **Do not** `UPDATE` the historical row to “fix” the past.
3. Point operators and auditors at the **event sequence**, not a single mutable status cell.

---

## 7. CI anchors for **TB-1010** (contract published; CI **Done** 2026-08-12)

Honesty / architecture tests should fail closed when marketing or code implies:

| Forbidden implication | Anchor direction |
|-----------------------|------------------|
| Whole-product append-only / WORM | Must not pass without §2 non-claims |
| `Update*` / `Delete*` on audit repository interfaces | **INV-011** architecture tests |
| “Platform SQL Ledger included” | ADR 0040 / claim-boundary |
| Silent UPDATE of commit-sealed registry tables under app principal | Sealed DENY / startup-probe tests |
| Post-commit package byte mutation without new identity | Commit / hash-pin tests |
| Equating FindingReviewEvents with SQL DENY–sealed AuditEvents | Require §3 tier language |

Until **TB-1010** shipped (2026-08-12), this document was the **human** gate; CI is the **mechanical** gate (`check_append_only_sealed_evidence_honesty.py`).

---

## 8. Security · Scalability · Reliability · Cost

| Concern | Stance |
|---------|--------|
| **Security** | Append-only APIs + least-privilege SQL reduce insider rewrite risk; not a substitute for customer WORM. |
| **Scalability** | Append-only streams grow; retention / archive policies are operational (see evidence deep dive). |
| **Reliability** | Sealed commit + hash pin enables export verify; mutable queues remain eventually consistent by design. |
| **Cost** | Platform WORM / ledger deferred (ADR 0040) — avoids forced ledger TCO; customer cold-tier WORM is optional spend. |

---

## 9. One-line buyer answer

**ArchLucid enforces append-only and commit-sealed shapes on named surfaces at the tiers in §3 (SQL DENY for sealed evidence/audit; app-layer append for finding-review events); run lifecycle, drafts, enrichments, and triage queues remain mutable by design—and we do not sell platform WORM.**
