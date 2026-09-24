# RSV-02 — Business continuity diagram, vaults only

**Wave:** Recovery Services vaults (**RSV**). **Depends on:** RSV-01. **Do not** collect protected items. **Do not** add the opt-in checkbox. **Do not** implement RSV-03 or RSV-04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

A new diagram mode, `businessContinuity`, shows Recovery Services vaults and a caption that protection coverage has not been collected. It shows no other resource types. It draws no edges.

## Why

The owner wants a place to read backup posture without putting vault cards back on the network and executive diagrams. Until RSV-03 stores protected items, the honest picture is the vault list plus an explicit gap, not a line to every VM in the resource group.

## Context

- `ArchLucid.ArtifactSynthesis/Models/DiagramMode.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` — `ApplyModeNodeFilter`, `BuildTitle`
- `ArchLucid.ArtifactSynthesis/Models/DiagramAstCompileOptions.cs` — do not add `IncludeRecoveryServices` here
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceMermaidModeParser.cs`
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs` — `PreviewModes`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts` — `INFRA_DIAGRAMS_MODE_OPTIONS`
- RSV-01 filter must exempt this mode only

## What to build

1. Add `DiagramMode.BusinessContinuity`. Parser accepts `businessContinuity` and rejects unknown aliases. Title: `Azure inventory (BusinessContinuity)`.

2. Mode filter keeps only `Microsoft.RecoveryServices/vaults`. Exempt this mode from `DiagramRecoveryServicesVaultFilter.Exclude`. Every mode RSV-01 already hid stays hidden.

3. Caption on the compiled AST, one line: `Protection coverage is not collected for this snapshot. A vault with no line is not proof that nothing is backed up.`

4. Register the mode in `PreviewModes` and in `INFRA_DIAGRAMS_MODE_OPTIONS` with label `Business continuity`. Place it after `security` and before `identity`. Resource-group scope stays a separate control. Do not make this the default mode.

5. Tests:
   - Parser maps `businessContinuity` to `DiagramMode.BusinessContinuity`.
   - Compile of a vault plus a VM yields the vault node, zero edges, and the caption sentence.
   - `DiagramMode.FullSubscription` on that same graph still omits the vault.
   - UI mode list includes `businessContinuity` and still defaults to `executive`.

## Acceptance criteria

- Empty protection is stated in the caption. The canvas does not imply the vault protects a neighbor.
- No Azure GET, no new association type, no checkbox.
- `includeNeverShow` behavior is unchanged.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- Sentence case for the mode label: `Business continuity`.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~DiagramRecoveryServices|FullyQualifiedName~BusinessContinuity"
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~InfraEvidenceMermaidModeParserTests
```

From `archlucid-ui/`:

```powershell
npx vitest run src/lib/infra-evidence/infra-evidence-diagrams-filter-url.test.ts
```

Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if a command runs longer than 15s. No full-solution build. No browser pass; this prompt does not change a rendered page layout beyond the mode list data.
