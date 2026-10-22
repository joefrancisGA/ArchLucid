using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureInventoryEventGridSubscriptionCollectResult
{
    public IReadOnlyList<AzureInventoryEventGridSubscriptionRow> Subscriptions
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
