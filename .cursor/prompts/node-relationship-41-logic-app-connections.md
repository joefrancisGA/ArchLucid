# NR-41 — Surface Logic App connection collection failures and keep cited workflow edges

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not infer a workflow target from a display name, a resource group, or a similar storage account name.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-01 and NR-05. The owner is looking at Logic Apps such as `la_hi_api_dev_test`, `la-blob-csv-to-html-hi-ppd-cus-001`, and `la-lcw-membershipremoval-lms-nprd` (`Microsoft.Logic/workflows`). The outline says they stand alone. A workflow with no stored connection is allowed to stand alone. A workflow whose definition GET failed is not the same fact.

## Goal

Collection already reads workflow definitions into `logic-app-connections.json` and the materializer can draw `logicAppConnection` edges. This session makes a failed read visible, keeps drawing one solid edge per stored connection whose target is a snapshot node, and leaves a workflow with a successful read and no resolvable target unconnected.

## Why

`Get-ArchLucidAzureLogicAppConnectionCompanionRows` GETs each `Microsoft.Logic/workflows` resource and walks `$connections` plus action resource ids. The `catch` block drops the error. The manifest can still show completeness 1.0 while every workflow GET returned 403. The diagram then matches a workflow that truly has no connectors.

NR-01 already says a workflow with no resolvable action remains a node. Do not rebuild that rule. Do not hide the workflow card when it has edges. Draw the edges and keep the workflow visible.

`AzureInventoryRelationshipCompletenessWarningCodes` already has `logic-app-connections-missing` and `logic-app-standard-not-collected`. Use them only for the cases they already mean. Add a new per-workflow code for a failed GET so the reader can fix RBAC.

## Read first

- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Get-ArchLucidAzureLogicAppConnectionCompanionRows`, `Add-ArchLucidAzureLogicAppActionConnectionRows`)
- `ArchLucid.Application/InfraEvidence/AzureInventoryLogicAppConnectionEdgeMapper.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipCompletenessWarningCodes.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAksWorkloadImageCollectionWarnings.cs`
- `archlucid-ui/src/lib/infra-evidence/resolve-infra-evidence-completeness-warning-copy.ts`
- `ArchLucid.Integrations.AzureExtractor` hosted Logic App connection collection, if a parallel path exists

## What to build

1. When the workflow GET returns HTTP 401 or 403, emit `logic-app-connections-not-collected:insufficient-permission:{workflowResourceId}`. Do not emit a connection row.
2. When the GET returns another non-success status or throws, emit `logic-app-connections-not-collected:http-error:{workflowResourceId}` or `logic-app-connections-not-collected:error:{workflowResourceId}`. Do not swallow the failure.
3. A successful GET with no `$connections` entries and no action resource ids emits no warning and no rows. That workflow stays Unconnected.
4. A successful GET that stores a `connectionResourceId` or action resource id keeps the existing row shape. When that id is a node in the snapshot, the existing mapper draws one solid connection edge. Two rows to the same target produce one edge. Do not add a second edge path.
5. Map the new warning codes in inventory completeness copy. Insufficient permission tells the reader the collector identity must be allowed to read the workflow definition (typically a role that can read `Microsoft.Logic/workflows`, stronger than a deny on that type), then re-run the package and re-ingest. Name the workflow.
6. Hosted collection uses the same warning codes with the same reasons when it reads workflow definitions. If hosted Logic Apps are not collected, do not pretend they were. Emit the existing standard-logic-app gap only when that path is the one that skipped them.
7. Do not read connection secret values, access keys, or callback URLs. Keep the existing sensitive-property skip.
8. Do not treat a Logic App as a data-flow hop unless an existing data-flow rule already does. This session does not add one.

Bump `scriptVersion` and `collectorVersion` in `Get-ArchLucidAzurePackage.ps1` and `Get-SecureNowAzurePackage.ps1` by one patch from the version already in those files.

## Tests

1. A workflow GET that returns 403 produces `logic-app-connections-not-collected:insufficient-permission` for that resource id and zero connection rows.
2. A workflow GET that returns a definition with one storage account `connectionId` present in the snapshot produces one stored row and one diagram edge. The workflow is not Unconnected.
3. A workflow GET that returns a definition with no connections and no action resource ids produces no warning and no edge.
4. A second row to the same target does not produce a second edge.
5. Completeness copy for insufficient permission names the workflow and the re-collect step.
6. An exception from `Invoke-AzRestMethod` produces an `error` warning and still lets the rest of the package finish.

Use fixtures. Do not call Azure.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests. Run the focused Pester file for the Logic App helper change.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-40 as greenfield.

## Done when

After the next collection, a Logic App whose definition cannot be read shows an insufficient-permission or error completeness warning instead of a silent stand-alone. A Logic App with a stored connection to an in-snapshot resource shows that edge. A Logic App whose definition was read and cites nothing still stands alone. The current snapshot keeps the old result until that subscription is captured again.
