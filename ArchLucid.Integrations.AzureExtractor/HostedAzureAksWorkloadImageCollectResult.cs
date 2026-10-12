namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureAksWorkloadImageCollectResult
{
    public IReadOnlyList<HostedAzureArmResourceRecord> EnrichedResources
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
