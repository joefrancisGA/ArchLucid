> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that make **Inventory diagrams → Data mode** compile and paint when the snapshot has storage/SQL/Cosmos data-plane resources. Internal engineering only.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).
> **Paste files:** [`.cursor/prompts/inventory-diagram-data-00-index.md`](../../.cursor/prompts/inventory-diagram-data-00-index.md) (one numbered file per session).
>
> **Do not** re-implement **IE-ND-01** (network category), **IE-ND-03** / **IE-ID-01** (sparse flatten already includes Data), **IE-HOTFIX**, **IDV**, **IDC**, or **IDL**. This set is the Data-mode leftover: category slash-bug, missing snapshot contract, owner **Failed** with mermaid withheld.

# IE-DD-01–IE-DD-04 — Data diagram render failed

**Observed:** Inventory diagrams (`/governance/infrastructure/diagrams`) **Data** mode. Same 889-resource snapshot as Identity/Executive (`bebca1ae-…`, captured 2026-09-10). Red **Render failed · 38 nodes · 70 edges · 38 subgraphs · Data**. Yellow **Diagram render failed for the selected mode.** Export PNG / Export Mermaid disabled. No canvas, no Nodes/Edges outline, no mermaid.js error, no “too large” / Partitioned cards.

**Product framing (locked):** inventory Mermaid workbench, not the Architecture-tab brief diagram. Do not “fix” Data mode by parsing the architecture brief.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| ARM types `Microsoft.Sql/servers`, `Microsoft.DocumentDB/databaseAccounts`, `Microsoft.DBfor*` classified **compute** | **IE-DD-01** | Data mode is storage-only; SQL/Cosmos accounts never appear |
| Snapshot mermaid never asserted Data has nodes / is not Failed | **IE-DD-02** | Classifier or pipeline can drift with no failing test |
| Owner Failed (38/70/38) has no ratchet; repairer drops `IsLayoutOnly`; validator/errors not round-tripped | **IE-DD-03** | Nested leftover or an unrecognized emitted line still returns Failed and withholds mermaid |
| Failed UI shows no `ValidationErrors` | **IE-DD-04** | Operator cannot tell empty vs invalid mermaid vs thrown compile |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IE-DD-01** Canonical data/storage category | **First** | IE-16, IE-ND-01 already on trunk (reuse the same helper) |
| **IE-DD-02** Snapshot Data mermaid contract | After 01 | SQL/Cosmos labels need the category stamp |
| **IE-DD-03** Owner Failed ratchet (flatten + emitter/validator) | After 01; can parallel 02 | Category must include intended ARM types or the 38-node fixture is fake |
| **IE-DD-04** Failed honesty (errors on the wire + UI) | After 03; can start after 01 | Happy path should be Succeeded; leftover Failed still needs a reason |

**Run one prompt per chat.** Feature branch per prompt (`cursor/data-diagram-<short-name>-ed1e`). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No second collector. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Reuse **`AzureInventoryTopologyCategory`**. Do not leave a fourth `Contains("/sql")` copy. Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Tests must derive category from **ARM type strings**, not by pre-stamping `GraphTopologyCategories.Data` / `Storage` on fixtures (that is how the Network slash-bug shipped).
- Mermaid stays dynamically imported on UI hot paths (`mermaid-import-policy`).
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- Server **Failed** is IE-17 **structural validation** (or a caught compile mapped to Failed **without** metrics). The owner strip shows **38 / 70 / 38**, so this is the pipeline Failed result with metrics, not `CreateFailedRenderResponse` (that sets `Metrics = null`).
- Failed **withholds** `mermaid` (`includeMermaid` is Succeeded/Partitioned only). Outline parsers never run. That is why the screenshot has no Nodes table — unlike Identity, which was **Succeeded** with outline and a blank canvas.
- Counts are under IE-17 thresholds (`MaxNodes 400`, `MaxEdges 800`, `MaxSubgraphs 64`). This is **not** Partitioned / “too large”.
- `DiagramMode.Data` already filters `GraphTopologyCategories.Data` **and** `Storage`. Sparse flatten **already includes Data** (`ModeFlattensSparseSubgraphs`, threshold 8). A 12-RG storage fixture on this checkout compiles to **0 subgraphs** and pipeline **Succeeded**. Do **not** re-do IE-ND-03 / IE-ID-01 as greenfield.
- **38 subgraphs ≈ 1 subscription + 37 RGs** (or 38 RG clusters). Flatten should have cleared them. Owner metrics still show 38 — treat that as a **ratchet** (must not regress) plus a live/unflattened leftover, not as permission to rewrite the simplifier from scratch.
- Unflattened proxy on this checkout (FullSubscription of 37 storage nodes + 70 `CONNECTS_TO` edges) is **37 / 70 / 38 and Succeeded**. Nested RG mermaid is **not** automatically invalid. Owner Failed means a **live-specific emitted line** our validator rejected, or a repairer/validator mismatch (`~~~`) that the 70-edge synthetic graph did not hit.
- `Contains("/sql")` does **not** match `Microsoft.Sql/servers` (slash is after `Sql`, not before it). Same class as IE-ND-01 `Contains("/network")` vs `Microsoft.Network/`. `/documentdb` and `/dbfor` miss `Microsoft.DocumentDB/databaseAccounts` and `Microsoft.DBforPostgreSQL/flexibleServers` the same way. `/storage` matches because `/storageAccounts` contains `/storage`.
- Accidental false positive: `Microsoft.DocumentDB/databaseAccounts/sqlDatabases` is **data** today because the type contains `/sqlDatabases`. Do not keep `/sql` as the primary SQL rule.
- `DataAuditEvidenceSelector` already includes Storage / Sql / DocumentDB via `Contains("Sql")` / `Contains("DocumentDB")`. Diagram category must not be weaker than that selector for those three families.
- `MermaidDiagramDeterministicRepairer` copies edges **without** `IsLayoutOnly`. Layout `~~~` becomes visible `-->` after repair. IDL-01 asked the validator to accept `~~~`; there is still no validator test. Data with 70 **real** edges does not add layout links (`EnsureLayoutEdgesWhenEmpty` returns when visible count > 0), so this is not the owner’s 70-edge count — still fix it in IE-DD-03 so empty-relationship Data cannot Failed.
- `ValidationErrors` exist on `MermaidDiagramRenderResult` and are **not** on `InfraEvidenceMermaidRenderResponse`. The UI cannot show why.
- Footer “Build identity unavailable” is the deployment SHA. Unrelated.
- Do not expand Data mode to Key Vault, Redis, Synapse, or Event Hub in this set unless a fixture in IE-DD-01 proves the owner Data copy already lists them. Default is Storage + Sql + DocumentDB + DBfor*.

### Canonical ARM facts the classifier must honor

Reuse the **provider prefix** style already used for network (`Microsoft.Network/`), not a leading-slash token that sits in the middle of the type name.

| ARM type | Inventory / audit selector | Today’s Data-mode category | Required |
|----------|----------------------------|----------------------------|----------|
| `Microsoft.Storage/storageAccounts` | listed | storage | **storage** |
| `Microsoft.Storage/storageAccounts/blobServices` | nested row | storage | **storage** |
| `Microsoft.Storage/storageAccounts/blobServices/containers` | nested row | storage | **storage** |
| `Microsoft.Sql/servers` | audit selector | compute (wrong) | **data** |
| `Microsoft.Sql/servers/databases` | listed | compute (wrong) | **data** |
| `Microsoft.Sql/managedInstances` | listed | compute (wrong) | **data** |
| `Microsoft.DocumentDB/databaseAccounts` | audit selector | compute (wrong) | **data** |
| `Microsoft.DocumentDB/databaseAccounts/sqlDatabases` | nested | data (accidental `/sqlDatabases`) | **data** |
| `Microsoft.DBforPostgreSQL/flexibleServers` | intended by `/dbfor` | compute (wrong) | **data** |
| `Microsoft.DBforMySQL/flexibleServers` | intended by `/dbfor` | compute (wrong) | **data** |
| `Microsoft.Compute/virtualMachines` | listed | compute | compute |
| `Microsoft.Network/virtualNetworks` | listed | network | network |
| `Microsoft.ManagedIdentity/userAssignedIdentities` | listed | identity | identity |

Once `AzureInventorySnapshotGraphResolver` stamps `Category`, `DiagramAstGraphNodeClassifier.ResolveCategory` trusts it (network is the only ARM override). Fix the stamp **and** the fallback.

---

# IE-DD-01 — Canonical Azure data/storage topology category

**Depends on:** IE-16, IE-ND-01 on trunk · **Branch:** `cursor/data-diagram-category-classifier-ed1e`

**Paste file:** [`.cursor/prompts/inventory-diagram-data-01-canonical-category.md`](../../.cursor/prompts/inventory-diagram-data-01-canonical-category.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Azure inventory topology category must classify Microsoft.Sql/*, Microsoft.DocumentDB/*, and Microsoft.DBfor* as GraphTopologyCategories.Data (and keep Microsoft.Storage/* as Storage) so Inventory diagrams Data mode includes SQL servers/databases, Cosmos accounts, and flexible PostgreSQL/MySQL — not only types whose ARM segment happens to contain "/storage".

This is NOT a re-do of IE-ND-01 (network provider prefix) or IE-ID/IE-HOTFIX. Do not scan .tf files. Do not add a second Azure collector. Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92. Do not hide desktop review workspace tabs.

Read first:
- docs/architecture/INFRA_EVIDENCE_DATA_DIAGRAM_COMPOSER_PROMPTS.md (diagnosis table)
- .cursor/prompts/inventory-diagram-data-00-index.md
- .cursor/prompts/inventory-diagram-data-01-canonical-category.md
- ArchLucid.KnowledgeGraph/Inventory/AzureInventoryTopologyCategory.cs (Contains("/sql") / "/documentdb" / "/dbfor" is the production fallback)
- ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotGraphResolver.cs (stamps Category from the helper)
- ArchLucid.ArtifactSynthesis/Compilers/DiagramAstGraphNodeClassifier.cs
- ArchLucid.Application/InfraEvidence/AuditEvidence/DataAuditEvidenceSelector.cs (Contains("Sql") / Contains("DocumentDB") — diagrams must not be weaker)
- ArchLucid.KnowledgeGraph.Tests/Inventory/AzureInventoryTopologyCategoryTests.cs
- ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs (DiagramMode.Data → FilterByCategories Data + Storage)

Working-tree: before editing a tracked file run
pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'
Exit 2 → skip that path and report.

Work:
1. Extend AzureInventoryTopologyCategory.Resolve (own file already exists — do not add a second helper):
   - Storage when resourceType contains "Microsoft.Storage/" (OrdinalIgnoreCase), including nested blobServices/containers.
   - Data when resourceType contains "Microsoft.Sql/" or "Microsoft.DocumentDB/" or "Microsoft.DBfor" (covers DBforPostgreSQL / DBforMySQL / DBforMariaDB).
   - Keep Microsoft.Network/ as network (IE-ND-01). Do not use Contains("/sql") as the primary SQL rule — it misses Microsoft.Sql/servers and accidentally hits .../sqlDatabases.
   - Blank/null resourceType → existing compute default.
   - Do not add Key Vault, Redis, Synapse, or Event Hub to Data in this prompt.
2. Resolver stamp + classifier fallback both call the helper. If Category is already a known GraphTopologyCategories value, still allow ARM-type override when ARM type is Microsoft.Sql/ / DocumentDB / DBfor / Storage but the stamped category is compute — same idea as the network override. Short comment for a two-year developer.
3. Tests (must fail on current master, pass after):
   - Theory/table: ARM types in the diagnosis table → expected category WITHOUT setting GraphNode.Category.
   - Negative: virtualMachines stay compute; virtualNetworks stay network; userAssignedIdentities stay identity.
   - DiagramAstFromGraphCompiler Data mode on a SQL-server-only graph (empty Category, arm.type only) includes those nodes. Storage-only still included. VM-only Data compile is empty.
4. Do not pre-stamp Category = Data on SQL nodes in these new tests.

Do not:
- Change mermaid-import-policy or statically import mermaid.
- Mark huge graphs Succeeded (IE-17 thresholds stay).
- Flatten subgraphs or change Failed UX in this prompt unless a one-line call-site is required to compile.
- git add -A.

Tests:
dotnet test ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj --filter 'FullyQualifiedName~AzureInventoryTopologyCategory'
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests'

Compile (heartbeat every 8s if >15s):
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj'

Done when:
- Microsoft.Sql/servers and Microsoft.DocumentDB/databaseAccounts stamp category data without the test setting Category.
- Microsoft.Storage/storageAccounts stays storage.
- Data mode compile of a SQL-only graph (category derived) includes those nodes.
```

---

# IE-DD-02 — Data-mode mermaid contract from inventory snapshots

**Depends on:** IE-DD-01 · **Branch:** `cursor/data-diagram-snapshot-mermaid-contract-ed1e`

**Paste file:** [`.cursor/prompts/inventory-diagram-data-02-snapshot-mermaid-contract.md`](../../.cursor/prompts/inventory-diagram-data-02-snapshot-mermaid-contract.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: GET mermaid?mode=data and mermaid/preview Data row must include inventory storage accounts and (after IE-DD-01) SQL/Cosmos data-plane resources with non-empty Mermaid node lines. Status must not be Failed for those snapshots. Today InfraEvidenceSnapshotMermaidServiceTests have Network and Identity contracts — Data can be empty or Failed and still “pass.”

Do not re-do IE-DD-01 unless the helper is missing on this branch (rebase/merge it). Do not implement IE-DD-03 validator/repairer or IE-DD-04 UX here.

Read first:
- .cursor/prompts/inventory-diagram-data-02-snapshot-mermaid-contract.md
- ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs
- ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceSnapshotMermaidServiceTests.cs (Network_mode_renders_mermaid_for_virtual_network_snapshot, Identity_mode_* siblings)
- ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceMermaidModeParser.cs

Working-tree check before tracked edits.

Work:
1. Application.Tests: snapshot of ≥3 Microsoft.Storage/storageAccounts AND a sibling with Microsoft.Sql/servers (distinct ResourceGroup per resource on a sparse 12-RG storage fixture). Do not pre-stamp Category.
2. TryGetMermaidAsync mode=data:
   - Succeeded or Partitioned; never Failed on these fixtures.
   - NodeCount equals the data-plane resource count (storage + SQL after IE-DD-01).
   - Mermaid contains flowchart TD and each resource label (last ARM segment).
   - Sparse 12-RG storage: mermaid does not contain subgraph (Data flatten already on trunk).
3. Preview: Modes row Mode=="data" has NodeCount > 0. Status is not Failed.
4. Mixed: storage + SQL + VNets + user-assigned identities → Data includes storage/SQL labels, excludes VNet and MI labels; Network/Identity still exclude storage.
5. Keep existing IE-HOTFIX / Network / Identity tests.

Do not:
- Statically import mermaid.
- Lower IE-17 thresholds.
- git add -A.

Tests:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidServiceTests'

Compile:
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'

Done when:
- A storage+SQL snapshot yields Data mermaid with those labels and matching NodeCount.
- Sparse many-RG Data mermaid is flat (no subgraph).
- Data preview is not Failed.
```

---

# IE-DD-03 — Owner Failed ratchet (emitter, validator, repairer)

**Depends on:** IE-DD-01 · **Branch:** `cursor/data-diagram-failed-ratchet-ed1e`

**Paste file:** [`.cursor/prompts/inventory-diagram-data-03-owner-failed-ratchet.md`](../../.cursor/prompts/inventory-diagram-data-03-owner-failed-ratchet.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Inventory Data mode for an owner-shaped graph (≈38 data-plane nodes, ~70 CONTAINS/CONNECTS_TO edges, many one-node RGs) must return Succeeded (or Partitioned only for true IE-17 size) with non-empty mermaid. Pipeline Failed withholds mermaid and is what the owner saw.

Do not re-do IE-DD-01 unless SQL/storage category is missing. Do not implement IE-DD-04 UI. Do not re-implement sparse flatten from scratch — Data is already in ModeFlattensSparseSubgraphs. Assert it still fires for ≥8 RG swimlanes including a 37-RG storage fixture.

Owner screenshot (do not re-diagnose the chip): Render failed, 38 nodes · 70 edges · 38 subgraphs, Diagram render failed for the selected mode, exports disabled, no outline.

Locked from the prompt-set diagnosis (2026-09-12, this checkout): a synthetic 37-RG storage graph with 70 CONNECTS_TO edges already flattens to 0 subgraphs and Succeeded. An unflattened FullSubscription proxy of the same graph is 37/70/38 and also Succeeded. Nested RG mermaid is not automatically invalid. Owner Failed means a live-specific emitted line or a ~~~ / IsLayoutOnly repairer mismatch. Your job is the ratchet plus closing that mismatch.

Read first:
- .cursor/prompts/inventory-diagram-data-03-owner-failed-ratchet.md
- ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramStructuralValidator.cs (unrecognized line unless flowchart / subgraph / end / --> / [] / %%)
- ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramDeterministicRepairer.cs (new DiagramEdge does not copy IsLayoutOnly)
- ArchLucid.ArtifactSynthesis/Renderers/MermaidDiagramRenderer.cs (~~~ for layout-only; %% al-type comments; -->|"label"|)
- ArchLucid.ArtifactSynthesis/Compilers/DiagramAstExecutiveLayoutSimplifier.cs (Region exemption skips flatten for ANY mode if a subgraph label starts with "Region ")
- ArchLucid.Application/InfraEvidence/AzureInventorySecurityEdgeMaterializer.cs (AddObservedParentChild uses GraphEdgeTypes.Contains)

Working-tree check before tracked edits.

Work:
1. Flatten ratchet: 37 resource groups × Microsoft.Storage/storageAccounts (empty Category). Data compile: 37 nodes, subgraphs empty, mermaid has no subgraph keyword. Few swimlanes (3 RGs) still keep RG frames. Region exemption must not fire on Data (Data must not call ApplyRegionSubgraphs; do not skip flatten just because a RG name contains the word region).
2. Pipeline ratchet matching owner counts as closely as practical: GUID CloudResourceId node ids, %% al-type/al-rg/al-seed comments, GraphEdgeTypes.Contains parent-child between storage account and nested blobServices/container rows, plus enough extra CONNECTS_TO to approach ~70 visible edges. Assert RenderAsync / TryGetMermaidAsync mode=data is Succeeded, mermaid non-empty, NodeCount matches, status is not Failed. If this already passes on master, keep the test anyway (regression). Then add the case that currently fails:
   - Renderer output with IsLayoutOnly ~~~ must TryValidate true. Repairer must copy IsLayoutOnly so ~~~ is not rewritten to -->. Mixed AST: one labeled CONTAINS edge stays -->, layout links stay ~~~, complexity edgeCount counts only visible edges.
3. If you can construct a mermaid the Data path actually emits that TryValidate currently rejects, fix the validator to accept that emitted syntax (do not loosen it to accept garbage). Print the first unrecognized line in the test failure message.
4. Do not lower MaxSubgraphs to force Partitioned. Do not change flowchart TD to LR.

Do not:
- Change UI Failed copy (IE-DD-04).
- Statically import mermaid.
- git add -A.

Tests:
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompilerTests|FullyQualifiedName~MermaidDiagramRenderPipelineTests|FullyQualifiedName~MermaidDiagramStructuralValidator'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidServiceTests'

Compile:
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'

Done when:
- Owner-shaped Data compile is flat (0 subgraphs) and pipeline Succeeded with mermaid.
- ~~~ inventory mermaid validates; repairer preserves IsLayoutOnly.
- Data cannot return Failed solely because the validator does not understand a line the renderer emits.
```

---

# IE-DD-04 — Honest Data-mode Failed UX

**Depends on:** IE-DD-03 · **Branch:** `cursor/data-diagram-failed-honesty-ed1e`

**Paste file:** [`.cursor/prompts/inventory-diagram-data-04-failed-honesty.md`](../../.cursor/prompts/inventory-diagram-data-04-failed-honesty.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: when Inventory diagrams Data (or any inventory mermaid mode) is Failed, the operator sees why. Today ValidationErrors stay on the server result DTO, the HTTP render response has no errors field, mermaid is withheld, and the workbench shows only "Diagram render failed for the selected mode."

Do not re-do IE-DD-01/02/03 except to consume ValidationErrors if 03 already put them on the result. Do not map Failed to the too-large banner (IE-ND-05). Do not restore min-h-[18rem].

Read first:
- .cursor/prompts/inventory-diagram-data-04-failed-honesty.md
- ArchLucid.Contracts/InfraEvidence/InfraEvidenceMermaidRenderResponse.cs
- ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotMermaidService.cs (MapRenderResponse)
- archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx (Failed StatusTag branch — no outline)
- archlucid-ui/src/lib/infra-evidence/infra-evidence-mermaid-render-status-presentation.ts
- archlucid-ui/packages/api-types and OpenAPI snapshot if you add a wire field (follow OPENAPI_CONTRACT_DRIFT.md)

Working-tree check before tracked edits.

Work:
1. Add validationErrors (string list, may be empty) to the mermaid render response. Map from MermaidDiagramRenderResult.ValidationErrors. Preview may include a short error on Failed rows if the preview DTO already has a place for it; do not bloat preview mermaid.
2. Workbench Failed branch: keep the needs-attention StatusTag. Add a helper line with the first validation error (or "Mermaid text was invalid." if the list is empty). Use OPERATOR_TYPOGRAPHY.helper. Do not toast. Do not use a ghost Button.
3. Do not auto-paint Failed mermaid (shouldPaint stays false when mermaid is withheld). Optional: Export Mermaid remains disabled unless you also return mermaid on Failed — default is keep export disabled and show the error text. Outline stays hidden without mermaid (same as today).
4. Tests: API/application test that a structurally invalid mermaid (inject or use a fixture the validator rejects) returns Failed with a non-empty validationErrors list. Vitest: Failed render result with validationErrors[0] visible via a testid (e.g. infra-diagrams-render-failure-reason). Existing Succeeded/Partitioned/empty-content tests stay green.

Do not:
- Statically import mermaid.
- Collapse desktop review workspace tabs.
- git add -A.

Tests:
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidServiceTests'
cd archlucid-ui && npm test -- src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx src/lib/infra-evidence/infra-evidence-mermaid-render-status-presentation.ts

Compile:
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'

Done when:
- Failed Data mode shows a concrete validation reason, not only the generic StatusTag.
- OpenAPI/client types stay in sync if the wire contract gained validationErrors.
```
