# NR-36 — Link an AKS cluster to its registry

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not open the Kubernetes API from the caller’s address. Do not query Container Registry diagnostic logs. Do not read environment values, pull secrets, or admin credentials.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-34. The owner is looking at `acraephidevwus001`, `acraephippdwus001`, and `acraephitestwus001`. They remain in **Stands alone** on the full subscription diagram. The only stored cluster is `aks-maks-hi-nprd-weus-300` in `tie0-caks-nprd-h1`. Its node pools are the scale sets `aks-aephidev-16035491-vmss`, `aks-aephiprd-36061057-vmss`, and `aks-aephitest-37164200-vmss`. The workload page is blocked by an authorized IP range. The deployment images are not on the cluster ARM resource.

## Goal

The next inventory capture stores each container image running on a managed cluster. When an image host matches a registry `loginServer` in the snapshot, draw one solid `Pulls image from` line from that cluster to that registry. Many deployments on one registry still produce one line. A registry with no matching image stays unconnected.

## Why

NR-34 stores `loginServer` and reads images from a Container App template and from a Web App or Function `DOCKER|` setting. `AddManagedClusterProperties` stores `agentPoolProfiles` and `networkProfile`. It does not store pod or deployment images.

`AzureInventoryContainerImageEdgeMapper` already draws one observed `Pulls image from` edge when any stored `container.image[{index}]` host equals a registry `loginServer`. The cluster never receives those properties, so the registries stay unconnected.

The cluster API allows only specific source addresses. The browser warning named that control. Collection must use the Azure Resource Manager `runCommand` action, which does not connect from the caller’s address. A node-pool name such as `aephidev` is not proof that the pool pulls from `acraephidevwus001`.

## Read first

- `ArchLucid.Integrations.AzureExtractor/GetOnlyHostedAzureArmReadClient.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryDiagramEnrichmentCollector.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryResourcePropertyExpander.cs` (`AddManagedClusterProperties`)
- `ArchLucid.Integrations.AzureExtractor/HostedAzureArmPaasTypeListDescriptors.cs` (`ContainerServiceApiVersion`)
- `ArchLucid.Application/InfraEvidence/AzureInventoryContainerImageEdgeMapper.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventorySecurityEdgeMaterializer.cs`

## What to build

1. For each `Microsoft.ContainerService/managedClusters` resource, call the ARM action `runCommand` with the existing Container Service API version `2024-02-01`. Keep this POST in its own collector. Leave `GetOnlyHostedAzureArmReadClient` limited to GET. Poll the returned command result until it succeeds, fails, or the bounded wait ends.
2. The command is read-only. It prints the image field from deployments, stateful sets, daemon sets, jobs, and cron jobs, including init containers. Request only the image field. Discard every other field.
3. Store each distinct image on that cluster as `container.image[{index}]`. Keep the image reference. Do not store environment values, command logs, or command errors.
4. Feed those properties through the existing `AzureInventoryContainerImageEdgeMapper` path. One cluster and one registry produce one solid `Pulls image from` edge. A second image on the same host does not add a second edge. Do not add a deployment node for each workload.
5. When `runCommand` is forbidden, the cluster is stopped, or the wait ends, add one completeness warning and store no image. Leave the registry unconnected. The existing sentence remains `No stored registry link yet.`

Do not connect to the cluster API server from the collector’s address. Do not list registry repositories or tags. Do not infer a registry from a node-pool name, the scale-set name `aks-aephidev-16035491-vmss`, or the registry name `acraephidevwus001`. Do not create an Outside card for an image host that is not in the snapshot.

## Tests

1. A command result that prints `acraephidevwus001.azurecr.io/app:1` twice and `mcr.microsoft.com/oss/kubernetes/pause:3.6` once stores two `container.image` values on the cluster. An environment value in the payload is not stored.
2. A snapshot whose cluster image host matches `acraephidevwus001.azurecr.io` produces one solid `Pulls image from` edge from `aks-maks-hi-nprd-weus-300` to that registry. A second image on the same host does not add a second edge.
3. A failed or forbidden `runCommand` adds a completeness warning, stores no image, and adds no edge.
4. A registry with no matching image still says `No stored registry link yet.`

Use a collector test with a fake command result and the existing container-image mapper test. Do not call Azure. Do not require the `ArchitectureDiagramViewer` zoom suite to pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Keep uncommitted NR-32, NR-33, NR-34, and NR-35 edits if they are present. Do not restore those files.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure except the read-only `runCommand` action during a real collection after this change ships.
- Do not re-run NR-01 through NR-35 or SB-01 through SB-06 as greenfield.

## Done when

After the next collection, `aks-maks-hi-nprd-weus-300` has one solid `Pulls image from` line to each registry whose stored login server matches a collected workload image. `acraephidevwus001` is no longer unconnected when one of those images uses `acraephidevwus001.azurecr.io`. The current snapshot keeps the old result until that subscription is captured again. The collector identity needs permission to run a command on the cluster.
