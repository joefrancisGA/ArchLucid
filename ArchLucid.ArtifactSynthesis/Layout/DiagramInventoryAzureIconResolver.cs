using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.ArtifactSynthesis.Layout;

public static class DiagramInventoryAzureIconResolver
{
    private static readonly AzureArchitectureIconCatalog Catalog = AzureArchitectureIconCatalog.Load();
    private static readonly AzureArchitectureIconCatalogEntry? VirtualMachineIcon =
        Catalog.Resolve("Microsoft.Compute/virtualMachines");
    private static readonly IReadOnlyDictionary<string, string> LinkedServiceIconFiles =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["AzureBlobStorage"] = "Svg/storage-account.svg",
            ["AzureBlobFS"] = "Svg/storage-account.svg",
            ["AzureSqlDatabase"] = "Svg/sql-database.svg",
            ["AzureSqlMI"] = "Svg/sql-managed-instance.svg",
            ["AzureSynapseAnalytics"] = "Svg/synapse.svg",
            ["AzureKeyVault"] = "Svg/key-vault.svg",
            ["AzureCosmosDb"] = "Svg/cosmos-db.svg",
            ["CosmosDb"] = "Svg/cosmos-db.svg",
            ["AzurePostgreSql"] = "Svg/postgresql.svg",
            ["AzureMySql"] = "Svg/mysql.svg",
            ["AzureEventHub"] = "Svg/event-hub.svg",
            ["EventHub"] = "Svg/event-hub.svg",
            ["AzureServiceBus"] = "Svg/service-bus.svg",
            ["ServiceBus"] = "Svg/service-bus.svg",
            ["AzureDatabricks"] = "Svg/databricks.svg",
            ["AzureDataLakeStore"] = "Svg/data-lake-storage-gen1.svg",
            ["Snowflake"] = "Svg/resource-linked.svg",
            ["SapTable"] = "Svg/resource-linked.svg",
            ["SapOpenHub"] = "Svg/resource-linked.svg",
            ["SapEcc"] = "Svg/resource-linked.svg",
            ["SapHana"] = "Svg/resource-linked.svg",
            ["Oracle"] = "Svg/resource-linked.svg",
            ["OracleServiceCloud"] = "Svg/resource-linked.svg",
            ["FtpServer"] = "Svg/resource-linked.svg",
            ["Sftp"] = "Svg/resource-linked.svg",
            ["FileServer"] = "Svg/resource-linked.svg",
            ["Hdfs"] = "Svg/resource-linked.svg",
            ["RestService"] = "Svg/resource-linked.svg",
            ["HttpServer"] = "Svg/resource-linked.svg",
            ["Web"] = "Svg/resource-linked.svg",
            ["AmazonS3"] = "Svg/resource-linked.svg",
            ["GoogleCloudStorage"] = "Svg/resource-linked.svg",
        };

    public static AzureArchitectureIconCatalogEntry? Resolve(DiagramNode node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (!string.IsNullOrWhiteSpace(node.ExternalLinkedServiceType)
            && LinkedServiceIconFiles.TryGetValue(node.ExternalLinkedServiceType.Trim(), out string? linkedServiceFile))
        {
            return Catalog.FindByFile(linkedServiceFile);
        }

        if (ShouldUseVirtualMachineIcon(node))
        {
            return VirtualMachineIcon ?? Catalog.Resolve(node.ArmResourceType, node.ArmResourceKind);
        }

        return Catalog.Resolve(node.ArmResourceType, node.ArmResourceKind);
    }

    private static bool ShouldUseVirtualMachineIcon(DiagramNode node)
    {
        if (node.IsAvdCollapsedBoundary)
        {
            return true;
        }

        return InventoryDiagramAvdClassifier.TryClassify(node.ArmResourceType, node.ArmResourceId, out _);
    }
}
