using ArchLucid.Contracts.Billing;

namespace ArchLucid.Application.Billing;

public interface ITenantLlmCostTopRunRanker
{
    Task<IReadOnlyList<LlmCostTopRunRowResponse>> RankAsync(
        int maxRunsToScan,
        int take,
        CancellationToken cancellationToken = default);
}
