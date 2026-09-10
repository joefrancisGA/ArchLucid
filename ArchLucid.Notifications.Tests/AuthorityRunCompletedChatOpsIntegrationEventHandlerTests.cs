using System.Net;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.Integration;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Notifications.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AuthorityRunCompletedChatOpsIntegrationEventHandlerTests
{
    [Fact]
    public async Task HandleAsync_deserializes_payload_and_notifies_chatops_hook()
    {
        Mock<IAuthorityRunCommittedChatOpsHook> hook = new();
        AuthorityRunCommittedChatOpsNotice? captured = null;

        hook.Setup(h => h.NotifyAsync(It.IsAny<AuthorityRunCommittedChatOpsNotice>(), It.IsAny<CancellationToken>()))
            .Callback<AuthorityRunCommittedChatOpsNotice, CancellationToken>((notice, _) => captured = notice)
            .Returns(Task.CompletedTask);

        AuthorityRunCompletedChatOpsIntegrationEventHandler sut = new(hook.Object);

        sut.EventType.Should().Be(IntegrationEventTypes.AuthorityRunCompletedV1);

        Guid runId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        byte[] payload = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(new
            {
                schemaVersion = 1,
                runId,
                manifestId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
                tenantId = Guid.Parse("22222222-3333-4444-5555-666666666666"),
                workspaceId = Guid.Parse("33333333-4444-5555-6666-777777777777"),
                projectId = Guid.Parse("44444444-5555-6666-7777-888888888888"),
                previousRunId = (Guid?)null,
                description = "Pilot run",
                findings = new[]
                {
                    new { findingId = "f-1", deepLinkUrl = "https://example.test/runs/x", severity = "High" },
                },
            }));

        await sut.HandleAsync(payload, CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.RunId.Should().Be(runId);
        captured.FindingCount.Should().Be(1);
        captured.Description.Should().Be("Pilot run");

        hook.Verify(
            h => h.NotifyAsync(It.IsAny<AuthorityRunCommittedChatOpsNotice>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAsync_propagates_when_hook_reports_all_enabled_targets_failed()
    {
        Mock<IAuthorityRunCommittedChatOpsHook> hook = new();
        hook.Setup(h => h.NotifyAsync(It.IsAny<AuthorityRunCommittedChatOpsNotice>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("ChatOps webhook delivery failed for all enabled targets."));

        AuthorityRunCompletedChatOpsIntegrationEventHandler sut = new(hook.Object);

        byte[] payload = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(new
            {
                schemaVersion = 1,
                runId = Guid.NewGuid(),
                manifestId = Guid.NewGuid(),
                tenantId = Guid.NewGuid(),
                workspaceId = Guid.NewGuid(),
                projectId = Guid.NewGuid(),
            }));

        Func<Task> act = async () => await sut.HandleAsync(payload, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task HandleAsync_accepts_future_schemaVersion_without_rejecting_payload()
    {
        Mock<IAuthorityRunCommittedChatOpsHook> hook = new();
        hook.Setup(h => h.NotifyAsync(It.IsAny<AuthorityRunCommittedChatOpsNotice>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        AuthorityRunCompletedChatOpsIntegrationEventHandler sut = new(hook.Object);

        byte[] payload = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(new
            {
                schemaVersion = 2,
                runId = Guid.NewGuid(),
                manifestId = Guid.NewGuid(),
                tenantId = Guid.NewGuid(),
                workspaceId = Guid.NewGuid(),
                projectId = Guid.NewGuid(),
            }));

        Func<Task> act = async () => await sut.HandleAsync(payload, CancellationToken.None);

        await act.Should().NotThrowAsync();

        hook.Verify(
            h => h.NotifyAsync(It.IsAny<AuthorityRunCommittedChatOpsNotice>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAsync_completes_when_enabled_target_uses_non_https_webhook_url()
    {
        Mock<IChatOpsWebhookDeliveryService> delivery = new();

        ChatOpsIncomingWebhooksOptions opts = new()
        {
            SlackNotifyOnAuthorityRunCompleted = true,
            SlackIncomingWebhookAbsoluteUri = "http://insecure.example/hook",
        };

        Mock<IOptionsMonitor<ChatOpsIncomingWebhooksOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(opts);

        AuthorityRunCommittedChatOpsHook hook = new(
            delivery.Object,
            optionsMonitor.Object,
            Mock.Of<ILogger<AuthorityRunCommittedChatOpsHook>>());

        AuthorityRunCompletedChatOpsIntegrationEventHandler sut = new(hook);

        byte[] payload = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(new
            {
                schemaVersion = 1,
                runId = Guid.NewGuid(),
                manifestId = Guid.NewGuid(),
                tenantId = Guid.NewGuid(),
                workspaceId = Guid.NewGuid(),
                projectId = Guid.NewGuid(),
            }));

        Func<Task> act = async () => await sut.HandleAsync(payload, CancellationToken.None);

        await act.Should().NotThrowAsync(
            "misconfigured non-HTTPS webhook URLs are skipped before delivery; integration events complete without retry");

        delivery.Verify(
            d => d.DeliverAsync(
                It.IsAny<ChatOpsWebhookTarget>(),
                It.IsAny<string>(),
                It.IsAny<ChatOpsWebhookMessage>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<WebhookPostOptions?>()),
            Times.Never);
    }
}
