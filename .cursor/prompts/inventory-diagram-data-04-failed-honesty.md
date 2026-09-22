# IE-DD-04 — Honest Data-mode Failed UX

**Wave:** inventory-diagram Data (**IE-DD**). **Depends on:** **IE-DD-03**. **Do not** implement category, snapshot contract, or validator/repairer here except to **display** `ValidationErrors`.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When Inventory diagrams Data (or any inventory mermaid mode) is **Failed**, the operator sees **why**. Today `ValidationErrors` stay on the server result DTO, the HTTP render response has no errors field, mermaid is withheld, and the workbench shows only **Diagram render failed for the selected mode.**

## Why

Owner Data screenshot: red **Render failed** + counts, yellow generic StatusTag, exports disabled, no outline. After IE-DD-03 the happy path should be Succeeded. Leftover Failed (bad labels, future emitter drift) must not be a dead end.

Do not map Failed to the too-large banner (IE-ND-05). Do not restore `min-h-[18rem]`. Do not auto-paint Failed mermaid (`shouldPaintInfraDiagramsMermaidSource` stays false when mermaid is withheld).

## Context

- `ArchLucid.Contracts/InfraEvidence/InfraEvidenceMermaidRenderResponse.cs`
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs` (`MapRenderResponse`)
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramRenderResult.cs` (`ValidationErrors`)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (Failed `StatusTag` branch — no outline)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-mermaid-render-status-presentation.ts`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx`
- `docs/library/OPENAPI_CONTRACT_DRIFT.md` if the wire contract gains a field
- Index: `.cursor/prompts/inventory-diagram-data-00-index.md`

## What to build

1. Add `validationErrors` (string list, may be empty) to the mermaid **render** response. Map from `MermaidDiagramRenderResult.ValidationErrors`. Preview may include a short error on Failed rows only if you can do it without adding mermaid to Failed preview. Do not bloat preview mermaid.
2. Workbench Failed branch: keep the needs-attention StatusTag. Add a helper line with the **first** validation error (or `Mermaid text was invalid.` if the list is empty). Use `OPERATOR_TYPOGRAPHY.helper`. Sentence case. Do **not** toast. Do **not** use a ghost/link `Button`.
3. Do **not** auto-paint Failed mermaid. Default: keep Export Mermaid disabled and show the error text. Outline stays hidden without mermaid (same as today).
4. Tests:
   - Application/API: a structurally invalid mermaid (inject or use a fixture the validator rejects) returns Failed with a **non-empty** `validationErrors` list.
   - Vitest: Failed render result with `validationErrors[0]` visible via a testid (e.g. `infra-diagrams-render-failure-reason`).
   - Existing Succeeded / Partitioned / empty-content tests stay green.
5. If OpenAPI changes: follow `OPENAPI_CONTRACT_DRIFT.md` / regenerate client types in the **same** PR. Do not leave packages/api-types stale.

## Acceptance criteria

- Failed Data mode shows a concrete validation reason, not only the generic StatusTag.
- OpenAPI/client types stay in sync if the wire contract gained `validationErrors`.
- Succeeded Data still paints; Partitioned still shows fallback cards; empty Succeeded still uses the empty-content empty state.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** map Failed to `INFRA_EVIDENCE_MERMAID_TOO_LARGE_FOR_BROWSER_MESSAGE`.
- **Do not** statically import mermaid.
- TB-645. Sentence case. Visible-boundary `Button` (no ghost/link).
- Verification:
  ```bash
  dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidServiceTests'
  cd archlucid-ui && npm test -- src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx
  pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
  ```
  Heartbeat every 8s if >15s. No full-solution build unless OpenAPI regen requires the named snapshot script in the drift doc. No `npm ci` unless `node_modules` is missing.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Stage only this prompt’s paths. **No `git add -A`.**

## Done when

- A Failed inventory mermaid render response carries `validationErrors`.
- The workbench Failed branch shows that first error via a stable testid.
- Happy-path Data (after 01–03) is unchanged: Succeeded + canvas + exports.
