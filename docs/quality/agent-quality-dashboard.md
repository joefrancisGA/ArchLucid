# Agent quality evidence dashboard

**Generated UTC:** 2026-05-29T16:52:18Z

> Buyer-safe summary of golden-cohort offline evals and real-mode posture. Regenerate with `python scripts/ci/generate_agent_quality_dashboard.py`.

## Buyer-safe summary

| Signal | Status | Evidence mode |
| --- | --- | --- |
| Faithfulness support ratio | **PASS** (mean=0.8571, floor=0.8) | offline fixtures |
| Retrieval IR recall@5 | **PASS** (mean=1.0) | offline fixtures |
| Unsupported ROI/cost claims (fixture scan) | **WARN** (1 rows flagged) | offline fixtures |
| Eval dataset manifest | **PRESENT** (schema v2, 4 datasets) | committed repo |

### PilotStrict posture (operator)

- Sponsor handoff uses **`FirstPilotAiQualityProof.ps1`** and consolidated AI readiness gate outputs.
- See [`AGENT_QUALITY_STRICT_MODE_PILOT.md`](../runbooks/AGENT_QUALITY_STRICT_MODE_PILOT.md) for host configuration.

## Real-mode Azure OpenAI evidence

- **Generated rollup:** not present — run `python scripts/ci/generate_real_llm_run_evidence.py`
- **Latest dated cohort note:** [`REAL_LLM_GOLDEN_COHORT_GATE_EVIDENCE_2026-05-09.md`](REAL_LLM_GOLDEN_COHORT_GATE_EVIDENCE_2026-05-09.md)
- **Session template:** [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](REAL_LLM_RUN_EVIDENCE_TEMPLATE.md)

Live Azure OpenAI runs are **not** merge-blocking on ordinary pull requests. When real-mode evidence was skipped, sponsor handoff must not claim live LLM quality.

## Internal-only caveats

- Offline fixture passes do **not** prove live model behavior on buyer corpora.
- Citation misses and wrong-corpus detections are tracked separately from unsupported ROI/cost claims.
- Do not attach raw prompts, secrets, or customer payloads to this dashboard.

## Golden cohort drift (latest)

Source: [`golden-cohort-drift-latest.md`](golden-cohort-drift-latest.md)

## Source artifacts

| Artifact | Path |
| --- | --- |
| Faithfulness report | `docs/quality/faithfulness-report.md` |
| Retrieval IR report | `docs/quality/retrieval-ir-report.md` |
| Eval manifest | `tests/eval-datasets/manifest.json` |
| Eval tooling | `scripts/ci/eval_agent_faithfulness.py`, `scripts/ci/eval_retrieval_ir.py` |
