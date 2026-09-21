namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Stable completeness warning codes for ADF linked-service collection (IE-RF extension).
/// </summary>
public static class AzureInventoryAdfLinkedServiceCompletenessWarningCodes
{
    public const string MissingFile = "adf-linked-services-missing";

    public const string FactoryCollectionFailedPrefix = "adf-factory-collection-failed:";

    public const string TargetUnresolvedPrefix = "adf-target-unresolved:";

    public const string UnsupportedConnectorPrefix = "adf-unsupported-connector:";
}
