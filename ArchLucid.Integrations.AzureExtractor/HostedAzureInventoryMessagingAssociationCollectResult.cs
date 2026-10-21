using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureInventoryMessagingAssociationCollectResult
{
    public IReadOnlyList<AzureInventoryMessagingAssociationRow> Associations
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
