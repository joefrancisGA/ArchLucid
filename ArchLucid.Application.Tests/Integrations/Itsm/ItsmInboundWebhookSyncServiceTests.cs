using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

using System.Text.Json;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmInboundWebhookSyncServiceTests
{
    private static readonly Guid TenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceA = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectA = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public async Task Jira_uses_configured_status_map_before_defaults()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "K-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    FindingId = "f1"
                });
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                "f1",
                "Rejected",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        IntegrationsItsmInboundOptions options = new()
        {
            JiraStatusHumanReviewMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["Blocked"] = "Rejected" }
        };
        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(options);
        ItsmInboundWebhookSyncService sut =
            new(correlations.Object, monitor.Object, NullLogger<ItsmInboundWebhookSyncService>.Instance);

        string json =
            """
            {"issue":{"key":"K-1","fields":{"status":{"name":"Blocked"}}}}
            """;
        using JsonDocument doc = JsonDocument.Parse(json);
        ItsmInboundWebhookProcessResult r = await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent.Should().NotBeNull();
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                "f1",
                "Rejected",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ServiceNow_uses_numeric_state_map_from_config()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("ServiceNow", "INC0001", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    FindingId = "f9"
                });
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                "f9",
                "Approved",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        IntegrationsItsmInboundOptions options = new()
        {
            ServiceNowStateHumanReviewMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["99"] = "Approved" }
        };
        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(options);
        ItsmInboundWebhookSyncService sut =
            new(correlations.Object, monitor.Object, NullLogger<ItsmInboundWebhookSyncService>.Instance);

        string json = """{"sys_id":"INC0001","state":"99"}""";
        using JsonDocument doc = JsonDocument.Parse(json);
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessServiceNowIncidentUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeTrue();
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                "f9",
                "Approved",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Jira_when_issue_key_missing_returns_not_accepted()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        IntegrationsItsmInboundOptions options = new();
        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(options);
        ItsmInboundWebhookSyncService sut =
            new(correlations.Object, monitor.Object, NullLogger<ItsmInboundWebhookSyncService>.Instance);

        using JsonDocument doc = JsonDocument.Parse("{}");
        ItsmInboundWebhookProcessResult r = await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeFalse();
        correlations.Verify(
            c => c.TryGetByExternalKeyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    /// <summary>
    ///     V1 default inbound mapping: Jira workflow status names map into
    ///     <see cref="FindingHumanReviewStatus" /> (open/active → Pending; terminal → Approved), per
    ///     <c>ItsmInboundWebhookSyncService</c> defaults — aligned with product “open / in progress / resolved” semantics.
    /// </summary>
    [Theory]
    [InlineData("To Do", nameof(FindingHumanReviewStatus.Pending))]
    [InlineData("In Progress", nameof(FindingHumanReviewStatus.Pending))]
    [InlineData("Done", nameof(FindingHumanReviewStatus.Approved))]
    [InlineData("Open", nameof(FindingHumanReviewStatus.Pending))]
    [InlineData("In Development", nameof(FindingHumanReviewStatus.Pending))]
    [InlineData("Resolved", nameof(FindingHumanReviewStatus.Approved))]
    [InlineData("Closed", nameof(FindingHumanReviewStatus.Approved))]
    public async Task Jira_inbound_default_status_maps_to_expected_human_review(string jiraStatus, string expectedHumanReview)
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KK-42", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord { TenantId = TenantA, WorkspaceId = WorkspaceA, ProjectId = ProjectA, FindingId = "f-jira" });
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f-jira",
                expectedHumanReview,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        string json = JsonSerializer.Serialize(
            new Dictionary<string, object>
            {
                ["issue"] = new Dictionary<string, object>
                {
                    ["key"] = "KK-42",
                    ["fields"] = new Dictionary<string, object> { ["status"] = new Dictionary<string, object> { ["name"] = jiraStatus } }
                }
            });
        using JsonDocument doc = JsonDocument.Parse(json);
        ItsmInboundWebhookProcessResult r = await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent.Should().NotBeNull();
        r.DurableAuditEvent!.EventType.Should().Be(AuditEventTypes.IntegrationJiraIssueStatusSynced);
        r.DurableAuditEvent.TenantId.Should().Be(TenantA);
        JsonDocument payload = JsonDocument.Parse(r.DurableAuditEvent.DataJson ?? "{}");
        payload.RootElement.GetProperty("humanReviewStatus").GetString().Should().Be(expectedHumanReview);
        payload.RootElement.GetProperty("issueKey").GetString().Should().Be("KK-42");
        payload.RootElement.GetProperty("statusName").GetString().Should().Be(jiraStatus);

        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f-jira",
                expectedHumanReview,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    /// <summary>
    ///     V1 default inbound mapping: ServiceNow incident states map into
    ///     <see cref="FindingHumanReviewStatus" /> (New / In Progress → Pending; Resolved / Closed → Approved), including
    ///     numeric choice lists.
    /// </summary>
    [Theory]
    [InlineData("""{"sys_id":"inc-abc","state":"new"}""", nameof(FindingHumanReviewStatus.Pending), "inc-abc")]
    [InlineData("""{"sys_id":"inc-abc","state":"In Progress"}""", nameof(FindingHumanReviewStatus.Pending), "inc-abc")]
    [InlineData("""{"number":"INC0100","state":"In Progress"}""", nameof(FindingHumanReviewStatus.Pending), "INC0100")]
    [InlineData("""{"sys_id":"inc-abc","state":"resolved"}""", nameof(FindingHumanReviewStatus.Approved), "inc-abc")]
    [InlineData("""{"sys_id":"inc-abc","state":"closed"}""", nameof(FindingHumanReviewStatus.Approved), "inc-abc")]
    [InlineData("""{"sys_id":"inc-abc","state":"1"}""", nameof(FindingHumanReviewStatus.Pending), "inc-abc")]
    [InlineData("""{"sys_id":"inc-abc","state":"2"}""", nameof(FindingHumanReviewStatus.Pending), "inc-abc")]
    [InlineData("""{"sys_id":"inc-abc","state":"3"}""", nameof(FindingHumanReviewStatus.Pending), "inc-abc")]
    [InlineData("""{"sys_id":"inc-abc","state":"6"}""", nameof(FindingHumanReviewStatus.Approved), "inc-abc")]
    [InlineData("""{"sys_id":"inc-abc","state":"7"}""", nameof(FindingHumanReviewStatus.Approved), "inc-abc")]
    public async Task ServiceNow_inbound_default_state_maps_to_expected_human_review(
        string json,
        string expectedHumanReview,
        string externalKey)
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("ServiceNow", externalKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord { TenantId = TenantA, WorkspaceId = WorkspaceA, ProjectId = ProjectA, FindingId = "f-sn" });
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f-sn",
                expectedHumanReview,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        using JsonDocument doc = JsonDocument.Parse(json);
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessServiceNowIncidentUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent.Should().NotBeNull();
        r.DurableAuditEvent!.EventType.Should().Be(AuditEventTypes.IntegrationServiceNowIncidentStatusSynced);
        r.DurableAuditEvent.TenantId.Should().Be(TenantA);
        JsonDocument auditPayload = JsonDocument.Parse(r.DurableAuditEvent.DataJson ?? "{}");
        auditPayload.RootElement.GetProperty("humanReviewStatus").GetString().Should().Be(expectedHumanReview);
        auditPayload.RootElement.GetProperty("externalKey").GetString().Should().Be(externalKey);
        auditPayload.RootElement.GetProperty("rowsUpdated").GetInt32().Should().Be(1);

        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f-sn",
                expectedHumanReview,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ServiceNow_inbound_json_numeric_state_not_string_parses_as_builtin_choice_list()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("ServiceNow", "inc-num", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord { TenantId = TenantA, WorkspaceId = WorkspaceA, ProjectId = ProjectA, FindingId = "f-sn2" });
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f-sn2",
                nameof(FindingHumanReviewStatus.Approved),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        using JsonDocument doc = JsonDocument.Parse("""{"sys_id":"inc-num","state":6}""");
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessServiceNowIncidentUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeTrue();
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f-sn2",
                nameof(FindingHumanReviewStatus.Approved),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Jira_unmapped_status_is_not_accepted_and_does_not_touch_correlation_repository()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        using JsonDocument doc = JsonDocument.Parse(
            """{"issue":{"key":"KK-9","fields":{"status":{"name":"Custom-Not-Mapped"}}}}""");
        ItsmInboundWebhookProcessResult r = await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeFalse();
        r.DurableAuditEvent.Should().BeNull();
        correlations.Verify(
            c => c.TryGetByExternalKeyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ServiceNow_unmapped_state_is_not_accepted_and_does_not_touch_correlation_repository()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        using JsonDocument doc = JsonDocument.Parse("""{"sys_id":"inc-x","state":"88"}""");
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessServiceNowIncidentUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeFalse();
        r.DurableAuditEvent.Should().BeNull();
        correlations.Verify(
            c => c.TryGetByExternalKeyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Jira_when_no_correlation_row_inbound_is_acknowledged_without_audit_or_finding_update()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KK-orphan", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ItsmFindingCorrelationRecord?)null);
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        using JsonDocument doc = JsonDocument.Parse(
            """{"issue":{"key":"KK-orphan","fields":{"status":{"name":"Done"}}}}""");
        ItsmInboundWebhookProcessResult r = await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent.Should().BeNull();

        correlations.Verify(
            c => c.TryGetByExternalKeyAsync("Jira", "KK-orphan", It.IsAny<CancellationToken>()),
            Times.Once);
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ServiceNow_when_no_correlation_row_inbound_is_acknowledged_without_audit_or_finding_update()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("ServiceNow", "inc-orphan", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ItsmFindingCorrelationRecord?)null);
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        using JsonDocument doc = JsonDocument.Parse("""{"sys_id":"inc-orphan","state":"resolved"}""");
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessServiceNowIncidentUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent.Should().BeNull();

        correlations.Verify(
            c => c.TryGetByExternalKeyAsync("ServiceNow", "inc-orphan", It.IsAny<CancellationToken>()),
            Times.Once);
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Inbound_status_update_uses_tenant_id_from_correlation_not_from_payload()
    {
        Guid otherTenant = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KEY-T", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord { TenantId = TenantA, WorkspaceId = WorkspaceA, ProjectId = ProjectA, FindingId = "fid-1" });
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "fid-1",
                nameof(FindingHumanReviewStatus.Pending),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                otherTenant,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        using JsonDocument doc = JsonDocument.Parse(
            """{"issue":{"key":"KEY-T","fields":{"status":{"name":"To Do"}}}}""");
        await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "fid-1",
                nameof(FindingHumanReviewStatus.Pending),
                It.IsAny<CancellationToken>()),
            Times.Once);
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                otherTenant,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Jira_when_correlation_exists_but_finding_row_not_updated_audit_records_zero_rows_and_emits_event()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KK-0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord { TenantId = TenantA, WorkspaceId = WorkspaceA, ProjectId = ProjectA, FindingId = "missing-finding" });
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "missing-finding",
                nameof(FindingHumanReviewStatus.Pending),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        using JsonDocument doc = JsonDocument.Parse(
            """{"issue":{"key":"KK-0","fields":{"status":{"name":"To Do"}}}}""");
        ItsmInboundWebhookProcessResult r = await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent.Should().NotBeNull();
        JsonDocument payload = JsonDocument.Parse(r.DurableAuditEvent!.DataJson ?? "{}");
        payload.RootElement.GetProperty("rowsUpdated").GetInt32().Should().Be(0);
        payload.RootElement.GetProperty("humanReviewStatus").GetString().Should().Be(nameof(FindingHumanReviewStatus.Pending));
    }

    private static ItsmInboundWebhookSyncService CreateSutWithInboundOptions(
        Mock<IItsmFindingCorrelationRepository> correlations,
        IntegrationsItsmInboundOptions inboundOptions)
    {
        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(inboundOptions);

        return new ItsmInboundWebhookSyncService(
            correlations.Object,
            monitor.Object,
            NullLogger<ItsmInboundWebhookSyncService>.Instance);
    }
}
