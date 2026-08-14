using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
public sealed class SettingsControllerModelExecutionProfileTests
{
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
        IAuditRepository auditRepository) =>
        new(
            Mock.Of<ITenantAgentOutputQualityGateModeService>(),
            profileService,
            Mock.Of<IAgentModelAliasRegistry>(),
            scopeProvider,
            auditService,
            auditRepository);
}
