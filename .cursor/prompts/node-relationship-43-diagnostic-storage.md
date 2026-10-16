# NR-43 — Link a resource to the storage account its diagnostic setting cites

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not infer a storage account from a name, a `tf` or `log` substring, or resource-group collocation.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-33 and NR-05. The owner is looking at storage accounts such as `stcllogshnprdweus2301`, `stconfighaphawaiinonprod`, and `stdbwhidevcus001`. They stand alone. NR-33 already connects an account when a private endpoint, role, Data Factory link, Logic App connection, or redacted host already cites it. This session adds the diagnostic-setting storage account id that collection already stores and does not draw.

## Goal

When `diagnostic-settings.json` stores a non-empty `storageAccountId` and that storage account is a node in the snapshot, draw one solid **Sends diagnostics to** line from the setting's resource to that storage account. An account with no private endpoint, no role, no workflow, no host, and no diagnostic setting still stands alone. Do not mark it unused.

## Why

`Get-ArchLucidAzureDiagnosticSetting` companion rows already persist `storageAccountId` (and workspace and Event Hub ids). Those rows explain log and config storage accounts that have no private endpoint. The diagram does not turn `storageAccountId` into an edge, so the outline says `Stands alone`.

NR-33 forbids diagnostic-log queries and name guesses. This session does not query logs. It uses the storage account id already on the diagnostic setting resource. A name like `staepcommtfhidevwus001` is still not proof.

Log Analytics workspace targets of the same settings stay off the plate when they are already excluded. This session does not add a workspace card. It only draws when the storage account is visible.

## Read first

- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (diagnostic setting companion rows)
- `ArchLucid.Core/AzureExtractor/AzureExtractorPackageZipEntryNames.cs` (`diagnostic-settings.json`)
- `ArchLucid.Application/InfraEvidence/AzureInventorySecurityEdgeMaterializer.cs`
- `.cursor/prompts/node-relationship-33-storage-connectivity.md`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs`
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryDataFlowDiagramExclusions.cs`

## What to build

1. Add association type `diagnosticSettingToStorage`. Evidence label **Current**. Diagram label **Sends diagnostics to**. Inference source `inventory-diagnostic-setting-storage`. Reuse the existing association row and edge materializer. Do not add a second edge path.
2. When a diagnostic setting row has a non-empty `storageAccountId`, emit one association from the resource that owns the setting to that storage account id. Collapse duplicates that share the same source and storage account.
3. If the owner resource is a snapshot node and the storage account is a snapshot node, draw one solid **Sends diagnostics to** edge. The storage account is then Connected under the NR-33 rule that any stored link counts. Do not change NR-33's other inputs.
4. A `storageAccountId` that is not in the snapshot does not create a storage node. Follow the existing outside-subscription behavior only if NR-27 already applies to this association type. Otherwise skip the edge.
5. Do not draw an edge for `workspaceId` or `eventHubAuthorizationRuleId` in this session.
6. An empty `storageAccountId` emits no row.
7. Keep the edge out of `InventoryDiagramDataFlowTraversalHopClassifier`. Diagnostics are not a traffic hop.
8. A storage account that is only a diagnostic destination is not Orphaned. It is Connected when the edge is drawn. An account with no such row and no other NR-33 proof stays Unconnected. The outline keeps `Stands alone` and must not say the account is unused.

Do not query Storage analytics, Log Analytics, or diagnostic log contents. Do not read storage keys. Do not add a dashed **Likely** line from a name prefix.

If diagnostic settings are collected only for some resource types today, do not expand the resource-type scan in this session unless a setting row is already dropped before `storageAccountId` is saved. Fix that drop. Do not start a new full-subscription diagnostic sweep beyond the collector that already writes `diagnostic-settings.json`.

Bump `scriptVersion` and `collectorVersion` only if the collector JSON shape changes. If the edge is built entirely from rows the current package already writes, do not bump the script version.

## Tests

1. A diagnostic setting on a Key Vault whose `storageAccountId` is `stcllogshnprdweus2301` in the same snapshot emits one `diagnosticSettingToStorage` row and one solid **Sends diagnostics to** edge. The storage account is not Unconnected.
2. Two settings on the same resource that cite the same storage account produce one edge.
3. A setting with a null `storageAccountId` and a workspace id produces no storage edge.
4. A storage account with no diagnostic row, no private endpoint, and no other NR-33 proof stays Unconnected.
5. A storage account whose name contains `log` or `tf` and that has no stored id reference does not gain an edge.
6. The new edge is not a data-flow hop.

Use fixtures. Do not call Azure.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-42 as greenfield.

## Done when

A storage account cited by a stored diagnostic setting `storageAccountId` shows **Sends diagnostics to** from each in-snapshot owner. Accounts with no stored citation still stand alone, and the outline does not call them unused. No line appears because of a name.
