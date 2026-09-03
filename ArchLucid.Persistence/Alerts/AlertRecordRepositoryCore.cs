using ArchLucid.Contracts.Alerts;
using ArchLucid.Core.Pagination;

namespace ArchLucid.Persistence.Alerts;

/// <summary>
///     Shared alert record repository rules for SQL and in-memory <see cref="IAlertRecordRepository" /> implementations.
/// </summary>
internal static class AlertRecordRepositoryCore
{
    public const int MaxListTake = 500;
    public const int MaxInMemoryEntries = 500;

    public const string SelectColumns = """
        AlertId, RuleId, TenantId, WorkspaceId, ProjectId,
        RunId, ComparedToRunId, RecommendationId,
        Title, Category, Severity, Status,
        TriggerValue, Description, CreatedUtc, LastUpdatedUtc,
        AcknowledgedByUserId, AcknowledgedByUserName, ResolutionComment,
        DeduplicationKey, IsArchived
        """;

    public const string InsertSql = """
        INSERT INTO dbo.AlertRecords
        (
            AlertId, RuleId, TenantId, WorkspaceId, ProjectId,
            RunId, ComparedToRunId, RecommendationId,
            Title, Category, Severity, Status,
            TriggerValue, Description, CreatedUtc, LastUpdatedUtc,
            AcknowledgedByUserId, AcknowledgedByUserName, ResolutionComment,
            DeduplicationKey, IsArchived
        )
        VALUES
        (
            @AlertId, @RuleId, @TenantId, @WorkspaceId, @ProjectId,
            @RunId, @ComparedToRunId, @RecommendationId,
            @Title, @Category, @Severity, @Status,
            @TriggerValue, @Description, @CreatedUtc, @LastUpdatedUtc,
            @AcknowledgedByUserId, @AcknowledgedByUserName, @ResolutionComment,
            @DeduplicationKey, @IsArchived
        );
        """;

    public const string UpdateStatusSql = """
        UPDATE dbo.AlertRecords
        SET
            Status = @Status,
            LastUpdatedUtc = @LastUpdatedUtc,
            AcknowledgedByUserId = @AcknowledgedByUserId,
            AcknowledgedByUserName = @AcknowledgedByUserName,
            ResolutionComment = @ResolutionComment
        WHERE AlertId = @AlertId;
        """;

    public const string ArchiveSql = """
        UPDATE dbo.AlertRecords
        SET IsArchived = 1,
            LastUpdatedUtc = @LastUpdatedUtc
        WHERE AlertId = @AlertId;
        """;

    public const string InboxSummarySql = """
        SELECT
            ISNULL(SUM(CASE WHEN Status = N'Open' THEN 1 ELSE 0 END), 0) AS OpenCount,
            ISNULL(SUM(CASE WHEN Status = N'Acknowledged' THEN 1 ELSE 0 END), 0) AS AcknowledgedCount,
            ISNULL(SUM(CASE WHEN Status = N'Resolved' THEN 1 ELSE 0 END), 0) AS ResolvedCount,
            ISNULL(SUM(CASE
                WHEN Status = N'Open' AND Severity IN (N'Critical', N'High') THEN 1
                ELSE 0
            END), 0) AS BlockingCount,
            MAX(COALESCE(LastUpdatedUtc, CreatedUtc)) AS LastEvaluatedUtc
        FROM dbo.AlertRecords
        WHERE TenantId = @TenantId
          AND WorkspaceId = @WorkspaceId
          AND ProjectId = @ProjectId
          AND IsArchived = 0;
        """;

    public static void ValidateAlertKeysetCursor(DateTime? cursorCreatedUtc, Guid? cursorAlertId)
    {
        if (cursorCreatedUtc.HasValue != cursorAlertId.HasValue)
            throw new ArgumentException();
    }

    public static int ClampListTake(int take) => Math.Clamp(take <= 0 ? 50 : take, 1, MaxListTake);

    public static int ClampPagedTake(int take) => Math.Clamp(take, 1, PaginationDefaults.MaxPageSize);

    public static int ClampKeysetTake(int take) => Math.Clamp(take, 1, PaginationDefaults.MaxPageSize);

    public static int ClampPagedSkip(int skip) => Math.Max(skip, 0);

    public static bool IsOpenForDedup(string? status) =>
        string.Equals(status, AlertStatus.Open, StringComparison.OrdinalIgnoreCase)
        || string.Equals(status, AlertStatus.Acknowledged, StringComparison.OrdinalIgnoreCase);

    public static bool IsBlockingSeverity(string? severity) =>
        string.Equals(severity, AlertSeverity.Critical, StringComparison.OrdinalIgnoreCase)
        || string.Equals(severity, AlertSeverity.High, StringComparison.OrdinalIgnoreCase);

    public static bool MatchesScope(AlertRecord alert, Guid tenantId, Guid workspaceId, Guid projectId)
    {
        ArgumentNullException.ThrowIfNull(alert);

        return alert.TenantId == tenantId
               && alert.WorkspaceId == workspaceId
               && alert.ProjectId == projectId;
    }

    public static bool MatchesOpenDeduplicationKey(
        AlertRecord alert,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string deduplicationKey)
    {
        ArgumentNullException.ThrowIfNull(alert);

        return MatchesScope(alert, tenantId, workspaceId, projectId)
               && !alert.IsArchived
               && string.Equals(alert.DeduplicationKey, deduplicationKey, StringComparison.Ordinal)
               && IsOpenForDedup(alert.Status);
    }

    public static AlertRecord? SelectOpenByDeduplicationKey(
        IEnumerable<AlertRecord> alerts,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string deduplicationKey)
    {
        ArgumentNullException.ThrowIfNull(alerts);

        return alerts
            .Where(alert => MatchesOpenDeduplicationKey(alert, tenantId, workspaceId, projectId, deduplicationKey))
            .OrderByDescending(alert => alert.CreatedUtc)
            .FirstOrDefault();
    }

    public static void ApplyArchive(AlertRecord alert, DateTime archivedUtc)
    {
        ArgumentNullException.ThrowIfNull(alert);

        alert.IsArchived = true;
        alert.LastUpdatedUtc = archivedUtc;
    }

    public static IEnumerable<AlertRecord> FilterInbox(
        IEnumerable<AlertRecord> alerts,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string? status,
        bool includeArchived)
    {
        ArgumentNullException.ThrowIfNull(alerts);

        return alerts
            .Where(alert => MatchesScope(alert, tenantId, workspaceId, projectId))
            .Where(alert => includeArchived || !alert.IsArchived)
            .Where(alert =>
                string.IsNullOrWhiteSpace(status)
                || string.Equals(alert.Status, status, StringComparison.OrdinalIgnoreCase));
    }

    public static IEnumerable<AlertRecord> FilterKeysetAfterCursor(
        IEnumerable<AlertRecord> alerts,
        DateTime cursorCreatedUtc,
        Guid cursorAlertId)
    {
        ArgumentNullException.ThrowIfNull(alerts);

        return alerts.Where(alert =>
            alert.AlertId != cursorAlertId
            && (alert.CreatedUtc < cursorCreatedUtc
                || (alert.CreatedUtc == cursorCreatedUtc && alert.AlertId.CompareTo(cursorAlertId) < 0)));
    }

    public static IOrderedEnumerable<AlertRecord> OrderForInbox(IEnumerable<AlertRecord> alerts)
    {
        ArgumentNullException.ThrowIfNull(alerts);

        return alerts
            .OrderByDescending(alert => alert.CreatedUtc)
            .ThenByDescending(alert => alert.AlertId);
    }

    public static AlertsInboxSummaryDto ComputeInboxSummary(IEnumerable<AlertRecord> alerts)
    {
        ArgumentNullException.ThrowIfNull(alerts);

        List<AlertRecord> active = alerts.Where(alert => !alert.IsArchived).ToList();

        return new AlertsInboxSummaryDto
        {
            OpenCount = active.Count(alert =>
                string.Equals(alert.Status, AlertStatus.Open, StringComparison.OrdinalIgnoreCase)),
            AcknowledgedCount = active.Count(alert =>
                string.Equals(alert.Status, AlertStatus.Acknowledged, StringComparison.OrdinalIgnoreCase)),
            ResolvedCount = active.Count(alert =>
                string.Equals(alert.Status, AlertStatus.Resolved, StringComparison.OrdinalIgnoreCase)),
            BlockingCount = active.Count(alert =>
                string.Equals(alert.Status, AlertStatus.Open, StringComparison.OrdinalIgnoreCase)
                && IsBlockingSeverity(alert.Severity)),
            LastEvaluatedUtc = active.Count == 0
                ? null
                : active.Select(alert => alert.LastUpdatedUtc ?? alert.CreatedUtc).Max(),
        };
    }

    public static void TrimInMemoryEntries<T>(List<T> entries)
    {
        ArgumentNullException.ThrowIfNull(entries);

        if (entries.Count > MaxInMemoryEntries)
            entries.RemoveRange(0, entries.Count - MaxInMemoryEntries);
    }
}
