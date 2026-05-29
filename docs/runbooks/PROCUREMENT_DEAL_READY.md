> **Scope:** Deal-ready procurement pack checks and explicit deferred-scope classification for first-pilot / release handoff.

# Procurement deal-ready

**Audience:** Release owners, founders, and sales engineers answering procurement without mixing V1 blockers with deferred assurance.

**Last reviewed:** 2026-05-28

---

## Commands

From repo root:

```powershell
python scripts/build_procurement_pack.py --dry-run --deal-ready `
  --json-summary-out artifacts/procurement-deal-ready-summary.json `
  --classification-md-out artifacts/procurement-deal-ready-classification.md
```

First-pilot proof collection runs the same dry-run and writes artifacts under the proof folder:

- `procurement-deal-ready-check.txt`
- `procurement-deal-ready-summary.json`
- `procurement-deal-ready-classification.md`

---

## Scope classifications

| Label | Meaning |
| --- | --- |
| **V1_READY** | Required V1 assurance source present; not a blocking defect |
| **BLOCKING** | Missing source file, buyer-unsafe placeholder, or required marker — repair before external send |
| **DEFERRED_SCOPE** | Documented V1.1/V2/(B) item — honest deferral, not a V1 product failure |
| **OWNER_REQUIRED** | Owner-only commercial or operational action outside default V1 pilot proof |
| **INFORMATIONAL_B_ONLY** | Procurement / market-motion realism under **(B)** — zero weight on **(A)** headline readiness |

Catalog rows (SOC 2 CPA, third-party pen test, reference customer, live marketplace checkout, MCP, V1.1 connectors) always appear in **`procurement-deal-ready-classification.md`** with **source doc** links.

---

## PASS vs HOLD

**PASS** when `blocking_violation_count` is **0**. Stale **Last reviewed** markers and static deferred realism notes may still appear under **DEFERRED_SCOPE** — they do **not** flip disposition to HOLD.

**HOLD** when a true V1 blocker exists (for example `missing required deal-ready doc: docs/go-to-market/TRUST_CENTER.md`).

---

## Related documents

| Doc | Use |
| --- | --- |
| [HOW_TO_REQUEST_PROCUREMENT_PACK.md](../go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md) | Full pack build and ZIP |
| [PROCUREMENT_PACK_INDEX.md](../go-to-market/PROCUREMENT_PACK_INDEX.md) | Buyer index |
| [V1_DEFERRED.md](../library/V1_DEFERRED.md) | Deferred scope authority |
| [FIRST_PILOT_EVIDENCE_BUNDLE.md](FIRST_PILOT_EVIDENCE_BUNDLE.md) | Proof pipeline |
