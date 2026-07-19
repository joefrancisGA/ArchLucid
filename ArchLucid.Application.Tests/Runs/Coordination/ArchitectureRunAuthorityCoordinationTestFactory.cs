using ArchLucid.Application.Agents;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Tests.Orchestration;
using ArchLucid.Application.Tests.TestDoubles;
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
            auditService ?? Mock.Of<IAuditService>(),
            NullLogger<ArchitectureRunAuthorityCoordination>.Instance);
    }

    private static IModelExecutionProfileResolver CreateDefaultProfileResolver(IScopeContextProvider scopeContextProvider) =>
        new ModelExecutionProfileResolver(
            new WorkspaceModelExecutionProfileService(
                scopeContextProvider,
                new InMemoryTenantSettingsRepository()));
}
