> **Scope:** Lightweight operating checklist — guarantees every **real** pilot appends a valid row to `PROOF_PACKET_RUN_LOG.md` and updates `CLAIM_READINESS_STATUS.md` G4. No product code changes.

# Proof packet run log — operating checklist

**Audience:** Founder, pilot operator, release owner  
**Last reviewed:** 2026-06-17

**Purpose:** Close **G4** (repeatable proof packet) with auditable discipline — one real run → one proof packet → one log row → weekly gate review.

**Canonical log:** [`PROOF_PACKET_RUN_LOG.md`](PROOF_PACKET_RUN_LOG.md)  
**Gate status:** [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md)  
**Weekly rollup:** [`../runbooks/WEEKLY_PROOF_CADENCE.md`](../runbooks/WEEKLY_PROOF_CADENCE.md)

---

## Role ownership

| Role | Responsibility |
| --- | --- |
| **Pilot operator** | Run proof pipeline after commit; verify buyer-safe artifacts |
| **Founder / release owner** | Append log row; update G4 in claim readiness status |
| **Sales owner** | Block sponsor send when disposition is HOLD or log row missing |
| **Owner** | G5 real-LLM evidence (separate from G4 row discipline) |

---

## Per-run checklist (real pilots only)

Complete **within 24 hours** of a committed **Real**-mode review used for GTM evidence.

### 1. Generate proof packet

```powershell
.\scripts\collect-first-pilot-proof.ps1 `
  -RunId '<committed-run-guid>' `
  -SponsorHandoff `
  -FailOnHold
```

**Stop if:** exit code ≠ 0 or `go-no-go-summary.json` disposition = `HOLD`.

### 2. Pre-send gates (all required for **Clean = Yes**)

| Gate | Pass when | HOLD trigger |
| --- | --- | --- |
| **Execution mode** | `ai-readiness-gate.json` and exports label **Real** (not Simulator-only for real claim) | Unlabeled or simulator presented as live proof |
| **ROI basis** | `roiSponsorSafe = true` in go-no-go summary | Unlabeled dollar figures |
| **Sponsor disposition** | `disposition = SEND` when sponsor handoff intended | `HOLD` or missing go-no-go |
| **Manual surgery** | Proof folder usable without hand-editing findings/ROI | Required edits to make packet credible |
| **Redaction** | No customer PII, subscription IDs, or raw secrets in committed artifacts | Identifying content present |

### 3. Qualifying row criteria (G4)

A row counts toward **≥3 real runs** only when **all** hold:

| Column | Required value |
| --- | --- |
| Mode | **Real** |
| Proof packet generated? | **Yes** |
| Clean (no manual surgery)? | **Yes** |
| Run ID | Valid committed-run GUID |
| Notes | Proof folder path or `artifacts/first-pilot-evidence/<stamp>` reference |

**Does not qualify:** Simulator rows, demo-only Contoso runs, rows without proof packet, rows requiring manual surgery.

### 4. Append log row

Edit [`PROOF_PACKET_RUN_LOG.md`](PROOF_PACKET_RUN_LOG.md):

```markdown
| 2026-06-17 | pilot-acme-01 | `<run-guid>` | Real | Yes | Yes | artifacts/first-pilot-evidence/20260617-acme |
```

Remove or keep the `_example_` simulator row only as format reference — do not count it toward G4.

### 5. Update G4 gate

In [`CLAIM_READINESS_STATUS.md`](CLAIM_READINESS_STATUS.md):

| Qualifying real rows | G4 status | Blocking dependency text |
| --- | --- | --- |
| 0–2 | **HOLD** | `N of 3 qualifying real runs logged` |
| ≥3 | **PASS** | Link three run IDs in Notes or weekly cadence artifact |

Update **Last reviewed** date when G4 changes.

---

## Sponsor-send gate (same session)

Do **not** email sponsor PDF/ZIP until:

- [ ] Per-run checklist complete
- [ ] Log row appended
- [ ] `go-no-go-summary.md` disposition = **SEND**
- [ ] Execution mode visible on first-value report / proof index

If send proceeds without log row, G4 discipline is broken — treat as process failure, not product gap.

---

## Weekly review cadence

**When:** Same weekday each week during active pilots (recommended: Monday UTC).

**Owner:** Founder / release owner

```powershell
.\scripts\Invoke-WeeklyProofCadence.ps1
python scripts/ci/validate_weekly_proof_cadence.py --cadence-json artifacts/weekly-proof-cadence/<stamp>/weekly-proof-cadence.json
```

### Weekly checklist

| Step | Action |
| --- | --- |
| 1 | Count qualifying rows in `PROOF_PACKET_RUN_LOG.md` (Real + Yes + Yes) |
| 2 | Reconcile with `weekly-proof-cadence.json` G4 row |
| 3 | Update `CLAIM_READINESS_STATUS.md` G4 PASS/HOLD |
| 4 | If G4 still HOLD, schedule next real pilot proof run (do not expand Stage 1 claims) |
| 5 | Record session in the [claim readiness status appendix](CLAIM_READINESS_STATUS.md#appendix-session-record-template) format |

**Strict weekly gate (optional):**

```powershell
.\scripts\Invoke-WeeklyProofCadence.ps1 -Strict
```

Exit 1 = at least one G1–G6 gate HOLD — do not advance marketing claims.

---

## Stage 1 authorization rule

**Stage 1 — Evidence-backed selling** requires:

1. G1–G4 all **PASS**
2. ≥3 qualifying rows in proof run log
3. Founder dated signoff (even when gates are green)

Until signoff, status remains **HOLD_FOR_OWNER_SIGNOFF** per `CLAIM_READINESS_STATUS.md`.

---

## Quick reference commands

```powershell
# After each real commit
.\scripts\collect-first-pilot-proof.ps1 -RunId '<guid>' -SponsorHandoff -FailOnHold

# Weekly
.\scripts\Invoke-WeeklyProofCadence.ps1

# Procurement honesty (G6 spot-check)
python scripts/build_procurement_pack.py --dry-run --deal-ready
```

---

## Related

- [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md)
- [`REAL_MODE_EVIDENCE_COHORT.md`](../runbooks/REAL_MODE_EVIDENCE_COHORT.md)
- [`GTM_BACKLOG.md`](GTM_BACKLOG.md) — M-39 tracks checklist adoption
