# SN-DF-08 — Empty stages and missing ADF companions

**Wave:** SecureNow data flow (**SN-DF**). **Depends on:** SN-DF-03, SN-DF-05. **Do not** implement SN-DF-HOLD.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When pipeline-flow companions are missing, or Transform/Consumer stages have no nodes, the workbench must **not** look like “this estate has no data.” Show completeness + empty-stage honesty.

## Why

Old ZIPs lack `adf-datasets.json` / `adf-pipeline-flows.json`. Materializer already has codes `adf-pipeline-flows-missing` / `adf-datasets-missing`. Diagrams workbench does not surface them (IE-DD-04 is Failed validation, different). Operators will re-collect tomorrow; until then Data Flow may be factory+stores with only `adfLinkedService` undirected edges — say so.

## Context

- `AzureInventoryRelationshipCompletenessWarningCodes` (`AdfPipelineFlowsMissing`, `AdfDatasetsMissing`)
- Snapshot header / `WarningCount`
- `DiagramsWorkbenchClient.tsx` (Failed strip — do **not** conflate with structural Failed)
- SN-DF-04 honesty sentence (keep it; add a second line when companions missing)

## What to build

1. Data Flow compile reads completeness warnings already on the snapshot/graph context if available; if the mermaid service only has the graph, pass warning codes from snapshot header into compile options (smallest seam — do not new collector).
2. If `adf-pipeline-flows-missing` (or datasets missing): caption **Pipeline direction was not in this package. Re-collect Azure inventory to see reads from / writes to.** Sentence case.
3. If Ingestion exists but Source and Storage are empty: caption **No resolved stores or named sources in this snapshot.**
4. Empty Transform/Consumer: omit the stage (already SN-DF-03); do **not** draw a dashed Power BI box.
5. Tests: fixture without pipeline-flow file → honesty/completeness line present; fixture with flows → that line absent.
6. UI: show the compile caption on the workbench for `dataFlow` (reuse existing helper/status region; no new ghost button).

## Acceptance criteria

- Missing companions are visible on Data Flow.
- No fake consumer nodes.
- Failed mermaid (IE-17) still uses IE-DD-04 path, not this caption.

## Constraints

- Working-tree safety. Do not auto-paint Failed mermaid.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidServiceTests|FullyQualifiedName~AzureInventoryAdf'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

Heartbeat every 8s if >15s.

## Done when

- An old ZIP without Prompt 7 companions still opens Data Flow with an explicit re-collect message, not a blank “success” that looks like no ADF.
