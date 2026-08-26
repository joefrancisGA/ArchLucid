using ArchLucid.Core.Governance;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.Governance;

/// <summary>SQL projection for the architecture risk register (TB-057).</summary>
public sealed class ArchitectureRiskRegisterReader(ISqlConnectionFactory connectionFactory)
    : IArchitectureRiskRegisterQuery
{
    public async Task<IReadOnlyList<ArchitectureRiskRegisterEntry>> ListAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        int maxRows,
        ArchitectureRiskRegisterListOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (workspaceId == Guid.Empty)
            throw new ArgumentException("Workspace id is required.", nameof(workspaceId));

        if (maxRows <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxRows));

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
                      SELECT TOP (@MaxRows)
                             fr.FindingId,
                             TRY_CONVERT(uniqueidentifier, fr.RunIdRef) AS RunId,
                             runs.GoldenManifestId AS ManifestId,
                             fr.Title,
                             fr.Severity,
                             fr.Category,
                             fr.HumanReviewStatus,
                             fs.CreatedUtc,
                             fr.AssignedToUserId,
                             fr.RemediationDueUtc,
                             ld.Disposition,
                             ld.RevisitDueUtc,
                             ld.EvidenceRequestText,
                             ld.OccurredAtUtc AS LastReviewedUtc,
                             ld.ReviewerUserId AS OwnerUserId,
                             re.ExpiresAtUtc AS WaiverExpiresAtUtc,
                             itsmAgg.LinkedTickets AS ItsmLinkedTicketsSummary,
                             NULLIF(LTRIM(RTRIM(ar.SystemName)), N'') AS SystemName,
                             COALESCE(
                                 NULLIF(LTRIM(RTRIM(resourceProp.PropertyValue)), N''),
                                 NULLIF(LTRIM(RTRIM(JSON_VALUE(fr.PayloadJson, '$.resourceId'))), N''),
                                 NULLIF(LTRIM(RTRIM(JSON_VALUE(fr.PayloadJson, '$.affectedResourceId'))), N'')) AS ResourceId
                      FROM dbo.FindingRecords AS fr
                      INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                      LEFT JOIN dbo.Runs AS runs ON runs.RunId = TRY_CONVERT(uniqueidentifier, fr.RunIdRef)
                      LEFT JOIN dbo.ArchitectureRequests AS ar ON ar.RequestId = runs.ArchitectureRequestId
                      OUTER APPLY (
                          SELECT TOP (1) fp.PropertyValue
                          FROM dbo.FindingProperties AS fp
                          WHERE fp.FindingRecordId = fr.FindingRecordId
                            AND fp.PropertyKey IN (N'resourceId', N'affectedResourceId', N'ResourceId', N'AffectedResourceId')
                          ORDER BY fp.PropertySortOrder
                      ) AS resourceProp
                      LEFT JOIN latestDisposition AS ld ON ld.FindingId = fr.FindingId AND ld.rn = 1
                      LEFT JOIN dbo.RiskExceptions AS re
                          ON re.TenantId = fr.TenantId
                         AND re.WorkspaceId = fr.WorkspaceId
                         AND re.FindingId = fr.FindingId
                         AND re.Status = N'Active'
                      OUTER APPLY (
                          SELECT STRING_AGG(CONCAT(itsm.Provider, N':', itsm.ExternalKey), N'; ')
                              WITHIN GROUP (ORDER BY itsm.CreatedUtc) AS LinkedTickets
                          FROM dbo.ItsmFindingCorrelations AS itsm
                          WHERE itsm.TenantId = fr.TenantId AND itsm.FindingId = fr.FindingId
                      ) AS itsmAgg
                      WHERE fr.TenantId = @TenantId AND fr.WorkspaceId = @WorkspaceId{projectFilter}{assigneeFilter}{openFindingsFilter}
                      ORDER BY fs.CreatedUtc DESC;
                      """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RiskRegisterRow> rows = await conn.QueryAsync<RiskRegisterRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    MaxRows = maxRows,
                    AssignedToUserIdsLower = ResolveAssignedToUserIdsLower(options),
                },
                cancellationToken: cancellationToken));

        DateTimeOffset now = TimeProvider.System.UtcNowDateTime();
        List<ArchitectureRiskRegisterEntry> result = [];

        foreach (RiskRegisterRow row in rows)
        {
            FindingDisposition? disposition = ParseDisposition(row.Disposition);
            DateTimeOffset created = new DateTimeOffset(DateTime.SpecifyKind(row.CreatedUtc, DateTimeKind.Utc));
            int agingDays = Math.Max(0, (int)(now - created).TotalDays);
            DateTimeOffset? revisit = row.RevisitDueUtc is null
                ? null
                : new DateTimeOffset(DateTime.SpecifyKind(row.RevisitDueUtc.Value, DateTimeKind.Utc));
            DateTimeOffset? lastReviewed = row.LastReviewedUtc is null
                ? null
                : new DateTimeOffset(DateTime.SpecifyKind(row.LastReviewedUtc.Value, DateTimeKind.Utc));
            DateTimeOffset? waiverExpires = row.WaiverExpiresAtUtc is null
                ? null
                : new DateTimeOffset(DateTime.SpecifyKind(row.WaiverExpiresAtUtc.Value, DateTimeKind.Utc));

            bool isStale = ArchitectureRiskRegisterStaleEvaluator.IsStale(
                disposition,
                revisit,
                waiverExpires,
                now);

            string statusLabel = BuildStatusLabel(disposition, waiverExpires, isStale);
            string runHex = row.RunId?.ToString("N") ?? string.Empty;
            string evidenceHref = string.IsNullOrEmpty(runHex)
                ? string.Empty
                : $"/reviews/{runHex}/findings/{Uri.EscapeDataString(row.FindingId)}";

            result.Add(
                new ArchitectureRiskRegisterEntry
                {
                    FindingId = row.FindingId,
                    RunId = row.RunId,
                    ManifestId = row.ManifestId,
                    Title = row.Title,
                    Severity = row.Severity,
                    Category = row.Category,
                    StatusLabel = statusLabel,
                    OwnerUserId = row.OwnerUserId,
                    AssignedToUserId = row.AssignedToUserId,
                    LatestDisposition = disposition,
                    RevisitDueUtc = revisit,
                    RemediationDueUtc = row.RemediationDueUtc is null
                        ? null
                        : new DateTimeOffset(DateTime.SpecifyKind(row.RemediationDueUtc.Value, DateTimeKind.Utc)),
                    LastReviewedUtc = lastReviewed,
                    AgingDays = agingDays,
                    WaiverExpiresAtUtc = waiverExpires,
                    IsStale = isStale,
                    EvidenceHref = evidenceHref,
                    HumanReviewStatus = ArchitectureRiskRegisterHumanReviewLabel.ParseOrDefault(row.HumanReviewStatus),
                    ItsmLinkedTicketsSummary = row.ItsmLinkedTicketsSummary,
                    SystemName = row.SystemName,
                    ResourceId = row.ResourceId,
                });
        }

        return result;
    }

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
        if (options?.AssignedToUserIds is not { Count: > 0 })
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

    private static FindingDisposition? ParseDisposition(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        return Enum.TryParse(raw, true, out FindingDisposition disposition) ? disposition : null;
    }

    private static string BuildStatusLabel(
        FindingDisposition? disposition,
        DateTimeOffset? waiverExpires,
        bool isStale)
    {
        if (isStale)
            return "Stale — decision needed";

        if (waiverExpires.HasValue)
            return $"Waived until {waiverExpires.Value:u}";

        if (disposition is null)
            return "Open — not dispositioned";

        return disposition.Value.ToString();
    }

    private sealed class RiskRegisterRow
    {
        public string FindingId
        {
            get;
            init;
        } = string.Empty;

        public Guid? RunId
        {
            get;
            init;
        }

        public Guid? ManifestId
        {
            get;
            init;
        }

        public string Title
        {
            get;
            init;
        } = string.Empty;

        public string Severity
        {
            get;
            init;
        } = string.Empty;

        public string Category
        {
            get;
            init;
        } = string.Empty;

        public DateTime CreatedUtc
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

        public DateTime? LastReviewedUtc
        {
            get;
            init;
        }

        public string? OwnerUserId
        {
            get;
            init;
        }

        public string? AssignedToUserId
        {
            get;
            init;
        }

        public DateTime? RemediationDueUtc
        {
            get;
            init;
        }

        public DateTime? WaiverExpiresAtUtc
        {
            get;
            init;
        }

        public string? HumanReviewStatus
        {
            get;
            init;
        }

        public string? ItsmLinkedTicketsSummary
        {
            get;
            init;
        }

        public string? SystemName
        {
            get;
            init;
        }

        public string? ResourceId
        {
            get;
            init;
        }
    }
}
