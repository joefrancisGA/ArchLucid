using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureInventoryServiceConnectorCollectResult
{
    public IReadOnlyList<AzureInventoryServiceConnectorLinkRow> Links
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
