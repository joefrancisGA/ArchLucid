namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Static Web App backend and Fabric workspace association collection outcome (NR-40 / NR-42).
/// </summary>
public sealed class HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult
{
    public IReadOnlyList<HostedAzureArmNetworkAssociationRecord> Associations
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> CollectionWarnings
    {
        get;
        init;
    } = [];
}
