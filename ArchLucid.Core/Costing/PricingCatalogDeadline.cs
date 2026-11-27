using ArchLucid.Core.Http;

namespace ArchLucid.Core.Costing;

internal static class PricingCatalogDeadline
{
    private static readonly TimeSpan MaxBudget = TimeSpan.FromMinutes(5);

    // Use the stricter of the configured request limit and the whole-probe ceiling.
    public static OutboundOperationDeadline Start(HttpClient client, TimeProvider clock, CancellationToken caller)
    {
        TimeSpan budget = client.Timeout > TimeSpan.Zero && client.Timeout < MaxBudget ? client.Timeout : MaxBudget;

        return new OutboundOperationDeadline(clock, budget, caller);
    }
}
