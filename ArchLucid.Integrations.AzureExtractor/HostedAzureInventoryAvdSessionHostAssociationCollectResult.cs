using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureInventoryAvdSessionHostAssociationCollectResult
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
