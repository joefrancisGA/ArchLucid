using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Findings;

public interface IAppendOnlyFindingVerificationReportRepository
{
    Task<FindingVerificationReportRecord> AppendAsync(
        FindingVerificationReportAppend append,
        CancellationToken cancellationToken = default);

    Task<FindingVerificationReportRecord?> GetByIdAsync(
        ScopeContext scope,
        Guid reportId,
        CancellationToken cancellationToken = default);

    Task<FindingVerificationReportRecord?> TryGetLatestByPackagePairAsync(
        ScopeContext scope,
        Guid runId,
        Guid sourceFindingsSnapshotId,
        Guid? verificationFindingsSnapshotId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<FindingVerificationReportRecord>> ListByRunIdAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<EngineVerificationConfirmedRateRow>> ListConfirmedRatesByEngineTypeAsync(
        ScopeContext scope,
        DateTime fromUtc,
        DateTime toUtcExclusive,
        int minSample,
        CancellationToken cancellationToken = default);
}
