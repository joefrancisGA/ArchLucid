> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that make **Inventory diagrams** pack resources and connectors instead of spreading a sparse peering forest across an empty plate. Internal engineering only.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
> **Paste files:** [`.cursor/prompts/inventory-diagram-spacing-00-index.md`](../../.cursor/prompts/inventory-diagram-spacing-00-index.md) (one numbered file per session).
>
> **Do not** re-implement **IDL-01–IDL-06**, **IDV**, **IDC**, **IE-ID**, or **IE-ND**. IDL-02's grid is correct for zero real edges. This wave is the leftover after IDL-05 peering edges skipped that grid.

# IDS-01–IDS-04 — Inventory diagram resources and connectors are too far apart

**Observed:** Inventory diagrams (`/governance/infrastructure/diagrams`) **Executive** mode, snapshot `bebca1ae-…` (889 resources). Green **Render succeeded · 11 nodes · 6 edges · 0 subgraphs**. One readable pale-honey node on the **right** of a large empty canvas. Horizontal and vertical scrollbars. Edges table lists six real VNet `From → To` rows. Owner: "this is better, but the resources and their connectors are too far apart."

**Product framing (locked):** inventory Mermaid workbench after IDL camera + honesty. Do not "fix" spacing by hiding peering arrows or by shrinking labels below 11 px.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| 48/56/18 gaps, basis curves, `tight-tree` ranker | **IDS-01** | Packed AST still paints with long bowed connectors |
| Real peerings skip IDL-02's peer-grid | **IDS-02** | Forest of pairs stays far apart even with compact init |
| IDL-04 flush-extents crop keeps the padded viewBox | **IDS-03** | One node on the right of a white sea |
| No browser test for the 6-peering owner shape | **IDS-04** | Next wave re-diagnoses from a screenshot again |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IDS-01** Compact Mermaid spacing + linear + network-simplex | Parallel with 02 | IDL-03 on trunk |
| **IDS-02** Pack disconnected components | Parallel with 01 | IDL-01/02/05 on trunk |
| **IDS-03** Crop to node-union | Parallel with 02 | IDL-04 on trunk |
| **IDS-04** Dense-layout Playwright ratchet | Last | 01–03 merged |

**Run one prompt per chat.** Feature branch per prompt (`cursor/inventory-diagram-spacing-<short-name>-457d`). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No second collector. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Mermaid stays dynamically imported on UI hot paths (`mermaid-import-policy`).
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- Camera and honesty are better. This is not overlay-only collapse, not the 6 px ribbon, not the fabricated 10-edge chain.
- `6 edges` are real `PEERS_WITH` / `peered` (IDL-05). Do not drop them to recover the zero-edge grid.
- `EnsureLayoutEdgesWhenEmpty` returns when `CountVisible > 0`. That guard is why the peer-grid does not run on this snapshot.
- Mermaid 11 default ranker is `tight-tree`; config today has `curve: "basis"`, `nodeSpacing: 48`, `rankSpacing: 56`, `padding: 18`.
- IDL-03 min-fit-scale (11/15) will not shrink a sparse plate. That is correct; pack and crop instead.
- IDL-04 `measuredCoversSourceExtents` + 60% rule keeps padded source viewBoxes. Node-union crop (IDS-03) is the leftover, not a revert of "never clip a row".
- 0 subgraphs: region planner needs ≥2 `arm.location` values; this snapshot is flat. Packing subgraphs (`alpack-*`) are layout chrome, not RG swimlanes.
- Footer "Build identity unavailable" is the deployment SHA — unrelated.

---

# IDS-01 — Compact Mermaid spacing, linear connectors, network-simplex ranker

**Depends on:** IDL-03 on trunk · **Branch:** `cursor/inventory-diagram-spacing-compact-init-457d`

**Paste file:** [`.cursor/prompts/inventory-diagram-spacing-01-compact-mermaid-spacing.md`](../../.cursor/prompts/inventory-diagram-spacing-01-compact-mermaid-spacing.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: inventory/architecture Mermaid init must use compact node/rank spacing, linear connectors, and network-simplex ranking so disconnected peering pairs are not spread by tight-tree + basis curves.

Owner screenshot (do not re-diagnose): Inventory diagrams Executive, Render succeeded, 11 nodes / 6 edges / 0 subgraphs, one readable node on the right of a large empty canvas. Resources and connectors are too far apart.

This is NOT a re-do of IDL-01–06, IDV, IDC, or IE-ID. Do not change flowchart TD to LR. Do not hide peering edges. Do not touch ArtifactSynthesis (IDS-02) or resolveMermaidInkViewBox (IDS-03). Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92. Do not hide desktop review workspace tabs.

Read first:
- .cursor/prompts/inventory-diagram-spacing-00-index.md
- .cursor/prompts/inventory-diagram-spacing-01-compact-mermaid-spacing.md
- archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.ts
- archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.test.ts
- archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx (MERMAID_SVG_HOST_CLASSNAME)

Working-tree: before editing a tracked file run
pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'
Exit 2 → skip that path and report.

Work: implement only "What to build" in the paste file.

Tests:
cd archlucid-ui && npx vitest run src/lib/architecture/architecture-diagram-mermaid-config.test.ts src/components/architecture/ArchitectureDiagramViewer.test.tsx

Done when:
- flowchart nodeSpacing 24, rankSpacing 28, padding 8, curve linear, ranker network-simplex, wrappingWidth 240
- PNG export shares the same init
- Help-topic Mermaid path unchanged
```

---

# IDS-02 — Pack disconnected components when real edges exist

**Depends on:** IDL-01, IDL-02, IDL-05 · **Branch:** `cursor/inventory-diagram-spacing-pack-components-457d`

**Paste file:** [`.cursor/prompts/inventory-diagram-spacing-02-pack-disconnected-components.md`](../../.cursor/prompts/inventory-diagram-spacing-02-pack-disconnected-components.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: when an inventory diagram has real edges but more than one connected component, pack those components into a viewport-shaped grid using layout-only ~~~ links and alpack-* subgraphs. Real peering arrows stay visible and counted.

Owner screenshot (do not re-diagnose): 11 VNets, 6 real peering edges, 0 subgraphs. EnsureLayoutEdgesWhenEmpty returns because CountVisible > 0, so IDL-02's peer-grid never runs.

This is NOT a re-do of IDL-02 (keep the zero-edge grid). Do not drop peering edges. Do not change flowchart TD to LR. Do not touch archlucid-ui (IDS-01 CSS, IDS-03 crop). Do not add elk.

Read first:
- .cursor/prompts/inventory-diagram-spacing-00-index.md
- .cursor/prompts/inventory-diagram-spacing-02-pack-disconnected-components.md
- ArchLucid.ArtifactSynthesis/Compilers/DiagramAstLayoutEdgeBuilder.cs
- ArchLucid.ArtifactSynthesis/Compilers/DiagramPeerGridPlanner.cs
- ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs
- ArchLucid.ArtifactSynthesis.Tests/DiagramAstFromGraphCompilerTests.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file. Packer no-ops when CountVisible == 0 (IDL-02 owns that shape) or when there is a single visible component.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramSparseComponentPacker|FullyQualifiedName~DiagramAstFromGraphCompilerTests|FullyQualifiedName~MermaidDiagramRenderer'

Compile (heartbeat every 8s if >15s):
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'

Done when:
- Owner-shape compile: 11 nodes, 6 visible edges, packing subgraphs, ~~~ between representatives, peered arrows preserved
- Zero-edge 11-node compile still has 0 packing subgraphs
```

---

# IDS-03 — Crop the camera to the union of node boxes

**Depends on:** IDL-04 · **Branch:** `cursor/inventory-diagram-spacing-node-union-crop-457d`

**Paste file:** [`.cursor/prompts/inventory-diagram-spacing-03-crop-to-node-union.md`](../../.cursor/prompts/inventory-diagram-spacing-03-crop-to-node-union.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: inventory mermaid viewport crop must follow the union of g.node boxes plus padding. Drop IDL-04's flush-extents + 60% requirement for that union so a padded Mermaid viewBox with ink in one corner is tightened. A partial group bbox that is not a complete node union must still be rejected (clipped-grid regression).

Owner screenshot (do not re-diagnose): one readable node on the right of a large empty canvas.

Do not change zoom clamps (IDL-03) or Mermaid init (IDS-01). Do not touch backend. Do not include .edgePath in the union.

Read first:
- .cursor/prompts/inventory-diagram-spacing-03-crop-to-node-union.md
- archlucid-ui/src/lib/help/help-mermaid.ts
- archlucid-ui/src/lib/help/help-mermaid.test.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
cd archlucid-ui && npx vitest run src/lib/help/help-mermaid.test.ts src/components/architecture/ArchitectureDiagramViewer.test.tsx

Done when:
- Source 4000×800 with node-union in the top-right crops to the union
- IDL-04 1144×322 vs partial 866×206 still keeps source when no complete node union is supplied
```

---

# IDS-04 — Mock-backed browser ratchet for compact inventory diagrams

**Depends on:** IDS-01–03 · **Branch:** `cursor/inventory-diagram-spacing-dense-ratchet-457d`

**Paste file:** [`.cursor/prompts/inventory-diagram-spacing-04-dense-layout-ratchet.md`](../../.cursor/prompts/inventory-diagram-spacing-04-dense-layout-ratchet.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: add a Playwright operator-mock case for the owner-shape Executive payload (11 VNets, 6 peering edges, packing ~~~ / alpack-*). Fail when fewer than 4 nodes are in the default viewport, peering pairs are farther than the compact threshold, or the viewBox is more than 1.5× the node-union.

Do not change viewer or backend code. If the spec fails after IDS-01–03, report which prompt regressed. Do not add the spec to playwright.mock.config.ts.

Read first:
- .cursor/prompts/inventory-diagram-spacing-04-dense-layout-ratchet.md
- archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts
- archlucid-ui/e2e/fixtures/infra-diagrams-mermaid.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file. Keep existing IDL-06 grid and legacy-chain cases.

Tests:
cd archlucid-ui && MOCK_E2E_SKIP_NEXT_BUILD=1 npx playwright test -c playwright.operator-mock.config.ts infra-diagrams-layout

Done when:
- New sparse-peering case is @release-gate, asserts ≥4 visible nodes, short pair distances, no empty-plate viewBox, Edges table has 6 rows
```
