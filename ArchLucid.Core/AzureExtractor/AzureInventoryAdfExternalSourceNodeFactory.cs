using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Builds stable synthetic nodes for ADF linked services that do not resolve to an in-snapshot ARM resource.
/// </summary>
public static class AzureInventoryAdfExternalSourceNodeFactory
{
    public const string NodeKeyPrefix = "adf-external:";

    public const string ExternalSourcePropertyKey = "arm.externalSource";

    public const string ExternalSourcePropertyValue = "adf-linked-service";

    public const string ExternalLinkedServiceTypePropertyKey = "arm.externalLinkedServiceType";

    public const string ExternalTargetHostPropertyKey = "arm.externalTargetHost";

    public static string BuildNodeKey(string factoryResourceId, string linkedServiceName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(factoryResourceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(linkedServiceName);

        if (linkedServiceName.Equals("_collection_failed", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Collection failure rows cannot become external source nodes.", nameof(linkedServiceName));
        }

        string normalizedFactoryId = ArmResourceIdNormalizer.Normalize(factoryResourceId);

        return $"{NodeKeyPrefix}{normalizedFactoryId}|{linkedServiceName.Trim()}";
    }

    public static string BuildDisplayLabel(string? linkedServiceType, string? targetHost)
    {
        string type = string.IsNullOrWhiteSpace(linkedServiceType)
            ? "External source"
            : linkedServiceType.Trim();

        if (string.IsNullOrWhiteSpace(targetHost))
        {
            return type;
        }

        return $"{type} ({SanitizeHost(targetHost.Trim())})";
    }

    public static bool IsExternalSourceNodeId(string? nodeId)
    {
        return !string.IsNullOrWhiteSpace(nodeId)
            && nodeId.StartsWith(NodeKeyPrefix, StringComparison.OrdinalIgnoreCase);
    }

    public static bool TryParseNodeKey(
        string nodeKey,
        out string factoryResourceId,
        out string linkedServiceName)
    {
        factoryResourceId = string.Empty;
        linkedServiceName = string.Empty;

        if (!IsExternalSourceNodeId(nodeKey))
        {
            return false;
        }

        string remainder = nodeKey[NodeKeyPrefix.Length..];
        int separatorIndex = remainder.LastIndexOf('|');

        if (separatorIndex <= 0 || separatorIndex >= remainder.Length - 1)
        {
            return false;
        }

        factoryResourceId = remainder[..separatorIndex].Trim();
        linkedServiceName = remainder[(separatorIndex + 1)..].Trim();

        return factoryResourceId.Length > 0 && linkedServiceName.Length > 0;
    }

    public static bool ShouldMaterializeExternalTarget(AzureInventoryAdfLinkedServiceRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (row.LinkedServiceName.Equals("_collection_failed", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (row.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.Forbidden, StringComparison.OrdinalIgnoreCase)
            || row.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.NotFound, StringComparison.OrdinalIgnoreCase)
            || row.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.Throttled, StringComparison.OrdinalIgnoreCase)
            || row.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.MalformedPayload, StringComparison.OrdinalIgnoreCase)
            || row.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.UnsupportedConnector, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return row.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded, StringComparison.OrdinalIgnoreCase)
            || row.CollectionStatus.Equals(AzureInventoryAdfLinkedServiceCollectionStatus.TargetUnresolved, StringComparison.OrdinalIgnoreCase);
    }

    public static GraphNode CreateGraphNode(
        string nodeKey,
        string displayLabel,
        string? linkedServiceType,
        string? targetHost)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nodeKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(displayLabel);

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["arm.id"] = nodeKey,
            [ExternalSourcePropertyKey] = ExternalSourcePropertyValue,
        };

        if (!string.IsNullOrWhiteSpace(linkedServiceType))
        {
            properties[ExternalLinkedServiceTypePropertyKey] = linkedServiceType.Trim();
        }

        if (!string.IsNullOrWhiteSpace(targetHost))
        {
            properties[ExternalTargetHostPropertyKey] = SanitizeHost(targetHost.Trim());
        }

        return new GraphNode
        {
            NodeId = nodeKey,
            NodeType = "TopologyResource",
            Label = displayLabel,
            Category = "data",
            SourceType = "azure-inventory-adf-external-source",
            SourceId = nodeKey,
            Properties = properties,
        };
    }

    public static GraphNode CreateGraphNode(AzureInventoryAdfLinkedServiceRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        string nodeKey = BuildNodeKey(row.FactoryResourceId, row.LinkedServiceName);
        string displayLabel = BuildDisplayLabel(row.LinkedServiceType, row.TargetHost);

        return CreateGraphNode(nodeKey, displayLabel, row.LinkedServiceType, row.TargetHost);
    }

    public static bool TryResolveExternalTargetArmId(
        AzureInventoryAdfLinkedServiceRow row,
        out string externalNodeKey)
    {
        externalNodeKey = string.Empty;

        ArgumentNullException.ThrowIfNull(row);

        if (!ShouldMaterializeExternalTarget(row))
        {
            return false;
        }

        externalNodeKey = BuildNodeKey(row.FactoryResourceId, row.LinkedServiceName);

        return true;
    }

    private static string SanitizeHost(string host)
    {
        if (host.Length <= 120)
        {
            return host;
        }

        return host[..120];
    }
}
