using System.Collections.Concurrent;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Findings;

public sealed class InMemoryFindingVerificationReportRepository : IAppendOnlyFindingVerificationReportRepository
{
    private readonly ConcurrentDictionary<Guid, FindingVerificationReportRecord> _reportsById = new();

    public Task<FindingVerificationReportRecord> AppendAsync(
        FindingVerificationReportAppend append,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(append);

        Guid reportId = Guid.NewGuid();
        DateTime createdUtc = TimeProvider.System.UtcNowDateTime();
        string reportHash = FindingVerificationReportHashComputer.Compute(
            append.RunId,
            append.SourceManifestHash,
            append.SourceFindingsSnapshotId,
            append.VerificationFindingsSnapshotId,
            append.Results);

        IReadOnlyList<FindingVerificationResultRecord> results = append.Results
            .Select(result => new FindingVerificationResultRecord
            {
                ResultId = Guid.NewGuid(),
                ReportId = reportId,
                FindingId = result.FindingId,
                Status = result.Status,
                TraceText = result.TraceText,
            })
            .ToList();

        FindingVerificationReportRecord record = new()
        {
            ReportId = reportId,
            TenantId = append.TenantId,
            WorkspaceId = append.WorkspaceId,
            ScopeProjectId = append.ScopeProjectId,
            RunId = append.RunId,
            SourceManifestHash = append.SourceManifestHash,
            SourceFindingsSnapshotId = append.SourceFindingsSnapshotId,
            VerificationFindingsSnapshotId = append.VerificationFindingsSnapshotId,
            ReportHash = reportHash,
            TriggeredByUserId = append.TriggeredByUserId,
            CreatedUtc = createdUtc,
            Results = results,
        };

        _reportsById[reportId] = record;

        return Task.FromResult(record);
    }

    public Task<FindingVerificationReportRecord?> GetByIdAsync(
        ScopeContext scope,
        Guid reportId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!_reportsById.TryGetValue(reportId, out FindingVerificationReportRecord? record))
        {
            return Task.FromResult<FindingVerificationReportRecord?>(null);
        }

        if (record.TenantId != scope.TenantId
            || record.WorkspaceId != scope.WorkspaceId
            || record.ScopeProjectId != scope.ProjectId)
        {
            return Task.FromResult<FindingVerificationReportRecord?>(null);
        }

        return Task.FromResult<FindingVerificationReportRecord?>(record);
    }

    public Task<FindingVerificationReportRecord?> TryGetLatestByPackagePairAsync(
        ScopeContext scope,
        Guid runId,
        Guid sourceFindingsSnapshotId,
        Guid? verificationFindingsSnapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        FindingVerificationReportRecord? latest = _reportsById.Values
            .Where(record =>
                record.TenantId == scope.TenantId
                && record.WorkspaceId == scope.WorkspaceId
                && record.ScopeProjectId == scope.ProjectId
                && record.RunId == runId
                && record.SourceFindingsSnapshotId == sourceFindingsSnapshotId
                && record.VerificationFindingsSnapshotId == verificationFindingsSnapshotId)
            .OrderByDescending(record => record.CreatedUtc)
            .FirstOrDefault();

        return Task.FromResult(latest);
    }
}
