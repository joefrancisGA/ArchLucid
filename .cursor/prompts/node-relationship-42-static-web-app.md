# NR-42 — Link a Static Web App to its linked backends

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not infer a backend from a name, a resource group, or a custom domain hostname alone.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-04 and NR-05. The owner is looking at `maintenance-dev` (`Microsoft.Web/staticSites`). The outline says it stands alone. That name is not evidence of a linked Function, API, or identity provider.

## Goal

The next inventory capture stores each Static Web App linked backend whose ARM id is on the static site or its `linkedBackends` child. When that backend is a node in the snapshot, draw one solid **Calls** line from the static site to that backend. A static site with no stored backend id stays unconnected. Custom domains and repository URLs are not diagram nodes.

## Why

NR-04 listed linked Functions, APIs, identity providers, and custom domains as the cited proof for `staticsites`. Collection today stores the static site resource and does not walk linked backends. `InventoryDiagramOrphanedStateClassifier` then marks a lineless static site Unconnected. The outline says `Stands alone`.

Linked backends are child resources or properties that carry another ARM resource id. A custom domain is a hostname, not an architecture node in this snapshot.

## Read first

- `ArchLucid.Core/AzureExtractor/InventoryDiagramIndirectRelationshipClassifier.cs`
- `ArchLucid.Core/AzureExtractor/InventoryDiagramOrphanedStateClassifier.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryRelationshipAssociationTypes.cs`
- `scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureArmPaasTypeListDescriptors.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAksWorkloadImageCollectionWarnings.cs`

## What to build

1. Confirm the documented ARM shape for `Microsoft.Web/staticSites/linkedBackends` (resource id of the backend on the child or on the parent). Use a stable `api-version` from Learn. Do not invent a property name.
2. Add association type `staticSiteToLinkedBackend`. Evidence label **Current**. Diagram label **Calls**. Inference source `inventory-static-site-backend`. Reuse the existing association row and edge materializer.
3. Customer script: one Resource Graph query, or a GET of `linkedBackends` when ARG cannot project the backend id. Emit one row from the static site id to the backend resource id when both are non-empty.
4. Hosted extractor: list the same children and emit the same rows.
5. On HTTP 401 or 403, emit `static-site-backends-not-collected:insufficient-permission:{staticSiteResourceId}`. On other failures, use `http-error` or `error` with the same prefix and the static site id. Map the codes in inventory completeness copy. Tell the reader to grant read of static site linked backends, then re-collect.
6. When the backend id is a snapshot node, draw one solid **Calls** edge. Duplicate rows collapse to one edge.
7. A static site with a successful read and no backend id stays Unconnected and gets no warning.
8. Do not emit nodes for `customDomains`, `userProvidedFunctionApps` unless that child has an ARM id that is already a snapshot node. A hostname-only custom domain is not a node and not an edge.
9. Keep the static site out of `InventoryDiagramDataFlowTraversalHopClassifier` unless a linked backend edge is only a cited call, not a traversal hop. Do not add the static site to `IsTraversalHopArmType` in this session.

Do not draw a line because the site is named `maintenance-dev` or shares `anly-aep-dev-hi` with other resources. Do not read app settings or static site secrets.

Bump `scriptVersion` and `collectorVersion` in `Get-ArchLucidAzurePackage.ps1` and `Get-SecureNowAzurePackage.ps1` by one patch from the version already in those files.

## Tests

1. A static site with one linked backend id that is a Function app in the snapshot emits one `staticSiteToLinkedBackend` row and one solid **Calls** edge.
2. A static site with a successful empty backend list stays Unconnected and has no warning.
3. HTTP 403 emits `static-site-backends-not-collected:insufficient-permission` and no invented backend.
4. A custom domain hostname does not create a node or an edge.
5. A static site in the same resource group as a Function, with no stored backend id, does not link to that Function.
6. Completeness copy names the static site and the re-collect step.

Use fixtures. Do not call Azure.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile the projects you edit with `.\scripts\ci\agent-compile-check.ps1` and run the new tests. Run the focused Pester file for the association query change.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not re-run NR-01 through NR-41 as greenfield.

## Done when

After the next collection, `maintenance-dev` has a **Calls** line to each in-snapshot linked backend, or an insufficient-permission warning when the backend list cannot be read, or it still stands alone when Azure has no linked backend. The current snapshot keeps the old result until that subscription is captured again.
