# VN-13 — Show why the diagram render failed

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement a new VN in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_VNET_BOX_LUNA_PROMPTS.md`

**Depends on:** none of the box-drawing prompts. Do not re-run VN-01 through VN-12. Do not edit the customer extractor or the hosted collector. Do not change placement membership, backbone keep, or the repairer.

## Goal

When Executive and Full subscription both come back failed for the same snapshot, the diagrams page shows the reason. It stops calling that failure "This view is too large to read."

## Why

On `Hmd_HI_HAP_Non_Prod` snapshot `9/29/2026, 13:33 UTC`, Full subscription and Executive both showed the density-coach heading "This view is too large to read." The red tag on that page is **Render failed**. That tag is status `Failed`.

Executive does not use the 400-node peel budget. Its coach appears for a failed render or an empty succeeded diagram. A plate that is only over `MermaidDiagramReadabilityThresholds` returns `Partitioned`. Partitioned can still draw. This page drew nothing.

`InfraEvidenceSnapshotMermaidService.TryRenderModeResponseAsync` catches every exception except cancellation and returns `CreateFailedRenderResponse`. That response has status `Failed`, null mermaid, null metrics, and no reason. The caught exception is discarded. `MapRenderResponse` also drops `MermaidDiagramRenderResult.ValidationErrors` when the pipeline returns `Failed` without throwing. The workbench then treats every non-identity failure as the too-large coach (`resolveInfraDiagramsDensityCoachPresentation`).

This session reveals that reason. It does not guess why this subscription throws, and it does not draw the VNet box.

## Read first

- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs` (`TryRenderModeResponseAsync`, `CreateFailedRenderResponse`, `MapRenderResponse`)
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramRenderPipeline.cs` (status `Failed` keeps `ValidationErrors`)
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramRenderResult.cs`
- `ArchLucid.Contracts/InfraEvidence/InfraEvidenceMermaidRenderResponse.cs`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-mermaid-types.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-density-coach.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-density-coach-presentation.ts`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (the `Failed` empty state and the density coach)
- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts` (`GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RENDER_FAILED_BODY`, `GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_TOO_LARGE_TITLE`)

## What to build

Add a nullable `FailureReason` on `InfraEvidenceMermaidRenderResponse`.

- On the catch in `TryRenderModeResponseAsync`, set `FailureReason` from `exception.Message` only. Do not put `exception.ToString()`, the stack trace, or inner-exception dumps on the response.
- When `MapRenderResponse` maps a `Failed` result whose `ValidationErrors` are non-empty, set `FailureReason` to those errors joined with a space. Validation errors win over an empty catch message.
- Leave `FailureReason` null when status is `Succeeded` or `Partitioned`.
- Trim the reason. Cap it at 500 characters.
- Do not add a logger to `InfraEvidenceSnapshotMermaidService`.

Wire the field through the client type the workbench already reads: `InfraEvidenceMermaidRenderResponse` in `infra-evidence-mermaid-types.ts`. Add the same nullable `failureReason` string to:

- `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`
- `ArchLucid.Api.Tests/Contracts/buyer-contract.openapi.snapshot.json`
- `archlucid-ui/src/lib/api-types/schemas.generated.ts`
- `archlucid-ui/packages/api-types/src/api-types/schemas.generated.ts`

Place it in the `InfraEvidenceMermaidRenderResponse` schema only, next to the other nullable strings. Do not regenerate the whole OpenAPI document.

On the diagrams page, status `Failed` shows title "Diagram render failed". When `failureReason` is present, the body is that reason. When it is absent, keep `GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RENDER_FAILED_BODY`. Keep **Retry render**.

`shouldShowInfraDiagramsDensityCoach` returns false when status is `Failed`. The too-large heading stays for a partitioned plate, a browser-size guard, and an empty succeeded diagram that is not the identity omit. The identity omit coach stays on its own copy.

## Tests

1. A render that throws returns status `Failed` and `FailureReason` equal to the exception message, with no stack frame text in that string.
2. A structurally invalid Mermaid result returns status `Failed` and `FailureReason` containing the validation error. `Succeeded` and `Partitioned` leave `FailureReason` null.
3. Update `infra-evidence-diagrams-density-coach.test.ts` and `infra-evidence-diagrams-density-coach-presentation.test.ts`: status `Failed` does not produce the too-large title. Status `Partitioned` with nothing painted still does.
4. The workbench failed empty state renders `failureReason` when the render response includes it.

## Acceptance criteria

- Executive and Full subscription `Failed` responses carry the exception message or the Mermaid validation errors.
- The diagrams page shows that sentence under "Diagram render failed".
- The page does not show "This view is too large to read." for status `Failed`.
- A partitioned diagram still uses the too-large coach.
- Placement sources, peel thresholds, and the extractor are unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- Run the new Application test and the density-coach Vitest files. Do not run the full solution.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A failed Executive render and a failed Full subscription render for the same snapshot both include `failureReason`, and the diagrams page prints that reason instead of "This view is too large to read."
