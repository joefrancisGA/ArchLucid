namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Canonical allow-list of ADF linked-service connector types sanitized by Tier 1 and Tier 2 collectors (AX-DE-05).
/// </summary>
public static class AzureInventoryAdfLinkedServiceSupportedTypes
{
    public static IReadOnlyList<string> All { get; } =
    [
        "AzureBlobStorage",
        "AzureBlobFS",
        "AzureSqlDatabase",
        "AzureSqlMI",
        "AzureSynapseAnalytics",
        "AzureDataLakeStore",
        "AzureKeyVault",
        "AzureCosmosDb",
        "CosmosDb",
        "AzurePostgreSql",
        "AzureMySql",
        "AzureTableStorage",
        "AzureEventHub",
        "EventHub",
        "AzureServiceBus",
        "ServiceBus",
        "AzureDatabricks",
        "Snowflake",
        "SapTable",
        "SapOpenHub",
        "SapEcc",
        "SapHana",
        "Oracle",
        "OracleServiceCloud",
        "FtpServer",
        "Sftp",
        "FileServer",
        "Hdfs",
        "RestService",
        "HttpServer",
        "Web",
        "AmazonS3",
        "GoogleCloudStorage",
    ];

    private static readonly HashSet<string> Lookup = new(All, StringComparer.OrdinalIgnoreCase);

    public static bool IsSupported(string? linkedServiceType)
    {
        if (string.IsNullOrWhiteSpace(linkedServiceType))
        {
            return false;
        }

        return Lookup.Contains(linkedServiceType.Trim());
    }
}
