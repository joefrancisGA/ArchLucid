namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses Event Hub namespace and child hub ARM ids for diagram endpoint retargeting (MB-EH).
/// </summary>
public static class AzureInventoryEventHubArmPath
{
    private const string EventHubsSegment = "/eventhubs/";

    public static bool TryGetEventHubName(string armResourceId, out string hubName)
    {
        hubName = string.Empty;

        if (string.IsNullOrWhiteSpace(armResourceId))
        {
            return false;
        }

        string normalized = armResourceId.Trim();
        int segmentIndex = normalized.IndexOf(EventHubsSegment, StringComparison.OrdinalIgnoreCase);

        if (segmentIndex < 0)
        {
            return false;
        }

        string remainder = normalized[(segmentIndex + EventHubsSegment.Length)..];
        int slashIndex = remainder.IndexOf('/');

        hubName = slashIndex < 0 ? remainder : remainder[..slashIndex];

        return !string.IsNullOrWhiteSpace(hubName);
    }

    public static bool TryGetNamespaceId(string armResourceId, out string namespaceId)
    {
        namespaceId = string.Empty;

        if (!TryGetEventHubName(armResourceId, out _))
        {
            return false;
        }

        string normalized = armResourceId.Trim();
        int segmentIndex = normalized.IndexOf(EventHubsSegment, StringComparison.OrdinalIgnoreCase);

        namespaceId = normalized[..segmentIndex];

        return !string.IsNullOrWhiteSpace(namespaceId);
    }

    public static bool IsEventHubNamespaceOrChild(string armResourceId)
    {
        if (string.IsNullOrWhiteSpace(armResourceId))
        {
            return false;
        }

        return armResourceId.Contains("/providers/Microsoft.EventHub/namespaces/", StringComparison.OrdinalIgnoreCase);
    }
}
