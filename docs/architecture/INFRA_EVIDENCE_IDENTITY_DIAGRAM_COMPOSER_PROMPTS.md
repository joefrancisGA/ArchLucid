> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that make **Inventory diagrams → Identity mode** paint when the snapshot has managed identities. Internal engineering only.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
> **Paste files:** [`.cursor/prompts/inventory-diagram-identity-00-index.md`](../../.cursor/prompts/inventory-diagram-identity-00-index.md) (one numbered file per session).
>
> **Do not** re-implement **IE-ND-01** (network category), **IE-ND-04** (subnet subgraphs), **IE-HOTFIX**, or **IDV** fit/zoom/overlay. **IE-ND-03** flattened Network and deferred Identity — this set is that leftover.

# IE-ID-01–IE-ID-03 — Identity diagram compiles but does not paint

**Observed:** Inventory diagrams (`/governance/infrastructure/diagrams`) **Identity** mode. Green **Render succeeded · 18 nodes · 17 edges · 14 subgraphs**. Nodes/Edges outline filled. Zoom cluster visible. **No mermaid canvas.**

**Product framing (locked):** inventory Mermaid workbench, not the Architecture-tab brief diagram. Do not “fix” Identity mode by parsing the architecture brief.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Sparse RG swimlanes not flattened in Identity mode | **IE-ID-01** | 14 nested clusters; mermaid.js / ink-crop still fail |
| Snapshot mermaid never asserted Identity has nodes | **IE-ID-02** | Flatten can drift with no failing test |
| IDV overlay + zero-ink SVG collapses the viewport | **IE-ID-03** | Identity with &lt;8 RGs (or any nested leftover) still looks blank |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IE-ID-01** Flatten sparse Identity swimlanes | **First** | IE-16, IE-UX-02, IE-ND-03 already on trunk |
| **IE-ID-02** Snapshot Identity mermaid contract | After 01 | Sparse “no subgraph” needs 01 |
| **IE-ID-03** Viewport must not collapse | Parallel with 01 | IDV-01–03 on trunk |

**Run one prompt per chat.** Feature branch per prompt (`cursor/identity-diagram-<short-name>-2527`). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No second collector. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Mermaid stays dynamically imported on UI hot paths (`mermaid-import-policy`).
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- Server Succeeded is Mermaid **text**. Outline tables parse that text. They are not proof the SVG painted.
- Identity **filter already returns nodes** (`Microsoft.ManagedIdentity/*` / `authorization`). Do not re-run IE-ND-01-style classification unless a fixture proves MIs are dropped.
- `ModeFlattensSparseSubgraphs` is Executive | Data | Network. Threshold 8. Owner graph had 14 subgraphs.
- Parent subscription subgraph has no direct nodes — only nested RG children — plus cross-RG identity edges.
- IDV overlay is `absolute`; viewport has no min-height; stripped SVG height + failed ink bbox → collapse. Do not restore `min-h-[18rem]` as a hole around a successful small graph.
- Outline `Resource type` `–` (missing `al-type`) is **not** this bug. Footer “Build identity unavailable” is the deployment SHA.

---

# IE-ID-01 — Flatten sparse Identity-mode swimlanes

**Depends on:** IE-16, IE-UX-02, IE-ND-03 · **Branch:** `cursor/identity-diagram-sparse-flatten-2527`

**Paste file:** [`.cursor/prompts/inventory-diagram-identity-01-flatten-sparse-swimlanes.md`](../../.cursor/prompts/inventory-diagram-identity-01-flatten-sparse-swimlanes.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Identity mode must flatten sparse resource-group swimlanes the same way Executive, Data, and Network already do. DiagramAstExecutiveLayoutSimplifier comment already states Mermaid emits a canvas of mostly empty boxes when many RGs each hold one node — ModeFlattensSparseSubgraphs currently returns Executive | Data | Network. IE-ND-03 added Network and deferred Identity.

Owner screenshot (do not re-diagnose): Inventory diagrams Identity, Render succeeded, 18 nodes / 17 edges / 14 subgraphs, outline filled, no painted canvas.

This is NOT a re-do of IE-ND-01 (category), IDV viewport, or IE-HOTFIX. Do not change flowchart TD to LR. Do not scan .tf files. Do not add a second Azure collector. Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92. Do not hide desktop review workspace tabs.

Read first:
- .cursor/prompts/inventory-diagram-identity-00-index.md
- .cursor/prompts/inventory-diagram-identity-01-flatten-sparse-swimlanes.md
- ArchLucid.ArtifactSynthesis/Compilers/DiagramAstExecutiveLayoutSimplifier.cs
- ArchLucid.ArtifactSynthesis.Tests/DiagramAstFromGraphCompilerTests.cs (Compile_network_mode_flattens_sparse_swimlanes_when_many_resource_groups_each_hold_one_node; Compile_data_mode_keeps_resource_group_frames_when_few_swimlanes; Compile_full_subscription_does_not_flatten_sparse_swimlanes)
- ArchLucid.KnowledgeGraph/Inventory/AzureInventoryTopologyCategory.cs
- ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramReadabilityThresholds.cs (MaxSubgraphs = 64)

Working-tree: before editing a tracked file run
pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'
Exit 2 → skip that path and report.

Work:
1. Include DiagramMode.Identity in ModeFlattensSparseSubgraphs (same SparseSubgraphFlattenThreshold = 8). Comment update is enough if the type name stays; rename only if a two-year developer would think Executive excludes Identity.
2. Tests modeled on Data/Network sparse fixtures (must fail on current master, pass after):
   - 12 resource groups × one Microsoft.ManagedIdentity/userAssignedIdentities each, category DERIVED from arm.type (empty Category).
   - Identity compile: node count 12, subgraphs empty, mermaid has no subgraph keyword, contains identity labels, flowchart TD.
   - Few swimlanes (3 RGs) still keep RG frames.
3. FullSubscription must still NOT flatten (existing test). Do not add Security/Architecture/ResourceGroup unless a fixture proves the same empty-box shape.
4. Reuse BuildSparseSingleNodePerResourceGroupGraph or a sibling. Prefer LINQ, concrete types, null checks, blank line before if/foreach unless first in method. No ConfigureAwait(false) in tests.

Do not:
- Change category classification.
- Change UI viewer, IDV fit/zoom/overlay, or IE-ND-05 copy.
- Statically import mermaid.
- git add -A.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests'

Compile (heartbeat every 8s if >15s):
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'

Done when:
- Identity mode with many one-node RGs is a flat readable flowchart, not 12 empty RG boxes.
- MaxSubgraphs is not the reason a 12-MI Identity diagram is Partitioned.
```

---

# IE-ID-02 — Identity-mode mermaid contract from inventory snapshots

**Depends on:** IE-ID-01 · **Branch:** `cursor/identity-diagram-snapshot-mermaid-contract-2527`

**Paste file:** [`.cursor/prompts/inventory-diagram-identity-02-snapshot-mermaid-contract.md`](../../.cursor/prompts/inventory-diagram-identity-02-snapshot-mermaid-contract.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: GET mermaid?mode=identity and mermaid/preview Identity row must include inventory user-assigned identities with non-empty Mermaid node lines. After IE-ID-01, a sparse many-RG identity snapshot must not emit subgraph.

Do not re-do IE-ID-01 unless flatten is missing on this branch (rebase/merge it). Do not implement IE-ID-03 viewport here.

Read first:
- .cursor/prompts/inventory-diagram-identity-02-snapshot-mermaid-contract.md
- ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs
- ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceSnapshotMermaidServiceTests.cs (Network_mode_renders_mermaid_for_virtual_network_snapshot and siblings)
- ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceMermaidModeParser.cs

Working-tree check before tracked edits.

Work:
1. Application.Tests: snapshot of ≥3 and a sparse 12-RG sibling of Microsoft.ManagedIdentity/userAssignedIdentities. Distinct ResourceGroup per resource on the sparse fixture. Do not pre-stamp Category.
2. TryGetMermaidAsync mode=identity: Succeeded or Partitioned; NodeCount equals identity resource count; mermaid contains flowchart TD and each resource label (last ARM segment). Sparse 12-RG: mermaid does not contain subgraph.
3. Preview: Modes row Mode=="identity" has NodeCount > 0. Status is not Failed.
4. Mixed: MIs + storage → Identity includes MI labels, excludes storage; Data/full still include storage.
5. Keep existing IE-HOTFIX / Network tests.

Do not:
- Statically import mermaid.
- Lower IE-17 thresholds.
- git add -A.

Tests:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidServiceTests'

Compile:
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'

Done when:
- An MI-only snapshot yields Identity mermaid with those labels and matching NodeCount.
- Sparse many-RG Identity mermaid is flat after IE-ID-01.
```

---

# IE-ID-03 — Inventory mermaid viewport must not collapse

**Depends on:** IDV-01–03 · **May parallel IE-ID-01** · **Branch:** `cursor/identity-diagram-viewport-collapse-2527`

**Paste file:** [`.cursor/prompts/inventory-diagram-identity-03-viewport-must-not-collapse.md`](../../.cursor/prompts/inventory-diagram-identity-03-viewport-must-not-collapse.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: When inventory/architecture mermaid SVG ink cannot be measured or fits to a tiny box, show in-flow render-failure UI inside architecture-diagram-viewport. Zoom/Fit/Fullscreen must not float over the Nodes table on a zero-height canvas.

Do not restore min-h-[18rem] as a hole around a successful small graph (IDV-01). Do not revert IDV contain-fit, camera zoom, or overlay clustering. Do not flatten Identity here (IE-ID-01). Do not change flowchart TD to LR.

Owner screenshot: Identity Succeeded, overlay zoom 130% right-aligned, then Nodes — no diagram frame.

Read first:
- .cursor/prompts/inventory-diagram-identity-03-viewport-must-not-collapse.md
- archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx
- archlucid-ui/src/components/architecture/ArchitectureDiagramViewportControls.tsx
- archlucid-ui/src/lib/help/help-mermaid.ts (fitMermaidSvgElementToViewport, readMappedNodeInkBBox)
- archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx (handleRenderFailure)

Working-tree check before tracked edits.

Work:
1. After mermaid.render + sanitize + contain-fit: if no SVG, ink bbox null, or fitted base height below a small documented floor (~24px), use existing in-flow architecture-diagram-render-failure (+ retry if onRetry exists).
2. mermaid.render throw: IE-ND-05 contract — failure UI, not INFRA_EVIDENCE_MERMAID_TOO_LARGE_FOR_BROWSER_MESSAGE.
3. Measurable ink: keep IDV contain-fit and overlay.
4. Viewport still contains zoom + Fullscreen. Failure UI is inside the viewport, in-flow.
5. Vitest: unmeasurable/0-height mock SVG → render failure inside viewport; render reject → not too-large; IDV contain-fit and overlay-inside-viewport tests stay green; help fitMermaidSvgElementToHost width-fill / min height 280 unchanged.

Do not:
- Add svg-pan-zoom or restore CSS transform scale as layout zoom.
- Statically import mermaid.
- git add -A.

Tests from archlucid-ui/:
npm test -- src/components/architecture/ArchitectureDiagramViewer.test.tsx src/lib/help/help-mermaid.test.ts

Done when:
- Unmeasurable or ~0-height ink shows in-flow failure inside the viewport, not a floating zoom cluster over Nodes.
- IDV contain-fit and overlay tests still pass.
```
