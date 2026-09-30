# DFV-02 — Hide compiler comments on the data-flow page

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-01 or DFV-03 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. DFV-01 is not required. Do not edit the edge router in this session.

## Goal

**Declared pipeline wiring** shows the short honesty sentences. It does not show per-edge provenance comments or per-node `al-type` / `al-rg` / `al-seed` lines.

## Why

On Data flow for `Hmd_HI_HAP_Non_Prod`, **Declared pipeline wiring** is open and fills most of the page.

The summary starts with the real sentence ("Evidence of possible or declared movement…") and then repeats `al-provenance=ObservedFact al-inference=inventory-adf-linked-service-inferred` once per edge. Under that, the disclosure lists one line per resource:

`al-type=TopologyResource al-rg=… al-seed=adf-external:/subscriptions/…/sftp_ahcccs`

`isInfraEvidenceMermaidMetadataComment` only matches `al-type=`, `al-rg=`, and `al-seed=`. Edge comments (`al-provenance=`, `al-inference=`, `al-declared-id=`) fail that test, so `parseInfraDiagramsDataFlowCaptionPresentation` treats them as honesty captions. `formatHonestySummary` joins every honesty caption with a space, and that string is the always-visible `summaryLine`.

The node lines do match the metadata pattern. They render in `infra-diagrams-data-flow-metadata` when the section is expanded. They repeat the resource identity already on the card. They are not buyer copy.

Mermaid export and the outline parser still need those comments. Do not stop emitting them.

## Read first

- `archlucid-ui/src/lib/infra-evidence/infra-evidence-data-flow-diagram.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-data-flow-diagram.test.ts`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDataFlowCaptionDisclosure.tsx`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDataFlowCaptionDisclosure.test.tsx`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (caption wiring only)
- `ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs` (`BuildInventoryEdgeMetadataComment`, `BuildInventoryNodeMetadataComment`) — read only
- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`

## What to build

1. Branch `dfv/02-hide-compiler-comments` from current `master`.
2. Treat a Mermaid comment as metadata when it contains any of these tokens, including alongside other text: `al-type=`, `al-rg=`, `al-seed=`, `al-provenance=`, `al-inference=`, `al-declared-id=`, `al-state=`, `al-outline-only=`.
3. Honesty captions stay the sentences that do not contain those tokens. On the Hmd snapshot that is the evidence-family sentence and, when present, "Pipeline direction was not in this package. Re-collect Azure inventory to see reads from / writes to."
4. Render those honesty sentences as the caption. Do not join metadata comments into that text. Do not render the metadata list on the diagrams page. Remove the `infra-diagrams-data-flow-metadata` dump. If the only comments are metadata, the section shows the honesty sentences and nothing else.
5. Do not strip `%%` comments from Mermaid source, export, or `parse-infra-evidence-mermaid-outline.ts`. Outline focus and provenance parsing must keep working.
6. Tests:
   - A comment that is only `al-provenance=ObservedFact al-inference=inventory-adf-linked-service-inferred` is metadata.
   - A fixture with the evidence-family sentence, three provenance comments, and three `al-type` / `al-seed` comments yields one honesty caption. The rendered caption does not contain `al-provenance`, `al-inference`, `al-seed`, or `adf-external:`.
   - The existing honesty sentence without metadata still renders as a paragraph.
   - An outline parse test that already reads `al-provenance=` still sees that token in the Mermaid source.

## Acceptance criteria

- The diagrams page caption contains the honesty sentences and no `al-provenance=`, `al-inference=`, `al-type=`, or `al-seed=` text.
- There is no list of resource ids under **Declared pipeline wiring**.
- Mermaid export still contains `%% al-provenance=` and `%% al-type=` comments.
- Diagnostic-setting edges stay off Data Flow. This session does not change which edges exist.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not change the edge router, column layout, icon catalog, or evidence catalog.
- Working-tree safety. Stage only the caption parser, the disclosure, and their tests. **No `git add -A`.**
- **Do not commit.**

## Verification

From `archlucid-ui`:

```powershell
npx vitest run src/lib/infra-evidence/infra-evidence-data-flow-diagram.test.ts src/components/infra-evidence/InfraEvidenceDataFlowCaptionDisclosure.test.tsx src/lib/infra-evidence/parse-infra-evidence-mermaid-outline.test.ts
```

## Done when

Tests pass. Tell the owner to refresh **Data flow — what may connect**. **Declared pipeline wiring** should be a few sentences about evidence, pipeline direction, and external systems. It should not be a repeated `al-provenance=ObservedFact` paragraph or a list of subscription ids. Export Mermaid should still contain the `%%` comments. Wait for that look before any commit.
