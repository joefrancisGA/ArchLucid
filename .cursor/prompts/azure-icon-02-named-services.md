# AZI-02 — Named Azure services

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement AZI-03 or AZI-04 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Azure icon coverage (**AZI**). **Depends on:** AZI-01 accepted, or the owner explicitly skipping AZI-01. The kind matcher from AZI-01 must already be in the branch you start from. If `Resolve("Microsoft.Storage/storageAccounts", "StorageV2")` returns null, stop and say AZI-01 is not in this branch.

## Goal

The product types `DiagramArmTypeFriendlyName` already names, and that this zip has an icon for, draw that official SVG. Types with no file in the zip stay on the category pictogram.

## Why

AZI-01 only fixes the ten icons already embedded. Disk, Kubernetes, App Service plan, SQL server, SQL managed instance, PostgreSQL, MySQL, Redis, Data Factory, Synapse, and Databricks are still pictograms even though the July 2026 zip contains their marks.

## Read first

- `.cursor/rules/Azure-Icon-Pack-Accepted.mdc`
- `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/azure-icon-manifest.json`
- `ArchLucid.ArtifactSynthesis/Layout/AzureArchitectureIconCatalog.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramArmTypeFriendlyName.cs`
- `ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj` (SVG embed is already `Assets\AzureIcons\Svg\*.svg`)
- `ArchLucid.ArtifactSynthesis.Tests/AzureArchitectureIconCatalogTests.cs`

## What to build

1. Branch `azi/02-named-services` from the accepted AZI-01 branch.
2. Copy only the SVGs named below out of `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/Source/Azure_Public_Service_Icons.zip` into `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/Svg/` under the short file name in the table. Copy the bytes. Do not crop, flip, rotate, recolor, or edit paths inside the SVG. Delete any temp extract when you are done. Do not stage the zip, the PDF, or the extract.
3. Add one manifest row per short file. `file` is `Svg/<short-name>.svg`. Leave `kind` unset. Several ARM types may share one file when the table says so.
4. Do not map a type that is not in the table. If a listed zip path is missing, stop and report that path. Do not substitute a Classic, Hub, or similarly named file.

| ARM type | Zip entry | Short file | Service | Category |
|----------|-----------|------------|---------|----------|
| `Microsoft.Compute/disks` | `Azure_Public_Service_Icons/Icons/compute/10032-icon-service-Disks.svg` | `disk.svg` | Disks | compute |
| `Microsoft.ContainerService/managedClusters` | `Azure_Public_Service_Icons/Icons/compute/10023-icon-service-Kubernetes-Services.svg` | `kubernetes-service.svg` | Kubernetes Services | compute |
| `Microsoft.Web/serverFarms` | `Azure_Public_Service_Icons/Icons/app services/00046-icon-service-App-Service-Plans.svg` | `app-service-plan.svg` | App Service Plans | web |
| `Microsoft.Sql/servers` | `Azure_Public_Service_Icons/Icons/databases/10132-icon-service-SQL-Server.svg` | `sql-server.svg` | SQL Server | databases |
| `Microsoft.Sql/managedInstances` | `Azure_Public_Service_Icons/Icons/databases/10136-icon-service-SQL-Managed-Instance.svg` | `sql-managed-instance.svg` | SQL Managed Instance | databases |
| `Microsoft.DBforPostgreSQL/flexibleServers` and `Microsoft.DBforPostgreSQL/servers` | `Azure_Public_Service_Icons/Icons/databases/10131-icon-service-Azure-Database-PostgreSQL-Server.svg` | `postgresql.svg` | Azure Database for PostgreSQL | databases |
| `Microsoft.DBforMySQL/flexibleServers` and `Microsoft.DBforMySQL/servers` | `Azure_Public_Service_Icons/Icons/databases/10122-icon-service-Azure-Database-MySQL-Server.svg` | `mysql.svg` | Azure Database for MySQL | databases |
| `Microsoft.Cache/Redis` | `Azure_Public_Service_Icons/Icons/databases/10137-icon-service-Cache-Redis.svg` | `redis.svg` | Azure Cache for Redis | databases |
| `Microsoft.DataFactory/factories` | `Azure_Public_Service_Icons/Icons/analytics/10126-icon-service-Data-Factories.svg` | `data-factory.svg` | Data Factory | databases |
| `Microsoft.Synapse/workspaces` | `Azure_Public_Service_Icons/Icons/analytics/00606-icon-service-Azure-Synapse-Analytics.svg` | `synapse.svg` | Azure Synapse Analytics | databases |
| `Microsoft.Databricks/workspaces` | `Azure_Public_Service_Icons/Icons/analytics/10787-icon-service-Azure-Databricks.svg` | `databricks.svg` | Azure Databricks | compute |

Leave these unmapped. They stay pictograms:

- `Microsoft.PowerBIDedicated/capacities` — Power BI Embedded is a different product.
- `Microsoft.Fabric/capacities` — not in this zip.
- `Microsoft.Cache` types other than `Microsoft.Cache/Redis`. Azure Managed Redis is a different product.

5. Add a catalog resolve test for every ARM type in the table. Assert the service name and that `SvgMarkup` contains `<svg` and does not contain `data:image/png`. Add one renderer test: a disk node emits `class="azure-icon"` and `data-file="Svg/disk.svg"` and does not emit `class="pictogram"` on that node. Keep the existing unmapped-type pictogram assertion.
6. Do not change `Resolve`. Do not change the SVG emitter unless a test shows the new file is dropped. If you must touch the client sanitizer because a copied SVG renders blank, keep the change to preserving that SVG’s gradients and shapes, and say so in the summary.

## Acceptance criteria

- Each ARM type in the table resolves to the service name in the table.
- `Microsoft.Sql/servers` is SQL Server. `Microsoft.Sql/servers/databases` is still SQL Database.
- `Microsoft.PowerBIDedicated/capacities` and `Microsoft.Fabric/capacities` resolve to null.
- A disk card contains the official SVG. An unknown type still contains `class="pictogram"`.
- Rendered SVG has no `data:image/png` and no `https://` image href.
- A network inventory fixture still contains `class="subscription-frame"`.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not download icons. Do not clone a GitHub icon mirror. Do not restore `*.png`.
- Microsoft’s terms: architectural diagrams only, product name near the icon, icon as it appears in Azure.
- Do not change subscription-frame rules, data-flow placement, edge ink, or outline structure.
- Working-tree safety. Stage only the new SVGs, the manifest, and the tests (plus a sanitizer fix if you had to make one). **No `git add -A`.** Do not stage the zip.
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter FullyQualifiedName~AzureArchitectureIcon
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1. Run `npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts` from `archlucid-ui` only if you changed the sanitizer.

## Done when

Tests pass. Tell the owner to restart the API and look at a disk, a SQL server (the server, not only the database), and a Kubernetes cluster, at normal fit and zoomed in. The mark should be the official icon and stay sharp. Power BI Dedicated and Fabric, if present, should still be pictograms. Wait for that look before any commit.
