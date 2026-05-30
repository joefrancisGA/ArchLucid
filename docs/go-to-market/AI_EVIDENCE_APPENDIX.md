# AI evidence appendix (buyer-safe)

> **Scope:** Index of **current** AI evidence in the repository. Does **not** claim third-party validation or fresh live-model proof unless explicitly noted.

## What is measured offline (deterministic CI)

| Evidence | Command / artifact | What it proves |
| --- | --- | --- |
| RAG faithfulness golden cohort | `python scripts/ci/eval_agent_faithfulness.py` → `docs/quality/faithfulness-report.md` | Positive readiness support ratio on normal fixtures, plus separate negative-control and combined diagnostic cohorts |
| Retrieval IR harness | `python scripts/ci/eval_retrieval_ir.py` | Recall/MRR on golden queries (offline) |
| Agent output quality gate | `python scripts/ci/eval_agent_corpus.py --enforce-quality-gate` | Schema, policy, and corpus checks on simulator outputs |
| Faithfulness + retrieval trend rollup | `./scripts/ci/Invoke-FaithfulnessTrendReport.ps1` (`-EnforceFaithfulness` optional) | Single Markdown/JSON artifact for assessment and release notes; floor override via `ARCHLUCID_FAITHFULNESS_MIN_SUPPORT_RATIO` |

## Current live Azure OpenAI evidence

| Evidence | Status | Notes |
| --- | --- | --- |
| Topology smoke (real Azure OpenAI) | **Gate profile: `topology-only`** | Proves completion path, JSON parsing, `evidenceRefs`, and `parseFailures=0` for one Topology agent. Does **not** prove full multi-agent merge or sponsor-safe manifest completeness. Metrics: `artifacts/release/real-llm-topology-metrics.json` |
| Full pipeline (real Azure OpenAI) | **Gate profile: `full-pipeline`** | Proves Topology + Compliance + Cost + Critic with merge success, manifest service count, and decision count. Required before claiming full real-LLM validation. Metrics: `artifacts/release/real-llm-full-pipeline-metrics.json` |
| Real-LLM evidence gate | **Skip-graceful; distinct dispositions** | `.\scripts\Invoke-RealLlmEvidenceGate.ps1` or `.\scripts\ci\Invoke-RealLlmGoldenCohort.ps1` writes `SKIPPED_NO_CREDENTIALS` (exit 0, not a pass), `PASS`, or `HOLD`. Optional workflow: `.github/workflows/real-llm-golden-cohort.yml` |
| Session record | **Template + dated session** | `docs/quality/REAL_LLM_SESSION_<date>.md` — see [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](../quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) |
| `ai-readiness-gate.json` on sponsor handoff | **Required when real-mode configured** | Emitted by `collect-first-pilot-proof.ps1 -SponsorHandoff` |

## Buyer-safe interpretation

- **Simulator** outputs are repeatable and cost-bounded; they do **not** prove semantic quality under your deployment model.
- **Faithfulness reports** should cite the positive readiness support ratio for quality posture and use negative-control results only to explain detector behavior.
- **Current live evidence** distinguishes **topology smoke** (`topology-only`) from **full pipeline** (`full-pipeline`). Topology smoke does not prove broad real-LLM quality, production SLA, full multi-agent merge success, SOC 2, or third-party validation.
- **Real** outputs must carry model/deployment metadata in run provenance and pass PilotStrict when used for sponsor-safe wording.
- **Unsupported ROI/cost claims** in faithfulness fixtures are flagged (`unsupported-roi-cost-claim`) — sponsor reports now include per-metric source classification.

## Related (internal depth)

- [`../library/AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md)
- [`../library/RAG_QUALITY_TECHNICAL_BACKLOG.md`](../library/RAG_QUALITY_TECHNICAL_BACKLOG.md)
- [`TRUST_CENTER.md`](TRUST_CENTER.md)
