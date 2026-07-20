using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Scoping;

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
        Guid tenantId = Guid.NewGuid();

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
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid()
            });

        SettingsController controller = new(
            Mock.Of<ITenantAgentOutputQualityGateModeService>(),
            profileService.Object,
            Mock.Of<IAgentModelAliasRegistry>(),
            scopeProvider.Object,
            auditService.Object);

        IActionResult result = await controller.PutModelExecutionProfile(
            new WorkspaceModelExecutionProfileUpdateRequest { Profile = "HighAssurance" },
            CancellationToken.None);

        WorkspaceModelExecutionProfileResponse response = result.Should().BeOfType<OkObjectResult>().Subject
            .Value.Should().BeOfType<WorkspaceModelExecutionProfileResponse>().Subject;

        response.EffectiveProfile.Should().Be(nameof(AgentModelExecutionProfile.HighAssurance));

        auditService.Verify(
            s => s.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.WorkspaceModelExecutionProfileUpdated),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
