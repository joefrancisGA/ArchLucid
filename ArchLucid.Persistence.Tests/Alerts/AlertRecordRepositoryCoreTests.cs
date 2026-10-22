using ArchLucid.Persistence.Alerts;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Alerts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AlertRecordRepositoryCoreTests
{
    [Fact]
    public void ValidateAlertKeysetCursor_rejects_partial()
    {
        Action act = () => AlertRecordRepositoryCore.ValidateAlertKeysetCursor(DateTime.UtcNow, null);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void IsOpenForDedup_matches_open_and_acknowledged_only()
    {
        AlertRecordRepositoryCore.IsOpenForDedup(AlertStatus.Open).Should().BeTrue();
        AlertRecordRepositoryCore.IsOpenForDedup(AlertStatus.Acknowledged).Should().BeTrue();
        AlertRecordRepositoryCore.IsOpenForDedup(AlertStatus.Resolved).Should().BeFalse();
    }

    [Fact]
    public void SelectOpenByDeduplicationKey_prefers_latest_created()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        const string key = "dedupe-key";

        List<AlertRecord> alerts =
        [
            CreateAlert(tenantId, workspaceId, projectId, key, AlertStatus.Open, DateTime.UtcNow.AddMinutes(-5)),
            CreateAlert(tenantId, workspaceId, projectId, key, AlertStatus.Acknowledged, DateTime.UtcNow),
        ];

        AlertRecord? match = AlertRecordRepositoryCore.SelectOpenByDeduplicationKey(
            alerts,
            tenantId,
            workspaceId,
            projectId,
            key);

        match.Should().NotBeNull();
        match!.Status.Should().Be(AlertStatus.Acknowledged);
    }

    [Fact]
    public void ComputeInboxSummary_counts_blocking_open_high_and_critical()
    {
        Guid scopeId = Guid.NewGuid();

        List<AlertRecord> alerts =
        [
            CreateAlert(scopeId, scopeId, scopeId, "a", AlertStatus.Open, DateTime.UtcNow, AlertSeverity.High),
            CreateAlert(scopeId, scopeId, scopeId, "b", AlertStatus.Open, DateTime.UtcNow, AlertSeverity.Critical),
            CreateAlert(scopeId, scopeId, scopeId, "c", AlertStatus.Open, DateTime.UtcNow, AlertSeverity.Info),
            CreateAlert(scopeId, scopeId, scopeId, "d", AlertStatus.Resolved, DateTime.UtcNow),
        ];

        AlertsInboxSummaryDto summary = AlertRecordRepositoryCore.ComputeInboxSummary(alerts);

        summary.OpenCount.Should().Be(3);
        summary.ResolvedCount.Should().Be(1);
        summary.BlockingCount.Should().Be(2);
    }

    private static AlertRecord CreateAlert(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string dedupeKey,
        string status,
        DateTime createdUtc,
        string severity = AlertSeverity.Warning)
    {
        return new AlertRecord
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            DeduplicationKey = dedupeKey,
            Status = status,
            Severity = severity,
            CreatedUtc = createdUtc,
            Title = "title",
            Category = "cat",
            TriggerValue = "1",
            Description = "desc",
        };
    }
}
