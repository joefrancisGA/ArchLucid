using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureInventoryPaasChildCollectResult
{
    public IReadOnlyList<AzureInventoryPaasChildAssociationRow> Associations
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
