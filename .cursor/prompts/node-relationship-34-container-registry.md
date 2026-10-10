# NR-34 — Link container apps to their registry

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not query Container Registry diagnostic logs. Do not read pull secrets or admin credentials.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-28 and NR-33. The owner is looking at `acraephidevwus001` (`Microsoft.ContainerRegistry/registries`). It is marked standalone, and it supports about 30 applications. The current snapshot does not store the registry login server or the application image references, so this link cannot appear until the next collection.

## Goal

The next inventory capture stores each registry `loginServer` and each workload image reference. When an image host matches a registry in the snapshot, draw one solid line labeled `Pulls image from`. A registry with no image reference and no stored access line stays Unconnected, and the outline says no stored registry link was found.

## Why

`InventoryDiagramIndirectRelationshipClassifier` treats `Microsoft.ContainerRegistry/registries` as an indirect registry. `HostedAzureArmPaasTypeListDescriptors.SubscriptionLists` re-fetches storage accounts and AKS clusters. It does not re-fetch container registries, so the shallow resource row does not keep `loginServer`.

`AddContainerAppProperties` stores `managedEnvironmentId` and the ingress host. It does not read `properties.template.containers[].image`. App Service `linuxFxVersion` and `windowsFxVersion` are not stored. Without those strings, the diagram cannot see `acraephidevwus001.azurecr.io`.

A resource-scoped `AcrPull` assignment is already a stored access line when NR-28 can see it. An image reference is stronger: it says this workload runs that registry's image. Registry login and repository logs can prove pulls, and they wait for a later session.

## Read first

- `ArchLucid.Integrations.AzureExtractor/HostedAzureArmPaasTypeListDescriptors.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryResourcePropertyExpander.cs` (`AddContainerAppProperties`)
- `ArchLucid.Core/AzureExtractor/InventoryDiagramIndirectRelationshipClassifier.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/InventoryDiagramRelationshipEdgeHelper.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs`

## What to build

1. Add `Microsoft.ContainerRegistry/registries` to `HostedAzureArmPaasTypeListDescriptors.SubscriptionLists`. Use the Container Registry API version `2023-07-01`. The relative path is `providers/Microsoft.ContainerRegistry/registries?api-version=2023-07-01`. Store `loginServer` as a property. Do not store `adminUserEnabled` passwords, tokens, or credentials.
2. From a Container App, store each `properties.template.containers[].image` and each `properties.template.initContainers[].image` as `container.image[{index}]`. Keep only the image reference. Do not store environment values.
3. From a Web App or Function whose `linuxFxVersion` or `windowsFxVersion` starts with `DOCKER|`, store the image reference after that prefix as `container.image[0]`. Ignore `DOTNET|`, `NODE|`, and other non-image values.
4. When a stored image host equals a registry `loginServer` in the same snapshot, draw one solid edge from the workload to that registry. The label is `Pulls image from`. The provenance is observed. One workload and one registry produce one edge even when several containers use that registry. Do not add a second edge when a solid edge already joins that pair.
5. A registry with no image edge and no stored access edge is Unconnected. The outline sentence is `No stored registry link yet.` Do not say standalone, unused, or orphaned.

Do not list repositories or tags. Do not query diagnostic logs. Do not call `Microsoft.Web/sites/config/list`. Do not infer the registry from the resource name `acraephidevwus001`. A registry hostname that is not in the snapshot does not create an Outside card in this session.

## Tests

1. The PaaS type list contains `Microsoft.ContainerRegistry/registries` and `api-version=2023-07-01`.
2. Expanding a registry payload stores `loginServer` `acraephidevwus001.azurecr.io`.
3. Expanding a Container App with two images on that host stores `container.image[0]` and `container.image[1]`. An init container image is included. Environment values are not stored.
4. A Web App `linuxFxVersion` of `DOCKER|acraephidevwus001.azurecr.io/app:1` stores that image reference. `DOTNET|8.0` stores no image.
5. A snapshot whose Container App image host matches the registry login server produces one solid `Pulls image from` edge. The registry is not Unconnected. A second container on the same host does not add a second edge.
6. A registry with no image reference and no access edge is Unconnected. The message is `No stored registry link yet.` It does not contain `unused` or `orphaned`.

Use the expander tests, a descriptor test beside the existing PaaS or network descriptor tests, and a focused graph or diagram test. Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Keep uncommitted Developer SKU Bastion, NR-32, and NR-33 edits if they are present. Do not restore those files.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-33 or SB-01 through SB-06 as greenfield.

## Done when

After the next collection, a workload whose stored image uses `acraephidevwus001.azurecr.io` has one solid `Pulls image from` line to that registry. A registry with no stored image or access link says `No stored registry link yet`. The current snapshot keeps the old result until that subscription is captured again.
