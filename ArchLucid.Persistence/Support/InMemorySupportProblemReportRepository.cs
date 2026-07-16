using System.Collections.Concurrent;

using ArchLucid.Core.Support;

namespace ArchLucid.Persistence.Support;

public sealed class InMemorySupportProblemReportRepository : ISupportProblemReportRepository
{
    private readonly ConcurrentDictionary<Guid, SupportProblemReportRecord> _byId = new();

    public Task<SupportProblemReportRecord> InsertAsync(
        SupportProblemReportInsert insert,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        ArgumentNullException.ThrowIfNull(insert);

        DateTimeOffset createdUtc = TimeProvider.System.GetUtcNow();
        SupportProblemReportRecord row = new()
        {
            Id = insert.Id != Guid.Empty ? insert.Id : Guid.NewGuid(),
            TenantId = insert.TenantId,
            WorkspaceId = insert.WorkspaceId,
            ProjectId = insert.ProjectId,
            SubmittedByActorId = insert.SubmittedByActorId,
            ContextJson = insert.ContextJson,
            OperatorNote = insert.OperatorNote,
            CorrelationId = insert.CorrelationId,
            ClientRequestId = insert.ClientRequestId,
            SupportBundleBlobPath = insert.SupportBundleBlobPath,
            Status = SupportProblemReportStatus.Open,
            CreatedUtc = createdUtc
        };

        _byId[row.Id] = row;

        return Task.FromResult(row);
    }

    public Task<SupportProblemReportRecord?> GetByIdAsync(
        Guid tenantId,
        Guid reportId,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(reportId, out SupportProblemReportRecord? row))
        {
            return Task.FromResult<SupportProblemReportRecord?>(null);
        }

        if (row.TenantId != tenantId)
        {
            return Task.FromResult<SupportProblemReportRecord?>(null);
        }

        return Task.FromResult<SupportProblemReportRecord?>(row);
    }

    public Task<SupportProblemReportRecord?> UpdateSupportBundleBlobPathAsync(
        Guid tenantId,
        Guid reportId,
        string supportBundleBlobPath,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        ArgumentException.ThrowIfNullOrWhiteSpace(supportBundleBlobPath);

        if (!_byId.TryGetValue(reportId, out SupportProblemReportRecord? row) || row.TenantId != tenantId)
        {
            return Task.FromResult<SupportProblemReportRecord?>(null);
        }

        SupportProblemReportRecord updated = new()
        {
            Id = row.Id,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            SubmittedByActorId = row.SubmittedByActorId,
            ContextJson = row.ContextJson,
            OperatorNote = row.OperatorNote,
            CorrelationId = row.CorrelationId,
            ClientRequestId = row.ClientRequestId,
            SupportBundleBlobPath = supportBundleBlobPath,
            Status = row.Status,
            CreatedUtc = row.CreatedUtc
        };

        _byId[reportId] = updated;

        return Task.FromResult<SupportProblemReportRecord?>(updated);
    }
}
