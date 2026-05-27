using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class SqlFindingReviewTrailRepository(ISqlConnectionFactory connectionFactory) : IFindingReviewTrailRepository
{
    public async Task AppendAsync(FindingReviewEventRecord reviewEvent, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(reviewEvent);

        const string sql = """
                           INSERT INTO dbo.FindingReviewEvents
                           (EventId, TenantId, WorkspaceId, ProjectId, FindingId, ReviewerUserId, Action, Notes,
                            OccurredAtUtc, RunId, Disposition, RevisitDueUtc, EvidenceRequestText)
                           VALUES
                           (@EventId, @TenantId, @WorkspaceId, @ProjectId, @FindingId, @ReviewerUserId, @Action, @Notes,
                            @OccurredAtUtc, @RunId, @Disposition, @RevisitDueUtc, @EvidenceRequestText);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    reviewEvent.EventId,
                    reviewEvent.TenantId,
                    reviewEvent.WorkspaceId,
                    reviewEvent.ProjectId,
                    reviewEvent.FindingId,
                    reviewEvent.ReviewerUserId,
                    Action = reviewEvent.Action.ToString(),
                    reviewEvent.Notes,
                    reviewEvent.OccurredAtUtc,
                    reviewEvent.RunId,
                    Disposition = reviewEvent.Disposition?.ToString(),
                    RevisitDueUtc = reviewEvent.RevisitDueUtc?.UtcDateTime,
                    reviewEvent.EvidenceRequestText,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<FindingReviewEventRecord>> ListByFindingAsync(
        Guid tenantId,
        string findingId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("Finding id is required.", nameof(findingId));

        const string sql = """
                           SELECT EventId, TenantId, WorkspaceId, ProjectId, FindingId, ReviewerUserId, Action, Notes,
                                  OccurredAtUtc, RunId, Disposition, RevisitDueUtc, EvidenceRequestText
                           FROM dbo.FindingReviewEvents
                           WHERE TenantId = @TenantId AND FindingId = @FindingId
                           ORDER BY OccurredAtUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<FindingReviewEventRow> rows = await conn.QueryAsync<FindingReviewEventRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, FindingId = findingId.Trim() }, cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<FindingReviewEventRecord>> ListSinceUtcAsync(
        Guid tenantId,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT EventId, TenantId, WorkspaceId, ProjectId, FindingId, ReviewerUserId, Action, Notes,
                                  OccurredAtUtc, RunId, Disposition, RevisitDueUtc, EvidenceRequestText
                           FROM dbo.FindingReviewEvents
                           WHERE TenantId = @TenantId AND OccurredAtUtc >= @SinceUtc
                           ORDER BY OccurredAtUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<FindingReviewEventRow> rows = await conn.QueryAsync<FindingReviewEventRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, SinceUtc = sinceUtc }, cancellationToken: cancellationToken));

        return rows.Select(Map).ToList();
    }

    private static FindingReviewEventRecord Map(FindingReviewEventRow row)
    {
        Enum.TryParse(row.Action, true, out FindingReviewAction action);
        FindingDisposition? disposition = null;

        if (!string.IsNullOrWhiteSpace(row.Disposition)
            && Enum.TryParse(row.Disposition, true, out FindingDisposition parsed))
            disposition = parsed;

        return new FindingReviewEventRecord
        {
            EventId = row.EventId,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            FindingId = row.FindingId,
            ReviewerUserId = row.ReviewerUserId,
            Action = action,
            Notes = row.Notes,
            OccurredAtUtc = row.OccurredAtUtc,
            RunId = row.RunId,
            Disposition = disposition,
            RevisitDueUtc = row.RevisitDueUtc is null ? null : new DateTimeOffset(row.RevisitDueUtc.Value, TimeSpan.Zero),
            EvidenceRequestText = row.EvidenceRequestText,
        };
    }

    private sealed class FindingReviewEventRow
    {
        public Guid EventId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid ProjectId
        {
            get;
            init;
        }

        public string FindingId
        {
            get;
            init;
        } = string.Empty;

        public string ReviewerUserId
        {
            get;
            init;
        } = string.Empty;

        public string Action
        {
            get;
            init;
        } = string.Empty;

        public string? Notes
        {
            get;
            init;
        }

        public DateTimeOffset OccurredAtUtc
        {
            get;
            init;
        }

        public Guid? RunId
        {
            get;
            init;
        }

        public string? Disposition
        {
            get;
            init;
        }

        public DateTime? RevisitDueUtc
        {
            get;
            init;
        }

        public string? EvidenceRequestText
        {
            get;
            init;
        }
    }
}
