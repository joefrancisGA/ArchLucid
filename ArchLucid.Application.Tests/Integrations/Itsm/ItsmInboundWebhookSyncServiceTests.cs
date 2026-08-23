using System.Text;
using System.Text.Json;

using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmInboundWebhookSyncServiceTests
{
    private const string ServiceNowSysId1 = "a1b2c3d4e5f6789012345678abcdef01";

    private const string ServiceNowSysId2 = "b1b2c3d4e5f6789012345678abcdef02";

    private static readonly Guid TenantA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private static readonly Guid WorkspaceA = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static readonly Guid ProjectA = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public async Task Jira_uses_configured_status_map_before_defaults()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KEY-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    FindingId = "f1"
                });
        correlations
            .Setup(c => c.FindingRecordExistsAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                "f1",
                "Rejected",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        IntegrationsItsmInboundOptions options = new()
        {
            JiraStatusHumanReviewMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["Blocked"] = "Rejected" }
        };
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, options);

        const string json =
            """
            {"issue":{"key":"KEY-1","fields":{"status":{"name":"Blocked"}}}}
            """;
        using JsonDocument doc = JsonDocument.Parse(json);
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None, Encoding.UTF8.GetByteCount(json));

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent.Should().NotBeNull();
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                "f1",
                "Rejected",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ServiceNow_uses_numeric_state_map_from_config()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("ServiceNow", ServiceNowSysId1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord
                {
                    TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    FindingId = "f9"
                });
        correlations
            .Setup(c => c.FindingRecordExistsAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                "f9",
                "Approved",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        IntegrationsItsmInboundOptions options = new()
        {
            ServiceNowStateHumanReviewMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["99"] = "Approved" }
        };
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, options);

        const string json = $$"""{"sys_id":"{{ServiceNowSysId1}}","state":"99"}""";
        using JsonDocument doc = JsonDocument.Parse(json);
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessServiceNowIncidentUpdateAsync(doc.RootElement, CancellationToken.None, Encoding.UTF8.GetByteCount(json));

        r.Accepted.Should().BeTrue();
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                "f9",
                "Approved",
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Jira_when_issue_key_missing_returns_not_accepted()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        IntegrationsItsmInboundOptions options = new();
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, options, configureDefaultFindingExists: false);

        using JsonDocument doc = JsonDocument.Parse("{}");
        ItsmInboundWebhookProcessResult r = await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeFalse();
        correlations.Verify(
            c => c.TryGetByExternalKeyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    /// <summary>
    ///     V1 default inbound mapping: Jira workflow status names map into
    ///     <see cref="FindingHumanReviewStatus" /> (open/active â†’ Pending; terminal â†’ Approved), per
    ///     <c>ItsmInboundWebhookSyncService</c> defaults â€” aligned with product â€œopen / in progress / resolvedâ€ semantics.
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
            .Setup(c => c.FindingRecordExistsAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f-jira",
                expectedHumanReview,
                It.IsAny<Guid?>(),
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
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None, Encoding.UTF8.GetByteCount(json));

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent.Should().NotBeNull();
        r.DurableAuditEvent!.EventType.Should().Be(AuditEventTypes.IntegrationJiraIssueStatusSynced);
        r.DurableAuditEvent.TenantId.Should().Be(TenantA);
        JsonDocument payload = JsonDocument.Parse(r.DurableAuditEvent.DataJson);
        payload.RootElement.GetProperty("humanReviewStatus").GetString().Should().Be(expectedHumanReview);
        payload.RootElement.GetProperty("issueKey").GetString().Should().Be("KK-42");
        payload.RootElement.GetProperty("statusName").GetString().Should().Be(jiraStatus);

        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f-jira",
                expectedHumanReview,
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    /// <summary>
    ///     V1 default inbound mapping: ServiceNow incident states map into
    ///     <see cref="FindingHumanReviewStatus" /> (New / In Progress â†’ Pending; Resolved / Closed â†’ Approved), including
    ///     numeric choice lists.
    /// </summary>
    [Theory]
    [InlineData("new", nameof(FindingHumanReviewStatus.Pending))]
    [InlineData("In Progress", nameof(FindingHumanReviewStatus.Pending))]
    [InlineData("resolved", nameof(FindingHumanReviewStatus.Approved))]
    [InlineData("closed", nameof(FindingHumanReviewStatus.Approved))]
    [InlineData("1", nameof(FindingHumanReviewStatus.Pending))]
    [InlineData("2", nameof(FindingHumanReviewStatus.Pending))]
    [InlineData("3", nameof(FindingHumanReviewStatus.Pending))]
    [InlineData("6", nameof(FindingHumanReviewStatus.Approved))]
    [InlineData("7", nameof(FindingHumanReviewStatus.Approved))]
    public async Task ServiceNow_inbound_default_state_maps_to_expected_human_review(string stateValue, string expectedHumanReview)
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("ServiceNow", ServiceNowSysId1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord { TenantId = TenantA, WorkspaceId = WorkspaceA, ProjectId = ProjectA, FindingId = "f-sn" });
        correlations
            .Setup(c => c.FindingRecordExistsAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f-sn",
                expectedHumanReview,
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        string json = $$"""{"sys_id":"{{ServiceNowSysId1}}","state":"{{stateValue}}"}""";
        using JsonDocument doc = JsonDocument.Parse(json);
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessServiceNowIncidentUpdateAsync(doc.RootElement, CancellationToken.None, Encoding.UTF8.GetByteCount(json));

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent.Should().NotBeNull();
        r.DurableAuditEvent!.EventType.Should().Be(AuditEventTypes.IntegrationServiceNowIncidentStatusSynced);
        r.DurableAuditEvent.TenantId.Should().Be(TenantA);
        JsonDocument auditPayload = JsonDocument.Parse(r.DurableAuditEvent.DataJson);
        auditPayload.RootElement.GetProperty("humanReviewStatus").GetString().Should().Be(expectedHumanReview);
        auditPayload.RootElement.GetProperty("externalKey").GetString().Should().Be(ServiceNowSysId1);
        auditPayload.RootElement.GetProperty("rowsUpdated").GetInt32().Should().Be(1);

        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f-sn",
                expectedHumanReview,
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ServiceNow_inbound_json_numeric_state_not_string_parses_as_builtin_choice_list()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("ServiceNow", ServiceNowSysId2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord { TenantId = TenantA, WorkspaceId = WorkspaceA, ProjectId = ProjectA, FindingId = "f-sn2" });
        correlations
            .Setup(c => c.FindingRecordExistsAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f-sn2",
                nameof(FindingHumanReviewStatus.Approved),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        const string json = $$"""{"sys_id":"{{ServiceNowSysId2}}","state":6}""";
        using JsonDocument doc = JsonDocument.Parse(json);
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessServiceNowIncidentUpdateAsync(doc.RootElement, CancellationToken.None, Encoding.UTF8.GetByteCount(json));

        r.Accepted.Should().BeTrue();
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f-sn2",
                nameof(FindingHumanReviewStatus.Approved),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Jira_invalid_issue_key_format_is_rejected_with_audit()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        using JsonDocument doc = JsonDocument.Parse(
            """{"issue":{"key":"bad@project-1","fields":{"status":{"name":"Done"}}}}""");
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeFalse();
        r.DurableAuditEvent!.EventType.Should().Be(AuditEventTypes.IntegrationJiraInboundWebhookRejected);
        JsonDocument payload = JsonDocument.Parse(r.DurableAuditEvent.DataJson);
        payload.RootElement.GetProperty("reasonCode").GetString().Should().Be("issue_key_invalid_format");
        correlations.Verify(
            c => c.TryGetByExternalKeyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ServiceNow_invalid_sys_id_format_is_rejected_with_audit()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        using JsonDocument doc = JsonDocument.Parse("""{"sys_id":"INC001234","state":"1"}""");
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessServiceNowIncidentUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeFalse();
        r.DurableAuditEvent!.EventType.Should().Be(AuditEventTypes.IntegrationServiceNowInboundWebhookRejected);
        JsonDocument payload = JsonDocument.Parse(r.DurableAuditEvent.DataJson);
        payload.RootElement.GetProperty("reasonCode").GetString().Should().Be("sys_id_invalid_format");
        correlations.Verify(
            c => c.TryGetByExternalKeyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Jira_unknown_status_logs_warning_emits_audit_and_does_not_update_finding()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        Mock<ILogger<ItsmInboundWebhookSyncService>> logger = new();
        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new IntegrationsItsmInboundOptions());
        Mock<IFindingDispositionService> dispositionService = new();
        ItsmInboundDispositionSync dispositionSync =
            new(dispositionService.Object, NullLogger<ItsmInboundDispositionSync>.Instance);
        Mock<IItsmInboundWebhookReplayGuard> replayGuard = new();
        replayGuard
            .Setup(g => g.TryClaimAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        ItsmInboundWebhookSyncService sut =
            new(correlations.Object, monitor.Object, dispositionSync, replayGuard.Object, logger.Object);

        using JsonDocument doc = JsonDocument.Parse(
            """{"issue":{"key":"KK-9","fields":{"status":{"name":"Custom-Not-Mapped"}}}}""");
        ItsmInboundWebhookProcessResult r = await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeFalse();
        r.DurableAuditEvent.Should().NotBeNull();
        r.DurableAuditEvent!.EventType.Should().Be(AuditEventTypes.IntegrationJiraInboundWebhookRejected);
        JsonDocument ap = JsonDocument.Parse(r.DurableAuditEvent.DataJson);
        ap.RootElement.GetProperty("reasonCode").GetString().Should().Be("jira_status_unknown");
        correlations.Verify(
            c => c.TryGetByExternalKeyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);

        logger.Verify(
            static l => l.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, _) => v.ToString()!.Contains("not mapped", StringComparison.Ordinal)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ServiceNow_unknown_state_logs_warning_emits_audit_and_does_not_touch_correlation_repository()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        Mock<ILogger<ItsmInboundWebhookSyncService>> logger = new();
        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new IntegrationsItsmInboundOptions());
        Mock<IFindingDispositionService> dispositionService = new();
        ItsmInboundDispositionSync dispositionSync =
            new(dispositionService.Object, NullLogger<ItsmInboundDispositionSync>.Instance);
        Mock<IItsmInboundWebhookReplayGuard> replayGuard = new();
        replayGuard
            .Setup(g => g.TryClaimAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        ItsmInboundWebhookSyncService sut =
            new(correlations.Object, monitor.Object, dispositionSync, replayGuard.Object, logger.Object);

        const string json = $$"""{"sys_id":"{{ServiceNowSysId1}}","state":"88"}""";
        using JsonDocument doc = JsonDocument.Parse(json);
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessServiceNowIncidentUpdateAsync(doc.RootElement, CancellationToken.None, Encoding.UTF8.GetByteCount(json));

        r.Accepted.Should().BeFalse();
        r.DurableAuditEvent!.EventType.Should().Be(AuditEventTypes.IntegrationServiceNowInboundWebhookRejected);
        JsonDocument ap = JsonDocument.Parse(r.DurableAuditEvent.DataJson);
        ap.RootElement.GetProperty("reasonCode").GetString().Should().Be("servicenow_state_unknown");
        correlations.Verify(
            c => c.TryGetByExternalKeyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);

        logger.Verify(
            static l => l.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, _) => v.ToString()!.Contains("not mapped", StringComparison.Ordinal)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task Jira_payload_over_byte_limit_is_rejected_with_payload_rejected_audit()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        const string json = """{"issue":{"key":"KK-1","fields":{"status":{"name":"Done"}}}}""";
        using JsonDocument doc = JsonDocument.Parse(json);
        const int over = ItsmInboundWebhookSyncService.MaxInboundWebhookPayloadUtf8Bytes + 1;
        ItsmInboundWebhookProcessResult r = await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None, over);

        r.Accepted.Should().BeFalse();
        r.DurableAuditEvent!.EventType.Should().Be(AuditEventTypes.IntegrationItsmInboundWebhookPayloadRejected);
        correlations.Verify(
            c => c.TryGetByExternalKeyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task When_correlated_finding_row_missing_is_acknowledged_with_tenant_scoped_audit()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KK-77", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord { TenantId = TenantA, WorkspaceId = WorkspaceA, ProjectId = ProjectA, FindingId = "ghost" });
        correlations
            .Setup(c => c.FindingRecordExistsAsync(TenantA, "ghost", It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        ItsmInboundWebhookSyncService sut =
            CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions(), configureDefaultFindingExists: false);

        using JsonDocument doc = JsonDocument.Parse(
            """{"issue":{"key":"KK-77","fields":{"status":{"name":"Done"}}}}""");
        ItsmInboundWebhookProcessResult r = await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent!.EventType.Should().Be(AuditEventTypes.IntegrationJiraInboundWebhookRejected);
        r.DurableAuditEvent.TenantId.Should().Be(TenantA);
        JsonDocument ap = JsonDocument.Parse(r.DurableAuditEvent.DataJson);
        ap.RootElement.GetProperty("reasonCode").GetString().Should().Be("finding_not_found");
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Jira_when_no_correlation_row_inbound_is_acknowledged_without_audit_or_finding_update()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KK-999", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ItsmFindingCorrelationRecord?)null);

        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        using JsonDocument doc = JsonDocument.Parse(
            """{"issue":{"key":"KK-999","fields":{"status":{"name":"Done"}}}}""");

        ItsmInboundWebhookProcessResult r = await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent.Should().BeNull();

        correlations.Verify(
            c => c.TryGetByExternalKeyAsync("Jira", "KK-999", It.IsAny<CancellationToken>()),
            Times.Once);
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ServiceNow_when_no_correlation_row_inbound_is_acknowledged_without_audit_or_finding_update()
    {
        const string orphanId = "c1c2c3d4e5f6789012345678abcdef01";
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("ServiceNow", orphanId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ItsmFindingCorrelationRecord?)null);
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        const string json = $$"""{"sys_id":"{{orphanId}}","state":"resolved"}""";
        using JsonDocument doc = JsonDocument.Parse(json);
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessServiceNowIncidentUpdateAsync(doc.RootElement, CancellationToken.None, Encoding.UTF8.GetByteCount(json));

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent.Should().BeNull();

        correlations.Verify(
            c => c.TryGetByExternalKeyAsync("ServiceNow", orphanId, It.IsAny<CancellationToken>()),
            Times.Once);
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Inbound_status_update_uses_tenant_id_from_correlation_not_from_payload()
    {
        Guid otherTenant = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KEY-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord { TenantId = TenantA, WorkspaceId = WorkspaceA, ProjectId = ProjectA, FindingId = "fid-1" });

        correlations
            .Setup(c => c.FindingRecordExistsAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "fid-1",
                nameof(FindingHumanReviewStatus.Pending),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                otherTenant,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions(), configureDefaultFindingExists: false);

        using JsonDocument doc = JsonDocument.Parse(
            """{"issue":{"key":"KEY-1","fields":{"status":{"name":"To Do"}}}}""");
        await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "fid-1",
                nameof(FindingHumanReviewStatus.Pending),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                otherTenant,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Jira_when_correlation_row_exists_finding_exists_but_sql_update_returns_zero_still_emits_sync_audit()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KK-0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord { TenantId = TenantA, WorkspaceId = WorkspaceA, ProjectId = ProjectA, FindingId = "missing-finding" });
        correlations
            .Setup(c => c.FindingRecordExistsAsync(TenantA, "missing-finding", It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "missing-finding",
                nameof(FindingHumanReviewStatus.Pending),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        using JsonDocument doc = JsonDocument.Parse(
            """{"issue":{"key":"KK-0","fields":{"status":{"name":"To Do"}}}}""");
        ItsmInboundWebhookProcessResult r = await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent.Should().NotBeNull();
        JsonDocument payload = JsonDocument.Parse(r.DurableAuditEvent!.DataJson);
        payload.RootElement.GetProperty("rowsUpdated").GetInt32().Should().Be(0);
        payload.RootElement.GetProperty("humanReviewStatus").GetString().Should().Be(nameof(FindingHumanReviewStatus.Pending));
    }

    [Fact]
    public async Task Jira_when_disposition_map_configured_records_remediated_and_emits_audit_fields()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KK-77", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord { TenantId = TenantA, WorkspaceId = WorkspaceA, ProjectId = ProjectA, FindingId = "f-disp" });
        correlations
            .Setup(c => c.FindingRecordExistsAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f-disp",
                nameof(FindingHumanReviewStatus.Approved),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        Mock<IFindingDispositionService> dispositionService = new();
        dispositionService
            .Setup(s => s.ListHistoryAsync(TenantA, "f-disp", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<FindingDispositionEventDto>());
        dispositionService
            .Setup(s => s.RecordAsync(
                It.Is<RecordFindingDispositionRequest>(r => r.Disposition == FindingDisposition.Remediated),
                It.IsAny<Core.Scoping.ScopeContext>(),
                "jira-webhook",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new FindingDispositionEventDto
                {
                    EventId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    FindingId = "f-disp",
                    Disposition = FindingDisposition.Remediated,
                    ReviewerUserId = "jira-webhook",
                    OccurredAtUtc = DateTimeOffset.UtcNow,
                });
        IntegrationsItsmInboundOptions options = new()
        {
            JiraStatusDispositionMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["Done"] = nameof(FindingDisposition.Remediated)
            }
        };
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, options, dispositionService);

        using JsonDocument doc = JsonDocument.Parse(
            """{"issue":{"key":"KK-77","fields":{"status":{"name":"Done"}}}}""");
        ItsmInboundWebhookProcessResult r = await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeTrue();
        JsonDocument payload = JsonDocument.Parse(r.DurableAuditEvent!.DataJson);
        payload.RootElement.GetProperty("dispositionSynced").GetBoolean().Should().BeTrue();
        payload.RootElement.GetProperty("disposition").GetString().Should().Be(nameof(FindingDisposition.Remediated));
        dispositionService.Verify(
            s => s.RecordAsync(
                It.IsAny<RecordFindingDispositionRequest>(),
                It.IsAny<Core.Scoping.ScopeContext>(),
                "jira-webhook",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Jira_without_disposition_map_leaves_disposition_sync_skipped_in_audit()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KK-88", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord { TenantId = TenantA, WorkspaceId = WorkspaceA, ProjectId = ProjectA, FindingId = "f-plain" });
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                "f-plain",
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        Mock<IFindingDispositionService> dispositionService = new();
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions(), dispositionService);

        using JsonDocument doc = JsonDocument.Parse(
            """{"issue":{"key":"KK-88","fields":{"status":{"name":"Done"}}}}""");
        ItsmInboundWebhookProcessResult r = await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None);

        r.Accepted.Should().BeTrue();
        JsonDocument payload = JsonDocument.Parse(r.DurableAuditEvent!.DataJson);
        payload.RootElement.GetProperty("dispositionSynced").GetBoolean().Should().BeFalse();
        payload.RootElement.GetProperty("dispositionSkipReason").GetString().Should().Be("disposition_unmapped");
        dispositionService.Verify(
            s => s.ListHistoryAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Jira_tenant_scoped_webhook_does_not_mutate_correlation_owned_by_another_tenant()
    {
        Guid tenantB = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KEY-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord
                {
                    TenantId = tenantB,
                    WorkspaceId = WorkspaceA,
                    ProjectId = ProjectA,
                    FindingId = "f-other-tenant"
                });
        correlations
            .Setup(c => c.TryGetByExternalKeyForTenantAsync(TenantA, "Jira", "KEY-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ItsmFindingCorrelationRecord?)null);
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions());

        using JsonDocument doc = JsonDocument.Parse(
            """{"issue":{"key":"KEY-1","fields":{"status":{"name":"Done"}}}}""");
        ItsmInboundWebhookProcessResult r =
            await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None, authenticatedTenantId: TenantA);

        r.Accepted.Should().BeTrue();
        r.DurableAuditEvent.Should().BeNull();
        correlations.Verify(
            c => c.TryGetByExternalKeyForTenantAsync(TenantA, "Jira", "KEY-1", It.IsAny<CancellationToken>()),
            Times.Once);
        correlations.Verify(
            c => c.TryGetByExternalKeyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Jira_replay_of_same_delivery_id_is_accepted_without_second_mutation()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KEY-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord
                {
                    TenantId = TenantA,
                    WorkspaceId = WorkspaceA,
                    ProjectId = ProjectA,
                    FindingId = "f1"
                });
        correlations
            .Setup(c => c.FindingRecordExistsAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f1",
                nameof(FindingHumanReviewStatus.Approved),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);
        Mock<IItsmInboundWebhookReplayGuard> replayGuard = new();
        replayGuard
            .SetupSequence(g => g.TryClaimAsync(TenantA, "Jira", "deliv-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true)
            .ReturnsAsync(false);
        ItsmInboundWebhookSyncService sut = CreateSutWithInboundOptions(correlations, new IntegrationsItsmInboundOptions(), replayGuard: replayGuard);

        const string json =
            """
            {"issue":{"key":"KEY-1","fields":{"status":{"name":"Done"}}}}
            """;
        using JsonDocument doc = JsonDocument.Parse(json);

        ItsmInboundWebhookProcessResult first =
            await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None, deliveryId: "deliv-1");
        ItsmInboundWebhookProcessResult second =
            await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None, deliveryId: "deliv-1");

        first.Accepted.Should().BeTrue();
        first.ReplayIgnored.Should().BeFalse();
        second.Accepted.Should().BeTrue();
        second.ReplayIgnored.Should().BeTrue();
        second.DurableAuditEvent.Should().NotBeNull();
        second.DurableAuditEvent!.EventType.Should().Be(AuditEventTypes.IntegrationItsmInboundWebhookReplayIgnored);
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f1",
                nameof(FindingHumanReviewStatus.Approved),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Jira_replay_without_delivery_id_blocks_status_case_variant()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KEY-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord
                {
                    TenantId = TenantA,
                    WorkspaceId = WorkspaceA,
                    ProjectId = ProjectA,
                    FindingId = "f1"
                });
        correlations
            .Setup(c => c.FindingRecordExistsAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f1",
                nameof(FindingHumanReviewStatus.Approved),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        using MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 100 });
        MemoryCacheItsmInboundWebhookReplayGuard replayGuard = new(cache, TimeProvider.System);
        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new IntegrationsItsmInboundOptions());
        ItsmInboundWebhookSyncService sut = new(
            correlations.Object,
            monitor.Object,
            new ItsmInboundDispositionSync(new Mock<IFindingDispositionService>().Object, NullLogger<ItsmInboundDispositionSync>.Instance),
            replayGuard,
            NullLogger<ItsmInboundWebhookSyncService>.Instance);

        using JsonDocument doneDoc = JsonDocument.Parse(
            """{"issue":{"key":"KEY-1","fields":{"status":{"name":"Done"}}}}""");
        using JsonDocument lowerDoc = JsonDocument.Parse(
            """{"issue":{"key":"KEY-1","fields":{"status":{"name":"done"}}}}""");

        ItsmInboundWebhookProcessResult first =
            await sut.TryProcessJiraIssueUpdateAsync(doneDoc.RootElement, CancellationToken.None);
        ItsmInboundWebhookProcessResult second =
            await sut.TryProcessJiraIssueUpdateAsync(lowerDoc.RootElement, CancellationToken.None);

        first.ReplayIgnored.Should().BeFalse();
        second.ReplayIgnored.Should().BeTrue();
        correlations.Verify(
            c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f1",
                nameof(FindingHumanReviewStatus.Approved),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Jira_concurrent_same_delivery_id_only_mutates_once()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KEY-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new ItsmFindingCorrelationRecord
                {
                    TenantId = TenantA,
                    WorkspaceId = WorkspaceA,
                    ProjectId = ProjectA,
                    FindingId = "f1"
                });
        correlations
            .Setup(c => c.FindingRecordExistsAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        int updateInvocations = 0;
        correlations
            .Setup(c => c.UpdateHumanReviewStatusForFindingAsync(
                TenantA,
                "f1",
                nameof(FindingHumanReviewStatus.Approved),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(1)
            .Callback(() => Interlocked.Increment(ref updateInvocations));

        using MemoryCache cache = new(new MemoryCacheOptions { SizeLimit = 100 });
        MemoryCacheItsmInboundWebhookReplayGuard replayGuard = new(cache, TimeProvider.System);
        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new IntegrationsItsmInboundOptions());
        ItsmInboundWebhookSyncService sut = new(
            correlations.Object,
            monitor.Object,
            new ItsmInboundDispositionSync(new Mock<IFindingDispositionService>().Object, NullLogger<ItsmInboundDispositionSync>.Instance),
            replayGuard,
            NullLogger<ItsmInboundWebhookSyncService>.Instance);

        const string json =
            """
            {"issue":{"key":"KEY-1","fields":{"status":{"name":"Done"}}}}
            """;
        using JsonDocument doc = JsonDocument.Parse(json);

        const int parallelDeliveries = 12;
        using Barrier startBarrier = new(parallelDeliveries);
        Task<ItsmInboundWebhookProcessResult>[] tasks = new Task<ItsmInboundWebhookProcessResult>[parallelDeliveries];

        for (int index = 0; index < parallelDeliveries; index++)
        {
            tasks[index] = Task.Run(async () =>
            {
                startBarrier.SignalAndWait();

                return await sut.TryProcessJiraIssueUpdateAsync(doc.RootElement, CancellationToken.None, deliveryId: "deliv-concurrent");
            });
        }

        ItsmInboundWebhookProcessResult[] results = await Task.WhenAll(tasks);

        updateInvocations.Should().Be(1);
        results.Count(r => r.ReplayIgnored).Should().Be(parallelDeliveries - 1);
        results.Count(r => r.Accepted && !r.ReplayIgnored).Should().Be(1);
    }

    private static ItsmInboundWebhookSyncService CreateSutWithInboundOptions(
        Mock<IItsmFindingCorrelationRepository> correlations,
        IntegrationsItsmInboundOptions inboundOptions,
        Mock<IFindingDispositionService>? dispositionService = null,
        bool configureDefaultFindingExists = true,
        Mock<IItsmInboundWebhookReplayGuard>? replayGuard = null)
    {
        if (configureDefaultFindingExists)
            correlations
                .Setup(c => c.FindingRecordExistsAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(inboundOptions);

        Mock<IFindingDispositionService> disposition = dispositionService ?? new Mock<IFindingDispositionService>();
        ItsmInboundDispositionSync dispositionSync =
            new(disposition.Object, NullLogger<ItsmInboundDispositionSync>.Instance);

        Mock<IItsmInboundWebhookReplayGuard> replay = replayGuard ?? new Mock<IItsmInboundWebhookReplayGuard>();

        if (replayGuard is null)
        {
            replay
                .Setup(g => g.TryClaimAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);
        }

        return new ItsmInboundWebhookSyncService(
            correlations.Object,
            monitor.Object,
            dispositionSync,
            replay.Object,
            NullLogger<ItsmInboundWebhookSyncService>.Instance);
    }
}
