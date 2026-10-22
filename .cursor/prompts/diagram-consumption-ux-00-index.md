<!-- Diagram consumption UX — Composer prompts.
     Origin: 2026-10-03. AX-DC already puts authorization edges, strokes,
     warnings, and the outline inspector on the diagram. Operators still
     cannot click a connector, filter by evidence family, or share a PNG
     that carries the reading notes.
     Do not implement from this index. -->

# Diagram consumption UX — Composer prompt set (DCU-01–DCU-05 + hold)

**AX-DC-01–08** already owns endpoint inclusion, confidence strokes, the completeness banner, the Identity overlay, the outline inspector, and the Executive **May access** regression. **DFV-01–10** owns whether data-flow cards and connectors paint. **DCU** owns how an operator reads, filters, and shares the diagram that is already on the page.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/diagram-consumption-ux-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc: [`docs/architecture/DIAGRAM_CONSUMPTION_UX_COMPOSER_PROMPTS.md`](../../docs/architecture/DIAGRAM_CONSUMPTION_UX_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Diagnosis (already closed — do not re-diagnose)

1. `ArchitectureDiagramViewer` click handling focuses `g.node` and `g.edge-stub`. A click on `g.edge` calls `clearFocus()`. The connection-evidence panel opens only from an outline row button, and that button exists for **probable** and **inferred** rows. **Observed** rows are plain text.
2. `InfraDiagramLegend` in `DiagramsWorkbenchClient` says “derived means an inferred connection” for every mode. `InfraEvidenceDiagramLegend` already names solid / dashed / dotted in words, with no drawn sample. The two legends disagree.
3. `AzureInventoryDataFlowEvidenceCatalog` already assigns `DeclaredMovement`, `AuthorizedAccess`, `StructuralNetworkPath`, `InferredHostname`, `HumanConfirmed`, and `ObservedRuntime`. The workbench has no chip that hides the other families. Outline edges already carry `inferenceSource` and `label`.
4. `downloadInfraEvidenceMermaidPng` saves the canvas. The honesty sentences and the completeness-warning count stay on the page.
5. Node click-focus says “Showing connections for {name}.” It does not repeat the authorization or hostname hint that the edge panel already uses.

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Connector click** | Clicking a line clears focus | The existing connection-evidence panel opens, the edges section expands, and that line stays highlighted | **DCU-01** |
| **One legend** | Two legends, one of them collapses probable into inferred | Mode job sentence plus one stroke legend with a drawn sample | **DCU-02** |
| **Family chips** | Every family paints at once | Chips filter the canvas and the outline. Empty family states stay honest | **DCU-03** |
| **Shared PNG** | The file is the picture alone | The downloaded PNG adds a reading strip: job sentence, present strokes, warning count | **DCU-04** |
| **Node hint** | “Showing connections for {name}.” | The same line adds the existing May access or hostname hint when an incident edge warrants it | **DCU-05** |

## What this set does not change

Keep AX-DC strokes, the completeness banner, `InfraEvidenceInventoryEdgeDetailPanel` copy, and `DiagramEdgeVisualKindResolver`. Keep DFV card captions and icon repair. Keep one Azure collector. Do not add a second inspector. Do not recompile a new evidence family. Do not promote authorization or hostname edges to observed traffic. Do not stamp TLS or classification. Do not hide desktop review workspace tabs behind **More**.

## Run order

**01** and **02** can run in parallel if they do not edit the same lines of `DiagramsWorkbenchClient.tsx`. **03** after **01** (both touch viewer selection and outline visibility). **04** after **02** (the strip reuses the legend sentences). **05** after **01**. **06** is a written hold.

Suggested implementation branch per prompt: `cursor/dcu-<short-name>` (append the session suffix your agent instructions require).

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 00 | `diagram-consumption-ux-00-index.md` | This index |
| 01 | `diagram-consumption-ux-01-connector-click.md` | Clicking a line clears the picture |
| 02 | `diagram-consumption-ux-02-one-legend.md` | Two legends, and “derived” means “inferred” |
| 03 | `diagram-consumption-ux-03-evidence-family-chips.md` | No way to read one evidence family |
| 04 | `diagram-consumption-ux-04-png-reading-strip.md` | Shared PNG drops the reading notes |
| 05 | `diagram-consumption-ux-05-node-connection-hint.md` | Node focus does not say what the connectors mean |
| 06 | `diagram-consumption-ux-06-hold.md` | Written hold |

## Global constraints (every prompt)

- Read [`docs/library/INFRA_EVIDENCE_PLANE.md`](../../docs/library/INFRA_EVIDENCE_PLANE.md) first. **No new collectors.**
- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing tracked files. Exit 2 → skip and report.
- No Azure HTTP from the diagram viewer.
- Sentence case. `OPERATOR_TYPOGRAPHY`. Visible-boundary `Button` (no ghost or link variant).
- Prefer concrete types, null checks, and a blank line before `if` / `foreach` unless first in a method. Each new class in its own file. **No `ConfigureAwait(false)` in tests.**
- Stage only files the prompt names. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.
- Implement only *What to build*.

## After each prompt

Summarize: files changed, tests run, whether a connector click opens the existing panel, whether the coarse “derived means inferred” line is gone, which families the chips can hide, whether the PNG strip avoids traffic claims, and that **DCU-06** still holds.
