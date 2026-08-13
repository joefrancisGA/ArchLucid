using ArchLucid.Application.Agents;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Tests.Orchestration;
using ArchLucid.Application.Tests.TestDoubles;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Coordination;

internal static class ArchitectureRunAuthorityCoordinationTestFactory
{
    internal static ArchitectureRunAuthorityCoordination Create(
        IAuthorityRunOrchestrator authorityRunOrchestrator,
        IRunRepository runRepository,
        IScopeContextProvider scopeContextProvider,
        IAzureExtractorPackageRepository? azureExtractorPackageRepository = null,
        InMemoryTechnologyLedgerRepository? ledgerRepository = null,
        IModelExecutionProfileResolver? modelExecutionProfileResolver = null,
        IAuditService? auditService = null)
    {
        InMemoryTechnologyLedgerRepository ledger = ledgerRepository ?? new InMemoryTechnologyLedgerRepository();

        IModelExecutionProfileResolver resolver = modelExecutionProfileResolver
            ?? CreateDefaultProfileResolver(scopeContextProvider);

        return new ArchitectureRunAuthorityCoordination(
            authorityRunOrchestrator,
            runRepository,
            scopeContextProvider,
            azureExtractorPackageRepository ?? new NoOpAzureExtractorPackageRepository(),
            ledger,
            TechnologyLedgerSeederTestDoubles.CreateRequestSeeder(ledger),
            TechnologyLedgerSeederTestDoubles.CreateEvidenceSeeder(ledger, scopeContextProvider),
            new RunStateTransitionService(),
            resolver,
            CreateDefaultAliasResolver(scopeContextProvider),
            new ConfigAgentModelAliasRegistryStub(),
            auditService ?? Mock.Of<IAuditService>(),
            NullLogger<ArchitectureRunAuthorityCoordination>.Instance);
    }

    private static IReviewModelAliasResolver CreateDefaultAliasResolver(IScopeContextProvider scopeContextProvider) =>
        new ReviewModelAliasResolver(
            new WorkspaceAllowedEngineSetService(
                scopeContextProvider,
                new InMemoryTenantSettingsRepository(),
                new ConfigAgentModelAliasRegistryStub()),
            new ConfigAgentModelAliasRegistryStub(),
            new NoOpExternalSubprocessorEngineAcknowledgmentService());

    private sealed class ConfigAgentModelAliasRegistryStub : IAgentModelAliasRegistry
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
                ApprovedTaskTypes = [],
                StructuredOutputLevel = AgentModelStructuredOutputLevel.StrictJsonSchema
            };
    }

    private sealed class NoOpExternalSubprocessorEngineAcknowledgmentService
        : IExternalSubprocessorEngineAcknowledgmentService
    {
        public Task<bool> HasWorkspaceAcknowledgmentAsync(CancellationToken cancellationToken) =>
            Task.FromResult(true);

        public Task RecordWorkspaceAcknowledgmentAsync(string actorUserId, CancellationToken cancellationToken) =>
            Task.CompletedTask;
    }

    private static IModelExecutionProfileResolver CreateDefaultProfileResolver(IScopeContextProvider scopeContextProvider) =>
        new ModelExecutionProfileResolver(
            new WorkspaceModelExecutionProfileService(
                scopeContextProvider,
                new InMemoryTenantSettingsRepository()));
}
