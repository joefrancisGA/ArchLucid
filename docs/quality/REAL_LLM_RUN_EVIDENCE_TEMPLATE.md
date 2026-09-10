> **Scope:** Single-session record for real Azure OpenAI (non-simulator) authority runs — supports manual QA §8.3, golden cohort posture, and pilot credibility; **not** a substitute for automated eval jobs.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Real-LLM run evidence — session template

**Audience:** Operators and release owners documenting **one** real-mode validation session.

## Session record (copy per run)

| Field | Value |
|-------|--------|
| **Date (UTC)** | |
| **Environment** | Staging / pilot stack — URL pattern only |
| **Agent mode** | Real / real-with-fallback (as configured) |
| **Model or deployment id** | If policy allows |
| **Brief / scenario id** | Internal id or short description (no customer PII) |
| **Run id** | Authority run GUID |
| **G-REAL-06 run slot** | Run 1 / Run 2 / Run 2b (overlay) / Run 3 — see [`THREE_REAL_MODE_PROOF_RUNS.md`](../runbooks/THREE_REAL_MODE_PROOF_RUNS.md) |
| **Policy pack ids (Run 2+)** | e.g. `soc2`, `cis-azure-foundations` — same architecture as Run 1 |
| **Compare base run id** | Run 1 GUID when Run 2/3 used `-CompareBaseRunId` |
| **Overlay extras (Run 2b)** | `cost.requireBudgetCap` (FinOps) and/or `expectation.topologyCategories.add=identity` (CIS Azure) — blank if not used |
| **Finding / gate delta captured?** | Yes / No — link `demo-policy-pack-delta` artifacts or offline packet |
| **Outcome** | Commit succeeded / blocked / aborted — note |
| **Quality gate outcome** | pass / accepted / rejected / unresolved |
| **PilotStrict sponsor-evidence disposition** | `pilot-strict-sponsor-evidence-pass` / `pilot-strict-violates-sponsor-evidence` / `pilot-strict-signals-unresolved` |
| **Human verdict** | **acceptable for pilot** / **not yet** — 1–3 sentences |
| **Gate disposition** | `SKIPPED_NO_CREDENTIALS` / `PASS` / `HOLD` — from `artifacts/release/real-llm-evidence-gate.json` |
| **Topology metrics JSON** | `artifacts/release/real-llm-topology-metrics.json` when topology smoke ran |
| **Full pipeline metrics JSON** | `artifacts/release/real-llm-full-pipeline-metrics.json` when full pipeline ran |
| **Structural / semantic scores** | If surfaced (UI, diagnostics, export) |
| **Retrieval faithfulness / IR evidence** | Attach `faithfulness-report.md` and `retrieval-ir-report.md` when used for this release or pilot |
| **Follow-ups** | Prompt, brief quality, agent-specific defects |

## Checklist (align with [MANUAL_QA_CHECKLIST.md](MANUAL_QA_CHECKLIST.md) §B.7)

- [ ] Skimmed agent-backed findings for plausible claims vs manifest.
- [ ] Opened at least one execution trace; model addressed the request shape.
- [ ] Confirmed the quality gate outcome is passing before treating the run as sponsor evidence.
- [ ] Confirmed PilotStrict sponsor-evidence disposition is passing when the host is configured for PilotStrict.
- [ ] Confirmed retrieval faithfulness / IR reports meet configured floors when retrieval-backed claims are part of the sponsor story.
- [ ] Compared to simulator on a similar brief if feasible (optional).
- [ ] For **Run 2**: recorded policy pack ids and finding/severity/gate delta (or linked offline `demo-policy-pack-delta` packet).
- [ ] For **Run 2b**: recorded overlay pack and changed finding families (`cost-constraint` or topology `identity`).
- [ ] G4 log row appended in [`CLAIM_READINESS_STATUS.md#proof-packet-run-log`](../go-to-market/CLAIM_READINESS_STATUS.md#proof-packet-run-log) with Mode = **Real** (owner only — not agent).

## Policy-pack delta (Run 2 / Run 2b)

| Field | Value |
|-------|--------|
| **Primary pack id** | |
| **Secondary / overlay pack id** | |
| **Declaration priority floor used** | P0 (shipped default) / P1 (declaration comparison) |
| **Rule-key delta summary** | Brief note or path to `artifacts/policy-pack-delta-demo/` |
| **Pre-finalize gate delta** | Severity / disposition change vs Run 1 |
| **Offline packet path** | e.g. `artifacts/policy-pack-delta-demo/offline/finding-delta-offline.md` |

**Scripts:** `.\scripts\demo-policy-pack-delta.ps1 -ShowFindingDelta` (live) · `-OfflineFindingDelta` (no spend) · `python3 scripts/ci/write_policy_pack_finding_delta_offline_packet.py`

## Green cohort bar (release planning)

**Canonical model:** **`gpt-4o`**. Tiered targets for a committed **release cohort** (structural 100%, quality-gate rejects 0%, semantic p10/p50 floors, explainability completeness mean, adversarial qualitative until baselined) live in [`GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) §10. When filing this template after a cohort slice, add **cohort-level** metric summaries if your environment exposes them (UI, diagnostics, Grafana).

## Links

- Cross-run faithfulness rollup (sponsor correctness verdict): [REAL_MODE_FAITHFULNESS_ROLLUP.md](REAL_MODE_FAITHFULNESS_ROLLUP.md)
- Golden cohort gate: [GOLDEN_COHORT_REAL_LLM_GATE.md](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md)
- Release check-in stub: [REAL_MODE_EVIDENCE_RELEASE_CHECKIN.md](REAL_MODE_EVIDENCE_RELEASE_CHECKIN.md)
- Pilot ROI / sponsor narrative: [PILOT_ROI_MODEL.md](../library/PILOT_ROI_MODEL.md)
- Fixture summarizer (no cloud): `archlucid real-llm-evidence summarize --from-json <path>` — see `scripts/fixtures/real-llm-evidence/example-complete.json`
- Retrieval quality reports: `python scripts/ci/eval_agent_faithfulness.py --enforce` and `python scripts/ci/eval_retrieval_ir.py --enforce`
