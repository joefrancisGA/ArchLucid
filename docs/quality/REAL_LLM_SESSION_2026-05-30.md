# Real-LLM session record — 2026-05-30

Assessment improvement **#28** credentialed golden-cohort evidence run (owner dev subscription).

| Field | Value |
|-------|--------|
| **Date (UTC)** | 2026-05-30 |
| **Environment** | Local harness — `oai-archlucid-dev` / deployment `gpt-4o` |
| **Endpoint shape** | Classic SDK: `https://oai-archlucid-dev.openai.azure.com/` |
| **Agent mode** | Real (live Azure OpenAI via `RealAzureOpenAIEndToEndTests`) |
| **Model / deployment** | `gpt-4o` |
| **Brief / scenario** | ContosoRetailWeb 3-tier Azure web + SQL + Redis |
| **Gate disposition** | **HOLD** |
| **Topology smoke** | **Passed** — parseFailures=0, evidenceRefsObserved=true, structural substance=10 |
| **Full pipeline** | **Failed** — agents executed (parseFailures=0, evidenceRefsObserved=true) but `merge.Success=false`; no manifest services |
| **Human verdict** | **Acceptable partial evidence for pilot** — live AOAI path, parsing, and grounding refs proven; multi-agent merge remains follow-up (TB-138) |
| **Artifacts** | `artifacts/release/real-llm-evidence-gate.md`, `artifacts/release/real-llm-evidence-gate.json`, `artifacts/release/real-llm-topology-metrics.json`, `artifacts/release/real-llm-full-pipeline-metrics.json` |
| **Credentials** | Owner-local `secrets/local-real-aoai.env` (gitignored) |

## Regenerate

```powershell
# From repo root — requires secrets/local-real-aoai.env
.\scripts\Invoke-RealLlmEvidenceGate.ps1
```

See [REAL_LLM_RUN_EVIDENCE_TEMPLATE.md](REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) and [../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md).
