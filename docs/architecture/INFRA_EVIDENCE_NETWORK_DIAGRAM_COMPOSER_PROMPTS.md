> **Scope:** Copy-paste Composer/Cloud Agent prompts that make **Inventory diagrams → Network mode** render the same Azure network resources the inventory table already lists. Internal engineering only.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
>
> **Do not** re-implement **IE-HOTFIX** (Mermaid HTTP 500 / DefenderSummaries). **Do not** re-open **IE-16/IE-17** as greenfield. Those landed; this set closes the Network-mode empty-canvas hole.

# IE-ND-01–IE-ND-05 — Network diagram empty despite inventory

**Observed:** Resource explorer / inventory lists many `Microsoft.Network/*` rows. Inventory diagrams (`/governance/infrastructure/diagrams`) **Network** mode does not render a useful graph (blank canvas, `0` nodes, or a false “graph too large” banner).

**Product framing (locked):** this is the **inventory Mermaid** workbench, not the Architecture-tab brief diagram (`generateArchitectureDiagram` / source-text readiness). Do not “fix” Network mode by parsing the architecture brief.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| ARM type `Microsoft.Network/virtualNetworks` classified as **compute** | **IE-ND-01** | Network mode keeps filtering VNets/subnets/PIPs out |
| Snapshot mermaid never asserted Network has nodes | **IE-ND-02** | Classifier can drift again with no failing test |
| Sparse RG swimlanes not flattened in Network mode | **IE-ND-03** | Readable node set still looks like empty boxes |
| Subgraph planner matches `/subnets/` on type | **IE-ND-04** | VNet/subnet nesting never fires |
| Empty `flowchart TD` + mermaid.js throw shown as “too large” | **IE-ND-05** | Operators cannot tell empty vs oversized |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IE-ND-01** Canonical category | **First** | IE-16, IE-UX-02 already on trunk |
| **IE-ND-02** Snapshot Network mermaid contract | After 01 | Shared resolver must stamp `network` |
| **IE-ND-03** Sparse flatten for Network | After 01; can parallel 02 | Category must include VNets first or the fixture is fake |
| **IE-ND-04** Subgraph ARM-type matching | After 01; can parallel 02/03 | Nodes must exist before nesting matters |
| **IE-ND-05** Honest empty/fail UX | After 02; can start after 01 | Empty Succeeded path still lies without 01/02 |

**Run one prompt per chat.** Feature branch per prompt (`cursor/<short-name>-9cc3` locally, or the Cloud Agent `cursor/<short-name>-<suffix>` template). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No second collector. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Reuse: **one** category helper. Do not leave three `Contains("/network")` copies. Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Tests must derive category from **ARM type strings**, not by pre-stamping `GraphTopologyCategories.Network` on VNet fixtures (that is how this bug shipped).
- Mermaid stays dynamically imported on UI hot paths (`mermaid-import-policy`).
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Canonical ARM facts the classifier must honor

`Contains("/network")` does **not** match `Microsoft.Network/virtualNetworks` (slash is after `Network`, not before it).

Reuse the provider check already used by audit evidence:

```csharp
resource.ResourceType.Contains("Microsoft.Network/", StringComparison.OrdinalIgnoreCase)
```

(`NetworkAuditEvidenceSelector`).

| ARM type | Inventory | Today’s Network-mode category | Required |
|----------|-----------|------------------------------|----------|
| `Microsoft.Network/virtualNetworks` | listed | compute (wrong) | **network** |
| `Microsoft.Network/virtualNetworks/subnets` | listed | compute (wrong) | **network** |
| `Microsoft.Network/publicIPAddresses` | listed | compute (wrong) | **network** |
| `Microsoft.Network/loadBalancers` | listed | compute (wrong) | **network** |
| `Microsoft.Network/privateEndpoints` | listed | compute (wrong) | **network** |
| `Microsoft.Network/applicationGateways` | listed | compute (wrong) | **network** |
| `Microsoft.Network/azureFirewalls` | listed | compute (wrong) | **network** |
| `Microsoft.Network/networkInterfaces` | listed | network (accidental `/network` segment) | **network** |
| `Microsoft.Network/networkSecurityGroups` | listed | network | **network** |
| `Microsoft.Compute/virtualMachines` | listed | compute | compute |
| `Microsoft.Storage/storageAccounts` | listed | storage | storage |

Once `AzureInventorySnapshotGraphResolver` stamps `Category`, `DiagramAstGraphNodeClassifier.ResolveCategory` trusts it and never re-reads `arm.type`. Fix the stamp **and** the fallback.

---

# IE-ND-01 — Canonical Azure network topology category

**Depends on:** IE-16, IE-UX-02 on trunk · **Branch:** `cursor/network-diagram-category-classifier-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Azure inventory topology category must classify Microsoft.Network/* resources as GraphTopologyCategories.Network so Inventory diagrams Network mode includes VNets, subnets, public IPs, load balancers, private endpoints, and other Network-provider types — not only types whose ARM segment happens to start with "network" (NICs, NSGs).

This is NOT a re-do of IE-16 (DiagramAst modes) or IE-HOTFIX (HTTP 500). Do not scan .tf files. Do not add a second Azure collector. Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92. Do not hide desktop review workspace tabs.

Read first:
- docs/architecture/INFRA_EVIDENCE_NETWORK_DIAGRAM_COMPOSER_PROMPTS.md (diagnosis table)
- ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotGraphResolver.cs (ResolveCategory — Contains("/network") is the production stamp)
- ArchLucid.ArtifactSynthesis/Compilers/DiagramAstGraphNodeClassifier.cs (trusts node.Category when set; ARM fallback has the same substring bug)
- ArchLucid.KnowledgeGraph/Inventory/ArchitectureInventoryObservedFactGraphBuilder.cs (third copy)
- ArchLucid.Application/InfraEvidence/AuditEvidence/NetworkAuditEvidenceSelector.cs (correct Microsoft.Network/ provider check — reuse this idea)
- ArchLucid.KnowledgeGraph/WellKnownGraph.cs (GraphTopologyCategories.Network = "network")
- ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs (DiagramMode.Network → FilterByCategories ordinal)

Working-tree: before editing a tracked file run
pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'
Exit 2 → skip that path and report.

Work:
1. Add one canonical helper in ArchLucid.KnowledgeGraph (Application + ArtifactSynthesis already reference it). Own file. Example name AzureInventoryTopologyCategory.Resolve(string? resourceType) → GraphTopologyCategories value.
   - Network when resourceType contains "Microsoft.Network/" (OrdinalIgnoreCase), including nested types such as virtualNetworks/subnets.
   - Keep existing storage/compute/data/identity heuristics for non-network providers.
   - Blank/null resourceType → existing compute default.
   - Do not use Contains("/network") as the primary network rule. That is the bug.
   - Do not invent a new AWS/GCP taxonomy in this prompt (plane is Azure inventory). If an existing test already uses non-Azure types, keep those cases from flipping into network.
2. Replace the three duplicated ResolveCategory bodies so they call the helper. DiagramAstGraphNodeClassifier.ResolveCategory: if node.Category is already a known GraphTopologyCategories value, still allow ARM-type override when arm.type is Microsoft.Network/ and the stamped category is compute — OR stop stamping the wrong category in the resolver so the fallback is only for empty Category. Prefer: stamp correctly in the resolver; classifier fallback uses the same helper on ReadArmType when Category is blank OR when Category is the compute default but ARM type is Microsoft.Network/. Document the override in a short comment (two-year developer will not see why compute is replaced).
3. FilterByCategories: compare categories with StringComparer.OrdinalIgnoreCase so "Network" vs "network" cannot drop nodes. Do not silently treat unknown categories as network.
4. Tests (must fail on current master, pass after):
   - Theory/table: ARM types in the diagnosis table → expected category WITHOUT setting GraphNode.Category (empty Category, arm.type only).
   - AzureInventorySnapshotGraphResolver: BuildGraph / TryResolveGraphAsync on a snapshot whose only resources are Microsoft.Network/virtualNetworks and Microsoft.Network/publicIPAddresses → every node.Category == GraphTopologyCategories.Network.
   - Negative: Microsoft.Compute/virtualMachines stays compute; Microsoft.Storage/storageAccounts stays storage.
   - Do not pre-stamp Category = Network on VNet nodes in these new tests.

Do not:
- Change mermaid-import-policy or statically import mermaid.
- Mark huge graphs Succeeded (IE-17 thresholds stay).
- Flatten subgraphs (IE-ND-03) or change empty-canvas UX (IE-ND-05) in this prompt unless a one-line call-site is required to compile.
- git add -A.

Tests:
dotnet test ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj --filter 'FullyQualifiedName~AzureInventoryTopologyCategory'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstGraphNodeClassifier|FullyQualifiedName~DiagramAstFromGraphCompiler'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidServiceTests|FullyQualifiedName~AzureInventorySnapshotGraphResolver'

Compile (one scoped check, heartbeat every 8s if >15s):
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
If KnowledgeGraph.Tests or ArtifactSynthesis.Tests needed a new project compile, one additional scoped check on that csproj only.

Done when:
- Microsoft.Network/virtualNetworks and publicIPAddresses stamp category network without the test setting Category.
- The three former Contains("/network") copies are gone.
- Network mode compile of a VNet-only graph (category derived, not stamped) includes those nodes.
```

---

# IE-ND-02 — Network-mode mermaid contract from inventory snapshots

**Depends on:** IE-ND-01 · **Branch:** `cursor/network-diagram-snapshot-mermaid-contract-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: GET mermaid?mode=network and mermaid/preview Network row must include inventory VNets (and other Microsoft.Network/ resources) with non-empty Mermaid node lines. Today InfraEvidenceSnapshotMermaidServiceTests build VNet-only snapshots but only assert executive/full — Network can be empty and still “pass.”

Do not re-do IE-ND-01 unless the helper is missing on this branch (rebase/merge it). Do not implement IE-ND-03 flatten or IE-ND-05 UX here.

Read first:
- docs/architecture/INFRA_EVIDENCE_NETWORK_DIAGRAM_COMPOSER_PROMPTS.md
- ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs (MapModePreview omits mermaid unless Succeeded)
- ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceSnapshotMermaidServiceTests.cs (BuildSnapshot uses Microsoft.Network/virtualNetworks)
- ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs
- archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts (mode value "network")

Working-tree check before tracked edits.

Work:
1. Application.Tests: snapshot of ≥3 Microsoft.Network/virtualNetworks (use existing BuildSnapshot or a sibling). GET mermaid mode=network → Succeeded or Partitioned, NodeCount == resource count (or ≥ VNet count), Mermaid contains flowchart TD and each resource label (last ARM segment). Assert category is not required in the test data — resource type is enough.
2. Preview: Modes row Mode=="network" has NodeCount > 0 on that VNet snapshot. Status is not Failed. If Partitioned, NodeCount still reflects the compiled AST (do not hide a zero-node Network behind a green executive preview).
3. Mixed snapshot: VNets + Storage accounts → Network mermaid includes VNets and excludes storage account labels; Data/full still include storage.
4. Keep existing #2931 / IE-HOTFIX tests (null ARM, duplicate CloudResourceId, preview continues when Network compile throws).

Do not:
- Statically import mermaid in UI.
- Lower IE-17 thresholds to force Succeeded on 8k-node graphs.
- git add -A.

Tests:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidServiceTests'

Compile:
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'

Done when:
- A VNet-only listable snapshot yields Network mermaid with those VNet labels.
- Preview Network metrics cannot be 0 nodes while the same snapshot lists Microsoft.Network/virtualNetworks in the graph resolver.
```

---

# IE-ND-03 — Flatten sparse Network-mode swimlanes

**Depends on:** IE-ND-01 · **Branch:** `cursor/network-diagram-sparse-flatten-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Network mode must flatten sparse resource-group swimlanes the same way Executive and Data already do. DiagramAstExecutiveLayoutSimplifier comment already states Mermaid emits a canvas of mostly empty boxes when many RGs each hold one node — ModeFlattensSparseSubgraphs currently returns only Executive | Data.

Read first:
- ArchLucid.ArtifactSynthesis/Compilers/DiagramAstExecutiveLayoutSimplifier.cs
- ArchLucid.ArtifactSynthesis.Tests/DiagramAstFromGraphCompilerTests.cs (Compile_data_mode_flattens_sparse_swimlanes_when_many_resource_groups_each_hold_one_node; Compile_executive_mode_flattens_sparse_swimlanes_when_many_resource_groups_each_hold_one_node)
- ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramReadabilityThresholds.cs (MaxSubgraphs = 64 — many RG boxes trip Partitioned / client “too large”)

Working-tree check before tracked edits.

Work:
1. Include DiagramMode.Network in ModeFlattensSparseSubgraphs (same SparseSubgraphFlattenThreshold = 8). Rename the helper/file only if a two-year developer would think “Executive” means Network is excluded — a comment update is enough if the type name stays.
2. Tests modeled on the Data/Executive sparse fixtures:
   - 12 resource groups × one Microsoft.Network/virtualNetworks each, category DERIVED from arm.type (empty Category) after IE-ND-01, or stamp only if IE-ND-01 is not merged yet and document the follow-up.
   - Network compile: node count 12, subgraphs empty, mermaid has no subgraph keyword, contains vnet labels, flowchart TD.
   - Few swimlanes (3 RGs) still keep RG frames (parity with Compile_data_mode_keeps_resource_group_frames_when_few_swimlanes).
3. FullSubscription must still NOT flatten (existing test).
4. Optional cheap ratchet: Security mode if it uses the same RG swimlanes and fails the same empty-box shape — only if a fixture proves it. Do not expand to Identity/Data again.

Do not:
- Change category classification except to consume IE-ND-01.
- Change UI too-large copy (IE-ND-05).
- git add -A.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests'

Compile:
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'

Done when:
- Network mode with many one-node RGs is a flat readable flowchart, not 12 empty RG boxes.
- MaxSubgraphs is not the reason a 12-VNet Network diagram is Partitioned.
```

---

# IE-ND-04 — VNet/subnet subgraph planner ARM matching

**Depends on:** IE-ND-01 · **Branch:** `cursor/network-diagram-subnet-subgraphs-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: DiagramSubgraphPlanner must nest subnet nodes under VNet subgraphs using real ARM types/ids. Today it looks for armType.Contains("/subnets/") and "/virtualnetworks/" — Microsoft.Network/virtualNetworks/subnets has no trailing slash after subnets, so the VNet/subnet nesting branch never runs.

Read first:
- ArchLucid.ArtifactSynthesis/Compilers/DiagramSubgraphPlanner.cs (PlanSubgraphs + ResolveSubgraphId)
- ArchLucid.ArtifactSynthesis.Tests/DiagramAstFromGraphCompilerTests.cs (BuildSampleGraph already uses virtualNetworks + virtualNetworks/subnets with parentArmId)
- ArchLucid.ArtifactSynthesis/Compilers/DiagramAstSubgraphPruner.cs

Working-tree check before tracked edits.

Work:
1. Match subnet types with a helper (own file or private methods on the planner): ARM type equals/ends with "/virtualNetworks/subnets" OR contains "/subnets" as a type segment; ARM id contains "/subnets/" is also valid because ids do have the trailing slash. Do not require "/subnets/" on the TYPE.
2. VNet types: Microsoft.Network/virtualNetworks (no trailing slash). Do not require "/virtualnetworks/" on the type for the VNet node’s RG assignment (that branch is currently dead for the VNet resource itself).
3. Tests:
   - Compile FullSubscription or Network on core-vnet + app-subnet (real ARM types, parentArmId set) → mermaid contains a VNet subgraph label and a subnet subgraph or nested membership; subnet node present.
   - Type Microsoft.Network/virtualNetworks/subnets without pre-crafting "/subnets/" in the type string.
   - Pruner still drops unused empty VNet shells (existing executive prune test must stay green).
4. Keep deterministic ordering by ARM id.

Do not:
- Invent edges that are not in the snapshot (layout edges from EnsureLayoutEdgesWhenEmpty are already allowed when nodes > 1 and edges empty).
- git add -A.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests|FullyQualifiedName~DiagramSubgraphPlanner'

Compile:
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'

Done when:
- A VNet + subnet pair using Microsoft.Network/virtualNetworks and Microsoft.Network/virtualNetworks/subnets nests in Mermaid instead of ignoring the subnet branch.
```

---

# IE-ND-05 — Honest empty / failed Network diagram UX

**Depends on:** IE-ND-01, IE-ND-02 · **Branch:** `cursor/network-diagram-honest-empty-ux-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Inventory diagrams must not report a mermaid.js parse/render failure as “Graph too large for browser rendering,” and must not treat an empty flowchart TD as a successful rendered Network diagram.

Today:
- MermaidDiagramRenderer always emits "flowchart TD" even for 0 nodes (structurally valid).
- InfraEvidenceSnapshotMermaidService maps that as Succeeded with PrimaryMermaid = header only.
- ArchitectureDiagramViewer mermaid.render() throws on empty flowcharts; onRenderFailure sets browserRenderBlocked, which DiagramsWorkbenchClient shows as INFRA_EVIDENCE_MERMAID_TOO_LARGE_FOR_BROWSER_MESSAGE.
- resolveInfraEvidenceMermaidRenderStatusPresentation already has “Render succeeded with no diagram content” but mermaidEmpty is false because the header is non-empty.

Read first:
- archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx (handleRenderFailure, tooLargeForBrowser, mermaidEmpty)
- archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx
- archlucid-ui/src/lib/infra-evidence/infra-evidence-mermaid-render-status-presentation.ts
- archlucid-ui/src/lib/infra-evidence/infra-evidence-mermaid-client-guard.ts
- ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramStructuralValidator.cs
- ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramRenderPipeline.cs

Working-tree check before tracked edits.

Work — API/metrics (keep HTTP 200 for listable snapshots):
1. Distinguish “compiled graph has 0 topology nodes” from Succeeded-with-picture. Prefer Status=Succeeded with NodeCount=0 and Mermaid null OR a dedicated empty payload the UI already understands — not a mermaid.js-invalid header-only flowchart. If you keep header-only text, the UI must not call mermaid.render on it.
2. Do not mark 8k-node graphs Succeeded (thresholds unchanged).

Work — UI:
1. tooLargeForBrowser only from exceedsInfraEvidenceMermaidClientGuard(metrics) (and Partitioned fallback cards). mermaid.render() failure must show architecture-diagram-render-failure (existing retry), NOT the too-large amber banner.
2. When NodeCount===0 (or mermaid is null/header-only) after a successful fetch: StatusTag/empty state that the selected mode has no diagram nodes — point operators at Resource explorer / another mode. Reuse resolveInfraEvidenceMermaidRenderStatusPresentation; treat header-only as mermaidEmpty.
3. Vitest: DiagramsWorkbenchClient — render() reject does not show INFRA_EVIDENCE_MERMAID_TOO_LARGE_FOR_BROWSER_MESSAGE; 0-node Succeeded shows no-diagram-content (or equivalent testid) and does not mount a doomed mermaid.render.
4. Keep PNG download available when server still has a renderable fallback; disable when there is truly no graph.

Do not:
- Statically import mermaid.
- Collapse desktop review tabs.
- git add -A.

Tests:
- archlucid-ui Vitest: DiagramsWorkbenchClient.test.tsx + ArchitectureDiagramViewer.test.tsx + infra-evidence-mermaid-render-status-presentation / workbench helpers.
- Optional Application.Tests: 0-node Network (storage-only snapshot) does not return mermaid that is only "flowchart TD" if you changed the API.

Compile:
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
From archlucid-ui: npm test -- (scoped files you touched; do not npm ci unless required)

Done when:
- A Network-mode empty compile cannot look like a too-large graph.
- mermaid.js throw is retryable render failure copy, not IE-17 oversized copy.
- After IE-ND-01/02, a VNet-rich snapshot no longer hits this empty path; this prompt covers leftover empty modes and render exceptions.
```
