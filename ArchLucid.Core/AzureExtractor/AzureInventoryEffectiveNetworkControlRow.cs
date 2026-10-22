namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     One row in optional <c>effective-network-controls.json</c> (IE-RF-10).
/// </summary>
public sealed class AzureInventoryEffectiveNetworkControlRow
{
    public string NicResourceId
    {
        get;
        init;
    } = string.Empty;

    public string Kind
    {
        get;
        init;
    } = string.Empty;

    public string CollectionStatus
    {
        get;
        init;
    } = AzureInventoryEffectiveNetworkControlCollectionStatus.Skipped;

    public string? EffectiveResourceId
    {
        get;
        init;
    }

    public string? PayloadHashSha256
    {
        get;
        init;
    }
}
