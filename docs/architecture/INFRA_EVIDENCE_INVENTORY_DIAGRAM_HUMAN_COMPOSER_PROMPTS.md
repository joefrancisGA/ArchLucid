> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that make **Inventory diagrams** read like a human sketch of VNet peerings. Internal engineering only.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
> **Paste files:** [`.cursor/prompts/inventory-diagram-human-00-index.md`](../../.cursor/prompts/inventory-diagram-human-00-index.md) (one numbered file per session).
> **Locked owner export:** [`fixtures/owner-executive-eleven-vnet-2026-09-12.mmd`](fixtures/owner-executive-eleven-vnet-2026-09-12.mmd).
>
> **Do not** re-run **IDS-01–IDS-04**. IDS-02 packing subgraphs are known-wrong on this export. Do not re-run **IDL / IDV / IDC / IE-ID**.

# IDH-01–IDH-03 — Inventory diagrams the way a human would read them

**Observed:** Owner **Export Mermaid** from SecureNow Inventory diagrams, Executive, snapshot `bebca1ae-…` (889 resources). File is `flowchart TD`, 11 VNets, 6 unlabeled `-->`, 0 subgraphs. Screenshot zoom **30%**, two tiny nodes, dual scrollbars. Measured on Mermaid 11.17.2 with current viewer init: that file is a **5-column TD forest (1128×208, 11/11 visible at 100%)**. Wrapping the same graph in IDS-02 `alpack_*` subgraphs **widens** it to 2038×304 (LR pairs, horizontal scroll). Row-pack `~~~` without subgraphs is 725×357 (aspect 2:1).

**Product framing (locked):** paint this export as columns of short TD peerings at 15 px. Do not hide arrows. Do not wrap `alpack_*`.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| `alpack_*` subgraphs flip pairs to LR (Mermaid 11 extractor) | **IDH-01** | Deploying master IDS-02 makes this snapshot worse |
| Persisted `diagZoom=0.3`; unmapped `getBBox` crop; dead `ranker` | **IDH-02** | User keeps 30% after a new render; next agent “tunes” ranker |
| IDS-04 unmapped bbox + job skipped on `pull_request` | **IDH-03** | Next wave re-diagnoses from a screenshot again |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IDH-01** Row-pack; delete packing subgraphs | Parallel with 02 | IDS-02 code on trunk (rewrite it) |
| **IDH-02** Zoom reset + mapped crop + drop ranker | Parallel with 01 | IDL-07 / IDS-03 crop on trunk |
| **IDH-03** Owner `.mmd` Playwright + PR job | Last | 01–02 merged |

**Run one prompt per chat.** Feature branch per prompt (`cursor/inventory-diagram-human-<short-name>-c5f0`). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Mermaid stays dynamically imported on UI hot paths (`mermaid-import-policy`).
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- The owner file has **0 subgraphs**. IDS-02 did not produce this export.
- Unlabeled `-->` is the live AST. Visible edge count is 6. Do not drop those arrows.
- Mermaid 11 flowchart subgraphs without external edges flip **TB → LR** with hardcoded 50/50. That is why packing subgraphs fail.
- `ranker` is not a flowchart dagre key in 11.17.2.
- Unmapped `g.node.getBBox` union on this file is ≈273×43. Mapped union is ≈1112×192.
- IDS-04 has never run on the IDS pull requests (`ui-playwright-mock-smoke` skips `pull_request`).

---

# IDH-01 — Row-pack disconnected components; delete packing subgraphs

**Depends on:** IDS-02 code on trunk (rewrite) · **Branch:** `cursor/inventory-diagram-human-row-pack-c5f0`

**Paste file:** [`.cursor/prompts/inventory-diagram-human-01-row-pack-components.md`](../../.cursor/prompts/inventory-diagram-human-01-row-pack-components.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: when an inventory diagram has real edges and more than one connected component, pack those components with layout-only ~~~ links from previous-row sinks to next-row heads. Do not wrap components in subgraphs. Real peering arrows stay visible and counted.

Locked owner export: docs/architecture/fixtures/owner-executive-eleven-vnet-2026-09-12.mmd — 11 VNets, 6 unlabeled -->, 0 subgraphs. IDS-02 alpack_* wrapping makes this graph wider (Mermaid 11 extractor flips edge-free subgraphs to LR).

This is NOT a re-do of IDL-02 (keep the zero-edge grid). Do not drop peering edges. Do not change flowchart TD to LR. Do not add elk. Do not implement IDH-02/03.

Read first:
- .cursor/prompts/inventory-diagram-human-00-index.md
- .cursor/prompts/inventory-diagram-human-01-row-pack-components.md
- ArchLucid.ArtifactSynthesis/Compilers/DiagramSparseComponentPacker.cs
- ArchLucid.ArtifactSynthesis/Compilers/DiagramPeerGridPlanner.cs
- ArchLucid.ArtifactSynthesis.Tests/DiagramSparseComponentPackerTests.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramSparseComponentPacker|FullyQualifiedName~DiagramComponentRowPlanner|FullyQualifiedName~MermaidDiagramRenderer'

Compile (heartbeat every 8s if >15s):
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'

Done when:
- Owner-shape compile: 11 nodes, 6 visible edges, 0 alpack subgraphs, ~~~ row links present, no extra visible edges
- Zero-edge 11-node compile still has 0 packing subgraphs
```

---

# IDH-02 — Viewer zoom reset, mapped crop, drop ranker

**Depends on:** IDL-07 / IDS-03 crop on trunk · **Branch:** `cursor/inventory-diagram-human-viewer-camera-c5f0`

**Paste file:** [`.cursor/prompts/inventory-diagram-human-02-viewer-zoom-and-camera.md`](../../.cursor/prompts/inventory-diagram-human-02-viewer-zoom-and-camera.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: inventory mermaid viewer must default to 100% when mermaidSource changes, must never set viewBox from unmapped g.node getBBox, and must drop the no-op ranker key from createArchitectureDiagramMermaidConfig.

Owner export at current init is 11/11 visible at 100%. The screenshot at 30% with two distant nodes is not this source under the current camera. Reset persisted diagZoom on source change.

Do not change ArtifactSynthesis. Do not retune nodeSpacing/rankSpacing. Do not implement IDH-01/03.

Read first:
- .cursor/prompts/inventory-diagram-human-00-index.md
- .cursor/prompts/inventory-diagram-human-02-viewer-zoom-and-camera.md
- archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx
- archlucid-ui/src/lib/help/help-mermaid.ts
- archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
cd archlucid-ui && npx vitest run src/lib/architecture/architecture-diagram-mermaid-config.test.ts src/lib/help/help-mermaid.test.ts src/components/architecture/ArchitectureDiagramViewer.test.tsx

Done when:
- mermaidSource change clears diagZoom to 100%
- crop test uses mapped union (~1112×192) not unmapped (~273×43)
- ranker key removed from mermaid init
```

---

# IDH-03 — Owner `.mmd` Playwright ratchet on pull_request

**Depends on:** IDH-01–02 · **Branch:** `cursor/inventory-diagram-human-ratchet-c5f0`

**Paste file:** [`.cursor/prompts/inventory-diagram-human-03-owner-mmd-ratchet.md`](../../.cursor/prompts/inventory-diagram-human-03-owner-mmd-ratchet.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: replace the IDS-04 sparse-peering Playwright fixture with the owner 11/6 export (post-IDH-01 ~~~ packing, no alpack). Measure mapped node boxes. Fail on aspect > 2.5, fewer than 9 visible nodes, zoom not 100%, or reintroduced alpack subgraphs. Run chromium-infra-diagrams-layout on pull_request for the listed paths.

Do not change packer or viewer behaviour. If the spec fails after IDH-01–02, report which prompt regressed.

Read first:
- .cursor/prompts/inventory-diagram-human-03-owner-mmd-ratchet.md
- archlucid-ui/e2e/infra-diagrams-layout.mock.spec.ts
- archlucid-ui/e2e/fixtures/infra-diagrams-mermaid.ts
- docs/architecture/fixtures/owner-executive-eleven-vnet-2026-09-12.mmd

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file. Keep existing IDL-06 grid and legacy-chain cases.

Tests:
cd archlucid-ui && MOCK_E2E_SKIP_NEXT_BUILD=1 npx playwright test -c playwright.operator-mock.config.ts --project=chromium-infra-diagrams-layout

Done when:
- Sparse-peering case asserts ≥9 visible nodes, aspect ≤2.5, zoom 100, Edges table 6, no alpack
- A path-filtered pull_request job runs this project (not skipped)
```

---

## Follow-on — Graphviz (not IDH-04)

Owner 2026-09-13 asked for **Graphviz `fdp` from `DiagramAst`** rather than another Mermaid session. Next wave: [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_GRAPHVIZ_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_GRAPHVIZ_COMPOSER_PROMPTS.md). Do not start IDH-04.
