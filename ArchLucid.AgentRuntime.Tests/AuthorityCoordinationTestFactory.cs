using ArchLucid.Application.Agents;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tenancy;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

internal static class AuthorityCoordinationTestFactory
{
    internal static ArchitectureRunAuthorityCoordination Create(
        IAuthorityRunOrchestrator authorityRunOrchestrator,
        IRunRepository runRepository,
        IScopeContextProvider scopeContextProvider,
        IAzureExtractorPackageRepository? azureExtractorPackageRepository = null)
    {
        InMemoryTechnologyLedgerRepository ledgerRepository = new();

        return new ArchitectureRunAuthorityCoordination(
            authorityRunOrchestrator,
            runRepository,
            scopeContextProvider,
            azureExtractorPackageRepository ?? new NoOpAzureExtractorPackageRepository(),
            ledgerRepository,
            new TechnologyLedgerRequestSeeder(ledgerRepository, TimeProvider.System),
            new TechnologyLedgerEvidenceSeeder(
                ledgerRepository,
                scopeContextProvider,
                Mock.Of<IAzureExtractorPackageRepository>(),
                Mock.Of<ICloudInventoryExtractorPackageRepository>(),
                new InfrastructureDeclarationsPayloadNormalizer([]),
                TimeProvider.System),
            new RunStateTransitionService(),
            new ModelExecutionProfileResolver(
                new WorkspaceModelExecutionProfileService(
                    scopeContextProvider,
                    new InMemoryTenantSettingsRepository())),
            new ReviewModelAliasResolver(
                new WorkspaceAllowedEngineSetService(
                    scopeContextProvider,
                    new InMemoryTenantSettingsRepository(),
                    new StubAgentModelAliasRegistry()),
                new StubAgentModelAliasRegistry(),
                new StubExternalSubprocessorEngineAcknowledgmentService()),
            Mock.Of<IAuditService>(),
            NullLogger<ArchitectureRunAuthorityCoordination>.Instance);
    }

    private sealed class StubAgentModelAliasRegistry : IAgentModelAliasRegistry
    {
        public IReadOnlyCollection<AgentModelAliasRegistryEntry> ListEntries() =>
            [CreateEntry(AgentModelAliasIds.StandardGeneral)];

        public AgentModelAliasRegistryEntry GetRequired(string aliasId) => CreateEntry(aliasId);

        public bool TryGet(string aliasId, out AgentModelAliasRegistryEntry? entry)
        {
            entry = CreateEntry(aliasId);
            return true;
        }

        public string ResolveAliasIdForTier(LlmModelTier tier) =>
            tier switch
            {
                LlmModelTier.Economy => AgentModelAliasIds.EconomyGeneral,
                LlmModelTier.Premium => AgentModelAliasIds.PremiumAssurance,
                _ => AgentModelAliasIds.StandardGeneral
            };

        private static AgentModelAliasRegistryEntry CreateEntry(string aliasId) =>
            new()
            {
                AliasId = aliasId,
                ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
                DeploymentName = "deploy",
                CapabilityTags = [],
                ApprovedTaskTypes = []
            };
    }

    private sealed class StubExternalSubprocessorEngineAcknowledgmentService
        : IExternalSubprocessorEngineAcknowledgmentService
    {
        public Task<bool> HasWorkspaceAcknowledgmentAsync(CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task RecordWorkspaceAcknowledgmentAsync(string actorUserId, CancellationToken cancellationToken) =>
            Task.CompletedTask;
    }
}
