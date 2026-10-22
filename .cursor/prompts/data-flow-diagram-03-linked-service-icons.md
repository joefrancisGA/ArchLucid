# DFV-03 — Icons for data-flow linked services

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-01 or DFV-02 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`, which already contains AZI-01–AZI-04. If `Resolve("Microsoft.Storage/storageAccounts", "StorageV2")` returns null, stop and say the icon catalog is not on this branch.

## Goal

An external ADF linked service draws the official Architecture Center icon for the Azure product it names. A linked service that is not an Azure product draws the Resource Linked mark. An ARM type with no file in the July 2026 zip keeps the category pictogram.

## Why

On **Data flow — what may connect** for `Hmd_HI_HAP_Non_Prod`, Data Factory, Logic Apps, MySQL servers, storage accounts, the firewall, and NAT gateways already use official icons. The left column does not.

Cards named `azuremysql1`, `hsag_sftp`, `sftp_ahcccs`, `nucc_http`, and `azureblob` are unresolved linked services. `AzureInventoryAdfExternalSourceNodeFactory` stores the connector type on `arm.externalLinkedServiceType` and sets `NodeType` to `TopologyResource`. No `arm.type` is set, so `DiagramAstGraphNodeClassifier.ReadArmType` returns `TopologyResource`. `DiagramInventoryAzureIconResolver` finds no catalog row. `DiagramInventoryPictogramKindResolver` then falls through to the blue compute pictogram (the monitor).

`unity-catalog-access-connector` is `Microsoft.Databricks/accessConnectors`. The July 2026 zip has an Azure Databricks workspace icon and no access-connector file. That card stays a pictogram. Do not reuse the workspace icon.

## Read first

- `.cursor/rules/Azure-Icon-Pack-Accepted.mdc`
- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfExternalSourceNodeFactory.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfLinkedServiceSupportedTypes.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` (`BuildDiagramNode`)
- `ArchLucid.ArtifactSynthesis/Models/DiagramNode.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramInventoryAzureIconResolver.cs`
- `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/azure-icon-manifest.json`
- `ArchLucid.ArtifactSynthesis.Tests/AzureArchitectureIconCatalogTests.cs`

## What to build

1. Branch `dfv/03-linked-service-icons` from current `master`.
2. Copy the linked-service type from `arm.externalLinkedServiceType` onto the diagram node when the graph node has that property. Do not overwrite `ArmResourceType` or `ArmResourceKind`. `TopologyResource` stays the ARM type for these nodes.
3. Copy only the two SVGs below out of `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/Source/Azure_Public_Service_Icons.zip` into `Assets/AzureIcons/Svg/`. Copy the bytes. Do not crop, flip, rotate, recolor, or edit paths. Delete any temp extract. Do not stage the zip.

| Zip entry | Short file |
|-----------|------------|
| `Azure_Public_Service_Icons/Icons/general/10831-icon-service-Resource-Linked.svg` | `resource-linked.svg` |
| `Azure_Public_Service_Icons/Icons/storage/10090-icon-service-Data-Lake-Storage-Gen1.svg` | `data-lake-storage-gen1.svg` |

If either path is missing, stop and report it. Do not substitute another file.

4. Add manifest rows for those two files so the catalog can resolve them by the service name in the table below. Leave `kind` unset. Do not add a fake ARM type that would steal an existing product row. A dedicated lookup from linked-service type to an already-embedded file is the right shape for the rows that say "reuse".
5. Resolve icons for these linked-service types:

| Linked-service type | Mark | File |
|---------------------|------|------|
| `AzureBlobStorage`, `AzureBlobFS` | Storage Accounts | reuse `Svg/storage-account.svg` |
| `AzureSqlDatabase` | SQL Database | reuse `Svg/sql-database.svg` |
| `AzureSqlMI` | SQL Managed Instance | reuse `Svg/sql-managed-instance.svg` |
| `AzureSynapseAnalytics` | Azure Synapse Analytics | reuse `Svg/synapse.svg` |
| `AzureKeyVault` | Key Vaults | reuse `Svg/key-vault.svg` |
| `AzureCosmosDb`, `CosmosDb` | Azure Cosmos DB | reuse `Svg/cosmos-db.svg` |
| `AzurePostgreSql` | Azure Database for PostgreSQL | reuse `Svg/postgresql.svg` |
| `AzureMySql` | Azure Database for MySQL | reuse `Svg/mysql.svg` |
| `AzureEventHub`, `EventHub` | Event Hubs | reuse `Svg/event-hub.svg` |
| `AzureServiceBus`, `ServiceBus` | Azure Service Bus | reuse `Svg/service-bus.svg` |
| `AzureDatabricks` | Azure Databricks | reuse `Svg/databricks.svg` |
| `AzureDataLakeStore` | Data Lake Storage Gen1 | `Svg/data-lake-storage-gen1.svg` |
| `Snowflake`, `SapTable`, `SapOpenHub`, `SapEcc`, `SapHana`, `Oracle`, `OracleServiceCloud`, `FtpServer`, `Sftp`, `FileServer`, `Hdfs`, `RestService`, `HttpServer`, `Web`, `AmazonS3`, `GoogleCloudStorage` | Resource Linked | `Svg/resource-linked.svg` |

6. Leave these on the category pictogram. Do not borrow a parent icon:

- `AzureTableStorage`
- `Microsoft.Databricks/accessConnectors`
- `Microsoft.Fabric/capacities`
- Any linked-service type not in the table

7. Tests:
   - An external node whose linked-service type is `AzureBlobStorage` emits `class="azure-icon"` and `data-file="Svg/storage-account.svg"` and does not emit `class="pictogram"` on that node.
   - `AzureMySql` emits `data-file="Svg/mysql.svg"`.
   - `Sftp` emits `data-file="Svg/resource-linked.svg"` and does not emit the storage-account file.
   - `Microsoft.Databricks/accessConnectors` still resolves to null and the card still emits `class="pictogram"`.
   - `Microsoft.Storage/storageAccounts` with kind `StorageV2` is still Storage Accounts.
8. Do not change `AzureArchitectureIconCatalog.Resolve` matching rules. Do not change data-flow placement or edge routing.

## Acceptance criteria

- Blob, SQL, MySQL, and Databricks linked services use the product icon already shipped for that ARM type.
- SFTP, HTTP, SAP, Oracle, Snowflake, Amazon S3, and Google Cloud Storage use Resource Linked, not a storage or database icon.
- Access connectors and Fabric capacities stay pictograms.
- Rendered SVG has no `data:image/png` and no `https://` image href.
- Product names stay on the card, next to the mark.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not download icons. Do not clone a GitHub icon mirror. Do not restore `*.png`.
- Microsoft's terms: architectural diagrams only, product name near the icon, icon as it appears in Azure. Do not use an Azure product icon for SFTP, HTTP, SAP, Oracle, Snowflake, Amazon S3, or Google Cloud Storage.
- Working-tree safety. Stage only the new SVGs, the manifest, the diagram-node field, the resolver, and the tests. **No `git add -A`.** Do not stage the zip.
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter FullyQualifiedName~AzureArchitectureIcon
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and look at Data flow. `azureblob` should show the storage-account mark. `azuremysql1` should show the MySQL mark. `sftp_ahcccs` and `nucc_http` should show Resource Linked, not the blue monitor. `unity-catalog-access-connector` should still be a category pictogram. Data Factory and Logic Apps should look the same as before. Wait for that look before any commit.
