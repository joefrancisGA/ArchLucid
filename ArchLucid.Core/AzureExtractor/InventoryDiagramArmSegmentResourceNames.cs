namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Reviewer-facing resource names for inventory diagram edges — never treat an ARM path tail or graph node id as a stored name.
/// </summary>
public static class InventoryDiagramArmSegmentResourceNames
{
    public const string ResourceNameNotStored = "Resource name was not stored.";

    public const string BackendNameNotStored = "Backend name was not stored.";

    public const string EndpointNameNotStored = "Endpoint name was not stored";

    public const string RemoteNetworkNameNotStored = "Remote network name was not stored.";

    public static string ResolveRelationshipName(
        string? armResourceId,
        string? storedLabel,
        string? nodeId,
        string notStoredLabel)
    {
        if (TryResolveStoredName(armResourceId, storedLabel, nodeId, out string? storedName))
        {
            return storedName!;
        }

        return notStoredLabel;
    }

    public static bool TryResolveStoredName(
        string? armResourceId,
        string? storedLabel,
        string? nodeId,
        out string? storedName)
    {
        storedName = null;

        if (string.IsNullOrWhiteSpace(storedLabel))
        {
            return false;
        }

        string trimmed = storedLabel.Trim();

        if (trimmed.Length == 0)
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(nodeId)
            && string.Equals(trimmed, nodeId.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (LooksLikeArmResourceId(trimmed))
        {
            return false;
        }

        storedName = trimmed;

        return true;
    }

    public static string ReadArmLastSegmentOrNotStored(string? armResourceId, string notStoredLabel)
    {
        if (string.IsNullOrWhiteSpace(armResourceId))
        {
            return notStoredLabel;
        }

        string? segment = ReadArmLastSegment(armResourceId);

        return string.IsNullOrWhiteSpace(segment) ? notStoredLabel : segment!;
    }

    internal static string? ReadArmLastSegment(string armResourceId)
    {
        int lastSlash = armResourceId.LastIndexOf('/');

        if (lastSlash < 0 || lastSlash >= armResourceId.Length - 1)
        {
            return null;
        }

        string segment = armResourceId[(lastSlash + 1)..].Trim();

        return segment.Length == 0 ? null : segment;
    }

    private static bool LooksLikeArmResourceId(string value)
    {
        string trimmed = value.Trim();

        return trimmed.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("subscriptions/", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("/providers/", StringComparison.OrdinalIgnoreCase);
    }
}
