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
        Guid? projectId,
        int maxRows,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (maxRows <= 0)
            throw new ArgumentOutOfRangeException(nameof(maxRows));

        string projectFilter = projectId.HasValue ? " AND fr.ProjectId = @ProjectId" : string.Empty;

        string sql = $"""
                      ;WITH latestDisposition AS (
                          SELECT FindingId, Disposition, RevisitDueUtc, EvidenceRequestText, OccurredAtUtc, ReviewerUserId,
                                 ROW_NUMBER() OVER (PARTITION BY FindingId ORDER BY OccurredAtUtc DESC) AS rn
                          FROM dbo.FindingReviewEvents
                          WHERE TenantId = @TenantId AND Disposition IS NOT NULL
                      )
                      SELECT TOP (@MaxRows)
                             fr.FindingId,
                             TRY_CONVERT(uniqueidentifier, fr.RunIdRef) AS RunId,
                             fr.Title,
                             fr.Severity,
                             fr.Category,
                             fs.CreatedUtc,
                             ld.Disposition,
                             ld.RevisitDueUtc,
                             ld.EvidenceRequestText,
                             ld.OccurredAtUtc AS LastReviewedUtc,
                             ld.ReviewerUserId AS OwnerUserId,
                             re.ExpiresAtUtc AS WaiverExpiresAtUtc
                      FROM dbo.FindingRecords AS fr
                      INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                      LEFT JOIN latestDisposition AS ld ON ld.FindingId = fr.FindingId AND ld.rn = 1
                      LEFT JOIN dbo.RiskExceptions AS re
                          ON re.TenantId = fr.TenantId AND re.FindingId = fr.FindingId AND re.Status = N'Active'
                      WHERE fr.TenantId = @TenantId{projectFilter}
                      ORDER BY fs.CreatedUtc DESC;
                      """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<RiskRegisterRow> rows = await conn.QueryAsync<RiskRegisterRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ProjectId = projectId, MaxRows = maxRows },
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

            bool isStale = disposition == FindingDisposition.Deferred
                           && revisit.HasValue
                           && revisit.Value <= now;

            if (waiverExpires.HasValue && waiverExpires.Value <= now)
                isStale = true;

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
                    Title = row.Title,
                    Severity = row.Severity,
                    Category = row.Category,
                    StatusLabel = statusLabel,
                    OwnerUserId = row.OwnerUserId,
                    LatestDisposition = disposition,
                    RevisitDueUtc = revisit,
                    LastReviewedUtc = lastReviewed,
                    AgingDays = agingDays,
                    WaiverExpiresAtUtc = waiverExpires,
                    IsStale = isStale,
                    EvidenceHref = evidenceHref,
                });
        }

        return result;
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

        public DateTime? WaiverExpiresAtUtc
        {
            get;
            init;
        }
    }
}
