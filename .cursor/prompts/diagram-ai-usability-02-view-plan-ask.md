# DAU-02 — Ask returns a validated DiagramViewPlan

**Wave:** diagram-ai-usability (**DAU**). **Depends on:** DAU-01 (ADR 0101 may still be Proposed). **Do not** implement DAU-03–DAU-12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Infrastructure Ask can answer “show me the payment path” with a **closed** `ViewPlan` (mode, optional RG, seed, snapshot, fit target) that the workbench URL already understands. The model may only pick tokens from an allowlist. No ARM ids invented.

## Why

`InfraEvidenceAskIntentResolver` already routes “diagram gap” questions to `DiagramGap`. Operators who want a *different picture* still have to know `mermaidMode=dependencyNeighborhood` and paste a seed. That is the usability hole: intent exists in Ask; the workbench is a form.

## Context

- `ArchLucid.Contracts/InfraEvidence/InfraEvidenceAskTopicKinds.cs`
- `ArchLucid.Contracts/InfraEvidence/InfraEvidenceAskRequest.cs`
- `ArchLucid.Contracts/InfraEvidence/InfraEvidenceAskResponse.cs`
- `ArchLucid.Contracts/InfraEvidence/InfraEvidenceAskCitationKinds.cs`
- `ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskIntentResolver.cs`
- `ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskPromptBuilder.cs`
- `ArchLucid.Application/InfraEvidence/InfraEvidenceAskGroundingService.cs`
- `ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceAskGroundingServiceTests.cs`
- UI URL contract: `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts` (`INFRA_DIAGRAMS_MODE_OPTIONS`)
- Seed resolver: `ArchLucid.ArtifactSynthesis/Compilers/DiagramNeighborhoodSeedResolver.cs`
- `docs/library/API_CONTRACTS.md` — OpenAPI snapshot if the wire DTO changes

Reuse IE-21 Ask: IPromptRedactor, Simulator honesty, sealed-manifest guard. Do **not** fork a second Ask pipeline.

## What to build

1. New types (each class/file):
   - `DiagramViewPlan` with:
     - `MermaidMode` (string; must be one of the seven workbench values)
     - `ResourceGroupName` (nullable)
     - `SeedNodeId` (nullable)
     - `SnapshotId` (nullable Guid)
     - `CloudResourceId` (nullable Guid)
     - `FitTargetNodeId` (nullable)
     - `HonestyLabel` (required non-empty; default “Proposed view — existing diagram modes only”)
   - `InfraEvidenceAskTopicKinds.DiagramView` = `"DiagramView"`
   - `InfraEvidenceAskCitationKinds.DiagramViewPlan` = `"DiagramViewPlan"` (id may be the mode token)
2. `DiagramViewPlanValidator` (static, own file): reject unknown modes; reject `resourceGroup` without RG name; reject `dependencyNeighborhood` without seed **or** cloudResourceId; never invent ids — unknown seed ⇒ invalid plan, not a guessed ARM id.
3. Intent resolver: questions like “show me”, “diagram of”, “focus on”, “neighborhood of”, “executive view”, “identity diagram” resolve to `DiagramView` **before** generic `ResourceOverview`. Keep `DiagramGap` for “missing from diagram / infrastructure only”.
4. Evidence collector: for `DiagramView`, include snapshot id, available mode list, outline seed labels **already in scope** (no extra Azure calls). If no snapshot in scope → `InsufficientEvidence`, no plan.
5. `InfraEvidenceAskResponse.ViewPlan` additive nullable. Simulator: `BuildSimulatorViewPlan` maps keywords deterministically (`identity` → identity, `peering`/`vnet` → network or executive, `how does X connect` → dependencyNeighborhood only when X matches an outline label). Real LLM JSON must include `viewPlan` and pass the validator; drop the plan and set insufficient if validation fails.
6. Prompt builder: allowed modes listed in the user prompt; “return ONLY JSON” extended with optional `viewPlan` object; citationIds still allowlist-only.
7. OpenAPI: regenerate snapshot if the response schema changes (`ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh` only if this prompt’s DTO ships). Do **not** wire UI navigation here.

## Acceptance criteria

- Question “show the identity diagram” with a snapshot in scope returns `TopicKind=DiagramView`, `ViewPlan.MermaidMode=identity`, no invented ARM ids.
- Question “neighborhood of not-a-real-node” ⇒ invalid/insufficient, not a fabricated seed.
- Simulator path never calls the LLM and still returns a valid plan for keyword cases.
- `DiagramGap` still wins for “why is this gateway infrastructure only”.

## Constraints

- Working-tree safety script before tracked edits.
- **Do not** change `DiagramsWorkbenchClient` navigation (DAU-03).
- **Do not** emit Mermaid from Ask.
- C#: concrete types, LINQ, blank line before `if`/`foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification (heartbeat every 8s if >15s):
  ```bash
  export PATH="$HOME/.dotnet:$PATH"
  dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceAsk'
  ```
  Plus new tests for `DiagramViewPlanValidator` and intent `DiagramView`.
- If OpenAPI snapshot is updated, run the repo’s existing contract test for that snapshot only — not a full solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
