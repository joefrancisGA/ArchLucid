# NR-33 — Decide storage connectivity from stored references

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not query diagnostic logs, Log Analytics, or Storage analytics. Do not read secret values.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-28, NR-29, and NR-31, which are already on master. The owner is looking at storage account `staepcommtfhidevwus001`. Absence of a diagram line is not enough to call it standalone.

## Goal

A storage account is Connected when the snapshot already cites a link to it. A redacted host reference that names its endpoint is a dashed Likely line. An account with neither stays Unconnected, and the outline says no stored storage link was found. It is not described as unused.

## Why

`Microsoft.Storage/storageAccounts` is already on `HostedAzureArmPaasTypeListDescriptors`. Data Factory linked services, private endpoints, resource-scoped role assignments, and Container App redacted env hosts can already name a storage account. The diagram does not treat every storage account that lacks a painted line as a completed negative finding.

App settings for Web Apps, Functions, and slots need `Microsoft.Web/sites/config/list`. That call is more than Reader and returns secret values. NR-31 left it unread. This session does not add it.

Storage diagnostic logs can show real callers, but they are a later collection. This session does not query them.

## Read first

- `ArchLucid.Integrations.AzureExtractor/HostedAzureArmPaasTypeListDescriptors.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfLinkedServiceTargetResolver.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryAppSettingHostCollector.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryContainerAppEnvHostExtractor.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramLikelyRelationshipApplier.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramRoleAccessApplier.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs` (`TryClassifyUnconnected`)
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryDataFlowDiagramExclusions.cs`

## What to build

1. Keep a storage account Connected when any of these already exist and both ends are visible:
   - a stored Data Factory linked service whose target is that account
   - a private endpoint whose target is that account
   - a resource-scoped role assignment whose scope is that account
   - a Logic App or workflow connection that already stores that account
   Do not add a second line when one of those edges is already painted.
2. When a redacted Container App env host row names a blob, dfs, file, queue, or table host of a storage account in the snapshot, and no solid edge already joins that app to that account, draw one dashed line labeled `Likely` from the app to the account. The outline on the app is `No stored link yet; inferred from a redacted host reference.`
3. When a storage account has none of those links, leave it Unconnected. The outline sentence is `No stored storage link yet.` Do not say standalone, unused, or orphaned.
4. A private endpoint or role assignment that is hidden by Show network details still counts as a stored link for this decision. Do not put the private endpoint card back on the Full subscription plate.

Do not call `Microsoft.Web/sites/config/list`. Do not collect connection strings. Do not read Key Vault secret values. Do not infer a consumer from the storage account name or its resource group. Do not query logs.

## Tests

1. A Data Factory linked service to `staepcommtfhidevwus001` produces a solid edge. The account is not Unconnected.
2. A Container App redacted host `staepcommtfhidevwus001.blob.core.windows.net`, with no solid edge, produces one dashed `Likely` edge and the redacted-host outline sentence.
3. The same host plus an existing solid Data Factory edge does not add a second Likely edge.
4. A storage account with no cited edge and no redacted host is Unconnected. The message is `No stored storage link yet.` It does not contain `unused` or `orphaned`.
5. A Web App payload is not sent to `Microsoft.Web/sites/config/list`.

Use the existing expander, graph-resolver, and diagram applier tests. Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- The classifier, graph resolver, and snapshot materializer may already contain uncommitted Developer SKU Bastion and NR-32 restore-point edits. Keep those edits. Do not restore those files.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-32 or SB-01 through SB-06 as greenfield.

## Done when

`staepcommtfhidevwus001` is Connected when a stored link names it, Likely when only a redacted host names it, and Unconnected with `No stored storage link yet` when neither is present. A later session can add diagnostic-log evidence. This session does not.
