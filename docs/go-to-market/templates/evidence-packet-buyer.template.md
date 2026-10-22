> **Reviewed:** 2026-07-25

> **Scope:** Buyer-facing evidence packet template — map artifacts to sponsor decision needs with strict claim boundaries.
> **Canonical sources:** Do not restate policy here; link to [`PROCUREMENT_PACK_INDEX.md`](../PROCUREMENT_PACK_INDEX.md) and [`QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy`](../QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy).

# Evidence packet — buyer / sponsor sponsor (template)

**Audience:** Sponsor sponsor, procurement champion, buyer evaluator.

**Live evidence environment:** **Staging** (contract-authoritative) unless release owner documents an approved exception — [`RC_TARGET_ENVIRONMENT_MATRIX.md`](../../library/RC_TARGET_ENVIRONMENT_MATRIX.md).

---

## Required artifacts (V1 SEND)

| Artifact | Purpose | Claim boundary |
| --- | --- | --- |
| `go-no-go-summary.json` | Consolidated disposition | Use `sponsorPacketDisposition` verbatim: `SEND`, `HOLD`, `DEFERRED_SCOPE` only |
| `first-pilot-command-center.md` | Phase rollup | **READY** phases only — do not upgrade WARN/HOLD rows |
| `quote-to-proof-packet.md` | Value narrative | ROI figures require `roiSponsorSafe=true` and `baselineCompletenessStatus=COMPLETE` or valid override |
| Staging capture `staging-readiness-*.md` | Live API proof | Cite **Staging** URL class; do not paste secrets |
| `rc-go-no-go-verdict.json` | RC signoff | Use `verdict` field; strict RC HOLD blocks SEND |
| [`trust-center.md`](../trust-center.md) | Security posture | Self-assessment — **not** CPA SOC 2 attestation |

## Optional artifacts (strengthen narrative)

| Artifact | Purpose | Claim boundary |
| --- | --- | --- |
| `deploy-handoff.json` | Deploy readiness | Operational — not a buyer SLA |
| `release-confidence-rollup.json` | Gate rollup | Reference lane labels; do not invent PASS where HOLD |
| Sponsor packet ZIP (`archlucid sponsor-packet`) | Committed-run proof | One run only — label commit SHA, **execution mode**, and environment |
| [`DIFFERENTIATION_PROOF_PACKET.md`](../DIFFERENTIATION_PROOF_PACKET.md) | Why not generic AI | Evidence-linked claims only |

## Comparison — ArchLucid vs manual frontier AI (optional)

Use [`DIFFERENTIATION_PROOF_PACKET.md`](../DIFFERENTIATION_PROOF_PACKET.md) § Generic-AI comparison exercise. Score each rubric row **Better / Same / Worse / NOT_RUN**. Do not claim benchmark superiority without data.

## Deferred scope — label explicitly (do not imply V1 delivery)

| Buyer ask | V1 label |
| --- | --- |
| CPA SOC 2 Type I/II report | **DEFERRED / (B)** |
| Third-party penetration test publication | **DEFERRED / (B)** |
| Live Marketplace checkout | **DEFERRED / (B)** |
| First-party ITSM/chat/doc connectors | **V1.1** |

## Strict claim language

- **May claim:** finalized review artifact exists; governance audit trail; PilotStrict signals when `aiQualityProof.disposition=PASS`; Staging live probes when attached.
- **May not claim:** production SLA, invoiced Azure savings, SOC 2 certification, or real-mode AI quality when simulator-only or `roiSponsorSafe=false`.
- **SEND gate:** see [`QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy`](../QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy) — override requires `sponsor-owner` or `cfo-delegate` with template on file.

## Collection command (reference)

```powershell
./scripts/collect-first-pilot-proof.ps1 `
  -BaseUrl $env:ARCHLUCID_API_BASE_URL `
  -BearerToken $env:ARCHLUCID_BEARER_TOKEN `
  -RunId <committed-run-guid> `
  -SponsorHandoff `
  -OutputDirectory artifacts/first-pilot-proof
```

## Related

- [`QUOTE_TO_PROOF_PACKET.md`](../QUOTE_TO_PROOF_PACKET.md#sponsor-paid-pilot-proof-packet-assembly--mock-procurement-review) — six-element assembly map + mock procurement review
- [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`PROCUREMENT_PACK_INDEX.md#deal-ready-one-pager`](../PROCUREMENT_PACK_INDEX.md#deal-ready-one-pager)
- [`RELEASE_EVIDENCE_BUNDLE_SCHEMA.md`](../../quality/RELEASE_EVIDENCE_BUNDLE_SCHEMA.md)
