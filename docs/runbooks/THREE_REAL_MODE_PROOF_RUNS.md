> **Scope:** Operator runbook for three real-mode proof runs before evidence-backed selling — supports claim readiness G5; not a substitute for CPA SOC 2 or third-party pen testing.

# Three real-mode proof runs (evidence-backed selling)

**Audience:** Repository owner, release operator, pilot operator with Azure OpenAI credentials.  
**Last reviewed:** 2026-06-16

**Outcome:** Three documented real-mode committed runs with PASS/WARN/HOLD interpretation, redaction rules applied, and sponsor-send stop conditions satisfied before advancing to **Stage 1: Evidence-backed selling** per [`CLAIM_READINESS_STATUS.md`](../go-to-market/CLAIM_READINESS_STATUS.md).

**Related:** [`OWNER_REAL_MODE_EVIDENCE_CHECKLIST.md`](OWNER_REAL_MODE_EVIDENCE_CHECKLIST.md) · [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](../quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) · [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) · [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md)

---

## Prerequisites

| Requirement | Verify |
| --- | --- |
| Azure OpenAI credentials | `secrets/local-real-aoai.env` or repo variable `ARCHLUCID_CI_REAL_AOAI_ENABLED=true` |
| PilotStrict host | Agent execution mode **Real** on pilot stack (not simulator-only demo) |
| Approved scenarios | Three distinct architecture briefs — internal or sanitized buyer packets (no PII in repo) |
| Budget awareness | Golden cohort cap **$15** MTD — see [`GOLDEN_COHORT_BUDGET.md`](GOLDEN_COHORT_BUDGET.md) |
| Baseline discipline | Buyer ROI baselines captured or explicitly labeled defaulted — [`QUOTE_TO_PROOF_PACKET.md#pre-pilot-baseline-capture-operator-checklist`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#pre-pilot-baseline-capture-operator-checklist) |

**Explicitly out of scope:** SOC 2 CPA attestation, third-party pen-test publication, marketplace checkout.

---

## Run matrix (three runs)

| Run | Scenario focus | Success bar |
| --- | --- | --- |
| **1** | Default Core Pilot path (Azure extractor Tier 1 or equivalent brief) | Commit succeeds; PilotStrict sponsor-evidence **PASS** |
| **2** | Governance-sensitive packet (policy pack dry-run → commit) | Quality gate pass; faithfulness floors met if retrieval claims used |
| **3** | Repeat / compare path (second review vs run 1) | Compare output attached; disposition SEND or explicit HOLD with remediation |

Record each run using [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](../quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md).

---

## Procedure (per run)

### Phase A — Environment

1. Confirm host `AgentExecution:Mode` = **Real** and deployment configured.
2. Run budget probe if using shared credentials: `.\scripts\Invoke-RealLlmEvidenceGate.ps1` (optional pre-check).
3. Label environment URL pattern only in evidence files — no secrets in repo.

### Phase B — Execute and commit

Follow [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) Phases A–C:

1. Create review → Execute → Commit.
2. Confirm structural execution mode = **Real** (not Fallback/Mixed without review).
3. Skim agent-backed findings vs manifest; open ≥1 execution trace.

### Phase C — Collect proof artifacts

```powershell
.\scripts\collect-first-pilot-proof.ps1 `
  -RunId '<committed-run-guid>' `
  -RunNumber <1|2|3> `
  -SponsorHandoff `
  -FailOnHold
```

When run 2 compares to run 1:

```powershell
.\scripts\collect-first-pilot-proof.ps1 `
  -RunId '<run-2-guid>' `
  -RunNumber 2 `
  -CompareBaseRunId '<run-1-guid>' `
  -SponsorHandoff `
  -FailOnHold
```

### Phase D — Gate evidence rollup (after run 3 or RC)

```powershell
.\scripts\Invoke-RealLlmEvidenceGate.ps1
```

Attach `artifacts/release/real-llm-evidence-gate.json` to release evidence per [`RELEASE_CLAIM_GATE.md`](../quality/RELEASE_CLAIM_GATE.md).

Then roll the per-run human-counted faithfulness signals (unsupported-claim count, wrong/overstated findings, evidence-chain completeness) into the cross-run sponsor-facing correctness verdict using [`REAL_MODE_FAITHFULNESS_ROLLUP.md`](../quality/REAL_MODE_FAITHFULNESS_ROLLUP.md).

---

## Expected artifacts (per run)

| Artifact | Location | Purpose |
| --- | --- | --- |
| Session record | Copy of REAL_LLM_RUN_EVIDENCE_TEMPLATE | Human verdict + run id |
| Proof bundle | `artifacts/pilot-proof-run<N>/` | Sponsor handoff inputs |
| `go-no-go-summary.json` | Same folder | `sponsorPacketDisposition`, `roiSponsorSafe` |
| Real-mode gate JSON | `artifacts/release/real-llm-evidence-gate.json` | Quad-agent path evidence (rollup) |
| Faithfulness reports | When retrieval-backed claims used | `faithfulness-report.md`, `retrieval-ir-report.md` |

---

## PASS / WARN / HOLD interpretation

| Signal | PASS | WARN | HOLD |
| --- | --- | --- | --- |
| `sponsorPacketDisposition` | READY | WARN | HOLD / READINESS_ONLY |
| `real-llm-sponsor-evidence` finding | PASS | — | BLOCK |
| PilotStrict posture | Satisfied | Caveated labels | Failed |
| ROI claim gate | PASS | WARN (directional dollars) | HOLD (no projected dollars) |
| Execution mode | Real | Mixed (per-agent review) | Simulator / Fallback unlabeled |
| Demo tenant | — | — | Always HOLD for buyer outcomes |

**Stage 1 advance rule:** All three runs committed; ≥2 of 3 with READY or WARN disposition; **zero** BLOCK rows on sponsor handoff; real-mode gate fresh (≤30 days) or explicit partial-real-mode wording.

---

## Redaction rules

- No customer PII, tenant names, or production URLs in committed repo artifacts.
- Store buyer quotes and participant names in private storage only.
- Redact deployment names from sponsor exports if policy requires — keep internal session record complete.
- Demo-derived numbers must carry **demo-derived** labels — never quote as buyer outcomes.

---

## Sponsor-send stop conditions

**Do not send** sponsor materials externally when any of the following hold:

1. `sponsorPacketDisposition` = **HOLD** and `-FailOnHold` proof collection failed.
2. Structural execution mode is **Simulator** or **Fallback** without explicit labels in the packet.
3. `roiSponsorSafe` = false or ROI narrative gate = **HOLD**.
4. `projectedDollarClaimsSponsorSafe` = false and export leads with dollar ROI.
5. PilotStrict sponsor-evidence disposition failed on a Real-mode host.
6. Real-mode gate missing and no valid waiver while claiming full-real-mode execution.
7. Data-consistency or procurement pack HOLD unresolved.

See [`CLAIM_READINESS_STATUS.md#appendix--sendno-send-hardening-review-2026-06-16`](../go-to-market/CLAIM_READINESS_STATUS.md#appendix--sendno-send-hardening-review-2026-06-16) for surface audit (`SPONSOR_CLAIM_LABEL_AUDIT.md` alias).

---

## Related

- [`GOLDEN_COHORT_REAL_LLM_GATE.md`](GOLDEN_COHORT_REAL_LLM_GATE.md)
- [`CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit`](../go-to-market/CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit) (`SPONSOR_CLAIM_LABEL_AUDIT.md` alias)
- [`FIRST_PILOT_OPERATOR_PATH.md#printable-first-run-evidence-checklist`](FIRST_PILOT_OPERATOR_PATH.md#printable-first-run-evidence-checklist)
