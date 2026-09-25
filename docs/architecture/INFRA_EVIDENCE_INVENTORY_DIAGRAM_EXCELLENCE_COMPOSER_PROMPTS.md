> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that make **inventory diagrams excellent for humans** after Visio-style resource-group frames and hop-lift: recapture, shared hop compose, cited hops, honest verbs, nested VNet/subnet + subscription frames, role packing, singleton-RG collapse, PE opt-in, completeness, hop-focus modes. **Applies to every `DiagramMode`.** Internal engineering only. **Do not implement from this file** except by pasting one numbered prompt per chat.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
> **Paste files:** [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](../../.cursor/prompts/inventory-diagram-excellence-00-index.md) (one numbered file per session).
>
> **Do not** re-run **IDL / IDS / IDT / IDH / IDG / IDR / IDA / IDF / IDP / IE-RF / AX-DE** as greenfield. Nested VNet/subnet + subscription frames are **IDX-05 / IDX-06** (authorized here). They stay **IDA-HOLD / IDF-HOLD** in those earlier waves.

# IDX-01–IDX-13 — Inventory-diagram excellence (all diagram types)

**Observed (2026-09-21):** Owner Full subscription forest after RG-first Visio packing + maximize-edges. Snapshot `Hmd_HL_HAP_Non_Prod` (2026-09-19): 424 resources, ~247 visible. Humans can read resource-group boxes. Remaining excellence gaps are capture holes, late hop compose, all-to-all collocation, generic verbs, missing nested Azure boxes, singleton-RG tails, no PE toggle, and mode-specific compilers that do not share those rules (especially DataFlow / Identity / neighborhood).

**Product framing (locked):** one snapshot graph, one hop composer, one verb table, one nested-frame packer. **Every `DiagramMode` consumes them.** Mode filters still decide *which nodes appear*. They must not decide *whether hidden NIC/PE hops count*. PE cards stay **opt-in, default off**.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Nested ARM ids never stored | **IDX-01** | Algorithms keep drawing 15 edges |
| Compose after mode filter | **IDX-02** | DataFlow / Identity miss VM→subnet |
| Same-RG / single-VNet clique | **IDX-03** | Canvas looks busy and false |
| Labels say `connects` | **IDX-04** | Peering = placement = identity |
| No VNet/subnet boxes | **IDX-05** | Network still a flat RG dump |
| No subscription container | **IDX-06** | Multi-sub or Full has no outer |
| Role-blind inner grid | **IDX-07** | Hubs lost; compute mixed with KV |
| Singleton-RG tail | **IDX-08** | Full subscription is a postage sheet |
| Duplicate connections | **IDX-09** | Five Office365 cards per Logic App |
| PE flag with no UI | **IDX-10** | Operators cannot opt in; or PEs sneak on |
| Generic completeness banner | **IDX-11** | Walkthrough 247 / 232 / 15 unexplained |
| Neighborhood is a crop | **IDX-12** | Selected / RG / neighborhood ignore hops |
| Full-sub-only tests | **IDX-13** | Other eleven modes regress |
| Complete-graph / icons / RBAC dump | **IDX-HOLD** | Honesty + license |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IDX-01** Recapture | First | extractor family on trunk |
| **IDX-02** Graph-build compose + dedupe | After 01 preferred | fixtures can start earlier |
| **IDX-03** Cited hops | After 02 | |
| **IDX-04** Honest verbs | After 02 (prefer 03) | |
| **IDX-05** Nested VNet/subnet frames | After 04 preferred | |
| **IDX-06** Subscription outer | After 05 | |
| **IDX-07** Role-aware packing | After 05 | |
| **IDX-08** Singleton-RG collapse | After 06 | |
| **IDX-09** Duplicate connection collapse | After 03 | |
| **IDX-10** PE opt-in toggle | After 02 | |
| **IDX-11** Completeness strip | After 01 | |
| **IDX-12** Hop-focus modes | After 02+03 | |
| **IDX-13** Cross-mode ratchet | Last | 01–12 |
| **IDX-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/inventory-diagram-excellence-<short-name>-idx1`). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.
- **Do not** retune Mermaid `nodeSpacing` / `rankSpacing` / `padding`. **Do not** raise `ComponentHorizontalGap` / `ComponentVerticalGap`. **Do not** default Graphviz `dot`.
- **Do not** implement a complete graph. **Do not** show NIC/PE cards by default. **Do not** ship Microsoft icons. **Do not** dump RBAC onto Full subscription.
- Compile or fixture **all twelve** `DiagramMode` values whenever the change can affect AST, forest, Mermaid, or PNG. Skip a mode only when its node filter leaves zero applicable nodes — and assert that skip.

### Locked facts (do not re-diagnose)

- Live Full/Executive canvas is **inventory-forest**. Mermaid is Export / fail-soft. Graphviz `fdp` is inventory **PNG**.
- `DiagramMode`: Executive, Architecture, Network, Security, Identity, Data, DataFlow, DataArchitecture, FullSubscription, ResourceGroup, SelectedResources, DependencyNeighborhood.
- `IncludePrivateEndpointNodes` already exists (`DiagramAstCompileOptions`); default false. No workbench toggle yet.
- DataFlow / DataArchitecture use stage / type-group subgraphs — do **not** replace them with RG-first packing.
- Nested frames were **IDA-HOLD / IDF-HOLD**. This wave **supersedes** that hold **only** via IDX-05/06. Do not start nesting from IDA/IDF paste files.
- AX-DE collection catalog is **shipped**. IDX-01 extends persistence of nested properties; it does not add a second collector or GET-every-id.

### All-mode contract

See [`.cursor/prompts/inventory-diagram-excellence-00-index.md`](../../.cursor/prompts/inventory-diagram-excellence-00-index.md) table. Copy that table into tests as comments or theory data. A change that only has a Full subscription test **fails IDX-13**.

---

# IDX-01 — Recapture nested relationship properties

**Depends on:** existing extractor family · **Branch:** `cursor/inventory-diagram-excellence-recapture-idx1`

**Paste file:** [`.cursor/prompts/inventory-diagram-excellence-01-recapture.md`](../../.cursor/prompts/inventory-diagram-excellence-01-recapture.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: persist nested ARM relationship properties the hosted list and ARG flatten currently drop (NIC ipConfigurations subnet ids, PE subnet/target, Logic App $connections.value, site kind, ADF linked-service ARM ids, diagnostic workspace ids) so every DiagramMode can compile cited hops. Do not add a second collector. Do not GET every resource id. Do not re-run AX-DE as greenfield.

Locked diagnosis: Full subscription edge counts stay tiny when NIC/PE files exist but properties are empty. Algorithms cannot invent subnet ids.

This is NOT IDX-02 compose. NOT nested frames. NOT a PE UI toggle.

Read first:
- .cursor/prompts/inventory-diagram-excellence-00-index.md
- .cursor/prompts/inventory-diagram-excellence-01-recapture.md

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj --filter 'FullyQualifiedName~Nic|FullyQualifiedName~PrivateEndpoint|FullyQualifiedName~LogicApp|FullyQualifiedName~Diagnostic'
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~LogicAppConnection|FullyQualifiedName~AppSettingHost'
```

---

# IDX-02 — Graph-build hop compose and role dedupe

**Depends on:** IDX-01 preferred · **Branch:** `cursor/inventory-diagram-excellence-compose-idx1`

**Paste file:** [`.cursor/prompts/inventory-diagram-excellence-02-graph-build-compose.md`](../../.cursor/prompts/inventory-diagram-excellence-02-graph-build-compose.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: compose hidden NIC/PE/parent hops on the snapshot graph (visible projection) before DiagramMode filters, and dedupe edges by (from, to, role). Every mode including DataFlow, DataArchitecture, Identity, SelectedResources, and DependencyNeighborhood must consume that projection. Do not show NIC/PE cards. Do not move compose back into a Full-subscription-only compiler path.

Locked diagnosis: DiagramCollapsedAttachmentEdgeLifter runs after mode filters; DataFlow skips it; duplicate CONNECTS_TO + likely-in steal keys.

This is NOT cited-hop demotion (IDX-03). NOT verbs. NOT nested frames.

Read first:
- .cursor/prompts/inventory-diagram-excellence-00-index.md
- .cursor/prompts/inventory-diagram-excellence-02-graph-build-compose.md
- ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs
- ArchLucid.ArtifactSynthesis/Compilers/DiagramCollapsedAttachmentEdgeLifter.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~VisibleSnapshot|FullyQualifiedName~Attachment|FullyQualifiedName~ParentChild'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompiler|FullyQualifiedName~CollapsedAttachment'
```

---

# IDX-03 — Cited hops instead of all-to-all

**Depends on:** IDX-02 · **Branch:** `cursor/inventory-diagram-excellence-cited-hops-idx1`

**Paste file:** [`.cursor/prompts/inventory-diagram-excellence-03-cited-hops.md`](../../.cursor/prompts/inventory-diagram-excellence-03-cited-hops.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: stop emitting same-RG or single-VNet all-to-all edges when a cited hop exists; never add a cross-RG edge without a cited hop (ARM id, association row, Logic App connection, diagnostic, peering, or composed NIC/PE path). Collocation remains last-resort DeterministicInference labeled likely · in. Applies to every DiagramMode.

Locked diagnosis: Logic App ↔ every Microsoft.Web/connections in the RG, and every VM → the only VNet, created cliques that look like topology.

This is NOT a complete graph. NOT RBAC on Full subscription.

Read first:
- .cursor/prompts/inventory-diagram-excellence-00-index.md
- .cursor/prompts/inventory-diagram-excellence-03-cited-hops.md
- ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotSameResourceGroupEdgeHydrator.cs
- ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotLogicAppConnectionHydrator.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~SameResourceGroup|FullyQualifiedName~LogicAppConnection|FullyQualifiedName~MaximizeEdges'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests'
```

---

# IDX-04 — Honest relationship verbs

**Depends on:** IDX-02 (prefer IDX-03) · **Branch:** `cursor/inventory-diagram-excellence-verbs-idx1`

**Paste file:** [`.cursor/prompts/inventory-diagram-excellence-04-honest-verbs.md`](../../.cursor/prompts/inventory-diagram-excellence-04-honest-verbs.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: visible edge labels use short verbs from GraphEdgeTypes: in / contains / peering / uses / reads / writes / applies / may access / declared — not generic connects — on forest, Export Mermaid, and Graphviz PNG for every DiagramMode. Keep IDP dash 4 3 for declared and IDA peering dash 6 4. Do not color-only encode the verb.

Locked diagnosis: CONTAINS, PEERS_WITH, APPLIES_TO, and CAN_READ collapse in DiagramEdgeLabelHumanizer or collocation rewrite.

This is NOT teal provenance. NOT nested frames.

Read first:
- .cursor/prompts/inventory-diagram-excellence-00-index.md
- .cursor/prompts/inventory-diagram-excellence-04-honest-verbs.md
- ArchLucid.ArtifactSynthesis/Compilers/DiagramEdgeLabelHumanizer.cs
- ArchLucid.KnowledgeGraph/WellKnownGraph.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramEdgeLabelHumanizer|FullyQualifiedName~DiagramAstFromGraphCompiler|FullyQualifiedName~DiagramAstGraphviz'
```

---

# IDX-05 — Nested VNet and subnet frames

**Depends on:** IDX-04 preferred · **Branch:** `cursor/inventory-diagram-excellence-nested-frames-idx1`

**Paste file:** [`.cursor/prompts/inventory-diagram-excellence-05-nested-vnet-subnet-frames.md`](../../.cursor/prompts/inventory-diagram-excellence-05-nested-vnet-subnet-frames.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: when a diagram mode's visible nodes include a VNet and its subnets (or resources composed into those subnets), draw nested frames VNet → subnet inside the resource-group frame on inventory-forest and matching Graphviz clusters. Skip a nest layer when that mode filtered the parent or child away. This prompt authorizes nested Azure boxes; do not start it from an IDA or IDF chat.

Locked diagnosis: IDA-HOLD / IDF-HOLD blocked nested frames; IE-ND-04 mermaid subgraphs never became forest chrome; Network mode still looks like a flat RG.

This is NOT a subscription outer box (IDX-06). NOT Microsoft icons. NOT merging disconnected components.

Read first:
- .cursor/prompts/inventory-diagram-excellence-00-index.md
- .cursor/prompts/inventory-diagram-excellence-05-nested-vnet-subnet-frames.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramResourceGroupPacker.cs
- ArchLucid.ArtifactSynthesis/Layout/DiagramForestResourceGroupFrameSvgEmitter.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramForest|FullyQualifiedName~Nested|FullyQualifiedName~Vnet|FullyQualifiedName~Subnet'
```

---

# IDX-06 — Subscription outer frame

**Depends on:** IDX-05 · **Branch:** `cursor/inventory-diagram-excellence-subscription-frame-idx1`

**Paste file:** [`.cursor/prompts/inventory-diagram-excellence-06-subscription-outer-frame.md`](../../.cursor/prompts/inventory-diagram-excellence-06-subscription-outer-frame.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: subscription-scoped modes (Executive, Architecture, Network, Security, Identity, Data, DataFlow, DataArchitecture, FullSubscription) draw one outer subscription frame around RG frames. ResourceGroup, SelectedResources, and DependencyNeighborhood do not get a subscription outer unless the compile options explicitly say the selection is the whole subscription. PNG clusters match. Do not nest a second subscription when only one exists.

This is NOT singleton collapse (IDX-08).

Read first:
- .cursor/prompts/inventory-diagram-excellence-00-index.md
- .cursor/prompts/inventory-diagram-excellence-06-subscription-outer-frame.md

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~SubscriptionFrame|FullyQualifiedName~DiagramForest|FullyQualifiedName~DiagramAstGraphviz'
```

---

# IDX-07 — Role-aware packing and hubs

**Depends on:** IDX-05 · **Branch:** `cursor/inventory-diagram-excellence-role-pack-idx1`

**Paste file:** [`.cursor/prompts/inventory-diagram-excellence-07-role-aware-packing.md`](../../.cursor/prompts/inventory-diagram-excellence-07-role-aware-packing.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: inside each RG frame (and inside nested VNet frames when present), pack by role columns — compute, data/storage, identity, network, integration — and place high-degree hubs (VNet, Key Vault, NSG, ADF) as hubs not stacked peers. Apply to every DiagramMode that uses inventory-forest packing. DataFlow keeps LR stages; still hub a shared Key Vault / ADF inside a stage if degree is high.

This is NOT singleton-RG collapse. NOT Mermaid gap retune.

Read first:
- .cursor/prompts/inventory-diagram-excellence-00-index.md
- .cursor/prompts/inventory-diagram-excellence-07-role-aware-packing.md
- ArchLucid.ArtifactSynthesis/Layout/DiagramResourceGroupCellFlowPlanner.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~CellFlow|FullyQualifiedName~RolePack|FullyQualifiedName~Hub'
```

---

# IDX-08 — Singleton resource-group collapse

**Depends on:** IDX-06 · **Branch:** `cursor/inventory-diagram-excellence-singleton-collapse-idx1`

**Paste file:** [`.cursor/prompts/inventory-diagram-excellence-08-singleton-rg-collapse.md`](../../.cursor/prompts/inventory-diagram-excellence-08-singleton-rg-collapse.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: when a subscription-scoped forest has many one-node resource-group frames, collapse the tail into one "Other resource groups (N)" summary frame with an expand/focus path (outline or neighborhood). Do not collapse ResourceGroup mode. Do not collapse a singleton that has an inter-RG cited hop — keep that frame. Apply the same rule to Executive / Network / Security / Identity / Data / FullSubscription / Architecture. DataFlow/DataArchitecture only collapse ARM-located singleton RGs that are not stage-critical.

This is NOT merging disconnected components into one fake RG.

Read first:
- .cursor/prompts/inventory-diagram-excellence-00-index.md
- .cursor/prompts/inventory-diagram-excellence-08-singleton-rg-collapse.md

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~Singleton|FullyQualifiedName~ResourceGroupPacker|FullyQualifiedName~DiagramForest'
```

---

# IDX-09 — Duplicate connection collapse

**Depends on:** IDX-03 · **Branch:** `cursor/inventory-diagram-excellence-dup-connections-idx1`

**Paste file:** [`.cursor/prompts/inventory-diagram-excellence-09-duplicate-connection-collapse.md`](../../.cursor/prompts/inventory-diagram-excellence-09-duplicate-connection-collapse.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: collapse duplicate Microsoft.Web/connections (same API type + same RG, or same ARM id referenced by multiple workflows) into one card with a count, keeping cited Logic App hops. Apply in FullSubscription, ResourceGroup, Executive, Architecture, DataFlow, DataArchitecture, SelectedResources, and neighborhood when those nodes are visible. Identity/Network/Security skip when connections are filtered out — assert skip.

Do not drop the only cited hop. Do not all-to-all the collapsed card to every app.

Read first:
- .cursor/prompts/inventory-diagram-excellence-00-index.md
- .cursor/prompts/inventory-diagram-excellence-09-duplicate-connection-collapse.md

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~ConnectionCollapse|FullyQualifiedName~LogicApp|FullyQualifiedName~DiagramAstFromGraphCompiler'
```

---

# IDX-10 — Private-endpoint opt-in toggle

**Depends on:** IDX-02 · **Branch:** `cursor/inventory-diagram-excellence-pe-toggle-idx1`

**Paste file:** [`.cursor/prompts/inventory-diagram-excellence-10-pe-opt-in-toggle.md`](../../.cursor/prompts/inventory-diagram-excellence-10-pe-opt-in-toggle.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: every inventory diagram workbench mode gets an opt-in "Show private endpoints" control that sets IncludePrivateEndpointNodes. Default off. Hidden PEs still drive hop compose (IDX-02). NICs stay hidden. Wire architecture, security, and selectedResources parser keys if those modes are still unreachable. Export Mermaid / PNG honor the same flag.

Do not default the toggle on. Do not add a second PE analysis pipeline.

Read first:
- .cursor/prompts/inventory-diagram-excellence-00-index.md
- .cursor/prompts/inventory-diagram-excellence-10-pe-opt-in-toggle.md
- ArchLucid.ArtifactSynthesis/Models/DiagramAstCompileOptions.cs
- archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~MermaidModeParser|FullyQualifiedName~IncludePrivateEndpoint'
cd archlucid-ui && npx vitest run src/app/\(operator\)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx
```

---

# IDX-11 — Mode-aware completeness strip

**Depends on:** IDX-01 · **Branch:** `cursor/inventory-diagram-excellence-completeness-idx1`

**Paste file:** [`.cursor/prompts/inventory-diagram-excellence-11-completeness-strip.md`](../../.cursor/prompts/inventory-diagram-excellence-11-completeness-strip.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: replace the generic completeness banner with a mode-aware strip that lists relationship classes collected vs missing for the current DiagramMode, and explains walkthrough counts (resources, connected components, visible relationships) including hidden NIC/PE hops used in analysis. Reuse InfraEvidenceCompletenessWarningsBanner; do not add a nav item. Every mode including neighborhood.

Do not call Azure at render time to fill gaps. Do not treat missing classes as "graph too large."

Read first:
- .cursor/prompts/inventory-diagram-excellence-00-index.md
- .cursor/prompts/inventory-diagram-excellence-11-completeness-strip.md
- archlucid-ui/src/components/infra-evidence/InfraEvidenceCompletenessWarningsBanner.tsx

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~Completeness'
cd archlucid-ui && npx vitest run src/components/infra-evidence/InfraEvidenceCompletenessWarningsBanner.test.tsx
```

---

# IDX-12 — Hop-focus for neighborhood, selected, and resource group

**Depends on:** IDX-02, IDX-03 · **Branch:** `cursor/inventory-diagram-excellence-hop-focus-idx1`

**Paste file:** [`.cursor/prompts/inventory-diagram-excellence-12-hop-focus-modes.md`](../../.cursor/prompts/inventory-diagram-excellence-12-hop-focus-modes.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: DependencyNeighborhood, SelectedResources, and ResourceGroup compile hop-focus graphs from the shared visible projection: include cited attachments needed to explain the seed/selection/RG, still hide NIC/PE cards unless the PE toggle is on, and do not pack the rest of the subscription. Add selectedResources parser + workbench path if missing. Other nine modes must keep whole-canvas packing — add a test that neighborhood depth 2 is not the Full subscription node count.

This is NOT singleton collapse. NOT nested-frame invention of VNets outside the neighborhood.

Read first:
- .cursor/prompts/inventory-diagram-excellence-00-index.md
- .cursor/prompts/inventory-diagram-excellence-12-hop-focus-modes.md
- ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~Neighborhood|FullyQualifiedName~SelectedResources|FullyQualifiedName~ResourceGroup'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~MermaidModeParser'
```

---

# IDX-13 — Cross-mode forest / Mermaid / PNG ratchet

**Depends on:** IDX-01–12 · **Branch:** `cursor/inventory-diagram-excellence-ratchet-idx1`

**Paste file:** [`.cursor/prompts/inventory-diagram-excellence-13-cross-mode-ratchet.md`](../../.cursor/prompts/inventory-diagram-excellence-13-cross-mode-ratchet.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: tests fail if any DiagramMode regresses to (1) PE cards without IncludePrivateEndpointNodes, (2) all-to-all same-RG cliques when cited hops exist, (3) generic connects for PEERS_WITH / CONTAINS, (4) Network forest without nested VNet frames when subnet nodes exist, (5) subscription outer on ResourceGroup mode, (6) DataFlow stage subgraphs replaced by RG-first packing, (7) PNG without the nested/subscription clusters the forest shows. Do not implement new visuals.

This is NOT IDX-HOLD.

Read first:
- .cursor/prompts/inventory-diagram-excellence-00-index.md
- .cursor/prompts/inventory-diagram-excellence-13-cross-mode-ratchet.md

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests: as named in the paste file (dotnet filter covering all twelve DiagramMode values + focused Vitest).
```

---

# IDX-HOLD — No complete-graph, no default NIC/PE cards, no Microsoft icons, no Full-subscription RBAC

**This is not implementation.** Paste [`.cursor/prompts/inventory-diagram-excellence-14-hold.md`](../../.cursor/prompts/inventory-diagram-excellence-14-hold.md) only if a session starts a complete graph, shows NIC/PE cards by default, ships Microsoft Azure product icons, dumps RBAC onto Full subscription, calls Azure at compile time, re-runs AX-DE/IDA/IDF as greenfield, or nests frames from an IDA/IDF chat.

## Follow-on (not this wave)

Microsoft pictogram licensing remains an owner decision (still **IDA-HOLD** for icons). Effective NSG/routes stay **IE-RF-10**. Observed traffic stays **SN-RT / SN-PE**, not architecture arrows.
