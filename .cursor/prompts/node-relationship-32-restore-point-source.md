# NR-32 — Re-fetch the restore point collection source

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not list child restore points. Do not read disks. Do not guess a virtual machine from the collection name.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-03 and NR-05, which are already on master. The outline says `Missing a required link: protected virtual machine no longer exists` for `azurebackup_vm-bam-test-01_1126638779206409261` (`Microsoft.Compute/restorePointCollections`). There is no virtual machine name in that sentence. The owner confirmed the collection has backed up disks that belong to a live virtual machine.

## Goal

The next inventory capture stores `source.id` from the full restore point collection. When that id is a virtual machine already in the snapshot, the collection is not orphaned. A collection that still has no source id does not say the virtual machine no longer exists.

## Why

`TryClassifyOrphanedRestorePointCollection` uses `protected virtual machine no longer exists` when `AzureInventoryRestorePointCollectionSourceParser.Parse` returns no id. That branch never looked up `vm-bam-test-01`.

`AddRestorePointCollectionProperties` already writes `source.id` when the payload contains `source.id`. The subscription resource list does not include that property. `HostedAzureArmNetworkTypeListDescriptors.SubscriptionLists` re-fetches virtual machines and virtual machine scale sets. `Microsoft.Compute/restorePointCollections` is not on that list, so the shallow row is all the snapshot keeps.

`AzureInventorySnapshotParentAttachmentGraphHydrator.HydrateRestorePointCollection` already copies a parsed source id onto the graph node. Leave that hydrator and the parser as they are.

The disks the owner saw are on child restore points. Those points are not in the snapshot. Do not add a restore-point list, a disk card, or a match from a disk id. Do not parse `azurebackup_{name}_{number}`.

A snapshot already saved does not gain `source.id`. The link appears after the next capture of that subscription. The wording change applies on the next render of the current snapshot.

## Read first

- `ArchLucid.Integrations.AzureExtractor/HostedAzureArmNetworkTypeListDescriptors.cs` (`SubscriptionLists`, `ComputeApiVersion`)
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryResourcePropertyExpander.cs` (`AddRestorePointCollectionProperties`, `AddArmReferenceProperty`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryRestorePointCollectionSourceParser.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs` (`TryClassifyOrphanedRestorePointCollection`)
- `ArchLucid.Core.Tests/AzureExtractor/InventoryDiagramOrphanedStateClassifierTests.cs` (`Classify_restore_point_collection_with_missing_vm_is_orphaned_and_names_vm`)
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotParentAttachmentGraphHydrator.cs` (`HydrateRestorePointCollection`)

## What to build

1. Add `Microsoft.Compute/restorePointCollections` to `HostedAzureArmNetworkTypeListDescriptors.SubscriptionLists`. Use `ComputeApiVersion`. The relative path is `providers/Microsoft.Compute/restorePointCollections?api-version={ComputeApiVersion}`. Do not add another API version constant.
2. In `TryClassifyOrphanedRestorePointCollection`, when the parser returns no source id, the message is `protected virtual machine was not recorded`. It must not contain `no longer exists`.
3. When the parser returns a source id and that id is not a node in the analysis graph, keep the current message: `protected virtual machine {name} no longer exists`, or `protected virtual machine scale set {name} no longer exists` when the id contains `virtualMachineScaleSets`.
4. When the source id is a virtual machine node already on the analysis graph, the collection is not Orphaned. Do not add a new edge type. The existing parent-attachment path draws the parent from `source.id`.

Do not change `AddRestorePointCollectionProperties`. Do not call Azure from the classifier.

## Tests

1. `SubscriptionLists` contains one descriptor whose resource type is `Microsoft.Compute/restorePointCollections` and whose relative path contains `providers/Microsoft.Compute/restorePointCollections` and `api-version=2024-03-01`.
2. Expanding a restore point collection whose `source.id` is a virtual machine id stores that id as `source.id`. A payload with no `source` property stores no `source.id`.
3. A restore point collection with no source id is Orphaned. The message is `protected virtual machine was not recorded`. The message does not contain `no longer exists`.
4. `Classify_restore_point_collection_with_missing_vm_is_orphaned_and_names_vm` stays: a named missing virtual machine still contains that name and `no longer exists`.
5. A snapshot graph whose collection property is `source.id` for a virtual machine that is also a graph node copies that id onto the collection node. Classifying that collection is not Orphaned.

Put the descriptor test in a new `HostedAzureArmNetworkTypeListDescriptorsTests` class file. Put the expander test in `HostedAzureInventoryResourcePropertyExpanderTests`. Put the classifier tests in `InventoryDiagramOrphanedStateClassifierTests`. Put the graph test beside `AzureInventorySnapshotGraphResolverPeeringTests`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- The classifier, graph resolver, and snapshot materializer may already contain an uncommitted Developer SKU Bastion edit. Keep that edit. Do not restore those files. If the script exits 2 only because of that Bastion edit, edit on top of it. Stop on exit 2 for any other dirty path.
- Compile the projects you edit. For the descriptor or expander, compile `ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj` and run the new tests. For the classifier, compile `ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj` and run the restore-point classifier tests. For the graph test, compile `ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj` and run that test.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-31, SB-01 through SB-06, or the disk and restore-point fallback as greenfield.

## Done when

A full restore point collection read with `source.id` keeps that id, and a snapshot that also contains that virtual machine does not caption the collection with `protected virtual machine no longer exists`. A collection with no source id says `protected virtual machine was not recorded`. A snapshot captured before this change keeps the missing link until that subscription is captured again. The current snapshot's wording changes on the next render.
