# Real-mode LLM run evidence (generated rollup)

**Generated UTC:** 2026-05-29T16:52:18Z

> Scheduled or manual real Azure OpenAI evidence path. Regenerate with `python scripts/ci/generate_real_llm_run_evidence.py`.

## Evidence mode summary

| Mode | Present in this rollup |
| --- | --- |
| Deterministic simulator / schema gates | Yes (repo CI) |
| Offline faithfulness / retrieval IR | Yes — see [`agent-quality-dashboard.md`](agent-quality-dashboard.md) |
| Live Azure OpenAI session rows | **no / skipped** |

## Skipped live-mode collection

**Reason:** Azure OpenAI environment variables not set — live session not executed by this generator.

This is expected when `AZURE_OPENAI_*` secrets or a staging base URL are unavailable. Do not claim live LLM quality in sponsor packets when this section is present.

## Example fixture row (redacted shape)

| Field | Value |
| --- | --- |
| runDateUtc | — |
| environmentLabel | — |
| modelDeploymentAlias | — |
| scenarioCount | — |
| passCount | — |
| failCount | — |
| faithfulnessSupportRatio | — |
| estimatedUsd | — |
| estimatedTokensIn | — |
| estimatedTokensOut | — |
| pilotStrictDisposition | — |
| skippedReason | — |

Fixture source: `scripts/fixtures/real-llm-evidence/example-complete.json`

## Dated cohort notes in repo

- [`REAL_LLM_GOLDEN_COHORT_GATE_EVIDENCE_2026-05-09.md`](REAL_LLM_GOLDEN_COHORT_GATE_EVIDENCE_2026-05-09.md)

## Operator checklist

- Copy [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) per real session.
- Run golden cohort gate per [`GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md).
- Never print endpoint keys, secrets, or customer prompts in this rollup.
