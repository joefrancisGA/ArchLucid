using ArchLucid.Contracts.Governance;

using Dapper;

namespace ArchLucid.Persistence.Governance;

public sealed partial class ArchitectureRiskRegisterReader
{
    public async Task<int> CountAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        ArchitectureRiskRegisterListOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (workspaceId == Guid.Empty)
            throw new ArgumentException("Workspace id is required.", nameof(workspaceId));

        string projectFilter = projectId.HasValue ? " AND fr.ProjectId = @ProjectId" : string.Empty;
        string assigneeFilter = BuildAssigneeFilter(options);
        string openFindingsFilter = BuildOpenFindingsFilter(options);

        string sql = $"""
                      ;WITH latestDisposition AS (
                          SELECT FindingId, Disposition, RevisitDueUtc, EvidenceRequestText, OccurredAtUtc, ReviewerUserId,
                                 ROW_NUMBER() OVER (PARTITION BY FindingId ORDER BY OccurredAtUtc DESC) AS rn
                          FROM dbo.FindingReviewEvents
                          WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND Disposition IS NOT NULL
                      )
                      SELECT COUNT(1)
                      FROM dbo.FindingRecords AS fr
                      INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                      LEFT JOIN latestDisposition AS ld ON ld.FindingId = fr.FindingId AND ld.rn = 1
                      WHERE fr.TenantId = @TenantId AND fr.WorkspaceId = @WorkspaceId{projectFilter}{assigneeFilter}{openFindingsFilter};
                      """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int count = await conn.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    AssignedToUserIdsLower = ResolveAssignedToUserIdsLower(options),
                },
                cancellationToken: cancellationToken));

        return count;
    }

    private static string BuildAssigneeFilter(ArchitectureRiskRegisterListOptions? options)
    {
        if (ResolveAssignedToUserIdsLower(options) is not { Count: > 0 })
            return string.Empty;

        return """
               
                         AND fr.AssignedToUserId IS NOT NULL
                         AND LOWER(LTRIM(RTRIM(fr.AssignedToUserId))) IN @AssignedToUserIdsLower
               """;
    }

    private static string BuildOpenFindingsFilter(ArchitectureRiskRegisterListOptions? options)
    {
        if (options?.OpenFindingsOnly != true)
            return string.Empty;

        return """
               
                         AND (ld.Disposition IS NULL OR ld.Disposition NOT IN (N'Remediated', N'RejectedAsNotApplicable'))
               """;
    }

    private static IReadOnlyList<string> ResolveAssignedToUserIdsLower(ArchitectureRiskRegisterListOptions? options)
    {
        if (options?.AssignedToUserIds is not { Count: > 0 } identities)
            return [];

        return identities
            .Where(static identity => !string.IsNullOrWhiteSpace(identity))
            .Select(static identity => identity.Trim().ToLowerInvariant())
            .Distinct(StringComparer.Ordinal)
            .ToList();
    }
}
