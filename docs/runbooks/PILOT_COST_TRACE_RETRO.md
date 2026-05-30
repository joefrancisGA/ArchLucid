> **Scope:** Pilot cost trace retro - full detail, tables, and links in the sections below.

# Pilot cost trace retro

> **Scope:** Post-pilot economics review — **estimates only**, not invoice truth.

## When to run

After the first committed review in a pilot tenant, before quoting expansion or annual conversion.

## Collect

| Signal | Source |
| --- | --- |
| Per-run LLM token estimates | Run detail / execution traces; `pilot-run-deltas.json` |
| Budget warnings | API problem type `LlmTokenQuotaExceeded`; ops logs |
| Retrieval/cache activity | Run forensics / retrieval grounding panel |
| Pricing assumption deltas | Compare tenant window LLM USD vs `ValueReportComputationOptions` defaults |

## Optional script (read-only)

```powershell
# After proof packet or reference-evidence export:
$runId = '<committed-run-id>'
$deltas = Get-Content "artifacts/proof-packet/$runId/run-evidence.json" | ConvertFrom-Json
[pscustomobject]@{
  runId = $runId
  llmCallCount = $deltas.llmCallCount
  note = 'USD estimates are model-derived — see first-value report ROI source classification'
} | ConvertTo-Json
```

## Interpretation

- Label all USD figures **BenchmarkAssumption** unless tied to customer-provided baselines.
- Do not treat Azure retail price rows as realized spend without billing export evidence.

Related: [`../library/PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) · [`../go-to-market/COMMERCIAL_DECISION_PACKET.md`](../go-to-market/COMMERCIAL_DECISION_PACKET.md)
