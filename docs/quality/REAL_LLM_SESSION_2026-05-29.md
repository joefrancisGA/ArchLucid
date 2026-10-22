> **Scope:** Real-LLM session record — 2026-05-29 - full detail, tables, and links in the sections below.

# Real-LLM session record — 2026-05-29

Assessment improvement **#1** evidence capture (owner dev subscription).

| Field | Value |
|-------|--------|
| **Date (UTC)** | 2026-05-29 |
| **Environment** | Local harness — `oai-archlucid-dev` / deployment `gpt-4o` |
| **Endpoint shape** | Classic SDK: `https://oai-archlucid-dev.openai.azure.com/` (not Foundry project URL) |
| **Agent mode** | Real (live Azure OpenAI via `RealAzureOpenAIEndToEndTests.Live_topology_agent_only_produces_valid_agent_result`) |
| **Model / deployment** | `gpt-4o` |
| **Brief / scenario** | ContosoRetailWeb 3-tier Azure web + SQL + Redis |
| **Outcome** | Topology agent returned parsed JSON with claims + evidenceRefs; parseFailures=0 |
| **Quality gate outcome** | Topology-only smoke — decision merge partial (`mergeSuccess=false`, no manifest services on minimal output) |
| **Human verdict** | **Acceptable for pilot evidence** — proves live LLM path, parsing, and evidenceRefs; full quad-agent merge remains follow-up |
| **Artifacts** | `artifacts/release/real-llm-evidence-gate.md`, `artifacts/release/real-llm-last-run-metrics.json` |
| **Credentials** | Owner-local `secrets/local-real-aoai.env` (gitignored) |

## Regenerate

```powershell
# From repo root — requires secrets/local-real-aoai.env
Get-Content secrets/local-real-aoai.env | ForEach-Object { ... }  # or dot-source helper
.\scripts\Invoke-RealLlmEvidenceGate.ps1
```

See [REAL_LLM_RUN_EVIDENCE_TEMPLATE.md](REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) and [../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md).
