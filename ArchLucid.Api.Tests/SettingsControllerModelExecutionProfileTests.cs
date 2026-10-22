using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Common;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

using System.Security.Claims;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
public sealed class SettingsControllerModelExecutionProfileTests
{
    [Fact]
    public async Task PutModelExecutionProfile_sets_explicit_actor_for_stable_actor_user_id_when_display_differs()
    {
        Mock<IWorkspaceModelExecutionProfileService> profileService = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActorId()).Returns("jwt:tenant:operator-oid");

        profileService
            .Setup(s => s.GetAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new WorkspaceModelExecutionProfileSnapshot(
                    AgentModelExecutionProfile.Balanced,
                    WorkspaceModelExecutionProfileSource.WorkspaceDefault));

        profileService
            .Setup(s => s.SetAsync(AgentModelExecutionProfile.HighAssurance, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new WorkspaceModelExecutionProfileSnapshot(
                    AgentModelExecutionProfile.HighAssurance,
                    WorkspaceModelExecutionProfileSource.TenantOverride));

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext
            {
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid()
            });

        AuditEvent? captured = null;
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(s => s.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        SettingsController controller = CreateController(
            profileService.Object,
            scopeProvider.Object,
            auditService.Object,
            Mock.Of<IAuditRepository>(),
            actorContext.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(
                    new ClaimsIdentity(
                        [new Claim(ClaimTypes.Name, "Operator Display")],
                        "test")),
            },
        };

        await controller.PutModelExecutionProfile(
            new WorkspaceModelExecutionProfileUpdateRequest { Profile = "HighAssurance" },
            CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.ExplicitActor.Should().BeTrue();
        captured.ActorUserId.Should().Be("jwt:tenant:operator-oid");
        captured.ActorUserName.Should().Be("Operator Display");
    }

    [Fact]
    public async Task PutModelExecutionProfile_persists_profile_and_audits_change()
    {
        Mock<IWorkspaceModelExecutionProfileService> profileService = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IAuditService> auditService = new();
        Mock<IAuditRepository> auditRepository = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        DateTime changedAt = new(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc);

        profileService
            .Setup(s => s.GetAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new WorkspaceModelExecutionProfileSnapshot(
                    AgentModelExecutionProfile.Balanced,
                    WorkspaceModelExecutionProfileSource.WorkspaceDefault));

        profileService
            .Setup(s => s.SetAsync(AgentModelExecutionProfile.HighAssurance, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new WorkspaceModelExecutionProfileSnapshot(
                    AgentModelExecutionProfile.HighAssurance,
                    WorkspaceModelExecutionProfileSource.TenantOverride));

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId
            });

        auditRepository
            .Setup(r => r.GetFilteredAsync(
                tenantId,
                workspaceId,
                projectId,
                It.Is<AuditEventFilter>(f => f.EventType == AuditEventTypes.WorkspaceModelExecutionProfileUpdated),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AuditEvent
                {
                    EventType = AuditEventTypes.WorkspaceModelExecutionProfileUpdated,
                    OccurredUtc = changedAt,
                    ActorUserId = "admin",
                    ActorUserName = "admin@example.com",
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId
                }
            ]);

        auditRepository
            .Setup(r => r.GetFilteredAsync(
                tenantId,
                workspaceId,
                projectId,
                It.Is<AuditEventFilter>(f => f.EventType == AuditEventTypes.WorkspaceModelExecutionProfileOverrideCleared),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        SettingsController controller = CreateController(
            profileService.Object,
            scopeProvider.Object,
            auditService.Object,
            auditRepository.Object);

        IActionResult result = await controller.PutModelExecutionProfile(
            new WorkspaceModelExecutionProfileUpdateRequest { Profile = "HighAssurance" },
            CancellationToken.None);

        WorkspaceModelExecutionProfileResponse response = result.Should().BeOfType<OkObjectResult>().Subject
            .Value.Should().BeOfType<WorkspaceModelExecutionProfileResponse>().Subject;

        response.EffectiveProfile.Should().Be(nameof(AgentModelExecutionProfile.HighAssurance));
        response.WorkspaceDefaultProfile.Should().Be(nameof(AgentModelExecutionProfile.Balanced));
        response.LastChangedAtUtc.Should().Be(changedAt);
        response.LastChangedBy.Should().Be("admin@example.com");

        auditService.Verify(
            s => s.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.WorkspaceModelExecutionProfileUpdated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetModelExecutionProfile_resolves_workspace_default_from_service_and_last_changed_from_audit()
    {
        Mock<IWorkspaceModelExecutionProfileService> profileService = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        Mock<IAuditRepository> auditRepository = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        DateTime changedAt = new(2026, 1, 15, 12, 0, 0, DateTimeKind.Utc);

        profileService
            .Setup(s => s.GetAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new WorkspaceModelExecutionProfileSnapshot(
                    AgentModelExecutionProfile.Balanced,
                    WorkspaceModelExecutionProfileSource.WorkspaceDefault));

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId
            });

        auditRepository
            .Setup(r => r.GetFilteredAsync(
                tenantId,
                workspaceId,
                projectId,
                It.Is<AuditEventFilter>(f => f.EventType == AuditEventTypes.WorkspaceModelExecutionProfileUpdated),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AuditEvent
                {
                    EventType = AuditEventTypes.WorkspaceModelExecutionProfileUpdated,
                    OccurredUtc = changedAt,
                    ActorUserId = "admin",
                    ActorUserName = "admin@example.com",
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId
                }
            ]);

        auditRepository
            .Setup(r => r.GetFilteredAsync(
                tenantId,
                workspaceId,
                projectId,
                It.Is<AuditEventFilter>(f => f.EventType == AuditEventTypes.WorkspaceModelExecutionProfileOverrideCleared),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        SettingsController controller = CreateController(
            profileService.Object,
            scopeProvider.Object,
            Mock.Of<IAuditService>(),
            auditRepository.Object);

        ActionResult<WorkspaceModelExecutionProfileResponse> result =
            await controller.GetModelExecutionProfile(CancellationToken.None);

        WorkspaceModelExecutionProfileResponse response = result.Result.Should().BeOfType<OkObjectResult>().Subject
            .Value.Should().BeOfType<WorkspaceModelExecutionProfileResponse>().Subject;

        response.WorkspaceDefaultProfile.Should().Be(nameof(AgentModelExecutionProfile.Balanced));
        response.LastChangedAtUtc.Should().Be(changedAt);
        response.LastChangedBy.Should().Be("admin@example.com");
    }

    private static SettingsController CreateController(
        IWorkspaceModelExecutionProfileService profileService,
        IScopeContextProvider scopeProvider,
        IAuditService auditService,
        IAuditRepository auditRepository,
        IActorContext? actorContext = null) =>
        new(
            Mock.Of<ITenantAgentOutputQualityGateModeService>(),
            Mock.Of<ITenantFindingEngineControlsService>(),
            Mock.Of<ITenantWorkOwnershipDeletePolicyService>(),
            profileService,
            Mock.Of<IWorkspaceAllowedEngineSetService>(),
            Mock.Of<IExternalSubprocessorEngineAcknowledgmentService>(),
            Mock.Of<IAgentModelAliasRegistry>(),
            scopeProvider,
            actorContext ?? Mock.Of<IActorContext>(),
            auditService,
            auditRepository,
            TimeProvider.System);
}
