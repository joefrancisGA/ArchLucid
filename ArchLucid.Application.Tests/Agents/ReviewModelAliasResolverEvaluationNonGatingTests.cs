using ArchLucid.Application.Agents;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Agents;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class ReviewModelAliasResolverEvaluationNonGatingTests
{
    [Fact]
    public async Task ResolveForRunCreateAsync_DoesNotRejectAliasWhenEvaluationStateIsFailed()
    {
        FailedEvaluationAliasRegistry aliasRegistry = new();
        Mock<IWorkspaceAllowedEngineSetService> allowedSetService = new();

        WorkspaceAllowedEngineSetSnapshot allowedSet = new(
            ["premium-assurance"],
            "economy-general",
            WorkspaceAllowedEngineSetSource.CatalogDefault);

        allowedSetService.Setup(service => service.GetAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(allowedSet);
        allowedSetService.Setup(service => service.IsAliasAllowed(allowedSet, "premium-assurance"))
            .Returns(true);

        ReviewModelAliasResolver resolver = new(
            allowedSetService.Object,
            aliasRegistry,
            new PermissiveExternalSubprocessorAcknowledgmentService());

        ArchitectureRequest request = new()
        {
            RequestId = "req-1",
            SystemName = "Sys",
            Description = "Desc",
            ModelAliasOverride = "premium-assurance"
        };

        ReviewModelAliasResolution resolution =
            await resolver.ResolveForRunCreateAsync(request, CancellationToken.None);

        resolution.EffectiveAliasId.Should().Be("premium-assurance");
        resolution.RejectedOutsideAllowedSet.Should().BeFalse();
    }

    private sealed class FailedEvaluationAliasRegistry : IAgentModelAliasRegistry
    {
        public IReadOnlyCollection<AgentModelAliasRegistryEntry> ListEntries() =>
            [CreateEntry("premium-assurance")];

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
                DeploymentName = "gpt-4o",
                CapabilityTags = [],
                ApprovedTaskTypes = ["Topology"],
                TaskEvaluations =
                [
                    new AgentModelCatalogEvaluationRow
                    {
                        TaskType = "Topology",
                        EvaluationState = AgentModelEvaluationStateKind.Failed
                    }
                ]
            };
    }

    private sealed class PermissiveExternalSubprocessorAcknowledgmentService
        : IExternalSubprocessorEngineAcknowledgmentService
    {
        public Task<bool> HasWorkspaceAcknowledgmentAsync(CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task RecordWorkspaceAcknowledgmentAsync(string actorUserId, CancellationToken cancellationToken) =>
            Task.CompletedTask;
    }
}
