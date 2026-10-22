using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmInboundWebhookSyncSupportTests
{
    [Fact]
    public async Task TryResolveCorrelationAsync_uses_tenant_scoped_lookup_when_authenticated_tenant_id_is_present()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyForTenantAsync(tenantId, "Jira", "KEY-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ItsmFindingCorrelationRecord?)null);

        ItsmInboundWebhookSyncSupport sut = new(correlations.Object, Mock.Of<IItsmInboundWebhookReplayGuard>());

        ItsmFindingCorrelationRecord? row =
            await sut.TryResolveCorrelationAsync("Jira", "KEY-1", authenticatedTenantId: tenantId, CancellationToken.None);

        row.Should().BeNull();
        correlations.Verify(
            c => c.TryGetByExternalKeyForTenantAsync(tenantId, "Jira", "KEY-1", It.IsAny<CancellationToken>()),
            Times.Once);
        correlations.Verify(
            c => c.TryGetByExternalKeyAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryResolveCorrelationAsync_uses_unscoped_lookup_when_authenticated_tenant_id_is_null()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.TryGetByExternalKeyAsync("Jira", "KEY-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ItsmFindingCorrelationRecord?)null);

        Mock<IItsmInboundWebhookReplayGuard> replay = new();
        ItsmInboundWebhookSyncSupport sut = new(correlations.Object, replay.Object);

        ItsmFindingCorrelationRecord? row =
            await sut.TryResolveCorrelationAsync("Jira", "KEY-1", authenticatedTenantId: null, CancellationToken.None);

        row.Should().BeNull();
        correlations.Verify(
            c => c.TryGetByExternalKeyAsync("Jira", "KEY-1", It.IsAny<CancellationToken>()),
            Times.Once);
        correlations.Verify(
            c => c.TryGetByExternalKeyForTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public void CreateReplayIgnoredAudit_includes_issue_key_in_detail_for_synthetic_replay_ids()
    {
        ItsmInboundWebhookSyncSupport sut = new(
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<IItsmInboundWebhookReplayGuard>());

        AuditEvent audit = sut.CreateReplayIgnoredAudit(
            "jira-webhook",
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            "Jira:KEY-1:Done",
            new { issueKey = "KEY-1", statusName = "Done" });

        using JsonDocument document = JsonDocument.Parse(audit.DataJson!);
        document.RootElement.GetProperty("replayEventId").GetString().Should().Be("Jira:KEY-1:Done");
        document.RootElement.GetProperty("detail").GetProperty("issueKey").GetString().Should().Be("KEY-1");
    }
}
