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

## Green cohort bar (release planning)

**Canonical model:** **`gpt-4o`**. Tiered targets for a committed **release cohort** (structural 100%, quality-gate rejects 0%, semantic p10/p50 floors, explainability completeness mean, adversarial qualitative until baselined) live in [`GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) §10. When filing this template after a cohort slice, add **cohort-level** metric summaries if your environment exposes them (UI, diagnostics, Grafana).

## Links

- Golden cohort gate: [GOLDEN_COHORT_REAL_LLM_GATE.md](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md)
- Release check-in stub: [REAL_MODE_EVIDENCE_RELEASE_CHECKIN.md](REAL_MODE_EVIDENCE_RELEASE_CHECKIN.md)
- Pilot ROI / sponsor narrative: [PILOT_ROI_MODEL.md](../library/PILOT_ROI_MODEL.md)
- Fixture summarizer (no cloud): `archlucid real-llm-evidence summarize --from-json <path>` — see `scripts/fixtures/real-llm-evidence/example-complete.json`
- Retrieval quality reports: `python scripts/ci/eval_agent_faithfulness.py --enforce` and `python scripts/ci/eval_retrieval_ir.py --enforce`
