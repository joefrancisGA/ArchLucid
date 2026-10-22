# RSV-04 — Opt in to Recovery Services on other diagrams

**Wave:** Recovery Services vaults (**RSV**). **Depends on:** RSV-03. **Do not** add another collector or another diagram mode.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Existing diagram modes stay free of Recovery Services vaults. A checkbox, **Include backup and recovery**, sets `includeRecoveryServices` and adds the vault plus its collected `PROTECTS` edges to the current mode. Business continuity ignores the checkbox and always shows vaults.

## Why

Backup posture is useful beside a VM on the executive or full-subscription view, and it is clutter when the viewer is reading network paths. The switch should add cited protection only. Turning it on must not pull in every vault neighbor or reopen `includeNeverShow`.

## Context

- `includeNeverShow` and `includePrivateEndpoints` in `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts` and `DiagramsWorkbenchClient.tsx` — copy that URL round-trip, as a separate param.
- `ArchLucid.ArtifactSynthesis/Models/DiagramAstCompileOptions.cs`
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceMermaidModeParser.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` — RSV-01 exclusion
- Diagram toolbar in `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` near the include-never-show control

## What to build

1. Query param `includeRecoveryServices`. Absent or any value other than `1` means off. Parser writes `DiagramAstCompileOptions.IncludeRecoveryServices`.

2. When the flag is false, RSV-01 behavior stands: no Recovery Services vault nodes on modes other than `BusinessContinuity`.

3. When the flag is true, after the mode filter:
   - Add vault nodes that have at least one `PROTECTS` edge whose other end survived the mode filter.
   - Add those `PROTECTS` edges.
   - Do not add a vault that has no cited edge into the visible set.
   - Do not add resources that failed the mode filter merely because they are protected. A VM hidden from the Network mode stays hidden. The vault appears on Network only when the protected resource is already a network node, which will be rare; that is correct.

4. `DiagramMode.BusinessContinuity` does not read the flag. Vaults and collected protection edges remain as RSV-03 left them.

5. Toolbar control: sentence-case label `Include backup and recovery`. `aria-pressed` follows the flag. Place it with the existing diagram inclusion controls. Hide it when the selected mode is `businessContinuity`.

6. Tests:
   - Full subscription, flag off: vault omitted.
   - Full subscription, flag on, one `backs up` edge to a visible VM: vault and that edge present; an unrelated vault with no edge still omitted.
   - Network mode, flag on, vault protects only a VM: vault still omitted, because the VM is not in the network node set.
   - Business continuity, flag off: vault still present.
   - URL helper round-trips `includeRecoveryServices=1` and leaves `includeNeverShow` untouched.
   - Workbench test: toggling the control updates the search param and the mermaid request.

## Acceptance criteria

- Default URLs do not grow an `includeRecoveryServices` param.
- The checkbox cannot create edges. It only reveals edges RSV-03 stored.
- Key Vault, private endpoints, and never-show types are unchanged.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- Button semantics for the toggle (`aria-pressed`), matching the existing include-never-show control. Do not use a link.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~RecoveryServices|FullyQualifiedName~BusinessContinuity"
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~InfraEvidenceMermaidModeParserTests
```

From `archlucid-ui/`:

```powershell
npx vitest run src/lib/infra-evidence/infra-evidence-diagrams-filter-url.test.ts src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx
```

Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if a command runs longer than 15s. No full-solution build.

Browser check after the unit tests pass: open the infrastructure diagrams page, confirm Business continuity is in the mode list and shows vaults without the checkbox, then on Executive confirm the checkbox is off by default and that enabling it does not mark unrelated resources as backed up. If no signed-in snapshot is available, say so and stop.
