using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Extracts non-secret linked-service targets from ADF <c>typeProperties</c> (AX-DE-05).
/// </summary>
public static class AzureInventoryAdfLinkedServiceTargetExtractor
{
    private const int MaxHostLength = 253;

    public static (string? TargetResourceId, string? TargetHost) Extract(
        JsonElement typePropertiesElement,
        string linkedServiceType)
    {
        if (typePropertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return (null, null);
        }

        string? targetResourceId = TryExtractTargetResourceId(typePropertiesElement, linkedServiceType);
        string? targetHost = TryExtractTargetHost(typePropertiesElement, linkedServiceType);

        return (targetResourceId, targetHost);
    }

    private static string? TryExtractTargetResourceId(JsonElement typePropertiesElement, string linkedServiceType)
    {
        string? explicitResourceId = AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "resourceId");

        if (IsArmResourceId(explicitResourceId))
        {
            return explicitResourceId!.Trim();
        }

        if (linkedServiceType.Equals("AzureBlobStorage", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("AzureTableStorage", StringComparison.OrdinalIgnoreCase))
        {
            string? serviceEndpoint = AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "serviceEndpoint");

            if (IsArmResourceId(serviceEndpoint))
            {
                return serviceEndpoint!.Trim();
            }
        }

        if (linkedServiceType.Equals("AzureDatabricks", StringComparison.OrdinalIgnoreCase))
        {
            string? workspaceResourceId = AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "existingWorkspaceResourceId")
                                          ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "workspaceResourceId");

            if (IsArmResourceId(workspaceResourceId))
            {
                return workspaceResourceId!.Trim();
            }
        }

        return null;
    }

    private static string? TryExtractTargetHost(JsonElement typePropertiesElement, string linkedServiceType)
    {
        if (linkedServiceType.Equals("AzureBlobStorage", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(
                TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "serviceEndpoint"))
                ?? TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "accountUri")));
        }

        if (linkedServiceType.Equals("AzureBlobFS", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "url")));
        }

        if (linkedServiceType.Equals("AzureSqlDatabase", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("AzurePostgreSql", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("AzureMySql", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "server"));
        }

        if (linkedServiceType.Equals("AzureSqlMI", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "instanceName"));
        }

        if (linkedServiceType.Equals("AzureSynapseAnalytics", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(
                TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "endpoint"))
                ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "server"));
        }

        if (linkedServiceType.Equals("AzureDataLakeStore", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "dataLakeStoreUri")));
        }

        if (linkedServiceType.Equals("AzureKeyVault", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "baseUrl")));
        }

        if (linkedServiceType.Equals("AzureCosmosDb", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("CosmosDb", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "accountEndpoint")));
        }

        if (linkedServiceType.Equals("AzureTableStorage", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(
                TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "tableEndpoint"))
                ?? TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "accountUri")));
        }

        if (linkedServiceType.Equals("AzureEventHub", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("EventHub", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("AzureServiceBus", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("ServiceBus", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(
                AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "fullyQualifiedNamespace")
                ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "servicebusNamespace")
                ?? TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "endpoint")));
        }

        if (linkedServiceType.Equals("AzureDatabricks", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(
                AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "domain")
                ?? TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "workspaceUrl"))
                ?? TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "existingWorkspaceUrl")));
        }

        if (linkedServiceType.Equals("Snowflake", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(
                AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "account")
                ?? TryReadNestedScalar(typePropertiesElement, "connection", "host"));
        }

        if (linkedServiceType.Equals("SapTable", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("SapOpenHub", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("SapEcc", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("SapHana", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(
                AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "server")
                ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "messageServer")
                ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "applicationServer")
                ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "host"));
        }

        if (linkedServiceType.Equals("Oracle", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("OracleServiceCloud", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(
                AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "server")
                ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "host")
                ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "serviceName"));
        }

        if (linkedServiceType.Equals("FtpServer", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("Sftp", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("FileServer", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("Hdfs", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "host"));
        }

        if (linkedServiceType.Equals("RestService", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("HttpServer", StringComparison.OrdinalIgnoreCase)
            || linkedServiceType.Equals("Web", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(
                TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "url"))
                ?? TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "baseUrl")));
        }

        if (linkedServiceType.Equals("AmazonS3", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(
                TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "serviceEndpoint"))
                ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "bucketName"));
        }

        if (linkedServiceType.Equals("GoogleCloudStorage", StringComparison.OrdinalIgnoreCase))
        {
            return NormalizeHost(
                TryReadHostFromUrl(AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "serviceEndpoint"))
                ?? AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "bucketName"));
        }

        return null;
    }

    private static string? TryReadNestedScalar(JsonElement element, string objectPropertyName, string scalarPropertyName)
    {
        if (!element.TryGetProperty(objectPropertyName, out JsonElement nestedElement)
            || nestedElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        return AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(nestedElement, scalarPropertyName);
    }

    private static string? TryReadHostFromUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (IsArmResourceId(value))
        {
            return null;
        }

        if (!Uri.TryCreate(value.Trim(), UriKind.Absolute, out Uri? uri))
        {
            return NormalizeHost(value);
        }

        return NormalizeHost(uri.Host);
    }

    private static string? NormalizeHost(string? host)
    {
        if (string.IsNullOrWhiteSpace(host))
        {
            return null;
        }

        string trimmed = host.Trim().TrimEnd('.');

        if (trimmed.StartsWith("tcp:", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed[4..];
        }

        int commaIndex = trimmed.IndexOf(',');

        if (commaIndex >= 0)
        {
            trimmed = trimmed[..commaIndex];
        }

        if (trimmed.Length > MaxHostLength)
        {
            trimmed = trimmed[..MaxHostLength];
        }

        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed.ToLowerInvariant();
    }

    private static bool IsArmResourceId(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return value.TrimStart().StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase);
    }
}
