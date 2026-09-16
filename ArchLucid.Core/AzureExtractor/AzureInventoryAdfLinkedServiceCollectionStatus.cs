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
}
