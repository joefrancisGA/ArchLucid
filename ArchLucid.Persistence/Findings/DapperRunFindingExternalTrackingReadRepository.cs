using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Findings;

/// <summary>SQL batch projection for run findings ITSM + disposition export fields (TB-386).</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; covered via formatter and API integration tests.")]
public sealed class DapperRunFindingExternalTrackingReadRepository(ISqlConnectionFactory connectionFactory)
    : IRunFindingExternalTrackingReadRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<IReadOnlyDictionary<string, RunFindingExternalTrackingReadRow>> ListForFindingsAsync(
        Guid tenantId,
        Guid? findingsSnapshotId,
        IReadOnlyList<string> findingIds,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        ArgumentNullException.ThrowIfNull(findingIds);

        if (findingIds.Count == 0)
            return new Dictionary<string, RunFindingExternalTrackingReadRow>(StringComparer.Ordinal);

        string[] normalizedIds = findingIds
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        if (normalizedIds.Length == 0)
            return new Dictionary<string, RunFindingExternalTrackingReadRow>(StringComparer.Ordinal);

        const string sql = """
                           ;WITH latestDisposition AS (
                               SELECT FindingId, Disposition, RevisitDueUtc,
                                      ROW_NUMBER() OVER (PARTITION BY FindingId ORDER BY OccurredAtUtc DESC) AS rn
                               FROM dbo.FindingReviewEvents
                               WHERE TenantId = @TenantId
                                 AND Disposition IS NOT NULL
                                 AND FindingId IN @FindingIds
                           ),
                           primaryItsm AS (
                               SELECT itsm.FindingId, itsm.Provider, itsm.ExternalKey, itsm.ExternalSysId,
                                      ROW_NUMBER() OVER (PARTITION BY itsm.FindingId ORDER BY itsm.CreatedUtc) AS rn
                               FROM dbo.ItsmFindingCorrelations AS itsm
                               WHERE itsm.TenantId = @TenantId
                                 AND itsm.FindingId IN @FindingIds
                           ),
                           itsmAgg AS (
                               SELECT itsm.FindingId,
                                      STRING_AGG(CONCAT(itsm.Provider, N':', itsm.ExternalKey), N'; ')
                                          WITHIN GROUP (ORDER BY itsm.CreatedUtc) AS LinkedTickets
                               FROM dbo.ItsmFindingCorrelations AS itsm
                               WHERE itsm.TenantId = @TenantId
                                 AND itsm.FindingId IN @FindingIds
                               GROUP BY itsm.FindingId
                           ),
                           findingStatus AS (
                               SELECT fr.FindingId, fr.HumanReviewStatus,
                                      ROW_NUMBER() OVER (
                                          PARTITION BY fr.FindingId
                                          ORDER BY CASE WHEN fr.FindingsSnapshotId = @FindingsSnapshotId THEN 0 ELSE 1 END,
                                                   fr.FindingRecordId DESC) AS rn
                               FROM dbo.FindingRecords AS fr
                               WHERE fr.TenantId = @TenantId
                                 AND fr.FindingId IN @FindingIds
                                 AND (@FindingsSnapshotId IS NULL OR fr.FindingsSnapshotId = @FindingsSnapshotId)
                           )
                           SELECT fs.FindingId,
                                  fs.HumanReviewStatus,
                                  ld.Disposition,
                                  ld.RevisitDueUtc,
                                  pi.Provider,
                                  pi.ExternalKey,
                                  pi.ExternalSysId,
                                  ia.LinkedTickets AS ItsmLinkedTicketsSummary
                           FROM findingStatus AS fs
                           LEFT JOIN latestDisposition AS ld ON ld.FindingId = fs.FindingId AND ld.rn = 1
                           LEFT JOIN primaryItsm AS pi ON pi.FindingId = fs.FindingId AND pi.rn = 1
                           LEFT JOIN itsmAgg AS ia ON ia.FindingId = fs.FindingId
                           WHERE fs.rn = 1;
                           """;

        await using SqlConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RunFindingExternalTrackingReadRow> rows = await connection.QueryAsync<RunFindingExternalTrackingReadRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    FindingsSnapshotId = findingsSnapshotId,
                    FindingIds = normalizedIds
                },
                cancellationToken: cancellationToken));

        Dictionary<string, RunFindingExternalTrackingReadRow> result =
            new(StringComparer.Ordinal);

        foreach (RunFindingExternalTrackingReadRow row in rows)
        {
            if (string.IsNullOrWhiteSpace(row.FindingId))
                continue;

            result[row.FindingId.Trim()] = row;
        }

        return result;
    }

    // Use the correlated finding RECORD, not the reusable logical finding ID, as ownership proof.
    internal const string AuthorizedRunTrackingSql = """
        ;WITH ownedCorrelations AS (
            SELECT itsm.FindingId, itsm.Provider, itsm.ExternalKey, itsm.ExternalSysId, itsm.CreatedUtc
            FROM dbo.ItsmFindingCorrelations AS itsm
            INNER JOIN dbo.FindingRecords AS fr ON fr.FindingRecordId = itsm.FindingRecordId
                AND fr.FindingId = itsm.FindingId
                AND fr.TenantId = itsm.TenantId
                AND fr.WorkspaceId = itsm.WorkspaceId
                AND fr.ProjectId = itsm.ProjectId
            INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
            INNER JOIN dbo.Runs AS r ON r.RunId = fs.RunId
            WHERE itsm.TenantId = @TenantId
              AND itsm.WorkspaceId = @WorkspaceId
              AND itsm.ProjectId = @ProjectId
              AND r.TenantId = @TenantId
              AND r.WorkspaceId = @WorkspaceId
              AND r.ScopeProjectId = @ProjectId
              AND r.RunId = @RunId
              AND r.ArchivedUtc IS NULL
              AND itsm.FindingId IN @FindingIds
        ), primaryItsm AS (
            SELECT FindingId, Provider, ExternalKey, ExternalSysId,
                ROW_NUMBER() OVER (PARTITION BY FindingId ORDER BY CreatedUtc, Provider, ExternalKey) AS rn
            FROM ownedCorrelations
        ), itsmAgg AS (
            SELECT FindingId, STRING_AGG(CONCAT(Provider, N':', ExternalKey), N'; ')
                WITHIN GROUP (ORDER BY CreatedUtc, Provider, ExternalKey) AS LinkedTickets
            FROM ownedCorrelations GROUP BY FindingId
        )
        SELECT p.FindingId, p.Provider, p.ExternalKey, p.ExternalSysId,
            a.LinkedTickets AS ItsmLinkedTicketsSummary
        FROM primaryItsm p
        INNER JOIN itsmAgg a ON a.FindingId = p.FindingId
        WHERE p.rn = 1;
        """;

    public async Task<IReadOnlyDictionary<string, RunFindingExternalTrackingReadRow>> ListForAuthorizedRunFindingsAsync(
        ScopeContext scope, Guid runId, IReadOnlyList<string> findingIds, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(findingIds);
        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty ||
            scope.ProjectId == Guid.Empty || runId == Guid.Empty)
            throw new ArgumentException("Complete scope and run identity are required.");

        string[] normalizedIds = findingIds.Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id.Trim()).Distinct(StringComparer.Ordinal).ToArray();
        Dictionary<string, RunFindingExternalTrackingReadRow> result = new(StringComparer.Ordinal);
        if (normalizedIds.Length == 0)
            return result;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<RunFindingExternalTrackingReadRow> rows = await connection.QueryAsync<RunFindingExternalTrackingReadRow>(
            new CommandDefinition(AuthorizedRunTrackingSql, new
            {
                scope.TenantId, scope.WorkspaceId, scope.ProjectId, RunId = runId, FindingIds = normalizedIds,
            }, cancellationToken: cancellationToken));

        foreach (RunFindingExternalTrackingReadRow row in rows)
        {
            if (!string.IsNullOrWhiteSpace(row.FindingId))
                result[row.FindingId.Trim()] = row;
        }
        return result;
    }

}
