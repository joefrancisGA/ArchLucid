using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Common;
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
public sealed class SettingsControllerModelGovernanceCatalogTests
{
    [Fact]
    public async Task GetModelGovernanceCatalog_returns_registry_and_profile_mappings()
    {
        Mock<IWorkspaceModelExecutionProfileService> profileService = new();
        Mock<IAgentModelAliasRegistry> aliasRegistry = new();

        profileService
            .Setup(s => s.GetAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new WorkspaceModelExecutionProfileSnapshot(
                    AgentModelExecutionProfile.Balanced,
                    WorkspaceModelExecutionProfileSource.WorkspaceDefault));

        aliasRegistry
            .Setup(r => r.ListEntries())
            .Returns(
            [
                new AgentModelAliasRegistryEntry
                {
                    AliasId = "balanced-default",
                    ProviderConnectionKind = "ArchLucidManaged",
                    DeploymentName = "gpt-4o",
                    CapabilityTags = ["structured-output"],
                    ApprovedTaskTypes = ["Topology"]
                }
            ]);

        aliasRegistry
            .Setup(r => r.ResolveAliasIdForTier(LlmModelTier.Standard))
            .Returns("balanced-default");

        aliasRegistry
            .Setup(r => r.ResolveAliasIdForTier(LlmModelTier.Economy))
            .Returns("economy-default");

        aliasRegistry
            .Setup(r => r.ResolveAliasIdForTier(LlmModelTier.Premium))
            .Returns("premium-default");

        SettingsController controller = new(
            Mock.Of<ITenantAgentOutputQualityGateModeService>(),
            profileService.Object,
            Mock.Of<IWorkspaceAllowedEngineSetService>(),
            Mock.Of<IExternalSubprocessorEngineAcknowledgmentService>(),
            aliasRegistry.Object,
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IAuditRepository>(),
            TimeProvider.System);

        ActionResult<ModelGovernanceCatalogResponse> result =
            await controller.GetModelGovernanceCatalog(CancellationToken.None);

        ModelGovernanceCatalogResponse response = result.Result.Should().BeOfType<OkObjectResult>().Subject
            .Value.Should().BeOfType<ModelGovernanceCatalogResponse>().Subject;

        response.WorkspaceProfile.EffectiveProfile.Should().Be(nameof(AgentModelExecutionProfile.Balanced));
        response.RegistryEntries.Should().ContainSingle(e => e.AliasId == "balanced-default");
        response.ProfileMappings.Should().HaveCount(3);
    }
}
