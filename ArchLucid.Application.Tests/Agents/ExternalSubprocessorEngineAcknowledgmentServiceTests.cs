using ArchLucid.Application.Agents;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class ExternalSubprocessorEngineAcknowledgmentServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };

    [Fact]
    public async Task HasWorkspaceAcknowledgmentAsync_returns_true_when_stored_value_has_surrounding_whitespace()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<ITenantSettingsRepository> tenantSettings = new();
        tenantSettings
            .Setup(r => r.TryGetAsync(
                Scope.TenantId,
                TenantSettingKeys.ExternalSubprocessorEngineAcknowledged,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(" Acknowledged ");

        ExternalSubprocessorEngineAcknowledgmentService sut = new(
            scopeProvider.Object,
            new Mock<IActorContext>().Object,
            new Mock<IAuditService>().Object,
            tenantSettings.Object);

        bool acknowledged = await sut.HasWorkspaceAcknowledgmentAsync(CancellationToken.None);

        acknowledged.Should().BeTrue();
    }

    [Fact]
    public async Task RecordWorkspaceAcknowledgmentAsync_sets_explicit_actor_for_stable_actor_user_id_when_display_differs()
    {
        const string actorKey = "jwt:tenant:operator-oid";
        const string actorDisplay = "Operator Display";
        AuditEvent? captured = null;

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActorId()).Returns(actorKey);
        actorContext.Setup(a => a.GetActor()).Returns(actorDisplay);

        Mock<ITenantSettingsRepository> tenantSettings = new();
        tenantSettings
            .Setup(r => r.UpsertAsync(
                Scope.TenantId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => captured = evt)
            .Returns(Task.CompletedTask);

        ExternalSubprocessorEngineAcknowledgmentService sut = new(
            scopeProvider.Object,
            actorContext.Object,
            auditService.Object,
            tenantSettings.Object);

        await sut.RecordWorkspaceAcknowledgmentAsync(CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.ExplicitActor.Should().BeTrue();
        captured.ActorUserId.Should().Be(actorKey);
        captured.ActorUserName.Should().Be(actorDisplay);
    }
}
