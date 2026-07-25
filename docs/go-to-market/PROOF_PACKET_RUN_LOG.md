> **Reviewed:** 2026-07-25

> **Scope:** Per-run log for G4 (repeatable proof packet) plus the operating checklist that keeps rows honest. Append a row after each real pilot commit used for claim-readiness evidence.

# Proof packet run log

**Last reviewed:** 2026-07-25

**G4 target:** ≥3 rows with **Mode = Real**, **Proof packet generated? = Yes**, **Clean = Yes**.

**Gate status:** [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) · **Weekly rollup:** [`../runbooks/WEEKLY_PROOF_CADENCE.md`](../runbooks/WEEKLY_PROOF_CADENCE.md)

| Run date (UTC) | Tenant | Run ID | Mode (Real/Simulator) | Proof packet generated? | Clean (no manual surgery)? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| _example_ | contoso-demo | `00000000-0000-0000-0000-000000000001` | Simulator | Yes | Yes | Format reference only — replace with first real pilot row |

---

## Operating checklist

### Role ownership

| Role | Responsibility |
| --- | --- |
| **Pilot operator** | Run proof pipeline after commit; verify buyer-safe artifacts |
| **Founder / release owner** | Append log row; update G4 in claim readiness status |
| **Sales owner** | Block sponsor send when disposition is HOLD or log row missing |
| **Owner** | G5 real-LLM evidence (separate from G4 row discipline) |

### Per-run checklist (real pilots only)

Complete **within 24 hours** of a committed **Real**-mode review used for GTM evidence.

#### 1. Generate proof packet

```powershell
.\scripts\collect-first-pilot-proof.ps1 `
  -RunId '<committed-run-guid>' `
  -SponsorHandoff `
  -FailOnHold
```

**Stop if:** exit code ≠ 0 or `go-no-go-summary.json` disposition = `HOLD`.

#### 2. Pre-send gates (all required for **Clean = Yes**)

| Gate | Pass when | HOLD trigger |
| --- | --- | --- |
| **Execution mode** | Exports label **Real** (not Simulator-only for real claim) | Unlabeled or simulator presented as live proof |
| **ROI basis** | `roiSponsorSafe = true` in go-no-go summary | Unlabeled dollar figures |
| **Sponsor disposition** | `disposition = SEND` when sponsor handoff intended | `HOLD` or missing go-no-go |
| **Manual surgery** | Proof folder usable without hand-editing findings/ROI | Required edits to make packet credible |
| **Redaction** | No customer PII, subscription IDs, or raw secrets | Identifying content present |

#### 3. Qualifying row criteria (G4)

| Column | Required value |
| --- | --- |
| Mode | **Real** |
| Proof packet generated? | **Yes** |
| Clean (no manual surgery)? | **Yes** |
| Run ID | Valid committed-run GUID |

**Does not qualify:** Simulator rows, demo-only Contoso runs, rows without proof packet, rows requiring manual surgery.

#### 4. Append log row

Add a row to the table above. Keep the `_example_` simulator row only as format reference — do not count it toward G4.

#### 5. Update G4 gate

In [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md): 0–2 qualifying rows → **HOLD**; ≥3 → **PASS** (link three run IDs). Update **Last reviewed** when G4 changes.

### Sponsor-send gate

Do **not** email sponsor PDF/ZIP until per-run checklist complete, log row appended, `go-no-go-summary.md` = **SEND**, and execution mode visible on first-value report / proof index.

### Weekly review cadence

**When:** Same weekday each week during active pilots (recommended: Monday UTC). **Owner:** Founder / release owner.

```powershell
.\scripts\Invoke-WeeklyProofCadence.ps1
python scripts/ci/validate_weekly_proof_cadence.py --cadence-json artifacts/weekly-proof-cadence/<stamp>/weekly-proof-cadence.json
```

| Step | Action |
| --- | --- |
| 1 | Count qualifying rows (Real + Yes + Yes) |
| 2 | Reconcile with `weekly-proof-cadence.json` G4 row |
| 3 | Update `CLAIM_READINESS_STATUS.md` G4 PASS/HOLD |
| 4 | If G4 still HOLD, schedule next real pilot proof run |
| 5 | Record session in the [claim readiness appendix](CLAIM_READINESS_STATUS.md#appendix-session-record-template) |

**Stage 1 — Evidence-backed selling** requires G1–G4 **PASS**, ≥3 qualifying rows, and founder dated signoff.

**Cross-refs:** [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md) · [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
