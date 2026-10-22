using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Findings;

public interface IFindingInsightSignalRepository
{
    Task<FindingInsightSignalInsertResult> TryInsertAsync(
        FindingInsightSignalSubmission submission,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<FindingInsightSignalKind>> ListKindsForUserAsync(
        Guid tenantId,
        Guid runId,
        string findingId,
        string userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<EngineInsightNoveltyRateRow>> ListNoveltyRatesAsync(
        ScopeContext scope,
        DateTime fromUtc,
        DateTime toUtcExclusive,
        CancellationToken cancellationToken = default);
}
