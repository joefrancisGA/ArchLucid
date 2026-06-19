> **Scope:** Operator runbook — real-mode evidence cohort for Stage 1 evidence-backed selling (SAQ-007). Consolidates existing scripts; not a substitute for CPA SOC 2 or third-party pen testing.

# Real-mode evidence cohort

**Audience:** Founder / release owner with Azure OpenAI credentials.  
**Last reviewed:** 2026-06-17

**Outcome:** ≥3 distinct real-mode committed runs plus a fresh `real-llm-evidence-gate.json` rollup before advancing sponsor-safe **Real** claims (G4/G5 in [`CLAIM_READINESS_STATUS.md`](../go-to-market/CLAIM_READINESS_STATUS.md)).

---

## Related (canonical detail)

| Topic | Doc |
| --- | --- |
| Three-run matrix and per-run procedure | [`THREE_REAL_MODE_PROOF_RUNS.md`](THREE_REAL_MODE_PROOF_RUNS.md) |
| Owner credential checklist | [`OWNER_REAL_MODE_EVIDENCE_CHECKLIST.md`](OWNER_REAL_MODE_EVIDENCE_CHECKLIST.md) |
| Session log template | [`../quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](../quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) |
| SAQ-007 stage gates | [`../library/SAQ_P0_RC_RELEASE_DECISIONS.md`](../library/SAQ_P0_RC_RELEASE_DECISIONS.md) |
| Founder signoff | Required for Stage 0 → 1 (≥3 real runs) |

---

## Prerequisites

| Requirement | Verify |
| --- | --- |
| Azure OpenAI credentials | `secrets/local-real-aoai.env` or `ARCHLUCID_CI_REAL_AOAI_*` repo secrets |
| Pilot stack in **Real** execution mode | Not simulator-only demo overlay |
| PilotStrict posture | Tenant/host quality gate configured; sponsor PDF blocked when HOLD |
| Three distinct briefs | Sanitized internal or buyer-redacted packets — no PII in repo |

**Do not create new AOAI deployments** — use existing CI/local credential paths documented in [`OWNER_REAL_MODE_EVIDENCE_CHECKLIST.md`](OWNER_REAL_MODE_EVIDENCE_CHECKLIST.md).

---

## Cohort procedure (summary)

1. **Run 1–3** — Follow [`THREE_REAL_MODE_PROOF_RUNS.md`](THREE_REAL_MODE_PROOF_RUNS.md) per run (create → execute Real → commit → proof packet).
2. **Collect proof** — For each committed `runId`:

```powershell
.\scripts\collect-first-pilot-proof.ps1 `
  -RunId '<committed-run-guid>' `
  -RunNumber <1|2|3> `
  -SponsorHandoff `
  -FailOnHold
```

3. **Gate rollup** — After run 3 (or RC cut):

```powershell
.\scripts\Invoke-RealLlmEvidenceGate.ps1
```

4. **Archive** — Copy `artifacts/release/real-llm-evidence-gate.json` (+ `.md`) into release evidence folder; attach to RC bundle per [`RELEASE_CLAIM_GATE.md`](../quality/RELEASE_CLAIM_GATE.md).

5. **Founder signoff** — Record Stage 0 → 1 approval in release notes when G1–G4 are green for all three runs.

---

## Exit criteria (cohort PASS)

| Signal | PASS |
| --- | --- |
| Committed runs | ≥3 distinct real-mode runs with manifests |
| Proof packets | Each run: `collect-first-pilot-proof.ps1 -FailOnHold` exit 0 |
| Execution mode | `structuralExecutionMode=Real` on each run; no unlabeled simulator substitution |
| Gate JSON | `overallOutcome=PASS`, four agent paths present |
| Sponsor UI | Review detail shows execution mode **Real**; sponsor PDF not blocked by execution-mode gate |

---

## Explicitly out of scope

- CPA SOC 2 attestation (TB-135 / V1.1 backlog)
- Third-party pen test (TB-136 / V1.1 backlog)
- Live Stripe / Marketplace commerce un-hold (V1.1)
