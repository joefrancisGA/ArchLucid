using ArchLucid.Application.Integrations.Itsm;
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
            JiraStatusHumanReviewMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["Blocked"] = "Rejected"
            }
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
            ServiceNowStateHumanReviewMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["99"] = "Approved"
            }
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
}
