> **Scope:** Contributor-reference — committed golden manifest as unit of truth (TB-1003); not a buyer-facing trust claim.

# Committed golden manifest unit of truth (**TB-1003**)

> **Audience:** Contributors, principal architects, and GTM claim reviewers.  
> **Not** a buyer assurance claim — application-layer `ManifestHash` lineage ≠ WORM storage and ≠ PKI signing.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#committed-golden-manifest-unit-of-truth-m-155) (GTM **M-155**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (GTM **M-154**).  
**Proof-language audit:** [`CLAIM_READINESS_STATUS.md`](../go-to-market/CLAIM_READINESS_STATUS.md#proof-language-claim-audit-static-buyer-docs) (formerly `PROOF_LANGUAGE_CLAIM_AUDIT.md`).  
**Tamper-evident lineage:** [ADR 0040](../architecture/adrs/0040-tamper-evident-lineage-without-worm-storage.md) · [`EVIDENCE_IMMUTABILITY.md`](EVIDENCE_IMMUTABILITY.md).  
**Audit coverage:** [`AUDIT_COVERAGE_MATRIX.md`](AUDIT_COVERAGE_MATRIX.md) · Required audit **TB-953**.

---

## Decision in one line

The only unit of truth for buyer-facing **review-backed / finalized / signed package** claims is the **committed golden manifest** (`dbo.GoldenManifests` / `Runs.GoldenManifestId` + `ManifestHash`). Everything else is useful context, a projection, or a hop-skip surface — and must use an honest label instead of pretending it is that record.

---

## Unit of truth

| Item | Role |
|------|------|
| Committed golden manifest | **Unit of truth** for finalized architecture package / sealed review record |
| `GoldenManifestId` + `ManifestHash` | Identity + app-layer hash lineage after commit |
| Buyer vocabulary | “Finalized architecture package” / “sealed review record” **only after commit** |
| `review-backed` (proof-language) | Refers to that committed package — not drafts, Ask, or Simulator |

---

## Chain hops (required for `review-backed`)

| Hop | Role | Must not be skipped when claiming review-backed |
|-----|------|--------------------------------------------------|
| Evidence | Grounding inputs | Emitting “decision-grade” without evidence path → **TB-1221** |
| Finding | Working / sealed signals | Findings list alone ≠ package |
| Manifest (commit) | **Finalize** | Hop-skip here invents a parallel “signed” story |
| Artifact | Projection (PDF/DOCX/ZIP, export-verify) | Derived from commit; not a second authority |
| Audit | Append-only ledger | UI logs alone ≠ audit trail |

---

## Projections (OK if labeled)

| Surface | Honest framing |
|---------|----------------|
| Sponsor PDF / DOCX / ZIP | **Export / projection** — verify against commit; not a second unit of truth |
| Export-verify / hash check | Integrity check of a projection; **not** WORM or PKI |
| Sponsor UI summaries of a committed run | OK when tied to commit; still not a substitute for the manifest row |

---

## Forbidden substitutes / hop-skips

| Surface | Why forbidden as “finalized / signed package” |
|---------|-----------------------------------------------|
| Uncommitted `Run` / ReadyForCommit / partial execute | No commit seal |
| Findings snapshot alone | Child signals, not the package |
| Agent results / traces alone | Intermediate execution |
| `DraftRequests` / draft workspace | Draft |
| Ask / RAG answers / chat transcript | Conversational |
| Simulator / demo / seed as customer outcome | Illustrative |
| UI sponsor summary without commit | Summary theater |
| Governance approval without commit | Gate ≠ finalize |
| Artifact without commit | Orphan projection |
| “Audit” that is UI logs only | Not append-only Required audit |

---

## Honest labels (instead of faking)

| Surface class | Label |
|---------------|-------|
| Ask / chat / explainer | **Conversational** / assistive |
| Uncommitted / draft | **Draft** / in progress |
| Findings before commit | **Working findings** |
| Simulator / showcase / Contoso sample | **Illustrative sample** / demo-derived |
| Sponsor export | **Export / projection** |
| ROI on non-committed or illustrative surfaces | **Estimate** / basis-labeled (coordinate **TB-983**–**TB-985**; do not duplicate dollar-forbid rules here) |

---

## Explicit non-claims

- Do **not** claim platform WORM or PKI signing beyond app-layer hash lineage (ADR 0040).
- Do **not** rename API `GoldenManifest` via this contract.
- Do **not** claim that a committed manifest proves semantic faithfulness or a zero AgentTask overlay (**TB-1196** / triad **TB-1416**).
- Do **not** close sealed-evidence inventory (**TB-1009**), Required-audit implementation (**TB-953**), or per-finding provenance fail-closed (**TB-1221**) by publishing this matrix.
- Do **not** close honesty CI (**TB-1004**) by publishing this matrix.

---

## Follow-on / CI anchors (**TB-1004**)

| Anchor | Purpose |
|--------|---------|
| This contract + `review-backed` / commit language | Required cite near “finalized package” / “signed decision record” / “evidence trail” |
| Fail buyer stubs | Uncommitted/findings/Ask/draft/Simulator = signed package; fake Evidence→audit without commit |
| Optional | Flag “committed package” claims on Simulator/demo without illustrative label (coordinate **TB-985** / **M-138**) |
| Verification | Existing sponsor / proof-language gates; do not re-implement `SponsorFirstValuePdfGate` |

---

## Related

- GTM **M-154** / **M-155** / **M-138** / **M-191** / **M-253**/**M-254**
- Done commit/hash path (**TB-307** / ADR 0040) · Required audit **TB-953**
- Open **TB-1004** (honesty CI) · **TB-1009** (sealed inventory) · **TB-1221** (finding provenance) · **TB-1156** (hasher evolution)
