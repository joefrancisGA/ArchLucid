using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Models;
using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class SqlFindingReviewTrailRepository(ISqlConnectionFactory connectionFactory) : IFindingReviewTrailRepository
{
    public async Task AppendAsync(FindingReviewEventRecord reviewEvent, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(reviewEvent);

        const string sql = """
            INSERT INTO dbo.FindingReviewEvents
            (EventId, TenantId, WorkspaceId, ProjectId, FindingId, ReviewerUserId, Action, Notes, OccurredAtUtc, RunId)
            VALUES
            (@EventId, @TenantId, @WorkspaceId, @ProjectId, @FindingId, @ReviewerUserId, @Action, @Notes, @OccurredAtUtc, @RunId);
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
                    reviewEvent.Action,
                    reviewEvent.Notes,
                    reviewEvent.OccurredAtUtc,
                    reviewEvent.RunId,
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
            SELECT EventId, TenantId, WorkspaceId, ProjectId, FindingId, ReviewerUserId, Action, Notes, OccurredAtUtc, RunId
            FROM dbo.FindingReviewEvents
            WHERE TenantId = @TenantId AND FindingId = @FindingId
            ORDER BY OccurredAtUtc DESC;
            """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<FindingReviewEventRecord> rows = await conn.QueryAsync<FindingReviewEventRecord>(
            new CommandDefinition(sql, new { TenantId = tenantId, FindingId = findingId.Trim() }, cancellationToken: cancellationToken));

        return rows.ToList();
    }
}
