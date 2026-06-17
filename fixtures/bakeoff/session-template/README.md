# Bakeoff session template

Copy this folder to `artifacts/bakeoff/<session-label>/` before running [`docs/runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md`](../../docs/runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md).

**Do not commit** customer-identifying content under `artifacts/`. Use sanitized labels only in version control.

## Folder layout

```
<session-label>/
  packet/              # Shared sanitized architecture inputs (both arms)
  manual/
    manual-ai-prompt.txt
    manual-findings.md
  archlucid/
    packet-metadata.json
    sponsor-export/    # First-value MD or proof ZIP contents
  blind/               # assemble_blind_validation_packet outputs
  session-notes.md
  decision-delta.md
  bakeoff-summary.json
  bakeoff-summary.md
  sponsor-safe-summary.md
```

## Quick start

```powershell
$label = "demo-internal-01"
Copy-Item -Recurse fixtures/bakeoff/session-template "artifacts/bakeoff/$label"
# Fill templates; then follow the runbook five steps.
```
