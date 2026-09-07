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
}
