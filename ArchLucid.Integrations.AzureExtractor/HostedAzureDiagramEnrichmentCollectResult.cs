using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Diagram enrichment companions collected for hosted Tier 2 packages (AX-DE-10–14).
/// </summary>
public sealed class HostedAzureDiagramEnrichmentCollectResult
{
    public IReadOnlyList<AzureInventoryEventGridSubscriptionRow> EventGridSubscriptions
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryLogicAppConnectionRow> LogicAppConnections
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryMessagingAssociationRow> MessagingAssociations
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryPaasChildAssociationRow> PaasChildAssociations
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
