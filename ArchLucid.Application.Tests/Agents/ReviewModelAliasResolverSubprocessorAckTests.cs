using ArchLucid.Application.Agents;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Agents;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class ReviewModelAliasResolverSubprocessorAckTests
{
    [Fact]
    public async Task ResolveForRunCreateAsync_WhenExternalSubprocessorAckMissing_DoesNotRejectOutsideAllowedSet()
    {
        Mock<IWorkspaceAllowedEngineSetService> allowedSetService = new();
        WorkspaceAllowedEngineSetSnapshot allowedSet = new(
            ["external-premium"],
            "economy-general",
            WorkspaceAllowedEngineSetSource.CatalogDefault);

        allowedSetService.Setup(service => service.GetAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(allowedSet);
        allowedSetService.Setup(service => service.IsAliasAllowed(allowedSet, "external-premium"))
            .Returns(true);

        ExternalSubprocessorAliasRegistry aliasRegistry = new();
        DenyingExternalSubprocessorAcknowledgmentService acknowledgmentService = new();

        ReviewModelAliasResolver resolver = new(
            allowedSetService.Object,
            aliasRegistry,
            acknowledgmentService);

        ArchitectureRequest request = new()
        {
            RequestId = "req-1",
            SystemName = "Sys",
            Description = "Desc",
            ModelAliasOverride = "external-premium",
        };

        ReviewModelAliasResolution resolution =
            await resolver.ResolveForRunCreateAsync(request, CancellationToken.None);

        resolution.RejectedOutsideAllowedSet.Should().BeFalse();
        resolution.RejectedMissingSubprocessorAcknowledgment.Should().BeTrue();
        resolution.EffectiveAliasId.Should().Be("economy-general");
    }

    private sealed class ExternalSubprocessorAliasRegistry : IAgentModelAliasRegistry
    {
        public IReadOnlyCollection<AgentModelAliasRegistryEntry> ListEntries() =>
            [CreateEntry("external-premium")];

        public AgentModelAliasRegistryEntry GetRequired(string aliasId) => CreateEntry(aliasId);

        public bool TryGet(string aliasId, out AgentModelAliasRegistryEntry? entry)
        {
            entry = CreateEntry(aliasId);
            return true;
        }

        public string ResolveAliasIdForTier(Contracts.Common.LlmModelTier tier) => AgentModelAliasIds.StandardGeneral;

        private static AgentModelAliasRegistryEntry CreateEntry(string aliasId) =>
            new()
            {
                AliasId = aliasId,
                ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
                DeploymentName = "external-model",
                CapabilityTags = [],
                ApprovedTaskTypes = ["Topology"],
                DataBoundary = AgentModelDataBoundaryKind.ExternalSubprocessor,
            };
    }

    private sealed class DenyingExternalSubprocessorAcknowledgmentService
        : IExternalSubprocessorEngineAcknowledgmentService
    {
        public Task<bool> HasWorkspaceAcknowledgmentAsync(CancellationToken cancellationToken) =>
            Task.FromResult(false);

        public Task RecordWorkspaceAcknowledgmentAsync(string actorUserId, CancellationToken cancellationToken) =>
            Task.CompletedTask;
    }
}
