> **Scope:** Operator runbook for recurring claim-gate proof cadence — produces gate-usable artifacts without widening product scope.

# Weekly proof cadence

**Audience:** Founder, release owner, pilot operators  
**Last reviewed:** 2026-06-15

## Purpose

Run a **repeatable weekly checklist** that records PASS/HOLD posture for claim gates **G1–G6**, references run IDs and execution mode, and flags missing real-mode evidence deterministically.

This workflow does **not** replace per-pilot proof collection — it aggregates readiness signals for claim authorization reviews.

## When to run

- Weekly during active pilots (recommended: same weekday each week).
- Before updating [`CLAIM_READINESS_STATUS.md`](../go-to-market/CLAIM_READINESS_STATUS.md).
- After any sponsor-handoff attempt that ended in HOLD.

## One-command packet

From the repository root:

```powershell
.\scripts\Invoke-WeeklyProofCadence.ps1
```

Strict mode (exit 1 when overall disposition is HOLD):

```powershell
.\scripts\Invoke-WeeklyProofCadence.ps1 -Strict
```

## Artifacts produced

Under `artifacts/weekly-proof-cadence/<timestamp>/`:

| Artifact | Purpose |
| --- | --- |
| `weekly-proof-cadence.json` | Machine-readable G1–G6 checklist |
| `weekly-proof-cadence.md` | Human review summary |
| `release-readiness/` | Release evidence bundle from `Emit-ReleaseReadinessEvidence.ps1` |
| `first-pilot-readiness/` | Readiness-only first-pilot proof folder |

## Required checklist fields

The JSON schema is `archlucid.weekly-proof-cadence.v1`. Each gate row includes:

- `status` — PASS, HOLD, WARN, or NOT_RUN
- `reason` — explicit PASS/HOLD rationale
- `evidenceRef` — doc or artifact pointer

Top-level fields also include `runIdsReferenced`, `executionModeSummary`, `evidenceFreshness`, and `missingRealModeEvidence`.

Validate locally:

```powershell
python scripts/ci/validate_weekly_proof_cadence.py --cadence-json artifacts/weekly-proof-cadence/<stamp>/weekly-proof-cadence.json
```

## Closing G4 from HOLD → PASS

Follow [`CLAIM_READINESS_STATUS.md#operating-checklist`](../go-to-market/CLAIM_READINESS_STATUS.md#operating-checklist):

1. Complete a real pilot commit (not simulator-only if claiming real-mode proof).
2. Run `.\scripts\collect-first-pilot-proof.ps1 -RunId <guid> -SponsorHandoff -FailOnHold`.
3. Pass pre-send gates; append a row to [`CLAIM_READINESS_STATUS.md#proof-packet-run-log`](../go-to-market/CLAIM_READINESS_STATUS.md#proof-packet-run-log) with **Mode = Real**, **Proof packet generated? = Yes**, **Clean = Yes**.
4. Repeat until **≥3** qualifying real rows exist.
5. Re-run weekly cadence and update G4 in `CLAIM_READINESS_STATUS.md`.

## Closing G5 from HOLD → PASS

1. Obtain owner-approved credentials for credentialed real-LLM execution.
2. Run `.\scripts\Invoke-RealLlmEvidenceGate.ps1`.
3. Archive `real-llm-evidence-gate.json` into the release evidence folder.
4. Re-run weekly cadence; advance G5 only when bundle reports `realModeAiEvidence.status = PASS`.

## Cross-refs

- [`CLAIM_READINESS_STATUS.md`](../go-to-market/CLAIM_READINESS_STATUS.md)
- [`CLAIM_READINESS_STATUS.md`](../go-to-market/CLAIM_READINESS_STATUS.md#appendix-gate-passhold-criteria)
- [`CLAIM_READINESS_STATUS.md#proof-packet-run-log`](../go-to-market/CLAIM_READINESS_STATUS.md#proof-packet-run-log)
- [`CLAIM_READINESS_STATUS.md#operating-checklist`](../go-to-market/CLAIM_READINESS_STATUS.md#operating-checklist)
- [`CANONICAL_FIRST_RUN_PATH.md`](../library/CANONICAL_FIRST_RUN_PATH.md)
