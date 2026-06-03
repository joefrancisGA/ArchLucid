> **Scope:** Per-run log for G4 (repeatable proof packet). Append a row after each real pilot commit used for claim-readiness evidence.

# Proof packet run log

**Last reviewed:** 2026-06-02

**G4 target:** ≥3 rows with **Mode = Real**, **Proof packet generated? = Yes**, **Clean = Yes**.

| Run date (UTC) | Tenant | Run ID | Mode (Real/Simulator) | Proof packet generated? | Clean (no manual surgery)? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| _example_ | contoso-demo | `00000000-0000-0000-0000-000000000001` | Simulator | Yes | Yes | Format reference only — replace with first real pilot row |

## How to append a row

1. After commit, generate proof: `.\scripts\collect-first-pilot-proof.ps1 -RunId <guid>` (or multi-run flags per TB-227).
2. Confirm artifacts are buyer-safe and mode-labeled before marking **Clean = Yes**.
3. Update [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) G4 when three qualifying **Real** rows exist.

**Cross-refs:** [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) · [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
