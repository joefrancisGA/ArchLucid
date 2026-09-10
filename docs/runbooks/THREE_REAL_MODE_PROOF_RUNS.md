> **Scope:** Operator runbook for three real-mode proof runs before evidence-backed selling — supports claim readiness G5; not a substitute for CPA SOC 2 or third-party pen testing.

# Three real-mode proof runs (evidence-backed selling)

**Audience:** Repository owner, release operator, pilot operator with Azure OpenAI credentials.  
**Last reviewed:** 2026-09-07 (WK-13 agent-prep)

**Outcome:** Three documented real-mode committed runs with PASS/WARN/HOLD interpretation, redaction rules applied, and sponsor-send stop conditions satisfied before advancing to **Stage 1: Evidence-backed selling** per [`CLAIM_READINESS_STATUS.md`](../go-to-market/CLAIM_READINESS_STATUS.md).

**G4 log (canonical):** [`CLAIM_READINESS_STATUS.md#proof-packet-run-log`](../go-to-market/CLAIM_READINESS_STATUS.md#proof-packet-run-log) — `PROOF_PACKET_RUN_LOG.md` is a path-stable redirect only. **Agents must not append G4 rows or label Simulator output as Real.**

**One-command orchestrator (owner machine):**

```powershell
.\scripts\Run-GReal06ProofRuns.ps1 -Phase Interactive
```

Linux/macOS: `./scripts/run-g-real-06.sh Interactive`

Phases: `Prerequisites` (no spend), `CollectRun1` / `CollectRun2` / `CollectRun2b` / `CollectRun3` (with `-RunId`), `Rollup`, `Interactive`, `All`.

**Related:** [`OWNER_REAL_MODE_EVIDENCE_CHECKLIST.md`](OWNER_REAL_MODE_EVIDENCE_CHECKLIST.md) · [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](../quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) · [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) · [`POLICY_PACK_DELTA_DEMO_SCRIPT.md`](../go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md) · [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md)

---

## Prerequisites

| Requirement | Verify |
| --- | --- |
| Azure OpenAI credentials | `secrets/local-real-aoai.env` or repo variable `ARCHLUCID_CI_REAL_AOAI_ENABLED=true` |
| PilotStrict host | Agent execution mode **Real** on pilot stack (not simulator-only demo) |
| Approved scenarios | Three distinct architecture briefs — internal or sanitized buyer packets (no PII in repo) |
| Budget awareness | Golden cohort cap **$15** MTD — see [`GOLDEN_COHORT_BUDGET.md`](GOLDEN_COHORT_BUDGET.md) |
| Baseline discipline | Buyer ROI baselines captured or explicitly labeled defaulted — [`QUOTE_TO_PROOF_PACKET.md#pre-pilot-baseline-capture-operator-checklist`](../go-to-market/QUOTE_TO_PROOF_PACKET.md#pre-pilot-baseline-capture-operator-checklist) |

**Explicitly out of scope:** SOC 2 CPA attestation, third-party pen-test publication, marketplace checkout, enabling `AnonymousExecutionEnabled`, inventing a fourth finding engine for proof.

---

## Run matrix (three runs + optional overlay)

| Run | Scenario focus | Success bar |
| --- | --- | --- |
| **1** | Default Core Pilot path (Azure extractor Tier 1 or equivalent brief) | Commit succeeds; PilotStrict sponsor-evidence **PASS** |
| **2** | **Same architecture** + **second policy pack** (e.g. SOC 2 vs CIS Azure) on identical evidence | Finding rule ids / severities differ; pre-finalize gate delta recorded; policy-toggle delta captured in session notes |
| **2b** (optional) | Same run architecture + **overlay extra** (`cost.requireBudgetCap` on FinOps pack or CIS Azure `expectation.topologyCategories.add=identity`) | Coverage/cost findings or missing topology categories change — bundled FinOps / CIS Azure JSON must contain the keys (WK-04/WK-05) |
| **3** | Repeat / compare path (second review vs run 1) | Compare output attached; disposition SEND or explicit HOLD with remediation |

Run 2 and Run 2b may be separate committed runs or combined when the operator documents both pack swap and overlay in one session — still one qualifying G4 row per **distinct Real commit** used for evidence.

---

## Scenario briefs (agent may draft; owner must execute)

Use internal ids only — no customer PII in repo briefs.

### Run 1 — Core Pilot (default governance posture)

| Field | Guidance |
| --- | --- |
| **Brief id** | `g-real-06-run1-core-pilot` |
| **Evidence** | Azure extractor Tier 1 ZIP or starter brief from [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) |
| **Policy packs** | Default pilot assignment (e.g. security-architecture-baseline or org default) |
| **Execution mode** | **Real** — confirm on run detail before commit |
| **Owner judgment** | Findings plausible vs manifest; ≥1 execution trace opened |

### Run 2 — Policy pack delta (same architecture)

| Field | Guidance |
| --- | --- |
| **Brief id** | `g-real-06-run2-pack-delta` |
| **Evidence** | **Identical** upload/graph as Run 1 — do not re-ingest different architecture |
| **Policy packs** | Swap governance posture: e.g. **SOC 2** vs **CIS Microsoft Azure Foundations** |
| **Declaration floor** | Shipped bundled packs use `priorityFloor: P0`; for declaration-theme comparison use `-DeclarationPriorityFloor P1` on offline delta (see below) |
| **Delta capture** | Record pack ids, rule-key deltas, pre-finalize gate severity changes in session template |
| **Offline rehearsal (no spend)** | `.\scripts\demo-policy-pack-delta.ps1 -OfflineFindingDelta` or `python3 scripts/ci/write_policy_pack_finding_delta_offline_packet.py --out artifacts/policy-pack-delta-demo/offline` |
| **Post-commit delta (owner)** | `.\scripts\demo-policy-pack-delta.ps1 -RunId <run-2-guid> -ShowFindingDelta -DeclarationPriorityFloor P1` |

### Run 2b — Expectation overlay (optional)

| Field | Guidance |
| --- | --- |
| **Brief id** | `g-real-06-run2b-overlay` |
| **Evidence** | Same architecture as Run 1/2 |
| **Overlay choice A** | Assign **FinOps & Cloud Cost Optimization** pack (`cost.requireBudgetCap=true` in bundled JSON) |
| **Overlay choice B** | Assign **CIS Azure** pack (`expectation.topologyCategories.add=identity`) |
| **Success signal** | `cost-constraint` or topology coverage findings change vs Run 1 without architecture change |
| **Honesty** | Only claim overlay effect when the assigned pack JSON contains the key — see [`DEFAULT_POLICY_PACKS_V1.md`](../go-to-market/DEFAULT_POLICY_PACKS_V1.md) |

### Run 3 — Repeat / compare

| Field | Guidance |
| --- | --- |
| **Brief id** | `g-real-06-run3-compare` |
| **Evidence** | Second review on same or evolved brief; compare against Run 1 committed id |
| **Collect flags** | `-CompareBaseRunId '<run-1-guid>'` on proof collection |
| **Owner judgment** | Disposition SEND or documented HOLD with remediation plan |

---

## Agent may prepare / owner must judge

| Agent may | Owner must |
| --- | --- |
| Draft scenario briefs above, redaction checklist, spend-cap reminders (**$15** MTD golden cohort) | Execute Real-mode commits; judge faithfulness and sponsor-send |
| Point at capture scripts (inventory below) and `Run-GReal06ProofRuns.ps1` phases | Fill G4 rows in [`CLAIM_READINESS_STATUS.md#proof-packet-run-log`](../go-to-market/CLAIM_READINESS_STATUS.md#proof-packet-run-log) — **never** Simulator output labeled **Real** |
| Dry-run policy-toggle talk track (`demo-policy-pack-delta.ps1 -OfflineFindingDelta`, golden tests) | Confirm execution mode = **Real** on each packet before appending log row |
| Prepare `REAL_LLM_RUN_EVIDENCE_TEMPLATE.md` copies in private storage | Decide Run 2b overlay vs pack-only Run 2; attest **Clean = Yes** only when no manual surgery |

**Hard stops for agents:** Do not run Azure OpenAI spend, do not append fake G4 log rows, do not enable `AnonymousExecutionEnabled`, do not start SOC 2 CPA or third-party pen test.

---

## Capture scripts inventory (already in repo)

| Script | Purpose | Spend? | Typical phase |
| --- | --- | --- | --- |
| [`Run-GReal06ProofRuns.ps1`](../../scripts/Run-GReal06ProofRuns.ps1) | Guided G-REAL-06 orchestrator (prereq → collect → rollup) | Rollup only if credentials set | All runs |
| [`run-g-real-06.sh`](../../scripts/run-g-real-06.sh) | Linux/macOS launcher for orchestrator | Same | All runs |
| [`collect-first-pilot-proof.ps1`](../../scripts/collect-first-pilot-proof.ps1) | Per-run proof bundle + go/no-go | No (read-only API) | After each commit |
| [`Invoke-RealLlmEvidenceGate.ps1`](../../scripts/Invoke-RealLlmEvidenceGate.ps1) | Quad-agent real-LLM gate JSON (G5 adjunct) | **Yes** when credentials set | After run 3 / RC |
| [`demo-policy-pack-delta.ps1`](../../scripts/demo-policy-pack-delta.ps1) | Policy pack / gate delta demo | Optional with `-RunId` | Run 2 / 2b rehearsal |
| [`write_policy_pack_finding_delta_offline_packet.py`](../../scripts/ci/write_policy_pack_finding_delta_offline_packet.py) | Offline finding-delta cite packet | No | Run 2 prep |
| [`Invoke-WeeklyProofCadence.ps1`](../../scripts/Invoke-WeeklyProofCadence.ps1) | Weekly G4 rollup | No | Cadence |
| [`Test-ArchLucidPrerequisites.ps1`](../../scripts/Test-ArchLucidPrerequisites.ps1) | StagingRealLlm profile checks | No | Prerequisites |

**Key collector flags:** `-SponsorHandoff`, `-FailOnHold`, `-RunNumber`, `-CompareBaseRunId` — see [`CLAIM_READINESS_STATUS.md#operating-checklist`](../go-to-market/CLAIM_READINESS_STATUS.md#operating-checklist) for G4 column map (G-REAL-07).

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

**Run 2 additional steps:**

1. Reuse Run 1 evidence — change only policy pack assignment (and tenant governance posture if required).
2. Before or after commit, capture pack delta:
   ```powershell
   .\scripts\demo-policy-pack-delta.ps1 `
     -RunId '<run-2-guid>' `
     -ShowFindingDelta `
     -DeclarationPriorityFloor P1
   ```
3. Note finding rule ids, severities, and pre-finalize gate delta in [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](../quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) (policy-pack section).

**Run 2b additional steps:**

1. On same architecture, assign FinOps (`cost.requireBudgetCap`) **or** CIS Azure (`identity` topology extra) per brief above.
2. Confirm bundled pack JSON contains the key before claiming overlay effect.
3. Record overlay pack id and changed finding families in session template.

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

Or use orchestrator:

```powershell
.\scripts\Run-GReal06ProofRuns.ps1 -Phase CollectRun2 -RunId '<run-2-guid>' -CompareBaseRunId '<run-1-guid>'
```

### Phase D — Gate evidence rollup (after run 3 or RC)

```powershell
.\scripts\Invoke-RealLlmEvidenceGate.ps1
```

Attach `artifacts/release/real-llm-evidence-gate.json` to release evidence per [`RELEASE_CLAIM_GATE.md`](../quality/RELEASE_CLAIM_GATE.md).

Then roll the per-run human-counted faithfulness signals (unsupported-claim count, wrong/overstated findings, evidence-chain completeness) into the cross-run sponsor-facing correctness verdict using [`REAL_MODE_FAITHFULNESS_ROLLUP.md`](../quality/REAL_MODE_FAITHFULNESS_ROLLUP.md).

### Phase E — Append G4 log row (owner only)

1. Complete [`CLAIM_READINESS_STATUS.md#operating-checklist`](../go-to-market/CLAIM_READINESS_STATUS.md#operating-checklist).
2. Append one row per qualifying Real commit to [`#proof-packet-run-log`](../go-to-market/CLAIM_READINESS_STATUS.md#proof-packet-run-log).
3. In **Notes**, include Run 2 pack ids, compare base run id, and Run 2b overlay keys when used.

---

## Expected artifacts (per run)

| Artifact | Location | Purpose |
| --- | --- | --- |
| Session record | Copy of REAL_LLM_RUN_EVIDENCE_TEMPLATE | Human verdict + run id + policy-pack fields |
| Proof bundle | `artifacts/pilot-proof-run<N>/` | Sponsor handoff inputs |
| `go-no-go-summary.json` | Same folder | `sponsorPacketDisposition`, `roiSponsorSafe` |
| Policy delta (Run 2) | `artifacts/policy-pack-delta-demo/` | Optional pack/gate delta |
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
| G4 log Mode column | **Real** | — | **Simulator** (format reference only) |

**Stage 1 advance rule:** All three runs committed; ≥2 of 3 with READY or WARN disposition; **zero** BLOCK rows on sponsor handoff; real-mode gate fresh (≤30 days) or explicit partial-real-mode wording; **≥3** G4 rows with Mode=Real, Proof packet=Yes, Clean=Yes.

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
3. G4 log row would label **Simulator** as **Real** (agents: do not create such rows).
4. `roiSponsorSafe` = false or ROI narrative gate = **HOLD**.
5. `projectedDollarClaimsSponsorSafe` = false and export leads with dollar ROI.
6. PilotStrict sponsor-evidence disposition failed on a Real-mode host.
7. Real-mode gate missing and no valid waiver while claiming full-real-mode execution.
8. Data-consistency or procurement pack HOLD unresolved.
9. Golden cohort MTD spend at kill-switch (≥95% of **$15**) — pause Real runs until next budget window.

See [`CLAIM_READINESS_STATUS.md#appendix--sendno-send-hardening-review-2026-06-16`](../go-to-market/CLAIM_READINESS_STATUS.md#appendix--sendno-send-hardening-review-2026-06-16) for surface audit (`SPONSOR_CLAIM_LABEL_AUDIT.md` alias).

---

## Related

- [`GOLDEN_COHORT_REAL_LLM_GATE.md`](GOLDEN_COHORT_REAL_LLM_GATE.md)
- [`CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit`](../go-to-market/CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit) (`SPONSOR_CLAIM_LABEL_AUDIT.md` alias)
- [`FIRST_PILOT_OPERATOR_PATH.md#printable-first-run-evidence-checklist`](FIRST_PILOT_OPERATOR_PATH.md#printable-first-run-evidence-checklist)
- [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) — **G-REAL-06**, **G-REAL-07**, **M-39**
