# SN-DF-05 — Workbench Data Flow mode

**Wave:** SecureNow data flow (**SN-DF**). **Depends on:** SN-DF-03 (`DiagramMode.DataFlow` + `"dataFlow"` parser). **Do not** implement SN-DF-06–08 (Data Architecture picker can land in 06).

Do not implement from the wave index. Implement only *What to build*.

## Goal

Operators can select **Data flow** on `/governance/infrastructure/diagrams` (`mermaidMode=dataFlow`) and the snapshot mermaid API compiles `DiagramMode.DataFlow`.

## Why

Compile without a mode key is dead code. `INFRA_DIAGRAMS_MODE_OPTIONS` currently: executive, network, identity, data, full, resourceGroup, dependencyNeighborhood.

## Context

- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts` (`INFRA_DIAGRAMS_MODE_OPTIONS`)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.test.ts`
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceMermaidModeParser.cs` (error string lists allowed modes)
- `ArchLucid.Application/InfraEvidence/Ask/DiagramViewPlanValidator.cs` (`AllowedMermaidModes`)
- `ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskPromptBuilder.cs` (allowedMermaidModes prose)
- `InfraEvidenceSnapshotMermaidService` mode previews if it enumerates modes

## What to build

1. Add `{ value: "dataFlow", label: "Data flow" }` to mode options (sentence case). Keep **Data** as the ARM category mode — do not rename it.
2. Parser: `"dataFlow"` → `DiagramMode.DataFlow`. Update unsupported-mode error text.
3. `DiagramViewPlanValidator.AllowedMermaidModes` includes `dataFlow`.
4. Ask prompt builder list includes `dataFlow`.
5. If mode-preview enumeration is hard-coded, include `dataFlow` so the workbench strip is not stale.
6. Tests: URL parse/serialize; parser; validator allowlist. UI unit/filter-url tests. **Do not** add Playwright unless an existing infra-diagrams mock spec is the cheapest ratchet — prefer filter-url + parser tests.
7. OpenAPI: `mermaidMode` is already a free string on the render query — **do not** regenerate OpenAPI unless a typed enum is in the snapshot and fails CI. If a typed enum exists, extend it and follow `API_CONTRACTS.md` (do not invent a second query param).

## Acceptance criteria

- `?mermaidMode=dataFlow` compiles Data Flow, not Data.
- Invalid modes still fall back to executive per existing resolver.
- Data option still labeled **Data**.

## Constraints

- Working-tree safety. No ghost/link buttons. No desktop tab collapse.
- Do **not** add Data architecture to the picker here (SN-DF-06).
- `mermaid-import-policy` unchanged.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceMermaidModeParser|FullyQualifiedName~DiagramViewPlanValidator'
cd archlucid-ui && npx vitest run src/lib/infra-evidence/infra-evidence-diagrams-filter-url.test.ts src/lib/infra-evidence/apply-diagram-view-plan-to-search.test.ts
```

Heartbeat every 8s if >15s. No `npm ci` unless node_modules missing.

## Done when

- Mode dropdown shows Data flow; URL round-trips; Ask cannot propose an unknown mode in place of `dataFlow`.
