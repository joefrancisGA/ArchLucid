namespace ArchLucid.Core.AzureExtractor;

/// <summary>Normalized <c>recovery-services-protected-items.json</c> companion row (RSV-03).</summary>
public sealed class AzureInventoryRecoveryServicesProtectedItemRow
{
    public string VaultResourceId
    {
        get;
        init;
    } = string.Empty;

    public string ItemKind
    {
        get;
        init;
    } = string.Empty;

    public string SourceResourceId
    {
        get;
        init;
    } = string.Empty;

    public string? TargetRegion
    {
        get;
        init;
    }

    public string? TargetResourceId
    {
        get;
        init;
    }

    public string CollectionStatus
    {
        get;
        init;
    } = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded;

    public string? WarningCode
    {
        get;
        init;
    }
}
