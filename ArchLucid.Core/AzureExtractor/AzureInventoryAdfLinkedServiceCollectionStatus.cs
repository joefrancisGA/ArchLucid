namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Per-row collection outcome for <c>adf-linked-services.json</c> companion entries.
/// </summary>
public static class AzureInventoryAdfLinkedServiceCollectionStatus
{
    public const string Succeeded = "Succeeded";

    public const string Forbidden = "Forbidden";

    public const string NotFound = "NotFound";

    public const string Throttled = "Throttled";

    public const string MalformedPayload = "MalformedPayload";

    public const string UnsupportedConnector = "UnsupportedConnector";

    public const string TargetUnresolved = "TargetUnresolved";

    public static bool IsValid(string? collectionStatus)
    {
        if (string.IsNullOrWhiteSpace(collectionStatus))
        {
            return false;
        }

        return collectionStatus.Equals(Succeeded, StringComparison.OrdinalIgnoreCase)
               || collectionStatus.Equals(Forbidden, StringComparison.OrdinalIgnoreCase)
               || collectionStatus.Equals(NotFound, StringComparison.OrdinalIgnoreCase)
               || collectionStatus.Equals(Throttled, StringComparison.OrdinalIgnoreCase)
               || collectionStatus.Equals(MalformedPayload, StringComparison.OrdinalIgnoreCase)
               || collectionStatus.Equals(UnsupportedConnector, StringComparison.OrdinalIgnoreCase)
               || collectionStatus.Equals(TargetUnresolved, StringComparison.OrdinalIgnoreCase);
    }
}
