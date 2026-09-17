namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Type-scoped ARM list GET descriptors for PaaS relationship enrichment (AX-DE-14).
///     O(types) calls — not O(resources).
/// </summary>
internal static class HostedAzureArmPaasTypeListDescriptors
{
    internal const string SqlApiVersion = "2021-11-01";

    internal const string CosmosApiVersion = "2023-04-15";

    internal const string StorageApiVersion = "2023-01-01";

    internal const string ContainerServiceApiVersion = "2024-02-01";

    internal const string DatabricksApiVersion = "2023-02-01";

    internal static readonly HostedAzureArmTypeListDescriptor[] SubscriptionLists =
    [
        new("Microsoft.Sql/servers", $"providers/Microsoft.Sql/servers?api-version={SqlApiVersion}"),
        new("Microsoft.DocumentDB/databaseAccounts", $"providers/Microsoft.DocumentDB/databaseAccounts?api-version={CosmosApiVersion}"),
        new("Microsoft.Storage/storageAccounts", $"providers/Microsoft.Storage/storageAccounts?api-version={StorageApiVersion}"),
        new("Microsoft.ContainerService/managedClusters", $"providers/Microsoft.ContainerService/managedClusters?api-version={ContainerServiceApiVersion}"),
        new("Microsoft.Databricks/workspaces", $"providers/Microsoft.Databricks/workspaces?api-version={DatabricksApiVersion}"),
    ];
}
