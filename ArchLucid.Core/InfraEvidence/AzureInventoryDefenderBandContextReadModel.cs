using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Core.InfraEvidence;

public sealed class AzureInventoryDefenderBandContextReadModel
{
    public string? SubscriptionId
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryDefenderSummaryReadModel> DefenderSummaries
    {
        get;
        init;
    } = [];
}
