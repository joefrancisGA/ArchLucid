# SN-RT-07 — Observed evidence family on Data Flow (Option B)

**Wave:** SecureNow runtime connections (**SN-RT**). **Option B.** **Depends on:** SN-RT-06 row ingest + SN-PE-01 catalog. **Do not** implement SN-RT-08–10.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Paint `dependency-observations.json` as a **new** Data Flow evidence family `ObservedRuntime` with labels **Observed in logs** (read/write when `operationClass` is known). Never reuse **May access** / **Reads from** / **Writes to** (ADF). Honesty legend must say observations are a time window, not architecture.

## Why

If observed edges use the same stroke as RBAC, operators will read “SQL audit hit” as “declared pipeline.” SN-PE-HOLD forbids flow logs as architecture arrows — this prompt **adds a distinct family** instead of smuggling them into authorized access.

## Context

- `ArchLucid.Core/AzureExtractor/AzureInventoryDataFlowEvidenceFamily.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryDataFlowEvidenceCatalog.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramDataFlowHonestyLegend.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramEdgeLabelHumanizer.cs`
- SN-PE-01 / SN-PE-06 (consume; do not rewrite percents)

## What to build

1. New association type e.g. `observedDependency` (`ProvenanceKind.ObservedFact`, band `Confirmed` **only** for the observation itself — caption must still say **time-bounded log evidence**, not “this is the architecture”).
2. Catalog family `ObservedRuntime`. `IncludeOnDataFlow = true`. Label **Observed in logs**; optional suffix **(read)** / **(write)**.
3. Mapper from companion rows → relationships. Skip `managedIdentitySignIn` with null target (too coarse) **or** attach to a type-level external node — prefer **skip** + warning `observed-target-unresolved`.
4. Honesty: extra caption line when any ObservedRuntime edge is present (own constant, sentence case).
5. Tests: fixture with RBAC May access **and** observed SQL edge → two edges, different labels; legend contains the observed sentence; no percent field.

## Acceptance criteria

Workbench Data Flow can show declared/authorized **and** observed without collapsing families. Empty companion → no observed edges, no false “no data estate.”

## Constraints

- Working-tree check. Do **not** promote ObservedRuntime to ADF Reads from.
- Do **not** hide Network PE edges. Do **not** add SQL DMVs (SN-RT-08).
- Stage only this prompt’s paths. **No `git add -A`.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```bash
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DataFlow'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~DependencyObservation|FullyQualifiedName~Observed'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s if >15s.

## Done when

Golden-ish AST test: May access + Observed in logs coexist. Honesty sentence locked.
