using System.Text.Json;

using ArchLucid.Application.Governance.Workflow.Stages;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernanceWorkflowIntegrationEventSupportTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task TryPublishApprovalSubmittedAsync_includes_requested_by_actor_key_in_payload()
    {
        ReadOnlyMemory<byte> capturedPayload = default;
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(p =>
                p.PublishAsync(
                    It.IsAny<string>(),
                    It.IsAny<ReadOnlyMemory<byte>>(),
                    It.IsAny<string?>(),
                    It.IsAny<IReadOnlyDictionary<string, object>?>(),
                    It.IsAny<CancellationToken>()))
            .Callback((
                string _,
                ReadOnlyMemory<byte> payload,
                string? _,
                IReadOnlyDictionary<string, object>? _,
                CancellationToken _) => capturedPayload = payload)
            .Returns(Task.CompletedTask);

        GovernanceWorkflowIntegrationEventSupport support = CreateSupport(publisher.Object);
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        GovernanceApprovalRequest request = new()
        {
            ApprovalRequestId = "approval-1",
            RunId = "run-without-manifest-hash",
            ManifestVersion = "1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
            RequestedBy = displayName,
            RequestedByActorKey = actorKey,
        };

        await support.TryPublishApprovalSubmittedAsync(request, CancellationToken.None);

        capturedPayload.IsEmpty.Should().BeFalse();
        using JsonDocument document = JsonDocument.Parse(capturedPayload.ToArray());
        JsonElement root = document.RootElement;
        root.GetProperty("requestedBy").GetString().Should().Be(displayName);
        root.GetProperty("requestedByActorKey").GetString().Should().Be(actorKey);
    }

    [Fact]
    public async Task TryPublishPromotionActivatedAsync_includes_activated_by_actor_key_in_payload()
    {
        ReadOnlyMemory<byte> capturedPayload = default;
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(p =>
                p.PublishAsync(
                    It.IsAny<string>(),
                    It.IsAny<ReadOnlyMemory<byte>>(),
                    It.IsAny<string?>(),
                    It.IsAny<IReadOnlyDictionary<string, object>?>(),
                    It.IsAny<CancellationToken>()))
            .Callback((
                string _,
                ReadOnlyMemory<byte> payload,
                string? _,
                IReadOnlyDictionary<string, object>? _,
                CancellationToken _) => capturedPayload = payload)
            .Returns(Task.CompletedTask);

        GovernanceWorkflowIntegrationEventSupport support = CreateSupport(publisher.Object);
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
        GovernanceEnvironmentActivation activation = new()
        {
            ActivationId = "activation-1",
            RunId = "run-without-manifest-hash",
            ManifestVersion = "1",
            Environment = "prod",
            ActivatedUtc = TimeProvider.System.UtcNowDateTime(),
        };

        await support.TryPublishPromotionActivatedAsync(
            activation,
            displayName,
            actorKey,
            null,
            null,
            CancellationToken.None);

        capturedPayload.IsEmpty.Should().BeFalse();
        using JsonDocument document = JsonDocument.Parse(capturedPayload.ToArray());
        JsonElement root = document.RootElement;
        root.GetProperty("activatedBy").GetString().Should().Be(displayName);
        root.GetProperty("activatedByActorKey").GetString().Should().Be(actorKey);
    }

    [Fact]
    public async Task TryPublishApprovalRejectedAsync_includes_reviewed_by_actor_key_in_payload()
    {
        ReadOnlyMemory<byte> capturedPayload = default;
        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(p =>
                p.PublishAsync(
                    It.IsAny<string>(),
                    It.IsAny<ReadOnlyMemory<byte>>(),
                    It.IsAny<string?>(),
                    It.IsAny<IReadOnlyDictionary<string, object>?>(),
                    It.IsAny<CancellationToken>()))
            .Callback((
                string _,
                ReadOnlyMemory<byte> payload,
                string? _,
                IReadOnlyDictionary<string, object>? _,
                CancellationToken _) => capturedPayload = payload)
            .Returns(Task.CompletedTask);

        GovernanceWorkflowIntegrationEventSupport support = CreateSupport(publisher.Object);
        GovernanceApprovalRequest request = new()
        {
            ApprovalRequestId = "approval-1",
            RunId = "run-without-manifest-hash",
            ManifestVersion = "1",
            SourceEnvironment = "dev",
            TargetEnvironment = "test",
        };
        const string displayName = "Pat Operator";
        const string actorKey = "jwt:11111111-2222-3333-4444-555555555555:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

        await support.TryPublishApprovalRejectedAsync(
            request,
            displayName,
            actorKey,
            TimeProvider.System.UtcNowDateTime(),
            "needs more evidence",
            CancellationToken.None);

        capturedPayload.IsEmpty.Should().BeFalse();
        using JsonDocument document = JsonDocument.Parse(capturedPayload.ToArray());
        JsonElement root = document.RootElement;
        root.GetProperty("reviewedBy").GetString().Should().Be(displayName);
        root.GetProperty("reviewedByActorKey").GetString().Should().Be(actorKey);
    }

    private static GovernanceWorkflowIntegrationEventSupport CreateSupport(IIntegrationEventPublisher publisher)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        IOptionsMonitor<IntegrationEventsOptions> options = Mock.Of<IOptionsMonitor<IntegrationEventsOptions>>();
        Mock.Get(options)
            .Setup(o => o.CurrentValue)
            .Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = false });

        return new GovernanceWorkflowIntegrationEventSupport(
            scopeProvider.Object,
            Mock.Of<IIntegrationEventOutboxRepository>(),
            publisher,
            options,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            NullLogger<GovernanceWorkflowIntegrationEventSupport>.Instance);
    }
}
